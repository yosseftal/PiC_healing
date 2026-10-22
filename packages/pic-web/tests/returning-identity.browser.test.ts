import { expect, test } from "@playwright/test";

for (const locale of ["he", "en"] as const) {
  test(`${locale} retained local draft requires its owner and keeps keyboard confirmation reversible`, async ({ page }) => {
    const en = locale === "en";
    await page.setViewportSize({ width: 320, height: 568 });
    const user = { id: "retained-owner", email: "returning@example.com", aud: "authenticated",
      app_metadata: {}, user_metadata: {}, created_at: "2026-10-15", email_confirmed_at: "2026-10-15" };
    const draft = { owner: user.id, generation: 3, phase: "draft", group: {
      id: "retained-group", name: "Retained private group", created_at: "2026-10-15", symptoms: [],
      joint_treatment_muscle_test: null, joint_treatment_test_at: null,
    } };
    await page.addInitScript((value) => {
      localStorage.setItem("pic-web.authenticated-draft.v1", JSON.stringify(value));
    }, draft);
    let therapeuticRequests = 0;
    let identityReads = 0;
    await page.route("**/rest/v1/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname.endsWith("/profiles") &&
        url.searchParams.get("select") === "full_name" && url.searchParams.get("id") === `eq.${user.id}`) {
        identityReads++;
        await route.fulfill({ json: [] });
        return;
      }
      therapeuticRequests++;
      await route.abort();
    });
    await page.route("**/auth/v1/**", async (route) => {
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith("/token")) {
        const token = [btoa(JSON.stringify({ alg: "HS256", typ: "JWT" })),
          btoa(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 })), "fixture"].join(".");
        await route.fulfill({ json: { user, access_token: token, refresh_token: "fixture-refresh",
          expires_in: 3600, token_type: "bearer" } });
      } else await route.fulfill({ json: user });
    });
    await page.goto(`/tests/returning-identity.fixture.html?locale=${locale}`);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("dir", en ? "ltr" : "rtl");
    await expect(page.getByText(draft.group.name)).toHaveCount(0);
    await dialog.getByLabel(en ? "Email address" : "כתובת אימייל").fill(user.email);
    await dialog.getByLabel(en ? "Password" : "סיסמה").fill("fixture-password");
    await dialog.getByRole("button", { name: en ? "Sign in again" : "התחברות מחדש", exact: true }).click();
    await expect(dialog.getByText(draft.group.name)).toBeVisible();
    await expect(dialog.getByText(en ? "Your local draft is retained" : "הטיוטה המקומית נשמרה במכשיר")).toBeVisible();
    await expect(dialog.locator("form")).toHaveCount(0);
    const start = dialog.getByRole("button", { name: en ? "New symptom group" : "קבוצת סימפטומים חדשה", exact: true });
    await start.click();
    const keep = dialog.getByRole("button", { name: en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי", exact: true });
    await expect(keep).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(start).toBeFocused();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("pic-web.authenticated-draft.v1")!).group.id))
      .toBe(draft.group.id);
    const geometry = await dialog.evaluate((element) => ({ top: element.getBoundingClientRect().top,
      bottom: element.getBoundingClientRect().bottom, overflow: getComputedStyle(element).overflowY }));
    expect(geometry.top).toBeGreaterThanOrEqual(0); expect(geometry.bottom).toBeLessThanOrEqual(568);
    expect(geometry.overflow).toBe("auto");
    expect(identityReads).toBe(1);
    expect(therapeuticRequests).toBe(0);
  });
}
