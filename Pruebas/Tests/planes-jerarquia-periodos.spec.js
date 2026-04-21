const { test, expect } = require("@playwright/test");

function Crear_Estado() {
  return {
    Objetivos: [
      {
        Id: "Obj_Leer",
        Nombre: "Leer",
        Emoji: "\u2705",
        Color: "#1f6b4f",
        Es_Bolsa: true,
        Es_Fija: false,
        Horas_Semanales: 10,
        Semana_Base: "2026-04-13",
        Semana_Inicio: "2026-04-13",
        Semana_Fin: null,
        Subobjetivos_Semanales: {}
      }
    ],
    Eventos: [
      {
        Id: "Evento_1",
        Objetivo_Id: "Obj_Leer",
        Fecha: "2026-04-14",
        Inicio: 10,
        Duracion: 2,
        Hecho: true,
        Color: "#1f6b4f"
      }
    ],
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
    Contador_Eventos: 2,
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
      Version_Programa: "Demo",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
      Backup_Auto_Activo: false,
      Backup_Auto_Horas: 24,
      Backup_Auto_Inicio: "",
      Backup_Auto_Ultimo: "",
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

async function Preparar(page) {
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
  }, Crear_Estado());

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("Planes renderiza jerarquia, redistribuye e importa",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Subperiodo_Activo = 1;
    Render_Plan();
  });

  await expect(page.locator("#Plan_Overlay")).toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Capa_Select")).toBeVisible();
  await expect(page.locator("#Planes_Ayuda_Conceptual_Abrir"))
    .toHaveCount(0);
  const Barra = await page.evaluate(() => {
    const Config = document.getElementById("Planes_Config_Header");
    const Etiquetas = document.getElementById(
      "Planes_Btn_Etiquetas_Header"
    );
    const Cerrar = document.getElementById("Plan_Cerrar");
    const Vista = document.querySelector(".Planes_Vista_Toggle");
    const Biblioteca = document.querySelector(
      '[data-plan-vista="Biblioteca"]'
    );
    return {
      configBg: getComputedStyle(Config).backgroundColor,
      configBorder: getComputedStyle(Config).borderStyle,
      etiquetasBg: getComputedStyle(Etiquetas).backgroundColor,
      etiquetasBorder: getComputedStyle(Etiquetas).borderStyle,
      cerrarRadius: getComputedStyle(Cerrar).borderRadius,
      vistaTop: Math.round(Vista.getBoundingClientRect().top),
      configTop: Math.round(Config.getBoundingClientRect().top),
      vistaAncho: Math.round(
        Vista.getBoundingClientRect().width
      ),
      bibliotecaSinCorte:
        Biblioteca.scrollWidth <= Biblioteca.clientWidth,
      tieneTuerca: Boolean(Config.querySelector("svg"))
    };
  });
  expect(Barra.configBg).toBe("rgba(0, 0, 0, 0)");
  expect(Barra.configBorder).toBe("none");
  expect(Barra.etiquetasBg).toBe("rgba(0, 0, 0, 0)");
  expect(Barra.etiquetasBorder).toBe("none");
  expect(Barra.cerrarRadius).toBe("8px");
  expect(Barra.vistaAncho).toBeGreaterThanOrEqual(150);
  expect(Math.abs(Barra.vistaTop - Barra.configTop)).toBeLessThanOrEqual(4);
  expect(Barra.bibliotecaSinCorte).toBe(true);
  expect(Barra.tieneTuerca).toBe(true);
  await page.evaluate(() => {
    Abrir_Modal_Planes_Ayuda_Conceptual();
  });
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .toContainText("Meta");
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .toContainText("cuánto suma");
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .toContainText("métrica propia");
  await page.locator("#Planes_Ayuda_Conceptual_Overlay").click({
    position: { x: 8, y: 8 }
  });
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .toHaveClass(/Activo/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#Planes_Ayuda_Conceptual_Overlay"))
    .not.toHaveClass(/Activo/);
  await expect(page.locator("#Plan_Overlay")).toHaveClass(/Activo/);
  await page.click("[data-plan-universo-nuevo]");
  await expect(page.locator("#Planes_Objetivo_Modo_Avance"))
    .toBeVisible();
  await page.selectOption(
    "#Planes_Objetivo_Modo_Avance",
    "Sin_Metrica"
  );
  await expect(page.locator("#Planes_Objetivo_Form .Planes_Meta_Campo"))
    .toBeHidden();
  await page.selectOption("#Planes_Objetivo_Modo_Avance", "Metrica");
  await expect(page.locator("#Planes_Objetivo_Form .Planes_Meta_Campo"))
    .toBeVisible();
  await page.click("#Planes_Objetivo_Cancelar");

  const Layout_Desktop = await page.evaluate(() => {
    const Panel = document.querySelector(".Planes_Archivero_Panel");
    const Layout = document.querySelector(".Planes_Layout");
    const Rango_Resumen = document.querySelector(
      ".Planes_Resumen_Rango"
    );
    const Controles = Array.from(
      document.querySelectorAll(
        "#Planes_Capa_Select, #Planes_Filtro_Estado, " +
        "#Planes_Filtro_Etiqueta, #Planes_Busqueda, " +
        "#Planes_Vista_Toggle"
      )
    ).filter((El) =>
      El.getBoundingClientRect().height > 0
    );
    const Tops = Controles.map((El) =>
      Math.round(El.getBoundingClientRect().top)
    );
    return {
      panelAncho: Math.round(Panel.getBoundingClientRect().width),
      layoutDisplay: getComputedStyle(Layout).display,
      rangoResumen: Rango_Resumen?.textContent || "",
      controlesUnaLinea: Math.max(...Tops) - Math.min(...Tops) <= 4,
      gapCuerpo: getComputedStyle(
        document.querySelector(".Planes_Principal")
      ).gap,
      paddingResumen: getComputedStyle(
        document.querySelector(".Planes_Resumen")
      ).paddingBottom,
      margenRango: getComputedStyle(
        document.querySelector(".Planes_Resumen_Rango")
      ).marginTop,
      fuenteMetrica: getComputedStyle(
        document.querySelector(".Planes_Metrica_Valor")
      ).fontSize
    };
  });

  expect(Layout_Desktop.panelAncho).toBeGreaterThan(1000);
  expect(Layout_Desktop.panelAncho).toBeLessThanOrEqual(1160);
  expect(Layout_Desktop.layoutDisplay).toBe("block");
  expect(Layout_Desktop.rangoResumen).not.toContain("2026-01-01");
  expect(Layout_Desktop.rangoResumen).toContain("a");
  expect(Layout_Desktop.controlesUnaLinea).toBe(true);
  expect(Layout_Desktop.gapCuerpo).toBe("24px");
  expect(Layout_Desktop.paddingResumen).toBe("42px");
  expect(Layout_Desktop.margenRango).toBe("3px");
  expect(Layout_Desktop.fuenteMetrica).toBe("14px");

  await page.locator(".Planes_Resumen_Vacio").click();
  await page.locator(".Planes_Resumen_Editor")
    .fill("Resumen persistente del periodo");
  await page.locator(".Planes_Resumen_Acciones .Planes_Btn")
    .filter({ hasText: "Guardar" })
    .click();
  await expect(page.locator(".Planes_Resumen_Texto"))
    .toContainText("Resumen persistente del periodo");

  const Resumen_Guardado = await page.evaluate(() => {
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2")
    );
    const Periodo_Id = Planes_Periodo.UI.Periodo_Activo_Id;
    Planes_Periodo = {};
    Cargar_Estado();
    Render_Plan();
    return {
      storage:
        Estado.Planes_Periodo.Periodos[Periodo_Id].Resumen,
      render:
        document.querySelector(".Planes_Resumen_Texto")
          ?.textContent || ""
    };
  });
  expect(Resumen_Guardado.storage)
    .toBe("Resumen persistente del periodo");
  expect(Resumen_Guardado.render)
    .toContain("Resumen persistente del periodo");

  await page.evaluate(() => Cambiar_Idioma("en"));
  const Tipo_En = await page.locator(
    "#Planes_Capa_Select option:checked"
  ).innerText();
  expect(Tipo_En).toBe("Year");
  await page.evaluate(() => Cambiar_Idioma("es"));
  const Tipo_Es = await page.locator(
    "#Planes_Capa_Select option:checked"
  ).innerText();
  expect(Tipo_Es).toBe("Año");

  await page.click("#Planes_Btn_Etiquetas_Header");
  await expect(page.locator("#Planes_Etiquetas_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Etiqueta_Nombre"))
    .toHaveAttribute("placeholder", "Ej: Ideas");
  const Layout_Etiquetas = await page.evaluate(() => {
    const Panel = document.querySelector(
      "#Planes_Etiquetas_Overlay .Patron_Modal_Panel"
    );
    const Input = document.getElementById("Planes_Etiqueta_Nombre");
    return {
      usaSubPanel: Panel.classList.contains("Archivero_Sub_Panel"),
      radioInput: getComputedStyle(Input).borderRadius
    };
  });
  expect(Layout_Etiquetas.usaSubPanel).toBe(true);
  expect(Layout_Etiquetas.radioInput).toBe("8px");
  await page.fill("#Planes_Etiqueta_Nombre", "Lectura");
  await page.click("#Planes_Etiqueta_Agregar");
  await expect(
    page.locator(
      "#Planes_Etiquetas_Lista " +
      ".Archivero_Etiquetas_Gestion_Input"
    )
  ).toHaveValue("Lectura");
  await page.click("#Planes_Etiquetas_Guardar");
  await expect(page.locator("#Planes_Etiquetas_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.click("[data-plan-universo-nuevo]");
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator("#Planes_Objetivo_Overlay").click({
    position: { x: 8, y: 8 }
  });
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .toHaveClass(/Activo/);
  const Fuente_Vinculo = await page.locator(
    "#Planes_Objetivo_Vinculo"
  ).evaluate((El) => getComputedStyle(El).fontFamily);
  expect(Fuente_Vinculo).toContain("Segoe UI Emoji");
  await page.locator(".Planes_Vinculo_Boton").click();
  await expect(page.locator(".Planes_Vinculo_Menu")).toBeVisible();
  const Orden_Vinculo = await page.locator(
    ".Planes_Vinculo_Grupo_Titulo"
  ).allTextContents();
  expect(Orden_Vinculo.indexOf("Categorías"))
    .toBeLessThan(Orden_Vinculo.indexOf("Objetivos"));
  await page.locator(".Planes_Vinculo_Boton").click();
  await expect(page.locator(".Planes_Meta_Campo"))
    .toContainText("Meta");
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .not.toContainText("Métrica");
  const Layout_Meta_Unidad = await page.evaluate(() => {
    const Meta = document.querySelector(".Planes_Meta_Campo")
      .getBoundingClientRect();
    const Unidad = document.querySelector(".Planes_Unidad_Campo")
      .getBoundingClientRect();
    return {
      mismaLinea: Math.abs(Meta.top - Unidad.top) <= 2,
      metaIzquierda: Meta.left < Unidad.left
    };
  });
  expect(Layout_Meta_Unidad.mismaLinea).toBe(true);
  expect(Layout_Meta_Unidad.metaIzquierda).toBe(true);
  await expect(page.locator("#Planes_Objetivo_Unidad"))
    .not.toContainText("Páginas");
  await expect(page.locator("#Planes_Objetivo_Unidad"))
    .toContainText("Personalizado");
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .not.toContainText("Unidad personalizada");
  await expect(page.locator("#Planes_Objetivo_Unidad_Custom"))
    .toBeHidden();
  await page.selectOption("#Planes_Objetivo_Unidad", "Personalizado");
  await expect(page.locator("#Planes_Objetivo_Unidad_Custom"))
    .toBeVisible();
  const Unidad_Custom_Inline = await page.evaluate(() => {
    const Unidad = document.getElementById("Planes_Objetivo_Unidad")
      .getBoundingClientRect();
    const Custom = document.getElementById(
      "Planes_Objetivo_Unidad_Custom"
    ).getBoundingClientRect();
    return Math.abs(Unidad.top - Custom.top) <= 2;
  });
  expect(Unidad_Custom_Inline).toBe(true);
  await page.selectOption("#Planes_Objetivo_Unidad", "Horas");
  await page.locator("#Planes_Objetivo_Etiquetas .Etiqueta_Chip")
    .filter({ hasText: "Lectura" })
    .click();
  await page.fill("#Planes_Objetivo_Nombre", "Leer");
  await page.fill("#Planes_Objetivo_Target", "12");
  await page.fill(
    "#Planes_Objetivo_Descripcion",
    "Descripcion hover planes"
  );
  await page.click("#Planes_Objetivo_Guardar");

  const Modelo_Inicial = await page.evaluate(() => {
    const Padre = Object.values(Planes_Periodo.Objetivos)
      .find((Objetivo) =>
        Objetivo.Nombre === "Leer" &&
        !Planes_Objetivo_Padre_Id(Objetivo)
      );
    const Modelo = Asegurar_Modelo_Planes();
    const Periodo_Padre = Modelo.Periodos[Padre.Periodo_Id];
    const Periodo_Hijo = Planes_Crear_Periodos_Capa_Visibles(
      "Semestre"
    ).find((Periodo) =>
      Planes_Periodo_Contiene_Periodo(Periodo_Padre, Periodo)
    );
    const Hijo = Planes_Objetivo_Hijo_De(
      Padre.Id,
      Periodo_Hijo.Id
    ) || Planes_Crear_Objetivo_Silencioso(
      Periodo_Hijo.Id,
      {
        Nombre: Padre.Nombre,
        Descripcion: Padre.Descripcion,
        Emoji: Padre.Emoji,
        Target_Total: 6,
        Unidad: Padre.Unidad,
        Objetivo_Padre_Id: Padre.Id,
        Modo_Avance: Padre.Modo_Avance,
        Modo_Progreso: Padre.Modo_Progreso,
        Etiquetas_Ids: [...(Padre.Etiquetas_Ids || [])],
        Tags: [...(Padre.Tags || [])]
      }
    );
    Planes_Actualizar_Progreso(Padre);
    const Hijos = [Hijo];
    return {
      periodos: Object.keys(Planes_Periodo.Periodos).length,
      hijos: Hijos.length,
      leido: Padre.Progreso_Leido,
      targetHijo: Hijos[0]?.Target_Total || 0,
      padreId: Padre.Id,
      hijoId: Hijos[0]?.Id || null
    };
  });

  expect(Modelo_Inicial.periodos).toBeGreaterThan(20);
  expect(Modelo_Inicial.hijos).toBeGreaterThan(0);
  expect(Modelo_Inicial.leido).toBeGreaterThanOrEqual(2);
  expect(Modelo_Inicial.targetHijo).toBeGreaterThan(0);

  const Controles_Header = await page.evaluate(() => {
    const Controles = document.querySelector(".Planes_Controles");
    const Btn_Config = document.querySelector("#Planes_Config_Header");
    const Rect_Btn = Btn_Config.getBoundingClientRect();
    return {
      overflowHorizontal:
        Math.round(Controles.scrollWidth - Controles.clientWidth),
      botonConfigVisible: Rect_Btn.width > 0 && Rect_Btn.height > 0
    };
  });

  expect(Controles_Header.overflowHorizontal).toBeLessThanOrEqual(1);
  expect(Controles_Header.botonConfigVisible).toBe(true);

  const Texto_Tarjeta = await page.locator(".Planes_Objetivo_Card")
    .first()
    .innerText();
  expect(Texto_Tarjeta).toContain("%");
  expect(Texto_Tarjeta).toContain("horas");
  expect(Texto_Tarjeta).not.toContain("#Lectura");
  expect(Texto_Tarjeta).not.toContain("Horas");
  expect(Texto_Tarjeta).not.toContain("Mixto");

  const Layout_Tarjeta = await page.locator(".Planes_Objetivo_Card")
    .first()
    .evaluate((Card) => {
      const Nombre = Card.querySelector(".Planes_Objetivo_Nombre")
        .getBoundingClientRect();
      const Metrica = Card.querySelector(".Planes_Objetivo_Cantidad")
        .getBoundingClientRect();
      const Indicadores = Card
        .querySelector(".Planes_Objetivo_Indicadores")
        .getBoundingClientRect();
      const Rect = Card.getBoundingClientRect();
      return {
        metricaSangrada: Math.abs(Metrica.left - Nombre.left) <= 4,
        indicadoresAlBorde: Rect.right - Indicadores.right <= 4,
        indicadoresDerecha: Indicadores.left > Nombre.right
      };
    });

  expect(Layout_Tarjeta.metricaSangrada).toBe(true);
  expect(Layout_Tarjeta.indicadoresAlBorde).toBe(true);
  expect(Layout_Tarjeta.indicadoresDerecha).toBe(true);

  const Card_Objetivo = page.locator(".Planes_Objetivo_Card").first();
  const Caja_Card = await Card_Objetivo.boundingBox();
  const Mouse_X = Caja_Card.x + 24;
  const Mouse_Y = Caja_Card.y + 12;
  await page.mouse.move(Mouse_X, Mouse_Y);
  await page.waitForTimeout(2200);
  await expect(page.locator(".Evento_Abordaje_Popup"))
    .toContainText("Descripcion hover planes");
  const Popup_Pos = await page.locator(".Evento_Abordaje_Popup")
    .evaluate((Pop) => Pop.getBoundingClientRect().left);
  expect(Popup_Pos).toBeGreaterThan(Mouse_X);
  await page.mouse.move(5, 5);
  await expect(page.locator(".Evento_Abordaje_Popup"))
    .toHaveCount(0);

  await Card_Objetivo.click();
  await expect(Card_Objetivo).toHaveClass(/Expandida/);
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Estado");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Avance");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Mixto");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Realizado");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Falta");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle_Etiquetas")
  ).toContainText("#Lectura");
  await expect(Card_Objetivo)
    .not.toContainText("Etiqueta:");
  const Layout_Detalle = await Card_Objetivo.evaluate((Card) => {
    const Detalle = Card.querySelector(".Planes_Objetivo_Detalle");
    const Columnas = Detalle.querySelector(".Planes_Detalle_Columnas");
    const Footer = Detalle.querySelector(".Planes_Detalle_Footer");
    const Tabla = Detalle.querySelector(".Planes_Progreso_Tabla");
    const Pct = Card.querySelector(".Planes_Objetivo_Porcentaje");
    const Avance = Card.querySelector(".Planes_Avance_Btn");
    const Estado = Card.querySelector(".Planes_Objetivo_Estado");
    const Emoji = Card.querySelector(".Planes_Objetivo_Emoji");
    const Cantidad = Card.querySelector(".Planes_Objetivo_Cantidad");
    const Headers = Array.from(Tabla.querySelectorAll("th"))
      .map((Th) => Th.textContent.trim());
    const Headers_Todos = Array.from(Tabla.querySelectorAll("th"));
    const Celdas_Todas = Array.from(Tabla.querySelectorAll("td"));
    const Footer_Rect = Footer.getBoundingClientRect();
    const Tabla_Rect = Tabla.getBoundingClientRect();
    const Columnas_Rect = Columnas.getBoundingClientRect();
    const Pct_Rect = Pct.getBoundingClientRect();
    const Avance_Rect = Avance.getBoundingClientRect();
    const Estado_Rect = Estado.getBoundingClientRect();
    const Emoji_Rect = Emoji.getBoundingClientRect();
    const Etiquetas = Card.querySelector(
      ".Planes_Objetivo_Detalle_Etiquetas"
    ).getBoundingClientRect();
    return {
      columnasUna:
        getComputedStyle(Columnas).gridTemplateColumns
          .split(" ").length === 1,
      tablaAnchoCompleto:
        Math.abs(Tabla_Rect.left - Columnas_Rect.left) <= 2 &&
        Math.abs(Tabla_Rect.right - Columnas_Rect.right) <= 2,
      headers: Headers,
      headersCentrados: Headers_Todos.every((Th) =>
        getComputedStyle(Th).textAlign === "center"
      ),
      celdasCentradas: Celdas_Todas.every((Td) =>
        getComputedStyle(Td).textAlign === "center"
      ),
      footerDebajo: Footer_Rect.top > Columnas_Rect.bottom,
      etiquetasEnFooter:
        Etiquetas.top >= Footer_Rect.top &&
        Etiquetas.bottom <= Footer_Rect.bottom + 2,
      circuloPct:
        Math.round(Pct_Rect.width) === 32 &&
        Math.round(Pct_Rect.height) === 32,
      pctVerde: getComputedStyle(Pct).backgroundColor,
      avanceAlLado: Math.abs(Pct_Rect.top - Avance_Rect.top) <= 8,
      avanceALaDerecha:
        Avance_Rect.left > Estado_Rect.right &&
        Estado_Rect.left > Pct_Rect.right,
      avanceSeparado: Avance_Rect.left - Estado_Rect.right >= 8,
      estadoVisible:
        getComputedStyle(Estado).display !== "none" &&
        Math.round(Estado_Rect.width) === 28 &&
        Math.round(Estado_Rect.height) === 28,
      avanceCircular:
        Math.round(Avance_Rect.width) === 24 &&
        Math.round(Avance_Rect.height) === 24,
      avanceFlechaPesada:
        parseFloat(getComputedStyle(Avance).fontSize) >= 15 &&
        parseFloat(getComputedStyle(Avance).fontWeight) >= 700,
      avanceTitle: Avance.getAttribute("title"),
      avanceTexto: Avance.textContent.trim(),
      emojiGrande:
        Math.round(Emoji_Rect.width) >= 38 &&
        parseFloat(getComputedStyle(Emoji).fontSize) >= 30,
      cantidadOculta: !Cantidad,
      estadoVerde: getComputedStyle(
        Detalle.querySelector(".Planes_Dato_Valor_Activo")
      ).color,
      chipsEnFila: Array.from(
        Card.querySelectorAll(
          ".Planes_Detalle_Etiquetas_Chips .Etiqueta_Badge"
        )
      ).every((Chip, _, Lista) =>
        Math.abs(
          Chip.getBoundingClientRect().top -
          Lista[0].getBoundingClientRect().top
        ) <= 2
      ),
      etiquetaSinOvalo:
        getComputedStyle(
          Card.querySelector(
            ".Planes_Detalle_Etiquetas_Chips .Etiqueta_Badge"
          )
      ).backgroundColor === "rgba(0, 0, 0, 0)"
    };
  });
  expect(Layout_Detalle.columnasUna).toBe(true);
  expect(Layout_Detalle.tablaAnchoCompleto).toBe(true);
  expect(Layout_Detalle.headers).toEqual([
    "Estado",
    "Avance",
    "Origen",
    "Meta",
    "Realizado",
    "Falta"
  ]);
  expect(Layout_Detalle.headersCentrados).toBe(true);
  expect(Layout_Detalle.celdasCentradas).toBe(true);
  expect(Layout_Detalle.footerDebajo).toBe(true);
  expect(Layout_Detalle.etiquetasEnFooter).toBe(true);
  expect(Layout_Detalle.circuloPct).toBe(true);
  expect(Layout_Detalle.pctVerde).toBe("rgb(76, 175, 80)");
  expect(Layout_Detalle.avanceAlLado).toBe(true);
  expect(Layout_Detalle.avanceALaDerecha).toBe(true);
  expect(Layout_Detalle.avanceSeparado).toBe(true);
  expect(Layout_Detalle.estadoVisible).toBe(true);
  expect(Layout_Detalle.avanceCircular).toBe(true);
  expect(Layout_Detalle.avanceFlechaPesada).toBe(true);
  expect(Layout_Detalle.avanceTitle).toBe("Avance");
  expect(Layout_Detalle.avanceTexto).toBe("\u279c");
  expect(Layout_Detalle.emojiGrande).toBe(true);
  expect(Layout_Detalle.cantidadOculta).toBe(true);
  expect(Layout_Detalle.estadoVerde).toBe("rgb(76, 175, 80)");
  expect(Layout_Detalle.chipsEnFila).toBe(true);
  expect(Layout_Detalle.etiquetaSinOvalo).toBe(true);

  await Card_Objetivo.locator(
    '[data-plan-accion="registrar_avance"]'
  ).click();
  await expect(page.locator("#Planes_Avance_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Avance_Item"))
    .toContainText("Leer");
  await expect(page.locator("#Planes_Avance_Unidad"))
    .toContainText("horas");
  await page.fill("#Planes_Avance_Cantidad", "2");
  await page.click("#Planes_Avance_Guardar");
  await expect(page.locator("#Planes_Avance_Overlay"))
    .not.toHaveClass(/Activo/);
  const Avance_Registrado = await page.evaluate((padreId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Objetivos[padreId];
    return {
      manual: Padre.Progreso_Manual,
      registros: Object.values(Modelo.Avances || {})
        .filter((Avance) => Avance.Objetivo_Id === padreId).length
    };
  }, Modelo_Inicial.padreId);
  expect(Avance_Registrado.manual).toBeGreaterThanOrEqual(2);
  expect(Avance_Registrado.registros).toBeGreaterThanOrEqual(1);

  await Card_Objetivo.locator('[data-plan-accion="registro"]')
    .click();
  await expect(page.locator("#Planes_Registro_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("Manual");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("2 horas");
  await page.click("#Planes_Registro_Cerrar");

  await page.keyboard.press("m");
  await expect(page.locator("#Planes_Avance_Overlay"))
    .toHaveClass(/Activo/);
  await page.click("#Planes_Avance_Cancelar");

  const Sub_Modal_Id = await page.evaluate((padreId) => {
    const Id = Planes_Agregar_Subobjetivo(
      padreId,
      "Sub prueba modal"
    );
    const Sub = Asegurar_Modelo_Planes().Subobjetivos[Id];
    Sub.Target_Total = 3;
    Sub.Unidad = "Veces";
    Render_Plan();
    return Id;
  }, Modelo_Inicial.padreId);
  await Card_Objetivo.locator('[data-plan-accion="admin_subs"]')
    .click();
  await expect(page.locator("#Planes_Subobjetivos_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Subobjetivos_Titulo"))
    .toHaveText("2026");
  await expect(page.locator("#Planes_Subobjetivos_Resumen_Aportes"))
    .toContainText("Aportes totales");
  await expect(page.locator("#Planes_Subobjetivos_Form"))
    .toBeHidden();
  await expect(page.locator(
    "#Planes_Subobjetivos_Filtro_Vista option"
  )).toHaveCount(3);
  await page.click("#Planes_Subobjetivos_Agregar");
  await expect(page.locator("#Planes_Subobjetivo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Subobjetivo_Texto"))
    .toBeVisible();
  await page.fill("#Planes_Subobjetivo_Texto", "Sub desde +");
  await page.click("#Planes_Subobjetivo_Guardar");
  await expect(page.locator("#Planes_Subobjetivo_Overlay"))
    .not.toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Subobjetivos_Lista"))
    .toContainText("Sub desde +");
  await page.selectOption(
    "#Planes_Subobjetivos_Filtro_Vista",
    "Biblioteca"
  );
  await expect(page.locator("#Planes_Subobjetivos_Lista"))
    .toHaveClass(/Biblioteca/);
  const Sub_Item = page.locator(".Planes_Subobjetivo")
    .filter({ hasText: "Sub prueba modal" })
    .first();
  await Sub_Item.click({ button: "right" });
  await expect(page.locator(".Planes_Context_Menu"))
    .toContainText("Editar");
  await expect(page.locator(".Planes_Context_Menu"))
    .not.toContainText("Editar subobjetivo");
  await expect(page.locator(".Planes_Context_Menu"))
    .toContainText("Registrar avance");
  await expect(page.locator(".Planes_Context_Menu"))
    .toContainText("Marcar como realizado");
  await expect(page.locator(".Planes_Context_Menu"))
    .not.toContainText("Agregar subobjetivo");
  await expect(page.locator(".Planes_Context_Menu"))
    .not.toContainText("Desmarcar");
  await expect(page.locator(".Planes_Context_Menu"))
    .not.toContainText("Marcar hechas");
  const Sub_Hija = await page.evaluate((subId) => {
    Planes_Cerrar_Menus_Objetivo();
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Subobjetivos[subId];
    const Hija_Id = Planes_Agregar_Subobjetivo(
      Padre.Objetivo_Id,
      "Sub hija",
      "\uD83D\uDCC4",
      subId
    );
    Render_Modal_Planes_Subobjetivos();
    const Hija = Modelo.Subobjetivos[Hija_Id];
    return {
      padre: Hija?.Subobjetivo_Padre_Id || "",
      emoji: Hija?.Emoji || "",
      texto: Hija?.Texto || ""
    };
  }, Sub_Modal_Id);
  await expect(page.locator("#Planes_Subobjetivos_Lista"))
    .toContainText("Sub hija");
  expect(Sub_Hija.padre).toBe(Sub_Modal_Id);
  expect(Sub_Hija.emoji).toBe("\uD83D\uDCC4");
  expect(Sub_Hija.texto).toBe("Sub hija");
  await Sub_Item.click({ button: "right" });
  await page.click(
    '.Planes_Context_Menu [data-plan-sub-accion="editar"]'
  );
  await expect(page.locator("#Planes_Subobjetivo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Subobjetivo_Emoji"))
    .toBeVisible();
  await expect(page.locator(".Planes_Subobjetivo_Aporte_Campo"))
    .toBeVisible();
  await page.fill("#Planes_Subobjetivo_Emoji", "\uD83D\uDCD6");
  await page.fill("#Planes_Subobjetivo_Target", "4");
  await page.fill("#Planes_Subobjetivo_Aporte", "2");
  await page.click("#Planes_Subobjetivo_Guardar");
  await expect(page.locator("#Planes_Subobjetivo_Overlay"))
    .not.toHaveClass(/Activo/);
  const Sub_Editado = await page.evaluate((subId) => {
    const Sub = Asegurar_Modelo_Planes().Subobjetivos[subId];
    return {
      target: Sub.Target_Total,
      aporte: Sub.Aporte_Meta,
      emoji: Sub.Emoji
    };
  }, Sub_Modal_Id);
  expect(Sub_Editado.target).toBe(4);
  expect(Sub_Editado.aporte).toBe(2);
  expect(Sub_Editado.emoji).toBe("\uD83D\uDCD6");
  await page.click("#Planes_Subobjetivos_Cerrar");

  const Eliminado_Visible = await page.evaluate(() => {
    const Periodo = Planes_Periodo_Activo();
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Eliminar test",
      Emoji: "\u2705",
      Target_Total: 1,
      Unidad: "Horas"
    });
    Objetivo.Eliminado_Local = true;
    Render_Planes_Contenido();
    return document.getElementById("Plan_Cuerpo")
      ?.innerText.includes("Eliminar test");
  });

  expect(Eliminado_Visible).toBe(false);

  const Sin_Etiquetas_Id = await page.evaluate(() => {
    const Periodo = Planes_Periodo_Activo();
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Objetivo limpio",
      Emoji: "\u2705",
      Target_Total: 1,
      Unidad: "Horas"
    });
    Render_Planes_Contenido();
    return Objetivo.Id;
  });
  const Card_Sin_Etiquetas = page.locator(
    `[data-plan-objetivo-id="${Sin_Etiquetas_Id}"]`
  );
  await Card_Sin_Etiquetas.click();
  await expect(Card_Sin_Etiquetas)
    .not.toContainText("Sin etiquetas");
  await expect(Card_Sin_Etiquetas)
    .not.toContainText("Etiqueta:");

  await expect(page.locator(".Planes_Objetivo_Menu_Btn")).toHaveCount(0);
  await page.locator(".Planes_Objetivo_Card")
    .first()
    .click({ button: "right" });
  await expect(page.locator(".Planes_Context_Menu"))
    .toContainText("Administrar subobjetivos");
  await expect(page.locator(".Planes_Context_Menu"))
    .not.toContainText("Agregar subobjetivo");
  await page.click(
    '.Planes_Context_Menu [data-plan-accion="admin_subs"]'
  );
  await expect(page.locator("#Planes_Subobjetivos_Overlay"))
    .toHaveClass(/Activo/);
  await page.click("#Planes_Subobjetivos_Cerrar");

  const Vinculos = await page.evaluate((padreId) => {
    const Objetivo_Semanal = Objetivos.find((Objetivo) =>
      Objetivo.Id === "Obj_Leer"
    );
    const Sub_Id = Agregar_Subobjetivo_Semana(
      Objetivo_Semanal,
      "Semana"
    );
    const Sub = Obtener_Subobjetivos_Semana(
      Objetivo_Semanal,
      true
    ).find((Item) => Item.Id === Sub_Id);
    Sub.Texto = "Capitulo local";
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Objetivos[padreId];
    Abrir_Modal_Planes_Objetivo(Padre.Periodo_Id, Padre.Id);
    const Select = document.getElementById("Planes_Objetivo_Vinculo");
    const Antes = Array.from(Select.options)
      .map((Opt) => Opt.textContent);
    Select.value = `ToggleSub|${Objetivo_Semanal.Id}`;
    Select.dispatchEvent(new Event("change", { bubbles: true }));
    const Despues = Array.from(Select.options)
      .map((Opt) => Opt.textContent);
    Cerrar_Modal_Planes_Objetivo();
    return { Antes, Despues };
  }, Modelo_Inicial.padreId);

  expect(Vinculos.Antes.some((Texto) =>
    Texto.includes("+") && Texto.includes("Leer")
  )).toBe(true);
  expect(Vinculos.Antes.join(" ")).not.toContain("Capitulo local");
  expect(Vinculos.Despues.join(" ")).toContain("Capitulo local");

  await page.evaluate((padreId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Objetivos[padreId];
    Abrir_Modal_Planes_Objetivo(Padre.Periodo_Id, Padre.Id);
  }, Modelo_Inicial.padreId);
  await page.locator(".Planes_Vinculo_Boton").click();
  await page.locator(
    '.Planes_Vinculo_Item[data-valor="ToggleSub|Obj_Leer"]'
  ).click();
  await expect(page.locator(".Planes_Vinculo_Menu")).toBeVisible();
  await expect(page.locator(
    '.Planes_Vinculo_Item[data-valor^="Subobjetivo|Obj_Leer|"]'
  )).toContainText("Capitulo local");
  await page.locator(
    '.Planes_Vinculo_Item[data-valor="ToggleSub|Obj_Leer"]'
  ).click();
  await expect(page.locator(
    '.Planes_Vinculo_Item[data-valor^="Subobjetivo|Obj_Leer|"]'
  )).toHaveCount(0);
  await page.click("#Planes_Objetivo_Cancelar");

  await page.locator('[data-plan-vista="Lista"]').click();
  const Texto_Lista = await page.locator(".Planes_Objetivo_Card")
    .first()
    .innerText();
  expect(Texto_Lista).toContain("Leer");
  expect(Texto_Lista).not.toContain("12");

  await page.locator('[data-plan-vista="Biblioteca"]').click();
  await expect(page.locator(".Planes_Objetivos"))
    .toHaveClass(/Biblioteca/);
  await page.evaluate(() => {
    Asegurar_Modelo_Planes().UI.Objetivos_Expandidos = {};
    Render_Planes_Contenido();
  });
  const Card_Biblioteca = page.locator(
    ".Planes_Objetivo_Card.Vista_Biblioteca"
  ).first();
  await expect(Card_Biblioteca.locator(".Planes_Objetivo_Estado"))
    .toBeVisible();
  await expect(Card_Biblioteca.locator(".Planes_Avance_Btn"))
    .toHaveCount(0);
  await Card_Biblioteca.click({ button: "right" });
  await expect(page.locator(
    '.Planes_Context_Menu [data-plan-accion="registrar_avance"]'
  )).toContainText("Registrar avance");
  await page.evaluate(() => {
    Planes_Cerrar_Menus_Objetivo();
  });
  await expect(Card_Biblioteca.locator(".Planes_Fuente_Badge"))
    .toHaveCount(0);
  await expect(Card_Biblioteca)
    .not.toContainText("Mixto");
  await Card_Biblioteca.click({ modifiers: ["Control"] });
  await expect(page.locator(".Planes_Multi_Acciones"))
    .toContainText("1 objetivo");
  await page.locator(".Planes_Multi_Acciones")
    .getByText("Cancelar")
    .click();
  await Card_Biblioteca.click();
  await expect(Card_Biblioteca).toHaveClass(/Expandida/);
  await expect(
    Card_Biblioteca.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Estado");
  await expect(
    Card_Biblioteca.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Avance");

  const Vacio_Biblioteca = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Periodo_Anterior = Modelo.UI.Periodo_Activo_Id;
    const Vacio = Planes_Crear_Periodo(
      Modelo,
      "Custom",
      "2027-01-01",
      "2027-01-31",
      null,
      1000
    );
    Modelo.UI.Periodo_Activo_Id = Vacio.Id;
    Modelo.UI.Filtro_Tipo = "Custom";
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Vista = "Biblioteca";
    Render_Planes_Controles();
    Render_Planes_Contenido();
    const Lista = document.querySelector(
      ".Planes_Objetivos.Biblioteca"
    );
    const Vacio_El = Lista?.querySelector(".Planes_Vacio");
    const Datos = {
      texto: Vacio_El?.textContent || "",
      anchoLista: Math.round(
        Lista?.getBoundingClientRect().width || 0
      ),
      anchoVacio: Math.round(
        Vacio_El?.getBoundingClientRect().width || 0
      )
    };
    delete Modelo.Periodos[Vacio.Id];
    Modelo.UI.Periodo_Activo_Id = Periodo_Anterior;
    Render_Planes_Controles();
    Render_Planes_Contenido();
    return Datos;
  });
  expect(Vacio_Biblioteca.texto)
    .toContain("No hay objetivos visibles");
  expect(Vacio_Biblioteca.anchoVacio)
    .toBeGreaterThan(Vacio_Biblioteca.anchoLista * 0.9);

  const Progreso_Submetrica = await page.evaluate((padreId) => {
    Planes_Agregar_Subobjetivo(padreId, "Capitulo metricado");
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Objetivos[padreId];
    Padre.Target_Total = Padre.Target_Total || 12;
    const Sub = Object.values(Modelo.Subobjetivos)
      .find((Item) =>
        Item.Objetivo_Id === padreId &&
        Item.Texto === "Capitulo metricado"
      );
    Sub.Target_Total = 10;
    Sub.Unidad = "Veces";
    Sub.Progreso_Manual = 5;
    Sub.Aporte_Meta = 0;
    Planes_Actualizar_Progreso(Padre);
    return {
      progresoSub: Padre.Progreso_Subobjetivos,
      progresoTotal: Padre.Progreso_Total,
      metaSub: Planes_Formatear_Meta_Subobjetivo(Sub)
    };
  }, Modelo_Inicial.padreId);

  expect(Progreso_Submetrica.progresoSub).toBe(0);
  expect(Progreso_Submetrica.progresoTotal)
    .toBeGreaterThanOrEqual(0);
  expect(Progreso_Submetrica.metaSub).toContain("5/10");

  const Progreso_Unidades = await page.evaluate(() => {
    const Periodo = Planes_Periodo_Activo();
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Leer 50 libros",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Sub_A = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro A"
    );
    const Sub_B = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro B"
    );
    Planes_Toggle_Subobjetivo(Sub_A, true);
    Planes_Toggle_Subobjetivo(Sub_B, true);
    Planes_Actualizar_Progreso(Objetivo);
    const Modelo = Asegurar_Modelo_Planes();
    const Resultado = {
      metricaA: Modelo.Subobjetivos[Sub_A].Target_Total,
      metricaB: Modelo.Subobjetivos[Sub_B].Target_Total,
      aporteA: Modelo.Subobjetivos[Sub_A].Aporte_Meta,
      aporteB: Modelo.Subobjetivos[Sub_B].Aporte_Meta,
      metaA: Planes_Formatear_Meta_Subobjetivo(
        Modelo.Subobjetivos[Sub_A]
      ),
      legacyAporte: Normalizar_Subobjetivo_Plan({
        Objetivo_Id: Objetivo.Id,
        Texto: "Legacy"
      }).Aporte_Meta,
      aporteCero: Normalizar_Subobjetivo_Plan({
        Objetivo_Id: Objetivo.Id,
        Texto: "Cero",
        Aporte_Meta: 0
      }).Aporte_Meta,
      progresoSub: Objetivo.Progreso_Subobjetivos,
      progresoTotal: Objetivo.Progreso_Total,
      pendiente: Objetivo.Target_Pendiente,
      estado: Objetivo.Estado
    };
    const Ids_A_Limpiar = new Set(
      Object.values(Modelo.Objetivos)
        .filter((Item) => Item.Nombre === "Leer 50 libros")
        .map((Item) => Item.Id)
    );
    Object.values(Modelo.Subobjetivos)
      .filter((Sub) => Ids_A_Limpiar.has(Sub.Objetivo_Id))
      .forEach((Sub) => {
        delete Modelo.Subobjetivos[Sub.Id];
      });
    Ids_A_Limpiar.forEach((Id) => {
      delete Modelo.Objetivos[Id];
    });
    Render_Planes_Contenido();
    return Resultado;
  });

  expect(Progreso_Unidades).toEqual({
    metricaA: 0,
    metricaB: 0,
    aporteA: 1,
    aporteB: 1,
    metaA: "+1 libros",
    legacyAporte: 1,
    aporteCero: 0,
    progresoSub: 2,
    progresoTotal: 2,
    pendiente: 48,
    estado: "Activo"
  });

  const Progreso_Fechado = await page.evaluate(() => {
    let Modelo = Asegurar_Modelo_Planes();
    const Fecha_Anual = "2026-04-08";
    const Fecha_Hijo = "2026-04-09";
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) =>
        Periodo.Tipo === "Anio" &&
        Periodo.Inicio === "2026-01-01"
      );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros fecha",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Sub_Anual_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro anual abril"
    );
    Modelo = Asegurar_Modelo_Planes();
    const Sub_Anual = Modelo.Subobjetivos[Sub_Anual_Id];
    if (!Sub_Anual) {
      return { error: "No se creo el subobjetivo anual" };
    }
    Sub_Anual.Hecha = true;
    Sub_Anual.Estado = "Cumplido";
    Sub_Anual.Fecha_Fin = Fecha_Anual;
    Sub_Anual.Aporte_Meta = 1;
    const Sub_Hijo_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro hijo abril"
    );
    Modelo = Asegurar_Modelo_Planes();
    const Sub_Hijo = Modelo.Subobjetivos[Sub_Hijo_Id];
    if (!Sub_Hijo) {
      return { error: "No se creo el subobjetivo mensual" };
    }
    Sub_Hijo.Hecha = true;
    Sub_Hijo.Estado = "Cumplido";
    Sub_Hijo.Fecha_Fin = Fecha_Hijo;
    Sub_Hijo.Aporte_Meta = 1;
    Planes_Actualizar_Progreso(Objetivo);

    const Periodo_Por_Tipo = (Tipo, Fecha) => {
      Planes_Crear_Periodos_Capa_Visibles(Tipo);
      Modelo = Asegurar_Modelo_Planes();
      return Object.values(Modelo.Periodos).find((Periodo) =>
        Periodo.Tipo === Tipo &&
        Planes_Periodo_Contiene_Fecha(Periodo, Fecha)
      );
    };
    const Hijo_Por_Tipo = (Tipo) => {
      const Periodo = Periodo_Por_Tipo(Tipo, Fecha_Hijo);
      if (!Periodo) return null;
      const Hijo = Planes_Crear_Objetivo_Silencioso(
        Periodo.Id,
        {
          Nombre: "Libros fecha",
          Emoji: "\uD83D\uDCDA",
          Target_Total: 50,
          Unidad: "Personalizado",
          Unidad_Custom: "libros",
          Objetivo_Padre_Id: Objetivo.Id
        }
      );
      Planes_Importar_Subs_En_Objetivo(Hijo, Periodo);
      Planes_Actualizar_Progreso(Hijo);
      return Hijo;
    };
    const Semestre = Hijo_Por_Tipo("Semestre");
    const Trimestre = Hijo_Por_Tipo("Trimestre");
    const Mes = Hijo_Por_Tipo("Mes");
    const Semana = Hijo_Por_Tipo("Semana");
    if (!Semestre || !Trimestre || !Mes || !Semana) {
      return { error: "No se crearon los objetivos hijos" };
    }

    Modelo = Asegurar_Modelo_Planes();
    const Resultado = {
      anual: Modelo.Objetivos[Objetivo.Id].Progreso_Subobjetivos,
      semestre: Semestre.Progreso_Subobjetivos,
      trimestre: Trimestre.Progreso_Subobjetivos,
      mes: Mes.Progreso_Subobjetivos,
      semana: Semana.Progreso_Subobjetivos
    };
    const Ids_A_Limpiar = new Set(
      Object.values(Modelo.Objetivos)
        .filter((Item) => Item.Nombre === "Libros fecha")
        .map((Item) => Item.Id)
    );
    Object.values(Modelo.Subobjetivos)
      .filter((Sub) => Ids_A_Limpiar.has(Sub.Objetivo_Id))
      .forEach((Sub) => {
        delete Modelo.Subobjetivos[Sub.Id];
      });
    Ids_A_Limpiar.forEach((Id) => {
      delete Modelo.Objetivos[Id];
    });
    Render_Planes_Contenido();
    return { error: "", resultado: Resultado };
  });

  expect(Progreso_Fechado.error).toBe("");
  expect(Progreso_Fechado.resultado).toEqual({
    anual: 1,
    semestre: 2,
    trimestre: 2,
    mes: 2,
    semana: 2
  });

  const Subestado = await page.evaluate(({ padreId, hijoId }) => {
    Planes_Agregar_Subobjetivo(padreId, "Capitulo 1");
    Planes_Importar_Subs(hijoId);
    const Subs = Object.values(Planes_Periodo.Subobjetivos);
    const Sub_Hijo = Subs.find((Sub) =>
      Sub.Objetivo_Id === hijoId && Sub.Parent_Subobjetivo_Id
    );
    Planes_Toggle_Subobjetivo(Sub_Hijo.Id, true);
    const Sub_Padre = Planes_Periodo
      .Subobjetivos[Sub_Hijo.Parent_Subobjetivo_Id];
    return {
      hijoImportado: Sub_Hijo.Importado,
      padreHecha: Sub_Padre.Hecha
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });

  expect(Subestado.hijoImportado).toBe(true);
  expect(Subestado.padreHecha).toBe(false);

  await page.evaluate(({ hijoId }) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Hijo = Modelo.Objetivos[hijoId];
    const Periodo = Modelo.Periodos[Hijo.Periodo_Id];
    Planes_Activar_Periodo_Desde_Coleccion(Periodo);
    Modelo.UI.Vista = "Tarjetas";
    Render_Planes_Contenido();
  }, { hijoId: Modelo_Inicial.hijoId });
  const Conteo_Antes_Eliminar = await page
    .locator(".Planes_Objetivo_Card")
    .count();
  expect(Conteo_Antes_Eliminar).toBeGreaterThan(0);
  await page.locator(".Planes_Objetivo_Card")
    .first()
    .click({ button: "right" });
  await page.click(
    '.Planes_Context_Menu [data-plan-accion="eliminar"]'
  );
  await expect(page.locator("#Dialogo_Ayuda_Btn"))
    .toBeHidden();
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "incluidos padres" })
    .click();
  await expect(page.locator(".Undo_Toast_Boton").first())
    .toContainText("Deshacer");
  const Eliminacion_Jerarquica = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local,
      conteo: document.querySelectorAll(
        ".Planes_Objetivo_Card"
      ).length
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Eliminacion_Jerarquica.padre).toBe(true);
  expect(Eliminacion_Jerarquica.hijo).toBe(true);
  expect(Eliminacion_Jerarquica.conteo).toBe(0);
  await page.locator(".Undo_Toast_Boton").first().click();
  const Restaurado_Jerarquico = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local,
      conteo: document.querySelectorAll(
        ".Planes_Objetivo_Card"
      ).length
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Restaurado_Jerarquico.padre).not.toBe(true);
  expect(Restaurado_Jerarquico.hijo).not.toBe(true);
  expect(Restaurado_Jerarquico.conteo).toBeGreaterThan(0);

  await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Viejo = Planes_Crear_Periodo(
      Modelo,
      "Custom",
      "2026-01-01",
      "2026-01-31",
      null,
      999
    );
    Planes_Crear_Objetivo_Silencioso(Viejo.Id, {
      Nombre: "Atrasado",
      Emoji: "\u2705",
      Target_Total: 3,
      Unidad: "Horas"
    });
    Abrir_Modal_Planes_Vencidos();
  });

  await expect(page.locator("#Planes_Vencidos_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Vencidos_Lista"))
    .toContainText("Atrasado");

  expect(errores).toEqual([]);
});

