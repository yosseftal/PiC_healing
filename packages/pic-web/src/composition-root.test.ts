// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FinalizedSymptomGroup, LibraryRow, PlayerSession, RepositoryPort, TimelineEvent } from "pic-engine";
import { DEFAULT_GUEST_STORAGE_KEY, LocalGuestRepository } from "pic-adapter-local-guest";
import type { GuestSnapshot } from "pic-engine";
import { DEFAULT_GUEST_SESSION_GATE_STATE } from "pic-engine";
import { compositionRoot, swapToSupabaseAdapter } from "./composition-root";

function createInMemoryAuthenticatedPort(): RepositoryPort {
  const groups = new Map<string, FinalizedSymptomGroup>();
  const sessions = new Map<string, PlayerSession>();
  const libraryRows = new Map<string, LibraryRow>();
  const libraryRowIdByTreatmentId = new Map<string, string>();
  const usedKeysByRowId = new Map<string, Set<string>>();
  let nextId = 0;
  const nextIdPrefix = (prefix: string) => `${prefix}-${++nextId}`;

  return {
    async getGroup(groupId) {
      return groups.get(groupId) ?? null;
    },
    async saveGroup(group) {
      groups.set(group.id, group as FinalizedSymptomGroup);
    },
    async getPlayerSession(sessionId) {
      return sessions.get(sessionId) ?? null;
    },
    async savePlayerSession(session) {
      sessions.set(session.id, session);
    },
    async getOrCreateLibraryRow(treatmentId, provenance) {
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
    async incrementUseCount(libraryRowId, idempotencyKey) {
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
    async appendTimelineEvent(event) {
      const full: TimelineEvent = {
        ...event,
        id: nextIdPrefix("timeline-event"),
        created_at: new Date().toISOString(),
      };
      return full;
    },
    async promoteGuestToAccount(input) {
      await this.saveGroup(input.group);
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
      return {
        group: input.group,
        playerSession: input.playerSession,
        libraryRow,
        timelineEvent,
      };
    },
    async getGuestSessionGate() {
      return { ...DEFAULT_GUEST_SESSION_GATE_STATE };
    },
    async saveGuestSessionGate() {},
    async listTreatments() {
      return [];
    },
  };
}

function storageHasGuestEntityData(raw: string | null): boolean {
  if (raw === null) {
    return false;
  }
  const snapshot = JSON.parse(raw) as {
    groups?: Record<string, unknown>;
    playerSessions?: Record<string, unknown>;
    libraryRows?: Record<string, unknown>;
    timelineEvents?: unknown[];
  };
  return (
    Object.keys(snapshot.groups ?? {}).length > 0 ||
    Object.keys(snapshot.playerSessions ?? {}).length > 0 ||
    Object.keys(snapshot.libraryRows ?? {}).length > 0 ||
    (snapshot.timelineEvents ?? []).length > 0
  );
}

function buildGuestSnapshot(overrides: Partial<GuestSnapshot> = {}): GuestSnapshot {
  const group: FinalizedSymptomGroup = {
    id: "guest-group-composition",
    name: "Lower Back",
    symptoms: [],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: "together",
    joint_treatment_test_at: new Date().toISOString(),
  };
  const playerSession: PlayerSession = {
    id: "guest-session-composition",
    treatment_id: "treatment-composition",
    linked_group_id: group.id,
    units: [{ unit_id: "a", state: "completed" }],
    terminal_nemar_response: "yes",
    success_declared: false,
    finished_at: null,
    integrating_reason: null,
  };
  return { group, playerSession, ...overrides };
}

describe("composition root engine wiring", () => {
  it("composition root exposes a single shared DelegatingRepositoryPort to all engines", async () => {
    const { repositoryPort, groupEngineActions, playerEngineActions } = compositionRoot;

    const groupId = await groupEngineActions.createDraftGroup("Shared Port Group");
    const groupFromPort = await repositoryPort.getGroup(groupId);
    expect(groupFromPort).not.toBeNull();
    expect(groupFromPort?.name).toBe("Shared Port Group");

    const sessionId = await playerEngineActions.startSession("treatment-shared-port", groupId, ["unit-a"]);
    const sessionFromPort = await repositoryPort.getPlayerSession(sessionId);
    expect(sessionFromPort).not.toBeNull();
    expect(sessionFromPort?.linked_group_id).toBe(groupId);
  });
});

describe("composition root guest storage lifecycle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("discardGuestState via the composition root leaves no guest data behind in storage", async () => {
    const { repositoryPort, sessionEngineActions } = compositionRoot;
    const group = buildGuestSnapshot().group;
    await repositoryPort.saveGroup(group);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    await sessionEngineActions.discardGuestState();

    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(false);
  });

  it(
    "a successful promotion leaves no guest data behind in storage, in addition to swapping the " +
      "active provider",
    async () => {
      const { repositoryPort, sessionEngineActions } = compositionRoot;
      const guestSnapshot = buildGuestSnapshot();
      await repositoryPort.saveGroup(guestSnapshot.group);
      await repositoryPort.savePlayerSession(guestSnapshot.playerSession);
      expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

      const authenticatedPort = createInMemoryAuthenticatedPort();
      swapToSupabaseAdapter(authenticatedPort);

      const guestRepository = repositoryPort.getProvider() as LocalGuestRepository;
      const promoteSpy = vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation(async (input) => {
        return authenticatedPort.promoteGuestToAccount(input);
      });

      const sessionId = guestSnapshot.playerSession.id;
      await sessionEngineActions.onFinishRequested(sessionId, "finish");
      await sessionEngineActions.promote(guestSnapshot, "user-composition");

      expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
      expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(false);
      expect(repositoryPort.getProvider()).toBe(authenticatedPort);
      expect(promoteSpy).toHaveBeenCalled();
    },
  );

  it("clears a persisted pointer to an already-finished player session at boot", async () => {
    const repo = new LocalGuestRepository();
    const finishedSession: PlayerSession = {
      id: "finished-session-boot",
      treatment_id: "treatment-boot",
      linked_group_id: "group-boot",
      units: [{ unit_id: "unit-a", state: "completed" }],
      terminal_nemar_response: "yes",
      success_declared: true,
      finished_at: new Date().toISOString(),
      integrating_reason: null,
    };
    await repo.savePlayerSession(finishedSession);
    await repo.saveGuestFlowFacts({
      activeGroupId: "group-boot",
      activePlayerSessionId: finishedSession.id,
      symptomAdditionComplete: true,
      groupFinalized: true,
      summaryAcknowledged: true,
    });

    vi.resetModules();
    const { guestFlowFactsStore } = await import("./guest-flow-facts");
    await import("./composition-root");

    await vi.waitFor(() => {
      expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
    });
  });
});

