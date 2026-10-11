import { expect, test, type Page } from "@playwright/test";

async function observeStep(page: Page, action: string, targetKey: string, switchLocale?: string, entering = false) {
  return page.evaluate(({ action, targetKey, switchLocale, entering }) => new Promise<{
    key: string; x: number; inert: boolean; hidden: boolean;
  }[]>((resolve, reject) => {
    const samples: { key: string; x: number; inert: boolean; hidden: boolean }[] = [];
    let frames = 0;
    let switched = false;
    let settledFrames = 0;
    function frame() {
      const panels = [...document.querySelectorAll<HTMLElement>("[data-active-key]")];
      for (const panel of panels) {
        const x = new DOMMatrixReadOnly(getComputedStyle(panel).transform).m41;
        samples.push({ key: panel.dataset.activeKey!, x,
          inert: panel.hasAttribute("inert"), hidden: panel.getAttribute("aria-hidden") === "true" });
      }
      const latest = samples.slice(-panels.length);
      if (switchLocale && !switched && latest.some((sample) => Math.abs(sample.x) > 0.1 &&
        (!entering || sample.key === targetKey))) {
        const selector = [...document.querySelectorAll<HTMLButtonElement>('[role="dialog"] button')]
          .find((button) => button.textContent === switchLocale)!;
        selector.focus();
        selector.click();
        switched = true;
      } else if (panels.length === 1 && latest[0]?.key === targetKey && Math.abs(latest[0].x) < 0.01 &&
        Number(getComputedStyle(panels[0]!).opacity) === 1 && (!switchLocale || switched)) {
        if (++settledFrames === 2) { resolve(samples); return; }
      } else settledFrames = 0;
      if (++frames > 180) reject(new Error("Step did not settle"));
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    [...document.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent?.trim() === action)!.click();
  }), { action, targetKey, switchLocale, entering });
}

async function observeReducedDrawer(page: Page, label: string, closing = false) {
  return page.evaluate(({ label, closing }) => new Promise<{ x: number; duration: number }[]>((resolve) => {
    const samples: { x: number; duration: number }[] = [];
    let settled = 0;
    function sample() {
      const sheet = document.querySelector<HTMLElement>(".pic-therapeutic-sheet");
      if (sheet) {
        const style = getComputedStyle(sheet);
        samples.push({ x: new DOMMatrixReadOnly(style.transform).m41, duration: parseFloat(style.animationDuration) });
      }
      return sheet;
    }
    const observer = new MutationObserver(sample);
    observer.observe(document.body, { childList: true, subtree: true });
    function frame() {
      const sheet = sample();
      if (closing ? sheet === null : sheet !== null && sheet.getAnimations().length === 0) settled += 1;
      if (settled === 2) { observer.disconnect(); resolve(samples); }
      else requestAnimationFrame(frame);
    }
    sample();
    requestAnimationFrame(frame);
    document.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!.click();
  }), { label, closing });
}

test("switching during Sheet entrance settles immediately on the new edge with focus and inertness intact", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/rtl-composition.fixture.html");
  await expect(page.getByRole("button", { name: "פתיחת הכלים" })).toBeVisible();
  const observation = await page.evaluate(() => new Promise<{ before: number; after: number; right: number }>((resolve) => {
    document.addEventListener("animationstart", function onStart(event) {
      const sheet = event.target;
      if (!(sheet instanceof HTMLElement) || !sheet.matches(".pic-therapeutic-sheet")) return;
      document.removeEventListener("animationstart", onStart);
      requestAnimationFrame(() => {
        const before = new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m41;
        const english = [...sheet.querySelectorAll<HTMLButtonElement>("button")]
          .find((button) => button.textContent === "English")!;
        english.focus();
        english.click();
        requestAnimationFrame(() => resolve({ before,
          after: new DOMMatrixReadOnly(getComputedStyle(sheet).transform).m41,
          right: sheet.getBoundingClientRect().right }));
      });
    });
    document.querySelector<HTMLButtonElement>('[aria-label="פתיחת הכלים"]')!.click();
  }));
  expect(observation.before).toBeLessThan(-1);
  expect(observation.after).toBe(0);
  expect(observation.right).toBeCloseTo(390, 0);
  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "English", exact: true })).toBeFocused();
  await expect(page.locator("#root")).toHaveAttribute("inert", "");
  for (const language of ["עברית", "English", "עברית"]) {
    await sheet.getByRole("button", { name: language, exact: true }).click();
    expect(await sheet.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
    await expect(sheet.getByRole("button", { name: language, exact: true })).toBeFocused();
    await expect(page.locator("#root")).toHaveAttribute("inert", "");
  }
});

