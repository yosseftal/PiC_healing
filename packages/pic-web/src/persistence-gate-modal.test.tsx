// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
import { AuthApiError } from "@supabase/supabase-js";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY } from "pic-adapter-local-guest";
import type { FinalizedSymptomGroup, PlayerSession, RepositoryPort } from "pic-engine";

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

async function loadFreshModules() {
  vi.resetModules();
  localStorage.clear();
  localStorage.setItem("pic-web.locale.v1", "en");
  const { compositionRoot } = await import("./composition-root");
  const { PersistenceGateModal } = await import("./PersistenceGateModal");
  const { SessionEngineProvider } = await import("./session-engine-context");
  const { LocaleProvider, useLocale } = await import("./i18n/locale-provider");
  return { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider, useLocale };
}

async function openGateWithGuestSession(
  compositionRoot: Awaited<ReturnType<typeof loadFreshModules>>["compositionRoot"],
) {
  const group = buildFinalizedGroup();
  const session = buildPlayerSession(group.id);
  await compositionRoot.repositoryPort.saveGroup(group);
  await compositionRoot.repositoryPort.savePlayerSession(session);
  await compositionRoot.sessionEngineActions.onFinishRequested(session.id, "finish");
  return { group, session };
}

function renderModal(
  PersistenceGateModal: Awaited<ReturnType<typeof loadFreshModules>>["PersistenceGateModal"],
  SessionEngineProvider: Awaited<ReturnType<typeof loadFreshModules>>["SessionEngineProvider"],
  LocaleProvider: Awaited<ReturnType<typeof loadFreshModules>>["LocaleProvider"],
) {
  const view = render(
    <LocaleProvider>
      <SessionEngineProvider>
        <PersistenceGateModal />
      </SessionEngineProvider>
    </LocaleProvider>,
  );
  fillLogin();
  return view;
}

function renderWithLocaleControl(modules: Awaited<ReturnType<typeof loadFreshModules>>) {
  const { LocaleProvider, SessionEngineProvider, PersistenceGateModal, useLocale } = modules;
  let selectLocale: ReturnType<typeof useLocale>["selectLocale"];
  function LocaleProbe() {
    selectLocale = useLocale().selectLocale;
    return null;
  }
  const view = render(
    <LocaleProvider>
      <LocaleProbe />
      <SessionEngineProvider><PersistenceGateModal /></SessionEngineProvider>
    </LocaleProvider>,
  );
  fillLogin();
  return { ...view, choose: (locale: "he" | "en") => act(() => selectLocale(locale)) };
}

