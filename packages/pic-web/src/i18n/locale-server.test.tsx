import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LocaleProvider, useLocale } from "./locale-provider";

function ServerPresentation() {
  const { locale, direction } = useLocale();
  return <main lang={locale} dir={direction}>Fixture</main>;
}

describe("locale presentation without browser globals", () => {
  it("renders Hebrew safely without window or browser storage", () => {
    expect(renderToString(<LocaleProvider><ServerPresentation /></LocaleProvider>))
      .toBe('<main lang="he" dir="rtl">Fixture</main>');
  });
});
