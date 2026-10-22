// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot } from "./composition-root";
import { RatingControl } from "./RatingControl";
import { SymptomGroupCreateScreen } from "./SymptomGroupCreateScreen";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

beforeEach(() => localStorage.setItem("pic-web.locale.v1", "en"));

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
  it("keeps unified editable rows local until a complete atomic Finish", async () => {
    renderCreateScreen();
    expect(screen.getByLabelText("List name (optional)")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Symptom name"), { target: { value: "Neck Pain" } });
    fireEvent.change(screen.getByLabelText("Interference / suffering intensity"), { target: { value: "1" } });
    fireEvent.click(screen.getByTestId("add-symptom-action"));
    expect(screen.getAllByLabelText("Symptom name")).toHaveLength(2);
    expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).toBeNull();
    expect(screen.queryByTestId("symptom-count")).toBeNull();
    fireEvent.change(screen.getAllByLabelText("Symptom name")[1]!, { target: { value: "Strength" } });
    fireEvent.change(screen.getAllByLabelText("Polarity")[1]!, { target: { value: "positive" } });
    fireEvent.change(screen.getByLabelText("Strength of the positive experience"), { target: { value: "10" } });
    fireEvent.click(screen.getByTestId("finish-symptom-addition"));
    await waitFor(() => expect(compositionRoot.groupEngineStore.getSnapshot().activeGroupId).not.toBeNull());
    const group = await compositionRoot.groupEngineActions.getGroup(
      compositionRoot.groupEngineStore.getSnapshot().activeGroupId!,
    );
    expect(group?.name).toBe("");
    expect(group?.symptoms.map((item) => [item.name, item.polarity, item.intensity])).toEqual([
      ["Neck Pain", "negative", 1], ["Strength", "positive", 10],
    ]);
    expect(group?.symptoms.every((item) => item.rated_at !== null)).toBe(true);
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
      expect(screen.getByTestId("revealed-prior-rating").textContent).toContain("Positive");
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

  it("immediately clears the revealed prior rating and affordance when the symptom changes", async () => {
    const hasPriorRating = vi
      .spyOn(compositionRoot.groupEngineActions, "hasPriorRating")
      .mockResolvedValueOnce(true);
    vi.spyOn(compositionRoot.groupEngineActions, "revealPriorRating").mockResolvedValue({
      polarity: "positive",
      intensity: 8,
    });

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
      expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("reveal-prior-rating"));
    await waitFor(() => {
      expect(screen.getByTestId("revealed-prior-rating")).toBeTruthy();
    });

    hasPriorRating.mockImplementationOnce(() => new Promise<boolean>(() => {}));
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

    expect(screen.queryByTestId("reveal-prior-rating")).toBeNull();
    expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  });

  it("ignores a delayed prior rating after switching to a different symptom", async () => {
    const hasPriorRating = vi
      .spyOn(compositionRoot.groupEngineActions, "hasPriorRating")
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    let resolveReveal!: (prior: { polarity: "positive"; intensity: 8 }) => void;
    const delayedReveal = new Promise<{ polarity: "positive"; intensity: 8 }>((resolve) => {
      resolveReveal = resolve;
    });
    const revealPriorRating = vi
      .spyOn(compositionRoot.groupEngineActions, "revealPriorRating")
      .mockReturnValueOnce(delayedReveal);

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
      expect(screen.getByTestId("reveal-prior-rating")).toBeTruthy();
    });
    fireEvent.click(screen.getByTestId("reveal-prior-rating"));
    expect(revealPriorRating).toHaveBeenCalledWith("symptom-a");

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
      expect(hasPriorRating).toHaveBeenCalledWith("symptom-b");
      expect(screen.queryByTestId("reveal-prior-rating")).toBeNull();
    });

    await act(async () => {
      resolveReveal({ polarity: "positive", intensity: 8 });
      await delayedReveal;
    });

    expect(screen.queryByTestId("revealed-prior-rating")).toBeNull();
  });
});
