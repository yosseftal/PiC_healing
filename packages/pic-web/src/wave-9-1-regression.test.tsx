// @vitest-environment jsdom
/**
 * Wave 9.1 closing regression: Continuous Guidance (`unit-0`) is a first-class, playable Atomic Unit
 * through Player → Terminal NEMAR → Finish. No network; synthetic treatment id (not a seed UUID).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TERMINAL_NEMAR_UNIT_ID } from "pic-engine";
import { AppProviders } from "./app-providers";
import { compositionRoot, resetTreatmentContentCacheForTest } from "./composition-root";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { UnifiedPlayerScreen } from "./UnifiedPlayerScreen";

const CONTINUOUS_GUIDANCE_TREATMENT_ID = "wave-91-continuous-guidance-treatment";
const CONTINUOUS_GUIDANCE_PROSE =
  "Sit with both feet on the floor and notice the breath. Stay with that sensation.";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
  resetTreatmentContentCacheForTest();
});

describe("Wave 9.1 Continuous Guidance playability", () => {
  beforeEach(() => {
    resetGuestFlowFactsForTest();
    resetTreatmentContentCacheForTest();
  });

  it("plays Continuous Guidance through Terminal NEMAR Yes and Finish as a first-class Atomic Unit", async () => {
    vi.spyOn(compositionRoot.treatmentContentActions, "getParsedTreatmentContent").mockResolvedValue([
      {
        unit_id: "unit-0",
        unit_order: 0,
        unit_title: "Continuous Guidance",
        unit_content: CONTINUOUS_GUIDANCE_PROSE,
        unit_rationale: null,
      },
    ]);
    // Guest Finish is Persistence-Gated (DEC-017). This spy uses the authenticated passthrough
    // SessionEngine already implements (`onFinishRequested` → `playerEngine.finish`) so Finish writes
    // success without a network promotion — the only Finish path this no-network regression can take.
    vi.spyOn(compositionRoot.sessionEngineActions, "onFinishRequested").mockImplementation(
      async (sessionId, kind) => {
        if (kind === "finish") {
          await compositionRoot.playerEngineActions.finish(sessionId);
        }
      },
    );

    const sessionId = await compositionRoot.playerEngineActions.startSession(
      CONTINUOUS_GUIDANCE_TREATMENT_ID,
      null,
      ["unit-0"],
    );

    render(
      <AppProviders>
        <UnifiedPlayerScreen />
      </AppProviders>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("atomic-unit-title").textContent).toBe("Continuous Guidance");
    });
    expect(screen.getByTestId("atomic-unit-unit-0")).toBeTruthy();
    expect(screen.getByTestId("navigation-tree-jump-unit-0")).toBeTruthy();

    fireEvent.click(screen.getByTestId(`navigation-tree-jump-${TERMINAL_NEMAR_UNIT_ID}`));

    await waitFor(() => {
      expect(screen.getByTestId("terminal-nemar-unit")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("terminal-nemar-yes"));

    await waitFor(() => {
      expect(screen.getByTestId("finish-button")).toBeTruthy();
    });

    fireEvent.click(screen.getByTestId("finish-button"));

    await waitFor(async () => {
      const finished = await compositionRoot.repositoryPort.getPlayerSession(sessionId);
      expect(finished?.success_declared).toBe(true);
      expect(finished?.finished_at).not.toBeNull();
    });
  });
});
