/**
 * React Context boundary (Ticket 08-03) for `PlayerEngine`: session reads use `useSyncExternalStore` over a
 * composition-root cache refreshed after each wrapped mutation; reads delegate to `repositoryPort` — never
 * to an adapter import in this file.
 */
import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { PlayerSession } from "pic-engine";
import { compositionRoot } from "./composition-root";

type PlayerEngineActions = typeof compositionRoot.playerEngineActions;

interface PlayerEngineContextValue {
  actions: PlayerEngineActions;
}

const PlayerEngineContext = createContext<PlayerEngineContextValue | null>(null);

/** Nests inside `GroupEngineProvider` (see `app-providers.tsx`). */
export function PlayerEngineProvider({ children }: { children: ReactNode }) {
  const value: PlayerEngineContextValue = {
    actions: compositionRoot.playerEngineActions,
  };
  return <PlayerEngineContext.Provider value={value}>{children}</PlayerEngineContext.Provider>;
}

function usePlayerEngineContext(): PlayerEngineContextValue {
  const value = useContext(PlayerEngineContext);
  if (value === null) {
    throw new Error("PlayerEngine hooks must be used within a PlayerEngineProvider");
  }
  return value;
}

/** Dumb-reflection read hook: returns the cached player session snapshot for `sessionId`. */
export function usePlayerSession(sessionId: string): PlayerSession | null {
  usePlayerEngineContext();
  const store = compositionRoot.playerSessionStore;
  return useSyncExternalStore(store.subscribe, () => store.getSnapshot(sessionId));
}

/** The only way any component may trigger a `PlayerEngine` mutation. */
export function usePlayerEngineActions(): PlayerEngineActions {
  return usePlayerEngineContext().actions;
}
