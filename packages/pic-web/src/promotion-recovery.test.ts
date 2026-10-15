// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createClient } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY } from "pic-adapter-local-guest";
import type { GuestSnapshot, PlayerSession, PromoteGuestToAccountInput } from "pic-engine";

const RECOVERY_KEY = "pic-web.promotion-recovery.v1";
const credentials = { email: "recovery@example.com", password: "recovery secret" };

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });

async function setup(linked = true) {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://recovery.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "fixture-public");
  const path = await import("./promote-path");
  const user = { id: randomUUID(), email: credentials.email, email_confirmed_at: "2026-10-15",
    app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-10-15" };
  const client = createClient("https://recovery.invalid", "fixture-public", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => new Response(JSON.stringify([{ id: user.id }]), { status: 200 }) },
  });
  const signIn = vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({ data: { user, session: {
    user, access_token: "access-secret", refresh_token: "refresh-secret", expires_in: 3600, token_type: "bearer",
  } }, error: null });
  const verify = vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const port = path.createSupabaseRepositoryFromClient(client);
  vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  const root = (await import("./composition-root")).compositionRoot;
  const groupId = randomUUID();
  const session: PlayerSession = {
    id: randomUUID(), treatment_id: randomUUID(), linked_group_id: linked ? groupId : null,
    units: [{ unit_id: "a", state: "completed" }], terminal_nemar_response: linked ? "yes" : "no",
    success_declared: false, finished_at: null, integrating_reason: null,
  };
  const snapshot: GuestSnapshot = { group: linked ? {
    id: groupId, name: "Recovery group", symptoms: [], created_at: "2026-10-15T00:00:00Z",
    joint_treatment_muscle_test: "together", joint_treatment_test_at: "2026-10-15T00:00:00Z",
  } : null, playerSession: session };
  if (snapshot.group) await root.repositoryPort.saveGroup(snapshot.group);
  await root.repositoryPort.savePlayerSession(session);
  await root.sessionEngineActions.onFinishRequested(session.id, linked ? "finish" : "finishAnyway");
  const rows = new Map<string, PlayerSession>();
  const payloads = new Map<string, string>();
  let effects = 0;
  const commit = async (input: PromoteGuestToAccountInput) => {
    const previous = payloads.get(input.idempotencyKey);
    if (previous && previous !== JSON.stringify(input)) throw new Error("Fingerprint mismatch");
    if (!previous) {
      payloads.set(input.idempotencyKey, JSON.stringify(input));
      rows.set(input.playerSession.id, structuredClone(input.playerSession));
      effects++;
    }
    return { group: input.group, playerSession: rows.get(input.playerSession.id)!, libraryRow: {
      id: "library", treatment_id: session.treatment_id, use_count: 1,
      provenance: { source: "guest_promotion", first_seen_at: "2026-10-15" }, variant_type: "original" as const,
      global_reference_id: session.treatment_id, protocol_content: null, created_at: "2026-10-15",
    }, timelineEvent: {
      id: session.id, log_type: "treatment_execution", treatment_id: session.treatment_id,
      library_row_id: "library", linked_group_id: session.linked_group_id, metadata: null, created_at: "2026-10-15",
    } };
  };
  const rpc = vi.spyOn(port, "promoteGuestToAccount").mockImplementation(commit);
  vi.spyOn(port, "getPlayerSession").mockImplementation(async (id) => rows.get(id) ?? null);
  const save = vi.spyOn(port, "savePlayerSession").mockImplementation(async (row) => { rows.set(row.id, row); });
  vi.spyOn(port, "saveGuestSessionGate").mockResolvedValue();
  const timeline = vi.spyOn(port, "appendTimelineEvent");
  return { root, user, verify, signIn, rpc, save, timeline, rows, snapshot, commit, effects: () => effects, client, port, path };
}

async function reload(f: Awaited<ReturnType<typeof setup>>) {
  vi.resetModules();
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(f.client);
  vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(f.port);
  return (await import("./composition-root")).compositionRoot;
}

