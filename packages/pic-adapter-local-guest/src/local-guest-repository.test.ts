import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { FinalizedSymptomGroup, LibraryRowProvenance, PlayerSession, SymptomGroupDraft } from "pic-engine";
import { runRepositoryPortContractTests } from "pic-engine/test/contract/repository-port.contract";
import type { GuestKeyValueStorage } from "./index";
import { DEFAULT_GUEST_STORAGE_KEY, GuestRepositoryCannotPromoteError, LocalGuestRepository } from "./index";

/**
 * promoteGuestToAccount assertions are skipped here because this adapter's `promoteGuestToAccount` is a
 * deliberate no-op-or-error (see `index.ts`'s doc comment on `GuestRepositoryCannotPromoteError`) -
 * promotion always targets `pic-adapter-supabase`, never this adapter.
 *
 * This call is what satisfies ticket 10's Testing Requirement bullet "runs the full RepositoryPort
 * contract suite from ticket 03 against LocalGuestRepository, all green except promotion-specific cases":
 * every non-promotion `describe` block in the shared suite (`incrementUseCount`, `getOrCreateLibraryRow`,
 * `appendTimelineEvent`) runs unmodified against this adapter, and `skipPromoteGuestToAccount: true` makes
 * the exemption visible in the test run's own output (via the suite's internal `describe.skipIf`) rather
 * than silently omitted. A fresh random `storageKey` per port keeps every contract test's own
 * `beforeEach(() => port = makePort())` fully isolated from every other test.
 */
runRepositoryPortContractTests(() => new LocalGuestRepository({ storageKey: crypto.randomUUID() }), {
  skipPromoteGuestToAccount: true,
});

let nextFixtureSuffix = 0;

function uniqueId(prefix: string): string {
  nextFixtureSuffix += 1;
  return `${prefix}-${nextFixtureSuffix}`;
}

function buildDraftGroup(overrides: Partial<SymptomGroupDraft> = {}): SymptomGroupDraft {
  return {
    id: uniqueId("group"),
    name: "Lower Back",
    symptoms: [],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: null,
    joint_treatment_test_at: null,
    ...overrides,
  };
}

