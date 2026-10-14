/**
 * Promote-path wiring (Wave 8 ticket 08-01): the only `pic-web` module besides `composition-root.ts`
 * allowed to import `pic-adapter-supabase`. Assembles `GuestSnapshot` from guest storage, constructs an
 * authenticated `SupabaseRepository`, and swaps the `DelegatingRepositoryPort` provider before
 * `SessionEngine.promote()` so `promoteGuestToAccount` targets Supabase (Ticket 13) instead of
 * `GuestRepositoryCannotPromoteError`.
 */
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { SupabaseRepository } from "pic-adapter-supabase";
import type {
  FinalizedSymptomGroup,
  GuestSnapshot,
  PromotionStatus,
  RepositoryPort,
  SymptomGroup,
} from "pic-engine";
import type { DelegatingRepositoryPort } from "pic-engine";
import type { LocalGuestRepository } from "pic-adapter-local-guest";

export interface SupabasePublicConfig {
  url: string;
  anonKey: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export function readSupabasePublicConfigFromEnv(
  env: Record<string, string | undefined>,
): SupabasePublicConfig | null {
  const url = env.SUPABASE_URL ?? env.VITE_SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY ?? env.VITE_SUPABASE_ANON_KEY;
  if (url === undefined || anonKey === undefined || url === "" || anonKey === "") {
    return null;
  }
  return { url, anonKey };
}

export function createSupabaseBrowserClient(config: SupabasePublicConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function createSupabaseRepositoryFromClient(client: SupabaseClient): SupabaseRepository {
  return new SupabaseRepository(client);
}

/** Only a server-verified, email-confirmed Auth user can own a promotion. */
export async function getVerifiedUser(client: SupabaseClient): Promise<User> {
  const { data, error } = await client.auth.getUser();
  if (error !== null || data.user === null || !data.user.email_confirmed_at) {
    throw new Error("Verified sign-in is required");
  }
  return data.user;
}

export async function signInWithCredentials(client: SupabaseClient, credentials: LoginCredentials) {
  const { error } = await client.auth.signInWithPassword(credentials);
  if (error !== null) throw new Error("Sign-in could not be completed");
  const user = await getVerifiedUser(client);
  return { userId: user.id, client, repository: createSupabaseRepositoryFromClient(client) };
}

/** Own-row identity bootstrap only. Existing display data and preferences are never overwritten. */
export async function ensureOwnProfile(client: SupabaseClient, user: User): Promise<void> {
  const read = () => client.from("profiles").select("id").eq("id", user.id).maybeSingle();
  const existing = await read();
  if (existing.error !== null) throw new Error("Profile could not be read");
  if (existing.data !== null) return;
  const name: unknown = user.user_metadata.full_name;
  const inserted = await client.from("profiles").insert({
    id: user.id, full_name: typeof name === "string" ? name.trim() : null,
  });
  // A concurrent creator can win the insert. Re-read through own-row RLS before treating it as success.
  const confirmed = await read();
  if (confirmed.error !== null || confirmed.data === null) {
    throw new Error(inserted.error === null ? "Profile could not be confirmed" : "Profile could not be prepared");
  }
}

function isFinalizedSymptomGroup(group: SymptomGroup): group is FinalizedSymptomGroup {
  return group.joint_treatment_muscle_test !== null && group.joint_treatment_test_at !== null;
}

/**
 * Reads the gated guest session from local storage and assembles the `GuestSnapshot` `SessionEngine.promote`
 * expects. Returns `null` when the gate has no pending finish request or the stored entities are incomplete.
 *
 * A session with no linked Symptom Group (`linked_group_id === null`, ticket 08 / DEC-017 unlinked
 * timeline-first execution) assembles with `group: null` — `RepositoryPort.promoteGuestToAccount` (ticket
 * 07) and `SessionEngine.promote` both already accept a null group, sourcing the idempotency key from
 * `playerSession.id` instead of `group.id` in that case.
 */
export async function assembleGuestSnapshotForPendingGate(
  guestRepository: LocalGuestRepository,
): Promise<GuestSnapshot | null> {
  const gate = guestRepository.getGuestSessionGateSync();
  const sessionId = gate.pendingFinishRequest?.sessionId;
  if (sessionId === undefined) {
    return null;
  }

  const playerSession = await guestRepository.getPlayerSession(sessionId);
  if (playerSession === null) {
    return null;
  }

  if (playerSession.linked_group_id === null) {
    return { group: null, playerSession };
  }

  const group = await guestRepository.getGroup(playerSession.linked_group_id);
  if (group === null || !isFinalizedSymptomGroup(group)) {
    return null;
  }

  return { group, playerSession };
}

export interface PromoteWithAuthenticatedRepositoryOptions {
  delegatingPort: DelegatingRepositoryPort;
  authenticatedPort: RepositoryPort;
  guestSnapshot: GuestSnapshot;
  newUserId: string;
  promote: (guestSnapshot: GuestSnapshot, newUserId: string) => Promise<void>;
  getPromotionStatus: () => PromotionStatus;
  registerAuthenticatedPort: (port: RepositoryPort) => void;
}

/**
 * Swaps the active `RepositoryPort` to the authenticated adapter before `promote()` so the RPC runs on
 * Supabase. Rolls back to the previous provider when promotion fails (retry-safe, DEC-017).
 */
export async function promoteWithAuthenticatedRepository(
  options: PromoteWithAuthenticatedRepositoryOptions,
): Promise<void> {
  options.registerAuthenticatedPort(options.authenticatedPort);
  const previousProvider = options.delegatingPort.getProvider();
  options.delegatingPort.swapProvider(options.authenticatedPort);

  try {
    await options.promote(options.guestSnapshot, options.newUserId);
  } catch (error) {
    options.delegatingPort.swapProvider(previousProvider);
    throw error;
  }
  if (options.getPromotionStatus() === "failed") options.delegatingPort.swapProvider(previousProvider);
}
