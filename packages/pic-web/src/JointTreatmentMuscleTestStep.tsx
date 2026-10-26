/**
 * Joint Treatment Muscle Test (Ticket 08-06): single yes/no question gating `finalizeGroup`.
 */
import { useEffect, type ReactNode } from "react";
import { useGuestFlowFacts } from "./guest-flow-context";
import { useQuestionnaire } from "./group-engine-context";
import { QuestionnaireEditUtility } from "./QuestionnaireEditUtility";
import { useInquiryUtilities } from "./inquiry-utilities-context";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import { UTILITY_CONTROL } from "./control-affordance";
import { AtomicActionLayout, type ActionTuple } from "./action-layout/AtomicActionLayout";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

export interface JointTreatmentMuscleTestStepProps {
  groupId: string;
}

export function JointTreatmentMuscleTestStep({ groupId }: JointTreatmentMuscleTestStepProps): ReactNode {
  const { message } = useLocale();
  const { symptomAdditionComplete, groupFinalized } = useGuestFlowFacts();
  const { state: revision, actions: revisionActions } = useQuestionnaire();
  const navigation = useQuestionnaireNavigation();
  const { setOpen } = useInquiryUtilities();
  useEffect(() => { void revisionActions.loadAnswer(); }, [groupId, revisionActions]);
  const awaitingFinalize = navigation.state.advisory;
  const advisoryDismissed = navigation.state.advisoryDismissed;
  const applyResponse = revisionActions.respondJoint;

  if (!symptomAdditionComplete && navigation.state.location !== "joint-treatment") {
    return null;
  }

  const finalizeAction = {
    kind: "button", id: "joint-finalize", intent: "primary", testId: "finalize-anyway",
    disabled: revision.busy || navigation.state.waiting,
    label: message(groupFinalized ? "navigation.continue" : "joint.finalize").text,
    onAction: () => groupFinalized ? navigation.actions.show("group-summary") : void applyResponse("finalize"),
  } as const;
  const retryRevision = () => void applyResponse(revision.answer === "split_suggested" ? "no" : "yes");
  const actions: ActionTuple = revision.recovery ? [
    { kind: "button", id: "joint-revision-retry", intent: "primary", testId: "retry-membership-revision",
      disabled: revision.busy, label: message("joint.retry").text, onAction: retryRevision },
  ] : !awaitingFinalize ? [
    { kind: "button", id: "joint-yes", intent: "primary", testId: "muscle-test-yes",
      disabled: revision.busy || navigation.state.waiting,
      label: message("player.yes").text, onAction: () => void applyResponse("yes") },
    { kind: "button", id: "joint-no", intent: "secondary", testId: "muscle-test-no",
      disabled: revision.busy || navigation.state.waiting,
      label: message("player.no").text, onAction: () => void applyResponse("no") },
  ] : advisoryDismissed ? [finalizeAction] : [finalizeAction,
    { kind: "button", id: "joint-dismiss", intent: "quiet", testId: "dismiss-split-advisory",
      label: message("joint.dismiss").text, onAction: () => navigation.actions.dismissAdvisory() },
  ];

  return <section data-testid="guest-flow-joint-treatment">
    <TherapeuticScreenFrame allowInquiryReset questionnaireLocation="joint-treatment"
      questionnaireContinue={!awaitingFinalize && revision.answer && !revision.revising && !revision.recovery && !revision.busy ?
        () => revision.answer === "split_suggested" ? navigation.actions.showAdvisory() :
          navigation.actions.show("group-summary") : undefined}
      title={message("joint.title").text} stageLabel={message("joint.title").text}
      utilities={<><QuestionnaireEditUtility />
      {revision.recovery ? <div role="status">
        <p><LocalizedMessage message={message("joint.recovery")} /></p>
        <button className={UTILITY_CONTROL} type="button" disabled={revision.busy}
          onClick={() => void (revision.recovery ? applyResponse(
          revision.answer === "split_suggested" ? "no" : "yes") : revisionActions.retry())}>
          <LocalizedMessage message={message("joint.retry")} />
        </button>
        {revision.conflict ? <button className={UTILITY_CONTROL} type="button"
          onClick={() => void revisionActions.reviewConflict().then((reviewed) => {
            if (reviewed) setOpen(false);
          })}>{message("questionnaire.reviewConflict").text}</button> : null}
      </div> : null}</>}>
      <TherapeuticContentCard aria-label={message("joint.title").text}>
        <div data-testid="joint-treatment-muscle-test">
          <AtomicActionLayout actions={actions} actionsLabel={message("player.availableActions").text}
            selectedLabel={message("player.selected").text} primaryContent={<>
              <p><LocalizedMessage message={message("joint.question")} /></p>
              {awaitingFinalize && !advisoryDismissed ? <p data-testid="split-advisory" role="status">
                <LocalizedMessage message={message("joint.advisory")} />
              </p> : null}
              {revision.recovery ? <p role="status">
                <LocalizedMessage message={message("joint.recovery")} />
                {" "}<LocalizedMessage message={message("joint.recoveryHint")} />
              </p> : null}
            </>} />
        </div>
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>
  </section>;
}
