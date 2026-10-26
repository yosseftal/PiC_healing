import { useMemo, useSyncExternalStore } from "react";
import { compositionRoot } from "./composition-root";
import { inquiryGenerationStore } from "./inquiry-lifecycle";

export function useQuestionnaireNavigation() {
  const controller = compositionRoot.questionnaireNavigation;
  const state = useSyncExternalStore(controller.store.subscribe, controller.store.getSnapshot);
  const generation = useSyncExternalStore(inquiryGenerationStore.subscribe, inquiryGenerationStore.getSnapshot);
  const identity = useSyncExternalStore(compositionRoot.authStore.subscribe, compositionRoot.authStore.getSnapshot);
  const provider = compositionRoot.repositoryPort.getProvider();
  const actions = useMemo(() => controller.actionsFor(generation),
    [controller, generation, provider, identity.owner, identity.status, identity.revision]);
  return { state, actions };
}
