import { expect, test, type Locator, type Page } from "@playwright/test";
import type { GuestSessionGateState, PlayerSession, SymptomGroup } from "pic-engine";
import { installJourneyTransport } from "./wave12-transport";

const copy = {
  he: {
    title: "שם לרשימה (לא חובה)", name: "שם הסימפטום", polarity: "קוטביות",
    negativeIntensity: "עוצמת הפרעה / סבל", positiveIntensity: "עוצמת החוויה החיובית", intensity: "עוצמה",
    open: "פתיחת הכלים", player: "פתיחת כלי הנגן", up: "העלאת הנושא בסדר העדיפות",
    video: "הדגמת השיטה", load: "הפעלת הסרטון", fallback: "הסרטון לא נטען?", return: "חזרה",
    unavailable: "הסרטון אינו זמין כרגע.", preparationReturn: "חזרה לשאלון", view: "תצוגת הרשימה",
    positive: "חיובית", negative: "שלילית", rerate: "דירוג הנושא מחדש", saveRating: "שמירת הדירוג הנוכחי",
    cancelRating: "חזרה לסיכום", priority: "סדר עדיפות", gate: "שמירת הסשן שלך", email: "כתובת אימייל",
    password: "סיסמה", save: "התחברות ושמירה", retry: "ניסיון נוסף", integrating: "הסשן בהטמעה",
    verified: "מחוברת לחשבון", unsaved: "עדיין לא אישרנו את שמירתה בחשבון.",
  },
  en: {
    title: "List name (optional)", name: "Symptom name", polarity: "Polarity",
    negativeIntensity: "Interference / suffering intensity", positiveIntensity: "Strength of the positive experience",
    intensity: "Intensity", open: "Open utilities", player: "Open Player utilities", up: "Move topic up",
    video: "Method demonstration", load: "Load video", fallback: "Video did not load?", return: "Return",
    unavailable: "The video is unavailable right now.", preparationReturn: "Return to questionnaire", view: "Summary view",
    positive: "Positive", negative: "Negative", rerate: "Rate this topic again", saveRating: "Save current rating",
    cancelRating: "Return to summary", priority: "Priority", gate: "Keep your session", email: "Email address",
    password: "Password", save: "Sign in and save", retry: "Try again", integrating: "This session is Integrating",
    verified: "Connected to account", unsaved: "saving it to your account has not been confirmed.",
  },
} as const;
type Locale = keyof typeof copy;
interface GuestStorage {
  groups: Record<string, SymptomGroup>;
  playerSessions: Record<string, PlayerSession>;
  sessionGate: GuestSessionGateState;
}

const guestKey = "pic:guest-repository:v1";

async function rawGuest(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), guestKey);
}

async function guest(page: Page): Promise<GuestStorage> {
  const raw = await rawGuest(page);
  expect(raw).not.toBeNull();
  return JSON.parse(raw!) as GuestStorage;
}

async function group(page: Page): Promise<SymptomGroup> {
  const groups = Object.values((await guest(page)).groups);
  expect(groups).toHaveLength(1);
  return groups[0]!;
}

async function rowIds(page: Page): Promise<string[]> {
  return page.getByTestId("questionnaire-row").evaluateAll((rows) => rows.map((row) => row.getAttribute("data-topic-id")!));
}

async function fillTopic(row: Locator, locale: Locale, name: string, polarity: "positive" | "negative", score: string) {
  const text = copy[locale];
  await row.getByLabel(text.name, { exact: true }).fill(name);
  await row.getByLabel(text.polarity, { exact: true }).selectOption(polarity);
  await row.getByLabel(polarity === "positive" ? text.positiveIntensity : text.negativeIntensity, { exact: true })
    .selectOption(score);
}

async function selectLocale(page: Page, locale: Locale) {
  const before = await rawGuest(page);
  await page.evaluate((language) => {
    window.dispatchEvent(new CustomEvent("fixture-select-locale", { detail: language }));
  }, locale);
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
  await expect(page.locator("html")).toHaveAttribute("dir", locale === "he" ? "rtl" : "ltr");
  expect(await rawGuest(page)).toBe(before);
}

async function returnFromGuide(page: Page, locale: Locale) {
  await page.getByRole("button", { name: copy[locale].return, exact: true }).click();
  await expect(page.getByTestId("education-guide")).toHaveCount(0);
  await expect(page.locator("iframe")).toHaveCount(0);
}

