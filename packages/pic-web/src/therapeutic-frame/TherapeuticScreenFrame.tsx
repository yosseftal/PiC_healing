import { useAuthenticatedDraft } from "../session-engine-context";
import { Menu } from "lucide-react";
import { type ReactNode } from "react";
import { UTILITY_CONTROL } from "../control-affordance";
import { InquiryResetControls, useInquiryResetControls } from "../inquiry-reset-controls";
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
  const draft = useAuthenticatedDraft();
  const controls = useInquiryResetControls();
  const { open, setOpen, confirmation, busy, keepRef, resetRef, keepInquiry, requestReset } = controls;

  return (
    <TherapeuticFrame
      {...frameProps}
      quietStatus={<>{frameProps.quietStatus}{draft && draft.phase !== "anchored" ?
        <span role="status">{message("draft.unsaved").text}</span> : null}</>}
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
            <InquiryResetControls controls={controls} />
            {confirmation ? null : <>
              <LanguageSelector />
              {allowInquiryReset ? <button className={UTILITY_CONTROL} ref={resetRef} disabled={busy}
                type="button" onClick={() => void requestReset(false)}>
                <LocalizedMessage message={message("reset.newGroup")} />
              </button> : null}
              {busy ? null : utilities}
            </>}

          </div>
        </TherapeuticSheet>
      )}
    />
  );
}