test("Registro de planes permite editar y borrar avances",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Objetivo_Id = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Tipo === "Anio");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros registro",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Modo_Progreso: "Manual"
    });
    const Avance_Id = Crear_Id_Avance_Plan();
    Modelo.Avances[Avance_Id] = Normalizar_Avance_Plan({
      Id: Avance_Id,
      Objetivo_Id: Objetivo.Id,
      Fuente: "Manual",
      Cantidad: 2,
      Unidad: "libros",
      Fecha: "2026-04-19",
      Hora: "15:34",
      Fecha_Hora: "2026-04-19T15:34"
    });
    Objetivo.Progreso_Manual = 2;
    Planes_Actualizar_Progreso(Objetivo);
    Render_Plan();
    Abrir_Modal_Planes_Registro(Objetivo.Id);
    return Objetivo.Id;
  });

  await expect(page.locator("#Planes_Registro_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("Manual");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("2 libros");
  await expect(page.locator(
    '[data-plan-registro-editar="Avance"]'
  )).toHaveCount(1);
  await expect(page.locator(
    '[data-plan-registro-eliminar="Avance"]'
  )).toHaveCount(1);

  await page.locator('[data-plan-registro-editar="Avance"]')
    .click();
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Guardar" })
    .click();
  await expect(page.locator(".Undo_Toast")).toHaveCount(0);

  await page.locator('[data-plan-registro-editar="Avance"]')
    .click();
  await page.fill("#Dialogo_Input_Campo", "3");
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Guardar" })
    .click();
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("3 libros");
  const Avance_Editado = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[objetivoId];
    const Avance = Object.values(Modelo.Avances || {})
      .find((Item) => Item.Objetivo_Id === objetivoId);
    return {
      manual: Objetivo.Progreso_Manual,
      cantidad: Avance?.Cantidad || 0
    };
  }, Objetivo_Id);
  expect(Avance_Editado.manual).toBe(3);
  expect(Avance_Editado.cantidad).toBe(3);

  await page.locator('[data-plan-registro-eliminar="Avance"]')
    .click();
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Eliminar" })
    .click();
  await expect(page.locator("#Planes_Registro_Cuerpo .Planes_Vacio"))
    .toBeVisible();
  const Avance_Borrado = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[objetivoId];
    return {
      manual: Objetivo.Progreso_Manual,
      registros: Object.values(Modelo.Avances || {})
        .filter((Avance) => Avance.Objetivo_Id === objetivoId).length
    };
  }, Objetivo_Id);
  expect(Avance_Borrado.manual).toBe(0);
  expect(Avance_Borrado.registros).toBe(0);

  await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[objetivoId];
    Objetivo.Progreso_Manual = 6;
    Objetivo.Actualizado_En = "2026-04-19T15:34:00";
    Planes_Actualizar_Progreso(Objetivo);
    Render_Plan();
    Render_Modal_Planes_Registro(Objetivo);
  }, Objetivo_Id);
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("Manual previo");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("6 libros");
  await page.locator(
    '[data-plan-registro-editar="Manual_Previo"]'
  ).click();
  await page.fill("#Dialogo_Input_Campo", "4");
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Guardar" })
    .click();
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("4 libros");
  const Manual_Previo_Editado = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    return Modelo.Objetivos[objetivoId].Progreso_Manual;
  }, Objetivo_Id);
  expect(Manual_Previo_Editado).toBe(4);

  await page.locator(
    '[data-plan-registro-eliminar="Manual_Previo"]'
  ).click();
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Eliminar" })
    .click();
  await expect(page.locator("#Planes_Registro_Cuerpo .Planes_Vacio"))
    .toBeVisible();
  const Manual_Previo_Borrado = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    return Modelo.Objetivos[objetivoId].Progreso_Manual;
  }, Objetivo_Id);
  expect(Manual_Previo_Borrado).toBe(0);
  expect(errores).toEqual([]);
});

