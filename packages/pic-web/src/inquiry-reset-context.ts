import { useSyncExternalStore } from "react";
import { compositionRoot } from "./composition-root";
import { inquiryGenerationStore } from "./inquiry-lifecycle";

/** Web orchestration only; public engine actions remain responsible for therapeutic state. */
export function useInquiryReset() {
  return compositionRoot.inquiryResetActions;
}

export function useInquiryGeneration(): number {
  return useSyncExternalStore(inquiryGenerationStore.subscribe, inquiryGenerationStore.getSnapshot);
}
