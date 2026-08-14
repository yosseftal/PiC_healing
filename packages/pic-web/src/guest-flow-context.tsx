/**
 * React hook boundary (Ticket 08-04) for derived guest flow screens — reads composition-layer facts only.
 */
import { useSyncExternalStore } from "react";
import { guestFlowStore, type GuestFlowScreen } from "./guest-flow-facts";

/** Returns the active guest flow screen derived from composition-layer facts. */
export function useGuestFlowScreen(): GuestFlowScreen {
  return useSyncExternalStore(guestFlowStore.subscribe, guestFlowStore.getSnapshot);
}
