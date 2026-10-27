import { createContext, useContext, useMemo, useRef, useSyncExternalStore, type ReactNode } from "react";
import type { QuestionnaireLocation } from "./questionnaire-navigation";

export type EducationIdentity = { ownerKey: string; generation: number };
export const W13_07_WELCOME_DISMISSED_KEY = "pic-web.welcome-dismissed.v1";
export type EducationReturnTarget =
  | { kind: "welcome"; focusToken: string | null }
  | { kind: "questionnaire"; location: QuestionnaireLocation; focusToken: string | null };

export type EducationPresentationState = {
  surface: "none" | "welcome" | "guide";
  returnTarget: EducationReturnTarget | null;
};

type Snapshot = EducationPresentationState & EducationIdentity;
type Listener = () => void;
export type WelcomePreferenceStorage = Pick<Storage, "getItem" | "setItem">;

function browserSessionStorage(): WelcomePreferenceStorage | null {
  try { return typeof window === "undefined" ? null : window.sessionStorage; }
  catch { return null; }
}

export function createEducationPresentationController(
  storage: WelcomePreferenceStorage | null = browserSessionStorage(),
) {
  const listeners = new Set<Listener>();
  let welcomeSuppressed = false;
  let memoryDismissed = false;
  let identity: EducationIdentity = { ownerKey: "", generation: 0 };
  let snapshot: Snapshot = { ...identity, surface: "none", returnTarget: null };

  const publish = (next: EducationPresentationState) => {
    snapshot = { ...identity, ...next };
    for (const listener of listeners) listener();
  };
  const synchronize = (nextIdentity: EducationIdentity) => {
    if (identity.ownerKey === nextIdentity.ownerKey && identity.generation === nextIdentity.generation) return;
    identity = nextIdentity;
    publish({ surface: "none", returnTarget: null });
  };
  const wasDismissed = () => {
    if (memoryDismissed) return true;
    try { return storage?.getItem(W13_07_WELCOME_DISMISSED_KEY) === "true"; }
    catch { return false; }
  };
  const rememberDismissal = () => {
    memoryDismissed = true;
    try { storage?.setItem(W13_07_WELCOME_DISMISSED_KEY, "true"); }
    catch { /* The active tab remembers the choice when sessionStorage is unavailable. */ }
  };
  const canWelcome = () => !welcomeSuppressed && !wasDismissed();

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    synchronize,
    clearTransient(nextIdentity: EducationIdentity) {
      synchronize(nextIdentity);
      if (snapshot.surface !== "none") publish({ surface: "none", returnTarget: null });
    },
    canWelcome,
    showWelcome(nextIdentity: EducationIdentity) {
      synchronize(nextIdentity);
      if (!canWelcome() || snapshot.surface !== "none") return false;
      publish({ surface: "welcome", returnTarget: null });
      return true;
    },
    suppressWelcome(nextIdentity: EducationIdentity) {
      synchronize(nextIdentity);
      if (welcomeSuppressed) return false;
      welcomeSuppressed = true;
      return true;
    },
    continueFromWelcome(nextIdentity: EducationIdentity) {
      synchronize(nextIdentity);
      if (snapshot.surface !== "welcome") return false;
      rememberDismissal();
      publish({ surface: "none", returnTarget: null });
      return true;
    },
    dismissWelcome(nextIdentity: EducationIdentity) {
      synchronize(nextIdentity);
      if (snapshot.surface !== "welcome") return false;
      rememberDismissal();
      publish({ surface: "none", returnTarget: null });
      return true;
    },
    openGuide(nextIdentity: EducationIdentity, returnTarget: EducationReturnTarget) {
      synchronize(nextIdentity);
      if (snapshot.surface === "guide") return false;
      publish({ surface: "guide", returnTarget });
      return true;
    },
    returnFromGuide(nextIdentity: EducationIdentity): EducationReturnTarget | null {
      synchronize(nextIdentity);
      if (snapshot.surface !== "guide" || snapshot.returnTarget === null) return null;
      const target = snapshot.returnTarget;
      publish({ surface: target.kind === "welcome" ? "welcome" : "none", returnTarget: null });
      return target;
    },
  };
}

type EducationPresentationController = ReturnType<typeof createEducationPresentationController>;
const EducationPresentationContext = createContext<EducationPresentationController | null>(null);
const EMPTY_SNAPSHOT: Snapshot = { ownerKey: "", generation: 0, surface: "none", returnTarget: null };
const NO_SUBSCRIBE = () => () => {};

export function EducationPresentationProvider({ children }: { children: ReactNode }) {
  const controllerRef = useRef<EducationPresentationController | null>(null);
  if (controllerRef.current === null) controllerRef.current = createEducationPresentationController();
  return <EducationPresentationContext.Provider value={controllerRef.current}>
    {children}
  </EducationPresentationContext.Provider>;
}

export function useOptionalEducationPresentation() {
  const controller = useContext(EducationPresentationContext);
  const state = useSyncExternalStore(
    controller?.subscribe ?? NO_SUBSCRIBE,
    controller?.getSnapshot ?? (() => EMPTY_SNAPSHOT),
  );
  const emptyActions = useMemo(() => ({
    synchronize: () => {},
    clearTransient: () => {},
    canWelcome: () => false,
    showWelcome: () => false,
    suppressWelcome: () => false,
    continueFromWelcome: () => false,
    dismissWelcome: () => false,
    openGuide: () => false,
    returnFromGuide: () => null,
  }), []);
  const actions = useMemo(() => {
    if (controller === null) return emptyActions;
    return {
      synchronize: controller.synchronize,
      clearTransient: controller.clearTransient,
      canWelcome: controller.canWelcome,
      showWelcome: controller.showWelcome,
      suppressWelcome: controller.suppressWelcome,
      continueFromWelcome: controller.continueFromWelcome,
      dismissWelcome: controller.dismissWelcome,
      openGuide: controller.openGuide,
      returnFromGuide: controller.returnFromGuide,
    };
  }, [controller, emptyActions]);
  return controller === null ? null : { state, actions };
}

export function useEducationPresentation() {
  const value = useOptionalEducationPresentation();
  if (value === null) throw new Error("EducationPresentationProvider is required");
  return value;
}
