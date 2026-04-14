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
  await page.waitForFunction(() => typeof window.Inicializar === "function");
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

test("guarda descripcion y la muestra en hover del baul", async ({
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
        Descripcion: "Línea 1\nLínea 2",
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

  await page.hover('[data-baul-id="b1"]');
  await page.waitForTimeout(2100);

  await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
    .toHaveText("Descripción");
  await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
    .toHaveText("Línea 1\nLínea 2");

  await page.evaluate(() => {
    Abrir_Nueva_Tarea_Baul();
  });
  await page.fill("#Baul_Nombre_Input", "Tarea nueva");
  await page.fill(
    "#Baul_Descripcion_Input",
    "Contexto largo de prueba"
  );
  await page.click("#Baul_Guardar");

  const Estado = await page.evaluate(() => {
    return {
      Guardada: Baul_Tareas.find((Tarea) =>
        Tarea.Nombre === "Tarea nueva"
      )?.Descripcion || "",
      Local: JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2")
      ).Baul_Tareas.find((Tarea) =>
        Tarea.Nombre === "Tarea nueva"
      )?.Descripcion || ""
    };
  });

  expect(Estado.Guardada).toBe("Contexto largo de prueba");
  expect(Estado.Local).toBe("Contexto largo de prueba");
});
