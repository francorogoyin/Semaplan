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
    Inicio_Semana: "2026-04-20",
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
  "creador muestra sugerencia manual y deja elegir emoji",
  async ({ page }) => {
    const estado = estadoBase();
    estado.Inicio_Semana = "2026-04-20";
    estado.Planes_Periodo = {
      Version: 2,
      Periodos: {
        anio_2026: {
          Id: "anio_2026",
          Tipo: "Anio",
          Inicio: "2026-01-01",
          Fin: "2026-12-31",
          Estado: "Activo",
          Orden: 0
        }
      },
      Objetivos: {
        obj_libros: {
          Id: "obj_libros",
          Periodo_Id: "anio_2026",
          Nombre: "Libros",
          Emoji: "\uD83D\uDCDA",
          Target_Total: 0,
          Unidad: "Personalizado",
          Unidad_Custom: "P\u00e1ginas",
          Estado: "Activo",
          Orden: 0
        }
      },
      Subobjetivos: {
        sub_melville: {
          Id: "sub_melville",
          Objetivo_Id: "obj_libros",
          Texto: "Cuentos de Melville",
          Emoji: "\uD83D\uDCD6",
          Target_Total: 180,
          Unidad: "Personalizado",
          Unidad_Custom: "P\u00e1ginas",
          Progreso_Manual: 0,
          Fecha_Objetivo: "2026-04-30",
          Estado: "Activo",
          Orden: 0
        }
      },
      Avances: {},
      UI: {}
    };

    await preparar(page, estado);

    await page.click("#Mostrar_Creador");
    await page.selectOption(
      "#Meta_Vinculo_Objetivo",
      "Subobjetivo|sub_melville"
    );

    await expect(page.locator("#Meta_Aporte_Campo"))
      .toBeVisible();
    await expect(page.locator("#Meta_Aporte_Sugerencia"))
      .toBeVisible();
    await expect(page.locator("#Meta_Aporte_Sugerencia_Texto"))
      .toContainText(
        "Cuentos de Melville termina el 30 de abril. " +
        "Quedan 2 semanas."
      );
    await expect(page.locator("#Meta_Aporte_Sugerencia_Texto"))
      .toContainText(
        "Se sugieren: 90 p\u00e1ginas/semana " +
        "(16 p\u00e1ginas/d\u00eda)."
      );
    await expect(page.locator("#Meta_Aporte_Sugerencia_Texto"))
      .not.toContainText("Libros");
    await expect(page.locator("#Meta_Aporte_Sugerencia_Aceptar"))
      .toHaveCount(0);

    const sugerenciaDentroCampo = await page.evaluate(() => {
      const Campo = document.getElementById("Meta_Aporte_Campo");
      const Sugerencia = document.getElementById(
        "Meta_Aporte_Sugerencia"
      );
      return Boolean(Campo && Sugerencia &&
        Campo.contains(Sugerencia));
    });
    expect(sugerenciaDentroCampo).toBe(true);

    await page.evaluate(() => {
      const Objetivo = Crear_Objetivo_Semanal_Con_Datos({
        Nombre: "Leer Melville",
        Descripcion_Corta: "",
        Emoji: "\uD83D\uDCD6",
        Color: "#1f6b4f",
        Es_Bolsa: true,
        Horas_Semanales: 7,
        Categoria_Id: null,
        Etiquetas_Ids: [],
        Meta_Vinculo_Tipo: "Subobjetivo",
        Meta_Vinculo_Id: "sub_melville",
        Meta_Aporte_Semanal: 90,
        Meta_Aporte_Unidad: "P\u00e1ginas"
      }, Clave_Semana_Actual());
      Objetivo_Seleccionada_Id = Objetivo.Id;
      Modo_Editor_Abierto = true;
      Datos_Editor_Borrador = Obtener_Datos_Objetivo(Objetivo);
      document.getElementById("Objetivo_Modal_Overlay")
        ?.classList.add("Activo");
      Render_Resumen_Objetivo();
      Render_Editor();
    });

    await expect(page.locator("#Editor_Objetivo")).toBeVisible();
    await expect(page.locator("#Editor_Meta_Aporte_Campo"))
      .toBeVisible();
    await expect(page.locator("#Editor_Meta_Aporte_Sugerencia"))
      .toBeVisible();
    await expect(page.locator("#Editor_Meta_Aporte_Sugerencia_Texto"))
      .toContainText(
        "Cuentos de Melville termina el 30 de abril. " +
        "Quedan 2 semanas."
      );
    await expect(page.locator("#Editor_Meta_Aporte_Sugerencia_Texto"))
      .toContainText(
        "Se sugieren: 90 p\u00e1ginas/semana " +
        "(16 p\u00e1ginas/d\u00eda)."
      );
    await expect(page.locator("#Editor_Meta_Aporte_Sugerencia_Aceptar"))
      .toHaveCount(0);

    const sugerenciaEditorDentroCampo = await page.evaluate(() => {
      const Campo = document.getElementById(
        "Editor_Meta_Aporte_Campo"
      );
      const Sugerencia = document.getElementById(
        "Editor_Meta_Aporte_Sugerencia"
      );
      return Boolean(Campo && Sugerencia &&
        Campo.contains(Sugerencia));
    });
    expect(sugerenciaEditorDentroCampo).toBe(true);

    await page.evaluate(() => {
      document.getElementById("Objetivo_Modal_Overlay")
        ?.classList.remove("Activo");
      Modo_Editor_Abierto = false;
      Objetivo_Seleccionada_Id = null;
      Render_Editor();
      Render_Resumen_Objetivo();
    });

    await page.click("#Emoji_Objetivo");
    await expect(page.locator("#Selector_Emojis_Popover"))
      .toBeVisible();

    const capas = await page.evaluate(() => {
      const Modal = document.getElementById("Creador_Contenido");
      const Pop = document.getElementById(
        "Selector_Emojis_Popover"
      );
      return {
        modal: Number(window.getComputedStyle(Modal).zIndex),
        pop: Number(window.getComputedStyle(Pop).zIndex)
      };
    });
    expect(capas.pop).toBeGreaterThan(capas.modal);

    await page.locator(
      "#Selector_Emojis_Grid .Selector_Emojis_Btn"
    ).first().click();

    const emoji = await page.inputValue("#Emoji_Objetivo");
    expect(emoji.length).toBeGreaterThan(0);
  }
);

