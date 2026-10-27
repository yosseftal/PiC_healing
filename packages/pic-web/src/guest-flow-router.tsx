import { useCompletionPresentation } from "./completion-context";
import { CompletionReturnScreen } from "./CompletionReturnScreen";
import { CompletionRecoveryScreen } from "./CompletionRecoveryScreen";
import { useInquiryUtilities } from "./inquiry-utilities-context";
import { useEffect, useMemo, useRef } from "react";
import { useLocale } from "./i18n/locale-provider";
import { useInquiryGeneration } from "./inquiry-reset-context";
/**
 * Guest happy-path flow router (Ticket 08-04): mounts one screen at a time from derived facts only.
 */
import { useGuestFlowFacts, useGuestFlowScreen } from "./guest-flow-context";
import { GuestFlowScreenView } from "./guest-flow-screens";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import { QuestionnairePreparation } from "./QuestionnairePreparation";
import { HorizontalSlideContainer } from "./HorizontalSlideContainer";
import { compositionRoot } from "./composition-root";
import {
  useAuthIdentity,
  useAuthenticatedDraft,
  useInquiryDraftState,
  usePromotionRecoveryState,
  useSessionEngineState,
  useVerificationPending,
} from "./session-engine-context";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { QuestionnaireReadonlyRecovery } from "./QuestionnaireReadonlyRecovery";
import { useQuestionnaire } from "./group-engine-context";
import { useEducationPresentation } from "./education-presentation-context";
import { EducationGuide } from "./EducationGuide";
import { approvedGuideIntroduction, approvedVideoTitles, approvedWelcomeCopy } from "./education-content";
import { WelcomeScreen } from "./WelcomeScreen";

