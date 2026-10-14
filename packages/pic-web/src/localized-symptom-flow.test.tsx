// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Intensity, Polarity } from "pic-engine";
import { changeFixtureAlias, TerminologyFixture } from "./i18n/terminology-test-fixture";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { RatingControl } from "./RatingControl";
import { TherapeuticScreenFrame } from "./therapeutic-frame/TherapeuticScreenFrame";
import { TherapeuticContentCard } from "./therapeutic-frame/TherapeuticFrame";

function PriorRatingScreen({ symptomId }: { symptomId: string }) {
  const [polarity, setPolarity] = useState<Polarity>("negative");
  const [intensity, setIntensity] = useState<Intensity>(3);
  return <TherapeuticScreenFrame title="Rating fixture" stageLabel="Rating">
    <TherapeuticContentCard aria-label="Rating draft">
      <RatingControl symptomId={symptomId} polarity={polarity} intensity={intensity}
        onPolarityChange={setPolarity} onIntensityChange={setIntensity} />
    </TherapeuticContentCard>
  </TherapeuticScreenFrame>;
}

async function createPriorSymptom() {
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  const symptomId = await compositionRoot.groupEngineActions.addSymptom(groupId, "צוואר Neck");
  await compositionRoot.groupEngineActions.rate(symptomId, { polarity: "positive", intensity: 8 });
  return symptomId;
}

function switchLanguage(locale: "he" | "en") {
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "Open utilities" : "פתיחת הכלים" }));
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "עברית" : "English" }));
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "סגירת הכלים" : "Close utilities" }));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  localStorage.clear();
});

it("keeps real prior dimensions hidden until explicit reveal and retains that choice across locales", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const symptomId = await createPriorSymptom();
  const hasPrior = vi.spyOn(compositionRoot.groupEngineActions, "hasPriorRating");
  const reveal = vi.spyOn(compositionRoot.groupEngineActions, "revealPriorRating");
  const rate = vi.spyOn(compositionRoot.groupEngineActions, "rate");
  render(<AppProviders><TerminologyFixture /><PriorRatingScreen symptomId={symptomId} /></AppProviders>);
  await waitFor(() => expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy());
  const slider = screen.getByLabelText("Intensity");
  fireEvent.change(slider, { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Polarity"), { target: { value: "positive" } });
  act(() => changeFixtureAlias("שלי Right <b>{nemar}</b>"));
  switchLanguage("he");
  expect(screen.getByLabelText("עוצמה")).toBe(slider);
  expect((slider as HTMLInputElement).value).toBe("7");
  expect((screen.getByLabelText("קוטביות") as HTMLSelectElement).value).toBe("positive");
  expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  expect(reveal).not.toHaveBeenCalled();
  expect(rate).not.toHaveBeenCalled();
  expect(hasPrior).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId("reveal-prior-rating"));
  await waitFor(() => expect(screen.getByTestId("revealed-prior-rating").textContent).toBe("קודם: חיובית, 8/10"));
  switchLanguage("en");
  expect(screen.getByTestId("revealed-prior-rating").textContent).toBe("Prior: Positive, 8/10");
  expect((slider as HTMLInputElement).value).toBe("7");
  expect(reveal).toHaveBeenCalledExactlyOnceWith(symptomId);
  expect(hasPrior).toHaveBeenCalledTimes(1);
  expect(rate).not.toHaveBeenCalled();
});

it("retains a pending explicit reveal through selection without issuing another history request", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const symptomId = await createPriorSymptom();
  let release!: (value: { polarity: Polarity; intensity: Intensity }) => void;
  const pending = new Promise<{ polarity: Polarity; intensity: Intensity }>((resolve) => { release = resolve; });
  const reveal = vi.spyOn(compositionRoot.groupEngineActions, "revealPriorRating").mockReturnValueOnce(pending);
  render(<AppProviders><TerminologyFixture /><PriorRatingScreen symptomId={symptomId} /></AppProviders>);
  await waitFor(() => expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy());
  fireEvent.click(screen.getByTestId("reveal-prior-rating"));
  act(() => changeFixtureAlias("שלי Right <b>{nemar}</b>"));
  switchLanguage("he");
  expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  await act(async () => { release({ polarity: "positive", intensity: 8 }); await pending; });
  expect(screen.getByTestId("revealed-prior-rating").textContent).toBe("קודם: חיובית, 8/10");
  expect(reveal).toHaveBeenCalledExactlyOnceWith(symptomId);
  expect((screen.getByLabelText("עוצמה") as HTMLInputElement).value).toBe("3");
});

