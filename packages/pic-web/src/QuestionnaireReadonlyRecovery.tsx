import { useQuestionnaire } from "./group-engine-context";
import { useLocale } from "./i18n/locale-provider";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

export function QuestionnaireReadonlyRecovery() {
  const { state } = useQuestionnaire();
  const { message } = useLocale();
  return <section data-testid="questionnaire-readonly-recovery">
    <TherapeuticScreenFrame allowInquiryReset title={message("draft.retainedTitle").text}
      stageLabel={message("draft.retainedTitle").text}>
      <TherapeuticContentCard aria-label={message("draft.retainedTitle").text}>
        <p role="status">{message("navigation.readonly").text}</p>
        {state.title ? <h2><bdi dir="auto">{state.title}</bdi></h2> : null}
        <ol>{state.rows.map((row) => <li key={row.id}>
          <bdi dir="auto">{row.name}</bdi>{row.intensity === null ? "" : ` — ${row.intensity}/10`}
        </li>)}</ol>
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>
  </section>;
}
