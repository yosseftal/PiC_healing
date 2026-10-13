import { expect, test, type Locator } from "@playwright/test";
import { expectReadable } from "./palette-contrast";

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
  expect(presentation.borderColor).toBe("rgb(69, 69, 69)");
  expect(presentation.background).toBe("rgb(255, 255, 255)");
  expect(presentation.outline).toBeGreaterThanOrEqual(3);
  expect(presentation.outlineColor).toBe("rgb(101, 89, 106)");
  expect(presentation.shadow).toContain("rgb(91, 156, 133)");
  await expectReadable(control, true, true);
}

test("form inputs expose boundaries and focus while native rating controls remain usable", async ({ page }) => {
  await page.goto("/tests/control-affordance.fixture.html");
  await page.keyboard.press("Tab");
  const groupName = page.getByRole("textbox", { name: "Group name" });
  await expectInputAffordance(groupName);
  await groupName.fill("Grounding");
  const confirm = page.getByRole("button", { name: "Confirm group name" });
  await expectReadable(confirm, true);
  await confirm.hover();
  await expectReadable(confirm, true);
  await confirm.focus();
  await expectReadable(confirm, true, true);
  await page.keyboard.down("Space");
  await expectReadable(confirm, true);
  await page.keyboard.up("Space");
  await page.keyboard.press("Tab");
  await expectInputAffordance(page.getByRole("textbox", { name: "Symptom name" }));
  await expectInputAffordance(page.getByRole("combobox", { name: "Polarity" }));

  const slider = page.getByRole("slider", { name: "Intensity" });
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await expect(slider).toHaveValue("6");
  expect(await slider.evaluate((element) => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);

  await page.goto("/tests/control-affordance.fixture.html?stage=picker");
  await page.getByRole("button", { name: "Open utilities" }).click();
  const english = page.getByRole("button", { name: "English", exact: true });
  await expect(english).toHaveAttribute("aria-pressed", "true");
  await expectReadable(english, true);
  await english.hover();
  await expectReadable(english, true);
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
