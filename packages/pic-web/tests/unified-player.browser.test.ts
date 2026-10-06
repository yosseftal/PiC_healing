import { expect, test, type Page } from "@playwright/test";

const viewports = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];

async function openPlayer(page: Page, direction: "ltr" | "rtl" = "ltr") {
  await page.goto(`/tests/unified-player.fixture.html?direction=${direction}`);
  await expect(page.getByRole("heading", { name: "Long guidance" })).toBeVisible();
}

async function openUtilities(page: Page) {
  await page.getByRole("button", { name: "Open Player utilities" }).click();
  const dialog = page.getByRole("dialog", { name: "Player utilities" });
  await expect(dialog).toBeVisible();
  await expect.poll(() => dialog.evaluate((element) => element.getAnimations().length)).toBe(0);
  return dialog;
}

async function jumpTo(page: Page, index: number) {
  const dialog = await openUtilities(page);
  const buttons = dialog.getByRole("navigation", { name: "Navigation tree" }).getByRole("button");
  await (index < 0 ? buttons.last() : buttons.nth(index)).click();
  await expect(dialog).toBeHidden();
}

test("Player makes utilities discoverable and gives every navigation control a full touch target", async ({ page }) => {
  await page.setViewportSize(viewports[0]!);
  await openPlayer(page);
  await expect(page.getByRole("button", { name: "Open Player utilities" })).toHaveText("Utilities");
  const dialog = await openUtilities(page);
  const controls = await dialog.getByRole("button").evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return { width: box.width, height: box.height, border: Number.parseFloat(style.borderTopWidth) };
  }));
  for (const control of controls) {
    expect(control.width).toBeGreaterThanOrEqual(44);
    expect(control.height).toBeGreaterThanOrEqual(44);
    expect(control.border).toBeGreaterThanOrEqual(1);
  }
});

test("guidance headings and card focus remain readable inside clipping boundaries", async ({ page }) => {
  await page.setViewportSize(viewports[0]!);
  await openPlayer(page);
  const headingStyle = await page.getByRole("heading", { name: "Long guidance" }).evaluate((element) => {
    const style = getComputedStyle(element);
    return { size: Number.parseFloat(style.fontSize), weight: style.fontWeight };
  });
  expect(headingStyle.size).toBeGreaterThanOrEqual(20);
  expect(headingStyle.weight).toBe("600");
  await page.keyboard.press("Tab");
  const card = page.getByRole("region", { name: "Atomic Unit guidance" });
  await card.focus();
  const indicator = await card.evaluate((element) => {
    const style = getComputedStyle(element);
    return { width: Number.parseFloat(style.outlineWidth), offset: Number.parseFloat(style.outlineOffset) };
  });
  expect(indicator.width).toBeGreaterThanOrEqual(3);
  expect(indicator.offset).toBeLessThanOrEqual(-indicator.width);
});

test("sovereign Finish opens a Persistence Gate with visible full-size controls and keyboard focus", async ({ page }) => {
  await page.setViewportSize(viewports[0]!);
  await openPlayer(page);
  const dialog = await openUtilities(page);
  await dialog.getByRole("button", { name: "Finish Anyway" }).click();
  await expect(dialog).toBeHidden();
  const gate = page.getByRole("dialog", { name: "Keep your session" });
  await expect(gate).toBeVisible();
  for (const control of await gate.getByRole("button").all()) {
    const style = await control.evaluate((element) => ({
      height: element.getBoundingClientRect().height,
      width: element.getBoundingClientRect().width,
      borderWidth: Number.parseFloat(getComputedStyle(element).borderTopWidth),
    }));
    expect(style.height).toBeGreaterThanOrEqual(44);
    expect(style.width).toBeGreaterThanOrEqual(44);
    expect(style.borderWidth).toBeGreaterThanOrEqual(1);
  }
  await expect(gate.getByRole("button", { name: "Sign in with Apple (stub)" })).toBeDisabled();
  await expect(gate.getByRole("button", { name: "Sign in with Google (stub)" })).toBeDisabled();
  const enabledOpacity = await gate.getByRole("button", { name: "Sign in (dev tracer stub)", exact: true })
    .evaluate((element) => Number.parseFloat(getComputedStyle(element).opacity));
  for (const name of ["Sign in with Apple (stub)", "Sign in with Google (stub)"]) {
    const opacity = await gate.getByRole("button", { name }).evaluate(
      (element) => Number.parseFloat(getComputedStyle(element).opacity),
    );
    expect(opacity).toBeLessThan(enabledOpacity);
  }
  await page.keyboard.press("Tab");
  const signIn = gate.getByRole("button", { name: "Sign in (dev tracer stub)", exact: true });
  await signIn.focus();
  await expect(signIn).toHaveCSS("outline-color", "rgb(111, 86, 143)");
  await expect(signIn).toHaveCSS("outline-width", "3px");
  await gate.getByRole("button", { name: "Continue without saving" }).click();
  await expect(gate).toBeHidden();
});

