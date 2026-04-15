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
      Baul_Objetivos_Por_Fila: 5,
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
  "reemplaza el sidebar comprimido por un modal de objetivos",
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
        Crear_Objetivo_Semanal_Con_Datos(
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
      const Boton = document.getElementById(
        "Sidebar_Compacta_Boton"
      );
      const Overlay = document.getElementById(
        "Sidebar_Compacta_Overlay"
      );
      const Top = document.querySelector(".Calendario_Top");
      const Top_Acciones = document.getElementById(
        "Calendario_Top_Acciones"
      );
      const App_Estilos = getComputedStyle(App);
      const Sidebar_Estilos = getComputedStyle(Sidebar);
      const Boton_Estilos = getComputedStyle(Boton);
      const Top_Acciones_Estilos =
        getComputedStyle(Top_Acciones);
      const Calendario_Rect = Calendario.getBoundingClientRect();
      const Top_Rect = Top.getBoundingClientRect();
      const Top_Acciones_Rect =
        Top_Acciones.getBoundingClientRect();

      return {
        App_Columnas: App_Estilos.gridTemplateColumns,
        App_Columnas_Cantidad:
          App_Estilos.gridTemplateColumns
            .split(" ")
            .filter(Boolean).length,
        Sidebar_Display: Sidebar_Estilos.display,
        Boton_Display: Boton_Estilos.display,
        Boton_Fondo: Boton_Estilos.backgroundColor,
        Top_Acciones_Justify:
          Top_Acciones_Estilos.justifyContent,
        Calendario_Top: Math.round(Calendario_Rect.top),
        Overlay_Activa: Overlay.classList.contains("Activo"),
        Top_Derecha: Math.round(Top_Rect.right),
        Top_Acciones_Derecha: Math.round(
          Top_Acciones_Rect.right
        )
      };
    });

    expect(Layout.App_Columnas_Cantidad).toBe(1);
    expect(Layout.Sidebar_Display).toBe("none");
    expect(Layout.Boton_Display).toBe("grid");
    expect(Layout.Boton_Fondo).toBe("rgb(47, 120, 255)");
    expect(Layout.Overlay_Activa).toBeFalsy();
    expect(Layout.Top_Acciones_Justify).toBe("flex-end");
    expect(
      Layout.Top_Derecha - Layout.Top_Acciones_Derecha
    ).toBeLessThanOrEqual(24);

    await page.click("#Sidebar_Compacta_Boton");

    const Modal = await page.evaluate(() => {
      const Sidebar = document.querySelector(".Panel_Lateral");
      const Overlay = document.getElementById(
        "Sidebar_Compacta_Overlay"
      );
      const Barra = document.getElementById("Barra_Emojis");
      const Header = document.querySelector(
        "#Barra_Emojis .Cat_Header"
      );
      const Sidebar_Rect = Sidebar.getBoundingClientRect();
      return {
        Body_Activa: document.body.classList.contains(
          "Sidebar_Compacta_Activa"
        ),
        Overlay_Activa: Overlay.classList.contains("Activo"),
        Sidebar_Display: getComputedStyle(Sidebar).display,
        Sidebar_Position: getComputedStyle(Sidebar).position,
        Sidebar_Ancho: Math.round(Sidebar_Rect.width),
        Sidebar_Alto: Math.round(Sidebar_Rect.height),
        Centro_X: Math.round(
          Sidebar_Rect.left + Sidebar_Rect.width / 2
        ),
        Centro_Y: Math.round(
          Sidebar_Rect.top + Sidebar_Rect.height / 2
        ),
        Viewport_X: Math.round(window.innerWidth / 2),
        Viewport_Y: Math.round(window.innerHeight / 2),
        Barra_Display: getComputedStyle(Barra).display,
        Emoji_Cantidad: document.querySelectorAll(
          "#Barra_Emojis .Emoji_Item"
        ).length,
        Header_Texto: Header?.textContent?.trim() || "",
        Crear_Display: getComputedStyle(
          document.getElementById("Mostrar_Creador")
        ).display
      };
    });

    expect(Modal.Body_Activa).toBeTruthy();
    expect(Modal.Overlay_Activa).toBeTruthy();
    expect(Modal.Sidebar_Display).toBe("block");
    expect(Modal.Sidebar_Position).toBe("fixed");
    expect(Math.abs(Modal.Centro_X - Modal.Viewport_X))
      .toBeLessThanOrEqual(24);
    expect(Math.abs(Modal.Centro_Y - Modal.Viewport_Y))
      .toBeLessThanOrEqual(24);
    expect(Modal.Sidebar_Ancho).toBeGreaterThanOrEqual(300);
    expect(Modal.Sidebar_Alto).toBeGreaterThanOrEqual(300);
    expect(Modal.Barra_Display).toBe("flex");
    expect(Modal.Emoji_Cantidad).toBeGreaterThanOrEqual(5);
    expect(Modal.Header_Texto).toContain("Proyectos");
    expect(Modal.Crear_Display).not.toBe("none");

    await page.mouse.click(8, 8);

    await expect(
      page.locator("#Sidebar_Compacta_Overlay")
    ).not.toHaveClass(/Activo/);
  }
);
