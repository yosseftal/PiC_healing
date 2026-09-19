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
});
