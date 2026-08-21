import { obetangBaseUrl } from "./utils/env";
import { defineConfig, devices } from "@playwright/test";
import type { MsTeamsReporterOptions } from "playwright-msteams-reporter";
import dotenv from "dotenv";

// Load .env before defineConfig() invokes obetangBaseUrl().
dotenv.config();

/**
 * Default / CI configuration (chromium, headless, parallel).
 * Base URL is read from the environment so the same suite can point at dev/stg.
 * See https://playwright.dev/docs/test-configuration.
 */
const today = new Date();
const formattedDate = today.toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
});

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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  timeout: 150000,
  reportSlowTests: { max: 3, threshold: 180000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "./results-json/results.json" }],
    ["junit", testRailOptions],
    process.env.CI
      ? [
          "playwright-msteams-reporter",
          <MsTeamsReporterOptions>{
            webhookUrl: process.env.TEAMS_HOOK_URL,
            webhookType: "msteams",
            enableEmoji: true,
            title: `E2E test OBETANG. ${formattedDate}`,
            mentionOnFailure: process.env.MS_TEAMS_REPORT_TO,
          },
        ]
      : ["dot"],
  ],
  use: {
    // OBETANG base URL for the selected TARGET_ENV (defaults to dev).
    baseURL: obetangBaseUrl(),
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
    launchOptions: {
      slowMo: 0,
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