for (const locale of ["he", "en"] as const) {
  for (const interrupted of [false, true]) {
    test(`later outgoing motion keeps both directions after ${interrupted ? "interruption" : "locale selection"} in ${locale}`,
      async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/tests/rtl-composition.fixture.html");
        await page.getByRole("button", { name: "פתיחת הכלים" }).click();
        const sheet = page.getByRole("dialog");
        await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);
        const language = locale === "he" ? "עברית" : "English";
        const opposite = locale === "he" ? "English" : "עברית";
        await sheet.getByRole("button", { name: opposite, exact: true }).click();
        if (interrupted) {
          await observeStep(page, "Forward", "second", language);
          await expect(sheet.getByLabel("Presentation completions")).toHaveText("1");
        } else {
          await sheet.getByRole("button", { name: language, exact: true }).click();
          await expect(sheet.getByLabel("Presentation completions")).toHaveText("0");
        }
        const actions = interrupted ? ["Backward", "Forward"] : ["Forward", "Backward"];
        for (const [index, action] of actions.entries()) {
          const previousKey = action === "Forward" ? "first" : "second";
          const targetKey = action === "Forward" ? "second" : "first";
          const samples = await observeStep(page, action, targetKey);
          const outgoing = samples.filter((sample) => sample.key === previousKey && Math.abs(sample.x) > 0.1);
          expect(outgoing.length, `${action} outgoing movement`).toBeGreaterThan(0);
          const distance = Math.max(...outgoing.map((sample) => Math.abs(sample.x)));
          expect(distance).toBeGreaterThan(24);
          expect(distance).toBeLessThanOrEqual(31.3);
          const expectedSign = (locale === "he" ? -1 : 1) * (action === "Forward" ? -1 : 1);
          expect(outgoing.every((sample) => Math.sign(sample.x) === expectedSign && sample.inert && sample.hidden)).toBe(true);
          await expect(sheet.getByLabel("Presentation completions")).toHaveText(String(index + (interrupted ? 2 : 1)));
          await expect(page.locator("[data-active-key]")).toHaveCount(1);
          await expect(sheet).toBeVisible();
          await expect(sheet.getByRole("button", { name: language, exact: true })).toBeFocused();
          await expect(page.locator("#root")).toHaveAttribute("inert", "");
        }
      });
  }

  test(`canonical forward/backward and neutral replacement have real logical transforms in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/tests/rtl-composition.fixture.html");
    if (locale === "en") {
      await page.getByRole("button", { name: "פתיחת הכלים" }).click();
      await page.getByRole("button", { name: "English", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
    }
    const forward = await observeStep(page, locale === "he" ? "הנחיה הבאה" : "Next guidance", "second");
    const entering = forward.filter((sample) => sample.key === "second" && Math.abs(sample.x) > 0.1);
    expect(entering.length).toBeGreaterThan(0);
    expect(entering.every((sample) => locale === "he" ? sample.x < 0 : sample.x > 0)).toBe(true);
    expect(forward.filter((sample) => sample.key === "first").every((sample) => sample.inert && sample.hidden)).toBe(true);
    const backward = await observeStep(page, locale === "he" ? "הנחיה קודמת" : "Previous guidance", "first");
    const returning = backward.filter((sample) => sample.key === "first" && Math.abs(sample.x) > 0.1);
    expect(returning.length).toBeGreaterThan(0);
    expect(returning.every((sample) => locale === "he" ? sample.x > 0 : sample.x < 0)).toBe(true);
    await page.getByRole("button", { name: /פתיחת הכלים|Open utilities/ }).click();
    await expect.poll(() => page.getByRole("dialog").evaluate((element) => element.getAnimations().length)).toBe(0);
    const neutral = await observeStep(page, "Replace order", "third");
    expect(neutral.every((sample) => sample.x === 0)).toBe(true);
    await expect(page.getByRole("dialog").getByLabel("Presentation completions")).toHaveText("3");
  });

  for (const entering of [false, true]) {
    test(`selector interrupts ${entering ? "entering" : "exiting"} navigation with Sheet focus in ${locale}`,
      async ({ page }) => {
    await page.goto("/tests/rtl-composition.fixture.html");
    await page.getByRole("button", { name: "פתיחת הכלים" }).click();
    const sheet = page.getByRole("dialog");
    if (locale === "en") await sheet.getByRole("button", { name: "English", exact: true }).click();
    await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);
    const target = locale === "he" ? "English" : "עברית";
    const samples = await observeStep(page, "Forward", "second", target, entering);
    expect(samples.some((sample) => Math.abs(sample.x) > 0.1)).toBe(true);
    await expect(sheet.getByRole("button", { name: target, exact: true })).toBeFocused();
    await expect(sheet.getByLabel("Presentation completions")).toHaveText("1");
    await expect(page.locator("[data-active-key]")).toHaveCount(1);
    await expect(page.locator(".pic-horizontal-slide-announcement")).toHaveCount(0);
    await sheet.getByRole("button", { name: locale === "he" ? "עברית" : "English", exact: true }).click();
    await expect(sheet.getByLabel("Presentation completions")).toHaveText("1");
    await expect(page.locator("#root")).toHaveAttribute("inert", "");
    });
  }

  test(`reduced motion has zero step and drawer spatial movement and duration in ${locale}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/tests/rtl-composition.fixture.html");
    await expect(page.getByRole("button", { name: "פתיחת הכלים" })).toBeVisible();
    const entrance = await observeReducedDrawer(page, "פתיחת הכלים");
    expect(entrance.length).toBeGreaterThan(0);
    expect(entrance.every((sample) => sample.x === 0 && sample.duration === 0)).toBe(true);
    if (locale === "en") await page.getByRole("button", { name: "English", exact: true }).click();
    const sheet = page.getByRole("dialog");
    const forward = await observeStep(page, "Forward", "second");
    const backward = await observeStep(page, "Backward", "first");
    expect([...forward, ...backward].every((sample) => sample.x === 0)).toBe(true);
    await expect(sheet.getByLabel("Presentation completions")).toHaveText("2");
    const exit = await observeReducedDrawer(page, locale === "he" ? "סגירת הכלים" : "Close utilities", true);
    expect(exit.length).toBeGreaterThan(0);
    expect(exit.every((sample) => sample.x === 0 && sample.duration === 0)).toBe(true);
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("button", { name: locale === "he" ? "פתיחת הכלים" : "Open utilities" })).toBeFocused();
    expect(await page.locator("html").evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--motion-pic-spatial-active").trim())).toBe("0ms");
  });
}

