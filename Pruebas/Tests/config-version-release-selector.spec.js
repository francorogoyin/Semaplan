const { test, expect } = require("@playwright/test");

test("carga el registro de releases y navega a otro release",
async ({ page }) => {
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
  await page.route(
    "**/Aplicaciones/Web_Versiones/Manifest_Versiones.json",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            Id: "1.0.0",
            Archivo: "Semaplan_Version_1_0_0.html",
            Estado: "stable",
            Fecha_Publicacion: "2026-04-15",
            Esquema_Estado_Min: 1,
            Esquema_Estado_Max: 1
          },
          {
            Id: "1.1.0",
            Archivo: "Semaplan_Version_1_1_0.html",
            Estado: "stable",
            Fecha_Publicacion: "2026-04-21",
            Esquema_Estado_Min: 2,
            Esquema_Estado_Max: 2
          },
          {
            Id: "1.1.1",
            Archivo: "Semaplan_Version_1_1_1.html",
            Estado: "stable",
            Fecha_Publicacion: "2026-04-21",
            Esquema_Estado_Min: 2,
            Esquema_Estado_Max: 2
          }
        ])
      });
    }
  );
  await page.route(
    "**/Semaplan_Version_1_1_1.html",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>release 1.1.1</body></html>"
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
        Objetivos: [],
        Eventos: [],
        Metas: [],
        Slots_Muertos: [],
        Plantillas_Subobjetivos: [],
        Planes_Slot: {},
        Categorias: [],
        Etiquetas: [],
        Baul_Objetivos: [],
        Baul_Grupos_Colapsados: {},
        Archiveros: [],
        Notas_Archivero: [],
        Patrones: [],
        Contador_Eventos: 1,
        Objetivo_Seleccionada_Id: null,
        Modo_Editor_Abierto: false,
        Inicio_Semana: "2026-04-13",
        Duracion_Defecto: 1,
        Esquema_Estado_Version: 2,
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

  await page.waitForFunction(() => {
    const Select = document.getElementById(
      "Cfg_Version_Programa"
    );
    return Select && Select.options.length >= 2;
  });

  await page.selectOption("#Cfg_Version_Programa", "1.1.1");
  await expect(page.locator("#Cfg_Version_Abrir_Btn")).toBeEnabled();

  await Promise.all([
    page.waitForURL("**/Semaplan_Version_1_1_1.html"),
    page.click("#Cfg_Version_Abrir_Btn")
  ]);

  await expect(page.locator("body"))
    .toContainText("release 1.1.1");
});
