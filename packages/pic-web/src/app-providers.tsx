/**
 * App-level provider nesting (Ticket 08-03): Session → Group → Player. `App.tsx` wraps its tree with this
 * component only — routing and screen shells remain in downstream tickets.
 */
import type { ReactNode } from "react";
import { CatalogProvider } from "./catalog-context";
import { GroupEngineProvider } from "./group-engine-context";
import { PlayerEngineProvider } from "./player-engine-context";
import { SessionEngineProvider } from "./session-engine-context";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionEngineProvider>
      <CatalogProvider>
        <GroupEngineProvider>
          <PlayerEngineProvider>{children}</PlayerEngineProvider>
        </GroupEngineProvider>
      </CatalogProvider>
    </SessionEngineProvider>
  );
}
