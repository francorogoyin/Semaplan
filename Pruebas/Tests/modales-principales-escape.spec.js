const { test, expect } = require("@playwright/test");

async function Preparar(page) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.addInitScript(() => {
    window.supabase = {
      createClient() {
        return {
          auth: {
            async getSession() {
              return { data: { session: null } };
            },
            onAuthStateChange() {
              return {
                data: {
                  subscription: { unsubscribe() {} }
                }
              };
            },
            async signOut() {
              return { error: null };
            }
          }
        };
      }
    };
    window.turnstile = {
      render() {
        return 1;
      },
      remove() {},
      reset() {}
    };
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.removeItem("Semaplan_Estado_V2");
  });
  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Abrir_Panel_Habitos === "function" &&
    typeof Abrir_Retos === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    Inicializar();
    Config.Plan_Actual = "Upgrade";
    Config.Menu_Estilo = "Iconos";
    Aplicar_Estilo_Menu();
  });
}

test("escape cierra los modales principales de habitos y retos", async ({
  page
}) => {
  await Preparar(page);

  await page.locator("#Habitos_Boton").click();
  await expect(page.locator("#Habitos_Overlay"))
    .toHaveClass(/Activo/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#Habitos_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.locator("#Retos_Boton").click();
  await expect(page.locator("#Retos_Overlay"))
    .toHaveClass(/Activo/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#Retos_Overlay"))
    .not.toHaveClass(/Activo/);
});
