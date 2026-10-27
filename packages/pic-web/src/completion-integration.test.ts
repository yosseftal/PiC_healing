// @vitest-environment jsdom
import { createClient } from "@supabase/supabase-js";
import { createElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_GUEST_STORAGE_KEY, LocalGuestRepository } from "pic-adapter-local-guest";
import type { PlayerSession, PromoteGuestToAccountInput, SymptomGroup } from "pic-engine";

const owner = "b36c1b94-e060-42ac-8098-37eb769ec5f8";
const credentials = { email: "completion@example.com", password: "fixture password" };

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); sessionStorage.clear(); });

async function identityBoundary() {
  vi.stubEnv("VITE_SUPABASE_URL", "https://completion.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "fixture-public");
  const path = await import("./promote-path");
  const user = { id: owner, email: credentials.email, email_confirmed_at: "2026-10-27",
    app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-10-27" };
  const transport = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([{ id: owner }]), { status: 200 }));
  const client = createClient("https://completion.invalid", "fixture-public", {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: transport },
  });
  const verify = vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  vi.spyOn(client.auth, "signInWithPassword").mockResolvedValue({ data: { user, session: {
    user, access_token: "fixture-access", refresh_token: "fixture-refresh", expires_in: 3600, token_type: "bearer",
  } }, error: null });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  return { path, client, user, verify, transport };
}

