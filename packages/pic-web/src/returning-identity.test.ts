// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, render, screen, fireEvent } from "@testing-library/react";
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); });

async function setup() {
  vi.resetModules();
  localStorage.clear();
  vi.stubEnv("VITE_SUPABASE_URL", "https://identity.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-fixture");
  const path = await import("./promote-path");
  const client = createClient("https://identity.invalid", "public-fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = { id: "returning-owner", email: "returning@example.com", email_confirmed_at: "2026-10-15",
    app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-10-15" };
  const session: Session = {
    user, access_token: "fixture", refresh_token: "fixture", expires_in: 3600, token_type: "bearer",
  };
  const verify = vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  const signIn = vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({ data: { user, session }, error: null });
  let event!: (event: AuthChangeEvent, session: Session | null) => void;
  const unsubscribe = vi.fn();
  const listen = vi.spyOn(client.auth, "onAuthStateChange").mockImplementation((callback) => {
    event = callback;
    return { data: { subscription: { id: "listener", callback, unsubscribe } } };
  });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const root = (await import("./composition-root")).compositionRoot;
  return { root, path, client, user, session, verify, signIn, listen, unsubscribe,
    event: (kind: AuthChangeEvent, value: Session | null) => event(kind, value) };
}

it("restores verified identity independently of Guest mode with one listener and unsubscribes on release", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const second = f.root.authLifecycle.start();
  f.event("INITIAL_SESSION", f.session);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("verified"));
  expect(f.root.promotePathActions.hasVerifiedIdentity()).toBe(true);
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(f.listen).toHaveBeenCalledOnce();
  expect(f.signIn).not.toHaveBeenCalled();
  release();
  expect(f.unsubscribe).not.toHaveBeenCalled();
  second();
  expect(f.unsubscribe).toHaveBeenCalledOnce();
});
async function pendingGate(f: Awaited<ReturnType<typeof setup>>) {
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  await f.root.playerEngineActions.respondTerminalNemar(id, "no");
  await f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway");
  vi.spyOn(f.path, "ensureOwnProfile").mockResolvedValue();
  const port = f.path.createSupabaseRepositoryFromClient(f.client);
  vi.spyOn(f.path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  const sessions = new Map<string, import("pic-engine").PlayerSession>();
  const groups = new Map<string, import("pic-engine").SymptomGroup>();
  const library = { id: "library", treatment_id: "treatment", use_count: 1,
    provenance: { source: "test", first_seen_at: "2026-10-15" }, variant_type: "original" as const,
    global_reference_id: "treatment", protocol_content: null, created_at: "2026-10-15" };
  const rpc = vi.spyOn(port, "promoteGuestToAccount").mockImplementation(async (input) => {
    sessions.set(input.playerSession.id, input.playerSession);
    return { group: input.group, playerSession: input.playerSession, libraryRow: library,
      timelineEvent: { id: input.playerSession.id, log_type: "treatment_execution", treatment_id: "treatment",
        library_row_id: library.id, linked_group_id: null, metadata: null, created_at: "2026-10-15" } };
  });
  const read = vi.spyOn(port, "getPlayerSession").mockImplementation(async (id) => sessions.get(id) ?? null);
  const save = vi.spyOn(port, "savePlayerSession").mockImplementation(async (row) => { sessions.set(row.id, row); });
  const saveGroup = vi.spyOn(port, "saveGroup").mockImplementation(async (row) => { groups.set(row.id, row); });
  vi.spyOn(port, "getGroup").mockImplementation(async (id) => groups.get(id) ?? null);
  vi.spyOn(port, "saveGuestSessionGate").mockResolvedValue();
  vi.spyOn(port, "getOrCreateLibraryRow").mockResolvedValue(library);
  const increment = vi.spyOn(port, "incrementUseCount").mockResolvedValue(library);
  const timeline = vi.spyOn(port, "appendTimelineEvent").mockImplementation(async (event) => ({
    ...event, id: "new-event", created_at: "2026-10-15",
  }));
  return { id, rpc, port, sessions, read, save, saveGroup, increment, timeline };
}

it("reuses a restored identity at its real Gate and keeps authenticated new groups on the saved provider", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  f.event("INITIAL_SESSION", f.session);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("verified"));
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote();
  expect(f.signIn).not.toHaveBeenCalled();
  expect(saved.rpc).toHaveBeenCalledOnce();
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  await f.root.inquiryResetActions.resetInquiry(true);
  const { inquiryGenerationStore } = await import("./inquiry-lifecycle");
  const draft = f.root.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  draft.setTitle("   ");
  const first = f.root.questionnaire.store.getSnapshot().rows[0]!;
  draft.edit(first.id, { name: "Shoulder", polarity: "positive", intensity: 7 });
  const second = draft.add()!;
  draft.edit(second, { name: "Neck", intensity: 2 });
  draft.move(second, -1);
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(await draft.finish()).toBe(true);
  const group = f.root.groupEngineStore.getSnapshot().activeGroupId!;
  const local = await f.root.groupEngineActions.getGroup(group);
  expect(local?.name).toBe("");
  expect(local?.symptoms.map(({ name, polarity, intensity }) => [name, polarity, intensity])).toEqual([
    ["Neck", "negative", 2], ["Shoulder", "positive", 7],
  ]);
  expect(local?.symptoms.every((row) => row.rated_at !== null)).toBe(true);
  expect(local?.joint_treatment_muscle_test).toBeNull();
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(f.root.authenticatedDraft.store.getSnapshot()?.group).toEqual(local);
  await f.root.groupEngineActions.setJointTreatmentMuscleTest(group, "together");
  expect(saved.saveGroup).toHaveBeenCalledOnce();
  expect(await saved.port.getGroup(group)).toEqual({ ...local,
    revision: local!.revision! + 1,
    joint_treatment_muscle_test: "together", joint_treatment_test_at: expect.any(String) });
  expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
  expect(f.root.promotePathActions.hasVerifiedIdentity()).toBe(true);
  release();
});

