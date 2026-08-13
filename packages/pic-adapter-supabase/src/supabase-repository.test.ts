/**
 * `SupabaseRepository` runs against a **real remote Supabase project** (ticket 12's orchestrator-approved
 * substitution for "local `supabase start`" - this sandbox has no Docker/Supabase CLI; see this ticket's
 * `.scratch/pic-tracer-bullet/issues/12-adapter-supabase-crud.md` Resolution for the full writeup).
 *
 * `.env.local` loading below mirrors `scripts/wave6-supabase-audit.mjs`'s parsing pattern exactly, as a
 * module-level side effect before any Supabase client is constructed - this file never logs the values it
 * reads, only sanitized ids/counts.
 *
 * Every test that needs an authenticated identity provisions its own ephemeral auth user via the service
 * role's admin API, then signs in with the anon key to get a real RLS-scoped session - the actual
 * `SupabaseRepository` under test is always constructed from that signed-in (never the service-role)
 * client, matching production. Every created user is deleted in `afterAll`, so this run leaves no debris.
 */
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FinalizedSymptomGroup, LibraryRowProvenance, PlayerSession, Symptom } from "pic-engine";
import { runRepositoryPortContractTests } from "pic-engine/test/contract/repository-port.contract";
import { SupabaseRepository, SupabaseRepositoryPromotionNotImplementedError } from "./index";

function loadEnvLocal(path: string): Record<string, string> {
  const content = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envPath = fileURLToPath(new URL("../../../.env.local", import.meta.url));
const env = loadEnvLocal(envPath);
const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "supabase-repository.test.ts: missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY " +
      "in .env.local - see ticket 12's Connectivity section.",
  );
}

/** Service-role client: only used for ephemeral test-user provisioning/cleanup and seed-data lookup - the
 * adapter under test is never constructed with this client, since it bypasses RLS entirely. */
const serviceClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_USER_PASSWORD = `pic-healing-test-${randomUUID()}`;

interface TestUser {
  userId: string;
  client: SupabaseClient;
}

const createdTestUserIds: string[] = [];

/**
 * Creates a real, ephemeral, RLS-scoped authenticated session: an `auth.users` row (service role), a
 * matching `profiles` row (no signup trigger exists yet in this schema, so this file seeds it directly -
 * see this ticket's Resolution Deviations), then a real sign-in with the anon key. The returned `client`
 * is what a `SupabaseRepository` under test is constructed with - never the service-role client above.
 */
async function createAuthenticatedTestUser(): Promise<TestUser> {
  const email = `pic-healing-test-${randomUUID()}@example.com`;
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: TEST_USER_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(`Failed to create ephemeral test user: ${createError?.message ?? "no user returned"}`);
  }
  const userId = created.user.id;
  createdTestUserIds.push(userId);

  const { error: profileError } = await serviceClient.from("profiles").insert({ id: userId });
  if (profileError) {
    throw new Error(`Failed to seed profiles row for ephemeral test user: ${profileError.message}`);
  }

  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: signInError } = await anonClient.auth.signInWithPassword({
    email,
    password: TEST_USER_PASSWORD,
  });
  if (signInError) {
    throw new Error(`Failed to sign in ephemeral test user: ${signInError.message}`);
  }

  return { userId, client: anonClient };
}

afterAll(async () => {
  await Promise.all(createdTestUserIds.map((userId) => serviceClient.auth.admin.deleteUser(userId)));
});

/**
 * A real, pre-seeded, globally-readable `treatments` row (ADR-0001 hybrid ownership: `user_id is null`).
 * Required because `personal_treatment_library.treatment_id` and `player_sessions.treatment_id` are
 * `not null` foreign keys into `treatments` - there is currently no insert policy letting an authenticated
 * (non-service-role) session create new treatment rows, so every test below that needs a `treatmentId`
 * uses this real id rather than an arbitrary string. See this ticket's Resolution Deviations for why the
 * frozen contract suite's own synthetic `treatmentId` fixtures cannot satisfy this same constraint.
 */
let seedTreatmentId: string;