test("composed Player locks four viewport classes and scrolls long guidance inside its card", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await openPlayer(page);
    const card = page.getByRole("region", { name: "Atomic Unit guidance" });
    const geometry = await page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>(".pic-therapeutic-frame");
      const header = document.querySelector<HTMLElement>(".pic-therapeutic-frame__header");
      const utility = document.querySelector<HTMLElement>("[aria-label='Open Player utilities']");
      if (frame === null || header === null || utility === null) throw new Error("Player frame is incomplete");
      return {
        documentHeight: document.documentElement.scrollHeight,
        documentWidth: document.documentElement.scrollWidth,
        frame: frame.getBoundingClientRect().toJSON(),
        header: header.getBoundingClientRect().toJSON(),
        utility: utility.getBoundingClientRect().toJSON(),
        paddingBlockStart: Number.parseFloat(getComputedStyle(frame).paddingBlockStart),
        paddingInlineEnd: Number.parseFloat(getComputedStyle(frame).paddingInlineEnd),
      };
    });
    expect(geometry.documentHeight).toBeLessThanOrEqual(viewport.height);
    expect(geometry.documentWidth).toBeLessThanOrEqual(viewport.width);
    expect(geometry.frame.width).toBe(viewport.width);
    expect(geometry.frame.height).toBe(viewport.height);
    expect(geometry.utility.width).toBeGreaterThanOrEqual(44);
    expect(geometry.utility.height).toBeGreaterThanOrEqual(44);
    expect(geometry.header.y).toBeGreaterThanOrEqual(geometry.paddingBlockStart);
    expect(viewport.width - geometry.utility.right).toBeGreaterThanOrEqual(geometry.paddingInlineEnd);

    const before = await card.evaluate((element) => ({
      client: element.clientHeight,
      scroll: element.scrollHeight,
      overflow: getComputedStyle(element).overflowY,
    }));
    expect(before.scroll).toBeGreaterThan(before.client);
    expect(before.overflow).toBe("auto");
    await card.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    expect(await card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
    await expect(page.getByRole("button", { name: "Open Player utilities" })).toBeVisible();
  }
});

test("Navigation Tree keeps wide GFM and long Sheet content inside the Player", async ({ page }) => {
  await page.setViewportSize(viewports[0]!);
  await openPlayer(page);
  await jumpTo(page, 1);
  await expect(page.getByRole("heading", { name: "Guidance table" })).toBeFocused();
  const table = page.getByRole("region", { name: "Guidance table" });
  const sizes = await table.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    overflow: getComputedStyle(element).overflowX,
  }));
  expect(sizes.scroll).toBeGreaterThan(sizes.client);
  expect(sizes.overflow).toBe("auto");
  await table.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
  expect(await table.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  const dialog = await openUtilities(page);
  await expect(dialog.getByRole("button", { name: "Finish Anyway" })).toBeEnabled();
  const region = dialog.getByRole("region", { name: "Player utilities content" });
  const sheetSizes = await region.evaluate((element) => ({
    client: element.clientHeight,
    scroll: element.scrollHeight,
  }));
  expect(sheetSizes.scroll).toBeGreaterThan(sheetSizes.client);
  await region.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
});

test("Terminal NEMAR preserves two choices, revision, Integrating, and sovereign Finish Anyway", async ({ page }) => {
  await page.setViewportSize(viewports[1]!);
  await openPlayer(page);
  await jumpTo(page, -1);
  await expect(page.getByRole("heading", { name: "Terminal NEMAR" })).toBeFocused();
  const actions = page.getByRole("group", { name: "Available actions" });
  await expect(actions.getByRole("button")).toHaveCount(2);
  await expect(page.getByTestId("therapeutic-banner")).toHaveCount(0);
  let dialog = await openUtilities(page);
  await expect(dialog.getByRole("button", { name: "Finish Anyway" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await actions.getByRole("button", { name: "No" }).click();
  await expect(page.getByText(/This session is Integrating/)).toBeVisible();
  await expect(actions.getByRole("button")).toHaveCount(1);
  dialog = await openUtilities(page);
  await expect(dialog.getByRole("button", { name: "Finish Anyway" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await actions.getByRole("button", { name: "Change response" }).click();
  await expect(actions.getByRole("button")).toHaveCount(2);
  await actions.getByRole("button", { name: "Yes" }).click();
  await expect(actions.getByRole("button", { name: "Finish", exact: true })).toBeVisible();
  await expect(actions.getByRole("button")).toHaveCount(2);
  await expect(page.getByTestId("therapeutic-banner")).toHaveCount(1);
  dialog = await openUtilities(page);
  await expect(dialog.getByRole("button", { name: "Finish Anyway" })).toBeEnabled();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open Player utilities" })).toBeFocused();
});

test("Player remains usable at a half-size CSS viewport equivalent to 200 percent browser zoom", async ({ page }) => {
  await page.setViewportSize({ width: 195, height: 422 });
  await openPlayer(page);
  const card = page.getByRole("region", { name: "Atomic Unit guidance" });
  await card.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(195);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(422);
  const dialog = await openUtilities(page);
  const finishAnyway = dialog.getByRole("button", { name: "Finish Anyway" });
  await finishAnyway.scrollIntoViewIfNeeded();
  await expect(finishAnyway).toBeInViewport();
  await expect(finishAnyway).toBeEnabled();
});

test("200 percent zoom, reduced motion, and RTL preserve Player access and logical direction", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.setViewportSize(viewports[1]!);
  await openPlayer(page, "rtl");
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });
  const card = page.getByRole("region", { name: "Atomic Unit guidance" });
  await card.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  expect(await card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollTop)).toBe(0);
  expect(await page.evaluate(() => window.visualViewport?.scale)).toBe(2);
  const zoomedDialog = await openUtilities(page);
  const nextUnit = zoomedDialog.getByRole("navigation", { name: "Navigation tree" }).getByRole("button").nth(1);
  await nextUnit.focus();
  await page.keyboard.press("Enter");
  await expect(zoomedDialog).toBeHidden();
  await expect(page.getByRole("heading", { name: "Guidance table" })).toBeFocused();
  const slide = page.getByTestId("horizontal-slide-container");
  await expect(slide.locator("[data-translation='none']")).toHaveCount(1);
  const dialog = await openUtilities(page);
  const sheet = await dialog.boundingBox();
  expect(sheet).not.toBeNull();
  expect(sheet!.x).toBeCloseTo(0, 0);
  await context.close();
});
