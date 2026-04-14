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
    window.alert = () => {};
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify({
        Tareas: [],
        Eventos: [],
        Metas: [],
        Slots_Muertos: [],
        Plantillas_Subtareas: [],
        Planes_Slot: {},
        Categorias: [],
        Etiquetas: [],
        Baul_Tareas: [],
        Baul_Grupos_Colapsados: {},
        Archiveros: [],
        Notas_Archivero: [],
        Patrones: [],
        Contador_Eventos: 1,
        Tarea_Seleccionada_Id: null,
        Modo_Editor_Abierto: false,
        Inicio_Semana: "2026-04-13",
        Duracion_Defecto: 1,
        Config_Extra: {},
        Tipos_Slot: [],
        Tipos_Slot_Inicializados: false,
        Slots_Muertos_Tipos: {},
        Slots_Muertos_Nombres: {},
        Abordajes_Migrados_V1: true,
        Semanas_Con_Defaults: [],
        Planes_Semana: {}
      })
    );
  });

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Abrir_Config();
  });
}

test("muestra apps en config y descarga inactiva", async ({
  page
}) => {
  await Preparar(page);

  await expect(page.locator("#Cfg_App_Desktop_Btn"))
    .toContainText("Desktop");
  await expect(page.locator("#Cfg_App_Android_Btn"))
    .toContainText("Android");

  await page.click("#Cfg_App_Desktop_Btn");
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Cfg_App_Desktop_Descargar"))
    .toBeDisabled();
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .toContainText("Windows");

  await page.keyboard.press("Escape");
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.click("#Cfg_App_Android_Btn");
  await expect(page.locator("#Cfg_App_Android_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Cfg_App_Android_Descargar"))
    .toBeDisabled();
  await expect(page.locator("#Cfg_App_Android_Overlay"))
    .toContainText("teléfono");
});

test("traduce la seccion de apps y sus modales", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Leer = (Tipo) => {
      Abrir_Modal_App_Config(Tipo);
      const Datos = {
        apps: document.querySelector(
          '[data-i18n="config.apps"]'
        )?.textContent?.trim() || "",
        hint: document.querySelector(
          '[data-i18n="config.apps_hint"]'
        )?.textContent?.trim() || "",
        titulo: document.querySelector(
          `#Cfg_App_${Tipo}_Overlay ` +
          '[data-i18n$="_titulo"]'
        )?.textContent?.trim() || "",
        nota: document.querySelector(
          `#Cfg_App_${Tipo}_Overlay ` +
          '[data-i18n="config.app_sin_link"]'
        )?.textContent?.trim() || "",
        boton: document.querySelector(
          `#Cfg_App_${Tipo}_Descargar`
        )?.textContent?.trim() || ""
      };
      Cerrar_Modal_App_Config(Tipo);
      return Datos;
    };

    const es = Leer("Desktop");
    Cambiar_Idioma("en");
    const en = Leer("Android");
    Cambiar_Idioma("pt");
    const pt = Leer("Desktop");
    return { es, en, pt };
  });

  expect(resultado.es.apps).toBe("Apps");
  expect(resultado.es.hint).toContain("descarga");
  expect(resultado.es.titulo).toBe("App Desktop");
  expect(resultado.es.nota).toContain("todavía");
  expect(resultado.es.boton).toBe("Descargar");

  expect(resultado.en.apps).toBe("Apps");
  expect(resultado.en.hint).toContain("download");
  expect(resultado.en.titulo).toBe("Android app");
  expect(resultado.en.nota).toContain("not been published");
  expect(resultado.en.boton).toBe("Download");

  expect(resultado.pt.apps).toBe("Apps");
  expect(resultado.pt.hint).toContain("download");
  expect(resultado.pt.titulo).toBe("App Desktop");
  expect(resultado.pt.nota).toContain("ainda não");
  expect(resultado.pt.boton).toBe("Baixar");
});
