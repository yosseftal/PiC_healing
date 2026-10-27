// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { App } from "./App";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { useQuestionnaireNavigation } from "./questionnaire-navigation-context";

afterEach(() => {
  cleanup(); vi.restoreAllMocks(); resetGuestFlowFactsForTest(); localStorage.clear(); sessionStorage.clear();
});

it("ignores an old Back handler after confirmed reset", async () => {
  let oldBack!: () => unknown;
  function Capture() {
    const navigation = useQuestionnaireNavigation();
    oldBack = () => navigation.actions.back("create-group");
    return null;
  }
  const captured = render(<Capture />);
  const back = oldBack;
  await compositionRoot.inquiryResetActions.resetInquiry(true);
  captured.unmount(); await mount();
  await act(async () => { expect(await back()).toBe(false); });
  expect(screen.queryByTestId("questionnaire-preparation")).toBeNull();
  expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "");
});

it("retries failed finalization without repeating the successful actual answer", async () => {
  await mount(); completeTopic();
  await screen.findByTestId("muscle-test-yes");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  let writes = 0;
  vi.spyOn(provider, "saveGroup").mockImplementation(async (group) => {
    if (++writes === 2) throw new Error("Retry finalize");
    await save(group);
  });
  fireEvent.click(screen.getByTestId("muscle-test-yes"));
  await screen.findByTestId("retry-membership-revision");
  const answered = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(screen.getByTestId("retry-membership-revision"));
  await screen.findByTestId("confirm-group-summary");
  const finalized = await compositionRoot.groupEngineActions.getGroup(id);
  expect(finalized?.joint_treatment_test_at).toBe(answered?.joint_treatment_test_at);
  expect(finalized?.symptoms).toEqual(answered?.symptoms);
  expect(writes).toBe(3);
});

it("waits for an admitted Yes including its finalize continuation before Back to the retained list", async () => {
  await mount(); completeTopic(); await screen.findByTestId("muscle-test-yes");
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => { await paused; await save(group); });
  fireEvent.click(screen.getByTestId("muscle-test-yes"));
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByText("Waiting for the current action. Your work stays here.");
  expect(screen.queryByTestId("questionnaire-row")).toBeNull();
  await act(async () => { release(); });
  await screen.findByTestId("questionnaire-existing-row");
  expect(screen.queryByText("The action needs recovery. Try again before moving on.")).toBeNull();
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  expect((await compositionRoot.groupEngineActions.getGroup(id))?.joint_treatment_muscle_test).toBe("together");
});
async function mount() {
  localStorage.setItem("pic-web.locale.v1", "en");
  const view = render(<App />);
  if (screen.queryByTestId("welcome-start")) fireEvent.click(screen.getByTestId("welcome-start"));
  await waitFor(() => expect(screen.queryByTestId("welcome-screen")).toBeNull());
  return view;
}
function completeTopic() {
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Neck" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "8" } });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
}
it("returns from preparation to the exact unfinished input without creating or discarding work", async () => {
  await mount();
  fireEvent.change(screen.getByLabelText("List name (optional)"), { target: { value: "My list" } });
  const input = screen.getByLabelText("Symptom name");
  fireEvent.change(input, { target: { value: "Unsubmitted neck" } });
  input.focus();
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("questionnaire-preparation");
  fireEvent.click(screen.getByRole("button", { name: "Return to questionnaire" }));
  await waitFor(() => expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "Unsubmitted neck"));
  expect(screen.getByLabelText("List name (optional)")).toHaveProperty("value", "My list");
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Symptom name")));
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it("revisits advisory, joint, summary and selection without rewriting an unchanged answered group", async () => {
  const view = await mount(); completeTopic();
  fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await screen.findByTestId("split-advisory");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const answered = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("muscle-test-yes");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(answered);
  fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
  await screen.findByTestId("split-advisory");
  view.unmount(); await mount();
  await screen.findByTestId("split-advisory");
  fireEvent.click(screen.getByTestId("finalize-anyway"));
  await screen.findByTestId("confirm-group-summary");
  const finalized = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(screen.getByTestId("confirm-group-summary"));
  await screen.findByTestId("guest-flow-pick-treatment");
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("confirm-group-summary");
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("muscle-test-yes");
  fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
  await screen.findByTestId("split-advisory");
  fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
  await screen.findByTestId("confirm-group-summary");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(finalized);
});

it("retains a failed summary priority intent across screen remounts", async () => {
  const view = await mount();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "First" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "3" } });
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  const second = within(screen.getAllByTestId("questionnaire-row")[1]!);
  fireEvent.change(second.getByLabelText("Symptom name"), { target: { value: "Second" } });
  fireEvent.change(second.getByLabelText("Interference / suffering intensity"), { target: { value: "4" } });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  vi.spyOn(compositionRoot.repositoryPort.getProvider(), "reorderSymptoms").mockRejectedValueOnce(new Error("Offline"));
  fireEvent.click(screen.getAllByRole("button", { name: "Move topic up" })[1]!);
  await screen.findByRole("button", { name: "Try this priority change again" });
  view.unmount(); await mount();
  await screen.findByRole("button", { name: "Try this priority change again" });
});

