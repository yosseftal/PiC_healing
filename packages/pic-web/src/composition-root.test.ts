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
});
