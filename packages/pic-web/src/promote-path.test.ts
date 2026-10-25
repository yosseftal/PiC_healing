// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY, LocalGuestRepository } from "pic-adapter-local-guest";
import type { FinalizedSymptomGroup, PlayerSession, RepositoryPort } from "pic-engine";
import { GroupNotFoundError, prepareGroupSave, prepareSymptomReorder, type SymptomGroup } from "pic-engine";
import { compositionRoot } from "./composition-root";
import {
  assembleGuestSnapshotForPendingGate,
  createSupabaseRepositoryFromClient,
  promoteWithAuthenticatedRepository,
  signInWithCredentials,
  ensureOwnProfile,
  getVerifiedUser,
} from "./promote-path";

function loadEnvLocal(path: string): Record<string, string> {
  const content = readFileSync(path, "utf8");
  const env: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function buildFinalizedGroup(overrides: Partial<FinalizedSymptomGroup> = {}): FinalizedSymptomGroup {
  return {
    id: randomUUID(),
    name: "Lower Back",
    symptoms: [],
    created_at: new Date().toISOString(),
    joint_treatment_muscle_test: "together",
    joint_treatment_test_at: new Date().toISOString(),
    ...overrides,
  };
}

function buildPlayerSession(groupId: string, overrides: Partial<PlayerSession> = {}): PlayerSession {
  return {
    id: randomUUID(),
    treatment_id: "treatment-fixture",
    linked_group_id: groupId,
    units: [{ unit_id: "a", state: "completed" }],
    terminal_nemar_response: "yes",
    success_declared: false,
    finished_at: null,
    integrating_reason: null,
    ...overrides,
  };
}

function storageHasGuestEntityData(raw: string | null): boolean {
  if (raw === null) {
    return false;
  }
  const snapshot = JSON.parse(raw) as {
    groups?: Record<string, unknown>;
    playerSessions?: Record<string, unknown>;
  };
  return (
    Object.keys(snapshot.groups ?? {}).length > 0 || Object.keys(snapshot.playerSessions ?? {}).length > 0
  );
}

describe("assembleGuestSnapshotForPendingGate", () => {
  let guestRepository: LocalGuestRepository;

  beforeEach(() => {
    localStorage.clear();
    guestRepository = new LocalGuestRepository();
  });

  it("returns null when no pending finish request", async () => {
    await expect(assembleGuestSnapshotForPendingGate(guestRepository)).resolves.toBeNull();
  });

  it("returns group+session for a gated guest session", async () => {
    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id);
    await guestRepository.saveGroup(group);
    await guestRepository.savePlayerSession(session);
    await guestRepository.saveGuestSessionGate({
      gateTriggered: true,
      pendingFinishRequest: { sessionId: session.id, kind: "finish" },
    });

    const snapshot = await assembleGuestSnapshotForPendingGate(guestRepository);
    expect(snapshot).toEqual({ group: { ...group, revision: 0 }, playerSession: session });
    expect(snapshot).not.toHaveProperty("promotionPayloadVersion");
  });

  it("returns group: null for a gated guest session with no linked Symptom Group (ticket 08)", async () => {
    const session = buildPlayerSession("unused-group-id", { linked_group_id: null });
    await guestRepository.savePlayerSession(session);
    await guestRepository.saveGuestSessionGate({
      gateTriggered: true,
      pendingFinishRequest: { sessionId: session.id, kind: "finish" },
    });

    const snapshot = await assembleGuestSnapshotForPendingGate(guestRepository);
    expect(snapshot).toEqual({ group: null, playerSession: session });
  });

  it("returns null when the pending session's own row cannot be found, even if unlinked", async () => {
    await guestRepository.saveGuestSessionGate({
      gateTriggered: true,
      pendingFinishRequest: { sessionId: "missing-session", kind: "finish" },
    });

    await expect(assembleGuestSnapshotForPendingGate(guestRepository)).resolves.toBeNull();
  });
});

