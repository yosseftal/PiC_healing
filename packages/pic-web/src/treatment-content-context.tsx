/**
 * Parsed treatment content access (Wave 9): the only way UI resolves Structured Markdown without adapter
 * imports or duplicating engine state.
 */
import { createContext, useContext, type ReactNode } from "react";
import { compositionRoot } from "./composition-root";

type TreatmentContentActions = typeof compositionRoot.treatmentContentActions;

const TreatmentContentContext = createContext<TreatmentContentActions | null>(null);

export function TreatmentContentProvider({ children }: { children: ReactNode }) {
  return (
    <TreatmentContentContext.Provider value={compositionRoot.treatmentContentActions}>
      {children}
    </TreatmentContentContext.Provider>
  );
}

function useTreatmentContentContext(): TreatmentContentActions {
  const value = useContext(TreatmentContentContext);
  if (value === null) {
    throw new Error("Treatment content hooks must be used within a TreatmentContentProvider");
  }
  return value;
}

export function useTreatmentContentActions(): TreatmentContentActions {
  return useTreatmentContentContext();
}