async function setupPromotion(linked = false, retainQuestionnaire = false) {
  vi.resetModules();
  localStorage.clear(); sessionStorage.clear();
  const identity = await identityBoundary();
  const port = identity.path.createSupabaseRepositoryFromClient(identity.client);
  const rows = new Map<string, PlayerSession>();
  const groups = new Map<string, SymptomGroup>();
  const committed = new Set<string>();
  let executions = 0;
  const promote = vi.spyOn(port, "promoteGuestToAccount").mockImplementation(async (input: PromoteGuestToAccountInput) => {
    if (!committed.has(input.idempotencyKey)) {
      committed.add(input.idempotencyKey); executions++;
      rows.set(input.playerSession.id, structuredClone(input.playerSession));
      if (input.group !== null) groups.set(input.group.id, structuredClone(input.group));
    }
    return { group: input.group, playerSession: rows.get(input.playerSession.id)!, libraryRow: {
      id: "library-1", treatment_id: input.playerSession.treatment_id, use_count: 1,
      provenance: { source: "guest_promotion", first_seen_at: "2026-10-27" }, variant_type: "original",
      global_reference_id: input.playerSession.treatment_id, protocol_content: null, created_at: "2026-10-27",
    }, timelineEvent: {
      id: input.playerSession.id, log_type: "treatment_execution", treatment_id: input.playerSession.treatment_id,
      library_row_id: "library-1", linked_group_id: input.playerSession.linked_group_id,
      metadata: null, created_at: "2026-10-27",
    } };
  });
  const read = vi.spyOn(port, "getPlayerSession").mockImplementation(async (id) => rows.get(id) ?? null);
  const readGroup = vi.spyOn(port, "getGroup").mockImplementation(async (id) => groups.get(id) ?? null);
  const save = vi.spyOn(port, "savePlayerSession").mockImplementation(async (session) => { rows.set(session.id, session); });
  const increment = vi.spyOn(port, "incrementUseCount");
  const timeline = vi.spyOn(port, "appendTimelineEvent");
  vi.spyOn(identity.path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  const root = (await import("./composition-root")).compositionRoot;
  const guestClass = (await import("pic-adapter-local-guest")).LocalGuestRepository;
  const guestRepository = root.repositoryPort.getProvider();
  if (!(guestRepository instanceof guestClass)) throw new Error("Expected the active Guest repository");
  const facts = await import("./guest-flow-facts");
  let groupId: string | null = null;
  if (linked || retainQuestionnaire) {
    groupId = await root.groupEngineActions.createDraftGroup("My questionnaire");
    const symptomId = await root.groupEngineActions.addSymptom(groupId, "My topic");
    await root.groupEngineActions.rate(symptomId, { polarity: "negative", intensity: 5 });
    await root.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
    await root.groupEngineActions.finalizeGroup(groupId);
    facts.setGuestFlowSymptomAdditionComplete(true);
    facts.setGuestFlowSummaryAcknowledged(true);
  }
  const sessionId = await root.playerEngineActions.startSession("source-1", linked ? groupId : null, ["a"]);
  await root.sessionEngineActions.onFinishRequested(sessionId, "finishAnyway");
  return { ...identity, root, facts, port, rows, promote, read, save, increment, timeline, sessionId,
    groupId, guestRepository, readGroup, executions: () => executions };
}

it("publishes promotion completion only after delayed Guest cleanup and keeps the Player until then", async () => {
  const f = await setupPromotion();
  let release: () => void = () => {};
  const originalClear = f.guestRepository.clear;
  const clear = vi.spyOn(f.guestRepository, "clear").mockImplementation(async function (this: LocalGuestRepository) {
    await new Promise<void>((resolve) => { release = resolve; });
    await originalClear.call(this);
  });
  const saving = f.root.promotePathActions.signInAndPromote(credentials);
  await vi.waitFor(() => expect(clear).toHaveBeenCalledOnce());
  expect(f.rows.get(f.sessionId)?.success_declared).toBe(true);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("pending");
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(f.sessionId);
  expect(JSON.parse(sessionStorage.getItem("pic-web.completion.v2")!).sessionId).toBe(f.sessionId);
  release();
  await saving;
  expect(f.root.completionPresentation.getSnapshot()).toMatchObject({ visible: true, hasCurrentGroup: false });
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("idle");
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(null);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBe(null);
  expect(f.executions()).toBe(1);
});

it("withholds success on cleanup failure and retries the exact promotion receipt", async () => {
  const f = await setupPromotion();
  const clear = vi.spyOn(f.guestRepository, "clear").mockRejectedValueOnce(new Error("cleanup unavailable"));
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("cleanup unavailable");
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("recovery");
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(f.sessionId);
  clear.mockRestore();
  await f.root.promotePathActions.signInAndPromote();
  expect(f.promote.mock.calls[1]![0]).toEqual(f.promote.mock.calls[0]![0]);
  expect(f.executions()).toBe(1);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(true);
});

it("opens another catalog only by explicit choice without repeating Finish or creating execution writes", async () => {
  const f = await setupPromotion();
  await f.root.promotePathActions.signInAndPromote(credentials);
  const before = { saves: f.save.mock.calls.length, promotions: f.promote.mock.calls.length };
  expect(f.root.questionnaireNavigation.store.getSnapshot().location).toBe(null);
  expect(await f.root.completionPresentation.chooseAnotherTreatment()).toBe(true);
  expect(f.root.questionnaireNavigation.store.getSnapshot().location).toBe("pick-treatment");
  expect(f.save.mock.calls.length).toBe(before.saves);
  expect(f.promote.mock.calls.length).toBe(before.promotions);
  expect(f.increment).not.toHaveBeenCalled();
  expect(f.timeline).not.toHaveBeenCalled();
  expect(f.executions()).toBe(1);
});

async function bootReceipt(options: {
  verifiedOwner?: string; focusOwner?: string; success?: boolean; choice?: "questionnaire" | "catalog";
} = {}) {
  vi.resetModules();
  localStorage.clear(); sessionStorage.clear();
  localStorage.setItem("pic-web.authenticated-focus.v1", options.focusOwner ?? owner);
  sessionStorage.setItem("pic-web.completion.v2", JSON.stringify({ version: 2, owner, generation: 7,
    providerKey: "account", sessionId: "completed-session", choice: options.choice ?? null }));
  const identity = await identityBoundary();
  if (options.verifiedOwner) identity.verify.mockResolvedValue({
    data: { user: { ...identity.user, id: options.verifiedOwner } }, error: null,
  });
  const port = identity.path.createSupabaseRepositoryFromClient(identity.client);
  const session: PlayerSession = { id: "completed-session", treatment_id: "source-1", linked_group_id: null,
    units: [], terminal_nemar_response: "yes", success_declared: options.success ?? true,
    finished_at: "2026-10-27", integrating_reason: null };
  const read = vi.spyOn(port, "getPlayerSession").mockResolvedValue(session);
  vi.spyOn(identity.path, "createSupabaseRepositoryFromClient").mockReturnValue(port);
  const root = (await import("./composition-root")).compositionRoot;
  const provider = root.repositoryPort.getProvider();
  return { ...identity, root, provider, read, port };
}

it("verifies an account reload through a separate read-only repository without hydrating the engine", async () => {
  const f = await bootReceipt();
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.read).not.toHaveBeenCalled();
  await f.root.authLifecycle.verify();
  await vi.waitFor(() => expect(f.root.completionPresentation.getSnapshot().visible).toBe(true));
  expect(f.read).toHaveBeenCalledWith("completed-session");
  expect(f.root.repositoryPort.getProvider()).toBe(f.provider);
  expect(f.root.repositoryPort.getProvider()).not.toBe(f.port);
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(null);
  expect(f.root.completionPresentation.getSnapshot().hasCurrentGroup).toBe(false);
  expect(f.transport.mock.calls.every(([, init]) => init?.method === undefined || init.method === "GET")).toBe(true);
});

