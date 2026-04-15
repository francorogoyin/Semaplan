const { test, expect } = require("@playwright/test");

test("ordena los controles de datos en filas claras", async ({
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

  const layout = await page.evaluate(() => {
    const Botones = Array.from(
      document.querySelectorAll(
        ".Config_Dato_Fila_Botones .Config_Dato_Btn"
      )
    ).map((Btn) => {
      const Texto = Btn.querySelector(
        "span:last-child"
      );
      return (Texto?.textContent || "").trim();
    });
    const Fila_Botones = document.querySelector(
      ".Config_Dato_Fila_Botones"
    );
    const Fila_Frecuencia = document.querySelector(
      "#Cfg_Backup_Auto_Horas"
    )?.closest(".Config_Fila");
    const Fila_Check = document.querySelector(
      "#Cfg_Backup_Auto_Activo"
    )?.closest(".Config_Fila_Check");
    const Rect_Botones =
      Fila_Botones?.getBoundingClientRect();
    const Rect_Frecuencia =
      Fila_Frecuencia?.getBoundingClientRect();
    const Rect_Check =
      Fila_Check?.getBoundingClientRect();
    return {
      botones: Botones,
      misma_fila: Rect_Botones
        ? Math.abs(
          Rect_Botones.height -
          Math.max(
            ...Array.from(
              Fila_Botones.querySelectorAll(".Config_Dato_Btn")
            ).map((Btn) => Btn.getBoundingClientRect().height)
          )
        ) < 10
        : false,
      orden_vertical:
        Rect_Botones &&
        Rect_Frecuencia &&
        Rect_Check &&
        Rect_Botones.top < Rect_Frecuencia.top &&
        Rect_Frecuencia.top < Rect_Check.top
    };
  });

  expect(layout.botones).toEqual([
    "Crear copia",
    "Importar",
    "Exportar"
  ]);
  expect(layout.misma_fila).toBe(true);
  expect(layout.orden_vertical).toBe(true);
});
