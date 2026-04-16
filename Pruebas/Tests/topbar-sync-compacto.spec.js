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
  });
}

test("muestra sync compacto sin texto de ultimo guardado",
async ({ page }) => {
  await Preparar(page);

  const Resumen = await page.evaluate(() => {
    Actualizar_Sync_Indicador("Guardado");
    const Top = document.getElementById(
      "Calendario_Top_Acciones"
    );
    return {
      detalle_existe: Boolean(
        document.getElementById("Sync_Detalle")
      ),
      texto_visible: Top.innerText
    };
  });

  expect(Resumen.detalle_existe).toBeFalsy();
  expect(Resumen.texto_visible).toContain("Guardado");
  expect(Resumen.texto_visible).not.toMatch(
    /Last saved|No recent save|Ultimo|\u00daltimo|guardado \d/i
  );
});

test("mantiene visible el reintento cuando sync falla",
async ({ page }) => {
  await Preparar(page);

  const Resumen = await page.evaluate(() => {
    Actualizar_Sync_Indicador("Error");
    const Btn = document.getElementById("Sync_Reintentar_Btn");
    const Estilo = window.getComputedStyle(Btn);
    return {
      visible: Btn.classList.contains("Visible"),
      display: Estilo.display
    };
  });

  expect(Resumen.visible).toBeTruthy();
  expect(Resumen.display).not.toBe("none");
});
