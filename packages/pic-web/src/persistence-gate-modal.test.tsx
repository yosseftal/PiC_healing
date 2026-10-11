// @vitest-environment jsdom
import { randomUUID } from "node:crypto";
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
  return render(
    <LocaleProvider>
      <SessionEngineProvider>
        <PersistenceGateModal />
      </SessionEngineProvider>
    </LocaleProvider>,
  );
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
  return { ...view, choose: (locale: "he" | "en") => act(() => selectLocale(locale)) };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("PersistenceGateModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens in the selected Hebrew language with truthful disabled auth stubs outside a Frame", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    localStorage.setItem("pic-web.locale.v1", "he");
    await openGateWithGuestSession(compositionRoot);
    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);

    const gate = screen.getByRole("dialog", { name: "שמירת הסשן שלך" });
    expect(gate.getAttribute("lang")).toBe("he");
    expect(gate.getAttribute("dir")).toBe("rtl");
    expect(screen.getByText("אפשר להתחבר כדי לשמור את הסשן — העבודה נשארת במכשיר הזה עד לבחירתך לשמור אותה.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "התחברות (הדגמת פיתוח)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "התחברות עם Apple (טרם זמינה)" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "התחברות עם Google (טרם זמינה)" }).hasAttribute("disabled")).toBe(true);
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
    expect(screen.getByRole("button", { name: "Sign in (dev tracer stub)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue without saving" })).toBeTruthy();
  });

  it("renders retry affordance when promotionStatus failed", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    const { group, session } = await openGateWithGuestSession(compositionRoot);
    const guestProvider = compositionRoot.repositoryPort.getProvider();

    const failingPort: RepositoryPort = {
      ...(guestProvider as RepositoryPort),
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
    vi.spyOn(compositionRoot.promotePathActions, "promoteGuestSessionFromEnv").mockRejectedValue(signInError);

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);
    fireEvent.click(screen.getByRole("button", { name: "Sign in (dev tracer stub)" }));

    await vi.waitFor(() => {
      expect(screen.getByText(/We could not anchor your session yet/)).toBeTruthy();
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
    });
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("idle");
  });

  it("decline calls discardGuestState and clears guest storage", async () => {
    const { compositionRoot, PersistenceGateModal, SessionEngineProvider, LocaleProvider } = await loadFreshModules();
    await openGateWithGuestSession(compositionRoot);
    expect(storageHasGuestEntityData(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY))).toBe(true);

    renderModal(PersistenceGateModal, SessionEngineProvider, LocaleProvider);
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));

    await vi.waitFor(() => {
      expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    });
    expect(compositionRoot.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
    expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
  });

  it("keeps a pending sign-in request and settles its recovery message in the current language", async () => {
    const modules = await loadFreshModules();
    const { compositionRoot } = modules;
    await openGateWithGuestSession(compositionRoot);
    const snapshot = await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate();
    let rejectSignIn!: (error: Error) => void;
    const signIn = vi.spyOn(compositionRoot.promotePathActions, "promoteGuestSessionFromEnv")
      .mockImplementation(() => new Promise((_, reject) => { rejectSignIn = reject; }));
    const discard = vi.spyOn(compositionRoot.sessionEngineActions, "discardGuestState");
    const finish = vi.spyOn(compositionRoot.sessionEngineActions, "onFinishRequested");
    const promote = vi.spyOn(compositionRoot.sessionEngineActions, "promote");
    const { choose } = renderWithLocaleControl(modules);
    const gate = screen.getByRole("dialog");
    const control = screen.getByRole("button", { name: "Sign in (dev tracer stub)" });
    control.focus();
    fireEvent.click(control);
    choose("he");
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBe(gate);
    expect(screen.getByRole("button", { name: "התחברות (הדגמת פיתוח)" })).toBe(control);
    expect(document.activeElement).toBe(control);
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
      promoteGuestToAccount: () => new Promise((_, reject) => { rejectPromotion = reject; }),
    };
    const signIn = vi.spyOn(compositionRoot.promotePathActions, "promoteGuestSessionFromEnv")
      .mockImplementation(() => compositionRoot.promotePathActions.promoteWithAuthenticatedRepository(
        failingPort, { group, playerSession: session }, "user-pending",
      ));
    const { choose } = renderWithLocaleControl(modules);
    fireEvent.click(screen.getByRole("button", { name: "Sign in (dev tracer stub)" }));
    const gate = screen.getByRole("dialog");
    gate.focus();
    expect(screen.getByText("Anchoring your session…")).toBeTruthy();
    choose("he");
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBe(gate);
    expect(document.activeElement).toBe(gate);
    expect(screen.getByText("הסשן שלך נשמר…")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("pending");
    expect(await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate())
      .toEqual({ group, playerSession: session });
    await act(async () => { rejectPromotion(new Error("connection dropped")); });
    expect(screen.getByText("עדיין לא הצלחנו לשמור את הסשן שלך. אפשר לנסות שוב כשמתאים לך.")).toBeTruthy();
    const retry = screen.getByRole("button", { name: "ניסיון נוסף" });
    retry.focus();
    choose("en");
    expect(screen.getByRole("button", { name: "Try again" })).toBe(retry);
    expect(document.activeElement).toBe(retry);
    expect(signIn).toHaveBeenCalledTimes(1);
    fireEvent.click(retry);
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(compositionRoot.sessionEngineStore.getSnapshot().promotionStatus).toBe("pending");
    await act(async () => { rejectPromotion(new Error("still reconnecting")); });
    expect(await compositionRoot.promotePathActions.assembleGuestSnapshotForPendingGate())
      .toEqual({ group, playerSession: session });
    expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
  });

  it("keeps in-memory language and discard available when preference reads and writes fail", async () => {
    const modules = await loadFreshModules();
    await openGateWithGuestSession(modules.compositionRoot);
    const signIn = vi.spyOn(modules.compositionRoot.promotePathActions, "promoteGuestSessionFromEnv")
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
    fireEvent.click(screen.getByRole("button", { name: "Sign in (dev tracer stub)" }));
    await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await vi.waitFor(() => expect(signIn).toHaveBeenCalledTimes(2));
    await screen.findByRole("button", { name: "Try again" });
    fireEvent.click(screen.getByRole("button", { name: "Continue without saving" }));
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBeNull();
    unmount();
    await openGateWithGuestSession(modules.compositionRoot);
    renderWithLocaleControl(modules);
    expect(screen.getByRole("dialog", { name: "שמירת הסשן שלך" })).toBeTruthy();
  });
});
