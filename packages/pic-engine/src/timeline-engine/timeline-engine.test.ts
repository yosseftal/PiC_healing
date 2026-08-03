import { describe, expect, it, vi } from "vitest";
import { FakeRepositoryPort } from "../../test/fakes/fake-repository-port";
import { findForbiddenModuleReference, getModuleSpecifiersFromFile } from "../test-helpers/isolation-scanner";
import { TimelineEngine } from "./index";

/**
 * Ticket 06's Test-First Acceptance Criteria, run against the fake `RepositoryPort` (ticket 03). Each
 * `it()` below is titled to match a checkbox in `.scratch/pic-tracer-bullet/issues/06-timeline-engine.md`
 * exactly, plus additional coverage for the explicit "no snapshot" key-absence check the ticket's
 * Acceptance Criteria calls for as its own item, and adversarial identity-scoping (no data leakage
 * between unrelated treatments/callers).
 */
describe("TimelineEngine", () => {
  describe("recordExecution", () => {
    it('appends an event with log_type "treatment_execution"', async () => {
      const engine = new TimelineEngine(new FakeRepositoryPort());

      const event = await engine.recordExecution({
        treatmentId: "treatment-1",
        libraryRowId: "library-row-1",
      });

      expect(event.log_type).toBe("treatment_execution");
    });

    it("links treatment_id and library_row_id without embedding any content or markdown snapshot", async () => {
      const engine = new TimelineEngine(new FakeRepositoryPort());

      const event = await engine.recordExecution({
        treatmentId: "treatment-1",
        libraryRowId: "library-row-1",
      });

      expect(event.treatment_id).toBe("treatment-1");
      expect(event.library_row_id).toBe("library-row-1");
      expect(event).not.toHaveProperty("content");
      expect(event).not.toHaveProperty("markdown");
      expect(event).not.toHaveProperty("protocol_content");
    });

    it("never includes a content, markdown, or protocol_content key on the event (explicit absence check)", async () => {
      // Ticket 06's own Acceptance Criteria lists this as a separate bullet from the test above ("verified
      // by an explicit test asserting the absence of those keys") - kept as its own it() so that
      // requirement has a dedicated, unambiguous assertion independent of the treatment_id/library_row_id
      // linking test.
      const engine = new TimelineEngine(new FakeRepositoryPort());

      const event = await engine.recordExecution({
        treatmentId: "treatment-1",
        libraryRowId: "library-row-1",
        metadata: { note: "ran the full sequence" },
      });

      const keys = Object.keys(event);
      expect(keys).not.toContain("content");
      expect(keys).not.toContain("markdown");
      expect(keys).not.toContain("protocol_content");
    });

    it("accepts a null linked_group_id when no group link was chosen", async () => {
      const engine = new TimelineEngine(new FakeRepositoryPort());

      const event = await engine.recordExecution({
        treatmentId: "treatment-1",
        libraryRowId: "library-row-1",
      });

      expect(event.linked_group_id).toBeNull();
    });

    it("accepts a linked_group_id when the EM opted to link the treatment to a Symptom Group", async () => {
      const engine = new TimelineEngine(new FakeRepositoryPort());

      const event = await engine.recordExecution({
        treatmentId: "treatment-1",
        libraryRowId: "library-row-1",
        linkedGroupId: "group-1",
      });

      expect(event.linked_group_id).toBe("group-1");
    });

    it("calls RepositoryPort.appendTimelineEvent exactly once per recordExecution call", async () => {
      const port = new FakeRepositoryPort();
      const appendSpy = vi.spyOn(port, "appendTimelineEvent");
      const engine = new TimelineEngine(port);

      await engine.recordExecution({ treatmentId: "treatment-1", libraryRowId: "library-row-1" });

      expect(appendSpy).toHaveBeenCalledTimes(1);
    });

    it("adversarial: recordExecution for two unrelated treatments never leaks linkedGroupId/metadata between them", async () => {
      const port = new FakeRepositoryPort();
      const engine = new TimelineEngine(port);

      const [eventA, eventB] = await Promise.all([
        engine.recordExecution({
          treatmentId: "treatment-A",
          libraryRowId: "library-row-A",
          linkedGroupId: "group-A",
          metadata: { note: "A" },
        }),
        engine.recordExecution({
          treatmentId: "treatment-B",
          libraryRowId: "library-row-B",
          metadata: { note: "B" },
        }),
      ]);

      expect(eventA.id).not.toBe(eventB.id);
      expect(eventA.linked_group_id).toBe("group-A");
      expect(eventB.linked_group_id).toBeNull();
      expect(eventA.metadata).toEqual({ note: "A" });
      expect(eventB.metadata).toEqual({ note: "B" });
    });
  });

  describe("module isolation", () => {
    it("never imports GroupEngine, PlayerEngine, LibraryEngine, or SessionEngine", () => {
      // Ticket 04's dependency-cruiser guardrail is explicitly scoped to only the player-engine <->
      // group-engine pair, so TimelineEngine's isolation from all four sibling engines is verified here
      // instead via the shared source-scan helper (`../test-helpers/isolation-scanner.ts`, extracted
      // during Wave 3's audit response to de-duplicate this exact check against LibraryEngine's own
      // copy). That helper strips comments before scanning for relative module specifiers, so this
      // module's own doc comment - which legitimately cross-references `../library-engine/index.ts` in
      // prose (see that file's matching "Resolved architectural note") - can never be mistaken for a
      // real import.
      const specifiers = getModuleSpecifiersFromFile(new URL("./index.ts", import.meta.url));

      for (const forbiddenModule of ["group-engine", "player-engine", "library-engine", "session-engine"]) {
        expect(findForbiddenModuleReference(specifiers, forbiddenModule)).toBeUndefined();
      }
    });
  });
});
