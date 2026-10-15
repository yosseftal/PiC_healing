import { useSyncExternalStore } from "react";
import { compositionRoot } from "./composition-root";
import { inquiryGenerationStore } from "./inquiry-lifecycle";

/** Web orchestration only; public engine actions remain responsible for therapeutic state. */
export function useInquiryReset() {
  const identity = useSyncExternalStore(compositionRoot.authStore.subscribe, compositionRoot.authStore.getSnapshot);
  return { ...compositionRoot.inquiryResetActions, uncertain: identity.status === "uncertain" };
}

export function useInquiryGeneration(): number {
  return useSyncExternalStore(inquiryGenerationStore.subscribe, inquiryGenerationStore.getSnapshot);
}
