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
import { GroupEngine, PromoteGuestToAccountIdentityMismatchError } from "pic-engine";
import { runRepositoryPortContractTests } from "pic-engine/test/contract/repository-port.contract";
import { SupabaseRepository } from "./index";

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

/**
 * A small pool of **fresh, ephemeral** real `treatments` rows for the shared contract suite's
 * `makeTreatmentId` factory (see `repository-port.contract.ts`'s doc comment on that option). A single
 * fixed id (like `seedTreatmentId` above) is wrong here: the contract suite reuses one shared
 * authenticated session across every `it()`, so two tests calling `getOrCreateLibraryRow` with the *same*
 * `(user_id, treatment_id)` pair would collide on the same real row and leak `use_count` state between
 * tests - exactly the cross-test contamination a fresh-per-call id is supposed to prevent. Each pool row
 * is deleted in `afterAll`, so this file leaves no debris in the Event Manager's real project.
 */
const ephemeralContractTreatmentIds: string[] = [];
let contractTreatmentIdPool: string[] = [];

beforeAll(async () => {
  const poolSize = 10;
  const { data, error } = await serviceClient
    .from("treatments")
    .insert(
      Array.from({ length: poolSize }, (_, index) => ({
        title: `Wave 6 contract-suite fixture treatment ${index + 1}`,
        structured_markdown: "### Fixture\n\nEphemeral treatment row for RepositoryPort contract-suite isolation.",
        user_id: null,
      })),
    )
    .select("id");
  if (error || !data) {
    throw new Error(`Failed to create ephemeral contract-suite treatment pool: ${error?.message ?? "no rows"}`);
  }
  const ids = data.map((row) => row.id as string);
  contractTreatmentIdPool = ids;
  ephemeralContractTreatmentIds.push(...ids);
});

/**
 * Self-contained cleanup, not dependent on hook-ordering luck with the user-cleanup `afterAll` above:
 * dependent rows (created by the contract suite's own `getOrCreateLibraryRow`/`appendTimelineEvent`
 * calls against these ephemeral ids) are deleted explicitly first, since `treatments` has no `on delete
 * cascade` from its dependents (ticket 11's migration deliberately leaves referential integrity strict -
 * "no insert/update/delete policy... only service_role may write here for now"). Deleting in the wrong
 * order previously surfaced as `error code 23503` (foreign key violation) - caught during this ticket's
 * own verification, not a hypothetical.
 */
afterAll(async () => {
  if (ephemeralContractTreatmentIds.length === 0) {
    return;
  }
  const { error: libraryError } = await serviceClient
    .from("personal_treatment_library")
    .delete()
    .in("treatment_id", ephemeralContractTreatmentIds);
  if (libraryError) {
    throw new Error(`Failed to clean up dependent personal_treatment_library rows: ${libraryError.message}`);
  }
  const { error: timelineError } = await serviceClient
    .from("timeline_events")
    .delete()
    .in("treatment_id", ephemeralContractTreatmentIds);
  if (timelineError) {
    throw new Error(`Failed to clean up dependent timeline_events rows: ${timelineError.message}`);
  }
  const { error: treatmentsError } = await serviceClient
    .from("treatments")
    .delete()
    .in("id", ephemeralContractTreatmentIds);
  if (treatmentsError) {
    throw new Error(`Failed to clean up ephemeral contract-suite treatments: ${treatmentsError.message}`);
  }
});

