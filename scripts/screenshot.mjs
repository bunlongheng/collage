// Captures README/demo screenshots against a running dev server.
// Usage: node scripts/screenshot.mjs [baseUrl]
import { chromium, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BASE = process.argv[2] || "http://localhost:3210";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "docs");

async function shot(browser, { name, device, dark, viewport, path: url = "/" }) {
  const ctx = await browser.newContext(
    device ? { ...device } : { viewport, deviceScaleFactor: 2 }
  );
  const page = await ctx.newPage();
  await page.addInitScript((d) => {
    localStorage.setItem("collage-theme", d ? "dark" : "light");
  }, dark);
  await page.goto(BASE + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  await ctx.close();
  console.log("wrote docs/" + name + ".png");
}

const browser = await chromium.launch();
await shot(browser, { name: "hero-dark", dark: true, viewport: { width: 1280, height: 900 } });
await shot(browser, { name: "hero-light", dark: false, viewport: { width: 1280, height: 900 } });
await shot(browser, { name: "mobile-dark", dark: true, device: devices["iPhone 13"] });
await shot(browser, { name: "signin", dark: false, viewport: { width: 1280, height: 900 }, path: "/signin" });
await browser.close();
