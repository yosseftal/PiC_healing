// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("TreatmentPickerScreen", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
  });

  it("renders the flat treatment list without throwing given a seed list of treatments", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "treatment-a", title: "Alpha Treatment" },
      { id: "treatment-b", title: "Beta Treatment" },
    ]);

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("treatment-list")).toBeTruthy();
    });
    expect(screen.getByText("Alpha Treatment")).toBeTruthy();
    expect(screen.getByText("Beta Treatment")).toBeTruthy();
  });

  it("calls playerEngine.startSession with the selected treatment id and null when no group link is chosen", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "treatment-a", title: "Alpha Treatment" },
    ]);
    const startSession = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-1");

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => screen.getByTestId("pick-treatment-treatment-a"));
    fireEvent.click(screen.getByTestId("pick-treatment-treatment-a"));

    expect(startSession).toHaveBeenCalledWith("treatment-a", null, ["intro", "practice"]);
  });

  it("calls playerEngine.startSession with the selected treatment id and the group id when the link toggle is on", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "treatment-a", title: "Alpha Treatment" },
    ]);
    const startSession = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-1");
    await compositionRoot.groupEngineActions.createDraftGroup("Back");

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => screen.getByTestId("link-to-group-toggle"));
    fireEvent.click(screen.getByTestId("link-to-group-toggle"));
    fireEvent.click(screen.getByTestId("pick-treatment-treatment-a"));

    expect(startSession).toHaveBeenCalledWith(
      "treatment-a",
      compositionRoot.groupEngineStore.getSnapshot().activeGroupId,
      ["intro", "practice"],
    );
  });
});
