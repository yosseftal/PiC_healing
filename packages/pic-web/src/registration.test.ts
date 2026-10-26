// @vitest-environment jsdom
import { AuthApiError, createClient } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); });

async function setup() {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://registration.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-fixture");
  const path = await import("./promote-path");
  const client = createClient("https://registration.invalid", "public-fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const user = { id: "signup-owner", email: "new@example.com", aud: "authenticated",
    app_metadata: {}, user_metadata: {}, created_at: "2026-10-15" };
  const signup = vi.spyOn(client.auth, "signUp").mockResolvedValue({ data: { user, session: null }, error: null });
  const { compositionRoot: root } = await import("./composition-root");
  const session = {
    id: "pending-session", treatment_id: "treatment", linked_group_id: null,
    units: [{ unit_id: "one", state: "completed" as const }], terminal_nemar_response: "no" as const,
    success_declared: false, finished_at: null, integrating_reason: null,
  };
  await root.repositoryPort.savePlayerSession(session);
  await root.sessionEngineActions.onFinishRequested(session.id, "finishAnyway");
  return { root, client, signup, user, session, path };
}

it("registers with trimmed display metadata and exact transient password without promoting unverified work", async () => {
  const { root, signup, session } = await setup();
  const before = await root.promotePathActions.assembleGuestSnapshotForPendingGate();
  await root.promotePathActions.register({ name: "  New Event Manager  ", email: "new@example.com", password: " secret  " });
  expect(signup).toHaveBeenCalledExactlyOnceWith({
    email: "new@example.com", password: " secret  ", options: { data: { full_name: "New Event Manager" } },
  });
  expect(root.verificationStore.getSnapshot()).toMatchObject({ email: "new@example.com" });
  expect(root.promotePathActions.hasVerifiedIdentity()).toBe(false);
  expect(root.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(await root.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(before);
  expect((await root.repositoryPort.getGuestSessionGate()).pendingFinishRequest)
    .toEqual({ sessionId: session.id, kind: "finishAnyway", promotionPayloadVersion: 3 });
  expect(JSON.stringify(localStorage)).not.toContain("secret");
});

it("resends for the bound registrant and serializes duplicate resend and reset without losing pending Finish", async () => {
  const { root, client } = await setup();
  await root.promotePathActions.register({ name: "Name", email: "new@example.com", password: "password" });
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const resend = vi.spyOn(client.auth, "resend").mockImplementation(async () => {
    await held;
    return { data: { user: null, session: null }, error: null };
  });
  const first = root.promotePathActions.resendVerification();
  const duplicate = root.promotePathActions.resendVerification();
  let resetSettled = false;
  const reset = root.inquiryResetActions.resetInquiry().then((result) => { resetSettled = true; return result; });
  await vi.waitFor(() => expect(resend).toHaveBeenCalledOnce());
  expect(resetSettled).toBe(false);
  release();
  await Promise.all([first, duplicate]);
  expect(await reset).toBe("confirmation");
  expect(resend).toHaveBeenCalledExactlyOnceWith({ type: "signup", email: "new@example.com" });
  expect(root.verificationStore.getSnapshot()?.email).toBe("new@example.com");
  await root.inquiryResetActions.resetInquiry(true);
  expect(root.verificationStore.getSnapshot()).toBeNull();
  await expect(root.promotePathActions.resendVerification()).rejects.toThrow();
  expect(resend).toHaveBeenCalledTimes(1);
});

it("can register after rejected login without replacing the already frozen Guest work", async () => {
  const { root, client, session, user } = await setup();
  vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({
    data: { user: null, session: null }, error: new AuthApiError("Rejected", 400, "invalid_credentials"),
  });
  await expect(root.promotePathActions.signInAndPromote({ email: "new@example.com", password: "wrong" })).rejects.toThrow();
  await root.repositoryPort.savePlayerSession({ ...session, terminal_nemar_response: "yes" });
  await root.promotePathActions.register({ name: "Name", email: "new@example.com", password: "new-password" });
  expect(root.verificationStore.getSnapshot()?.email).toBe("new@example.com");
  expect(root.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
  vi.resetModules();
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const { compositionRoot: reloaded } = await import("./composition-root");
  const confirmedUser = { ...user, email_confirmed_at: "2026-10-15" };
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user: confirmedUser }, error: null });
  vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({
    data: { user: confirmedUser, session: {
      user: confirmedUser, access_token: "fixture", refresh_token: "fixture", expires_in: 3600, token_type: "bearer",
    } }, error: null,
  });
  const profile = vi.spyOn(path, "ensureOwnProfile").mockResolvedValue();
  const port = path.createSupabaseRepositoryFromClient(client);
  const rpc = vi.spyOn(port, "promoteGuestToAccount").mockRejectedValue(new Error("RPC unavailable"));
  vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  await reloaded.promotePathActions.signInAndPromote({ email: "new@example.com", password: "password" });
  expect(profile).toHaveBeenCalledOnce();
  expect(rpc.mock.calls[0]?.[0].playerSession.terminal_nemar_response).toBe("no");
});

