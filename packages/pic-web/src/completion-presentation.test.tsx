// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createCompletionPresentation, readCompletionRecovery, type CompletionPresentationDependencies,
} from "./completion-presentation";
import { CompletionReturnScreen } from "./CompletionReturnScreen";
import { AppProviders } from "./app-providers";

afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

function confirmedSession() {
  return {
    id: "session-17", treatment_id: "treatment-1", linked_group_id: "group-2", units: [],
    terminal_nemar_response: "yes" as const, success_declared: true, finished_at: "now",
    integrating_reason: null,
  };
}

function setup(overrides: Partial<CompletionPresentationDependencies> = {}) {
  const session = confirmedSession();
  const onReturnToQuestionnaire = vi.fn(() => true);
  const onChooseCatalog = vi.fn(() => true);
  const deps: CompletionPresentationDependencies = {
    captureAccess: () => () => {},
    currentScope: () => ({ owner: "owner-1", generation: 3, providerKey: "account" }),
    getSession: async (id) => id === session.id ? session : null,
    getCurrentGroupId: () => "group-2",
    onReturnToQuestionnaire,
    onChooseCatalog,
    storage: sessionStorage,
    ...overrides,
  };
  return { controller: createCompletionPresentation(deps), deps, session, onReturnToQuestionnaire, onChooseCatalog };
}

it("keeps completion hidden unless the exact public session confirms success", async () => {
  const f = setup({ getSession: async () => ({ ...confirmedSession(), success_declared: false }) });
  await f.controller.showConfirmed("session-17");
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("requires the captured owner, provider and generation to remain current during recovery", async () => {
  let generation = 3;
  const f = setup({
    currentScope: () => ({ owner: "owner-1", generation, providerKey: "account" }),
    getSession: async (id) => { generation = 4; return id === "session-17" ? confirmedSession() : null; },
  });
  await f.controller.showConfirmed("session-17");
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("hides retained success immediately when the verified owner changes", async () => {
  let owner: string | null = "owner-1";
  let notifyScopeChanged = () => {};
  const f = setup({
    currentScope: () => ({ owner, generation: 3, providerKey: "account" }),
    subscribeToScope: (listener) => { notifyScopeChanged = listener; return () => {}; },
  });
  await f.controller.showConfirmed("session-17");
  expect(f.controller.getSnapshot().visible).toBe(true);
  owner = "owner-2";
  notifyScopeChanged();
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("retains an explicit catalog choice across a verified reload and never repeats the choice", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  await f.controller.chooseAnotherTreatment();
  expect(f.onChooseCatalog).toHaveBeenCalledOnce();

  const reloaded = createCompletionPresentation(f.deps);
  await reloaded.showConfirmed("session-17");
  expect(reloaded.getSnapshot()).toMatchObject({ visible: false, choice: "catalog" });
  expect(f.onChooseCatalog).toHaveBeenCalledOnce();
});

it("offers questionnaire return and the shared catalog as separate explicit choices", async () => {
  const f = setup();
  localStorage.setItem("pic-web.locale.v1", "en");
  await f.controller.showConfirmed("session-17");
  render(<AppProviders><CompletionReturnScreen presentation={f.controller} /></AppProviders>);
  expect(screen.getByRole("heading", { name: "Treatment finished" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Return to questionnaire summary" }));
  await waitFor(() => expect(f.onReturnToQuestionnaire).toHaveBeenCalledWith("group-2"));
  expect(f.onChooseCatalog).not.toHaveBeenCalled();
});


it("keeps a pending completion pointer across reload but waits for public confirmation", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  const readSession = vi.fn(f.deps.getSession);
  const reloaded = createCompletionPresentation({ ...f.deps, getSession: readSession });
  expect(reloaded.getRecoverySessionId()).toBe("session-17");
  expect(reloaded.getSnapshot().visible).toBe(false);
  expect(readSession).not.toHaveBeenCalled();
  expect(await reloaded.recoverConfirmed()).toBe(true);
  expect(reloaded.getSnapshot().visible).toBe(true);
  expect(readSession).toHaveBeenCalledExactlyOnceWith("session-17");
  expect(f.onChooseCatalog).not.toHaveBeenCalled();
  expect(f.onReturnToQuestionnaire).not.toHaveBeenCalled();
});

it("retains completion when navigation needs confirmation and permits an explicit retry", async () => {
  const navigate = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  const f = setup({ onReturnToQuestionnaire: navigate });
  await f.controller.showConfirmed("session-17");
  expect(await f.controller.returnToQuestionnaire()).toBe(false);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: true, choice: null, busy: false });
  const reloaded = createCompletionPresentation(f.deps);
  await reloaded.recoverConfirmed();
  expect(reloaded.getSnapshot().visible).toBe(true);
  expect(await f.controller.returnToQuestionnaire()).toBe(true);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: "questionnaire" });
  expect(navigate).toHaveBeenCalledTimes(2);
});

it("retains completion after navigation throws so another explicit choice can succeed", async () => {
  const navigate = vi.fn().mockRejectedValueOnce(new Error("navigation unavailable")).mockResolvedValueOnce(true);
  const f = setup({ onChooseCatalog: navigate });
  await f.controller.showConfirmed("session-17");
  expect(await f.controller.chooseAnotherTreatment()).toBe(false);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: true, choice: null, busy: false });
  expect(await f.controller.chooseAnotherTreatment()).toBe(true);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: "catalog" });
});