it("pauses an expired owner's next write and resumes its intent after same-owner reauthentication", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  f.event("SIGNED_OUT", null);
  const create = f.root.groupEngineActions.createDraftGroup("Recoverable draft");
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
  expect(f.root.authStore.getSnapshot().status).toBe("reauthenticate");
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  const id = await create;
  expect((await f.root.groupEngineActions.getGroup(id))?.name).toBe("Recoverable draft");
  expect(saved.rpc).toHaveBeenCalledOnce();
  release();
});
it("resumes only the rejected provider call after confirmed Auth rejection during authenticated Finish", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  const rejected = new Error("No authenticated session");
  rejected.name = "SupabaseRepositoryNotAuthenticatedError";
  saved.timeline.mockRejectedValueOnce(rejected);
  let outcome = "pending";
  const finish = f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway")
    .then(() => { outcome = "finished"; }, () => { outcome = "rejected"; });
  await vi.waitFor(() => expect(saved.timeline).toHaveBeenCalledOnce());
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(outcome).toBe("pending");
  expect(f.root.authStore.getSnapshot().status).toBe("reauthenticate");
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  await finish;
  expect(outcome).toBe("finished");
  expect(saved.increment).toHaveBeenCalledOnce();
  expect(saved.timeline).toHaveBeenCalledTimes(2);
  expect(saved.sessions.get(id)?.success_declared).toBe(true);
  expect(saved.rpc).toHaveBeenCalledOnce();
  release();
});
it("retains uncertainty before confirmed focus detachment and never replays or claims completion", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  saved.timeline.mockRejectedValueOnce(new Error("Response lost after possible commit"));
  let outcome = "pending";
  void f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway")
    .then(() => { outcome = "finished"; }, () => { outcome = "cancelled"; });
  await vi.waitFor(() => expect(saved.timeline).toHaveBeenCalledOnce());
  expect(f.root.authStore.getSnapshot().status).toBe("uncertain");
  expect(outcome).toBe("pending");
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  expect(await f.root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(f.root.authLifecycle.hasPending()).toBe(true);
  expect(outcome).toBe("pending");
  expect(localStorage.getItem("pic-web.uncertain-completions.v1")).toBeNull();
  await f.root.inquiryResetActions.resetInquiry(true);
  const retained = localStorage.getItem("pic-web.uncertain-completions.v1");
  expect(JSON.parse(retained!)).toEqual([expect.objectContaining({ owner: f.user.id,
    generation: expect.any(Number), sessionIds: [id], event: saved.timeline.mock.calls[0]![0] })]);
  expect(outcome).toBe("cancelled");
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  expect(f.root.authLifecycle.hasPending()).toBe(false);
  expect(f.root.authLifecycle.hasPartialCompletion()).toBe(false);
  const next = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  await f.root.sessionEngineActions.onFinishRequested(next, "finishAnyway");
  expect(saved.sessions.get(next)?.success_declared).toBe(true);
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  expect(localStorage.getItem("pic-web.uncertain-completions.v1")).toBe(retained);
  await f.root.inquiryResetActions.resetInquiry(true);
  expect(localStorage.getItem("pic-web.uncertain-completions.v1")).toBe(retained);
  expect(saved.timeline).toHaveBeenCalledTimes(2);
  expect(saved.rpc).toHaveBeenCalledOnce();
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  release();
});
it("rejects another verified owner and cancels a suspended write on reset without stale revival", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  f.event("SIGNED_OUT", null);
  let rejected = false;
  const create = f.root.groupEngineActions.createDraftGroup("Old owner's draft").catch(() => { rejected = true; });
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("reauthenticate"));
  f.verify.mockResolvedValue({ data: { user: { ...f.user, id: "other-owner" } }, error: null });
  await expect(f.root.promotePathActions.reauthenticate({ email: "other@example.com", password: "secret" }))
    .rejects.toThrow("identity");
  expect(saved.saveGroup).not.toHaveBeenCalled();
  await f.root.inquiryResetActions.resetInquiry(true);
  await create;
  expect(rejected).toBe(true);
  f.verify.mockResolvedValue({ data: { user: f.user }, error: null });
  f.event("SIGNED_IN", f.session);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("verified"));
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(saved.rpc).toHaveBeenCalledOnce();
  release();
});

