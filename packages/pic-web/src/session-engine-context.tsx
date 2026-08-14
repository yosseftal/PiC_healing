/**
 * React Context boundary (ticket 14) between `./composition-root.ts` and every screen/component: this is
 * how the tree reaches the one composition-root-constructed `SessionEngine`'s state and actions "with no
 * prop-drilling required, but no adapter import outside this one composition point" (ticket 14 DoD).
 */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { SessionState } from "pic-engine";
import { compositionRoot } from "./composition-root";

type SessionEngineActions = typeof compositionRoot.sessionEngineActions;
type PromotePathActions = typeof compositionRoot.promotePathActions;

interface SessionEngineContextValue {
  actions: SessionEngineActions;
  promotePathActions: PromotePathActions;
}

const SessionEngineContext = createContext<SessionEngineContextValue | null>(null);

/** Wraps the whole app once, at the top (see `App.tsx`) - never re-constructed by a re-render. */
export function SessionEngineProvider({ children }: { children: ReactNode }) {
  const value: SessionEngineContextValue = {
    actions: compositionRoot.sessionEngineActions,
    promotePathActions: compositionRoot.promotePathActions,
  };
  return <SessionEngineContext.Provider value={value}>{children}</SessionEngineContext.Provider>;
}

function useSessionEngineContext(): SessionEngineContextValue {
  const value = useContext(SessionEngineContext);
  if (value === null) {
    throw new Error("SessionEngine hooks must be used within a SessionEngineProvider");
  }
  return value;
}

/**
 * The Dumb Reflection read hook (ticket 14): the only way any component reads `SessionEngine` state.
 * Every conditional a component renders should be a direct read of this hook's return value, never a
 * re-derivation of it.
 */
export function useSessionEngineState(): SessionState {
  useSessionEngineContext(); // enforces the provider boundary even though the store itself is module-scoped
  const { subscribe, getSnapshot } = compositionRoot.sessionEngineStore;
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** The only way any component may trigger a `SessionEngine` mutation. */
export function useSessionEngineActions(): SessionEngineActions {
  return useSessionEngineContext().actions;
}

/** Promote-path actions from the composition root (Wave 8 ticket 08-01). */
export function usePromotePathActions(): PromotePathActions {
  return useSessionEngineContext().promotePathActions;
}
