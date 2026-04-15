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

function crearEstado() {
  return {
    Objetivos: [
      {
        Id: "t1",
        Nombre: "Preparar entrega",
        Emoji: "📌",
        Color: "#4f7ad9",
        Horas_Semanales: 3,
        Restante: 3,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
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
        Baul_Boton: true,
        Archivero_Boton: true
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
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("el emoji del sidebar abre agregar subobjetivo por click derecho",
async ({ page }) => {
  await preparar(page, crearEstado());

  await page.click('[data-objetivo-id="t1"]');
  await page.dispatchEvent(
    '[data-objetivo-id="t1"]',
    "contextmenu",
    { clientX: 48, clientY: 48 }
  );

  await expect(page.locator("#Dia_Accion_Menu")).toContainText(
    "Agregar subobjetivo"
  );
  await page.click(
    '#Dia_Accion_Menu [data-acc="agregar-subobjetivo"]'
  );

  const resultado = await page.evaluate(() => {
    const Objetivo = Objetivo_Por_Id("t1");
    const Lista = Obtener_Subobjetivos_Semana(Objetivo);
    const Input = document.querySelector(
      '.Subobjetivo_Item[data-editando="1"] ' +
      '.Subobjetivo_Texto_Input'
    );
    return {
      seleccionada: Objetivo_Seleccionada_Id,
      subobjetivos: Lista.length,
      editando: Subobjetivo_En_Edicion_Id,
      contraidas:
        Objetivo.Subobjetivos_Contraidas_Semanales?.[
          Clave_Semana_Actual()
        ] || false,
      inputActivo:
        document.activeElement === Input,
      texto: Input?.value || ""
    };
  });

  expect(resultado.seleccionada).toBe("t1");
  expect(resultado.subobjetivos).toBe(1);
  expect(resultado.editando).toBeTruthy();
  expect(resultado.contraidas).toBe(false);
  expect(resultado.inputActivo).toBe(true);
  expect(resultado.texto).toBe("");
});
