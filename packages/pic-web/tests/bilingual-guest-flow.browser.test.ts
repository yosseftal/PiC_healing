import { expect, test, type Locator, type Page } from "@playwright/test";
import { expectReadable } from "./palette-contrast";

const viewports = [
  { width: 320, height: 568 }, { width: 390, height: 844 },
  { width: 768, height: 1024 }, { width: 1440, height: 900 },
];
const copy = {
  he: { open: "פתיחת הכלים", player: "פתיחת כלי הנגן", group: "שם הקבוצה", symptom: "שם הסימפטום",
    polarity: "קוטביות", intensity: "עוצמה", gate: "שמירת הסשן שלך", yes: "כן", no: "לא",
    integrating: "הסשן בהטמעה", finish: "סיום" },
  en: { open: "Open utilities", player: "Open Player utilities", group: "Group name", symptom: "Symptom name",
    polarity: "Polarity", intensity: "Intensity", gate: "Keep your session", yes: "Yes", no: "No",
    integrating: "This session is Integrating", finish: "Finish" },
} as const;
type Locale = keyof typeof copy;

async function contained(page: Page, target: Locator) {
  await expect(target).toBeVisible();
  // Motion's reflected slide has a settled transform; measure after that state, before any action.
  const slide = target.locator("xpath=ancestor::*[@data-active-key]");
  if (await slide.count()) await expect(slide).toHaveCSS("transform", "none");
  await target.evaluate(async (node) => {
    for (let ancestor: Element | null = node; ancestor !== null; ancestor = ancestor.parentElement) {
      await Promise.all(ancestor.getAnimations().map((animation) => animation.finished.catch(() => {})));
    }
  });
  const box = await target.boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(-1);
  expect(box!.y).toBeGreaterThanOrEqual(-1);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function frameBounds(page: Page) {
  await contained(page, page.locator(".pic-therapeutic-frame"));
  const viewport = page.viewportSize()!;
  const size = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight,
    x: window.scrollX, y: window.scrollY, overflow: getComputedStyle(document.documentElement).overflowY,
  }));
  expect(size.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(size.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(size.x).toBe(0);
  expect(size.y).toBe(0);
  expect(size.overflow).toBe("hidden");
  await expectReadable(page.locator(".pic-therapeutic-frame").locator("h1, h2, p, button:not(:disabled)"));
}

async function choose(page: Page, from: Locale, to: Locale, player = false) {
  const before = await page.locator("#root").getAttribute("data-actions");
  const state = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
  const opener = page.getByRole("button", { name: player ? copy[from].player : copy[from].open });
  await contained(page, opener);
  await opener.click();
  const sheet = page.getByTestId("therapeutic-sheet-content");
  const selector = sheet.getByRole("button", { name: to === "he" ? "עברית" : "English", exact: true });
  await selector.focus();
  await page.keyboard.press("Space");
  await expect(selector).toBeFocused();
  await expect(selector).toHaveAttribute("aria-pressed", "true");
  await expectReadable(sheet.locator("h2, h3, p, button:not(:disabled)"));
  await expectReadable(selector, true, true);
  await expect(sheet).toHaveAttribute("lang", to);
  await expect(sheet).toHaveAttribute("dir", to === "he" ? "rtl" : "ltr");
  await expect(page.locator("html")).toHaveAttribute("lang", to);
  await expect(page.locator(".pic-therapeutic-frame")).toHaveAttribute("dir", to === "he" ? "rtl" : "ltr");
  await expect(page.locator("#root")).toHaveAttribute("data-actions", before!);
  expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(state);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: player ? copy[to].player : copy[to].open })).toBeFocused();
  await frameBounds(page);
}

async function act(page: Page, target: Locator) {
  // Measure before clicking; Playwright must not rescue clipped primary choices with automatic scrolling.
  await contained(page, target);
  const box = await target.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await target.click();
}

