import { useSyncExternalStore } from "react";
import { compositionRoot } from "./composition-root";

/** Completion and account reload verification remain separate from editable questionnaire recovery. */
export function useCompletionPresentation() {
  const presentation = compositionRoot.completionPresentation;
  const snapshot = useSyncExternalStore(presentation.subscribe, presentation.getSnapshot);
  const recovery = useSyncExternalStore(compositionRoot.completionRecoveryStore.subscribe,
    compositionRoot.completionRecoveryStore.getSnapshot);
  return { presentation, snapshot, recovery, retryRecovery: compositionRoot.retryCompletionRecovery };
}
