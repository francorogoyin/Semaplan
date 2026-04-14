const { test, expect } = require("@playwright/test");

test("las notas del archivero muestran cursor y hover visibles",
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
        Archiveros: [
          {
            Id: "ARC_1",
            Nombre: "Semaplan",
            Emoji: "🗃️",
            Fecha_Creacion: 1
          }
        ],
        Notas_Archivero: [
          {
            Id: "NOTA_1",
            Archivero_Id: "ARC_1",
            Texto: "Nota visible",
            Tipo: "Texto",
            Fecha_Creacion: Date.now(),
            Fecha_Actualizacion: Date.now(),
            Etiquetas: [],
            Origen: ""
          }
        ],
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
        Planes_Semana: {},
        Archivero_Seleccion_Id: "ARC_1"
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
    Archivero_Seleccion_Id = "ARC_1";
    Abrir_Archivero();
    Render_Archivero_Notas();
  });

  const Card = page.locator(".Archivero_Nota_Card").first();
  const estilos = await Card.evaluate((el) => {
    const Css = window.getComputedStyle(el);
    return {
      cursor: Css.cursor,
      transition: Css.transition
    };
  });

  expect(estilos.cursor).toBe("pointer");
  expect(estilos.transition).toContain("box-shadow");
});
