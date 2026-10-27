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

it("returns from summary, stages a new topic and requires a fresh full-list answer", async () => {
  mount(); fill(0, "Neck", "3"); finish();
  fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  const edit = await screen.findByTestId("edit-questionnaire");
  fireEvent.click(edit);
  fireEvent.click(await screen.findByTestId("add-symptom-action"));
  fill(0, "Ease", "8", true); finish();
  await screen.findByTestId("muscle-test-no");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
  fireEvent.click(screen.getByTestId("muscle-test-no"));
  await screen.findByTestId("split-advisory");
  const after = await compositionRoot.groupEngineActions.getGroup(id);
  expect(after?.symptoms.map((row) => row.name)).toEqual(["Neck", "Ease"]);
  expect(after?.joint_treatment_muscle_test).toBe("split_suggested");
  expect(after?.symptoms[0]).toEqual(before?.symptoms[0]);
  fireEvent.click(screen.getByTestId("finalize-anyway"));
  await screen.findByTestId("confirm-group-summary");
});

async function editList() {
  fireEvent.click(await screen.findByRole("button", { name: "Open utilities" }));
  fireEvent.click(await screen.findByTestId("edit-questionnaire"));
  await screen.findByTestId("symptom-add-step");
}
async function answeredList(answer: "yes" | "no" = "yes") {
  mount(); fill(0, "Original", "4"); finish();
  fireEvent.click(await screen.findByTestId(`muscle-test-${answer}`));
  if (answer === "no") {
    await waitFor(() => {
      const finalize = screen.getByRole("button", { name: "Finalize anyway" });
      expect(finalize.closest("[inert]")).toBeNull();
      expect(finalize.closest("[data-active-key]")?.getAttribute("data-active-key")).toBe("joint-treatment:advisory");
      expect((finalize as HTMLButtonElement).disabled).toBe(false);
      fireEvent.click(finalize);
    });
  }
  await screen.findByTestId("confirm-group-summary");
  return compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
}

it("retains many additions, text, ratings, stable IDs and full order when returning from the renewed question", async () => {
  const id = await answeredList("no");
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  await editList();
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Ease", "8", true);
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(1, "Sleep", "1");
  const ids = screen.getAllByTestId("questionnaire-row").map((row) => row.getAttribute("data-topic-id"));
  fireEvent.click(within(screen.getAllByTestId("questionnaire-row")[1]!).getByRole("button", { name: "Move topic up" }));
  finish(); await screen.findByTestId("muscle-test-yes");
  await editList();
  expect(screen.getAllByTestId("questionnaire-row").map((row) => row.getAttribute("data-topic-id"))).toEqual(ids.reverse());
  expect((screen.getAllByLabelText("Symptom name")[0] as HTMLInputElement).value).toBe("Sleep");
  expect((screen.getByLabelText("Strength of the positive experience") as HTMLSelectElement).value).toBe("8");
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
  finish(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  const saved = await compositionRoot.groupEngineActions.getGroup(id);
  expect(saved?.symptoms.map((row) => row.name)).toEqual(["Original", "Sleep", "Ease"]);
  expect(saved?.symptoms.slice(1).map((row) => row.id)).toEqual(ids);
});

it("retains the actual fresh response and exact request after a failed revision and transient remount", async () => {
  const id = await answeredList();
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  const provider = compositionRoot.repositoryPort.getProvider();
  const write = vi.spyOn(provider, "commitMembershipRevision").mockRejectedValueOnce(new Error("Unavailable"));
  await editList(); fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Calm", "10", true);
  finish(); fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().recovery).toBe(true));
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
  const frozen = structuredClone(write.mock.calls[0]![0]);
  cleanup(); mount();
  await editList();
  expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("Calm");
  fireEvent.click(screen.getByTestId("add-symptom-action"));
  expect(screen.getAllByTestId("questionnaire-row")).toHaveLength(1);
  finish(); await screen.findByTestId("split-advisory");
  expect(write.mock.calls[1]![0]).toEqual(frozen);
  expect((await compositionRoot.groupEngineActions.getGroup(id))?.joint_treatment_muscle_test).toBe("split_suggested");
});

