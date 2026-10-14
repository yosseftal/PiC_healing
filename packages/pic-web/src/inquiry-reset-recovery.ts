import type { GuestSessionGateState, PlayerSession, SymptomGroup } from "pic-engine";
import type { PersistedGuestFlowFacts } from "./guest-flow-facts";

const KEY = "pic-web.inquiry-reset-recovery.v1";

/** Web recovery only: retains local work until every fallible discard step has completed. */
export interface InquiryResetRecovery {
  gate: GuestSessionGateState;
  facts: PersistedGuestFlowFacts;
  group: SymptomGroup | null;
  playerSession: PlayerSession | null;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function validRecovery(value: unknown): value is InquiryResetRecovery {
  if (!record(value) || !record(value.gate) || !record(value.facts)) return false;
  const pending = value.gate.pendingFinishRequest;
  if (value.gate.gateTriggered !== true || !record(pending) || typeof pending.sessionId !== "string" ||
    (pending.kind !== "finish" && pending.kind !== "finishAnyway")) return false;
  const facts = value.facts;
  if (![facts.activeGroupId, facts.activePlayerSessionId].every((id) => id === null || typeof id === "string")) {
    return false;
  }
  if (![facts.symptomAdditionComplete, facts.groupFinalized, facts.summaryAcknowledged]
    .every((flag) => typeof flag === "boolean")) return false;
  return (value.group === null || (record(value.group) && typeof value.group.id === "string")) &&
    (value.playerSession === null || (record(value.playerSession) && typeof value.playerSession.id === "string" &&
      Array.isArray(value.playerSession.units)));
}

export function readInquiryResetRecovery(): InquiryResetRecovery | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return validRecovery(value) ? value : null;
  } catch {
    return null;
  }
}

export function saveInquiryResetRecovery(value: InquiryResetRecovery): void {
  localStorage.setItem(KEY, JSON.stringify(value));
}

export function clearInquiryResetRecovery(): void {
  localStorage.removeItem(KEY);
}
