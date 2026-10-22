import type { Intensity, Polarity, SymptomGroup } from "pic-engine";
import { inquiryGenerationStore, InquiryOperationCancelled, setInquiryDraft, trackFlowOperation } from "./inquiry-lifecycle";

export interface TopicDraft { id: string; name: string; polarity: Polarity; intensity: Intensity | null }
export interface CompletedTopic extends TopicDraft { intensity: Intensity }
export interface QuestionnaireSubmission { title: string; rows: CompletedTopic[] }
interface QuestionnaireDraft {
  title: string;
  rows: TopicDraft[];
  existing: SymptomGroup | null;
  busy: boolean;
  recovery: boolean;
  invalid: boolean;
  moved: { id: string; position: number } | null;
}
const blankTopic = (): TopicDraft => ({ id: crypto.randomUUID(), name: "", polarity: "negative", intensity: null });
const emptyDraft = (): QuestionnaireDraft => ({
  title: "", rows: [blankTopic()], existing: null, busy: false, recovery: false, invalid: false, moved: null,
});

/** Tab-lived form data and retry intent; GroupEngine owns all materialized domain values. */
export function createQuestionnaireDraft(deps: {
  createSubmission(draft: QuestionnaireSubmission): () => Promise<void>;
  activeGroup(): string | null;
  getGroup(id: string): Promise<SymptomGroup | null>;
  continueExisting(): void;
}) {
  let state = emptyDraft();
  let revision = 0;
  let retry: (() => Promise<void>) | null = null;
  const listeners = new Set<() => void>();
  function update(patch: Partial<QuestionnaireDraft>) {
    state = { ...state, ...patch };
    setInquiryDraft("questionnaire", deps.activeGroup() === null && (state.title.length > 0 || state.rows.length > 1 ||
      state.rows.some((row) => row.name.length > 0 || row.intensity !== null || row.polarity !== "negative")));
    for (const listener of listeners) listener();
  }
  function reset() {
    revision += 1;
    retry = null;
    state = emptyDraft();
    update({});
  }
  inquiryGenerationStore.subscribe(reset);
  async function run(operation: () => Promise<void>): Promise<boolean> {
    if (state.busy) return false;
    const requestedRevision = revision;
    retry = operation;
    update({ busy: true, recovery: false });
    try {
      await operation();
      if (requestedRevision !== revision) return false;
      retry = null;
      return true;
    } catch {
      if (requestedRevision === revision) update({ recovery: true });
      return false;
    } finally { if (requestedRevision === revision) update({ busy: false }); }
  }
  const editable = () => !state.busy && !state.recovery && state.existing === null && deps.activeGroup() === null;
  const actions = {
    setTitle(title: string) { if (editable()) update({ title }); },
    edit(id: string, patch: Partial<Omit<TopicDraft, "id">>) {
      if (editable()) update({ rows: state.rows.map((row) => row.id === id ? { ...row, ...patch } : row) });
    },
    add() {
      if (!editable()) return null;
      const row = blankTopic();
      update({ rows: [...state.rows, row] });
      return row.id;
    },
    move(id: string, offset: -1 | 1) {
      if (!editable()) return;
      const from = state.rows.findIndex((row) => row.id === id);
      const to = from + offset;
      if (from < 0 || to < 0 || to >= state.rows.length) return;
      const rows = [...state.rows];
      const [row] = rows.splice(from, 1);
      rows.splice(to, 0, row!);
      update({ rows, moved: { id, position: to + 1 } });
    },
    load() {
      const id = deps.activeGroup();
      if (id === null || state.existing?.id === id || state.busy || state.recovery) return Promise.resolve(false);
      const requestedRevision = revision;
      return run(() => trackFlowOperation(async () => {
        const group = await deps.getGroup(id);
        if (requestedRevision !== revision) throw new InquiryOperationCancelled();
        if (group === null) throw new Error("Group is unavailable");
        update({ existing: group });
      }));
    },
    retry() { return retry === null ? Promise.resolve(false) : run(retry); },
    finish() {
      if (state.busy) return Promise.resolve(false);
      if (state.recovery && retry !== null) return run(retry);
      if (state.existing !== null) {
        if (state.existing.symptoms.length) {
          deps.continueExisting();
          return Promise.resolve(true);
        }
        update({ invalid: true });
        return Promise.resolve(false);
      }
      const rows: CompletedTopic[] = [];
      for (const row of state.rows) {
        if (!row.name.trim() || row.intensity === null || !Number.isInteger(row.intensity) ||
          row.intensity < 1 || row.intensity > 10) {
          update({ invalid: true });
          return Promise.resolve(false);
        }
        rows.push({ ...row, name: row.name.trim(), intensity: row.intensity });
      }
      update({ invalid: false });
      return run(deps.createSubmission({ title: state.title.trim(), rows }));
    },
  };
  return {
    store: {
      getSnapshot: () => state,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    reset,
    /** Old event handlers keep their generation and cannot operate on a replacement inquiry. */
    actionsFor(generation: number) {
      const current = () => generation === inquiryGenerationStore.getSnapshot();
      return {
        setTitle: (title: string) => { if (current()) actions.setTitle(title); },
        edit: (id: string, patch: Partial<Omit<TopicDraft, "id">>) => { if (current()) actions.edit(id, patch); },
        add: () => current() ? actions.add() : null,
        move: (id: string, offset: -1 | 1) => { if (current()) actions.move(id, offset); },
        load: () => current() ? actions.load() : Promise.resolve(false),
        retry: () => current() ? actions.retry() : Promise.resolve(false),
        finish: () => current() ? actions.finish() : Promise.resolve(false),
      };
    },
  };
}
