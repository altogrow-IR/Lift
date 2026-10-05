import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: ".qa/test-results",
  use: {
    baseURL: process.env.TEST_URL || "http://127.0.0.1:4173",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL || "msedge",
    headless: true,
    viewport: { width: 390, height: 844 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
