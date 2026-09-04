import { expect, test } from "@playwright/test";

test("loads clean: empty slots and a Select photos prompt", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Collage/);
  await expect(page.getByRole("button", { name: "Select 4 photos" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Photo slot 1, empty" })).toBeVisible();
  // No always-on menu: Export only appears once there are photos.
  await expect(page.getByRole("button", { name: "Export", exact: true })).toHaveCount(0);
});

test("selecting photos fills slots and reveals Export", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles([
    "public/icon-512.png",
    "public/icon-192.png",
  ]);
  await expect(page.getByRole("button", { name: "Photo slot 1, filled" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Photo slot 2, filled" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
});

test("swiping across a photo changes its filter", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  const cell = page.getByRole("button", { name: "Photo slot 1, filled" });
  const box = await cell.boundingBox();
  const cx = box!.x + box!.width / 2;
  const cy = box!.y + box!.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 140, cy, { steps: 10 });
  await page.mouse.up();
  await expect(
    page.getByText(/Warm|Cold|Dream|Dark|B&W|Noir|Sepia|HDR|Fade/)
  ).toBeVisible();
});

test("tap selects a photo, tapping again deselects", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  const cell = page.getByRole("button", { name: "Photo slot 1, filled" });
  await cell.click();
  expect(await cell.evaluate((el) => getComputedStyle(el).boxShadow)).toContain("inset");
  await cell.click();
  expect(await cell.evaluate((el) => getComputedStyle(el).boxShadow)).toBe("none");
});

test("tapping two photos swaps them", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles([
    "public/icon-512.png",
    "public/apple-touch-icon.png",
  ]);
  const c0 = page.getByRole("button", { name: "Photo slot 1, filled" });
  const c1 = page.getByRole("button", { name: "Photo slot 2, filled" });
  const bg0 = await c0.evaluate((el) => (el as HTMLElement).style.backgroundImage);
  const bg1 = await c1.evaluate((el) => (el as HTMLElement).style.backgroundImage);
  expect(bg0).not.toBe(bg1);
  await c0.click();
  await c1.click();
  expect(await c0.evaluate((el) => (el as HTMLElement).style.backgroundImage)).toBe(bg1);
  expect(await c1.evaluate((el) => (el as HTMLElement).style.backgroundImage)).toBe(bg0);
});

test("Filter button changes the whole-collage filter", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(
    page.getByText(/Warm|Cold|Dream|Dark|B&W|Noir|Sepia|HDR|Fade/)
  ).toBeVisible();
});

test("adds an emoji sticker", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await page.getByRole("button", { name: "Stickers" }).click();
  await page.getByRole("button", { name: "Add 🔥" }).click();
  await expect(page.getByRole("button", { name: "Sticker 🔥" })).toBeVisible();
});

test("layouts panel only shows when the tool is tapped", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Layout Quad" })).toHaveCount(0);
  await page.getByRole("button", { name: "Layouts" }).click();
  await expect(page.getByRole("button", { name: "Layout Quad" })).toBeVisible();
});

test("adjust panel exposes safe area and curve", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await expect(page.getByText("Safe area")).toHaveCount(0);
  await page.getByRole("button", { name: "Adjust" }).click();
  await expect(page.getByText("Safe area")).toBeVisible();
  await expect(page.getByText("Curve")).toBeVisible();
});

test("toggles light and dark mode from Adjust", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await page.getByRole("button", { name: "Adjust" }).click();
  const html = page.locator("html");
  const before = await html.evaluate((el) => el.classList.contains("dark"));
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  const after = await html.evaluate((el) => el.classList.contains("dark"));
  expect(after).toBe(!before);
});

test("adds and removes text", async ({ page }) => {
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await page.getByRole("button", { name: "Add text" }).click();
  await expect(page.getByLabel("Text", { exact: true })).toHaveValue("Texts");
  await page.getByRole("button", { name: "Delete text" }).click();
  await expect(page.getByText("Texts")).toHaveCount(0);
});

test("exports a PNG after adding a photo", async ({ page }) => {
  // Force the download fallback (headless has no real share sheet).
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "canShare", { value: () => false, configurable: true });
  });
  await page.goto("/");
  await page.locator('input[type=file]').setInputFiles("public/icon-512.png");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("button", { name: "Size Collage" }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Export \d+ × \d+$/ }).click();
  const download = await downloadPromise;
  // A 512px test photo can't fill 2160px sharply, so the collage exports smaller.
  expect(download.suggestedFilename()).toMatch(/^collage-\d+x\d+-\d+\.png$/);
});

test("signin page explains local-first, no account", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByText("Nothing to sign into")).toBeVisible();
  await page.getByRole("link", { name: "Start creating" }).click();
  await expect(page).toHaveURL("/");
});
