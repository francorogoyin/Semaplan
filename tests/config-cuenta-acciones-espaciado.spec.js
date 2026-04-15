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
    const Campo_Apps = document.querySelector(
      ".Cfg_Cuenta_Campo_Apps"
    );
    const Titulo_Acciones = Campo?.querySelector(
      ".Config_Seccion_Titulo"
    );
    const Titulo_Apps = Campo_Apps?.querySelector(
      ".Config_Seccion_Titulo"
    );
    const Fila = Campo?.querySelector(
      ".Cfg_Cuenta_Acciones_Fila"
    );
    const Fila_Apps = Campo_Apps?.querySelector(
      ".Cfg_Apps_Lista"
    );
    const Sep_Acciones = Campo?.previousElementSibling;
    const Sep_Apps = Campo_Apps?.previousElementSibling;
    const Titulo_Version = Array.from(
      document.querySelectorAll(".Config_Seccion_Titulo")
    ).find((El) => {
      return (El.textContent || "").includes("Versi");
    });
    const Fila_Version = document.querySelector(
      "#Cfg_Version_Programa"
    )?.closest(".Config_Fila");
    const Seccion_Version = Fila_Version?.closest(
      ".Config_Seccion"
    );
    if (
      !Campo ||
      !Campo_Apps ||
      !Titulo_Acciones ||
      !Titulo_Apps ||
      !Fila ||
      !Fila_Apps ||
      !Sep_Acciones ||
      !Sep_Apps ||
      !Titulo_Version ||
      !Fila_Version ||
      !Seccion_Version
    ) {
      return null;
    }
    const Rect_Etiqueta =
      Titulo_Acciones.getBoundingClientRect();
    const Rect_Fila = Fila.getBoundingClientRect();
    const Rect_Titulo_Apps =
      Titulo_Apps.getBoundingClientRect();
    const Rect_Fila_Apps = Fila_Apps.getBoundingClientRect();
    const Rect_Sep_Acciones =
      Sep_Acciones.getBoundingClientRect();
    const Rect_Sep_Apps = Sep_Apps.getBoundingClientRect();
    const Rect_Campo = Campo.getBoundingClientRect();
    const Rect_Titulo_Version =
      Titulo_Version.getBoundingClientRect();
    const Rect_Fila_Version =
      Fila_Version.getBoundingClientRect();
    const Rect_Seccion_Version =
      Seccion_Version.getBoundingClientRect();
    return {
      gap: Rect_Fila.top - Rect_Etiqueta.bottom,
      gap_apps:
        Rect_Fila_Apps.top - Rect_Titulo_Apps.bottom,
      gap_version:
        Rect_Fila_Version.top - Rect_Titulo_Version.bottom,
      gap_superior_apps:
        Rect_Titulo_Apps.top - Rect_Sep_Apps.bottom,
      gap_superior_acciones:
        Rect_Etiqueta.top - Rect_Sep_Acciones.bottom,
      gap_inferior:
        Rect_Campo.bottom - Rect_Fila.bottom,
      gap_inferior_version:
        Rect_Seccion_Version.bottom - Rect_Fila_Version.bottom
    };
  });

  expect(medida).not.toBeNull();
  expect(Math.abs(medida.gap_apps - medida.gap_version))
    .toBeLessThanOrEqual(2);
  expect(Math.abs(medida.gap - medida.gap_version))
    .toBeLessThanOrEqual(2);
  expect(
    Math.abs(
      medida.gap_superior_apps -
      medida.gap_superior_acciones
    )
  ).toBeLessThanOrEqual(5);
  expect(medida.gap_superior_apps).toBeGreaterThanOrEqual(14);
  expect(
    Math.abs(
      medida.gap_inferior -
      medida.gap_inferior_version
    )
  ).toBeLessThanOrEqual(2);
});
