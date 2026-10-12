// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { SymptomGroup } from "pic-engine";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { resetGuestFlowFactsForTest, setGuestFlowSymptomAdditionComplete } from "./guest-flow-facts";
import { JointTreatmentMuscleTestStep } from "./JointTreatmentMuscleTestStep";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";
import { GuestFlowRouter } from "./guest-flow-router";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  localStorage.clear();
});

it("retains a pending joint response and current-locale recovery without a third main choice", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck צוואר");
  setGuestFlowSymptomAdditionComplete(true);
  let reject!: (reason: Error) => void;
  const pending = new Promise<void>((_, fail) => { reject = fail; });
  const response = vi.spyOn(compositionRoot.groupEngineActions, "setJointTreatmentMuscleTest")
    .mockReturnValueOnce(pending);
  const finalize = vi.spyOn(compositionRoot.groupEngineActions, "finalizeGroup");
  render(<AppProviders><JointTreatmentMuscleTestStep groupId={groupId} /></AppProviders>);
  fireEvent.click(screen.getByTestId("muscle-test-no"));
  switchLanguage("he");
  await act(async () => { reject(new Error("Reconnect")); await pending.catch(() => {}); });
  expect(screen.getByText("אפשר לנסות שוב לרשום את תשובת בדיקת השריר.")).toBeTruthy();
  expect(screen.getByRole("group", { name: "פעולות זמינות" }).querySelectorAll("button")).toHaveLength(2);
  expect(screen.queryByRole("button", { name: "ניסיון נוסף לרישום תשובת בדיקת השריר" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "פתיחת הכלים" }));
  fireEvent.click(screen.getByRole("button", { name: "ניסיון נוסף לרישום תשובת בדיקת השריר" }));
  await waitFor(() => expect(response).toHaveBeenCalledTimes(2));
  expect(response).toHaveBeenNthCalledWith(2, groupId, "split_suggested");
  expect(finalize).not.toHaveBeenCalled();
});

it("settles pending catalog and selection recovery in the chosen language without resetting voluntary linking", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  let releaseList!: (rows: { id: string; title: string }[]) => void;
  const pendingList = new Promise<{ id: string; title: string }[]>((resolve) => { releaseList = resolve; });
  const list = vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockReturnValueOnce(pendingList);
  let reject!: (reason: Error) => void;
  const pending = new Promise<never>((_, fail) => { reject = fail; });
  const read = vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent")
    .mockReturnValueOnce(pending).mockResolvedValueOnce([{
      unit_id: "unit-0", unit_order: 0, unit_title: "Continuous Guidance",
      unit_content: "Canonical prose.", unit_rationale: null,
    }]);
  const start = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-fixture");
  render(<AppProviders><TreatmentPickerScreen /></AppProviders>);
  switchLanguage("he");
  await act(async () => { releaseList([{ id: "prose", title: "Source מקור" }]); await pendingList; });
  fireEvent.click(screen.getByRole("button", { name: "פתיחת הכלים" }));
  const link = screen.getByTestId("link-to-group-toggle") as HTMLInputElement;
  fireEvent.click(link);
  fireEvent.click(screen.getByTestId("pick-treatment-prose"));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  await act(async () => { reject(new Error("Reconnect")); await pending.catch(() => {}); });
  expect(screen.getByRole("button", { name: "Try opening treatment again" })).toBeTruthy();
  expect(link.checked).toBe(true);
  expect(list).toHaveBeenCalledTimes(1);
  expect(read).toHaveBeenCalledExactlyOnceWith("prose");
  expect(start).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Try opening treatment again" }));
  await waitFor(() => expect(start).toHaveBeenCalledExactlyOnceWith("prose", groupId, ["unit-0"]));
  expect(read).toHaveBeenNthCalledWith(2, "prose");
});

it("settles a pending summary in the chosen locale with isolated personal wording and no repeated read", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב <b>Back</b> 123");
  const symptom = await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck צוואר");
  await compositionRoot.groupEngineActions.rate(symptom, { polarity: "positive", intensity: 7 });
  await compositionRoot.groupEngineActions.setJointTreatmentMuscleTest(groupId, "together");
  await compositionRoot.groupEngineActions.finalizeGroup(groupId);
  const group = await compositionRoot.groupEngineActions.getGroup(groupId);
  let release!: (value: SymptomGroup | null) => void;
  const pending = new Promise<SymptomGroup | null>((resolve) => { release = resolve; });
  const read = vi.spyOn(compositionRoot.groupEngineActions, "getGroup").mockReturnValueOnce(pending);
  render(<AppProviders><SymptomGroupSummaryScreen groupId={groupId} /></AppProviders>);
  switchLanguage("he");
  expect(screen.getByText("סיכום הקבוצה נטען…")).toBeTruthy();
  await act(async () => { release(group); await pending; });
  expect(screen.getByTestId("summary-group-name").textContent).toBe("גב <b>Back</b> 123");
  const personal = screen.getByTestId("summary-group-name").querySelector("bdi")!;
  expect(personal.getAttribute("lang")).toBe("");
  expect(personal.getAttribute("dir")).toBe("auto");
  expect(personal.querySelector("b")).toBeNull();
  expect(screen.getByTestId(`summary-symptom-${symptom}`).textContent).toBe("Neck צוואר — חיובית, 7/10");
  expect(screen.getByTestId("symptom-count").textContent).toBe("סימפטום 1 בקבוצה");
  switchLanguage("en");
  expect(screen.getByTestId(`summary-symptom-${symptom}`).textContent).toBe("Neck צוואר — Positive, 7/10");
  expect(read).toHaveBeenCalledExactlyOnceWith(groupId);
  expect(screen.getByTestId("confirm-group-summary")).toBeTruthy();
});