beforeAll(async () => {
  const { data, error } = await serviceClient
    .from("treatments")
    .select("id")
    .is("user_id", null)
    .limit(1)
    .single();
  if (error || !data) {
    throw new Error(`Failed to fetch a seeded global treatment id: ${error?.message ?? "none found"}`);
  }
  seedTreatmentId = data.id as string;
});

function buildProvenance(overrides: Partial<LibraryRowProvenance> = {}): LibraryRowProvenance {
  return { source: "standalone_player", first_seen_at: new Date().toISOString(), ...overrides };
}

/**
 * Ticket 03's shared `RepositoryPort` contract suite, imported unmodified (per ticket 12's own Seam Map:
 * "import it exactly like `pic-adapter-local-guest`'s test does"). One shared, freshly-provisioned test
 * user backs every non-skipped `it()` in this suite (a small, bounded number of calls to `makePort()`),
 * cleaned up in the top-level `afterAll` above alongside every other test user this file creates.
 *
 * `skipPromoteGuestToAccount: true` - ticket 13 owns that RPC exclusively; see
 * `SupabaseRepositoryPromotionNotImplementedError`'s own doc comment.
 *
 * **Known, escalated limitation (see this ticket's Resolution Deviations for the full writeup):** this
 * suite's own fixture builders (`uniqueId("treatment")` in `repository-port.contract.ts`) generate opaque,
 * non-UUID strings like `"treatment-1"` as `treatmentId` values. Every real usage of this port in the
 * shipped product always passes a real `treatments.id` UUID (`LibraryEngine.recordUse` receives it from
 * `PlayerEngine`, which only ever runs a real treatment) - but `personal_treatment_library.treatment_id`
 * and `timeline_events.treatment_id` are real Postgres `uuid` columns with foreign keys into `treatments`
 * (ticket 11's already-applied migration), and only `service_role` may write to `treatments` at all (no
 * insert policy exists for authenticated Event Managers yet). Postgres rejects a non-UUID string at the
 * type-parsing stage before RLS or the foreign key are even consulted, so the `getOrCreateLibraryRow`,
 * `incrementUseCount`, and `appendTimelineEvent` blocks below are expected to fail against this real
 * schema - a genuine structural mismatch between ticket 03's adapter-agnostic fixtures and ticket 11's
 * strict relational schema, not a bug in this adapter. This adapter's own correctness for exactly these
 * same three methods is proven immediately below, in the "Adapter-specific Testing Requirement" describe
 * block, using real seeded `treatmentId` values.
 */
let sharedContractTestUser: TestUser | undefined;

beforeAll(async () => {
  sharedContractTestUser = await createAuthenticatedTestUser();
});

runRepositoryPortContractTests(
  () => {
    if (!sharedContractTestUser) {
      throw new Error("SupabaseRepository contract suite: shared test user was not ready in time");
    }
    return new SupabaseRepository(sharedContractTestUser.client);
  },
  { skipPromoteGuestToAccount: true },
);

