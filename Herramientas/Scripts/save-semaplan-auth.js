const fs = require("fs");
const path = require("path");
const { chromium } = require("@playwright/test");

const AUTH_DIR = path.join(
  process.cwd(),
  "Pruebas",
  "Playwright",
  ".auth"
);
const TARGET_URL =
  process.env.SEMAPLAN_TARGET_URL ||
  "https://semaplan.com";
const ES_STAGING =
  /(^|[?&])entorno=staging([&#]|$)/i.test(TARGET_URL) ||
  /staging/i.test(TARGET_URL);
const CLAVE_QA_SIN_CAPTCHA = ES_STAGING
  ? "Semaplan_QA_Sin_Captcha_staging"
  : "Semaplan_QA_Sin_Captcha";
const AUTH_FILE = process.env.SEMAPLAN_AUTH_FILE
  ? path.resolve(process.env.SEMAPLAN_AUTH_FILE)
  : path.join(
      AUTH_DIR,
      ES_STAGING
        ? "semaplan-staging.json"
        : "semaplan-smoke.json"
    );
const EMAIL = process.env.SEMAPLAN_EMAIL || "";
const PASSWORD = process.env.SEMAPLAN_PASSWORD || "";
const QA_SIN_CAPTCHA =
  process.env.SEMAPLAN_QA_SIN_CAPTCHA === "1";
const HEADLESS =
  process.env.SEMAPLAN_HEADLESS === "1";

async function waitForLoggedIn(page) {
  await page.waitForFunction(() => {
    const archivero = document.getElementById(
      "Archivero_Boton"
    );
    const auth = document.getElementById("Auth_Overlay");
    const authVisible =
      auth && auth.classList.contains("Activo");
    return Boolean(archivero) && !authVisible;
  }, null, { timeout: 10 * 60 * 1000 });
}

async function intentarLoginAutomatico(page) {
  if (!EMAIL || !PASSWORD) {
    return false;
  }

  await page.waitForSelector("#Auth_Email", {
    timeout: 120000
  });
  await page.fill("#Auth_Email", EMAIL);
  await page.fill("#Auth_Password", PASSWORD);
  await page.click("#Auth_Btn_Submit");
  return true;
}

async function main() {
  fs.mkdirSync(AUTH_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: HEADLESS ? true : false,
    slowMo: 50
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("");
  console.log("Abriendo Semaplan en Chromium...");
  if (QA_SIN_CAPTCHA) {
    console.log("Se activa bypass QA local de CAPTCHA.");
  }
  if (EMAIL && PASSWORD) {
    console.log("Se intenta login automatico.");
  } else {
    console.log("Hace el login manual y resolve el CAPTCHA.");
  }
  console.log("Cuando la app quede abierta, guardo la sesion en:");
  console.log(AUTH_FILE);
  console.log("");

  try {
    if (QA_SIN_CAPTCHA) {
      await page.addInitScript((Clave) => {
        localStorage.setItem(
          Clave,
          "1"
        );
      }, CLAVE_QA_SIN_CAPTCHA);
    }

    await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 120000
    });

    await intentarLoginAutomatico(page);
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
