// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import {
  resetGuestFlowFactsForTest,
  setGuestFlowSymptomAdditionComplete,
} from "./guest-flow-facts";
import { JointTreatmentMuscleTestStep } from "./JointTreatmentMuscleTestStep";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
});

function renderMuscleTestStep(groupId: string) {
  return render(
    <AppProviders>
      <JointTreatmentMuscleTestStep groupId={groupId} />
    </AppProviders>,
  );
}

describe("JointTreatmentMuscleTestStep", () => {
  it("renders nothing until all symptoms are added, then shows the yes/no muscle-test question", async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");

    renderMuscleTestStep(groupId);

    expect(screen.queryByTestId("joint-treatment-muscle-test")).toBeNull();

    setGuestFlowSymptomAdditionComplete(true);

    await waitFor(() => {
      expect(screen.getByTestId("joint-treatment-muscle-test")).toBeTruthy();
      expect(screen.getByText("Is it NEMAR to treat these symptoms together?")).toBeTruthy();
      expect(screen.getByTestId("muscle-test-yes")).toBeTruthy();
      expect(screen.getByTestId("muscle-test-no")).toBeTruthy();
    });
  });

  it('"Yes" answer finalizes the group immediately with no further UI step', async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");
    await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck Pain");
    setGuestFlowSymptomAdditionComplete(true);

    const setJointTreatmentMuscleTest = vi.spyOn(
      compositionRoot.groupEngineActions,
      "setJointTreatmentMuscleTest",
    );
    const finalizeGroup = vi.spyOn(compositionRoot.groupEngineActions, "finalizeGroup");

    renderMuscleTestStep(groupId);

    await waitFor(() => {
      expect(screen.getByTestId("muscle-test-yes")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("muscle-test-yes"));

    await waitFor(() => {
      expect(setJointTreatmentMuscleTest).toHaveBeenCalledWith(groupId, "together");
      expect(finalizeGroup).toHaveBeenCalledWith(groupId);
    });

    expect(screen.queryByTestId("split-advisory")).toBeNull();
    expect(screen.queryByTestId("finalize-anyway")).toBeNull();
  });

  it('"No" answer shows a dismissible split suggestion but still allows finalize on demand', async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");
    await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck Pain");
    setGuestFlowSymptomAdditionComplete(true);

    const setJointTreatmentMuscleTest = vi.spyOn(
      compositionRoot.groupEngineActions,
      "setJointTreatmentMuscleTest",
    );
    const finalizeGroup = vi.spyOn(compositionRoot.groupEngineActions, "finalizeGroup");

    renderMuscleTestStep(groupId);

    await waitFor(() => {
      expect(screen.getByTestId("muscle-test-no")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("muscle-test-no"));

    await waitFor(() => {
      expect(setJointTreatmentMuscleTest).toHaveBeenCalledWith(groupId, "split_suggested");
      expect(screen.getByTestId("split-advisory")).toBeTruthy();
      expect(screen.getByTestId("finalize-anyway")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("dismiss-split-advisory"));
    expect(screen.queryByTestId("split-advisory")).toBeNull();
    expect(screen.getByTestId("finalize-anyway")).toBeTruthy();

    fireEvent.click(screen.getByTestId("finalize-anyway"));

    await waitFor(() => {
      expect(finalizeGroup).toHaveBeenCalledWith(groupId);
    });
  });
});

describe("SymptomGroupSummaryScreen", () => {
  it("renders finalized group symptoms, polarities, intensities, and muscle-test result", async () => {
    const finalizedGroup = {
      id: "group-1",
      name: "Lower Back",
      symptoms: [
        {
          id: "symptom-1",
          name: "Neck Pain",
          polarity: "negative" as const,
          intensity: 7,
          rated_at: "2026-08-15T12:00:00.000Z",
        },
      ],
      created_at: "2026-08-15T11:00:00.000Z",
      joint_treatment_muscle_test: "together" as const,
      joint_treatment_test_at: "2026-08-15T12:30:00.000Z",
    };

    vi.spyOn(compositionRoot.groupEngineActions, "getGroup").mockResolvedValue(finalizedGroup);

    render(
      <AppProviders>
        <SymptomGroupSummaryScreen groupId="group-1" />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("guest-flow-group-summary")).toBeTruthy();
      expect(screen.getByTestId("summary-group-name").textContent).toBe("Lower Back");
      expect(screen.getByTestId("summary-symptom-symptom-1").textContent).toContain("Neck Pain");
      expect(screen.getByTestId("summary-symptom-symptom-1").textContent).toContain("negative");
      expect(screen.getByTestId("summary-symptom-symptom-1").textContent).toContain("7/10");
      expect(screen.getByTestId("summary-muscle-test").textContent).toContain("together");
    });
  });
});
