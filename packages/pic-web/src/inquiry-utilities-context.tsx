import { inquiryGenerationStore } from "./inquiry-lifecycle";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

function useUtilitiesState() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recovery, setRecovery] = useState(false);
  return { open, setOpen, confirmation, setConfirmation, busy, setBusy, recovery, setRecovery };
}
const InquiryUtilitiesContext = createContext<ReturnType<typeof useUtilitiesState> | null>(null);

/** Keeps one controlled Sheet lifecycle across screen changes while an operation settles. */
export function InquiryUtilitiesProvider({ children }: { children: ReactNode }) {
  const state = useUtilitiesState();
  const { setOpen, setConfirmation } = state;
  useEffect(() => inquiryGenerationStore.subscribe(() => {
    setOpen(false);
    setConfirmation(false);
  }), [setOpen, setConfirmation]);
  return <InquiryUtilitiesContext.Provider value={state}>{children}</InquiryUtilitiesContext.Provider>;
}

export function useInquiryUtilities() {
  const localState = useUtilitiesState();
  return useContext(InquiryUtilitiesContext) ?? localState;
}
