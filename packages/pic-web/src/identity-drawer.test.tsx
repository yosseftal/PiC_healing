// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createClient, type AuthChangeEvent, type Session } from "@supabase/supabase-js";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); });

async function setup() {
  vi.resetModules();
  localStorage.clear();
  localStorage.setItem("pic-web.locale.v1", "en");
  vi.stubEnv("VITE_SUPABASE_URL", "https://identity-drawer.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-fixture");
  const path = await import("./promote-path");
  const client = createClient("https://identity-drawer.invalid", "public-fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = { id: "drawer-owner", email: "private@example.com", email_confirmed_at: "2026-10-22",
    app_metadata: {}, user_metadata: { full_name: "Auth fallback" }, aud: "authenticated", created_at: "2026-10-22" };
  const session: Session = { user, access_token: "drawer-token", refresh_token: "fixture", expires_in: 3600,
    token_type: "bearer" };
  vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  let event!: (event: AuthChangeEvent, session: Session | null) => void;
  vi.spyOn(client.auth, "onAuthStateChange").mockImplementation((callback) => {
    event = callback;
    return { data: { subscription: { id: "drawer-listener", callback, unsubscribe: vi.fn() } } };
  });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  const root = (await import("./app-providers")).AppProviders;
  const Frame = (await import("./therapeutic-frame/TherapeuticScreenFrame")).TherapeuticScreenFrame;
  const view = render(createElement(root, null, createElement(Frame, {
    title: "Identity fixture", stageLabel: "Identity", children: null,
  })));
  return { client, user, session, path, event: (kind: AuthChangeEvent, value: Session | null) => event(kind, value), view };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

async function openDrawer() {
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  await screen.findByRole("dialog");
}

it("shows guest, verified profile greeting and separate unsaved work without exposing email", async () => {
  const f = await setup();
  const root = (await import("./composition-root")).compositionRoot;
  await act(async () => { f.event("SIGNED_OUT", null); });
  await openDrawer();
  expect(screen.getByText("Guest mode")).toBeTruthy();
  expect(screen.getByText("Hello")).toBeTruthy();
  expect(root.authStore.getSnapshot().status).toBe("guest");
  await root.inquiryResetActions.resetInquiry(true);
  expect(root.authStore.getSnapshot().status).toBe("guest");
  const row = root.questionnaire.store.getSnapshot().rows[0]!;
  const generation = (await import("./inquiry-lifecycle")).inquiryGenerationStore.getSnapshot();
  root.questionnaire.actionsFor(generation).edit(row.id, { name: "Shoulder" });
  const profile = vi.fn().mockResolvedValue({ data: { full_name: "מרים לוי" }, error: null });
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await waitFor(() => expect(profile).toHaveBeenCalledOnce());
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello מרים לוי");
  expect(screen.getByRole("dialog").querySelector("bdi")?.textContent).toBe("מרים לוי");
  expect(screen.getByText("Connected to account")).toBeTruthy();
  expect(screen.getByText("Your current work is held on this device; saving it to your account has not been confirmed."))
    .toBeTruthy();
  expect(screen.queryByText(f.user.email)).toBeNull();
});

it("uses verified Auth metadata when the profile lookup fails", async () => {
  const f = await setup();
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: null, error: new Error("profile unavailable") }),
  }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello Auth fallback");
  expect(screen.getByRole("dialog").textContent).not.toContain(f.user.email);
});

it("never uses the literal profile placeholder as a personal name", async () => {
  const f = await setup();
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: { full_name: "השם שלך" }, error: null }),
  }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello Auth fallback");
  expect(screen.getByRole("dialog").textContent).not.toContain("השם שלך");
});

it("uses the plain greeting when both profile and verified Auth metadata have no usable name", async () => {
  const f = await setup();
  f.user.user_metadata.full_name = "   ";
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: { full_name: "  " }, error: null }),
  }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello");
  expect(screen.getByRole("dialog").textContent).not.toContain("השם שלך");
  expect(screen.getByRole("dialog").textContent).not.toContain(f.user.email);
});

it("distinguishes checking, reauthentication and uncertain completion in the drawer", async () => {
  const f = await setup();
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Checking account status");
  const root = (await import("./composition-root")).compositionRoot;
  root.authLifecycle.bind(f.user.id);
  await act(async () => { root.authLifecycle.suspend(); });
  expect(screen.getByRole("dialog").textContent).toContain("Sign in again to your account");
  await act(async () => { root.authLifecycle.suspend("uncertain"); });
  expect(screen.getByRole("dialog").textContent).toContain("The last save result is unknown");
});

