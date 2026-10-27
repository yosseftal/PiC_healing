import { expect, test } from "@playwright/test";

for (const locale of ["he", "en"] as const) {
  test(`${locale} counter-free summary mirrors priority and intensity and isolates blind input`, async ({ page }) => {
    const he = locale === "he";
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/tests/summary-presentation.fixture.html?locale=${locale}`);
    const rows = page.locator(".pic-summary-topic");
    await expect(rows).toHaveCount(4);
    await expect(page.getByTestId("summary-group-name")).toHaveCount(0);
    await expect(page.getByTestId("symptom-count")).toHaveCount(0);
    await expect(page.locator("html")).toHaveAttribute("dir", he ? "rtl" : "ltr");
    const priority = await rows.first().locator(".pic-summary-topic__priority").boundingBox();
    const intensity = await rows.first().locator(".pic-summary-topic__rating").boundingBox();
    expect(priority).not.toBeNull();
    expect(intensity).not.toBeNull();
    expect(he ? priority!.x > intensity!.x : priority!.x < intensity!.x).toBe(true);
    await expect(rows.first()).toContainText(he ? "עוצמה 0/10" : "Intensity 0/10");
    const stored = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
    const open = he ? "פתיחת הכלים" : "Open utilities";
    const close = he ? "סגירת הכלים" : "Close utilities";
    await page.getByRole("button", { name: open, exact: true }).click();
    const selector = page.getByRole("combobox", { name: he ? "תצוגת הרשימה" : "Summary view", exact: true });
    await selector.focus();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect(selector).toHaveValue("polarity");
    await page.getByRole("button", { name: close, exact: true }).click();
    const positive = page.getByRole("region", { name: he ? "חיובית" : "Positive", exact: true });
    await expect(positive.locator(".pic-summary-topic")).toHaveCount(2);
    await expect(positive.locator(".pic-summary-topic").first()).toContainText(he ? "סדר עדיפות 1" : "Priority 1");
    await expect(positive.locator(".pic-summary-topic").last()).toContainText(he ? "סדר עדיפות 3" : "Priority 3");
    await expect(page.getByRole("button", { name: he ? "העלאת הנושא בסדר העדיפות" : "Move topic up" }))
      .toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(stored);
    await positive.getByRole("button", { name: he ? "דירוג הנושא מחדש" : "Rate this topic again" }).first().click();
    await expect(page.getByTestId("rating-control")).toBeVisible();
    await expect(page.locator(".pic-summary-topic")).toHaveCount(0);
    await expect(page.getByTestId("summary-muscle-test")).toHaveCount(0);
    await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
    await page.getByRole("button", { name: open, exact: true }).click();
    await expect(page.getByRole("combobox", { name: he ? "תצוגת הרשימה" : "Summary view" })).toHaveCount(0);
    await page.getByRole("button", { name: close, exact: true }).click();
    expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, x: scrollX, y: scrollY })))
      .toEqual({ width: 320, x: 0, y: 0 });
    expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(stored);
  });
}