function makeContractTreatmentId(): string {
  const next = contractTreatmentIdPool.shift();
  if (next === undefined) {
    throw new Error(
      "makeContractTreatmentId: ephemeral treatment id pool exhausted - increase poolSize above " +
        "(the shared RepositoryPort contract suite needs one fresh id per isolation-sensitive call).",
    );
  }
  return next;
}

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
 * **`makeTreatmentId` override (Wave 6 fix, orchestrator-approved):** this suite's own default fixture
 * builder (`uniqueId("treatment")` in `repository-port.contract.ts`) generates opaque, non-UUID strings
 * like `"treatment-1"`. `personal_treatment_library.treatment_id` / `timeline_events.treatment_id` are
 * real Postgres `uuid` foreign keys into `treatments` (ticket 11's migration), with no insert policy
 * letting an authenticated session create its own `treatments` row - so a synthetic id fails at the
 * type-parsing stage before RLS or the foreign key are even consulted. `repository-port.contract.ts` now
 * exposes an optional `makeTreatmentId` factory (default preserved for the fake / `pic-adapter-local-guest`,
 * neither of which cares about id format) - this adapter supplies `makeContractTreatmentId`, which hands
 * out a fresh, ephemeral, real `treatments.id` per call (see that function's doc comment for why a single
 * fixed id is not enough), so every block in the shared suite now exercises this adapter's genuine
 * referential-integrity constraint instead of tripping over it.
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
  { skipPromoteGuestToAccount: true, makeTreatmentId: makeContractTreatmentId },
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

    it("incrementUseCount is idempotent under retry using the new uuid[] column", async () => {
      const row = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());
      const idempotencyKey = randomUUID();

      const firstCall = await repository.incrementUseCount(row.id, idempotencyKey);
      const retryWithSameKey = await repository.incrementUseCount(row.id, idempotencyKey);

      expect(retryWithSameKey.use_count).toBe(firstCall.use_count);
      expect(firstCall.use_count).toBe(1);
    });

    it(
      "a LibraryRow returned to a caller never exposes the idempotency-key column or the old " +
        "_usedIncrementIdempotencyKeys provenance field",
      async () => {
        const row = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());
        const idempotencyKey = randomUUID();

        const returned = await repository.incrementUseCount(row.id, idempotencyKey);

        expect(returned).not.toHaveProperty("used_increment_idempotency_keys");
        expect(
          Object.prototype.hasOwnProperty.call(returned as object, "used_increment_idempotency_keys"),
        ).toBe(false);

        const { data: rawRow, error } = await serviceClient
          .from("personal_treatment_library")
          .select("provenance, used_increment_idempotency_keys")
          .eq("id", row.id)
          .single();
        expect(error).toBeNull();
        expect(rawRow?.used_increment_idempotency_keys).toContain(idempotencyKey);
        expect(
          (rawRow?.provenance as Record<string, unknown> | null)?._usedIncrementIdempotencyKeys,
        ).toBeUndefined();
      },
    );

    it("two distinct idempotency keys against the same row both increment use_count, once each", async () => {
      const row = await repository.getOrCreateLibraryRow(seedTreatmentId, buildProvenance());
      const keyA = randomUUID();
      const keyB = randomUUID();

      const afterA = await repository.incrementUseCount(row.id, keyA);
      const retryA = await repository.incrementUseCount(row.id, keyA);
      const afterB = await repository.incrementUseCount(row.id, keyB);

      expect(afterA.use_count).toBe(1);
      expect(retryA.use_count).toBe(1);
      expect(afterB.use_count).toBe(2);
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

    it("saveGroup persists a symptom's rated_at, and getGroup reads that exact value back", async () => {
      const ratedAt = new Date().toISOString();
      const ratedSymptom: Symptom = {
        id: randomUUID(),
        name: "Neck Tension",
        polarity: "positive",
        intensity: 3,
        rated_at: ratedAt,
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

      expect(reloaded?.symptoms[0]?.rated_at).toBe(ratedAt);
    });

    it("a freshly added, never-rated symptom round-trips with rated_at: null", async () => {
      const unratedSymptom: Symptom = {
        id: randomUUID(),
        name: "Shoulder Tension",
        polarity: "negative",
        intensity: 2,
        rated_at: null,
      };
      const group: FinalizedSymptomGroup = {
        id: randomUUID(),
        name: "Shoulder",
        symptoms: [unratedSymptom],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
      };

      await repository.saveGroup(group);
      const reloaded = await repository.getGroup(group.id);

      expect(reloaded?.symptoms[0]?.rated_at).toBeNull();
    });

    it(
      "GroupEngine.hasPriorRating returns false before rate() and true after it, backed by " +
        "SupabaseRepository end-to-end",
      async () => {
        const groupId = randomUUID();
        const now = new Date().toISOString();
        const emptyFinalizedGroup: FinalizedSymptomGroup = {
          id: groupId,
          name: "Blind-by-Default integration",
          symptoms: [],
          created_at: now,
          joint_treatment_muscle_test: "together",
          joint_treatment_test_at: now,
        };
        await repository.saveGroup(emptyFinalizedGroup);

        const engine = new GroupEngine(repository);
        const symptomId = await engine.addSymptom(groupId, "Lower Back Pain");

        expect(await engine.hasPriorRating(symptomId)).toBe(false);

        await engine.rate(symptomId, { polarity: "negative", intensity: 6 });

        expect(await engine.hasPriorRating(symptomId)).toBe(true);

        const reloaded = await repository.getGroup(groupId);
        expect(reloaded?.symptoms[0]?.rated_at).not.toBeNull();
      },
    );

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

  /**
   * Ticket 13's mandatory 7-row adversarial matrix (`.scratch/pic-tracer-bullet/issues/13-atomic-promotion-rpc.md`),
   * plus one additional test (beyond the required 7) for the Wave 2.5 cross-identity-mismatch hardening
   * the ticket's own Frozen Requirements section calls out in detail. Every `it()` provisions its own
   * fresh ephemeral user (cleaned up by the file's top-level `afterAll`) so no test's promotion can ever
   * collide with another's on `symptom_groups.id`/`player_sessions.id` (both real random UUIDs) or on
   * `personal_treatment_library`'s `(user_id, treatment_id)` unique constraint (fresh `user_id` per test).
   *
   * `rated_at: null` on every fixture symptom (rather than the contract suite's default non-null value)
   * deliberately sidesteps ticket 12's already-escalated, already-tested schema gap (`symptoms` has no
   * `rated_at` column - see `SymptomRow`'s doc comment and this file's own
   * "rated_at always reads back as null" test above) rather than re-proving it here; a real Guest symptom
   * promoted through this same adapter would lose that field for the identical, already-documented
   * reason, regardless of anything ticket 13 itself does.
   */
  describe("promoteGuestToAccount", () => {
    function buildGuestSymptom(overrides: Partial<Symptom> = {}): Symptom {
      return {
        id: randomUUID(),
        name: "Lower Back Pain",
        polarity: "negative",
        intensity: 6,
        rated_at: null,
        ...overrides,
      };
    }

    function buildGuestGroup(overrides: Partial<FinalizedSymptomGroup> = {}): FinalizedSymptomGroup {
      return {
        id: randomUUID(),
        name: "Lower Back",
        symptoms: [buildGuestSymptom()],
        created_at: new Date().toISOString(),
        joint_treatment_muscle_test: "together",
        joint_treatment_test_at: new Date().toISOString(),
        ...overrides,
      };
    }

    function buildGuestPlayerSession(overrides: Partial<PlayerSession> = {}): PlayerSession {
      return {
        id: randomUUID(),
        treatment_id: seedTreatmentId,
        linked_group_id: null,
        units: [{ unit_id: randomUUID(), state: "completed" }],
        terminal_nemar_response: "yes",
        success_declared: true,
        finished_at: new Date().toISOString(),
        integrating_reason: null,
        ...overrides,
      };
    }

    /** Raw RPC payload shape - mirrors exactly what `SupabaseRepository.promoteGuestToAccount` itself
     * sends, so row 4's and row 7's direct `client.rpc(...)` calls (which deliberately bypass the
     * strongly-typed adapter method - the only way to inject the test-only connection-drop marker, or a
     * genuinely malformed payload the adapter's own types could never construct) exercise the exact same
     * wire shape as every other row. */
    function toRpcPayload(
      group: FinalizedSymptomGroup,
      playerSession: PlayerSession,
      newUserId: string,
      options: { symptoms?: unknown; testOnlyConnectionDrop?: boolean } = {},
    ) {
      return {
        p_guest_group: {
          id: group.id,
          name: group.name,
          joint_treatment_muscle_test: group.joint_treatment_muscle_test,
          joint_treatment_test_at: group.joint_treatment_test_at,
          created_at: group.created_at,
          ...(options.testOnlyConnectionDrop ? { __test_only_connection_drop__: true } : {}),
        },
        p_symptoms:
          options.symptoms !== undefined
            ? options.symptoms
            : group.symptoms.map((symptom) => ({
                id: symptom.id,
                name: symptom.name,
                polarity: symptom.polarity,
                intensity: symptom.intensity,
              })),
        p_player_session: {
          id: playerSession.id,
          treatment_id: playerSession.treatment_id,
          linked_group_id: playerSession.linked_group_id,
          units: playerSession.units,
          terminal_nemar_response: playerSession.terminal_nemar_response,
          success_declared: playerSession.success_declared,
          integrating_reason: playerSession.integrating_reason,
          finished_at: playerSession.finished_at,
        },
        p_new_user_id: newUserId,
      };
    }

    /** Queries every one of the 5 promoted tables directly (service role, bypassing RLS) so "zero rows
     * landed" is verified against ground truth, not merely against what the calling session can see. */
    async function expectNoPromotionRowsLanded(params: {
      groupId: string;
      sessionId: string;
      newUserId: string;
      treatmentId: string;
    }): Promise<void> {
      const { groupId, sessionId, newUserId, treatmentId } = params;
      const [groupRows, symptomRows, sessionRows, libraryRows, timelineRows] = await Promise.all([
        serviceClient.from("symptom_groups").select("id").eq("id", groupId),
        serviceClient.from("symptoms").select("id").eq("group_id", groupId),
        serviceClient.from("player_sessions").select("id").eq("id", sessionId),
        serviceClient
          .from("personal_treatment_library")
          .select("id")
          .eq("user_id", newUserId)
          .eq("treatment_id", treatmentId),
        serviceClient.from("timeline_events").select("id").eq("id", sessionId),
      ]);
      expect(groupRows.data ?? []).toHaveLength(0);
      expect(symptomRows.data ?? []).toHaveLength(0);
      expect(sessionRows.data ?? []).toHaveLength(0);
      expect(libraryRows.data ?? []).toHaveLength(0);
      expect(timelineRows.data ?? []).toHaveLength(0);
    }

    it("happy path with no group link promotes all five entities and clears local guest state", async () => {
      const user = await createAuthenticatedTestUser();
      const repository = new SupabaseRepository(user.client);
      const group = buildGuestGroup();
      const playerSession = buildGuestPlayerSession({ linked_group_id: null });

      const result = await repository.promoteGuestToAccount({
        idempotencyKey: group.id,
        group,
        playerSession,
        newUserId: user.userId,
      });

      expect(result.group).toEqual(group);
      expect(result.playerSession).toEqual(playerSession);
      expect(result.libraryRow.treatment_id).toBe(seedTreatmentId);
      expect(result.libraryRow.use_count).toBe(1);
      expect(result.timelineEvent.treatment_id).toBe(seedTreatmentId);
      expect(result.timelineEvent.library_row_id).toBe(result.libraryRow.id);
      expect(result.timelineEvent.linked_group_id).toBeNull();

      // Every one of the 5 rows is genuinely durable and RLS-scoped to newUserId - re-read independently
      // through the same port, not merely echoed back in the call's own return value.
      await expect(repository.getGroup(group.id)).resolves.toEqual(group);
      await expect(repository.getPlayerSession(playerSession.id)).resolves.toEqual(playerSession);

      // "local guest state cleared" (spec §E's "no partial adapter swap... only after the RPC call
      // returns success") is SessionEngine's responsibility (ticket 09, read-only/off-limits for this
      // ticket) - SessionEngine.promote() only clears Guest state and flips mode to "authenticated" after
      // this exact RepositoryPort call resolves (see its own source, `session-engine/index.ts`'s
      // `promote()`). This adapter-level test proves the half of that guarantee that is actually this
      // ticket's to prove: the call resolves with a fully, durably promoted state for SessionEngine to
      // act on.
    });

    it("happy path with a group link carries the link onto the player session and timeline event", async () => {
      const user = await createAuthenticatedTestUser();
      const repository = new SupabaseRepository(user.client);
      const group = buildGuestGroup();
      const playerSession = buildGuestPlayerSession({ linked_group_id: group.id });

      const result = await repository.promoteGuestToAccount({
        idempotencyKey: group.id,
        group,
        playerSession,
        newUserId: user.userId,
      });

      expect(result.playerSession.linked_group_id).toBe(group.id);
      expect(result.timelineEvent.linked_group_id).toBe(group.id);
      expect(result.libraryRow.use_count).toBe(1);

      // The group itself was promoted exactly once - not duplicated, not carrying duplicated symptoms.
      const reloadedGroup = await repository.getGroup(group.id);
      expect(reloadedGroup).toEqual(group);
      expect(reloadedGroup?.symptoms).toHaveLength(group.symptoms.length);
    });

    it("mid-transaction failure via forced constraint violation leaves zero rows in any table", async () => {
      const user = await createAuthenticatedTestUser();
      const repository = new SupabaseRepository(user.client);
      const group = buildGuestGroup();
      // A syntactically valid uuid that is guaranteed not to exist in `treatments` - forces a foreign key
      // violation on the player_sessions insert, which happens after the symptom_groups/symptoms inserts
      // earlier in the same function call, proving the whole implicit transaction rolls back together.
      const nonExistentTreatmentId = randomUUID();
      const playerSession = buildGuestPlayerSession({
        treatment_id: nonExistentTreatmentId,
        linked_group_id: null,
      });

      // Asserted against the specific Postgres foreign-key-violation signal (code 23503 / "foreign key"),
      // not merely "rejects.toThrow()" - a bare "it threw" assertion would trivially pass for the wrong
      // reason even before this migration exists (any call to a not-yet-existing RPC rejects too), which
      // would defeat this row's whole purpose. Asserting the specific signal means this test properly
      // fails red right now (the real error is "Could not find the function...") and will only pass once
      // the migration is applied *and* this exact constraint-violation path behaves as designed.
      await expect(
        repository.promoteGuestToAccount({
          idempotencyKey: group.id,
          group,
          playerSession,
          newUserId: user.userId,
        }),
      ).rejects.toThrow(/23503|foreign key/i);

      await expectNoPromotionRowsLanded({
        groupId: group.id,
        sessionId: playerSession.id,
        newUserId: user.userId,
        treatmentId: nonExistentTreatmentId,
      });
    });

    it(
      "mid-transaction failure via connection drop leaves zero rows and permits a clean retry",
      async () => {
        const user = await createAuthenticatedTestUser();
        const repository = new SupabaseRepository(user.client);
        const group = buildGuestGroup();
        const playerSession = buildGuestPlayerSession({ linked_group_id: null });

        // Bypasses the strongly-typed adapter method deliberately - it is the only way to inject the
        // test-only `__test_only_connection_drop__` marker (see this migration's own doc comment: the
        // real adapter method never emits this key for any input it can construct). The server-side gate
        // this triggers does `pg_sleep(3)` then an unconditional `raise exception`, guaranteeing a
        // deterministic rollback; the AbortController below aborts the *client's* wait well before that
        // 3-second window elapses, so this test never actually observes the RPC's response either way -
        // exactly the "connection drop mid-call" shape being approximated.
        const controller = new AbortController();
        const droppedCall = user.client
          .rpc("promote_guest_to_account", toRpcPayload(group, playerSession, user.userId, {
            testOnlyConnectionDrop: true,
          }))
          .abortSignal(controller.signal);
        setTimeout(() => controller.abort(), 300);

        const droppedResult = await droppedCall;
        // Asserted against the specific client-side abort signal (postgrest-js's own documented shape:
        // `"AbortError: The user aborted a request."`), not merely "error is not null" - a bare not-null
        // check would trivially pass for the wrong reason even before this migration exists (any call to
        // a not-yet-existing RPC errors near-instantly too, well before this test's 300ms abort fires).
        // Requiring the abort-specific message means this properly fails red right now for a *different*,
        // legible reason (the pre-migration response arrives too fast for the abort to ever apply, so the
        // real "Could not find the function..." message shows up here instead) and will only pass once
        // the migration's real `pg_sleep(3)` gate is slow enough for the abort to actually win the race.
        expect(droppedResult.error?.message).toMatch(/abort/i);

        // Give the server-side pg_sleep(3) + forced raise time to actually finish and roll back - the
        // client abort above only stops this test from ever seeing that response, it does not stop the
        // server-side statement, which keeps running (and then rolling back) independently.
        await new Promise((resolve) => setTimeout(resolve, 3200));

        await expectNoPromotionRowsLanded({
          groupId: group.id,
          sessionId: playerSession.id,
          newUserId: user.userId,
          treatmentId: seedTreatmentId,
        });

        // A subsequent retry with the identical idempotency key (and no test marker) succeeds cleanly
        // with exactly one full row-set.
        const retryResult = await repository.promoteGuestToAccount({
          idempotencyKey: group.id,
          group,
          playerSession,
          newUserId: user.userId,
        });
        expect(retryResult.libraryRow.use_count).toBe(1);
        await expect(repository.getGroup(group.id)).resolves.toEqual(group);
        await expect(repository.getPlayerSession(playerSession.id)).resolves.toEqual(playerSession);
      },
      15_000,
    );

    it(
      "calling promote() twice with the same idempotency key produces exactly one row-set and one " +
        "use_count increment",
      async () => {
        const user = await createAuthenticatedTestUser();
        const repository = new SupabaseRepository(user.client);
        const group = buildGuestGroup();
        const playerSession = buildGuestPlayerSession({ linked_group_id: null });
        const input = { idempotencyKey: group.id, group, playerSession, newUserId: user.userId };

        const first = await repository.promoteGuestToAccount(input);
        const second = await repository.promoteGuestToAccount(input);

        expect(second).toEqual(first);
        expect(second.libraryRow.use_count).toBe(1);

        const { data: timelineRows } = await serviceClient
          .from("timeline_events")
          .select("id")
          .eq("id", playerSession.id);
        expect(timelineRows).toHaveLength(1);
      },
    );

    it("a dropped-response retry produces exactly one row-set and one use_count increment", async () => {
      const user = await createAuthenticatedTestUser();
      const repository = new SupabaseRepository(user.client);
      const group = buildGuestGroup();
      const playerSession = buildGuestPlayerSession({ linked_group_id: null });
      const input = { idempotencyKey: group.id, group, playerSession, newUserId: user.userId };

      // "The RPC succeeding server-side but the client never receiving the response" is, from the
      // function's own idempotency logic, indistinguishable from the row above's "clean success then
      // retry" - promote_guest_to_account has no way to know, and does not need to know, whether its
      // caller ever read the previous reply. This test exercises that identical guarantee under the
      // distinct real-world framing the ticket names separately: the first call is allowed to fully
      // succeed and its result is deliberately never inspected here (simulating a caller that lost the
      // response), and only the retry's own return value is asserted against. A byte-for-byte network
      // "response never arrives" simulation is not practically reproducible against a managed remote
      // Postgres/PostgREST instance without raw socket control (unlike row 4's deterministic
      // pg_sleep+abort, which works precisely because it manufactures a long, controllable window) - see
      // this ticket's Resolution for the full note.
      await repository.promoteGuestToAccount(input);
      const retry = await repository.promoteGuestToAccount(input);

      expect(retry.libraryRow.use_count).toBe(1);
      await expect(repository.getGroup(group.id)).resolves.toEqual(group);
      const { data: timelineRows } = await serviceClient
        .from("timeline_events")
        .select("id")
        .eq("id", playerSession.id);
      expect(timelineRows).toHaveLength(1);
    });

    it("a partial payload is rejected with zero rows written", async () => {
      const user = await createAuthenticatedTestUser();
      const group = buildGuestGroup();
      const playerSession = buildGuestPlayerSession({ linked_group_id: null });

      const { error } = await user.client.rpc(
        "promote_guest_to_account",
        toRpcPayload(group, playerSession, user.userId, { symptoms: null }),
      );

      // Asserted against the RPC's own specific validation message, not merely "error is not null" (nor
      // merely "mentions p_symptoms" - PostgREST's own "could not find the function" error already lists
      // every parameter name it was looking for, p_symptoms included, so that weaker check would still
      // trivially pass for the wrong reason pre-migration). A null p_symptoms hits the RPC's generic
      // required-arguments check (it runs before the more specific jsonb_typeof array check, since a null
      // argument can't be typeof-checked in the first place) - so "are all required" is the actual, correct
      // validation message for this exact payload, not "must be a jsonb array" (that message is reserved
      // for a non-null p_symptoms of the wrong jsonb type, e.g. an object instead of an array). Requiring
      // this verbatim means the test properly fails red right now (the real pre-migration error is "Could
      // not find the function...", which contains neither phrase) and will only pass once the migration is
      // applied *and* this exact validation path behaves as designed.
      expect(error?.message).toMatch(/p_guest_group, p_symptoms, p_player_session, and p_new_user_id are all required/i);

      await expectNoPromotionRowsLanded({
        groupId: group.id,
        sessionId: playerSession.id,
        newUserId: user.userId,
        treatmentId: seedTreatmentId,
      });
    });

    it(
      "(extra, beyond the required 7) a retry with the same idempotency key but a different payload " +
        "rejects without overwriting the original promotion",
      async () => {
        const user = await createAuthenticatedTestUser();
        const repository = new SupabaseRepository(user.client);
        const group = buildGuestGroup();
        const playerSession = buildGuestPlayerSession({ linked_group_id: null });

        const original = await repository.promoteGuestToAccount({
          idempotencyKey: group.id,
          group,
          playerSession,
          newUserId: user.userId,
        });

        // Same idempotencyKey (== group.id) as the original call, but a genuinely different payload
        // (a different group name, a flipped success_declared) - the exact "same key, different payload"
        // shape PromoteGuestToAccountIdentityMismatchError's own doc comment describes.
        const divergentGroup: FinalizedSymptomGroup = { ...group, name: `${group.name} (divergent retry)` };
        const divergentPlayerSession: PlayerSession = {
          ...playerSession,
          success_declared: !playerSession.success_declared,
        };

        await expect(
          repository.promoteGuestToAccount({
            idempotencyKey: group.id,
            group: divergentGroup,
            playerSession: divergentPlayerSession,
            newUserId: user.userId,
          }),
        ).rejects.toBeInstanceOf(PromoteGuestToAccountIdentityMismatchError);

        // The original promotion remains fully, exactly intact - the rejected divergent call wrote
        // nothing and overwrote nothing.
        await expect(repository.getGroup(group.id)).resolves.toEqual(original.group);
        await expect(repository.getPlayerSession(playerSession.id)).resolves.toEqual(original.playerSession);
      },
    );
  });
});
