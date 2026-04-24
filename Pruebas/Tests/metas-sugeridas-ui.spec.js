const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 820, height: 620 }
});

function Crear_Estado_Base() {
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
  await page.addInitScript((Estado) => {
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
      JSON.stringify(Estado)
    );
  }, Crear_Estado_Base());

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("metas sugeridas restringe colores y scrollea partes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Categorias = [
      {
        Id: "cat_trabajo",
        Emoji: "T",
        Nombre: "Trabajo",
        Color_Baul: "#a6c8e5",
        Metadatos: []
      },
      {
        Id: "cat_custom",
        Emoji: "C",
        Nombre: "Custom",
        Color_Baul: "#123456",
        Metadatos: []
      }
    ];
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_plan = Normalizar_Objetivo_Plan({
      Id: "obj_plan",
      Periodo_Id: "p2026",
      Emoji: "P",
      Nombre: "Plan",
      Target_Total: 100,
      Unidad: "Horas",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_seo = Normalizar_Subobjetivo_Plan({
      Id: "sub_seo",
      Objetivo_Id: "obj_plan",
      Emoji: "S",
      Texto: "SEO",
      Target_Total: 10,
      Unidad: "Horas",
      Fecha_Inicio: "2026-04-20",
      Fecha_Objetivo: "2026-04-26",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_sin_fecha = Normalizar_Subobjetivo_Plan({
      Id: "sub_sin_fecha",
      Objetivo_Id: "obj_plan",
      Emoji: "N",
      Texto: "Sin fecha semanal",
      Target_Total: 8,
      Unidad: "Horas",
      Orden: 1
    });
    Modelo.Subobjetivos.sub_otra_semana = Normalizar_Subobjetivo_Plan({
      Id: "sub_otra_semana",
      Objetivo_Id: "obj_plan",
      Emoji: "O",
      Texto: "Otra semana",
      Target_Total: 6,
      Unidad: "Horas",
      Fecha_Inicio: "2026-05-04",
      Fecha_Objetivo: "2026-05-10",
      Orden: 2
    });
    Abrir_Metas_Sugeridas();
  });

  await expect(page.locator(".Metas_Sugeridas_Fila")).toHaveCount(1);
  await expect(page.locator(".Metas_Sugeridas_Fila"))
    .toContainText("SEO");
  await expect(
    page.locator(".Metas_Sugeridas_Fila")
      .locator(".Metas_Sugeridas_Vinculo")
      .first()
  ).toContainText("Fecha objetivo:");
  await expect(
    page.locator(".Metas_Sugeridas_Fila")
      .locator(".Metas_Sugeridas_Vinculo")
      .first()
  ).not.toHaveText(/SEO/);
  await expect(
    page.locator(".Metas_Sugeridas_Fila", {
      hasText: "Sin fecha semanal"
    })
  ).toHaveCount(0);
  await expect(
    page.locator(".Metas_Sugeridas_Fila", { hasText: "Otra semana" })
  ).toHaveCount(0);
  await expect(
    page.locator(
      ".Metas_Sugeridas_Acciones .Metas_Sugeridas_Extras_Btn"
    )
  ).toBeVisible();
  await expect(page.locator(".Metas_Sugeridas_Extras_Btn"))
    .toHaveText("Mostrar tareas extra");
  const Extras_Estilo = await page.locator(
    ".Metas_Sugeridas_Extras_Btn"
  ).evaluate((Boton) => {
    const Estilos = getComputedStyle(Boton);
    return {
      acciones: Boolean(Boton.closest(".Metas_Sugeridas_Acciones")),
      background: Estilos.backgroundColor
    };
  });
  expect(Extras_Estilo.acciones).toBe(true);
  expect(Extras_Estilo.background).toBe("rgba(0, 0, 0, 0.06)");
  await page.locator(".Metas_Sugeridas_Extras_Btn").click();
  await expect(page.locator(".Metas_Sugeridas_Fila")).toHaveCount(3);
  await expect(page.locator(".Metas_Sugeridas_Extras_Btn"))
    .toHaveText("Ocultar tareas extra");
  await expect(
    page.locator(".Metas_Sugeridas_Fila", {
      hasText: "Sin fecha semanal"
    })
  ).toHaveCount(1);
  await expect(
    page.locator(".Metas_Sugeridas_Fila", { hasText: "Otra semana" })
  ).toHaveCount(1);
  const Extras = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".Metas_Sugeridas_Fila")
    ).map((Fila) => ({
      id: Fila.dataset.subobjetivoId,
      diario: Fila.dataset.diario || "",
      diarioCorto: Boolean(
        Fila.querySelector(".Metas_Sugeridas_Diario_Corto")
      ),
      vinculo: Fila.querySelector(".Metas_Sugeridas_Vinculo")
        ?.textContent || ""
    }));
  });
  expect(Extras).toEqual([
    expect.objectContaining({
      id: "sub_seo",
      diarioCorto: true
    }),
    expect.objectContaining({
      id: "sub_otra_semana",
      diario: "0",
      diarioCorto: false
    }),
    expect.objectContaining({
      id: "sub_sin_fecha",
      diario: "0",
      diarioCorto: false
    })
  ]);
  await page.locator(".Metas_Sugeridas_Extras_Btn").click();
  await expect(page.locator(".Metas_Sugeridas_Fila")).toHaveCount(1);
  const Z_Index = await page.evaluate(() => ({
    metas: Number(
      getComputedStyle(
        document.getElementById("Metas_Sugeridas_Overlay")
      ).zIndex
    ),
    nota: Number(
      getComputedStyle(
        document.getElementById("Archivero_Nota_Overlay")
      ).zIndex
    )
  }));
  expect(Z_Index.nota).toBeGreaterThan(Z_Index.metas);
  await page.evaluate(() => {
    document.querySelector(".Metas_Sugeridas_Fila")
      ?.classList.add("Abierta");
  });
  await expect(
    page.locator(".Metas_Sugeridas_Expandido")
      .locator(".Metas_Sugeridas_Vinculo")
  ).toContainText("Plan > SEO");
  await expect(page.locator(".Metas_Sugeridas_Descripcion_Toggle"))
    .toHaveText("Comprimir");
  const Descripcion_Toggle = await page.evaluate(() => {
    const Campo = document.querySelector(
      ".Metas_Sugeridas_Campo.Descripcion"
    );
    const Boton = Campo?.querySelector(
      ".Metas_Sugeridas_Descripcion_Toggle"
    );
    const Textarea = Campo?.querySelector("textarea");
    Boton?.click();
    const Comprimida = Campo?.classList.contains("Comprimida");
    const Texto_Comprimido = Boton?.textContent || "";
    const Alto_Comprimido = getComputedStyle(Textarea).height;
    Boton?.click();
    return {
      comprimida: Comprimida,
      textoComprimido: Texto_Comprimido,
      altoComprimido: Alto_Comprimido,
      expandida: !Campo?.classList.contains("Comprimida"),
      textoExpandido: Boton?.textContent || ""
    };
  });
  expect(Descripcion_Toggle).toEqual({
    comprimida: true,
    textoComprimido: "Descomprimir",
    altoComprimido: "34px",
    expandida: true,
    textoExpandido: "Comprimir"
  });

  const Color_Inicial = await page.evaluate(() => {
    const Campo = document.querySelector(".Metas_Sugeridas_Color");
    const Swatches = document.querySelectorAll(
      ".Metas_Sugeridas_Color_Swatches .Swatch"
    );
    const Activa = document.querySelector(
      ".Metas_Sugeridas_Color_Swatches .Swatch.Activa"
    );
    return {
      tipo: Campo?.type,
      valor: Campo?.value,
      libres: document.querySelectorAll(
        ".Metas_Sugeridas_Fila input[type='color']"
      ).length,
      swatches: Swatches.length,
      activa: Activa?.title || ""
    };
  });
  expect(Color_Inicial).toEqual({
    tipo: "hidden",
    valor: "#f1b77e",
    libres: 0,
    swatches: 8,
    activa: "#f1b77e"
  });

  await page.locator(
    ".Metas_Sugeridas_Color_Swatches .Swatch"
  ).nth(1).click();
  await expect(
    page.locator(".Metas_Sugeridas_Color")
  ).toHaveValue("#a6c8e5");

  await page.selectOption(
    ".Metas_Sugeridas_Categoria",
    "cat_custom"
  );
  await expect(
    page.locator(".Metas_Sugeridas_Color")
  ).toHaveValue("#f1b77e");

  await page.evaluate(() => {
    const Boton = document.createElement("button");
    Boton.dataset.partesSeleccionadas = "";
    document.body.appendChild(Boton);
    const Partes = Array.from({ length: 24 }, (_, Indice) => ({
      Parte: {
        Id: `parte_${Indice}`,
        Emoji: "*",
        Nombre: `Parte ${Indice + 1}`
      },
      Oculta: Indice >= 8,
      Sugerida: Indice < 8
    }));
    window.__Metas_Sugeridas_Partes =
      Metas_Sugeridas_Mostrar_Partes(Partes, Boton);
  });

  await expect(page.locator(".Metas_Sugeridas_Partes_Modal"))
    .toBeVisible();
  await page.locator(
    ".Metas_Sugeridas_Partes_Ocultas > summary"
  ).click();

  const Partes_Estilos = await page.evaluate(() => {
    const Cont = document.querySelector(
      ".Metas_Sugeridas_Partes_Modal"
    );
    const Ultima_Visible = Cont.querySelector(
      ":scope > .Metas_Sugeridas_Partes_Item:last-of-type"
    );
    const Ultima_Oculta = Cont.querySelector(
      ".Metas_Sugeridas_Partes_Ocultas_Lista " +
      ".Metas_Sugeridas_Partes_Item:last-of-type"
    );
    return {
      overflowY: getComputedStyle(Cont).overflowY,
      tieneScroll: Cont.scrollHeight > Cont.clientHeight,
      bordeVisible: getComputedStyle(Ultima_Visible)
        .borderBottomWidth,
      bordeOculto: getComputedStyle(Ultima_Oculta)
        .borderBottomWidth
    };
  });
  expect(Partes_Estilos).toEqual({
    overflowY: "auto",
    tieneScroll: true,
    bordeVisible: "0px",
    bordeOculto: "0px"
  });

  await page.locator(".Dialogo_Boton_Cancelar").click();
  await expect(page.locator(".Dialogo_Overlay"))
    .not.toHaveClass(/Activo/);
  expect(errores).toEqual([]);
});

