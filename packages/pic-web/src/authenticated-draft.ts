import type { RepositoryPort, SymptomGroup } from "pic-engine";
import { InquiryOperationCancelled, inquiryGenerationStore } from "./inquiry-lifecycle";
import type { createAuthLifecycle } from "./auth-lifecycle";

const FOCUS_KEY = "pic-web.authenticated-focus.v1";
export const hasAuthenticatedFocus = () => typeof localStorage !== "undefined" && localStorage.getItem(FOCUS_KEY) !== null;
export const clearAuthenticatedFocus = () => localStorage.removeItem(FOCUS_KEY);
export const markAuthenticatedFocus = (owner: string) => localStorage.setItem(FOCUS_KEY, owner);

const KEY = "pic-web.authenticated-draft.v1";
export interface AuthenticatedDraft {
  owner: string;
  generation: number;
  phase: "draft" | "flushing" | "anchored";
  group: SymptomGroup;
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}
export function readAuthenticatedDraft(): AuthenticatedDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    if (!record(value) || typeof value.owner !== "string" || !value.owner ||
      !Number.isSafeInteger(value.generation) || Number(value.generation) < 0 ||
      !["draft", "flushing", "anchored"].includes(String(value.phase)) || !record(value.group)) return null;
    const group = value.group;
    if (typeof group.id !== "string" || typeof group.name !== "string" || typeof group.created_at !== "string" ||
      !Array.isArray(group.symptoms) || !group.symptoms.every((symptom) => record(symptom) &&
        typeof symptom.id === "string" && typeof symptom.name === "string" &&
        ["positive", "negative"].includes(String(symptom.polarity)) &&
        Number.isInteger(symptom.intensity) && Number(symptom.intensity) >= 0 && Number(symptom.intensity) <= 10 &&
        (symptom.rated_at === null || typeof symptom.rated_at === "string"))) return null;
    const answered = ["together", "split_suggested"].includes(String(group.joint_treatment_muscle_test)) &&
      typeof group.joint_treatment_test_at === "string";
    if (!answered && (group.joint_treatment_muscle_test !== null || group.joint_treatment_test_at !== null)) return null;
    if (value.phase !== "draft" && !answered) return null;
    return value as unknown as AuthenticatedDraft;
  } catch { return null; }
}

/** Approved web seam: only NEW unanswered groups are local; existing anchored records always use the port. */
export function createAuthenticatedDraft(
  initial: AuthenticatedDraft | null, auth: ReturnType<typeof createAuthLifecycle>,
) {
  let retrySave: (() => Promise<void>) | null = null;
  let entry = initial;
  let restored = initial !== null;
  const listeners = new Set<() => void>();
  let snapshot = entry === null ? null : { ...entry, restored };
  const publish = () => {
    snapshot = entry === null ? null : { ...entry, restored };
    for (const listener of listeners) listener();
  };
  const save = (next: AuthenticatedDraft) => {
    localStorage.setItem(KEY, JSON.stringify(next));
    entry = next;
    publish();
  };
  const check = (owner: string, generation: number) => {
    if (entry !== null && (entry.owner !== owner || entry.generation !== generation || restored)) {
      throw new Error("Retained local work requires its original identity and inquiry");
    }
    if (generation !== inquiryGenerationStore.getSnapshot()) throw new InquiryOperationCancelled();
  };
  const discard = () => {
    localStorage.removeItem(KEY);
    entry = null;
    restored = false;
    publish();
  };
  return {
    store: {
      getSnapshot: () => snapshot,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    discard,
    async retrySave() {
      if (retrySave === null || restored) throw new Error("Reloaded drafts cannot resume an authenticated focus");
      await retrySave();
    },
    decorate(port: RepositoryPort, owner: string): RepositoryPort {
      const admit = async () => {
        const generation = inquiryGenerationStore.getSnapshot();
        const revision = await auth.admit(owner, generation);
        check(owner, generation);
        if (!auth.current(owner, generation, revision)) throw new InquiryOperationCancelled();
        return generation;
      };
      const flush = async () => {
        const generation = await admit();
        if (entry === null) return;
        if (entry.phase !== "anchored") {
          await port.saveGroup(structuredClone(entry.group));
          await admit();
          save({ ...entry, generation, phase: "anchored" });
        }
        discard();
      };
      retrySave = flush;
      return new Proxy(port, {
        get(target, property, receiver) {
          if (property === "getGroup") return async (id: string) => {
            await admit();
            if (entry?.group.id === id && entry.phase !== "anchored") return structuredClone(entry.group);
            return port.getGroup(id);
          };
          if (property === "saveGroup") return async (group: SymptomGroup) => {
            const generation = await admit();
            if (entry !== null && entry.group.id !== group.id) throw new Error("A local draft is already pending");
            if (entry?.phase === "anchored") { discard(); return port.saveGroup(group); }
            if (entry?.phase === "flushing") {
              if (JSON.stringify(entry.group) !== JSON.stringify(group)) throw new Error("Retry the pending group save first");
              return flush();
            }
            if (entry === null) {
              const existing = await port.getGroup(group.id);
              await admit();
              if (existing !== null || group.joint_treatment_muscle_test !== null) return port.saveGroup(group);
            }
            if (entry !== null && entry.group.id !== group.id) throw new Error("A local draft is already pending");
            save({ owner, generation, group: structuredClone(group),
              phase: group.joint_treatment_muscle_test === null ? "draft" : "flushing" });
            if (group.joint_treatment_muscle_test !== null) await flush();
          };
          const value: unknown = Reflect.get(target, property, receiver);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    },
  };
}
