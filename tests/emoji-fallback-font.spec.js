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
  await page.route(
    "https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/*",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body:
          "<svg xmlns='http://www.w3.org/2000/svg' " +
          "viewBox='0 0 72 72'></svg>"
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

test("renderiza emojis visibles como imagenes", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [
      {
        Id: "t1",
        Nombre: "Tarea emoji",
        Emoji: "🧪",
        Horas_Semanales: 3,
        Restante: 3,
        Es_Bolsa: true,
        Color: "#4f8fba",
        Orden: 0,
        Subtareas: [],
        Subtareas_Semanales: {
          "2026-04-13": [
            {
              Id: "s1",
              Emoji: "✨",
              Texto: "Subtarea",
              Hecha: false
            }
          ]
        },
        Subtareas_Contraidas_Semanales: {},
        Subtareas_Excluidas_Semanales: {},
        Etiquetas_Ids: [],
        Familia_Id: "t1",
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null
      }
    ],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [
      {
        Id: "b1",
        Nombre: "Tarea del baúl",
        Emoji: "📦",
        Es_Bolsa: false,
        Categoria_Id: null,
        Color_Baul: "",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 0
      }
    ],
    Baul_Grupos_Colapsados: {},
    Archiveros: [
      {
        Id: "a1",
        Nombre: "Semaplan",
        Emoji: "🗃️",
        Fecha_Creacion: 1
      }
    ],
    Notas_Archivero: [
      {
        Id: "n1",
        Archivero_Id: "a1",
        Texto: "Nota",
        Origen: "",
        Etiquetas: ["Inmediata"],
        Tipo: "Texto",
        Fecha_Creacion: 1
      }
    ],
    Patrones: [
      {
        Id: "p1",
        Nombre: "Patrón emoji",
        Emoji: "📅",
        Tipo: "Diario"
      }
    ],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: "t1",
    Modo_Editor_Abierto: true,
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

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    await window.Inicializar();
    window.Tarea_Seleccionada_Id = "t1";
    window.Render_Emojis();
    window.Modo_Editor_Abierto = false;
    window.Render_Resumen_Tarea();
    window.Aplicar_Emoji_En_Elemento(
      document.getElementById("Resumen_Emoji"),
      "🧪"
    );
    const Resumen_OK = !!document.querySelector(
      "#Resumen_Emoji img.Emoji_Img"
    );
    window.Modo_Editor_Abierto = true;
    window.Render_Editor();
    window.Aplicar_Emoji_En_Elemento(
      document.getElementById("Editor_Emoji"),
      "🧪"
    );
    window.Baul_Editor_Abierto = true;
    window.Baul_Editor_Modo = "ModalNuevo";
    window.Render_Detalle_Baul();
    window.Aplicar_Emoji_En_Elemento(
      document.getElementById("Baul_Nuevo_Emoji"),
      "🧰"
    );
    const Card_Baul = window.Crear_Card_Baul({
      Id: "b1",
      Nombre: "Tarea del baúl",
      Emoji: "📦",
      Estado: "Activa",
      Archivada: false,
      Horas_Aprox: 0,
      Timeline: null,
      Categoria_Id: null,
      Etiquetas_Ids: [],
      Metadatos: {},
      Color_Baul: ""
    });
    document.body.appendChild(Card_Baul);
    window.Archivero_Seleccion_Id = "a1";
    window.Render_Archivero();
    window.Render_Config_Patrones();
    window.Construir_Selector_Emojis();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      sidebar:
        !!document.querySelector(".Emoji_Item img.Emoji_Img"),
      resumen: Resumen_OK,
      editor:
        !!document.querySelector("#Editor_Emoji img.Emoji_Img"),
      baul:
        !!Card_Baul.querySelector(".Baul_Card_Emoji img.Emoji_Img"),
      baulNuevo:
        !!document.querySelector("#Baul_Nuevo_Emoji img.Emoji_Img"),
      archivero:
        !!document.querySelector(
          ".Archivero_Cajon_Emoji img.Emoji_Img"
        ),
      patron:
        !!document.querySelector(
          ".Config_Patron_Emoji img.Emoji_Img"
        ),
      selectorTab:
        !!document.querySelector(
          ".Selector_Emojis_Tab img.Emoji_Img"
        ),
      selectorBtn:
        !!document.querySelector(
          ".Selector_Emojis_Btn img.Emoji_Img"
        )
    };
  });

  expect(resultado.sidebar).toBeTruthy();
  expect(resultado.resumen).toBeTruthy();
  expect(resultado.editor).toBeTruthy();
  expect(resultado.baul).toBeTruthy();
  expect(resultado.baulNuevo).toBeTruthy();
  expect(resultado.archivero).toBeTruthy();
  expect(resultado.patron).toBeTruthy();
  expect(resultado.selectorTab).toBeTruthy();
  expect(resultado.selectorBtn).toBeTruthy();
});

test("renderiza emoji como imagen en bloques del calendario", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [
      {
        Id: "t1",
        Nombre: "Bloque con emoji",
        Emoji: "🧪",
        Horas_Semanales: 2,
        Restante: 2,
        Es_Bolsa: true,
        Color: "#4f8fba",
        Orden: 0,
        Subtareas: [],
        Subtareas_Semanales: {},
        Subtareas_Contraidas_Semanales: {},
        Subtareas_Excluidas_Semanales: {},
        Etiquetas_Ids: [],
        Familia_Id: "t1",
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null
      }
    ],
    Eventos: [
      {
        Id: 1,
        Tarea_Id: "t1",
        Fecha: "2026-04-14",
        Inicio: 9,
        Duracion: 1,
        Hecho: false,
        Anulada: false
      }
    ],
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
    Contador_Eventos: 2,
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
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    await window.Inicializar();
    window.Render_Calendario();
    window.Render_Eventos();
    await new Promise((resolve) => setTimeout(resolve, 50));
    const Nombre = document.querySelector(".Evento_Nombre");
    return {
      tieneImagen: !!document.querySelector(
        ".Evento_Emoji img.Emoji_Img"
      ),
      texto: Nombre?.textContent || ""
    };
  });

  expect(resultado.tieneImagen).toBeTruthy();
  expect(resultado.texto).toContain("Bloque con emoji");
});