it("shows pending email verification as a distinct identity state", async () => {
  const f = await setup();
  const root = (await import("./composition-root")).compositionRoot;
  const sessionId = await root.playerEngineActions.startSession("treatment", null, ["one"]);
  await root.playerEngineActions.respondTerminalNemar(sessionId, "no");
  await root.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  vi.spyOn(f.client.auth, "signUp").mockResolvedValue({ data: { user: f.user, session: null }, error: null } as never);
  await root.promotePathActions.register({ email: f.user.email, password: "fixture-password", name: "Event Manager" });
  await act(async () => { root.authLifecycle.suspend(); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Waiting for email verification");
  expect(screen.getByRole("dialog").textContent).not.toContain("Connected to account");
  expect(screen.getByRole("dialog").textContent).toContain("Your current work is held on this device");

  await act(async () => { root.authLifecycle.suspend("checking"); });
  expect(screen.getByRole("dialog").textContent).toContain("Checking account status");
  expect(screen.getByRole("dialog").textContent).not.toContain("Waiting for email verification");
  root.authLifecycle.bind(f.user.id);
  await act(async () => { root.authLifecycle.suspend(); });
  expect(screen.getByRole("dialog").textContent).toContain("Sign in again to your account");
  expect(screen.getByRole("dialog").textContent).not.toContain("Waiting for email verification");
  await act(async () => { root.authLifecycle.suspend("uncertain"); });
  expect(screen.getByRole("dialog").textContent).toContain("The last save result is unknown");
  expect(screen.getByRole("dialog").textContent).not.toContain("Waiting for email verification");
});

it("keeps retained recovery visible after promotion succeeds but confirmation fails", async () => {
  const f = await setup();
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({
    maybeSingle: async () => ({ data: { id: f.user.id }, error: null }),
  }) }) } as never);
  const port = f.path.createSupabaseRepositoryFromClient(f.client);
  vi.spyOn(f.path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  vi.spyOn(port, "promoteGuestToAccount").mockImplementation(async (input) => ({
    group: input.group,
    playerSession: { ...input.playerSession, success_declared: true, finished_at: "2026-10-22T00:00:00Z" },
    libraryRow: { id: "library-row", treatment_id: input.playerSession.treatment_id, use_count: 1,
      provenance: { source: "guest_promotion", first_seen_at: "2026-10-22T00:00:00Z" },
      variant_type: "original", global_reference_id: input.playerSession.treatment_id,
      protocol_content: null, created_at: "2026-10-22T00:00:00Z" },
    timelineEvent: { id: input.playerSession.id, log_type: "treatment_execution",
      treatment_id: input.playerSession.treatment_id, library_row_id: "library-row",
      linked_group_id: input.playerSession.linked_group_id, metadata: null,
      created_at: "2026-10-22T00:00:00Z" },
  }));
  vi.spyOn(port, "getPlayerSession").mockRejectedValueOnce(new Error("confirmation unavailable"));
  const root = (await import("./composition-root")).compositionRoot;
  const sessionId = await root.playerEngineActions.startSession("treatment", null, ["one"]);
  await root.playerEngineActions.respondTerminalNemar(sessionId, "no");
  await root.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  vi.spyOn(f.client.auth, "signInWithPassword").mockResolvedValue({
    data: { user: f.user, session: f.session }, error: null,
  } as never);
  await act(async () => {
    await expect(root.promotePathActions.signInAndPromote({ email: f.user.email, password: "fixture-password" }))
      .rejects.toThrow("confirmation unavailable");
  });
  expect(root.sessionEngineStore.getSnapshot()).toMatchObject({ mode: "authenticated", promotionStatus: "succeeded" });
  expect(root.promotionRecoveryStore.getSnapshot()).toBe("failed");
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Your current work is held on this device");
  expect(screen.getByRole("dialog").textContent).toContain("We could not confirm the save");
});

it("ignores a delayed name response from the prior auth revision", async () => {
  const f = await setup();
  const oldRead = deferred<{ data: { full_name: string }; error: null }>();
  const currentRead = deferred<{ data: { full_name: string }; error: null }>();
  let reads = 0;
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () =>
    ++reads === 1 ? oldRead.promise : currentRead.promise }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await waitFor(() => expect(reads).toBe(1));
  await act(async () => { f.event("SIGNED_OUT", null); });
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await waitFor(() => expect(reads).toBe(2));
  await act(async () => { currentRead.resolve({ data: { full_name: "Current owner name" }, error: null }); });
  await act(async () => { oldRead.resolve({ data: { full_name: "Stale previous name" }, error: null }); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello Current owner name");
  expect(screen.getByRole("dialog").textContent).not.toContain("Hello Stale previous name");
});

it("does not carry a delayed prior-owner name into a different verified account", async () => {
  const f = await setup();
  const priorRead = deferred<{ data: { full_name: string }; error: null }>();
  const currentRead = deferred<{ data: { full_name: string }; error: null }>();
  let reads = 0;
  let currentUser = f.user;
  vi.spyOn(f.client.auth, "getUser").mockImplementation(async () => ({ data: { user: currentUser }, error: null }));
  vi.spyOn(f.client, "from").mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: () =>
    ++reads === 1 ? priorRead.promise : currentRead.promise }) }) } as never);
  await act(async () => { f.event("INITIAL_SESSION", f.session); });
  await waitFor(() => expect(reads).toBe(1));
  currentUser = { ...f.user, id: "second-drawer-owner", email: "second-private@example.com",
    user_metadata: { full_name: "Second Auth fallback" } };
  const nextSession = { ...f.session, user: currentUser, access_token: "second-token" };
  await act(async () => { f.event("SIGNED_IN", nextSession); });
  await waitFor(() => expect(reads).toBe(2));
  await act(async () => { currentRead.resolve({ data: { full_name: "Second owner" }, error: null }); });
  await act(async () => { priorRead.resolve({ data: { full_name: "First owner stale name" }, error: null }); });
  await openDrawer();
  expect(screen.getByRole("dialog").textContent).toContain("Hello Second owner");
  expect(screen.getByRole("dialog").textContent).not.toContain("First owner stale name");
});
