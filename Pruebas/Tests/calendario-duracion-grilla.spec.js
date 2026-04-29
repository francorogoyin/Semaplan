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
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify(estado)
    );
  }, estadoInicial);
  await page.goto("/login.html");
  await page.waitForFunction(
    () => typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Semana_Actual = Parsear_Fecha_ISO("2026-04-13");
    Render_Calendario();
  });
}

function estadoBase() {
  return {
    Objetivos: [
      {
        Id: "obj_foco",
        Nombre: "Foco",
        Emoji: "*",
        Color: "#1f6b4f",
        Horas_Semanales: 4,
        Es_Bolsa: false,
        Subobjetivos_Semanales: {
          "2026-04-13": []
        },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {}
      }
    ],
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
    Etiquetas_Archivero: [],
    Patrones: [],
    Habitos: [],
    Habitos_Registros: [],
    Tareas: [],
    Tareas_Cajones_Definidos: [],
    Contador_Eventos: 20,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 20,
      Fin_Hora: 23,
      Scroll_Inicial: 20,
      Duracion_Default: 1,
      Duracion_Grilla_Eventos: 1,
      Dias_Visibles: [0],
      Ocultar_Dias_Automatico: "Ninguno",
      Bloques_Horarios: {
        Madrugada: { Desde: 0, Hasta: 8 },
        Manana: { Desde: 8, Hasta: 13 },
        Tarde: { Desde: 13, Hasta: 20 },
        Noche: { Desde: 20, Hasta: 0 }
      },
      Bloques_Horarios_Visibles: ["Noche"],
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
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Slots_Muertos_Grupo_Ids: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("config solo ofrece tres duraciones de evento", async ({ page }) => {
  await preparar(page, estadoBase());

  const opciones = await page.evaluate(() => {
    Abrir_Config();
    return Array.from(
      document.querySelectorAll("#Cfg_Duracion_Default option")
    ).map((opcion) => ({
      valor: opcion.value,
      texto: opcion.textContent.trim()
    }));
  });

  expect(opciones).toEqual([
    { valor: "0.25", texto: "15 minutos" },
    { valor: "0.5", texto: "30 minutos" },
    { valor: "1", texto: "1 hora" }
  ]);
});

test("partir a media hora no duplica planes y ubica tareas",
async ({ page }) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "ev_21",
      Objetivo_Id: "obj_foco",
      Fecha: "2026-04-13",
      Inicio: 21,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f"
    }
  ];
  estado.Planes_Slot = {
    "2026-04-13|21": {
      Items: [
        {
          Id: "plan_general",
          Emoji: "*",
          Texto: "Plan general",
          Estado: "Planeado"
        },
        {
          Id: "plan_tarea",
          Emoji: "*",
          Texto: "Llamar",
          Estado: "Planeado",
          Tarea_Id: "tar_1"
        }
      ]
    }
  };
  estado.Tareas = [
    {
      Tipo_Dato: "Tarea",
      Id: "tar_1",
      Emoji: "*",
      Nombre: "Llamar",
      Cajon: "Inbox",
      Prioridad: "Media",
      Estado: "pendiente",
      Fecha: "2026-04-13",
      Hora: "21:45",
      Planeada: true,
      Plan_Clave: "2026-04-13|21",
      Plan_Item_Id: "plan_tarea"
    }
  ];

  await preparar(page, estado);

  const resultado = await page.evaluate(() => {
    Config.Duracion_Default = 0.5;
    Migrar_Calendario_A_Duracion_Default(1);
    Normalizar_Planes_Slot();
    Render_Calendario();
    return {
      eventos: Eventos.map((Evento) => ({
        id: Evento.Id,
        inicio: Evento.Inicio,
        duracion: Evento.Duracion,
        abordaje: (Evento.Abordaje || []).map((Item) => Item.Texto)
      })).sort((A, B) => A.inicio - B.inicio),
      plan21: (Planes_Slot["2026-04-13|21"]?.Items || [])
        .map((Item) => Item.Texto),
      plan2130: (Planes_Slot["2026-04-13|21.5"]?.Items || [])
        .map((Item) => Item.Texto),
      tareaClave: Tareas.find((Tarea) => Tarea.Id === "tar_1")
        ?.Plan_Clave,
      slots: Array.from(
        document.querySelectorAll(
          '.Slot[data-fecha="2026-04-13"]'
        )
      ).map((Slot) => Slot.dataset.hora)
    };
  });

  expect(resultado.eventos).toEqual([
    {
      id: "ev_21",
      inicio: 21,
      duracion: 0.5,
      abordaje: ["Plan general"]
    },
    {
      id: "Evento_20",
      inicio: 21.5,
      duracion: 0.5,
      abordaje: []
    }
  ]);
  expect(resultado.plan21).toEqual([]);
  expect(resultado.plan2130).toEqual(["Llamar"]);
  expect(resultado.tareaClave).toBe("2026-04-13|21.5");
  expect(resultado.slots).toContain("21.5");
});

