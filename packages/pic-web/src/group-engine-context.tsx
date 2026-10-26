/**
 * React Context boundary (Ticket 08-03) for `GroupEngine`: screens reach the composition-root-constructed
 * engine's actions and optional flow facts via hooks — never via a direct adapter import.
 */
import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { inquiryGenerationStore } from "./inquiry-lifecycle";
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

export function useQuestionnaire() {
  useGroupEngineContext();
  const { questionnaire } = compositionRoot;
  const state = useQuestionnaireDraftState();
  const generation = useSyncExternalStore(inquiryGenerationStore.subscribe, inquiryGenerationStore.getSnapshot);
  const identity = useSyncExternalStore(compositionRoot.authStore.subscribe, compositionRoot.authStore.getSnapshot);
  const provider = compositionRoot.repositoryPort.getProvider();
  const actions = useMemo(() => questionnaire.actionsFor(generation),
    [generation, questionnaire, provider, identity.owner, identity.status, identity.revision]);
  return { state, actions };
}

/** Frame chrome may read draft retention status without admitting engine actions. */
export function useQuestionnaireDraftState() {
  const { store } = compositionRoot.questionnaire;
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export function useSummaryPriority() {
  useGroupEngineContext();
  const { summaryPriority } = compositionRoot;
  const state = useSyncExternalStore(summaryPriority.store.subscribe, summaryPriority.store.getSnapshot);
  const generation = useSyncExternalStore(inquiryGenerationStore.subscribe, inquiryGenerationStore.getSnapshot);
  const identity = useSyncExternalStore(compositionRoot.authStore.subscribe, compositionRoot.authStore.getSnapshot);
  const provider = compositionRoot.repositoryPort.getProvider();
  const actions = useMemo(() => summaryPriority.actionsFor(generation),
    [generation, summaryPriority, provider, identity.owner, identity.status, identity.revision]);
  return { state, actions };
}
