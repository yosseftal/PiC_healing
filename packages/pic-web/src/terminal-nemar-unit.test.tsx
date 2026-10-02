// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { TerminalNemarUnit } from "./TerminalNemarUnit";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
});

describe("TerminalNemarUnit", () => {
  it("renders no confirmation and no aria-pressed selection when response is null (AC3)", () => {
    render(
      <AppProviders>
        <TerminalNemarUnit sessionId="session-1" response={null} />
      </AppProviders>,
    );

    expect(screen.queryByTestId("terminal-nemar-response-recorded")).toBeNull();
    expect(screen.getByTestId("terminal-nemar-yes").getAttribute("aria-pressed")).not.toBe("true");
    expect(screen.getByTestId("terminal-nemar-no").getAttribute("aria-pressed")).not.toBe("true");
    expect(within(screen.getByRole("group", { name: "Available actions" })).getAllByRole("button"))
      .toHaveLength(2);
    expect(within(screen.getByTestId("atomic-primary-content")).queryAllByRole("button"))
      .toHaveLength(0);
    expect(screen.queryAllByTestId("therapeutic-banner")).toHaveLength(0);
  });

  it("confirms the Yes response was recorded and Finish is available (AC1)", () => {
    render(
      <AppProviders>
        <TerminalNemarUnit sessionId="session-1" response="yes" />
      </AppProviders>,
    );

    const recorded = screen.getByTestId("terminal-nemar-response-recorded");
    expect(recorded.getAttribute("role")).toBe("status");
    expect(recorded.textContent).not.toMatch(/error|failed|invalid/i);
    expect(recorded.textContent).toMatch(/yes/i);
    expect(recorded.textContent).toMatch(/finish/i);
    expect(screen.getByTestId("finish-button")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change response" })).toBeTruthy();
    expect(screen.queryByTestId("terminal-nemar-yes")).toBeNull();
    expect(screen.queryByTestId("terminal-nemar-no")).toBeNull();
    expect(screen.getAllByTestId("therapeutic-banner")).toHaveLength(1);
    expect(screen.getByTestId("therapeutic-banner").dataset.intent).toBe("confirmation");
  });

  it("confirms the No response was recorded as Integrating, never failure framing (AC2)", () => {
    render(
      <AppProviders>
        <TerminalNemarUnit sessionId="session-1" response="no" />
      </AppProviders>,
    );

    const recorded = screen.getByTestId("terminal-nemar-response-recorded");
    expect(recorded.getAttribute("role")).toBe("status");
    expect(recorded.textContent).not.toMatch(/error|failed|invalid/i);
    expect(recorded.textContent).toMatch(/no/i);
    expect(recorded.textContent).toMatch(/integrating/i);
    expect(recorded.textContent).toMatch(/finish anyway/i);
    expect(screen.getByRole("button", { name: "Change response" })).toBeTruthy();
    expect(screen.queryByTestId("finish-button")).toBeNull();
    expect(screen.queryByTestId("terminal-nemar-no")).toBeNull();
    expect(screen.getAllByTestId("therapeutic-banner")).toHaveLength(1);
    expect(screen.getByTestId("therapeutic-banner").dataset.intent).toBe("reflection");
    expect(within(screen.getByRole("group", { name: "Available actions" })).getAllByRole("button"))
      .toHaveLength(1);
  });

  it("reveals the two pressed choices without changing the reflected answer", () => {
    render(<AppProviders><TerminalNemarUnit sessionId="session-1" response="yes" /></AppProviders>);

    fireEvent.click(screen.getByRole("button", { name: "Change response" }));
    expect(screen.getByTestId("terminal-nemar-yes").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("terminal-nemar-no").getAttribute("aria-pressed")).toBe("false");
    expect(screen.queryByTestId("finish-button")).toBeNull();
  });
});
