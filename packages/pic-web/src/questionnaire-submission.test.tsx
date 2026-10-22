// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { GuestFlowRouter } from "./guest-flow-router";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { advanceInquiryGeneration, hasInquiryDraft, inquiryGenerationStore } from "./inquiry-lifecycle";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";

beforeEach(() => localStorage.setItem("pic-web.locale.v1", "en"));
afterEach(() => { cleanup(); vi.restoreAllMocks(); resetGuestFlowFactsForTest(); localStorage.clear(); });
function mount(router = true) {
  return render(<AppProviders>{router ? <GuestFlowRouter /> : <SymptomGroupCreateScreen />}</AppProviders>);
}
function fill(index: number, name: string, intensity: string, positive = false) {
  const row = within(screen.getAllByTestId("questionnaire-row")[index]!);
  fireEvent.change(row.getByLabelText("Symptom name"), { target: { value: name } });
  if (positive) fireEvent.change(row.getByLabelText("Polarity"), { target: { value: "positive" } });
  fireEvent.change(row.getByLabelText(positive ? "Strength of the positive experience" : "Interference / suffering intensity"),
    { target: { value: intensity } });
}
function finish() { fireEvent.click(screen.getByTestId("finish-symptom-addition")); }

it("keeps blank names and untouched scores for completion without creating an empty or partial group", async () => {
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup");
  mount();
  finish();
  await screen.findByText("Complete a name and a rating from 1 to 10 in every row to continue.");
  expect(document.activeElement).toBe(screen.getByLabelText("Symptom name"));
  fill(0, "Neck", "");
  finish();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Interference / suffering intensity")));
  fill(0, "Neck", "3");
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  expect(document.activeElement).toBe(screen.getAllByLabelText("Symptom name")[1]);
  finish();
  expect(screen.getAllByTestId("questionnaire-row")).toHaveLength(2);
  expect(save).not.toHaveBeenCalled();
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it("commits duplicate names and locally reordered rows once, then records the actual No answer", async () => {
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup");
  mount();
  fireEvent.change(screen.getByLabelText("List name (optional)"), { target: { value: "   " } });
  fill(0, "Neck", "1");
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  fill(1, "Neck", "10");
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  fill(2, "Strength", "8", true);
  const third = screen.getAllByTestId("questionnaire-row")[2]!;
  const id = third.getAttribute("data-topic-id");
  fireEvent.click(within(third).getByRole("button", { name: "Move topic up" }));
  expect(document.activeElement).toBe(within(third).getByRole("button", { name: "Move topic up" }));
  fireEvent.click(within(third).getByRole("button", { name: "Move topic up" }));
  expect(screen.getAllByTestId("questionnaire-row")[0]!.getAttribute("data-topic-id")).toBe(id);
  expect(document.activeElement).toBe(within(third).getByRole("button", { name: "Move topic down" }));
  expect(screen.getAllByRole("status").some((item) => item.textContent === "Topic moved to priority 1")).toBe(true);
  expect((within(third).getByRole("button", { name: "Move topic up" }) as HTMLButtonElement).disabled).toBe(true);
  expect(save).not.toHaveBeenCalled();
  expect(hasInquiryDraft()).toBe(true);
  finish(); finish();
  await screen.findByTestId("muscle-test-no");
  expect(hasInquiryDraft()).toBe(false);
  expect(save).toHaveBeenCalledTimes(1);
  const groupId = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const group = await compositionRoot.groupEngineActions.getGroup(groupId);
  expect(group?.name).toBe("");
  expect(group?.symptoms.map((row) => [row.name, row.intensity, row.polarity])).toEqual([
    ["Strength", 8, "positive"], ["Neck", 1, "negative"], ["Neck", 10, "negative"],
  ]);
  expect(new Set(group?.symptoms.map((row) => row.id)).size).toBe(3);
  expect(group?.joint_treatment_muscle_test).toBeNull();
  fireEvent.click(screen.getByTestId("muscle-test-no"));
  await waitFor(async () => expect((await compositionRoot.groupEngineActions.getGroup(groupId))
    ?.joint_treatment_muscle_test).toBe("split_suggested"));
});

it("retains a complete frozen snapshot and its IDs after a rejected flush across transient mounts", async () => {
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = vi.spyOn(provider, "saveGroup").mockRejectedValueOnce(new Error("Storage unavailable"));
  const view = mount();
  fill(0, "Neck", "9", true);
  finish();
  await screen.findByText("Open utilities to try again.");
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  const first = structuredClone(save.mock.calls[0]![0]);
  expect(await provider.getGroup(first.id)).toBeNull();
  view.unmount(); mount();
  expect((screen.getByLabelText("Strength of the positive experience") as HTMLSelectElement).value).toBe("9");
  expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("Neck");
  finish();
  await screen.findByTestId("muscle-test-yes");
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls[1]![0]).toEqual(first);
  expect(await provider.getGroup(first.id)).toEqual(first);
});

it("retries a lost flush response with the same full group instead of adding duplicate topics", async () => {
  const provider = compositionRoot.repositoryPort.getProvider();
  const original = provider.saveGroup.bind(provider);
  const save = vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => {
    await original(group);
    throw new Error("Response lost");
  });
  mount(); fill(0, "Neck", "7"); finish();
  await screen.findByText("Open utilities to try again.");
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  const first = structuredClone(save.mock.calls[0]![0]);
  finish();
  await screen.findByTestId("muscle-test-yes");
  expect(save.mock.calls[1]![0]).toEqual(first);
  expect((await provider.getGroup(first.id))?.symptoms).toHaveLength(1);
});

