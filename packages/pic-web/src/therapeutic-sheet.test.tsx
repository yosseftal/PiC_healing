// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TherapeuticSheet } from "./therapeutic-sheet";

afterEach(() => {
  cleanup();
});

function renderSheet(onOpenChange = vi.fn()) {
  return render(
    <main data-testid="application">
      <button type="button">Background action</button>
      <TherapeuticSheet
        description="Choose a utility without leaving the active therapeutic frame."
        onOpenChange={onOpenChange}
        title="Session utilities"
        trigger={<span aria-hidden="true">⋯</span>}
        triggerLabel="Open session utilities"
      >
        <button type="button">First utility</button>
        <button type="button">Second utility</button>
      </TherapeuticSheet>
    </main>,
  );
}

describe("TherapeuticSheet", () => {
  it("exposes an accessible trigger and named modal context", () => {
    renderSheet();

    const trigger = screen.getByRole("button", { name: "Open session utilities" });
    expect(trigger.className).toContain("min-h-11");
    expect(trigger.className).toContain("min-w-11");

    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: "Session utilities" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText(/Choose a utility without leaving/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close session utilities" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Session utilities content" })).toBeTruthy();
  });

  it("makes background content inert while open and restores it after Escape", async () => {
    const onOpenChange = vi.fn();
    const { container } = renderSheet(onOpenChange);
    const trigger = screen.getByRole("button", { name: "Open session utilities" });

    fireEvent.click(trigger);
    expect(container.hasAttribute("inert")).toBe(true);
    expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.hasAttribute("inert")).toBe(false);
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(trigger);
    });
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it("dismisses from the overlay and restores focus to its trigger", async () => {
    renderSheet();
    const trigger = screen.getByRole("button", { name: "Open session utilities" });
    fireEvent.click(trigger);

    const overlay = screen.getByTestId("therapeutic-sheet-overlay");
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.pointerDown(overlay, { button: 0, pointerType: "mouse" });
    fireEvent.click(overlay);

    await vi.waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it("supports controlled open state and omits description semantics when absent", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <TherapeuticSheet
        onOpenChange={onOpenChange}
        open={false}
        title="Utilities"
        trigger="Open"
        triggerLabel="Open utilities"
      >
        <p>Utility content</p>
      </TherapeuticSheet>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <TherapeuticSheet
        onOpenChange={onOpenChange}
        open
        title="Utilities"
        trigger="Open"
        triggerLabel="Open utilities"
      >
        <p>Utility content</p>
      </TherapeuticSheet>,
    );

    expect(screen.getByRole("dialog", { name: "Utilities" }).hasAttribute("aria-describedby")).toBe(false);
  });
});
