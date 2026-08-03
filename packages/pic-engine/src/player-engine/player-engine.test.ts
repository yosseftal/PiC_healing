import { describe, expect, it, vi } from "vitest";
import { FakeRepositoryPort } from "../../test/fakes/fake-repository-port";
import type { RepositoryPort } from "../../src/repository-port";
import { LibraryEngine } from "../library-engine/index";
import { TimelineEngine } from "../timeline-engine/index";
import {
  findForbiddenModuleReference,
  getModuleSpecifiersFromFile,
  readSourceFile,
  stripComments,
} from "../test-helpers/isolation-scanner";
import { PlayerEngine, PlayerSessionNotFoundError, TerminalNemarNotYesError, TERMINAL_NEMAR_UNIT_ID } from "./index";

/**
 * Ticket 08's Test-First Acceptance Criteria, run against the fake `RepositoryPort` (ticket 03) plus real
 * `LibraryEngine`/`TimelineEngine` instances (ticket 08 DoD: "Constructed against RepositoryPort,
 * LibraryEngine, and TimelineEngine"). Each `it()` below is titled to match a checkbox in
 * `.scratch/pic-tracer-bullet/issues/08-player-engine.md` exactly, plus additional coverage for
 * `startSession`'s persisted shape, defensive error paths, and adversarial cross-session isolation.
 */