test("Importar desde padres evita objetivos repetidos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Subperiodo_Activo = 1;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Datos = [
      ["Cine", "\uD83C\uDFAC"],
      ["Libros", "\uD83D\uDCDA"],
      ["Musica", "\uD83C\uDFB5"],
      ["Escritura", "\u270D\uFE0F"],
      ["Proyecto", "\uD83D\uDCCC"]
    ];
    const Objetivos = Datos.map(([Nombre, Emoji]) =>
      Planes_Crear_Objetivo_Silencioso(Anio.Id, {
        Nombre,
        Emoji,
        Target_Total: 10,
        Unidad: "Horas"
      })
    );

    Planes_Bajar_Objetivo_A_Capa(Objetivos[0].Id, "Semestre");
    const Candidatos = Planes_Candidatos_Importacion_Capa("Mes")
      .filter((Item) => Item.Periodo.Inicio === "2026-01-01");
    Planes_Mostrar_Dialogo_Importar_Padres(Candidatos);
  });

  await expect(page.locator(".Planes_Importar_Cuerpo"))
    .not.toContainText("Eleg");
  await expect(page.locator(
    ".Planes_Importar_Opciones [data-plan-importar-todos]"
  )).toHaveCount(0);
  await expect(page.locator(
    ".Planes_Importar_Seleccion [data-plan-importar-todos]"
  )).toHaveCount(1);
  await expect(page.locator(
    ".Planes_Importar_Modo_Campo > span"
  )).toHaveText("Forma de importar");
  const Layout_Importar = await page
    .locator(".Planes_Importar_Cuerpo")
    .evaluate((Cuerpo) => {
      const Label = Cuerpo.querySelector(
        ".Planes_Importar_Modo_Campo > span"
      );
      const Select = Cuerpo.querySelector(
        "[data-plan-importar-modo-select]"
      );
      const Lista = Cuerpo.querySelector(".Planes_Importar_Lista");
      const Acciones = Cuerpo.querySelector(
        ".Planes_Importar_Seleccion"
      );
      const Label_Rect = Label.getBoundingClientRect();
      const Select_Rect = Select.getBoundingClientRect();
      const Lista_Rect = Lista.getBoundingClientRect();
      const Acciones_Rect = Acciones.getBoundingClientRect();
      return {
        labelPeso: Number(getComputedStyle(Label).fontWeight),
        labelArriba: Label_Rect.bottom <= Select_Rect.top + 2,
        accionesDebajo: Acciones_Rect.top > Lista_Rect.bottom,
        accionesIzquierda:
          Math.abs(Acciones_Rect.left - Lista_Rect.left) <= 2
      };
    });
  expect(Layout_Importar.labelPeso).toBeLessThan(700);
  expect(Layout_Importar.labelArriba).toBe(true);
  expect(Layout_Importar.accionesDebajo).toBe(true);
  expect(Layout_Importar.accionesIzquierda).toBe(true);

  const Enero = page.locator(".Planes_Importar_Item")
    .filter({ hasText: "Enero" });
  await expect(Enero).toHaveCount(1);
  await expect(page.locator("[data-plan-importar-fijar]"))
    .toHaveCount(0);
  await expect(Enero.locator("[data-plan-importar-fijar-periodo]"))
    .toHaveCount(1);
  await expect(Enero.locator(".Planes_Importar_Fijar_Periodo"))
    .toContainText("Fijar");

  await expect(
    Enero.locator(".Planes_Importar_Objetivo_Nombre")
      .filter({ hasText: "Cine" })
  ).toHaveCount(1);
  await expect(
    Enero.locator(".Planes_Importar_Objetivo_Nombre")
  ).toHaveCount(5);
  await expect(Enero.locator(".Planes_Importar_Objetivos_Conteo"))
    .toHaveText("5/5");

  const Fuente_Cine = await Enero
    .locator(".Planes_Importar_Objetivo")
    .filter({ hasText: "Cine" })
    .locator("[data-plan-importar-objetivo]")
    .evaluate((Input) => {
      const Modelo = window.Asegurar_Modelo_Planes();
      const Objetivo = Modelo.Objetivos[
        Input.dataset.planImportarObjetivo
      ];
      const Periodo = Modelo.Periodos[Objetivo.Periodo_Id];
      return Periodo.Tipo;
    });
  expect(Fuente_Cine).toBe("Anio");

  const Detalle_Abierto = await Enero
    .locator(".Planes_Importar_Objetivos_Detalle")
    .evaluate((Detalle) => Detalle.open);
  expect(Detalle_Abierto).toBe(false);

  await Enero.locator(".Planes_Importar_Objetivos_Detalle summary")
    .click();
  await Enero.locator(".Planes_Importar_Objetivo")
    .filter({ hasText: "Libros" })
    .click();
  await expect(Enero.locator(".Planes_Importar_Objetivos_Conteo"))
    .toHaveText("4/5");

  const Estado_Periodo = await Enero
    .locator("[data-plan-importar-periodo]")
    .evaluate((Input) => ({
      checked: Input.checked,
      indeterminate: Input.indeterminate
    }));
  expect(Estado_Periodo).toEqual({
    checked: false,
    indeterminate: true
  });
  expect(errores).toEqual([]);
});

