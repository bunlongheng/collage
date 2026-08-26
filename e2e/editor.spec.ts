import { expect, test } from "@playwright/test";

test("loads clean: empty slots and a Select photos prompt", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Collage/);
  await expect(page.getByRole("button", { name: "Select photos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Photo slot 1, empty" })).toBeVisible();
  // No always-on menu: Export only appears once there are photos.
  await expect(page.getByRole("button", { name: "Export" })).toHaveCount(0);
});

test("selecting photos fills slots and reveals Export", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles([
    "public/icon-512.png",
    "public/icon-192.png",
  ]);
  await expect(page.getByRole("button", { name: "Photo slot 1, filled" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Photo slot 2, filled" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
});

test("layouts panel only shows when the tool is tapped", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Layout Quad" })).toHaveCount(0);
  await page.getByRole("button", { name: "Layouts" }).click();
  await expect(page.getByRole("button", { name: "Layout Quad" })).toBeVisible();
});

test("adjust panel exposes safe area and curve", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Safe area")).toHaveCount(0);
  await page.getByRole("button", { name: "Adjust" }).click();
  await expect(page.getByText("Safe area")).toBeVisible();
  await expect(page.getByText("Curve")).toBeVisible();
});

test("toggles light and dark mode from Adjust", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Adjust" }).click();
  const html = page.locator("html");
  const before = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  const after = await html.evaluate((el) => el.classList.contains("dark"));
  expect(after).toBe(!before);
});

test("adds and removes a caption", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Add text" }).click();
  await expect(page.getByLabel("Caption text")).toHaveValue("Your caption");
  await page.getByRole("button", { name: "Delete caption" }).click();
  await expect(page.getByText("Your caption")).toHaveCount(0);
});

test("exports a PNG after adding a photo", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
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
