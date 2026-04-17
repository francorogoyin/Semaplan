const { test, expect } = require("@playwright/test");

function Crear_Estado_Base() {
  return {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [
      { Id: "tag_1", Nombre: "Trabajo" },
      { Id: "tag_2", Nombre: "Personal" }
    ],
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
  };
}

test("config usa sistema de etiquetas del archivero", async ({
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
  }, Crear_Estado_Base());

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

  const Vista_Inicial = await page.evaluate(() => {
    const Filas = Array.from(
      document.querySelectorAll(
        "#Cfg_Etiquetas_Lista .Archivero_Etiquetas_Gestion_Fila"
      )
    );
    return {
      total_filas: Filas.length,
      todo_tiene_prefijo: Filas.every((Fila) => {
        const Prefijo = Fila.querySelector(
          ".Archivero_Etiquetas_Gestion_Prefijo"
        );
        return Prefijo?.textContent?.trim() === "#";
      }),
      todo_tiene_input_archivero: Filas.every((Fila) => {
        return !!Fila.querySelector(
          ".Archivero_Etiquetas_Gestion_Input"
        );
      }),
      todo_tiene_borrado_archivero: Filas.every((Fila) => {
        return !!Fila.querySelector(".Archivero_Nota_Mini_Btn");
      }),
      sin_botones_reorden: Filas.every((Fila) => {
        return Fila.querySelectorAll("button").length === 1;
      })
    };
  });

  expect(Vista_Inicial.total_filas).toBe(2);
  expect(Vista_Inicial.todo_tiene_prefijo).toBe(true);
  expect(Vista_Inicial.todo_tiene_input_archivero).toBe(true);
  expect(Vista_Inicial.todo_tiene_borrado_archivero).toBe(true);
  expect(Vista_Inicial.sin_botones_reorden).toBe(true);

  const Input_Nueva = page.locator("#Cfg_Etiqueta_Nombre");
  const Btn_Agregar = page.locator("#Cfg_Etiqueta_Agregar");
  await Input_Nueva.fill("Urgente");
  await Btn_Agregar.click();
  await Input_Nueva.fill("  urgente  ");
  await Btn_Agregar.click();

  const Conteo_Urgente = await page.evaluate(() => {
    const Nombres = Array.from(
      document.querySelectorAll(
        "#Cfg_Etiquetas_Lista .Archivero_Etiquetas_Gestion_Input"
      )
    ).map((Input) => {
      return String(Input.value || "").trim().toLowerCase();
    });
    return Nombres.filter((Nombre) => Nombre === "urgente")
      .length;
  });
  expect(Conteo_Urgente).toBe(1);

  await page
    .locator("#Cfg_Etiquetas_Lista .Archivero_Nota_Mini_Btn")
    .first()
    .click();
  await expect(
    page.locator(
      "#Cfg_Etiquetas_Lista .Archivero_Etiquetas_Gestion_Fila"
    )
  ).toHaveCount(2);
});
