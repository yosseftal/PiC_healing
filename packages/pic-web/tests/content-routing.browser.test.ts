import { expect, test } from "@playwright/test";
import { installJourneyTransport } from "./wave12-transport";

const sourceIds = [
  "2c6e77bd-61db-4898-8612-84e976587ff7", "c818490b-10ed-46c2-9890-1f35d34f4e25",
  "92be9fb3-7092-4a78-9fa2-4aee9ba34bc6",
].sort();

test("production Finish returns explicitly and preserves the three shared sources", async ({ page }) => {
  const network = await installJourneyTransport(page);
  network.confirm();
  await page.addInitScript(() => localStorage.setItem("pic-web.locale.v1", "en"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("http://127.0.0.1:4174/");
  const start = page.getByRole("button", { name: "Start the questionnaire", exact: true });
  const topic = page.getByLabel("Symptom name", { exact: true });
  await expect(start.or(topic)).toBeVisible();
  if (await start.count()) await start.click();
  await topic.fill("Production routing fixture");
  await page.getByLabel("Interference / suffering intensity", { exact: true }).selectOption("4");
  await page.getByTestId("finish-symptom-addition").click();
  await page.getByTestId("muscle-test-yes").click();
  await page.getByTestId("confirm-group-summary").click();
  await page.getByRole("button", { name: "Open utilities", exact: true }).click();
  const catalog = page.locator('[data-testid^="pick-treatment-"]');
  await expect(catalog).toHaveCount(3);
  expect((await catalog.evaluateAll((nodes) => nodes.map((node) =>
    node.getAttribute("data-testid")!.replace("pick-treatment-", "")))).sort()).toEqual(sourceIds);
  await page.getByTestId("pick-treatment-2c6e77bd-61db-4898-8612-84e976587ff7").click();
  await page.getByRole("button", { name: "Open Player utilities", exact: true }).click();
  await page.getByTestId("navigation-tree-jump-__terminal_nemar__").click();
  await page.getByTestId("terminal-nemar-yes").click();
  await page.getByTestId("finish-button").click();
  const gate = page.getByRole("dialog", { name: "Keep your session", exact: true });
  await gate.getByLabel("Email address").fill(network.user.email);
  await gate.getByLabel("Password").fill("  exact password  ");
  await gate.getByRole("button", { name: "Sign in and save", exact: true }).click();
  await expect(gate).toHaveCount(0);
  await expect.poll(() => network.tables.player_sessions?.[0]?.success_declared).toBe(true);
  await expect(page.getByTestId("completion-return-screen").or(page.getByTestId("guest-flow-pick-treatment")))
    .toBeVisible();
  const catalogRoute = await page.getByTestId("guest-flow-pick-treatment").count();
  if (catalogRoute) await page.getByRole("button", { name: "Open utilities", exact: true }).click();
  const observation = {
    catalogRoute,
    chosenSource: network.tables.player_sessions![0]!.treatment_id,
    visibleCatalog: await catalog.count(),
    sourceIds: network.tables.treatments!.map((row) => row.id).sort(),
    executions: network.tables.timeline_events!.length,
    uses: network.tables.personal_treatment_library![0]!.use_count,
  };
  await test.info().attach("post-finish-source-observation", {
    body: JSON.stringify(observation), contentType: "application/json",
  });
  console.log(JSON.stringify(observation));
  if (catalogRoute) await page.keyboard.press("Escape");
  await expect(page.getByTestId("completion-return-screen")).toBeVisible();
  await expect(catalog).toHaveCount(0);
  await page.getByTestId("completion-choose-catalog").click();
  await expect(page.getByTestId("guest-flow-pick-treatment")).toBeVisible();
  await page.getByRole("button", { name: "Open utilities", exact: true }).click();
  await expect(catalog).toHaveCount(3);
  expect(network.tables.treatments!.map((row) => row.id).sort()).toEqual(sourceIds);
  expect(network.tables.player_sessions).toHaveLength(1);
  expect(network.tables.timeline_events).toHaveLength(1);
  expect(network.tables.personal_treatment_library![0]!.use_count).toBe(1);
});
