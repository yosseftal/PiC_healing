import { useEffect, useId } from "react";

/** Reset cancels a paused operation before its next provider call. */
export class InquiryOperationCancelled extends Error {}

const pending = new Map<Promise<boolean>, "read" | "write">();
const drafts = new Map<string, boolean>();
const draftListeners = new Set<() => void>();
let cachedHasDraft = false;
const listeners = new Set<() => void>();
let generation = 0;
let admissionClosed = false;
let saving = false;
let failures = 0;

/** Tracks the whole UI operation, including continuations between public engine calls. */
export function trackFlowOperation<T>(operation: () => Promise<T>, kind: "read" | "write" = "write"): Promise<T> {
  return trackOperation(operation, false, kind);
}

/** Reauthentication can settle a paused save, while remaining part of reset's drain. */
export function trackIdentityOperation<T>(operation: () => Promise<T>): Promise<T> {
  return trackOperation(operation, true);
}

async function trackOperation<T>(operation: () => Promise<T>, identity: boolean, kind: "read" | "write" = "write"):
Promise<T> {
  if (admissionClosed) throw new Error("Inquiry reset is pending");
  if (saving && !identity) throw new Error("Saving is pending");
  const result = operation();
  const settled = result.then(() => true, (error: unknown) => {
    if (error instanceof InquiryOperationCancelled) return true;
    failures += 1; return false;
  });
  pending.set(settled, kind);
  try {
    return await result;
  } finally {
    pending.delete(settled);
  }
}

/** Drain admitted writes before freezing Guest work; the caller uses untracked engine calls inside. */
export function trackExclusiveFlowOperation<T>(operation: () => Promise<T>): Promise<T> {
  const admitted = [...pending.keys()];
  return trackFlowOperation(async () => {
    saving = true;
    try {
      const results = await Promise.all(admitted);
      if (results.includes(false)) throw new Error("Inquiry writes did not settle successfully");
      return await operation();
    } finally { saving = false; }
  });
}

/** Capture failures from the instant reset is requested, before its first asynchronous boundary. */
export function prepareFlowSettlement(isCurrent = () => true): () => Promise<void> {
  const initialFailures = failures;
  return async () => {
    let failed = false;
    while (pending.size > 0) {
      const results = await Promise.all([...pending.keys()]);
      failed ||= results.includes(false);
    }
    if (!isCurrent()) return;
    admissionClosed = true;
    if (failed || failures !== initialFailures) throw new Error("Inquiry operation did not settle successfully");
  };
}

/** Presentation waits for admitted outer operations without interrupting their public-action continuations. */
export async function settleFlowOperations(): Promise<boolean> {
  let succeeded = true;
  while (pending.size > 0) {
    const admitted = [...pending.entries()];
    const results = await Promise.all(admitted.map(([operation]) => operation));
    succeeded &&= !results.some((success, index) => !success && admitted[index]?.[1] === "write");
  }
  return succeeded;
}

export function useInquiryDraft(dirty: boolean): void {
  const id = useId();
  useEffect(() => {
    drafts.set(id, dirty);
    notifyDrafts();
    return () => { drafts.delete(id); notifyDrafts(); };
  }, [dirty, id]);
}

export function hasInquiryDraft(): boolean {
  return cachedHasDraft;
}

function notifyDrafts(): void {
  const next = [...drafts.values()].some(Boolean);
  if (next === cachedHasDraft) return;
  cachedHasDraft = next;
  for (const listener of draftListeners) listener();
}

export const inquiryDraftStore = {
  getSnapshot: () => cachedHasDraft,
  subscribe(listener: () => void) { draftListeners.add(listener); return () => { draftListeners.delete(listener); }; },
};

/** A composition-owned draft survives temporary screen unmounts until its inquiry is reset. */
export function setInquiryDraft(id: string, dirty: boolean): void {
  if (dirty) drafts.set(id, true);
  else drafts.delete(id);
  notifyDrafts();
}

export const inquiryGenerationStore = {
  getSnapshot: () => generation,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};

export function advanceInquiryGeneration(): void {
  generation += 1;
  drafts.clear();
  notifyDrafts();
  for (const listener of listeners) listener();
}

/** Boot-only restoration of the generation bound to a durable, unfinished promotion. */
export function restoreInquiryGeneration(value: number): void {
  generation = Math.max(generation, value);
}

export function reopenFlowOperations(): void {
  admissionClosed = false;
}
