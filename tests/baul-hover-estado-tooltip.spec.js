const { test, expect } = require("@playwright/test");

async function preparar(page, estadoInicial) {
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
  await page.addInitScript((estado) => {
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
      JSON.stringify(estado)
    );
  }, estadoInicial);
  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    window.Inicializar();
    Abrir_Baul();
    if (typeof Dialogo_Abierto !== "undefined") {
      Dialogo_Abierto = false;
    }
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Render_Baul();
  });
}

test("no muestra el estado como tooltip nativo en el baul", async ({
  page
}) => {
  await preparar(page, {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [
      {
        Id: "b1",
        Nombre: "Tarea con detalle",
        Emoji: "📝",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "Linea 1\nLinea 2",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1
      }
    ],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Plan_Actual: "Premium",
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Tareas_Por_Fila: 5,
      Baul_Sombra_Estado: true
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  });

  const tarjeta = page.locator('[data-baul-id="b1"]');
  await expect(tarjeta).not.toHaveAttribute("title", "Activa");

  await tarjeta.hover();
  await page.waitForTimeout(2100);

  await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
    .toHaveText("Descripción");
  await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
    .toHaveText("Linea 1\nLinea 2");
});
