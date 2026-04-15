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
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|10"],
    Plantillas_Subobjetivos: [],
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
    Slots_Muertos_Grupo_Ids: {
      "2026-04-13|10": "grupo_10"
    },
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

async function arrastrarSlot(page, origenHora, destinoHora) {
  return await page.evaluate(({ Origen_Hora, Destino_Hora }) => {
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
    window.__slot_drag_preview = null;
    data.setDragImage = (elemento, x, y) => {
      window.__slot_drag_preview = {
        clase: elemento?.className || "",
        texto: elemento?.textContent?.trim() || "",
        x,
        y,
        ancho:
          elemento?.firstElementChild
            ?.getBoundingClientRect?.().width || 0,
        alto:
          elemento?.firstElementChild
            ?.getBoundingClientRect?.().height || 0
      };
    };

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
    return window.__slot_drag_preview;
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

  const dragPreview = await arrastrarSlot(page, 10, 12);

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
      )?.textContent || "",
    alerta: window.__ultimo_alert || ""
  }));

  expect(dragPreview?.clase || "").toContain(
    "Slot_Muerto_Drag_Preview"
  );
  expect(dragPreview?.texto || "").toContain(
    "Almuerzo largo"
  );
  expect(dragPreview?.ancho || 0).toBeGreaterThan(0);
  expect(dragPreview?.alto || 0).toBeGreaterThan(0);
  expect(data.origen_existe).toBeFalsy();
  expect(data.origen_plan).toBe(0);
  expect(data.destino_existe).toBeTruthy();
  expect(data.destino_tipo).toBe("Comida");
  expect(data.destino_titulo).toBe("Almuerzo largo");
  expect(data.destino_visible).toBeTruthy();
  expect(data.destino_auto).toBeFalsy();
  expect(data.destino_plan).toBe("Idea central");
  expect(data.ui_titulo).toBe("Almuerzo largo");
  expect(data.ui_marca).not.toBe("");
  expect(data.alerta).toBe("");
});

test("arrastra una franja contigua de slots muertos", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos.push("2026-04-13|11");
  estado.Planes_Slot["2026-04-13|11"] = {
    Items: [
      {
        Id: "ps_2",
        Texto: "Idea central",
        Emoji: "*",
        Estado: "Planeado"
      }
    ]
  };
  estado.Slots_Muertos_Tipos["2026-04-13|11"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|11"] =
    "Almuerzo largo";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|11"] =
    true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|11"] =
    false;
  estado.Slots_Muertos_Grupo_Ids["2026-04-13|11"] =
    "grupo_10";

  await preparar(page, estado);
  await arrastrarSlot(page, 10, 12);

  const data = await page.evaluate(() => ({
    origen_10: Slots_Muertos.includes("2026-04-13|10"),
    origen_11: Slots_Muertos.includes("2026-04-13|11"),
    destino_12: Slots_Muertos.includes("2026-04-13|12"),
    destino_13: Slots_Muertos.includes("2026-04-13|13"),
    plan_12:
      Planes_Slot["2026-04-13|12"]?.Items?.[0]?.Texto || "",
    plan_13:
      Planes_Slot["2026-04-13|13"]?.Items?.[0]?.Texto || "",
    titulo_12: Slots_Muertos_Nombres["2026-04-13|12"] || "",
    titulo_13: Slots_Muertos_Nombres["2026-04-13|13"] || ""
  }));

  expect(data.origen_10).toBeFalsy();
  expect(data.origen_11).toBeFalsy();
  expect(data.destino_12).toBeTruthy();
  expect(data.destino_13).toBeTruthy();
  expect(data.plan_12).toBe("Idea central");
  expect(data.plan_13).toBe("Idea central");
  expect(data.titulo_12).toBe("Almuerzo largo");
  expect(data.titulo_13).toBe("Almuerzo largo");
});