test("Importar desde padres trae subobjetivos del periodo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros fechados",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 12,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    const Grupo_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Plan abril"
    );
    const Abril_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro abril",
      "\uD83D\uDCD8",
      Grupo_Id
    );
    const Febrero_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro febrero"
    );
    const Sin_Fecha_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro sin fecha"
    );
    const Modelo_Subs = Asegurar_Modelo_Planes();
    const Grupo = Modelo_Subs.Subobjetivos[Grupo_Id];
    const Abril = Modelo_Subs.Subobjetivos[Abril_Id];
    const Febrero = Modelo_Subs.Subobjetivos[Febrero_Id];
    const Sin_Fecha = Modelo_Subs.Subobjetivos[Sin_Fecha_Id];
    Object.assign(Abril, {
      Fecha_Fin: "2026-04-20",
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 0,
      Hecha: false,
      Estado: "Activo"
    });
    Object.assign(Febrero, {
      Fecha_Fin: "2026-02-10",
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 1,
      Hecha: true,
      Estado: "Cumplido"
    });
    Object.assign(Sin_Fecha, {
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 1,
      Hecha: true,
      Estado: "Cumplido"
    });
    Grupo.Aporte_Meta = 0;
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Trimestres.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Proporcional" }
    );
    const Subs_De = (Indice) => {
      const Hijo = Planes_Objetivo_Hijo_De(
        Padre.Id,
        Trimestres[Indice].Id
      );
      return Planes_Subobjetivos_De_Objetivo(Hijo.Id)
        .filter((Sub) => !Sub.Eliminado_Local)
        .map((Sub) => ({
          Id: Sub.Id,
          Texto: Sub.Texto,
          Fecha_Fin: Sub.Fecha_Fin,
          Hecha: Sub.Hecha,
          Parent: Sub.Parent_Subobjetivo_Id,
          Padre_Local: Sub.Subobjetivo_Padre_Id
        }));
    };
    return {
      Resumen,
      Q1: Subs_De(0),
      Q2: Subs_De(1),
      Q3: Subs_De(2)
    };
  });

  expect(Resultado.Resumen.Creados).toBe(4);
  expect(Resultado.Resumen.Subobjetivos).toBeGreaterThan(0);
  expect(Resultado.Q1.map((Sub) => Sub.Texto))
    .toEqual(["Libro febrero"]);
  expect(Resultado.Q2.map((Sub) => Sub.Texto))
    .toEqual(["Plan abril", "Libro abril"]);
  const Abril_Importado = Resultado.Q2.find((Sub) =>
    Sub.Texto === "Libro abril"
  );
  const Grupo_Importado = Resultado.Q2.find((Sub) =>
    Sub.Texto === "Plan abril"
  );
  expect(Abril_Importado.Fecha_Fin).toBe("2026-04-20");
  expect(Abril_Importado.Hecha).toBe(false);
  expect(Abril_Importado.Padre_Local)
    .toBeTruthy();
  expect(Abril_Importado.Padre_Local)
    .toBe(Grupo_Importado.Id);
  expect(Resultado.Q2.map((Sub) => Sub.Texto))
    .not.toContain("Libro sin fecha");
  expect(Resultado.Q3.map((Sub) => Sub.Texto)).toEqual([]);
  expect(errores).toEqual([]);
});

