import { enterQuestionnaire } from "./questionnaire-entry";
import { expect, test } from "@playwright/test";

for (const locale of ["en", "he"] as const) {
  for (const width of [320, 1440]) {
    test(`${locale} reset keeps keyboard focus and typed work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      await page.addInitScript((language) => localStorage.setItem("pic-web.locale.v1", language), locale);
      await page.goto("/");
      await enterQuestionnaire(page, locale);
      const en = locale === "en";
      const open = page.getByRole("button", { name: en ? "Open utilities" : "פתיחת הכלים", exact: true });
      const resetName = en ? "New symptom group" : "קבוצת סימפטומים חדשה";
      const keepName = en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי";
      const discardName = en ? "Discard draft and start new" : "למחוק את הטיוטה ולהתחיל מחדש";
      const input = page.getByRole("textbox", { name: en ? "List name (optional)" : "שם לרשימה (לא חובה)", exact: true });
      await input.fill("Draft טיוטה");
      await open.click();
      const reset = page.getByRole("button", { name: resetName, exact: true });
      await reset.focus();
      await page.keyboard.press("Enter");
      const keep = page.getByRole("button", { name: keepName, exact: true });
      await expect(keep).toBeFocused();
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(reset).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(open).toBeFocused();
      await expect(input).toHaveValue("Draft טיוטה");
      await open.click();
      await reset.click();
      await expect(keep).toBeFocused();
      await page.getByRole("button", { name: discardName, exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(input).toHaveValue("");
      await expect(input).toBeFocused();
      await expect(page.getByRole("status").filter({ hasText: en ? "A new inquiry is ready." : "בירור חדש מוכן." }))
        .toHaveCount(1);
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBeNull();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const documentSize = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      }));
      expect(documentSize.width).toBeLessThanOrEqual(width);
      expect(documentSize.height).toBeLessThanOrEqual(width === 320 ? 568 : 900);
      // A complete questionnaire snapshot is the first domain write.
      await input.fill("Next inquiry");
      await page.getByLabel(en ? "Symptom name" : "שם הסימפטום", { exact: true }).fill("Neck");
      await page.getByLabel(en ? "Interference / suffering intensity" : "עוצמת הפרעה / סבל").selectOption("5");
      await page.getByTestId("finish-symptom-addition").click();
      await expect(page.getByTestId("muscle-test-yes")).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).not.toBeNull();
    });
  }
}
