import { expect, test, type Page } from "@playwright/test";

const copy = {
  he: {
    open: "פתיחת הכלים", close: "סגירת הכלים", name: "שם הקבוצה", symptom: "שם הסימפטום",
    polarity: "קוטביות", intensity: "עוצמה", card: "שם הקבוצה והסימפטומים", actions: "פעולות זמינות",
    prior: "קודם: חיובית, 8/10", placeholder: "שם לקבוצת הסימפטומים",
  },
  en: {
    open: "Open utilities", close: "Close utilities", name: "Group name", symptom: "Symptom name",
    polarity: "Polarity", intensity: "Intensity", card: "Group name and symptoms", actions: "Available actions",
    prior: "Prior: Positive, 8/10", placeholder: "Name this Symptom Group",
  },
} as const;
type Locale = keyof typeof copy;

async function selectLanguage(page: Page, from: Locale, to: Locale) {
  const before = await page.locator("#root").getAttribute("data-action-calls");
  await page.getByRole("button", { name: copy[from].open }).click();
  const selector = page.getByRole("button", { name: to === "he" ? "עברית" : "English", exact: true });
  await selector.focus();
  await page.keyboard.press("Enter");
  await expect(selector).toBeFocused();
  await expect(page.getByTestId("therapeutic-sheet-content")).toHaveAttribute("lang", to);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: copy[to].open })).toBeFocused();
  await expect(page.locator("#root")).toHaveAttribute("data-action-calls", before!);
}

async function checkContainment(page: Page, width: number, height: number) {
  await expect(page.locator(".pic-therapeutic-frame")).toHaveCount(1);
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    x: window.scrollX, y: window.scrollY,
  }));
  expect(size).toEqual({ width, height, x: 0, y: 0 });
  const card = page.locator(".pic-therapeutic-content-card");
  const overflow = await card.evaluate((node) => node.scrollWidth - node.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  for (const target of await page.locator(".pic-therapeutic-frame button, input, select").all()) {
    const box = await target.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
}

for (const locale of ["he", "en"] as const) {
  const other = locale === "he" ? "en" : "he";
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
    test(`${locale} creation preserves names and rating drafts in one phone frame at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/tests/symptom-creation.fixture.html?locale=${locale}`);
      const name = page.getByRole("textbox", { name: copy[locale].name });
      await expect(name).toHaveAttribute("placeholder", copy[locale].placeholder);
      await name.fill("גב Back 123 ".repeat(10));
      const input = await name.elementHandle();
      await checkContainment(page, viewport.width, viewport.height);
      await selectLanguage(page, locale, other);
      const changedName = page.getByRole("textbox", { name: copy[other].name });
      expect(await changedName.evaluate((node, original) => node === original, input)).toBe(true);
      await expect(changedName).toHaveValue("גב Back 123 ".repeat(10));
      await expect(changedName).toHaveAttribute("lang", "");
      await expect(changedName).toHaveAttribute("dir", "auto");
      await changedName.press("Enter");
      const symptom = page.getByRole("textbox", { name: copy[other].symptom });
      await symptom.fill("Neck צוואר");
      await page.getByLabel(copy[other].polarity).selectOption("positive");
      const slider = page.getByLabel(copy[other].intensity);
      await slider.focus();
      await page.keyboard.press("End");
      await expect(slider).toHaveValue("10");
      const symptomNode = await symptom.elementHandle();
      const card = page.getByRole("region", { name: copy[other].card });
      await card.evaluate((node) => { node.scrollTop = 40; });
      const scroll = await card.evaluate((node) => node.scrollTop);
      if (viewport.width === 320) expect(scroll).toBe(40);
      await selectLanguage(page, other, locale);
      const changedSymptom = page.getByRole("textbox", { name: copy[locale].symptom });
      expect(await changedSymptom.evaluate((node, original) => node === original, symptomNode)).toBe(true);
      await expect(changedSymptom).toHaveValue("Neck צוואר");
      await expect(page.getByLabel(copy[locale].polarity)).toHaveValue("positive");
      await expect(page.getByLabel(copy[locale].intensity)).toHaveValue("10");
      expect(await page.getByRole("region", { name: copy[locale].card }).evaluate((node) => node.scrollTop)).toBe(scroll);
      await checkContainment(page, viewport.width, viewport.height);
      await changedSymptom.press("Enter");
      await expect(page.getByTestId("finish-symptom-addition")).toBeVisible();
      await expect(page.getByTestId("symptom-count")).toHaveText(locale === "he"
        ? "סימפטום 1 בקבוצה" : "1 symptom in this group");
      await expect(page.getByRole("group", { name: copy[locale].actions }).getByRole("button")).toHaveCount(2);
      await checkContainment(page, viewport.width, viewport.height);
    });

    test(`${locale} blind prior history retains explicit reveal and draft through phone selection at ${viewport.width}px`,
      async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`/tests/symptom-creation.fixture.html?locale=${locale}&stage=prior`);
        await expect(page.getByTestId("reveal-prior-rating")).toBeVisible();
        const slider = page.getByLabel(copy[locale].intensity);
        await slider.focus();
        await page.keyboard.press("End");
        await selectLanguage(page, locale, other);
        await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
        await expect(page.getByLabel(copy[other].intensity)).toHaveValue("10");
        await page.getByTestId("reveal-prior-rating").click();
        await expect(page.getByTestId("revealed-prior-rating")).toHaveText(copy[other].prior);
        await selectLanguage(page, other, locale);
        await expect(page.getByTestId("revealed-prior-rating")).toHaveText(copy[locale].prior);
        await expect(page.getByLabel(copy[locale].intensity)).toHaveValue("10");
        await expect(page.getByLabel(copy[locale].polarity)).toHaveValue("negative");
        await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "1");
        await checkContainment(page, viewport.width, viewport.height);
      });
  }
}
