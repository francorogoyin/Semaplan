const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const AUTH_DIR = path.join(process.cwd(), "playwright", ".auth");
const AUTH_FILE = path.join(AUTH_DIR, "semaplan-patricio.json");
const TARGET_URL = "https://semaplan.com";

async function waitForLoggedIn(page) {
  await page.waitForFunction(() => {
    const archivero = document.getElementById("Archivero_Boton");
    const auth = document.getElementById("Auth_Overlay");
    const authVisible = auth && auth.classList.contains("Activo");
    return Boolean(archivero) && !authVisible;
  }, null, { timeout: 10 * 60 * 1000 });
}

async function main() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("");
  console.log("Abriendo Semaplan en Chromium...");
  console.log("Hacé el login manual y resolvé el CAPTCHA.");
  console.log("Cuando la app quede abierta, guardo la sesión en:");
  console.log(AUTH_FILE);
  console.log("");

  try {
    await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });

    await waitForLoggedIn(page);
    await context.storageState({ path: AUTH_FILE });

    console.log("");
    console.log("Sesion guardada correctamente.");
    console.log(AUTH_FILE);
    console.log("");
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("");
  console.error("No se pudo guardar la sesion.");
  console.error(error);
  process.exit(1);
});
