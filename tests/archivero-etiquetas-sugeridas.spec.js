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
    window.Inicializar();
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
    Render_Archivero();
  });
}

test("sugiere etiquetas en multiaccion y en nota", async ({
  page
}) => {
  const estadoInicial = {
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
      },
      {
        Id: "n2",
        Archivero_Id: "c1",
        Texto: "Dos",
        Origen: "",
        Etiquetas: ["Cliente"],
        Tipo: "Texto",
        Fecha_Creacion: 2
      }
    ],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
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

  await preparar(page, estadoInicial);

  await page.click("[data-nota-id='n1']", {
    modifiers: ["Control"]
  });
  await page.click("#Archivero_Multi_Etiquetas_Agregar_Btn");

  const sugeridasMulti = page.locator(
    "#Dialogo_Input_Sugerencias .Dialogo_Sugerencia_Btn"
  );
  await expect(sugeridasMulti).toHaveCount(2);
  await expect(sugeridasMulti.nth(0)).toHaveText("Cliente");
  await expect(sugeridasMulti.nth(1)).toHaveText("Urgente");

  await sugeridasMulti.nth(0).click();
  await page.locator(
    "#Dialogo_Botones .Dialogo_Boton_Primario"
  ).click();

  let etiquetas = await page.evaluate(() => {
    return Notas_Archivero.find((Nota) => Nota.Id === "n1")
      ?.Etiquetas || [];
  });
  expect(etiquetas).toEqual(["Urgente", "Cliente"]);

  await page.click("#Archivero_Btn_Nueva_Nota");
  const sugeridasNota = page.locator(
    "#Archivero_Nota_Etiquetas_Sugerencias " +
    ".Dialogo_Sugerencia_Btn"
  );
  await expect(sugeridasNota).toHaveCount(2);
  await sugeridasNota.nth(1).click();
  await expect(
    page.locator("#Archivero_Nota_Etiquetas_Input")
  ).toHaveValue("Urgente");
});
