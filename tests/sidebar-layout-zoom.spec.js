const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 1040, height: 900 }
});

async function Preparar(page, Estado_Inicial) {
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
  });
}

function Crear_Estado_Base() {
  return {
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
    Config_Extra: {
      Inicio_Hora: 8,
      Fin_Hora: 18,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 1, 2, 3, 4],
      Ocultar_Dias_Automatico: "Ninguno",
      Slots_Muertos_Default: {},
      Agrupar_Por_Categorias: true,
      Globito_Activo: true,
      Globito_Modo: "Horas",
      Globito_Posicion: "Arriba",
      Meta_Notificaciones_Activas: true,
      Meta_Notificaciones_Hitos: [25, 50, 75, 100],
      Color_Sueno: "#ddd4f4",
      Color_Descanso: "#d4e9f4",
      Color_Badge: "#9b2040",
      Color_Completa: "#1f6b4f",
      Color_Sin_Horas: "#c9a800",
      Color_Fracasada: "#8c2f2f",
      Resize_Personalizado: false,
      Notas_Hover: false,
      Mostrar_Archivadas: false,
      Focus_Auto: false,
      Menu_Estilo: "Iconos",
      Menu_Botones_Visibles: {
        Plan_Boton: true
      },
      Version_Programa: "Demo",
      Baul_Tareas_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Premium",
      Contador_Semanas_Activo: false,
      Contador_Semanas_Modo: "Ano",
      Contador_Semanas_Fecha_Ref: "",
      Contador_Semanas_Porcentaje: false,
      Contador_Semanas_Fecha_Final: "",
      Contador_Semanas_Vida_Anios: 80,
      Inicio_Semana_Dia: 0,
      Inicio_Semana_Hora: 8
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test(
  "reordena calendario y compacta sidebar al comprimirse",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    await page.evaluate(() => {
      Categorias = [
        {
          Id: "cat_1",
          Emoji: "💼",
          Nombre: "Proyectos",
          Color_Baul: "#4c7b70",
          Metadatos: []
        },
        {
          Id: "cat_2",
          Emoji: "🏋️",
          Nombre: "Fitness",
          Color_Baul: "#8c6a46",
          Metadatos: []
        }
      ];
      const Semana = Clave_Semana_Actual();
      [
        {
          Nombre: "A1",
          Emoji: "📌",
          Categoria_Id: "cat_1"
        },
        {
          Nombre: "A2",
          Emoji: "🧪",
          Categoria_Id: "cat_1"
        },
        {
          Nombre: "A3",
          Emoji: "🧭",
          Categoria_Id: "cat_1"
        },
        {
          Nombre: "B1",
          Emoji: "💪",
          Categoria_Id: "cat_2"
        },
        {
          Nombre: "B2",
          Emoji: "🥗",
          Categoria_Id: "cat_2"
        }
      ].forEach((Datos) => {
        Crear_Tarea_Semanal_Con_Datos(
          {
            ...Datos,
            Color: "#1f6b4f",
            Es_Bolsa: false
          },
          Semana
        );
      });
      Render_Emojis();
      Render_Calendario();
    });

    const Layout = await page.evaluate(() => {
      const App = document.querySelector(".App_Contenedor");
      const Calendario = document.querySelector(
        ".Calendario_Contenedor"
      );
      const Sidebar = document.querySelector(".Panel_Lateral");
      const Barra = document.getElementById("Barra_Emojis");
      const Emoji_Lefts = Array.from(
        document.querySelectorAll("#Barra_Emojis .Emoji_Item")
      ).map((Nodo) =>
        Math.round(Nodo.getBoundingClientRect().left)
      );
      const Columnas_Emojis = Array.from(
        new Set(Emoji_Lefts)
      ).length;
      const Header = document.querySelector(
        "#Barra_Emojis .Cat_Header"
      );
      const App_Estilos = getComputedStyle(App);
      const Barra_Estilos = getComputedStyle(Barra);
      const Calendario_Rect = Calendario.getBoundingClientRect();
      const Sidebar_Rect = Sidebar.getBoundingClientRect();
      const Header_Rect = Header.getBoundingClientRect();

      return {
        App_Columnas: App_Estilos.gridTemplateColumns,
        App_Columnas_Cantidad:
          App_Estilos.gridTemplateColumns
            .split(" ")
            .filter(Boolean).length,
        Barra_Display: Barra_Estilos.display,
        Calendario_Top: Math.round(Calendario_Rect.top),
        Calendario_Bottom: Math.round(Calendario_Rect.bottom),
        Sidebar_Top: Math.round(Sidebar_Rect.top),
        Sidebar_Bottom: Math.round(Sidebar_Rect.bottom),
        Columnas_Emojis,
        Header_Width: Math.round(Header_Rect.width),
        Barra_Width: Math.round(
          Barra.getBoundingClientRect().width
        )
      };
    });

    expect(Layout.App_Columnas_Cantidad).toBe(1);
    expect(Layout.Calendario_Top).toBeLessThan(
      Layout.Sidebar_Top
    );
    expect(Layout.Calendario_Bottom).toBeLessThanOrEqual(
      Layout.Sidebar_Top
    );
    expect(Layout.Barra_Display).toBe("grid");
    expect(Layout.Columnas_Emojis).toBeLessThanOrEqual(2);
    expect(Layout.Header_Width).toBeGreaterThanOrEqual(
      Layout.Barra_Width - 2
    );
  }
);
