// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { GuestFlowRouter } from "./guest-flow-router";
import {
  advanceGuestFlowForTest,
  deriveGuestFlowScreen,
  resetGuestFlowFactsForTest,
  type GuestFlowFacts,
} from "./guest-flow-facts";

afterEach(() => {
  cleanup();
  resetGuestFlowFactsForTest();
});

describe("deriveGuestFlowScreen", () => {
  const emptySessionState = { mode: "guest" as const, gateTriggered: false, promotionStatus: "idle" as const };

  it("defaults empty facts to create-group", () => {
    const facts: GuestFlowFacts = {
      activeGroupId: null,
      activePlayerSessionId: null,
      sessionState: emptySessionState,
      symptomAdditionComplete: false,
      groupFinalized: false,
    };
    expect(deriveGuestFlowScreen(facts)).toBe("create-group");
  });

  it("stays on create-group while symptoms are being added to a draft group", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: null,
        sessionState: emptySessionState,
        symptomAdditionComplete: false,
        groupFinalized: false,
      }),
    ).toBe("create-group");
  });

  it("derives joint-treatment when symptom addition is complete", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: null,
        sessionState: emptySessionState,
        symptomAdditionComplete: true,
        groupFinalized: false,
      }),
    ).toBe("joint-treatment");
  });

  it("derives pick-treatment when the group is finalized", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: null,
        sessionState: emptySessionState,
        symptomAdditionComplete: true,
        groupFinalized: true,
      }),
    ).toBe("pick-treatment");
  });

  it("derives player when a player session is active", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: "session-1",
        sessionState: emptySessionState,
        symptomAdditionComplete: true,
        groupFinalized: true,
      }),
    ).toBe("player");
  });
});

describe("GuestFlowRouter", () => {
  it("starts on create-group screen", () => {
    render(
      <AppProviders>
        <GuestFlowRouter />
      </AppProviders>,
    );

    expect(screen.getByTestId("guest-flow-create-group")).toBeTruthy();
  });

  it("flow API switches the rendered screen component without component useState", async () => {
    render(
      <AppProviders>
        <GuestFlowRouter />
      </AppProviders>,
    );

    expect(screen.getByTestId("guest-flow-create-group")).toBeTruthy();

    await advanceGuestFlowForTest("joint-treatment");
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-joint-treatment")).toBeTruthy();
    });

    await advanceGuestFlowForTest("pick-treatment");
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-pick-treatment")).toBeTruthy();
    });

    await advanceGuestFlowForTest("player");
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
    });
  });
});
