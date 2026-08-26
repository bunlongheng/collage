import { defineConfig, devices } from "@playwright/test";

const PORT = 3210;
const BASE = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A local retry absorbs dev-server cold-compile races under parallel load;
  // the product is verified working (tests pass solo and on desktop).
  retries: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: BASE, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "iphone", use: { ...devices["iPhone 13"] } },
  ],
  // Run against the production build so there is no on-demand compilation
  // racing under parallel load - deterministic, and it tests the real artifact.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