it("retries a committed lost revision response exactly once without duplicating new topics", async () => {
  const id = await answeredList();
  const provider = compositionRoot.repositoryPort.getProvider();
  const original = provider.commitMembershipRevision.bind(provider);
  const write = vi.spyOn(provider, "commitMembershipRevision").mockImplementationOnce(async (input) => {
    await original(input); throw new Error("Response lost");
  });
  await editList(); fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Calm", "5");
  finish(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().recovery).toBe(true));
  const saved = await provider.getGroup(id);
  const frozen = structuredClone(write.mock.calls[0]![0]);
  fireEvent.click(screen.getByTestId("retry-membership-revision"));
  await screen.findByTestId("confirm-group-summary");
  expect(write.mock.calls[1]![0]).toEqual(frozen);
  expect(await provider.getGroup(id)).toEqual(saved);
  expect(saved?.symptoms).toHaveLength(2);
});

it.each(["yes", "no"] as const)("pure editor reorder preserves the committed %s answer without asking again", async (answer) => {
  mount(); fill(0, "First", "4");
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(1, "Second", "5"); finish();
  fireEvent.click(await screen.findByTestId(`muscle-test-${answer}`));
  if (answer === "no") fireEvent.click(await screen.findByTestId("finalize-anyway"));
  await screen.findByTestId("confirm-group-summary");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const before = (await compositionRoot.groupEngineActions.getGroup(id))!;
  await editList();
  const last = screen.getAllByTestId("questionnaire-existing-row")[1]!;
  fireEvent.click(within(last).getByRole("button", { name: "Move topic up" }));
  expect(document.activeElement).toBe(within(last).getByRole("button", { name: "Move topic down" }));
  finish(); await screen.findByTestId("confirm-group-summary");
  expect(screen.queryByTestId("muscle-test-yes")).toBeNull();
  const after = (await compositionRoot.groupEngineActions.getGroup(id))!;
  expect(after.joint_treatment_muscle_test).toBe(before.joint_treatment_muscle_test);
  expect(after.joint_treatment_test_at).toBe(before.joint_treatment_test_at);
  expect(after.symptoms).toEqual([...before.symptoms].reverse());
});

it("rejects a changed membership until explicit review and a new actual answer", async () => {
  const id = await answeredList();
  await editList(); fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Pending", "5");
  finish(); await screen.findByTestId("muscle-test-yes");
  const provider = compositionRoot.repositoryPort.getProvider();
  const base = (await provider.getGroup(id))!;
  const added = crypto.randomUUID();
  await provider.commitMembershipRevision({ operationId: crypto.randomUUID(), groupId: id,
    expectedRevision: base.revision!, expectedMembershipRevision: 0,
    additions: [{ id: added, name: "Other device", polarity: "negative", intensity: 2 }],
    orderedSymptomIds: [...base.symptoms.map((row) => row.id), added],
    answer: "together", answeredAt: "2026-10-26T01:02:03Z" });
  fireEvent.click(screen.getByTestId("muscle-test-no"));
  await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().conflict).toBe(true));
  expect((await provider.getGroup(id))?.symptoms.map((row) => row.name)).toEqual(["Original", "Other device"]);
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(screen.getByRole("button", { name: "Review the updated list and answer again" }));
  await screen.findByTestId("symptom-add-step");
  expect(compositionRoot.questionnaire.store.getSnapshot().answer).toBeNull();
  finish(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  expect((await provider.getGroup(id))?.symptoms.map((row) => row.name)).toEqual(["Original", "Other device", "Pending"]);
});

