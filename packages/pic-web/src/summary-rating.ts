import type { Intensity, Polarity, SymptomGroup } from "pic-engine";
import { inquiryGenerationStore, setInquiryDraft, trackFlowOperation } from "./inquiry-lifecycle";

export interface SummaryRatingDependencies {
  captureAccess(): () => void;
  captureScope(): () => boolean;
  subscribeToScope(listener: () => void): () => void;
  blocked(): boolean;
  getGroup(id: string): Promise<SymptomGroup | null>;
  hasPriorRating(id: string): Promise<boolean>;
  rate(id: string, input: { polarity: Polarity; intensity: Intensity }): Promise<void>;
  afterSave(groupId: string): Promise<void>;
}

/** A retained current response never contains historical polarity or intensity. */
export function createSummaryRating(deps: SummaryRatingDependencies) {
  const initial = () => ({ groupId: null as string | null, symptomId: null as string | null, name: "",
    inputPolarity: "negative" as Polarity, inputIntensity: null as Intensity | null,
    busy: false, recovery: false, unavailable: false, saved: false });
  let state = initial();
  const empty = initial();
  let scopeMatches: (() => boolean) | null = null;
  let operation = 0;
  let committed = false;
  const listeners = new Set<() => void>();
  function update(patch: Partial<typeof state>) {
    state = { ...state, ...patch };
    setInquiryDraft("summary-rating", state.symptomId !== null);
    for (const listener of listeners) listener();
  }
  function reset() { operation += 1; committed = false; scopeMatches = null; state = initial(); update({}); }
  inquiryGenerationStore.subscribe(reset);
  deps.subscribeToScope(() => { if (scopeMatches !== null && !scopeMatches()) reset(); });
  return {
    store: {
      getSnapshot: () => scopeMatches !== null && !scopeMatches() ? empty : state,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    reset,
    actionsFor(generation: number) {
      const access = deps.captureAccess();
      const current = () => {
        if (generation !== inquiryGenerationStore.getSnapshot() || scopeMatches !== null && !scopeMatches()) return false;
        try { access(); return true; } catch { return false; }
      };
      return {
        async start(groupId: string, symptomId: string) {
          if (!current() || deps.blocked() || state.busy || state.symptomId !== null) return;
          const request = ++operation;
          scopeMatches = deps.captureScope();
          update({ ...initial(), groupId, symptomId, busy: true });
          const relevant = () => current() && request === operation;
          const retained = () => generation === inquiryGenerationStore.getSnapshot() && request === operation;
          await trackFlowOperation(async () => {
            try {
              await deps.hasPriorRating(symptomId);
              if (!relevant()) return;
              const group = await deps.getGroup(groupId);
              if (!relevant()) return;
              const symptom = group?.symptoms.find(({ id }) => id === symptomId);
              if (!symptom) throw new Error("The topic is unavailable");
              update({ name: symptom.name });
            } catch {
              if (relevant()) update({ unavailable: true });
            } finally {
              if (retained()) update({ busy: false, ...(state.name === "" ? { unavailable: true } : {}) });
            }
          }, "read").catch(() => {
            if (retained()) update({ busy: false, unavailable: true });
          });
        },
        edit(input: { polarity?: Polarity; intensity?: Intensity }) {
          if (!current() || deps.blocked() || state.busy || committed || state.unavailable || state.symptomId === null) return;
          update({ ...(input.polarity === undefined ? {} : { inputPolarity: input.polarity }),
            ...(input.intensity === undefined ? {} : { inputIntensity: input.intensity }), recovery: false });
        },
        cancel() {
          if (current() && !deps.blocked() && !state.busy && !committed) reset();
        },
        async save(): Promise<boolean> {
          if (!current() || deps.blocked() || state.busy || state.unavailable || state.symptomId === null ||
            state.groupId === null || state.inputIntensity === null) return false;
          const request = ++operation;
          const { groupId, symptomId, inputPolarity: polarity, inputIntensity: intensity } = state;
          const relevant = () => current() && request === operation;
          const retained = () => generation === inquiryGenerationStore.getSnapshot() && request === operation;
          update({ busy: true, recovery: false });
          return trackFlowOperation(async () => {
            try {
              if (!committed) {
                await deps.rate(symptomId, { polarity, intensity });
                if (relevant()) { committed = true; update({ saved: true }); }
              }
              if (!relevant()) return false;
              await deps.afterSave(groupId);
              if (!relevant()) return false;
              reset();
              return true;
            } catch {
              if (relevant()) update({ recovery: true });
              return false;
            } finally { if (retained()) update({ busy: false }); }
          }).catch(() => {
            if (retained()) update({ busy: false, recovery: true });
            return false;
          });
        },
      };
    },
  };
}