test("metas sugeridas calcula horas desde tiempo y partes importadas",
async ({ page }) => {
  await Preparar(page);
  await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_lectura = Normalizar_Objetivo_Plan({
      Id: "obj_lectura",
      Periodo_Id: "p2026",
      Emoji: "L",
      Nombre: "Lectura",
      Target_Total: 30,
      Unidad: "Unidades",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_libro = Normalizar_Subobjetivo_Plan({
      Id: "sub_libro",
      Objetivo_Id: "obj_lectura",
      Emoji: "B",
      Texto: "Libro",
      Target_Total: 6,
      Target_Suma_Componentes: true,
      Unidad: "Unidades",
      Fecha_Inicio: "2026-04-20",
      Fecha_Objetivo: "2026-04-26",
      Orden: 0
    });
    Modelo.Partes.parte_uno = Normalizar_Parte_Meta({
      Id: "parte_uno",
      Objetivo_Id: "obj_lectura",
      Subobjetivo_Id: "sub_libro",
      Emoji: "1",
      Nombre: "Parte uno",
      Aporte_Total: 4,
      Unidad: "Unidades",
      Tiempo_Valor: 30,
      Tiempo_Modo: "Minutos_Por_Unidad",
      Fecha_Inicio: "2026-04-20",
      Fecha_Objetivo: "2026-04-22",
      Orden: 0
    });
    Modelo.Partes.parte_dos = Normalizar_Parte_Meta({
      Id: "parte_dos",
      Objetivo_Id: "obj_lectura",
      Subobjetivo_Id: "sub_libro",
      Emoji: "2",
      Nombre: "Parte dos",
      Aporte_Total: 2,
      Unidad: "Unidades",
      Tiempo_Valor: 1,
      Tiempo_Modo: "Horas_Por_Unidad",
      Fecha_Inicio: "2026-04-23",
      Fecha_Objetivo: "2026-04-26",
      Orden: 1
    });
    Abrir_Metas_Sugeridas();
  });

  await expect(page.locator(".Metas_Sugeridas_Fila")).toHaveCount(1);
  await expect(page.locator(".Metas_Sugeridas_Horas_Input"))
    .toHaveValue("4");

  await page.evaluate(() => {
    const Boton = document.querySelector(".Metas_Sugeridas_Partes");
    Boton.dataset.partesSeleccionadas = "parte_uno";
    Boton.dispatchEvent(new CustomEvent(
      "metas-sugeridas-partes-cambio",
      { bubbles: true }
    ));
  });
  await expect(page.locator(".Metas_Sugeridas_Horas_Input"))
    .toHaveValue("2");
});
