import { expect, test } from "@playwright/test";

for (const locale of ["en", "he"] as const) {
  for (const width of [320, 1440]) {
    test(`${locale} reset keeps keyboard focus and typed work at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: width === 320 ? 568 : 900 });
      await page.addInitScript((language) => localStorage.setItem("pic-web.locale.v1", language), locale);
      await page.goto("/");
      const en = locale === "en";
      const open = page.getByRole("button", { name: en ? "Open utilities" : "פתיחת הכלים", exact: true });
      const resetName = en ? "New symptom group" : "קבוצת סימפטומים חדשה";
      const keepName = en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי";
      const discardName = en ? "Discard draft and start new" : "למחוק את הטיוטה ולהתחיל מחדש";
      const input = page.getByRole("textbox", { name: en ? "Group name" : "שם הקבוצה", exact: true });
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
      await expect(page.getByRole("status")).toContainText(en ? "A new inquiry is ready." : "בירור חדש מוכן.");
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBeNull();
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      const documentSize = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
      }));
      expect(documentSize.width).toBeLessThanOrEqual(width);
      expect(documentSize.height).toBeLessThanOrEqual(width === 320 ? 568 : 900);
      // The next record exists only after an explicit name submission through GroupEngine.
      await input.fill("Next inquiry");
      await page.getByTestId("confirm-group-name").click();
      await expect(page.getByTestId("symptom-add-step")).toBeVisible();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).not.toBeNull();
    });
  }
}
