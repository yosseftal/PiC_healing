import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import { UTILITY_CONTROL } from "./control-affordance";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

export function QuestionnairePreparation() {
  const { message } = useLocale();
  const { actions, state } = useQuestionnaireNavigation();
  return <section data-testid="questionnaire-preparation">
    <TherapeuticScreenFrame allowInquiryReset questionnaireLocation="preparation"
      title={message("group.title").text} stageLabel={message("group.stage").text}>
      <div className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
        <TherapeuticContentCard aria-label={message("questionnaire.preparationTitle").text}>
          <h2>{message("questionnaire.preparationTitle").text}</h2>
          <p><LocalizedMessage message={message("questionnaire.preparationList")} /></p>
          <p><LocalizedMessage message={message("questionnaire.preparationPriority")} /></p>
          <p><LocalizedMessage message={message("questionnaire.preparationRating")} /></p>
        </TherapeuticContentCard>
        <button type="button" className={UTILITY_CONTROL} disabled={state.waiting}
          onClick={() => void actions.go(state.returnLocation, "forward")}>
          {message("navigation.return").text}
        </button>
      </div>
    </TherapeuticScreenFrame>
  </section>;
}
