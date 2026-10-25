import { afterEach, describe, expect, it, vi } from "vitest";
import { InvalidSymptomOrderError } from "pic-engine";
import type { GuestKeyValueStorage } from "./index";
import {
  createIsolatedGuestWriteLock,
  GuestStorageWriteLockUnavailableError,
  LocalGuestRepository,
} from "./index";

function memoryStorage(initial?: Record<string, string>): GuestKeyValueStorage {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

const group = (
  id: string,
  symptoms: Array<{
    id: string;
    name: string;
    polarity: "negative" | "positive";
    intensity: number;
    rated_at: string | null;
  }>,
  revision?: number,
) => ({
  id,
  name: `Group ${id}`,
  symptoms,
  ...(revision === undefined ? {} : { revision }),
  created_at: "2026-01-01T00:00:00.000Z",
  joint_treatment_muscle_test: null,
  joint_treatment_test_at: null,
});

const playerSession = {
  id: "session-1",
  treatment_id: "treatment-1",
  linked_group_id: null,
  units: [{ unit_id: "unit-1", state: "unseen" as const }],
  terminal_nemar_response: null,
  success_declared: false,
  finished_at: null,
  integrating_reason: null,
};

const provenance = { source: "test", first_seen_at: "2026-01-01T00:00:00.000Z" } as const;

afterEach(() => vi.unstubAllGlobals());

describe("LocalGuestRepository durable write lock", () => {
  it("rejects a corrupt legacy group with duplicate member ids without rewriting it", async () => {
    const duplicate = { id: "same", name: "Duplicate", polarity: "negative" as const, intensity: 0, rated_at: null };
    const raw = JSON.stringify({ groups: { corrupt: group("corrupt", [duplicate, duplicate]) } });
    const storage = memoryStorage({ corrupt: raw });
    const repository = new LocalGuestRepository({ storage, storageKey: "corrupt",
      writeLock: createIsolatedGuestWriteLock(storage) });
    await expect(repository.reorderSymptoms("corrupt", ["same", "same"], 0))
      .rejects.toBeInstanceOf(InvalidSymptomOrderError);
    expect(storage.getItem("corrupt")).toBe(raw);
  });
  it("reads a legacy ordered group at revision zero without rewriting its blob", async () => {
    const storageKey = "legacy-key";
    const legacyGroup = group("g1", [
      { id: "s2", name: "Second", polarity: "negative", intensity: 0, rated_at: null },
      { id: "s1", name: "First", polarity: "positive", intensity: 4, rated_at: null },
    ]);
    const raw = JSON.stringify({ groups: { g1: legacyGroup }, playerSessions: {}, libraryRows: {}, timelineEvents: [] });
    const storage = memoryStorage({ [storageKey]: raw });
    const repository = new LocalGuestRepository({ storage, storageKey, writeLock: createIsolatedGuestWriteLock(storage) });

    await expect(repository.getGroup("g1")).resolves.toEqual({ ...legacyGroup, revision: 0 });
    expect(storage.getItem(storageKey)).toBe(raw);
  });

  it("keeps reads available and rejects every attempted persistent write when navigator.locks is absent", async () => {
    const storageKey = "unlocked-persistent-key";
    const savedGroup = group("g1", [
      { id: "s1", name: "Back", polarity: "negative", intensity: 0, rated_at: null },
      { id: "s2", name: "Neck", polarity: "positive", intensity: 3, rated_at: null },
    ]);
    const raw = JSON.stringify({ groups: { g1: savedGroup }, playerSessions: {}, libraryRows: {}, timelineEvents: [] });
    const storage = memoryStorage({ [storageKey]: raw });
    vi.stubGlobal("navigator", {});
    const repository = new LocalGuestRepository({ storage, storageKey });

    await expect(repository.getGroup("g1")).resolves.toEqual({ ...savedGroup, revision: 0 });
    await expect(repository.saveGroup({ ...savedGroup, name: "Changed" }))
      .rejects.toBeInstanceOf(GuestStorageWriteLockUnavailableError);
    await expect(repository.reorderSymptoms("g1", ["s2", "s1"], 0))
      .rejects.toBeInstanceOf(GuestStorageWriteLockUnavailableError);
    await expect(repository.clear()).rejects.toBeInstanceOf(GuestStorageWriteLockUnavailableError);
    expect(storage.getItem(storageKey)).toBe(raw);
  });

  it("accepts an explicitly injected lock and uses its storage key", async () => {
    const storageKey = "injected-key";
    const storage = memoryStorage();
    const calls: string[] = [];
    const baseLock = createIsolatedGuestWriteLock(storage);
    const writeLock = async <T>(key: string, write: () => Promise<T>) => {
      calls.push(key);
      return baseLock(key, write);
    };
    const repository = new LocalGuestRepository({ storage, storageKey, writeLock });

    await repository.saveGroup(group("g1", []));

    expect(calls).toEqual([storageKey]);
    await expect(repository.getGroup("g1")).resolves.toMatchObject({ id: "g1", revision: 0 });
  });

  it("preserves the revision for empty, singleton, and identical-order reorder no-ops", async () => {
    const storage = memoryStorage();
    const storageKey = "no-op-key";
    const repository = new LocalGuestRepository({ storage, storageKey, writeLock: createIsolatedGuestWriteLock(storage) });
    const empty = group("empty", []);
    const single = group("single", [
      { id: "only", name: "Only", polarity: "negative", intensity: 0, rated_at: null },
    ]);
    const ordered = group("ordered", [
      { id: "first", name: "First", polarity: "negative", intensity: 0, rated_at: null },
      { id: "second", name: "Second", polarity: "positive", intensity: 2, rated_at: null },
    ]);
    await repository.saveGroup(empty);
    await repository.saveGroup(single);
    await repository.saveGroup(ordered);

    await expect(repository.reorderSymptoms("empty", [], 0)).resolves.toMatchObject({ revision: 0 });
    await expect(repository.reorderSymptoms("single", ["only"], 0)).resolves.toMatchObject({ revision: 0 });
    await expect(repository.reorderSymptoms("ordered", ["first", "second"], 0)).resolves.toMatchObject({
      revision: 0,
      symptoms: ordered.symptoms,
    });
  });

  it("queues whole-blob writers from separate ports behind the same storage-key lock", async () => {
    const storageKey = "shared-key";
    const storage = memoryStorage();
    const queueLock = createIsolatedGuestWriteLock(storage);
    const seed = new LocalGuestRepository({ storage, storageKey, writeLock: queueLock });
    await seed.saveGroup(group("g1", [
      { id: "s1", name: "Back", polarity: "negative", intensity: 0, rated_at: null },
      { id: "s2", name: "Neck", polarity: "positive", intensity: 3, rated_at: null },
    ]));
    await seed.savePlayerSession(playerSession);
    const row = await seed.getOrCreateLibraryRow("treatment-1", provenance);

    let release!: () => void;
    let entered!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const enteredLock = new Promise<void>((resolve) => { entered = resolve; });
    let holdFirst = true;
    const barrierLock = async <T>(key: string, write: () => Promise<T>) => queueLock(key, async () => {
      if (holdFirst) {
        holdFirst = false;
        entered();
        await held;
      }
      return write();
    });
    const ports = Array.from({ length: 7 }, () =>
      new LocalGuestRepository({ storage, storageKey, writeLock: barrierLock }),
    );
    const operations = [
      ports[0]!.saveGroup({ ...group("g1", [
        { id: "s1", name: "Back", polarity: "negative", intensity: 0, rated_at: null },
        { id: "s2", name: "Neck", polarity: "positive", intensity: 3, rated_at: null },
      ]), revision: 0 }),
      ports[1]!.savePlayerSession({ ...playerSession, success_declared: true }),
      ports[2]!.getOrCreateLibraryRow("treatment-2", provenance),
      ports[3]!.incrementUseCount(row.id, "increment-1"),
      ports[4]!.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: "treatment-1",
        library_row_id: row.id,
        linked_group_id: null,
        metadata: null,
      }),
      ports[5]!.saveGuestSessionGate({ gateTriggered: true, pendingFinishRequest: null }),
      ports[6]!.saveGuestFlowFacts({
        activeGroupId: "g1",
        activePlayerSessionId: "session-1",
        symptomAdditionComplete: true,
        groupFinalized: false,
        summaryAcknowledged: false,
      }),
    ];
    const settled: boolean[] = operations.map(() => false);
    operations.forEach((operation, index) => {
      void operation.then(
        () => { settled[index] = true; },
        () => { settled[index] = true; },
      );
    });
    const beforeHold = storage.getItem(storageKey);
    await enteredLock;
    try {
      await Promise.resolve();
      expect(settled).toEqual([false, false, false, false, false, false, false]);
      expect(storage.getItem(storageKey)).toBe(beforeHold);
    } finally {
      release();
      await Promise.allSettled(operations);
    }

    const reader = new LocalGuestRepository({ storage, storageKey, writeLock: queueLock });
    await expect(reader.getGroup("g1")).resolves.toMatchObject({
      id: "g1",
      revision: 0,
      symptoms: [{ id: "s1" }, { id: "s2" }],
    });
    await expect(reader.getPlayerSession("session-1")).resolves.toMatchObject({ success_declared: true });
    await expect(reader.getOrCreateLibraryRow("treatment-2", provenance)).resolves.toMatchObject({
      treatment_id: "treatment-2",
    });
    await expect(reader.incrementUseCount(row.id, "increment-2")).resolves.toMatchObject({ use_count: 2 });
    await expect(reader.getGuestSessionGate()).resolves.toEqual({ gateTriggered: true, pendingFinishRequest: null });
    expect(reader.getGuestFlowFactsSync().summaryAcknowledged).toBe(false);

    // clear() participates in the same key queue; hold a concurrent save behind it, then verify its
    // resulting snapshot survives as one complete blob after the clear has finished.
    let releaseClear!: () => void;
    let clearEntered!: () => void;
    const clearHeld = new Promise<void>((resolve) => { releaseClear = resolve; });
    const clearWasEntered = new Promise<void>((resolve) => { clearEntered = resolve; });
    const clearLock = async <T>(key: string, write: () => Promise<T>) => queueLock(key, async () => {
      clearEntered();
      await clearHeld;
      return write();
    });
    const clearingPort = new LocalGuestRepository({ storage, storageKey, writeLock: clearLock });
    const savingPort = new LocalGuestRepository({ storage, storageKey, writeLock: queueLock });
    const clearPromise = clearingPort.clear();
    await clearWasEntered;
    const afterClearSave = savingPort.saveGuestFlowFacts({
      activeGroupId: "after",
      activePlayerSessionId: null,
      symptomAdditionComplete: false,
      groupFinalized: false,
      summaryAcknowledged: false,
    });
    try {
      await Promise.resolve();
      expect(storage.getItem(storageKey)).not.toBeNull();
    } finally {
      releaseClear();
      await Promise.allSettled([clearPromise, afterClearSave]);
    }
    const finalReader = new LocalGuestRepository({ storage, storageKey, writeLock: queueLock });
    expect(finalReader.getGuestFlowFactsSync().activeGroupId).toBe("after");
  });
});
