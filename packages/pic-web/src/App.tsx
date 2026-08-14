import { AppProviders } from "./app-providers";
import { GuestModeShell } from "./GuestModeShell";

/**
 * The app's root component (ticket 14). No routing library and no screens yet - ticket 14's own scope only
 * calls for "a placeholder route/page (e.g. a stub <div>)"; tickets 16-19 build the real screens and
 * whatever routing they need on top of this shell.
 */
export function App() {
  return (
    <AppProviders>
      <GuestModeShell>
        <main>
          <h1>PiC</h1>
          <p>Guest Mode is active. Screens land in later tickets.</p>
        </main>
      </GuestModeShell>
    </AppProviders>
  );
}
