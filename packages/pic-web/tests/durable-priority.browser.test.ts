import { enterQuestionnaire } from "./questionnaire-entry";
import { expect, test } from "@playwright/test";
import type { SymptomGroup } from "pic-engine";
import { installJourneyTransport } from "./wave12-transport";

for (const locale of ["he", "en"] as const) {
  test(`${locale} keyboard priority survives committed Guest storage and lost-response promotion`, async ({ page }) => {
    const he = locale === "he";
    const network = await installJourneyTransport(page);
    network.confirm();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/tests/wave12-journey.fixture.html?locale=${locale}`);
    await enterQuestionnaire(page, locale);
    const rows = page.getByTestId("questionnaire-row");
    for (const [index, name, intensity] of [[0, "Back גב", "9"], [1, "Neck צוואר", "3"], [2, "Sleep שינה", "1"]] as const) {
      if (index) await page.getByTestId("add-symptom-action").click();
      await rows.nth(index).getByLabel(he ? "שם הסימפטום" : "Symptom name", { exact: true }).fill(name);
      await rows.nth(index).getByLabel(he ? "עוצמת הפרעה / סבל" : "Interference / suffering intensity", { exact: true })
        .selectOption(intensity);
    }
    await page.getByTestId("finish-symptom-addition").click();
    await page.getByTestId("muscle-test-yes").click();
    await expect(page.getByTestId("confirm-group-summary")).toBeVisible();
    const before = await page.evaluate(() =>
      Object.values(JSON.parse(localStorage.getItem("pic:guest-repository:v1")!).groups)[0]) as SymptomGroup;
    const last = before.symptoms[2]!;
    const moved = page.getByTestId(`summary-symptom-${last.id}`);
    const up = he ? "העלאת הנושא בסדר העדיפות" : "Move topic up";
    const down = he ? "הורדת הנושא בסדר העדיפות" : "Move topic down";
    await moved.getByRole("button", { name: up, exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("priority-announcement"))
      .toHaveText(he ? "הנושא עבר לסדר עדיפות 2" : "Topic moved to priority 2");
    await expect(moved.getByRole("button", { name: up, exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("priority-announcement"))
      .toHaveText(he ? "הנושא עבר לסדר עדיפות 1" : "Topic moved to priority 1");
    await expect(moved.getByRole("button", { name: up, exact: true })).toBeDisabled();
    await expect(moved.getByRole("button", { name: down, exact: true })).toBeFocused();
    await expect(moved.locator("p").first()).toHaveText(he ? "סדר עדיפות 1" : "Priority 1");
    const committed = await page.evaluate(() =>
      Object.values(JSON.parse(localStorage.getItem("pic:guest-repository:v1")!).groups)[0]) as SymptomGroup;
    expect(committed.symptoms).toEqual([last, before.symptoms[0], before.symptoms[1]]);
    expect(committed.joint_treatment_test_at).toBe(before.joint_treatment_test_at);
    await page.getByTestId("confirm-group-summary").click();
    await page.getByRole("button", { name: he ? "פתיחת הכלים" : "Open utilities", exact: true }).click();
    await page.getByTestId("link-to-group-toggle").check();
    const treatment = await page.locator("#root").getAttribute("data-treatment-id");
    await page.getByTestId(`pick-treatment-${treatment}`).click();
    await page.getByRole("button", { name: he ? "פתיחת כלי הנגן" : "Open Player utilities", exact: true }).click();
    await page.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
    await page.getByTestId("terminal-nemar-yes").click();
    await page.getByTestId("finish-button").click();
    const gate = page.getByRole("dialog", { name: he ? "שמירת הסשן שלך" : "Keep your session", exact: true });
    await gate.getByLabel(he ? "כתובת אימייל" : "Email address").fill(network.user.email);
    await gate.getByLabel(he ? "סיסמה" : "Password").fill("  exact password  ");
    network.loseNextPromotionResponse();
    await gate.getByRole("button", { name: he ? "התחברות ושמירה" : "Sign in and save", exact: true }).click();
    await gate.getByRole("button", { name: he ? "ניסיון נוסף" : "Try again", exact: true }).click();
    await expect(gate).toHaveCount(0);
    expect(network.promotions).toHaveLength(2);
    expect(network.promotions[1]).toEqual(network.promotions[0]);
    expect(network.promotions[0]!.p_symptoms).toEqual(committed.symptoms.map((symptom, priority_position) =>
      ({ ...symptom, priority_position })));
    expect(network.requests).toContainEqual({ table: "get_symptom_group", method: "POST" });
    expect(network.tables.symptoms!.map(({ id }) => id)).toEqual(committed.symptoms.map(({ id }) => id));
    expect(network.tables.personal_treatment_library).toEqual([expect.objectContaining({ use_count: 1 })]);
    expect(network.tables.timeline_events).toHaveLength(1);
    expect(network.tables.player_sessions).toEqual([expect.objectContaining({ success_declared: true })]);
  });
}
