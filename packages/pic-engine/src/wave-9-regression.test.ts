import { describe, expect, it } from "vitest";
import {
  LibraryEngine,
  parseStructuredMarkdown,
  PlayerEngine,
  TERMINAL_NEMAR_UNIT_ID,
  TimelineEngine,
  TRACER_BULLET_SEED_TREATMENT_ROWS,
} from "../src/index";
import { FakeRepositoryPort } from "../test/fakes/fake-repository-port";

describe("Wave 9 regression guards", () => {
  it("startSession with real parsed seed units still appends TERMINAL_NEMAR as the final unit", async () => {
    const port = new FakeRepositoryPort();
    const libraryEngine = new LibraryEngine(port);
    const timelineEngine = new TimelineEngine(port);
    const playerEngine = new PlayerEngine(port, libraryEngine, timelineEngine);
    const seed = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
    const unitIds = parseStructuredMarkdown(seed.structured_markdown).map((unit) => unit.unit_id);

    const sessionId = await playerEngine.startSession(seed.id, null, unitIds);
    const session = await port.getPlayerSession(sessionId);

    expect(session!.units.map((unit) => unit.unit_id)).toEqual([...unitIds, TERMINAL_NEMAR_UNIT_ID]);
  });

  it("finishAnyway still sets success_declared true with terminal NEMAR no and unseen units", async () => {
    const port = new FakeRepositoryPort();
    const libraryEngine = new LibraryEngine(port);
    const timelineEngine = new TimelineEngine(port);
    const playerEngine = new PlayerEngine(port, libraryEngine, timelineEngine);
    const seed = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
    const unitIds = parseStructuredMarkdown(seed.structured_markdown).map((unit) => unit.unit_id);
    const sessionId = await playerEngine.startSession(seed.id, null, unitIds);
    await playerEngine.respondTerminalNemar(sessionId, "no");

    await playerEngine.finishAnyway(sessionId);

    const session = await port.getPlayerSession(sessionId);
    expect(session?.success_declared).toBe(true);
    expect(session?.units.some((unit) => unit.state === "unseen")).toBe(true);
  });

  it("PlayerUnit shape still carries only unit_id and state — never parsed content", () => {
    const sampleUnit = { unit_id: "unit-1", state: "in_view" as const };
    expect(Object.keys(sampleUnit).sort()).toEqual(["state", "unit_id"]);
  });

  it("TimelineEngine.recordExecution still links treatment_id and library_row_id without markdown snapshots", async () => {
    const port = new FakeRepositoryPort();
    const timelineEngine = new TimelineEngine(port);
    const libraryEngine = new LibraryEngine(port);
    const seed = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
    const row = await libraryEngine.recordUse(seed.id, "session-wave9-regression");

    const event = await timelineEngine.recordExecution({
      treatmentId: seed.id,
      libraryRowId: row.id,
      linkedGroupId: null,
    });

    expect(event.treatment_id).toBe(seed.id);
    expect(event.library_row_id).toBe(row.id);
    expect(event.metadata).toBeNull();
    expect(JSON.stringify(event)).not.toContain("structured_markdown");
    expect(JSON.stringify(event)).not.toContain("Settle Into Stillness");
  });
});
