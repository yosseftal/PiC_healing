// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AtomicActionLayout,
  AuthoredMarkdown,
  type ActionTuple,
  type BannerTuple,
} from "./AtomicActionLayout";

afterEach(cleanup);

describe("AtomicActionLayout", () => {
  it("renders zero actions without inventing a control", () => {
    render(<AtomicActionLayout primaryContent={<p>Pause and notice.</p>} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("preserves button, pressed, callback, and accessible-label semantics", () => {
    const onAction = vi.fn();
    const actions = [
      {
        kind: "button",
        label: "Yes",
        accessibleLabel: "Choose Yes",
        intent: "primary",
        pressed: true,
        onAction,
      },
    ] satisfies ActionTuple;

    render(<AtomicActionLayout primaryContent={<p>Choose what feels right.</p>} actions={actions} />);

    const button = screen.getByRole("button", { name: "Choose Yes" });
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(button.textContent).toContain("Selected");
    fireEvent.click(button);
    expect(onAction).toHaveBeenCalledOnce();
  });

  it("renders two ordered controls with native link and disabled semantics", () => {
    const actions = [
      {
        kind: "button",
        label: "Continue",
        intent: "secondary",
        disabled: true,
        onAction: vi.fn(),
      },
      {
        kind: "link",
        label: "Review guidance",
        intent: "secondary",
        href: "/guidance",
      },
    ] satisfies ActionTuple;

    render(<AtomicActionLayout primaryContent={<p>Take the time you need.</p>} actions={actions} />);

    const region = screen.getByRole("group", { name: "Available actions" });
    const controls = Array.from(region.querySelectorAll<HTMLElement>("button, a"));
    expect(controls.map((control) => control.textContent)).toEqual([
      "ContinueUnavailable",
      "Review guidance",
    ]);
    expect(controls.every((control) => control.style.minBlockSize === "var(--size-pic-touch)")).toBe(true);
    expect((within(region).getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(true);
    expect(within(region).getByRole("link", { name: "Review guidance" }).getAttribute("href")).toBe(
      "/guidance",
    );
  });

  it("renders zero, one, and two banners across every supported intent", () => {
    const { rerender } = render(<AtomicActionLayout primaryContent={<p>Steady content.</p>} />);
    expect(screen.queryAllByTestId("therapeutic-banner")).toHaveLength(0);

    const neutral = [
      { id: "neutral", intent: "neutral", content: "A quiet note." },
    ] satisfies BannerTuple;
    rerender(<AtomicActionLayout primaryContent={<p>Steady content.</p>} banners={neutral} />);
    expect(screen.getByTestId("therapeutic-banner").dataset.intent).toBe("neutral");

    const supportivePair = [
      { id: "confirmation", intent: "confirmation", content: "Your choice is recorded." },
      { id: "reflection", intent: "reflection", content: "Notice what is present." },
    ] satisfies BannerTuple;
    rerender(<AtomicActionLayout primaryContent={<p>Steady content.</p>} banners={supportivePair} />);
    expect(
      screen.getAllByTestId("therapeutic-banner").map((banner) => banner.dataset.intent),
    ).toEqual(["confirmation", "reflection"]);

    const recovery = [
      { id: "recovery", intent: "recovery", content: "This is ready for another try." },
    ] satisfies BannerTuple;
    rerender(<AtomicActionLayout primaryContent={<p>Steady content.</p>} banners={recovery} />);
    const recoveryStatus = screen.getByRole("status");
    expect(recoveryStatus.dataset.intent).toBe("recovery");
    expect(recoveryStatus.textContent).not.toMatch(/\b(?:failed|error|invalid)\b/i);
  });

  it("rejects prohibited failure framing in recovery copy during development", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const banners = [
      { id: "recovery", intent: "recovery", content: "An invalid request failed." },
    ] satisfies BannerTuple;

    expect(() =>
      render(<AtomicActionLayout primaryContent={<p>Steady content.</p>} banners={banners} />),
    ).toThrow(/positive and non-blocking/i);
  });

  it("rejects unintended interactive primary-content descendants during development", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() =>
      render(
        <AtomicActionLayout
          primaryContent={
            <div>
              <span>
                <button type="button">Competing action</button>
              </span>
            </div>
          }
        />,
      ),
    ).toThrow(/primary content contains an unintended interactive descendant/i);
  });

  it("rejects unintended interactive banner descendants during development", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const banners = [
      {
        id: "interactive",
        intent: "neutral",
        content: <input aria-label="Competing input" />,
      },
    ] satisfies BannerTuple;

    expect(() =>
      render(<AtomicActionLayout primaryContent={<p>Steady content.</p>} banners={banners} />),
    ).toThrow(/banner contains an unintended interactive descendant/i);
  });

  it("keeps semantic links from authored Markdown available", () => {
    render(
      <AtomicActionLayout
        primaryContent={
          <AuthoredMarkdown>
            <p>
              Read the <a href="/reference">supporting reference</a>.
            </p>
          </AuthoredMarkdown>
        }
      />,
    );

    expect(screen.getByRole("link", { name: "supporting reference" }).getAttribute("href")).toBe(
      "/reference",
    );
  });
});
