/**
 * React hook boundary (Ticket 08-04) for derived guest flow screens — reads composition-layer facts only.
 */
import { useSyncExternalStore } from "react";
import { guestFlowFactsStore, guestFlowStore, type GuestFlowFacts, type GuestFlowScreen } from "./guest-flow-facts";

/** Returns the active guest flow screen derived from composition-layer facts. */
export function useGuestFlowScreen(): GuestFlowScreen {
  return useSyncExternalStore(guestFlowStore.subscribe, guestFlowStore.getSnapshot);
}

/** Composition-layer guest flow facts for screens that gate on non-screen fields (Ticket 08-06). */
export function useGuestFlowFacts(): GuestFlowFacts {
  return useSyncExternalStore(guestFlowFactsStore.subscribe, guestFlowFactsStore.getSnapshot);
}
