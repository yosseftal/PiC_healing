import { expect, test } from "@playwright/test";

for (const locale of ["he", "en"] as const) {
  test(`${locale} welcome continues, survives same-tab reload, and guide returns to the same draft`, async ({ page }) => {
    await page.route("https://www.youtube-nocookie.com/embed/**", (route) => route.abort());
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tests/w13-07-education.fixture.html?locale=${locale}`);
    await expect(page.getByTestId("welcome-screen")).toBeVisible();
    await expect(page.getByTestId("welcome-screen").locator('.pic-therapeutic-content-card section[lang="he"]'))
      .toHaveCount(2);

    await page.getByTestId("welcome-start").click();
    await page.reload();
    await expect(page.getByTestId("welcome-screen")).toHaveCount(0);
    await page.getByLabel(locale === "he" ? "שם לרשימה (לא חובה)" : "List name (optional)")
      .fill("Draft retained by the current screen");
    await page.getByLabel(locale === "he" ? "שם הסימפטום" : "Symptom name").fill("Unfinished topic");

    const beforeGuide = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
    await page.getByRole("button", { name: locale === "he" ? "פתיחת הכלים" : "Open utilities" }).click();
    await page.getByTestId("education-guide-trigger").click();
    await expect(page.getByTestId("education-guide")).toBeVisible();
    await expect(page.getByTestId("education-guide").locator('.pic-therapeutic-content-card section[lang="he"]'))
      .toHaveCount(1);
    await expect(page.getByTitle(locale === "he" ? "הדגמת השיטה" : "Method demonstration")).toHaveCount(0);

    await page.getByRole("button", { name: locale === "he" ? "הפעלת הסרטון" : "Load video" }).click();
    await expect(page.getByTitle(locale === "he" ? "הדגמת השיטה" : "Method demonstration"))
      .toHaveAttribute("src", /youtube-nocookie\.com/);
    await page.getByRole("button", { name: locale === "he" ? "חזרה" : "Return" }).click();
    await expect(page.locator("iframe")).toHaveCount(0);
    await expect(page.getByLabel(locale === "he" ? "שם לרשימה (לא חובה)" : "List name (optional)"))
      .toHaveValue("Draft retained by the current screen");
    await expect(page.getByLabel(locale === "he" ? "שם הסימפטום" : "Symptom name"))
      .toHaveValue("Unfinished topic");
    await expect(page.getByTestId("education-guide-trigger")).toBeFocused();
    expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(beforeGuide);
  });
}
