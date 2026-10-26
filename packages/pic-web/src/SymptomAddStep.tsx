import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import type { Intensity, Polarity } from "pic-engine";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useGroupEngineState, useQuestionnaire } from "./group-engine-context";
import { useInquiryUtilities } from "./inquiry-utilities-context";
import { INPUT_CONTROL, UTILITY_CONTROL } from "./control-affordance";
import { useLocale } from "./i18n/locale-provider";
import { LocalizedMessage } from "./i18n/localized-message";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import "./symptom-creation.css";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";

export function SymptomAddStep(): ReactNode {
  const { message } = useLocale();
  const { activeGroupId } = useGroupEngineState();
  const { state, actions } = useQuestionnaire();
  const navigation = useQuestionnaireNavigation();
  const { setOpen } = useInquiryUtilities();
  const names = useRef(new Map<string, HTMLInputElement>());
  const topicRows = useRef(new Map<string, HTMLFieldSetElement>());
  const form = useRef<HTMLFormElement>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [moveFocus, setMoveFocus] = useState<{ id: string; offset: -1 | 1 } | null>(null);
  useEffect(() => {
    if (focusId !== null) { names.current.get(focusId)?.focus(); setFocusId(null); }
  }, [focusId, state.rows]);
  useEffect(() => {
    if (moveFocus === null) return;
    const row = topicRows.current.get(moveFocus.id);
    const requested = row?.querySelector<HTMLButtonElement>(`[data-move="${moveFocus.offset}"]`);
    const target = requested && !requested.disabled ? requested : row?.querySelector<HTMLButtonElement>("button:enabled");
    target?.focus();
    setMoveFocus(null);
  }, [moveFocus, state.rows]);
  const locked = state.busy || state.recovery || navigation.state.waiting || activeGroupId !== null && !state.revising;
  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFocusId(actions.add());
  }
  async function finish() {
    if (!await actions.finish()) form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }

  return <TherapeuticScreenFrame allowInquiryReset questionnaireLocation="create-group"
    title={message("group.title").text} stageLabel={message("group.stage").text}
    utilities={state.recovery ? <div role="status">
      <p><LocalizedMessage message={message("symptom.recovery")} /></p>
      <button className={UTILITY_CONTROL} type="button" disabled={state.busy}
        onClick={() => void actions.retry().then((saved) => {
        if (saved) setOpen(false);
      })}>
        <LocalizedMessage message={message("symptom.retry")} />
      </button>
      {state.conflict ? <button className={UTILITY_CONTROL} type="button" disabled={state.busy}
        onClick={() => void actions.reviewConflict().then((reviewed) => { if (reviewed) setOpen(false); })}>
        {message("questionnaire.reviewConflict").text}
      </button> : null}
    </div> : null}
  >
    <form ref={form} className="pic-symptom-step" data-testid="symptom-add-step" onSubmit={add}>
      <TherapeuticContentCard aria-label={message("group.card").text}>
        <div className="pic-symptom-form">
          <details open className="pic-questionnaire-preparation">
            <summary><LocalizedMessage message={message("questionnaire.preparationTitle")} /></summary>
            <p><LocalizedMessage message={message("questionnaire.preparationList")} /></p>
            <p><LocalizedMessage message={message("questionnaire.preparationPriority")} /></p>
            <p><LocalizedMessage message={message("questionnaire.preparationRating")} /></p>
          </details>
          {state.revising ? <p role="status"><LocalizedMessage message={message("questionnaire.pending")} /></p> : null}
          {state.existing !== null && !state.revising ? <>
            {state.existing.name ? <h2><bdi dir="auto" lang="">{state.existing.name}</bdi></h2> : null}
            <ol className="pic-questionnaire-existing">
              {state.existing.symptoms.map((row) => <li key={row.id}><bdi dir="auto" lang="">{row.name}</bdi></li>)}
            </ol>
            {state.existing.symptoms.some((row) => row.rated_at === null) || !state.existing.symptoms.length
              ? <p role="status"><LocalizedMessage message={message("questionnaire.legacyRecovery")} /></p> : null}
          </> : <>
            <label><LocalizedMessage message={message("group.name")} />
              <input className={INPUT_CONTROL} aria-label={message("group.name").text}
                placeholder={message("group.placeholder").text} dir="auto" lang="" value={state.title}
                data-navigation-focus="title"
                disabled={locked || state.revising} onChange={(event) => actions.setTitle(event.target.value)} />
            </label>
            <div data-testid="questionnaire-topics" className="pic-questionnaire-topics">
              {state.rows.map((row, index) => {
                const existing = state.existing?.symptoms.some((old) => old.id === row.id) === true;
                const label = row.polarity === "negative" ? "initial.negativeIntensity" : "initial.positiveIntensity";
                return <fieldset className="pic-questionnaire-row"
                  data-testid={existing ? "questionnaire-existing-row" : "questionnaire-row"} key={row.id}
                  ref={(node) => { if (node) topicRows.current.set(row.id, node); else topicRows.current.delete(row.id); }}
                  disabled={locked} data-topic-id={row.id}>
                  <legend><LocalizedMessage message={message("questionnaire.priority", { position: index + 1 })} /></legend>
                  {existing ? <p><bdi dir="auto" lang="">{row.name}</bdi>{" — "}
                    <LocalizedMessage message={message("summary.rating", {
                      polarity: message(row.polarity === "positive" ? "summary.positive" : "summary.negative").text,
                      intensity: row.intensity ?? 0, maximum: 10,
                    })} /></p> : <>
                  <label className="pic-questionnaire-row__name"><LocalizedMessage message={message("symptom.name")} />
                    <input ref={(node) => { if (node) names.current.set(row.id, node); else names.current.delete(row.id); }}
                      className={INPUT_CONTROL} aria-label={message("symptom.name").text}
                      data-navigation-focus={`${row.id}:name`}
                      aria-invalid={state.invalid && !row.name.trim() || undefined}
                      placeholder={message("symptom.placeholder").text} dir="auto" lang="" value={row.name}
                      onChange={(event) => actions.edit(row.id, { name: event.target.value })} />
                  </label>
                  <label><LocalizedMessage message={message("rating.polarity")} />
                    <select className={INPUT_CONTROL} aria-label={message("rating.polarity").text}
                      value={row.polarity}
                      data-navigation-focus={`${row.id}:polarity`}
                      onChange={(event) => actions.edit(row.id, { polarity: event.target.value as Polarity })}>
                      <option value="negative">{message("rating.negative").text}</option>
                      <option value="positive">{message("rating.positive").text}</option>
                    </select>
                  </label>
                  <label><LocalizedMessage message={message(label)} />
                    <select className={INPUT_CONTROL} aria-label={message(label).text}
                      aria-invalid={state.invalid && row.intensity === null || undefined}
                      aria-describedby={row.id + "-endpoints"} value={row.intensity ?? ""}
                      data-navigation-focus={`${row.id}:intensity`}
                      onChange={(event) => actions.edit(row.id, { intensity: event.target.value === "" ? null :
                        Number(event.target.value) as Intensity })}>
                      <option value="">{message("initial.choose").text}</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <p id={row.id + "-endpoints"} className="pic-questionnaire-row__endpoints">
                    <LocalizedMessage message={message(row.polarity === "negative"
                      ? "initial.negativeEndpoints" : "initial.positiveEndpoints")} />
                  </p>
                  </>}
                  <div className="pic-questionnaire-row__moves">
                    {([-1, 1] as const).map((offset) => <button className={UTILITY_CONTROL} type="button" key={offset}
                      aria-label={message(offset === -1 ? "questionnaire.moveUp" : "questionnaire.moveDown").text}
                      data-move={offset}
                      disabled={locked || (offset === -1 ? index === 0 : index === state.rows.length - 1)}
                      onClick={() => { actions.move(row.id, offset); setMoveFocus({ id: row.id, offset }); }}>
                      {offset === -1 ? <ArrowUp aria-hidden="true" size={20} /> : <ArrowDown aria-hidden="true" size={20} />}
                    </button>)}
                  </div>
                </fieldset>;
              })}
            </div>
          </>}
          <span className="sr-only" role="status">{state.moved === null ? "" :
            <LocalizedMessage message={message("questionnaire.moved", { position: state.moved.position })} />}</span>
          {state.invalid && (state.existing === null || state.revising) ? <p role="status">
            <LocalizedMessage message={message("questionnaire.completeRows")} /></p> : null}
          {state.recovery ? <p role="status"><LocalizedMessage message={message("symptom.recovery")} />{" "}
            <LocalizedMessage message={message("symptom.recoveryHint")} /></p> : null}
        </div>
      </TherapeuticContentCard>
      <div className="pic-symptom-form__actions" role="group" aria-label={message("player.availableActions").text}>
        {state.existing === null || state.revising ? <button className={UTILITY_CONTROL} type="submit"
          data-testid="add-symptom-action" disabled={locked}>
          <LocalizedMessage message={message("symptom.add")} />
        </button> : null}
        <button className={UTILITY_CONTROL} type="button" data-testid="finish-symptom-addition"
          disabled={state.busy || navigation.state.waiting} onClick={() => void finish()}>
          <LocalizedMessage message={message("symptom.done")} />
        </button>
      </div>
    </form>
  </TherapeuticScreenFrame>;
}
