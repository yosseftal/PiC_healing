import type { GuestFlowScreen } from "./guest-flow-facts";
import { inquiryGenerationStore, settleFlowOperations } from "./inquiry-lifecycle";
import type { QuestionnaireWebRecovery } from "./questionnaire-web-recovery";

export type QuestionnaireLocation = Exclude<GuestFlowScreen, "player"> | "preparation";
export function createQuestionnaireNavigation(deps: {
  screen(): GuestFlowScreen;
  current(): () => void;
  hasRecovery(): boolean;
  busy(): boolean;
  initial?: QuestionnaireWebRecovery | null;
}) {
  const initial = () => ({
    location: null as QuestionnaireLocation | null, waiting: false, recovery: false,
    advisory: false, advisoryDismissed: false, focus: null as string | null,
    direction: "neutral" as "neutral" | "forward" | "backward",
    returnLocation: "create-group" as QuestionnaireLocation,
    returnAdvisory: false,
  });
  let state = initial();
  if (deps.initial) {
    const retained = deps.initial;
    state = { ...state, location: retained.location, returnLocation: retained.returnLocation,
      advisory: retained.advisory, advisoryDismissed: retained.advisoryDismissed, focus: retained.focus };
    state.returnAdvisory = retained.returnAdvisory;
  }
  let lastFocus: string | null = state.focus;
  const listeners = new Set<() => void>();
  function update(patch: Partial<typeof state>) {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  }
  function reset() { state = initial(); lastFocus = null; update({}); }
  inquiryGenerationStore.subscribe(reset);
  async function navigate(location: QuestionnaireLocation, direction: "forward" | "backward", advisory = false) {
    if (state.waiting) return false;
    const check = deps.current();
    const generation = inquiryGenerationStore.getSnapshot();
    const focus = lastFocus;
    try { check(); } catch { return false; }
    update({ waiting: true, recovery: false });
    try {
      const settled = await settleFlowOperations();
      check();
      if (deps.screen() === "player") return false;
      if (!settled || deps.hasRecovery()) { update({ recovery: true }); return false; }
      update({ location, direction, advisory, focus });
      return true;
    } catch { return false; }
    finally {
      if (generation === inquiryGenerationStore.getSnapshot()) update({ waiting: false });
    }
  }
  const actions = {
    reset,
    store: {
      getSnapshot: () => state,
      subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    },
    rememberFocus(target: string) {
      lastFocus = target;
      if (state.focus !== target) update({ focus: target });
    },
    go: navigate,
    show(location: QuestionnaireLocation) { update({ location, direction: "forward", recovery: false }); },
    clear(forward = false) { update({ location: null, recovery: false, direction: forward ? "forward" : "neutral" }); },
    showAdvisory(fresh = false) {
      update({ advisory: true, direction: "forward", ...(fresh ? { advisoryDismissed: false } : {}) });
    },
    showQuestion() { update({ location: "joint-treatment", advisory: false, direction: "forward" }); },
    dismissAdvisory() { update({ advisoryDismissed: true }); },
    back(source: QuestionnaireLocation) {
      if (source === "preparation") return navigate(state.returnLocation, "backward", state.returnAdvisory);
      if (source === "create-group") {
        update({ returnLocation: source });
        return navigate("preparation", "backward");
      }
      if (source === "joint-treatment" && state.advisory) return navigate("joint-treatment", "backward");
      return navigate(source === "pick-treatment" ? "group-summary" :
        source === "group-summary" ? "joint-treatment" : "create-group", "backward");
    },
    preparation(source: QuestionnaireLocation) {
      update({ returnLocation: source, returnAdvisory: state.advisory });
      return navigate("preparation", "forward", state.advisory);
    },
  };
  return {
    ...actions,
    actionsFor(generation: number) {
      const check = deps.current();
      const current = () => {
        if (generation !== inquiryGenerationStore.getSnapshot() || state.waiting) return false;
        try { check(); return true; } catch { return false; }
      };
      return {
        canAct: () => current() && !deps.busy(),
        assertCurrent: check,
        back: (source: QuestionnaireLocation) => current() ? actions.back(source) : Promise.resolve(false),
        go: (location: QuestionnaireLocation, direction: "forward" | "backward") => current() ?
          navigate(location, direction, state.location === "preparation" ? state.returnAdvisory : false) : Promise.resolve(false),
        preparation: (source: QuestionnaireLocation) => current() ? actions.preparation(source) : Promise.resolve(false),
        show: (location: QuestionnaireLocation) => { if (current() && !deps.busy()) void navigate(location, "forward"); },
        showAdvisory: () => { if (current() && !deps.busy()) void navigate("joint-treatment", "forward", true); },
        dismissAdvisory: () => { if (current() && !deps.busy()) actions.dismissAdvisory(); },
        rememberFocus: (target: string) => { if (current()) actions.rememberFocus(target); },
      };
    },
  };
}
