import { describe, expect, it, vi } from "vitest";
import { FakeRepositoryPort } from "../../test/fakes/fake-repository-port";
import type { RepositoryPort } from "../repository-port";
import type { FinalizedSymptomGroup, PlayerSession } from "../types";
import { DelegatingRepositoryPort } from "../delegating-repository-port";
import { LibraryEngine } from "../library-engine/index";
import { TimelineEngine } from "../timeline-engine/index";
import { PlayerEngine } from "../player-engine/index";
import { findForbiddenModuleReference, getModuleSpecifiersFromFile } from "../test-helpers/isolation-scanner";
import { SessionEngine, type GuestSnapshot } from "./index";

/**
 * Ticket 09's Test-First Acceptance Criteria, run against the fake `RepositoryPort` (ticket 03) plus real
 * `PlayerEngine`/`LibraryEngine`/`TimelineEngine` instances - mirrors `player-engine.test.ts`'s
 * `buildEngine` pattern. Each `it()` below is titled to match a checkbox in
 * `.scratch/pic-tracer-bullet/issues/09-session-engine.md` exactly, plus additional coverage for
 * finishAnyway completion, a no-pending-request promotion, and a fail-then-retry-succeeds sequence.
 */
describe("SessionEngine", () => {
  function buildEngine(
    port: RepositoryPort = new FakeRepositoryPort(),
    options: { initialGateState?: import("../repository-port").GuestSessionGateState } = {},
  ) {
    const libraryEngine = new LibraryEngine(port);
    const timelineEngine = new TimelineEngine(port);
    const playerEngine = new PlayerEngine(port, libraryEngine, timelineEngine);
    const sessionEngine = new SessionEngine(port, playerEngine, options);
    return { port, libraryEngine, timelineEngine, playerEngine, sessionEngine };
  }

  function buildGuestSnapshot(overrides: Partial<GuestSnapshot> = {}): GuestSnapshot {
    const group: FinalizedSymptomGroup = {
      id: "guest-group-1",
      name: "Lower Back + Neck",
      symptoms: [],
      created_at: new Date().toISOString(),
      joint_treatment_muscle_test: "together",
      joint_treatment_test_at: new Date().toISOString(),
    };
    const playerSession: PlayerSession = {
      id: "guest-session-1",
      treatment_id: "treatment-1",
      linked_group_id: group.id,
      units: [{ unit_id: "a", state: "completed" }],
      terminal_nemar_response: "yes",
      success_declared: false,
      finished_at: null,
      integrating_reason: null,
    };
    return { group, playerSession, ...overrides };
  }

  describe("getState", () => {
    it("starts in guest mode with no gate triggered and idle promotion", () => {
      const { sessionEngine } = buildEngine();

      expect(sessionEngine.getState()).toEqual({
        mode: "guest",
        gateTriggered: false,
        promotionStatus: "idle",
      });
    });
  });

  describe("onFinishRequested", () => {
    it("signals gateTriggered=true and does not run Finish side effects when mode is guest", async () => {
      const { port, playerEngine, sessionEngine } = buildEngine();
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await playerEngine.respondTerminalNemar(sessionId, "yes");
      const finishSpy = vi.spyOn(playerEngine, "finish");

      await sessionEngine.onFinishRequested(sessionId, "finish");

      expect(sessionEngine.getState().gateTriggered).toBe(true);
      expect(finishSpy).not.toHaveBeenCalled();
      expect((await port.getPlayerSession(sessionId))?.success_declared).toBe(false);
    });

    const passthroughTitle =
      "passes straight through to finish()/finishAnyway() with no gate signal when mode is authenticated";
    it(passthroughTitle, async () => {
      const { port, playerEngine, sessionEngine } = buildEngine();
      // The only documented way to reach 'authenticated' is a successful promote() call (ticket 09 DoD) -
      // this doubles as coverage that promote() correctly flips mode with no pending finish request queued.
      await sessionEngine.promote(buildGuestSnapshot(), "user-1");
      expect(sessionEngine.getState().mode).toBe("authenticated");

      const sessionId = await playerEngine.startSession("treatment-2", null, ["a"]);
      await playerEngine.respondTerminalNemar(sessionId, "yes");

      await sessionEngine.onFinishRequested(sessionId, "finish");

      expect(sessionEngine.getState().gateTriggered).toBe(false);
      expect((await port.getPlayerSession(sessionId))?.success_declared).toBe(true);
    });
  });

  describe("promote", () => {
    it("notifies subscribers with promotionStatus pending before promoteGuestToAccount resolves", async () => {
      const port = new FakeRepositoryPort();
      let resolvePromotion: (() => void) | undefined;
      vi.spyOn(port, "promoteGuestToAccount").mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromotion = () => resolve({
              group: buildGuestSnapshot().group,
              playerSession: buildGuestSnapshot().playerSession,
              libraryRow: {
                id: "library-row-1",
                treatment_id: "treatment-1",
                use_count: 0,
                provenance: { source: "guest_promotion", first_seen_at: new Date().toISOString() },
                variant_type: "original",
                global_reference_id: "treatment-1",
                protocol_content: null,
                created_at: new Date().toISOString(),
              },
              timelineEvent: {
                id: "timeline-1",
                log_type: "treatment_execution",
                treatment_id: "treatment-1",
                library_row_id: "library-row-1",
                linked_group_id: null,
                metadata: null,
                created_at: new Date().toISOString(),
              },
            });
          }),
      );
      const { sessionEngine } = buildEngine(port);
      const observed: string[] = [];
      sessionEngine.subscribe(() => observed.push(sessionEngine.getState().promotionStatus));

      const promotePromise = sessionEngine.promote(buildGuestSnapshot(), "user-1");

      expect(observed).toContain("pending");
      expect(sessionEngine.getState().promotionStatus).toBe("pending");

      resolvePromotion?.();
      await promotePromise;

      expect(sessionEngine.getState().promotionStatus).toBe("succeeded");
    });

    it("on success flips mode from guest to authenticated and signals guest state can be cleared", async () => {
      const { sessionEngine } = buildEngine();

      await sessionEngine.promote(buildGuestSnapshot(), "user-1");

      // No dedicated "clearable" field exists on getState() (ticket 09's own 3-field shape) - reaching
      // mode: 'authenticated' + promotionStatus: 'succeeded' together *is* the documented signal a caller
      // (pic-web) reads before it calls LocalGuestRepository's own clear/reset and swaps its active adapter.
      expect(sessionEngine.getState()).toEqual({
        mode: "authenticated",
        gateTriggered: false,
        promotionStatus: "succeeded",
      });
    });

    const completesGatedFinishTitle =
      "on success completes the originally-requested finish()/finishAnyway() call that triggered the gate";
    it(completesGatedFinishTitle, async () => {
      const { port, playerEngine, sessionEngine } = buildEngine();
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await playerEngine.respondTerminalNemar(sessionId, "yes");
      await sessionEngine.onFinishRequested(sessionId, "finish"); // gated - guest mode, not yet run

      const gatedSession = await port.getPlayerSession(sessionId);
      await sessionEngine.promote(buildGuestSnapshot({ playerSession: gatedSession! }), "user-1");

      const session = await port.getPlayerSession(sessionId);
      expect(session?.success_declared).toBe(true);
      expect(sessionEngine.getState().gateTriggered).toBe(false);
    });

    it("on success completes an originally-requested finishAnyway() call the same way", async () => {
      const { port, playerEngine, sessionEngine } = buildEngine();
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a", "b"]);
      // terminal_nemar_response stays null - finish() would throw, proving this really routed through
      // finishAnyway() and not a silent fallback to finish().
      await sessionEngine.onFinishRequested(sessionId, "finishAnyway");

      const gatedSession = await port.getPlayerSession(sessionId);
      await sessionEngine.promote(buildGuestSnapshot({ playerSession: gatedSession! }), "user-1");

      expect((await port.getPlayerSession(sessionId))?.success_declared).toBe(true);
    });

    it("promoting with no pending finish request just flips mode without calling PlayerEngine", async () => {
      const { playerEngine, sessionEngine } = buildEngine();
      const finishSpy = vi.spyOn(playerEngine, "finish");
      const finishAnywaySpy = vi.spyOn(playerEngine, "finishAnyway");

      await sessionEngine.promote(buildGuestSnapshot(), "user-1");

      expect(sessionEngine.getState().mode).toBe("authenticated");
      expect(finishSpy).not.toHaveBeenCalled();
      expect(finishAnywaySpy).not.toHaveBeenCalled();
    });

    const failureRetryTitle = "on failure leaves mode as guest and does not clear guest state, permitting retry";
    it(failureRetryTitle, async () => {
      const port = new FakeRepositoryPort();
      const promoteSpy = vi.spyOn(port, "promoteGuestToAccount").mockRejectedValueOnce(new Error("network drop"));
      const { playerEngine, sessionEngine } = buildEngine(port);
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await playerEngine.respondTerminalNemar(sessionId, "yes");
      await sessionEngine.onFinishRequested(sessionId, "finish");
      const snapshot = buildGuestSnapshot({ playerSession: (await port.getPlayerSession(sessionId))! });

      await sessionEngine.promote(snapshot, "user-1"); // first attempt: rejected

      expect(sessionEngine.getState()).toEqual({
        mode: "guest",
        gateTriggered: true, // still gating - the EM's pending Finish is still waiting, not abandoned
        promotionStatus: "failed",
      });
      expect((await port.getPlayerSession(sessionId))?.success_declared).toBe(false);

      await sessionEngine.promote(snapshot, "user-1"); // retry with the identical payload: succeeds

      expect(sessionEngine.getState()).toEqual({
        mode: "authenticated",
        gateTriggered: false,
        promotionStatus: "succeeded",
      });
      expect((await port.getPlayerSession(sessionId))?.success_declared).toBe(true);
      expect(promoteSpy).toHaveBeenCalledTimes(2);
    });

    it("sources promoteGuestToAccount's idempotencyKey from the guest group's own id", async () => {
      const { port, sessionEngine } = buildEngine();
      const promoteSpy = vi.spyOn(port, "promoteGuestToAccount");
      const snapshot = buildGuestSnapshot();

      await sessionEngine.promote(snapshot, "user-1");

      expect(promoteSpy).toHaveBeenCalledWith(
        expect.objectContaining({ idempotencyKey: snapshot.group.id, newUserId: "user-1" }),
      );
    });

    it("normalizes an in_view unit to unseen before crossing into promoteGuestToAccount (DEC-015)", async () => {
      const { port, sessionEngine } = buildEngine();
      const snapshot = buildGuestSnapshot({
        playerSession: {
          id: "guest-session-in-view",
          treatment_id: "treatment-1",
          linked_group_id: null,
          units: [
            { unit_id: "a", state: "completed" },
            { unit_id: "b", state: "in_view" },
          ],
          terminal_nemar_response: "yes",
          success_declared: false,
          finished_at: null,
          integrating_reason: null,
        },
      });

      await sessionEngine.promote(snapshot, "user-1");

      const promoted = await port.getPlayerSession("guest-session-in-view");
      expect(promoted?.units).toEqual([
        { unit_id: "a", state: "completed" },
        { unit_id: "b", state: "unseen" },
      ]);
    });
    it("replays the gated finish against the swapped authenticated adapter after promotion", async () => {
      const guestPort = new FakeRepositoryPort();
      const authenticatedPort = new FakeRepositoryPort();
      const delegatingPort = new DelegatingRepositoryPort(guestPort);
      const libraryEngine = new LibraryEngine(delegatingPort);
      const timelineEngine = new TimelineEngine(delegatingPort);
      const playerEngine = new PlayerEngine(delegatingPort, libraryEngine, timelineEngine);
      const sessionEngine = new SessionEngine(delegatingPort, playerEngine, {
        onPromotionSucceeded: () => delegatingPort.swapProvider(authenticatedPort),
      });

      const promoteGuest = guestPort.promoteGuestToAccount.bind(guestPort);
      vi.spyOn(guestPort, "promoteGuestToAccount").mockImplementation(async (input) => {
        const result = await promoteGuest(input);
        await authenticatedPort.saveGroup(input.group);
        await authenticatedPort.savePlayerSession(input.playerSession);
        await authenticatedPort.getOrCreateLibraryRow(input.playerSession.treatment_id, {
          source: "guest_promotion",
          first_seen_at: new Date().toISOString(),
        });
        return result;
      });

      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await playerEngine.respondTerminalNemar(sessionId, "yes");
      await sessionEngine.onFinishRequested(sessionId, "finish");

      const gatedSession = await guestPort.getPlayerSession(sessionId);
      await sessionEngine.promote(buildGuestSnapshot({ playerSession: gatedSession! }), "user-1");

      expect(delegatingPort.getProvider()).toBe(authenticatedPort);
      expect((await authenticatedPort.getPlayerSession(sessionId))?.success_declared).toBe(true);
      expect((await guestPort.getPlayerSession(sessionId))?.success_declared).toBe(false);
    });
  });

  describe("gate state refresh resilience", () => {
    it("rehydrates gateTriggered and pendingFinishRequest from persisted gate state at construction", async () => {
      const port = new FakeRepositoryPort();
      await port.saveGuestSessionGate({
        gateTriggered: true,
        pendingFinishRequest: { sessionId: "guest-session-1", kind: "finish" },
      });
      const { sessionEngine } = buildEngine(port, {
        initialGateState: await port.getGuestSessionGate(),
      });

      expect(sessionEngine.getState().gateTriggered).toBe(true);
    });

    it("persists gateTriggered=true so a simulated page reload can re-open the Persistence Gate", async () => {
      const port = new FakeRepositoryPort();
      const { playerEngine, sessionEngine } = buildEngine(port);
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await sessionEngine.onFinishRequested(sessionId, "finish");

      const persisted = await port.getGuestSessionGate();
      expect(persisted.gateTriggered).toBe(true);
      expect(persisted.pendingFinishRequest).toEqual({ sessionId, kind: "finish" });

      const reloaded = buildEngine(port, { initialGateState: persisted });
      expect(reloaded.sessionEngine.getState().gateTriggered).toBe(true);
    });
  });

  describe("discardGuestState", () => {
    it("never invokes any RepositoryPort method that would contact a network adapter", async () => {
      const port = new FakeRepositoryPort();
      const { playerEngine, sessionEngine } = buildEngine(port);
      const sessionId = await playerEngine.startSession("treatment-1", null, ["a"]);
      await sessionEngine.onFinishRequested(sessionId, "finish"); // gate the state first, then abandon it

      const methodNames = [
        "getGroup",
        "saveGroup",
        "getPlayerSession",
        "savePlayerSession",
        "getOrCreateLibraryRow",
        "incrementUseCount",
        "appendTimelineEvent",
        "promoteGuestToAccount",
      ] as const;
      const spies = methodNames.map((methodName) => vi.spyOn(port, methodName));

      await sessionEngine.discardGuestState();

      for (const spy of spies) {
        expect(spy).not.toHaveBeenCalled();
      }
    });

    it("resets gateTriggered and promotionStatus back to their initial values", async () => {
      const port = new FakeRepositoryPort();
      vi.spyOn(port, "promoteGuestToAccount").mockRejectedValueOnce(new Error("network drop"));
      const { sessionEngine } = buildEngine(port);
      await sessionEngine.promote(buildGuestSnapshot(), "user-1"); // fails, leaves promotionStatus 'failed'
      expect(sessionEngine.getState().promotionStatus).toBe("failed");

      await sessionEngine.discardGuestState();

      expect(sessionEngine.getState()).toEqual({
        mode: "guest",
        gateTriggered: false,
        promotionStatus: "idle",
      });
    });
  });

  describe("module isolation", () => {
    it("never imports GroupEngine (spec §A: 'No dependency on rating logic')", () => {
      const specifiers = getModuleSpecifiersFromFile(new URL("./index.ts", import.meta.url));

      expect(findForbiddenModuleReference(specifiers, "group-engine")).toBeUndefined();
    });
  });
});