it("retains the no-replay barrier through failed cleanup, successful detachment and stale Finish callbacks", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  saved.timeline.mockRejectedValueOnce(new Error("Lost append response"));
  const finish = f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway").catch(() => undefined);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("uncertain"));
  const set = Storage.prototype.setItem;
  const fault = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "pic:guest-repository:v1") throw new Error("Guest cleanup unavailable");
    set.call(this, key, value);
  });
  await expect(f.root.inquiryResetActions.resetInquiry(true)).rejects.toThrow("cleanup unavailable");
  await finish;
  expect(f.root.authStore.getSnapshot().status).toBe("uncertain");
  expect(f.root.authLifecycle.hasPartialCompletion()).toBe(true);
  const retained = localStorage.getItem("pic-web.uncertain-completions.v1");
  expect(JSON.parse(retained!)).toHaveLength(1);
  await expect(f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway")).rejects.toThrow("uncertain");
  expect(saved.timeline).toHaveBeenCalledOnce();
  expect(saved.increment).toHaveBeenCalledOnce();
  fault.mockRestore();
  await f.root.inquiryResetActions.resetInquiry(true);
  expect(f.root.authStore.getSnapshot().status).toBe("verified");
  expect(localStorage.getItem("pic-web.uncertain-completions.v1")).toBe(retained);
  await expect(f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway")).rejects.toThrow("uncertain");
  await expect(f.root.playerEngineActions.finishAnyway(id)).rejects.toThrow("uncertain");
  const next = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  await f.root.sessionEngineActions.onFinishRequested(next, "finishAnyway");
  expect(saved.sessions.get(next)?.success_declared).toBe(true);
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  expect(saved.timeline).toHaveBeenCalledTimes(2);
  vi.resetModules();
  const fresh = (await import("./composition-root")).compositionRoot;
  await expect(fresh.sessionEngineActions.onFinishRequested(id, "finishAnyway")).rejects.toThrow("uncertain");
  expect(fresh.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
});

it("keeps uncertain work on canceled confirmation or failed durable retention, then permits explicit detachment", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  saved.timeline.mockRejectedValueOnce(new Error("Lost append response"));
  const finish = f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway").catch(() => undefined);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("uncertain"));
  const { AppProviders } = await import("./app-providers");
  const { GuestModeShell } = await import("./GuestModeShell");
  render(createElement(AppProviders, null, createElement(GuestModeShell)));
  fireEvent.click(screen.getByRole("button", { name: "קבוצת סימפטומים חדשה" }));
  expect(await screen.findByText(/תוצאת התיעוד האחרון אינה ידועה/)).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "להמשיך בבירור הנוכחי" }));
  expect(f.root.authLifecycle.hasPending()).toBe(true);
  expect(localStorage.getItem("pic-web.uncertain-completions.v1")).toBeNull();
  const set = Storage.prototype.setItem;
  const fault = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "pic-web.uncertain-completions.v1") throw new Error("Storage unavailable");
    set.call(this, key, value);
  });
  fireEvent.click(screen.getByRole("button", { name: "קבוצת סימפטומים חדשה" }));
  fireEvent.click(await screen.findByRole("button", { name: "למחוק את הטיוטה ולהתחיל מחדש" }));
  expect(await screen.findByRole("button", { name: "לנסות להתחיל מחדש" })).toBeDefined();
  expect(f.root.authLifecycle.hasPending()).toBe(true);
  expect(f.root.authStore.getSnapshot().status).toBe("uncertain");
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  expect(saved.timeline).toHaveBeenCalledOnce();
  fault.mockRestore();
  fireEvent.click(screen.getByRole("button", { name: "לנסות להתחיל מחדש" }));
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await finish;
  expect(JSON.parse(localStorage.getItem("pic-web.uncertain-completions.v1")!)[0]).toMatchObject({
    owner: f.user.id, sessionIds: [id],
  });
  expect(saved.timeline).toHaveBeenCalledOnce();
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
});

