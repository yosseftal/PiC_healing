import { expect, test, type Page } from "@playwright/test";
import type { SymptomGroup } from "pic-engine";
import { installJourneyTransport } from "./wave12-transport";

async function fill(page: Page, he: boolean, index: number, name: string, intensity: string) {
  const row = page.getByTestId("questionnaire-row").nth(index);
  await row.getByLabel(he ? "שם הסימפטום" : "Symptom name", { exact: true }).fill(name);
  await row.getByLabel(he ? "עוצמת הפרעה / סבל" : "Interference / suffering intensity", { exact: true })
    .selectOption(intensity);
}
async function edit(page: Page, he: boolean) {
  await page.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities", exact: true }).click();
  await page.getByTestId("edit-questionnaire").click();
  await expect(page.getByTestId("symptom-add-step")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function initial(page: Page, he: boolean, name: string) {
  await page.getByLabel(he ? "שם לרשימה (לא חובה)" : "List name (optional)", { exact: true }).fill(name);
  await fill(page, he, 0, "Original מקור", "4");
  await page.getByTestId("finish-symptom-addition").click();
  await page.getByTestId("muscle-test-yes").click();
  await expect(page.getByTestId("confirm-group-summary")).toBeVisible();
}
async function guestGroup(page: Page) {
  return await page.evaluate(() =>
    Object.values(JSON.parse(localStorage.getItem("pic:guest-repository:v1")!).groups)[0]) as SymptomGroup;
}

for (const locale of ["he", "en"] as const) {
  test(`${locale} answered Guest list retains additions on Back and accepts the fresh No`, async ({ page }) => {
    const he = locale === "he";
    await installJourneyTransport(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto(`/tests/wave12-journey.fixture.html?locale=${locale}`);
    await initial(page, he, "Guest revision");
    const before = await guestGroup(page);
    await edit(page, he);
    await expect(page.getByTestId("questionnaire-existing-row").getByRole("textbox")).toHaveCount(0);
    await page.getByTestId("add-symptom-action").click(); await fill(page, he, 0, "New חדש", "8");
    await page.getByTestId("add-symptom-action").click(); await fill(page, he, 1, "Another נוסף", "1");
    const ids = await page.getByTestId("questionnaire-row").evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-topic-id")));
    await page.getByTestId("finish-symptom-addition").click();
    await expect(page.getByTestId("muscle-test-yes")).toBeVisible();
    expect(await guestGroup(page)).toEqual(before);
    await edit(page, he);
    await expect(page.getByTestId("questionnaire-row").nth(1).getByLabel(he ? "שם הסימפטום" : "Symptom name", { exact: true }))
      .toHaveValue("Another נוסף");
    expect(await page.getByTestId("questionnaire-row").evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-topic-id"))))
      .toEqual(ids);
    await page.getByTestId("finish-symptom-addition").click(); await page.getByTestId("muscle-test-no").click();
    await expect(page.getByTestId("split-advisory")).toBeVisible();
    const saved = await guestGroup(page);
    expect(saved.symptoms[0]).toEqual(before.symptoms[0]);
    expect(saved.symptoms.slice(1).map((row) => row.id)).toEqual(ids);
    expect(saved.joint_treatment_muscle_test).toBe("split_suggested");
    expect(saved.membership_revision).toBe(1);
    expect(saved.joint_treatment_membership_revision).toBe(1);
    await page.getByTestId("finalize-anyway").click();
    await expect(page.getByTestId("symptom-count")).toContainText("3");
    expect(await page.evaluate(() => ({ x: scrollX, y: scrollY, width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight }))).toEqual({ x: 0, y: 0, width: 320, height: 568 });
  });

  test(`${locale} authenticated revision retries failure and lost response without repeating Finish effects`,
    async ({ page }) => {
    const he = locale === "he";
    const network = await installJourneyTransport(page); network.confirm();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`/tests/wave12-journey.fixture.html?locale=${locale}`);
    await initial(page, he, "Promotion source");
    await page.getByTestId("confirm-group-summary").click();
    await page.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities", exact: true }).click();
    await page.getByTestId("link-to-group-toggle").check();
    const treatment = await page.locator("#root").getAttribute("data-treatment-id");
    await page.getByTestId(`pick-treatment-${treatment}`).click();
    await page.getByRole("button", { name: he ? "פתיחת כלי הנגן" : "Open Player utilities", exact: true }).click();
    await page.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
    await page.getByTestId("terminal-nemar-yes").click(); await page.getByTestId("finish-button").click();
    const gate = page.getByRole("dialog", { name: he ? "שמירת הסשן שלך" : "Keep your session", exact: true });
    await gate.getByLabel(he ? "כתובת אימייל" : "Email address").fill(network.user.email);
    await gate.getByLabel(he ? "סיסמה" : "Password").fill("  exact password  ");
    await gate.getByRole("button", { name: he ? "התחברות ושמירה" : "Sign in and save", exact: true }).click();
    await expect(gate).toHaveCount(0);
    expect(network.promotions[0]!.p_player_session.payload_version).toBe(3);
    await page.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities", exact: true }).click();
    await page.getByRole("button", { name: he ? "קבוצת סימפטומים חדשה" : "New symptom group", exact: true }).click();
    await expect(page.getByTestId("questionnaire-row")).toHaveCount(1);
    await initial(page, he, "Cloud base");
    const base = structuredClone(network.tables.symptom_groups!.find((row) => row.name === "Cloud base")!);
    const oldSymptoms = structuredClone(network.tables.symptoms!.filter((row) => row.group_id === base.id));
    await edit(page, he); await page.getByTestId("add-symptom-action").click(); await fill(page, he, 0, "Cloud new", "7");
    await page.getByTestId("finish-symptom-addition").click();
    network.failNextRevision(); await page.getByTestId("muscle-test-no").click();
    await expect.poll(() => network.revisions.length).toBe(1);
    await expect(page.getByTestId("retry-membership-revision")).toBeEnabled();
    expect(network.tables.symptom_groups!.find((row) => row.id === base.id)).toEqual(base);
    expect(network.tables.symptoms!.filter((row) => row.group_id === base.id)).toEqual(oldSymptoms);
    await page.getByTestId("retry-membership-revision").click();
    await expect(page.getByTestId("split-advisory")).toBeVisible();
    expect(network.revisions[1]).toEqual(network.revisions[0]);
    await page.getByTestId("finalize-anyway").click();
    await edit(page, he); await page.getByTestId("add-symptom-action").click(); await fill(page, he, 0, "Cloud last", "2");
    await page.getByTestId("finish-symptom-addition").click();
    network.loseNextRevisionResponse(); await page.getByTestId("muscle-test-yes").click();
    await expect.poll(() => network.revisions.length).toBe(3);
    await expect(page.getByTestId("retry-membership-revision")).toBeEnabled();
    await page.getByTestId("retry-membership-revision").click();
    await expect(page.getByTestId("confirm-group-summary")).toBeVisible();
    expect(network.revisions[3]).toEqual(network.revisions[2]);
    expect(network.tables.symptoms!.filter((row) => row.group_id === base.id)).toHaveLength(3);
    expect(network.tables.timeline_events).toHaveLength(1);
    expect(network.tables.personal_treatment_library).toEqual([expect.objectContaining({ use_count: 1 })]);
  });
}
