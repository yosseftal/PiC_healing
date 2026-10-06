import { useState } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import {
  usePromotePathActions,
  useSessionEngineActions,
  useSessionEngineState,
} from "./session-engine-context";

/**
 * Dumb-reflection Persistence Gate (Wave 8 ticket 08-02). Renders only when `SessionEngine` signals
 * `gateTriggered`; auth and retry delegate to composition-root `promotePathActions` — never direct adapter
 * imports. Ephemeral `preRpcPromotionFailed` covers sign-in/env failures before `SessionEngine.promote()`.
 */
export function PersistenceGateModal() {
  const { gateTriggered, promotionStatus } = useSessionEngineState();
  const { discardGuestState } = useSessionEngineActions();
  const { promoteGuestSessionFromEnv } = usePromotePathActions();
  const [preRpcPromotionFailed, setPreRpcPromotionFailed] = useState(false);

  if (!gateTriggered) {
    return null;
  }

  const showFailedUi = promotionStatus === "failed" || preRpcPromotionFailed;
  const showIdleUi = promotionStatus === "idle" && !preRpcPromotionFailed;

  function anchorSession(): void {
    setPreRpcPromotionFailed(false);
    void promoteGuestSessionFromEnv(import.meta.env as Record<string, string | undefined>).catch(() => {
      setPreRpcPromotionFailed(true);
    });
  }

  return (
    <dialog open aria-labelledby="persistence-gate-title" tabIndex={-1}
      className={[
        "fixed inset-0 z-50 m-auto grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[28rem]",
        "gap-3 overflow-y-auto rounded-pic-card border border-pic-quiet bg-pic-surface p-6 shadow-pic-sheet",
      ].join(" ")}
    >
      <h2 className="text-pic-heading font-pic-heading leading-pic-heading" id="persistence-gate-title">
        Keep your session
      </h2>

      {promotionStatus === "pending" ? (
        <p>Anchoring your session…</p>
      ) : null}

      {showIdleUi ? (
        <>
          <p>Sign in to keep this session — your work stays on this device until you choose to anchor it.</p>
          <button className={UTILITY_CONTROL} type="button" onClick={anchorSession}>
            Sign in (dev tracer stub)
          </button>
          <button className={UTILITY_CONTROL} type="button" disabled aria-disabled="true">
            Sign in with Apple (stub)
          </button>
          <button className={UTILITY_CONTROL} type="button" disabled aria-disabled="true">
            Sign in with Google (stub)
          </button>
        </>
      ) : null}

      {showFailedUi ? (
        <>
          <p>We could not anchor your session yet. You can try again whenever you are ready.</p>
          <button className={UTILITY_CONTROL} type="button" onClick={anchorSession}>
            Try again
          </button>
        </>
      ) : null}

      {showIdleUi || showFailedUi ? (
        <button className={UTILITY_CONTROL} type="button" onClick={() => void discardGuestState()}>
          Continue without saving
        </button>
      ) : null}
    </dialog>
  );
}
