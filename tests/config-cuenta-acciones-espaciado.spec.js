const { test, expect } = require("@playwright/test");

test("deja espacio vertical entre acciones de cuenta y botones", async ({
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

  const medida = await page.evaluate(() => {
    const Campo = document.querySelector(
      ".Cfg_Cuenta_Campo_Acciones"
    );
    const Etiqueta = Campo?.querySelector(
      ".Cfg_Cuenta_Etiqueta"
    );
    const Fila = Campo?.querySelector(
      ".Cfg_Cuenta_Acciones_Fila"
    );
    if (!Etiqueta || !Fila) return null;
    const Rect_Etiqueta = Etiqueta.getBoundingClientRect();
    const Rect_Fila = Fila.getBoundingClientRect();
    return {
      gap: Rect_Fila.top - Rect_Etiqueta.bottom
    };
  });

  expect(medida).not.toBeNull();
  expect(medida.gap).toBeGreaterThanOrEqual(8);
  expect(medida.gap).toBeLessThanOrEqual(14);
});
