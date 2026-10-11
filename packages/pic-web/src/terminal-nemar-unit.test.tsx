// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AppProviders } from "./app-providers";
import { resetGuestFlowFactsForTest } from "./guest-flow-facts";
import { TerminalNemarUnit } from "./TerminalNemarUnit";
import { LanguageSelector } from "./i18n/language-selector";
import { compositionRoot } from "./composition-root";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetGuestFlowFactsForTest();
});

describe("TerminalNemarUnit", () => {
  beforeEach(() => localStorage.setItem("pic-web.locale.v1", "en"));

  it("replaces the focused Yes control when the reflected action becomes sovereign Finish", () => {
    const { rerender } = render(<AppProviders>
      <TerminalNemarUnit sessionId="session-1" response={null} />
    </AppProviders>);
    const yes = screen.getByTestId("terminal-nemar-yes");
    yes.focus();
    rerender(<AppProviders><TerminalNemarUnit sessionId="session-1" response="yes" /></AppProviders>);
    const finish = screen.getByTestId("finish-button");
    expect(finish).not.toBe(yes);
    expect(document.activeElement).not.toBe(finish);
    expect(yes.isConnected).toBe(false);
  });

  it.each(["yes", "no"] as const)("keeps a focused %s control and editing state while its language changes", (answer) => {
    render(<AppProviders>
      <LanguageSelector /><TerminalNemarUnit sessionId="session-1" response="yes" />
    </AppProviders>);
    fireEvent.click(screen.getByRole("button", { name: "Change response" }));
    const control = screen.getByTestId(`terminal-nemar-${answer}`);
    control.focus();
    fireEvent.click(screen.getByRole("button", { name: "עברית" }));
    expect(screen.getByTestId(`terminal-nemar-${answer}`)).toBe(control);
    expect(document.activeElement).toBe(control);
    expect(control.getAttribute("aria-pressed")).toBe(answer === "yes" ? "true" : "false");
    expect(control.textContent).toBe(answer === "yes" ? "כןנבחרה" : "לא");
    expect(screen.getByRole("group", { name: "פעולות זמינות" }).querySelectorAll("button")).toHaveLength(2);
  });

  it.each(["response", "finish"] as const)("replaces the focused %s action with its distinct recovery action", async (kind) => {
    if (kind === "response") {
      vi.spyOn(compositionRoot.playerEngineActions, "respondTerminalNemar").mockRejectedValue(new Error("unavailable"));
    } else {
      vi.spyOn(compositionRoot.sessionEngineActions, "onFinishRequested").mockRejectedValue(new Error("unavailable"));
    }
    render(<AppProviders>
      <TerminalNemarUnit sessionId="session-1" response={kind === "finish" ? "yes" : null} />
    </AppProviders>);
    const control = screen.getByTestId(kind === "finish" ? "finish-button" : "terminal-nemar-yes");
    control.focus();
    fireEvent.click(control);
    const retry = await screen.findByRole("button", {
      name: kind === "finish" ? "Try finishing again" : "Try this Terminal NEMAR response again",
    });
    expect(retry).not.toBe(control);
    expect(document.activeElement).not.toBe(retry);
    expect(control.isConnected).toBe(false);
  });

  it("replaces the focused No action with a distinct Change response control", () => {
    const { rerender } = render(<AppProviders>
      <TerminalNemarUnit sessionId="session-1" response={null} />
    </AppProviders>);
    const no = screen.getByTestId("terminal-nemar-no");
    no.focus();
    rerender(<AppProviders><TerminalNemarUnit sessionId="session-1" response="no" /></AppProviders>);
    const change = screen.getByRole("button", { name: "Change response" });
    expect(change).not.toBe(no);
    expect(document.activeElement).not.toBe(change);
    expect(no.isConnected).toBe(false);
    change.focus();
    fireEvent.click(change);
    expect(screen.getByTestId("terminal-nemar-no")).not.toBe(change);
    expect(document.activeElement).not.toBe(screen.getByTestId("terminal-nemar-no"));
  });

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
