/**
 * Joint Treatment Muscle Test (Ticket 08-06): single yes/no question gating `finalizeGroup`.
 */
import { useState, type ReactNode } from "react";
import { useGuestFlowFacts } from "./guest-flow-context";
import { useGroupEngineActions } from "./group-engine-context";

export interface JointTreatmentMuscleTestStepProps {
  groupId: string;
}

export function JointTreatmentMuscleTestStep({ groupId }: JointTreatmentMuscleTestStepProps): ReactNode {
  const { symptomAdditionComplete } = useGuestFlowFacts();
  const { setJointTreatmentMuscleTest, finalizeGroup } = useGroupEngineActions();
  const [awaitingFinalize, setAwaitingFinalize] = useState(false);
  const [advisoryDismissed, setAdvisoryDismissed] = useState(false);

  if (!symptomAdditionComplete) {
    return null;
  }

  async function handleYes(): Promise<void> {
    await setJointTreatmentMuscleTest(groupId, "together");
    await finalizeGroup(groupId);
  }

  async function handleNo(): Promise<void> {
    await setJointTreatmentMuscleTest(groupId, "split_suggested");
    setAwaitingFinalize(true);
  }

  async function handleFinalizeAnyway(): Promise<void> {
    await finalizeGroup(groupId);
  }

  return (
    <section data-testid="guest-flow-joint-treatment">
      <div data-testid="joint-treatment-muscle-test">
        <h1>Joint Treatment Muscle Test</h1>
        <p>Is it NEMAR to treat these symptoms together?</p>
        {!awaitingFinalize ? (
          <>
            <button type="button" data-testid="muscle-test-yes" onClick={() => void handleYes()}>
              Yes
            </button>
            <button type="button" data-testid="muscle-test-no" onClick={() => void handleNo()}>
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
            <button type="button" data-testid="finalize-anyway" onClick={() => void handleFinalizeAnyway()}>
              Finalize anyway
            </button>
          </>
        )}
      </div>
    </section>
  );
}
