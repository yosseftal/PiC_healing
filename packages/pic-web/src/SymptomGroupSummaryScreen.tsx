/**
 * Read-only group summary (Ticket 08-06): reflects finalized `GroupEngine` state before treatment pick.
 */
import { useEffect, useState, type ReactNode } from "react";
import type { FinalizedSymptomGroup } from "pic-engine";
import { setGuestFlowSummaryAcknowledged } from "./guest-flow-facts";
import { useGroupEngineActions } from "./group-engine-context";

export interface SymptomGroupSummaryScreenProps {
  groupId: string;
}

function formatMuscleTestResult(result: FinalizedSymptomGroup["joint_treatment_muscle_test"]): string {
  return result === "together" ? "Treat together" : "Split suggested";
}

export function SymptomGroupSummaryScreen({ groupId }: SymptomGroupSummaryScreenProps): ReactNode {
  const { getGroup } = useGroupEngineActions();
  const [group, setGroup] = useState<FinalizedSymptomGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getGroup(groupId).then((loaded) => {
      if (!cancelled && loaded !== null && loaded.joint_treatment_muscle_test !== null) {
        setGroup(loaded as FinalizedSymptomGroup);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [getGroup, groupId]);

  function handleConfirm(): void {
    setGuestFlowSummaryAcknowledged(true);
  }

  if (group === null) {
    return (
      <section data-testid="guest-flow-group-summary">
        <p>Loading group summary…</p>
      </section>
    );
  }

  return (
    <section data-testid="guest-flow-group-summary">
      <h1>Group Summary</h1>
      <p data-testid="summary-group-name">{group.name}</p>
      <ul>
        {group.symptoms.map((symptom) => (
          <li key={symptom.id} data-testid={`summary-symptom-${symptom.id}`}>
            {symptom.name} — {symptom.polarity}, {symptom.intensity}/10
          </li>
        ))}
      </ul>
      <p data-testid="summary-muscle-test">{formatMuscleTestResult(group.joint_treatment_muscle_test)}</p>
      <button type="button" data-testid="confirm-group-summary" onClick={handleConfirm}>
        Continue to treatment
      </button>
    </section>
  );
}
