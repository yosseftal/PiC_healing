import { expect, test } from "@playwright/test";

for (const locale of ["he", "en"] as const) {
  test(`${locale} official video loads on activation and unmounts cleanly`, async ({ page }) => {
    await page.route("https://www.youtube-nocookie.com/embed/**", (route) => route.abort());
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`/tests/education-media.fixture.html?locale=${locale}`);
    const title = locale === "he" ? "הדגמת השיטה הרשמית" : "Official method demonstration";
    const frame = page.getByTitle(title);

    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(frame).toHaveCount(0);
    await expect(page.getByRole("link", { name: locale === "he" ? "פתיחת הסרטון באתר YouTube" : "Open video on YouTube" }))
      .toHaveAttribute("href", "https://www.youtube.com/watch?v=txSeLG4kJ6Y");

    await page.getByRole("button", { name: locale === "he" ? "הפעלת הסרטון" : "Load video" }).click();
    await expect(frame).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/txSeLG4kJ6Y?controls=1&autoplay=0",
    );
    await expect(frame).toHaveAttribute("allowfullscreen", "");
    const bounds = await frame.boundingBox();
    expect(bounds?.width).toBeGreaterThanOrEqual(200);
    expect(bounds?.height).toBeGreaterThanOrEqual(200);

    await page.evaluate(() => window.dispatchEvent(new Event("fixture-unmount")));
    await expect(frame).toHaveCount(0);
  });
}

test("blocked provider keeps the source-link fallback available", async ({ page }) => {
  await page.route("https://www.youtube-nocookie.com/embed/**", (route) => route.abort());
  await page.goto("/tests/education-media.fixture.html?locale=en");
  await page.getByRole("button", { name: "Load video" }).click();
  await expect(page.getByTitle("Official method demonstration")).toHaveAttribute("src", /youtube-nocookie\.com/);
  await page.getByRole("button", { name: "Video did not load?" }).click();
  await expect(page.getByRole("status")).toContainText("unavailable right now");
  await expect(page.getByTitle("Official method demonstration")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Open video on YouTube" }))
    .toHaveAttribute("href", "https://www.youtube.com/watch?v=txSeLG4kJ6Y");
});
