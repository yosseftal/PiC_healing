// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HorizontalSlideContainer } from "./HorizontalSlideContainer";

const motionPreference = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => motionPreference.reduced,
  };
});

const orderedKeys = ["first", "second", "third"] as const;
const stylesheet = readFileSync(
  resolve(process.cwd(), "packages/pic-web/src/horizontal-slide-container.css"),
  "utf8",
);

afterEach(() => {
  cleanup();
  motionPreference.reduced = false;
  vi.restoreAllMocks();
});

function slide(activeKey: string, label: string, userInitiated = false) {
  return (
    <HorizontalSlideContainer
      activeKey={activeKey}
      orderedKeys={orderedKeys}
      stepLabel={label}
      userInitiated={userInitiated}
    >
      <button type="button">{label} action</button>
    </HorizontalSlideContainer>
  );
}

describe("HorizontalSlideContainer", () => {
  it("reports forward and backward movement from a stable controlled order", async () => {
    const view = render(slide("first", "First step"));
    const container = screen.getByTestId("horizontal-slide-container");

    expect(container.dataset.transitionDirection).toBe("neutral");
    expect(screen.getByRole("region", { name: "First step" }).dataset.enterFrom).toBe("none");

    view.rerender(slide("second", "Second step"));
    expect(container.dataset.transitionDirection).toBe("forward");
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "Second step" }).dataset.enterFrom).toBe("inline-end");
    });

    view.rerender(slide("first", "First step"));
    expect(container.dataset.transitionDirection).toBe("backward");
    await waitFor(() => {
      expect(screen.getByRole("region", { name: "First step" }).dataset.enterFrom).toBe("inline-start");
    });
  });

  it("uses neutral replacement for unknown and concurrently reordered keys", async () => {
    const view = render(slide("first", "First step"));

    view.rerender(
      <HorizontalSlideContainer activeKey="unknown" orderedKeys={orderedKeys} stepLabel="Unknown step">
        <p>Unknown</p>
      </HorizontalSlideContainer>,
    );
    expect(screen.getByTestId("horizontal-slide-container").dataset.transitionDirection).toBe("neutral");
    await screen.findByRole("region", { name: "Unknown step" });

    view.rerender(
      <HorizontalSlideContainer
        activeKey="second"
        orderedKeys={["third", "second", "first"]}
        stepLabel="Reordered step"
      >
        <p>Reordered</p>
      </HorizontalSlideContainer>,
    );
    expect(screen.getByTestId("horizontal-slide-container").dataset.transitionDirection).toBe("neutral");
    await screen.findByRole("region", { name: "Reordered step" });
  });

  it("accepts an explicit reflected direction without deriving navigation", async () => {
    const view = render(
      <HorizontalSlideContainer activeKey="first" direction="backward" stepLabel="First step">
        <p>First</p>
      </HorizontalSlideContainer>,
    );
    expect(screen.getByTestId("horizontal-slide-container").dataset.transitionDirection).toBe("neutral");

    view.rerender(
      <HorizontalSlideContainer activeKey="second" direction="backward" stepLabel="Second step">
        <p>Second</p>
      </HorizontalSlideContainer>,
    );

    expect(screen.getByTestId("horizontal-slide-container").dataset.transitionDirection).toBe("backward");
    const region = await screen.findByRole("region", { name: "Second step" });
    expect(region.dataset.enterFrom).toBe("inline-start");
  });

  it("makes exiting content inert and hidden before exposing the incoming child", async () => {
    const view = render(slide("first", "First step"));
    const outgoingAction = screen.getByRole("button", { name: "First step action" });

    view.rerender(slide("second", "Second step"));

    const outgoingRegion = outgoingAction.closest('[role="region"]');
    expect(outgoingRegion?.getAttribute("aria-hidden")).toBe("true");
    expect(outgoingRegion?.hasAttribute("inert")).toBe(true);
    expect(screen.queryByRole("button", { name: "First step action" })).toBeNull();
    await screen.findByRole("button", { name: "Second step action" });
  });

  it("focuses the incoming named region only for user-initiated movement", async () => {
    const onTransitionComplete = vi.fn();
    const view = render(
      <HorizontalSlideContainer
        activeKey="first"
        orderedKeys={orderedKeys}
        stepLabel="First step"
        onTransitionComplete={onTransitionComplete}
      >
        <p>First</p>
      </HorizontalSlideContainer>,
    );

    expect(document.activeElement).toBe(document.body);
    expect(onTransitionComplete).not.toHaveBeenCalled();

    view.rerender(
      <HorizontalSlideContainer
        activeKey="second"
        orderedKeys={orderedKeys}
        stepLabel="Second step"
        onTransitionComplete={onTransitionComplete}
      >
        <p>Second</p>
      </HorizontalSlideContainer>,
    );
    const secondRegion = await screen.findByRole("region", { name: "Second step" });
    await waitFor(() => expect(onTransitionComplete).toHaveBeenCalledTimes(1));
    expect(document.activeElement).not.toBe(secondRegion);

    view.rerender(
      <HorizontalSlideContainer
        activeKey="third"
        orderedKeys={orderedKeys}
        stepLabel="Third step"
        userInitiated
        onTransitionComplete={onTransitionComplete}
      >
        <p>Third</p>
      </HorizontalSlideContainer>,
    );
    const thirdRegion = await screen.findByRole("region", { name: "Third step" });
    await waitFor(() => expect(document.activeElement).toBe(thirdRegion));
    expect(onTransitionComplete).toHaveBeenLastCalledWith({
      activeKey: "third",
      direction: "forward",
    });
  });

  it("removes translation under reduced motion while preserving concise announcement", async () => {
    motionPreference.reduced = true;
    const view = render(slide("first", "First step"));

    view.rerender(slide("second", "Second step", true));

    const region = await screen.findByRole("region", { name: "Second step" });
    expect(region.dataset.translation).toBe("none");
    expect(screen.getByRole("status").textContent).toBe("Second step");
    await waitFor(() => expect(document.activeElement).toBe(region));
  });

  it("expresses geometry logically for RTL and exposes no navigation handlers", async () => {
    const view = render(<div dir="rtl">{slide("first", "First step")}</div>);
    view.rerender(<div dir="rtl">{slide("second", "Second step")}</div>);

    const container = screen.getByTestId("horizontal-slide-container");
    const region = await screen.findByRole("region", { name: "Second step" });
    expect(region.dataset.enterFrom).toBe("inline-end");
    expect(stylesheet).toMatch(
      /\.pic-horizontal-slide-container:dir\(rtl\)\s*\{[^}]*--pic-slide-inline-sign:\s*-1;/s,
    );
    expect(container.getAttributeNames().some((name) => /^on/i.test(name))).toBe(false);
    expect(region.hasAttribute("draggable")).toBe(false);

    fireEvent.wheel(container);
    fireEvent.keyDown(container, { key: "ArrowLeft" });
    fireEvent.touchMove(container);
    expect(screen.getByRole("region", { name: "Second step" })).toBe(region);
  });
});
