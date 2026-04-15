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
    window.__ultimo_alert = "";
    window.alert = (mensaje) => {
      window.__ultimo_alert = mensaje;
    };
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
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|10"],
    Plantillas_Subtareas: [],
    Planes_Slot: {
      "2026-04-13|10": {
        Items: [
          {
            Id: "ps_1",
            Texto: "Idea central",
            Emoji: "*",
            Estado: "Planeado"
          }
        ]
      }
    },
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {
      "2026-04-13|10": "Comida"
    },
    Slots_Muertos_Nombres: {
      "2026-04-13|10": "Almuerzo largo"
    },
    Slots_Muertos_Titulos_Visibles: {
      "2026-04-13|10": true
    },
    Slots_Muertos_Nombres_Auto: {
      "2026-04-13|10": false
    },
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

async function arrastrarSlot(page, origenHora, destinoHora) {
  await page.evaluate(({ Origen_Hora, Destino_Hora }) => {
    const origen = document.querySelector(
      `.Slot[data-fecha="2026-04-13"][data-hora="${Origen_Hora}"]`
    );
    const destino = document.querySelector(
      `.Slot[data-fecha="2026-04-13"][data-hora="${Destino_Hora}"]`
    );
    if (!origen || !destino) {
      throw new Error("No se encontraron los slots");
    }
    const rect = destino.getBoundingClientRect();
    const data = new DataTransfer();

    origen.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data
      })
    );
    destino.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientY: rect.top + rect.height / 2
      })
    );
    destino.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientY: rect.top + rect.height / 2
      })
    );
    origen.dispatchEvent(
      new DragEvent("dragend", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data
      })
    );
  }, {
    Origen_Hora: origenHora,
    Destino_Hora: destinoHora
  });
}

test("arrastra slot muerto con plan, tipo y titulo", async ({
  page
}) => {
  await preparar(page, estadoBase());

  const slotOrigen = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await expect(slotOrigen).toHaveClass(/Slot_Muerto_Arrastrable/);
  expect(
    await slotOrigen.evaluate((nodo) => nodo.draggable)
  ).toBeTruthy();

  await arrastrarSlot(page, 10, 12);

  const data = await page.evaluate(() => ({
    origen_existe: Slots_Muertos.includes("2026-04-13|10"),
    origen_plan: Planes_Slot["2026-04-13|10"]?.Items?.length || 0,
    destino_existe: Slots_Muertos.includes("2026-04-13|12"),
    destino_tipo: Slots_Muertos_Tipos["2026-04-13|12"] || "",
    destino_titulo: Slots_Muertos_Nombres["2026-04-13|12"] || "",
    destino_visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|12"]
    ),
    destino_auto: Boolean(
      Slots_Muertos_Nombres_Auto["2026-04-13|12"]
    ),
    destino_plan:
      Planes_Slot["2026-04-13|12"]?.Items?.[0]?.Texto || "",
    ui_titulo:
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        '.Slot_Muerto_Nombre'
      )?.textContent || "",
    ui_marca:
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        '.Slot_Plan_Marca'
      )?.textContent || ""
  }));

  expect(data.origen_existe).toBeFalsy();
  expect(data.origen_plan).toBe(0);
  expect(data.destino_existe).toBeTruthy();
  expect(data.destino_tipo).toBe("Comida");
  expect(data.destino_titulo).toBe("Almuerzo largo");
  expect(data.destino_visible).toBeTruthy();
  expect(data.destino_auto).toBeFalsy();
  expect(data.destino_plan).toBe("Idea central");
  expect(data.ui_titulo).toBe("Almuerzo largo");
  expect(data.ui_marca).toBe("🗂️");
});

