import { useEffect, useRef } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import { useInquiryReset } from "./inquiry-reset-context";
import { useInquiryUtilities } from "./inquiry-utilities-context";
import { LocalizedMessage } from "./i18n/localized-message";
import { useLocale } from "./i18n/locale-provider";

/** Shared Sheet/Gate confirmation: changing its surface never makes a therapeutic decision. */
export function useInquiryResetControls() {
  const { resetInquiry, uncertain } = useInquiryReset();
  const utilities = useInquiryUtilities();
  const { confirmation, setConfirmation, busy, setBusy, setRecovery, setOpen } = utilities;
  const confirmedRef = useRef(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (confirmation) keepRef.current?.focus(); }, [confirmation]);

  function keepInquiry(): void {
    if (busy) return;
    setConfirmation(false);
    setRecovery(false);
    confirmedRef.current = false;
    setTimeout(() => resetRef.current?.focus(), 0);
  }

  async function requestReset(confirmed: boolean): Promise<void> {
    if (busy) return;
    confirmedRef.current = confirmed;
    setBusy(true);
    setRecovery(false);
    try {
      const result = await resetInquiry(confirmed);
      if (result === "confirmation") setConfirmation(true);
      else setOpen(false);
    } catch {
      setRecovery(true);
    } finally {
      setBusy(false);
    }
  }
  return { ...utilities, uncertain, confirmedRef, keepRef, resetRef, keepInquiry, requestReset };
}

export function InquiryResetControls({ controls }: { controls: ReturnType<typeof useInquiryResetControls> }) {
  const { message } = useLocale();
  const { confirmation, busy, recovery, keepRef, keepInquiry, requestReset, confirmedRef, uncertain } = controls;
  return <>
    {confirmation ? <>
      <p><LocalizedMessage message={message(uncertain ? "reset.uncertainLoss" : "reset.loss")} /></p>
      <button className={UTILITY_CONTROL} ref={keepRef} disabled={busy} type="button" onClick={keepInquiry}>
        <LocalizedMessage message={message("reset.keep")} />
      </button>
      <button className={UTILITY_CONTROL} disabled={busy} type="button" onClick={() => void requestReset(true)}>
        <LocalizedMessage message={message("reset.discard")} />
      </button>
    </> : null}
    {busy ? <p role="status"><LocalizedMessage message={message("reset.pending")} /></p> : null}
    {recovery ? <div role="status">
      <p><LocalizedMessage message={message("reset.recovery")} /></p>
      <button className={UTILITY_CONTROL} type="button" onClick={() => void requestReset(confirmedRef.current)}>
        <LocalizedMessage message={message("reset.retry")} />
      </button>
    </div> : null}
  </>;
}
