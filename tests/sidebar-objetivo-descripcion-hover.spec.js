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
    "https://challenges.cloudflare.com/turnstile/" +
    "v0/api.js?render=explicit",
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
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test(
  "crea descripcion corta del objetivo semanal y la muestra en hover",
  async ({ page }) => {
    await preparar(page, estadoBase());

    await page.click("#Mostrar_Creador");
    await expect(
      page.locator("#Descripcion_Corta_Objetivo")
    ).toHaveCSS("border-radius", "12px");
    await page.fill("#Nombre_Objetivo", "Objetivo hover");
    await page.fill(
      "#Descripcion_Corta_Objetivo",
      "Contexto corto del objetivo"
    );
    await page.click("#Crear_Objetivo");

    const objetivoId = await page.evaluate(() => {
      return Objetivos.find(
        (Objetivo) => Objetivo.Nombre === "Objetivo hover"
      )?.Id || "";
    });

    expect(objetivoId).not.toBe("");

    const boton = page.locator(
      `[data-objetivo-id="${objetivoId}"]`
    );
    await expect(boton).not.toHaveAttribute(
      "title",
      /.+/
    );
    await boton.hover();
    await page.waitForTimeout(2100);

    await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
      .toContainText("Objetivo hover");
    await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
      .toHaveText("Contexto corto del objetivo");

    const data = await page.evaluate(() => {
      const estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2")
      );
      return {
        descripcion:
          Objetivos.find((objetivo) =>
            objetivo.Nombre === "Objetivo hover"
          )?.Descripcion_Corta || "",
        local:
          estado.Objetivos.find((objetivo) =>
            objetivo.Nombre === "Objetivo hover"
          )?.Descripcion_Corta || ""
      };
    });

    expect(data.descripcion).toBe("Contexto corto del objetivo");
    expect(data.local).toBe("Contexto corto del objetivo");

    await page.mouse.move(4, 4);
    await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
      .toHaveCount(0);
  }
);

test(
  "edita descripcion corta del objetivo semanal desde el editor",
  async ({ page }) => {
    const estado = estadoBase();
    estado.Objetivos = [
      {
        Id: "o1",
        Familia_Id: "o1",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Objetivo editable",
        Descripcion_Corta: "",
        Emoji: "\uD83C\uDFAF",
        Color: "#1f6b4f",
        Horas_Semanales: 0,
        Restante: 0,
        Es_Bolsa: false,
        Es_Fija: false,
        Semana_Base: "2026-04-13",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: []
      }
    ];

    await preparar(page, estado);

    await page.click('[data-objetivo-id="o1"]');
    await page.click("#Resumen_Editar");
    await expect(
      page.locator("#Editor_Descripcion_Corta_Input")
    ).toHaveCSS("border-radius", "12px");
    await page.fill(
      "#Editor_Descripcion_Corta_Input",
      "Descripcion editada desde el editor"
    );
    await page.click("#Editor_Guardar");
    await page.click("#Resumen_Contraer");

    const boton = page.locator('[data-objetivo-id="o1"]');
    await expect(boton).not.toHaveAttribute(
      "title",
      /.+/
    );
    await boton.hover();
    await page.waitForTimeout(2100);

    await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
      .toContainText("Objetivo editable");
    await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
      .toHaveText("Descripcion editada desde el editor");

    const data = await page.evaluate(() => ({
      descripcion:
        Objetivos.find((objetivo) => objetivo.Id === "o1")
          ?.Descripcion_Corta || ""
    }));

    expect(data.descripcion).toBe(
      "Descripcion editada desde el editor"
    );
  }
);