it("retains durable recovery when verification cleanup rejects, then retries the same operation after reload", async () => {
  const f = await setup(false);
  vi.spyOn(f.client.auth, "signUp").mockResolvedValue({
    data: { user: { ...f.user, email_confirmed_at: undefined }, session: null }, error: null,
  });
  await f.root.promotePathActions.register({ ...credentials, name: "New Event Manager" });
  const remove = Storage.prototype.removeItem;
  const fault = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key: string) {
    if (key === "pic-web.verification-pending.v1") throw new Error("Verification cleanup rejected");
    return remove.call(this, key);
  });
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("Verification cleanup");
  expect(localStorage.getItem(RECOVERY_KEY)).not.toBeNull();
  expect(f.root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  fault.mockRestore();
  const root = await reload(f);
  await root.promotePathActions.signInAndPromote();
  expect(f.rpc.mock.calls[1]![0]).toEqual(f.rpc.mock.calls[0]![0]);
  expect(f.effects()).toBe(1);
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
  expect(localStorage.getItem("pic-web.verification-pending.v1")).toBeNull();
});

it.each([true, false])("persists one credential-free operation before duplicate RPCs, linked=%s", async (linked) => {
  const f = await setup(linked);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  f.rpc.mockImplementationOnce(async (input) => { await held; return f.commit(input); });
  const first = f.root.promotePathActions.signInAndPromote(credentials);
  const duplicate = f.root.promotePathActions.signInAndPromote(credentials);
  await vi.waitFor(() => expect(f.rpc).toHaveBeenCalledOnce());
  const raw = localStorage.getItem(RECOVERY_KEY);
  expect(raw).not.toBeNull();
  expect(JSON.parse(raw!)).toMatchObject({ owner: f.user.id, snapshot: f.snapshot, generation: 0,
    kind: linked ? "finish" : "finishAnyway" });
  expect(raw).not.toContain("secret");
  release();
  await Promise.all([first, duplicate]);
  expect(f.effects()).toBe(1);
  expect(f.signIn).toHaveBeenCalledOnce();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it.each([true, false])("retains Guest work and visible recovery after completion rejection, linked=%s", async (linked) => {
  const f = await setup(linked);
  f.save.mockRejectedValueOnce(new Error("Completion write lost"));
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("Completion");
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).not.toBeNull();
  expect(localStorage.getItem(RECOVERY_KEY)).not.toBeNull();
  expect(f.root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  await f.root.promotePathActions.signInAndPromote();
  expect(f.rows.get(f.snapshot.playerSession.id)?.success_declared).toBe(true);
  expect(f.effects()).toBe(1);
  expect(f.timeline).not.toHaveBeenCalled();
  expect(f.root.sessionEngineStore.getSnapshot()).toMatchObject({ mode: "authenticated", gateTriggered: false,
    promotionStatus: "succeeded" });
  expect(await f.root.repositoryPort.getPlayerSession(f.snapshot.playerSession.id)).toEqual(
    f.rows.get(f.snapshot.playerSession.id),
  );
});

it.each([true, false])("keeps recovery when Guest cleanup rejects and never publishes saved, linked=%s", async (linked) => {
  const f = await setup(linked);
  const remove = Storage.prototype.removeItem;
  let rejected = false;
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key: string) {
    if (key === DEFAULT_GUEST_STORAGE_KEY) {
      expect(localStorage.getItem(RECOVERY_KEY)).not.toBeNull();
    }
    if (key === DEFAULT_GUEST_STORAGE_KEY && !rejected) {
      rejected = true;
      throw new Error("Final cleanup rejected");
    }
    return remove.call(this, key);
  });
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("cleanup");
  expect(localStorage.getItem(RECOVERY_KEY)).not.toBeNull();
  expect(f.root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  await f.root.promotePathActions.signInAndPromote();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
  expect(f.effects()).toBe(1);
});

it.each([true, false])("retries a committed lost response after reload with its exact payload, linked=%s", async (linked) => {
  const f = await setup(linked);
  f.rpc.mockImplementationOnce(async (input) => { await f.commit(input); throw new Error("Response lost"); });
  await f.root.promotePathActions.signInAndPromote(credentials);
  expect(f.effects()).toBe(1);
  expect(f.root.sessionEngineStore.getSnapshot().promotionStatus).toBe("failed");
  await f.root.repositoryPort.savePlayerSession({ ...f.snapshot.playerSession, units: [] });
  const root = await reload(f);
  await root.promotePathActions.signInAndPromote();
  expect(f.rpc.mock.calls[1]![0]).toEqual(f.rpc.mock.calls[0]![0]);
  expect(f.effects()).toBe(1);
  expect(f.timeline).not.toHaveBeenCalled();
  expect(f.rows.get(f.snapshot.playerSession.id)?.success_declared).toBe(true);
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it("retains owner-bound work when pre-RPC verification rejects and offers credentials for recovery", async () => {
  const f = await setup();
  vi.spyOn(f.path, "ensureOwnProfile").mockRejectedValueOnce(new Error("Profile unavailable"));
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("Profile");
  const envelope = localStorage.getItem(RECOVERY_KEY);
  expect(envelope).not.toBeNull();
  expect(f.rpc).not.toHaveBeenCalled();
  f.verify.mockRejectedValueOnce(new Error("Identity expired"));
  await expect(f.root.promotePathActions.signInAndPromote()).rejects.toThrow("Identity");
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
  expect(f.root.promotePathActions.hasVerifiedIdentity()).toBe(false);
  expect(f.root.promotePathActions.canRetryWithoutCredentials()).toBe(false);
  await f.root.promotePathActions.signInAndPromote(credentials);
  expect(f.signIn).toHaveBeenCalledTimes(2);
  expect(f.effects()).toBe(1);
});

it.each([true, false])("holds therapeutic writes after RPC rejection until recovery or discard, linked=%s", async (linked) => {
  const f = await setup(linked);
  const guest = f.root.repositoryPort.getProvider();
  f.rpc.mockRejectedValueOnce(new Error("RPC rejected"));
  await f.root.promotePathActions.signInAndPromote(credentials);
  expect(f.root.repositoryPort.getProvider()).toBe(guest);
  const envelope = localStorage.getItem(RECOVERY_KEY);
  expect(await f.root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
  await expect(f.root.sessionEngineActions.onFinishRequested(f.snapshot.playerSession.id, "finish"))
    .rejects.toThrow("Saving is pending");
  await f.root.promotePathActions.signInAndPromote();
  expect(f.rpc.mock.calls[1]![0]).toEqual(f.rpc.mock.calls[0]![0]);
  expect(f.signIn).toHaveBeenCalledOnce();
  expect(f.effects()).toBe(1);
});

it.each([true, false])("rejects changed owners across reload and retains work until discard, linked=%s", async (linked) => {
  const f = await setup(linked);
  f.rpc.mockRejectedValueOnce(new Error("RPC rejected"));
  await f.root.promotePathActions.signInAndPromote(credentials);
  const envelope = localStorage.getItem(RECOVERY_KEY);
  const root = await reload(f);
  f.verify.mockResolvedValue({ data: { user: { ...f.user, id: randomUUID() } }, error: null });
  await expect(root.promotePathActions.signInAndPromote()).rejects.toThrow("identity");
  await expect(root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("identity");
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
  expect(f.rpc).toHaveBeenCalledOnce();
  expect(await root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
  expect(await root.inquiryResetActions.resetInquiry(true)).toBe("reset");
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
  await expect(root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("pending work");
  expect(f.rpc).toHaveBeenCalledOnce();
});

it.each([true, false])("restores a nonzero generation after reset and cleanup interruption, linked=%s", async (linked) => {
  const f = await setup(linked);
  await f.root.inquiryResetActions.resetInquiry(true);
  if (f.snapshot.group) await f.root.repositoryPort.saveGroup(f.snapshot.group);
  await f.root.repositoryPort.savePlayerSession(f.snapshot.playerSession);
  await f.root.sessionEngineActions.onFinishRequested(f.snapshot.playerSession.id, linked ? "finish" : "finishAnyway");
  const remove = Storage.prototype.removeItem;
  const fault = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key: string) {
    if (key === RECOVERY_KEY) throw new Error("Envelope cleanup interrupted");
    return remove.call(this, key);
  });
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("cleanup");
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
  expect(JSON.parse(localStorage.getItem(RECOVERY_KEY)!).generation).toBe(1);
  fault.mockRestore();
  const root = await reload(f);
  const lifecycle = await import("./inquiry-lifecycle");
  expect(lifecycle.inquiryGenerationStore.getSnapshot()).toBe(1);
  expect(root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  expect(await root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  await root.promotePathActions.signInAndPromote();
  expect(f.rpc.mock.calls[1]![0]).toEqual(f.rpc.mock.calls[0]![0]);
  expect(f.effects()).toBe(1);
  expect(await root.repositoryPort.getPlayerSession(f.snapshot.playerSession.id)).toEqual(
    f.rows.get(f.snapshot.playerSession.id),
  );
  expect(root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it("refuses a stale generation callback without claiming or deleting its durable operation", async () => {
  const f = await setup();
  f.rpc.mockRejectedValueOnce(new Error("RPC rejected"));
  await f.root.promotePathActions.signInAndPromote(credentials);
  const envelope = localStorage.getItem(RECOVERY_KEY);
  (await import("./inquiry-lifecycle")).advanceInquiryGeneration();
  await expect(f.root.promotePathActions.signInAndPromote()).rejects.toThrow("inquiry");
  expect(f.rpc).toHaveBeenCalledOnce();
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
});

it("rejects a stale public promotion callback after confirmed reset", async () => {
  const f = await setup();
  f.rpc.mockRejectedValueOnce(new Error("RPC rejected"));
  await f.root.promotePathActions.signInAndPromote(credentials);
  await f.root.inquiryResetActions.resetInquiry(true);
  await expect(f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, f.snapshot, f.user.id))
    .rejects.toThrow("pending");
  expect(f.rpc).toHaveBeenCalledOnce();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it("deduplicates public promotion callbacks while preserving the first exact snapshot", async () => {
  const f = await setup();
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  f.rpc.mockImplementation(async (input) => { await held; return f.commit(input); });
  const first = f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, f.snapshot, f.user.id);
  const duplicate = f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, {
    ...f.snapshot, playerSession: { ...f.snapshot.playerSession, units: [] },
  }, f.user.id);
  await vi.waitFor(() => expect(f.rpc).toHaveBeenCalled());
  const calls = f.rpc.mock.calls.length;
  release();
  await Promise.all([first, duplicate]);
  expect(calls).toBe(1);
  expect(f.effects()).toBe(1);
});

it("keeps the assembled Gate in recovery after engine success and preserves intent when discard is canceled", async () => {
  const f = await setup();
  localStorage.setItem("pic-web.locale.v1", "en");
  const { PersistenceGateModal } = await import("./PersistenceGateModal");
  const { SessionEngineProvider } = await import("./session-engine-context");
  const { LocaleProvider } = await import("./i18n/locale-provider");
  render(createElement(LocaleProvider, null, createElement(SessionEngineProvider, null, createElement(PersistenceGateModal))));
  f.save.mockRejectedValueOnce(new Error("Completion write interrupted"));
  await act(async () => {
    await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("Completion");
  });
  expect(f.root.sessionEngineStore.getSnapshot()).toMatchObject({ gateTriggered: false, promotionStatus: "succeeded" });
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("We could not anchor your session yet. You can try again whenever you are ready.")).toBeTruthy();
  const envelope = localStorage.getItem(RECOVERY_KEY);
  fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
  fireEvent.click(await screen.findByRole("button", { name: "Keep current inquiry" }));
  expect(localStorage.getItem(RECOVERY_KEY)).toBe(envelope);
  fireEvent.click(await screen.findByRole("button", { name: "Try again" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(f.effects()).toBe(1);
  expect(f.timeline).not.toHaveBeenCalled();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it("refuses RPC submission when durable preparation fails and retains the only Guest draft", async () => {
  const f = await setup();
  const write = Storage.prototype.setItem;
  const fault = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === RECOVERY_KEY) throw new Error("Recovery storage unavailable");
    return write.call(this, key, value);
  });
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("storage");
  expect(f.root.promotePathActions.hasVerifiedIdentity()).toBe(true);
  expect(f.root.promotePathActions.canRetryWithoutCredentials()).toBe(true);
  expect(f.rpc).not.toHaveBeenCalled();
  expect(await f.root.repositoryPort.getPlayerSession(f.snapshot.playerSession.id)).toEqual(f.snapshot.playerSession);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).not.toBeNull();
  fault.mockRestore();
  await f.root.promotePathActions.signInAndPromote();
  expect(f.effects()).toBe(1);
  expect(f.signIn).toHaveBeenCalledOnce();
});

it.each(["public", "session"] as const)("rejects a stale %s callback after a new inquiry reaches its Gate", async (entry) => {
  const f = await setup();
  await f.root.inquiryResetActions.resetInquiry(true);
  const freshSession = { ...f.snapshot.playerSession, id: randomUUID() };
  if (f.snapshot.group) await f.root.repositoryPort.saveGroup(f.snapshot.group);
  await f.root.repositoryPort.savePlayerSession(freshSession);
  await f.root.sessionEngineActions.onFinishRequested(freshSession.id, "finish");
  const save = entry === "public"
    ? f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, f.snapshot, f.user.id)
    : f.root.sessionEngineActions.promote(f.snapshot, f.user.id);
  await expect(save).rejects.toThrow("pending");
  expect(f.rpc).not.toHaveBeenCalled();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
  expect((await f.root.repositoryPort.getGuestSessionGate()).pendingFinishRequest?.sessionId).toBe(freshSession.id);
});

it("rejects a raw SessionEngine callback after reset without pending anchoring intent", async () => {
  const f = await setup();
  await f.root.inquiryResetActions.resetInquiry(true);
  await expect(f.root.sessionEngineActions.promote(f.snapshot, f.user.id)).rejects.toThrow("pending");
  expect(f.rpc).not.toHaveBeenCalled();
  expect(localStorage.getItem(RECOVERY_KEY)).toBeNull();
});

it("preserves the frozen snapshot when storage rejects before a changed public retry", async () => {
  const f = await setup();
  const write = Storage.prototype.setItem;
  const fault = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === RECOVERY_KEY) throw new Error("Recovery storage unavailable");
    return write.call(this, key, value);
  });
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("storage");
  fault.mockRestore();
  await f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, {
    ...f.snapshot, playerSession: { ...f.snapshot.playerSession, units: [] },
  }, f.user.id);
  expect(f.rpc.mock.calls[0]![0].playerSession).toEqual(f.snapshot.playerSession);
  expect(f.effects()).toBe(1);
});
it("restores an owner-bound split_suggested promotion without changing the Event Manager's answer", async () => {
  const f = await setup();
  const group = { ...f.snapshot.group!, joint_treatment_muscle_test: "split_suggested" as const };
  await f.root.repositoryPort.saveGroup(group);
  f.rpc.mockImplementationOnce(async (input) => { await f.commit(input); throw new Error("Promotion response lost"); });
  await f.root.promotePathActions.signInAndPromote(credentials);
  const root = await reload(f);
  expect(root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  await root.promotePathActions.signInAndPromote();
  expect(f.rpc.mock.calls[1]?.[0]).toEqual(f.rpc.mock.calls[0]?.[0]);
  expect(f.rpc.mock.calls[1]?.[0].group?.joint_treatment_muscle_test).toBe("split_suggested");
  expect(f.effects()).toBe(1);
});
