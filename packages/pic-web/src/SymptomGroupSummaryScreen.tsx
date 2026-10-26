/**
 * Read-only group summary (Ticket 08-06): reflects finalized `GroupEngine` state before treatment pick.
 */
import { useEffect, useRef, type ReactNode } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { UTILITY_CONTROL } from "./control-affordance";
import { setGuestFlowSummaryAcknowledged } from "./guest-flow-facts";
import { useSummaryPriority } from "./group-engine-context";
import { AtomicActionLayout } from "./action-layout/AtomicActionLayout";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { QuestionnaireEditUtility } from "./QuestionnaireEditUtility";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";

export interface SymptomGroupSummaryScreenProps {
  groupId: string;
}

export function SymptomGroupSummaryScreen({ groupId }: SymptomGroupSummaryScreenProps): ReactNode {
  const { message } = useLocale();
  const navigation = useQuestionnaireNavigation();
  const { state, actions } = useSummaryPriority();
  const { group, busy, pending, conflict, moved, focus } = state;
  const rows = useRef(new Map<string, HTMLLIElement>());
  const move = actions.move;
  useEffect(() => { void actions.load(groupId); }, [actions, groupId]);
  useEffect(() => {
    if (focus === null || busy) return;
    const row = rows.current.get(focus.id);
    const requested = row?.querySelector<HTMLButtonElement>('[data-move="' + focus.offset + '"]');
    const target = requested && !requested.disabled ? requested : row?.querySelector<HTMLButtonElement>("button:enabled");
    (target ?? row)?.focus();
  }, [focus, busy, group]);

  function handleConfirm(): void {
    if (busy || pending !== null || !navigation.actions.canAct()) return;
    setGuestFlowSummaryAcknowledged(true);
    navigation.actions.show("pick-treatment");
  }

  return <section data-testid="guest-flow-group-summary">
    <TherapeuticScreenFrame allowInquiryReset questionnaireLocation="group-summary"
      title={message("summary.title").text} stageLabel={message("summary.title").text}
      utilities={<QuestionnaireEditUtility disabled={busy || pending !== null} />}>
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
              {group.symptoms.map((symptom, index) => <li key={symptom.id} data-testid={`summary-symptom-${symptom.id}`}
                tabIndex={-1} ref={(node) => {
                  if (node) rows.current.set(symptom.id, node); else rows.current.delete(symptom.id);
                }}>
                <p><LocalizedMessage message={message("questionnaire.priority", { position: index + 1 })} /></p>
                <bdi dir="auto" lang="">{symptom.name}</bdi>{" — "}
                <LocalizedMessage message={message("summary.rating", {
                  polarity: message(symptom.polarity === "positive" ? "summary.positive" : "summary.negative").text,
                  intensity: symptom.intensity, maximum: 10,
                })} />
                <div className="flex gap-2">
                  {([-1, 1] as const).map((offset) => <button className={UTILITY_CONTROL} type="button" key={offset}
                    aria-label={message(offset === -1 ? "questionnaire.moveUp" : "questionnaire.moveDown").text}
                    data-move={offset} disabled={busy || navigation.state.waiting || pending !== null ||
                      (offset === -1 ? index === 0 : index === group.symptoms.length - 1)}
                    onClick={() => void move({ id: symptom.id, offset })}>
                    {offset === -1 ? <ArrowUp aria-hidden="true" size={20} /> : <ArrowDown aria-hidden="true" size={20} />}
                  </button>)}
                </div>
              </li>)}
            </ul>
            <span className="sr-only" role="status" data-testid="priority-announcement">{moved === null ? "" :
              <LocalizedMessage message={message("questionnaire.moved", { position: moved })} />}</span>
            {pending === null ? null : <p role="status"><LocalizedMessage
              message={message(conflict ? "priority.conflict" : "priority.unsaved")} /></p>}
            <p data-testid="summary-muscle-test"><LocalizedMessage message={message(
              group.joint_treatment_muscle_test === "together" ? "summary.together" : "summary.split",
            )} /></p>
          </>}
        </TherapeuticContentCard>
        <AtomicActionLayout primaryContent={null} actionsLabel={message("player.availableActions").text}
          selectedLabel={message("player.selected").text}
          actions={group === null ? [] : pending !== null ? [
            { kind: "button", id: "priority-retry", intent: "primary", disabled: busy,
              label: message("priority.retry").text, onAction: () => void move(pending, true) },
            { kind: "button", id: "priority-review", intent: "secondary", disabled: busy,
              label: message("priority.review").text, onAction: () => {
                actions.review();
              } },
          ] : [{ kind: "button", id: "summary-confirm", intent: "primary", disabled: busy,
            testId: "confirm-group-summary", label: message("summary.continue").text, onAction: handleConfirm }]} />
      </div>
    </TherapeuticScreenFrame>
  </section>;
}
