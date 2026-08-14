// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { RatingControl } from "./RatingControl";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
});

function renderCreateScreen() {
  return render(
    <AppProviders>
      <SymptomGroupCreateScreen />
    </AppProviders>,
  );
}

describe("SymptomGroupCreateScreen", () => {
  it("renders SymptomGroupCreateScreen without throwing given an empty draft group", () => {
    expect(() => renderCreateScreen()).not.toThrow();
    expect(screen.getByTestId("guest-flow-create-group")).toBeTruthy();
    expect(screen.getByLabelText("Group name")).toBeTruthy();
  });

  it("calls groupEngine.addSymptom with the entered name when the add-symptom action is triggered", async () => {
    const addSymptom = vi
      .spyOn(compositionRoot.groupEngineActions, "addSymptom")
      .mockResolvedValue("symptom-1");
    const rate = vi.spyOn(compositionRoot.groupEngineActions, "rate").mockResolvedValue();

    await compositionRoot.groupEngineActions.createDraftGroup("Lower Back");

    renderCreateScreen();

    fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Neck Pain" } });
    fireEvent.click(screen.getByTestId("add-symptom-action"));

    await waitFor(() => {
      expect(addSymptom).toHaveBeenCalledWith(expect.any(String), "Neck Pain");
      expect(rate).toHaveBeenCalledWith("symptom-1", { polarity: "negative", intensity: 5 });
    });
  });
});

describe("RatingControl", () => {
  it(
    "calls groupEngine.rate with the selected polarity and intensity, " +
      "and never pre-fills a prior value unless Reveal was tapped",
    async () => {
    const hasPriorRating = vi
      .spyOn(compositionRoot.groupEngineActions, "hasPriorRating")
      .mockResolvedValue(true);
    const revealPriorRating = vi
      .spyOn(compositionRoot.groupEngineActions, "revealPriorRating")
      .mockResolvedValue({ polarity: "positive", intensity: 8 });
    const rate = vi.spyOn(compositionRoot.groupEngineActions, "rate").mockResolvedValue();
    const onPolarityChange = vi.fn();
    const onIntensityChange = vi.fn();

    render(
      <AppProviders>
        <RatingControl
          symptomId="symptom-prior"
          polarity="negative"
          intensity={3}
          onPolarityChange={onPolarityChange}
          onIntensityChange={onIntensityChange}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(hasPriorRating).toHaveBeenCalledWith("symptom-prior");
      expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy();
    });

    expect((screen.getByLabelText("Polarity") as HTMLSelectElement).value).toBe("negative");
    expect(screen.getByTestId("rating-intensity-value").textContent).toBe("3");
    expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();

    fireEvent.change(screen.getByLabelText("Polarity"), { target: { value: "positive" } });
    fireEvent.change(screen.getByLabelText("Intensity"), { target: { value: "7" } });
    expect(onPolarityChange).toHaveBeenCalledWith("positive");
    expect(onIntensityChange).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByTestId("reveal-prior-rating"));

    await waitFor(() => {
      expect(revealPriorRating).toHaveBeenCalledWith("symptom-prior");
      expect(screen.getByTestId("revealed-prior-rating").textContent).toContain("positive");
      expect(screen.getByTestId("revealed-prior-rating").textContent).toContain("8/10");
    });

    expect(rate).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Polarity") as HTMLSelectElement).value).toBe("negative");
    expect(screen.getByTestId("rating-intensity-value").textContent).toBe("3");
  });

  it("shows a Reveal affordance only when groupEngine.hasPriorRating resolves true", async () => {
    const hasPriorRating = vi.spyOn(compositionRoot.groupEngineActions, "hasPriorRating");

    hasPriorRating.mockResolvedValueOnce(false);
    const { rerender } = render(
      <AppProviders>
        <RatingControl
          symptomId="symptom-a"
          polarity="negative"
          intensity={2}
          onPolarityChange={() => {}}
          onIntensityChange={() => {}}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(hasPriorRating).toHaveBeenCalledWith("symptom-a");
    });
    expect(screen.queryByTestId("reveal-prior-rating")).toBeNull();

    hasPriorRating.mockResolvedValueOnce(true);
    rerender(
      <AppProviders>
        <RatingControl
          symptomId="symptom-b"
          polarity="negative"
          intensity={2}
          onPolarityChange={() => {}}
          onIntensityChange={() => {}}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy();
    });
  });
});
