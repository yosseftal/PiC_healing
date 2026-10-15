import type { GuestSnapshot } from "pic-engine";

const KEY = "pic-web.promotion-recovery.v1";

/** Exact retry intent, owned by this browser. Authentication secrets never enter this envelope. */
export interface PromotionRecovery {
  generation: number;
  snapshot: GuestSnapshot;
  owner: string;
  kind: "finish" | "finishAnyway";
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function validRecovery(value: unknown): value is PromotionRecovery {
  if (!record(value) || typeof value.generation !== "number" || !Number.isSafeInteger(value.generation) ||
    value.generation < 0 || typeof value.owner !== "string" || value.owner.length === 0 ||
    (value.kind !== "finish" && value.kind !== "finishAnyway") || !record(value.snapshot)) return false;
  const { playerSession: session, group } = value.snapshot;
  if (!record(session) || typeof session.id !== "string" || typeof session.treatment_id !== "string" ||
    typeof session.success_declared !== "boolean" || !Array.isArray(session.units) ||
    !session.units.every((unit) => record(unit) && typeof unit.unit_id === "string" &&
      ["unseen", "in_view", "skipped", "completed"].includes(String(unit.state)))) return false;
  if (group === null) return session.linked_group_id === null;
  return record(group) && typeof group.id === "string" && group.id === session.linked_group_id &&
    typeof group.name === "string" && Array.isArray(group.symptoms) &&
    ["together", "split_suggested"].includes(String(group.joint_treatment_muscle_test)) &&
    typeof group.joint_treatment_test_at === "string";
}

export function readPromotionRecovery(): PromotionRecovery | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return validRecovery(value) ? value : null;
  } catch {
    // Unreadable data is retained; neither recovery nor the Guest draft is discarded at boot.
    return null;
  }
}

export function savePromotionRecovery(value: PromotionRecovery): void {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function clearPromotionRecovery(): void {
  localStorage.removeItem(KEY);
}