for (const viewport of [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1440, height: 900 },
]) {
  test(`real selector mirrors a single reusable frame and bounded scrolling at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/tests/rtl-composition.fixture.html");
    const frame = page.locator(".pic-therapeutic-frame");
    await expect(frame).toHaveCount(1);
    // Controlled physical inset values prove logical mapping; real device cutouts remain manual QA.
    await frame.evaluate((element: HTMLElement) => {
      element.style.setProperty("--pic-frame-safe-left", "7px");
      element.style.setProperty("--pic-frame-safe-right", "17px");
    });
    for (const locale of ["he", "en", "he"] as const) {
      if (locale !== "he" || await frame.getAttribute("lang") !== "he") {
        await page.getByRole("button", { name: /פתיחת הכלים|Open utilities/ }).click();
        await page.getByRole("button", { name: locale === "he" ? "עברית" : "English", exact: true }).click();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toBeHidden();
        await expect(page.getByRole("button", { name: /פתיחת הכלים|Open utilities/ })).toBeFocused();
      }
      const geometry = await frame.evaluate((element) => {
        const style = getComputedStyle(element);
        const header = element.querySelector("header")!;
        return {
          box: element.getBoundingClientRect().toJSON(),
          start: parseFloat(style.paddingInlineStart), end: parseFloat(style.paddingInlineEnd),
          heading: header.querySelector("h1")!.getBoundingClientRect().toJSON(),
          utility: header.querySelector("button")!.getBoundingClientRect().toJSON(),
          docWidth: document.documentElement.scrollWidth, docHeight: document.documentElement.scrollHeight,
          locked: [document.documentElement, document.body, document.getElementById("root")!]
            .every((node) => getComputedStyle(node).overflow === "hidden"),
        };
      });
      const gap = viewport.width <= 480 ? 12 : 16;
      expect(geometry.start).toBe(gap + (locale === "he" ? 17 : 7));
      expect(geometry.end).toBe(gap + (locale === "he" ? 7 : 17));
      expect(geometry.box.width).toBe(viewport.width);
      expect(geometry.box.height).toBe(viewport.height);
      expect(geometry.docWidth).toBeLessThanOrEqual(viewport.width + 1);
      expect(geometry.docHeight).toBeLessThanOrEqual(viewport.height + 1);
      expect(geometry.locked).toBe(true);
      expect(geometry.utility.width).toBeGreaterThanOrEqual(44);
      expect(geometry.utility.height).toBeGreaterThanOrEqual(44);
      expect(locale === "he" ? geometry.utility.x < geometry.heading.x : geometry.utility.x > geometry.heading.x).toBe(true);
      const header = await page.locator(".pic-therapeutic-frame__header").boundingBox();
      const card = page.locator(".pic-therapeutic-content-card");
      await page.keyboard.press("Tab");
      await card.focus();
      await expect(card).toBeFocused();
      const indicator = await card.evaluate((element) => {
        const style = getComputedStyle(element);
        return { width: parseFloat(style.outlineWidth), offset: parseFloat(style.outlineOffset),
          size: parseFloat(style.fontSize), transform: style.transform };
      });
      expect(indicator.width).toBeGreaterThanOrEqual(3);
      expect(indicator.offset).toBeLessThanOrEqual(-indicator.width);
      expect(indicator.size).toBe(17);
      expect(indicator.transform).toBe("none");
      const actions = page.getByRole("group", { name: "Demo actions" });
      await expect(actions.getByRole("button")).toHaveCount(2);
      expect(await actions.evaluate((element) => element.closest(".pic-therapeutic-content-card") === null)).toBe(true);
      await card.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      expect(await card.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await expect(page.locator(".pic-therapeutic-frame__header")).toHaveJSProperty("tagName", "HEADER");
      expect(await page.locator(".pic-therapeutic-frame__header").boundingBox()).toEqual(header);
      const table = page.getByRole("region", { name: "Wide table" });
      expect(await table.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      await table.locator("td").last().evaluate((element) => element.scrollIntoView({ block: "nearest", inline: "end" }));
      const tableBox = (await table.boundingBox())!;
      const lastCell = (await table.locator("td").last().boundingBox())!;
      expect(lastCell.x).toBeGreaterThanOrEqual(tableBox.x - 1);
      expect(lastCell.x + lastCell.width).toBeLessThanOrEqual(tableBox.x + tableBox.width + 1);
      await page.getByRole("button", { name: /פתיחת הכלים|Open utilities/ }).click();
      const sheet = page.getByRole("dialog");
      await expect.poll(() => sheet.evaluate((element) => element.getAnimations().length)).toBe(0);
      const box = (await sheet.boundingBox())!;
      expect(locale === "he" ? box.x : box.x + box.width).toBeCloseTo(locale === "he" ? 0 : viewport.width, 0);
      expect(await sheet.evaluate((element) => getComputedStyle(element).borderInlineStartWidth)).toBe("1px");
      const renderedControls = await page.locator("button").evaluateAll((elements) => {
        function luminance(color: string) {
          const channels = color.match(/[\d.]+/g)!.slice(0, 3).map((channel) => {
            const value = Number(channel) / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
          });
          return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
        }
        function contrast(first: string, second: string) {
          const a = luminance(first), b = luminance(second);
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        }
        return elements.map((element) => {
          const style = getComputedStyle(element);
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height,
            text: contrast(style.color, style.backgroundColor),
            border: contrast(style.borderTopColor, style.backgroundColor) };
        });
      });
      for (const control of renderedControls) {
        expect(control.width).toBeGreaterThanOrEqual(44);
        expect(control.height).toBeGreaterThanOrEqual(44);
        expect(control.text).toBeGreaterThanOrEqual(4.5);
        expect(control.border).toBeGreaterThanOrEqual(3);
      }
      const region = sheet.getByRole("region");
      await region.evaluate((element) => { element.scrollTop = element.scrollHeight; });
      expect(await region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      expect(await page.evaluate(() => [scrollX, scrollY])).toEqual([0, 0]);
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      await expect(page.getByRole("button", { name: /פתיחת הכלים|Open utilities/ })).toBeFocused();
    }
  });
}
