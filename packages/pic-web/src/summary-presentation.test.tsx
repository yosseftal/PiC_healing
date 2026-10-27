// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";
import { inquiryGenerationStore } from "./inquiry-lifecycle";

afterEach(() => { cleanup(); vi.restoreAllMocks(); resetGuestFlowFactsForTest(); localStorage.clear(); });

async function prepare(title = "", locale = "en") {
  localStorage.setItem("pic-web.locale.v1", locale);
  const actions = compositionRoot.groupEngineActions;
  const id = await actions.createDraftGroup(title);
  const symptomId = await actions.addSymptom(id, "Quiet breath נשימה רגועה");
  await actions.rate(symptomId, { polarity: "positive", intensity: 0 });
  await actions.setJointTreatmentMuscleTest(id, "together");
  await actions.finalizeGroup(id);
  const view = render(<AppProviders><SymptomGroupSummaryScreen groupId={id} /></AppProviders>);
  const row = await screen.findByTestId(`summary-symptom-${symptomId}`);
  return { id, symptomId, row, actions, view };
}

it.each(["", "   "])("shows an untitled list without an empty title or total, retaining historical zero (%j)", async (title) => {
  const { row } = await prepare(title);
  expect(screen.queryByTestId("summary-group-name")).toBeNull();
  expect(screen.queryByTestId("symptom-count")).toBeNull();
  expect(row.textContent).toContain("Priority 1");
  expect(row.textContent).toContain("Intensity 0/10");
  expect(row.textContent).toContain("Positive");
});

