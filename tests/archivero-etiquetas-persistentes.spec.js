const { test, expect } = require("@playwright/test");

async function Preparar(page, Estado_Inicial) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/" +
    "supabase-js@2",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.route(
    "https://challenges.cloudflare.com/" +
    "turnstile/v0/api.js?render=explicit",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.addInitScript((Estado) => {
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
      JSON.stringify(Estado)
    );
  }, Estado_Inicial);

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
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
    Render_Archivero();
  });
}

test("mantiene etiquetas aunque ya no tengan notas", async ({
  page
}) => {
  const Estado_Inicial = {
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
      { Id: "c1", Nombre: "Semaplan", Emoji: "🗃️" }
    ],
    Notas_Archivero: [
      {
        Id: "n1",
        Archivero_Id: "c1",
        Texto: "Uno",
        Origen: "",
        Etiquetas: ["Urgente"],
        Tipo: "Texto",
        Fecha_Creacion: 1
      }
    ],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Archivero_Seleccion_Id: "c1",
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Plan_Actual: "Premium",
      Menu_Botones_Visibles: {
        Archivero_Boton: true
      }
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await Preparar(page, Estado_Inicial);

  let Etiquetas_Catalogo = await page.evaluate(() => {
    return Etiquetas_Archivero.slice();
  });
  expect(Etiquetas_Catalogo).toEqual(["Urgente"]);

  await page.evaluate(() => {
    Notas_Archivero = [];
    Guardar_Estado();
    Render_Archivero();
  });

  const Opciones_Filtro = page.locator(
    "#Archivero_Filtro_Etiqueta_Select option"
  );
  await expect(Opciones_Filtro).toContainText([
    "Todos",
    "Urgente"
  ]);

  await page.click("#Archivero_Btn_Nueva_Nota");
  const Sugeridas = page.locator(
    "#Archivero_Nota_Etiquetas_Sugerencias " +
    ".Dialogo_Sugerencia_Btn"
  );
  await expect(Sugeridas).toHaveCount(1);
  await expect(Sugeridas.first()).toHaveText("Urgente");

  const Estado_Guardado = await page.evaluate(() => {
    return JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2")
    );
  });
  expect(Estado_Guardado.Etiquetas_Archivero).toEqual([
    "Urgente"
  ]);
});
