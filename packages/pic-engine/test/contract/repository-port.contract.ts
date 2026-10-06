import { beforeEach, describe, expect, it } from "vitest";
import type { FinalizedSymptomGroup, LibraryRowProvenance, PlayerSession, Symptom } from "../../src/types";
import type { RepositoryPort, Treatment } from "../../src/repository-port";

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
 * Promotion is a capability contract: authenticated targets execute the success/retry assertions;
 * local Guest storage executes rejection/no-write assertions because it cannot promote into itself
 * (DEC-017). Both capabilities register executable tests, with no skipped contract cases.
 */
export interface RepositoryPortContractOptions {
  promotion?: "authenticated-target" | "local-guest";
  /** Fresh authenticated owner and its RLS-scoped port per promotion test. */
  makePromotionIdentity?: () => Promise<{ port: RepositoryPort; userId: string }>;
  /** UUID factories for relational promotion fixtures; opaque ids suffice for in-memory ports. */
  makeGroupId?: () => string;
  makeSymptomId?: () => string;
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
  /**
   * Optional factory for `incrementUseCount`'s `idempotencyKey`. Defaults to `uniqueId("idempotency-key")`
   * (fine for fake / local-guest). `pic-adapter-supabase` stores keys in a Postgres `uuid[]` column (ticket
   * 05) - pass `randomUUID` here so contract-suite keys satisfy that constraint. Production call sites
   * already source keys from `player_session.id` (a real uuid).
   */
  makeIdempotencyKey?: () => string;
  /**
   * Seeds (or points at) one full `Treatment` row the `getTreatment` block can fetch back through the port.
   * Defaults to calling `seedFullTreatments` on test doubles that expose it (see `FakeRepositoryPort`).
   * Real adapters should supply a factory that returns an already-persisted global seed row instead.
   */
  seedTreatment?: (port: RepositoryPort) => Treatment | Promise<Treatment>;
  /**
   * Factory for an id guaranteed absent from the catalog in `getTreatment`'s "unknown id → null" case.
   * Defaults to a synthetic opaque string (fine for fake / local-guest). Real Postgres adapters should
   * pass `randomUUID` so the id is syntactically valid but still absent.
   */
  makeUnknownTreatmentId?: () => string;
  /**
   * Factory for a `PlayerSession.id` to use in fixtures that need one (ticket 01's "getPlayerSession
   * dynamic rehydration" block). Defaults to a synthetic, non-UUID string (`uniqueId("player-session")`) -
   * safe for the fake and `pic-adapter-local-guest`, neither of which enforces any format constraint.
   * `pic-adapter-supabase` stores `player_sessions.id` as a real Postgres `uuid` primary key - pass
   * `randomUUID` here so this block's own `savePlayerSession`/`getPlayerSession` round-trip satisfies that
   * constraint, mirroring `makeTreatmentId`'s identical rationale above.
   */
  makeSessionId?: () => string;
}

function buildTreatment(overrides: Partial<Treatment> = {}): Treatment {
  return {
    id: uniqueId("treatment"),
    title: "RepositoryPort contract fixture",
    structured_markdown: "### Fixture Step\n\nContract-suite content.",
    content_format: "structured_markdown",
    ...overrides,
  };
}

function defaultSeedTreatment(port: RepositoryPort): Treatment {
  const treatment = buildTreatment();
  const seedable = port as RepositoryPort & {
    seedFullTreatments?: (treatments: Treatment[]) => void;
  };
  if (seedable.seedFullTreatments === undefined) {
    throw new Error(
      "getTreatment contract: supply options.seedTreatment or implement seedFullTreatments on the port " +
        "(FakeRepositoryPort does; real adapters should pass seedTreatment in their test call site).",
    );
  }
  seedable.seedFullTreatments([treatment]);
  return treatment;
}