for (const locale of ["he", "en"] as const) {
  for (const viewport of viewports) {
    test(`${locale} assembled guest flow, offline round trips, Terminal Yes/No and Gate at ${viewport.width}px`,
      async ({ page, context }) => {
        // This assembled journey performs a reload and 18 modal language round trips across all screens.
        // Give the scenario a minute; individual assertions retain Playwright's existing 5s budget and no retries.
        test.setTimeout(60_000);
        await page.setViewportSize(viewport);
        await page.goto("/tests/content-localization.fixture.html?mode=flow");
        await expect(page.getByRole("textbox", { name: copy.he.group })).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", "he");
        await choose(page, "he", locale);
        await page.reload();
        await expect(page.getByRole("textbox", { name: copy[locale].group })).toBeVisible();
        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        const other = locale === "he" ? "en" : "he";
        await page.getByRole("textbox", { name: copy[locale].group }).fill("גב <Back> 123");
        await choose(page, locale, other);
        await choose(page, other, locale);
        await expect(page.getByRole("textbox", { name: copy[locale].group })).toHaveValue("גב <Back> 123");
        await act(page, page.getByTestId("confirm-group-name"));
        const symptom = page.getByRole("textbox", { name: copy[locale].symptom });
        await symptom.fill("צוואר Neck 7/10");
        await page.getByLabel(copy[locale].polarity).selectOption("positive");
        await page.getByLabel(copy[locale].intensity).focus();
        await page.keyboard.press("End");
        await choose(page, locale, other);
        await choose(page, other, locale);
        await expect(symptom).toHaveValue("צוואר Neck 7/10");
        await expect(page.getByLabel(copy[locale].intensity)).toHaveValue("10");
        await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
        await act(page, page.getByTestId("add-symptom-action"));
        await expect(page.getByTestId("symptom-count")).toContainText("1");
        await page.locator(".pic-therapeutic-content-card").evaluate((node) => { node.scrollTop = 0; });
        await contained(page, page.getByTestId("add-symptom-action"));
        await contained(page, page.getByTestId("finish-symptom-addition"));
        await page.locator(".pic-therapeutic-content-card").evaluate((node) => { node.scrollTop = 120; });
        await choose(page, locale, other);
        await choose(page, other, locale);
        await contained(page, page.getByTestId("add-symptom-action"));
        await contained(page, page.getByTestId("finish-symptom-addition"));
        await act(page, page.getByTestId("finish-symptom-addition"));
        await expect(page.getByTestId("muscle-test-yes")).toBeVisible();
        await choose(page, locale, other);
        await choose(page, other, locale);
        await act(page, page.getByTestId("muscle-test-yes"));
        await expect(page.getByTestId("summary-group-name")).toHaveText("גב <Back> 123");
        await choose(page, locale, other);
        await choose(page, other, locale);
        await act(page, page.getByTestId("confirm-group-summary"));
        await expect(page.getByTestId("guest-flow-pick-treatment")).toBeVisible();
        await choose(page, locale, other);
        await choose(page, other, locale);
        await page.getByRole("button", { name: copy[locale].open }).click();
        const link = page.getByTestId("link-to-group-toggle");
        await expect(link).not.toBeChecked();
        await act(page, link.locator(".."));
        await expect(link).toBeChecked();
        const id = await page.locator("#root").getAttribute("data-treatment-id");
        await act(page, page.getByTestId(`pick-treatment-${id}`));
        await expect(page.getByTestId("atomic-unit-title")).toHaveText(
          locale === "he" ? "התמקמות בשקט" : "Settle Into Stillness");
        const session = JSON.parse((await page.locator("#root").getAttribute("data-session"))!);
        expect(session.linked_group_id).not.toBeNull();
        expect(session.units.map((unit: { unit_id: string }) => unit.unit_id))
          .toEqual(["unit-1", "unit-2", "unit-3", "__terminal_nemar__"]);
        const requests: string[] = [];
        page.on("request", (request) => requests.push(request.url()));
        await context.setOffline(true);
        await choose(page, locale, other, true);
        await choose(page, other, locale, true);
        expect(requests).toEqual([]);
        await expect(page.locator("#root")).toHaveAttribute("data-session", JSON.stringify(session));
        await page.getByRole("button", { name: copy[locale].player }).click();
        await act(page, page.getByTestId("navigation-tree-jump-__terminal_nemar__"));
        await expect(page.getByTestId("terminal-nemar-unit")).toBeVisible();
        await choose(page, locale, other, true);
        await choose(page, other, locale, true);
        await act(page, page.getByRole("button", { name: copy[locale].no, exact: true }));
        await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(copy[locale].integrating);
        await choose(page, locale, other, true);
        await choose(page, other, locale, true);
        await page.getByRole("button", { name: locale === "he" ? "שינוי תשובה" : "Change response" }).click();
        await act(page, page.getByRole("button", { name: copy[locale].yes, exact: true }));
        const finish = page.getByRole("button", { name: copy[locale].finish, exact: true });
        await expect(finish).not.toBeFocused();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("dialog", { name: copy[locale].gate })).toHaveCount(0);
        await act(page, finish);
        const gate = page.getByRole("dialog", { name: copy[locale].gate });
        await contained(page, gate);
        await expect(gate).toHaveAttribute("lang", locale);
        await expect(gate).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
        await expectReadable(gate.locator("h2, p, button:not(:disabled)"));
        expect(requests).toEqual([]);
        const actions = JSON.parse((await page.locator("#root").getAttribute("data-actions"))!);
        expect(actions.filter((action: string) => action === "onFinishRequested")).toHaveLength(1);
        expect(actions).not.toContain("finish");
        expect(actions).not.toContain("finishAnyway");
        expect(actions).not.toContain("promote");
        await frameBounds(page);
      });
  }
}
