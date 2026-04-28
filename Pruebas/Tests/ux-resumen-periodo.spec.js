const { test, expect } = require("@playwright/test");

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
        Archivero_Boton: true
      },
      Plan_Actual: "Upgrade",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
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

async function Preparar(page, estadoInicial = Crear_Estado_Base()) {
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

  await page.goto("/login.html");
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

test("resumen por periodo filtra metas y centra navegacion", async ({
  page
}) => {
  await Preparar(page);

  const inicial = await page.evaluate(() => {
    Abrir_Resumen_Semanal();
    Resumen_Sem_Pestana = "Metas";
    Resumen_Sem_Rango_Tipo = "Anio";
    Resumen_Sem_Rango_Base = "2026-06-01";

    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2027;
    const P2026 = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const P2027 = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2027-01-01",
      "2027-12-31",
      null,
      2027
    );
    const Actual = Planes_Crear_Objetivo_Silencioso(P2026.Id, {
      Id: "obj_periodo_2026",
      Nombre: "Meta periodo 2026",
      Emoji: "\u2705",
      Color: "#1f6b4f",
      Target_Total: 10,
      Unidad: "Horas"
    });
    const Futuro = Planes_Crear_Objetivo_Silencioso(P2027.Id, {
      Id: "obj_periodo_2027",
      Nombre: "Meta periodo 2027",
      Emoji: "\uD83D\uDCC5",
      Color: "#7b68a8",
      Target_Total: 10,
      Unidad: "Horas"
    });
    Modelo.Avances.av_2026 = Normalizar_Avance_Plan({
      Id: "av_2026",
      Objetivo_Id: Actual.Id,
      Fuente: "Manual",
      Cantidad: 15,
      Unidad: "Horas",
      Fecha: "2026-03-10",
      Hora: "10:00"
    });
    Modelo.Avances.av_2027 = Normalizar_Avance_Plan({
      Id: "av_2027",
      Objetivo_Id: Futuro.Id,
      Fuente: "Manual",
      Cantidad: 4,
      Unidad: "Horas",
      Fecha: "2027-03-10",
      Hora: "10:00"
    });
    Planes_Actualizar_Progreso(Actual);
    Planes_Actualizar_Progreso(Futuro);
    Render_Resumen_Semanal();

    const Select = document.querySelector(".Resumen_Sem_Rango_Select");
    const Select_Estilo = getComputedStyle(Select);
    const Barra = document.querySelector(".Resumen_Sem_Meta_Barra span");
    const Valor = document.querySelector(".Resumen_Sem_Meta_Dato strong");
    return {
      titulo: document.querySelector(".Resumen_Sem_Titulo")
        ?.textContent?.trim() || "",
      nombres: Array.from(document.querySelectorAll(
        ".Resumen_Sem_Meta_Nombre"
      )).map((Nodo) => Nodo.textContent.trim()),
      orden: Array.from(document.querySelector(
        ".Resumen_Sem_Rango_Centro"
      ).children).map((Nodo) => ({
        tag: Nodo.tagName,
        clase: Nodo.className
      })),
      selectAlign: Select_Estilo.textAlign,
      selectAlignLast: Select_Estilo.textAlignLast,
      barraWidth: Barra?.style.width || "",
      barraFondo: getComputedStyle(Barra).backgroundImage,
      barraColor: getComputedStyle(Barra).backgroundColor,
      valorWeight: getComputedStyle(Valor).fontWeight,
      valorSize: getComputedStyle(Valor).fontSize,
      valorAlign: getComputedStyle(Valor.parentElement).textAlign
    };
  });

  expect(inicial.titulo.toLowerCase()).toContain("per\u00edodo");
  expect(inicial.nombres).toEqual(["Meta periodo 2026"]);
  expect(inicial.orden.map((Item) => Item.tag)).toEqual([
    "BUTTON",
    "SELECT",
    "BUTTON",
    "DIV"
  ]);
  expect(inicial.orden[0].clase).toContain("Resumen_Sem_Rango_Btn");
  expect(inicial.orden[2].clase).toContain("Resumen_Sem_Rango_Btn");
  expect(inicial.selectAlign).toBe("center");
  expect(inicial.selectAlignLast).toBe("center");
  expect(inicial.barraWidth).toBe("100%");
  expect(inicial.barraFondo).toBe("none");
  expect(inicial.barraColor).toBe("rgb(47, 143, 88)");
  expect(Number(inicial.valorWeight)).toBeLessThan(700);
  expect(inicial.valorSize).toBe("11px");
  expect(inicial.valorAlign).toBe("center");

  await page.evaluate(() => document.body.focus());
  await page.keyboard.press("ArrowRight");

  const despues = await page.evaluate(() => ({
    base: Resumen_Sem_Rango_Base,
    texto: document.querySelector(".Resumen_Sem_Rango_Texto")
      ?.textContent?.trim() || "",
    nombres: Array.from(document.querySelectorAll(
      ".Resumen_Sem_Meta_Nombre"
    )).map((Nodo) => Nodo.textContent.trim())
  }));

  expect(despues.base).toBe("2027-01-01");
  expect(despues.texto).toContain("2027");
  expect(despues.nombres).toEqual(["Meta periodo 2027"]);
});

