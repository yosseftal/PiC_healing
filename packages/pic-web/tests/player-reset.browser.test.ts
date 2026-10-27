import { enterQuestionnaire } from "./questionnaire-entry";
import { expect, test } from "@playwright/test";

for (const locale of ["en", "he"] as const) {
  for (const width of [320, 1440]) {
    test(`${locale} Player and Gate preserve work on dismissal and reset with focus at ${width}px`, async ({ page }) => {
      const en = locale === "en";
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      await page.goto(`/tests/unified-player.fixture.html?direction=${en ? "ltr" : "rtl"}`);
      const open = page.getByRole("button", { name: en ? "Open Player utilities" : "פתיחת כלי הנגן", exact: true });
      const reset = page.getByRole("button", { name: en ? "New symptom group" : "קבוצת סימפטומים חדשה", exact: true });
      const keep = page.getByRole("button", { name: en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי", exact: true });
      const discard = page.getByRole("button", {
        name: en ? "Discard draft and start new" : "למחוק את הטיוטה ולהתחיל מחדש", exact: true,
      });
      await expect(page.getByTestId("atomic-unit-title")).toHaveText("Long guidance");
      const before = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
      await open.click();
      await reset.click();
      await expect(keep).toBeFocused();
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(reset).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(open).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
      await open.click();
      await page.getByTestId("finish-anyway-button").click();
      const gateName = en ? "Keep your session" : "שמירת הסשן שלך";
      const gate = page.getByRole("dialog", { name: gateName });
      await expect(gate).toBeFocused();
      await expect(page.getByRole("dialog")).toHaveCount(1);
      const pending = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
      await page.keyboard.press("Escape");
      await expect(gate).toBeHidden();
      await expect(open).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(pending);
      await open.click();
      await page.getByTestId("finish-anyway-button").click();
      await expect(gate).toBeVisible();
      const decline = page.getByRole("button", { name: en ? "Continue without saving" : "המשך ללא שמירה", exact: true });
      await decline.click();
      await expect(keep).toBeFocused();
      await page.mouse.click(2, 2);
      await expect(decline).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(pending);
      await decline.click();
      await expect(keep).toBeFocused();
      await discard.click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      const input = page.getByRole("textbox", { name: en ? "List name (optional)" : "שם לרשימה (לא חובה)", exact: true });
      await expect(input).toBeFocused();
      await expect(page.getByRole("status").filter({ hasText: en ? "A new inquiry is ready." : "בירור חדש מוכן." }))
        .toHaveCount(1);
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBeNull();
      await page.goto("/");
      await enterQuestionnaire(page, locale);
      await expect(input).toHaveValue("");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator("html")).toHaveAttribute("dir", en ? "ltr" : "rtl");
    });
  }
}
