// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "../app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest } from "../composition-root";
import { TreatmentPickerScreen } from "../TreatmentPickerScreen";
import { AtomicUnitView } from "../AtomicUnitView";
import { LanguageSelector } from "../i18n/language-selector";
import { parseStructuredMarkdown, TRACER_BULLET_SEED_TREATMENT_ROWS } from "pic-engine";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetTreatmentContentCacheForTest();
  localStorage.clear();
});

it("retains canonical guidance when source metadata cannot be validated", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent")
    .mockResolvedValue(parseStructuredMarkdown(source.structured_markdown));
  vi.spyOn(compositionRoot.treatmentContentActions, "getTreatmentContentSource")
    .mockRejectedValue(new Error("metadata unavailable"));
  render(<AppProviders><AtomicUnitView sessionId="session" treatmentId={source.id}
    unit={{ unit_id: "unit-1", state: "in_view" }} /></AppProviders>);
  await waitFor(() => expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness"));
  expect(screen.getByTestId("atomic-unit-content").getAttribute("lang")).toBe("");
  expect(screen.getByTestId("content-availability-notice").textContent).toContain("תרגום מאושר אינו זמין");
});

it("uses the latest locale when delayed canonical content resolves after a rapid round trip", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown(source.structured_markdown);
  let release: (value: typeof units) => void = () => { throw new Error("missing release"); };
  const pending = new Promise<typeof units>((resolve) => { release = resolve; });
  const parsed = vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockReturnValue(pending);
  const sourceRead = vi.spyOn(compositionRoot.treatmentContentActions, "getTreatmentContentSource").mockResolvedValue(source);
  const advance = vi.spyOn(compositionRoot.playerEngineActions, "advance");
  const jump = vi.spyOn(compositionRoot.playerEngineActions, "jumpTo");
  render(<AppProviders><AtomicUnitView sessionId="session" treatmentId={source.id}
    unit={{ unit_id: "unit-1", state: "in_view" }} /><LanguageSelector /></AppProviders>);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "עברית" }));
  await act(async () => { release(units); await pending; });
  await waitFor(() => expect(screen.getByTestId("atomic-unit-title").textContent).toBe("התמקמות בשקט"));
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness");
  expect(parsed).toHaveBeenCalledTimes(1);
  expect(sourceRead).toHaveBeenCalledTimes(1);
  expect(advance).not.toHaveBeenCalled();
  expect(jump).not.toHaveBeenCalled();
});

it("discards delayed content for a previous treatment identity", async () => {
  const first = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const second = TRACER_BULLET_SEED_TREATMENT_ROWS[1]!;
  const firstUnits = parseStructuredMarkdown(first.structured_markdown);
  let release: (units: typeof firstUnits) => void = () => {};
  const pending = new Promise<typeof firstUnits>((resolve) => { release = resolve; });
  vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockImplementation((id) =>
    id === first.id ? pending : Promise.resolve(parseStructuredMarkdown(second.structured_markdown)));
  vi.spyOn(compositionRoot.treatmentContentActions, "getTreatmentContentSource").mockImplementation((id) =>
    Promise.resolve(id === first.id ? first : second));
  const view = (id: string) => <AppProviders><AtomicUnitView sessionId="same-session" treatmentId={id}
    unit={{ unit_id: "unit-1", state: "in_view" }} /></AppProviders>;
  const rendered = render(view(first.id));
  rendered.rerender(view(second.id));
  await waitFor(() => expect(screen.getByTestId("atomic-unit-title").textContent).toBe("לחוש את הקרקע"));
  await act(async () => { release(firstUnits); await pending; });
  expect(screen.getByTestId("atomic-unit-title").textContent).toBe("לחוש את הקרקע");
});

it("localizes the system Continuous Guidance title without changing its unit-0 body or empty-source guard", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  const units = parseStructuredMarkdown("My authored prose");
  vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue(units);
  render(<AppProviders><AtomicUnitView sessionId="session" treatmentId={source.id}
    unit={{ unit_id: "unit-0", state: "in_view" }} /><LanguageSelector /></AppProviders>);
  await waitFor(() => expect(screen.getByTestId("atomic-unit-title").textContent).toBe("הנחיה רציפה"));
  expect(screen.getByTestId("atomic-unit-content").textContent).toBe("My authored prose");
  expect(units[0]?.unit_title).toBe("Continuous Guidance");
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Continuous Guidance");
  expect(screen.getByTestId("atomic-unit-content").textContent).toBe("My authored prose");
});

it("localizes approved picker titles and Player guidance with canonical startup IDs and no locale read", async () => {
  const source = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;
  vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
    { id: source.id, title: source.title }, { id: "personal", title: "My own wording" },
  ]);
  const read = vi.spyOn(compositionRoot.repositoryPort, "getTreatment");
  const start = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session");
  render(<AppProviders><TreatmentPickerScreen />
    <AtomicUnitView sessionId="session" treatmentId={source.id}
      unit={{ unit_id: "unit-1", state: "in_view" }} /><LanguageSelector />
  </AppProviders>);
  fireEvent.click(screen.getByRole("button", { name: "פתיחת הכלים" }));
  await waitFor(() => expect(screen.getByTestId(`pick-treatment-${source.id}`).textContent)
    .toBe("הרגעת מערכת העצבים"));
  expect(screen.getByTestId("atomic-unit-title").textContent).toBe("התמקמות בשקט");
  expect(screen.getByTestId("atomic-unit-content").getAttribute("lang")).toBe("he");
  expect(read).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByTestId(`pick-treatment-${source.id}`));
  await waitFor(() => expect(start).toHaveBeenCalledWith(source.id, null, ["unit-1", "unit-2", "unit-3"]));
  fireEvent.click(screen.getAllByRole("button", { name: "English" })[0]!);
  expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness");
  expect(screen.getByTestId("atomic-unit-content").getAttribute("lang")).toBe("en");
  expect(read).toHaveBeenCalledTimes(1);
  expect(start).toHaveBeenCalledTimes(1);
});
