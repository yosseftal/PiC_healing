/**
 * Joint-treatment screen shell (Ticket 08-06): routes to the muscle-test step for the active draft group.
 */
import type { ReactNode } from "react";
import { JointTreatmentMuscleTestStep } from "./JointTreatmentMuscleTestStep";
import { useGroupEngineState } from "./group-engine-context";

export function JointTreatmentFlow(): ReactNode {
  const { activeGroupId } = useGroupEngineState();
  if (activeGroupId === null) {
    return null;
  }
  return <JointTreatmentMuscleTestStep groupId={activeGroupId} />;
}
