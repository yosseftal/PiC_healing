import { expect, test, type Page } from "@playwright/test";

const copy = {
  he: {
    direction: "rtl", title: "הנגן המאוחד", open: "פתיחת כלי הנגן", sheet: "כלי הנגן",
    card: "הנחיה ליחידה אטומית", tree: "עץ הניווט", terminal: "בדיקה מסכמת: נכון ומדויק", actions: "פעולות זמינות",
    yes: "כן", no: "לא", change: "שינוי תשובה", finish: "סיום", anyway: "סיום בכל זאת",
    integrating: "הסשן בהטמעה", retry: "ניסיון נוסף לטעינת ההנחיה", recovery: "אפשר לחבר מחדש",
    guard: "ההנחיה עוברת כעת עיבוד פנימי", choose: "בחירת הנחיה אחרת", state: "בתצוגה",
    gate: "שמירת הסשן שלך",
  },
  en: {
    direction: "ltr", title: "Unified Player", open: "Open Player utilities", sheet: "Player utilities",
    card: "Atomic Unit guidance", tree: "Navigation tree", terminal: "Terminal NEMAR", actions: "Available actions",
    yes: "Yes", no: "No", change: "Change response", finish: "Finish", anyway: "Finish Anyway",
    integrating: "This session is Integrating", retry: "Try guidance again", recovery: "Your guidance can reconnect",
    guard: "This guidance is currently undergoing", choose: "Choose another guidance", state: "In view",
    gate: "Keep your session",
  },
} as const;

async function openSheet(page: Page, locale: keyof typeof copy) {
  await page.getByRole("button", { name: copy[locale].open }).click();
  const sheet = page.getByTestId("therapeutic-sheet-content");
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAccessibleName(copy[locale].sheet);
  return sheet;
}

async function checkViewport(page: Page) {
  const viewport = page.viewportSize()!;
  const frame = page.locator(".pic-therapeutic-frame");
  await expect(frame).toHaveCount(1);
  const box = await frame.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    x: window.scrollX, y: window.scrollY, overflow: getComputedStyle(document.documentElement).overflowY,
  }));
  expect(dimensions.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(dimensions.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(dimensions.x).toBe(0);
  expect(dimensions.y).toBe(0);
  expect(dimensions.overflow).toBe("hidden");
}

for (const locale of ["he", "en"] as const) {
  test(`${locale} alias updates preserve the terminal response and saved work`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`/tests/unified-player.fixture.html?direction=${copy[locale].direction}`);
    const source = page.getByTestId("atomic-unit-content");
    await expect(source).toBeVisible();
    const authored = await source.textContent();
    const alias = 'שלי Right <img src=x> & {nemar} "literal"';
    await page.evaluate((value) => window.dispatchEvent(new CustomEvent("fixture-set-alias", { detail: value })), alias);
    expect(await source.textContent()).toBe(authored);
    let sheet = await openSheet(page, locale);
    const terminal = sheet.getByTestId("navigation-tree-jump-__terminal_nemar__");
    await expect(terminal.locator("bdi").first()).toHaveText(alias);
    await terminal.click();
    await expect(sheet).toBeHidden();
    await page.getByTestId("terminal-nemar-no").click();
    await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(copy[locale].integrating);
    const unit = page.getByTestId("terminal-nemar-unit");
    const original = await unit.elementHandle();
    const before = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)
      .filter(([key]) => key !== "pic-web.locale.v1")));
    const nextAlias = "My wording stays mine {count} נכון ומדויק";
    await page.evaluate((value) => window.dispatchEvent(new CustomEvent("fixture-set-alias", { detail: value })), nextAlias);
    sheet = await openSheet(page, locale);
    await expect(sheet.getByTestId("finish-anyway-button")).toBeEnabled();
    const target = locale === "he" ? "en" : "he";
    await sheet.getByRole("button", { name: target === "he" ? "עברית" : "English", exact: true }).click();
    await expect(sheet.getByTestId("finish-anyway-button")).toBeEnabled();
    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
    await expect(unit.getByRole("heading")).toHaveText(
      target === "he" ? `בדיקה מסכמת: ${nextAlias}` : `Terminal ${nextAlias}`,
    );
    await expect(unit.locator("bdi").first()).toHaveAttribute("dir", "auto");
    await expect(page.getByRole("region", { name: target === "he"
      ? `הנחיית הבדיקה המסכמת: \u2068${nextAlias}\u2069` : `Terminal \u2068${nextAlias}\u2069 guidance` })).toBeVisible();
    expect(await unit.evaluate((element, node) => element === node, original)).toBe(true);
    await expect(unit.locator("img")).toHaveCount(0);
    await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(copy[target].integrating);
    expect(await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)
      .filter(([key]) => key !== "pic-web.locale.v1")))).toEqual(before);
    await checkViewport(page);
  });
}

