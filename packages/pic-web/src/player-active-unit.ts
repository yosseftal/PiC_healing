/**
 * Infers the active Atomic Unit when `in_view` was normalized away by guest persistence (DEC-015).
 */
import type { PlayerUnit } from "pic-engine";

export function findActiveUnit(units: PlayerUnit[]): PlayerUnit | undefined {
  const inView = units.find((unit) => unit.state === "in_view");
  if (inView !== undefined) {
    return inView;
  }
  return units.find((unit) => unit.state !== "completed" && unit.state !== "skipped");
}
