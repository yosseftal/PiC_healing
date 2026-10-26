import { useInquiryUtilities } from "./inquiry-utilities-context";
import { useEffect, useRef } from "react";
import { useLocale } from "./i18n/locale-provider";
import { useInquiryGeneration } from "./inquiry-reset-context";
/**
 * Guest happy-path flow router (Ticket 08-04): mounts one screen at a time from derived facts only.
 */
import { useGuestFlowScreen } from "./guest-flow-context";
import { GuestFlowScreenView } from "./guest-flow-screens";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import { QuestionnairePreparation } from "./QuestionnairePreparation";
import { HorizontalSlideContainer } from "./HorizontalSlideContainer";
import { compositionRoot } from "./composition-root";
import { useAuthIdentity } from "./session-engine-context";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { QuestionnaireReadonlyRecovery } from "./QuestionnaireReadonlyRecovery";
import { useQuestionnaire } from "./group-engine-context";

export function GuestFlowRouter() {
  const { message } = useLocale();
  const generation = useInquiryGeneration();
  const derivedScreen = useGuestFlowScreen();
  const navigation = useQuestionnaireNavigation();
  useAuthIdentity();
  const questionnaire = useQuestionnaire();
  const { busy, confirmation } = useInquiryUtilities();
  const requested = derivedScreen === "player" ? derivedScreen : navigation.state.location ?? derivedScreen;
  const visible = useRef({ screen: requested, generation });
  if ((!busy && !confirmation && !navigation.state.waiting) || visible.current.generation !== generation) {
    visible.current = { screen: requested, generation };
  }
  const screen = visible.current.screen;
  const focusedGeneration = useRef(generation);
  useEffect(() => {
    if (generation === focusedGeneration.current) return;
    focusedGeneration.current = generation;
    const timer = setTimeout(() => {
      document.querySelector<HTMLElement>('[data-testid="symptom-add-step"] input')?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [generation]);
  if (derivedScreen !== "player" && !compositionRoot.questionnaireVisible()) {
    return <TherapeuticScreenFrame allowInquiryReset title={message("group.title").text}
      stageLabel={message("group.stage").text}>
      <TherapeuticContentCard aria-label={message("gate.reauthTitle").text}>
        <p role="status">{message("gate.reauthBody").text}</p>
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>;
  }
  if (derivedScreen !== "player" && questionnaire.state.readOnly) return <QuestionnaireReadonlyRecovery />;
  return <>
    <span className="sr-only" role="status">{generation > 0 ? message("reset.success").text : ""}</span>
    <div onFocusCapture={(event) => {
      const target = event.target as HTMLElement;
      const testId = target.dataset.testid;
      const moveRow = target.closest<HTMLElement>("[data-topic-id], [data-testid^='summary-symptom-']");
      const move = target.dataset.move;
      const focus = target.dataset.navigationFocus ?? (testId && testId !== "questionnaire-back" ? `test:${testId}` :
        moveRow && move ? `move:${moveRow.dataset.topicId ?? moveRow.dataset.testid}:${move}` : null);
      if (focus) navigation.actions.rememberFocus(focus);
    }}>
      <HorizontalSlideContainer key={generation}
        activeKey={screen === "joint-treatment" ? `${screen}:${navigation.state.advisory ? "advisory" : "question"}` : screen}
        direction={navigation.state.direction}
        userInitiated onTransitionComplete={() => {
          const target = [...document.querySelectorAll<HTMLElement>("[data-navigation-focus], [data-testid], [data-move]")]
            .find((node) => {
              const focus = navigation.state.focus;
              const row = node.closest<HTMLElement>("[data-topic-id], [data-testid^='summary-symptom-']");
              return node.dataset.navigationFocus === focus || `test:${node.dataset.testid}` === focus ||
                node.dataset.move && `move:${row?.dataset.topicId ?? row?.dataset.testid}:${node.dataset.move}` === focus;
            });
          (target ?? document.querySelector<HTMLElement>(".pic-therapeutic-frame h1"))?.focus();
        }}>
        {screen === "preparation" ? <QuestionnairePreparation /> : <GuestFlowScreenView screen={screen} />}
      </HorizontalSlideContainer>
    </div>
  </>;
}
