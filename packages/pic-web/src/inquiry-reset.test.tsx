// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { GuestFlowRouter } from "./guest-flow-router";
import { compositionRoot } from "./composition-root";
import { useAsyncAction } from "./use-async-action";
import {
  resetGuestFlowFactsForTest, setGuestFlowSymptomAdditionComplete,
  setGuestFlowGroupFinalized, setGuestFlowSummaryAcknowledged,
} from "./guest-flow-facts";

async function mount() {
  localStorage.setItem("pic-web.locale.v1", "en");
  const view = render(<AppProviders><GuestFlowRouter /></AppProviders>);
  await waitFor(() => {
    const start = screen.queryByRole("button", { name: "Start the questionnaire" });
    if (start && start.closest("[inert]") === null) fireEvent.click(start);
    const utilities = screen.getByRole("button", { name: "Open utilities" });
    expect(utilities.closest("[inert]")).toBeNull();
  });
  return view;
}
async function openReset() {
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(await screen.findByRole("button", { name: "New symptom group" }));
}
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  localStorage.clear();
  sessionStorage.clear();
});
it("refuses a stale UI callback after reset while admitting work for the fresh inquiry", async () => {
  let lateWrite!: () => Promise<unknown>;
  function OldInquiry() {
    const { run } = useAsyncAction(compositionRoot.groupEngineActions.createDraftGroup);
    lateWrite = () => run("Stale callback");
    return null;
  }
  const view = render(<OldInquiry />);
  await compositionRoot.inquiryResetActions.resetInquiry(true);
  view.unmount();
  await lateWrite();
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Current inquiry");
  expect((await compositionRoot.repositoryPort.getGroup(groupId))?.name).toBe("Current inquiry");
});
it("keeps typed-only work on cancel and clears it on confirmed reset in the same creation screen", async () => {
  await mount();
  fireEvent.change(screen.getByLabelText("List name (optional)"), { target: { value: "My draft" } });
  await openReset();
  const keep = await screen.findByRole("button", { name: "Keep current inquiry" });
  await waitFor(() => expect(keep).toBe(document.activeElement));
  fireEvent.click(screen.getByRole("button", { name: "Keep current inquiry" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("My draft");
  await openReset();
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("") );
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  await waitFor(() => expect(screen.getByLabelText("List name (optional)")).toBe(document.activeElement));
});


it("resets an empty inquiry without confirmation and preserves unrelated preferences", async () => {
  await mount();
  localStorage.setItem("other-app", "keep");
  await openReset();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("");
  expect(localStorage.getItem("other-app")).toBe("keep");
  expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
});

it("waits for a slow create before re-evaluating loss, then removes the settled record", async () => {
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = provider.saveGroup.bind(provider);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => {
    await paused;
    await save(group);
  });
  await mount();
  fireEvent.change(screen.getByLabelText("List name (optional)"), { target: { value: "Slow draft" } });
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Neck" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "8" } });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await openReset();
  expect(screen.queryByRole("button", { name: "Discard draft and start new" })).toBeNull();
  await act(async () => { release(); });
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
  await act(async () => { await Promise.resolve(); });
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("");
});

it("retains the exact committed record when storage removal fails and allows retry", async () => {
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Retain me");
  const symptom = await compositionRoot.groupEngineActions.addSymptom(groupId, "Retained symptom");
  await compositionRoot.groupEngineActions.rate(symptom, { intensity: 8, polarity: "positive" });
  const before = await compositionRoot.repositoryPort.getGroup(groupId);
  await mount();
  await screen.findByText("Retained symptom");
  const remove = Storage.prototype.removeItem;
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
    if (key === "pic:guest-repository:v1") throw new Error("Storage unavailable");
    remove.call(this, key);
  });
  await openReset();
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await screen.findByRole("button", { name: "Retry starting new" });
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBe(groupId);
  expect(await compositionRoot.repositoryPort.getGroup(groupId)).toEqual(before);
  fireEvent.click(screen.getByRole("button", { name: "Keep current inquiry" }));
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByText("Retained symptom")).toBeTruthy();
  expect(await compositionRoot.repositoryPort.getGroup(groupId)).toEqual(before);
  vi.restoreAllMocks();
  await openReset();
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
});

it("settles the entire atomic submission and preserves the typed rows when its flush fails", async () => {
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup")
    .mockImplementationOnce(async () => { await paused; throw new Error("Storage unavailable"); });
  await mount();
  fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Neck" } });
  fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "8" } });
  fireEvent.click(screen.getByTestId("finish-symptom-addition"));
  await waitFor(() => expect(save).toHaveBeenCalledOnce());
  await openReset();
  await act(async () => { release(); });
  await screen.findByRole("button", { name: "Retry starting new" });
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
  expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("Neck");
  expect((screen.getByLabelText("Interference / suffering intensity") as HTMLSelectElement).value).toBe("8");
  expect(screen.queryByRole("button", { name: "Discard draft and start new" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Retry starting new" }));
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
  expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("");
});

it("settles delayed treatment parsing and its startSession continuation before reset", async () => {
  await compositionRoot.groupEngineActions.createDraftGroup("Picker draft");
  setGuestFlowSymptomAdditionComplete(true);
  setGuestFlowGroupFinalized(true);
  setGuestFlowSummaryAcknowledged(true);
  let release!: () => void;
  const paused = new Promise<void>((resolve) => { release = resolve; });
  vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
    { id: "slow-treatment", title: "Slow treatment" },
  ]);
  vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockImplementation(async () => {
    await paused;
    return [{ unit_id: "unit-one", unit_title: "One", unit_content: "Breathe", unit_order: 0, unit_rationale: null }];
  });
  await mount();
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(await screen.findByTestId("pick-treatment-slow-treatment"));
  fireEvent.click(await screen.findByRole("button", { name: "New symptom group" }));
  await act(async () => { release(); });
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.queryByTestId("guest-flow-player")).toBeNull();
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("");
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
});

it("rejects new therapeutic writes during cleanup so they cannot resurrect discarded records", async () => {
  await mount();
  const remove = Storage.prototype.removeItem;
  let lateWrite: Promise<string> | undefined;
  vi.spyOn(Storage.prototype, "removeItem").mockImplementation(function (this: Storage, key) {
    if (key === "pic:guest-repository:v1") {
      lateWrite = compositionRoot.groupEngineActions.createDraftGroup("Too late");
      void lateWrite.catch(() => undefined);
    }
    remove.call(this, key);
  });
  await openReset();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await expect(lateWrite).rejects.toThrow("Inquiry reset is pending");
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
});

it.each(["joint", "summary", "picker"])("offers reset from a finalized Guest %s stage", async (stage) => {
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Final Guest");
  const symptomId = await compositionRoot.groupEngineActions.addSymptom(groupId, "Back");
  await compositionRoot.groupEngineActions.rate(symptomId, { polarity: "positive", intensity: 7 });
  setGuestFlowSymptomAdditionComplete(true);
  if (stage !== "joint") {
    await compositionRoot.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
    await compositionRoot.groupEngineActions.finalizeGroup(groupId);
  }
  if (stage === "picker") setGuestFlowSummaryAcknowledged(true);
  await mount();
  await openReset();
  fireEvent.click(await screen.findByRole("button", { name: "Discard draft and start new" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("");
  expect(await compositionRoot.repositoryPort.getGroup(groupId)).toBeNull();
  expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
});
