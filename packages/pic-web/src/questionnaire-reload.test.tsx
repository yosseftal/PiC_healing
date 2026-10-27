// @vitest-environment jsdom
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllEnvs(); localStorage.clear(); sessionStorage.clear(); });
async function boot() {
  localStorage.setItem("pic-web.locale.v1", "en");
  const root = (await import("./composition-root")).compositionRoot;
  const { App } = await import("./App");
  const view = render(createElement(App));
  const start = screen.queryByTestId("welcome-start");
  if (start) fireEvent.click(start);
  await waitFor(() => expect(screen.queryByTestId("welcome-screen")).toBeNull());
  return { root, view };
}
for (const location of ["group-summary", "pick-treatment"] as const) {
  it(`rejects an editable retained ${location} target before the actual joint answer`, async () => {
    vi.resetModules();
    const first = await boot();
    fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Actual unanswered topic" } });
    fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "4" } });
    fireEvent.click(screen.getByTestId("finish-symptom-addition"));
    await screen.findByRole("button", { name: "No" });
    const id = first.root.groupEngineStore.getSnapshot().activeGroupId!;
    const before = (await first.root.groupEngineActions.getGroup(id))!;
    first.view.unmount();
    sessionStorage.setItem("pic-web.questionnaire.v1", JSON.stringify({
      schemaVersion: 1, generation: 0, owner: null, groupId: id,
      fields: { title: "retained", rows: before.symptoms, attempted: false, revising: false },
      location, returnLocation: "create-group", focus: null, advisory: false,
      advisoryDismissed: false, returnAdvisory: false,
    }));
    vi.resetModules();
    const second = await boot();
    expect(second.root.questionnaireNavigation.store.getSnapshot().location).toBeNull();
    await screen.findByRole("button", { name: "No" });
    expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
    expect(screen.queryByTestId("guest-flow-pick-treatment")).toBeNull();
    expect(await second.root.groupEngineActions.getGroup(id)).toEqual(before);
  }, 15_000);
}

it("rejects a retained membership revision without a group", async () => {
  vi.resetModules();
  sessionStorage.setItem("pic-web.questionnaire.v1", JSON.stringify({
    schemaVersion: 1, generation: 0, owner: null, groupId: null,
    fields: { title: "Impossible revision", rows: [{ id: "row", name: "Orphan", polarity: "negative", intensity: 3 }],
      attempted: false, revising: true },
    location: "create-group", returnLocation: "create-group", focus: null,
    advisory: false, advisoryDismissed: false, returnAdvisory: false,
  }));
  const { root } = await boot();
  expect(screen.queryByTestId("questionnaire-readonly-recovery")).toBeNull();
  expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "");
  expect(root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});
