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
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    window.Inicializar();
    Abrir_Baul();
    if (typeof Dialogo_Abierto !== "undefined") {
      Dialogo_Abierto = false;
    }
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Render_Baul();
  });
}

test("no muestra el estado como tooltip nativo en el baul", async ({
  page
}) => {
  await preparar(page, {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Objetivos: [
      {
        Id: "b1",
        Nombre: "Objetivo con detalle",
        Emoji: "📝",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "Linea 1\nLinea 2",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1
      }
    ],
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
      Plan_Actual: "Premium",
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  });

  const tarjeta = page.locator('[data-baul-id="b1"]');
  await expect(tarjeta).not.toHaveAttribute("title", "Activa");

  await tarjeta.hover();
  await page.waitForTimeout(2100);

  await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
    .toHaveText("Descripción");
  await expect(page.locator(".Baul_Descripcion_Popup_Texto"))
    .toHaveText("Linea 1\nLinea 2");
});

test("el baul usa iconos por estado sin sombra de color", async ({
  page
}) => {
  await preparar(page, {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Objetivos: [
      {
        Id: "b1",
        Nombre: "Activa",
        Emoji: "ðŸ“",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1
      },
      {
        Id: "b2",
        Nombre: "Realizada",
        Emoji: "ðŸ“",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Realizada",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 2
      },
      {
        Id: "b3",
        Nombre: "Postergada",
        Emoji: "ðŸ“",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Postergada",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 3
      },
      {
        Id: "b4",
        Nombre: "Anulada",
        Emoji: "ðŸ“",
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Anulada",
        Archivada: false,
        Color_Baul: "",
        Descripcion: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 4
      }
    ],
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
      Plan_Actual: "Premium",
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  });

  await expect(page.locator("#Baul_Sombra_Estado"))
    .toHaveCount(0);

  const Biblioteca = await page.evaluate(() => {
    Config.Baul_Vista_Modo = "Biblioteca";
    Render_Baul();
    return Array.from(
      document.querySelectorAll(".Baul_Card")
    ).map((Tarjeta) => {
      const Icono = Tarjeta.querySelector(
        ".Baul_Estado_Icono"
      );
      return {
        id: Tarjeta.dataset.baulId,
        icono: Icono?.textContent || "",
        estado: Icono?.dataset.estado || "",
        conSombra: Tarjeta.classList.contains(
          "Con_Sombra_Estado"
        ),
        posicion: window.getComputedStyle(Icono).position
      };
    });
  });

  expect(Biblioteca).toEqual([
    {
      id: "b1",
      icono: "⋯",
      estado: "Activa",
      conSombra: false,
      posicion: "absolute"
    },
    {
      id: "b2",
      icono: "✅",
      estado: "Realizada",
      conSombra: false,
      posicion: "absolute"
    },
    {
      id: "b3",
      icono: "📅",
      estado: "Postergada",
      conSombra: false,
      posicion: "absolute"
    },
    {
      id: "b4",
      icono: "❌",
      estado: "Anulada",
      conSombra: false,
      posicion: "absolute"
    }
  ]);

  const Lista = await page.evaluate(() => {
    Config.Baul_Vista_Modo = "Lista";
    Render_Baul();
    return Array.from(
      document.querySelectorAll(".Baul_Fila")
    ).map((Fila) => {
      const Icono = Fila.querySelector(
        ".Baul_Estado_Icono"
      );
      return {
        id: Fila.dataset.baulId,
        icono: Icono?.textContent || "",
        estado: Icono?.dataset.estado || "",
        conSombra: Fila.classList.contains(
          "Con_Sombra_Estado"
        ),
        posicion: window.getComputedStyle(Icono).position
      };
    });
  });

  expect(Lista).toEqual(Biblioteca);
});

test("el baul traduce per row y el tipo objetivo en ingles", async ({
  page
}) => {
  await preparar(page, {
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
      Plan_Actual: "Premium",
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Objetivos_Por_Fila: 5
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  });

  const resultado = await page.evaluate(() => {
    Cambiar_Idioma("en");
    return {
      por_fila: document.querySelector(
        'label[for="Baul_Objetivos_Por_Fila"]'
      )?.textContent?.trim() || "",
      tipos: Array.from(
        document.querySelectorAll(
          "#Baul_Tipo_Input option"
        )
      ).map((opcion) => opcion.textContent.trim())
    };
  });

  expect(resultado.por_fila).toBe("Per row");
  expect(resultado.tipos).toEqual([
    "Objective",
    "Hour pool"
  ]);
});