test("slots contiguos sin grupo explicito no se arrastran juntos", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos = [
    "2026-04-13|9",
    "2026-04-13|10",
    "2026-04-13|11"
  ];
  estado.Planes_Slot = {
    "2026-04-13|9": {
      Items: [
        {
          Id: "ps_9",
          Texto: "Idea central",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    },
    "2026-04-13|10": {
      Items: [
        {
          Id: "ps_10",
          Texto: "Idea central",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    },
    "2026-04-13|11": {
      Items: [
        {
          Id: "ps_11",
          Texto: "Idea central",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };
  estado.Slots_Muertos_Tipos = {
    "2026-04-13|9": "Comida",
    "2026-04-13|10": "Comida",
    "2026-04-13|11": "Comida"
  };
  estado.Slots_Muertos_Nombres = {
    "2026-04-13|9": "Almuerzo largo",
    "2026-04-13|10": "Almuerzo largo",
    "2026-04-13|11": "Almuerzo largo"
  };
  estado.Slots_Muertos_Titulos_Visibles = {
    "2026-04-13|9": true,
    "2026-04-13|10": true,
    "2026-04-13|11": true
  };
  estado.Slots_Muertos_Nombres_Auto = {
    "2026-04-13|9": false,
    "2026-04-13|10": false,
    "2026-04-13|11": false
  };
  estado.Slots_Muertos_Grupo_Ids = {};

  await preparar(page, estado);
  await arrastrarSlot(page, 10, 13);

  const data = await page.evaluate(() => ({
    nueve_sigue: Slots_Muertos.includes("2026-04-13|9"),
    diez_sigue: Slots_Muertos.includes("2026-04-13|10"),
    once_sigue: Slots_Muertos.includes("2026-04-13|11"),
    trece_existe: Slots_Muertos.includes("2026-04-13|13"),
    catorce_existe: Slots_Muertos.includes("2026-04-13|14")
  }));

  expect(data.nueve_sigue).toBeTruthy();
  expect(data.diez_sigue).toBeFalsy();
  expect(data.once_sigue).toBeTruthy();
  expect(data.trece_existe).toBeTruthy();
  expect(data.catorce_existe).toBeFalsy();
});

test("slots iguales de grupos distintos no quedan fusionados tras recargar", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos.push("2026-04-13|11");
  estado.Planes_Slot["2026-04-13|11"] = {
    Items: [
      {
        Id: "ps_2",
        Texto: "Idea central",
        Emoji: "*",
        Estado: "Planeado"
      }
    ]
  };
  estado.Slots_Muertos_Tipos["2026-04-13|11"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|11"] =
    "Almuerzo largo";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|11"] =
    true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|11"] =
    false;
  estado.Slots_Muertos_Grupo_Ids["2026-04-13|11"] =
    "grupo_11";

  await preparar(page, estado);
  await arrastrarSlot(page, 10, 12);

  let data = await page.evaluate(() => ({
    slot_11: Slots_Muertos.includes("2026-04-13|11"),
    slot_12: Slots_Muertos.includes("2026-04-13|12"),
    slot_13: Slots_Muertos.includes("2026-04-13|13"),
    grupo_11:
      Slots_Muertos_Grupo_Ids["2026-04-13|11"] || "",
    grupo_12:
      Slots_Muertos_Grupo_Ids["2026-04-13|12"] || ""
  }));

  expect(data.slot_11).toBeTruthy();
  expect(data.slot_12).toBeTruthy();
  expect(data.slot_13).toBeFalsy();
  expect(data.grupo_11).toBe("grupo_11");
  expect(data.grupo_12).toBe("grupo_10");

  const estadoRecargado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
  );
  const pageRecargada = await page.context().newPage();
  await preparar(pageRecargada, estadoRecargado);

  await arrastrarSlot(pageRecargada, 11, 13);

  data = await pageRecargada.evaluate(() => ({
    slot_11: Slots_Muertos.includes("2026-04-13|11"),
    slot_12: Slots_Muertos.includes("2026-04-13|12"),
    slot_13: Slots_Muertos.includes("2026-04-13|13"),
    slot_14: Slots_Muertos.includes("2026-04-13|14"),
    grupo_12:
      Slots_Muertos_Grupo_Ids["2026-04-13|12"] || "",
    grupo_13:
      Slots_Muertos_Grupo_Ids["2026-04-13|13"] || ""
  }));

  await pageRecargada.close();

  expect(data.slot_11).toBeFalsy();
  expect(data.slot_12).toBeTruthy();
  expect(data.slot_13).toBeTruthy();
  expect(data.slot_14).toBeFalsy();
  expect(data.grupo_12).toBe("grupo_10");
  expect(data.grupo_13).toBe("grupo_11");
});

test("no pisa un horario ocupado al arrastrar slot muerto", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "e_1",
      Objetivo_Id: null,
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
  expect(data.alerta).toContain("ocup");
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

test("copia y pega plan entre slots muertos", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos.push("2026-04-13|12");
  estado.Slots_Muertos_Tipos["2026-04-13|12"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|12"] = "Cena";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|12"] =
    true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|12"] =
    false;

  await preparar(page, estado);

  const slotOrigen = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await slotOrigen.click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="copiar-plan-slot"]'
    )
  ).toBeVisible();
  await page.click(
    '#Dia_Accion_Menu [data-acc="copiar-plan-slot"]'
  );

  const slotDestino = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  await slotDestino.click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="pegar-plan-slot"]'
    )
  ).toBeVisible();
  await page.click(
    '#Dia_Accion_Menu [data-acc="pegar-plan-slot"]'
  );

  const data = await page.evaluate(() => ({
    origen_texto:
      Planes_Slot["2026-04-13|10"]?.Items?.[0]?.Texto || "",
    origen_id:
      Planes_Slot["2026-04-13|10"]?.Items?.[0]?.Id || "",
    destino_texto:
      Planes_Slot["2026-04-13|12"]?.Items?.[0]?.Texto || "",
    destino_id:
      Planes_Slot["2026-04-13|12"]?.Items?.[0]?.Id || "",
    destino_total:
      Planes_Slot["2026-04-13|12"]?.Items?.length || 0,
    destino_marca: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        '.Slot_Plan_Marca'
      )
    )
  }));

  expect(data.origen_texto).toBe("Idea central");
  expect(data.destino_texto).toBe("Idea central");
  expect(data.destino_total).toBe(1);
  expect(data.destino_id).not.toBe("");
  expect(data.destino_id).not.toBe(data.origen_id);
  expect(data.destino_marca).toBeTruthy();
});

