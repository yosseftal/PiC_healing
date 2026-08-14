import type { PlayerUnit } from "./types";

/**
 * DEC-015 Persistence Boundary Normalization: `in_view` is ephemeral and must never cross into a permanent
 * store still labeled `in_view`. Any `RepositoryPort` adapter, and `SessionEngine` at the guest-to-account
 * promotion crossing, applies this identical mapping on read and/or write.
 *
 * Maps to `unseen`, never `skipped`: the boundary cannot know whether a given `in_view` unit was `unseen`
 * or `skipped` immediately before its most recent render, and under-stating "reached" is the safe failure
 * mode here — it never fabricates a Navigation-Tree skip that did not structurally happen.
 */
export function normalizeInViewUnit(unit: PlayerUnit): PlayerUnit {
  return unit.state === "in_view" ? { ...unit, state: "unseen" } : unit;
}
