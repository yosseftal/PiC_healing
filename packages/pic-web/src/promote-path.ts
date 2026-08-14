/**
 * Promote-path wiring (Wave 8 ticket 08-01): the only `pic-web` module besides `composition-root.ts`
 * allowed to import `pic-adapter-supabase`. Assembles `GuestSnapshot` from guest storage, constructs an
 * authenticated `SupabaseRepository`, and swaps the `DelegatingRepositoryPort` provider before
 * `SessionEngine.promote()` so `promoteGuestToAccount` targets Supabase (Ticket 13) instead of
 * `GuestRepositoryCannotPromoteError`.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SupabaseRepository } from "pic-adapter-supabase";
import type {
  FinalizedSymptomGroup,
  GuestSnapshot,
  PlayerSession,
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

export interface TestUserCredentials {
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

/**
 * Dev tracer-bullet auth stub credentials — never ship real passwords in source; read from env only.
 * See `docs/testing/supabase-remote-testing.md`.
 */
export function readTestUserCredentialsFromEnv(
  env: Record<string, string | undefined>,
): TestUserCredentials | null {
  const email = env.PIC_TRACER_TEST_USER_EMAIL ?? env.VITE_PIC_TRACER_TEST_USER_EMAIL;
  const password = env.PIC_TRACER_TEST_USER_PASSWORD ?? env.VITE_PIC_TRACER_TEST_USER_PASSWORD;
  if (email === undefined || password === undefined || email === "" || password === "") {
    return null;
  }
  return { email, password };
}

export function createSupabaseBrowserClient(config: SupabasePublicConfig): SupabaseClient {
  return createClient(config.url, config.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export function createSupabaseRepositoryFromClient(client: SupabaseClient): SupabaseRepository {
  return new SupabaseRepository(client);
}

/**
 * Tracer-bullet dev stub: signs in with password credentials from env. Label clearly in UI callers.
 * Returns a ready `SupabaseRepository` so Ticket 08-02 never imports `pic-adapter-supabase` directly.
 */
export async function signInAsTestUser(
  client: SupabaseClient,
  credentials: TestUserCredentials,
): Promise<{ userId: string; client: SupabaseClient; repository: SupabaseRepository }> {
  const { data, error } = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });
  if (error !== null || data.user === null) {
    throw new Error(`signInAsTestUser (dev stub): ${error?.message ?? "no user returned"}`);
  }
  return {
    userId: data.user.id,
    client,
    repository: createSupabaseRepositoryFromClient(client),
  };
}

/** Reads public Supabase config + test-user credentials from env and returns an authenticated repository. */
export async function signInAsTestUserFromEnv(
  env: Record<string, string | undefined>,
): Promise<{ userId: string; client: SupabaseClient; repository: SupabaseRepository }> {
  const config = readSupabasePublicConfigFromEnv(env);
  const credentials = readTestUserCredentialsFromEnv(env);
  if (config === null || credentials === null) {
    throw new Error(
      "signInAsTestUserFromEnv (dev stub): missing Supabase URL/anon key or tracer test-user credentials in env",
    );
  }
  const client = createSupabaseBrowserClient(config);
  return signInAsTestUser(client, credentials);
}

function isFinalizedSymptomGroup(group: SymptomGroup): group is FinalizedSymptomGroup {
  return group.joint_treatment_muscle_test !== null && group.joint_treatment_test_at !== null;
}

/**
 * Reads the gated guest session from local storage and assembles the `GuestSnapshot` `SessionEngine.promote`
 * expects. Returns `null` when the gate has no pending finish request or the stored entities are incomplete.
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
  if (playerSession === null || playerSession.linked_group_id === null) {
    return null;
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

  await options.promote(options.guestSnapshot, options.newUserId);

  if (options.getPromotionStatus() === "failed") {
    options.delegatingPort.swapProvider(previousProvider);
  }
}
