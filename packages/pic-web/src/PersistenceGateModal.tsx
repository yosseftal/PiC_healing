import { useState } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
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
  const { locale, direction, message } = useLocale();
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
    <dialog open aria-labelledby="persistence-gate-title" tabIndex={-1} lang={locale} dir={direction}
      className={[
        "fixed inset-0 z-50 m-auto grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[28rem]",
        "gap-3 overflow-y-auto rounded-pic-card border border-pic-quiet bg-pic-surface p-6 shadow-pic-sheet",
      ].join(" ")}
    >
      <h2 className="text-pic-heading font-pic-heading leading-pic-heading" id="persistence-gate-title">
        {message("gate.title").text}
      </h2>

      {promotionStatus === "pending" ? (
        <p>{message("gate.pending").text}</p>
      ) : null}

      {showIdleUi ? (
        <>
          <p>{message("gate.body").text}</p>
          <button className={UTILITY_CONTROL} type="button" onClick={anchorSession}>
            {message("gate.signInDev").text}
          </button>
          <button className={UTILITY_CONTROL} type="button" disabled aria-disabled="true">
            {message("gate.signInApple").text}
          </button>
          <button className={UTILITY_CONTROL} type="button" disabled aria-disabled="true">
            {message("gate.signInGoogle").text}
          </button>
        </>
      ) : null}

      {showFailedUi ? (
        <>
          <p>{message("gate.recovery").text}</p>
          <button className={UTILITY_CONTROL} type="button" onClick={anchorSession}>
            {message("gate.retry").text}
          </button>
        </>
      ) : null}

      {showIdleUi || showFailedUi ? (
        <button className={UTILITY_CONTROL} type="button" onClick={() => void discardGuestState()}>
          {message("gate.continueWithoutSaving").text}
        </button>
      ) : null}
    </dialog>
  );
}
