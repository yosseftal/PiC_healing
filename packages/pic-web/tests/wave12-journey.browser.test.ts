import { expect, test, type Page } from "@playwright/test";
import type { GuestSessionGateState, PlayerSession, SymptomGroup } from "pic-engine";
import { installJourneyTransport } from "./wave12-transport";

const copy = {
  en: { group: "Group name", symptom: "Symptom name", polarity: "Polarity", intensity: "Intensity",
    open: "Open utilities", player: "Open Player utilities", reset: "New symptom group", keep: "Keep current inquiry",
    discard: "Discard draft and start new", gate: "Keep your session", create: "Create an account", name: "Name",
    email: "Email address", password: "Password", register: "Register", save: "Sign in and save", retry: "Try again",
    verification: "Check your email for a verification message.", integrating: "This session is Integrating" },
  he: { group: "שם הקבוצה", symptom: "שם הסימפטום", polarity: "קוטביות", intensity: "עוצמה",
    open: "פתיחת הכלים", player: "פתיחת כלי הנגן", reset: "קבוצת סימפטומים חדשה", keep: "להמשיך בבירור הנוכחי",
    discard: "למחוק את הטיוטה ולהתחיל מחדש", gate: "שמירת הסשן שלך", create: "יצירת חשבון", name: "שם",
    email: "כתובת אימייל", password: "סיסמה", register: "הרשמה", save: "התחברות ושמירה", retry: "ניסיון נוסף",
    verification: "יש לבדוק באימייל אם התקבלה הודעת אימות.", integrating: "הסשן בהטמעה" },
} as const;
type Locale = keyof typeof copy;
interface GuestStorage {
  groups: Record<string, SymptomGroup>;
  playerSessions: Record<string, PlayerSession>;
  sessionGate: GuestSessionGateState;
}

async function guest(page: Page): Promise<GuestStorage> {
  return page.evaluate(() => JSON.parse(localStorage.getItem("pic:guest-repository:v1")!));
}

async function presentation(page: Page, locale: Locale, alias?: string) {
  const before = await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"));
  // Gate language changes exercise the existing provider API; no production alias editor is introduced.
  await page.evaluate(({ language, phrase }) => {
    window.dispatchEvent(new CustomEvent("fixture-select-locale", { detail: language }));
    if (phrase !== undefined) window.dispatchEvent(new CustomEvent("fixture-set-alias", { detail: phrase }));
  }, { language: locale, phrase: alias });
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBe(before);
  if (alias !== undefined) await expect(page.locator("#root")).toHaveAttribute("data-alias", alias);
}

async function createInquiry(page: Page, locale: Locale, groupName: string, symptomName: string) {
  const text = copy[locale];
  await page.getByLabel(text.group, { exact: true }).fill(groupName);
  await page.getByTestId("confirm-group-name").click();
  await page.getByLabel(text.symptom, { exact: true }).fill(symptomName);
  await page.getByLabel(text.polarity, { exact: true }).selectOption("positive");
  await page.getByLabel(text.intensity, { exact: true }).fill("8");
  await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
  await page.getByTestId("add-symptom-action").click();
  await expect(page.getByTestId("symptom-count")).toContainText("1");
  await page.getByTestId("finish-symptom-addition").click();
  await page.getByTestId("muscle-test-yes").click();
  await page.getByTestId("confirm-group-summary").click();
  await expect(page.getByTestId("guest-flow-pick-treatment")).toBeVisible();
}