test("no pisa un horario ocupado al arrastrar slot muerto", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "e_1",
      Tarea_Id: null,
      Fecha: "2026-04-13",
      Inicio: 12,
      Duracion: 1,
      Hecho: false,
      Color: "#1f6b4f"
    }
  ];

  await preparar(page, estado);
  await arrastrarSlot(page, 10, 12);

  const data = await page.evaluate(() => ({
    origen_existe: Slots_Muertos.includes("2026-04-13|10"),
    destino_existe: Slots_Muertos.includes("2026-04-13|12"),
    destino_plan: Planes_Slot["2026-04-13|12"]?.Items?.length || 0,
    alerta: window.__ultimo_alert || ""
  }));

  expect(data.origen_existe).toBeTruthy();
  expect(data.destino_existe).toBeFalsy();
  expect(data.destino_plan).toBe(0);
  expect(data.alerta).toBe("Ese horario ya está ocupado.");
});

test("arrastra slot muerto sin plan conservando tipo y titulo", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Planes_Slot = {};

  await preparar(page, estado);

  const slotOrigen = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await expect(slotOrigen).toHaveClass(/Slot_Muerto_Arrastrable/);
  expect(
    await slotOrigen.evaluate((nodo) => nodo.draggable)
  ).toBeTruthy();

  await arrastrarSlot(page, 10, 12);

  const data = await page.evaluate(() => ({
    origen_existe: Slots_Muertos.includes("2026-04-13|10"),
    origen_plan: Planes_Slot["2026-04-13|10"]?.Items?.length || 0,
    destino_existe: Slots_Muertos.includes("2026-04-13|12"),
    destino_tipo: Slots_Muertos_Tipos["2026-04-13|12"] || "",
    destino_titulo: Slots_Muertos_Nombres["2026-04-13|12"] || "",
    destino_visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|12"]
    ),
    destino_auto: Boolean(
      Slots_Muertos_Nombres_Auto["2026-04-13|12"]
    ),
    destino_plan: Planes_Slot["2026-04-13|12"]?.Items?.length || 0,
    ui_titulo:
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        '.Slot_Muerto_Nombre'
      )?.textContent || "",
    ui_marca_plan: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        '.Slot_Plan_Marca'
      )
    )
  }));

  expect(data.origen_existe).toBeFalsy();
  expect(data.origen_plan).toBe(0);
  expect(data.destino_existe).toBeTruthy();
  expect(data.destino_tipo).toBe("Comida");
  expect(data.destino_titulo).toBe("Almuerzo largo");
  expect(data.destino_visible).toBeTruthy();
  expect(data.destino_auto).toBeFalsy();
  expect(data.destino_plan).toBe(0);
  expect(data.ui_titulo).toBe("Almuerzo largo");
  expect(data.ui_marca_plan).toBeFalsy();
});

test("el menu contextual puede eliminar un slot muerto y dejarlo blanco", async ({
  page
}) => {
  await preparar(page, estadoBase());

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await slot.click({ button: "right" });

  const botonEliminar = page.locator(
    '#Dia_Accion_Menu [data-acc="eliminar-slot-muerto"]'
  );
  await expect(botonEliminar).toBeVisible();
  await botonEliminar.click();
  await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

  const data = await page.evaluate(() => ({
    es_muerto: Slots_Muertos.includes("2026-04-13|10"),
    tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    titulo: Slots_Muertos_Nombres["2026-04-13|10"] || "",
    visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|10"]
    ),
    plan: Planes_Slot["2026-04-13|10"]?.Items?.length || 0,
    ui_muerto: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
    )?.classList.contains("Slot_Muerto") || false,
    ui_titulo:
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
        '.Slot_Muerto_Nombre'
      )?.textContent || "",
    ui_marca_plan: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
        '.Slot_Plan_Marca'
      )
    )
  }));

  expect(data.es_muerto).toBeFalsy();
  expect(data.tipo).toBe("");
  expect(data.titulo).toBe("");
  expect(data.visible).toBeFalsy();
  expect(data.plan).toBe(0);
  expect(data.ui_muerto).toBeFalsy();
  expect(data.ui_titulo).toBe("");
  expect(data.ui_marca_plan).toBeFalsy();
});
