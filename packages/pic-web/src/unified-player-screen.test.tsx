// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TERMINAL_NEMAR_UNIT_ID, type PlayerSession } from "pic-engine";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { setGuestFlowPlayerSession, resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";

function buildSession(overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: "session-1",
    treatment_id: "2c6e77bd-61db-4898-8612-84e976587ff7",
    linked_group_id: null,
    units: [
      { unit_id: "intro", state: "in_view" },
      { unit_id: "practice", state: "unseen" },
      { unit_id: TERMINAL_NEMAR_UNIT_ID, state: "unseen" },
    ],
    terminal_nemar_response: null,
    success_declared: false,
    finished_at: null,
    integrating_reason: null,
    ...overrides,
  };
}

async function seedPlayerSession(session: PlayerSession): Promise<void> {
  await compositionRoot.repositoryPort.savePlayerSession(session);
  await compositionRoot.playerSessionStore.refresh(session.id);
  setGuestFlowPlayerSession(session.id);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
});

describe("UnifiedPlayerScreen", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
  });

  it("renders the current unit without throwing given a fresh player session state", async () => {
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
    expect(screen.getByTestId("atomic-unit-intro")).toBeTruthy();
    expect(screen.getByText("intro")).toBeTruthy();
  });

  it("rendering the current unit triggers advance()/in_view exactly once, not on every re-render", async () => {
    const session = buildSession();
    await seedPlayerSession(session);
    const advance = vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    const { rerender } = render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(advance).toHaveBeenCalledTimes(1);
    });
    expect(advance).toHaveBeenCalledWith("session-1");

    rerender(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(advance).toHaveBeenCalledTimes(1);
  });

  it("NavigationTreePanel jumpTo is the only manual jump affordance", async () => {
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();
    const jumpTo = vi.spyOn(compositionRoot.playerEngineActions, "jumpTo").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.queryByRole("button", { name: /skip/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /back/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /done/i })).toBeNull();

    fireEvent.click(screen.getByTestId("navigation-tree-jump-practice"));
    expect(jumpTo).toHaveBeenCalledWith("session-1", "practice");
  });

  it("FinishBar shows [Finish] only when terminal NEMAR is yes, and [Finish Anyway] always", async () => {
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    const beforeNemar = buildSession({
      units: [
        { unit_id: "intro", state: "completed" },
        { unit_id: "practice", state: "completed" },
        { unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" },
      ],
      terminal_nemar_response: null,
    });
    await seedPlayerSession(beforeNemar);

    const { rerender } = render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.queryByTestId("finish-button")).toBeNull();
    expect(screen.getByTestId("finish-anyway-button")).toBeTruthy();

    const afterYes = buildSession({
      units: [
        { unit_id: "intro", state: "completed" },
        { unit_id: "practice", state: "completed" },
        { unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" },
      ],
      terminal_nemar_response: "yes",
    });
    await compositionRoot.repositoryPort.savePlayerSession(afterYes);
    await compositionRoot.playerSessionStore.refresh(afterYes.id);

    rerender(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.getByTestId("finish-button")).toBeTruthy();
    expect(screen.getByTestId("finish-anyway-button")).toBeTruthy();
  });

  it("UnifiedPlayerScreen rendered tree contains zero RatingControl instances", async () => {
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    const { container } = render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(container.querySelector('[data-testid="rating-control"]')).toBeNull();
  });

  it("Finish and Finish Anyway call sessionEngine.onFinishRequested, not raw playerEngine.finish", async () => {
    const session = buildSession({
      units: [
        { unit_id: "intro", state: "completed" },
        { unit_id: "practice", state: "completed" },
        { unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" },
      ],
      terminal_nemar_response: "yes",
    });
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();
    const onFinishRequested = vi
      .spyOn(compositionRoot.sessionEngineActions, "onFinishRequested")
      .mockResolvedValue();
    const finish = vi.spyOn(compositionRoot.playerEngineActions, "finish").mockResolvedValue();
    const finishAnyway = vi.spyOn(compositionRoot.playerEngineActions, "finishAnyway").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    fireEvent.click(screen.getByTestId("finish-button"));
    expect(onFinishRequested).toHaveBeenCalledWith("session-1", "finish");
    expect(finish).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("finish-anyway-button"));
    expect(onFinishRequested).toHaveBeenCalledWith("session-1", "finishAnyway");
    expect(finishAnyway).not.toHaveBeenCalled();
  });
});
