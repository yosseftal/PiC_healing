// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TERMINAL_NEMAR_UNIT_ID, TRACER_BULLET_SEED_TREATMENT_ROWS, type PlayerSession } from "pic-engine";
import { AppProviders } from "./app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest } from "./composition-root";
import { setGuestFlowPlayerSession, resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";

const seedTreatment = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;

function buildSession(overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: "session-1",
    treatment_id: seedTreatment.id,
    linked_group_id: null,
    units: [
      { unit_id: "unit-1", state: "in_view" },
      { unit_id: "unit-2", state: "unseen" },
      { unit_id: "unit-3", state: "unseen" },
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

function holdParsedContent(): () => void {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  const originalGet = compositionRoot.treatmentContentActions.getParsedTreatmentContent.bind(
    compositionRoot.treatmentContentActions,
  );
  vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockImplementation(
    async (treatmentId: string) => {
      await held;
      return originalGet(treatmentId);
    },
  );
  return release;
}

async function waitForActivePlayer(): Promise<void> {
  await waitFor(() => {
    expect(screen.getByTestId("navigation-tree-panel")).toBeTruthy();
  });
}

function expectActivePlayerAbsent(): void {
  expect(screen.queryByTestId("navigation-tree-panel")).toBeNull();
  expect(screen.queryByTestId("finish-bar")).toBeNull();
  expect(screen.queryByTestId("finish-anyway-button")).toBeNull();
  expect(screen.queryByTestId("atomic-unit-unit-1")).toBeNull();
  expect(screen.queryByTestId("terminal-nemar-unit")).toBeNull();
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  resetTreatmentContentCacheForTest();
});

describe("UnifiedPlayerScreen", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
    resetTreatmentContentCacheForTest();
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
    await waitFor(() => {
      expect(screen.getByTestId("atomic-unit-unit-1")).toBeTruthy();
    });
    await waitFor(() => {
      expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness");
    });
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

    await waitForActivePlayer();
    fireEvent.click(screen.getByTestId("navigation-tree-jump-unit-2"));
    expect(jumpTo).toHaveBeenCalledWith("session-1", "unit-2");
  });

  it("FinishBar shows [Finish] only when terminal NEMAR is yes, and [Finish Anyway] always", async () => {
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    const beforeNemar = buildSession({
      units: [
        { unit_id: "unit-1", state: "completed" },
        { unit_id: "unit-2", state: "completed" },
        { unit_id: "unit-3", state: "completed" },
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

    await waitFor(() => {
      expect(screen.getByTestId("finish-anyway-button")).toBeTruthy();
    });
    expect(screen.queryByTestId("finish-button")).toBeNull();

    const afterYes = buildSession({
      units: [
        { unit_id: "unit-1", state: "completed" },
        { unit_id: "unit-2", state: "completed" },
        { unit_id: "unit-3", state: "completed" },
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

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });
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

    await waitForActivePlayer();
    expect(container.querySelector('[data-testid="rating-control"]')).toBeNull();
  });

  it("Finish and Finish Anyway call sessionEngine.onFinishRequested, not raw playerEngine.finish", async () => {
    const session = buildSession({
      units: [
        { unit_id: "unit-1", state: "completed" },
        { unit_id: "unit-2", state: "completed" },
        { unit_id: "unit-3", state: "completed" },
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

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("finish-button"));
    expect(onFinishRequested).toHaveBeenCalledWith("session-1", "finish");
    expect(finish).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("finish-anyway-button"));
    expect(onFinishRequested).toHaveBeenCalledWith("session-1", "finishAnyway");
    expect(finishAnyway).not.toHaveBeenCalled();
  });

  it("holds Active content back on a fresh startSession mount until parsed content has settled", async () => {
    const release = holdParsedContent();
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.queryByTestId("guest-flow-player")).toBeNull();

    await compositionRoot.playerEngineActions.startSession(seedTreatment.id, null, [
      "unit-1",
      "unit-2",
      "unit-3",
    ]);

    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
    });
    expectActivePlayerAbsent();

    release();

    await waitForActivePlayer();
    expect(screen.getByTestId("atomic-unit-unit-1")).toBeTruthy();
    expect(screen.getByTestId("finish-bar")).toBeTruthy();
  });

  it("holds Active content back on same-tab resume until parsed content has settled", async () => {
    const release = holdParsedContent();
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    expect(screen.getByTestId("guest-flow-player")).toBeTruthy();
    expectActivePlayerAbsent();

    release();

    await waitForActivePlayer();
    expect(screen.getByTestId("atomic-unit-unit-1")).toBeTruthy();
    expect(screen.getByTestId("finish-bar")).toBeTruthy();
  });

  it("renders Zero-H3 guard and picker recovery when getTreatment is rejected, never Active content", async () => {
    vi.spyOn(compositionRoot.repositoryPort, "getTreatment").mockRejectedValue(new Error("unavailable"));
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(ZERO_H3_GUARD_MESSAGE)).toBeTruthy();
    });
    expectActivePlayerAbsent();

    fireEvent.click(screen.getByRole("button", { name: "Choose another guidance" }));
    expect(screen.queryByTestId("guest-flow-player")).toBeNull();
  });

  it("renders Zero-H3 guard and picker recovery when parsed content is genuinely empty", async () => {
    vi.spyOn(compositionRoot.repositoryPort, "getTreatment").mockResolvedValue({
      id: seedTreatment.id,
      title: seedTreatment.title,
      structured_markdown: "",
      content_format: "structured_markdown",
    });
    const session = buildSession({
      units: [{ unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" }],
    });
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText(ZERO_H3_GUARD_MESSAGE)).toBeTruthy();
    });
    expectActivePlayerAbsent();
    expect(screen.queryByTestId("finish-anyway-button")).toBeNull();

    fireEvent.click(screen.getByTestId("player-content-recovery"));
    expect(screen.queryByTestId("guest-flow-player")).toBeNull();
  });

  it("reaches Active with a dynamically-sized parsed unit array from bundled Guest content", async () => {
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();
    const parsed = await compositionRoot.treatmentContentActions.getParsedTreatmentContent(seedTreatment.id);
    expect(parsed.length).toBeGreaterThan(1);

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await compositionRoot.playerEngineActions.startSession(
      seedTreatment.id,
      null,
      parsed.map((unit) => unit.unit_id),
    );

    await waitFor(() => {
      expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness");
    });
    expect(screen.getByTestId("navigation-tree-panel")).toBeTruthy();
    expect(screen.getByTestId("finish-bar")).toBeTruthy();
    expect(screen.queryByText(ZERO_H3_GUARD_MESSAGE)).toBeNull();
  });
});
