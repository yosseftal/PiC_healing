// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest } from "./composition-root";
import { TreatmentPickerScreen } from "./TreatmentPickerScreen";
import { useAsyncAction } from "./use-async-action";
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

  it("calls startSession with unit-0 when non-empty zero-H3 prose resolves to Continuous Guidance", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "prose-treatment", title: "Prose Treatment" },
    ]);
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-0",
        unit_order: 0,
        unit_title: "Continuous Guidance",
        unit_content: "Some plain prose treatment with no headers.",
        unit_rationale: null,
      },
    ]);
    const startSession = vi.spyOn(compositionRoot.playerEngineActions, "startSession").mockResolvedValue("session-1");

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => screen.getByTestId("pick-treatment-prose-treatment"));
    fireEvent.click(screen.getByTestId("pick-treatment-prose-treatment"));

    await waitFor(() => {
      expect(startSession).toHaveBeenCalledWith("prose-treatment", null, ["unit-0"]);
    });
    expect(screen.queryByTestId("zero-h3-guard-prose-treatment")).toBeNull();
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

  it("shows the Zero-H3 guard and never calls startSession when parsed content is genuinely empty", async () => {
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

  it("renders the shared ZERO_H3_GUARD_MESSAGE constant rather than a forked string literal", async () => {
    vi.spyOn(compositionRoot.catalogActions, "listTreatments").mockResolvedValue([
      { id: "empty-treatment", title: "Empty Treatment" },
    ]);
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([]);

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

    const pickerSource = readFileSync(
      join(process.cwd(), "packages/pic-web/src/TreatmentPickerScreen.tsx"),
      "utf8",
    );
    expect(pickerSource).toMatch(/import \{ ZERO_H3_GUARD_MESSAGE \} from "\.\/zero-h3-guard-message";/);
    expect(pickerSource).not.toContain(ZERO_H3_GUARD_MESSAGE);
  });

  it("offers a visible retry when the treatment list needs to reconnect", async () => {
    const listTreatments = vi
      .spyOn(compositionRoot.catalogActions, "listTreatments")
      .mockRejectedValueOnce(new Error("temporarily unavailable"))
      .mockResolvedValueOnce([{ id: "treatment-a", title: "Alpha Treatment" }]);

    render(
      <AppProviders>
        <TreatmentPickerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Try loading treatments again" })).toBeTruthy();
    });
    expect(screen.getByTestId("guest-flow-pick-treatment").textContent).not.toMatch(/error|failed|invalid/i);

    fireEvent.click(screen.getByRole("button", { name: "Try loading treatments again" }));

    await waitFor(() => {
      expect(listTreatments).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Alpha Treatment")).toBeTruthy();
    });
  });
});

describe("useAsyncAction", () => {
  it("catches a rejection and retries the same action", async () => {
    let attempts = 0;
    const action = vi.fn(async (_value: string) => {
      attempts += 1;
      if (attempts === 1) {
        throw new Error("temporarily unavailable");
      }
    });
    const { result } = renderHook(() => useAsyncAction(action));

    await act(async () => {
      await result.current.run("healing");
    });

    expect(result.current.status).toBe("recovery");

    await act(async () => {
      await result.current.retry();
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(action).toHaveBeenNthCalledWith(2, "healing");
    expect(result.current.status).toBe("idle");
  });
});
