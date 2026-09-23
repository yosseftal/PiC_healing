import { expect, test } from "@playwright/test";

test("loads semantic tokens and full-size app roots in a real browser", async ({ page }) => {
  await page.goto("/");

  const foundation = await page.evaluate(() => {
    const root = document.querySelector<HTMLElement>("#root");
    if (root === null) {
      throw new Error("Expected #root");
    }

    const rootStyle = getComputedStyle(root);
    const bodyStyle = getComputedStyle(document.body);
    return {
      rootHeight: rootStyle.height,
      rootWidth: rootStyle.width,
      bodyMargin: bodyStyle.margin,
      sterile: rootStyle.getPropertyValue("--color-pic-sterile").trim(),
      standardMotion: rootStyle.getPropertyValue("--motion-pic-standard").trim(),
    };
  });

  expect(foundation).toEqual({
    rootHeight: "720px",
    rootWidth: "1280px",
    bodyMargin: "0px",
    sterile: "#F7F9F5",
    standardMotion: "240ms",
  });
});

test("removes spatial motion when reduced motion is preferred", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");

  const reducedMotion = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      step: style.getPropertyValue("--distance-pic-step-active").trim(),
      drawer: style.getPropertyValue("--distance-pic-drawer-active").trim(),
      duration: style.getPropertyValue("--motion-pic-spatial-active").trim(),
    };
  });

  expect(reducedMotion).toEqual({ step: "0px", drawer: "0%", duration: "0ms" });
  await context.close();
});
