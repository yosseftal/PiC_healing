// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_PERSISTED_GUEST_FLOW_FACTS,
  guestFlowFactsStore,
  guestFlowStore,
  initGuestFlowFacts,
  persistGuestFlowFactsNow,
  resetGuestFlowFactsForTest,
  setGuestFlowPlayerSession,
} from "./guest-flow-facts";

afterEach(() => {
  resetGuestFlowFactsForTest();
});

describe("guest flow facts persistence", () => {
  it("seeds module state from initialFacts at init time", () => {
    initGuestFlowFacts({
      getActiveGroupId: () => "group-boot",
      getSessionState: () => ({ mode: "guest", gateTriggered: false, promotionStatus: "idle" }),
      subscribeToGroup: () => () => undefined,
      subscribeToSession: () => () => undefined,
      initialFacts: {
        ...DEFAULT_PERSISTED_GUEST_FLOW_FACTS,
        activePlayerSessionId: "session-boot",
        symptomAdditionComplete: true,
        groupFinalized: true,
        summaryAcknowledged: true,
      },
    });

    expect(guestFlowFactsStore.getSnapshot().activeGroupId).toBe("group-boot");
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe("session-boot");
    expect(guestFlowStore.getSnapshot()).toBe("player");
  });

  it("calls the persist callback when a setter mutates flow facts", () => {
    const persisted: unknown[] = [];
    initGuestFlowFacts({
      getActiveGroupId: () => null,
      getSessionState: () => ({ mode: "guest", gateTriggered: false, promotionStatus: "idle" }),
      subscribeToGroup: () => () => undefined,
      subscribeToSession: () => () => undefined,
      persistGuestFlowFacts: (facts) => {
        persisted.push(facts);
      },
    });

    setGuestFlowPlayerSession("session-1");

    expect(persisted).toEqual([
      {
        activeGroupId: null,
        activePlayerSessionId: "session-1",
        symptomAdditionComplete: false,
        groupFinalized: false,
        summaryAcknowledged: false,
      },
    ]);
  });

  it("persistGuestFlowFactsNow includes the current activeGroupId from composition-root", () => {
    const persisted: unknown[] = [];
    initGuestFlowFacts({
      getActiveGroupId: () => "group-2",
      getSessionState: () => ({ mode: "guest", gateTriggered: false, promotionStatus: "idle" }),
      subscribeToGroup: () => () => undefined,
      subscribeToSession: () => () => undefined,
      persistGuestFlowFacts: (facts) => {
        persisted.push(facts);
      },
    });

    persistGuestFlowFactsNow();

    expect(persisted).toEqual([
      {
        activeGroupId: "group-2",
        activePlayerSessionId: null,
        symptomAdditionComplete: false,
        groupFinalized: false,
        summaryAcknowledged: false,
      },
    ]);
  });
});
