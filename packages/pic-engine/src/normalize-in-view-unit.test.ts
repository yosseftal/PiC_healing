import { describe, expect, it } from "vitest";
import type { PlayerUnit } from "./types";
import { normalizeInViewUnit } from "./normalize-in-view-unit";

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
