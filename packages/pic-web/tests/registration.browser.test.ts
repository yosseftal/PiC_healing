import { expect, test } from "@playwright/test";

for (const locale of ["en", "he"] as const) {
  test(`${locale} registration preserves the same inquiry through verification, reload, resend and discard cancellation`,
    async ({ page }) => {
      const en = locale === "en";
      await page.setViewportSize({ width: 320, height: 568 });
      const user = { id: "registration-owner", aud: "authenticated", app_metadata: {}, user_metadata: {},
        created_at: "2026-10-15T00:00:00Z", email: "fixture@example.com" };
      let signups = 0;
      let resends = 0;
      await page.route("**/auth/v1/**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/signup")) {
          signups++;
          const body = route.request().postDataJSON();
          expect(body.data.full_name).toBe("New Event Manager");
          expect(body.password).toBe("  exact password  ");
          await route.fulfill({ json: user });
        } else if (path.endsWith("/resend")) {
          resends++;
          await route.fulfill({ json: {} });
        } else {
          await route.fulfill({ status: 400, headers: { "x-supabase-api-version": "2024-01-01",
            "access-control-expose-headers": "x-supabase-api-version" },
            json: { code: "email_not_confirmed", msg: "Email not confirmed" } });
        }
      });
      await page.goto(`/tests/registration.fixture.html?locale=${locale}`);
      const gate = page.getByRole("dialog", { name: en ? "Keep your session" : "שמירת הסשן שלך" });
      await expect(gate).toBeFocused();
      const before = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
      expect(before).not.toBeNull();
      const switchMode = gate.getByRole("button", { name: en ? "Create an account" : "יצירת חשבון", exact: true });
      await switchMode.focus();
      await page.keyboard.press("Enter");
      await expect(gate.getByRole("button", { name: en ? "I already have an account" : "כבר יש לי חשבון" })).toBeFocused();
      await gate.getByLabel(en ? "Name" : "שם", { exact: true }).fill("  New Event Manager  ");
      await gate.getByLabel(en ? "Email address" : "כתובת אימייל").fill("fixture@example.com");
      await gate.getByLabel(en ? "Password" : "סיסמה").fill("  exact password  ");
      await gate.getByRole("button", { name: en ? "Register" : "הרשמה", exact: true }).click();
      const guidance = en ? "Check your email for a verification message." : "יש לבדוק באימייל אם התקבלה הודעת אימות.";
      await expect(gate.getByText(guidance, { exact: false })).toBeVisible();
      expect(signups).toBe(1);
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
      await page.reload();
      await expect(gate.getByText(guidance, { exact: false })).toBeVisible();
      await expect(gate.getByLabel(en ? "Email address" : "כתובת אימייל")).toHaveValue("fixture@example.com");
      await expect(gate.getByLabel(en ? "Password" : "סיסמה")).toHaveValue("");
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
      await gate.getByRole("button", { name: en ? "Resend verification email" : "שליחת הודעת אימות נוספת" }).click();
      await expect(gate.getByRole("status").filter({ hasText: en ? "resend request was accepted" : "בקשת השליחה התקבלה" }))
        .toBeVisible();
      expect(resends).toBe(1);
      await gate.getByLabel(en ? "Password" : "סיסמה").fill("password");
      await gate.getByRole("button", { name: en ? "Sign in and save" : "התחברות ושמירה" }).click();
      await expect(gate.getByRole("alert")).toContainText(guidance);
      const decline = gate.getByRole("button", { name: en ? "Continue without saving" : "המשך ללא שמירה", exact: true });
      await decline.click();
      const keep = page.getByRole("button", { name: en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי", exact: true });
      await expect(keep).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(decline).toBeFocused();
      expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
      const geometry = await gate.evaluate((element) => ({
        top: element.getBoundingClientRect().top, bottom: element.getBoundingClientRect().bottom,
        overflow: getComputedStyle(element).overflowY, documentWidth: document.documentElement.scrollWidth,
      }));
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(568);
      expect(geometry.overflow).toBe("auto");
      expect(geometry.documentWidth).toBeLessThanOrEqual(320);
    });
}