test("Actualizar periodos refresca importados de toda la capa",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Anio_Todos = true;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros heredados",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 12,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    const Febrero_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro febrero"
    );
    const Abril_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro abril"
    );
    const Modelo_Subs = Asegurar_Modelo_Planes();
    Object.assign(Modelo_Subs.Subobjetivos[Febrero_Id], {
      Fecha_Fin: "2026-02-10",
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 0,
      Hecha: false,
      Estado: "Activo"
    });
    Object.assign(Modelo_Subs.Subobjetivos[Abril_Id], {
      Fecha_Fin: "2026-04-20",
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 0,
      Hecha: false,
      Estado: "Activo"
    });
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    Planes_Importar_Objetivos_Padres_A_Periodos(
      Trimestres.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Completo" }
    );

    Object.assign(Modelo_Subs.Objetivos[Padre.Id], {
      Nombre: "Libros actualizados",
      Target_Total: 16,
      Actualizado_En: "2026-05-01T12:00:00.000Z"
    });
    Object.assign(Modelo_Subs.Subobjetivos[Febrero_Id], {
      Progreso_Inicial: 1,
      Hecha: true,
      Estado: "Cumplido"
    });
    Object.assign(Modelo_Subs.Subobjetivos[Abril_Id], {
      Progreso_Inicial: 1,
      Hecha: true,
      Estado: "Cumplido"
    });
    window.__Semaplan_Actualizar_Periodos_Test = {
      Padre_Id: Padre.Id,
      Trimestre_Ids: Trimestres.map((Periodo) => Periodo.Id)
    };
    Render_Plan();
  });

  const Botones = page.locator("[data-plan-periodo-actualizar]");
  await expect(Botones).toHaveCount(4);
  await expect(Botones.first()).toHaveText("\u21bb");
  await expect(Botones.first()).toBeEnabled();

  await Botones.nth(1).click();
  await expect(page.locator("#Dialogo_Overlay")).toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("Cambios observados");
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Primario")
    .click();
  await expect(page.locator(".Planes_Importar_Modal")).toHaveCount(0);

  const Resultado = await page.evaluate(() => {
    const Datos = window.__Semaplan_Actualizar_Periodos_Test;
    const Hijo_De = (Indice) => Planes_Objetivo_Hijo_De(
      Datos.Padre_Id,
      Datos.Trimestre_Ids[Indice]
    );
    const Sub_De = (Objetivo, Texto) =>
      Planes_Subobjetivos_De_Objetivo(Objetivo.Id)
        .find((Sub) => !Sub.Eliminado_Local && Sub.Texto === Texto);
    const Hijo_Q1 = Hijo_De(0);
    const Hijo_Q2 = Hijo_De(1);
    const Importados = Datos.Trimestre_Ids
      .map((Periodo_Id) => Planes_Objetivo_Hijo_De(
        Datos.Padre_Id,
        Periodo_Id
      ))
      .filter(Boolean);
    return {
      Importados: Importados.length,
      Q1_Nombre: Hijo_Q1.Nombre,
      Q2_Nombre: Hijo_Q2.Nombre,
      Q1_Target: Hijo_Q1.Target_Total,
      Q2_Target: Hijo_Q2.Target_Total,
      Q1_Febrero: Sub_De(Hijo_Q1, "Libro febrero"),
      Q2_Abril: Sub_De(Hijo_Q2, "Libro abril")
    };
  });

  expect(Resultado.Importados).toBe(4);
  expect(Resultado.Q1_Nombre).toBe("Libros actualizados");
  expect(Resultado.Q2_Nombre).toBe("Libros actualizados");
  expect(Resultado.Q1_Target).toBe(16);
  expect(Resultado.Q2_Target).toBe(16);
  expect(Resultado.Q1_Febrero.Hecha).toBe(true);
  expect(Resultado.Q1_Febrero.Estado).toBe("Cumplido");
  expect(Resultado.Q2_Abril.Hecha).toBe(true);
  expect(Resultado.Q2_Abril.Estado).toBe("Cumplido");
  expect(errores).toEqual([]);
});

