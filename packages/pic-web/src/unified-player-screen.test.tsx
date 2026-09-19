// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  TERMINAL_NEMAR_UNIT_ID,
  TRACER_BULLET_SEED_TREATMENT_ROWS,
  type FinalizedSymptomGroup,
  type LibraryRow,
  type LibraryRowProvenance,
  type PlayerSession,
  type PromoteGuestToAccountInput,
  type PromoteGuestToAccountResult,
  type RepositoryPort,
  type TimelineEvent,
} from "pic-engine";
import { LocalGuestRepository } from "pic-adapter-local-guest";
import { AppProviders } from "./app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest, swapToSupabaseAdapter } from "./composition-root";
import { setGuestFlowPlayerSession, resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";

/**
 * Minimal in-memory `RepositoryPort` fake for ticket 21's promotion-replay test (AC6) — only the surface
 * `SessionEngine.promote` and its replayed `runFinish` actually touch: `promoteGuestToAccount`,
 * `getPlayerSession`/`savePlayerSession` (the replayed `finish()` reads/writes through these),
 * `getOrCreateLibraryRow`/`incrementUseCount` (`LibraryEngine.recordUse`), and `appendTimelineEvent`
 * (`TimelineEngine.recordExecution`). Mirrors `createInMemoryAuthenticatedPort` in composition-root.test.ts.
 */
function createFakeAuthenticatedPort(): RepositoryPort {
  const sessions = new Map<string, PlayerSession>();
  const libraryRows = new Map<string, LibraryRow>();
  const libraryRowIdByTreatmentId = new Map<string, string>();
  const usedKeysByRowId = new Map<string, Set<string>>();
  let nextId = 0;
  const nextIdPrefix = (prefix: string) => `${prefix}-${++nextId}`;

  return {
    async getGroup() {
      return null;
    },
    async saveGroup() {},
    async getPlayerSession(sessionId: string) {
      return sessions.get(sessionId) ?? null;
    },
    async savePlayerSession(session: PlayerSession) {
      sessions.set(session.id, session);
    },
    async getOrCreateLibraryRow(treatmentId: string, provenance: LibraryRowProvenance) {
      const existingId = libraryRowIdByTreatmentId.get(treatmentId);
      const existing = existingId === undefined ? undefined : libraryRows.get(existingId);
      if (existing !== undefined) {
        return existing;
      }
      const row: LibraryRow = {
        id: nextIdPrefix("library-row"),
        treatment_id: treatmentId,
        use_count: 0,
        provenance,
        variant_type: "original",
        global_reference_id: treatmentId,
        protocol_content: null,
        created_at: new Date().toISOString(),
      };
      libraryRows.set(row.id, row);
      libraryRowIdByTreatmentId.set(treatmentId, row.id);
      return row;
    },
    async incrementUseCount(libraryRowId: string, idempotencyKey: string) {
      const row = libraryRows.get(libraryRowId);
      if (row === undefined) {
        throw new Error(`no library row "${libraryRowId}"`);
      }
      let used = usedKeysByRowId.get(libraryRowId);
      if (used === undefined) {
        used = new Set();
        usedKeysByRowId.set(libraryRowId, used);
      }
      if (!used.has(idempotencyKey)) {
        used.add(idempotencyKey);
        row.use_count += 1;
      }
      return row;
    },
    async appendTimelineEvent(event: Omit<TimelineEvent, "id" | "created_at">) {
      const full: TimelineEvent = { ...event, id: nextIdPrefix("timeline-event"), created_at: new Date().toISOString() };
      return full;
    },
    async promoteGuestToAccount(input: PromoteGuestToAccountInput): Promise<PromoteGuestToAccountResult> {
      if (input.group !== null) {
        await this.saveGroup(input.group as FinalizedSymptomGroup);
      }
      await this.savePlayerSession(input.playerSession);
      const libraryRow = await this.getOrCreateLibraryRow(input.playerSession.treatment_id, {
        source: "guest_promotion",
        first_seen_at: new Date().toISOString(),
      });
      const timelineEvent = await this.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: input.playerSession.treatment_id,
        library_row_id: libraryRow.id,
        linked_group_id: input.playerSession.linked_group_id,
        metadata: null,
      });
      return { group: input.group, playerSession: input.playerSession, libraryRow, timelineEvent };
    },
    async getGuestSessionGate() {
      return { gateTriggered: false, pendingFinishRequest: null };
    },
    async saveGuestSessionGate() {},
    async listTreatments() {
      return [];
    },
    async getTreatment() {
      return null;
    },
  };
}

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

  it("offers a visible retry when player guidance needs to reconnect", async () => {
    const getParsedTreatmentContent = vi
      .spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent")
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValue([
        {
          unit_id: "unit-1",
          unit_order: 1,
          unit_title: "Settle Into Stillness",
          unit_content: "Begin.",
          unit_rationale: null,
        },
      ]);
    await seedPlayerSession(buildSession());
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try guidance again" })).toBeTruthy();
    });
    expect(screen.getByTestId("guest-flow-player").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try guidance again" }));

    await waitFor(() => {
      expect(getParsedTreatmentContent.mock.calls.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByTestId("navigation-tree-panel")).toBeTruthy();
    });
  });

  it("offers a visible retry when the Terminal NEMAR response needs another moment", async () => {
    const session = buildSession({
      units: [{ unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" }],
    });
    await seedPlayerSession(session);
    const respondTerminalNemar = vi
      .spyOn(compositionRoot.playerEngineActions, "respondTerminalNemar")
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("terminal-nemar-yes")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("terminal-nemar-yes"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try this Terminal NEMAR response again" })).toBeTruthy();
    });
    expect(screen.getByTestId("terminal-nemar-unit").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try this Terminal NEMAR response again" }));

    await waitFor(() => {
      expect(respondTerminalNemar).toHaveBeenCalledTimes(2);
      expect(respondTerminalNemar).toHaveBeenNthCalledWith(2, session.id, "yes");
    });
  });

  it("offers a visible retry when Navigation Tree movement needs another moment", async () => {
    const session = buildSession();
    await seedPlayerSession(session);
    vi.spyOn(compositionRoot.playerEngineActions, "advance").mockResolvedValue();
    const jumpTo = vi
      .spyOn(compositionRoot.playerEngineActions, "jumpTo")
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitForActivePlayer();
    fireEvent.click(screen.getByTestId("navigation-tree-jump-unit-2"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try this navigation again" })).toBeTruthy();
    });
    expect(screen.getByTestId("navigation-tree-panel").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try this navigation again" }));

    await waitFor(() => {
      expect(jumpTo).toHaveBeenCalledTimes(2);
      expect(jumpTo).toHaveBeenNthCalledWith(2, session.id, "unit-2");
    });
  });

  it("offers a visible retry when Finish needs another moment", async () => {
    const session = buildSession({
      units: [{ unit_id: TERMINAL_NEMAR_UNIT_ID, state: "in_view" }],
      terminal_nemar_response: "yes",
    });
    await seedPlayerSession(session);
    const onFinishRequested = vi
      .spyOn(compositionRoot.sessionEngineActions, "onFinishRequested")
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce();

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("finish-button"));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try finishing again" })).toBeTruthy();
    });
    expect(screen.getByTestId("finish-bar").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try finishing again" }));

    await waitFor(() => {
      expect(onFinishRequested).toHaveBeenCalledTimes(2);
      expect(onFinishRequested).toHaveBeenNthCalledWith(2, session.id, "finish");
    });
  });

  it("unmounts the player subtree after discardGuestState() clears an active gated session (AC5)", async () => {
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

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });

    // Real onFinishRequested (guest mode, not mocked): opens the Persistence Gate without finishing.
    fireEvent.click(screen.getByTestId("finish-button"));
    await waitFor(() => {
      expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
    });
    expect(screen.getByTestId("guest-flow-player")).toBeTruthy();

    await compositionRoot.sessionEngineActions.discardGuestState();

    await waitFor(() => {
      expect(screen.queryByTestId("guest-flow-player")).toBeNull();
    });
  });

  it("unmounts the player subtree after a promotion replays the gated Finish (AC6)", async () => {
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

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });

    // Real onFinishRequested (guest mode, not mocked): opens the Persistence Gate without finishing yet.
    fireEvent.click(screen.getByTestId("finish-button"));
    await waitFor(() => {
      expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
    });

    const authenticatedPort = createFakeAuthenticatedPort();
    swapToSupabaseAdapter(authenticatedPort);
    const guestRepository = compositionRoot.repositoryPort.getProvider() as LocalGuestRepository;
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation(async (input) => {
      return authenticatedPort.promoteGuestToAccount(input);
    });

    // promote() replays the gated Finish via SessionEngine.runFinish -> playerEngine.finish directly.
    await compositionRoot.sessionEngineActions.promote({ group: null, playerSession: session }, "user-ac6");

    await waitFor(() => {
      expect(screen.queryByTestId("guest-flow-player")).toBeNull();
    });
  });
});
