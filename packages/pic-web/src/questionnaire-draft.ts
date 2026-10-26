import {
  GroupRevisionConflictError, membershipState, type JointTreatmentMuscleTestResult,
  type Intensity, type Polarity, type SymptomGroup,
} from "pic-engine";
import { inquiryGenerationStore, InquiryOperationCancelled, setInquiryDraft, trackFlowOperation } from "./inquiry-lifecycle";

export interface TopicDraft { id: string; name: string; polarity: Polarity; intensity: Intensity | null }
export interface CompletedTopic extends TopicDraft { intensity: Intensity }
export interface QuestionnaireSubmission { title: string; rows: CompletedTopic[] }
interface QuestionnaireDraft {
  title: string;
  rows: TopicDraft[];
  existing: SymptomGroup | null;
  revising: boolean;
  reviewing: boolean;
  answer: JointTreatmentMuscleTestResult | null;
  conflict: boolean;
  busy: boolean;
  recovery: boolean;
  invalid: boolean;
  moved: { id: string; position: number } | null;
}
const blankTopic = (): TopicDraft => ({ id: crypto.randomUUID(), name: "", polarity: "negative", intensity: null });
const emptyDraft = (): QuestionnaireDraft => ({
  title: "", rows: [blankTopic()], existing: null, revising: false, reviewing: false, answer: null,
  conflict: false, busy: false, recovery: false, invalid: false, moved: null,
});
const existingAnswer = (group: SymptomGroup) => group.joint_treatment_test_at !== null &&
  membershipState(group).answerMembershipRevision !== null ? group.joint_treatment_muscle_test : null;