test("Borrar importados limpia objetivos seleccionados de la capa",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Libros = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros capa",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 50,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    const Cine = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Cine capa",
      Emoji: "\uD83C\uDFAC",
      Target_Total: 20,
      Unidad: "Personalizado",
      Unidad_Custom: "peliculas"
    });
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Items = Trimestres.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Libros.Id, Cine.Id]
    }));
    Planes_Importar_Objetivos_Padres_A_Periodos(Items, {
      Modo: "Proporcional"
    });
    Modelo.UI.Periodo_Activo_Id = Trimestres[1].Id;
    Render_Plan();
  });

  const Boton_Borrar = page.locator(
    "[data-plan-universo-borrar-importados]"
  );
  await expect(Boton_Borrar).toBeEnabled();
  const Estilo_Boton = await Boton_Borrar.evaluate((Btn) => ({
    fondo: getComputedStyle(Btn).backgroundColor,
    borde: getComputedStyle(Btn).borderTopWidth
  }));
  expect(Estilo_Boton.fondo).toBe("rgba(0, 0, 0, 0)");
  expect(Estilo_Boton.borde).toBe("0px");

  await Boton_Borrar.click();
  const Modal = page.locator(".Planes_Borrar_Importados_Modal");
  await expect(Modal).toBeVisible();
  await expect(Modal.locator(".Planes_Borrar_Importados_Item"))
    .toHaveCount(2);
  await expect(Modal).toContainText("Libros capa");
  await expect(Modal).toContainText("Cine capa");

  await Modal.locator(".Planes_Borrar_Importados_Item")
    .filter({ hasText: "Cine capa" })
    .locator("input")
    .uncheck();
  await Modal.locator("[data-plan-borrar-importados-confirmar]")
    .click();

  const Resultado = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Importados = Object.values(Modelo.Objetivos)
      .filter((Objetivo) => Planes_Es_Objetivo_Importado(Objetivo));
    const Estado = (Nombre) => {
      const Objetivos = Importados.filter((Objetivo) =>
        Objetivo.Nombre === Nombre
      );
      return {
        activos: Objetivos.filter((Objetivo) =>
          !Objetivo.Eliminado_Local
        ).length,
        borrados: Objetivos.filter((Objetivo) =>
          Objetivo.Eliminado_Local
        ).length
      };
    };
    return {
      libros: Estado("Libros capa"),
      cine: Estado("Cine capa"),
      grupos: Planes_Grupos_Objetivos_Importados_Capa("Trimestre")
        .map((Grupo) => Grupo.Nombre)
    };
  });

  expect(Resultado.libros).toEqual({ activos: 0, borrados: 4 });
  expect(Resultado.cine).toEqual({ activos: 4, borrados: 0 });
  expect(Resultado.grupos).toEqual(["Cine capa"]);
  await expect(page.locator(".Planes_Objetivo_Card"))
    .toContainText("Cine capa");
  await expect(page.locator(".Planes_Objetivo_Card"))
    .not.toContainText("Libros capa");
  expect(errores).toEqual([]);
});

test("Importar pendiente redistribuye avance real del padre",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros redistribucion",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Avance_Id = Crear_Id_Avance_Plan();
    Modelo.Avances[Avance_Id] = Normalizar_Avance_Plan({
      Id: Avance_Id,
      Objetivo_Id: Padre.Id,
      Cantidad: 9,
      Unidad: "libros",
      Fecha: "2026-02-10",
      Hora: "09:00",
      Fecha_Hora: "2026-02-10T09:00"
    });

    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Items = Trimestres.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Padre.Id]
    }));
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Items,
      {
        Modo: "Pendiente",
        Periodos_Fijados: {
          [Trimestres[1].Id]: true
        }
      }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      return {
        Inicio: Periodo.Inicio,
        Target: Hijo.Target_Total,
        Progreso: Hijo.Progreso_Total,
        Manual: Hijo.Progreso_Manual,
        Importado: Hijo.Progreso_Importado,
        Registros: Planes_Registros_De_Objetivo(Hijo)
          .map((Registro) => Registro.Fuente),
        Fijado: Hijo.Fijado,
        Auto_Redistribucion: Hijo.Auto_Redistribucion
      };
    });

    Modelo.UI.Periodo_Activo_Id = Trimestres[1].Id;
    Render_Plan();
    return { Resumen, Hijos };
  });

  expect(Resultado.Resumen.Creados).toBe(4);
  expect(Resultado.Hijos[0].Target).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Progreso).toBe(9);
  expect(Resultado.Hijos[0].Manual).toBe(0);
  expect(Resultado.Hijos[0].Importado).toBe(9);
  expect(Resultado.Hijos[0].Registros).not.toContain("Manual previo");
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Target).toBeCloseTo(41 / 3, 5);
  });
  expect(Resultado.Hijos[1].Fijado).toBe(true);
  expect(Resultado.Hijos[1].Auto_Redistribucion).toBe(false);
  expect(Resultado.Hijos[2].Fijado).toBe(false);

  await expect(page.locator(".Planes_Resumen_Titulo"))
    .toHaveText("Trimestre 2");
  await expect(page.locator(".Planes_Resumen_Titulo_Anio"))
    .toHaveCount(0);
  await expect(page.locator(".Planes_Resumen_Rango"))
    .toHaveText("de 1 de abril a 30 de junio de 2026");
  const Header = await page.evaluate(() => {
    const Titulo = document.querySelector(".Planes_Resumen_Titulo");
    const Rango = document.querySelector(".Planes_Resumen_Rango");
    const Nav = document.querySelector(".Planes_Resumen_Nav");
    const Rect_Titulo = Titulo.getBoundingClientRect();
    const Rect_Rango = Rango.getBoundingClientRect();
    return {
      rangoDebajo: Rect_Rango.top > Rect_Titulo.bottom,
      diferenciaLeft: Math.abs(Rect_Rango.left - Rect_Titulo.left),
      fondoNav: getComputedStyle(Nav).backgroundColor,
      bordeNav: getComputedStyle(Nav).borderTopWidth,
      pesoRango: Number(getComputedStyle(Rango).fontWeight)
    };
  });
  expect(Header.rangoDebajo).toBe(true);
  expect(Header.diferenciaLeft).toBeLessThanOrEqual(2);
  expect(Header.fondoNav).toBe("rgba(0, 0, 0, 0)");
  expect(Header.bordeNav).toBe("0px");
  expect(Header.pesoRango).toBeLessThan(600);

  const Controles = await page.evaluate(() => {
    const Visibles = Array.from(
      document.querySelectorAll(
        ".Planes_Controles > .Planes_Control, " +
        ".Planes_Controles > .Planes_Vista_Control"
      )
    ).filter((Control) =>
      !Control.hidden && getComputedStyle(Control).display !== "none"
    );
    const Anchos = Visibles.map((Control) =>
      Math.round(Control.getBoundingClientRect().width)
    );
    return {
      labels: Visibles.map((Control) =>
        Control.querySelector(".Planes_Control_Label")?.dataset.i18n
      ),
      diferenciaAncho: Math.max(...Anchos) - Math.min(...Anchos),
      estadoTodos:
        document.querySelector("#Planes_Filtro_Estado option")?.text,
      etiquetaTodas:
        document.querySelector("#Planes_Filtro_Etiqueta option")?.text,
      anioTodos:
        document.querySelector("#Planes_Anio_Select option")?.text,
      panelAncho: Math.round(
        document.querySelector(".Planes_Archivero_Panel")
          .getBoundingClientRect().width
      )
    };
  });
  expect(Controles.labels).toEqual([
    "planes.tipo_periodo",
    "planner.anio",
    "planes.subperiodo",
    "planes.estado_label",
    "baul.etiqueta",
    "vista"
  ]);
  expect(Controles.diferenciaAncho).toBeLessThanOrEqual(24);
  expect(Controles.estadoTodos).toBe("Todos");
  expect(Controles.etiquetaTodas).toBe("Todas");
  expect(Controles.anioTodos).toBe("Todos");
  expect(Controles.panelAncho).toBeLessThan(1200);

  await expect(page.locator("[data-plan-resumen-anterior]"))
    .toBeEnabled();
  await expect(page.locator("[data-plan-resumen-siguiente]"))
    .toBeEnabled();
  await page.locator("[data-plan-resumen-siguiente]").click();
  const Periodo_Activo_Click = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    return Modelo.Periodos[Modelo.UI.Periodo_Activo_Id].Inicio;
  });
  expect(Periodo_Activo_Click).toBe("2026-07-01");

  await page.keyboard.press("ArrowLeft");
  const Periodo_Activo_Izquierda = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    return Modelo.Periodos[Modelo.UI.Periodo_Activo_Id].Inicio;
  });
  expect(Periodo_Activo_Izquierda).toBe("2026-04-01");

  await page.keyboard.press("ArrowRight");
  const Periodo_Activo_Derecha = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    return Modelo.Periodos[Modelo.UI.Periodo_Activo_Id].Inicio;
  });
  expect(Periodo_Activo_Derecha).toBe("2026-07-01");
  expect(errores).toEqual([]);
});

test("Importar pendiente descuenta hijos importados legacy",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros legacy",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Crear_Legacy = (Periodo, Progreso) => {
      const Hijo = Planes_Crear_Objetivo_Silencioso(
        Periodo.Id,
        Planes_Clonar_Datos_Objetivo(Padre, {
          Objetivo_Padre_Id: Padre.Id,
          Periodo_Origen: Anio.Id,
          Target_Total: 12.5,
          Target_Automatico: 12.5,
          Target_Actual: 12.5,
          Progreso_Manual: Progreso
        })
      );
      Planes_Actualizar_Progreso(Hijo);
      return Hijo.Id;
    };
    Crear_Legacy(Trimestres[0], 6);
    Crear_Legacy(Trimestres[1], 5);

    const Items = Trimestres.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Padre.Id]
    }));
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Items,
      { Modo: "Pendiente" }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Objetivos = Object.values(Modelo.Objetivos)
        .filter((Objetivo) =>
          Objetivo.Periodo_Id === Periodo.Id &&
          Objetivo.Nombre === "Libros legacy" &&
          !Objetivo.Eliminado_Local
        );
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      return {
        Inicio: Periodo.Inicio,
        Cantidad: Objetivos.length,
        Target: Hijo.Target_Total,
        Progreso: Hijo.Progreso_Total,
        Padre: Hijo.Objetivo_Padre_Id
      };
    });

    return { Resumen, Hijos };
  });

  expect(Resultado.Resumen.Creados).toBe(2);
  Resultado.Hijos.forEach((Hijo) => {
    expect(Hijo.Cantidad).toBe(1);
    expect(Hijo.Padre).toBeTruthy();
  });
  expect(Resultado.Hijos[0].Target).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Progreso).toBe(6);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Target).toBeCloseTo(44 / 3, 5);
  });
  expect(Resultado.Hijos[1].Progreso).toBe(5);
  expect(errores).toEqual([]);
});

