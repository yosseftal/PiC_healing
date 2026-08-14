// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY, LocalGuestRepository } from "pic-adapter-local-guest";
import type { FinalizedSymptomGroup, PlayerSession, RepositoryPort } from "pic-engine";
import { compositionRoot } from "./composition-root";
import {
  assembleGuestSnapshotForPendingGate,
  createSupabaseRepositoryFromClient,
  promoteWithAuthenticatedRepository,
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
    expect(snapshot).toEqual({ group, playerSession: session });
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

  it("leaves guest storage clear and provider swapped on success", async () => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: root } = await import("./composition-root");
    const { repositoryPort, sessionEngineActions, promotePathActions, sessionEngineStore } = root;
    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id);
    await repositoryPort.saveGroup(group);
    await repositoryPort.savePlayerSession(session);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    const authenticatedPort = createInMemoryAuthenticatedPort();
    await sessionEngineActions.onFinishRequested(session.id, "finish");

    await promotePathActions.promoteWithAuthenticatedRepository(
      authenticatedPort,
      { group, playerSession: session },
      "user-success",
    );

    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    expect(repositoryPort.getProvider()).toBe(authenticatedPort);
    expect(sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
  });
});

function createInMemoryAuthenticatedPort(): RepositoryPort {
  const groups = new Map<string, FinalizedSymptomGroup>();
  const sessions = new Map<string, PlayerSession>();
  const libraryRows = new Map<string, { id: string; treatment_id: string; use_count: number }>();
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
      return { gateTriggered: false, pendingFinishRequest: null };
    },
    async saveGuestSessionGate() {},
    async listTreatments() {
      return [];
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

const hasRemoteCredentials =
  remoteEnv !== null &&
  remoteEnv.SUPABASE_URL !== undefined &&
  remoteEnv.SUPABASE_ANON_KEY !== undefined &&
  remoteEnv.SUPABASE_SERVICE_ROLE_KEY !== undefined;

describe.skipIf(!hasRemoteCredentials)("promote path remote integration", () => {
  const TEST_USER_PASSWORD = `pic-healing-promote-path-${randomUUID()}`;
  let serviceClient: SupabaseClient;
  let seedTreatmentId: string;
  let testUser: { userId: string; client: SupabaseClient };
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const env = remoteEnv!;
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
    });
    if (createError !== null || created.user === null) {
      throw new Error(`Failed to create ephemeral test user: ${createError?.message ?? "no user"}`);
    }
    createdUserIds.push(created.user.id);

    const { error: profileError } = await serviceClient.from("profiles").insert({ id: created.user.id });
    if (profileError !== null) {
      throw new Error(`Failed to seed profiles row: ${profileError.message}`);
    }

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
  });

  afterAll(async () => {
    await Promise.all(createdUserIds.map((userId) => serviceClient.auth.admin.deleteUser(userId)));
  });

  it("atomic promotion via SupabaseRepository after provider swap", async () => {
    vi.resetModules();
    localStorage.clear();
    const { compositionRoot: root } = await import("./composition-root");
    const { repositoryPort, sessionEngineActions, promotePathActions, sessionEngineStore } = root;

    const group = buildFinalizedGroup();
    const session = buildPlayerSession(group.id, { treatment_id: seedTreatmentId });
    await repositoryPort.saveGroup(group);
    await repositoryPort.savePlayerSession(session);
    await sessionEngineActions.onFinishRequested(session.id, "finish");

    const snapshot = await promotePathActions.assembleGuestSnapshotForPendingGate();
    expect(snapshot).toEqual({ group, playerSession: session });

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
    expect(remoteGroup?.id).toBe(group.id);

    await serviceClient.from("timeline_events").delete().eq("user_id", testUser.userId);
    await serviceClient.from("personal_treatment_library").delete().eq("user_id", testUser.userId);
    await serviceClient.from("player_sessions").delete().eq("id", session.id);
    await serviceClient.from("symptom_groups").delete().eq("id", group.id);
  });
});
