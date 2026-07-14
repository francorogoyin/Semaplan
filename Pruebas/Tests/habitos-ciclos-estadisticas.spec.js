const { test, expect } = require("@playwright/test");

async function Preparar(page) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    async (route) => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    async (route) => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
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
              return { data: { subscription: { unsubscribe() {} } } };
            }
          }
        };
      }
    };
    window.turnstile = { render() {}, remove() {}, reset() {} };
  });
  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Normalizar_Habito === "function" &&
    typeof Habito_Corresponde_En_Fecha === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    Habitos = [];
    Habitos_Registros = [];
  });
}

test("evalua ciclos personalizados de habitos", async ({ page }) => {
  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Id: "Habito_Ciclo",
      Nombre: "Lectura alternada",
      Fecha_Inicio: "2026-04-13",
      Programacion: {
        Tipo: "Libre",
        Tipo_Ciclo: "Ciclo",
        Semanas_Ciclo: 2,
        Dias_Ciclo: [[0, 1], [2, 3]]
      }
    });
    return {
      semanaA: [
        Habito_Corresponde_En_Fecha(Habito, "2026-04-13"),
        Habito_Corresponde_En_Fecha(Habito, "2026-04-15")
      ],
      semanaB: [
        Habito_Corresponde_En_Fecha(Habito, "2026-04-20"),
        Habito_Corresponde_En_Fecha(Habito, "2026-04-22")
      ]
    };
  });
  expect(Resultado).toEqual({
    semanaA: [true, false],
    semanaB: [false, true]
  });
});

test("abre estadisticas y resetea fecha al cambiar vista", async ({ page }) => {
  await Preparar(page);
  await page.evaluate(() => {
    Habitos = [Normalizar_Habito({
      Id: "Habito_Estadisticas",
      Nombre: "Lectura",
      Meta: { Modo: "Check", Cantidad: 1 }
    })];
    Abrir_Panel_Habitos();
    Habitos_Panel_Fecha = "2020-01-01";
    Render_Modal_Habitos();
  });
  await page.locator('[data-habitos-toggle="Habito_Estadisticas"]')
    .click();
  await page.locator('[data-habitos-estadisticas="Habito_Estadisticas"]')
    .click();
  await expect(page.locator(".Habitos_Estadisticas_Panel"))
    .toBeVisible();
  await expect(page.locator(".Habitos_Estadisticas_Grafico"))
    .toBeVisible();
  await page.locator('[data-habitos-estadisticas-cerrar]').click();
  await page.locator('[data-habitos-panel-modo="Semana"]').click();
  const Fecha = await page.evaluate(() => Habitos_Panel_Fecha);
  expect(Fecha).toBe(await page.evaluate(() => Habitos_Fecha_Hoy()));
});
