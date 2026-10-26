// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import {
  resetGuestFlowFactsForTest,
  setGuestFlowSymptomAdditionComplete, guestFlowFactsStore,
} from "./guest-flow-facts";
import { JointTreatmentMuscleTestStep } from "./JointTreatmentMuscleTestStep";
import { SymptomGroupSummaryScreen } from "./SymptomGroupSummaryScreen";

beforeEach(() => localStorage.setItem("pic-web.locale.v1", "en"));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  localStorage.clear();
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
      expect(screen.getByTestId("atomic-primary-content").textContent)
        .toBe("Is it right and accurate to treat the whole list together?");
      expect(screen.getByTestId("muscle-test-yes")).toBeTruthy();
      expect(screen.getByTestId("muscle-test-no")).toBeTruthy();
    });
  });

  it('"Yes" answer finalizes the group immediately with no further UI step', async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");
    await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck Pain");
    setGuestFlowSymptomAdditionComplete(true);

    renderMuscleTestStep(groupId);

    await waitFor(() => {
      expect(screen.getByTestId("muscle-test-yes")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("muscle-test-yes"));

    await waitFor(() => {
      expect(guestFlowFactsStore.getSnapshot().groupFinalized).toBe(true);
    });

    expect((await compositionRoot.groupEngineActions.getGroup(groupId))?.joint_treatment_muscle_test).toBe("together");
    expect(screen.queryByTestId("split-advisory")).toBeNull();
  });

  it('"No" answer shows a dismissible split suggestion but still allows finalize on demand', async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");
    await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck Pain");
    setGuestFlowSymptomAdditionComplete(true);

    renderMuscleTestStep(groupId);

    await waitFor(() => {
      expect(screen.getByTestId("muscle-test-no")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("muscle-test-no"));

    await waitFor(() => {
      expect(screen.getByTestId("split-advisory")).toBeTruthy();
      expect(screen.getByTestId("finalize-anyway")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("dismiss-split-advisory"));
    expect(screen.queryByTestId("split-advisory")).toBeNull();
    expect(screen.getByTestId("finalize-anyway")).toBeTruthy();

    fireEvent.click(screen.getByTestId("finalize-anyway"));

    await waitFor(() => {
      expect(guestFlowFactsStore.getSnapshot().groupFinalized).toBe(true);
    });
  });

  it("offers a visible retry when a muscle-test response needs another moment", async () => {
    const groupId = await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");
    await compositionRoot.groupEngineActions.addSymptom(groupId, "Neck Pain");
    setGuestFlowSymptomAdditionComplete(true);
    const provider = compositionRoot.repositoryPort.getProvider();
    vi.spyOn(provider, "saveGroup").mockRejectedValueOnce(new Error("temporarily unavailable"));

    renderMuscleTestStep(groupId);
    fireEvent.click(screen.getByTestId("muscle-test-yes"));

    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try this muscle test response again" })).toBeTruthy();
    });
    expect(screen.getByTestId("joint-treatment-muscle-test").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try this muscle test response again" }));

    await waitFor(() => {
      expect(guestFlowFactsStore.getSnapshot().groupFinalized).toBe(true);
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
      expect(screen.getByTestId("summary-symptom-symptom-1").textContent).toContain("Negative");
      expect(screen.getByTestId("summary-symptom-symptom-1").textContent).toContain("7/10");
      expect(screen.getByTestId("summary-muscle-test").textContent).toContain("together");
    });
  });
});