test(
  "popup separa descripcion y sugerencia diaria solo si corresponde",
  async ({ page }) => {
    await preparar(page, estadoBase());

    await page.evaluate(() => {
      Mostrar_Popup_Descripcion(
        "Casi puesta a punto\n" +
        "Sugerencia de avance por dia: 1.73 features",
        { X: 80, Y: 80 },
        "Semaplan"
      );
    });

    await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
      .toContainText("Semaplan");
    await expect(
      page.locator(".Baul_Descripcion_Popup_Texto").first()
    ).toHaveText("Casi puesta a punto");
    const sugerencia = page.locator(
      ".Baul_Descripcion_Popup_Sugerencia"
    );
    await expect(sugerencia).toHaveText(
      "Sugerencia de avance por dia: 1.73 features"
    );
    await expect(sugerencia).toHaveCSS("font-size", "10px");
    await expect(sugerencia).toHaveCSS(
      "border-top-width",
      "1px"
    );
    await expect(sugerencia).toHaveCSS("padding-top", "8px");

    await page.evaluate(() => {
      Cerrar_Popup_Descripcion();
      Mostrar_Popup_Descripcion(
        "Sugerencia de avance por dia: 1.73 features",
        { X: 80, Y: 80 },
        "Semaplan"
      );
    });

    const sugerenciaSola = page.locator(
      ".Baul_Descripcion_Popup_Sugerencia"
    );
    await expect(sugerenciaSola).toHaveCount(1);
    await expect(sugerenciaSola).toHaveCSS("font-size", "10px");
    await expect(sugerenciaSola).toHaveCSS(
      "border-top-width",
      "0px"
    );
    await expect(sugerenciaSola).toHaveCSS("padding-top", "0px");
  }
);

test(
  "crea descripcion corta del objetivo semanal y la muestra en hover",
  async ({ page }) => {
    await preparar(page, estadoBase());

    await page.click("#Mostrar_Creador");
    const fuenteCreador = await page.evaluate(() => {
      const cuerpo = window.getComputedStyle(
        document.body
      ).fontFamily;
      const campo = window.getComputedStyle(
        document.getElementById("Descripcion_Corta_Objetivo")
      ).fontFamily;
      return { cuerpo, campo };
    });
    expect(fuenteCreador.campo).toBe(fuenteCreador.cuerpo);
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
  "objetivo sin descripcion muestra popup solo con titulo",
  async ({ page }) => {
    const estado = estadoBase();
    estado.Objetivos = [
      {
        Id: "o_sin_desc",
        Familia_Id: "o_sin_desc",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Objetivo sin descripcion",
        Descripcion_Corta: "",
        Emoji: "\uD83D\uDCAA",
        Color: "#1f6b4f",
        Horas_Semanales: 0,
        Restante: 0,
        Es_Bolsa: false,
        Es_Fija: false,
        Semana_Base: "2026-04-20",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: []
      }
    ];

    await preparar(page, estado);

    const boton = page.locator(
      '[data-objetivo-id="o_sin_desc"]'
    );
    await expect(boton).not.toHaveAttribute(
      "title",
      /.+/
    );
    await boton.hover();
    await page.waitForTimeout(2100);

    await expect(
      page.locator(".Evento_Abordaje_Popup")
    ).toHaveCount(1);
    await expect(page.locator(".Evento_Abordaje_Popup_Titulo"))
      .toContainText("Objetivo sin descripcion");
    await expect(
      page.locator(".Baul_Descripcion_Popup_Texto")
    ).toHaveCount(0);
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
        Semana_Base: "2026-04-20",
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: null,
        Etiquetas_Ids: []
      }
    ];

    await preparar(page, estado);

    await page.click('[data-objetivo-id="o1"]');
    await page.click("#Resumen_Menu_Acciones");
    await page.locator("#Dia_Accion_Menu")
      .getByRole("button", { name: "Editar" })
      .click();
    const fuenteEditor = await page.evaluate(() => {
      const cuerpo = window.getComputedStyle(
        document.body
      ).fontFamily;
      const campo = window.getComputedStyle(
        document.getElementById(
          "Editor_Descripcion_Corta_Input"
        )
      ).fontFamily;
      return { cuerpo, campo };
    });
    expect(fuenteEditor.campo).toBe(fuenteEditor.cuerpo);
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
