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
  await page.waitForFunction(
    () => typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("el modal de slot reconoce patrones del tipo del slot", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|10"],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [
      {
        Id: "p1",
        Nombre: "Genérico",
        Emoji: "🧩",
        Tipo: "Slot",
        Aplica_A: "Slot_Vacio",
        Items: []
      },
      {
        Id: "p2",
        Nombre: "Sueño",
        Emoji: "😴",
        Tipo: "Slot",
        Aplica_A: "Sueno",
        Items: [
          {
            Id: "i1",
            Emoji: "😴",
            Texto: "Dormir",
            Estado: "Planeado"
          }
        ]
      }
    ],
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
        Plan_Boton: true,
        Resumen_Sem_Boton: true
      },
      Plan_Actual: "Premium",
      Baul_Tareas_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
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
    Slots_Muertos_Tipos: {
      "2026-04-13|10": "Sueno"
    },
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(async () => {
    Abrir_Modal_Plan_Slot("2026-04-13", 10);
    let Opciones = [];
    const Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (_Texto, Lista) => {
      Opciones = Lista.map((Item) => Item.Valor).filter(Boolean);
      return "p2";
    };
    try {
      const Nuevos_Items =
        await Resolver_Items_Patron_Slot(
          Plan_Slot_Borrador,
          Obtener_Aplica_A_Slot(
            "2026-04-13",
            10
          )
        );
      if (Nuevos_Items) {
        Plan_Slot_Borrador = Nuevos_Items;
      }
    } finally {
      Mostrar_Dialogo = Original;
    }
    return {
      opciones: Opciones,
      textos: Plan_Slot_Borrador.map((Item) => Item.Texto)
    };
  });

  expect(resultado.opciones).toContain("p2");
  expect(resultado.textos).toContain("Dormir");
});

test("el resumen semanal agrega filtros y orden utiles", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [
      {
        Id: "T1",
        Familia_Id: "F1",
        Fracasos_Semanales: {},
        Subtareas_Semanales: {},
        Subtareas_Contraidas_Semanales: {},
        Subtareas_Excluidas_Semanales: {},
        Nombre: "Proyecto A",
        Emoji: "🎯",
        Color: "#f1b77e",
        Horas_Semanales: 4,
        Restante: 4,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: "cat1",
        Etiquetas_Ids: []
      },
      {
        Id: "T2",
        Familia_Id: "F2",
        Fracasos_Semanales: {},
        Subtareas_Semanales: {},
        Subtareas_Contraidas_Semanales: {},
        Subtareas_Excluidas_Semanales: {},
        Nombre: "Proyecto B",
        Emoji: "🧪",
        Color: "#8fbcd4",
        Horas_Semanales: 2,
        Restante: 0,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: "cat2",
        Etiquetas_Ids: []
      }
    ],
    Eventos: [
      {
        Id: "E1",
        Tarea_Id: "T1",
        Fecha: "2026-04-13",
        Hora: 10,
        Duracion: 1,
        Hecho: true
      },
      {
        Id: "E2",
        Tarea_Id: "T2",
        Fecha: "2026-04-14",
        Hora: 12,
        Duracion: 2,
        Hecho: true
      }
    ],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [
      { Id: "cat1", Emoji: "💼", Nombre: "Trabajo", Metadatos: [] },
      { Id: "cat2", Emoji: "🏠", Nombre: "Casa", Metadatos: [] }
    ],
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
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
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
        Resumen_Sem_Boton: true
      },
      Plan_Actual: "Premium",
      Baul_Tareas_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
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
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(() => {
    Abrir_Resumen_Semanal();
    Resumen_Sem_Filtro_Categoria = "cat1";
    Resumen_Sem_Solo_Pendientes = true;
    Resumen_Sem_Orden = "Nombre";
    Render_Resumen_Semanal();
    const Filtradas = Array.from(
      document.querySelectorAll(".Resumen_Sem_Tarea_Nombre")
    ).map((El) => El.textContent.trim());
    const Labels = Array.from(
      document.querySelectorAll(".Resumen_Sem_Filtro_Campo label")
    ).map((El) => El.textContent.trim());
    Resumen_Sem_Filtro_Categoria = "";
    Resumen_Sem_Solo_Pendientes = false;
    Resumen_Sem_Orden = "Cumplimiento";
    Render_Resumen_Semanal();
    const Ordenadas = Array.from(
      document.querySelectorAll(".Resumen_Sem_Tarea_Nombre")
    ).map((El) => El.textContent.trim());
    return {
      Filtradas,
      Labels,
      PrimeraOrdenada: Ordenadas[0]
    };
  });

  expect(resultado.Labels).toContain("Categoría");
  expect(resultado.Labels).toContain("Ordenar");
  expect(resultado.Filtradas).toEqual(["Proyecto A"]);
  expect(resultado.PrimeraOrdenada).toBe("Proyecto A");
});
