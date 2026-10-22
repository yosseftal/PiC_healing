import { expect, test } from "@playwright/test";
import type { SymptomGroup } from "pic-engine";

for (const locale of ["he", "en"] as const) {
  for (const retry of [false, true]) {
    test(`${locale} unified rows validate, reorder and ${retry ? "retry" : "commit"} one complete untitled list`,
      async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(`/tests/symptom-creation.fixture.html?locale=${locale}&retry=${retry ? "1" : "0"}`);
      const he = locale === "he";
      const name = he ? "שם הסימפטום" : "Symptom name";
      const polarity = he ? "קוטביות" : "Polarity";
      const negative = he ? "עוצמת הפרעה / סבל" : "Interference / suffering intensity";
      const positive = he ? "עוצמת החוויה החיובית" : "Strength of the positive experience";
      const up = he ? "העלאת הנושא בסדר העדיפות" : "Move topic up";
      const rows = page.getByTestId("questionnaire-row");
      const finish = page.getByTestId("finish-symptom-addition");
      await expect(rows).toHaveCount(1);
      await expect(rows.first().getByLabel(negative)).toHaveValue("");
      await expect(rows.first().getByLabel(negative).locator('option[value="0"]')).toHaveCount(0);
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "0");
      await finish.click();
      await expect(rows.first().getByLabel(name)).toBeFocused();
      await expect(rows.first().getByLabel(name)).toHaveAttribute("aria-invalid", "true");
      await rows.first().getByLabel(name).fill("Neck צוואר");
      await finish.click();
      await expect(rows.first().getByLabel(negative)).toBeFocused();
      await rows.first().getByLabel(negative).selectOption("1");
      await page.getByTestId("add-symptom-action").click();
      await expect(rows).toHaveCount(2);
      await expect(rows.nth(1).getByLabel(name)).toBeFocused();
      await expect(rows.nth(1).getByLabel(name)).toHaveValue("");
      await expect(rows.nth(1).getByLabel(negative)).toHaveValue("");
      await finish.click();
      await expect(rows).toHaveCount(2);
      await rows.nth(1).getByLabel(name).fill("Neck צוואר");
      await rows.nth(1).getByLabel(negative).selectOption("10");
      await page.getByTestId("add-symptom-action").click();
      await rows.nth(2).getByLabel(name).fill("Strength כוח");
      await rows.nth(2).getByLabel(negative).selectOption("8");
      await rows.nth(2).getByLabel(polarity).selectOption("positive");
      await expect(rows.nth(2).getByLabel(positive)).toHaveValue("8");
      const id = await rows.nth(2).getAttribute("data-topic-id");
      const moved = page.locator(`[data-topic-id="${id}"]`);
      for (let index = 0; index < 2; index += 1) {
        await moved.getByRole("button", { name: up, exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(moved.getByRole("button", { name: index === 0 ? up :
          he ? "הורדת הנושא בסדר העדיפות" : "Move topic down", exact: true })).toBeFocused();
      }
      await expect(rows.first()).toHaveAttribute("data-topic-id", id!);
      await expect(moved.getByRole("button", { name: up, exact: true })).toBeDisabled();
      await expect(moved.getByLabel(positive)).toHaveValue("8");
      await expect(page.getByTestId("symptom-count")).toHaveCount(0);
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "0");
      await expect(page.getByRole("group", { name: he ? "פעולות זמינות" : "Available actions" })
        .getByRole("button")).toHaveCount(2);
      if (he && !retry) {
        await page.locator(".pic-questionnaire-preparation summary").click();
        await page.locator(".pic-therapeutic-content-card").evaluate((node) => { node.scrollTop = 0; });
        await page.screenshot({ path: testInfo.outputPath("he-320-unified-rows.png") });
      }
      await finish.click();
      let submitted: string | null = null;
      if (retry) {
        await expect(page.locator("#root")).toHaveAttribute("data-action-calls", "1");
        submitted = await page.locator("#root").getAttribute("data-submitted-group");
        await expect(rows).toHaveCount(3);
        await expect(moved.getByLabel(name)).toHaveValue("Strength כוח");
        await expect(moved.getByLabel(positive)).toHaveValue("8");
        await expect(page.getByTestId("muscle-test-yes")).toHaveCount(0);
        await finish.click();
      }
      await expect(page.getByTestId("muscle-test-yes")).toBeVisible();
      await expect(page.locator("#root")).toHaveAttribute("data-action-calls", retry ? "2" : "1");
      const saved = await page.locator("#root").getAttribute("data-saved-group");
      if (submitted !== null) expect(saved).toBe(submitted);
      const group = JSON.parse(saved!) as SymptomGroup;
      expect(group.name).toBe("");
      expect(group.symptoms.map((row) => [row.name, row.polarity, row.intensity])).toEqual([
        ["Strength כוח", "positive", 8], ["Neck צוואר", "negative", 1], ["Neck צוואר", "negative", 10],
      ]);
      expect(new Set(group.symptoms.map((row) => row.id)).size).toBe(3);
      expect(group.symptoms.every((row) => row.rated_at !== null)).toBe(true);
      expect(group.joint_treatment_muscle_test).toBeNull();
      await expect(page.getByText(he ? "האם נכון ומדויק לטפל בכל הרשימה ביחד?" :
        "Is it right and accurate to treat the whole list together?", { exact: true })).toBeVisible();
      await page.getByTestId(retry ? "muscle-test-no" : "muscle-test-yes").click();
      await expect.poll(async () => {
        const stored = await page.locator("#root").getAttribute("data-saved-group");
        return (JSON.parse(stored!) as SymptomGroup).joint_treatment_muscle_test;
      }).toBe(retry ? "split_suggested" : "together");
      const documentSize = await page.evaluate(() => ({
        width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
        x: scrollX, y: scrollY,
      }));
      expect(documentSize).toEqual({ width: 320, height: 568, x: 0, y: 0 });
    });
  }
}
