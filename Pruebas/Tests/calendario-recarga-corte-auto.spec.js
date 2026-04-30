const { test, expect } = require("@playwright/test");

async function preparar(page, estadoInicial, ahoraISO) {
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

  await page.addInitScript(({ estado, ahora }) => {
    const Date_Real = Date;
    let Ahora_Ms = Date_Real.parse(ahora);

    class Date_Mock extends Date_Real {
      constructor(...args) {
        if (args.length === 0) {
          super(Ahora_Ms);
          return;
        }
        super(...args);
      }
      static now() {
        return Ahora_Ms;
      }
      static parse(valor) {
        return Date_Real.parse(valor);
      }
      static UTC(...args) {
        return Date_Real.UTC(...args);
      }
    }

    window.Date = Date_Mock;
    window.__SetMockNow = (iso) => {
      Ahora_Ms = Date_Real.parse(iso);
    };

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
  }, { estado: estadoInicial, ahora: ahoraISO });

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Cargando_Inicial = false;
    Semana_Actual = Parsear_Fecha_ISO("2026-04-13");
    Render_Calendario();
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
    Etiquetas_Archivero: [],
    Patrones: [],
    Habitos: [],
    Habitos_Registros: [],
    Tareas: [],
    Tareas_Cajones_Definidos: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 0.5,
    Config_Extra: {
      Inicio_Hora: 20,
      Fin_Hora: 23,
      Scroll_Inicial: 20,
      Duracion_Default: 0.5,
      Duracion_Grilla_Eventos: 0.5,
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

test("recarga calendario al cierre de bloque y muestra toast breve",
async ({ page }) => {
  const estado = estadoBase();
  await preparar(page, estado, "2026-04-13T21:29:30");

  const antes = await page.evaluate(() => {
    return document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="21.5"]'
    )?.classList.contains("Slot_Pasado");
  });
  expect(antes).toBe(false);

  const resultado = await page.evaluate(() => {
    window.__SetMockNow("2026-04-13T21:30:10");
    const actualizo = Calendario_Auto_Recarga_Ejecutar(true);
    const segundoIntento = Calendario_Auto_Recarga_Ejecutar(true);
    const slotPasado = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="21.5"]'
    )?.classList.contains("Slot_Pasado");
    const toasts = Array.from(
      document.querySelectorAll(".Undo_Toast_Texto")
    ).map((el) => el.textContent.trim());
    return {
      actualizo,
      segundoIntento,
      slotPasado,
      primerToast: toasts[0] || "",
      cantidadToasts: toasts.length
    };
  });

  expect(resultado.actualizo).toBe(true);
  expect(resultado.segundoIntento).toBe(false);
  expect(resultado.slotPasado).toBe(true);
  expect(resultado.primerToast).toContain(
    "Calendario actualizado al cierre de bloque"
  );
  expect(resultado.cantidadToasts).toBe(1);
});
