// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
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
    expect(screen.getByTestId("terminal-nemar-yes").getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByTestId("terminal-nemar-no").getAttribute("aria-pressed")).not.toBe("true");
  });
});