test("el menu de slot muerto agrupa identidad, plan y patron", async ({
  page
}) => {
  await preparar(page, estadoBase());
  await page.evaluate(() => {
    Portapapeles_Plan_Slot = {
      Items: [
        {
          Id: "ps_clip",
          Texto: "Plan copiado",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    };
  });

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await slot.click({ button: "right" });

  const acciones = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-acc"))
  );
  const seleccion = await page.evaluate(() => ({
    slots: Array.from(Slots_Multi_Seleccion).sort(),
    eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(acciones).toEqual([
    "editar-nombre-slot",
    "toggle-titulo-slot",
    "plan-slot",
    "copiar-plan-slot",
    "pegar-plan-slot",
    "borrar-plan-slot",
    "insertar-patron-slot",
    "guardar-patron-slot",
    "repetir-slot",
    "limpiar-celda"
  ]);
  expect(seleccion.slots).toEqual([]);
  expect(seleccion.eventos).toEqual([]);
  expect(seleccion.barra_activa).toBeFalsy();
  await expect(
    page.locator("#Dia_Accion_Menu .Dia_Accion_Separador")
  ).toHaveCount(4);
});

test("el menu de slot vacio agrupa plan, patron y pegar bloques", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos = [];
  estado.Planes_Slot = {
    "2026-04-13|12": {
      Items: [
        {
          Id: "ps_residual",
          Texto: "Residual",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };
  delete estado.Slots_Muertos_Tipos["2026-04-13|12"];
  delete estado.Slots_Muertos_Nombres["2026-04-13|12"];
  delete estado.Slots_Muertos_Titulos_Visibles["2026-04-13|12"];
  delete estado.Slots_Muertos_Nombres_Auto["2026-04-13|12"];

  await preparar(page, estado);
  await page.evaluate(() => {
    Portapapeles_Eventos_Multi = {
      Items: [{ Objetivo_Id: "OBJ", Delta_Dias: 0, Delta_Horas: 0 }]
    };
  });

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  await slot.click({ button: "right" });

  const acciones = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-acc"))
  );

  expect(acciones).toEqual([
    "plan-slot",
    "insertar-patron-slot",
    "pegar-bloques-slot",
    "limpiar-celda"
  ]);
  await expect(
    page.locator("#Dia_Accion_Menu .Dia_Accion_Separador")
  ).toHaveCount(3);
});

test("el click derecho sobre slot vacio no lo selecciona", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos = [];
  estado.Planes_Slot = {};
  estado.Slots_Muertos_Tipos = {};
  estado.Slots_Muertos_Nombres = {};
  estado.Slots_Muertos_Titulos_Visibles = {};
  estado.Slots_Muertos_Nombres_Auto = {};
  estado.Slots_Muertos_Grupo_Ids = {};

  await preparar(page, estado);

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  await slot.click({ button: "right" });

  const data = await page.evaluate(() => ({
    seleccion_slots: Array.from(Slots_Multi_Seleccion),
    seleccion_eventos: Array.from(Eventos_Multi_Seleccion),
    clase_activa: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
    )?.classList.contains("Multi_Activa") || false,
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(data.seleccion_slots).toEqual([]);
  expect(data.seleccion_eventos).toEqual([]);
  expect(data.clase_activa).toBeFalsy();
  expect(data.barra_activa).toBeFalsy();
});

test("cerrar el menu contextual con click afuera no selecciona el slot", async ({
  page
}) => {
  await preparar(page, estadoBase());

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
    { button: "right" }
  );
  await expect(
    page.locator("#Dia_Accion_Menu")
  ).toHaveClass(/Activo/);

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );

  const data = await page.evaluate(() => ({
    menu_activo: document.getElementById("Dia_Accion_Menu")
      ?.classList.contains("Activo") || false,
    seleccion_slots: Array.from(Slots_Multi_Seleccion).sort(),
    seleccion_eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    clase_activa: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
    )?.classList.contains("Multi_Activa") || false,
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(data.menu_activo).toBeFalsy();
  expect(data.seleccion_slots).toEqual([]);
  expect(data.seleccion_eventos).toEqual([]);
  expect(data.clase_activa).toBeFalsy();
  expect(data.barra_activa).toBeFalsy();
});

test("cerrar el popup de plan con click afuera no selecciona el slot", async ({
  page
}) => {
  await preparar(page, estadoBase());

  await page.evaluate(() => {
    const slot = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
    );
    Mostrar_Popup_Plan_Slot("2026-04-13", 10, slot);
  });
  await expect(
    page.locator(".Evento_Abordaje_Popup")
  ).toBeVisible();

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );

  const data = await page.evaluate(() => ({
    popup_activo: Boolean(
      document.querySelector(".Evento_Abordaje_Popup")
    ),
    seleccion_slots: Array.from(Slots_Multi_Seleccion).sort(),
    seleccion_eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    clase_activa: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
    )?.classList.contains("Multi_Activa") || false,
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(data.popup_activo).toBeFalsy();
  expect(data.seleccion_slots).toEqual([]);
  expect(data.seleccion_eventos).toEqual([]);
  expect(data.clase_activa).toBeFalsy();
  expect(data.barra_activa).toBeFalsy();
});

test("el menu contextual puede limpiar un slot muerto y dejarlo blanco", async ({
  page
}) => {
  await preparar(page, estadoBase());

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  await slot.click({ button: "right" });

  const botonLimpiar = page.locator(
    '#Dia_Accion_Menu [data-acc="limpiar-celda"]'
  );
  await expect(botonLimpiar).toBeVisible();
  await botonLimpiar.click();
  await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

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


test("el menu contextual puede limpiar un slot vacio con residuos", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos = [];
  estado.Planes_Slot = {
    "2026-04-13|12": {
      Items: [
        {
          Id: "ps_vacio",
          Texto: "Pendiente residual",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };
  estado.Slots_Muertos_Tipos = {
    "2026-04-13|12": "Comida"
  };
  estado.Slots_Muertos_Nombres = {
    "2026-04-13|12": "Titulo residual"
  };
  estado.Slots_Muertos_Titulos_Visibles = {
    "2026-04-13|12": true
  };
  estado.Slots_Muertos_Nombres_Auto = {
    "2026-04-13|12": false
  };

  await preparar(page, estado);

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  await slot.click({ button: "right" });
  await expect(
    page.locator('#Dia_Accion_Menu [data-acc="limpiar-celda"]')
  ).toBeVisible();
  await page.click('#Dia_Accion_Menu [data-acc="limpiar-celda"]');
  await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

  const data = await page.evaluate(() => ({
    tipo: Slots_Muertos_Tipos["2026-04-13|12"] || "",
    titulo: Slots_Muertos_Nombres["2026-04-13|12"] || "",
    visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|12"]
    ),
    plan: Planes_Slot["2026-04-13|12"]?.Items?.length || 0,
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

  expect(data.tipo).toBe("");
  expect(data.titulo).toBe("");
  expect(data.visible).toBeFalsy();
  expect(data.plan).toBe(0);
  expect(data.ui_titulo).toBe("");
  expect(data.ui_marca_plan).toBeFalsy();
});

test("un slot vacio no muestra ni permite titulos residuales", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Slots_Muertos = [];
  estado.Planes_Slot = {};
  estado.Slots_Muertos_Tipos = {
    "2026-04-13|12": "Comida"
  };
  estado.Slots_Muertos_Nombres = {
    "2026-04-13|12": "Titulo residual"
  };
  estado.Slots_Muertos_Titulos_Visibles = {
    "2026-04-13|12": true
  };
  estado.Slots_Muertos_Nombres_Auto = {
    "2026-04-13|12": false
  };

  await preparar(page, estado);

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  await expect(
    slot.locator(".Slot_Muerto_Nombre")
  ).toHaveCount(0);

  await slot.click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="editar-nombre-slot"]'
    )
  ).toHaveCount(0);
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="toggle-titulo-slot"]'
    )
  ).toHaveCount(0);

  const data = await page.evaluate(() => ({
    es_muerto: Slots_Muertos.includes("2026-04-13|12"),
    titulo: Slots_Muertos_Nombres["2026-04-13|12"] || "",
    visible: Boolean(
      Slots_Muertos_Titulos_Visibles["2026-04-13|12"]
    ),
    titulo_visible: Obtener_Nombre_Slot_Visible(
      "2026-04-13",
      12
    )
  }));

  expect(data.es_muerto).toBeFalsy();
  expect(data.titulo).toBe("");
  expect(data.visible).toBeFalsy();
  expect(data.titulo_visible).toBe("");
});

test("el menu contextual puede limpiar un bloque y la celda debajo", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "ev_limpiar",
      Objetivo_Id: null,
      Fecha: "2026-04-13",
      Inicio: 10,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "Nota del bloque"
    }
  ];

  await preparar(page, estado);

  const bloque = page.locator('.Evento[data-id="ev_limpiar"]');
  await bloque.click({ button: "right" });
  const botones_menu = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).allTextContents();
  const acciones_menu = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-acc"))
  );
  const seleccion_menu = await page.evaluate(() => ({
    slots: Array.from(Slots_Multi_Seleccion).sort(),
    eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));
  await expect(
    page.locator('#Dia_Accion_Menu [data-acc="limpiar-celda"]')
  ).toBeVisible();
  await expect(
    page.locator('#Dia_Accion_Menu [data-acc="eliminar"]')
  ).toHaveCount(0);
  expect(acciones_menu).toEqual([
    "abordaje",
    "nota",
    "borrar-nota",
    "repetir",
    "limpiar-objetivo",
    "limpiar-celda"
  ]);
  expect(seleccion_menu.slots).toEqual([]);
  expect(seleccion_menu.eventos).toEqual([]);
  expect(seleccion_menu.barra_activa).toBeFalsy();
  await expect(
    page.locator("#Dia_Accion_Menu .Dia_Accion_Separador")
  ).toHaveCount(3);
  expect(botones_menu.at(-1)).toBe("Limpiar");
  await expect(
    page.locator('#Dia_Accion_Menu .Dia_Accion_Item').last()
  ).toHaveClass(/Dia_Accion_Peligro/);
  await page.click('#Dia_Accion_Menu [data-acc="limpiar-celda"]');
  await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

  const data = await page.evaluate(() => ({
    eventos: Eventos.length,
    tipo: Slots_Muertos_Tipos["2026-04-13|10"] || "",
    titulo: Slots_Muertos_Nombres["2026-04-13|10"] || "",
    plan: Planes_Slot["2026-04-13|10"]?.Items?.length || 0,
    bloque_ui: Boolean(
      document.querySelector('.Evento[data-id="ev_limpiar"]')
    )
  }));

  expect(data.eventos).toBe(0);
  expect(data.tipo).toBe("");
  expect(data.titulo).toBe("");
  expect(data.plan).toBe(0);
  expect(data.bloque_ui).toBeFalsy();
});

test("un bloque no renderiza titulos de slot muerto superpuesto", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "ev_superpuesto",
      Objetivo_Id: null,
      Fecha: "2026-04-13",
      Inicio: 10,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f"
    }
  ];

  await preparar(page, estado);

  const data = await page.evaluate(() => ({
    titulo_visible: Obtener_Nombre_Slot_Visible(
      "2026-04-13",
      10
    ),
    tiene_titulo: Slot_Muerto_Tiene_Titulo(
      "2026-04-13",
      10
    ),
    ui_titulo:
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
        ".Slot_Muerto_Nombre"
      )?.textContent || "",
    texto_bloque:
      document.querySelector(
        '.Evento[data-id="ev_superpuesto"]'
      )?.textContent || ""
  }));

  expect(data.titulo_visible).toBe("");
  expect(data.tiene_titulo).toBeFalsy();
  expect(data.ui_titulo).toBe("");
  expect(data.texto_bloque).not.toContain("Almuerzo largo");
});