it("keeps a pending save and its recovery payload through selection without adding the symptom twice", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  const first = await compositionRoot.groupEngineActions.addSymptom(groupId, "Existing");
  await compositionRoot.groupEngineActions.rate(first, { polarity: "negative", intensity: 2 });
  const add = vi.spyOn(compositionRoot.groupEngineActions, "addSymptom");
  let reject!: (reason: Error) => void;
  const pending = new Promise<void>((_, rejectPromise) => { reject = rejectPromise; });
  const rate = vi.spyOn(compositionRoot.groupEngineActions, "rate").mockReturnValueOnce(pending);
  render(<AppProviders><TerminologyFixture /><SymptomGroupCreateScreen /></AppProviders>);
  await waitFor(() => expect(screen.getByTestId("finish-symptom-addition")).toBeTruthy());
  const name = screen.getByLabelText("Symptom name");
  fireEvent.change(name, { target: { value: "כוח Strength" } });
  fireEvent.change(screen.getByLabelText("Polarity"), { target: { value: "positive" } });
  fireEvent.change(screen.getByLabelText("Intensity"), { target: { value: "9" } });
  fireEvent.submit(screen.getByTestId("symptom-add-step"));
  await waitFor(() => expect(rate).toHaveBeenCalledTimes(1));
  const addedId = rate.mock.calls[0]![0];
  act(() => changeFixtureAlias("שלי Right <b>{nemar}</b>"));
  switchLanguage("he");
  expect(screen.getByLabelText("שם הסימפטום")).toBe(name);
  expect((name as HTMLInputElement).value).toBe("כוח Strength");
  await act(async () => { reject(new Error("Reconnect")); await pending.catch(() => {}); });
  expect(screen.getByRole("group", { name: "פעולות זמינות" }).querySelectorAll("button")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "ניסיון נוסף לשמירת הסימפטום" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "פתיחת הכלים" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "Try saving this symptom again" }));
  await waitFor(() => expect(rate).toHaveBeenCalledTimes(2));
  expect(rate).toHaveBeenNthCalledWith(2, addedId, { polarity: "positive", intensity: 9 });
  expect(add).toHaveBeenCalledExactlyOnceWith(groupId, "כוח Strength");
});

it("creates and rates personal wording after language selection without changing the draft or invoking actions", async () => {
  localStorage.setItem("pic-web.locale.v1", "he");
  const create = vi.spyOn(compositionRoot.groupEngineActions, "createDraftGroup");
  const add = vi.spyOn(compositionRoot.groupEngineActions, "addSymptom");
  const rate = vi.spyOn(compositionRoot.groupEngineActions, "rate");
  render(<AppProviders><TerminologyFixture /><SymptomGroupCreateScreen /></AppProviders>);
  act(() => changeFixtureAlias("My NEMAR נמ״ר"));
  const groupInput = screen.getByLabelText("שם הקבוצה");
  fireEvent.change(groupInput, { target: { value: "גב Back 123" } });
  fireEvent.click(screen.getByRole("button", { name: "פתיחת הכלים" }));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByLabelText("Group name")).toBe(groupInput);
  expect((groupInput as HTMLInputElement).value).toBe("גב Back 123");
  expect(groupInput.getAttribute("dir")).toBe("auto");
  expect(groupInput.getAttribute("lang")).toBe("");
  expect(create).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Close utilities" }));
  fireEvent.submit(screen.getByTestId("create-group-form"));
  await waitFor(() => expect(screen.getByLabelText("Symptom name")).toBeTruthy());
  const groupId = compositionRoot.groupEngineStore.getSnapshot().activeGroupId!;
  const symptomInput = screen.getByLabelText("Symptom name");
  fireEvent.change(symptomInput, { target: { value: "Neck צוואר" } });
  fireEvent.change(screen.getByLabelText("Intensity"), { target: { value: "7" } });
  fireEvent.change(screen.getByLabelText("Polarity"), { target: { value: "positive" } });
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  fireEvent.click(screen.getByRole("button", { name: "עברית" }));
  act(() => changeFixtureAlias("שינוי Literal"));
  expect(screen.getByLabelText("שם הסימפטום")).toBe(symptomInput);
  expect((symptomInput as HTMLInputElement).value).toBe("Neck צוואר");
  expect((screen.getByLabelText("עוצמה") as HTMLInputElement).value).toBe("7");
  expect((screen.getByLabelText("קוטביות") as HTMLSelectElement).value).toBe("positive");
  expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBe(groupId);
  expect(add).not.toHaveBeenCalled();
  expect(rate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "סגירת הכלים" }));
  fireEvent.submit(screen.getByTestId("symptom-add-step"));
  await waitFor(() => expect(screen.getByTestId("finish-symptom-addition")).toBeTruthy());
  const group = await compositionRoot.groupEngineActions.getGroup(groupId);
  expect(group?.name).toBe("גב Back 123");
  expect(group?.symptoms[0]?.name).toBe("Neck צוואר");
  expect(add).toHaveBeenCalledWith(groupId, "Neck צוואר");
  expect(rate).toHaveBeenCalledWith(group!.symptoms[0]!.id, { polarity: "positive", intensity: 7 });
  expect(screen.getByTestId("symptom-count").textContent).toBe("סימפטום 1 בקבוצה");
});