it("retries a lost actual No response with the same aggregate, timestamp and revision", async () => {
  await mount(); completeTopic(); await screen.findByTestId("muscle-test-no");
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  const writes = vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => {
    await save(group); throw new Error("Response lost");
  });
  fireEvent.click(screen.getByTestId("muscle-test-no"));
  await screen.findByTestId("retry-membership-revision");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const committed = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(screen.getByTestId("retry-membership-revision"));
  await screen.findByTestId("split-advisory");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(committed);
  expect(writes.mock.calls[1]?.[0]).toEqual(writes.mock.calls[0]?.[0]);
});

it("returns from preparation to the dismissed advisory and exact invoking control", async () => {
  await mount(); completeTopic(); fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await screen.findByRole("button", { name: "Dismiss" });
  fireEvent.click(screen.getByTestId("dismiss-split-advisory"));
  screen.getByTestId("finalize-anyway").focus();
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(screen.getByRole("button", { name: "Questionnaire preparation" }));
  await screen.findByTestId("questionnaire-preparation");
  fireEvent.click(await screen.findByRole("button", { name: "Return to questionnaire" }));
  await screen.findByRole("button", { name: "Finalize anyway" });
  expect(screen.queryByTestId("split-advisory")).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("finalize-anyway")));
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByRole("button", { name: "Continue" });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
  await screen.findByRole("button", { name: "Finalize anyway" });
  expect(screen.queryByTestId("split-advisory")).toBeNull();
});

it("retains an added topic revision and its score when backing out of the fresh full-list question", async () => {
  await mount(); completeTopic(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByRole("button", { name: "Yes" });
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("questionnaire-existing-row");
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Pending addition" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "9" } });
  const rowId = screen.getByTestId("questionnaire-row").getAttribute("data-topic-id");
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await screen.findByRole("button", { name: "Yes" });
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await screen.findByTestId("questionnaire-row");
  expect(screen.getByLabelText("Symptom name")).toHaveProperty("value", "Pending addition");
  expect(screen.getByLabelText("Interference / suffering intensity")).toHaveProperty("value", "9");
  expect(screen.getByTestId("questionnaire-row").getAttribute("data-topic-id")).toBe(rowId);
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
});

it("allows Back when an in-flight catalog read fails", async () => {
  await mount(); completeTopic(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  let reject!: (reason: Error) => void;
  vi.spyOn(compositionRoot.repositoryPort.getProvider(), "listTreatments")
    .mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  fireEvent.click(screen.getByTestId("confirm-group-summary"));
  await screen.findByTestId("guest-flow-pick-treatment");
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await act(async () => { reject(new Error("Offline catalog")); });
  await screen.findByTestId("confirm-group-summary");
});

it("gives an admitted Player start precedence over queued questionnaire Back", async () => {
  await mount(); completeTopic(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  fireEvent.click(await screen.findByTestId("confirm-group-summary"));
  await screen.findByTestId("guest-flow-pick-treatment");
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.savePlayerSession.bind(provider);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(provider, "savePlayerSession").mockImplementationOnce(async (session) => { await paused; await save(session); });
  let start!: Promise<string>;
  act(() => { start = compositionRoot.playerEngineActions.startSession("fixture-treatment", null, ["first"]); });
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  await act(async () => { release(); await start; });
  await screen.findByTestId("guest-flow-player");
  expect(screen.queryByTestId("questionnaire-back")).toBeNull();
});

it("does not apply the old No Continue while a replacement Yes is settling", async () => {
  await mount(); completeTopic(); fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await screen.findByRole("button", { name: "Dismiss" });
  fireEvent.click(await screen.findByRole("button", { name: "Back" }));
  const oldContinue = await screen.findByRole("button", { name: "Continue" });
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => { await paused; await save(group); });
  fireEvent.click(screen.getByTestId("muscle-test-yes"));
  expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
  fireEvent.click(oldContinue);
  expect(screen.queryByTestId("split-advisory")).toBeNull();
  await act(async () => { release(); });
  await screen.findByTestId("confirm-group-summary");
});
