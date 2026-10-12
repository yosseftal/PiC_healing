import { expect, test, type Page } from "@playwright/test";

async function chooseTreatment(page: Page, locale: "he" | "en") {
  await page.getByRole("button", { name: locale === "he" ? "פתיחת הכלים" : "Open utilities" }).click();
  const id = (await page.locator("#root").getAttribute("data-treatment-id"))!;
  await page.getByTestId(`pick-treatment-${id}`).click();
  await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
}

async function selectLocale(page: Page, from: "he" | "en", to: "he" | "en") {
  await page.getByRole("button", { name: from === "he" ? "פתיחת כלי הנגן" : "Open Player utilities" }).click();
  await page.getByRole("button", { name: to === "he" ? "עברית" : "English", exact: true }).click();
  await expect(page.getByTestId("therapeutic-sheet-content")).toHaveAttribute("lang", to);
  await page.keyboard.press("Escape");
}

for (const locale of ["he", "en"] as const) {
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
    test(`${locale} approved picker/Player preserve identity through language selection at ${viewport.width}px`,
      async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`/tests/content-localization.fixture.html?locale=${locale}`);
        await page.getByRole("button", { name: locale === "he" ? "פתיחת הכלים" : "Open utilities" }).click();
        const id = (await page.locator("#root").getAttribute("data-treatment-id"))!;
        await expect(page.getByTestId(`pick-treatment-${id}`)).toHaveText(
          locale === "he" ? "הרגעת מערכת העצבים" : "Settling the Nervous System");
        await page.getByTestId(`pick-treatment-${id}`).click();
        await expect(page.getByTestId("atomic-unit-title")).toHaveText(
          locale === "he" ? "התמקמות בשקט" : "Settle Into Stillness");
        await expect(page.getByTestId("atomic-unit-content")).toHaveAttribute("lang", locale);
        await expect(page.getByTestId("atomic-unit-content")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
        const session = await page.locator("#root").getAttribute("data-session");
        const reads = await page.locator("#root").getAttribute("data-source-reads");
        const requests: string[] = [];
        page.on("request", (request) => requests.push(request.url()));
        const other = locale === "he" ? "en" : "he";
        await selectLocale(page, locale, other);
        await expect(page.getByTestId("atomic-unit-title")).toHaveText(
          other === "he" ? "התמקמות בשקט" : "Settle Into Stillness");
        await expect(page.locator("#root")).toHaveAttribute("data-session", session!);
        await expect(page.locator("#root")).toHaveAttribute("data-source-reads", reads!);
        expect(requests).toEqual([]);
        expect(await page.evaluate(() => ({
          width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          x: window.scrollX, y: window.scrollY,
        }))).toEqual({ width: viewport.width, height: viewport.height, x: 0, y: 0 });
      });
  }
}

for (const mode of ["stale", "unavailable"] as const) {
  test(`${mode} source retains canonical guidance through the real language selector`, async ({ page }) => {
    await page.goto(`/tests/content-localization.fixture.html?mode=${mode}`);
    await chooseTreatment(page, "he");
    await expect(page.getByTestId("content-availability-notice")).toContainText("תרגום מאושר אינו זמין");
    const content = page.getByTestId("atomic-unit-content");
    await expect(content).toContainText(mode === "stale" ? "four slow breaths" : "Personal edited guidance");
    await expect(content).toHaveAttribute("lang", "");
    await expect(content).toHaveAttribute("dir", "auto");
    const session = await page.locator("#root").getAttribute("data-session");
    await selectLocale(page, "he", "en");
    await expect(content).toContainText(mode === "stale" ? "four slow breaths" : "Personal edited guidance");
    await expect(page.getByTestId("content-availability-notice")).toContainText("approved translation is unavailable");
    await expect(page.locator("#root")).toHaveAttribute("data-session", session!);
    await expect(content.locator("script")).toHaveCount(0);
  });
}

test("approved Hebrew GFM keeps table DOM, canonical states and task status through a language round trip", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/tests/content-localization.fixture.html?treatment=grounding");
  await chooseTreatment(page, "he");
  await page.getByRole("button", { name: "פתיחת כלי הנגן" }).click();
  await page.getByTestId("navigation-tree-jump-unit-3").click();
  const table = page.locator(".pic-therapeutic-table-scroller");
  await expect(table).toBeVisible();
  const node = await table.elementHandle();
  await expect(table.locator("table")).toHaveAttribute("lang", "he");
  await expect(table).toHaveAttribute("dir", "rtl");
  await expect(table.locator("del")).toHaveText("חוסר יציבות");
  await expect(page.locator('input[type="checkbox"]').first()).toBeChecked();
  await expect(page.locator('input[type="checkbox"]').last()).not.toBeChecked();
  const session = await page.locator("#root").getAttribute("data-session");
  await selectLocale(page, "he", "en");
  expect(await table.evaluate((element, original) => element === original, node)).toBe(true);
  await expect(table.locator("table")).toHaveAttribute("lang", "en");
  await expect(table).toHaveAttribute("dir", "ltr");
  await expect(table.locator("del")).toHaveText("Unsteady");
  await selectLocale(page, "en", "he");
  expect(await table.evaluate((element, original) => element === original, node)).toBe(true);
  await expect(page.locator("#root")).toHaveAttribute("data-session", session!);
});