test("resize personalizado expande y recorta una franja de slot muerto", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Config_Extra.Resize_Personalizado = true;

  await preparar(page, estado);

  const slotInicial = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  const handleInicial = slotInicial.locator(
    ".Slot_Muerto_Resize_Handle"
  );
  await expect(handleInicial).toBeVisible();

  const cajaHandle = await handleInicial.boundingBox();
  const cajaSlot = await slotInicial.boundingBox();
  if (!cajaHandle || !cajaSlot) {
    throw new Error("No se pudo medir el resize del slot");
  }
  const estiloHandle = await handleInicial.evaluate((el) => {
    const estilo = window.getComputedStyle(el);
    return {
      cursor: estilo.cursor,
      ancho: parseFloat(estilo.width) || 0,
      alto: parseFloat(estilo.height) || 0
    };
  });

  expect(estiloHandle.cursor).toBe("ns-resize");
  expect(estiloHandle.ancho).toBeGreaterThanOrEqual(
    Math.max(0, cajaSlot.width - 2)
  );
  expect(estiloHandle.alto).toBeGreaterThanOrEqual(10);

  await page.mouse.move(
    cajaHandle.x + cajaHandle.width / 2,
    cajaHandle.y + cajaHandle.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    cajaHandle.x + cajaHandle.width / 2,
    cajaHandle.y + cajaHandle.height / 2 + cajaSlot.height,
    { steps: 6 }
  );
  await page.mouse.up();

  let data = await page.evaluate(() => ({
    slot_10: Slots_Muertos.includes("2026-04-13|10"),
    slot_11: Slots_Muertos.includes("2026-04-13|11"),
    tipo_11: Slots_Muertos_Tipos["2026-04-13|11"] || "",
    titulo_11: Slots_Muertos_Nombres["2026-04-13|11"] || "",
    plan_11:
      Planes_Slot["2026-04-13|11"]?.Items?.[0]?.Texto || ""
  }));

  expect(data.slot_10).toBeTruthy();
  expect(data.slot_11).toBeTruthy();
  expect(data.tipo_11).toBe("Comida");
  expect(data.titulo_11).toBe("Almuerzo largo");
  expect(data.plan_11).toBe("Idea central");

  const slotFinal = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="11"]'
  );
  const handleFinal = slotFinal.locator(
    ".Slot_Muerto_Resize_Handle"
  );
  await expect(handleFinal).toBeVisible();

  const cajaHandleFinal = await handleFinal.boundingBox();
  const cajaSlotFinal = await slotFinal.boundingBox();
  if (!cajaHandleFinal || !cajaSlotFinal) {
    throw new Error("No se pudo medir el resize final");
  }

  await page.mouse.move(
    cajaHandleFinal.x + cajaHandleFinal.width / 2,
    cajaHandleFinal.y + cajaHandleFinal.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    cajaHandleFinal.x + cajaHandleFinal.width / 2,
    cajaHandleFinal.y + cajaHandleFinal.height / 2
      - cajaSlotFinal.height,
    { steps: 6 }
  );
  await page.mouse.up();

  data = await page.evaluate(() => ({
    slot_10: Slots_Muertos.includes("2026-04-13|10"),
    slot_11: Slots_Muertos.includes("2026-04-13|11"),
    plan_11: Planes_Slot["2026-04-13|11"]?.Items?.length || 0
  }));

  expect(data.slot_10).toBeTruthy();
  expect(data.slot_11).toBeFalsy();
  expect(data.plan_11).toBe(0);
});

test("resize de slot muerto visible sin modo personalizado", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Config_Extra.Resize_Personalizado = false;

  await preparar(page, estado);

  const slotInicial = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  const handleInicial = slotInicial.locator(
    ".Slot_Muerto_Resize_Handle"
  );
  await expect(handleInicial).toBeVisible();

  const cajaHandle = await handleInicial.boundingBox();
  const cajaSlot = await slotInicial.boundingBox();
  if (!cajaHandle || !cajaSlot) {
    throw new Error("No se pudo medir el resize del slot");
  }

  await page.mouse.move(
    cajaHandle.x + cajaHandle.width / 2,
    cajaHandle.y + cajaHandle.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    cajaHandle.x + cajaHandle.width / 2,
    cajaHandle.y + cajaHandle.height / 2 + cajaSlot.height,
    { steps: 6 }
  );
  await page.mouse.up();

  const data = await page.evaluate(() => ({
    slot_10: Slots_Muertos.includes("2026-04-13|10"),
    slot_11: Slots_Muertos.includes("2026-04-13|11")
  }));

  expect(data.slot_10).toBeTruthy();
  expect(data.slot_11).toBeTruthy();
});
