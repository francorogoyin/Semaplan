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
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Tipo === "Anio");
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    Render_Plan();
  });

  await expect(page.locator("#Plan_Overlay")).toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Filtro_Tipo")).toBeVisible();

  const Layout_Desktop = await page.evaluate(() => {
    const Panel = document.querySelector(".Planes_Archivero_Panel");
    const Sidebar = document.querySelector(".Planes_Sidebar");
    const Items = Array.from(
      document.querySelectorAll(".Planes_Periodo_Item")
    );
    const Controles = Array.from(
      document.querySelectorAll(
        "#Planes_Filtro_Tipo, #Planes_Filtro_Estado, " +
        "#Planes_Filtro_Etiqueta, #Planes_Busqueda, " +
        "#Planes_Vista_Toggle"
      )
    );
    const Tops = Controles.map((El) =>
      Math.round(El.getBoundingClientRect().top)
    );
    return {
      panelAncho: Math.round(Panel.getBoundingClientRect().width),
      sidebarAncho: Math.round(Sidebar.getBoundingClientRect().width),
      primerPeriodo: Items[0]?.innerText || "",
      primerTooltip: Items[0]?.getAttribute("title") || "",
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

  expect(Layout_Desktop.panelAncho).toBeGreaterThan(1200);
  expect(Layout_Desktop.sidebarAncho).toBeGreaterThan(330);
  expect(Layout_Desktop.primerPeriodo).not.toContain("2026-01-01");
  expect(Layout_Desktop.primerTooltip).toContain("al");
  expect(Layout_Desktop.controlesUnaLinea).toBe(true);
  expect(Layout_Desktop.gapCuerpo).toBe("24px");
  expect(Layout_Desktop.paddingResumen).toBe("36px");
  expect(Layout_Desktop.margenRango).toBe("12px");
  expect(Layout_Desktop.fuenteMetrica).toBe("14px");

  await page.locator("[data-plan-resumen-editar]").click();
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
  await expect(page.locator(".Planes_Periodo_Item").first())
    .toContainText("Year 2026");
  await page.evaluate(() => Cambiar_Idioma("es"));
  await expect(page.locator(".Planes_Periodo_Item").first())
    .toContainText("Año 2026");

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

  await page.click("#Planes_Btn_Nuevo_Header");
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
    const Objetivos_Plan = Object.values(Planes_Periodo.Objetivos);
    const Padre = Objetivos_Plan.find((Objetivo) =>
      Objetivo.Nombre === "Leer" && !Objetivo.Parent_Objetivo_Id
    );
    const Hijos = Objetivos_Plan.filter((Objetivo) =>
      Objetivo.Parent_Objetivo_Id === Padre.Id
    );
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

  const Sidebar_Expandido = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    Object.values(Modelo.Periodos).forEach((Periodo) => {
      Modelo.UI.Expandidos[Periodo.Id] = true;
    });
    Render_Planes_Sidebar();
    const Lista = document.querySelector("#Planes_Periodos_Lista");
    const Btn_Custom = document.querySelector("#Planes_Btn_Custom");
    const Sidebar = document.querySelector(".Planes_Sidebar");
    return {
      overflowHorizontal:
        Math.round(Lista.scrollWidth - Lista.clientWidth),
      botonAbajo:
        Btn_Custom.getBoundingClientRect().top >
        Sidebar.getBoundingClientRect().top +
          Sidebar.getBoundingClientRect().height * 0.75
    };
  });

  expect(Sidebar_Expandido.overflowHorizontal).toBeLessThanOrEqual(1);
  expect(Sidebar_Expandido.botonAbajo).toBe(true);

  const Texto_Tarjeta = await page.locator(".Planes_Objetivo_Card")
    .first()
    .innerText();
  expect(Texto_Tarjeta).toContain("%");
  expect(Texto_Tarjeta).toContain("horas");
  expect(Texto_Tarjeta).not.toContain("#Lectura");
  expect(Texto_Tarjeta).not.toContain("Horas");

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
  ).toContainText("Realizado");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Falta");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle")
  ).toContainText("Detectado");
  await expect(
    Card_Objetivo.locator(".Planes_Objetivo_Detalle_Etiquetas")
  ).toContainText("#Lectura");
  await expect(Card_Objetivo)
    .not.toContainText("Etiqueta:");
  const Layout_Detalle = await Card_Objetivo.evaluate((Card) => {
    const Detalle = Card.querySelector(".Planes_Objetivo_Detalle");
    const Items = Array.from(
      Detalle.querySelectorAll(".Planes_Dato, .Planes_Detalle_Accion")
    );
    const Tops = Items.map((Item) =>
      Math.round(Item.getBoundingClientRect().top)
    );
    const Etiquetas = Card.querySelector(
      ".Planes_Objetivo_Detalle_Etiquetas"
    ).getBoundingClientRect();
    const Detalle_Rect = Detalle.getBoundingClientRect();
    const Primer_Item = Items[0].getBoundingClientRect();
    const Ultimo_Item = Items[Items.length - 1].getBoundingClientRect();
    return {
      todosMismaLinea: Math.max(...Tops) - Math.min(...Tops) <= 2,
      usaAnchoDisponible:
        Ultimo_Item.right - Primer_Item.left >
        Detalle_Rect.width * 0.82,
      etiquetasDebajo: Etiquetas.top > Detalle_Rect.bottom,
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
  expect(Layout_Detalle.todosMismaLinea).toBe(true);
  expect(Layout_Detalle.usaAnchoDisponible).toBe(true);
  expect(Layout_Detalle.etiquetasDebajo).toBe(true);
  expect(Layout_Detalle.chipsEnFila).toBe(true);
  expect(Layout_Detalle.etiquetaSinOvalo).toBe(true);
  await Card_Objetivo.locator('[data-plan-accion="admin_subs"]')
    .click();
  await expect(page.locator("#Planes_Subobjetivos_Overlay"))
    .toHaveClass(/Activo/);
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
  await expect(Card_Biblioteca.locator(".Planes_Fuente_Badge"))
    .toBeVisible();
  await expect(Card_Biblioteca.locator(".Planes_Fuente_Badge"))
    .toHaveAttribute("title", /Manual:.*Calendario/);
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
    Modelo.UI.Vista = "Biblioteca";
    Render_Plan();
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
    Render_Plan();
    return Datos;
  });
  expect(Vacio_Biblioteca.texto)
    .toContain("No hay objetivos visibles");
  expect(Vacio_Biblioteca.anchoVacio)
    .toBeGreaterThan(Vacio_Biblioteca.anchoLista * 0.9);

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
  expect(Subestado.padreHecha).toBe(true);

  await page.evaluate(({ hijoId }) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Hijo = Modelo.Objetivos[hijoId];
    Modelo.UI.Periodo_Activo_Id = Hijo.Periodo_Id;
    Modelo.UI.Vista = "Tarjetas";
    Render_Plan();
  }, { hijoId: Modelo_Inicial.hijoId });
  const Conteo_Antes_Eliminar = await page.locator(
    ".Planes_Periodo_Item.Activo .Planes_Periodo_Conteo"
  ).innerText();
  expect(Number(Conteo_Antes_Eliminar.trim()))
    .toBeGreaterThan(0);
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
  await expect(page.locator(".Undo_Toast_Boton"))
    .toContainText("Deshacer");
  const Eliminacion_Jerarquica = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local,
      conteo: document.querySelector(
        ".Planes_Periodo_Item.Activo .Planes_Periodo_Conteo"
      )?.textContent.trim() || ""
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Eliminacion_Jerarquica.padre).toBe(true);
  expect(Eliminacion_Jerarquica.hijo).toBe(true);
  expect(Eliminacion_Jerarquica.conteo).toBe("0");
  await page.locator(".Undo_Toast_Boton").first().click();
  const Restaurado_Jerarquico = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local,
      conteo: document.querySelector(
        ".Planes_Periodo_Item.Activo .Planes_Periodo_Conteo"
      )?.textContent.trim() || ""
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Restaurado_Jerarquico.padre).not.toBe(true);
  expect(Restaurado_Jerarquico.hijo).not.toBe(true);
  expect(Number(Restaurado_Jerarquico.conteo))
    .toBeGreaterThan(0);

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
    const Sidebar = document.querySelector(".Planes_Sidebar");
    const Rect_Panel = Panel.getBoundingClientRect();
    const Rect_Sidebar = Sidebar.getBoundingClientRect();
    return {
      columnas: getComputedStyle(Layout_El).gridTemplateColumns,
      panelAncho: Math.round(Rect_Panel.width),
      sidebarAncho: Math.round(Rect_Sidebar.width),
      overflow: document.documentElement.scrollWidth -
        document.documentElement.clientWidth
    };
  });

  expect(Layout.columnas.split(" ").length).toBe(1);
  expect(Layout.sidebarAncho).toBeLessThanOrEqual(Layout.panelAncho);
  expect(Layout.overflow).toBeLessThanOrEqual(8);
});