test("Importar pendiente descuenta subobjetivos realizados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros con subobjetivos",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Hijo_T1 = Planes_Crear_Objetivo_Silencioso(
      Trimestres[0].Id,
      Planes_Clonar_Datos_Objetivo(Padre, {
        Objetivo_Padre_Id: Padre.Id,
        Target_Total: 12.5,
        Target_Automatico: 12.5,
        Target_Actual: 12.5
      })
    );
    Modelo.Subobjetivos.Sub_Libros_T1 =
      Normalizar_Subobjetivo_Plan({
        Id: "Sub_Libros_T1",
        Objetivo_Id: Hijo_T1.Id,
        Texto: "Libros terminados",
        Hecha: true,
        Aporte_Meta: 6,
        Fecha_Fin: "31/03/2026"
      });
    Planes_Actualizar_Progreso(Hijo_T1);
    Planes_Actualizar_Progreso(Padre);

    const Info = Planes_Info_Pendiente_Importacion(
      Padre,
      Anio,
      Trimestres
    );
    const Items = Trimestres.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Padre.Id]
    }));
    Planes_Importar_Objetivos_Padres_A_Periodos(
      Items,
      { Modo: "Pendiente" }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      return {
        Id: Hijo.Id,
        Periodo_Id: Periodo.Id,
        Target: Hijo.Target_Total,
        Progreso: Hijo.Progreso_Total,
        Regla: Hijo.Regla_Distribucion,
        Tiene_Parent: Object.prototype.hasOwnProperty.call(
          Hijo,
          "Parent_Objetivo_Id"
        ),
        Tiene_Origen: Object.prototype.hasOwnProperty.call(
          Hijo,
          "Origen_Objetivo"
        ),
        Tiene_Capa: Object.prototype.hasOwnProperty.call(
          Hijo,
          "Capa_Origen"
        ),
        Tiene_Importacion: Object.prototype.hasOwnProperty.call(
          Hijo,
          "Importacion_Id"
        )
      };
    });
    return {
      Avance_T1: Planes_Avance_Real_Objetivo_En_Periodo(
        Padre,
        Trimestres[0]
      ),
      Target_Info_T2: Info.Targets.get(Trimestres[1].Id),
      Hijos
    };
  });

  expect(Resultado.Avance_T1).toBe(6);
  expect(Resultado.Target_Info_T2).toBeCloseTo(44 / 3, 5);
  expect(Resultado.Hijos[0].Target).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Progreso).toBe(6);
  expect(Resultado.Hijos[0].Regla).toBe("Pendiente");
  expect(Resultado.Hijos[0].Tiene_Parent).toBe(false);
  expect(Resultado.Hijos[0].Tiene_Origen).toBe(false);
  expect(Resultado.Hijos[0].Tiene_Capa).toBe(false);
  expect(Resultado.Hijos[0].Tiene_Importacion).toBe(false);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Target).toBeCloseTo(44 / 3, 5);
    expect(Resultado.Hijos[Indice].Regla).toBe("Pendiente");
  });

  await page.evaluate(({ objetivoId, periodoId }) => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.UI.Vista = "Tarjetas";
    Modelo.UI.Objetivos_Expandidos = { [objetivoId]: true };
    Planes_Activar_Periodo_Desde_Coleccion(
      Modelo.Periodos[periodoId]
    );
    Render_Plan();
  }, {
    objetivoId: Resultado.Hijos[0].Id,
    periodoId: Resultado.Hijos[0].Periodo_Id
  });

  const Card_T1 = page.locator(
    `[data-plan-objetivo-id="${Resultado.Hijos[0].Id}"]`
  );
  await expect(Card_T1).toHaveClass(/Atrasado/);
  await expect(
    Card_T1.locator(".Planes_Progreso_Tabla tbody tr td").first()
  ).toContainText("Atrasado");

  await page.evaluate(({ periodoId }) => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.UI.Objetivos_Expandidos = {};
    Planes_Activar_Periodo_Desde_Coleccion(
      Modelo.Periodos[periodoId]
    );
    Render_Plan();
  }, {
    periodoId: Resultado.Hijos[0].Periodo_Id
  });

  const Estilo_Cerrado = await Card_T1.evaluate((Card) => {
    const Porcentaje = Card.querySelector(
      ".Planes_Objetivo_Porcentaje"
    );
    const Estado = Card.querySelector(".Planes_Objetivo_Estado");
    return {
      porcentajeColor: getComputedStyle(Porcentaje).color,
      porcentajeFondo: getComputedStyle(Porcentaje).backgroundColor,
      estadoFondo: getComputedStyle(Estado).backgroundColor,
      estadoSombra: getComputedStyle(Estado).boxShadow
    };
  });
  expect(Estilo_Cerrado.porcentajeColor).toBe("rgb(166, 54, 49)");
  expect(Estilo_Cerrado.porcentajeFondo).toBe("rgba(0, 0, 0, 0)");
  expect(Estilo_Cerrado.estadoFondo).toBe("rgba(0, 0, 0, 0)");
  expect(Estilo_Cerrado.estadoSombra).toBe("none");
  expect(errores).toEqual([]);
});

test("Importar pendiente recalcula importados borrados fijados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros borrados",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Crear_Hijo_Borrado = (
      Periodo,
      Target,
      Aporte = 0,
      Fecha = ""
    ) => {
      const Hijo = Planes_Crear_Objetivo_Silencioso(
        Periodo.Id,
        Planes_Clonar_Datos_Objetivo(Padre, {
          Objetivo_Padre_Id: Padre.Id,
          Target_Total: Target,
          Target_Automatico: Target,
          Target_Actual: Target,
          Regla_Distribucion: "Pendiente"
        })
      );
      Hijo.Fijado = true;
      Hijo.Target_Fijado = Target;
      Hijo.Target_Fijado_Por_Usuario = true;
      Hijo.Auto_Redistribucion = false;
      Hijo.Estado_Vinculo = "Eliminado";
      if (Aporte) {
        const Sub_Id = `Sub_${Periodo.Id}`;
        Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
          Id: Sub_Id,
          Objetivo_Id: Hijo.Id,
          Texto: "Libros terminados",
          Hecha: true,
          Aporte_Meta: Aporte,
          Fecha_Fin: Fecha
        });
      }
      Planes_Actualizar_Progreso(Hijo);
      Hijo.Eliminado_Local = true;
      return Hijo;
    };
    Crear_Hijo_Borrado(Trimestres[0], 12.5, 6, "31/03/2026");
    Crear_Hijo_Borrado(Trimestres[1], 50 / 3, 5, "15/04/2026");
    Crear_Hijo_Borrado(Trimestres[2], 50 / 3);
    Crear_Hijo_Borrado(Trimestres[3], 50 / 3);
    Planes_Actualizar_Progreso(Padre);

    const Info = Planes_Info_Pendiente_Importacion(
      Padre,
      Anio,
      Trimestres
    );
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Trimestres.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Pendiente" }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      const Activos = Object.values(Modelo.Objetivos)
        .filter((Objetivo) =>
          Objetivo.Periodo_Id === Periodo.Id &&
          Objetivo.Nombre === "Libros borrados" &&
          !Objetivo.Eliminado_Local
        );
      return {
        Cantidad: Activos.length,
        Target_Info: Info.Targets.get(Periodo.Id),
        Target: Hijo.Target_Total,
        Progreso: Hijo.Progreso_Total,
        Eliminado: Hijo.Eliminado_Local,
        Fijado: Hijo.Fijado,
        Fijado_Usuario: Hijo.Target_Fijado_Por_Usuario,
        Auto_Redistribucion: Hijo.Auto_Redistribucion !== false
      };
    });
    return { Resumen, Hijos };
  });

  expect(Resultado.Resumen.Restaurados).toBe(4);
  expect(Resultado.Hijos[0].Cantidad).toBe(1);
  expect(Resultado.Hijos[0].Target_Info).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Target).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Progreso).toBe(6);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Cantidad).toBe(1);
    expect(Resultado.Hijos[Indice].Target_Info)
      .toBeCloseTo(44 / 3, 5);
    expect(Resultado.Hijos[Indice].Target)
      .toBeCloseTo(44 / 3, 5);
  });
  Resultado.Hijos.forEach((Hijo) => {
    expect(Hijo.Eliminado).toBe(false);
    expect(Hijo.Fijado).toBe(false);
    expect(Hijo.Fijado_Usuario).toBe(false);
    expect(Hijo.Auto_Redistribucion).toBe(true);
  });
  expect(Resultado.Hijos[1].Progreso).toBe(5);
  expect(errores).toEqual([]);
});

test("Importar pendiente reusa importados con padre obsoleto",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros obsoleto",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Crear_Hijo_Obsoleto = (Periodo, Target, Aporte, Fecha) => {
      const Hijo = Planes_Crear_Objetivo_Silencioso(
        Periodo.Id,
        Planes_Clonar_Datos_Objetivo(Padre, {
          Objetivo_Padre_Id: "Padre_Obsoleto",
          Target_Total: Target,
          Target_Automatico: Target,
          Target_Actual: Target
        })
      );
      const Sub_Id = `Sub_${Periodo.Id}`;
      Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
        Id: Sub_Id,
        Objetivo_Id: Hijo.Id,
        Texto: "Libros terminados",
        Hecha: true,
        Aporte_Meta: Aporte,
        Fecha_Fin: Fecha
      });
      Planes_Actualizar_Progreso(Hijo);
      return Hijo;
    };
    Crear_Hijo_Obsoleto(Trimestres[0], 12.5, 6, "31/03/2026");
    Crear_Hijo_Obsoleto(
      Trimestres[1],
      50 / 3,
      5,
      "15/04/2026"
    );

    const Destinos = Trimestres.slice(1);
    const Info = Planes_Info_Pendiente_Importacion(
      Padre,
      Anio,
      Destinos
    );
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Destinos.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Pendiente" }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Objetivos = Object.values(Modelo.Objetivos)
        .filter((Objetivo) =>
          Objetivo.Periodo_Id === Periodo.Id &&
          Objetivo.Nombre === "Libros obsoleto" &&
          !Objetivo.Eliminado_Local
        );
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      const Visible = Objetivos[0];
      return {
        Cantidad: Objetivos.length,
        Target_Info: Info.Targets.get(Periodo.Id),
        Target: (Hijo || Visible)?.Target_Total || null,
        Progreso: (Hijo || Visible)?.Progreso_Total || null,
        Padre: (Hijo || Visible)?.Objetivo_Padre_Id || ""
      };
    });
    return { Resumen, Hijos };
  });

  expect(Resultado.Resumen.Creados).toBe(2);
  expect(Resultado.Resumen.Actualizados).toBe(1);
  expect(Resultado.Hijos[0].Cantidad).toBe(1);
  expect(Resultado.Hijos[0].Target).toBeCloseTo(12.5, 5);
  expect(Resultado.Hijos[0].Progreso).toBe(6);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Cantidad).toBe(1);
    expect(Resultado.Hijos[Indice].Target_Info)
      .toBeCloseTo(44 / 3, 5);
    expect(Resultado.Hijos[Indice].Target)
      .toBeCloseTo(44 / 3, 5);
    expect(Resultado.Hijos[Indice].Padre).toBeTruthy();
  });
  expect(Resultado.Hijos[1].Progreso).toBe(5);
  expect(errores).toEqual([]);
});

test("Importar pendiente desde selector aplica modo pendiente",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros selector",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Hijo_T1 = Planes_Crear_Objetivo_Silencioso(
      Trimestres[0].Id,
      Planes_Clonar_Datos_Objetivo(Padre, {
        Objetivo_Padre_Id: Padre.Id,
        Target_Total: 12.5,
        Target_Automatico: 12.5,
        Target_Actual: 12.5
      })
    );
    Modelo.Subobjetivos.Sub_Selector_T1 =
      Normalizar_Subobjetivo_Plan({
        Id: "Sub_Selector_T1",
        Objetivo_Id: Hijo_T1.Id,
        Texto: "Libros terminados",
        Hecha: true,
        Aporte_Meta: 6,
        Fecha_Fin: "31/03/2026"
      });
    const Hijo_T2 = Planes_Crear_Objetivo_Silencioso(
      Trimestres[1].Id,
      Planes_Clonar_Datos_Objetivo(Padre, {
        Objetivo_Padre_Id: Padre.Id,
        Target_Total: 50 / 3,
        Target_Automatico: 50 / 3,
        Target_Actual: 50 / 3,
        Progreso_Manual: 5,
        Auto_Redistribucion: false
      })
    );
    Planes_Actualizar_Progreso(Hijo_T1);
    Planes_Actualizar_Progreso(Hijo_T2);
    Modelo.UI.Periodo_Activo_Id = Trimestres[1].Id;
    Render_Plan();
    window.__Trimestre_Selector_Id = Trimestres[1].Id;
    window.__Padre_Selector_Id = Padre.Id;
    window.__Importar_Selector_Promesa =
      Planes_Importar_De_Padres_Periodo(Trimestres[1].Id);
  });

  const Selector = page.locator("[data-plan-importar-modo-select]");
  await expect(Selector).toBeVisible();
  await Selector.selectOption("Pendiente");
  await expect(Selector).toHaveValue("Pendiente");
  await page.locator("[data-plan-importar-confirmar]").click();
  await page.waitForFunction(() =>
    !document.querySelector("[data-plan-importar-confirmar]")
  );

  const Resultado = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Hijo = Planes_Objetivo_Hijo_De(
      window.__Padre_Selector_Id,
      window.__Trimestre_Selector_Id
    );
    return {
      Target: Hijo.Target_Total,
      Progreso: Hijo.Progreso_Total,
      Auto_Redistribucion: Hijo.Auto_Redistribucion,
      Cantidad: Object.values(Modelo.Objetivos)
        .filter((Objetivo) =>
          Objetivo.Periodo_Id === window.__Trimestre_Selector_Id &&
          Objetivo.Nombre === "Libros selector" &&
          !Objetivo.Eliminado_Local
        )
        .length
    };
  });

  expect(Resultado.Cantidad).toBe(1);
  expect(Resultado.Target).toBeCloseTo(44 / 3, 5);
  expect(Resultado.Progreso).toBe(5);
  expect(Resultado.Auto_Redistribucion).toBe(true);
  expect(errores).toEqual([]);
});

