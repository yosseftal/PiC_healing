import { expect, test, type Page } from "@playwright/test";

type FixtureOptions = {
  direction?: "ltr" | "rtl";
  viewport: { height: number; width: number };
};

async function openFixture(
  page: Page,
  { direction = "ltr", viewport }: FixtureOptions,
): Promise<void> {
  await page.setViewportSize(viewport);
  await page.goto(`/tests/therapeutic-frame.fixture.html?direction=${direction}`);
  await expect(page.getByRole("region", { name: "Therapeutic viewport" })).toBeVisible();
}

test("locks compact-phone and desktop documents to the dynamic viewport", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 1440, height: 900 },
  ]) {
    await openFixture(page, { viewport });

    const geometry = await page.evaluate(() => {
      const frame = document.querySelector<HTMLElement>(".pic-therapeutic-frame");
      const root = document.querySelector<HTMLElement>("#root");
      const stage = document.querySelector<HTMLElement>(".pic-therapeutic-frame__stage");
      if (frame === null || root === null || stage === null) {
        throw new Error("Expected root, frame, and stage");
      }
      const frameRect = frame.getBoundingClientRect();
      return {
        bodyOverflow: getComputedStyle(document.body).overflow,
        bodyOverscroll: getComputedStyle(document.body).overscrollBehavior,
        documentHeight: document.documentElement.scrollHeight,
        documentOverflow: getComputedStyle(document.documentElement).overflow,
        documentOverscroll: getComputedStyle(document.documentElement).overscrollBehavior,
        documentWidth: document.documentElement.scrollWidth,
        frameHeight: frameRect.height,
        frameOverflow: getComputedStyle(frame).overflow,
        frameWidth: frameRect.width,
        rootOverflow: getComputedStyle(root).overflow,
        stageOverflow: getComputedStyle(stage).overflow,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });

    expect(geometry.frameHeight).toBe(geometry.viewportHeight);
    expect(geometry.frameWidth).toBe(geometry.viewportWidth);
    expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight);
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.bodyOverflow).toBe("hidden");
    expect(geometry.bodyOverscroll).toBe("none");
    expect(geometry.documentOverflow).toBe("hidden");
    expect(geometry.documentOverscroll).toBe("none");
    expect(geometry.frameOverflow).toBe("hidden");
    expect(geometry.rootOverflow).toBe("hidden");
    expect(geometry.stageOverflow).toBe("hidden");
  }
});

test("keeps the header fixed while oversized guidance scrolls only inside its card", async ({ page }) => {
  await openFixture(page, { viewport: { width: 390, height: 844 } });

  const card = page.getByRole("region", { name: "Long guidance" });
  const header = page.locator("header");
  const headerBefore = await header.boundingBox();
  const documentBefore = await page.evaluate(() => ({
    x: document.documentElement.scrollLeft,
    y: document.documentElement.scrollTop,
  }));
  const cardOverflow = await card.evaluate((element) => ({
    clientHeight: element.clientHeight,
    overscrollBehavior: getComputedStyle(element).overscrollBehavior,
    overflowY: getComputedStyle(element).overflowY,
    scrollbarGutter: getComputedStyle(element).scrollbarGutter,
    scrollHeight: element.scrollHeight,
  }));

  expect(cardOverflow.scrollHeight).toBeGreaterThan(cardOverflow.clientHeight);
  expect(cardOverflow.overscrollBehavior).toBe("contain");
  expect(cardOverflow.overflowY).toBe("auto");
  expect(cardOverflow.scrollbarGutter).toBe("stable");
  await card.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const headerAfter = await header.boundingBox();
  const documentAfter = await page.evaluate(() => ({
    x: document.documentElement.scrollLeft,
    y: document.documentElement.scrollTop,
  }));

  expect(await card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  expect(headerAfter).toEqual(headerBefore);
  expect(documentAfter).toEqual(documentBefore);
  await expect(page.getByRole("button", { name: "Open utilities" })).toBeVisible();
});

test("contains a wide table in its own horizontal scroll region", async ({ page }) => {
  await openFixture(page, { viewport: { width: 320, height: 568 } });

  const tableScroller = page.getByRole("region", { name: "Wide treatment table" });
  const containment = await tableScroller.evaluate((element) => ({
    clientWidth: element.clientWidth,
    overflowX: getComputedStyle(element).overflowX,
    scrollWidth: element.scrollWidth,
  }));
  const documentWidth = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));

  expect(containment.scrollWidth).toBeGreaterThan(containment.clientWidth);
  expect(containment.overflowX).toBe("auto");
  expect(documentWidth.scroll).toBeLessThanOrEqual(documentWidth.client);
});

test("places the utility at logical inline-end in LTR and RTL", async ({ page }) => {
  for (const direction of ["ltr", "rtl"] as const) {
    await openFixture(page, {
      direction,
      viewport: { width: 390, height: 844 },
    });
    const heading = await page.getByRole("heading", { name: "Therapeutic viewport" }).boundingBox();
    const utility = await page.getByRole("button", { name: "Open utilities" }).boundingBox();

    if (heading === null || utility === null) {
      throw new Error("Expected heading and utility geometry");
    }
    if (direction === "ltr") {
      expect(utility.x).toBeGreaterThan(heading.x);
    } else {
      expect(utility.x).toBeLessThan(heading.x);
    }
  }
});

test("preserves internal access at 200 percent browser zoom", async ({ page }) => {
  await openFixture(page, { viewport: { width: 390, height: 844 } });
  const client = await page.context().newCDPSession(page);
  await client.send("Emulation.setPageScaleFactor", { pageScaleFactor: 2 });

  const card = page.getByRole("region", { name: "Long guidance" });
  await card.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });

  const zoomState = await page.evaluate(() => ({
    documentX: document.documentElement.scrollLeft,
    documentY: document.documentElement.scrollTop,
    scale: window.visualViewport?.scale,
  }));
  const cardAtEnd = await card.evaluate(
    (element) => element.scrollTop + element.clientHeight >= element.scrollHeight - 1,
  );

  expect(zoomState.scale).toBe(2);
  expect(zoomState.documentX).toBe(0);
  expect(zoomState.documentY).toBe(0);
  expect(cardAtEnd).toBe(true);
  await expect(page.getByRole("button", { name: "Open utilities" })).toBeVisible();
});
