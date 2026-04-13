const { test, expect } = require("@playwright/test");

test("mueve version a una seccion propia de config", async ({
  page
}) => {
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

  const datos = await page.evaluate(() => {
    const Select = document.getElementById(
      "Cfg_Version_Programa"
    );
    const Seccion_Version = Select?.closest(".Config_Seccion");
    const Secciones = Array.from(
      document.querySelectorAll(".Config_Cuerpo > .Config_Seccion")
    );
    const Seccion_Cuenta = Secciones.find((Seccion) =>
      Seccion.querySelector('[data-i18n="config.cuenta"]')
    );
    const Titulo = Seccion_Version?.querySelector(
      '[data-i18n="config.version_programa"]'
    );
    const Label = Seccion_Version?.querySelector(
      '[data-i18n="config.seleccionar"]'
    );
    return {
      existeSelect: Boolean(Select),
      titulo: Titulo?.textContent?.trim() || "",
      label: Label?.textContent?.trim() || "",
      cuentaContieneSelect: Boolean(
        Seccion_Cuenta?.querySelector("#Cfg_Version_Programa")
      ),
      indiceVersion: Secciones.indexOf(Seccion_Version),
      indiceCuenta: Secciones.indexOf(Seccion_Cuenta)
    };
  });

  expect(datos.existeSelect).toBeTruthy();
  expect(datos.titulo).toBe("Versión");
  expect(datos.label).toBe("Seleccionar");
  expect(datos.cuentaContieneSelect).toBeFalsy();
  expect(datos.indiceVersion).toBeGreaterThanOrEqual(0);
  expect(datos.indiceCuenta).toBeGreaterThan(datos.indiceVersion);
});
