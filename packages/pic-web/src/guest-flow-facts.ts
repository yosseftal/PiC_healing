/**
 * Composition-layer guest flow facts (Ticket 08-04): engine-derived screen pointers maintained outside React
 * components. `deriveGuestFlowScreen` is pure; `guestFlowStore` notifies subscribers when facts change.
 */
import type { SessionState } from "pic-engine";
import { resetGroupFlowFactsForTest } from "./composition-root";

export type GuestFlowScreen =
  | "create-group"
  | "joint-treatment"
  | "group-summary"
  | "pick-treatment"
  | "player";

export interface GuestFlowFacts {
  activeGroupId: string | null;
  activePlayerSessionId: string | null;
  sessionState: SessionState;
  /** True once the EM finishes the symptom-addition phase (Ticket 08-05). */
  symptomAdditionComplete: boolean;
  groupFinalized: boolean;
  /** True once the EM confirms the read-only group summary (Ticket 08-06). */
  summaryAcknowledged: boolean;
}

export function deriveGuestFlowScreen(facts: GuestFlowFacts): GuestFlowScreen {
  if (facts.activePlayerSessionId !== null) {
    return "player";
  }
  if (facts.activeGroupId === null || !facts.symptomAdditionComplete) {
    return "create-group";
  }
  if (!facts.groupFinalized) {
    return "joint-treatment";
  }
  if (!facts.summaryAcknowledged) {
    return "group-summary";
  }
  return "pick-treatment";
}

function createExternalStore<TState>(getState: () => TState) {
  const listeners = new Set<() => void>();
  let cachedSnapshot = getState();

  return {
    getSnapshot(): TState {
      return cachedSnapshot;
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    notify(): void {
      cachedSnapshot = getState();
      for (const listener of listeners) {
        listener();
      }
    },
  };
}

let getActiveGroupId: () => string | null = () => null;
let getSessionState: () => SessionState = () => ({
  mode: "guest",
  gateTriggered: false,
  promotionStatus: "idle",
});

let activePlayerSessionId: string | null = null;
let symptomAdditionComplete = false;
let groupFinalized = false;
let summaryAcknowledged = false;

function collectGuestFlowFacts(): GuestFlowFacts {
  return {
    activeGroupId: getActiveGroupId(),
    activePlayerSessionId,
    sessionState: getSessionState(),
    symptomAdditionComplete,
    groupFinalized,
    summaryAcknowledged,
  };
}

function notifyGuestFlowStores(): void {
  guestFlowFactsStore.notify();
  guestFlowStore.notify();
}

export const guestFlowFactsStore = createExternalStore(collectGuestFlowFacts);

export const guestFlowStore = createExternalStore(() => deriveGuestFlowScreen(collectGuestFlowFacts()));

/** Wires upstream composition-root stores without creating a static import cycle. */
export function initGuestFlowFacts(deps: {
  getActiveGroupId: () => string | null;
  getSessionState: () => SessionState;
  subscribeToGroup: (listener: () => void) => () => void;
  subscribeToSession: (listener: () => void) => () => void;
}): void {
  getActiveGroupId = deps.getActiveGroupId;
  getSessionState = deps.getSessionState;
  deps.subscribeToGroup(() => notifyGuestFlowStores());
  deps.subscribeToSession(() => notifyGuestFlowStores());
  notifyGuestFlowStores();
}

/** Stable seam for wrapped engine actions (Ticket 08-03+) to refresh derived screens after mutations. */
export function notifyGuestFlowFacts(): void {
  notifyGuestFlowStores();
}

export function setGuestFlowPlayerSession(sessionId: string | null): void {
  activePlayerSessionId = sessionId;
  notifyGuestFlowStores();
}

export function setGuestFlowGroupFinalized(finalized: boolean): void {
  groupFinalized = finalized;
  notifyGuestFlowStores();
}

export function setGuestFlowSymptomAdditionComplete(complete: boolean): void {
  symptomAdditionComplete = complete;
  notifyGuestFlowStores();
}

export function setGuestFlowSummaryAcknowledged(acknowledged: boolean): void {
  summaryAcknowledged = acknowledged;
  notifyGuestFlowStores();
}

export function resetGuestFlowFactsForTest(): void {
  activePlayerSessionId = null;
  symptomAdditionComplete = false;
  groupFinalized = false;
  summaryAcknowledged = false;
  resetGroupFlowFactsForTest();
  notifyGuestFlowStores();
}
