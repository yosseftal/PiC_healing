// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  TherapeuticContentCard,
  TherapeuticFrame,
  TherapeuticTableScroller,
} from "./TherapeuticFrame";

afterEach(() => {
  cleanup();
});

describe("TherapeuticFrame", () => {
  it("exposes one named viewport and stage while preserving header slots", () => {
    render(
      <TherapeuticFrame
        eyebrow="Inquiry"
        progress={<span>Step 2 of 4</span>}
        quietStatus={<span>Saved locally</span>}
        stageLabel="Active guidance"
        title="A calm next step"
        utilityTrigger={<button type="button">Open tools</button>}
      >
        <p>Current guidance</p>
      </TherapeuticFrame>,
    );

    const frame = screen.getByRole("region", { name: "A calm next step" });
    const stage = within(frame).getByRole("region", { name: "Active guidance" });

    expect(within(frame).getByRole("heading", { name: "A calm next step", level: 1 })).toBeTruthy();
    expect(within(frame).getByText("Inquiry")).toBeTruthy();
    expect(within(frame).getByText("Step 2 of 4")).toBeTruthy();
    expect(within(frame).getByText("Saved locally")).toBeTruthy();
    expect(within(frame).getByRole("button", { name: "Open tools" })).toBeTruthy();
    expect(within(stage).getByText("Current guidance")).toBeTruthy();
  });

  it("accepts an external accessible name and restores document scrolling on unmount", () => {
    document.documentElement.style.overflow = "auto";
    document.body.style.overflow = "visible";

    const { unmount } = render(
      <>
        <h2 id="external-frame-title">Externally named frame</h2>
        <TherapeuticFrame aria-labelledby="external-frame-title" stageLabel="External stage">
          <p>Current guidance</p>
        </TherapeuticFrame>
      </>,
    );

    expect(screen.getByRole("region", { name: "Externally named frame" })).toBeTruthy();
    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.documentElement.style.overflow).toBe("auto");
    expect(document.body.style.overflow).toBe("visible");
  });
});

describe("TherapeuticContentCard", () => {
  it("provides named vertical and table-local horizontal scroll regions", () => {
    render(
      <TherapeuticContentCard aria-label="Long guidance">
        <p>Read at a comfortable pace.</p>
        <TherapeuticTableScroller aria-label="Treatment comparison">
          <table>
            <tbody>
              <tr>
                <td>One</td>
                <td>Two</td>
              </tr>
            </tbody>
          </table>
        </TherapeuticTableScroller>
      </TherapeuticContentCard>,
    );

    const card = screen.getByRole("region", { name: "Long guidance" });
    const tableRegion = within(card).getByRole("region", { name: "Treatment comparison" });

    expect(within(card).getByText("Read at a comfortable pace.")).toBeTruthy();
    expect(within(tableRegion).getByRole("table")).toBeTruthy();
    expect(card.tabIndex).toBe(0);
    expect(tableRegion.tabIndex).toBe(0);
  });
});