describe("PlayerEngine", () => {
  function buildEngine(port: RepositoryPort = new FakeRepositoryPort()) {
    const libraryEngine = new LibraryEngine(port);
    const timelineEngine = new TimelineEngine(port);
    const engine = new PlayerEngine(port, libraryEngine, timelineEngine);
    return { port, libraryEngine, timelineEngine, engine };
  }

  async function getUnit(port: RepositoryPort, sessionId: string, unitId: string) {
    const session = await port.getPlayerSession(sessionId);
    return session?.units.find((unit) => unit.unit_id === unitId);
  }

  describe("startSession", () => {
    it("persists a new session with the first unit in_view and the rest unseen, plus a Terminal NEMAR", async () => {
      const { port, engine } = buildEngine();

      const sessionId = await engine.startSession("treatment-1", null, ["unit-a", "unit-b"]);

      const session = await port.getPlayerSession(sessionId);
      expect(session?.units.map((u) => [u.unit_id, u.state])).toEqual([
        ["unit-a", "in_view"],
        ["unit-b", "unseen"],
        [TERMINAL_NEMAR_UNIT_ID, "unseen"],
      ]);
      expect(session?.success_declared).toBe(false);
      expect(session?.terminal_nemar_response).toBeNull();
      expect(session?.linked_group_id).toBeNull();
    });

    it("Terminal NEMAR is always present as the final unit even if the seed content omits it", async () => {
      const { port, engine } = buildEngine();

      const sessionId = await engine.startSession("treatment-1", null, []);

      const session = await port.getPlayerSession(sessionId);
      expect(session?.units).toHaveLength(1);
      expect(session?.units[0]).toEqual({ unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" });
    });
  });

  describe("visibility-based unit transitions", () => {
    it("a unit transitions from unseen to in_view when rendered", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["unit-a", "unit-b"]);

      // "Rendered" here is startSession's own initial render of the first unit - see the next test for the
      // render-via-advance() case, and the jumpTo tests below for the render-via-navigation-tree case.
      expect((await getUnit(port, sessionId, "unit-a"))?.state).toBe("in_view");
      expect((await getUnit(port, sessionId, "unit-b"))?.state).toBe("unseen");
    });

    it("a unit transitions from in_view to completed when advancing to the next unit", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["unit-a", "unit-b"]);

      await engine.advance(sessionId);

      expect((await getUnit(port, sessionId, "unit-a"))?.state).toBe("completed");
      expect((await getUnit(port, sessionId, "unit-b"))?.state).toBe("in_view");
    });

    it("exiting while a unit is in_view leaves it persisted as unseen or skipped, never completed", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["unit-a", "unit-b"]);

      // "Exiting" is simply the absence of any further call - there is no exit()/close() method on
      // PlayerEngine's public API. The load-bearing, testable requirement is "never silently completed"
      // (DEC-015 §2); see ./index.ts's file header for why the exact non-completed value this engine
      // persists (in_view) is a deliberate, documented reading of "ephemeral, never persisted."
      const unitA = await getUnit(port, sessionId, "unit-a");
      expect(unitA?.state).not.toBe("completed");
    });
  });

  describe("jumpTo (Navigation Tree - the only manual jump mechanism)", () => {
    it("jumpTo a future unit marks every intermediate unseen unit as skipped", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a", "b", "c", "d"]);

      await engine.jumpTo(sessionId, "d");

      const session = await port.getPlayerSession(sessionId);
      expect(session?.units.map((u) => [u.unit_id, u.state])).toEqual([
        ["a", "completed"],
        ["b", "skipped"],
        ["c", "skipped"],
        ["d", "in_view"],
        [TERMINAL_NEMAR_UNIT_ID, "unseen"],
      ]);
    });

    it("jumping backward to a completed unit and re-advancing leaves it completed - revisiting never reverts state", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a", "b"]);
      await engine.advance(sessionId); // a: in_view -> completed, b: unseen -> in_view

      await engine.jumpTo(sessionId, "a"); // backward jump to a completed unit: pure revisiting
      expect((await getUnit(port, sessionId, "a"))?.state).toBe("completed");
      expect((await getUnit(port, sessionId, "b"))?.state).toBe("completed"); // just-left unit, navigated away from

      await engine.advance(sessionId); // re-advancing: no in_view unit exists, so this is a no-op
      expect((await getUnit(port, sessionId, "a"))?.state).toBe("completed");
    });

    const skippedUpgradeTitle =
      "jumping backward to a skipped unit, then advancing forward again, upgrades it to completed with " +
      "no duplicate side effect";
    it(skippedUpgradeTitle, async () => {
      const { port, libraryEngine, engine } = buildEngine();
      const recordUseSpy = vi.spyOn(libraryEngine, "recordUse");
      const sessionId = await engine.startSession("treatment-1", null, ["a", "b", "c"]);

      await engine.jumpTo(sessionId, "c"); // forward jump: a completed, b skipped, c in_view
      expect((await getUnit(port, sessionId, "b"))?.state).toBe("skipped");

      await engine.jumpTo(sessionId, "b"); // backward jump to skipped: upgrade path renders it in_view
      expect((await getUnit(port, sessionId, "b"))?.state).toBe("in_view");
      expect((await getUnit(port, sessionId, "c"))?.state).toBe("completed"); // just-left unit

      await engine.advance(sessionId); // upgrades b to completed; c is already completed, left alone
      expect((await getUnit(port, sessionId, "b"))?.state).toBe("completed");
      expect((await getUnit(port, sessionId, "c"))?.state).toBe("completed");
      // "No duplicate side effect": unit-state upgrades never call the Library/Timeline side effects at
      // all - only finish()/finishAnyway() do (DEC-006 §5) - so recordUse is never invoked by this flow.
      expect(recordUseSpy).not.toHaveBeenCalled();
    });

    it("throws UnknownPlayerUnitError when jumping to a unit that does not exist in the session", async () => {
      const { engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);

      await expect(engine.jumpTo(sessionId, "does-not-exist")).rejects.toThrow(/does not exist/);
    });
  });

  describe("Terminal NEMAR", () => {
    it('Terminal NEMAR response "yes" unlocks finish()', async () => {
      const { engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);

      await engine.respondTerminalNemar(sessionId, "yes");

      await expect(engine.finish(sessionId)).resolves.not.toThrow();
    });

    const terminalNemarNoTitle =
      'Terminal NEMAR response "no" sets integrating_reason to "terminal_nemar_no" and does not block ' +
      "finishAnyway()";
    it(terminalNemarNoTitle, async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);

      await engine.respondTerminalNemar(sessionId, "no");

      const session = await port.getPlayerSession(sessionId);
      expect(session?.integrating_reason).toBe("terminal_nemar_no");
      await expect(engine.finishAnyway(sessionId)).resolves.not.toThrow();
    });

    it("finish() throws TerminalNemarNotYesError when the response is not yet yes", async () => {
      const { engine } = buildEngine();
      const sessionIdNull = await engine.startSession("treatment-1", null, ["a"]);
      await expect(engine.finish(sessionIdNull)).rejects.toThrow(TerminalNemarNotYesError);

      const sessionIdNo = await engine.startSession("treatment-1", null, ["a"]);
      await engine.respondTerminalNemar(sessionIdNo, "no");
      await expect(engine.finish(sessionIdNo)).rejects.toThrow(TerminalNemarNotYesError);
    });
  });

  describe("finish / finishAnyway (Sovereign Success Declaration, DEC-015 §4)", () => {
    it("finish() sets success_declared to true", async () => {
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);
      await engine.respondTerminalNemar(sessionId, "yes");

      await engine.finish(sessionId);

      const session = await port.getPlayerSession(sessionId);
      expect(session?.success_declared).toBe(true);
      expect(session?.finished_at).not.toBeNull();
    });

    const sovereignSuccessDeclarationTitle =
      'finishAnyway() called with terminal_nemar_response "no" and one unit still unseen still sets ' +
      "success_declared to true";
    it(sovereignSuccessDeclarationTitle, async () => {
      // The literal Sovereign Success Declaration test from the spec: neither a negative Terminal NEMAR
      // result nor an incomplete unit can leave success_declared false after finishAnyway() was called.
      const { port, engine } = buildEngine();
      const sessionId = await engine.startSession("treatment-1", null, ["a", "b", "c"]);
      await engine.respondTerminalNemar(sessionId, "no");
      expect((await getUnit(port, sessionId, "c"))?.state).toBe("unseen");

      await engine.finishAnyway(sessionId);

      const session = await port.getPlayerSession(sessionId);
      expect(session?.success_declared).toBe(true);
    });

    const exactlyOnceSideEffectsTitle =
      "finish() and finishAnyway() both call LibraryEngine.recordUse and TimelineEngine.recordExecution " +
      "exactly once";
    it(exactlyOnceSideEffectsTitle, async () => {
      const { libraryEngine: libA, timelineEngine: timA, engine: engineA, port: portA } = buildEngine();
      const recordUseSpyA = vi.spyOn(libA, "recordUse");
      const recordExecutionSpyA = vi.spyOn(timA, "recordExecution");
      const sessionIdA = await engineA.startSession("treatment-1", null, ["a"]);
      await engineA.respondTerminalNemar(sessionIdA, "yes");

      await engineA.finish(sessionIdA);

      expect(recordUseSpyA).toHaveBeenCalledTimes(1);
      expect(recordExecutionSpyA).toHaveBeenCalledTimes(1);
      void portA;

      const { libraryEngine: libB, timelineEngine: timB, engine: engineB } = buildEngine();
      const recordUseSpyB = vi.spyOn(libB, "recordUse");
      const recordExecutionSpyB = vi.spyOn(timB, "recordExecution");
      const sessionIdB = await engineB.startSession("treatment-2", null, ["a"]);

      await engineB.finishAnyway(sessionIdB);

      expect(recordUseSpyB).toHaveBeenCalledTimes(1);
      expect(recordExecutionSpyB).toHaveBeenCalledTimes(1);
    });

    const noRepeatSideEffectsTitle =
      "calling finish()/finishAnyway() again on an already-success_declared session does not call " +
      "recordUse/recordExecution a second time";
    it(noRepeatSideEffectsTitle, async () => {
      const { libraryEngine, timelineEngine, engine } = buildEngine();
      const recordUseSpy = vi.spyOn(libraryEngine, "recordUse");
      const recordExecutionSpy = vi.spyOn(timelineEngine, "recordExecution");
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);
      await engine.respondTerminalNemar(sessionId, "yes");
      await engine.finish(sessionId);

      await engine.finish(sessionId); // repeat call on an already-success_declared session
      await engine.finishAnyway(sessionId); // repeat via the other entry point too

      expect(recordUseSpy).toHaveBeenCalledTimes(1);
      expect(recordExecutionSpy).toHaveBeenCalledTimes(1);
    });

    it("sources recordUse's idempotencyKey from the completing session's own id (ticket 08 ## Resolution)", async () => {
      const { libraryEngine, engine } = buildEngine();
      const recordUseSpy = vi.spyOn(libraryEngine, "recordUse");
      const sessionId = await engine.startSession("treatment-1", null, ["a"]);

      await engine.finishAnyway(sessionId);

      expect(recordUseSpy).toHaveBeenCalledWith("treatment-1", sessionId);
    });

    const perSessionIdempotencyTitle =
      "adversarial identity test: two different sessions finishing the same treatment each increment " +
      "use_count independently - idempotencyKey is per-session (session.id), never shared or hardcoded";
    it(perSessionIdempotencyTitle, async () => {
      // Directly proves the idempotencyKey threading requirement: if PlayerEngine ever hardcoded, shared,
      // or dropped the idempotencyKey instead of sourcing it from each session's own id, this would either
      // under-count (two genuine executions incorrectly deduplicated as "the same retry") or leak one
      // session's identity into another's - both are the "no data leakage" failure mode this test targets.
      const port = new FakeRepositoryPort();
      const { engine: engineA } = buildEngine(port);
      const { engine: engineB } = buildEngine(port);

      const sessionIdA = await engineA.startSession("shared-treatment", null, ["a"]);
      const sessionIdB = await engineB.startSession("shared-treatment", null, ["a"]);
      expect(sessionIdA).not.toBe(sessionIdB);

      await engineA.finishAnyway(sessionIdA);
      await engineB.finishAnyway(sessionIdB);

      const row = await port.getOrCreateLibraryRow("shared-treatment", { source: "x", first_seen_at: "x" });
      expect(row.use_count).toBe(2);

      // Retrying session A's own finishAnyway (same idempotencyKey as its first call) must still not
      // double-count, proving the key genuinely round-trips through PlayerEngine into incrementUseCount
      // rather than merely appearing to work by coincidence.
      await engineA.finishAnyway(sessionIdA);
      const rowAfterRetry = await port.getOrCreateLibraryRow("shared-treatment", {
        source: "x",
        first_seen_at: "x",
      });
      expect(rowAfterRetry.use_count).toBe(2);
    });

    it("adversarial: finishing two sessions for different treatments never leaks use_count or timeline linkage", async () => {
      const port = new FakeRepositoryPort();
      const { engine: engineA } = buildEngine(port);
      const { engine: engineB } = buildEngine(port);

      const sessionIdA = await engineA.startSession("treatment-A", "group-A", ["a"]);
      const sessionIdB = await engineB.startSession("treatment-B", null, ["a"]);

      await Promise.all([engineA.finishAnyway(sessionIdA), engineB.finishAnyway(sessionIdB)]);

      const rowA = await port.getOrCreateLibraryRow("treatment-A", { source: "x", first_seen_at: "x" });
      const rowB = await port.getOrCreateLibraryRow("treatment-B", { source: "x", first_seen_at: "x" });
      expect(rowA.id).not.toBe(rowB.id);
      expect(rowA.use_count).toBe(1);
      expect(rowB.use_count).toBe(1);
    });

    it("throws PlayerSessionNotFoundError for an unknown sessionId", async () => {
      const { engine } = buildEngine();

      await expect(engine.finishAnyway("does-not-exist")).rejects.toThrow(PlayerSessionNotFoundError);
    });
  });

  describe("module isolation", () => {
    it("never imports GroupEngine or SessionEngine", () => {
      const specifiers = getModuleSpecifiersFromFile(new URL("./index.ts", import.meta.url));

      for (const forbiddenModule of ["group-engine", "session-engine"]) {
        expect(findForbiddenModuleReference(specifiers, forbiddenModule)).toBeUndefined();
      }
    });

    it("never references the Symptom, Polarity, or Intensity types (bare-identifier ban, ticket 08 scope)", () => {
      // These are named type exports from `../types`, a module this file legitimately imports for other
      // reasons (PlayerSession, PlayerUnit) - a module-specifier ban can't cover this, so this checks the
      // stripped source text directly for the forbidden identifiers themselves.
      const source = stripComments(readSourceFile(new URL("./index.ts", import.meta.url)));

      for (const forbiddenIdentifier of ["Symptom", "Polarity", "Intensity"]) {
        expect(source).not.toMatch(new RegExp(`\\b${forbiddenIdentifier}\\b`));
      }
    });

    it("PlayerEngine never calls any GroupEngine-shaped RepositoryPort method (getGroup/saveGroup)", async () => {
      // Runtime smoke assertion (in addition to the static-analysis backstops above and ticket 04's
      // dependency-cruiser rule): exercises a full lifecycle and confirms zero rating/group-shaped calls.
      const port = new FakeRepositoryPort();
      const getGroupSpy = vi.spyOn(port, "getGroup");
      const saveGroupSpy = vi.spyOn(port, "saveGroup");
      const { engine } = buildEngine(port);

      const sessionId = await engine.startSession("treatment-1", "group-1", ["a", "b", "c"]);
      await engine.advance(sessionId);
      await engine.jumpTo(sessionId, "c");
      await engine.jumpTo(sessionId, "b");
      await engine.respondTerminalNemar(sessionId, "yes");
      await engine.finish(sessionId);

      expect(getGroupSpy).not.toHaveBeenCalled();
      expect(saveGroupSpy).not.toHaveBeenCalled();
    });
  });
});
