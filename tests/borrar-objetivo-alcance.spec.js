const { test, expect } = require("@playwright/test");

test("al borrar objetivo con copia en otra semana pide alcance", async ({
  page
}) => {
  const estadoInicial = {
    Objetivos: [
      {
        Id: "T1",
        Familia_Id: "F1",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Proyecto",
        Emoji: "🎯",
        Color: "#f1b77e",
        Horas_Semanales: 4,
        Restante: 4,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: "2026-04-06",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: []
      },
      {
        Id: "T2",
        Familia_Id: "F1",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Proyecto",
        Emoji: "🎯",
        Color: "#f1b77e",
        Horas_Semanales: 4,
        Restante: 4,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: []
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
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-06",
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
      },
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
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
    localStorage.setItem("Semaplan_Estado_V2", JSON.stringify(estado));
  }, estadoInicial);

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    window.Inicializar();
    Semana_Actual = Obtener_Lunes(
      Parsear_Fecha_ISO("2026-04-06")
    );
  });

  const mensaje = await page.evaluate(async () => {
    let primerMensaje = null;
    const original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (texto) => {
      if (!primerMensaje) primerMensaje = texto;
      return null;
    };
    try {
      await Borrar_Objetivo("T1");
    } finally {
      Mostrar_Dialogo = original;
    }
    return primerMensaje;
  });

  expect(mensaje).toContain("Este objetivo aparece en otras semanas");
});
