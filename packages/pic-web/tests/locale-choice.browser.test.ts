import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]) {
  test(`Player language choice preserves focus, work and reload preference at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/unified-player.fixture.html");
    await expect(page.getByRole("heading", { name: "Long guidance" })).toBeVisible();
    const frame = page.locator(".pic-therapeutic-frame");
    await expect(frame).toHaveAttribute("lang", "he");
    await expect(frame).toHaveAttribute("dir", "rtl");
    const activeUnit = page.locator("[data-active-key]");
    const initialUnit = await activeUnit.getAttribute("data-active-key");
    const initialNode = await activeUnit.elementHandle();
    await page.getByRole("button", { name: "פתיחת כלי הנגן" }).click();
    const sheet = page.getByRole("dialog");
    const english = sheet.getByRole("button", { name: "English", exact: true });
    const hebrew = sheet.getByRole("button", { name: "עברית", exact: true });
    await expect(sheet.getByRole("group", { name: "שפה" })).toBeVisible();
    await expect(page.getByTestId("locale-announcement")).toHaveText("");
    const englishNode = await english.elementHandle();
    const languageRequests: string[] = [];
    page.on("request", (request) => languageRequests.push(request.url()));

    await english.focus();
    await page.keyboard.press("Enter");
    await expect(english).toBeFocused();
    await expect(english).toHaveAttribute("aria-pressed", "true");
    await expect(sheet).toHaveAccessibleName("Player utilities");
    await expect(sheet).toHaveAttribute("lang", "en");
    await expect(sheet).toHaveAttribute("dir", "ltr");
    await expect(frame).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(sheet.getByRole("group", { name: "Language" })).toBeVisible();
    await expect(page.getByTestId("locale-announcement")).toHaveText("Language changed to English.");
    expect(await english.evaluate((element, original) => element === original, englishNode)).toBe(true);
    await expect(page.locator("#root")).toHaveAttribute("inert", "");

    await page.keyboard.press("Shift+Tab");
    await expect(hebrew).toBeFocused();
    await page.keyboard.press("Space");
    await expect(hebrew).toBeFocused();
    await expect(sheet).toHaveAccessibleName("כלי הנגן");
    await expect(sheet).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "he");
    await expect(frame).toHaveAttribute("dir", "rtl");
    await expect(page.getByTestId("locale-announcement")).toHaveText("השפה הוחלפה לעברית.");
    await page.keyboard.press("Tab");
    await expect(english).toBeFocused();
    for (const button of [english, hebrew]) {
      const size = await button.boundingBox();
      expect(size!.width).toBeGreaterThanOrEqual(44);
      expect(size!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(hebrew).toHaveAttribute("lang", "he");
    await expect(hebrew).toHaveAttribute("dir", "rtl");
    await expect(english).toHaveAttribute("lang", "en");
    await expect(english).toHaveAttribute("dir", "ltr");
    await expect(activeUnit).toHaveAttribute("data-active-key", initialUnit!);
    expect(await activeUnit.evaluate((element, original) => element === original, initialNode)).toBe(true);
    expect(languageRequests).toEqual([]);

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: "פתיחת כלי הנגן" })).toBeFocused();
    await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
    await page.getByRole("button", { name: "פתיחת כלי הנגן" }).click();
    await english.click();
    expect(await page.evaluate(() => localStorage.getItem("pic-web.locale.v1"))).toBe("en");
    await page.reload();
    await expect(page.getByRole("button", { name: "Open Player utilities" })).toBeVisible();
    await expect(frame).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByRole("button", { name: "Open Player utilities" }).click();
    await expect(english).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("locale-announcement")).toHaveText("");
  });
}
