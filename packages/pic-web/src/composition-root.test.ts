import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
// @vitest-environment jsdom
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { FinalizedSymptomGroup, LibraryRow, PlayerSession, RepositoryPort, TimelineEvent } from "pic-engine";
import { DEFAULT_GUEST_STORAGE_KEY, LocalGuestRepository } from "pic-adapter-local-guest";
import type { GuestSnapshot } from "pic-engine";
import { DEFAULT_GUEST_SESSION_GATE_STATE } from "pic-engine";
import {
  GroupNotFoundError, prepareGroupSave, prepareMembershipRevision, membershipRevisionFingerprint,
  prepareSymptomReorder, type SymptomGroup,
} from "pic-engine";
import { compositionRoot, swapToSupabaseAdapter } from "./composition-root";

function createInMemoryAuthenticatedPort(): RepositoryPort {
  const groups = new Map<string, SymptomGroup>();
  const membershipReceipts = new Map<string, string>();
  const sessions = new Map<string, PlayerSession>();
  const libraryRows = new Map<string, LibraryRow>();
  const libraryRowIdByTreatmentId = new Map<string, string>();
  const usedKeysByRowId = new Map<string, Set<string>>();
  let nextId = 0;
  const nextIdPrefix = (prefix: string) => `${prefix}-${++nextId}`;

  return {
    async getGroup(groupId) {
      return structuredClone(groups.get(groupId) ?? null);
    },
    async saveGroup(group) {
      groups.set(group.id, prepareGroupSave(groups.get(group.id) ?? null, group));
    },
    async commitMembershipRevision(input) {
      const group = groups.get(input.groupId);
      if (!group) throw new GroupNotFoundError(input.groupId);
      const fingerprint = membershipRevisionFingerprint(input);
      const receipt = membershipReceipts.get(input.operationId);
      if (receipt !== undefined) {
        if (receipt !== fingerprint) throw new Error("Operation payload changed");
        return structuredClone(group) as FinalizedSymptomGroup;
      }
      const committed = prepareMembershipRevision(group, input);
      membershipReceipts.set(input.operationId, fingerprint);
      groups.set(input.groupId, committed);
      return structuredClone(committed);
    },
    async reorderSymptoms(id, ids, revision) {
      const group = groups.get(id);
      if (!group) throw new GroupNotFoundError(id);
      const committed = prepareSymptomReorder(group, ids, revision);
      groups.set(id, committed);
      return structuredClone(committed);
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
      if (input.group !== null) {
        await this.saveGroup(input.group);
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
    async getTreatment() {
      return null;
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

type GroupBoundGuestSnapshot = GuestSnapshot & { group: FinalizedSymptomGroup };

function buildGuestSnapshot(overrides: Partial<GroupBoundGuestSnapshot> = {}): GroupBoundGuestSnapshot {
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

async function prepareGate(root: typeof compositionRoot, snapshot = buildGuestSnapshot()) {
  await root.repositoryPort.saveGroup(snapshot.group);
  await root.repositoryPort.savePlayerSession(snapshot.playerSession);
  await root.sessionEngineActions.onFinishRequested(snapshot.playerSession.id, "finish");
  return snapshot;
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

      const promoteSpy = vi.spyOn(authenticatedPort, "promoteGuestToAccount");

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

    // Bootstrap through a real matching Guest Gate before exercising subsequent authenticated Finish.
    await sessionEngineActions.promote(await prepareGate(fresh), "user-ac1");
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

    await prepareGate(fresh, guestSnapshot);
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
    const { sessionEngineActions, sessionEngineStore } = fresh;

    const authenticatedPort = createInMemoryAuthenticatedPort();
    freshSwap(authenticatedPort);
    vi.spyOn(authenticatedPort, "promoteGuestToAccount").mockRejectedValue(new Error("network drop"));

    const guestSnapshot = buildGuestSnapshot();
    setGuestFlowPlayerSession(guestSnapshot.playerSession.id);

    await prepareGate(fresh, guestSnapshot);
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

describe("W12 reset composition boundaries", () => {
  afterEach(() => { cleanup(); vi.restoreAllMocks(); });

  it("retains work when an outstanding flow-fact write rejects, then cleans up on retry", async () => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: fresh } = await import("./composition-root");
    const facts = await import("./guest-flow-facts");
    const groupId = await fresh.groupEngineActions.createDraftGroup("Recover pointer write");
    const guestRepository = fresh.repositoryPort.getProvider() as LocalGuestRepository;
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    vi.spyOn(guestRepository, "saveGuestFlowFacts").mockImplementationOnce(async () => {
      await pending;
      throw new Error("Pointer storage unavailable");
    });
    facts.setGuestFlowSummaryAcknowledged(true);
    const reset = fresh.inquiryResetActions.resetInquiry(true);
    expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBe(groupId);
    release();
    await expect(reset).rejects.toThrow("Guest flow persistence needs retry");
    expect((await fresh.repositoryPort.getGroup(groupId))?.name).toBe("Recover pointer write");
    expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBe(groupId);
    await fresh.inquiryResetActions.resetInquiry(true);
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
  });

  describe("anchored inquiry presentation", () => {
    async function prepareSavedInquiry() {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: fresh, swapToSupabaseAdapter: swap } = await import("./composition-root");
    await import("./guest-flow-facts");
    const authenticatedPort = createInMemoryAuthenticatedPort();
    swap(authenticatedPort);
    const guestRepository = fresh.repositoryPort.getProvider() as LocalGuestRepository;
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation(async (input) => {
      return authenticatedPort.promoteGuestToAccount(input);
    });
    await fresh.sessionEngineActions.promote(await prepareGate(fresh), "saved-owner");
    const groupId = await fresh.groupEngineActions.createDraftGroup("Saved group");
    const before = await authenticatedPort.getGroup(groupId);
    const stateBefore = fresh.sessionEngineStore.getSnapshot();
    const finish = vi.spyOn(fresh.playerEngine, "finish");
    const finishAnyway = vi.spyOn(fresh.playerEngine, "finishAnyway");
    const { AppProviders } = await import("./app-providers");
    const { GuestFlowRouter } = await import("./guest-flow-router");
    const { useLocale } = await import("./i18n/locale-provider");
    let locale!: ReturnType<typeof useLocale>;
    function PreferencesProbe() {
      locale = useLocale();
      return null;
    }
    localStorage.setItem("pic-web.locale.v1", "en");
    render(createElement(AppProviders, { children: [
      createElement(GuestFlowRouter, { key: "flow" }), createElement(PreferencesProbe, { key: "preferences" }),
    ] }));
    act(() => locale.setCustomNemarAlias("My chosen phrase"));
      return { fresh, authenticatedPort, groupId, before, stateBefore, finish, finishAnyway, preferences: () => locale };
    }
    let fixture!: Awaited<ReturnType<typeof prepareSavedInquiry>>;
    beforeAll(async () => { fixture = await prepareSavedInquiry(); });
    it("detaches saved focus, preserves preferences, and confirms only unsaved input", async () => {
      const { fresh, authenticatedPort, groupId, before, stateBefore, finish, finishAnyway, preferences } = fixture;
    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    fireEvent.click(screen.getByRole("button", { name: "New symptom group" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(preferences().customNemarAlias).toBe("My chosen phrase");
    expect(preferences().locale).toBe("en");
    expect(await authenticatedPort.getGroup(groupId)).toEqual(before);
    expect(fresh.sessionEngineStore.getSnapshot()).toEqual(stateBefore);
    expect(fresh.repositoryPort.getProvider()).toBe(authenticatedPort);
    expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
    expect(finish).not.toHaveBeenCalled();
    expect(finishAnyway).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("List name (optional)"), { target: { value: "Saved with draft" } });
    fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Unwritten symptom" } });
    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    fireEvent.click(screen.getByRole("button", { name: "New symptom group" }));
    fireEvent.click(await screen.findByRole("button", { name: "Keep current inquiry" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("Unwritten symptom");
    expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("Saved with draft");
    expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
    expect(await authenticatedPort.getGroup(groupId)).toEqual(before);
    });
  });
});

it.each(["finish", "finishAnyway"] as const)("resets a Gate with pending %s without Finish effects", async (kind) => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  await import("./guest-flow-facts");
  const groupId = await fresh.groupEngineActions.createDraftGroup("Gate work");
  const sessionId = await fresh.playerEngineActions.startSession("gate-treatment", groupId, ["unit-one"]);
  await fresh.sessionEngineActions.onFinishRequested(sessionId, kind);
  const pending = await fresh.repositoryPort.getGuestSessionGate();
  expect(await fresh.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(await fresh.repositoryPort.getGuestSessionGate()).toEqual(pending);
  await fresh.inquiryResetActions.resetInquiry(true);
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
  expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
});

it.each([false, true])("recovers Gate after cleanup/rearming fail and reload, boot failure=%s", async (bootFailure) => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  await import("./guest-flow-facts");
  const groupId = await fresh.groupEngineActions.createDraftGroup("Recover Gate");
  const sessionId = await fresh.playerEngineActions.startSession("gate-treatment", groupId, ["unit-one"]);
  await fresh.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  const before = await fresh.repositoryPort.getPlayerSession(sessionId);
  const provider = fresh.repositoryPort.getProvider() as LocalGuestRepository;
  vi.spyOn(provider, "clear").mockRejectedValue(new Error("cleanup unavailable"));
  const saveGate = provider.saveGuestSessionGate.bind(provider);
  vi.spyOn(provider, "saveGuestSessionGate").mockImplementation(async (gate) => {
    if (gate.gateTriggered) throw new Error("rearm unavailable");
    await saveGate(gate);
  });
  await expect(fresh.inquiryResetActions.resetInquiry(true)).rejects.toThrow();
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
  expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBe(groupId);
  vi.restoreAllMocks();
  vi.resetModules();
  if (bootFailure) {
    const { LocalGuestRepository: ReloadRepository } = await import("pic-adapter-local-guest");
    vi.spyOn(ReloadRepository.prototype, "saveGroup").mockRejectedValueOnce(new Error("Boot storage unavailable"));
  }
  const { compositionRoot: restored } = await import("./composition-root");
  const facts = await import("./guest-flow-facts");
  await vi.waitFor(async () => expect(await restored.repositoryPort.getGuestSessionGate()).toEqual({
    gateTriggered: true, pendingFinishRequest: { sessionId, kind: "finishAnyway", promotionPayloadVersion: 3 },
  }));
  expect(await restored.repositoryPort.getPlayerSession(sessionId)).toEqual(before);
  expect(facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(sessionId);
  await restored.inquiryResetActions.resetInquiry(true);
  expect(restored.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
  const nextGroup = await restored.groupEngineActions.createDraftGroup("Next inquiry");
  expect((await restored.repositoryPort.getGroup(nextGroup))?.name).toBe("Next inquiry");
});

it("restores Gate records when removing the recovery envelope fails after Guest cleanup", async () => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  const facts = await import("./guest-flow-facts");
  const groupId = await fresh.groupEngineActions.createDraftGroup("Still recoverable");
  const sessionId = await fresh.playerEngineActions.startSession("recovery-treatment", groupId, ["one"]);
  await fresh.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  const before = await fresh.repositoryPort.getPlayerSession(sessionId);
  const remove = Storage.prototype.removeItem;
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
    if (key === "pic-web.inquiry-reset-recovery.v1") throw new Error("Envelope cleanup unavailable");
    remove.call(this, key);
  });
  await expect(fresh.inquiryResetActions.resetInquiry(true)).rejects.toThrow("Envelope cleanup unavailable");
  expect(await fresh.repositoryPort.getPlayerSession(sessionId)).toEqual(before);
  expect((await fresh.repositoryPort.getGroup(groupId))?.name).toBe("Still recoverable");
  expect(facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(sessionId);
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
  vi.restoreAllMocks();
  await fresh.inquiryResetActions.resetInquiry(true);
  expect(localStorage.getItem("pic-web.inquiry-reset-recovery.v1")).toBeNull();
});

it.each([false, true])("retains latest Finish kind after gate/cleanup failures, older persisted intent=%s", async (older) => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  await import("./guest-flow-facts");
  const sessionId = await fresh.playerEngineActions.startSession("gate-write-treatment", null, ["one"]);
  if (older) await fresh.sessionEngineActions.onFinishRequested(sessionId, "finish");
  const provider = fresh.repositoryPort.getProvider() as LocalGuestRepository;
  vi.spyOn(provider, "saveGuestSessionGate").mockRejectedValueOnce(new Error("Gate write unavailable"));
  await expect(fresh.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway"))
    .rejects.toThrow("Gate write unavailable");
  vi.spyOn(provider, "clear").mockRejectedValueOnce(new Error("Cleanup unavailable"));
  await expect(fresh.inquiryResetActions.resetInquiry(true)).rejects.toThrow("Cleanup unavailable");
  expect(await fresh.repositoryPort.getGuestSessionGate()).toEqual({
    gateTriggered: true, pendingFinishRequest: { sessionId, kind: "finishAnyway", promotionPayloadVersion: 3 },
  });
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
  await fresh.inquiryResetActions.resetInquiry(true);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
});

it.each([null, { activeGroupId: 4 }])("ignores malformed reset recovery facts %s without crashing boot", async (facts) => {
  vi.resetModules();
  localStorage.clear();
  localStorage.setItem("pic-web.inquiry-reset-recovery.v1", JSON.stringify({
    gate: { gateTriggered: true, pendingFinishRequest: { sessionId: "old", kind: "invalid" } }, facts,
  }));
  const { compositionRoot: fresh } = await import("./composition-root");
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
  expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it.each([false, true])("waits for promotion and re-evaluates ownership, prior reset failure=%s", async (failedReset) => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  await import("./guest-flow-facts");
  const groupId = await fresh.groupEngineActions.createDraftGroup("Promoted focus");
  await fresh.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await fresh.groupEngineActions.finalizeGroup(groupId);
  const sessionId = await fresh.playerEngineActions.startSession("promotion-treatment", groupId, ["one"]);
  await fresh.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  if (failedReset) {
    vi.spyOn(fresh.repositoryPort.getProvider() as LocalGuestRepository, "clear")
      .mockRejectedValueOnce(new Error("Temporary cleanup failure"));
    await expect(fresh.inquiryResetActions.resetInquiry(true)).rejects.toThrow("Temporary cleanup failure");
  }
  const snapshot = (await fresh.promotePathActions.assembleGuestSnapshotForPendingGate())!;
  const port = createInMemoryAuthenticatedPort();
  const promote = port.promoteGuestToAccount.bind(port);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(port, "promoteGuestToAccount").mockImplementation(async (input) => {
    await paused;
    return promote(input);
  });
  const promotion = fresh.promotePathActions.promoteWithAuthenticatedRepository(port, snapshot, "saved-owner");
  let settled = false;
  const reset = fresh.inquiryResetActions.resetInquiry().then((result) => { settled = true; return result; });
  await Promise.resolve();
  expect(settled).toBe(false);
  release();
  await promotion;
  const saved = await port.getPlayerSession(sessionId);
  const row = await port.getOrCreateLibraryRow("promotion-treatment", { source: "test", first_seen_at: "2026-10-14" });
  expect(await reset).toBe("reset");
  expect(fresh.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  expect(fresh.repositoryPort.getProvider()).toBe(port);
  expect(await port.getPlayerSession(sessionId)).toEqual(saved);
  expect((await port.getGroup(groupId))?.name).toBe("Promoted focus");
  expect(row.use_count).toBe(1);
  expect(fresh.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it("settles a pending Player write and preserves its recovery when the write fails", async () => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh } = await import("./composition-root");
  await import("./guest-flow-facts");
  const sessionId = await fresh.playerEngineActions.startSession("pending-treatment", null, ["one", "two"]);
  const before = await fresh.repositoryPort.getPlayerSession(sessionId);
  let reject!: (error: Error) => void;
  vi.spyOn(fresh.repositoryPort, "savePlayerSession").mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  const write = fresh.playerEngineActions.advance(sessionId);
  const writeFailure = expect(write).rejects.toThrow("Player write unavailable");
  const reset = fresh.inquiryResetActions.resetInquiry(true);
  await vi.waitFor(() => expect(reject).toBeTypeOf("function"));
  reject(new Error("Player write unavailable"));
  await writeFailure;
  await expect(reset).rejects.toThrow("Inquiry operation did not settle successfully");
  expect(await fresh.repositoryPort.getPlayerSession(sessionId)).toEqual(before);
  vi.restoreAllMocks();
  await fresh.inquiryResetActions.resetInquiry(true);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
});

for (const linked of [false, true]) {
  it.each(["yes", "no"] as const)(`detaches anchored linked=${linked} Player with terminal %s unchanged`, async (answer) => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: fresh, swapToSupabaseAdapter: swap } = await import("./composition-root");
    const facts = await import("./guest-flow-facts");
    const port = createInMemoryAuthenticatedPort();
    swap(port);
    vi.spyOn(fresh.repositoryPort.getProvider(), "promoteGuestToAccount").mockImplementation((input) => {
      return port.promoteGuestToAccount(input);
    });
    await fresh.sessionEngineActions.promote(await prepareGate(fresh), "saved-owner");
    const groupId = linked ? await fresh.groupEngineActions.createDraftGroup("Saved Player focus") : null;
    const sessionId = await fresh.playerEngineActions.startSession("saved-treatment", groupId, ["one", "two"]);
    await fresh.playerEngineActions.respondTerminalNemar(sessionId, answer);
    const before = await port.getPlayerSession(sessionId);
    const group = groupId === null ? null : await port.getGroup(groupId);
    expect(await fresh.inquiryResetActions.resetInquiry()).toBe("reset");
    expect(await port.getPlayerSession(sessionId)).toEqual(before);
    expect(before?.success_declared).toBe(false);
    const row = await port.getOrCreateLibraryRow("saved-treatment", { source: "test", first_seen_at: "2026-10-14" });
    expect(row.use_count).toBe(0);
    if (groupId !== null) expect(await port.getGroup(groupId)).toEqual(group);
    expect(facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
    expect(fresh.repositoryPort.getProvider()).toBe(port);
  });
}

it.each(["discard", "promote"])("keeps %s cleanup last after delayed pointer persistence", async (kind) => {
  vi.resetModules();
  localStorage.clear();
  const { compositionRoot: fresh, swapToSupabaseAdapter: swap } = await import("./composition-root");
  const facts = await import("./guest-flow-facts");
  await fresh.groupEngineActions.createDraftGroup("Pending pointer");
  const guestRepository = fresh.repositoryPort.getProvider() as LocalGuestRepository;
  const save = guestRepository.saveGuestFlowFacts.bind(guestRepository);
  let release!: () => void;
  let writeStarted!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const started = new Promise<void>((resolve) => { writeStarted = resolve; });
  vi.spyOn(guestRepository, "saveGuestFlowFacts").mockImplementationOnce(async (pointer) => {
    writeStarted();
    await paused;
    await save(pointer);
  });
  if (kind === "promote") {
    const port = createInMemoryAuthenticatedPort();
    swap(port);
    vi.spyOn(guestRepository, "promoteGuestToAccount").mockImplementation((input) => port.promoteGuestToAccount(input));
  }
  facts.persistGuestFlowFactsNow();
  const cleanup = kind === "discard"
    ? fresh.sessionEngineActions.discardGuestState()
    : fresh.sessionEngineActions.promote(await prepareGate(fresh), "cleanup-owner");
  await started;
  release();
  await cleanup;
  await facts.settleGuestFlowPersistence();
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
});

it("retains the frozen revision across authority renewal and retries under the same admission owner", async () => {
  vi.resetModules(); localStorage.clear();
  const { compositionRoot: root } = await import("./composition-root");
  const { inquiryGenerationStore } = await import("./inquiry-lifecycle");
  await import("./guest-flow-facts");
  await prepareGate(root);
  const snapshot = (await root.promotePathActions.assembleGuestSnapshotForPendingGate())!;
  const port = createInMemoryAuthenticatedPort();
  await root.promotePathActions.promoteWithAuthenticatedRepository(port, snapshot, "same-admission-owner");
  const groupId = await root.groupEngineActions.createDraftGroup("Same owner");
  const original = await root.groupEngineActions.addSymptom(groupId, "Original");
  await root.groupEngineActions.rate(original, { intensity: 4 });
  await root.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await root.groupEngineActions.finalizeGroup(groupId);
  const actions = root.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  expect(await actions.beginEdit()).toBe(true);
  const added = actions.add()!;
  actions.edit(added, { name: "Retained", intensity: 8, polarity: "positive" });
  expect(await actions.finish()).toBe(true);
  const commit = port.commitMembershipRevision.bind(port);
  const writes = vi.spyOn(port, "commitMembershipRevision").mockImplementationOnce(async (input) => {
    const group = await commit(input);
    root.authLifecycle.completeDetachment();
    return group;
  });
  expect(await actions.answer("split_suggested")).toBe(false);
  const frozen = structuredClone(writes.mock.calls[0]![0]);
  expect(root.questionnaire.store.getSnapshot().answer).toBe("split_suggested");
  expect(await actions.answer("together")).toBe(true);
  expect(writes.mock.calls[1]![0]).toEqual(frozen);
  expect((await port.getGroup(groupId))?.symptoms.map((row) => row.name)).toEqual(["Original", "Retained"]);
  expect(root.questionnaire.store.getSnapshot().existing?.joint_treatment_muscle_test).toBe("split_suggested");
});

it.each([undefined, 2] as const)(
  "retains the older Finish marker %s through failed reset recovery and reload", async (version) => {
  vi.resetModules(); localStorage.clear();
  const { compositionRoot: first } = await import("./composition-root");
  await import("./guest-flow-facts");
  const sessionId = await first.playerEngineActions.startSession("old-reset-treatment", null, ["one"]);
  const expected = { gateTriggered: true, pendingFinishRequest: { sessionId, kind: "finishAnyway" as const,
    ...(version === undefined ? {} : { promotionPayloadVersion: version }) } };
  await first.repositoryPort.saveGuestSessionGate({ ...expected,
    pendingFinishRequest: { ...expected.pendingFinishRequest, kind: "finish" } });
  vi.resetModules();
  const { compositionRoot: current } = await import("./composition-root");
  await import("./guest-flow-facts");
  await current.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  vi.spyOn(current.repositoryPort.getProvider() as LocalGuestRepository, "clear")
    .mockRejectedValueOnce(new Error("Old reset cleanup interrupted"));
  await expect(current.inquiryResetActions.resetInquiry(true)).rejects.toThrow("Old reset cleanup interrupted");
  expect(JSON.parse(localStorage.getItem("pic-web.inquiry-reset-recovery.v1")!).gate).toEqual(expected);
  vi.restoreAllMocks(); vi.resetModules();
  const { compositionRoot: restored } = await import("./composition-root");
  await vi.waitFor(async () => expect(await restored.repositoryPort.getGuestSessionGate()).toEqual(expected));
  await restored.inquiryResetActions.resetInquiry(true);
});
