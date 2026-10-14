// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider, useLocale } from "./locale-provider";
import { LanguageSelector } from "./language-selector";
import { TherapeuticFrame } from "../therapeutic-frame/TherapeuticFrame";
import { TherapeuticSheet } from "../therapeutic-sheet";
import { LocalizedMessage } from "./localized-message";

function AliasScreen() {
  const { customNemarAlias, setCustomNemarAlias, selectLocale, message } = useLocale();
  const [generation, setGeneration] = useState(0);
  return <>
    <output data-testid="alias-value">{JSON.stringify(customNemarAlias)}</output>
    <input aria-label="Alias fixture" value={customNemarAlias ?? ""}
      onChange={(event) => setCustomNemarAlias(event.target.value)} />
    <button onClick={() => selectLocale("en")}>English</button>
    <button onClick={() => setGeneration(generation + 1)}>Reset inquiry fixture</button>
    <button onClick={() => setCustomNemarAlias(null)}>Clear alias fixture</button>
    <div key={generation}>
      <input aria-label="Inquiry draft" defaultValue="" />
      <p data-testid="question"><LocalizedMessage message={message("joint.question")} /></p>
    </div>
  </>;
}

function LocaleScreen() {
  const { locale, direction, selectLocale } = useLocale();
  return (
    <main lang={locale} dir={direction}>
      <output>{locale}</output>
      <input aria-label="Session draft" defaultValue="My own wording" />
      <button type="button" onClick={() => selectLocale("en")}>English</button>
      <button type="button" onClick={() => selectLocale("he")}>עברית</button>
    </main>
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("locale authority", () => {
  it("keeps a literal alias in provider memory across locale changes and inquiry subtree resets", () => {
    const { unmount } = render(<LocaleProvider><AliasScreen /></LocaleProvider>);
    expect(screen.getByTestId("alias-value").textContent).toBe("null");
    const draft = screen.getByLabelText("Inquiry draft");
    fireEvent.change(draft, { target: { value: "My NEMAR נמ״ר wording" } });
    const alias = 'שלי Right <b>{nemar}</b> & "quoted"';
    fireEvent.change(screen.getByLabelText("Alias fixture"), { target: { value: alias } });
    expect(screen.getByTestId("question").textContent).toBe(`האם ${alias} לטפל בסימפטומים האלה יחד?`);
    expect(screen.getByTestId("question").querySelector("b")).toBeNull();
    expect(screen.getByTestId("question").querySelector("bdi")?.textContent).toBe(alias);
    expect(localStorage.length).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByTestId("question").textContent).toBe(`Is it ${alias} to treat these symptoms together?`);
    expect(screen.getByLabelText("Inquiry draft")).toBe(draft);
    expect((draft as HTMLInputElement).value).toBe("My NEMAR נמ״ר wording");
    fireEvent.click(screen.getByRole("button", { name: "Reset inquiry fixture" }));
    expect(screen.getByLabelText("Inquiry draft")).not.toBe(draft);
    expect(screen.getByTestId("alias-value").textContent).toBe(JSON.stringify(alias));
    fireEvent.change(screen.getByLabelText("Alias fixture"), { target: { value: " \t " } });
    expect(screen.getByTestId("question").textContent).toBe("Is it NEMAR to treat these symptoms together?");
    fireEvent.click(screen.getByRole("button", { name: "Clear alias fixture" }));
    expect(screen.getByTestId("alias-value").textContent).toBe("null");
    expect(localStorage.length).toBe(1);
    fireEvent.change(screen.getByLabelText("Alias fixture"), { target: { value: alias } });
    unmount();
    render(<LocaleProvider><AliasScreen /></LocaleProvider>);
    expect(screen.getByTestId("alias-value").textContent).toBe("null");
  });

  it("defaults to Hebrew and changes presentation while retaining the mounted draft", () => {
    render(<LocaleProvider><LocaleScreen /></LocaleProvider>);
    expect(screen.getByRole("status").textContent).toBe("he");
    expect(document.documentElement.lang).toBe("he");
    expect(document.documentElement.dir).toBe("rtl");
    const draft = screen.getByRole("textbox");
    fireEvent.change(draft, { target: { value: "Still my wording" } });
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("status").textContent).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(screen.getByRole("textbox")).toBe(draft);
    expect((draft as HTMLInputElement).value).toBe("Still my wording");
    expect(localStorage.getItem("pic-web.locale.v1")).toBe("en");
  });

  it("updates document, Frame and portal together while keeping the selector and focus mounted", () => {
    const { container } = render(
      <LocaleProvider>
        <TherapeuticFrame title="Fixture" stageLabel="Guidance" utilityTrigger={
          <TherapeuticSheet title="Utilities" trigger="Open" triggerLabel="Open utilities">
            <LanguageSelector />
          </TherapeuticSheet>
        }><input aria-label="Draft" defaultValue="Original text" /></TherapeuticFrame>
      </LocaleProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open utilities" }));
    const english = screen.getByRole("button", { name: "English" });
    english.focus();
    fireEvent.click(english);
    expect(screen.getByRole("group", { name: "Language" })).toBeTruthy();
    for (const surface of [document.documentElement, container.querySelector(".pic-therapeutic-frame"),
      screen.getByRole("dialog")]) {
      expect(surface?.getAttribute("lang")).toBe("en");
      expect(surface?.getAttribute("dir")).toBe("ltr");
    }
    expect(screen.getByRole("button", { name: "English" })).toBe(english);
    expect(document.activeElement).toBe(english);
    expect(english.getAttribute("aria-pressed")).toBe("true");
    expect(english.getAttribute("lang")).toBe("en");
    expect(screen.getByTestId("locale-announcement").textContent).toBe("Language changed to English.");
    expect(container.hasAttribute("inert")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "עברית" }));
    expect(screen.getByRole("group", { name: "שפה" })).toBeTruthy();
    expect(screen.getByRole("dialog").getAttribute("dir")).toBe("rtl");
    expect(screen.getByTestId("locale-announcement").textContent).toBe("השפה הוחלפה לעברית.");
  });

  it.each([null, "", "HE", "fr", '"en"', "{broken}", " en "])(
    "starts in Hebrew for unsupported saved preference %s", (stored) => {
      if (stored !== null) localStorage.setItem("pic-web.locale.v1", stored);
      render(<LocaleProvider><LocaleScreen /></LocaleProvider>);
      expect(screen.getByRole("status").textContent).toBe("he");
    },
  );

  it("restores a valid saved choice on first layout and restores prior document metadata on cleanup", () => {
    localStorage.setItem("pic-web.locale.v1", "en");
    document.documentElement.lang = "fr";
    document.documentElement.dir = "rtl";
    document.documentElement.style.overflow = "auto";
    const { unmount } = render(<StrictMode><LocaleProvider><LocaleScreen /></LocaleProvider></StrictMode>);
    expect(screen.getByRole("status").textContent).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    expect(document.documentElement.style.overflow).toBe("auto");
    unmount();
    expect(document.documentElement.lang).toBe("fr");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.style.overflow).toBe("auto");
    document.documentElement.style.overflow = "";
  });

  it("continues in memory when storage reads or quota writes fail", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Access denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new DOMException("Quota", "QuotaExceededError"); });
    render(<LocaleProvider><LocaleScreen /></LocaleProvider>);
    expect(screen.getByRole("status").textContent).toBe("he");
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("status").textContent).toBe("en");
  });

  it("continues when access to browser storage itself is unavailable", () => {
    vi.spyOn(window, "localStorage", "get").mockImplementation(() => { throw new Error("Storage unavailable"); });
    render(<LocaleProvider><LocaleScreen /></LocaleProvider>);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(screen.getByRole("status").textContent).toBe("en");
  });

  it("selecting the current locale is a no-op and other tabs never change the active visit", () => {
    localStorage.setItem("pic-web.locale.v1", "en");
    const write = vi.spyOn(Storage.prototype, "setItem");
    const { unmount } = render(<StrictMode><LocaleProvider><LocaleScreen /></LocaleProvider></StrictMode>);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(write).not.toHaveBeenCalled();
    localStorage.setItem("pic-web.locale.v1", "he");
    fireEvent(window, new StorageEvent("storage", { key: "pic-web.locale.v1", newValue: "he" }));
    expect(screen.getByRole("status").textContent).toBe("en");
    unmount();
    render(<LocaleProvider><LocaleScreen /></LocaleProvider>);
    expect(screen.getByRole("status").textContent).toBe("he");
  });
});
