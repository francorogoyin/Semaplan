const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./Pruebas/Tests",
  timeout: 120000,
  expect: {
    timeout: 10000
  },
  fullyParallel: false,
  workers: 1,
  use: {
    headless: true,
    trace: "on-first-retry"
  }
});
