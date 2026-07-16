import { defineConfig, devices } from "@playwright/test";

// Keep the production smoke isolated from a developer's Vite preview. This port is
// intentionally distinct from Vite's default 4173, and Playwright must own it.
const smokePort = 4174;
const smokeUrl = `http://127.0.0.1:${smokePort}`;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: smokeUrl,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port ${smokePort} --strictPort`,
    url: smokeUrl,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