/** Tab-lived form data and retry intent; GroupEngine owns all materialized domain values. */
export function createQuestionnaireDraft(deps: {
  createSubmission(draft: QuestionnaireSubmission): () => Promise<void>;
  activeGroup(): string | null;
  getGroup(id: string): Promise<SymptomGroup | null>;
  continueExisting(): void;
  editExisting(): void;
  reviewRevision(): void;
  revisionCommitted(group: SymptomGroup): void;
  revisionIdentity(): () => void;
  createRevisionSubmission(
    base: SymptomGroup, rows: CompletedTopic[], answer: JointTreatmentMuscleTestResult,
  ): () => Promise<SymptomGroup>;
  createUnansweredSubmission(base: SymptomGroup, rows: CompletedTopic[]): () => Promise<SymptomGroup>;
}) {
  let state = emptyDraft();
  let revision = 0;
  let retry: (() => Promise<void>) | null = null;
  let revisionIdentity: (() => void) | null = null;
  const listeners = new Set<() => void>();
  function update(patch: Partial<QuestionnaireDraft>) {
    state = { ...state, ...patch };
    setInquiryDraft("questionnaire", state.revising || deps.activeGroup() === null &&
      (state.title.length > 0 || state.rows.length > 1 ||
      state.rows.some((row) => row.name.length > 0 || row.intensity !== null || row.polarity !== "negative")));
    for (const listener of listeners) listener();
  }
  function reset() {
    revision += 1;
    retry = null;
    revisionIdentity = null;
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
    } catch (error) {
      if (requestedRevision === revision) update({ recovery: true, conflict: error instanceof GroupRevisionConflictError });
      return false;
    } finally { if (requestedRevision === revision) update({ busy: false }); }
  }
  const identityCurrent = () => {
    try { revisionIdentity?.(); return true; } catch { return false; }
  };
  const editable = () => identityCurrent() && !state.busy && !state.recovery &&
    (state.revising || state.existing === null && deps.activeGroup() === null);
  const actions = {
    async beginEdit() {
      if (state.busy) return false;
      if (state.revising) {
        if (!identityCurrent()) return false;
        deps.editExisting(); return true;
      }
      const id = deps.activeGroup();
      if (id === null) return false;
      return run(async () => {
        const check = deps.revisionIdentity();
        check();
        const token = revision;
        const group = await deps.getGroup(id);
        check();
        if (token !== revision) throw new InquiryOperationCancelled();
        if (group === null) throw new Error("Group is unavailable");
        revisionIdentity = check;
        update({ existing: group, title: group.name, rows: group.symptoms.map((row) => ({ ...row })),
          revising: true, reviewing: false, answer: existingAnswer(group) });
        deps.editExisting();
      });
    },
    answer(answer: JointTreatmentMuscleTestResult) {
      if (!identityCurrent() || !state.revising || !state.reviewing || state.busy) return Promise.resolve(false);
      if (state.recovery) return retry === null ? Promise.resolve(false) : run(retry);
      const operation = deps.createRevisionSubmission(state.existing!, state.rows as CompletedTopic[], answer);
      update({ answer });
      return run(async () => {
        const committed = await operation();
        update({ existing: committed, rows: committed.symptoms.map((row) => ({ ...row })), revising: false });
        deps.revisionCommitted(committed);
      });
    },
    async reviewConflict() {
      if (!identityCurrent() || !state.conflict || state.busy || state.existing === null) return false;
      const oldIds = new Set(state.existing.symptoms.map((row) => row.id));
      const additions = state.rows.filter((row) => !oldIds.has(row.id));
      const token = revision;
      update({ busy: true });
      try {
        const group = await deps.getGroup(state.existing.id);
        if (token !== revision || !identityCurrent() || group === null) return false;
        retry = null;
        const sameMembership = group.symptoms.length === oldIds.size &&
          group.symptoms.every((row) => oldIds.has(row.id));
        const canonicalRows = new Map(group.symptoms.map((row) => [row.id, row]));
        const rows = sameMembership ? state.rows.map((row) => canonicalRows.get(row.id) ?? row) :
          [...group.symptoms, ...additions.filter((row) => !canonicalRows.has(row.id))];
        update({ existing: group, rows, recovery: false, conflict: false,
          answer: additions.length === 0 ? existingAnswer(group) : null, reviewing: false });
        deps.editExisting();
        return true;
      } catch { return false; }
      finally { if (token === revision) update({ busy: false }); }
    },
    setTitle(title: string) { if (editable()) update({ title }); },
    edit(id: string, patch: Partial<Omit<TopicDraft, "id">>) {
      if (editable() && !state.existing?.symptoms.some((row) => row.id === id))
        update({ answer: null, rows: state.rows.map((row) => row.id === id ? { ...row, ...patch } : row) });
    },
    add() {
      if (!editable()) return null;
      const row = blankTopic();
      update({ rows: [...state.rows, row], answer: null });
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
      if (!identityCurrent() || state.busy) return Promise.resolve(false);
      if (state.recovery && retry !== null) return run(retry);
      if (state.existing !== null && !state.revising) {
        if (state.existing.symptoms.length) {
          deps.continueExisting();
          return Promise.resolve(true);
        }
        update({ invalid: true });
        return Promise.resolve(false);
      }
      const rows: CompletedTopic[] = [];
      for (const row of state.rows) {
        if (state.existing?.symptoms.some((old) => old.id === row.id)) { rows.push(row as CompletedTopic); continue; }
        if (!row.name.trim() || row.intensity === null || !Number.isInteger(row.intensity) ||
          row.intensity < 1 || row.intensity > 10) {
          update({ invalid: true });
          return Promise.resolve(false);
        }
        rows.push({ ...row, name: row.name.trim(), intensity: row.intensity });
      }
      update({ invalid: false });
      if (state.revising && state.existing !== null) {
        const base = state.existing;
        const hasAdditions = rows.some((row) => !base.symptoms.some((old) => old.id === row.id));
        if (hasAdditions && base.joint_treatment_muscle_test !== null) {
          update({ rows, reviewing: true }); deps.reviewRevision(); return Promise.resolve(true);
        }
        const operation = deps.createUnansweredSubmission(base, rows);
        return run(async () => {
          const committed = await operation();
          update({ existing: committed, rows: committed.symptoms.map((row) => ({ ...row })), revising: false });
          deps.continueExisting();
        });
      }
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
        beginEdit: () => current() ? actions.beginEdit() : Promise.resolve(false),
        answer: (answer: JointTreatmentMuscleTestResult) => current() ? actions.answer(answer) : Promise.resolve(false),
        reviewConflict: () => current() ? actions.reviewConflict() : Promise.resolve(false),
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
