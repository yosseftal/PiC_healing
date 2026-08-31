/**
 * Joint Treatment Muscle Test (Ticket 08-06): single yes/no question gating `finalizeGroup`.
 */
import { useState, type ReactNode } from "react";
import { useGuestFlowFacts } from "./guest-flow-context";
import { useGroupEngineActions } from "./group-engine-context";
import { useAsyncAction } from "./use-async-action";

export interface JointTreatmentMuscleTestStepProps {
  groupId: string;
}

export function JointTreatmentMuscleTestStep({ groupId }: JointTreatmentMuscleTestStepProps): ReactNode {
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

  return (
    <section data-testid="guest-flow-joint-treatment">
      <div data-testid="joint-treatment-muscle-test">
        <h1>Joint Treatment Muscle Test</h1>
        <p>Is it NEMAR to treat these symptoms together?</p>
        {!awaitingFinalize ? (
          <>
            <button type="button" data-testid="muscle-test-yes" onClick={() => void applyResponse("yes")}>
              Yes
            </button>
            <button type="button" data-testid="muscle-test-no" onClick={() => void applyResponse("no")}>
              No
            </button>
          </>
        ) : (
          <>
            {!advisoryDismissed ? (
              <div data-testid="split-advisory" role="status">
                <p>These symptoms may heal better as separate groups.</p>
                <button
                  type="button"
                  data-testid="dismiss-split-advisory"
                  onClick={() => setAdvisoryDismissed(true)}
                >
                  Dismiss
                </button>
              </div>
            ) : null}
            <button type="button" data-testid="finalize-anyway" onClick={() => void applyResponse("finalize")}>
              Finalize anyway
            </button>
          </>
        )}
        {responseStatus === "recovery" ? (
          <div role="status">
            <p>Your response is ready for another try.</p>
            <button type="button" onClick={() => void retryResponse()}>
              Try this muscle test response again
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