for (const locale of ["he", "en"] as const) {
  const text = copy[locale];
  for (const sourceDirection of ["ltr", "rtl"] as const) {
    test(`${locale} ${sourceDirection} retains the authored table scroller across a language round trip`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/tests/unified-player.fixture.html?direction=${text.direction}&sourceDirection=${sourceDirection}`);
      await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
      let sheet = await openSheet(page, locale);
      await sheet.getByTestId("navigation-tree-jump-unit-2").click();
      await expect(sheet).toBeHidden();
      const region = page.getByRole("region", { name: locale === "he" ? "טבלת ההנחיה" : "Guidance table" });
      const original = await region.elementHandle();
      await expect(region).toHaveCSS("direction", sourceDirection);
      await expect(region.locator("table")).toHaveCSS("direction", sourceDirection);
      await region.locator("th").last().scrollIntoViewIfNeeded();
      const before = await region.locator("th").last().boundingBox();
      const beforeRegion = await region.boundingBox();
      sheet = await openSheet(page, locale);
      await sheet.getByRole("button", { name: locale === "he" ? "English" : "עברית", exact: true }).click();
      const switchedRegion = page.locator(".pic-therapeutic-table-scroller");
      expect(await switchedRegion.evaluate((element, node) => element === node, original)).toBe(true);
      await expect(switchedRegion).toHaveCSS("direction", sourceDirection);
      await expect(switchedRegion.locator("table")).toHaveCSS("direction", sourceDirection);
      const switchedCell = await switchedRegion.locator("th").last().boundingBox();
      const switchedBox = await switchedRegion.boundingBox();
      // The card's scrollbar gutter mirrors; the table's reading offset within its own scroller stays fixed.
      expect(switchedCell!.x - switchedBox!.x).toBeCloseTo(before!.x - beforeRegion!.x, 0);
      await sheet.getByRole("button", { name: locale === "he" ? "עברית" : "English", exact: true }).click();
      await page.keyboard.press("Escape");
      await expect(sheet).toBeHidden();
      expect(await region.evaluate((element, node) => element === node, original)).toBe(true);
      const after = await region.locator("th").last().boundingBox();
      expect(after!.x).toBeCloseTo(before!.x, 0);
      expect(after!.y).toBeCloseTo(before!.y, 0);
      await expect(region.locator("th").last()).toBeInViewport();
      await expect(region.locator("table")).toHaveAttribute("lang", "");
      await expect(region).toHaveAttribute("dir", "auto");
    });
  }
  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
    test(`${locale} Player retains authored guidance and card scroll through selection at ${viewport.width}px`,
      async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(`/tests/unified-player.fixture.html?direction=${text.direction}`);
        const card = page.getByRole("region", { name: text.card });
        const heading = page.getByTestId("atomic-unit-title");
        await expect(heading).toHaveText("Long guidance");
        await expect(heading).toHaveAttribute("lang", "");
        await expect(heading).toHaveAttribute("dir", "auto");
        await expect(page.getByTestId("atomic-unit-content")).toHaveAttribute("lang", "");
        await card.evaluate((element) => { element.scrollTop = 200; });
        const before = await card.evaluate((element) => element.scrollTop);
        expect(before).toBe(200);
        const cardNode = await card.elementHandle();
        const source = await page.getByTestId("atomic-unit-content").textContent();
        const sheet = await openSheet(page, locale);
        await expect(sheet.getByRole("navigation", { name: text.tree })).toBeVisible();
        await expect(sheet.getByTestId("navigation-tree-jump-unit-1")).toContainText(text.state);
        const target = locale === "he" ? "en" : "he";
        const selector = sheet.getByRole("button", { name: target === "he" ? "עברית" : "English", exact: true });
        await selector.focus();
        await page.keyboard.press("Enter");
        await expect(selector).toBeFocused();
        await expect(sheet).toHaveAccessibleName(copy[target].sheet);
        await expect(sheet).toHaveAttribute("lang", target);
        await expect(sheet.getByTestId("finish-anyway-button")).toHaveText(copy[target].anyway);
        await expect(sheet.getByTestId("navigation-tree-jump-unit-1")).toContainText(copy[target].state);
        for (const control of await sheet.getByRole("button").all()) {
          const box = await control.boundingBox();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
        await page.keyboard.press("Escape");
        await expect(sheet).toBeHidden();
        await expect(page.getByRole("button", { name: copy[target].open })).toBeFocused();
        const nextCard = page.getByRole("region", { name: copy[target].card });
        expect(await nextCard.evaluate((element, original) => element === original, cardNode)).toBe(true);
        expect(await nextCard.evaluate((element) => element.scrollTop)).toBe(before);
        expect(await page.getByTestId("atomic-unit-content").textContent()).toBe(source);
        await expect(page.locator("[data-active-key]")).toHaveAttribute("data-active-key", "unit-1");
        const sizes = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
          x: window.scrollX, y: window.scrollY,
        }));
        expect(sizes.width).toBeLessThanOrEqual(viewport.width + 1);
        expect(sizes.height).toBeLessThanOrEqual(viewport.height + 1);
        expect(sizes.x).toBe(0);
        expect(sizes.y).toBe(0);
      });
  }

  for (const viewport of [
    { width: 320, height: 568 }, { width: 390, height: 844 },
    { width: 768, height: 1024 }, { width: 1440, height: 900 },
  ]) {
  test(`${locale} Terminal No/revision/Yes retain standard and sovereign Finish at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/tests/unified-player.fixture.html?direction=${text.direction}`);
    await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
    let sheet = await openSheet(page, locale);
    await sheet.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("heading", { name: text.terminal })).toBeFocused();
    const actions = page.getByRole("group", { name: text.actions });
    await expect(actions.getByRole("button")).toHaveCount(2);
    await actions.getByRole("button", { name: text.no, exact: true }).click();
    await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(text.integrating);
    await expect(actions.getByRole("button")).toHaveCount(1);
    sheet = await openSheet(page, locale);
    await expect(sheet.getByTestId("finish-anyway-button")).toBeEnabled();
    await page.keyboard.press("Escape");
    await actions.getByRole("button", { name: text.change }).click();
    const yes = actions.getByRole("button", { name: text.yes, exact: true });
    const yesNode = await yes.elementHandle();
    await yes.focus();
    await page.keyboard.press("Enter");
    await expect(actions.getByRole("button", { name: text.finish, exact: true })).toBeVisible();
    const finish = actions.getByRole("button", { name: text.finish, exact: true });
    expect(await finish.evaluate((element, original) => element === original, yesNode)).toBe(false);
    await expect(finish).not.toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog", { name: text.gate })).toHaveCount(0);
    await expect(actions.getByRole("button")).toHaveCount(2);
    await actions.getByRole("button", { name: text.finish, exact: true }).click();
    await expect(page.getByRole("dialog", { name: text.gate })).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
    sheet = await openSheet(page, locale);
    await sheet.getByTestId("finish-anyway-button").click();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole("dialog", { name: text.gate })).toBeVisible();
    await checkViewport(page);
  });

  for (const phase of ["resolving", "empty", "recovery-empty", "recovery"] as const) {
    test(`${locale} ${phase} retains language access and source guard at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(`/tests/unified-player.fixture.html?direction=${text.direction}&phase=${phase}`);
      await expect(page.getByRole("heading", { name: text.title })).toBeVisible();
      await checkViewport(page);
      if (phase !== "resolving") await expect(page.getByTestId("zero-h3-guard-player")).toContainText(text.guard);
      const sheet = await openSheet(page, locale);
      const eligible = phase === "recovery";
      await expect(sheet.getByTestId("finish-anyway-button")).toHaveCount(eligible ? 1 : 0);
      await expect(sheet.getByTestId("navigation-tree-panel")).toHaveCount(eligible ? 1 : 0);
      const target = locale === "he" ? "en" : "he";
      const selector = sheet.getByRole("button", { name: target === "he" ? "עברית" : "English", exact: true });
      await selector.focus();
      await page.keyboard.press("Space");
      await expect(selector).toBeFocused();
      await expect(sheet).toHaveAccessibleName(copy[target].sheet);
      await expect(sheet).toHaveAttribute("lang", target);
      if (phase === "resolving") {
        await page.evaluate(() => window.dispatchEvent(new Event("fixture-release-content")));
        await expect(sheet.getByTestId("navigation-tree-panel")).toBeVisible();
      }
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: copy[target].open })).toBeFocused();
      if (phase !== "resolving") {
        await expect(page.getByTestId("zero-h3-guard-player")).toContainText(copy[target].guard);
        await expect(page.getByRole("button", { name: copy[target].choose })).toBeVisible();
      }
      if (phase.startsWith("recovery")) {
        await expect(page.getByRole("button", { name: copy[target].retry })).toBeVisible();
        await expect(page.getByText(copy[target].recovery, { exact: false })).toBeVisible();
      }
      await expect(page.getByTestId("terminal-nemar-unit")).toHaveCount(0);
      await checkViewport(page);
    });
  }
  }
}
