import type { ReactNode } from "react";
import { PersistenceGateModal } from "./PersistenceGateModal";

/**
 * Mounts below `SessionEngineProvider` (see `App.tsx`). Renders its children plus a mount point for
 * `PersistenceGateModal` (ticket 15 fills in the modal's actual contents) - contains zero conditionals of
 * its own; `PersistenceGateModal` alone decides whether it renders anything, by reading `SessionEngine`
 * state itself.
 */
export function GuestModeShell({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <PersistenceGateModal />
    </>
  );
}
