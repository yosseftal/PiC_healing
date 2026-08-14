/**
 * React Context boundary (Ticket 08-03) for `GroupEngine`: screens reach the composition-root-constructed
 * engine's actions and optional flow facts via hooks — never via a direct adapter import.
 */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { compositionRoot } from "./composition-root";

type GroupEngineActions = typeof compositionRoot.groupEngineActions;
type GroupEngineFlowState = ReturnType<typeof compositionRoot.groupEngineStore.getSnapshot>;

interface GroupEngineContextValue {
  actions: GroupEngineActions;
}

const GroupEngineContext = createContext<GroupEngineContextValue | null>(null);

/** Nests inside `SessionEngineProvider` (see `app-providers.tsx`). */
export function GroupEngineProvider({ children }: { children: ReactNode }) {
  const value: GroupEngineContextValue = {
    actions: compositionRoot.groupEngineActions,
  };
  return <GroupEngineContext.Provider value={value}>{children}</GroupEngineContext.Provider>;
}

function useGroupEngineContext(): GroupEngineContextValue {
  const value = useContext(GroupEngineContext);
  if (value === null) {
    throw new Error("GroupEngine hooks must be used within a GroupEngineProvider");
  }
  return value;
}

/** Optional flow facts maintained by wrapped group actions (e.g. `activeGroupId`), not business rules. */
export function useGroupEngineState(): GroupEngineFlowState {
  useGroupEngineContext();
  const { subscribe, getSnapshot } = compositionRoot.groupEngineStore;
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** The only way any component may trigger a `GroupEngine` mutation. */
export function useGroupEngineActions(): GroupEngineActions {
  return useGroupEngineContext().actions;
}
