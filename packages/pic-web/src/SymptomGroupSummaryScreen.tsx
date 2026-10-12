/**
 * Read-only group summary (Ticket 08-06): reflects finalized `GroupEngine` state before treatment pick.
 */
import { useEffect, useState, type ReactNode } from "react";
import type { FinalizedSymptomGroup } from "pic-engine";
import { setGuestFlowSummaryAcknowledged } from "./guest-flow-facts";
import { useGroupEngineActions } from "./group-engine-context";
import { AtomicActionLayout } from "./action-layout/AtomicActionLayout";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";

export interface SymptomGroupSummaryScreenProps {
  groupId: string;
}

export function SymptomGroupSummaryScreen({ groupId }: SymptomGroupSummaryScreenProps): ReactNode {
  const { message } = useLocale();
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

  return <section data-testid="guest-flow-group-summary">
    <TherapeuticScreenFrame title={message("summary.title").text} stageLabel={message("summary.title").text}>
      <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
        <TherapeuticContentCard aria-label={message("summary.title").text}>
          {group === null ? <p role="status">
            <LocalizedMessage message={message("summary.loading")} />
          </p> : <>
            <p data-testid="summary-group-name"><bdi dir="auto" lang="">{group.name}</bdi></p>
            <p data-testid="symptom-count"><LocalizedMessage message={message("summary.count", {
              count: group.symptoms.length,
            })} /></p>
            <ul>
              {group.symptoms.map((symptom) => <li key={symptom.id} data-testid={`summary-symptom-${symptom.id}`}>
                <bdi dir="auto" lang="">{symptom.name}</bdi>{" — "}
                <LocalizedMessage message={message("summary.rating", {
                  polarity: message(symptom.polarity === "positive" ? "summary.positive" : "summary.negative").text,
                  intensity: symptom.intensity, maximum: 10,
                })} />
              </li>)}
            </ul>
            <p data-testid="summary-muscle-test"><LocalizedMessage message={message(
              group.joint_treatment_muscle_test === "together" ? "summary.together" : "summary.split",
            )} /></p>
          </>}
        </TherapeuticContentCard>
        <AtomicActionLayout primaryContent={null} actionsLabel={message("player.availableActions").text}
          selectedLabel={message("player.selected").text}
          actions={group === null ? [] : [{ kind: "button", id: "summary-confirm", intent: "primary",
            testId: "confirm-group-summary", label: message("summary.continue").text, onAction: handleConfirm }]} />
      </div>
    </TherapeuticScreenFrame>
  </section>;
}
