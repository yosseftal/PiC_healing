// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest } from "./composition-root";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";
import { ZERO_H3_GUARD_MESSAGE } from "./zero-h3-guard-message";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetTreatmentContentCacheForTest();
});

describe("TreatmentPickerScreen", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
    resetTreatmentContentCacheForTest();
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

  it("calls playerEngine.startSession with parsed unit ids when content resolves", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "treatment-a", title: "Alpha Treatment" },
    ]);
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "Step One",
        unit_content: "Body one.",
        unit_rationale: null,
      },
      {
        unit_id: "unit-2",
        unit_order: 2,
        unit_title: "Step Two",
        unit_content: "Body two.",
        unit_rationale: null,
      },
    ]);
    const startSession = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-1");

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => screen.getByTestId("pick-treatment-treatment-a"));
    fireEvent.click(screen.getByTestId("pick-treatment-treatment-a"));

    await waitFor(() => {
      expect(startSession).toHaveBeenCalledWith("treatment-a", null, ["unit-1", "unit-2"]);
    });
  });

  it("calls playerEngine.startSession with the selected treatment id and the group id when the link toggle is on", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "treatment-a", title: "Alpha Treatment" },
    ]);
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "Step One",
        unit_content: "Body one.",
        unit_rationale: null,
      },
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

    await waitFor(() => {
      expect(startSession).toHaveBeenCalledWith(
        "treatment-a",
        compositionRoot.groupEngineStore.getSnapshot().activeGroupId,
        ["unit-1"],
      );
    });
  });

  it("shows the Zero-H3 guard and never calls startSession when parsed content is empty", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "empty-treatment", title: "Empty Treatment" },
    ]);
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([]);
    const startSession = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-1");

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => screen.getByTestId("pick-treatment-empty-treatment"));
    fireEvent.click(screen.getByTestId("pick-treatment-empty-treatment"));

    await waitFor(() => {
      expect(screen.getByTestId("zero-h3-guard-empty-treatment").textContent).toBe(ZERO_H3_GUARD_MESSAGE);
    });
    expect(startSession).not.toHaveBeenCalled();
  });
});