/**
 * Ticket 21: composition-root actions must clear the stale `activePlayerSessionId` pointer on completion,
 * promotion, and discard — the same-tab, no-reload gap boot-time rehydration (above) does not cover. Every
 * test here loads a fresh module instance (`vi.resetModules()`) so each test's `SessionEngine.mode`/
 * `gateTriggered`/`promotionStatus` starts from a known, un-polluted "guest" baseline.
 */
describe("clear stale session pointers on completion / discard / promotion (ticket 21)", () => {
  async function loadFreshCompositionRoot() {
    vi.resetModules();
    localStorage.clear();
    const composition = await import("./composition-root");
    const guestFlowFacts = await import("./guest-flow-facts");
    return { ...composition, ...guestFlowFacts };
  }

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("AC1: authenticated Finish clears activePlayerSessionId and refreshes playerSessionStore", async () => {
    const { compositionRoot: fresh, swapToSupabaseAdapter: freshSwap, guestFlowFactsStore } =
      await loadFreshCompositionRoot();
    const { repositoryPort, sessionEngineActions, sessionEngineStore, playerEngineActions, playerSessionStore } =
      fresh;

    const authenticatedPort = createInMemoryAuthenticatedPort();
    freshSwap(authenticatedPort);
    const guestRepository = repositoryPort.getProvider() as LocalGuestRepository;
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation(async (input) => {
      return authenticatedPort.promoteGuestToAccount(input);
    });

    // Promote with no pending Finish request: this flips mode -> "authenticated" without any replay.
    await sessionEngineActions.promote(buildGuestSnapshot(), "user-ac1");
    expect(sessionEngineStore.getSnapshot().mode).toBe("authenticated");

    const sessionId = await playerEngineActions.startSession("treatment-ac1", null, ["unit-a"]);
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(sessionId);

    const started = await repositoryPort.getPlayerSession(sessionId);
    await repositoryPort.savePlayerSession({ ...started!, terminal_nemar_response: "yes" });

    // Authenticated mode: SessionEngine.runFinish calls playerEngine.finish directly, bypassing the
    // composition-root's playerEngineActions.finish wrapper entirely (the bug this ticket fixes).
    await sessionEngineActions.onFinishRequested(sessionId, "finish");

    expect(playerSessionStore.getSnapshot(sessionId)?.success_declared).toBe(true);
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
  });

  it("AC2: promote() clears activePlayerSessionId on a successful promotion", async () => {
    const {
      compositionRoot: fresh,
      swapToSupabaseAdapter: freshSwap,
      guestFlowFactsStore,
      setGuestFlowPlayerSession,
    } = await loadFreshCompositionRoot();
    const { repositoryPort, sessionEngineActions, sessionEngineStore } = fresh;

    const authenticatedPort = createInMemoryAuthenticatedPort();
    freshSwap(authenticatedPort);
    const guestRepository = repositoryPort.getProvider() as LocalGuestRepository;
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation(async (input) => {
      return authenticatedPort.promoteGuestToAccount(input);
    });

    const guestSnapshot = buildGuestSnapshot();
    setGuestFlowPlayerSession(guestSnapshot.playerSession.id);
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(guestSnapshot.playerSession.id);

    await sessionEngineActions.promote(guestSnapshot, "user-ac2");

    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
  });

  it("AC2 (failed promotion): promote() does NOT clear activePlayerSessionId when the RPC rejects", async () => {
    const {
      compositionRoot: fresh,
      swapToSupabaseAdapter: freshSwap,
      guestFlowFactsStore,
      setGuestFlowPlayerSession,
    } = await loadFreshCompositionRoot();
    const { repositoryPort, sessionEngineActions, sessionEngineStore } = fresh;

    const authenticatedPort = createInMemoryAuthenticatedPort();
    freshSwap(authenticatedPort);
    const guestRepository = repositoryPort.getProvider() as LocalGuestRepository;
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockRejectedValue(new Error("network drop"));

    const guestSnapshot = buildGuestSnapshot();
    setGuestFlowPlayerSession(guestSnapshot.playerSession.id);

    await sessionEngineActions.promote(guestSnapshot, "user-ac2-fail");

    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("failed");
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(guestSnapshot.playerSession.id);
  });

  it("AC3: discardGuestState() clears activePlayerSessionId", async () => {
    const { compositionRoot: fresh, guestFlowFactsStore, setGuestFlowPlayerSession } =
      await loadFreshCompositionRoot();
    const { sessionEngineActions } = fresh;

    setGuestFlowPlayerSession("ac3-guest-session");
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe("ac3-guest-session");

    await sessionEngineActions.discardGuestState();

    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
  });

  it("AC4: guest-mode gate-triggered Finish does NOT clear activePlayerSessionId (negative case)", async () => {
    const { compositionRoot: fresh, guestFlowFactsStore } = await loadFreshCompositionRoot();
    const { repositoryPort, sessionEngineActions, sessionEngineStore, playerEngineActions } = fresh;

    expect(sessionEngineStore.getSnapshot().mode).toBe("guest");

    const sessionId = await playerEngineActions.startSession("treatment-ac4", null, ["unit-a"]);
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(sessionId);

    const started = await repositoryPort.getPlayerSession(sessionId);
    await repositoryPort.savePlayerSession({ ...started!, terminal_nemar_response: "yes" });

    // Guest mode: onFinishRequested only opens the Persistence Gate — no actual Finish happens yet, so the
    // session must remain visible behind the gate modal, not stranded-but-invisible.
    await sessionEngineActions.onFinishRequested(sessionId, "finish");

    expect(sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
    const session = await repositoryPort.getPlayerSession(sessionId);
    expect(session?.success_declared).toBe(false);
    expect(guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(sessionId);
  });
});