it("offers localized reauthentication for an anchored flow without reopening the Guest persistence gate", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const { AppProviders } = await import("./app-providers");
  const { GuestModeShell } = await import("./GuestModeShell");
  render(createElement(AppProviders, null, createElement(GuestModeShell)));
  act(() => { f.event("SIGNED_OUT", null); });
  expect(await screen.findByRole("dialog")).toBeDefined();
  expect(screen.getByText("החיבור לחשבון הסתיים. העבודה השמורה נשארת בחשבון. התחברו שוב לאותו חשבון כדי להמשיך.")).toBeDefined();
  fireEvent.change(screen.getByLabelText("כתובת אימייל"), { target: { value: f.user.email } });
  fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "secret" } });
  fireEvent.click(screen.getByRole("button", { name: "התחברות מחדש" }));
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(saved.rpc).toHaveBeenCalledOnce();
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("authenticated");
});

it("reauthenticates inside the original submitted Gate and resumes only its suspended completion", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  const rejected = new Error("Expired during completion");
  rejected.name = "SupabaseRepositoryNotAuthenticatedError";
  saved.save.mockRejectedValueOnce(rejected);
  const { AppProviders } = await import("./app-providers");
  const { GuestModeShell } = await import("./GuestModeShell");
  render(createElement(AppProviders, null, createElement(GuestModeShell)));
  fireEvent.change(screen.getByLabelText("כתובת אימייל"), { target: { value: f.user.email } });
  fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "secret" } });
  fireEvent.submit(screen.getByLabelText("סיסמה").closest("form")!);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("reauthenticate"));
  expect(screen.getByLabelText("סיסמה")).toBeDefined();
  fireEvent.change(screen.getByLabelText("סיסמה"), { target: { value: "secret" } });
  fireEvent.click(screen.getByRole("button", { name: "התחברות מחדש" }));
  await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(saved.sessions.get(saved.id)?.success_declared).toBe(true);
  expect(saved.rpc).toHaveBeenCalledOnce();
  expect(saved.save).toHaveBeenCalledTimes(2);
  expect(saved.increment).not.toHaveBeenCalled();
  expect(saved.timeline).not.toHaveBeenCalled();
  expect(f.signIn).toHaveBeenCalledTimes(2);
});

