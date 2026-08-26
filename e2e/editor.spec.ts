import { expect, test } from "@playwright/test";

test("loads the editor with an auto-filled collage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Collage")).toBeVisible();
  await expect(page.getByText("Summer 2026")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
  // Quad layout is pre-filled - slot 1 is filled on load, no clicks needed.
  await expect(page.getByRole("button", { name: "Photo slot 1, filled" })).toBeVisible();
});

test("toggles light and dark mode", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  const after = await html.evaluate((el) => el.classList.contains("dark"));
  expect(after).toBe(!before);
});

test("tapping a photo fills the selected slot and advances", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Photos -> slot 1")).toBeVisible();
  await page.getByRole("button", { name: "Indigo" }).click();
  // Selection advances so the next tap fills the next slot - fewer clicks.
  await expect(page.getByText("Photos -> slot 2")).toBeVisible();
});

test("switches layout and keeps it filled", async ({ page }) => {
  await page.goto("/");
  const story = page.getByRole("button", { name: "Layout Story split" });
  await story.click();
  await expect(story).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Photo slot 1, filled" })).toBeVisible();
});

test("adds and removes a caption without leaving the screen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await expect(page.getByLabel("Caption text")).toHaveValue("Your caption");
  await page.getByRole("button", { name: "Delete caption" }).click();
  await expect(page.getByText("Your caption")).toHaveCount(0);
});

test("exports a PNG download", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^collage-\d+\.png$/);
});

test("signin page explains local-first, no account", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByText("Nothing to sign into")).toBeVisible();
  await page.getByRole("link", { name: "Start creating" }).click();
  await expect(page).toHaveURL("/");
});
