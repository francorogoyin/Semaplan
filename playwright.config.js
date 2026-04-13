const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    trace: "on-first-retry"
  },
  webServer: {
    command: "python -m http.server 4173",
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: false,
    timeout: 30000
  }
});
