import { describe, expect, it } from "vitest";
import {
  createEducationPresentationController,
  W13_07_WELCOME_DISMISSED_KEY,
  type WelcomePreferenceStorage,
} from "./education-presentation-context";

const identity = { ownerKey: "guest", generation: 1 };

describe("education presentation controller", () => {
  it("returns from the guide to the exact questionnaire location and focus target", () => {
    const controller = createEducationPresentationController();
    const returnTarget = { kind: "questionnaire" as const, location: "group-summary" as const,
      focusToken: "test:summary-help" };

    expect(controller.openGuide(identity, returnTarget)).toBe(true);
    expect(controller.getSnapshot().surface).toBe("guide");
    expect(controller.returnFromGuide(identity)).toEqual(returnTarget);
    expect(controller.getSnapshot().surface).toBe("none");
  });

  it("returns to welcome when learning was opened from the fresh welcome", () => {
    const controller = createEducationPresentationController();

    expect(controller.showWelcome(identity)).toBe(true);
    expect(controller.openGuide(identity, { kind: "welcome", focusToken: "test:welcome-learn" })).toBe(true);
    expect(controller.returnFromGuide(identity)).toEqual({ kind: "welcome", focusToken: "test:welcome-learn" });
    expect(controller.getSnapshot().surface).toBe("welcome");
  });

  it("allows an unseen welcome to reappear after a temporary transient clear", () => {
    const controller = createEducationPresentationController();

    expect(controller.showWelcome(identity)).toBe(true);
    controller.clearTransient(identity);
    expect(controller.getSnapshot().surface).toBe("none");
    expect(controller.showWelcome(identity)).toBe(true);
    expect(controller.getSnapshot().surface).toBe("welcome");
  });

  it("keeps an intentionally suppressed welcome hidden", () => {
    const controller = createEducationPresentationController();
    controller.synchronize(identity);
    let notifications = 0;
    controller.subscribe(() => { notifications += 1; });

    expect(controller.canWelcome()).toBe(true);
    expect(controller.suppressWelcome(identity)).toBe(true);
    expect(controller.canWelcome()).toBe(false);
    expect(controller.showWelcome(identity)).toBe(false);
    expect(controller.getSnapshot().surface).toBe("none");
    expect(notifications).toBe(0);
  });

  it("discards a stale guide return on owner or inquiry-generation changes", () => {
    const controller = createEducationPresentationController();

    controller.openGuide(identity, { kind: "questionnaire", location: "create-group", focusToken: "test:help" });
    expect(controller.returnFromGuide({ ownerKey: "account:other", generation: 1 })).toBeNull();
    expect(controller.getSnapshot().surface).toBe("none");
    controller.openGuide(identity, { kind: "questionnaire", location: "create-group", focusToken: "test:help" });
    expect(controller.returnFromGuide({ ownerKey: "guest", generation: 2 })).toBeNull();
    expect(controller.getSnapshot().surface).toBe("none");
  });

  it("persists only an explicit welcome choice for this tab", () => {
    const values = new Map<string, string>();
    const storage: WelcomePreferenceStorage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); },
    };
    const controller = createEducationPresentationController(storage);

    controller.synchronize(identity);
    let notifications = 0;
    controller.subscribe(() => { notifications += 1; });
    expect(controller.canWelcome()).toBe(true);
    expect(controller.showWelcome(identity)).toBe(true);
    expect(controller.canWelcome()).toBe(true);
    expect(values.has(W13_07_WELCOME_DISMISSED_KEY)).toBe(false);
    expect(controller.continueFromWelcome(identity)).toBe(true);
    expect(controller.canWelcome()).toBe(false);
    expect(values.get(W13_07_WELCOME_DISMISSED_KEY)).toBe("true");
    expect(notifications).toBe(2);
    expect(controller.showWelcome({ ownerKey: "account:new", generation: 1 })).toBe(false);
    expect(createEducationPresentationController(storage).showWelcome(identity)).toBe(false);
  });

  it("treats malformed session preferences as unset and falls back to tab memory when storage throws", () => {
    const malformed: WelcomePreferenceStorage = {
      getItem: () => "yes",
      setItem: () => { throw new Error("Quota exceeded"); },
    };
    const controller = createEducationPresentationController(malformed);
    expect(controller.showWelcome(identity)).toBe(true);
    expect(controller.continueFromWelcome(identity)).toBe(true);
    expect(controller.showWelcome({ ownerKey: "guest", generation: 2 })).toBe(false);

    const unavailable: WelcomePreferenceStorage = {
      getItem: () => { throw new Error("Storage blocked"); },
      setItem: () => { throw new Error("Storage blocked"); },
    };
    const fallback = createEducationPresentationController(unavailable);
    expect(fallback.showWelcome(identity)).toBe(true);
    expect(fallback.continueFromWelcome(identity)).toBe(true);
    expect(fallback.showWelcome({ ownerKey: "guest", generation: 2 })).toBe(false);
  });
});
