import {
  usePromotePathActions,
  useSessionEngineActions,
  useSessionEngineState,
} from "./session-engine-context";

/**
 * Dumb-reflection Persistence Gate (Wave 8 ticket 08-02). Renders only when `SessionEngine` signals
 * `gateTriggered`; auth and retry delegate to composition-root `promotePathActions` — never direct adapter
 * imports. Holds zero local state for engine-derivable fields (DEC-017).
 */
export function PersistenceGateModal() {
  const { gateTriggered, promotionStatus } = useSessionEngineState();
  const { discardGuestState } = useSessionEngineActions();
  const { promoteGuestSessionFromEnv } = usePromotePathActions();

  if (!gateTriggered) {
    return null;
  }

  function anchorSession(): void {
    void promoteGuestSessionFromEnv(import.meta.env as Record<string, string | undefined>);
  }

  return (
    <dialog open aria-labelledby="persistence-gate-title">
      <h2 id="persistence-gate-title">Keep your session</h2>

      {promotionStatus === "pending" ? (
        <p>Anchoring your session…</p>
      ) : null}

      {promotionStatus === "idle" ? (
        <>
          <p>Sign in to keep this session — your work stays on this device until you choose to anchor it.</p>
          <button type="button" onClick={anchorSession}>
            Sign in (dev tracer stub)
          </button>
          <button type="button" disabled aria-disabled="true">
            Sign in with Apple (stub)
          </button>
          <button type="button" disabled aria-disabled="true">
            Sign in with Google (stub)
          </button>
        </>
      ) : null}

      {promotionStatus === "failed" ? (
        <>
          <p>We could not anchor your session yet. You can try again whenever you are ready.</p>
          <button type="button" onClick={anchorSession}>
            Try again
          </button>
        </>
      ) : null}

      {promotionStatus === "idle" || promotionStatus === "failed" ? (
        <button type="button" onClick={() => void discardGuestState()}>
          Continue without saving
        </button>
      ) : null}
    </dialog>
  );
}