describe("promoteWithAuthenticatedRepository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("swaps to Supabase before promote and rolls back on failure", async () => {
    const { repositoryPort, sessionEngineActions, sessionEngineStore } = compositionRoot;
    const guestProvider = repositoryPort.getProvider();

    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id);
    await repositoryPort.saveGroup(group);
    await repositoryPort.savePlayerSession(session);
    await sessionEngineActions.onFinishRequested(session.id, "finish");

    const failingPort: RepositoryPort = {
      ...(guestProvider as RepositoryPort),
      async promoteGuestToAccount() {
        throw new Error("network drop");
      },
    };

    const registerAuthenticatedPort = vi.fn();

    await promoteWithAuthenticatedRepository({
      delegatingPort: repositoryPort,
      authenticatedPort: failingPort,
      guestSnapshot: { group, playerSession: session },
      newUserId: "user-rollback",
      promote: sessionEngineActions.promote.bind(sessionEngineActions),
      getPromotionStatus: () => sessionEngineStore.getSnapshot().promotionStatus,
      registerAuthenticatedPort,
    });

    expect(registerAuthenticatedPort).toHaveBeenCalledWith(failingPort);
    expect(repositoryPort.getProvider()).toBe(guestProvider);
    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("failed");
  });

  it.each(["he", "en"])("preserves %s preference through promotion without therapeutic payload leakage", async (locale) => {
    vi.resetModules();
    localStorage.clear();
    localStorage.setItem("pic-web.locale.v1", locale);
    const { compositionRoot: root } = await import("./composition-root");
    const { repositoryPort, sessionEngineActions, promotePathActions, sessionEngineStore } = root;
    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id);
    await repositoryPort.saveGroup(group);
    await repositoryPort.savePlayerSession(session);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    const authenticatedPort = createInMemoryAuthenticatedPort();
    const promotion = vi.spyOn(authenticatedPort, "promoteGuestToAccount");
    const timeline = vi.spyOn(authenticatedPort, "appendTimelineEvent");
    await sessionEngineActions.onFinishRequested(session.id, "finish");
    const pendingSnapshot = await promotePathActions.assembleGuestSnapshotForPendingGate();
    expect(pendingSnapshot).toEqual({
      group: { ...group, revision: 0 }, playerSession: session, promotionPayloadVersion: 2,
    });

    await promotePathActions.promoteWithAuthenticatedRepository(
      authenticatedPort,
      pendingSnapshot!,
      "user-success",
    );

    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    expect(repositoryPort.getProvider()).toBe(authenticatedPort);
    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
    expect(localStorage.getItem("pic-web.locale.v1")).toBe(locale);
    expect(promotion).toHaveBeenCalledWith({
      idempotencyKey: group.id, group: { ...group, revision: 0 }, playerSession: session,
      newUserId: "user-success", promotionPayloadVersion: 2,
    });
    expect(await authenticatedPort.getGroup(group.id)).toEqual({ ...group, revision: 0 });
    expect(await authenticatedPort.getPlayerSession(session.id)).toEqual({
      ...session, success_declared: true, finished_at: expect.any(String),
    });
    for (const [event] of timeline.mock.calls) {
      expect(event).toEqual({
        log_type: "treatment_execution", treatment_id: session.treatment_id,
        library_row_id: expect.any(String), linked_group_id: group.id, metadata: null,
      });
    }
    promotion.mockRestore();
    timeline.mockRestore();
  });

  it("promotes an unlinked session (group: null) successfully via assembleGuestSnapshotForPendingGate (ticket 08)", async () => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: root } = await import("./composition-root");
    const { repositoryPort, sessionEngineActions, promotePathActions, sessionEngineStore } = root;
    const session = buildPlayerSession("unused-group-id", { linked_group_id: null });
    await repositoryPort.savePlayerSession(session);

    const guestRepository = repositoryPort.getProvider() as LocalGuestRepository;
    await sessionEngineActions.onFinishRequested(session.id, "finish");
    await guestRepository.saveGuestSessionGate({
      gateTriggered: true,
      pendingFinishRequest: { sessionId: session.id, kind: "finish" },
    });

    const guestSnapshot = await promotePathActions.assembleGuestSnapshotForPendingGate();
    expect(guestSnapshot).toEqual({ group: null, playerSession: session });

    const authenticatedPort = createInMemoryAuthenticatedPort();
    await promotePathActions.promoteWithAuthenticatedRepository(
      authenticatedPort,
      guestSnapshot!,
      "user-unlinked-success",
    );

    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
    expect(repositoryPort.getProvider()).toBe(authenticatedPort);
    // The gated Finish request completes as part of promote() (SessionEngine's own replay), so the
    // promoted row is success_declared afterward - not a byte-for-byte echo of the pre-promotion fixture.
    const promoted = await authenticatedPort.getPlayerSession(session.id);
    expect(promoted?.success_declared).toBe(true);
    expect(promoted?.finished_at).not.toBeNull();
    expect(promoted?.linked_group_id).toBeNull();
  });
});