test("partir a quince minutos conserva un solo destino por plan",
async ({ page }) => {
  const estado = estadoBase();
  estado.Eventos = [
    {
      Id: "ev_21",
      Objetivo_Id: "obj_foco",
      Fecha: "2026-04-13",
      Inicio: 21,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f"
    }
  ];
  estado.Planes_Slot = {
    "2026-04-13|21": {
      Items: [
        {
          Id: "plan_general",
          Emoji: "*",
          Texto: "Plan general",
          Estado: "Planeado"
        },
        {
          Id: "plan_tarea",
          Emoji: "*",
          Texto: "Leer",
          Estado: "Planeado",
          Tarea_Id: "tar_15"
        }
      ]
    }
  };
  estado.Tareas = [
    {
      Tipo_Dato: "Tarea",
      Id: "tar_15",
      Emoji: "*",
      Nombre: "Leer",
      Cajon: "Inbox",
      Prioridad: "Media",
      Estado: "pendiente",
      Fecha: "2026-04-13",
      Hora: "21:45",
      Planeada: true,
      Plan_Clave: "2026-04-13|21",
      Plan_Item_Id: "plan_tarea"
    }
  ];

  await preparar(page, estado);

  const resultado = await page.evaluate(() => {
    Config.Duracion_Default = 0.25;
    Migrar_Calendario_A_Duracion_Default(1);
    Normalizar_Planes_Slot();
    Render_Calendario();
    return {
      eventos: Eventos.map((Evento) => ({
        inicio: Evento.Inicio,
        duracion: Evento.Duracion,
        abordaje: (Evento.Abordaje || []).map((Item) => Item.Texto)
      })).sort((A, B) => A.inicio - B.inicio),
      plan21: (Planes_Slot["2026-04-13|21"]?.Items || [])
        .map((Item) => Item.Texto),
      plan2145: (Planes_Slot["2026-04-13|21.75"]?.Items || [])
        .map((Item) => Item.Texto),
      tareaClave: Tareas.find((Tarea) => Tarea.Id === "tar_15")
        ?.Plan_Clave,
      slots: Array.from(
        document.querySelectorAll(
          '.Slot[data-fecha="2026-04-13"]'
        )
      ).map((Slot) => Slot.dataset.hora)
    };
  });

  expect(resultado.eventos).toEqual([
    { inicio: 21, duracion: 0.25, abordaje: ["Plan general"] },
    { inicio: 21.25, duracion: 0.25, abordaje: [] },
    { inicio: 21.5, duracion: 0.25, abordaje: [] },
    { inicio: 21.75, duracion: 0.25, abordaje: [] }
  ]);
  expect(resultado.plan21).toEqual([]);
  expect(resultado.plan2145).toEqual(["Leer"]);
  expect(resultado.tareaClave).toBe("2026-04-13|21.75");
  expect(resultado.slots).toContain("21.75");
});

test("fusionar a una hora unifica planes sin duplicar", async ({
  page
}) => {
  const estado = estadoBase();
  estado.Config_Extra.Duracion_Default = 0.5;
  estado.Config_Extra.Duracion_Grilla_Eventos = 0.5;
  estado.Eventos = [
    {
      Id: "ev_21",
      Objetivo_Id: "obj_foco",
      Fecha: "2026-04-13",
      Inicio: 21,
      Duracion: 0.5,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Abordaje: [
        {
          Id: "ab_1",
          Texto: "Rutina",
          Emoji: "*",
          Habito_Id: "hab_1",
          Suelta: true,
          Planeada: true
        }
      ]
    },
    {
      Id: "ev_2130",
      Objetivo_Id: "obj_foco",
      Fecha: "2026-04-13",
      Inicio: 21.5,
      Duracion: 0.5,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Abordaje: [
        {
          Id: "ab_2",
          Texto: "Rutina",
          Emoji: "*",
          Habito_Id: "hab_1",
          Suelta: true,
          Planeada: true
        }
      ]
    }
  ];

  await preparar(page, estado);

  const resultado = await page.evaluate(() => {
    Config.Duracion_Default = 1;
    Migrar_Calendario_A_Duracion_Default(0.5);
    Render_Calendario();
    return Eventos.map((Evento) => ({
      id: Evento.Id,
      inicio: Evento.Inicio,
      duracion: Evento.Duracion,
      abordaje: (Evento.Abordaje || []).map((Item) => ({
        texto: Item.Texto,
        habito: Item.Habito_Id
      }))
    }));
  });

  expect(resultado).toEqual([
    {
      id: "ev_21",
      inicio: 21,
      duracion: 1,
      abordaje: [
        {
          texto: "Rutina",
          habito: "hab_1"
        }
      ]
    }
  ]);
});
