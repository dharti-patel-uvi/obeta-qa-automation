import { obetangBaseUrl } from "./utils/env";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load .env before defineConfig() invokes obetangBaseUrl().
dotenv.config();

/**
 * Local development configuration.
 * Headed Google Chrome, single worker, trace + video always on — for authoring
 * and debugging specs against the OBETANG dev environment.
 *
 * Run with:  npm run test:local
 * See https://playwright.dev/docs/test-configuration.
 */
const testRailOptions = {
  embedAnnotationsAsProperties: true,
  outputFile: "./test-results/junit-report.xml",
};

export default defineConfig({
  testDir: "./test",
  testMatch: ["**/*.spec.ts"],
  // test-1/test-2/test-3 are raw Playwright codegen recordings kept only as
  // authoring references (no fixtures, and they drive into the out-of-scope
  // Payment step) — not runnable specs. The rebuilt POM versions live in
  // test-3s.spec.ts / test-3b.spec.ts, which are NOT ignored. _diag* are ad-hoc
  // DOM probes, not TestRail cases.
  testIgnore: [
    "**/test-1.spec.ts",
    "**/test-2.spec.ts",
    "**/test-3.spec.ts",
    "**/_diag*.spec.ts",
  ],
  expect: {
    timeout: 15000,
  },
  fullyParallel: false,
  workers: 1,
  timeout: 100000,
  reporter: [
    ["list", { printSteps: true }],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", testRailOptions],
  ],
  use: {
    // OBETANG base URL for the selected TARGET_ENV (defaults to dev — set
    // TARGET_ENV=stg in .env to target the staging environment).
    baseURL: obetangBaseUrl(),
    headless: false,
    trace: "on",
    video: "on",
    launchOptions: {
      slowMo: 0,
    },
  },
  projects: [
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
