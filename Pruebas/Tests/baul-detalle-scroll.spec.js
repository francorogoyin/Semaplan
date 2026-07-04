const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 1040, height: 700 }
});

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
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Render_Baul();
  });
}

function crearEstadoBase() {
  return {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Objetivos: [
      {
        Id: "b1",
        Nombre: "Detalle largo",
        Emoji: "",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "Linea 1\nLinea 2",
        Detalle:
          "Linea 1\nLinea 2\nLinea 3\nLinea 4\nLinea 5\nLinea 6\n" +
          "Linea 7\nLinea 8\nLinea 9\nLinea 10\nLinea 11\nLinea 12",
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
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Plan_Actual: "Premium",
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("el panel de detalle del baul scrollea en modo edicion", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  await page.evaluate(() => {
    Abrir_Editor_Baul("b1");
  });

  await expect(page.locator("#Baul_Nuevo_Overlay"))
    .toHaveClass(/Activo/);

  const scroll = await page.evaluate(() => {
    const Nodo = document.getElementById("Baul_Detalle_Scroll");
    if (!Nodo) return null;
    const Antes = Nodo.scrollTop;
    Nodo.scrollTop = Nodo.scrollHeight;
    return {
      clientHeight: Nodo.clientHeight,
      scrollHeight: Nodo.scrollHeight,
      before: Antes,
      after: Nodo.scrollTop
    };
  });

  expect(scroll).not.toBeNull();
  expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
  expect(scroll.after).toBeGreaterThan(0);
});