async function assertSummary(page: Page, locale: Locale, ids: string[], names: string[], scores: number[]) {
  const rows = page.locator(".pic-summary-topic");
  await expect(rows).toHaveCount(ids.length);
  expect(await rows.evaluateAll((topics) => topics.map((topic) => topic.getAttribute("data-testid"))))
    .toEqual(ids.map((id) => `summary-symptom-${id}`));
  for (const [index, name] of names.entries()) {
    await expect(rows.nth(index)).toContainText(name);
    await expect(rows.nth(index)).toContainText(`${copy[locale].priority} ${index + 1}`);
    await expect(rows.nth(index)).toContainText(`${copy[locale].intensity} ${scores[index]}/10`);
  }
  await expect(page.getByTestId("symptom-count")).toHaveCount(0);
}

for (const locale of ["he", "en"] as const) {
  test(`${locale} assembled ${locale === "he" ? "untitled Finish" : "titled Integrating then Finish Anyway"} journey`,
    async ({ page }) => {
      const text = copy[locale];
      const title = locale === "he" ? "" : "My current priorities רשימה";
      const names = ["Shoulder ease כתף", "Back concern גב", "Rest מנוחה"];
      const network = await installJourneyTransport(page);
      let videoRequests = 0;
      await page.route("https://www.youtube-nocookie.com/embed/**", async (route) => {
        videoRequests++;
        await route.abort();
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/tests/wave12-journey.fixture.html?locale=${locale}`);

      const welcome = page.getByTestId("welcome-screen");
      await expect(welcome).toBeVisible();
      await expect(welcome.locator('.pic-therapeutic-content-card section[lang="he"][dir="rtl"]')).toHaveCount(2);
      await expect(welcome).toContainText("סיגל ניצן");
      await expect(welcome).toContainText("https://pic-healing.com/");
      await page.getByTestId("welcome-learn").click();
      const guide = page.getByTestId("education-guide");
      await expect(guide.locator('#w13-07-method-introduction-r1[lang="he"][dir="rtl"]')).toHaveCount(1);
      await expect(guide.locator("iframe")).toHaveCount(0);
      expect(videoRequests).toBe(0);
      await guide.getByRole("button", { name: text.load, exact: true }).click();
      await expect(page.getByTitle(text.video, { exact: true }))
        .toHaveAttribute("src", "https://www.youtube-nocookie.com/embed/txSeLG4kJ6Y?controls=1&autoplay=0");
      await expect.poll(() => videoRequests).toBe(1);
      // An aborted iframe is not a reliable onError signal; use the explicit unavailable-video action.
      await guide.getByRole("button", { name: text.fallback, exact: true }).click();
      await expect(guide.getByRole("status")).toContainText(text.unavailable);
      await expect(guide.locator('a[href="https://www.youtube.com/watch?v=txSeLG4kJ6Y"]')).toBeVisible();
      await expect(guide.locator("iframe")).toHaveCount(0);
      await returnFromGuide(page, locale);
      await expect(welcome).toBeVisible();
      await page.getByTestId("welcome-start").click();

      const titleInput = page.getByLabel(text.title, { exact: true });
      await expect(titleInput).toBeVisible();
      await titleInput.fill(title);
      const first = page.getByTestId("questionnaire-row").first();
      const firstDraftId = (await rowIds(page))[0]!;
      const initialIntensity = first.getByLabel(text.negativeIntensity, { exact: true });
      await expect(initialIntensity).toHaveValue("");
      await expect(initialIntensity.locator('option[value="0"]')).toHaveCount(0);
      await first.getByLabel(text.name, { exact: true }).fill(names[1]!);
      const beforeGuide = await rawGuest(page);
      await page.getByRole("button", { name: text.open, exact: true }).click();
      await page.getByTestId("education-guide-trigger").click();
      await expect(guide).toBeVisible();
      await returnFromGuide(page, locale);
      await expect(page.getByTestId("education-guide-trigger")).toBeFocused();
      expect(await rowIds(page)).toEqual([firstDraftId]);
      await expect(first.getByLabel(text.name, { exact: true })).toHaveValue(names[1]!);
      await expect(initialIntensity).toHaveValue("");
      await expect(titleInput).toHaveValue(title);
      expect(await rawGuest(page)).toBe(beforeGuide);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await selectLocale(page, locale === "he" ? "en" : "he");
      expect(await rowIds(page)).toEqual([firstDraftId]);
      await selectLocale(page, locale);
      await expect(first.getByLabel(text.name, { exact: true })).toHaveValue(names[1]!);
      await fillTopic(first, locale, names[1]!, "negative", "1");
      await page.getByTestId("add-symptom-action").click();
      const second = page.getByTestId("questionnaire-row").nth(1);
      const secondDraftId = (await rowIds(page))[1]!;
      expect(secondDraftId).not.toBe(firstDraftId);
      await expect(second.getByLabel(text.negativeIntensity, { exact: true })).toHaveValue("");
      await fillTopic(second, locale, names[0]!, "positive", "10");
      const move = second.getByRole("button", { name: text.up, exact: true });
      await move.focus();
      await page.keyboard.press("Enter");
      expect(await rowIds(page)).toEqual([secondDraftId, firstDraftId]);
      expect(await rawGuest(page)).toBe(beforeGuide);
      await page.getByTestId("finish-symptom-addition").click();
      await expect(page.getByTestId("muscle-test-yes")).toBeVisible();
      const initialGroup = await group(page);
      expect(initialGroup.name).toBe(title);
      // Initial materialization assigns public engine IDs; their continuity starts at this committed boundary.
      const secondId = initialGroup.symptoms[0]!.id;
      const firstId = initialGroup.symptoms[1]!.id;
      expect(new Set([secondId, firstId]).size).toBe(2);
      expect(initialGroup.symptoms).toEqual([
        { id: secondId, name: names[0], polarity: "positive", intensity: 10, rated_at: expect.any(String) },
        { id: firstId, name: names[1], polarity: "negative", intensity: 1, rated_at: expect.any(String) },
      ]);
      expect(initialGroup.joint_treatment_muscle_test).toBeNull();
      expect(initialGroup.joint_treatment_test_at).toBeNull();
      await page.getByTestId("muscle-test-yes").click();
      await expect(page.getByTestId("guest-flow-group-summary")).toBeVisible();
      const answered = await group(page);
      expect(answered.joint_treatment_muscle_test).toBe("together");
      expect(answered.joint_treatment_test_at).toEqual(expect.any(String));

      await page.getByRole("button", { name: text.open, exact: true }).click();
      await page.getByTestId("edit-questionnaire").click();
      await expect(page.getByTestId("questionnaire-existing-row")).toHaveCount(2);
      await page.getByTestId("add-symptom-action").click();
      const third = page.getByTestId("questionnaire-row");
      const thirdId = (await rowIds(page))[0]!;
      expect(new Set([secondId, firstId, thirdId]).size).toBe(3);
      await fillTopic(third, locale, names[2]!, "negative", "4");
      await page.getByTestId("questionnaire-back").click();
      await expect(page.getByTestId("questionnaire-preparation")).toBeVisible();
      expect(await group(page)).toEqual(answered);
      await page.getByRole("button", { name: text.preparationReturn, exact: true }).click();
      await expect(third).toBeVisible();
      expect(await rowIds(page)).toEqual([thirdId]);
      await expect(third.getByLabel(text.name, { exact: true })).toHaveValue(names[2]!);
      await expect(third.getByLabel(text.negativeIntensity, { exact: true })).toHaveValue("4");
      await page.getByTestId("finish-symptom-addition").click();
      await expect(page.getByTestId("muscle-test-no")).toBeVisible();
      await expect(page.getByTestId("split-advisory")).toHaveCount(0);
      expect(await group(page)).toEqual(answered);
      await page.getByTestId("muscle-test-no").click();
      await expect(page.getByTestId("split-advisory")).toBeVisible();
      const renewed = await group(page);
      const ids = [secondId, firstId, thirdId];
      expect(renewed.id).toBe(initialGroup.id);
      expect(renewed.symptoms.map(({ id }) => id)).toEqual(ids);
      expect(renewed.symptoms.slice(0, 2)).toEqual(initialGroup.symptoms);
      expect(renewed.symptoms[2]).toEqual({ id: thirdId, name: names[2], polarity: "negative",
        intensity: 4, rated_at: expect.any(String) });
      expect(renewed.joint_treatment_muscle_test).toBe("split_suggested");
      expect(renewed.joint_treatment_membership_revision).toBe(renewed.membership_revision);
      await page.getByTestId("finalize-anyway").click();
      await assertSummary(page, locale, ids, names, [10, 1, 4]);
      await expect(page.getByTestId("summary-group-name")).toHaveCount(title ? 1 : 0);
      if (title) await expect(page.getByTestId("summary-group-name")).toHaveText(title);
      const beforeView = await rawGuest(page);
      await page.getByRole("button", { name: text.open, exact: true }).click();
      const view = page.getByRole("combobox", { name: text.view, exact: true });
      await expect(view).toHaveValue("manual");
      await view.selectOption("polarity");
      await page.keyboard.press("Escape");
      const positive = page.getByRole("region", { name: text.positive, exact: true });
      const negative = page.getByRole("region", { name: text.negative, exact: true });
      await expect(positive.getByTestId(`summary-symptom-${secondId}`)).toContainText(`${text.priority} 1`);
      await expect(negative.getByTestId(`summary-symptom-${firstId}`)).toContainText(`${text.priority} 2`);
      await expect(negative.getByTestId(`summary-symptom-${thirdId}`)).toContainText(`${text.priority} 3`);
      await expect(page.getByRole("button", { name: text.up, exact: true })).toHaveCount(0);
      expect(await rawGuest(page)).toBe(beforeView);
      await page.getByRole("button", { name: text.open, exact: true }).click();
      await view.selectOption("manual");
      await page.keyboard.press("Escape");
      await assertSummary(page, locale, ids, names, [10, 1, 4]);
      expect(await rawGuest(page)).toBe(beforeView);

      const rerate = page.getByTestId(`summary-symptom-${secondId}`)
        .getByRole("button", { name: text.rerate, exact: true });
      await rerate.click();
      const rating = page.getByTestId("rating-control");
      const currentIntensity = rating.getByLabel(text.intensity, { exact: true });
      await expect(currentIntensity).toHaveValue("");
      await expect(page.locator(".pic-summary-topic")).toHaveCount(0);
      await expect(page.getByTestId("summary-muscle-test")).toHaveCount(0);
      await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
      await rating.getByLabel(text.polarity, { exact: true }).selectOption("positive");
      await currentIntensity.selectOption("0");
      await page.getByRole("button", { name: text.saveRating, exact: true }).click();
      await assertSummary(page, locale, ids, names, [0, 1, 4]);
      const zeroGroup = await group(page);
      expect(zeroGroup.symptoms[0]).toMatchObject({ id: secondId, polarity: "positive", intensity: 0,
        rated_at: expect.any(String) });
      expect(zeroGroup.symptoms.slice(1)).toEqual(renewed.symptoms.slice(1));
      await rerate.click();
      await expect(currentIntensity).toHaveValue("");
      await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
      await expect(page.locator(".pic-summary-topic")).toHaveCount(0);
      await page.getByTestId("reveal-prior-rating").click();
      await expect(page.getByTestId("revealed-prior-rating")).toContainText("0/10");
      await expect(page.getByTestId("revealed-prior-rating")).toContainText(text.positive);
      await expect(currentIntensity).toHaveValue("");
      await page.getByRole("button", { name: text.cancelRating, exact: true }).click();
      expect(await group(page)).toEqual(zeroGroup);
      await page.getByTestId("confirm-group-summary").click();
      await expect(page.getByTestId("guest-flow-pick-treatment")).toBeVisible();
      await page.getByRole("button", { name: text.open, exact: true }).click();
      await page.getByTestId("link-to-group-toggle").check();
      const treatmentId = await page.locator("#root").getAttribute("data-treatment-id");
      expect(treatmentId).not.toBeNull();
      await page.getByTestId(`pick-treatment-${treatmentId}`).click();
      await expect(page.getByTestId("atomic-unit-title")).toBeVisible();
      await page.getByRole("button", { name: text.player, exact: true }).click();
      await page.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
      await expect(page.getByTestId("terminal-nemar-unit")).toBeVisible();
      await page.getByTestId(locale === "he" ? "terminal-nemar-yes" : "terminal-nemar-no").click();
      if (locale === "he") await page.getByTestId("finish-button").click();
      else {
        await expect(page.getByTestId("terminal-nemar-response-recorded")).toContainText(text.integrating);
        const integrating = Object.values((await guest(page)).playerSessions);
        expect(integrating).toHaveLength(1);
        expect(integrating[0]).toMatchObject({ linked_group_id: zeroGroup.id, terminal_nemar_response: "no",
          success_declared: false, integrating_reason: "terminal_nemar_no", finished_at: null });
        expect(network.promotions).toEqual([]);
        expect(network.tables.timeline_events).toEqual([]);
        expect(network.tables.personal_treatment_library).toEqual([]);
        await expect(page.getByTestId("completion-return-screen")).toHaveCount(0);
        await page.getByRole("button", { name: text.player, exact: true }).click();
        await page.getByTestId("finish-anyway-button").click();
      }
      const gate = page.getByRole("dialog", { name: text.gate, exact: true });
      await expect(gate).toBeVisible();
      const gated = await guest(page);
      const sessions = Object.values(gated.playerSessions);
      expect(sessions).toHaveLength(1);
      const session = sessions[0]!;
      expect(session).toMatchObject({ treatment_id: treatmentId, linked_group_id: zeroGroup.id,
        terminal_nemar_response: locale === "he" ? "yes" : "no", success_declared: false });
      expect(gated.sessionGate.pendingFinishRequest).toEqual({ sessionId: session.id,
        kind: locale === "he" ? "finish" : "finishAnyway", promotionPayloadVersion: 3 });
      expect(network.requests).toEqual([]);
      network.confirm();
      network.loseNextPromotionResponse();
      await gate.getByLabel(text.email, { exact: true }).fill(network.user.email);
      await gate.getByLabel(text.password, { exact: true }).fill("  exact password  ");
      await gate.getByRole("button", { name: text.save, exact: true }).click();
      await expect(gate.getByRole("button", { name: text.retry, exact: true })).toBeVisible();
      await expect(page.getByTestId("completion-return-screen")).toHaveCount(0);
      expect(await guest(page)).toEqual(gated);
      expect(network.promotions).toHaveLength(1);
      const firstPayload = structuredClone(network.promotions[0]!);
      const { symptoms, ...groupFields } = zeroGroup;
      expect(firstPayload).toEqual({ p_guest_group: groupFields,
        p_symptoms: symptoms.map((symptom, priority_position) => ({ ...symptom, priority_position })),
        p_player_session: { ...session, payload_version: 3 }, p_new_user_id: network.user.id });
      expect(network.tables.player_sessions).toHaveLength(1);
      expect(network.tables.timeline_events).toHaveLength(1);
      expect(network.tables.personal_treatment_library).toEqual([expect.objectContaining({ use_count: 1 })]);
      await gate.getByRole("button", { name: text.retry, exact: true }).click();
      await expect(page.locator("#root")).toHaveAttribute("data-state", JSON.stringify({
        mode: "authenticated", gateTriggered: false, promotionStatus: "succeeded",
      }));
      await expect(gate).toHaveCount(0);
      await expect(page.getByTestId("completion-return-screen")).toBeVisible();
      expect(network.promotions).toEqual([firstPayload, firstPayload]);
      expect(await rawGuest(page)).toBeNull();
      expect(network.tables.symptom_groups).toEqual([{ ...groupFields, user_id: network.user.id }]);
      expect(network.tables.symptoms).toEqual(symptoms.map((symptom, priority_position) => ({
        ...symptom, group_id: zeroGroup.id, user_id: network.user.id, priority_position,
      })));
      expect(network.tables.player_sessions).toEqual([expect.objectContaining({ ...session, user_id: network.user.id,
        success_declared: true, finished_at: expect.any(String) })]);
      expect(network.tables.timeline_events).toEqual([expect.objectContaining({ id: session.id, log_type: "execution",
        linked_group_id: zeroGroup.id, treatment_id: treatmentId, user_id: network.user.id })]);
      expect(network.tables.personal_treatment_library).toEqual([expect.objectContaining({ use_count: 1,
        treatment_id: treatmentId, user_id: network.user.id, promoted_session_ids: [session.id] })]);
      expect(network.counts()).toEqual({ signups: 0, logins: 1 });
      await page.getByRole("button", { name: text.open, exact: true }).click();
      await expect(page.getByRole("dialog")).toContainText(text.verified);
      await expect(page.getByRole("dialog")).not.toContainText(text.unsaved);
      await page.keyboard.press("Escape");
      const saved = structuredClone(network.tables);
      const requestIndex = network.requests.length;
      await page.getByTestId("completion-return-questionnaire").click();
      await expect(page.getByTestId("completion-return-screen")).toHaveCount(0);
      await assertSummary(page, locale, ids, names, [0, 1, 4]);
      await expect(page.getByTestId("summary-muscle-test")).toContainText(locale === "he"
        ? "הוצע טיפול בקבוצות נפרדות" : "Split suggested");
      expect(network.tables).toEqual(saved);
      // Public read RPCs use POST; only mutations could change the captured rows or completion totals.
      expect(network.requests.slice(requestIndex).filter(({ table }) => table === "promote_guest_to_account")).toEqual([]);
      expect(network.promotions).toHaveLength(2);
      expect(network.counts()).toEqual({ signups: 0, logins: 1 });
    });
}