it("rechecks Auth admission when sign-out is queued after verification but before the provider call", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  let armed = true;
  const unsubscribe = f.root.authStore.subscribe(() => {
    if (!armed || f.root.authStore.getSnapshot().status !== "verified") return;
    armed = false;
    queueMicrotask(() => { f.event("SIGNED_OUT", null); });
  });
  const create = f.root.groupEngineActions.createDraftGroup("Queued race draft");
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(saved.saveGroup).not.toHaveBeenCalled();
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  await create;
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(f.root.authenticatedDraft.store.getSnapshot()?.group.name).toBe("Queued race draft");
  unsubscribe(); release();
});
it("reverifies a remounted SDK lifecycle and drops late reads from the expired owner", async () => {
  const f = await setup();
  let release = f.root.authLifecycle.start();
  f.event("INITIAL_SESSION", f.session);
  release();
  release = f.root.authLifecycle.start();
  f.event("INITIAL_SESSION", f.session);
  await vi.waitFor(() => expect(f.root.authStore.getSnapshot().status).toBe("verified"));
  const verified = f.verify.mock.calls.length;
  release();
  release = f.root.authLifecycle.start();
  f.event("INITIAL_SESSION", f.session);
  await vi.waitFor(() => expect(f.verify.mock.calls.length).toBeGreaterThan(verified));
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote();
  const before = f.root.playerSessionStore.getSnapshot(saved.id);
  let resolve!: (value: import("pic-engine").PlayerSession | null) => void;
  saved.read.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const refresh = f.root.playerSessionStore.refresh(saved.id).catch(() => undefined);
  await vi.waitFor(() => expect(resolve).toBeDefined());
  f.event("SIGNED_OUT", null);
  resolve({ ...saved.sessions.get(saved.id)!, treatment_id: "late-stale-content" });
  await refresh;
  expect(f.root.playerSessionStore.getSnapshot(saved.id)).toEqual(before);
  expect(f.listen).toHaveBeenCalledTimes(3);
  release();
});

it("keeps a suspended intent intact when reset confirmation is canceled", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  f.event("SIGNED_OUT", null);
  const create = f.root.groupEngineActions.createDraftGroup("Retained after cancel");
  await vi.waitFor(() => expect(f.root.authLifecycle.hasPending()).toBe(true));
  expect(await f.root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(saved.saveGroup).not.toHaveBeenCalled();
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  const id = await create;
  expect((await f.root.groupEngineActions.getGroup(id))?.name).toBe("Retained after cancel");
  release();
});
it("keeps active Player focus while a same-owner SDK refresh verifies without credentials", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  const before = f.root.playerSessionStore.getSnapshot(id);
  f.event("TOKEN_REFRESHED", { ...f.session, access_token: "refreshed-fixture" });
  expect(f.root.authStore.getSnapshot().status).toBe("checking");
  expect(f.root.playerSessionStore.getSnapshot(id)).toEqual(before);
  const advance = f.root.playerEngineActions.advance(id);
  await advance;
  expect(f.root.authStore.getSnapshot().status).toBe("verified");
  expect(f.root.playerSessionStore.getSnapshot(id)?.units[0]?.state).toBe("completed");
  expect(f.signIn).toHaveBeenCalledOnce();
  expect(saved.rpc).toHaveBeenCalledOnce();
  release();
});
it("retries only local cleanup after a staged group save was confirmed", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.groupEngineActions.createDraftGroup("Cleanup retained draft");
  const remove = Storage.prototype.removeItem;
  const fault = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
    if (key === "pic-web.authenticated-draft.v1") throw new Error("Local cleanup interrupted");
    remove.call(this, key);
  });
  await expect(f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together")).rejects.toThrow("cleanup");
  expect(f.root.authenticatedDraft.store.getSnapshot()?.phase).toBe("anchored");
  const anchored = await saved.port.getGroup(id);
  fault.mockRestore();
  await f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together");
  expect(saved.saveGroup).toHaveBeenCalledOnce();
  expect(await saved.port.getGroup(id)).toEqual(anchored);
  expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
});
it("retains an exact staged group across partial server failure and resumes only that owner-bound save", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.groupEngineActions.createDraftGroup("Partial save draft");
  const symptom = await f.root.groupEngineActions.addSymptom(id, "Elbow");
  await f.root.groupEngineActions.rate(symptom, { polarity: "negative", intensity: 6 });
  const commit = saved.saveGroup.getMockImplementation()!;
  saved.saveGroup.mockImplementationOnce(async (group) => { await commit(group); throw new Error("Partial save interrupted"); });
  await expect(f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together")).rejects.toThrow("Partial");
  const frozen = JSON.parse(localStorage.getItem("pic-web.authenticated-draft.v1")!);
  expect(frozen).toMatchObject({ owner: f.user.id, phase: "flushing",
    group: { id, symptoms: [{ id: symptom, intensity: 6 }] } });
  await expect(f.root.inquiryResetActions.resetInquiry(true)).rejects.toThrow("pending group save");
  await f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together");
  expect(saved.saveGroup.mock.calls[1]?.[0]).toEqual(saved.saveGroup.mock.calls[0]?.[0]);
  expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
  expect((await saved.port.getGroup(id))?.symptoms[0]?.id).toBe(symptom);
  await f.root.inquiryResetActions.resetInquiry(true);
  expect((await saved.port.getGroup(id))?.name).toBe("Partial save draft");
  expect(saved.rpc).toHaveBeenCalledOnce();
});