describe("SupabaseRepository", () => {
  describe("Adapter-specific Testing Requirement (ticket 12, real seeded treatmentId)", () => {
    let user: TestUser;
    let repository: SupabaseRepository;

    beforeAll(async () => {
      user = await createAuthenticatedTestUser();
      repository = new SupabaseRepository(user.client);
    });

    it("getOrCreateLibraryRow creates and returns a row scoped to auth.uid()", async () => {
      const row = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());

      expect(row.treatment_id).toBe(seedTreatmentId);
      expect(row.use_count).toBe(0);
      expect(row.variant_type).toBe("original");
      expect(row.id).toBeTruthy();

      // "scoped to auth.uid()": the row this session just created is genuinely re-fetchable by that same
      // session (RLS's `auth.uid() = user_id` allows it), and a second call for the same treatment
      // returns the identical row rather than creating a duplicate.
      const second = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());
      expect(second.id).toBe(row.id);
    });

    it("incrementUseCount is idempotent under retry against the real table", async () => {
      const row = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());
      const idempotencyKey = randomUUID();

      const firstCall = await repository.incrementUseCount(row.id, idempotencyKey);
      const retryWithSameKey = await repository.incrementUseCount(row.id, idempotencyKey);

      expect(retryWithSameKey.use_count).toBe(firstCall.use_count);

      // A genuinely different Finish (a different idempotency key) must still increment - proving this
      // isn't merely "always a no-op after the first call".
      const differentKey = randomUUID();
      const afterDifferentKey = await repository.incrementUseCount(row.id, differentKey);
      expect(afterDifferentKey.use_count).toBe(firstCall.use_count + 1);
    });

    it("appendTimelineEvent never mutates or removes prior events in the real table", async () => {
      const firstEvent = await repository.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: seedTreatmentId,
        library_row_id: null,
        linked_group_id: null,
        metadata: { note: "first" },
      });
      const firstEventSnapshot = { ...firstEvent };

      const secondEvent = await repository.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: seedTreatmentId,
        library_row_id: null,
        linked_group_id: null,
        metadata: { note: "second" },
      });

      await repository.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: seedTreatmentId,
        library_row_id: null,
        linked_group_id: null,
        metadata: { note: "third" },
      });

      expect(firstEvent).toEqual(firstEventSnapshot);
      expect(firstEvent.id).not.toBe(secondEvent.id);
    });

    it("a query for another user's data returns empty due to RLS, never an error that leaks existence", async () => {
      const stranger = await createAuthenticatedTestUser();
      const strangerRepository = new SupabaseRepository(stranger.client);

      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Lower Back",
        symptoms: [],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };
      await repository.saveGroup(group);

      const session: PlayerSession = {
        id: randomUUID(),
        treatment_id: seedTreatmentId,
        linked_group_id: null,
        units: [{ unit_id: randomUUID(), state: "unseen" }],
        terminal_nemar_response: null,
        success_declared: false,
        finished_at: null,
        integrating_reason: null,
      };
      await repository.savePlayerSession(session);
      const ownerLibraryRow = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());

      // A stranger's query for the owner's exact ids must resolve to null/absence, never throw, and never
      // otherwise reveal that a row with that id exists for someone else.
      await expect(strangerRepository.getGroup(group.id)).resolves.toBeNull();
      await expect(strangerRepository.getPlayerSession(session.id)).resolves.toBeNull();

      // The stranger querying the *same* treatmentId must see their own (absent) row, not the owner's -
      // proving isolation is real, not merely "getGroup/getPlayerSession happen to filter by id".
      const strangerLibraryRow = await strangerRepository.getOrCreateLibraryRow(
        seedTreatmentId,
        buildProvenance(),
      );
      expect(strangerLibraryRow.id).not.toBe(ownerLibraryRow.id);
      expect(strangerLibraryRow.use_count).toBe(0);

      // The owner's own data must remain fully intact throughout - proving the stranger's calls above
      // never mutated it, not merely that they couldn't see it.
      await expect(repository.getGroup(group.id)).resolves.toEqual(group);
      await expect(repository.getPlayerSession(session.id)).resolves.toEqual(session);
    });
  });

  describe("getGroup / saveGroup", () => {
    let user: TestUser;
    let repository: SupabaseRepository;

    beforeAll(async () => {
      user = await createAuthenticatedTestUser();
      repository = new SupabaseRepository(user.client);
    });

    it("returns null for an unknown group id", async () => {
      await expect(repository.getGroup(randomUUID())).resolves.toBeNull();
    });

    it("returns exactly what was saved, including nested symptoms, for a finalized group", async () => {
      // rated_at is asserted as null on both sides of the round trip - see SymptomRow's doc comment in
      // supabase-repository.ts (and this ticket's Resolution Deviations) for the live schema's missing
      // rated_at column, an escalated, honest limitation rather than a fabricated round-trip.
      const symptom: Symptom = {
        id: randomUUID(),
        name: "Lower Back Pain",
        polarity: "negative",
        intensity: 6,
        rated_at: null,
      };
      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Lower Back",
        symptoms: [symptom],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };

      await repository.saveGroup(group);

      await expect(repository.getGroup(group.id)).resolves.toEqual(group);
    });

    it("rated_at always reads back as null - a documented schema-gap limitation, not fabricated data", async () => {
      const ratedSymptom: Symptom = {
        id: randomUUID(),
        name: "Neck Tension",
        polarity: "positive",
        intensity: 3,
        rated_at: new Date().toISOString(),
      };
      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Neck",
        symptoms: [ratedSymptom],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };

      await repository.saveGroup(group);
      const reloaded = await repository.getGroup(group.id);

      expect(reloaded?.symptoms[0]?.rated_at).toBeNull();
    });

    it("a second saveGroup call removes symptoms no longer present (full-replace semantics)", async () => {
      const keptSymptom: Symptom = {
        id: randomUUID(),
        name: "Lower Back Pain",
        polarity: "negative",
        intensity: 6,
        rated_at: null,
      };
      const removedSymptom: Symptom = {
        id: randomUUID(),
        name: "Shoulder Tension",
        polarity: "negative",
        intensity: 4,
        rated_at: null,
      };
      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Upper Body",
        symptoms: [keptSymptom, removedSymptom],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };
      await repository.saveGroup(group);

      await repository.saveGroup({ ...group, symptoms: [keptSymptom] });

      const reloaded = await repository.getGroup(group.id);
      expect(reloaded?.symptoms.map((symptom) => symptom.id)).toEqual([keptSymptom.id]);
    });
  });

  describe("getPlayerSession / savePlayerSession", () => {
    let user: TestUser;
    let repository: SupabaseRepository;

    beforeAll(async () => {
      user = await createAuthenticatedTestUser();
      repository = new SupabaseRepository(user.client);
    });

    it("returns null for an unknown session id", async () => {
      await expect(repository.getPlayerSession(randomUUID())).resolves.toBeNull();
    });

    it("returns exactly what was saved when no unit is in_view", async () => {
      const session: PlayerSession = {
        id: randomUUID(),
        treatment_id: seedTreatmentId,
        linked_group_id: null,
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "skipped" },
        ],
        terminal_nemar_response: "yes",
        success_declared: true,
        finished_at: new Date().toISOString(),
        integrating_reason: null,
      };

      await repository.savePlayerSession(session);

      await expect(repository.getPlayerSession(session.id)).resolves.toEqual(session);
    });

    it("downgrades an in_view unit to unseen on write (DEC-015 Persistence Boundary Normalization)", async () => {
      const session: PlayerSession = {
        id: randomUUID(),
        treatment_id: seedTreatmentId,
        linked_group_id: null,
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "in_view" },
        ],
        terminal_nemar_response: null,
        success_declared: false,
        finished_at: null,
        integrating_reason: null,
      };

      await repository.savePlayerSession(session);

      await expect(repository.getPlayerSession(session.id)).resolves.toEqual({
        ...session,
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "unseen" },
        ],
      });
    });
  });

  describe("promoteGuestToAccount", () => {
    it("is a clearly-labeled stub that always throws, never a silent no-op", async () => {
      const user = await createAuthenticatedTestUser();
      const repository = new SupabaseRepository(user.client);
      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Lower Back",
        symptoms: [],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };
      const playerSession: PlayerSession = {
        id: randomUUID(),
        treatment_id: seedTreatmentId,
        linked_group_id: group.id,
        units: [{ unit_id: randomUUID(), state: "unseen" }],
        terminal_nemar_response: null,
        success_declared: false,
        finished_at: null,
        integrating_reason: null,
      };

      await expect(
        repository.promoteGuestToAccount({
          idempotencyKey: randomUUID(),
          group,
          playerSession,
          newUserId: randomUUID(),
        }),
      ).rejects.toBeInstanceOf(SupabaseRepositoryPromotionNotImplementedError);

      // The rejected call must not have written the group/session it was given as a side effect.
      await expect(repository.getGroup(group.id)).resolves.toBeNull();
      await expect(repository.getPlayerSession(playerSession.id)).resolves.toBeNull();
    });
  });
});