describe("verified sign-in language independence", () => {
  it.each(["he", "en"])("keeps %s preference and sends only the existing password credentials", async (locale) => {
    localStorage.setItem("pic-web.locale.v1", locale);
    const client = createClient("https://auth-fixture.invalid", "fixture-anon-key", {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const user = {
      id: "account-fixture", email_confirmed_at: "2026-10-11", app_metadata: {}, user_metadata: {},
      aud: "authenticated", created_at: "2026-10-11",
    };
    const signIn = vi.spyOn(client.auth, "signInWithPassword")
      .mockResolvedValue({ data: { user, session: {
        access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600,
        token_type: "bearer", user,
      } }, error: null });
    const verified = vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
    const credentials = { email: "fixture@example.com", password: "  fixture-password  " };
    const result = await signInWithCredentials(client, credentials);
    expect(signIn).toHaveBeenCalledExactlyOnceWith(credentials);
    expect(result.userId).toBe("account-fixture");
    expect(localStorage.getItem("pic-web.locale.v1")).toBe(locale);
    expect(result.client).toBe(client);
    expect(verified).toHaveBeenCalledOnce();
    signIn.mockRestore();
  });
});

describe("real login promotion coordination", () => {
  afterAll(() => vi.unstubAllEnvs());

  it("deduplicates login, freezes retry work, and reuses a verified identity without another password", async () => {
    vi.resetModules();
    localStorage.clear();
    vi.stubEnv("VITE_SUPABASE_URL", "https://coordination-fixture.invalid");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "fixture-public-key");
    const path = await import("./promote-path");
    const user = { id: randomUUID(), email_confirmed_at: "2026-10-14", app_metadata: {}, user_metadata: {},
      aud: "authenticated", created_at: "2026-10-14" };
    const client = createClient("https://coordination-fixture.invalid", "fixture-public-key", {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: async () => new Response(JSON.stringify([{ id: user.id }]), { status: 200 }) },
    });
    vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
    const signIn = vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({
      data: { user, session: {
        user, access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600, token_type: "bearer",
      } }, error: null,
    });
    let release!: () => void;
    const held = new Promise<void>((resolve) => { release = resolve; });
    const getUser = vi.spyOn(client.auth, "getUser").mockImplementation(async () => {
      await held;
      return { data: { user }, error: null };
    });
    const repository = path.createSupabaseRepositoryFromClient(client);
    const rpc = vi.spyOn(repository, "promoteGuestToAccount").mockRejectedValue(new Error("RPC unavailable"));
    let rejectRpc!: (error: Error) => void;
    rpc.mockImplementationOnce(() => new Promise((_, reject) => { rejectRpc = reject; }));
    vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(repository);
    const { compositionRoot: root } = await import("./composition-root");
    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id);
    await root.repositoryPort.saveGroup(group);
    await root.repositoryPort.savePlayerSession(session);
    await root.sessionEngineActions.onFinishRequested(session.id, "finishAnyway");
    const guest = root.repositoryPort.getProvider();
    let finishWrite!: () => void;
    const pendingWrite = new Promise<void>((resolve) => { finishWrite = resolve; });
    const save = guest.savePlayerSession.bind(guest);
    vi.spyOn(guest, "savePlayerSession").mockImplementationOnce(async (record) => {
      await pendingWrite;
      await save(record);
    });
    const write = root.playerEngineActions.respondTerminalNemar(session.id, "no");
    const credentials = { email: "fixture@example.com", password: "  unchanged secret  " };
    const first = root.promotePathActions.signInAndPromote(credentials);
    const duplicate = root.promotePathActions.signInAndPromote(credentials);
    await Promise.resolve();
    expect(signIn).not.toHaveBeenCalled();
    finishWrite();
    await write;
    release();
    await vi.waitFor(() => expect(rpc).toHaveBeenCalledOnce());
    await expect(root.groupEngineActions.createDraftGroup("Must wait for saving")).rejects.toThrow("Saving is pending");
    let resetSettled = false;
    const reset = root.inquiryResetActions.resetInquiry().then((result) => { resetSettled = true; return result; });
    await Promise.resolve();
    expect(resetSettled).toBe(false);
    rejectRpc(new Error("RPC unavailable"));
    await Promise.all([first, duplicate]);
    expect(await reset).toBe("confirmation");
    expect(signIn).toHaveBeenCalledExactlyOnceWith(credentials);
    expect(rpc).toHaveBeenCalledTimes(1);
    const original = rpc.mock.calls[0]![0];
    expect(original.playerSession.terminal_nemar_response).toBe("no");
    expect(root.promotePathActions.hasVerifiedIdentity()).toBe(true);
    expect(root.repositoryPort.getProvider()).not.toBe(repository);
    await root.repositoryPort.savePlayerSession({ ...session, terminal_nemar_response: "yes" });
    await root.promotePathActions.signInAndPromote();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(rpc.mock.calls[1]![0]).toEqual(original);
    expect((await root.repositoryPort.getGuestSessionGate()).pendingFinishRequest?.kind).toBe("finishAnyway");
    getUser.mockResolvedValue({ data: { user: { ...user, id: randomUUID() } }, error: null });
    await expect(root.promotePathActions.signInAndPromote()).rejects.toThrow("identity");
    expect(rpc).toHaveBeenCalledTimes(2);
    expect(root.promotePathActions.hasVerifiedIdentity()).toBe(false);
    vi.restoreAllMocks();
  });
});