it("shows a true prior zero read-only while only additions use the initial 1–10 controls", async () => {
  const id = await compositionRoot.groupEngineActions.createDraftGroup("Zero history");
  const symptom = await compositionRoot.groupEngineActions.addSymptom(id, "Legacy zero");
  await compositionRoot.groupEngineActions.rate(symptom, { polarity: "positive", intensity: 0 });
  await compositionRoot.groupEngineActions.setJointTreatmentMuscleTest(id, "together");
  await compositionRoot.groupEngineActions.finalizeGroup(id);
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  mount(); await screen.findByText("Legacy zero"); finish(); await screen.findByTestId("confirm-group-summary");
  await editList();
  const old = screen.getByTestId("questionnaire-existing-row");
  expect(old.textContent).toContain("0/10");
  expect(within(old).queryByRole("combobox")).toBeNull();
  expect(within(old).queryByRole("textbox")).toBeNull();
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Added", "1");
  finish(); fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  expect((await compositionRoot.groupEngineActions.getGroup(id))?.symptoms[0]).toEqual(before?.symptoms[0]);
});

it("freezes an unanswered list revision with a new first topic through a lost flush response", async () => {
  mount(); fill(0, "Original", "3"); finish(); await screen.findByTestId("muscle-test-yes");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const before = (await compositionRoot.groupEngineActions.getGroup(id))!;
  await editList(); fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "New first", "9", true);
  fireEvent.click(within(screen.getByTestId("questionnaire-row")).getByRole("button", { name: "Move topic up" }));
  const provider = compositionRoot.repositoryPort.getProvider();
  const original = provider.saveGroup.bind(provider);
  const save = vi.spyOn(provider, "saveGroup").mockImplementationOnce(async (group) => {
    await original(group); throw new Error("Flush response lost");
  });
  finish(); await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().recovery).toBe(true));
  const frozen = structuredClone(save.mock.calls[0]![0]);
  const committed = await provider.getGroup(id);
  finish(); await screen.findByTestId("muscle-test-yes");
  expect(save.mock.calls[1]![0]).toEqual(frozen);
  expect((await provider.getGroup(id))?.symptoms).toEqual(committed?.symptoms);
  expect(committed?.symptoms.map((row) => row.name)).toEqual(["New first", "Original"]);
  expect(committed?.symptoms[1]).toEqual(before.symptoms[0]);
});

it("retains pending revision intent but rejects a provider switch before submission", async () => {
  await answeredList(); await editList();
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Private", "6");
  finish(); await screen.findByTestId("muscle-test-yes");
  const provider = compositionRoot.repositoryPort.getProvider();
  const write = vi.spyOn(provider, "commitMembershipRevision");
  const actions = compositionRoot.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  try {
    compositionRoot.repositoryPort.swapProvider(new Proxy(provider, {}));
    expect(await actions.answer("together")).toBe(false);
    expect(write).not.toHaveBeenCalled();
    expect(compositionRoot.questionnaire.store.getSnapshot().rows.at(-1)?.name).toBe("Private");
  } finally { compositionRoot.repositoryPort.swapProvider(provider); }
});

it("does not publish an in-flight revision after the inquiry generation changes", async () => {
  await answeredList(); await editList();
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(0, "Old inquiry", "6");
  finish(); await screen.findByTestId("muscle-test-yes");
  const provider = compositionRoot.repositoryPort.getProvider();
  const original = provider.commitMembershipRevision.bind(provider);
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  const write = vi.spyOn(provider, "commitMembershipRevision").mockImplementationOnce(async (input) => {
    await ready; return original(input);
  });
  const actions = compositionRoot.questionnaire.actionsFor(inquiryGenerationStore.getSnapshot());
  await act(async () => {
    const pending = actions.answer("together");
    await waitFor(() => expect(write).toHaveBeenCalled());
    advanceInquiryGeneration(); release();
    expect(await pending).toBe(false);
  });
  expect(compositionRoot.questionnaire.store.getSnapshot().existing).toBeNull();
  expect(compositionRoot.questionnaire.store.getSnapshot().rows).toHaveLength(1);
});

