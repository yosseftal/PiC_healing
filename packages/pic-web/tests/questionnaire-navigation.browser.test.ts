import { enterQuestionnaire } from "./questionnaire-entry";
import { expect, test } from "@playwright/test";

for (const locale of ["he", "en"] as const) for (const reduced of [false, true]) {
  test(`${locale} questionnaire Back, help return and keyboard focus (${reduced ? "reduced" : "ordinary"} motion)`,
    async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
      await page.goto(`/tests/symptom-creation.fixture.html?locale=${locale}`);
      await enterQuestionnaire(page, locale);
      const he = locale === "he";
      const active = page.locator(".pic-horizontal-slide-panel:not([inert])");
      const name = he ? "שם הסימפטום" : "Symptom name";
      const score = he ? "עוצמת הפרעה / סבל" : "Interference / suffering intensity";
      const back = active.getByTestId("questionnaire-back");
      await active.getByLabel(name).fill("Pending צוואר");
      await active.getByLabel(score).selectOption("8");
      await active.getByLabel(score).focus();
      await back.focus(); await page.keyboard.press("Enter");
      await expect(active.getByTestId("questionnaire-preparation")).toBeVisible();
      await active.getByRole("button", { name: he ? "חזרה לשאלון" : "Return to questionnaire" }).focus();
      await page.keyboard.press("Enter");
      await expect(active.getByLabel(score)).toBeFocused();
      await expect(active.getByLabel(name)).toHaveValue("Pending צוואר");
      await page.setViewportSize({ width: 320, height: 420 });
      await active.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities" }).click();
      await page.getByRole("button", { name: he ? "English" : "עברית", exact: true }).click();
      await page.getByRole("button", { name: he ? "Close utilities" : "סגירת הכלים" }).click();
      await expect(active.getByLabel(he ? "Symptom name" : "שם הסימפטום")).toHaveValue("Pending צוואר");
      await active.getByRole("button", { name: he ? "Open utilities" : "פתיחת הכלים" }).click();
      await page.getByRole("button", { name: he ? "עברית" : "English", exact: true }).click();
      await page.getByRole("button", { name: he ? "סגירת הכלים" : "Close utilities" }).click();
      await expect(active.getByLabel(score)).toHaveValue("8");
      await page.setViewportSize({ width: 320, height: 568 });
      await active.getByTestId("finish-symptom-addition").click();
      await expect(active.getByTestId("muscle-test-no")).toBeVisible();
      await expect(page.getByTestId("horizontal-slide-container")).toHaveAttribute("data-transition-direction", "forward");
      await active.getByTestId("muscle-test-no").click();
      await expect(active.getByTestId("split-advisory")).toBeVisible();
      await active.getByTestId("dismiss-split-advisory").click();
      await active.getByTestId("finalize-anyway").focus();
      const writes = await page.locator("#root").getAttribute("data-action-calls");
      await active.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities" }).click();
      await page.getByRole("button", { name: he ? "הכנה לשאלון" : "Questionnaire preparation", exact: true }).click();
      await expect(active.getByTestId("questionnaire-preparation")).toBeVisible();
      await active.getByRole("button", { name: he ? "חזרה לשאלון" : "Return to questionnaire" }).click();
      await expect(active.getByTestId("finalize-anyway")).toBeFocused();
      await expect(active.getByTestId("split-advisory")).toHaveCount(0);
      await back.click();
      await expect(active.getByTestId("muscle-test-yes")).toBeVisible();
      await active.getByRole("button", { name: he ? "המשך" : "Continue", exact: true }).click();
      await expect(active.getByTestId("finalize-anyway")).toBeVisible();
      await expect(active.getByTestId("split-advisory")).toHaveCount(0);
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", writes!);
      await active.getByTestId("finalize-anyway").click();
      await active.getByTestId("confirm-group-summary").click();
      await expect(active.getByTestId("guest-flow-pick-treatment")).toBeVisible();
      await back.click();
      await expect(active.getByTestId("confirm-group-summary")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("dir", he ? "rtl" : "ltr");
      expect(await page.evaluate(() => ({ x: scrollX, y: scrollY,
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })))
        .toEqual({ x: 0, y: 0, width: 320, height: 568 });
    });
}