function switchLanguage(locale: "he" | "en") {
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "Open utilities" : "פתיחת הכלים" }));
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "עברית" : "English" }));
  fireEvent.click(screen.getByRole("button", { name: locale === "he" ? "סגירת הכלים" : "Close utilities" }));
}

it("keeps joint No advisory and sovereign finalization through language changes without answering again", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  await compositionRoot.groupEngineActions.addSymptom(groupId, "צוואר Neck");
  setGuestFlowSymptomAdditionComplete(true);
  const response = vi.spyOn(compositionRoot.groupEngineActions, "setJointTreatmentMuscleTest");
  const finalize = vi.spyOn(compositionRoot.groupEngineActions, "finalizeGroup");
  const view = render(<AppProviders><JointTreatmentMuscleTestStep groupId={groupId} /></AppProviders>);
  const no = screen.getByTestId("muscle-test-no");
  switchLanguage("he");
  expect(screen.getByTestId("muscle-test-no")).toBe(no);
  expect(no.textContent).toBe("לא");
  expect(response).not.toHaveBeenCalled();
  expect(finalize).not.toHaveBeenCalled();
  expect(view.container.querySelectorAll(".pic-therapeutic-frame")).toHaveLength(1);
  fireEvent.click(no);
  await waitFor(() => expect(screen.getByTestId("split-advisory").textContent)
    .toBe("ייתכן שמתאים יותר לטפל בסימפטומים האלה בקבוצות נפרדות."));
  switchLanguage("en");
  expect(screen.getByTestId("split-advisory").textContent).toBe("These symptoms may heal better as separate groups.");
  fireEvent.click(screen.getByTestId("dismiss-split-advisory"));
  switchLanguage("he");
  expect(screen.queryByTestId("split-advisory")).toBeNull();
  expect(screen.getByRole("group", { name: "פעולות זמינות" }).querySelectorAll("button")).toHaveLength(1);
  expect(response).toHaveBeenCalledExactlyOnceWith(groupId, "split_suggested");
  expect(finalize).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("finalize-anyway"));
  await waitFor(() => expect(finalize).toHaveBeenCalledExactlyOnceWith(groupId));
});

it("flows through joint Yes, summary and the complete catalog into a canonically linked Player after selection", async () => {
  localStorage.setItem("pic-web.locale.v1", "en");
  const groupId = await compositionRoot.groupEngineActions.createDraftGroup("גב Back");
  await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck צוואר");
  setGuestFlowSymptomAdditionComplete(true);
  const catalog = await compositionRoot.catalogActions.listTreatments();
  const treatment = catalog[2]!;
  const parsed = await compositionRoot.treatmentContentActions.getParsedTreatmentContent(treatment.id);
  const read = vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent");
  const start = vi.spyOn(compositionRoot.playerEngineActions, "startSession");
  render(<AppProviders><GuestFlowRouter /></AppProviders>);
  switchLanguage("he");
  fireEvent.click(screen.getByTestId("muscle-test-yes"));
  await waitFor(() => expect(screen.getByTestId("confirm-group-summary")).toBeTruthy());
  switchLanguage("en");
  fireEvent.click(screen.getByTestId("confirm-group-summary"));
  await waitFor(() => expect(screen.getByText("Open utilities to choose a treatment and optionally link it to this group."))
    .toBeTruthy());
  expect(screen.queryByTestId(`pick-treatment-${treatment.id}`)).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
  for (const item of catalog) expect(screen.getByTestId(`pick-treatment-${item.id}`).textContent).toBe(item.title);
  const link = screen.getByTestId("link-to-group-toggle") as HTMLInputElement;
  expect(link.checked).toBe(false);
  fireEvent.click(link);
  const validationReads = read.mock.calls.length;
  fireEvent.click(screen.getByRole("button", { name: "עברית" }));
  expect(screen.getByTestId("link-to-group-toggle")).toBe(link);
  expect(link.checked).toBe(true);
  expect(start).not.toHaveBeenCalled();
  expect(read).toHaveBeenCalledTimes(validationReads);
  expect(read.mock.calls.map(([id]) => id)).toEqual(catalog.map((item) => item.id));
  fireEvent.click(screen.getByTestId(`pick-treatment-${treatment.id}`));
  await waitFor(() => expect(screen.getByTestId("guest-flow-player")).toBeTruthy());
  expect(start).toHaveBeenCalledExactlyOnceWith(treatment.id, groupId, parsed.map((unit) => unit.unit_id));
});
