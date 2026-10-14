import { expect, test } from "@playwright/test";
import { expectReadable } from "./palette-contrast";

const copy = {
  he: {
    title: "שמירת הסשן שלך", direction: "rtl", signIn: "התחברות ושמירה",
    email: "כתובת אימייל", password: "סיסמה",
    pending: "הסשן שלך נשמר…", recovery: "עדיין לא הצלחנו לשמור את הסשן שלך. אפשר לנסות שוב כשמתאים לך.",
    retry: "ניסיון נוסף", discard: "המשך ללא שמירה",
  },
  en: {
    title: "Keep your session", direction: "ltr", signIn: "Sign in and save",
    email: "Email address", password: "Password",
    pending: "Anchoring your session…",
    recovery: "We could not anchor your session yet. You can try again whenever you are ready.",
    retry: "Try again", discard: "Continue without saving",
  },
} as const;

for (const locale of ["he", "en"] as const) {
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
    test(`${locale} gate retains keyboard actions and preference across pending, recovery and discard at ${viewport.width}px`,
      async ({ page }) => {
        const text = copy[locale];
        await page.setViewportSize(viewport);
        await page.goto("/tests/unified-player.fixture.html?gateRequest=deferred");
        await expect(page.getByTestId("atomic-unit-title")).toHaveText("Long guidance");
        const personalContent = await page.getByTestId("atomic-unit-content").textContent();
        await page.getByRole("button", { name: "פתיחת כלי הנגן" }).click();
        const sheet = page.getByTestId("therapeutic-sheet-content");
        if (locale === "he") await sheet.getByRole("button", { name: "English", exact: true }).click();
        await sheet.getByRole("button", { name: locale === "he" ? "עברית" : "English", exact: true }).click();
        await sheet.getByTestId("finish-anyway-button").click();
        await expect(sheet).toBeHidden();
        const gate = page.getByRole("dialog", { name: text.title });
        await expect(gate).toBeVisible();
        await expect(gate).toBeFocused();
        await expect(gate).toHaveAttribute("lang", locale);
        await expect(gate).toHaveAttribute("dir", text.direction);
        await expect(gate.getByRole("button", { name: /Apple|Google|stub/ })).toHaveCount(0);
        const original = await gate.elementHandle();
        const before = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
        expect(before).not.toBeNull();
        await expect(page.getByTestId("atomic-unit-content")).toHaveText(personalContent!);
        const geometry = await gate.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, right: box.right, bottom: box.bottom, overflow: getComputedStyle(element).overflowY };
        });
        expect(geometry.x).toBeGreaterThanOrEqual(0);
        expect(geometry.y).toBeGreaterThanOrEqual(0);
        expect(geometry.right).toBeLessThanOrEqual(viewport.width);
        expect(geometry.bottom).toBeLessThanOrEqual(viewport.height);
        expect(geometry.overflow).toBe("auto");
        const contrast = await gate.evaluate((element) => {
          const luminance = (color: string) => {
            const channels = color.match(/[\d.]+/g)!.slice(0, 3).map((value) => {
              const channel = Number(value) / 255;
              return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
            });
            return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
          };
          const background = luminance(getComputedStyle(element).backgroundColor);
          return [...element.querySelectorAll("p, button:not(:disabled)")].map((control) => {
            const foreground = luminance(getComputedStyle(control).color);
            return (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
          });
        });
        for (const ratio of contrast) expect(ratio).toBeGreaterThanOrEqual(4.5);
        for (const control of await gate.getByRole("button").all()) {
          const box = await control.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        await page.keyboard.press("Tab");
        await expect(gate.getByLabel(text.email)).toBeFocused();
        await page.keyboard.type("fixture@example.com");
        await page.keyboard.press("Tab");
        await expect(gate.getByLabel(text.password)).toBeFocused();
        await page.keyboard.type("  unchanged password  ");
        await page.keyboard.press("Tab");
        const signIn = gate.getByRole("button", { name: text.signIn, exact: true });
        await expect(signIn).toBeFocused();
        await expectReadable(signIn, true, true);
        await page.keyboard.press("Enter");
        await expect(gate.getByText(text.pending, { exact: true })).toBeVisible();
        await expectReadable(gate.locator("p"));
        await expect(gate.getByRole("button")).toHaveCount(0);
        expect(await gate.evaluate((element, node) => element === node, original)).toBe(true);
        expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
        await page.evaluate(() => window.dispatchEvent(new Event("fixture-reject-promotion")));
        await expect(gate.getByText(text.recovery, { exact: true })).toBeVisible();
        await expectReadable(gate.locator("p, button:not(:disabled)"));
        await gate.focus();
        await page.keyboard.press("Tab");
        await expect(gate.getByRole("button", { name: text.retry })).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(gate.getByText(text.pending, { exact: true })).toBeVisible();
        await page.evaluate(() => window.dispatchEvent(new Event("fixture-reject-promotion")));
        await expect(gate.getByText(text.recovery, { exact: true })).toBeVisible();
        await gate.focus();
        await page.keyboard.press("Tab");
        await page.keyboard.press("Tab");
        await expect(gate.getByRole("button", { name: text.discard })).toBeFocused();
        await page.keyboard.press("Space");
        const keep = page.getByRole("button", {
          name: locale === "en" ? "Keep current inquiry" : "להמשיך בבירור הנוכחי", exact: true,
        });
        await expect(keep).toBeFocused();
        await expect(page.getByRole("dialog")).toHaveCount(1);
        await page.keyboard.press("Escape");
        await expect(gate.getByRole("button", { name: text.discard })).toBeFocused();
        expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
        await gate.getByRole("button", { name: text.discard }).click();
        await expect(keep).toBeFocused();
        await page.getByRole("button", {
          name: locale === "en" ? "Discard draft and start new" : "למחוק את הטיוטה ולהתחיל מחדש", exact: true,
        }).click();
        await expect(gate).toBeHidden();
        expect(await page.evaluate(() => localStorage.getItem("pic-web.locale.v1"))).toBe(locale);
        expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBeNull();
        await page.reload();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
      });
}
}
