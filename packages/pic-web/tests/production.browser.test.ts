import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

test.use({ baseURL: "http://127.0.0.1:4174" });

test("production returns 404 for every harness and development entry", async ({ request }) => {
  const fixtures = readdirSync(new URL("./", import.meta.url)).filter((file) => file.includes(".fixture."));
  for (const path of [
    ...fixtures.map((file) => `/tests/${file}`),
    "/src/main.tsx", "/src/i18n/terminology-test-fixture.tsx", "/@vite/client",
    "/dev", "/debug", "/mock", "/unknown-product-route",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
});

test("shipped app completes Guest Group → Player → sovereign Persistence Gate", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("pic-web.locale.v1", "en"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByLabel("List name (optional)", { exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.getByLabel("List name (optional)", { exact: true }).fill("Production journey");
  await page.getByLabel("Symptom name", { exact: true }).fill("Shoulder");
  await expect(page.getByTestId("revealed-prior-rating")).toHaveCount(0);
  await page.getByLabel("Interference / suffering intensity", { exact: true }).selectOption("5");
  await page.getByTestId("finish-symptom-addition").click();
  await page.getByTestId("muscle-test-yes").click();
  await page.getByTestId("confirm-group-summary").click();
  await page.getByRole("button", { name: "Open utilities", exact: true }).click();
  await page.getByTestId("pick-treatment-2c6e77bd-61db-4898-8612-84e976587ff7").click();
  await expect(page.getByTestId("guest-flow-player")).toBeVisible();
  await page.getByRole("button", { name: "Open Player utilities", exact: true }).click();
  await expect(page.getByTestId("therapeutic-sheet-content")).toBeVisible();
  await page.getByTestId("finish-anyway-button").click();
  await expect(page.getByRole("dialog", { name: "Keep your session", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
