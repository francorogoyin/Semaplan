const { test, expect } = require("@playwright/test");

function mondayIsoFor(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy.toISOString().slice(0, 10);
}

function addDaysIso(isoDate, days) {
  const copy = new Date(`${isoDate}T00:00:00`);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

test("copia un objetivo a otra semana conservando categoria y subobjetivos", async ({
  page
}) => {
  const monday = mondayIsoFor(new Date());
  const nextMonday = addDaysIso(monday, 7);

  const initialState = {
    Objetivos: [
      {
        Id: "T1",
        Familia_Id: "F1",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {
          [monday]: [
            {
              Id: "S1",
              Plantilla_Id: null,
              Origen_Plantilla_Id: null,
              Emoji: "✅",
              Texto: "Primera subobjetivo",
              Hecha: false
            }
          ]
        },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Proyecto copia",
        Emoji: "🎯",
        Color: "#f1b77e",
        Horas_Semanales: 4,
        Restante: 4,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: monday,
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: "CAT1",
        Etiquetas_Ids: ["TAG1"]
      }
    ],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [
      {
        Id: "CAT1",
        Emoji: "💼",
        Nombre: "Trabajo",
        Metadatos: []
      }
    ],
    Etiquetas: [
      {
        Id: "TAG1",
        Nombre: "ClienteA",
        Color: "#8fbcd4"
      }
    ],
    Baul_Objetivos: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: monday,
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

  await page.route("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    });
  });
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    });
  });

  await page.addInitScript((estado) => {
    window.supabase = {
      createClient() {
        return {
          auth: {
            async getSession() {
              return { data: { session: null } };
            },
            onAuthStateChange() {
              return { data: { subscription: { unsubscribe() {} } } };
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
  }, initialState);

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");

  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    window.Inicializar();
  });

  await page.locator(".Emoji_Item").first().click();
  await expect(page.locator("#Resumen_Nombre")).toHaveText("Proyecto copia");

  await page.locator("#Resumen_Menu_Acciones").click();
  await page.locator("#Dia_Accion_Menu")
    .getByRole("button", { name: "Copiar" })
    .click();
  await page.getByRole("button", { name: "Con subobjetivos" }).click();
  await page.getByRole("button", { name: "Semana específica" }).click();
  await page.locator("#Dialogo_Input_Campo").fill(nextMonday);
  await page.getByRole("button", { name: "Confirmar" }).click();

  const Objetivo_Persistido = await page.evaluate((targetWeek) => {
    const raw = localStorage.getItem("Semaplan_Estado_V2");
    const state = raw ? JSON.parse(raw) : null;
    return state?.Objetivos?.find(
      (Objetivo) => {
        return Objetivo.Id !== "T1" &&
          Objetivo.Semana_Base === targetWeek;
      }
    ) || null;
  }, nextMonday);

  expect(Objetivo_Persistido).toBeTruthy();
  expect(Objetivo_Persistido.Categoria_Id).toBe("CAT1");
  expect(Objetivo_Persistido.Etiquetas_Ids).toEqual(["TAG1"]);
  expect(
    Objetivo_Persistido.Subobjetivos_Semanales[nextMonday]
  ).toHaveLength(1);
  expect(
    Objetivo_Persistido.Subobjetivos_Semanales[nextMonday][0].Texto
  ).toBe("Primera subobjetivo");

  await page.evaluate(() => {
    document.getElementById("Semana_Siguiente")?.click();
  });
  await page.locator(".Emoji_Item").first().click();
  await expect(page.locator("#Resumen_Subtitulo")).toContainText("💼 Trabajo");
  await expect(page.locator("#Resumen_Subtitulo")).toContainText("#ClienteA");
  await expect(page.locator("#Subobjetivos_Contador")).toHaveText("1");
});
