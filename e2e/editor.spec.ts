import { expect, test } from "@playwright/test";

test("loads the editor with the default collage", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("banner").getByText("Collage")).toBeVisible();
  await expect(page.getByText("Golden hour")).toBeVisible();
  await expect(page.getByRole("button", { name: "Export" })).toBeVisible();
});

test("toggles light and dark mode", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  const before = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  const after = await html.evaluate((el) => el.classList.contains("dark"));
  expect(after).toBe(!before);
});

test("adds a text overlay from a preset", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("tab", { name: "Text" }).click();
  await page.getByRole("button", { name: "Headline", exact: false }).first().click();
  // The editable input for the new selection shows its default label.
  await expect(page.getByLabel("Text content")).toHaveValue("Headline");
});

test("places a gallery photo into an empty cell", async ({ page }) => {
  await page.goto("/");
  // Quad layout leaves the 4th cell empty on first load.
  await page.getByRole("tab", { name: "Layout" }).click();
  await page.getByRole("button", { name: "Quad" }).click();
  await page.getByRole("tab", { name: "Photos" }).click();
  await page.getByRole("button", { name: "Ember" }).click();
  const emptyCell = page.getByRole("button", { name: /Cell 4, empty/ });
  await expect(emptyCell).toBeVisible();
  await emptyCell.click();
  await expect(page.getByRole("button", { name: /Cell 4, filled/ })).toBeVisible();
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
