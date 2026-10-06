import { expect, test } from "@playwright/test";

const fixturePath = "/tests/therapeutic-sheet.fixture.html";

async function openSheet(page: import("@playwright/test").Page, direction: "ltr" | "rtl" = "ltr") {
  await page.goto(`${fixturePath}?direction=${direction}`);
  const trigger = page.locator('button[aria-label="Open session utilities"]');
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "Session utilities" });
  await expect(sheet).toBeVisible();
  await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);
  return { sheet, trigger };
}

test("traps focus, makes the background inert, and restores focus for every close path", async ({ page }) => {
  const { sheet, trigger } = await openSheet(page);
  const fixtureRoot = page.locator("#sheet-fixture-root");

  await expect(fixtureRoot).toHaveAttribute("inert", "");
  await expect(fixtureRoot).toHaveAttribute("aria-hidden", "true");
  await expect(page.getByRole("button", { name: "Close session utilities" })).toBeVisible();

  for (let index = 0; index < 65; index += 1) {
    await page.keyboard.press("Tab");
    await expect
      .poll(async () => sheet.evaluate((element) => element.contains(document.activeElement)))
      .toBe(true);
  }

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect(fixtureRoot).not.toHaveAttribute("inert", "");
  await expect(fixtureRoot).not.toHaveAttribute("aria-hidden", "true");

  await trigger.click();
  await page.getByRole("button", { name: "Close session utilities" }).click();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByTestId("therapeutic-sheet-overlay").click({ position: { x: 10, y: 10 } });
  await expect(trigger).toBeFocused();
});

test("keeps oversized utility content inside the Sheet at phone and desktop widths", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    const { sheet, trigger } = await openSheet(page);
    const scrollRegion = page.getByRole("region", { name: "Session utilities content" });
    const dimensions = await scrollRegion.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));

    expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight);
    await scrollRegion.evaluate((element) => {
      element.scrollTop = 500;
    });
    await expect.poll(() => scrollRegion.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);

    const triggerBox = await trigger.boundingBox();
    const box = await sheet.boundingBox();
    expect(triggerBox).not.toBeNull();
    expect(triggerBox!.width).toBeGreaterThanOrEqual(44);
    expect(triggerBox!.height).toBeGreaterThanOrEqual(44);
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(viewport.width - 16);
    if (viewport.width >= 768) {
      expect(box!.width).toBeLessThanOrEqual(448);
    }
  }
});

test("places the Sheet at logical inline-end in LTR and RTL", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  const { sheet: ltrSheet } = await openSheet(page, "ltr");
  const ltrBox = await ltrSheet.boundingBox();
  expect(ltrBox).not.toBeNull();
  expect(ltrBox!.x + ltrBox!.width).toBeCloseTo(1000, 0);

  await page.keyboard.press("Escape");
  const { sheet: rtlSheet } = await openSheet(page, "rtl");
  const rtlBox = await rtlSheet.boundingBox();
  expect(rtlBox).not.toBeNull();
  expect(rtlBox!.x).toBeCloseTo(0, 0);
});

async function observeDrawerMotion(page: import("@playwright/test").Page, buttonLabel: string) {
  // Register before the action and sample in the browser event turn. Protocol latency cannot miss a short animation.
  return page.evaluate((label) => new Promise<{
    duration: number; start: number; middle: number; hidden: string | null; inert: boolean;
  }>((resolve, reject) => {
    const button = document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
    if (button === null) {
      reject(new Error(`Missing Sheet control: ${label}`));
      return;
    }
    function observe(event: AnimationEvent) {
      const element = event.target;
      if (!(element instanceof HTMLElement) || element.dataset.testid !== "therapeutic-sheet-content") return;
      document.removeEventListener("animationstart", observe);
      const animation = element.getAnimations()[0];
      if (animation === undefined) {
        reject(new Error("Sheet animation started without an observable CSS animation"));
        return;
      }
      animation.pause();
      animation.currentTime = 0;
      const start = new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
      animation.currentTime = 140;
      const middle = new DOMMatrixReadOnly(getComputedStyle(element).transform).m41;
      animation.play();
      resolve({
        duration: Number(animation.effect?.getTiming().duration), start, middle,
        hidden: element.getAttribute("aria-hidden"), inert: element.hasAttribute("inert"),
      });
    }
    document.addEventListener("animationstart", observe);
    button.click();
  }), buttonLabel);
}

test("slides into view and retains its exit visual for 280ms in each logical direction", async ({ page }) => {
  for (const direction of ["ltr", "rtl"] as const) {
    await page.goto(`${fixturePath}?direction=${direction}`);
    const entrance = await observeDrawerMotion(page, "Open session utilities");
    const sheet = page.getByRole("dialog", { name: "Session utilities" });
    expect(entrance.duration).toBe(280);
    expect(Math.abs(entrance.start)).toBeGreaterThan(Math.abs(entrance.middle));
    expect(Math.abs(entrance.middle)).toBeGreaterThan(0);
    expect(Math.sign(entrance.start)).toBe(direction === "ltr" ? 1 : -1);
    await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);

    const exit = await observeDrawerMotion(page, "Close session utilities");
    expect(exit.duration).toBe(280);
    expect(exit.start).toBe(0);
    expect(exit.hidden).toBe("true");
    expect(exit.inert).toBe(true);
    expect(Math.sign(exit.middle)).toBe(direction === "ltr" ? 1 : -1);
    await expect(page.getByTestId("therapeutic-sheet-content")).toHaveCount(0);
  }
});

test("removes drawer translation when reduced motion is preferred", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const { sheet } = await openSheet(page);

  const motion = await sheet.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      duration: style.transitionDuration,
      transform: style.transform,
    };
  });

  expect(motion.transform).toBe("none");
  expect(Number.parseFloat(motion.duration)).toBeLessThanOrEqual(0.00001);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("therapeutic-sheet-content")).toHaveCount(0);
  await context.close();
});
