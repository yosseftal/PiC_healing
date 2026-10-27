/**
 * Reflects finalized manual priority; blind re-rating replaces every adjacent historical reflection.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Symptom } from "pic-engine";
import { ArrowDown, ArrowUp } from "lucide-react";
import { INPUT_CONTROL, UTILITY_CONTROL } from "./control-affordance";
import { setGuestFlowSummaryAcknowledged } from "./guest-flow-facts";
import { useSummaryPriority, useSummaryRating } from "./group-engine-context";
import { AtomicActionLayout } from "./action-layout/AtomicActionLayout";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { QuestionnaireEditUtility } from "./QuestionnaireEditUtility";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";
import { summaryMessage } from "./summary-messages";
import "./summary-presentation.css";
import { RatingControl } from "./RatingControl";

export interface SymptomGroupSummaryScreenProps {
  groupId: string;
}

export function SymptomGroupSummaryScreen({ groupId }: SymptomGroupSummaryScreenProps): ReactNode {
  const { message, locale } = useLocale();
  const navigation = useQuestionnaireNavigation();
  const { state, actions } = useSummaryPriority();
  const { busy, pending, conflict, moved, focus } = state;
  const group = state.group?.id === groupId ? state.group : null;
  const rating = useSummaryRating();
  const activeRating = rating.state.symptomId !== null && rating.state.groupId === groupId;
  const [view, setView] = useState<"manual" | "polarity">("manual");
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
    if (activeRating || busy || pending !== null || !navigation.actions.canAct()) return;
    setGuestFlowSummaryAcknowledged(true);
    navigation.actions.show("pick-treatment");
  }

  function renderTopic(symptom: Symptom): ReactNode {
    const index = group!.symptoms.findIndex(({ id }) => id === symptom.id);
    return <li key={symptom.id} data-testid={`summary-symptom-${symptom.id}`} className="pic-summary-topic"
      tabIndex={-1} ref={(node) => {
        if (node) rows.current.set(symptom.id, node); else rows.current.delete(symptom.id);
      }}>
      <div className="pic-summary-topic__main">
        <div className="pic-summary-topic__priority">
          <p><LocalizedMessage message={message("questionnaire.priority", { position: index + 1 })} /></p>
          <bdi dir="auto" lang="">{symptom.name}</bdi>
        </div>
        <div className="pic-summary-topic__rating">
          {symptom.rated_at === null ? <LocalizedMessage message={summaryMessage(locale, "unrated")} /> : <>
            <LocalizedMessage message={message(symptom.polarity === "positive" ? "summary.positive" : "summary.negative")} />
            <LocalizedMessage message={summaryMessage(locale, "intensity", { intensity: symptom.intensity, maximum: 10 })} />
          </>}
        </div>
      </div>
      {view === "manual" ? <div className="flex gap-2">
        {([-1, 1] as const).map((offset) => <button className={UTILITY_CONTROL} type="button" key={offset}
          aria-label={message(offset === -1 ? "questionnaire.moveUp" : "questionnaire.moveDown").text}
          data-move={offset} disabled={busy || navigation.state.waiting || pending !== null ||
            (offset === -1 ? index === 0 : index === group!.symptoms.length - 1)}
          onClick={() => void move({ id: symptom.id, offset })}>
          {offset === -1 ? <ArrowUp aria-hidden="true" size={20} /> : <ArrowDown aria-hidden="true" size={20} />}
        </button>)}
      </div> : null}
      <button type="button" className={UTILITY_CONTROL} disabled={busy || pending !== null || navigation.state.waiting}
        onClick={() => void rating.actions.start(groupId, symptom.id)}>
        <LocalizedMessage message={summaryMessage(locale, "rerate")} />
      </button>
    </li>;
  }

  return <section data-testid="guest-flow-group-summary">
    <TherapeuticScreenFrame allowInquiryReset questionnaireLocation="group-summary"
      title={message(activeRating ? "rating.legend" : "summary.title").text}
      stageLabel={message(activeRating ? "rating.legend" : "summary.title").text}
      utilities={activeRating ? null : <>
        <QuestionnaireEditUtility disabled={busy || pending !== null} />
        <label><LocalizedMessage message={summaryMessage(locale, "view")} />
          <select className={INPUT_CONTROL} value={view} aria-label={summaryMessage(locale, "view").text}
            disabled={busy || pending !== null || navigation.state.waiting}
            onChange={(event) => setView(event.target.value === "polarity" ? "polarity" : "manual")}>
            <option value="manual">{summaryMessage(locale, "manual").text}</option>
            <option value="polarity">{summaryMessage(locale, "polarity").text}</option>
          </select>
        </label>
      </>}>
      <div className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto] gap-4">
        <TherapeuticContentCard aria-label={message(activeRating ? "rating.legend" : "summary.title").text}>
          {activeRating ? <>
            {rating.state.name ? <h2><bdi dir="auto" lang="">{rating.state.name}</bdi></h2> : null}
            {rating.state.unavailable ? <p role="status"><LocalizedMessage
              message={summaryMessage(locale, "unavailable")} /></p> : rating.state.name ?
              <RatingControl key={rating.state.symptomId} symptomId={rating.state.symptomId}
                polarity={rating.state.inputPolarity} intensity={rating.state.inputIntensity} explicitIntensity
                disabled={rating.state.busy || rating.state.saved || navigation.state.waiting}
                onPolarityChange={(polarity) => rating.actions.edit({ polarity })}
                onIntensityChange={(intensity) => rating.actions.edit({ intensity })} /> :
              <p role="status"><LocalizedMessage message={message("summary.loading")} /></p>}
            {rating.state.recovery ? <p role="status"><LocalizedMessage
              message={summaryMessage(locale, "pending")} /></p> : null}
          </> : group === null ? <p role="status">
            <LocalizedMessage message={message("summary.loading")} />
          </p> : <>
            {group.name.trim() ? <h2 data-testid="summary-group-name"><bdi dir="auto" lang="">{group.name}</bdi></h2> : null}
            {view === "manual" ? <ul className="pic-summary-list">{group.symptoms.map(renderTopic)}</ul> :
              (["negative", "positive", "unrated"] as const).map((section) => {
                const topics = group.symptoms.filter((topic) => section === "unrated" ? topic.rated_at === null :
                  topic.rated_at !== null && topic.polarity === section);
                return topics.length === 0 ? null : <section key={section}
                  aria-label={summaryMessage(locale, section).text}>
                  <h3><LocalizedMessage message={summaryMessage(locale, section)} /></h3>
                  <ul className="pic-summary-list">{topics.map(renderTopic)}</ul>
                </section>;
              })}
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
          actions={activeRating ? [
            { kind: "button", id: "rating-save", intent: "primary",
              disabled: rating.state.busy || rating.state.unavailable || rating.state.inputIntensity === null,
              label: summaryMessage(locale, "save").text, onAction: () => void rating.actions.save() },
            { kind: "button", id: "rating-cancel", intent: "secondary", disabled: rating.state.busy || rating.state.saved,
              label: summaryMessage(locale, "cancel").text, onAction: () => { rating.actions.cancel(); setView("manual"); } },
          ] : group === null ? [] : pending !== null ? [
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