it("keeps staged drafts unsaved through expiry and confirms their explicit local discard", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.groupEngineActions.createDraftGroup("Expiry staged draft");
  const before = f.root.authenticatedDraft.store.getSnapshot();
  f.event("SIGNED_OUT", null);
  const answer = f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together");
  await vi.waitFor(() => expect(f.root.authLifecycle.hasPending()).toBe(true));
  expect(f.root.authenticatedDraft.store.getSnapshot()).toEqual(before);
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(await f.root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  await answer;
  expect(saved.saveGroup).toHaveBeenCalledOnce();
  await f.root.inquiryResetActions.resetInquiry(true);
  const local = await f.root.groupEngineActions.createDraftGroup("Explicitly disposable draft");
  expect(await f.root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(f.root.authenticatedDraft.store.getSnapshot()?.group.id).toBe(local);
  await f.root.inquiryResetActions.resetInquiry(true);
  expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
  expect((await saved.port.getGroup(id))?.name).toBe("Expiry staged draft");
  expect(f.root.promotePathActions.hasVerifiedIdentity()).toBe(true);
  release();
});

it("retains exact staged data after reload without private hydration, cross-owner exposure, or fake promotion", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.groupEngineActions.createDraftGroup("Private retained draft");
  const symptom = await f.root.groupEngineActions.addSymptom(id, "Private symptom");
  await f.root.groupEngineActions.rate(symptom, { intensity: 8 });
  const retained = localStorage.getItem("pic-web.authenticated-draft.v1");
  vi.resetModules();
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(f.client);
  vi.spyOn(path, "createSupabaseRepositoryFromClient").mockReturnValue(saved.port);
  const root = (await import("./composition-root")).compositionRoot;
  expect(root.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(root.authenticatedDraft.store.getSnapshot()).toMatchObject({ restored: true,
    group: { id, symptoms: [{ id: symptom, intensity: 8 }] } });
  await expect(root.groupEngineActions.createDraftGroup("Would overwrite")).rejects.toThrow("Retained");
  const { AppProviders } = await import("./app-providers");
  const { GuestModeShell } = await import("./GuestModeShell");
  f.verify.mockResolvedValue({ data: { user: { ...f.user, id: "other-owner" } }, error: null });
  render(createElement(AppProviders, null, createElement(GuestModeShell)));
  act(() => { f.event("INITIAL_SESSION", f.session); });
  await vi.waitFor(() => expect(root.authStore.getSnapshot().status).toBe("reauthenticate"));
  expect(screen.queryByText("Private retained draft")).toBeNull();
  expect(screen.queryByText("Private symptom")).toBeNull();
  f.verify.mockResolvedValue({ data: { user: f.user }, error: null });
  await act(async () => { await root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" }); });
  expect(screen.getByText("Private retained draft")).toBeDefined();
  expect(screen.getByText("Private symptom")).toBeDefined();
  expect(screen.queryByText("8")).toBeNull();
  expect(localStorage.getItem("pic-web.authenticated-draft.v1")).toBe(retained);
  expect(await root.inquiryResetActions.resetInquiry()).toBe("confirmation");
  expect(localStorage.getItem("pic-web.authenticated-draft.v1")).toBe(retained);
  await act(async () => { await root.inquiryResetActions.resetInquiry(true); });
  expect(root.authenticatedDraft.store.getSnapshot()).toBeNull();
  expect(saved.saveGroup).not.toHaveBeenCalled();
  expect(saved.rpc).toHaveBeenCalledOnce();
});
it("admits only one concurrent new authenticated draft without overwriting its staged UUID", async () => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const results = await Promise.allSettled([
    f.root.groupEngineActions.createDraftGroup("First concurrent draft"),
    f.root.groupEngineActions.createDraftGroup("Second concurrent draft"),
  ]);
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  const created = results.find((result) => result.status === "fulfilled");
  if (created?.status !== "fulfilled") throw new Error("A draft should have been admitted");
  expect(f.root.authenticatedDraft.store.getSnapshot()?.group.id).toBe(created.value);
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(created.value);
  expect(saved.saveGroup).not.toHaveBeenCalled();
});

it.each(["Player", "answered group"])("does not restore subsequent authenticated %s IDs through Guest storage", async (kind) => {
  const f = await setup();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  await f.root.inquiryResetActions.resetInquiry(true);
  let id: string;
  if (kind === "Player") {
    id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  } else {
    id = await f.root.groupEngineActions.createDraftGroup("Subsequent saved focus");
    await f.root.groupEngineActions.setJointTreatmentMuscleTest(id, "together");
    expect(f.root.authenticatedDraft.store.getSnapshot()).toBeNull();
  }
  const facts = await import("./guest-flow-facts");
  await facts.settleGuestFlowPersistence();
  expect(kind === "Player" ? facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId :
    f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(id);
  vi.resetModules();
  const root = (await import("./composition-root")).compositionRoot;
  const restoredFacts = await import("./guest-flow-facts");
  await vi.waitFor(() => expect(restoredFacts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull());
  expect(root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(root.sessionEngineStore.getSnapshot()).toMatchObject({ mode: "guest", gateTriggered: false });
  expect(root.playerSessionStore.getSnapshot(id)).toBeNull();
  const path = await import("./promote-path");
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(f.client);
  const { App } = await import("./App");
  render(createElement(App));
  expect(await screen.findByTestId("guest-flow-create-group")).toBeDefined();
  expect(saved.rpc).toHaveBeenCalledOnce();
  cleanup();
  const before = localStorage.getItem("pic:guest-repository:v1");
  const set = Storage.prototype.setItem;
  const fault = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "pic:guest-repository:v1") throw new Error("Guest storage unavailable");
    set.call(this, key, value);
  });
  await expect(root.groupEngineActions.createDraftGroup("New local inquiry")).rejects.toThrow("storage unavailable");
  expect(localStorage.getItem("pic:guest-repository:v1")).toBe(before);
  fault.mockRestore();
  vi.resetModules();
  const afterFailure = (await import("./composition-root")).compositionRoot;
  const failedFacts = await import("./guest-flow-facts");
  expect(afterFailure.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(failedFacts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBeNull();
  expect(afterFailure.sessionEngineStore.getSnapshot()).toMatchObject({ mode: "guest", gateTriggered: false });
});

it("retains a partially applied authenticated Finish when reset is requested during expiry", async () => {
  const f = await setup();
  const release = f.root.authLifecycle.start();
  const saved = await pendingGate(f);
  await f.root.promotePathActions.signInAndPromote({ email: f.user.email, password: "secret" });
  const id = await f.root.playerEngineActions.startSession("treatment", null, ["one"]);
  const increment = saved.increment.getMockImplementation()!;
  saved.increment.mockImplementationOnce(async (...args) => {
    const result = await increment(...args);
    f.event("SIGNED_OUT", null);
    return result;
  });
  const finish = f.root.sessionEngineActions.onFinishRequested(id, "finishAnyway");
  await vi.waitFor(() => expect(f.root.authLifecycle.hasPending()).toBe(true));
  expect(saved.increment).toHaveBeenCalledOnce();
  expect(saved.timeline).not.toHaveBeenCalled();
  await expect(f.root.inquiryResetActions.resetInquiry()).rejects.toThrow("settle saved completion");
  await expect(f.root.inquiryResetActions.resetInquiry(true)).rejects.toThrow("settle saved completion");
  expect(f.root.authLifecycle.hasPending()).toBe(true);
  expect(saved.sessions.get(id)?.success_declared).toBe(false);
  await f.root.promotePathActions.reauthenticate({ email: f.user.email, password: "secret" });
  await finish;
  expect(saved.increment).toHaveBeenCalledOnce();
  expect(saved.timeline).toHaveBeenCalledOnce();
  expect(saved.sessions.get(id)?.success_declared).toBe(true);
  await f.root.inquiryResetActions.resetInquiry(true);
  expect(saved.sessions.get(id)?.success_declared).toBe(true);
  release();
});
