/**
 * Read-only group summary (Ticket 08-06): reflects finalized `GroupEngine` state before treatment pick.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { GroupRevisionConflictError, type SymptomGroup } from "pic-engine";
import { ArrowDown, ArrowUp } from "lucide-react";
import { UTILITY_CONTROL } from "./control-affordance";
import { inquiryGenerationStore, useInquiryDraft } from "./inquiry-lifecycle";
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
  const { getGroup, reorderSymptoms } = useGroupEngineActions();
  const [group, setGroup] = useState<SymptomGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<{ id: string; offset: -1 | 1; orderedIds: readonly string[] } | null>(null);
  const [conflict, setConflict] = useState(false);
  const [moved, setMoved] = useState<number | null>(null);
  const [focus, setFocus] = useState<{ id: string; offset: -1 | 1 } | null>(null);
  const rows = useRef(new Map<string, HTMLLIElement>());
  const operation = useRef(0);
  const working = useRef(false);
  useInquiryDraft(pending !== null);

  useEffect(() => {
    let cancelled = false;
    void getGroup(groupId).then((loaded) => {
      if (!cancelled && loaded !== null && loaded.joint_treatment_muscle_test !== null) {
        setGroup(loaded);
      }
    });
    return () => {
      cancelled = true;
      operation.current++;
    };
  }, [getGroup, groupId]);

  useEffect(() => {
    if (focus === null || busy) return;
    const row = rows.current.get(focus.id);
    const requested = row?.querySelector<HTMLButtonElement>(`[data-move="${focus.offset}"]`);
    const target = requested && !requested.disabled ? requested : row?.querySelector<HTMLButtonElement>("button:enabled");
    (target ?? row)?.focus();
    setFocus(null);
  }, [focus, busy, group]);

  async function move(request: { id: string; offset: -1 | 1; orderedIds?: readonly string[] }, retry = false) {
    if (group === null || working.current) return;
    const ids = group.symptoms.map(({ id }) => id);
    const index = ids.indexOf(request.id);
    const destination = index + request.offset;
    if (request.orderedIds === undefined) {
      if (index < 0 || destination < 0 || destination >= ids.length) return;
      [ids[index], ids[destination]] = [ids[destination]!, ids[index]!];
    }
    const intent = { ...request, orderedIds: request.orderedIds ?? ids };
    working.current = true;
    const token = ++operation.current;
    const generation = inquiryGenerationStore.getSnapshot();
    const current = () => token === operation.current && generation === inquiryGenerationStore.getSnapshot();
    setBusy(true);
    setMoved(null);
    try {
      // Retry reads again: a failed response may have followed a committed write.
      const base = retry ? await getGroup(groupId) : group;
      if (!current()) return;
      if (base === null) throw new Error("The group is unavailable");
      setGroup(base);
      const committed = await reorderSymptoms(groupId, intent.orderedIds, base.revision!);
      if (!current()) return;
      setGroup(committed);
      setMoved(committed.symptoms.findIndex(({ id }) => id === intent.id) + 1);
      setPending(null);
      setConflict(false);
      setFocus(intent);
    } catch (error) {
      if (!current()) return;
      setPending(intent);
      setConflict(false);
      try {
        const authoritative = await getGroup(groupId);
        if (current() && authoritative !== null) {
          setGroup(authoritative);
          setConflict(error instanceof GroupRevisionConflictError);
        }
      } catch { /* Retain the explicit intent even if the refresh is temporarily unavailable. */ }
      if (current()) setFocus(intent);
    } finally {
      working.current = false;
      if (current()) setBusy(false);
    }
  }

  function handleConfirm(): void {
    if (working.current || pending !== null) return;
    setGuestFlowSummaryAcknowledged(true);
  }

  return <section data-testid="guest-flow-group-summary">
    <TherapeuticScreenFrame allowInquiryReset title={message("summary.title").text} stageLabel={message("summary.title").text}>
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
                    data-move={offset} disabled={busy || pending !== null ||
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
                setPending(null); setConflict(false); setFocus(pending);
              } },
          ] : [{ kind: "button", id: "summary-confirm", intent: "primary", disabled: busy,
            testId: "confirm-group-summary", label: message("summary.continue").text, onAction: handleConfirm }]} />
      </div>
    </TherapeuticScreenFrame>
  </section>;
}