it("never reads another account's completion even when a retained receipt exists", async () => {
  const f = await bootReceipt({ verifiedOwner: "other-owner" });
  await expect(f.root.authLifecycle.verify()).rejects.toThrow("same identity");
  await f.root.retryCompletionRecovery();
  expect(f.read).not.toHaveBeenCalled();
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("recovery");
});

it("rejects a stale receipt when the retained focus belongs to a newer identity", async () => {
  const f = await bootReceipt({ focusOwner: "new-owner" });
  await f.root.authLifecycle.verify();
  await f.root.retryCompletionRecovery();
  expect(f.read).not.toHaveBeenCalled();
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("idle");
});

it("keeps a reloaded Integrating public session on recovery without announcing success", async () => {
  const f = await bootReceipt({ success: false });
  await f.root.authLifecycle.verify();
  await vi.waitFor(() => expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("recovery"));
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.repositoryPort.getProvider()).toBe(f.provider);
});


it("returns to the current questionnaire summary without changing the chosen treatment link", async () => {
  const f = await setupPromotion(true);
  await f.root.promotePathActions.signInAndPromote(credentials);
  const previous = structuredClone(f.rows.get(f.sessionId));
  const saves = f.save.mock.calls.length;
  expect(f.root.completionPresentation.getSnapshot().hasCurrentGroup).toBe(true);
  expect(await f.root.completionPresentation.returnToQuestionnaire()).toBe(true);
  expect(f.root.questionnaireNavigation.store.getSnapshot().location).toBe("group-summary");
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(f.groupId);
  expect(f.rows.get(f.sessionId)).toEqual(previous);
  expect(f.save.mock.calls.length).toBe(saves);
  expect(f.increment).not.toHaveBeenCalled();
  expect(f.timeline).not.toHaveBeenCalled();
});

it.each(["finish", "finishAnyway"] as const)("presents authenticated %s without extra execution on return", async (kind) => {
  const f = await setupPromotion();
  await f.root.promotePathActions.signInAndPromote(credentials);
  const row = { id: "new-library", treatment_id: "source-1", use_count: 1,
    provenance: { source: "guest_promotion", first_seen_at: "2026-10-27" }, variant_type: "original" as const,
    global_reference_id: "source-1", protocol_content: null, created_at: "2026-10-27" };
  vi.spyOn(f.port, "getOrCreateLibraryRow").mockResolvedValue(row);
  f.increment.mockResolvedValue({ ...row, use_count: 2 });
  f.timeline.mockImplementation(async (event) => ({ ...event, id: "new-execution", created_at: "2026-10-27" }));
  const sessionId = await f.root.playerEngineActions.startSession("source-1", null, ["a"]);
  await f.root.playerEngineActions.respondTerminalNemar(sessionId, kind === "finish" ? "yes" : "no");
  await f.root.sessionEngineActions.onFinishRequested(sessionId, kind);
  expect(f.rows.get(sessionId)?.success_declared).toBe(true);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(true);
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(null);
  expect(f.increment).toHaveBeenCalledExactlyOnceWith("new-library", sessionId);
  expect(f.timeline).toHaveBeenCalledOnce();
  await f.root.completionPresentation.chooseAnotherTreatment();
  expect(f.increment).toHaveBeenCalledOnce();
  expect(f.timeline).toHaveBeenCalledOnce();
  expect(f.executions()).toBe(1);
});

it("invalidates the completion receipt only after an actual reset succeeds", async () => {
  const f = await setupPromotion();
  await f.root.promotePathActions.signInAndPromote(credentials);
  const receipt = sessionStorage.getItem("pic-web.completion.v2");
  const clear = vi.spyOn(f.guestRepository, "clear").mockRejectedValueOnce(new Error("reset unavailable"));
  await expect(f.root.inquiryResetActions.resetInquiry(true)).rejects.toThrow("reset unavailable");
  expect(sessionStorage.getItem("pic-web.completion.v2")).toBe(receipt);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(true);
  clear.mockRestore();
  await f.root.inquiryResetActions.resetInquiry(true);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(JSON.parse(sessionStorage.getItem("pic-web.completion.v2")!)).toBe(null);
  expect(f.increment).not.toHaveBeenCalled();
  expect(f.timeline).not.toHaveBeenCalled();
});

