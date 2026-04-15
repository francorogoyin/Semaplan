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
  });
}

function estadoBase() {
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
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
      Ocultar_Dias_Automatico: "Ninguno",
      Slots_Muertos_Default: {},
      Agrupar_Por_Categorias: false,
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "Siesta",
        Titulo_Por_Defecto: false
      },
      {
        Id: "Deep_Work",
        Nombre: "Deep work",
        Color: "#b7d7c9",
        Titulo: "Deep work",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("el doble click rota tipos y slot vacio", async ({
  page
}) => {
  await preparar(page, estadoBase());

  const Selector =
    '[data-fecha="2026-04-13"][data-hora="10"]';

  await page.dblclick(Selector);
  await page.waitForTimeout(450);
  let paso = await page.evaluate(() => ({
    Tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    Nombre: Obtener_Nombre_Slot("2026-04-13", 10),
    Visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|10"]
    ),
    Nombre_En_UI:
      document.querySelector(
        '[data-fecha="2026-04-13"]' +
        '[data-hora="10"] .Slot_Muerto_Nombre'
      )?.textContent || ""
  }));
  let seleccion = await page.evaluate(() => ({
    slots: Array.from(Slots_Multi_Seleccion).sort(),
    eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(paso.Tipo).toBe("Comida");
  expect(paso.Nombre).toBe("Almuerzo");
  expect(paso.Visible).toBeTruthy();
  expect(paso.Nombre_En_UI).toBe("Almuerzo");
  expect(seleccion.slots).toEqual([]);
  expect(seleccion.eventos).toEqual([]);
  expect(seleccion.barra_activa).toBeFalsy();

  await page.evaluate(() => {
    Quitar_Titulo_Slot_Muerto("2026-04-13", 10);
    Render_Calendario();
  });

  await page.dblclick(Selector);
  await page.waitForTimeout(450);
  paso = await page.evaluate(() => ({
    Tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    Nombre: Obtener_Nombre_Slot("2026-04-13", 10),
    Visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|10"]
    ),
    Nombre_En_UI:
      document.querySelector(
        '[data-fecha="2026-04-13"]' +
        '[data-hora="10"] .Slot_Muerto_Nombre'
      )?.textContent || ""
  }));
  seleccion = await page.evaluate(() => ({
    slots: Array.from(Slots_Multi_Seleccion).sort(),
    eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(paso.Tipo).toBe("Siesta");
  expect(paso.Nombre).toBe("Siesta");
  expect(paso.Visible).toBeFalsy();
  expect(paso.Nombre_En_UI).toBe("");
  expect(seleccion.slots).toEqual([]);
  expect(seleccion.eventos).toEqual([]);
  expect(seleccion.barra_activa).toBeFalsy();

  await page.dblclick(Selector);
  paso = await page.evaluate(() => ({
    Tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    Nombre: Obtener_Nombre_Slot("2026-04-13", 10),
    Visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|10"]
    ),
    Nombre_En_UI:
      document.querySelector(
        '[data-fecha="2026-04-13"]' +
        '[data-hora="10"] .Slot_Muerto_Nombre'
      )?.textContent || ""
  }));

  expect(paso.Tipo).toBe("Deep_Work");
  expect(paso.Nombre).toBe("Deep work");
  expect(paso.Visible).toBeTruthy();
  expect(paso.Nombre_En_UI).toBe("Deep work");

  await page.dblclick(Selector);
  paso = await page.evaluate(() => ({
    Es_Muerto: Slot_Es_Muerto("2026-04-13", 10),
    Tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    Nombre: Obtener_Nombre_Slot("2026-04-13", 10),
    Visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|10"]
    )
  }));

  expect(paso.Es_Muerto).toBeFalsy();
  expect(paso.Tipo).toBe("");
  expect(paso.Nombre).toBe("");
  expect(paso.Visible).toBeFalsy();
});