test("dialogo de nota vacia queda sobre nueva nota", async ({ page }) => {
  await Preparar(page);

  await page.evaluate(() => {
    Abrir_Archivero();
    Abrir_Modal_Nota_Archivero(null);
  });
  await page.locator("#Archivero_Nota_Guardar").click();

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  const resultado = await page.evaluate(() => {
    const Dialogo = document.getElementById("Dialogo_Overlay");
    const Nota = document.getElementById("Archivero_Nota_Overlay");
    return {
      mensaje: document.getElementById("Dialogo_Mensaje")
        ?.textContent || "",
      dialogoZ: Number(getComputedStyle(Dialogo).zIndex),
      notaZ: Number(getComputedStyle(Nota).zIndex)
    };
  });

  expect(resultado.mensaje).toContain("nota");
  expect(resultado.dialogoZ).toBeGreaterThan(resultado.notaZ);
});

test("descripcion de periodo en metas se contrae y expande", async ({
  page
}) => {
  await Preparar(page);

  const inicial = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;
    Modelo.UI.Vista = "Tarjetas";
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Periodo.Resumen = [
      "Linea uno de descripcion extensa.",
      "Linea dos con contexto del periodo.",
      "Linea tres con mas informacion.",
      "Linea cuatro que debe quedar oculta al inicio.",
      "Linea cinco para comprobar el colapso."
    ].join("\n");
    Render_Planes_Contenido();
    const Fila = document.querySelector(".Planes_Resumen_Texto_Fila");
    const Texto = Fila.querySelector(".Planes_Resumen_Texto");
    const Toggle = Fila.querySelector(".Planes_Resumen_Texto_Toggle");
    return {
      colapsada: Fila.classList.contains("Colapsada"),
      expandida: Fila.classList.contains("Expandida"),
      maxHeight: getComputedStyle(Texto).maxHeight,
      overflow: getComputedStyle(Texto).overflow,
      toggleTexto: Toggle.textContent
    };
  });

  expect(inicial.colapsada).toBe(true);
  expect(inicial.expandida).toBe(false);
  expect(inicial.maxHeight).not.toBe("none");
  expect(inicial.overflow).toBe("hidden");
  expect(inicial.toggleTexto).toBe("\u25BE");

  await page.locator(".Planes_Resumen_Texto_Toggle").click();
  const expandido = await page.evaluate(() => {
    const Fila = document.querySelector(".Planes_Resumen_Texto_Fila");
    const Texto = Fila.querySelector(".Planes_Resumen_Texto");
    const Tiene_Editor =
      Boolean(document.querySelector(".Planes_Resumen_Editor"));
    return {
      colapsada: Fila.classList.contains("Colapsada"),
      expandida: Fila.classList.contains("Expandida"),
      maxHeight: getComputedStyle(Texto).maxHeight,
      tieneEditor: Tiene_Editor
    };
  });

  expect(expandido.colapsada).toBe(false);
  expect(expandido.expandida).toBe(true);
  expect(expandido.maxHeight).toBe("none");
  expect(expandido.tieneEditor).toBe(false);
});

test("estado guardando inactivo vuelve a guardado", async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    Sync_Timer_Id = null;
    Sync_Reintento_Timer_Id = null;
    Sync_Promesa_En_Curso = null;
    Sync_Local_Sucio = false;
    Sync_Conflicto_Pendiente = false;
    Actualizar_Sync_Indicador("Guardando");
    const pendienteAntes = Hay_Sync_Pendiente();
    Resolver_Sync_Guardando_Inactivo();
    return {
      pendienteAntes,
      estado: Sync_Estado,
      pendienteDespues: Hay_Sync_Pendiente()
    };
  });

  expect(resultado.pendienteAntes).toBe(false);
  expect(resultado.estado).toBe("Guardado");
  expect(resultado.pendienteDespues).toBe(false);
});
