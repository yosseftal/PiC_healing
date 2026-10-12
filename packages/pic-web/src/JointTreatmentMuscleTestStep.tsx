/**
 * Joint Treatment Muscle Test (Ticket 08-06): single yes/no question gating `finalizeGroup`.
 */
import { useState, type ReactNode } from "react";
import { useGuestFlowFacts } from "./guest-flow-context";
import { useGroupEngineActions } from "./group-engine-context";
import { useAsyncAction } from "./use-async-action";
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
  const { symptomAdditionComplete } = useGuestFlowFacts();
  const { setJointTreatmentMuscleTest, finalizeGroup } = useGroupEngineActions();
  const [awaitingFinalize, setAwaitingFinalize] = useState(false);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);
  const {
    status: responseStatus,
    run: applyResponse,
    retry: retryResponse,
  } = useAsyncAction(async (response: "yes" | "no" | "finalize") => {
    if (response === "yes") {
      await setJointTreatmentMuscleTest(groupId, "together");
      await finalizeGroup(groupId);
      return;
    }
    if (response === "no") {
      await setJointTreatmentMuscleTest(groupId, "split_suggested");
      setAwaitingFinalize(true);
      return;
    }
    await finalizeGroup(groupId);
  });

  if (!symptomAdditionComplete) {
    return null;
  }

  const finalizeAction = {
    kind: "button", id: "joint-finalize", intent: "primary", testId: "finalize-anyway",
    label: message("joint.finalize").text, onAction: () => void applyResponse("finalize"),
  } as const;
  const actions: ActionTuple = !awaitingFinalize ? [
    { kind: "button", id: "joint-yes", intent: "primary", testId: "muscle-test-yes",
      label: message("player.yes").text, onAction: () => void applyResponse("yes") },
    { kind: "button", id: "joint-no", intent: "secondary", testId: "muscle-test-no",
      label: message("player.no").text, onAction: () => void applyResponse("no") },
  ] : advisoryDismissed ? [finalizeAction] : [finalizeAction,
    { kind: "button", id: "joint-dismiss", intent: "quiet", testId: "dismiss-split-advisory",
      label: message("joint.dismiss").text, onAction: () => setAdvisoryDismissed(true) },
  ];

  return <section data-testid="guest-flow-joint-treatment">
    <TherapeuticScreenFrame title={message("joint.title").text} stageLabel={message("joint.title").text}
      utilities={responseStatus === "recovery" ? <div role="status">
        <p><LocalizedMessage message={message("joint.recovery")} /></p>
        <button className={UTILITY_CONTROL} type="button" onClick={() => void retryResponse()}>
          <LocalizedMessage message={message("joint.retry")} />
        </button>
      </div> : null}>
      <TherapeuticContentCard aria-label={message("joint.title").text}>
        <div data-testid="joint-treatment-muscle-test">
          <AtomicActionLayout actions={actions} actionsLabel={message("player.availableActions").text}
            selectedLabel={message("player.selected").text} primaryContent={<>
              <p><LocalizedMessage message={message("joint.question")} /></p>
              {awaitingFinalize && !advisoryDismissed ? <p data-testid="split-advisory" role="status">
                <LocalizedMessage message={message("joint.advisory")} />
              </p> : null}
              {responseStatus === "recovery" ? <p role="status">
                <LocalizedMessage message={message("joint.recovery")} />
                {" "}<LocalizedMessage message={message("joint.recoveryHint")} />
              </p> : null}
            </>} />
        </div>
      </TherapeuticContentCard>
    </TherapeuticScreenFrame>
  </section>;
}