it("serializes competing choices until navigation acknowledges its result", async () => {
  let acknowledge: (accepted: boolean) => void = () => {};
  const navigate = vi.fn(() => new Promise<boolean>((resolve) => { acknowledge = resolve; }));
  const f = setup({ onChooseCatalog: navigate });
  await f.controller.showConfirmed("session-17");
  const first = f.controller.chooseAnotherTreatment();
  expect(f.controller.getSnapshot().busy).toBe(true);
  expect(await f.controller.returnToQuestionnaire()).toBe(false);
  await waitFor(() => expect(navigate).toHaveBeenCalledOnce());
  expect(f.controller.getSnapshot()).toMatchObject({ visible: true, choice: null });
  acknowledge(true);
  expect(await first).toBe(true);
  expect(f.onReturnToQuestionnaire).not.toHaveBeenCalled();
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: "catalog", busy: false });
});

it("does not publish an old choice after an explicit reset changes the inquiry", async () => {
  let generation = 3;
  let notifyScopeChanged = () => {};
  let acknowledge: (accepted: boolean) => void = () => {};
  const navigate = vi.fn(() => new Promise<boolean>((resolve) => { acknowledge = resolve; }));
  const f = setup({
    currentScope: () => ({ owner: "owner-1", generation, providerKey: "account" }),
    subscribeToScope: (listener) => { notifyScopeChanged = listener; return () => {}; },
    onChooseCatalog: navigate,
  });
  await f.controller.showConfirmed("session-17");
  const pending = f.controller.chooseAnotherTreatment();
  await waitFor(() => expect(navigate).toHaveBeenCalledOnce());
  generation = 4;
  notifyScopeChanged();
  f.controller.invalidate();
  acknowledge(true);
  expect(await pending).toBe(false);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: null });
  expect(f.controller.getRecoverySessionId()).toBe(null);
  expect(await f.controller.chooseAnotherTreatment()).toBe(false);
  expect(navigate).toHaveBeenCalledOnce();
});

it("hides immediately when captured access becomes uncertain and preserves same-owner recovery", async () => {
  let allowed = true;
  const f = setup({ captureAccess: () => () => { if (!allowed) throw new Error("uncertain identity"); } });
  await f.controller.showConfirmed("session-17");
  allowed = false;
  expect(f.controller.getSnapshot().visible).toBe(false);
  expect(f.controller.getRecoverySessionId()).toBe(null);
  expect(await f.controller.chooseAnotherTreatment()).toBe(false);
  allowed = true;
  expect(f.controller.getSnapshot().visible).toBe(false);
  expect(f.controller.getRecoverySessionId()).toBe("session-17");
  expect(await f.controller.recoverConfirmed()).toBe(true);
  expect(f.controller.getSnapshot().visible).toBe(true);
});