for (const locale of ["he", "en"] as const) {
  for (const linked of [true, false]) {
    test(`${locale} assembled reset → ${linked ? "register/verify linked Finish" : "returning unlinked Finish Anyway"}`,
      async ({ page }) => {
        const text = copy[locale];
        const other = locale === "he" ? "en" : "he";
        const network = await installJourneyTransport(page);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(`/tests/wave12-journey.fixture.html?locale=${locale}`);
        const groupInput = page.getByLabel(text.group, { exact: true });
        await groupInput.fill("Discarded draft טיוטה");
        await page.getByRole("button", { name: text.open, exact: true }).click();
        await page.getByRole("button", { name: text.reset, exact: true }).click();
        const keep = page.getByRole("button", { name: text.keep, exact: true });
        await expect(keep).toBeFocused();
        await expect(page.getByRole("dialog")).toMatchAriaSnapshot(`
          - dialog:
            - banner:
              - heading
              - button
            - region:
              - paragraph
              - button "${text.keep}"
              - button "${text.discard}"
        `);
        await page.keyboard.press("Escape");
        await expect(page.getByRole("button", { name: text.reset, exact: true })).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(groupInput).toHaveValue("Discarded draft טיוטה");
        await page.getByRole("button", { name: text.open, exact: true }).click();
        await page.getByRole("button", { name: text.reset, exact: true }).click();
        await page.getByRole("button", { name: text.discard, exact: true }).click();
        await expect(groupInput).toHaveValue("");
        await expect(groupInput).toBeFocused();

        await groupInput.fill("Fresh inquiry בירור");
        await presentation(page, other, "נכון <&> אישי");
        await expect(page.getByLabel(copy[other].group, { exact: true })).toHaveValue("Fresh inquiry בירור");
        await presentation(page, locale);
        await createInquiry(page, locale, "Fresh inquiry בירור", "Shoulder כתף");
        const initialGroup = Object.values((await guest(page)).groups)[0]!;
        expect(initialGroup.symptoms[0]).toMatchObject({ name: "Shoulder כתף", polarity: "positive", intensity: 8 });
        await page.getByRole("button", { name: text.open, exact: true }).click();
        if (linked) await page.getByTestId("link-to-group-toggle").check();
        else await expect(page.getByTestId("link-to-group-toggle")).not.toBeChecked();
        const treatmentId = await page.locator("#root").getAttribute("data-treatment-id");
        await page.getByTestId(`pick-treatment-${treatmentId}`).click();
        await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
        await presentation(page, other, "My <muscle> phrase");
        await presentation(page, locale);
        await page.getByRole("button", { name: text.player, exact: true }).click();
        await page.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
        const terminal = page.getByTestId("terminal-nemar-unit");
        await expect(terminal).toContainText("My <muscle> phrase");
        expect(await terminal.ariaSnapshot()).toContain("My <muscle> phrase");
        // Return to the official locale phrase before observing the actual closing question.
        await page.evaluate(() => window.dispatchEvent(new CustomEvent("fixture-set-alias", { detail: null })));
        await expect(terminal).toContainText(locale === "he" ? "נכון ומדויק" : "NEMAR");
        expect(await terminal.ariaSnapshot()).toContain(locale === "he" ? "נכון ומדויק" : "NEMAR");
        await page.getByTestId(linked ? "terminal-nemar-yes" : "terminal-nemar-no").click();
        if (linked) await page.getByTestId("finish-button").click();
        else {
          await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(text.integrating);
          await page.getByRole("button", { name: text.player, exact: true }).click();
          await page.getByTestId("finish-anyway-button").click();
        }
        const gate = page.getByRole("dialog", { name: text.gate, exact: true });
        await expect(gate).toBeFocused();
        await expect(gate).toMatchAriaSnapshot(`
          - dialog "${text.gate}":
            - heading "${text.gate}" [level=2]
            - paragraph
            - text: ${text.email}
            - textbox "${text.email}"
            - text: ${text.password}
            - textbox "${text.password}"
            - button "${text.save}"
            - button "${text.create}"
            - button
        `);
        const gated = await guest(page);
        const initialSession = Object.values(gated.playerSessions)[0]!;
        expect(initialSession).toMatchObject({ linked_group_id: linked ? initialGroup.id : null,
          terminal_nemar_response: linked ? "yes" : "no", success_declared: false });
        expect(initialSession.units.map((unit) => unit.state)).toEqual(["completed", "skipped", "skipped", "unseen"]);
        expect(gated.sessionGate.pendingFinishRequest).toEqual({
          sessionId: initialSession.id, kind: linked ? "finish" : "finishAnyway",
        });
        expect(network.requests).toEqual([]);
        await presentation(page, other, "Alias survives reset");
        await expect(page.getByRole("dialog")).toHaveAttribute("dir", other === "he" ? "rtl" : "ltr");
        await presentation(page, locale);

        if (linked) {
          await gate.getByRole("button", { name: text.create, exact: true }).click();
          await gate.getByLabel(text.name, { exact: true }).fill("  Journey Event Manager  ");
          await gate.getByLabel(text.email).fill(network.user.email);
          await gate.getByLabel(text.password).fill("  exact password  ");
          await gate.getByRole("button", { name: text.register, exact: true }).click();
          await expect(gate.getByRole("status")).toContainText(text.verification);
          expect(network.counts().signups).toBe(1);
          await presentation(page, other);
          await expect(page.getByRole("dialog").getByRole("status")).toContainText(copy[other].verification);
          await presentation(page, locale);
          await gate.getByLabel(text.password).fill("  exact password  ");
          await gate.getByRole("button", { name: text.save, exact: true }).click();
          await expect(gate.getByRole("alert")).toContainText(text.verification);
        } else {
          network.confirm();
          network.failNextPromotion();
          await gate.getByLabel(text.email).fill(network.user.email);
          await gate.getByLabel(text.password).fill("  exact password  ");
          await gate.getByRole("button", { name: text.save, exact: true }).click();
          await expect(gate.getByRole("button", { name: text.retry, exact: true })).toBeVisible();
        }
        expect(await guest(page)).toEqual(gated);
        await presentation(page, other);
        const recoveryTree = await page.getByRole("dialog").ariaSnapshot();
        expect(recoveryTree).toContain(`button "${copy[other].retry}"`);
        expect(recoveryTree).not.toContain("My <muscle> phrase");
        await presentation(page, locale);
        network.confirm();
        if (linked) await gate.getByLabel(text.password).fill("  exact password  ");
        await gate.getByRole("button", { name: text.retry, exact: true }).click();
        await expect(page.locator("#root")).toHaveAttribute("data-state", JSON.stringify({
          mode: "authenticated", gateTriggered: false, promotionStatus: "succeeded",
        }));
        await expect(gate).toHaveCount(0);
        const successful = network.promotions.at(-1)!;
        expect(successful.p_guest_group).toEqual(linked ? expect.objectContaining({ id: initialGroup.id }) : null);
        expect(successful.p_symptoms).toEqual(linked ? initialGroup.symptoms : []);
        expect(successful.p_player_session).toEqual(initialSession);
        expect(JSON.stringify(successful)).not.toContain("Alias survives reset");
        expect(network.tables.player_sessions).toEqual([expect.objectContaining({
          ...initialSession, success_declared: true, finished_at: expect.any(String), user_id: network.user.id,
        })]);
        expect(network.tables.timeline_events).toHaveLength(1);
        expect(network.tables.personal_treatment_library).toEqual([expect.objectContaining({ use_count: 1 })]);
        expect(await page.evaluate(() => localStorage.getItem("pic:guest-repository:v1"))).toBeNull();

        // A subsequent inquiry uses the authenticated provider; resetting never removes the saved prior work.
        await page.getByRole("button", { name: text.open, exact: true }).click();
        await page.getByRole("button", { name: text.reset, exact: true }).click();
        await expect(groupInput).toBeVisible();
        await expect(page.locator("#root")).toHaveAttribute("data-alias", "Alias survives reset");
        await createInquiry(page, locale, "Subsequent inquiry", "New positive symptom");
        expect(network.tables.symptom_groups).toHaveLength(linked ? 2 : 1);
        const subsequent = network.tables.symptom_groups!.find((row) => row.name === "Subsequent inquiry")!;
        expect(subsequent.id).not.toBe(initialGroup.id);
        expect(network.tables.symptoms).toContainEqual(expect.objectContaining({
          group_id: subsequent.id, name: "New positive symptom", polarity: "positive", intensity: 8,
        }));
        expect(network.tables.timeline_events).toHaveLength(1);
        expect(network.tables.personal_treatment_library![0]!.use_count).toBe(1);
        expect(network.counts()).toEqual({ signups: linked ? 1 : 0, logins: linked ? 2 : 1 });
      });
  }
}