it("keeps public port promotion valid while withholding visible success until SDK identity is verified", async () => {
  const f = await setupPromotion();
  const snapshot = (await f.root.promotePathActions.assembleGuestSnapshotForPendingGate())!;
  await f.root.promotePathActions.promoteWithAuthenticatedRepository(f.port, snapshot, owner);
  expect(f.root.sessionEngineStore.getSnapshot().promotionStatus).toBe("succeeded");
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(null);
  expect(localStorage.getItem(DEFAULT_GUEST_STORAGE_KEY)).toBe(null);
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("recovery");
  await f.root.authLifecycle.verify();
  await vi.waitFor(() => expect(f.root.completionPresentation.getSnapshot().visible).toBe(true));
  expect(f.executions()).toBe(1);
});

it("re-offers the reset choice after verified reload of a questionnaire disposition without group hydration", async () => {
  const f = await bootReceipt({ choice: "questionnaire" });
  await f.root.authLifecycle.verify();
  await vi.waitFor(() => expect(f.root.completionPresentation.getSnapshot().visible).toBe(true));
  expect(f.root.completionPresentation.getSnapshot()).toMatchObject({ choice: null, hasCurrentGroup: false });
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(null);
  expect(f.root.repositoryPort.getProvider()).toBe(f.provider);
});

it("drops only the web questionnaire pointer when an unlinked Guest group was not promoted", async () => {
  const f = await setupPromotion(false, true);
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(f.groupId);
  await f.root.promotePathActions.signInAndPromote(credentials);
  expect(f.promote.mock.calls[0]![0].group).toBe(null);
  expect(f.rows.get(f.sessionId)?.linked_group_id).toBe(null);
  expect(f.readGroup).toHaveBeenCalledWith(f.groupId);
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(null);
  expect(f.root.completionPresentation.getSnapshot()).toMatchObject({ visible: true, hasCurrentGroup: false });
  expect(f.executions()).toBe(1);
  expect(f.increment).not.toHaveBeenCalled();
  expect(f.timeline).not.toHaveBeenCalled();
});

it("retains recovery when the current questionnaire cannot be publicly verified", async () => {
  const f = await setupPromotion(true);
  f.readGroup.mockRejectedValueOnce(new Error("questionnaire read unavailable"));
  await expect(f.root.promotePathActions.signInAndPromote(credentials)).rejects.toThrow("questionnaire read unavailable");
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.root.completionRecoveryStore.getSnapshot().status).toBe("recovery");
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(f.groupId);
  expect(f.facts.guestFlowFactsStore.getSnapshot().activePlayerSessionId).toBe(f.sessionId);
  await f.root.retryCompletionRecovery();
  expect(f.root.completionPresentation.getSnapshot()).toMatchObject({ visible: true, hasCurrentGroup: true });
  expect(f.executions()).toBe(1);
});

it("offers reauthentication after an expired account reload and recovers through public reads alone", async () => {
  const f = await bootReceipt();
  localStorage.setItem("pic-web.locale.v1", "en");
  const promote = vi.spyOn(f.port, "promoteGuestToAccount");
  const save = vi.spyOn(f.port, "savePlayerSession");
  const timeline = vi.spyOn(f.port, "appendTimelineEvent");
  const increment = vi.spyOn(f.port, "incrementUseCount");
  const { App } = await import("./App");
  render(createElement(App));
  await screen.findByRole("dialog", { name: "Sign in again" });
  expect(f.root.authStore.getSnapshot()).toMatchObject({ status: "reauthenticate", owner });
  expect(f.root.completionPresentation.getSnapshot().visible).toBe(false);
  expect(f.read).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: credentials.email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: credentials.password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in again" }));
  await waitFor(() => expect(screen.getByTestId("completion-return-screen")).toBeTruthy());
  expect(f.root.repositoryPort.getProvider()).toBe(f.provider);
  expect(f.root.sessionEngineStore.getSnapshot().mode).toBe("guest");
  expect(f.root.groupEngineStore.getSnapshot().activeGroupId).toBe(null);
  expect(f.read).toHaveBeenCalledWith("completed-session");
  expect(promote).not.toHaveBeenCalled();
  expect(save).not.toHaveBeenCalled();
  expect(timeline).not.toHaveBeenCalled();
  expect(increment).not.toHaveBeenCalled();
});