it("retains a stale editor reorder until explicit review and retry instead of overwriting a concurrent order", async () => {
  mount(); fill(0, "First", "4");
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(1, "Second", "5");
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(2, "Third", "6"); finish();
  fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const base = (await compositionRoot.groupEngineActions.getGroup(id))!;
  await editList();
  fireEvent.click(within(screen.getAllByTestId("questionnaire-existing-row")[2]!)
    .getByRole("button", { name: "Move topic up" }));
  const intended = [base.symptoms[0]!.id, base.symptoms[2]!.id, base.symptoms[1]!.id];
  const provider = compositionRoot.repositoryPort.getProvider();
  const canonical = await provider.reorderSymptoms(id,
    [base.symptoms[2]!.id, base.symptoms[1]!.id, base.symptoms[0]!.id], base.revision!);
  finish();
  await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().conflict).toBe(true));
  expect(await provider.getGroup(id)).toEqual(canonical);
  expect(compositionRoot.questionnaire.store.getSnapshot().rows.map((row) => row.id)).toEqual(intended);
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(screen.getByRole("button", { name: "Review the updated list and answer again" }));
  await waitFor(() => expect(compositionRoot.questionnaire.store.getSnapshot().conflict).toBe(false));
  expect(compositionRoot.questionnaire.store.getSnapshot().rows.map((row) => row.id)).toEqual(intended);
  expect(await provider.getGroup(id)).toEqual(canonical);
  finish(); await screen.findByTestId("confirm-group-summary");
  expect((await provider.getGroup(id))?.symptoms.map((row) => row.id)).toEqual(intended);
  expect(screen.queryByTestId("muscle-test-yes")).toBeNull();
});

it("returns an undated legacy No to the question without fabricating finalization or a timestamp", async () => {
  const id = await compositionRoot.groupEngineActions.createDraftGroup("Legacy No");
  const symptom = await compositionRoot.groupEngineActions.addSymptom(id, "Retained");
  await compositionRoot.groupEngineActions.rate(symptom, { intensity: 4 });
  const base = (await compositionRoot.groupEngineActions.getGroup(id))!;
  await compositionRoot.repositoryPort.saveGroup({ ...base, joint_treatment_muscle_test: "split_suggested",
    joint_treatment_test_at: null });
  const { setGuestFlowSymptomAdditionComplete } = await import("./guest-flow-facts");
  setGuestFlowSymptomAdditionComplete(true);
  mount(); await screen.findByTestId("muscle-test-yes");
  await editList(); finish();
  await screen.findByTestId("muscle-test-yes");
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  expect(screen.queryByTestId("guest-flow-pick-treatment")).toBeNull();
  await expect(compositionRoot.groupEngine.finalizeGroup(id)).rejects.toThrow("cannot be finalized");
  expect((await compositionRoot.repositoryPort.getGroup(id))?.joint_treatment_test_at).toBeNull();
});

it("returns a valid No to its advisory after a pure editor return without asking again or finalizing", async () => {
  mount(); fill(0, "Original", "4"); finish();
  fireEvent.click(await screen.findByTestId("muscle-test-no"));
  await screen.findByTestId("split-advisory");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const before = await compositionRoot.groupEngineActions.getGroup(id);
  await editList(); finish();
  await screen.findByTestId("split-advisory");
  expect(screen.queryByTestId("muscle-test-yes")).toBeNull();
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  expect(await compositionRoot.groupEngineActions.getGroup(id)).toEqual(before);
  fireEvent.click(screen.getByTestId("finalize-anyway"));
  await screen.findByTestId("confirm-group-summary");
});

it("closes an unchanged editor onto the latest canonical order without writing a new priority", async () => {
  mount(); fill(0, "First", "4");
  fireEvent.click(screen.getByTestId("add-symptom-action")); fill(1, "Second", "5"); finish();
  fireEvent.click(await screen.findByTestId("muscle-test-yes"));
  await screen.findByTestId("confirm-group-summary");
  const id = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const base = (await compositionRoot.groupEngineActions.getGroup(id))!;
  await editList();
  const provider = compositionRoot.repositoryPort.getProvider();
  const canonical = await provider.reorderSymptoms(id, base.symptoms.map((row) => row.id).reverse(), base.revision!);
  const reorder = vi.spyOn(provider, "reorderSymptoms");
  finish(); await screen.findByTestId("confirm-group-summary");
  expect(reorder).not.toHaveBeenCalled();
  expect(await provider.getGroup(id)).toEqual(canonical);
  expect(compositionRoot.questionnaire.store.getSnapshot().existing).toEqual(canonical);
});
