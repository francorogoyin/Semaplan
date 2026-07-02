const { test, expect } = require("@playwright/test");

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
    Baul_Objetivos: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Habitos: [],
    Habitos_Registros: [],
    Tareas: [],
    Tareas_Cajones_Definidos: ["Inbox"],
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
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
      Ocultar_Dias_Automatico: "Ninguno",
      Slots_Muertos_Default: {},
      Agrupar_Por_Categorias: false,
      Globito_Activo: true,
      Globito_Modo: "Horas",
      Globito_Posicion: "Arriba",
      Meta_Notificaciones_Activas: false,
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
      Version_Programa: "Test",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
      Tareas_Contador_Periodo: "Hoy",
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
    Planes_Semana: {},
    Planes_Periodo: {}
  };
}

async function prepararPagina(page) {
  const estado = crearEstadoBase();

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
  await page.addInitScript((estadoInicial) => {
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
      JSON.stringify(estadoInicial)
    );
  }, estado);

  await page.goto("/login.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Config.Plan_Actual = "Upgrade";
    Suscripcion_Remota = true;
    Suscripcion_Detalle_Remota = { estado: "active" };
    Actualizar_UI_Plan();
  });
}

test("metas filtra por texto en nombre y fuente", async ({ page }) => {
  await prepararPagina(page);

  await page.evaluate(() => {
    Categorias = [
      Normalizar_Categoria({
        Id: "cat_lectura",
        Nombre: "Lectura",
        Emoji: "📚"
      }),
      Normalizar_Categoria({
        Id: "cat_musica",
        Nombre: "Música",
        Emoji: "🎵"
      })
    ].filter(Boolean);
    Metas = [
      Normalizar_Meta({
        Id: "meta_lectura",
        Nombre: "Leer novelas",
        Horas_Objetivo: 8,
        Periodo: "Semana",
        Fuente_Tipo: "Categoria",
        Fuente_Valor: "cat_lectura"
      }),
      Normalizar_Meta({
        Id: "meta_musica",
        Nombre: "Practicar piano",
        Horas_Objetivo: 4,
        Periodo: "Semana",
        Fuente_Tipo: "Categoria",
        Fuente_Valor: "cat_musica"
      })
    ].filter(Boolean);
    document.getElementById("Metas_Overlay")
      ?.classList.add("Activo");
    Render_Metas();
  });

  await page.fill("#Metas_Buscar_Input", "lectura");
  await expect(page.locator(".Meta_Card")).toHaveCount(1);
  await expect(page.locator(".Meta_Card_Titulo")).toHaveText([
    "Leer novelas"
  ]);
});

test("habitos desoculta realizados al filtrar realizados", async ({ page }) => {
  await prepararPagina(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "habito_hecho",
        Nombre: "Tomar agua",
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "habito_pendiente",
        Nombre: "Leer 10 páginas",
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      })
    ].filter(Boolean);
    Habitos_Registros = [
      Normalizar_Habito_Registro({
        Habito_Id: "habito_hecho",
        Fecha: Habitos_Fecha_Referencia(),
        Hora: "09:00",
        Fuente: "Manual",
        Fuente_Id: "manual_prueba",
        Cantidad: 1,
        Unidad: "veces"
      })
    ];
    Normalizar_Habitos_Registros();
    Habitos_Ocultar_Realizados = true;
    Abrir_Panel_Habitos();
  });

  await page.click('[data-habitos-filtros="abrir"]');
  await page.selectOption("#Habitos_Filtro_Estado", "Realizado");
  await page.click("#Habitos_Filtros_Aceptar");

  await expect(page.locator(".Habitos_Card")).toHaveCount(1);
  await expect(page.locator("#Habitos_Toggle_Realizados"))
    .toContainText("Ocultar realizados");
});

test("tareas busca por nombre y cajon dentro de la vista actual", async ({ page }) => {
  await prepararPagina(page);

  await page.evaluate(() => {
    Tareas = [
      Normalizar_Tarea({
        Id: "tarea_facturas",
        Nombre: "Pagar facturas",
        Cajon: "Finanzas",
        Estado: "pendiente",
        Fecha: Tareas_Fecha_Referencia()
      }),
      Normalizar_Tarea({
        Id: "tarea_libro",
        Nombre: "Terminar libro",
        Cajon: "Lectura",
        Estado: "pendiente",
        Fecha: Tareas_Fecha_Referencia()
      })
    ].filter(Boolean);
    Tareas_Modal_Vista = "Panel";
    Tareas_Filtros_Abiertos = true;
    Abrir_Tareas();
  });

  await page.fill("#Tareas_Filtro_Busqueda", "lectura");
  await expect(page.locator(".Tareas_Card")).toHaveCount(1);
  await expect(page.locator(".Habitos_Card_Nombre")).toContainText([
    "Terminar libro"
  ]);
});

test("archivero muestra conteo filtrado y vacio de resultados", async ({ page }) => {
  await prepararPagina(page);

  await page.evaluate(() => {
    Archiveros = [
      { Id: "c1", Nombre: "Semaplan", Emoji: "🗃️" }
    ];
    Notas_Archivero = [
      {
        Id: "n1",
        Archivero_Id: "c1",
        Texto: "Primera nota",
        Origen: "",
        Etiquetas: [],
        Fecha_Creacion: 1,
        Tipo: "Texto"
      },
      {
        Id: "n2",
        Archivero_Id: "c1",
        Texto: "Segunda nota",
        Origen: "",
        Etiquetas: [],
        Fecha_Creacion: 2,
        Tipo: "Texto"
      }
    ];
    Archivero_Seleccion_Id = "c1";
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
    Render_Archivero();
  });

  await page.fill("#Archivero_Buscar_Input", "tercera");
  await expect(page.locator("#Archivero_Contenido_Titulo"))
    .toContainText("(0/2)");
  await expect(page.locator("#Archivero_Notas_Lista"))
    .toContainText("Sin resultados");
});

test("baul busca por descripcion y etiquetas sin acentos", async ({ page }) => {
  await prepararPagina(page);

  await page.evaluate(() => {
    Etiquetas = [
      Normalizar_Etiqueta({ Id: "tag_urgente", Nombre: "Urgente" })
    ].filter(Boolean);
    Baul_Objetivos = [
      Normalizar_Baul_Objetivo({
        Id: "baul_cafe",
        Nombre: "Llamar cliente",
        Descripcion: "Revisar café del centro",
        Etiquetas_Ids: ["tag_urgente"],
        Estado: "Activa"
      }),
      Normalizar_Baul_Objetivo({
        Id: "baul_luz",
        Nombre: "Pagar luz",
        Descripcion: "Factura mensual",
        Etiquetas_Ids: [],
        Estado: "Activa"
      })
    ].filter(Boolean);
    Abrir_Baul();
  });

  await page.fill("#Baul_Buscar_Input", "cafe urgente");
  await expect(page.locator(".Baul_Card")).toHaveCount(1);
  await expect(page.locator(".Baul_Card_Nombre")).toContainText([
    "Llamar cliente"
  ]);
});