function createInMemoryAuthenticatedPort(): RepositoryPort {
  const groups = new Map<string, SymptomGroup>();
  const sessions = new Map<string, PlayerSession>();
  const libraryRows = new Map<string, { id: string; treatment_id: string; use_count: number }>();
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
        return {
          ...existing,
          provenance,
          variant_type: "original" as const,
          global_reference_id: treatmentId,
          protocol_content: null,
          created_at: new Date().toISOString(),
        };
      }
      const row = {
        id: nextIdPrefix("library"),
        treatment_id: treatmentId,
        use_count: 0,
        provenance,
        variant_type: "original" as const,
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
      return {
        ...row,
        provenance: { source: "guest_promotion", first_seen_at: new Date().toISOString() },
        variant_type: "original" as const,
        global_reference_id: row.treatment_id,
        protocol_content: null,
        created_at: new Date().toISOString(),
      };
    },
    async appendTimelineEvent(event) {
      return {
        ...event,
        id: nextIdPrefix("timeline"),
        created_at: new Date().toISOString(),
      };
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

const envPath = join(process.cwd(), ".env.local");
let remoteEnv: Record<string, string> | null = null;
try {
  remoteEnv = loadEnvLocal(envPath);
} catch {
  remoteEnv = null;
}

describe("promote path remote integration", () => {
  const TEST_USER_PASSWORD = `pic-healing-promote-path-${randomUUID()}`;
  let serviceClient: SupabaseClient;
  let seedTreatmentId: string;
  let testUser: { userId: string; client: SupabaseClient };
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    if (!remoteEnv?.SUPABASE_URL || !remoteEnv.SUPABASE_ANON_KEY || !remoteEnv.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        "promote-path.test.ts requires SUPABASE_URL, SUPABASE_ANON_KEY and " +
        "SUPABASE_SERVICE_ROLE_KEY in root .env.local; see docs/testing/supabase-remote-testing.md.",
      );
    }
    const env = remoteEnv;
    serviceClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: treatmentRow, error: treatmentError } = await serviceClient
      .from("treatments")
      .select("id")
      .is("user_id", null)
      .limit(1)
      .single();
    if (treatmentError !== null || treatmentRow === null) {
      throw new Error(`Failed to fetch seeded treatment id: ${treatmentError?.message ?? "none"}`);
    }
    seedTreatmentId = treatmentRow.id as string;

    const email = `pic-promote-path-${randomUUID()}@example.com`;
    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password: TEST_USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "  Verified Event Manager  " },
    });
    if (createError !== null || created.user === null) {
      throw new Error(`Failed to create ephemeral test user: ${createError?.message ?? "no user"}`);
    }
    createdUserIds.push(created.user.id);

    const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password: TEST_USER_PASSWORD,
    });
    if (signInError !== null) {
      throw new Error(`Failed to sign in ephemeral test user: ${signInError.message}`);
    }

    testUser = { userId: created.user.id, client: anonClient };
    const missing = await anonClient.from("profiles").select("id").eq("id", created.user.id).maybeSingle();
    expect(missing.error).toBeNull();
    expect(missing.data).toBeNull();
    await ensureOwnProfile(anonClient, await getVerifiedUser(anonClient));
  });

  afterAll(async () => {
    if (createdUserIds.length === 0) return;
    for (const table of ["timeline_events", "personal_treatment_library", "player_sessions", "symptom_groups"]) {
      const { error } = await serviceClient.from(table).delete().in("user_id", createdUserIds);
      if (error) throw new Error(`Failed to clean up ephemeral ${table}: ${error.message}`);
    }
    for (const userId of createdUserIds) {
      const { error } = await serviceClient.auth.admin.deleteUser(userId);
      if (error) throw new Error(`Failed to delete ephemeral Auth user: ${error.message}`);
    }
  });

  it("creates a missing own profile through RLS and preserves its edited name/preferences on repeated login", async () => {
    const profile = () => testUser.client.from("profiles").select("full_name, language_preferences")
      .eq("id", testUser.userId).single();
    expect((await profile()).data?.full_name).toBe("Verified Event Manager");
    const preferences = { positive_terms: ["personal choice"], inquiry_placeholder: "my words" };
    const update = await testUser.client.from("profiles").update({
      full_name: "Existing sovereign name", language_preferences: preferences,
    }).eq("id", testUser.userId);
    expect(update.error).toBeNull();
    await ensureOwnProfile(testUser.client, await getVerifiedUser(testUser.client));
    expect((await profile()).data).toEqual({ full_name: "Existing sovereign name", language_preferences: preferences });
  });

  it.each([true, false])("recovers a real committed RPC with a lost response exactly once, linked=%s", async (linked) => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: root } = await import("./composition-root");
    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id, {
      treatment_id: seedTreatmentId, linked_group_id: linked ? group.id : null,
      terminal_nemar_response: linked ? "yes" : "no",
    });
    if (linked) await root.repositoryPort.saveGroup(group);
    await root.repositoryPort.savePlayerSession(session);
    await root.sessionEngineActions.onFinishRequested(session.id, linked ? "finish" : "finishAnyway");
    const snapshot = await root.promotePathActions.assembleGuestSnapshotForPendingGate();
    expect(snapshot).not.toBeNull();
    const port = createSupabaseRepositoryFromClient(testUser.client);
    const commit = port.promoteGuestToAccount.bind(port);
    const rpc = vi.spyOn(port, "promoteGuestToAccount").mockImplementationOnce(async (input) => {
      await commit(input);
      throw new Error("Committed response lost in transit");
    });
    await root.promotePathActions.promoteWithAuthenticatedRepository(port, snapshot!, testUser.userId);
    expect(root.sessionEngineStore.getSnapshot().promotionStatus).toBe("failed");
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).not.toBeNull();
    await root.promotePathActions.promoteWithAuthenticatedRepository(port, snapshot!, testUser.userId);
    expect(rpc.mock.calls[1]![0]).toEqual(rpc.mock.calls[0]![0]);
    expect((await port.getPlayerSession(session.id))?.success_declared).toBe(true);
    const timeline = await testUser.client.from("timeline_events").select("id").eq("user_id", testUser.userId);
    const library = await testUser.client.from("personal_treatment_library").select("use_count")
      .eq("user_id", testUser.userId);
    expect(timeline.error).toBeNull();
    expect(timeline.data).toHaveLength(1);
    expect(library.error).toBeNull();
    expect(library.data).toEqual([{ use_count: 1 }]);
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("pic-web.promotion-recovery.v1")).toBeNull();
    rpc.mockRestore();
    for (const table of ["timeline_events", "personal_treatment_library", "player_sessions", "symptom_groups"]) {
      const cleanup = await serviceClient.from(table).delete().eq("user_id", testUser.userId);
      expect(cleanup.error).toBeNull();
    }
  });

  it.each([true, false])("atomic promotion via real Auth/profile binding, linked=%s", async (linked) => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: root } = await import("./composition-root");
    const { repositoryPort, sessionEngineActions, promotePathActions, sessionEngineStore } = root;

    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id, {
      treatment_id: seedTreatmentId, linked_group_id: linked ? group.id : null,
      terminal_nemar_response: linked ? "yes" : "no",
    });
    if (linked) await repositoryPort.saveGroup(group);
    await repositoryPort.savePlayerSession(session);
    await sessionEngineActions.onFinishRequested(session.id, linked ? "finish" : "finishAnyway");

    const snapshot = await promotePathActions.assembleGuestSnapshotForPendingGate();
    expect(snapshot).toEqual({
      group: linked ? { ...group, revision: 0 } : null, playerSession: session, promotionPayloadVersion: 2,
    });

    const supabaseRepository = createSupabaseRepositoryFromClient(testUser.client);
    await promotePathActions.promoteWithAuthenticatedRepository(supabaseRepository, snapshot!, testUser.userId);

    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    expect(repositoryPort.getProvider()).toBe(supabaseRepository);

    const { data: remoteGroup, error: groupError } = await serviceClient
      .from("symptom_groups")
      .select("id")
      .eq("id", group.id)
      .eq("user_id", testUser.userId)
      .maybeSingle();
    expect(groupError).toBeNull();
    expect(remoteGroup?.id ?? null).toBe(linked ? group.id : null);
    const remoteSession = await supabaseRepository.getPlayerSession(session.id);
    expect(remoteSession?.success_declared).toBe(true);
    expect(remoteSession?.terminal_nemar_response).toBe(linked ? "yes" : "no");
    expect(remoteSession?.linked_group_id).toBe(linked ? group.id : null);
    expect(remoteSession?.units).toEqual(session.units);
    const timeline = await testUser.client.from("timeline_events").select("id").eq("user_id", testUser.userId);
    expect(timeline.error).toBeNull();
    expect(timeline.data).toHaveLength(1);
    const library = await testUser.client.from("personal_treatment_library").select("use_count")
      .eq("user_id", testUser.userId);
    expect(library.error).toBeNull();
    expect(library.data).toEqual([{ use_count: 1 }]);

    await serviceClient.from("timeline_events").delete().eq("user_id", testUser.userId);
    await serviceClient.from("personal_treatment_library").delete().eq("user_id", testUser.userId);
    await serviceClient.from("player_sessions").delete().eq("id", session.id);
    await serviceClient.from("symptom_groups").delete().eq("id", group.id);
  });
});