it("restores unsubmitted Guest fields after reload without creating a group", async () => {
  vi.resetModules();
  const first = await boot();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Pending before reload" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "7" } });
  first.view.unmount(); vi.resetModules();
  const second = await boot();
  expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "Pending before reload");
  expect(screen.getByLabelText("Interference / suffering intensity")).toHaveProperty("value", "7");
  expect(second.root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it("keeps saved Guest records on their existing recovery path", async () => {
  vi.resetModules();
  const first = await boot();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Saved Guest topic" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "4" } });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await screen.findByTestId("split-advisory");
  const id = first.root.groupEngineStore.getSnapshot().activeGroupId!;
  const before = await first.root.groupEngineActions.getGroup(id);
  first.view.unmount(); vi.resetModules();
  const second = await boot();
  await screen.findByTestId("split-advisory");
  expect(screen.queryByTestId("questionnaire-readonly-recovery")).toBeNull();
  expect(await second.root.groupEngineActions.getGroup(id)).toEqual(before);
});

for (const invalid of ['{"schemaVersion":99}', '{"schemaVersion":1,"fields":{"rows":[]}}', '{bad json']) {
  it(`ignores malformed or unsupported retained fields: ${invalid}`, async () => {
    vi.resetModules(); sessionStorage.setItem("pic-web.questionnaire.v1", invalid);
    const { root } = await boot();
    expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "");
    expect(root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  });
}

it("reveals account recovery only to verified A and removes its text immediately when authority suspends", async () => {
  vi.resetModules();
  vi.stubEnv("VITE_SUPABASE_URL", "https://identity.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "public-fixture");
  const path = await import("./promote-path");
  const client = createClient("https://identity.invalid", "public-fixture", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const user = { id: "owner-a", email: "a@example.com", email_confirmed_at: "2026-10-26",
    app_metadata: {}, user_metadata: {}, aud: "authenticated", created_at: "2026-10-26" };
  const verify = vi.spyOn(client.auth, "getUser").mockResolvedValue({ data: { user }, error: null });
  vi.spyOn(client.auth, "onAuthStateChange").mockReturnValue({
    data: { subscription: { id: "fixture", callback: () => undefined, unsubscribe: () => undefined } },
  });
  vi.spyOn(path, "createSupabaseBrowserClient").mockReturnValue(client);
  sessionStorage.setItem("pic-web.questionnaire.v1", JSON.stringify({
    schemaVersion: 1, generation: 0, owner: "owner-a", groupId: null,
    fields: { title: "Private A title", rows: [{ id: "row-a", name: "Private A topic", polarity: "negative", intensity: 7 }],
      revising: false, attempted: false },
    location: "create-group", returnLocation: "create-group", focus: null, advisory: false, advisoryDismissed: false,
    returnAdvisory: false,
  }));
  const { root } = await boot();
  expect(screen.queryByText("Private A topic")).toBeNull();
  await act(async () => { await root.authLifecycle.verify(); });
  await screen.findByText("Private A topic");
  expect(screen.queryByTestId("finish-symptom-addition")).toBeNull();
  act(() => root.authLifecycle.suspend("checking"));
  expect(screen.queryByText("Private A topic")).toBeNull();
  expect(screen.queryByText("Private A title")).toBeNull();
  verify.mockResolvedValueOnce({ data: { user: { ...user, id: "owner-b" } }, error: null });
  await act(async () => { await expect(root.authLifecycle.verify()).rejects.toThrow("same identity"); });
  expect(screen.queryByText("Private A topic")).toBeNull();
  await act(async () => { await root.authLifecycle.verify(); });
  await screen.findByText("Private A topic");
  expect(root.questionnaire.store.getSnapshot().readOnly).toBe(true);
});

it("shows an uncertain Guest submission read-only after reload and never reconstructs its create request", async () => {
  vi.resetModules();
  const first = await boot();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Uncertain saved topic" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "7" } });
  const provider = first.root.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => {
    await save(group); throw new Error("Response lost");
  });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await screen.findByText("Open utilities to try again.");
  first.view.unmount(); vi.restoreAllMocks(); vi.resetModules();
  const second = await boot();
  await screen.findByTestId("questionnaire-readonly-recovery");
  expect(screen.getByText("Uncertain saved topic")).toBeDefined();
  expect(screen.queryByTestId("finish-symptom-addition")).toBeNull();
  expect(second.root.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  await act(async () => {
    expect(await second.root.questionnaire.actionsFor(0).finish()).toBe(false);
  });
});

it("retains input and refuses a write when an older editable envelope cannot be replaced or invalidated", async () => {
  vi.resetModules();
  const { root } = await boot();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Keep before storage failure" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "5" } });
  const set = Storage.prototype.setItem;
  const remove = Storage.prototype.removeItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (this === sessionStorage) throw new Error("Storage blocked");
    return set.call(this, key, value);
  });
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
    if (this === sessionStorage) throw new Error("Invalidation blocked");
    return remove.call(this, key);
  });
  const write = vi.spyOn(root.repositoryPort.getProvider(), "saveGroup");
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await screen.findByText("Open utilities to try again.");
  expect(write).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "Keep before storage failure");
  vi.restoreAllMocks();
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await screen.findByRole("button", { name: "Yes" });
});
