import { expect, test, type Locator } from "@playwright/test";

async function expectInputAffordance(control: Locator) {
  await control.focus();
  const presentation = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      borderWidth: Number.parseFloat(style.borderTopWidth),
      borderColor: style.borderTopColor,
      background: style.backgroundColor,
      outline: Number.parseFloat(style.outlineWidth),
      outlineColor: style.outlineColor,
      shadow: style.boxShadow,
    };
  });
  expect(presentation.height).toBeGreaterThanOrEqual(44);
  expect(presentation.borderWidth).toBeGreaterThanOrEqual(1);
  expect(presentation.borderColor).toBe("rgb(86, 99, 93)");
  expect(presentation.background).toBe("rgb(255, 255, 255)");
  expect(presentation.outline).toBeGreaterThanOrEqual(3);
  expect(presentation.outlineColor).toBe("rgb(111, 86, 143)");
  expect(presentation.shadow).toContain("rgb(127, 166, 135)");
}

test("form inputs expose boundaries and focus while native rating controls remain usable", async ({ page }) => {
  await page.goto("/tests/control-affordance.fixture.html");
  await page.keyboard.press("Tab");
  const groupName = page.getByRole("textbox", { name: "Group name" });
  await expectInputAffordance(groupName);
  await groupName.fill("Grounding");
  await page.getByRole("button", { name: "Confirm group name" }).click();
  await page.keyboard.press("Tab");
  await expectInputAffordance(page.getByRole("textbox", { name: "Symptom name" }));
  await expectInputAffordance(page.getByRole("combobox", { name: "Polarity" }));

  const slider = page.getByRole("slider", { name: "Intensity" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("6");
  expect(await slider.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  const checkbox = page.getByRole("checkbox", { name: "Link to this symptom group" });
  const label = checkbox.locator("..");
  expect(await label.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await checkbox.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThan(44);
  await label.click();
  await expect(checkbox).toBeChecked();
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).not.toBeChecked();
});
