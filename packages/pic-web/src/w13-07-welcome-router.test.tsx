// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { GuestFlowRouter } from "./guest-flow-router";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

beforeEach(() => localStorage.setItem("pic-web.locale.v1", "en"));
afterEach(() => {
  cleanup();
  resetGuestFlowFactsForTest();
  localStorage.clear();
  sessionStorage.clear();
});

describe("W13-07 welcome and help routing", () => {
  it("starts at welcome, then returns from free guide to the exact questionnaire draft", async () => {
    render(<AppProviders><GuestFlowRouter /></AppProviders>);
    expect(await screen.findByTestId("welcome-screen")).toBeTruthy();
    expect(screen.getByText(/ברוכה הבאה ל־PIC/)).toBeTruthy();

    fireEvent.click(screen.getByTestId("welcome-start"));
    const title = await screen.findByLabelText("List name (optional)") as HTMLInputElement;
    const topic = screen.getByLabelText("Symptom name") as HTMLInputElement;
    fireEvent.change(title, { target: { value: "My current inquiry" } });
    fireEvent.change(topic, { target: { value: "My blank-intent draft" } });

    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    fireEvent.click(screen.getByTestId("education-guide-trigger"));
    expect(await screen.findByTestId("education-guide")).toBeTruthy();
    expect(screen.getByText(/מבחן שרירים הוא אחד הכלים/)).toBeTruthy();
    expect(screen.queryByTitle("Method demonstration")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Return" }));
    await waitFor(() => expect((screen.getByLabelText("List name (optional)") as HTMLInputElement).value)
      .toBe("My current inquiry"));
    expect((screen.getByLabelText("Symptom name") as HTMLInputElement).value).toBe("My blank-intent draft");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByTestId("education-guide-trigger")));
  });

  it("does not replace an existing group with fresh onboarding", async () => {
    const { compositionRoot } = await import("./composition-root");
    await compositionRoot.groupEngineActions.createDraftGroup("Existing inquiry");
    render(<AppProviders><GuestFlowRouter /></AppProviders>);

    expect(await screen.findByTestId("guest-flow-create-group")).toBeTruthy();
    expect(screen.queryByTestId("welcome-screen")).toBeNull();
  });
});
