import { useSyncExternalStore } from "react";
import { UTILITY_CONTROL } from "./control-affordance";
import { completionMessage } from "./completion-messages";
import type { CompletionPresentation } from "./completion-presentation";
import { LocalizedMessage } from "./i18n/localized-message";
import { useLocale } from "./i18n/locale-provider";
import { useInquiryResetControls } from "./inquiry-reset-controls";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

export function CompletionReturnScreen({ presentation }: { presentation: CompletionPresentation }) {
  const { locale } = useLocale();
  const controls = useInquiryResetControls();
  const snapshot = useSyncExternalStore(presentation.subscribe, presentation.getSnapshot);
  if (!snapshot.visible) return null;

  const title = completionMessage(locale, "title");
  const disabled = snapshot.busy || controls.busy || controls.confirmation;
  function returnToQuestionnaire() {
    if (snapshot.hasCurrentGroup) void presentation.returnToQuestionnaire();
    else {
      controls.setOpen(true);
      void controls.requestReset(false);
    }
  }

  return (
    <section data-testid="completion-return-screen">
      <TherapeuticScreenFrame title={title.text} stageLabel={title.text} tone="confirmation" allowInquiryReset>
        <TherapeuticContentCard aria-label={title.text}>
          <p><LocalizedMessage message={completionMessage(locale, "body")} /></p>
          <div className="grid gap-3" aria-busy={snapshot.busy}>
            <button className={UTILITY_CONTROL} type="button" data-testid="completion-return-questionnaire"
              disabled={disabled} onClick={returnToQuestionnaire}>
              <LocalizedMessage message={completionMessage(locale,
                snapshot.hasCurrentGroup ? "returnToGroup" : "startQuestionnaire")} />
            </button>
            <button className={UTILITY_CONTROL} type="button" data-testid="completion-choose-catalog"
              disabled={disabled} onClick={() => void presentation.chooseAnotherTreatment()}>
              <LocalizedMessage message={completionMessage(locale, "chooseTreatment")} />
            </button>
          </div>
        </TherapeuticContentCard>
      </TherapeuticScreenFrame>
    </section>
  );
}
