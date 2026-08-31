// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TRACER_BULLET_SEED_TREATMENT_ROWS } from "pic-engine";
import { AppProviders } from "./app-providers";
import { AtomicUnitView } from "./AtomicUnitView";
import { compositionRoot, resetTreatmentContentCacheForTest } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";

const seedTreatment = TRACER_BULLET_SEED_TREATMENT_ROWS[0]!;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  resetTreatmentContentCacheForTest();
});

describe("AtomicUnitView", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
    resetTreatmentContentCacheForTest();
  });

  it("renders real unit title and markdown content from the Guest bundled catalog", async () => {
    render(
      <AppProviders>
        <AtomicUnitView
          sessionId="session-1"
          treatmentId={seedTreatment.id}
          unit={{ unit_id: "unit-1", state: "in_view" }}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Settle Into Stillness");
    });
    expect(screen.getByTestId("atomic-unit-content").textContent).toMatch(/three slow breaths/i);
  });

  it("renders GFM markdown features when present in fixture content", async () => {
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-gfm",
        unit_order: 1,
        unit_title: "GFM Fixture",
        unit_content: "| Col | Val |\n| --- | --- |\n| A | ~~old~~ new |\n\n- [x] done",
        unit_rationale: null,
      },
    ]);
    render(
      <AppProviders>
        <AtomicUnitView
          sessionId="session-1"
          treatmentId="fixture-treatment"
          unit={{ unit_id: "unit-gfm", state: "in_view" }}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeTruthy();
    });
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText("new")).toBeTruthy();
  });

  it("renders GFM table, checked task, and strikethrough-adjacent text from bundled Guest seed", async () => {
    const grounding = TRACER_BULLET_SEED_TREATMENT_ROWS[1]!;
    render(
      <AppProviders>
        <AtomicUnitView
          sessionId="session-1"
          treatmentId={grounding.id}
          unit={{ unit_id: "unit-3", state: "in_view" }}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByRole("table")).toBeTruthy();
    });
    const taskBoxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(taskBoxes.some((box) => box.checked)).toBe(true);
    expect(screen.getByText("Felt both feet on the floor")).toBeTruthy();
    expect(screen.getByText("Grounded")).toBeTruthy();
  });

  it("does not render unit_rationale anywhere in the tree", async () => {
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-rationale",
        unit_order: 1,
        unit_title: "With Rationale",
        unit_content: "Primary body.",
        unit_rationale: "Hidden deepening note.",
      },
    ]);
    const { container } = render(
      <AppProviders>
        <AtomicUnitView
          sessionId="session-1"
          treatmentId="fixture-treatment"
          unit={{ unit_id: "unit-rationale", state: "in_view" }}
        />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByText("Primary body.")).toBeTruthy();
    });
    expect(container.textContent).not.toContain("Hidden deepening note.");
  });

  it("renders content when the fetch resolves after the initial mount", async () => {
    let resolveContent: ((units: import("pic-engine").AtomicUnitContent[]) => void) | undefined;
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveContent = resolve;
        }),
    );

    render(
      <AppProviders>
        <AtomicUnitView
          sessionId="session-1"
          treatmentId="slow-treatment"
          unit={{ unit_id: "unit-1", state: "in_view" }}
        />
      </AppProviders>,
    );

    resolveContent?.([
      {
        unit_id: "unit-1",
        unit_order: 1,
        unit_title: "Late Content",
        unit_content: "Arrives later.",
        unit_rationale: null,
      },
    ]);

    await waitFor(() => {
      expect(screen.getByText("Arrives later.")).toBeTruthy();
    });
  });
});