export function GuestFlowRouter() {
  const { locale, message } = useLocale();
  const generation = useInquiryGeneration();
  const derivedScreen = useGuestFlowScreen();
  const flowFacts = useGuestFlowFacts();
  const navigation = useQuestionnaireNavigation();
  const identity = useAuthIdentity();
  const session = useSessionEngineState();
  const verificationPending = useVerificationPending();
  const promotionRecovery = usePromotionRecoveryState();
  const authenticatedDraft = useAuthenticatedDraft();
  const hasEditedInquiryDraft = useInquiryDraftState();
  const questionnaire = useQuestionnaire();
  const completion = useCompletionPresentation();
  const education = useEducationPresentation();
  const { busy, confirmation, setOpen } = useInquiryUtilities();
  const educationIdentity = useMemo(() => ({
    ownerKey: identity.owner === null ? "guest" : `account:${identity.owner}:${identity.revision}`,
    generation,
  }), [identity.owner, identity.revision, generation]);
  const requested = derivedScreen === "player" ? derivedScreen : completion.snapshot.choice === "catalog" ?
    "pick-treatment" : navigation.state.location ?? derivedScreen;
  const visible = useRef({ screen: requested, generation });
  if ((!busy && !confirmation && !navigation.state.waiting) || visible.current.generation !== generation) {
    visible.current = { screen: requested, generation };
  }
  const screen = visible.current.screen;
  const hasMeaningfulQuestionnaireState = questionnaire.state.title.length > 0 ||
    questionnaire.state.rows.length > 1 || questionnaire.state.rows.some((row) =>
      row.name.length > 0 || row.intensity !== null || row.polarity !== "negative") ||
    questionnaire.state.existing !== null || questionnaire.state.owner !== null || questionnaire.state.attempted ||
    questionnaire.state.answer !== null || questionnaire.state.revising || questionnaire.state.reviewing ||
    questionnaire.state.conflict || questionnaire.state.invalid;
  const authInFocus = identity.status === "checking" || identity.status === "reauthenticate" ||
    identity.status === "uncertain";
  const completionActive = completion.recovery.status !== "idle" || completion.snapshot.visible;
  const priorityRecovery = completionActive || !compositionRoot.questionnaireVisible() || questionnaire.state.readOnly ||
    questionnaire.state.recovery || questionnaire.state.writeRecovery || questionnaire.state.storageUnavailable ||
    questionnaire.state.busy || session.gateTriggered || session.promotionStatus === "pending" ||
    verificationPending !== null || promotionRecovery !== null || authenticatedDraft !== null || authInFocus;
  const freshWelcome = !priorityRecovery && !busy && !confirmation && !navigation.state.waiting &&
    !navigation.state.recovery && screen === "create-group" && navigation.state.location === null &&
    flowFacts.activeGroupId === null && flowFacts.activePlayerSessionId === null &&
    !hasEditedInquiryDraft && !hasMeaningfulQuestionnaireState;
  useEffect(() => {
    education.actions.synchronize(educationIdentity);
    if (priorityRecovery) {
      education.actions.clearTransient(educationIdentity);
    } else if (freshWelcome) {
      education.actions.showWelcome(educationIdentity);
    } else {
      education.actions.suppressWelcome(educationIdentity);
      if (education.state.surface === "welcome" ||
        education.state.surface === "guide" && education.state.returnTarget?.kind === "welcome") {
        education.actions.clearTransient(educationIdentity);
      }
    }
  }, [education.actions, education.state.returnTarget, education.state.surface, educationIdentity,
    freshWelcome, priorityRecovery]);
  const focusedGeneration = useRef(generation);
  useEffect(() => {
    if (generation === focusedGeneration.current) return;
    focusedGeneration.current = generation;
    const timer = setTimeout(() => {
      document.querySelector<HTMLElement>('[data-testid="symptom-add-step"] input')?.focus();
    }, 0);
    return () => clearTimeout(timer);
  }, [generation]);
  if (completion.recovery.status !== "idle") return <CompletionRecoveryScreen />;
  if (!completion.snapshot.visible && derivedScreen !== "player" && !compositionRoot.questionnaireVisible()) {
    return <TherapeuticScreenFrame allowInquiryReset title={message("group.title").text}
      stageLabel={message("group.stage").text}>
      <TherapeuticContentCard aria-label={message("gate.reauthTitle").text}>
        <p role="status">{message("gate.reauthBody").text}</p>
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>;
  }
  if (!completion.snapshot.visible && derivedScreen !== "player" && questionnaire.state.readOnly)
    return <QuestionnaireReadonlyRecovery />;
  // Reflect first-run eligibility before mounting a questionnaire whose load effects can change readiness.
  const surface = derivedScreen === "player" || priorityRecovery ? "none" : education.state.surface === "guide" ?
    "guide" : freshWelcome && education.actions.canWelcome() ? "welcome" : "none";
  const activeKey = completion.snapshot.visible ? "completion-return" : surface === "welcome" ? "education-welcome" :
    surface === "guide" ? "education-guide" :
    screen === "joint-treatment" ? `${screen}:${navigation.state.advisory ? "advisory" : "question"}` : screen;
  const returnFromGuide = () => {
    const target = education.actions.returnFromGuide(educationIdentity);
    if (target?.focusToken) navigation.actions.rememberFocus(target.focusToken);
    if (target?.kind === "questionnaire") {
      if (target.location !== screen) navigation.actions.show(target.location);
      // The invoking control belongs to the drawer; restore that surface before restoring its focus.
      setOpen(true);
    }
  };
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
        activeKey={activeKey}
        direction={navigation.state.direction}
        userInitiated onTransitionComplete={() => {
          const target = [...document.querySelectorAll<HTMLElement>("[data-navigation-focus], [data-testid], [data-move]")]
            .find((node) => {
              const focus = navigation.state.focus;
              const row = node.closest<HTMLElement>("[data-topic-id], [data-testid^='summary-symptom-']");
              return node.dataset.navigationFocus === focus || `test:${node.dataset.testid}` === focus ||
                node.dataset.move && `move:${row?.dataset.topicId ?? row?.dataset.testid}:${node.dataset.move}` === focus;
            });
          const dialogs = [...document.querySelectorAll<HTMLElement>('[role="dialog"]')]
            .filter((dialog) => dialog.dataset.state !== "closed" && !dialog.closest('[aria-hidden="true"]'));
          if (dialogs.length > 0 && !dialogs.some((dialog) => target !== undefined && dialog.contains(target))) return;
          (target ?? document.querySelector<HTMLElement>(".pic-therapeutic-frame h1"))?.focus();
        }}>
        {completion.snapshot.visible ? <CompletionReturnScreen presentation={completion.presentation} /> :
          surface === "welcome" ? <WelcomeScreen content={approvedWelcomeCopy}
          onStartQuestionnaire={() => education.actions.continueFromWelcome(educationIdentity)}
          onLearnMethod={() => {
            const focusToken = "test:welcome-learn";
            navigation.actions.rememberFocus(focusToken);
            education.actions.openGuide(educationIdentity, { kind: "welcome", focusToken });
          }} /> : surface === "guide" ?
          <EducationGuide sections={[approvedGuideIntroduction]} videoTitle={approvedVideoTitles[locale]}
            onReturn={returnFromGuide} /> : screen === "preparation" ?
            <QuestionnairePreparation /> : <GuestFlowScreenView screen={screen} />}
      </HorizontalSlideContainer>
    </div>
  </>;
}
