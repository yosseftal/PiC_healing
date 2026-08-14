/**
 * Composition-layer guest flow facts (Ticket 08-04): engine-derived screen pointers maintained outside React
 * components. `deriveGuestFlowScreen` is pure; `guestFlowStore` notifies subscribers when facts change.
 */
import type { SessionState } from "pic-engine";
import { compositionRoot, resetGroupFlowFactsForTest } from "./composition-root";

export type GuestFlowScreen = "create-group" | "joint-treatment" | "pick-treatment" | "player";

export interface GuestFlowFacts {
  activeGroupId: string | null;
  activePlayerSessionId: string | null;
  sessionState: SessionState;
  groupFinalized: boolean;
}

export function deriveGuestFlowScreen(facts: GuestFlowFacts): GuestFlowScreen {
  if (facts.activePlayerSessionId !== null) {
    return "player";
  }
  if (facts.activeGroupId === null) {
    return "create-group";
  }
  if (!facts.groupFinalized) {
    return "joint-treatment";
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
let groupFinalized = false;

function collectGuestFlowFacts(): GuestFlowFacts {
  return {
    activeGroupId: getActiveGroupId(),
    activePlayerSessionId,
    sessionState: getSessionState(),
    groupFinalized,
  };
}

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
  deps.subscribeToGroup(() => guestFlowStore.notify());
  deps.subscribeToSession(() => guestFlowStore.notify());
  guestFlowStore.notify();
}

/** Stable seam for wrapped engine actions (Ticket 08-03+) to refresh derived screens after mutations. */
export function notifyGuestFlowFacts(): void {
  guestFlowStore.notify();
}

export function setGuestFlowPlayerSession(sessionId: string | null): void {
  activePlayerSessionId = sessionId;
  guestFlowStore.notify();
}

export function setGuestFlowGroupFinalized(finalized: boolean): void {
  groupFinalized = finalized;
  guestFlowStore.notify();
}

export function resetGuestFlowFactsForTest(): void {
  activePlayerSessionId = null;
  groupFinalized = false;
  resetGroupFlowFactsForTest();
  guestFlowStore.notify();
}

/**
 * Test-only flow transitions until Tickets 08-05–08 wire real screens to engine actions.
 * TODO(08-05+): remove once each step updates facts via wrapped engine actions only.
 */
export async function advanceGuestFlowForTest(screen: GuestFlowScreen): Promise<void> {
  switch (screen) {
    case "create-group":
      resetGuestFlowFactsForTest();
      break;
    case "joint-treatment":
      resetGuestFlowFactsForTest();
      await compositionRoot.groupEngineActions.createDraftGroup("test-group");
      break;
    case "pick-treatment":
      resetGuestFlowFactsForTest();
      await compositionRoot.groupEngineActions.createDraftGroup("test-group");
      setGuestFlowGroupFinalized(true);
      break;
    case "player":
      resetGuestFlowFactsForTest();
      await compositionRoot.groupEngineActions.createDraftGroup("test-group");
      setGuestFlowGroupFinalized(true);
      setGuestFlowPlayerSession("test-player-session");
      break;
  }
}
