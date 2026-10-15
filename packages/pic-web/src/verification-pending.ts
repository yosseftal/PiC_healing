import { validRecovery, type PromotionRecovery } from "./promotion-recovery";

/** Non-secret continuity only: Auth tokens remain exclusively owned by the installed SDK. */
export interface VerificationPending {
  email: string;
  name: string;
  generation: number;
  sessionId: string;
  kind: "finish" | "finishAnyway";
  frozen: Omit<PromotionRecovery, "owner"> | null;
}

function unverifiedFrozen(value: unknown): value is Omit<PromotionRecovery, "owner"> {
  return typeof value === "object" && value !== null && !("owner" in value) &&
    validRecovery({ ...value, owner: "unverified-intent" });
}

const KEY = "pic-web.verification-pending.v1";

export function readVerificationPending(): VerificationPending | null {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (typeof value !== "object" || value === null) return null;
    const record = value as Record<string, unknown>;
    if (typeof record.email !== "string" ||
      typeof record.name !== "string" || typeof record.sessionId !== "string" ||
      !Number.isSafeInteger(record.generation) || Number(record.generation) < 0 ||
      (record.kind !== "finish" && record.kind !== "finishAnyway") ||
      (record.frozen !== null && (!unverifiedFrozen(record.frozen) ||
        record.frozen.generation !== record.generation || record.frozen.kind !== record.kind ||
        record.frozen.snapshot.playerSession.id !== record.sessionId))) return null;
    return { email: record.email, name: record.name, sessionId: record.sessionId,
      generation: Number(record.generation), kind: record.kind, frozen: record.frozen };
  } catch { return null; }
}

export function saveVerificationPending(value: VerificationPending | null): void {
  if (value === null) localStorage.removeItem(KEY);
  else localStorage.setItem(KEY, JSON.stringify(value));
}