export function runRepositoryPortContractTests(
  makePort: () => RepositoryPort,
  options: RepositoryPortContractOptions = {},
): void {
  const makeTreatmentId = options.makeTreatmentId ?? (() => uniqueId("treatment"));
  const makeIdempotencyKey = options.makeIdempotencyKey ?? (() => uniqueId("idempotency-key"));
  const makeUnknownTreatmentId = options.makeUnknownTreatmentId ?? (() => uniqueId("unknown-treatment"));
  const makeSessionId = options.makeSessionId ?? (() => uniqueId("player-session"));
  const seedTreatment = options.seedTreatment ?? defaultSeedTreatment;
  const makeGroupId = options.makeGroupId ?? (() => uniqueId("group"));
  const makeSymptomId = options.makeSymptomId ?? (() => uniqueId("symptom"));
  const makePromotionSymptom = (overrides: Partial<Symptom> = {}) =>
    buildSymptom({ id: makeSymptomId(), ...overrides });
  const makePromotionGroup = (overrides: Partial<FinalizedSymptomGroup> = {}) =>
    buildFinalizedGroup({
      id: makeGroupId(),
      symptoms: [makePromotionSymptom()],
      ...overrides,
    });
  const makePromotionSession = (overrides: Partial<PlayerSession> = {}) =>
    buildPlayerSession({ id: makeSessionId(), treatment_id: makeTreatmentId(), ...overrides });

  describe("RepositoryPort contract", () => {
    let port: RepositoryPort;

    beforeEach(() => {
      port = makePort();
    });

    describe("getPlayerSession dynamic rehydration", () => {
      it("restores exactly one in_view unit after persistence", async () => {
        const session = buildPlayerSession({
          id: makeSessionId(),
          treatment_id: makeTreatmentId(),
          units: [
            { unit_id: uniqueId("completed-unit"), state: "completed" },
            { unit_id: uniqueId("active-unit"), state: "in_view" },
            { unit_id: uniqueId("unseen-unit"), state: "unseen" },
          ],
          terminal_nemar_response: null,
          success_declared: false,
          finished_at: null,
        });

        await port.savePlayerSession(session);

        const restored = await port.getPlayerSession(session.id);
        expect(restored?.units.map((unit) => unit.state)).toEqual([
          "completed",
          "in_view",
          "unseen",
        ]);
        expect(restored?.units.filter((unit) => unit.state === "in_view")).toHaveLength(1);
      });
    });

    describe("incrementUseCount", () => {
      it("increments use_count by exactly 1", async () => {
        const row = await port.getOrCreateLibraryRow(makeTreatmentId(), buildProvenance());
        expect(row.use_count).toBe(0);

        const updated = await port.incrementUseCount(row.id, makeIdempotencyKey());

        expect(updated.use_count).toBe(1);
      });

      it("called twice with the same idempotencyKey increments exactly once", async () => {
        const row = await port.getOrCreateLibraryRow(makeTreatmentId(), buildProvenance());
        const sameKey = makeIdempotencyKey();

        const firstCall = await port.incrementUseCount(row.id, sameKey);
        const secondCallWithSameKey = await port.incrementUseCount(row.id, sameKey);

        expect(firstCall.use_count).toBe(1);
        expect(secondCallWithSameKey.use_count).toBe(1);

        // A different idempotency key (e.g. a genuinely later Finish of the same treatment) must still
        // increment - proving the fake isn't just "always a no-op after the first call".
        const differentKey = makeIdempotencyKey();
        const thirdCallWithDifferentKey = await port.incrementUseCount(row.id, differentKey);

        expect(thirdCallWithDifferentKey.use_count).toBe(2);
      });
    });

    describe("getTreatment", () => {
      it("returns the full treatment row for an existing id", async () => {
        const seeded = await seedTreatment(port);
        await expect(port.getTreatment(seeded.id)).resolves.toEqual(seeded);
      });

      it("returns null for an unknown id", async () => {
        await expect(port.getTreatment(makeUnknownTreatmentId())).resolves.toBeNull();
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

    if (options.promotion === "local-guest") {
      describe("promoteGuestToAccount local Guest capability", () => {
        it("rejects promotion without persisting the supplied group or session", async () => {
          const group = makePromotionGroup();
          const playerSession = makePromotionSession({ linked_group_id: group.id });

          await expect(port.promoteGuestToAccount({
            idempotencyKey: group.id,
            group,
            playerSession,
            newUserId: uniqueId("user"),
          })).rejects.toThrow();
          await expect(port.getGroup(group.id)).resolves.toBeNull();
          await expect(port.getPlayerSession(playerSession.id)).resolves.toBeNull();
        });

        it("rejects an unlinked promotion without persisting the supplied session", async () => {
          const playerSession = makePromotionSession();

          await expect(port.promoteGuestToAccount({
            idempotencyKey: playerSession.id,
            group: null,
            playerSession,
            newUserId: uniqueId("user"),
          })).rejects.toThrow();
          await expect(port.getPlayerSession(playerSession.id)).resolves.toBeNull();
        });
      });
    } else {
      describe("promoteGuestToAccount authenticated target capability", () => {
        let newUserId: string;
        const makeIdentity = async () => options.makePromotionIdentity
          ? options.makePromotionIdentity()
          : { port, userId: uniqueId("user") };

        beforeEach(async () => {
          const identity = await makeIdentity();
          port = identity.port;
          newUserId = identity.userId;
        });
        const writesAllFivePromotedEntitiesTitle =
          "writes group (with its embedded symptoms), player session, library row, and timeline event, " +
          "all attached to input.newUserId";

        it(writesAllFivePromotedEntitiesTitle, async () => {
          const group = makePromotionGroup({
            symptoms: [
              makePromotionSymptom({ name: "Lower Back" }),
              makePromotionSymptom({ name: "Neck" }),
            ],
          });
          const playerSession = makePromotionSession({ linked_group_id: group.id });

          const result = await port.promoteGuestToAccount({
            idempotencyKey: group.id,
            group,
            playerSession,
            newUserId,
          });

          if (result.group === null) throw new Error("Linked promotion returned no Symptom Group");
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
          const group = makePromotionGroup();
          const playerSession = makePromotionSession({ linked_group_id: group.id });
          const idempotencyKey = group.id;

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

        it("rejects a same-key retry with a changed rating timestamp and preserves the original snapshot", async () => {
          const group = makePromotionGroup();
          const playerSession = makePromotionSession({ linked_group_id: group.id });
          const input = { idempotencyKey: group.id, group, playerSession, newUserId };
          const original = await port.promoteGuestToAccount(input);
          const changedGroup = {
            ...group,
            symptoms: group.symptoms.map((symptom) => ({ ...symptom, rated_at: "2000-01-01T00:00:00.000Z" })),
          };

          await expect(port.promoteGuestToAccount({ ...input, group: changedGroup })).rejects.toThrow(/different/);
          await expect(port.getGroup(group.id)).resolves.toEqual(original.group);
          await expect(port.getPlayerSession(playerSession.id)).resolves.toEqual(original.playerSession);
          const row = await port.getOrCreateLibraryRow(playerSession.treatment_id, buildProvenance());
          expect(row.id).toBe(original.libraryRow.id);
          expect(row.use_count).toBe(original.libraryRow.use_count);
        });

        it(crossIdentityRetryTitle, async () => {
          const firstGroup = makePromotionGroup();
          const idempotencyKey = firstGroup.id;
          const firstPlayerSession = makePromotionSession({ linked_group_id: firstGroup.id });
          const firstNewUserId = newUserId;

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
          const secondGroup = makePromotionGroup({ id: idempotencyKey, name: "Different owner payload" });
          const secondPlayerSession = makePromotionSession({ linked_group_id: secondGroup.id });
          const secondIdentity = await makeIdentity();
          const secondNewUserId = secondIdentity.userId;

          await expect(
            secondIdentity.port.promoteGuestToAccount({
              idempotencyKey,
              group: secondGroup,
              playerSession: secondPlayerSession,
              newUserId: secondNewUserId,
            }),
          ).rejects.toThrow();

          // The rejected call must never have written anything for the second identity's payload - proving
          // this isn't merely "the return value hides it" while a side write still landed.
          if (secondIdentity.port === port) {
            // In-memory ports are identity-agnostic: the reused key still resolves to the first group.
            await expect(port.getGroup(secondGroup.id)).resolves.toEqual(firstPromotion.group);
          } else {
            await expect(secondIdentity.port.getGroup(secondGroup.id)).resolves.toBeNull();
          }
          await expect(secondIdentity.port.getPlayerSession(secondPlayerSession.id)).resolves.toBeNull();

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
          const groupA = makePromotionGroup();
          const playerSessionA = makePromotionSession({ linked_group_id: groupA.id });

          const groupB = makePromotionGroup();
          const playerSessionB = makePromotionSession({ linked_group_id: groupB.id });
          const identityB = await makeIdentity();

          const promotionA = await port.promoteGuestToAccount({
            idempotencyKey: groupA.id,
            group: groupA,
            playerSession: playerSessionA,
            newUserId,
          });
          const promotionB = await identityB.port.promoteGuestToAccount({
            idempotencyKey: groupB.id,
            group: groupB,
            playerSession: playerSessionB,
            newUserId: identityB.userId,
          });

          // Distinct treatments never share a library row (getOrCreateLibraryRow's "same row per
          // treatment" contract keys strictly on treatment_id) - a fully independent result set end to end.
          if (promotionA.group === null || promotionB.group === null) {
            throw new Error("Linked promotions returned no Symptom Group");
          }
          expect(promotionB.group.id).not.toBe(promotionA.group.id);
          expect(promotionB.playerSession.id).not.toBe(promotionA.playerSession.id);
          expect(promotionB.libraryRow.id).not.toBe(promotionA.libraryRow.id);
          expect(promotionB.timelineEvent.id).not.toBe(promotionA.timelineEvent.id);

          // Each promotion's data is retrievable on its own terms, and retrieving one never yields the
          // other's rows.
          await expect(port.getGroup(groupA.id)).resolves.toEqual(promotionA.group);
          await expect(identityB.port.getGroup(groupB.id)).resolves.toEqual(promotionB.group);
          await expect(port.getPlayerSession(playerSessionA.id)).resolves.toEqual(promotionA.playerSession);
          await expect(identityB.port.getPlayerSession(playerSessionB.id)).resolves.toEqual(promotionB.playerSession);
        });

        const independentPromotionsSharedTreatmentTitle =
          "two separate promotions that happen to use the same treatment correctly share one library row " +
          "(per getOrCreateLibraryRow's contract) while their group, player session, and timeline event " +
          "stay fully independent";

        it(independentPromotionsSharedTreatmentTitle, async () => {
          const sharedTreatmentId = makeTreatmentId();

          const groupA = makePromotionGroup();
          const playerSessionA = makePromotionSession({
            treatment_id: sharedTreatmentId,
            linked_group_id: groupA.id,
          });

          const groupB = makePromotionGroup();
          const playerSessionB = makePromotionSession({
            treatment_id: sharedTreatmentId,
            linked_group_id: groupB.id,
          });

          const promotionA = await port.promoteGuestToAccount({
            idempotencyKey: groupA.id,
            group: groupA,
            playerSession: playerSessionA,
            newUserId,
          });
          const promotionB = await port.promoteGuestToAccount({
            idempotencyKey: groupB.id,
            group: groupB,
            playerSession: playerSessionB,
            newUserId,
          });

          // Both executions belong to the same authenticated owner: one library row per treatment,
          // with independent group/session/timeline identities. Different owners never share this row.
          expect(promotionB.libraryRow.id).toBe(promotionA.libraryRow.id);

          // Everything else about the two promotions still stays fully independent.
          if (promotionA.group === null || promotionB.group === null) {
            throw new Error("Linked promotions returned no Symptom Group");
          }
          expect(promotionB.group.id).not.toBe(promotionA.group.id);
          expect(promotionB.playerSession.id).not.toBe(promotionA.playerSession.id);
          expect(promotionB.timelineEvent.id).not.toBe(promotionA.timelineEvent.id);
          await expect(port.getGroup(groupA.id)).resolves.toEqual(promotionA.group);
          await expect(port.getGroup(groupB.id)).resolves.toEqual(promotionB.group);
        });

        const unlinkedPromotionTitle =
          "with group null promotes player session, library row, and timeline event only, keyed by " +
          "playerSession.id";

        it(unlinkedPromotionTitle, async () => {
          const playerSession = makePromotionSession();

          const result = await port.promoteGuestToAccount({
            idempotencyKey: playerSession.id,
            group: null,
            playerSession,
            newUserId,
          });

          expect(result.group).toBeNull();
          expect(result.playerSession.id).toBe(playerSession.id);
          expect(result.libraryRow.treatment_id).toBe(playerSession.treatment_id);
          expect(result.timelineEvent.linked_group_id).toBeNull();

          await expect(port.getPlayerSession(playerSession.id)).resolves.toEqual(result.playerSession);
        });

        it("null-group promotion retries with the same playerSession.id are idempotent no-ops", async () => {
          const playerSession = makePromotionSession();

          const firstPromotion = await port.promoteGuestToAccount({
            idempotencyKey: playerSession.id,
            group: null,
            playerSession,
            newUserId,
          });
          const secondPromotion = await port.promoteGuestToAccount({
            idempotencyKey: playerSession.id,
            group: null,
            playerSession,
            newUserId,
          });

          expect(secondPromotion).toEqual(firstPromotion);
        });

        it("two independent null-group promotions stay fully independent", async () => {
          const playerSessionA = makePromotionSession();
          const playerSessionB = makePromotionSession();
          const identityB = await makeIdentity();

          const promotionA = await port.promoteGuestToAccount({
            idempotencyKey: playerSessionA.id,
            group: null,
            playerSession: playerSessionA,
            newUserId,
          });
          const promotionB = await identityB.port.promoteGuestToAccount({
            idempotencyKey: playerSessionB.id,
            group: null,
            playerSession: playerSessionB,
            newUserId: identityB.userId,
          });

          expect(promotionB.playerSession.id).not.toBe(promotionA.playerSession.id);
          expect(promotionB.timelineEvent.id).not.toBe(promotionA.timelineEvent.id);
        });
    });
    }
  });
}
