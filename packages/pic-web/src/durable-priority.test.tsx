// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { LocalGuestRepository } from "pic-adapter-local-guest";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

afterEach(() => { cleanup(); vi.restoreAllMocks(); resetGuestFlowFactsForTest(); localStorage.clear(); });

async function prepare(locale = "en") {
  localStorage.setItem("pic-web.locale.v1", locale);
  const actions = compositionRoot.groupEngineActions;
  const id = await actions.createDraftGroup("My priorities");
  for (const [name, intensity] of [["Back", 9], ["Neck", 3], ["Sleep", 0]] as const) {
    const symptom = await actions.addSymptom(id, name);
    await actions.rate(symptom, { polarity: "negative", intensity });
  }
  await actions.setJointTreatmentMuscleTest(id, "together");
  await actions.finalizeGroup(id);
  const before = (await actions.getGroup(id))!;
  render(<AppProviders><SymptomGroupSummaryScreen groupId={id} /></AppProviders>);
  await screen.findByTestId(`summary-symptom-${before.symptoms[2]!.id}`);
  return { id, before, actions };
}

it.each(["en", "he"])("moves a committed topic through composition with focus and unchanged data in %s", async (locale) => {
  const { id, before } = await prepare(locale);
  const upLabel = locale === "en" ? "Move topic up" : "העלאת הנושא בסדר העדיפות";
  const announcement = locale === "en" ? "Topic moved to priority " : "הנושא עבר לסדר עדיפות ";
  const last = before.symptoms[2]!;
  const row = screen.getByTestId(`summary-symptom-${last.id}`);
  const up = within(row).getByRole("button", { name: upLabel });
  up.focus();
  fireEvent.click(up);
  await waitFor(() => expect(screen.getByTestId("priority-announcement").textContent).toBe(announcement + "2"));
  expect(document.activeElement?.closest("li")).toBe(row);
  fireEvent.click(within(row).getByRole("button", { name: upLabel }));
  await waitFor(() => expect(screen.getByTestId("priority-announcement").textContent).toBe(announcement + "1"));
  expect(document.activeElement?.closest("li")).toBe(row);
  expect((within(row).getByRole("button", { name: upLabel }) as HTMLButtonElement).disabled).toBe(true);
  const stored = await new LocalGuestRepository().getGroup(id);
  expect(stored?.symptoms).toEqual([last, before.symptoms[0], before.symptoms[1]]);
  expect(stored?.joint_treatment_test_at).toBe(before.joint_treatment_test_at);
  expect(stored?.joint_treatment_muscle_test).toBe("together");
});

it("shows committed order only and retries a lost successful response without moving the topic twice", async () => {
  const { id, before } = await prepare();
  const provider = compositionRoot.repositoryPort.getProvider();
  const original = provider.reorderSymptoms.bind(provider);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const write = vi.spyOn(provider, "reorderSymptoms").mockImplementationOnce(async (...args) => {
    await held;
    await original(...args);
    throw new Error("Response lost");
  });
  const last = before.symptoms[2]!;
  const row = screen.getByTestId(`summary-symptom-${last.id}`);
  fireEvent.click(within(row).getByRole("button", { name: "Move topic up" }));
  await waitFor(() => expect(write).toHaveBeenCalledOnce());
  expect(row.querySelector("p")?.textContent).toBe("Priority 3");
  expect(screen.getByTestId("priority-announcement").textContent).toBe("");
  await act(async () => { release(); await held; });
  await screen.findByRole("button", { name: "Try this priority change again" });
  expect(row.querySelector("p")?.textContent).toBe("Priority 2");
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  expect(screen.getByTestId("priority-announcement").textContent).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Try this priority change again" }));
  await waitFor(() => expect(screen.getByTestId("priority-announcement").textContent).toBe("Topic moved to priority 2"));
  expect(write.mock.calls[1]![1]).toEqual(write.mock.calls[0]![1]);
  expect(write.mock.calls[1]![2]).toBe(before.revision! + 1);
  expect((await new LocalGuestRepository().getGroup(id))?.revision).toBe(before.revision! + 1);
  expect(document.activeElement?.closest("li")).toBe(row);
});

it("refreshes a conflict and keeps its exact requested permutation for explicit retry with newer ratings", async () => {
  const { id, before, actions } = await prepare();
  const last = before.symptoms[2]!;
  await act(async () => { await actions.rate(last.id, { intensity: 6, polarity: "positive" }); });
  const row = screen.getByTestId(`summary-symptom-${last.id}`);
  fireEvent.click(within(row).getByRole("button", { name: "Move topic up" }));
  await screen.findByText("The list changed. The current order is shown and your request is retained for retry.");
  expect(row.querySelector("p")?.textContent).toBe("Priority 3");
  expect(screen.getByTestId("priority-announcement").textContent).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Try this priority change again" }));
  await waitFor(() => expect(screen.getByTestId("priority-announcement").textContent).toBe("Topic moved to priority 2"));
  const stored = await new LocalGuestRepository().getGroup(id);
  expect(stored?.symptoms.map(({ id }) => id)).toEqual([before.symptoms[0]!.id, last.id, before.symptoms[1]!.id]);
  expect(stored?.symptoms[1]).toMatchObject({ id: last.id, intensity: 6, polarity: "positive" });
});

it("retains an incompatible permutation after a concurrent append until the Event Manager cancels it", async () => {
  const { id, before, actions } = await prepare();
  const last = before.symptoms[2]!;
  await act(async () => { await actions.addSymptom(id, "New concern"); });
  fireEvent.click(within(screen.getByTestId(`summary-symptom-${last.id}`)).getByRole("button", { name: "Move topic up" }));
  await screen.findByRole("button", { name: "Try this priority change again" });
  expect(screen.getByText("New concern")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Try this priority change again" }));
  await screen.findByText("The change is not confirmed. Your request is retained for retry.");
  expect(screen.queryByTestId("confirm-group-summary")).toBeNull();
  expect((await actions.getGroup(id))?.symptoms.map(({ name }) => name)).toEqual(["Back", "Neck", "Sleep", "New concern"]);
  fireEvent.click(screen.getByRole("button", { name: "Cancel this request and review the order" }));
  expect(screen.getByTestId("confirm-group-summary")).toBeTruthy();
});
