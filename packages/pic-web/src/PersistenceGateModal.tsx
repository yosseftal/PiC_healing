import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import { InquiryResetControls, useInquiryResetControls } from "./inquiry-reset-controls";
import { useLocale } from "./i18n/locale-provider";
import {
  usePromotePathActions,
  useSessionEngineState,
} from "./session-engine-context";

/**
 * Dumb-reflection Persistence Gate (Wave 8 ticket 08-02). Renders only when `SessionEngine` signals
 * `gateTriggered`; auth and retry delegate to composition-root `promotePathActions` — never direct adapter
 * imports. Ephemeral `preRpcPromotionFailed` covers sign-in/env failures before `SessionEngine.promote()`.
 */
export function PersistenceGateModal() {
  const { locale, direction, message } = useLocale();
  const state = useSessionEngineState();
  const { gateTriggered, promotionStatus } = state;
  const controls = useInquiryResetControls();
  const { confirmation, busy, open: utilitiesOpen, handoffPending, keepInquiry, requestReset, resetRef } = controls;
  const { promoteGuestSessionFromEnv } = usePromotePathActions();
  const [preRpcPromotionFailed, setPreRpcPromotionFailed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => { setDismissed(false); }, [state]);

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
    <Dialog.Root open={!dismissed && !utilitiesOpen && !handoffPending} onOpenChange={(open) => {
      if (busy || promotionStatus === "pending") return;
      if (!open && confirmation) keepInquiry();
      else setDismissed(!open);
    }}>
    <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 z-50 bg-pic-ink/30" data-testid="persistence-gate-overlay" />
    <Dialog.Content asChild aria-describedby={undefined} onOpenAutoFocus={(event) => {
      event.preventDefault();
      (controls.keepRef.current ?? dialogRef.current)?.focus();
    }} onCloseAutoFocus={(event) => {
      event.preventDefault();
      const target = document.querySelector<HTMLElement>('[data-testid="finish-button"]') ??
        document.querySelector<HTMLElement>('[data-testid="guest-flow-player"] header button');
      target?.focus();
    }}>
    <dialog open ref={dialogRef} aria-labelledby="persistence-gate-title" tabIndex={-1} lang={locale} dir={direction}
      aria-busy={busy}
      className={[
        "fixed inset-0 z-50 m-auto grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[28rem]",
        "gap-3 overflow-y-auto rounded-pic-card border border-pic-quiet bg-pic-surface p-6 shadow-pic-sheet",
      ].join(" ")}
    >
      <Dialog.Title asChild>
        <h2 className="text-pic-heading font-pic-heading leading-pic-heading" id="persistence-gate-title">
          {message(confirmation ? "reset.confirm" : "gate.title").text}
        </h2>
      </Dialog.Title>

      <InquiryResetControls controls={controls} />
      {confirmation ? null : <>

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
        <button className={UTILITY_CONTROL} ref={resetRef} disabled={busy} type="button"
          onClick={() => void requestReset(false)}>
          {message("gate.continueWithoutSaving").text}
        </button>
      ) : null}
      </>}
    </dialog>
    </Dialog.Content>
    </Dialog.Portal>
    </Dialog.Root>
  );
}