it("publishes no partial group when staging fails and preserves local row IDs for retry", async () => {
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup");
  mount(); fill(0, "Neck", "2");
  const rowId = screen.getByTestId("questionnaire-row").getAttribute("data-topic-id");
  const uuid = vi.spyOn(crypto, "randomUUID").mockImplementationOnce(() => { throw new Error("Try again"); });
  finish();
  await screen.findByText("Open utilities to try again.");
  expect(save).not.toHaveBeenCalled();
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect(screen.getByTestId("questionnaire-row").getAttribute("data-topic-id")).toBe(rowId);
  uuid.mockRestore(); finish();
  await screen.findByTestId("muscle-test-yes");
  expect(save).toHaveBeenCalledOnce();
});

it("retains typed row names, scores, polarity and order across transient screen unmounts", () => {
  const view = mount(false);
  fill(0, "One", "1"); fireEvent.click(screen.getByTestId("add-symptom-action")); fill(1, "Two", "10", true);
  const second = screen.getAllByTestId("questionnaire-row")[1]!;
  const id = second.getAttribute("data-topic-id");
  fireEvent.click(within(second).getByRole("button", { name: "Move topic up" }));
  view.unmount(); mount(false);
  expect(screen.getAllByTestId("questionnaire-row")[0]!.getAttribute("data-topic-id")).toBe(id);
  expect((screen.getAllByLabelText("Symptom name")[0] as HTMLInputElement).value).toBe("Two");
  expect((screen.getByLabelText("Strength of the positive experience") as HTMLSelectElement).value).toBe("10");
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
});

it("rejects delayed callbacks and in-flight staging from a replaced inquiry generation", async () => {
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup");
  mount(); fill(0, "Old", "5");
  const old = compositionRoot.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  await act(async () => {
    const pending = old.finish();
    advanceInquiryGeneration();
    await pending;
    await old.finish();
    old.add(); old.setTitle("Late title");
  });
  expect(save).not.toHaveBeenCalled();
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value).toBe("");
  expect(screen.getAllByTestId("questionnaire-row")).toHaveLength(1);
});

it("rejects a provider switch during staging without publishing or writing the draft to another owner", async () => {
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = vi.spyOn(provider, "saveGroup");
  mount(); fill(0, "Private", "6");
  const actions = compositionRoot.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  try {
    await act(async () => {
      const pending = actions.finish();
      compositionRoot.repositoryPort.swapProvider(new Proxy(provider, {}));
      await pending;
      await actions.finish();
    });
    expect(save).not.toHaveBeenCalled();
    expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
  } finally { compositionRoot.repositoryPort.swapProvider(provider); }
});

it("continues an existing rated group without rewriting a true zero or its timestamp", async () => {
  const id = await compositionRoot.groupEngineActions.createDraftGroup("");
  const topic = await compositionRoot.groupEngineActions.addSymptom(id, "Existing zero");
  await compositionRoot.groupEngineActions.rate(topic, { intensity: 0, polarity: "positive" });
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  const save = vi.spyOn(compositionRoot.repositoryPort.getProvider(), "saveGroup");
  mount(); await screen.findByText("Existing zero"); finish();
  await screen.findByTestId("muscle-test-yes");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
  expect(save).not.toHaveBeenCalled();
});

it("continues a retained legacy unrated group without guessing a rating or discarding it", async () => {
  const id = await compositionRoot.groupEngineActions.createDraftGroup("");
  await compositionRoot.groupEngineActions.addSymptom(id, "Unrated legacy topic");
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  mount(); await screen.findByText("Unrated legacy topic");
  expect(screen.getByText(/Your previous list is retained/)).toBeTruthy();
  finish();
  await screen.findByTestId("muscle-test-yes");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
});
