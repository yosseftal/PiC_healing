import { expect, type Page } from "@playwright/test";

/** Exercise the real first-run choice; retained work and an already dismissed welcome enter directly. */
export async function enterQuestionnaire(page: Page, locale: "he" | "en") {
  const start = page.getByTestId("welcome-start");
  const topic = page.getByLabel(locale === "he" ? "שם הסימפטום" : "Symptom name", { exact: true });
  await expect(start.or(topic)).toBeVisible();
  if (await start.count()) await start.click();
  await expect(topic).toBeVisible();
}
