const { defineConfig } = require("@playwright/test");

const COMANDO_SERVIDOR = process.platform === "win32"
  ? "py -m http.server 4173"
  : "python3 -m http.server 4173";

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
    command: COMANDO_SERVIDOR,
    url: "http://127.0.0.1:4173/index.html",
    reuseExistingServer: false,
    timeout: 30000
  }
});
