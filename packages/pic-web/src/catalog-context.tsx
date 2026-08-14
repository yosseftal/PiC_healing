/**
 * Read-only catalog access (Ticket 08-07): the only way UI loads treatment lists without adapter imports.
 */
import { createContext, useContext, type ReactNode } from "react";
import { compositionRoot } from "./composition-root";

type CatalogActions = typeof compositionRoot.catalogActions;

const CatalogContext = createContext<CatalogActions | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  return <CatalogContext.Provider value={compositionRoot.catalogActions}>{children}</CatalogContext.Provider>;
}

function useCatalogContext(): CatalogActions {
  const value = useContext(CatalogContext);
  if (value === null) {
    throw new Error("Catalog hooks must be used within a CatalogProvider");
  }
  return value;
}

export function useCatalogActions(): CatalogActions {
  return useCatalogContext();
}
