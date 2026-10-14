import { useEffect, useId } from "react";

const pending = new Set<Promise<boolean>>();
const drafts = new Map<string, boolean>();
const listeners = new Set<() => void>();
let generation = 0;
let admissionClosed = false;
let failures = 0;

/** Tracks the whole UI operation, including continuations between public engine calls. */
export async function trackFlowOperation<T>(operation: () => Promise<T>): Promise<T> {
  if (admissionClosed) throw new Error("Inquiry reset is pending");
  const result = operation();
  const settled = result.then(() => true, () => { failures += 1; return false; });
  pending.add(settled);
  try {
    return await result;
  } finally {
    pending.delete(settled);
  }
}

/** Capture failures from the instant reset is requested, before its first asynchronous boundary. */
export function prepareFlowSettlement(): () => Promise<void> {
  const initialFailures = failures;
  return async () => {
    let failed = false;
    while (pending.size > 0) {
      const results = await Promise.all([...pending]);
      failed ||= results.includes(false);
    }
    admissionClosed = true;
    if (failed || failures !== initialFailures) throw new Error("Inquiry operation did not settle successfully");
  };
}

export function useInquiryDraft(dirty: boolean): void {
  const id = useId();
  useEffect(() => {
    drafts.set(id, dirty);
    return () => { drafts.delete(id); };
  }, [dirty, id]);
}

export function hasInquiryDraft(): boolean {
  return [...drafts.values()].some(Boolean);
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
  for (const listener of listeners) listener();
}

export function reopenFlowOperations(): void {
  admissionClosed = false;
}
