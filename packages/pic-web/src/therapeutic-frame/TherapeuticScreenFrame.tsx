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
import { IdentityDrawerStatus } from "../identity-drawer-status";
import { useQuestionnaireNavigation } from "../questionnaire-navigation-context";
import type { QuestionnaireLocation } from "../questionnaire-navigation";
import { useQuestionnaireDraftState } from "../group-engine-context";

export type TherapeuticScreenFrameProps = TherapeuticFrameProps & {
  utilityTrigger?: never;
  utilities?: ReactNode;
  allowInquiryReset?: boolean;
  questionnaireLocation?: QuestionnaireLocation;
  questionnaireContinue?: () => void;
};

/** One viewport plus sovereign utilities. Reset is explicitly enabled only by integrated screens. */
export function TherapeuticScreenFrame({
  utilities, allowInquiryReset = false, questionnaireLocation, questionnaireContinue, ...frameProps
}: TherapeuticScreenFrameProps) {
  const { message } = useLocale();
  const draft = useAuthenticatedDraft();
  const navigation = useQuestionnaireNavigation();
  const questionnaire = useQuestionnaireDraftState();
  const controls = useInquiryResetControls();
  const { open, setOpen, confirmation, busy, keepRef, resetRef, keepInquiry, requestReset } = controls;

  return (
    <TherapeuticFrame
      {...frameProps}
      navigation={questionnaireLocation ? <div className="flex flex-wrap gap-2"><button className={UTILITY_CONTROL} type="button"
        data-testid="questionnaire-back" disabled={navigation.state.waiting || busy || confirmation}
        onClick={() => void navigation.actions.back(questionnaireLocation)}>{message("navigation.back").text}</button>
        {questionnaireContinue ? <button className={UTILITY_CONTROL} type="button"
          disabled={navigation.state.waiting || busy || confirmation} onClick={questionnaireContinue}>
          {message("navigation.continue").text}</button> : null}</div> : null}
      quietStatus={<>{frameProps.quietStatus}{draft && draft.phase !== "anchored" ?
        <span role="status">{message("draft.unsaved").text}</span> : null}
        {questionnaireLocation && (navigation.state.waiting || navigation.state.recovery) ?
          <span role="status">{message(navigation.state.waiting ? "navigation.waiting" : "navigation.recovery").text}</span>
          : null}</>}
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
            <IdentityDrawerStatus />
            <InquiryResetControls controls={controls} />
            {confirmation ? null : <>
              <LanguageSelector />
              {questionnaireLocation && questionnaireLocation !== "preparation" ?
                <button className={UTILITY_CONTROL} type="button" disabled={navigation.state.waiting}
                  onClick={() => void navigation.actions.preparation(questionnaireLocation).then((opened) => {
                    if (opened) setOpen(false);
                  })}>{message("navigation.preparation").text}</button> : null}
              {questionnaireLocation ? <p role="status">{message(questionnaire.storageUnavailable ?
                "navigation.storageUnavailable" : "navigation.reloadLimit").text}</p> : null}
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
