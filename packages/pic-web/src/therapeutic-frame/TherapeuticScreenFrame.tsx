import { useInquiryUtilities } from "../inquiry-utilities-context";
import { Menu } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import { UTILITY_CONTROL } from "../control-affordance";
import { useInquiryReset } from "../inquiry-reset-context";
import { LanguageSelector } from "../i18n/language-selector";
import { useLocale } from "../i18n/locale-provider";
import { LocalizedMessage } from "../i18n/localized-message";
import { TherapeuticSheet } from "../therapeutic-sheet";
import { TherapeuticFrame, type TherapeuticFrameProps } from "./TherapeuticFrame";

export type TherapeuticScreenFrameProps = TherapeuticFrameProps & {
  utilityTrigger?: never;
  utilities?: ReactNode;
  allowInquiryReset?: boolean;
};

/** One viewport plus sovereign utilities. Reset is explicitly enabled only by integrated screens. */
export function TherapeuticScreenFrame({
  utilities, allowInquiryReset = false, ...frameProps
}: TherapeuticScreenFrameProps) {
  const { message } = useLocale();
  const { resetInquiry } = useInquiryReset();
  const { open, setOpen, confirmation, setConfirmation, busy, setBusy, recovery, setRecovery } = useInquiryUtilities();
  const confirmedRef = useRef(false);
  const keepRef = useRef<HTMLButtonElement>(null);
  const resetRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmation) keepRef.current?.focus();
  }, [confirmation]);

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

  return (
    <TherapeuticFrame
      {...frameProps}
      utilityTrigger={(
        <TherapeuticSheet
          open={open}
          onOpenAutoFocus={() => {
            if (!confirmation) return false;
            keepRef.current?.focus();
            return true;
          }}
          onOpenChange={(nextOpen) => {
            if (busy) return;
            if (!nextOpen && confirmation) keepInquiry();
            else setOpen(nextOpen);
          }}
          title={message(confirmation ? "reset.confirm" : "utilities.sessionTitle").text}
          triggerLabel={message("utilities.openSession").text}
          closeLabel={message("utilities.closeSession").text}
          contentLabel={message("utilities.sessionContent").text}
          trigger={<><Menu aria-hidden="true" size={20} /><LocalizedMessage message={message("utilities.trigger")} /></>}
        >
          <div className="grid gap-6" aria-busy={busy}>
            {confirmation ? <>
              <p><LocalizedMessage message={message("reset.loss")} /></p>
              <button className={UTILITY_CONTROL} ref={keepRef} disabled={busy} type="button" onClick={keepInquiry}>
                <LocalizedMessage message={message("reset.keep")} />
              </button>
              <button className={UTILITY_CONTROL} disabled={busy} type="button" onClick={() => void requestReset(true)}>
                <LocalizedMessage message={message("reset.discard")} />
              </button>
            </> : <>
              <LanguageSelector />
              {allowInquiryReset ? <button className={UTILITY_CONTROL} ref={resetRef} disabled={busy}
                type="button" onClick={() => void requestReset(false)}>
                <LocalizedMessage message={message("reset.newGroup")} />
              </button> : null}
              {busy ? null : utilities}
            </>}
            {busy ? <p role="status"><LocalizedMessage message={message("reset.pending")} /></p> : null}
            {recovery ? <div role="status">
              <p><LocalizedMessage message={message("reset.recovery")} /></p>
              <button className={UTILITY_CONTROL} type="button"
                onClick={() => void requestReset(confirmedRef.current)}>
                <LocalizedMessage message={message("reset.retry")} />
              </button>
            </div> : null}
          </div>
        </TherapeuticSheet>
      )}
    />
  );
}
