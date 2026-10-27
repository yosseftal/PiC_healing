import { GroupRevisionConflictError, type SymptomGroup } from "pic-engine";
import { inquiryGenerationStore, setInquiryDraft, trackFlowOperation } from "./inquiry-lifecycle";

type PriorityIntent = { id: string; offset: -1 | 1; orderedIds: readonly string[] };
export function createSummaryPriority(deps: {
  assertWriteSafe(): void;
  captureAccess(): () => void;
  captureScope(): () => boolean;
  subscribeToScope(listener: () => void): () => void;
  blocked(): boolean;
  getGroup(id: string): Promise<SymptomGroup | null>;
  reorder(id: string, ids: readonly string[], revision: number): Promise<SymptomGroup>;
}) {
  const initial = () => ({ group: null as SymptomGroup | null, busy: false, pending: null as PriorityIntent | null,
    conflict: false, moved: null as number | null, focus: null as { id: string; offset: -1 | 1 } | null });
  let state = initial();
  const hidden = initial();
  let scopeMatches: (() => boolean) | null = null;
  const listeners = new Set<() => void>();
  function update(patch: Partial<typeof state>) {
    state = { ...state, ...patch };
    setInquiryDraft("summary-priority", state.pending !== null);
    for (const listener of listeners) listener();
  }
  function reset() { scopeMatches = null; state = initial(); update({}); }
  inquiryGenerationStore.subscribe(reset);
  deps.subscribeToScope(() => { if (scopeMatches && !scopeMatches()) reset(); });
  return {
    store: {
      getSnapshot: () => scopeMatches && !scopeMatches() ? hidden : state,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    reset,
    actionsFor(generation: number) {
      const access = deps.captureAccess();
      const current = () => {
        if (generation !== inquiryGenerationStore.getSnapshot() || scopeMatches && !scopeMatches()) return false;
        try { access(); return true; } catch { return false; }
      };
      return {
        async load(id: string, required = false) {
          if (!current() || state.busy || state.pending) {
            if (required) throw new Error("Summary refresh is not currently available");
            return;
          }
          scopeMatches ??= deps.captureScope();
          try {
            const group = await deps.getGroup(id);
            if (!current() || group === null || group.joint_treatment_muscle_test === null) {
              if (required) throw new Error("The answered group could not be refreshed");
              return;
            }
            update({ group });
          } catch (error) {
            if (required) throw error;
            // Back remains available when an ordinary read cannot finish.
          }
        },
        move(request: { id: string; offset: -1 | 1; orderedIds?: readonly string[] }, retry = false) {
          if (!current() || deps.blocked() || state.group === null || state.busy) return Promise.resolve();
          const group = state.group;
          const ids = group.symptoms.map(({ id }) => id);
          const index = ids.indexOf(request.id);
          const destination = index + request.offset;
          if (request.orderedIds === undefined) {
            if (index < 0 || destination < 0 || destination >= ids.length) return Promise.resolve();
            [ids[index], ids[destination]] = [ids[destination]!, ids[index]!];
          }
          const intent = { ...request, orderedIds: request.orderedIds ?? ids };
          update({ busy: true, moved: null, pending: intent });
          return trackFlowOperation(async () => {
            try {
              deps.assertWriteSafe();
              const base = retry ? await deps.getGroup(group.id) : group;
              if (!current()) return;
              if (base === null) throw new Error("The group is unavailable");
              update({ group: base });
              const committed = await deps.reorder(group.id, intent.orderedIds, base.revision!);
              if (current()) update({ group: committed, pending: null, conflict: false, focus: intent,
                moved: committed.symptoms.findIndex(({ id }) => id === intent.id) + 1 });
            } catch (error) {
              if (!current()) return;
              update({ pending: intent, conflict: error instanceof GroupRevisionConflictError, focus: intent });
              try {
                const authoritative = await deps.getGroup(group.id);
                if (current() && authoritative !== null) update({ group: authoritative });
              } catch { /* Keep the exact intent even when refresh is unavailable. */ }
            } finally {
              if (generation === inquiryGenerationStore.getSnapshot()) update({ busy: false });
            }
          });
        },
        review() {
          if (current() && !deps.blocked() && !state.busy)
            update({ pending: null, conflict: false, focus: state.pending });
        },
      };
    },
  };
}
