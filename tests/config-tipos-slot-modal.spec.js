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
}

test("edita y crea tipos de slot desde modal", async ({
  page
}) => {
  const estadoInicial = {
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "🍽️ Almuerzo",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Abrir_Config();
  });

  const layout = await page.evaluate(() => {
    return {
      hayInputInline: Boolean(
        document.getElementById("Cfg_Tipo_Slot_Nombre")
      ),
      cantidadInputsFila: document.querySelectorAll(
        ".Config_Tipo_Slot_Fila input"
      ).length,
      hayEditar: Boolean(
        document.querySelector(
          '[data-accion="editar-tipo-slot"]'
        )
      )
    };
  });

  expect(layout.hayInputInline).toBeFalsy();
  expect(layout.cantidadInputsFila).toBe(0);
  expect(layout.hayEditar).toBeTruthy();

  await page.click(
    '[data-accion="editar-tipo-slot"]' +
    '[data-tipo-slot-id="Comida"]'
  );
  await expect(
    page.locator("#Cfg_Tipo_Slot_Overlay")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator("#Cfg_Tipo_Slot_Modal_Nombre")
  ).toHaveValue("Comida");
  await expect(
    page.locator("#Cfg_Tipo_Slot_Modal_Titulo_Input")
  ).toHaveValue("🍽️ Almuerzo");
  await expect(
    page.locator("#Cfg_Tipo_Slot_Modal_Titulo_Default")
  ).toBeChecked();

  await page.fill(
    "#Cfg_Tipo_Slot_Modal_Nombre",
    "Comida fuerte"
  );
  await page.fill(
    "#Cfg_Tipo_Slot_Modal_Titulo_Input",
    "🍝 Cena"
  );
  await page.fill(
    "#Cfg_Tipo_Slot_Modal_Color",
    "#e0b070"
  );
  await page.click("#Cfg_Tipo_Slot_Guardar");

  await page.click("#Cfg_Tipo_Slot_Nuevo");
  await page.fill("#Cfg_Tipo_Slot_Modal_Nombre", "Siesta");
  await page.fill(
    "#Cfg_Tipo_Slot_Modal_Titulo_Input",
    "😴 Siesta"
  );
  await expect(
    page.locator("#Cfg_Tipo_Slot_Modal_Titulo_Default")
  ).not.toBeDisabled();
  await page.uncheck(
    "#Cfg_Tipo_Slot_Modal_Titulo_Default"
  );
  await page.fill(
    "#Cfg_Tipo_Slot_Modal_Color",
    "#cfd8ff"
  );
  await page.click("#Cfg_Tipo_Slot_Guardar");

  const tipos = await page.evaluate(() => {
    return Tipos_Slot.map((tipo) => ({
      Id: tipo.Id,
      Nombre: tipo.Nombre,
      Color: tipo.Color,
      Titulo: tipo.Titulo || "",
      Titulo_Por_Defecto: Boolean(
        tipo.Titulo_Por_Defecto
      )
    }));
  });

  expect(tipos).toEqual(
    expect.arrayContaining([
      {
        Id: "Comida",
        Nombre: "Comida fuerte",
        Color: "#e0b070",
        Titulo: "🍝 Cena",
        Titulo_Por_Defecto: true
      },
      {
        Id: expect.stringMatching(/^Tipo_/),
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "😴 Siesta",
        Titulo_Por_Defecto: false
      }
    ])
  );
});
