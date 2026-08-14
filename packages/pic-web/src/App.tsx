import { AppProviders } from "./app-providers";
import { GuestFlowRouter } from "./guest-flow-router";
import { GuestModeShell } from "./GuestModeShell";

/** App root (Ticket 08-04): providers → guest shell → engine-derived flow router. */
export function App() {
  return (
    <AppProviders>
      <GuestModeShell>
        <GuestFlowRouter />
      </GuestModeShell>
    </AppProviders>
  );
}
