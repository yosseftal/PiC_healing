import { expect, test, type Page } from "@playwright/test";

const copy = {
  he: { open: "פתיחת הכלים", close: "סגירת הכלים", actions: "פעולות זמינות",
    joint: "בדיקת שריר לטיפול משותף", summary: "סיכום קבוצת הסימפטומים", picker: "בחירת טיפול" },
  en: { open: "Open utilities", close: "Close utilities", actions: "Available actions",
    joint: "Joint Treatment Muscle Test", summary: "Group Summary", picker: "Pick Treatment" },
} as const;
type Locale = keyof typeof copy;

async function switchLanguage(page: Page, from: Locale, to: Locale) {
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

async function checkContainment(page: Page) {
  await expect(page.locator(".pic-therapeutic-frame")).toHaveCount(1);
  expect(await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    x: window.scrollX, y: window.scrollY,
  }))).toEqual({ width: 320, height: 568, x: 0, y: 0 });
  const card = page.locator(".pic-therapeutic-content-card");
  expect(await card.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
  for (const target of await page.locator(".pic-therapeutic-frame button").all()) {
    const box = await target.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
}

for (const locale of ["he", "en"] as const) {
  const other = locale === "he" ? "en" : "he";
  test(`${locale} joint inquiry retains No advisory, dismissal and sovereign finalization in one phone frame`,
    async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`/tests/inquiry-selection.fixture.html?locale=${locale}&stage=joint`);
    await expect(page.getByRole("heading", { name: copy[locale].joint })).toBeVisible();
    const no = await page.getByTestId("muscle-test-no").elementHandle();
    await checkContainment(page);
    await switchLanguage(page, locale, other);
    expect(await page.getByTestId("muscle-test-no").evaluate((node, original) => node === original, no)).toBe(true);
    await page.getByTestId("muscle-test-no").focus();
    await expect(page.getByTestId("muscle-test-no")).toBeFocused();
    expect(await page.getByTestId("muscle-test-no").evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("split-advisory")).toBeVisible();
    await switchLanguage(page, other, locale);
    await expect(page.getByRole("group", { name: copy[locale].actions }).getByRole("button")).toHaveCount(2);
    await page.getByTestId("dismiss-split-advisory").click();
    await switchLanguage(page, locale, other);
    await expect(page.getByTestId("split-advisory")).toHaveCount(0);
    await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "1");
    await page.getByTestId("finalize-anyway").click();
    await expect(page.getByTestId("guest-flow-group-summary")).toBeVisible();
    await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "2");
    await checkContainment(page);
  });

  test(`${locale} long summary retains isolated personal names and card scroll through language selection`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`/tests/inquiry-selection.fixture.html?locale=${locale}&stage=summary`);
    await expect(page.getByRole("heading", { name: copy[locale].summary })).toBeVisible();
    const name = page.getByTestId("summary-group-name").locator("bdi");
    await expect(name).toHaveText("גב <b>Back</b> 123");
    await expect(name).toHaveAttribute("lang", "");
    await expect(name).toHaveAttribute("dir", "auto");
    await expect(name.locator("b")).toHaveCount(0);
    await checkContainment(page);
    const card = page.locator(".pic-therapeutic-content-card");
    await card.evaluate((node) => { node.scrollTop = 120; });
    expect(await card.evaluate((node) => node.scrollTop)).toBe(120);
    await switchLanguage(page, locale, other);
    expect(await card.evaluate((node) => node.scrollTop)).toBe(120);
    await expect(page.getByTestId("symptom-count")).toHaveText(other === "he"
      ? "30 סימפטומים בקבוצה" : "30 symptoms in this group");
    await page.getByTestId("confirm-group-summary").click();
    await expect(page.getByTestId("guest-flow-pick-treatment")).toBeVisible();
    await checkContainment(page);
  });

  test(`${locale} complete catalog scrolls in the shared Sheet and preserves voluntary linking and canonical start`,
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(`/tests/inquiry-selection.fixture.html?locale=${locale}&stage=picker`);
      await expect(page.getByRole("heading", { name: copy[locale].picker })).toBeVisible();
      await expect(page.getByTestId("treatment-list")).toHaveCount(0);
      await checkContainment(page);
      await page.getByRole("button", { name: copy[locale].open }).click();
      const link = page.getByTestId("link-to-group-toggle");
      await expect(link).not.toBeChecked();
      const hitArea = await link.locator("..").boundingBox();
      expect(hitArea!.width).toBeGreaterThanOrEqual(44);
      expect(hitArea!.height).toBeGreaterThanOrEqual(44);
      await link.locator("..").click();
      await expect(link).toBeChecked();
      await expect(page.getByTestId("treatment-list").getByRole("button")).toHaveCount(23);
      const selector = page.getByRole("button", { name: other === "he" ? "עברית" : "English", exact: true });
      await selector.focus();
      const scroller = page.getByTestId("therapeutic-sheet-content").getByRole("region");
      await scroller.evaluate((node) => { node.scrollTop = 200; });
      expect(await scroller.evaluate((node) => node.scrollTop)).toBe(200);
      expect(await scroller.evaluate((node) => node.scrollWidth - node.clientWidth)).toBeLessThanOrEqual(1);
      await page.keyboard.press("Enter");
      await expect(selector).toBeFocused();
      await expect(link).toBeChecked();
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "0");
      expect(await scroller.evaluate((node) => node.scrollTop)).toBe(200);
      const treatmentId = await page.locator("#root").getAttribute("data-treatment-id");
      const groupId = await page.locator("#root").getAttribute("data-group-id");
      const unitIds = await page.locator("#root").getAttribute("data-unit-ids");
      await page.getByTestId(`pick-treatment-${treatmentId}`).click();
      await expect(page.getByTestId("guest-flow-player")).toBeVisible();
      await expect(page.locator("#root")).toHaveAttribute("data-start-payload",
        JSON.stringify([treatmentId, groupId, JSON.parse(unitIds!)]));
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "1");
    });
}
