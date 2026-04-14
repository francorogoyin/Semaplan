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

test("hereda color del cajon y permite override por nota", async ({
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
    Archiveros: [
      {
        Id: "c1",
        Nombre: "Semaplan",
        Emoji: "🗃️",
        Color_Fondo: "#ffaaaa"
      },
      {
        Id: "c2",
        Nombre: "Ideas",
        Emoji: "💡",
        Color_Fondo: "#aaffaa"
      }
    ],
    Notas_Archivero: [
      {
        Id: "n1",
        Archivero_Id: "c1",
        Texto: "Hereda",
        Origen: "",
        Etiquetas: [],
        Color_Fondo: "",
        Tipo: "Texto",
        Fecha_Creacion: 1
      },
      {
        Id: "n2",
        Archivero_Id: "c1",
        Texto: "Personalizada",
        Origen: "",
        Etiquetas: [],
        Color_Fondo: "#aaccff",
        Tipo: "Texto",
        Fecha_Creacion: 2
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

  await preparar(page, estadoInicial);

  const colores = await page.evaluate(() => {
    const Nota_1 = document.querySelector("[data-nota-id='n1']");
    const Nota_2 = document.querySelector("[data-nota-id='n2']");
    return {
      nota_1: Nota_1?.style
        .getPropertyValue("--Archivero_Nota_Fondo")
        .trim(),
      nota_2: Nota_2?.style
        .getPropertyValue("--Archivero_Nota_Fondo")
        .trim(),
      con_color: Nota_1?.classList.contains("Con_Color_Fondo")
    };
  });

  expect(colores.nota_1).toBe("#ffaaaa");
  expect(colores.nota_2).toBe("#aaccff");
  expect(colores.con_color).toBe(true);

  await page.click("#Archivero_Btn_Nueva_Nota");
  await expect(
    page.locator("#Archivero_Nota_Color_Cajon_Btn")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator("#Archivero_Nota_Color_Input")
  ).toHaveValue("#ffaaaa");
  await expect(
    page.locator("#Archivero_Nota_Color_Input")
  ).toBeEnabled();

  await page.selectOption("#Archivero_Nota_Cajon_Select", "c2");
  await expect(
    page.locator("#Archivero_Nota_Color_Input")
  ).toHaveValue("#aaffaa");

  await page.evaluate(() => {
    const Input = document.getElementById(
      "Archivero_Nota_Color_Input"
    );
    Input.value = "#123456";
    Input.dispatchEvent(new Event("input", {
      bubbles: true
    }));
  });
  await expect(
    page.locator("#Archivero_Nota_Color_Cajon_Btn")
  ).not.toHaveClass(/Activo/);
  await page.click("#Archivero_Nota_Color_Cajon_Btn");
  await expect(
    page.locator("#Archivero_Nota_Color_Cajon_Btn")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator("#Archivero_Nota_Color_Input")
  ).toHaveValue("#aaffaa");
  await page.evaluate(() => {
    const Input = document.getElementById(
      "Archivero_Nota_Color_Input"
    );
    Input.value = "#123456";
    Input.dispatchEvent(new Event("input", {
      bubbles: true
    }));
  });
  await page.fill("#Archivero_Nota_Texto_Input", "Nueva");
  await page.click("#Archivero_Nota_Guardar");

  const nueva = await page.evaluate(() => {
    return Notas_Archivero.find((Nota) => Nota.Texto === "Nueva");
  });

  expect(nueva.Archivero_Id).toBe("c2");
  expect(nueva.Color_Fondo).toBe("#123456");
});
