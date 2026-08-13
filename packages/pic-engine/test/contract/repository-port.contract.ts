import { beforeEach, describe, expect, it } from "vitest";
import type { FinalizedSymptomGroup, LibraryRowProvenance, PlayerSession, Symptom } from "../../src/types";
import type { RepositoryPort } from "../../src/repository-port";

/**
 * Fixture builders. These construct valid domain objects (per `../../src/types`) so each `it()` block
 * below can focus on the one `RepositoryPort` behavior under test, rather than on fixture plumbing. They
 * reach only into `src/types` and `src/repository-port` - never into any adapter or fake internals - so
 * this file stays the exact, unmodified import tickets 10 and 13 will use against their own real adapters.
 */

let nextFixtureSuffix = 0;

function uniqueId(prefix: string): string {
  nextFixtureSuffix += 1;
  return `${prefix}-${nextFixtureSuffix}`;
}

function buildSymptom(overrides: Partial<Symptom> = {}): Symptom {
  return {
    id: uniqueId("symptom"),
    name: "Lower Back Pain",
    polarity: "negative",
    intensity: 6,
    rated_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildFinalizedGroup(overrides: Partial<FinalizedSymptomGroup> = {}): FinalizedSymptomGroup {
  return {
    id: uniqueId("group"),
    name: "Lower Back + Neck",
    symptoms: [buildSymptom()],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: "together",
    joint_treatment_test_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildPlayerSession(overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: uniqueId("player-session"),
    treatment_id: uniqueId("treatment"),
    linked_group_id: null,
    units: [{ unit_id: uniqueId("unit"), state: "completed" }],
    terminal_nemar_response: "yes",
    success_declared: true,
    finished_at: new Date().toISOString(),
    integrating_reason: null,
    ...overrides,
  };
}

function buildProvenance(overrides: Partial<LibraryRowProvenance> = {}): LibraryRowProvenance {
  return {
    source: "standalone_player",
    first_seen_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Shared `RepositoryPort` behavior contract (spec's Testing Decisions - "Contract tests, run against both
 * adapters"). Ticket 10 (`pic-adapter-local-guest`) and ticket 13 (`pic-adapter-supabase`) import this
 * exact function, unmodified, and pass their own `makePort` factory.
 *
 * "What good test means here" (spec's Testing Decisions): every assertion below is made only through
 * `RepositoryPort`'s own return values / re-fetched state - never through a fake-specific or
 * adapter-specific back door.
 *
 * **`options.skipPromoteGuestToAccount` (added, ticket 10, Wave 5/7):** ticket 10's own Definition of Done
 * requires `pic-adapter-local-guest` to pass this suite "excluding the `promoteGuestToAccount`-specific
 * assertions" - that adapter's `promoteGuestToAccount` is a deliberate no-op-or-error (Guest data
 * structurally cannot promote against itself; promotion always targets `pic-adapter-supabase`, ticket 13),
 * so every assertion in the `promoteGuestToAccount` block below would otherwise fail for a reason this
 * suite was never meant to police. Additive and opt-in: omitting `options` (as the existing
 * `FakeRepositoryPort` call site does) runs every block exactly as before.
 */
export interface RepositoryPortContractOptions {
  /**
   * When `true`, skips the entire `promoteGuestToAccount` describe block (via `describe.skipIf`, so the
   * exemption is visible in the test run's own output as explicitly skipped, never silently omitted) -
   * see this file's header comment for why `pic-adapter-local-guest` needs this.
   */
  skipPromoteGuestToAccount?: boolean;
  /**
   * Factory for a `treatmentId` to use in fixtures that need one (added, ticket 12/Wave 6). Defaults to a
   * synthetic, non-UUID string (`uniqueId("treatment")`) - safe for the fake and `pic-adapter-local-guest`,
   * neither of which enforces any existence or format constraint on a `treatmentId`.
   *
   * A real Postgres-backed adapter (`pic-adapter-supabase`) enforces `personal_treatment_library.treatment_id`
   * / `timeline_events.treatment_id` as `uuid` foreign keys into `treatments` (ticket 11's migration), with no
   * insert policy letting an authenticated session create its own `treatments` row. A synthetic id fails
   * there before RLS is even consulted - a genuine structural mismatch between this adapter-agnostic suite
   * and that adapter's strict relational schema, found and escalated during ticket 12 (Wave 6). Every real
   * call site in the shipped product already only ever passes a real, pre-existing `treatments.id` (
   * `LibraryEngine.recordUse` receives it from `PlayerEngine`, which only ever runs a real treatment), so a
   * Postgres-backed adapter's test file should supply a factory returning one of its own real, pre-seeded
   * treatment ids here instead of accepting the default - see `pic-adapter-supabase`'s test file for the
   * concrete factory it passes.
   */
  makeTreatmentId?: () => string;
}

export function runRepositoryPortContractTests(
  makePort: () => RepositoryPort,
  options: RepositoryPortContractOptions = {},
): void {
  const makeTreatmentId = options.makeTreatmentId ?? (() => uniqueId("treatment"));

  describe("RepositoryPort contract", () => {
    let port: RepositoryPort;

    beforeEach(() => {
      port = makePort();
    });

    describe("incrementUseCount", () => {
      it("increments use_count by exactly 1", async () => {
        const row = await port.getOrCreateLibraryRow(makeTreatmentId(), buildProvenance());
        expect(row.use_count).toBe(0);

        const updated = await port.incrementUseCount(row.id, uniqueId("idempotency-key"));

        expect(updated.use_count).toBe(1);
      });

      it("called twice with the same idempotencyKey increments exactly once", async () => {
        const row = await port.getOrCreateLibraryRow(makeTreatmentId(), buildProvenance());
        const sameKey = uniqueId("idempotency-key");

        const firstCall = await port.incrementUseCount(row.id, sameKey);
        const secondCallWithSameKey = await port.incrementUseCount(row.id, sameKey);

        expect(firstCall.use_count).toBe(1);
        expect(secondCallWithSameKey.use_count).toBe(1);

        // A different idempotency key (e.g. a genuinely later Finish of the same treatment) must still
        // increment - proving the fake isn't just "always a no-op after the first call".
        const differentKey = uniqueId("idempotency-key");
        const thirdCallWithDifferentKey = await port.incrementUseCount(row.id, differentKey);

        expect(thirdCallWithDifferentKey.use_count).toBe(2);
      });
    });

    describe("getOrCreateLibraryRow", () => {
      it("creates a new row on first call and returns the same row id on a second call for the same treatment", async () => {
        const treatmentId = makeTreatmentId();
        const provenance = buildProvenance();

        const firstCall = await port.getOrCreateLibraryRow(treatmentId, provenance);
        const secondCall = await port.getOrCreateLibraryRow(treatmentId, provenance);

        expect(secondCall.id).toBe(firstCall.id);
        expect(secondCall.treatment_id).toBe(treatmentId);
      });
    });

    describe("appendTimelineEvent", () => {
      it("never removes or mutates previously appended events", async () => {
        const firstEvent = await port.appendTimelineEvent({
          log_type: "treatment_execution",
          treatment_id: makeTreatmentId(),
          library_row_id: null,
          linked_group_id: null,
          metadata: { note: "first" },
        });
        const firstEventSnapshot = { ...firstEvent };

        const secondEvent = await port.appendTimelineEvent({
          log_type: "treatment_execution",
          treatment_id: makeTreatmentId(),
          library_row_id: null,
          linked_group_id: null,
          metadata: { note: "second" },
        });
        const secondEventSnapshot = { ...secondEvent };

        // A third append must not disturb what was already returned for the first two - the only way to
        // observe "no removal/mutation" through the RepositoryPort interface alone (there is no
        // `getTimelineEvents` read method) is that previously-returned event objects stay unchanged.
        await port.appendTimelineEvent({
          log_type: "treatment_execution",
          treatment_id: makeTreatmentId(),
          library_row_id: null,
          linked_group_id: null,
          metadata: { note: "third" },
        });

        expect(firstEvent).toEqual(firstEventSnapshot);
        expect(secondEvent).toEqual(secondEventSnapshot);
        expect(firstEvent.id).not.toBe(secondEvent.id);
      });
    });

    describe.skipIf(options.skipPromoteGuestToAccount)("promoteGuestToAccount", () => {
      const writesAllFivePromotedEntitiesTitle =
        "writes group (with its embedded symptoms), player session, library row, and timeline event, " +
        "all attached to input.newUserId";

      it(writesAllFivePromotedEntitiesTitle, async () => {
        const group = buildFinalizedGroup({
          symptoms: [buildSymptom({ name: "Lower Back" }), buildSymptom({ name: "Neck" })],
        });
        const playerSession = buildPlayerSession({ linked_group_id: group.id });
        const newUserId = uniqueId("user");

        const result = await port.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group,
          playerSession,
          newUserId,
        });

        expect(result.group.id).toBe(group.id);
        expect(result.group.symptoms).toEqual(group.symptoms);
        expect(result.playerSession.id).toBe(playerSession.id);
        expect(result.libraryRow.treatment_id).toBe(playerSession.treatment_id);
        expect(result.timelineEvent.library_row_id).toBe(result.libraryRow.id);
        expect(result.timelineEvent.linked_group_id).toBe(group.id);

        // Every entity the RPC-equivalent call wrote must be durably retrievable afterward through the
        // same port - not merely echoed back in the call's own return value.
        await expect(port.getGroup(group.id)).resolves.toEqual(result.group);
        await expect(port.getPlayerSession(playerSession.id)).resolves.toEqual(result.playerSession);
      });

      const idempotentPromotionRetryTitle =
        "called twice with the same idempotencyKey (and same newUserId) results in exactly one set " +
        "of rows (no duplication)";

      it(idempotentPromotionRetryTitle, async () => {
        const group = buildFinalizedGroup();
        const playerSession = buildPlayerSession({ linked_group_id: group.id });
        const newUserId = uniqueId("user");
        const idempotencyKey = uniqueId("idempotency-key");

        const firstPromotion = await port.promoteGuestToAccount({
          idempotencyKey,
          group,
          playerSession,
          newUserId,
        });
        const secondPromotion = await port.promoteGuestToAccount({
          idempotencyKey,
          group,
          playerSession,
          newUserId,
        });

        expect(secondPromotion).toEqual(firstPromotion);

        const rowAfterRetry = await port.getOrCreateLibraryRow(
          playerSession.treatment_id,
          buildProvenance(),
        );
        expect(rowAfterRetry.id).toBe(firstPromotion.libraryRow.id);
      });

      const crossIdentityRetryTitle =
        "called twice with the same idempotencyKey but a different newUserId (and a fully different " +
        "group/session payload) rejects on the second call, writes nothing for the second identity, and " +
        "leaves the first promotion fully intact";

      it(crossIdentityRetryTitle, async () => {
        const idempotencyKey = uniqueId("idempotency-key");

        const firstGroup = buildFinalizedGroup();
        const firstPlayerSession = buildPlayerSession({ linked_group_id: firstGroup.id });
        const firstNewUserId = uniqueId("user");

        const firstPromotion = await port.promoteGuestToAccount({
          idempotencyKey,
          group: firstGroup,
          playerSession: firstPlayerSession,
          newUserId: firstNewUserId,
        });

        // `idempotencyKey` is documented (repository-port.ts) as the Guest Group's own client-generated
        // UUID, so a real retry (dropped response, SessionEngine.promote called again) always resubmits
        // the exact same payload alongside it. A different newUserId (or group/session) on the same key
        // is therefore never a legitimate retry - it is exactly the anomalous, adversarial shape this test
        // targets, and per the Wave 2.5 hardening decision must reject outright: a silent no-op here would
        // let this second caller believe its own payload was what got persisted, when actually the first
        // caller's (possibly a different account's) data was kept.
        const secondGroup = buildFinalizedGroup();
        const secondPlayerSession = buildPlayerSession({ linked_group_id: secondGroup.id });
        const secondNewUserId = uniqueId("user");

        await expect(
          port.promoteGuestToAccount({
            idempotencyKey,
            group: secondGroup,
            playerSession: secondPlayerSession,
            newUserId: secondNewUserId,
          }),
        ).rejects.toThrow();

        // The rejected call must never have written anything for the second identity's payload - proving
        // this isn't merely "the return value hides it" while a side write still landed.
        await expect(port.getGroup(secondGroup.id)).resolves.toBeNull();
        await expect(port.getPlayerSession(secondPlayerSession.id)).resolves.toBeNull();

        // The rejection must not corrupt or roll back the already-successful first promotion - it remains
        // exactly as it was, retrievable through the same port.
        await expect(port.getGroup(firstGroup.id)).resolves.toEqual(firstPromotion.group);
        await expect(port.getPlayerSession(firstPlayerSession.id)).resolves.toEqual(
          firstPromotion.playerSession,
        );
      });

      const independentPromotionsDifferentTreatmentsTitle =
        "two separate promotions (different idempotencyKey, different newUserId, different treatments) " +
        "produce fully independent group, player session, library row, and timeline event - neither " +
        "promotion's data is retrievable as, or merged into, the other's";

      it(independentPromotionsDifferentTreatmentsTitle, async () => {
        const groupA = buildFinalizedGroup();
        const playerSessionA = buildPlayerSession({ linked_group_id: groupA.id });

        const groupB = buildFinalizedGroup();
        const playerSessionB = buildPlayerSession({ linked_group_id: groupB.id });

        const promotionA = await port.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group: groupA,
          playerSession: playerSessionA,
          newUserId: uniqueId("user"),
        });
        const promotionB = await port.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group: groupB,
          playerSession: playerSessionB,
          newUserId: uniqueId("user"),
        });

        // Distinct treatments never share a library row (getOrCreateLibraryRow's "same row per
        // treatment" contract keys strictly on treatment_id) - a fully independent result set end to end.
        expect(promotionB.group.id).not.toBe(promotionA.group.id);
        expect(promotionB.playerSession.id).not.toBe(promotionA.playerSession.id);
        expect(promotionB.libraryRow.id).not.toBe(promotionA.libraryRow.id);
        expect(promotionB.timelineEvent.id).not.toBe(promotionA.timelineEvent.id);

        // Each promotion's data is retrievable on its own terms, and retrieving one never yields the
        // other's rows.
        await expect(port.getGroup(groupA.id)).resolves.toEqual(promotionA.group);
        await expect(port.getGroup(groupB.id)).resolves.toEqual(promotionB.group);
        await expect(port.getPlayerSession(playerSessionA.id)).resolves.toEqual(promotionA.playerSession);
        await expect(port.getPlayerSession(playerSessionB.id)).resolves.toEqual(promotionB.playerSession);
      });

      const independentPromotionsSharedTreatmentTitle =
        "two separate promotions that happen to use the same treatment correctly share one library row " +
        "(per getOrCreateLibraryRow's contract) while their group, player session, and timeline event " +
        "stay fully independent";

      it(independentPromotionsSharedTreatmentTitle, async () => {
        const sharedTreatmentId = uniqueId("treatment");

        const groupA = buildFinalizedGroup();
        const playerSessionA = buildPlayerSession({
          treatment_id: sharedTreatmentId,
          linked_group_id: groupA.id,
        });

        const groupB = buildFinalizedGroup();
        const playerSessionB = buildPlayerSession({
          treatment_id: sharedTreatmentId,
          linked_group_id: groupB.id,
        });

        const promotionA = await port.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group: groupA,
          playerSession: playerSessionA,
          newUserId: uniqueId("user"),
        });
        const promotionB = await port.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group: groupB,
          playerSession: playerSessionB,
          newUserId: uniqueId("user"),
        });

        // The current RepositoryPort has no per-user scoping on getOrCreateLibraryRow(treatmentId, ...)
        // (types.ts: "no field expresses an adapter-specific identity concept... ownership/RLS scoping is
        // an adapter concern") - so one shared row per treatment, regardless of which promotion created
        // it, is the correct contract here, not a cross-account leak.
        expect(promotionB.libraryRow.id).toBe(promotionA.libraryRow.id);

        // Everything else about the two promotions still stays fully independent.
        expect(promotionB.group.id).not.toBe(promotionA.group.id);
        expect(promotionB.playerSession.id).not.toBe(promotionA.playerSession.id);
        expect(promotionB.timelineEvent.id).not.toBe(promotionA.timelineEvent.id);
        await expect(port.getGroup(groupA.id)).resolves.toEqual(promotionA.group);
        await expect(port.getGroup(groupB.id)).resolves.toEqual(promotionB.group);
      });
    });
  });
}