function buildFinalizedGroup(overrides: Partial<FinalizedSymptomGroup> = {}): FinalizedSymptomGroup {
  return {
    id: uniqueId("group"),
    name: "Lower Back",
    symptoms: [],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: "together",
    joint_treatment_test_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildPlayerSession(overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: uniqueId("player-session"),
    treatment_id: uniqueId("treatment"),
    linked_group_id: null,
    units: [{ unit_id: uniqueId("unit"), state: "unseen" }],
    terminal_nemar_response: null,
    success_declared: false,
    finished_at: null,
    integrating_reason: null,
    ...overrides,
  };
}

function buildProvenance(overrides: Partial<LibraryRowProvenance> = {}): LibraryRowProvenance {
  return { source: "guest_test", first_seen_at: new Date().toISOString(), ...overrides };
}

/** A second, independent in-memory `GuestKeyValueStorage` that two repository instances can share. */
function createSharedInMemoryStorage(): GuestKeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("LocalGuestRepository", () => {
  describe("getGroup / saveGroup", () => {
    it("returns null for an unknown group id", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });

      await expect(repository.getGroup("missing")).resolves.toBeNull();
    });

    it("returns exactly what was saved", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });
      const group = buildDraftGroup();

      await repository.saveGroup(group);

      await expect(repository.getGroup(group.id)).resolves.toEqual(group);
    });
  });

  describe("getPlayerSession / savePlayerSession", () => {
    it("returns null for an unknown session id", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });

      await expect(repository.getPlayerSession("missing")).resolves.toBeNull();
    });

    it("returns exactly what was saved when no unit is in_view", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });
      const session = buildPlayerSession({
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "skipped" },
        ],
      });

      await repository.savePlayerSession(session);

      await expect(repository.getPlayerSession(session.id)).resolves.toEqual(session);
    });
  });

  describe("Persistence Boundary Normalization (DEC-015): in_view is never durably observable", () => {
    it("downgrades an in_view unit to unseen on write, via savePlayerSession", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });
      const session = buildPlayerSession({
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "in_view" },
        ],
      });

      await repository.savePlayerSession(session);

      await expect(repository.getPlayerSession(session.id)).resolves.toEqual({
        ...session,
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "unseen" },
        ],
      });
    });

    it("defensively downgrades an in_view unit found on read, for storage edited out-of-band", async () => {
      const storage = createSharedInMemoryStorage();
      const storageKey = uniqueId("storage-key");
      const writer = new LocalGuestRepository({ storage, storageKey });
      const session = buildPlayerSession({ units: [{ unit_id: "u1", state: "completed" }] });
      await writer.savePlayerSession(session);

      // Hand-edit the stored snapshot directly, bypassing savePlayerSession's own write-time
      // normalization entirely - simulates a snapshot that predates this rule, or storage edited
      // out-of-band, per this adapter's documented "defensively, on read" guarantee.
      const snapshot = JSON.parse(storage.getItem(storageKey) ?? "{}");
      snapshot.playerSessions[session.id].units.push({ unit_id: "u2", state: "in_view" });
      storage.setItem(storageKey, JSON.stringify(snapshot));

      const reader = new LocalGuestRepository({ storage, storageKey });

      await expect(reader.getPlayerSession(session.id)).resolves.toEqual({
        ...session,
        units: [
          { unit_id: "u1", state: "completed" },
          { unit_id: "u2", state: "unseen" },
        ],
      });
    });
  });

  describe("page reload persistence", () => {
    const reloadTitle =
      "data persists across two separate LocalGuestRepository instances backed by the same storage " +
      "key, simulating a page reload";

    it(reloadTitle, async () => {
      const storage = createSharedInMemoryStorage();
      const storageKey = uniqueId("storage-key");

      const beforeReload = new LocalGuestRepository({ storage, storageKey });
      const group = buildDraftGroup();
      await beforeReload.saveGroup(group);

      const afterReload = new LocalGuestRepository({ storage, storageKey });

      await expect(afterReload.getGroup(group.id)).resolves.toEqual(group);
    });

    it("reconnects via the fixed DEFAULT_GUEST_STORAGE_KEY when no storageKey is given", async () => {
      const storage = createSharedInMemoryStorage();
      const group = buildDraftGroup();

      await new LocalGuestRepository({ storage }).saveGroup(group);
      const afterReload = await new LocalGuestRepository({ storage }).getGroup(group.id);

      expect(afterReload).toEqual(group);
      // Confirms both instances actually agreed on the documented fixed key, not two coincidentally
      // matching values - a real browser reload never passes an explicit storageKey either.
      expect(storage.getItem(DEFAULT_GUEST_STORAGE_KEY)).not.toBeNull();
    });
  });

  describe("promoteGuestToAccount", () => {
    it("always rejects with GuestRepositoryCannotPromoteError instead of writing anything", async () => {
      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });
      const group = buildFinalizedGroup();
      const playerSession = buildPlayerSession({ linked_group_id: group.id });

      await expect(
        repository.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group,
          playerSession,
          newUserId: uniqueId("user"),
        }),
      ).rejects.toBeInstanceOf(GuestRepositoryCannotPromoteError);

      // The rejected call must not have written the group/session it was given as a side effect.
      await expect(repository.getGroup(group.id)).resolves.toBeNull();
      await expect(repository.getPlayerSession(playerSession.id)).resolves.toBeNull();
    });
  });

  describe("network isolation", () => {
    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("never calls fetch, XMLHttpRequest, or any Supabase client method", async () => {
      // No Supabase client is ever imported or constructed anywhere in this package, so there is no
      // "Supabase client method" for a runtime spy to attach to - that half of this guarantee is enforced
      // statically instead, by asserting the adapter's own source never imports the real Supabase SDK
      // package. This deliberately checks for the package specifier ("@supabase/") rather than the bare
      // word "supabase" - index.ts's own doc comments and GuestRepositoryCannotPromoteError's message
      // legitimately *mention* "pic-adapter-supabase" in prose (explaining where promotion actually goes),
      // which a bare word-match would misfire on.
      const indexSourcePath = fileURLToPath(new URL("./index.ts", import.meta.url));
      const indexSource = readFileSync(indexSourcePath, "utf8");
      expect(indexSource).not.toMatch(/@supabase\//);

      const fetchSpy = vi.fn(() => {
        throw new Error("LocalGuestRepository must never call fetch");
      });
      const xhrSpy = vi.fn(() => {
        throw new Error("LocalGuestRepository must never construct XMLHttpRequest");
      });
      vi.stubGlobal("fetch", fetchSpy);
      vi.stubGlobal("XMLHttpRequest", xhrSpy);

      const repository = new LocalGuestRepository({ storageKey: uniqueId("storage-key") });
      const group = buildDraftGroup();
      await repository.saveGroup(group);
      await repository.getGroup(group.id);

      const session = buildPlayerSession();
      await repository.savePlayerSession(session);
      await repository.getPlayerSession(session.id);

      const row = await repository.getOrCreateLibraryRow(session.treatment_id, buildProvenance());
      await repository.incrementUseCount(row.id, uniqueId("idempotency-key"));
      await repository.appendTimelineEvent({
        log_type: "treatment_execution",
        treatment_id: session.treatment_id,
        library_row_id: row.id,
        linked_group_id: null,
        metadata: null,
      });
      await expect(
        repository.promoteGuestToAccount({
          idempotencyKey: uniqueId("idempotency-key"),
          group: buildFinalizedGroup(),
          playerSession: session,
          newUserId: uniqueId("user"),
        }),
      ).rejects.toThrow();

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();
    });
  });
});