it("groups by polarity without writes, preserves original priority, and restores manual reorder controls", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const actions = compositionRoot.groupEngineActions;
  const id = await actions.createDraftGroup("My list");
  const first = await actions.addSymptom(id, "Quiet breath נשימה רגועה");
  await actions.rate(first, { polarity: "positive", intensity: 0 });
  const second = await actions.addSymptom(id, "Back");
  await actions.rate(second, { polarity: "negative", intensity: 8 });
  const third = await actions.addSymptom(id, "Rest");
  await actions.rate(third, { polarity: "positive", intensity: 4 });
  await actions.addSymptom(id, "New topic");
  await actions.setJointTreatmentMuscleTest(id, "together");
  await actions.finalizeGroup(id);
  render(<AppProviders><SymptomGroupSummaryScreen groupId={id} /></AppProviders>);
  await screen.findByTestId(`summary-symptom-${third}`);
  const before = await actions.getGroup(id);
  const provider = compositionRoot.repositoryPort.getProvider();
  const save = vi.spyOn(provider, "saveGroup");
  const reorder = vi.spyOn(provider, "reorderSymptoms");
  const rate = vi.spyOn(actions, "rate");
  const reveal = vi.spyOn(actions, "revealPriorRating");
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  const selector = screen.getByRole("combobox", { name: "Summary view" });
  expect((selector as HTMLSelectElement).value).toBe("manual");
  fireEvent.change(selector, { target: { value: "polarity" } });
  fireEvent.click(screen.getByRole("button", { name: "Close utilities" }));
  const negative = screen.getByRole("region", { name: "Negative" });
  const positive = screen.getByRole("region", { name: "Positive" });
  const unrated = screen.getByRole("region", { name: "Unrated" });
  expect(negative.textContent).toContain("Priority 2Back");
  expect(positive.textContent).toContain("Priority 1Quiet breath נשימה רגועה");
  expect(positive.textContent).toContain("Priority 3Rest");
  expect(unrated.textContent).toContain("Priority 4New topicUnrated");
  expect(screen.queryByRole("button", { name: "Move topic up" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.change(screen.getByRole("combobox", { name: "Summary view" }), { target: { value: "manual" } });
  fireEvent.click(screen.getByRole("button", { name: "Close utilities" }));
  expect(within(screen.getByTestId(`summary-symptom-${second}`)).getByRole("button", { name: "Move topic up" }))
    .toBeTruthy();
  expect(save).not.toHaveBeenCalled();
  expect(reorder).not.toHaveBeenCalled();
  expect(rate).not.toHaveBeenCalled();
  expect(reveal).not.toHaveBeenCalled();
  expect(await actions.getGroup(id)).toEqual(before);
});

it("unmounts summary history for one blind response, retains input on remount, and explicitly reveals a real zero", async () => {
  const { id, symptomId, actions, view } = await prepare();
  const before = await actions.getGroup(id);
  const reveal = vi.spyOn(actions, "revealPriorRating");
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByRole("combobox", { name: "Intensity" });
  expect(screen.queryByTestId(`summary-symptom-${symptomId}`)).toBeNull();
  expect(screen.queryByTestId("summary-muscle-test")).toBeNull();
  expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  expect(screen.queryByRole("region", { name: "Positive" })).toBeNull();
  expect(document.body.textContent).not.toContain("Intensity 0/10");
  expect(reveal).not.toHaveBeenCalled();
  expect((screen.getByRole("button", { name: "Save current rating" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByRole("combobox", { name: "Polarity" }), { target: { value: "positive" } });
  fireEvent.change(screen.getByRole("combobox", { name: "Intensity" }), { target: { value: "6" } });
  view.unmount();
  render(<AppProviders><SymptomGroupSummaryScreen groupId={id} /></AppProviders>);
  expect((screen.getByRole("combobox", { name: "Intensity" }) as HTMLSelectElement).value).toBe("6");
  expect((screen.getByRole("combobox", { name: "Polarity" }) as HTMLSelectElement).value).toBe("positive");
  expect(screen.queryByTestId(`summary-symptom-${symptomId}`)).toBeNull();
  fireEvent.click(await screen.findByTestId("reveal-prior-rating"));
  await waitFor(() => expect(screen.getByTestId("revealed-prior-rating").textContent).toBe("Prior: Positive, 0/10"));
  fireEvent.change(screen.getByRole("combobox", { name: "Intensity" }), { target: { value: "0" } });
  fireEvent.click(screen.getByRole("button", { name: "Save current rating" }));
  const row = await screen.findByTestId(`summary-symptom-${symptomId}`);
  expect(row.textContent).toContain("Intensity 0/10");
  expect(before?.symptoms[0]).toMatchObject({ polarity: "positive", intensity: 0 });
  expect((await actions.getGroup(id))?.symptoms[0]).toMatchObject({ id: symptomId, polarity: "positive", intensity: 0 });
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByRole("combobox", { name: "Intensity" });
  expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  expect((screen.getByRole("combobox", { name: "Intensity" }) as HTMLSelectElement).value).toBe("");
});

it("retains a confirmed current rating when summary refresh fails and retries without rating again", async () => {
  const { symptomId, actions } = await prepare();
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByRole("combobox", { name: "Intensity" });
  fireEvent.change(screen.getByRole("combobox", { name: "Intensity" }), { target: { value: "3" } });
  const rate = vi.spyOn(actions, "rate");
  vi.spyOn(actions, "getGroup").mockRejectedValueOnce(new Error("Refresh unavailable"));
  fireEvent.click(screen.getByRole("button", { name: "Save current rating" }));
  await screen.findByText("Your current rating is retained. Try saving again.");
  expect(screen.getByRole("combobox", { name: "Intensity" }).matches(":disabled")).toBe(true);
  expect(screen.queryByTestId(`summary-symptom-${symptomId}`)).toBeNull();
  const returnAction = screen.getByRole("button", { name: "Return to summary" });
  expect(returnAction.matches(":disabled")).toBe(true);
  fireEvent.click(returnAction);
  act(() => compositionRoot.summaryRating.actionsFor(inquiryGenerationStore.getSnapshot()).cancel());
  expect(compositionRoot.summaryRating.store.getSnapshot()).toMatchObject({ symptomId, saved: true, recovery: true });
  expect(screen.queryByTestId(`summary-symptom-${symptomId}`)).toBeNull();
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save current rating" }));
  await screen.findByTestId(`summary-symptom-${symptomId}`);
  expect(rate).toHaveBeenCalledExactlyOnceWith(symptomId, { polarity: "negative", intensity: 3 });
});

it("rejects retained rating callbacks after explicit inquiry reset", async () => {
  const { id, symptomId, actions } = await prepare();
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByRole("combobox", { name: "Intensity" });
  fireEvent.change(screen.getByRole("combobox", { name: "Intensity" }), { target: { value: "5" } });
  const stale = compositionRoot.summaryRating.actionsFor(inquiryGenerationStore.getSnapshot());
  const rate = vi.spyOn(actions, "rate");
  await act(async () => { await compositionRoot.inquiryResetActions.resetInquiry(true); });
  await act(async () => {
    stale.edit({ intensity: 9 });
    await stale.save();
    await stale.start(id, symptomId);
  });
  expect(rate).not.toHaveBeenCalled();
  expect(compositionRoot.summaryRating.store.getSnapshot()).toMatchObject({ symptomId: null, inputIntensity: null });
});

it("offers a truthful return when public rating access is unavailable without hydrating private engine state", async () => {
  const { actions } = await prepare();
  vi.spyOn(actions, "hasPriorRating").mockRejectedValueOnce(new Error("Unknown symptom after reload"));
  const rate = vi.spyOn(actions, "rate");
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByText("This information is currently unavailable.");
  expect(screen.queryByTestId("rating-control")).toBeNull();
  expect((screen.getByRole("button", { name: "Save current rating" }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Return to summary" }));
  expect(screen.getByTestId("confirm-group-summary")).toBeTruthy();
  expect(rate).not.toHaveBeenCalled();
});

it("masks a retained response immediately on provider change and rejects both old and newly captured callbacks", async () => {
  const { actions } = await prepare();
  fireEvent.click(screen.getByRole("button", { name: "Rate this topic again" }));
  await screen.findByRole("combobox", { name: "Intensity" });
  fireEvent.change(screen.getByRole("combobox", { name: "Intensity" }), { target: { value: "5" } });
  const generation = inquiryGenerationStore.getSnapshot();
  const stale = compositionRoot.summaryRating.actionsFor(generation);
  const provider = compositionRoot.repositoryPort.getProvider();
  const rate = vi.spyOn(actions, "rate");
  try {
    compositionRoot.repositoryPort.swapProvider(new Proxy(provider, {}));
    expect(compositionRoot.summaryRating.store.getSnapshot()).toMatchObject({ name: "", symptomId: null });
    await stale.save();
    const newlyCaptured = compositionRoot.summaryRating.actionsFor(generation);
    await newlyCaptured.save();
    expect(rate).not.toHaveBeenCalled();
    act(() => compositionRoot.groupEngineStore.notify());
    expect(screen.queryByTestId("rating-control")).toBeNull();
    expect(compositionRoot.summaryRating.store.getSnapshot().inputIntensity).toBeNull();
  } finally {
    act(() => {
      compositionRoot.repositoryPort.swapProvider(provider);
      compositionRoot.groupEngineStore.notify();
    });
  }
});
