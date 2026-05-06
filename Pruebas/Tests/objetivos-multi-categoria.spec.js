const { test, expect } = require("@playwright/test");

function Estado_Base() {
  return {
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
    Inicio_Semana: "2026-05-04",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
      Plan_Actual: "Premium",
      Menu_Botones_Visibles: {
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true,
        Patron_Boton: true,
        Limpiar_Semana_Boton: true,
        Ayuda_Boton: true,
        Logout_Boton: true
      }
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {},
    Planes_Periodo: {}
  };
}

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
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify(Estado)
    );
  }, Estado_Base());

  await page.goto("/login.html");
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

test("cambio de categoria en lote conserva seleccion al usar dialogo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));
  await Preparar(page);

  await page.evaluate(() => {
    Semana_Actual = Parsear_Fecha_ISO("2026-05-04");
    Categorias = [
      {
        Id: "cat_admin",
        Emoji: "A",
        Nombre: "Admin",
        Color_Baul: "#a6c8e5",
        Metadatos: []
      }
    ];
    Objetivos = ["uno", "dos"].map((Id, Indice) => ({
      Id: `obj_${Id}`,
      Nombre: `Objetivo ${Indice + 1}`,
      Emoji: String(Indice + 1),
      Color: "#f1b77e",
      Horas_Semanales: 1,
      Semana_Base: "2026-05-04",
      Categoria_Id: null,
      Subobjetivos_Semanales: { "2026-05-04": [] },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }));
    Objetivos_Multi_Seleccion = new Set(["obj_uno", "obj_dos"]);
    Render_Emojis();
    Render_Barra_Multi_Seleccion();
  });

  await page.getByRole("button", {
    name: /Cambiar categor/i
  }).click();
  await page.selectOption("#Dialogo_Select_Campo", "cat_admin");
  await page.getByRole("button", { name: "Guardar" }).click();

  const Resultado = await page.evaluate(() => ({
    categorias: Objetivos.map((Objetivo) => Objetivo.Categoria_Id),
    seleccion: Objetivos_Multi_Seleccion.size
  }));
  expect(errores).toEqual([]);
  expect(Resultado).toEqual({
    categorias: ["cat_admin", "cat_admin"],
    seleccion: 0
  });
});