function fillLogin() {
  const email = document.getElementById("gate-email");
  const password = document.getElementById("gate-password");
  if (email) fireEvent.change(email, { target: { value: "fixture@example.com" } });
  if (password) fireEvent.change(password, { target: { value: "  untouched password  " } });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PersistenceGateModal", () => {
  it.each([
    ["over_email_send_rate_limit", 429, /Please wait before trying again/],
    ["otp_expired", 403, /verification link has expired/],
    ["email_not_confirmed", 400, /Check your email for a verification message/],
    ["weak_password", 422, /details or password could not be accepted/],
  ] as const)("retains the draft with localized recoverable signup guidance for %s", async (code, status, expected) => {
    const modules = await loadFreshModules();
    await openGateWithGuestSession(modules.compositionRoot);
    const before = await modules.compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate();
    vi.spyOn(modules.compositionRoot.promotePathActions, "register")
      .mockRejectedValue(new AuthApiError("Do not display provider details", status, code));
    renderModal(modules.PersistenceGateModal, modules.SessionEngineProvider, modules.LocaleProvider);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Name" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: "Register" }));
    await screen.findByText(expected);
    expect(screen.queryByText("Do not display provider details")).toBeNull();
    expect(await modules.compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(before);
  });
  it("switches registration modes with stable focus and non-secret input, then retains work while verification is needed",
    async () => {
      const modules = await loadFreshModules();
      await openGateWithGuestSession(modules.compositionRoot);
      const register = vi.spyOn(modules.compositionRoot.promotePathActions, "register").mockResolvedValue();
      renderModal(modules.PersistenceGateModal, modules.SessionEngineProvider, modules.LocaleProvider);
      const switchMode = screen.getByRole("button", { name: "Create an account" });
      switchMode.focus();
      fireEvent.click(switchMode);
      expect(document.activeElement).toBe(switchMode);
      expect((screen.getByLabelText("Email address") as HTMLInputElement).value).toBe("fixture@example.com");
      expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
      expect(screen.getByLabelText("Password").getAttribute("autocomplete")).toBe("new-password");
      fireEvent.change(screen.getByLabelText("Name"), { target: { value: "  My Name  " } });
      fireEvent.click(switchMode);
      fireEvent.click(switchMode);
      expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("  My Name  ");
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "  exact secret  " } });
      fireEvent.click(screen.getByRole("button", { name: "Register" }));
      await vi.waitFor(() => expect(register).toHaveBeenCalledExactlyOnceWith({
        name: "  My Name  ", email: "fixture@example.com", password: "  exact secret  ",
      }));
      expect(modules.compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
    });
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens a real Hebrew login form with password-manager labels and no provider placeholders", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    localStorage.setItem("pic-web.locale.v1", "he");
    await openGateWithGuestSession(compositionRoot);
    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);

    const gate = screen.getByRole("dialog", { name: "שמירת הסשן שלך" });
    expect(gate.getAttribute("lang")).toBe("he");
    expect(gate.getAttribute("dir")).toBe("rtl");
    expect(screen.getByText("אפשר להתחבר כדי לשמור את הסשן — העבודה נשארת במכשיר הזה עד לבחירתך לשמור אותה.")).toBeTruthy();
    expect(screen.getByLabelText("כתובת אימייל").getAttribute("autocomplete")).toBe("email");
    expect(screen.getByLabelText("סיסמה").getAttribute("autocomplete")).toBe("current-password");
    expect(screen.getByRole("button", { name: "התחברות ושמירה" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Apple|Google|הדגמת פיתוח/ })).toBeNull();
    expect(gate.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByRole("button", { name: "המשך ללא שמירה" })).toBeTruthy();
  });

  it("renders nothing when gateTriggered is false", async () => {
    const { PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    const { container } = renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);

    expect(container.firstChild).toBeNull();
  });

  it("renders auth options when gateTriggered and promotionStatus idle", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);

    expect(screen.getByRole("dialog", { name: "Keep your session" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Sign in and save" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue without saving" })).toBeTruthy();
  });

  it("links validation to fields, submits the untouched password once, and clears the transient secret", async () => {
    const modules = await loadFreshModules();
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = modules;
    await openGateWithGuestSession(compositionRoot);
    let reject!: (error: Error) => void;
    const login = vi.spyOn(compositionRoot.promotePathActions, "signInAndPromote")
      .mockImplementation(() => new Promise((_, fail) => { reject = fail; }));
    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);
    fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in and save" }));
    expect(login).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Email address").getAttribute("aria-describedby")).toBe("gate-form-message");
    expect(screen.getByRole("alert").textContent).toContain("valid email");
    fillLogin();
    const form = screen.getByLabelText("Password").closest("form")!;
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(login).toHaveBeenCalledExactlyOnceWith({ email: "fixture@example.com", password: "  untouched password  " });
    expect(screen.getByRole("dialog").getAttribute("aria-busy")).toBe("true");
    await act(async () => { reject(new Error("credentials rejected")); });
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).not.toContain("untouched password");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(document.querySelectorAll("#gate-form-message")).toHaveLength(1);
    expect(screen.getByRole("alert").textContent).toContain("valid email");
  });

  it("renders retry affordance when promotionStatus failed", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    const { group, session } = await openGateWithGuestSession(compositionRoot);
    const guestProvider = compositionRoot.repositoryPort.getProvider();

    const failingPort: RepositoryPort = {
      ...(guestProvider as RepositoryPort),
      reorderSymptoms: guestProvider.reorderSymptoms.bind(guestProvider),
      async promoteGuestToAccount() {
        throw new Error("network drop");
      },
    };

    await compositionRoot.promotePathActions.promoteWithAuthenticatedRepository(
      failingPort,
      { group, playerSession: session },
      "user-retry",
    );

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);

    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    expect(screen.queryByText(/partial/i)).toBeNull();
    expect(screen.queryByText(/lost/i)).toBeNull();
  });

  it("surfaces pre-RPC sign-in failure into retry UI when env credentials are missing", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);

    const signInError = new Error(
      "signInAsTestUserFromEnv (dev stub): missing Supabase URL/anon key or tracer test-user credentials in env",
    );
    vi.spyOn(compositionRoot.promotePathActions, "signInAndPromote").mockRejectedValue(signInError);

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);
    fireEvent.click(screen.getByRole("button", { name: "Sign in and save" }));

    await vi.waitFor(() => {
      expect(screen.getByText(/We could not anchor your session yet/)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("idle");
  });

  it("decline confirms loss and cancel or Escape preserves the pending Gate", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
    const keep = await screen.findByRole("button", { name: "Keep current inquiry" });
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await vi.waitFor(() => expect(document.activeElement).toBe(keep));
    fireEvent.click(keep);
    expect(screen.getByRole("button", { name: "Continue without saving" })).toBeTruthy();
    expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
    await screen.findByRole("button", { name: "Keep current inquiry" });
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.getByRole("button", { name: "Continue without saving" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
    await vi.waitFor(() => {
      expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    });
    expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
    expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
    await act(async () => { await openGateWithGuestSession(compositionRoot); });
    // This standalone mount uses local utility controls; the app provider normally closes confirmation on reset.
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect((screen.getByLabelText("Password") as HTMLInputElement).value).toBe("");
  });

  it("keeps a pending sign-in request and settles its recovery message in the current language", async () => {
    const modules = await loadFreshModules();
    const { compositionRoot } = modules;
    await openGateWithGuestSession(compositionRoot);
    const snapshot = await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate();
    let rejectSignIn!: (error: Error) => void;
    const signIn = vi.spyOn(compositionRoot.promotePathActions, "signInAndPromote")
      .mockImplementation(() => new Promise((_, reject) => { rejectSignIn = reject; }));
    const discard = vi.spyOn(compositionRoot.sessionEngineActions, "discardGuestState");
    const finish = vi.spyOn(compositionRoot.sessionEngineActions, "onFinishRequested");
    const promote = vi.spyOn(compositionRoot.sessionEngineActions, "promote");
    const { choose } = renderWithLocaleControl(modules);
    const gate = screen.getByRole("dialog");
    const control = screen.getByRole("button", { name: "Sign in and save" });
    control.focus();
    fireEvent.click(control);
    choose("he");
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBe(gate);
    gate.focus();
    expect(screen.queryByRole("button")).toBeNull();
    expect(document.activeElement).toBe(gate);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(discard).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
    expect(promote).not.toHaveBeenCalled();
    expect(await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate()).toEqual(snapshot);
    await act(async () => { rejectSignIn(new Error("sign-in unavailable")); });
    expect(screen.getByText("עדיין לא הצלחנו לשמור את הסשן שלך. אפשר לנסות שוב כשמתאים לך.")).toBeTruthy();
    const retry = screen.getByRole("button", { name: "ניסיון נוסף" });
    retry.focus();
    choose("en");
    expect(screen.getByRole("button", { name: "Try again" })).toBe(retry);
    expect(document.activeElement).toBe(retry);
    expect(screen.getByText("We could not anchor your session yet. You can try again whenever you are ready.")).toBeTruthy();
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("idle");
    expect(signIn).toHaveBeenCalledTimes(1);
  });

  it("retains the pending promotion and guest snapshot through language changes, failure and explicit retry", async () => {
    const modules = await loadFreshModules();
    const { compositionRoot } = modules;
    const { group, session } = await openGateWithGuestSession(compositionRoot);
    let rejectPromotion!: (error: Error) => void;
    const failingPort: RepositoryPort = {
      ...(compositionRoot.repositoryPort.getProvider() as RepositoryPort),
      reorderSymptoms: compositionRoot.repositoryPort.reorderSymptoms.bind(compositionRoot.repositoryPort),
      promoteGuestToAccount: () => new Promise((_, reject) => { rejectPromotion = reject; }),
    };
    const signIn = vi.spyOn(compositionRoot.promotePathActions, "signInAndPromote")
      .mockImplementation(() => compositionRoot.promotePathActions.promoteWithAuthenticatedRepository(
        failingPort, { group, playerSession: session }, "user-pending",
      ));
    const { choose } = renderWithLocaleControl(modules);
    fireEvent.click(screen.getByRole("button", { name: "Sign in and save" }));
    const gate = screen.getByRole("dialog");
    gate.focus();
    expect(screen.getByText("Anchoring your session…")).toBeTruthy();
    choose("he");
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBe(gate);
    expect(document.activeElement).toBe(gate);
    expect(screen.getByText("הסשן שלך נשמר…")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    await act(async () => { await Promise.resolve(); });
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("pending");
    expect(await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate())
      .toEqual({ group: { ...group, revision: 0 }, playerSession: session, promotionPayloadVersion: 2 });
    await act(async () => { rejectPromotion(new Error("connection dropped")); });
    expect(screen.getByText("עדיין לא הצלחנו לשמור את הסשן שלך. אפשר לנסות שוב כשמתאים לך.")).toBeTruthy();
    const retry = screen.getByRole("button", { name: "ניסיון נוסף" });
    retry.focus();
    choose("en");
    expect(screen.getByRole("button", { name: "Try again" })).toBe(retry);
    expect(document.activeElement).toBe(retry);
    expect(signIn).toHaveBeenCalledTimes(1);
    await act(async () => { fireEvent.click(retry); });
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("pending");
    await act(async () => { rejectPromotion(new Error("still reconnecting")); });
    expect(await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate())
      .toEqual({ group: { ...group, revision: 0 }, playerSession: session, promotionPayloadVersion: 2 });
    expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
  });

  it("keeps in-memory language and discard available when preference reads and writes fail", async () => {
    const modules = await loadFreshModules();
    await openGateWithGuestSession(modules.compositionRoot);
    const signIn = vi.spyOn(modules.compositionRoot.promotePathActions, "signInAndPromote")
      .mockRejectedValue(new Error("development sign-in unavailable"));
    const read = Storage.prototype.getItem;
    const write = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(function (this: Storage, key) {
      if (key === "pic-web.locale.v1") throw new Error("preference read unavailable");
      return read.call(this, key);
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === "pic-web.locale.v1") throw new Error("preference write unavailable");
      write.call(this, key, value);
    });
    const { choose, unmount } = renderWithLocaleControl(modules);
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBeTruthy();
    choose("en");
    expect(screen.getByRole("dialog", { name: "Keep your session" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Sign in and save" }));
    await screen.findByRole("button", { name: "Try again" });
    fillLogin();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await vi.waitFor(() => expect(signIn).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
    fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    unmount();
    await openGateWithGuestSession(modules.compositionRoot);
    renderWithLocaleControl(modules);
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "ניסיון נוסף" })).toBeNull();
  });
});
