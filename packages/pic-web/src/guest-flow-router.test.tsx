// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { GuestFlowRouter } from "./guest-flow-router";
import {
  deriveGuestFlowScreen,
  resetGuestFlowFactsForTest,
  setGuestFlowGroupFinalized,
  setGuestFlowSummaryAcknowledged,
  setGuestFlowSymptomAdditionComplete,
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
      summaryAcknowledged: false,
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
        summaryAcknowledged: false,
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
        summaryAcknowledged: false,
      }),
    ).toBe("joint-treatment");
  });

  it("derives group-summary when the group is finalized but summary is not acknowledged", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: null,
        sessionState: emptySessionState,
        symptomAdditionComplete: true,
        groupFinalized: true,
        summaryAcknowledged: false,
      }),
    ).toBe("group-summary");
  });

  it("derives pick-treatment when the group is finalized and summary is acknowledged", () => {
    expect(
      deriveGuestFlowScreen({
        activeGroupId: "group-1",
        activePlayerSessionId: null,
        sessionState: emptySessionState,
        symptomAdditionComplete: true,
        groupFinalized: true,
        summaryAcknowledged: true,
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
        summaryAcknowledged: true,
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

    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("test-group");
    setGuestFlowSymptomAdditionComplete(true);
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-joint-treatment")).toBeTruthy();
    });

    setGuestFlowGroupFinalized(true);
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-group-summary")).toBeTruthy();
    });

    setGuestFlowSummaryAcknowledged(true);
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-pick-treatment")).toBeTruthy();
    });

    await compositionRoot.playerEngineActions.startSession(
      "2c6e77bd-61db-4898-8612-84e976587ff7",
      groupId,
      ["intro", "practice"],
    );
    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
    });
  });
});
