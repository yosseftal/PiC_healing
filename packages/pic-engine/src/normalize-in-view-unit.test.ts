import { describe, expect, it } from "vitest";
import type { PlayerUnit } from "./types";
import { normalizeInViewUnit, rehydrateInViewUnit } from "./normalize-in-view-unit";

describe("normalizeInViewUnit", () => {
  it("the shared helper downgrades an in_view unit to unseen and leaves every other state untouched", () => {
    const unseen: PlayerUnit = { unit_id: "a", state: "unseen" };
    const inView: PlayerUnit = { unit_id: "b", state: "in_view" };
    const skipped: PlayerUnit = { unit_id: "c", state: "skipped" };
    const completed: PlayerUnit = { unit_id: "d", state: "completed" };

    expect(normalizeInViewUnit(unseen)).toEqual({ unit_id: "a", state: "unseen" });
    expect(normalizeInViewUnit(inView)).toEqual({ unit_id: "b", state: "unseen" });
    expect(normalizeInViewUnit(skipped)).toEqual({ unit_id: "c", state: "skipped" });
    expect(normalizeInViewUnit(completed)).toEqual({ unit_id: "d", state: "completed" });
  });
});

describe("rehydrateInViewUnit", () => {
  it("promotes only the first unseen unit to in_view without mutating the input", () => {
    const units: PlayerUnit[] = [
      { unit_id: "a", state: "completed" },
      { unit_id: "b", state: "unseen" },
      { unit_id: "c", state: "unseen" },
    ];

    const rehydrated = rehydrateInViewUnit(units);

    expect(rehydrated).toEqual([
      { unit_id: "a", state: "completed" },
      { unit_id: "b", state: "in_view" },
      { unit_id: "c", state: "unseen" },
    ]);
    expect(rehydrated).not.toBe(units);
    expect(units[1]).toEqual({ unit_id: "b", state: "unseen" });
  });

  it("returns an equivalent new array when every unit is completed or skipped", () => {
    const units: PlayerUnit[] = [
      { unit_id: "a", state: "completed" },
      { unit_id: "b", state: "skipped" },
    ];

    const rehydrated = rehydrateInViewUnit(units);

    expect(rehydrated).toEqual(units);
    expect(rehydrated).not.toBe(units);
  });

  it("leaves an already in_view unit unchanged when no unit is unseen", () => {
    const units: PlayerUnit[] = [
      { unit_id: "a", state: "completed" },
      { unit_id: "b", state: "in_view" },
    ];

    expect(rehydrateInViewUnit(units)).toEqual(units);
  });

  it("promotes an appended Terminal NEMAR unit when every primary unit is past-tense", () => {
    const units: PlayerUnit[] = [
      { unit_id: "primary-a", state: "completed" },
      { unit_id: "primary-b", state: "skipped" },
      { unit_id: "terminal-nemar", state: "unseen" },
    ];

    expect(rehydrateInViewUnit(units)).toEqual([
      { unit_id: "primary-a", state: "completed" },
      { unit_id: "primary-b", state: "skipped" },
      { unit_id: "terminal-nemar", state: "in_view" },
    ]);
  });
});
