import { describe, expect, it, vi } from "vitest";
import { FakeRepositoryPort } from "../../test/fakes/fake-repository-port";
import { findForbiddenModuleReference, getModuleSpecifiersFromFile } from "../test-helpers/isolation-scanner";
import { LibraryEngine } from "./index";

/**
 * Ticket 05's Test-First Acceptance Criteria, run against the fake `RepositoryPort` (ticket 03) - the
 * spec's "primary seam, primary test target." Each `it()` below is titled to match a checkbox in
 * `.scratch/pic-tracer-bullet/issues/05-library-engine.md` exactly, plus additional coverage for the
 * idempotencyKey design (see `./index.ts`'s "Resolved architectural note") and adversarial
 * identity-scoping (no data leakage between unrelated treatments/callers).
 */
describe("LibraryEngine", () => {
  describe("recordUse", () => {
    it("creates a new library row on first execution of a treatment", async () => {
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const row = await engine.recordUse("treatment-1", "session-1");

      expect(row.id).toBeTruthy();
      expect(row.treatment_id).toBe("treatment-1");
    });

    it("increments use_count by exactly 1 on the created row", async () => {
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const row = await engine.recordUse("treatment-1", "session-1");

      expect(row.use_count).toBe(1);
    });

    it("on a treatment already in the library reuses the existing row rather than creating a duplicate", async () => {
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const firstExecution = await engine.recordUse("treatment-1", "session-1");
      const secondExecution = await engine.recordUse("treatment-1", "session-2");

      expect(secondExecution.id).toBe(firstExecution.id);
      expect(secondExecution.use_count).toBe(2);
    });

    it('sets variant_type to "original" and provenance.source to "standalone_player" on first creation', async () => {
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const row = await engine.recordUse("treatment-1", "session-1");

      expect(row.variant_type).toBe("original");
      expect(row.provenance?.source).toBe("standalone_player");
    });

    it("never populates protocol_content - recordUse only ever produces Pointer-state rows (ADR-0002, DEC-016 §5)", async () => {
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const row = await engine.recordUse("treatment-1", "session-1");

      expect(row.protocol_content).toBeNull();
    });

    it("calls getOrCreateLibraryRow then incrementUseCount, in that order, exactly once per call", async () => {
      const port = new FakeRepositoryPort();
      const getOrCreateSpy = vi.spyOn(port, "getOrCreateLibraryRow");
      const incrementSpy = vi.spyOn(port, "incrementUseCount");
      const engine = new LibraryEngine(port);

      await engine.recordUse("treatment-1", "session-1");

      expect(getOrCreateSpy).toHaveBeenCalledTimes(1);
      expect(incrementSpy).toHaveBeenCalledTimes(1);
      expect(getOrCreateSpy.mock.invocationCallOrder[0]).toBeLessThan(
        incrementSpy.mock.invocationCallOrder[0],
      );
    });

    it("retrying recordUse with the same idempotencyKey never double-counts use_count", async () => {
      // Exercises the design this ticket's "Resolved architectural note" chose idempotencyKey for: a
      // network-level retry of the *same* Finish call (same key) must be a no-op on the counter, per
      // incrementUseCount's own doc comment and ticket 03's contract suite.
      const engine = new LibraryEngine(new FakeRepositoryPort());

      const firstAttempt = await engine.recordUse("treatment-1", "same-finish-attempt");
      const retryAttempt = await engine.recordUse("treatment-1", "same-finish-attempt");

      expect(retryAttempt.id).toBe(firstAttempt.id);
      expect(retryAttempt.use_count).toBe(1);
    });

    it("adversarial: recordUse for two unrelated treatments never leaks use_count or provenance between them", async () => {
      const port = new FakeRepositoryPort();
      const engine = new LibraryEngine(port);

      const [treatmentARow, treatmentBRow] = await Promise.all([
        engine.recordUse("treatment-A", "session-A"),
        engine.recordUse("treatment-B", "session-B"),
      ]);

      expect(treatmentARow.id).not.toBe(treatmentBRow.id);
      expect(treatmentARow.treatment_id).toBe("treatment-A");
      expect(treatmentBRow.treatment_id).toBe("treatment-B");
      expect(treatmentARow.use_count).toBe(1);
      expect(treatmentBRow.use_count).toBe(1);

      // A further use of treatment A alone must never nudge treatment B's row, and vice versa.
      const treatmentASecondUse = await engine.recordUse("treatment-A", "session-A-2");
      expect(treatmentASecondUse.use_count).toBe(2);
      const treatmentBReread = await engine.recordUse("treatment-B", "session-B");
      expect(treatmentBReread.use_count).toBe(1);
    });
  });

  describe("module isolation", () => {
    it("never imports GroupEngine, PlayerEngine, TimelineEngine, or SessionEngine", () => {
      // Ticket 04's dependency-cruiser guardrail is explicitly scoped to only the player-engine <->
      // group-engine pair ("Do not add rules restricting any other module pair... out of scope for this
      // rule"), so LibraryEngine's isolation from all four sibling engines is verified here instead via
      // the shared source-scan helper (`../test-helpers/isolation-scanner.ts`, extracted during Wave 3's
      // audit response to de-duplicate this exact check against TimelineEngine's own copy, and hardened
      // there against multi-line imports and `export ... from` re-exports).
      const specifiers = getModuleSpecifiersFromFile(new URL("./index.ts", import.meta.url));

      for (const forbiddenModule of ["group-engine", "player-engine", "timeline-engine", "session-engine"]) {
        expect(findForbiddenModuleReference(specifiers, forbiddenModule)).toBeUndefined();
      }
    });
  });
});