test("Importar pendiente descuenta hijos indirectos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 2;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Semestre = Planes_Crear_Periodo(
      Modelo,
      "Semestre",
      "2026-01-01",
      "2026-06-30",
      Anio.Id,
      1
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros indirectos",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Padre_Semestre = Planes_Crear_Objetivo_Silencioso(
      Semestre.Id,
      Planes_Clonar_Datos_Objetivo(Padre, {
        Objetivo_Padre_Id: Padre.Id,
        Target_Total: 25,
        Target_Automatico: 25,
        Target_Actual: 25
      })
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Hijo_Q1 = Planes_Crear_Objetivo_Silencioso(
      Trimestres[0].Id,
      Planes_Clonar_Datos_Objetivo(Padre_Semestre, {
        Objetivo_Padre_Id: Padre_Semestre.Id,
        Target_Total: 12.5,
        Target_Automatico: 12.5,
        Target_Actual: 12.5,
        Progreso_Manual: 6
      })
    );
    const Hijo_Q2 = Planes_Crear_Objetivo_Silencioso(
      Trimestres[1].Id,
      Planes_Clonar_Datos_Objetivo(Padre, {
        Objetivo_Padre_Id: Padre.Id,
        Target_Total: 50 / 3,
        Target_Automatico: 50 / 3,
        Target_Actual: 50 / 3,
        Progreso_Manual: 5
      })
    );
    Planes_Actualizar_Progreso(Hijo_Q1);
    Planes_Actualizar_Progreso(Hijo_Q2);

    const Destinos = Trimestres.slice(1);
    const Info = Planes_Info_Pendiente_Importacion(
      Padre,
      Anio,
      Destinos
    );
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos(
      Destinos.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Pendiente" }
    );
    const Hijos = Trimestres.map((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      return {
        Inicio: Periodo.Inicio,
        Target_Info: Info.Targets.get(Periodo.Id),
        Target: Hijo?.Target_Total || null,
        Progreso: Hijo?.Progreso_Total || null
      };
    });

    return { Resumen, Hijos };
  });

  expect(Resultado.Resumen.Creados).toBe(2);
  expect(Resultado.Resumen.Actualizados).toBe(1);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Hijos[Indice].Target_Info)
      .toBeCloseTo(44 / 3, 5);
    expect(Resultado.Hijos[Indice].Target)
      .toBeCloseTo(44 / 3, 5);
  });
  expect(Resultado.Hijos[1].Progreso).toBe(5);
  expect(errores).toEqual([]);
});

test("Planes muestra todos los años de la capa",
async ({ page }) => {
  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2027;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Mes";
    Modelo.UI.Subperiodo_Activo = 1;
    Modelo.UI.Anio_Todos = false;
    const Periodo = Planes_Crear_Periodo_Seleccionado("Mes");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Alerta color",
        Emoji: "\u26A0\uFE0F",
        Target_Total: 1,
        Progreso_Manual: 1,
        Unidad: "Horas"
      }
    );
    Objetivo.Warnings = ["Color_Test"];
    Render_Plan();
  });

  const Fondo_Warning = await page.locator(
    ".Planes_Objetivo_Card.Warning"
  ).first().evaluate((Card) => getComputedStyle(Card).backgroundColor);
  expect(Fondo_Warning).toBe("rgba(0, 0, 0, 0)");

  await page.selectOption("#Planes_Anio_Select", "Todos");
  await expect(page.locator("#Planes_Anio_Select"))
    .toHaveValue("Todos");
  await expect(page.locator(".Planes_Subperiodo_Select_Control"))
    .toBeHidden();
  await expect(page.locator(".Planes_Coleccion_Titulo"))
    .toContainText("---");
  await expect(page.locator(".Planes_Periodo_Tarjeta"))
    .toHaveCount(24);

  await page.selectOption("#Planes_Capa_Select", "Anio");
  await expect(page.locator(".Planes_Periodo_Tarjeta"))
    .toHaveCount(2);

  await page.selectOption("#Planes_Capa_Select", "Mes");
  await page.locator(
    '[data-plan-periodo-id="P_Mes_2027-02-01_2027-02-28"]'
  ).click();
  await expect(page.locator("#Planes_Anio_Select"))
    .toHaveValue("2027");
  await expect(page.locator("#Planes_Subperiodo_Select"))
    .toHaveValue("2");
  await expect(page.locator(".Planes_Coleccion")).toHaveCount(0);
});

test("Planes conserva layout responsive en mobile",
async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 760 });
  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
  });

  await expect(page.locator("#Plan_Overlay")).toHaveClass(/Activo/);

  const Layout = await page.evaluate(() => {
    const Panel = document.querySelector(".Planes_Archivero_Panel");
    const Layout_El = document.querySelector(".Planes_Layout");
    const Rect_Panel = Panel.getBoundingClientRect();
    return {
      columnas: getComputedStyle(Layout_El).gridTemplateColumns,
      panelAncho: Math.round(Rect_Panel.width),
      overflow: document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
      controles: document.querySelectorAll(
        ".Planes_Controles > .Planes_Control, " +
        ".Planes_Controles > .Planes_Vista_Control"
      ).length
    };
  });

  expect(Layout.columnas.split(" ").length).toBe(1);
  expect(Layout.controles).toBeGreaterThan(0);
  expect(Layout.panelAncho).toBeLessThanOrEqual(390);
  expect(Layout.overflow).toBeLessThanOrEqual(8);
});

test("Importar pendiente respeta abiertos fijados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Mes";
    Modelo.UI.Subperiodo_Activo = 4;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros fijado",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 50,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Avance_Id = Crear_Id_Avance_Plan();
    Modelo.Avances[Avance_Id] = Normalizar_Avance_Plan({
      Id: Avance_Id,
      Objetivo_Id: Padre.Id,
      Cantidad: 6,
      Unidad: "libros",
      Fecha: "2026-02-10",
      Hora: "09:00",
      Fecha_Hora: "2026-02-10T09:00"
    });

    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    const Items = Meses.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Padre.Id]
    }));
    Planes_Importar_Objetivos_Padres_A_Periodos(Items, {
      Modo: "Pendiente"
    });

    const Abril = Planes_Objetivo_Hijo_De(Padre.Id, Meses[3].Id);
    Abril.Fijado = true;
    Abril.Auto_Redistribucion = false;
    Abril.Target_Total = 4;
    Abril.Target_Automatico = 4;
    Abril.Target_Actual = 4;
    Abril.Target_Fijado = 4;
    Abril.Target_Fijado_Por_Usuario = true;
    Planes_Actualizar_Progreso(Abril);

    Planes_Importar_Objetivos_Padres_A_Periodos(Items, {
      Modo: "Pendiente"
    });

    const Mayo = Planes_Objetivo_Hijo_De(Padre.Id, Meses[4].Id);
    const Diciembre = Planes_Objetivo_Hijo_De(Padre.Id, Meses[11].Id);
    return {
      Abril_Target: Abril.Target_Total,
      Abril_Fijado: Abril.Fijado,
      Mayo_Target: Mayo.Target_Total,
      Diciembre_Target: Diciembre.Target_Total
    };
  });

  expect(Resultado.Abril_Target).toBe(4);
  expect(Resultado.Abril_Fijado).toBe(true);
  expect(Resultado.Mayo_Target).toBeCloseTo(125 / 24, 5);
  expect(Resultado.Diciembre_Target).toBeCloseTo(125 / 24, 5);
  expect(errores).toEqual([]);
});

test("Actualizar capa confirma y reubica subobjetivos por fecha",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Inicial = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Mes";
    Modelo.UI.Subperiodo_Activo = 4;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Fechas derivadas",
        Emoji: "\uD83D\uDCC5",
        Target_Total: 12,
        Unidad: "Horas"
      }
    );
    const Crear_Sub = (Texto, Datos) => {
      const Id = Crear_Id_Subobjetivo_Plan();
      Modelo.Subobjetivos[Id] = Normalizar_Subobjetivo_Plan({
        Id,
        Objetivo_Id: Padre.Id,
        Emoji: "\u2022",
        Texto,
        Aporte_Meta: 1,
        Unidad: "Horas",
        ...Datos
      });
      return Modelo.Subobjetivos[Id];
    };
    Crear_Sub("Por fecha fin", {
      Fecha_Fin: "2026-04-10",
      Fecha_Objetivo: "2026-03-10",
      Fecha_Inicio: "2026-02-10"
    });
    const Sub_Objetivo = Crear_Sub("Por fecha objetivo", {
      Fecha_Objetivo: "2026-05-10",
      Fecha_Inicio: "2026-04-10"
    });
    Crear_Sub("Por fecha inicio", {
      Fecha_Inicio: "2026-06-10"
    });

    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    Planes_Importar_Objetivos_Padres_A_Periodos(
      Meses.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Pendiente" }
    );

    const Textos_Mes = (Indice) => {
      const Hijo = Planes_Objetivo_Hijo_De(
        Padre.Id,
        Meses[Indice].Id
      );
      return Planes_Subobjetivos_De_Objetivo(Hijo.Id)
        .filter((Sub) => !Sub.Eliminado_Local)
        .map((Sub) => Sub.Texto)
        .sort();
    };
    const Antes = {
      Abril: Textos_Mes(3),
      Mayo: Textos_Mes(4),
      Junio: Textos_Mes(5),
      Julio: Textos_Mes(6)
    };

    Sub_Objetivo.Fecha_Fin = "2026-07-10";
    Sub_Objetivo.Hecha = true;
    Modelo.UI.Periodo_Activo_Id = Meses[3].Id;
    Render_Plan();

    return Antes;
  });

  expect(Inicial.Abril).toContain("Por fecha fin");
  expect(Inicial.Abril).not.toContain("Por fecha objetivo");
  expect(Inicial.Mayo).toContain("Por fecha objetivo");
  expect(Inicial.Junio).toContain("Por fecha inicio");
  expect(Inicial.Julio).not.toContain("Por fecha objetivo");

  await page.click("[data-plan-universo-actualizar]");
  await expect(page.locator("#Dialogo_Overlay")).toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("Cambios observados");
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Primario")
    .click();

  const Resultado = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Object.values(Modelo.Objetivos)
      .find((Objetivo) => Objetivo.Nombre === "Fechas derivadas");
    const Meses = Planes_Crear_Periodos_Distribucion(
      Modelo.Periodos[Padre.Periodo_Id],
      "Mes"
    );
    const Textos_Mes = (Indice) => {
      const Hijo = Planes_Objetivo_Hijo_De(
        Padre.Id,
        Meses[Indice].Id
      );
      return Planes_Subobjetivos_De_Objetivo(Hijo.Id)
        .filter((Sub) => !Sub.Eliminado_Local)
        .map((Sub) => Sub.Texto)
        .sort();
    };
    return {
      Mayo: Textos_Mes(4),
      Julio: Textos_Mes(6),
      Preview: Planes_Previsualizar_Actualizar_Importados_Capa("Mes")
    };
  });

  expect(Resultado.Mayo).not.toContain("Por fecha objetivo");
  expect(Resultado.Julio).toContain("Por fecha objetivo");
  expect(Resultado.Preview.Total).toBe(0);
  expect(errores).toEqual([]);
});

test("Subobjetivos muestra meta limpia sin importado ni metadatos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Lecturas",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 12,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Liberalismo"
    );
    Planes_Actualizar_Subobjetivo_Datos(Sub_Id, {
      Unidad: "Personalizado",
      Unidad_Custom: "páginas",
      Target_Total: 156,
      Progreso_Inicial: 156,
      Aporte_Meta: 1,
      Metadatos: { Autor: "Mill" }
    });
    Modelo.Subobjetivos[Sub_Id].Importado = true;
    Planes_Actualizar_Progreso(Objetivo);

    Abrir_Modal_Planes_Subobjetivos(Objetivo.Id, false);
    const Item = document.querySelector(".Planes_Subobjetivo");
    return {
      Meta: Item?.querySelector(".Planes_Subobjetivo_Meta")
        ?.textContent?.trim() || "",
      Texto: Item?.textContent || "",
      Badge_Importado: Boolean(
        Item?.querySelector(".Planes_Subobjetivo_Importado")
      ),
      Metadatos_Visibles:
        Item?.querySelectorAll(".Planes_Subobjetivo_Metadato")
          .length || 0
    };
  });

  expect(Resultado.Meta).toContain("100%");
  expect(Resultado.Meta).toContain("156/156");
  expect(Resultado.Meta).toContain("+1 libros");
  expect(Resultado.Meta).not.toContain("(");
  expect(Resultado.Badge_Importado).toBe(false);
  expect(Resultado.Metadatos_Visibles).toBe(0);
  expect(Resultado.Texto).not.toContain("Importado");
  expect(errores).toEqual([]);
});