it.each([
  "broken-json", "null", JSON.stringify({ version: 1 }),
  JSON.stringify({ version: 2, owner: "owner-1", providerKey: "account", generation: 3,
    sessionId: "session-17", choice: "unexpected" }),
])("ignores malformed or unsupported recovery envelopes: %s", async (raw) => {
  sessionStorage.setItem("pic-web.completion.v2", raw);
  const f = setup();
  expect(f.controller.getRecoverySessionId()).toBe(null);
  expect(await f.controller.recoverConfirmed()).toBe(false);
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("does not treat a retained pointer as successful when the public session is Integrating", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  const reloaded = createCompletionPresentation({ ...f.deps,
    getSession: async () => ({ ...confirmedSession(), success_declared: false, integrating_reason: "terminal_nemar_no" }),
  });
  expect(await reloaded.recoverConfirmed()).toBe(false);
  expect(reloaded.getSnapshot().visible).toBe(false);
  expect(f.onChooseCatalog).not.toHaveBeenCalled();
});

it("rejects a successful session with a different ID and leaves no completion pointer", async () => {
  const f = setup({ getSession: async () => ({ ...confirmedSession(), id: "different-session" }) });
  expect(await f.controller.showConfirmed("session-17")).toBe(false);
  expect(f.controller.getSnapshot().visible).toBe(false);
  expect(f.controller.getRecoverySessionId()).toBe(null);
});

it("keeps one bounded recovery envelope as later completed sessions replace the earlier pointer", async () => {
  const f = setup({ getSession: async (id) => ({ ...confirmedSession(), id }) });
  await f.controller.showConfirmed("session-17");
  await f.controller.chooseAnotherTreatment();
  await f.controller.showConfirmed("session-18");
  expect(sessionStorage.length).toBe(1);
  expect(f.controller.getRecoverySessionId()).toBe("session-18");
  expect(f.controller.getSnapshot()).toMatchObject({ visible: true, choice: null });
});

it("retains an acknowledged choice on exact re-entry when browser storage is unavailable", async () => {
  const f = setup({ storage: {
    getItem: () => { throw new Error("storage unavailable"); },
    setItem: () => { throw new Error("storage unavailable"); },
  } });
  await f.controller.showConfirmed("session-17");
  expect(await f.controller.chooseAnotherTreatment()).toBe(true);
  await f.controller.showConfirmed("session-17");
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: "catalog" });
  expect(f.onChooseCatalog).toHaveBeenCalledOnce();
});

it("does not let an older verification overwrite the latest completed session", async () => {
  let release: (value: ReturnType<typeof confirmedSession>) => void = () => {};
  const f = setup({ getSession: (id) => id === "session-17" ?
    new Promise((resolve) => { release = resolve; }) : Promise.resolve({ ...confirmedSession(), id }),
  });
  const older = f.controller.showConfirmed("session-17");
  expect(await f.controller.showConfirmed("session-18")).toBe(true);
  release(confirmedSession());
  expect(await older).toBe(false);
  expect(f.controller.getRecoverySessionId()).toBe("session-18");
});

it("keeps the published snapshot stable until observable presentation state changes", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  const published = f.controller.getSnapshot();
  expect(f.controller.getSnapshot()).toBe(published);
  expect(Object.isFrozen(published)).toBe(true);
  await f.controller.chooseAnotherTreatment();
  expect(f.controller.getSnapshot()).not.toBe(published);
  expect(published).toMatchObject({ visible: true, choice: null, busy: false });
});



it("exposes bounded boot metadata without granting visible completion or running navigation", async () => {
  const f = setup();
  expect(await f.controller.stageConfirmedRecovery("session-17")).toBe(true);
  const metadata = readCompletionRecovery();
  expect(metadata).toEqual({ version: 2, owner: "owner-1", generation: 3, providerKey: "account",
    sessionId: "session-17", choice: null });
  expect(Object.isFrozen(metadata)).toBe(true);
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: null, busy: false });
  const reloaded = createCompletionPresentation(f.deps);
  expect(reloaded.getSnapshot().visible).toBe(false);
  expect(f.onChooseCatalog).not.toHaveBeenCalled();
  expect(f.onReturnToQuestionnaire).not.toHaveBeenCalled();
  expect(await reloaded.showConfirmed("session-17")).toBe(true);
  expect(reloaded.getSnapshot().visible).toBe(true);
});