it("reload retains pending work and rejects another verified owner before profile or therapeutic writes", async () => {
  const { root, session, client, user } = await setup();
  await root.promotePathActions.register({ name: "Name", email: "new@example.com", password: "password" });
  const before = await root.promotePathActions.assembleGuestSnapshotForPendingGate();
  vi.resetModules();
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const profile = vi.spyOn(path, "ensureOwnProfile");
  const { compositionRoot: reloaded } = await import("./composition-root");
  expect(reloaded.verificationStore.getSnapshot()?.email).toBe("new@example.com");
  expect(await reloaded.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(before);
  expect(await reloaded.repositoryPort.getPlayerSession(session.id)).toEqual(session);
  const wrongOwner = { ...user, id: "different-owner", email: "other@example.com", email_confirmed_at: "2026-10-15" };
  vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({ data: { user: wrongOwner, session: {
    user: wrongOwner, access_token: "fixture", refresh_token: "fixture", expires_in: 3600, token_type: "bearer",
  } }, error: null });
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user: wrongOwner }, error: null });
  await expect(reloaded.promotePathActions.signInAndPromote({ email: "other@example.com", password: "password" }))
    .rejects.toThrow("identity");
  expect(profile).not.toHaveBeenCalled();
  expect(reloaded.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(await reloaded.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(before);
});

it("deduplicates held signup and waits for it before explicit discard clears its owner binding", async () => {
  const { root, signup, user } = await setup();
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  signup.mockImplementation(async () => { await held; return { data: { user, session: null }, error: null }; });
  const credentials = { name: "Name", email: "new@example.com", password: "password" };
  const first = root.promotePathActions.register(credentials);
  const duplicate = root.promotePathActions.register(credentials);
  let settled = false;
  const reset = root.inquiryResetActions.resetInquiry(true).then(() => { settled = true; });
  await vi.waitFor(() => expect(signup).toHaveBeenCalledOnce());
  expect(settled).toBe(false);
  release();
  await Promise.all([first, duplicate, reset]);
  expect(root.verificationStore.getSnapshot()).toBeNull();
  expect(root.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
  await expect(root.promotePathActions.signInAndPromote()).rejects.toThrow("pending work");
});

it("accepts the verified same-email identity after an obfuscated signup response without discarding the draft", async () => {
  const { root, client, path, user } = await setup();
  await root.promotePathActions.register({ name: "Name", email: "new@example.com", password: "password" });
  const actualOwner = { ...user, id: "actual-existing-owner", email: "new@example.com", email_confirmed_at: "2026-10-15" };
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user: actualOwner }, error: null });
  vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({ data: { user: actualOwner, session: {
    user: actualOwner, access_token: "fixture", refresh_token: "fixture", expires_in: 3600, token_type: "bearer",
  } }, error: null });
  vi.spyOn(path, "ensureOwnProfile").mockResolvedValue();
  const port = path.createSupabaseRepositoryFromClient(client);
  const rpc = vi.spyOn(port, "promoteGuestToAccount").mockRejectedValue(new Error("RPC unavailable"));
  vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  await root.promotePathActions.signInAndPromote({ email: "new@example.com", password: "password" });
  expect(rpc.mock.calls[0]?.[0].newUserId).toBe("actual-existing-owner");
  expect(await root.promotePathActions.assembleGuestSnapshotForPendingGate()).not.toBeNull();
});

it("publishes recoverable verification intent when its storage write rejects and preserves the Guest draft", async () => {
  const { root } = await setup();
  const before = await root.promotePathActions.assembleGuestSnapshotForPendingGate();
  const write = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "pic-web.verification-pending.v1") throw new Error("Verification storage unavailable");
    write.call(this, key, value);
  });
  await expect(root.promotePathActions.register({ name: "Name", email: "new@example.com", password: "password" }))
    .rejects.toThrow("storage");
  expect(root.verificationStore.getSnapshot()?.email).toBe("new@example.com");
  expect(await root.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(before);
});
