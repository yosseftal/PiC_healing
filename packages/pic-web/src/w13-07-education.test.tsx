// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LocaleProvider } from "./i18n/locale-provider";
import { EducationGuide } from "./EducationGuide";
import { WelcomeScreen } from "./WelcomeScreen";
import type { EducationProvenance, EducationSection, WelcomeEducationCopy } from "./education-content";

const provenance: EducationProvenance = {
  sourceUrl: "https://example.org/approved-source",
  sourceLabel: "Source",
  timestamps: [],
  approvalRevision: "fixture-approved-revision",
};
const welcomeCopy: WelcomeEducationCopy = {
  purpose: { locale: "he", text: "Approved purpose fixture", provenance },
  background: { locale: "he", text: "Approved background fixture", provenance },
};
const sections: readonly EducationSection[] = [{
  id: "fixture-section", locale: "he", heading: "Approved guide fixture", paragraphs: ["Approved section fixture."], provenance,
}];

function renderWithLocale(ui: ReactNode) {
  return render(<LocaleProvider>{ui}</LocaleProvider>);
}

beforeEach(() => localStorage.setItem("pic-web.locale.v1", "he"));
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("W13-07 education surfaces", () => {
  it("offers only the two welcome choices and delegates both actions", () => {
    const onStartQuestionnaire = vi.fn();
    const onLearnMethod = vi.fn();
    renderWithLocale(<WelcomeScreen content={welcomeCopy} onStartQuestionnaire={onStartQuestionnaire}
      onLearnMethod={onLearnMethod} />);

    expect(screen.getByText("Approved purpose fixture")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "לתחילת השאלון" }));
    fireEvent.click(screen.getByRole("button", { name: "על השיטה ומבחן השרירים" }));
    expect(onStartQuestionnaire).toHaveBeenCalledOnce();
    expect(onLearnMethod).toHaveBeenCalledOnce();
  });

  it("loads the pinned video on activation and offers a reliable fallback when playback is unavailable", () => {
    const onReturn = vi.fn();
    const { unmount } = renderWithLocale(
      <EducationGuide sections={sections} videoTitle="סרטון הסבר" onReturn={onReturn} />,
    );

    expect(screen.queryByTitle("סרטון הסבר")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "הפעלת הסרטון" }));
    const iframe = screen.getByTitle("סרטון הסבר") as HTMLIFrameElement;
    expect(iframe.src).toBe("https://www.youtube-nocookie.com/embed/txSeLG4kJ6Y?controls=1&autoplay=0");
    expect(iframe.hasAttribute("allowfullscreen")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "הסרטון לא נטען?" }));
    expect(screen.queryByTitle("סרטון הסבר")).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("הסרטון אינו זמין");
    expect(screen.getByRole("link", { name: "פתיחת הסרטון באתר YouTube" }).getAttribute("href"))
      .toBe("https://www.youtube.com/watch?v=txSeLG4kJ6Y");
    fireEvent.click(screen.getByRole("button", { name: "חזרה" }));
    expect(onReturn).toHaveBeenCalledOnce();
    unmount();
    expect(screen.queryByTitle("סרטון הסבר")).toBeNull();
  });
});