it.each([
  { generation: -1 }, { generation: 0.5 }, { generation: Number.MAX_SAFE_INTEGER + 1 },
  { owner: "" }, { owner: "x".repeat(257) }, { owner: null },
  { providerKey: "another-provider" }, { providerKey: "guest" },
  { sessionId: "" }, { sessionId: "x".repeat(257) }, { version: "2" },
])("rejects unsafe completion boot metadata: %j", (patch) => {
  sessionStorage.setItem("pic-web.completion.v2", JSON.stringify({ version: 2, owner: "owner-1", generation: 3,
    providerKey: "account", sessionId: "session-17", choice: null, ...patch }));
  expect(readCompletionRecovery()).toBe(null);
});

it("rejects an oversized envelope before treating it as a recovery candidate", () => {
  sessionStorage.setItem("pic-web.completion.v2", JSON.stringify({ version: 2, owner: "owner-1", generation: 3,
    providerKey: "account", sessionId: "session-17", choice: null, unknown: "x".repeat(4096) }));
  expect(readCompletionRecovery()).toBe(null);
});

it("stages no recovery hint while the public session is Integrating", async () => {
  const f = setup({ getSession: async () => ({ ...confirmedSession(), success_declared: false }) });
  expect(await f.controller.stageConfirmedRecovery("session-17")).toBe(false);
  expect(readCompletionRecovery()).toBe(null);
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("stages no recovery hint when access changes during the public confirmation read", async () => {
  let generation = 3;
  const f = setup({
    currentScope: () => ({ owner: "owner-1", generation, providerKey: "account" }),
    getSession: async () => { generation = 4; return confirmedSession(); },
  });
  expect(await f.controller.stageConfirmedRecovery("session-17")).toBe(false);
  expect(readCompletionRecovery()).toBe(null);
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("reports an unavailable durable hint so cleanup can retain its existing recovery", async () => {
  const f = setup({ storage: {
    getItem: () => null,
    setItem: () => { throw new Error("storage unavailable"); },
  } });
  expect(await f.controller.stageConfirmedRecovery("session-17")).toBe(false);
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("does not replace the latest completion with a staging read invalidated by reset", async () => {
  let release: (value: ReturnType<typeof confirmedSession>) => void = () => {};
  const f = setup({ getSession: () => new Promise((resolve) => { release = resolve; }) });
  const pending = f.controller.stageConfirmedRecovery("session-17");
  f.controller.invalidate();
  release(confirmedSession());
  expect(await pending).toBe(false);
  expect(readCompletionRecovery()).toBe(null);
  expect(f.controller.getSnapshot().visible).toBe(false);
});

it("preserves an acknowledged catalog choice when the same successful session is staged again", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  await f.controller.chooseAnotherTreatment();
  expect(await f.controller.stageConfirmedRecovery("session-17")).toBe(true);
  expect(f.controller.getSnapshot().visible).toBe(false);
  await f.controller.showConfirmed("session-17");
  expect(f.controller.getSnapshot()).toMatchObject({ visible: false, choice: "catalog" });
  expect(f.onChooseCatalog).toHaveBeenCalledOnce();
});

it("re-offers confirmed completion when a questionnaire return cannot restore a current group", async () => {
  const f = setup();
  await f.controller.showConfirmed("session-17");
  await f.controller.returnToQuestionnaire();
  const reloaded = createCompletionPresentation({ ...f.deps, getCurrentGroupId: () => null });
  await reloaded.recoverConfirmed();
  expect(reloaded.getSnapshot()).toMatchObject({ visible: true, choice: null, hasCurrentGroup: false });
  expect(f.onReturnToQuestionnaire).toHaveBeenCalledOnce();
  expect(f.onChooseCatalog).not.toHaveBeenCalled();
});
