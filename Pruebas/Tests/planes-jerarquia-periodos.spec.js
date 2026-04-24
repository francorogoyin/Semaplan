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

test("Formularios de target muestran labels con mayuscula y ayuda",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Render_Plan();
  });

  await page.click("[data-plan-universo-nuevo]");
  const Objetivo = await page.evaluate(() => {
    const Label = document.querySelector(".Planes_Meta_Campo > label");
    const Suma = document.querySelector(
      "#Planes_Objetivo_Target_Suma"
    ).closest(".Planes_Target_Suma_Fila");
    const Texto = Suma.querySelector("[data-i18n]");
    const Ayuda = Suma.querySelector(".Planes_Target_Suma_Ayuda");
    return {
      labelTexto: Label.textContent.trim(),
      labelTransform: getComputedStyle(Label).textTransform,
      sumaTexto: Texto.textContent.trim(),
      sumaTransform: getComputedStyle(Texto.parentElement).textTransform,
      ayudaTexto: Ayuda.textContent.trim(),
      ayudaTitulo: Ayuda.title
    };
  });
  await page.click("#Planes_Objetivo_Cancelar");

  const Subobjetivo = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    const Objetivo_Item = Normalizar_Objetivo_Plan({
      Id: "obj_target_ayuda",
      Periodo_Id: Periodo.Id,
      Nombre: "Objetivo",
      Target_Total: 10,
      Orden: 0
    });
    Modelo.Objetivos[Objetivo_Item.Id] = Objetivo_Item;
    Abrir_Modal_Planes_Subobjetivos(Objetivo_Item.Id);
    Abrir_Modal_Planes_Subobjetivo_Nuevo();

    const Label = document.querySelector(
      ".Planes_Subobjetivo_Meta_Campo > label"
    );
    const Suma = document.querySelector(
      "#Planes_Subobjetivo_Target_Suma"
    ).closest(".Planes_Target_Suma_Fila");
    const Texto = Suma.querySelector("[data-i18n]");
    const Ayuda = Suma.querySelector(".Planes_Target_Suma_Ayuda");
    return {
      labelTexto: Label.textContent.trim(),
      labelTransform: getComputedStyle(Label).textTransform,
      sumaTexto: Texto.textContent.trim(),
      sumaTransform: getComputedStyle(Texto.parentElement).textTransform,
      ayudaTexto: Ayuda.textContent.trim(),
      ayudaTitulo: Ayuda.title
    };
  });

  expect(errores).toEqual([]);
  expect(Objetivo.labelTexto).toBe("Valor objetivo");
  expect(Objetivo.labelTransform).toBe("none");
  expect(Objetivo.sumaTexto).toBe("Suma");
  expect(Objetivo.sumaTransform).toBe("none");
  expect(Objetivo.ayudaTexto).toBe("?");
  expect(Objetivo.ayudaTitulo).toContain("componentes");
  expect(Subobjetivo.labelTexto).toBe("Valor objetivo");
  expect(Subobjetivo.labelTransform).toBe("none");
  expect(Subobjetivo.sumaTexto).toBe("Suma");
  expect(Subobjetivo.sumaTransform).toBe("none");
  expect(Subobjetivo.ayudaTexto).toBe("?");
  expect(Subobjetivo.ayudaTitulo).toContain("componentes");
});

test("Planes usa capas sin semana y fija fechas del objetivo al periodo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Render_Plan();
  });

  const Capas = await page.locator("#Planes_Capa_Select option")
    .evaluateAll((Opciones) => Opciones.map((Opcion) => Opcion.value));
  expect(Capas).toEqual(["Anio", "Semestre", "Trimestre", "Mes"]);

  await page.click("[data-plan-universo-nuevo]");
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toHaveValue("2026-01-01");
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toHaveValue("2026-12-31");
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toBeDisabled();
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toBeDisabled();
  await page.click("#Planes_Objetivo_Cancelar");

  await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.UI.Filtro_Tipo = "Mes";
    Modelo.UI.Subperiodo_Activo = 4;
    const Periodo = Planes_Crear_Periodo_Seleccionado("Mes");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Render_Plan();
  });
  await page.click("[data-plan-universo-nuevo]");
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toHaveValue("2026-04-01");
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toHaveValue("2026-04-30");
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toBeDisabled();
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toBeDisabled();

  expect(errores).toEqual([]);
});

test("Subobjetivo creado desde hijo mostrado conserva rango del padre",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Limites = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestre = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-04-01",
      "2026-06-30",
      Anio.Id,
      2
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Proyecto anual",
      Target_Total: 12,
      Unidad: "Horas",
      Unidad_Subobjetivos_Default: "Horas"
    });
    const Hijo = Planes_Crear_Objetivo_Silencioso(Trimestre.Id, {
      Nombre: "Proyecto anual T2",
      Target_Total: 3,
      Unidad: "Horas",
      Unidad_Subobjetivos_Default: "Horas",
      Objetivo_Padre_Id: Padre.Id
    });
    Abrir_Modal_Planes_Subobjetivos(Hijo.Id, false, Trimestre.Id);
    Abrir_Modal_Planes_Subobjetivo_Nuevo();
    const Inicio = document.getElementById(
      "Planes_Subobjetivo_Fecha_Inicio"
    );
    const Objetivo = document.getElementById(
      "Planes_Subobjetivo_Fecha_Objetivo"
    );
    return {
      inicioMin: Inicio.min,
      inicioMax: Inicio.max,
      inicioValor: Inicio.value,
      objetivoMin: Objetivo.min,
      objetivoMax: Objetivo.max,
      objetivoValor: Objetivo.value
    };
  });

  expect(Limites).toEqual({
    inicioMin: "2026-01-01",
    inicioMax: "2026-12-31",
    inicioValor: "",
    objetivoMin: "2026-01-01",
    objetivoMax: "2026-12-31",
    objetivoValor: ""
  });

  const Guardado = await page.evaluate(async () => {
    document.getElementById("Planes_Subobjetivo_Texto").value =
      "Sub anual desde T2";
    document.getElementById("Planes_Subobjetivo_Fecha_Inicio").value =
      "2026-02-01";
    document.getElementById("Planes_Subobjetivo_Fecha_Objetivo").value =
      "2026-11-01";
    await Guardar_Modal_Planes_Subobjetivo();
    const Sub = Object.values(Asegurar_Modelo_Planes().Subobjetivos)
      .find((Item) => Item.Texto === "Sub anual desde T2");
    return {
      overlayAbierto: document.getElementById(
        "Planes_Subobjetivo_Overlay"
      ).classList.contains("Activo"),
      inicio: Sub?.Fecha_Inicio || "",
      objetivo: Sub?.Fecha_Objetivo || ""
    };
  });

  expect(Guardado).toEqual({
    overlayAbierto: false,
    inicio: "2026-02-01",
    objetivo: "2026-11-01"
  });
  expect(errores).toEqual([]);
});

test("Subobjetivo realizado muestra fecha final calculada y bloquea fechas",
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
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Lecturas",
      Target_Total: 10,
      Unidad: "Horas",
      Unidad_Subobjetivos_Default: "Horas"
    });
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro"
    );
    const M = Asegurar_Modelo_Planes();
    const Sub = M.Subobjetivos[Sub_Id];
    Object.assign(Sub, {
      Target_Total: 5,
      Fecha_Inicio: "2026-03-01",
      Fecha_Objetivo: "2026-05-31"
    });
    M.Avances.av_sub_fecha_final = Normalizar_Avance_Plan({
      Id: "av_sub_fecha_final",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub.Id,
      Fuente: "Subobjetivo",
      Cantidad: 5,
      Unidad: "Horas",
      Fecha: "2026-04-15",
      Hora: "10:30"
    });
    Planes_Recalcular_Progreso_Subobjetivo(Sub, M);
    Abrir_Modal_Planes_Subobjetivo(Sub.Id);
    const Inicio = document.getElementById(
      "Planes_Subobjetivo_Fecha_Inicio"
    );
    const Objetivo_Fecha = document.getElementById(
      "Planes_Subobjetivo_Fecha_Objetivo"
    );
    const Final = document.getElementById(
      "Planes_Subobjetivo_Fecha_Fin"
    );
    const Campo_Final = Final.closest(
      ".Planes_Subobjetivo_Fecha_Fin_Campo"
    );
    const Campo_Inicio = Inicio.closest(
      ".Planes_Subobjetivo_Fecha_Ini_Campo"
    );
    const Campo_Objetivo = Objetivo_Fecha.closest(
      ".Planes_Subobjetivo_Fecha_Obj_Campo"
    );
    const Rect_Inicio = Campo_Inicio.getBoundingClientRect();
    const Rect_Objetivo = Campo_Objetivo.getBoundingClientRect();
    const Rect_Final = Campo_Final.getBoundingClientRect();
    const Realizado = {
      inicioDisabled: Inicio.disabled,
      objetivoDisabled: Objetivo_Fecha.disabled,
      finalVisible: !Campo_Final.hidden,
      finalValor: Final.value,
      formConFechaFinal: document
        .getElementById("Planes_Subobjetivo_Form")
        .classList.contains("Con_Fecha_Final"),
      fechasMismaLinea:
        Math.abs(Rect_Inicio.top - Rect_Objetivo.top) < 2 &&
        Math.abs(Rect_Inicio.top - Rect_Final.top) < 2
    };
    Cerrar_Modal_Planes_Subobjetivo();
    delete M.Avances.av_sub_fecha_final;
    Planes_Recalcular_Progreso_Subobjetivo(Sub, M);
    Abrir_Modal_Planes_Subobjetivo(Sub.Id);
    const Abierto = {
      inicioDisabled: Inicio.disabled,
      objetivoDisabled: Objetivo_Fecha.disabled,
      finalVisible: !Campo_Final.hidden,
      finalValor: Final.value,
      fechaFinModelo: Sub.Fecha_Fin || "",
      formConFechaFinal: document
        .getElementById("Planes_Subobjetivo_Form")
        .classList.contains("Con_Fecha_Final")
    };
    return { Realizado, Abierto };
  });

  expect(Resultado).toEqual({
    Realizado: {
      inicioDisabled: true,
      objetivoDisabled: true,
      finalVisible: true,
      finalValor: "2026-04-15",
      formConFechaFinal: true,
      fechasMismaLinea: true
    },
    Abierto: {
      inicioDisabled: false,
      objetivoDisabled: false,
      finalVisible: false,
      finalValor: "",
      fechaFinModelo: "",
      formConFechaFinal: false
    }
  });
  expect(errores).toEqual([]);
});

test("Tarjeta de objetivo resume avance con bolitas de estado",
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
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;
    Modelo.UI.Vista = "Tarjetas";
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Independencia financiera",
      Target_Total: 4,
      Unidad: "Personalizado",
      Unidad_Custom: "proyectos",
      Progreso_Importado: 2
    });
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Proyecto asignado"
    );
    Planes_Actualizar_Subobjetivo_Datos(Sub_Id, {
      Target_Total: 2,
      Aporte_Meta: 2,
      Unidad: "Personalizado",
      Unidad_Custom: "proyectos",
      Fecha_Objetivo: "2026-06-01"
    });
    Planes_Actualizar_Progreso(Objetivo);
    Render_Planes_Contenido();

    const Resumen = document.querySelector(
      `[data-plan-objetivo-id="${Objetivo.Id}"] ` +
      ".Planes_Objetivo_Cantidad"
    );
    return {
      items: Array.from(
        Resumen.querySelectorAll(".Planes_Objetivo_Cantidad_Item")
      ).map((Nodo) =>
        Nodo.textContent.replace(/\s+/g, " ").trim()
      ),
      separadores: Resumen.querySelectorAll(
        ".Planes_Objetivo_Cantidad_Sep"
      ).length,
      colores: Array.from(
        Resumen.querySelectorAll(".Planes_Objetivo_Cantidad_Bolita")
      ).map((Nodo) => getComputedStyle(Nodo).backgroundColor)
    };
  });

  expect(Resultado.items).toEqual([
    "4 proyectos",
    "2 asignados",
    "2 realizados",
    "2 faltan"
  ]);
  expect(Resultado.separadores).toBe(3);
  expect(Resultado.colores).toEqual([
    "rgb(143, 138, 130)",
    "rgb(63, 127, 194)",
    "rgb(63, 143, 98)",
    "rgb(186, 75, 67)"
  ]);
  expect(errores).toEqual([]);
});

test("Detalle de objetivo muestra columnas finales de unidades",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Detalle_Unidades = await page.evaluate(() => {
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Periodo = Planes_Crear_Periodo_Seleccionado("Anio");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Detalle con unidades",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 6,
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
    const Modelo_Actual = Asegurar_Modelo_Planes();
    Object.assign(Modelo_Actual.Subobjetivos[Sub_A], {
      Target_Total: 2,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Tiempo_Valor: 30,
      Tiempo_Modo: "Minutos_Por_Unidad"
    });
    Object.assign(Modelo_Actual.Subobjetivos[Sub_B], {
      Target_Total: 3,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    Planes_Actualizar_Progreso(Objetivo);
    const Host = document.createElement("div");
    Host.innerHTML = Render_Planes_Detalle_Objetivo(Objetivo);
    const Objetivo_Incompleto = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Detalle sin tiempo",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 2,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Sub_C = Planes_Agregar_Subobjetivo(
      Objetivo_Incompleto.Id,
      "Libro C"
    );
    const Sub_D = Planes_Agregar_Subobjetivo(
      Objetivo_Incompleto.Id,
      "Libro D"
    );
    const Sub_C_Item = Modelo_Actual.Subobjetivos[Sub_C] || Sub_C;
    const Sub_D_Item = Modelo_Actual.Subobjetivos[Sub_D] || Sub_D;
    Sub_C_Item.Target_Total = 1;
    Sub_D_Item.Target_Total = 1;
    Planes_Actualizar_Progreso(Objetivo_Incompleto);
    const Host_Incompleto = document.createElement("div");
    Host_Incompleto.innerHTML =
      Render_Planes_Detalle_Objetivo(Objetivo_Incompleto);
    return {
      headers: Array.from(Host.querySelectorAll("th"))
        .map((Th) => Th.textContent.trim()),
      celdas: Array.from(Host.querySelectorAll("td"))
        .map((Td) => Td.textContent.replace(/\s+/g, " ").trim()),
      avisoTiempo: Host.querySelector(".Planes_Tiempo_Warning")
        ?.getAttribute("title") || "",
      sinTiempoTexto: Array.from(
        Host_Incompleto.querySelectorAll("td")
      ).pop()?.textContent.replace(/\s+/g, " ").trim() || "",
      sinTiempoAviso: Host_Incompleto
        .querySelector(".Planes_Tiempo_Warning")
        ?.getAttribute("title") || ""
    };
  });

  expect(Detalle_Unidades.headers).toEqual([
    "Estado",
    "Valor objetivo",
    "Realizado",
    "Falta",
    "Total de unidades",
    "Faltantes",
    "Realizadas",
    "Tiempo aprox."
  ]);
  expect(Detalle_Unidades.celdas.slice(-4)).toEqual([
    "5 libros",
    "5",
    "0",
    "1 h aprox. !"
  ]);
  expect(Detalle_Unidades.avisoTiempo)
    .toContain("No están todas las unidades hijas");
  expect(Detalle_Unidades.sinTiempoTexto).toBe("!");
  expect(Detalle_Unidades.sinTiempoAviso)
    .toContain("No están todas las unidades hijas");
  expect(errores).toEqual([]);
});

test("Redistribucion mensual edita el objetivo real y se ve en hijos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Semestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Semestre");
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros",
      Emoji: "\uD83D\uDCD6",
      Target_Total: 120,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    Abrir_Modal_Planes_Objetivo(Meses[0].Id, Objetivo.Id);
    const Resumen_Inicial = document
      .getElementById("Planes_Objetivo_Redistribucion_Resumen")
      ?.textContent || "";
    const Redistribucion_En_Acciones = Boolean(
      document.querySelector(
        ".Patron_Modal_Acciones #Planes_Objetivo_Redistribucion"
      )
    );
    document.getElementById("Planes_Objetivo_Redistribucion").click();
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    const Overlay = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    const Overlay_Visible = getComputedStyle(Overlay).display !== "none";
    const Overlay_Z_Index = Number(getComputedStyle(Overlay).zIndex) || 0;
    const Tipo = Overlay.querySelector("[data-plan-redis-tipo]");
    const Modo = Overlay.querySelector("[data-plan-redis-modo]");
    Tipo.value = "Mes";
    Tipo.dispatchEvent(new Event("change"));
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    const Overlay_Actual = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    const Modo_Actual =
      Overlay_Actual.querySelector("[data-plan-redis-modo]");
    Modo_Actual.value = "Manual";
    Modo_Actual.dispatchEvent(new Event("change"));
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    const Overlay_Manual = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    Overlay_Manual
      .querySelectorAll("[data-plan-redis-periodo]")
      .forEach((Input) => { Input.value = "10"; });
    Overlay_Manual.querySelector("[data-plan-redis-guardar]").click();
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    const Resumen_Manual = document
      .getElementById("Planes_Objetivo_Redistribucion_Resumen")
      ?.textContent || "";
    await Guardar_Modal_Planes_Objetivo();

    const Guardado =
      Asegurar_Modelo_Planes().Objetivos[Objetivo.Id];
    const Semestre = Planes_Objetivo_Para_Periodo(
      Guardado,
      Semestres[0]
    );
    const Trimestre = Planes_Objetivo_Para_Periodo(
      Guardado,
      Trimestres[0]
    );
    const Mes = Planes_Objetivo_Para_Periodo(Guardado, Meses[0]);

    return {
      Vive_En_Anio: Guardado.Periodo_Id === Anio.Id,
      Modo: Guardado.Redistribucion_Target?.Modo || "",
      Tipo: Guardado.Redistribucion_Target?.Tipo || "",
      Resumen_Inicial,
      Resumen_Manual,
      Redistribucion_En_Acciones,
      Overlay_Visible,
      Overlay_Z_Index,
      Semestre: Number(Semestre.Target_Total) || 0,
      Trimestre: Number(Trimestre.Target_Total) || 0,
      Mes: Number(Mes.Target_Total) || 0,
      Overlay_Cerrado: document.getElementById("Planes_Objetivo_Overlay")
        ?.classList.contains("Activo")
    };
  });

  expect(Resultado.Vive_En_Anio).toBe(true);
  expect(Resultado.Tipo).toBe("Mes");
  expect(Resultado.Modo).toBe("Manual");
  expect(Resultado.Resumen_Inicial).toContain("Mensual");
  expect(Resultado.Resumen_Manual).toContain("Mensual");
  expect(Resultado.Resumen_Manual).toContain("Manual");
  expect(Resultado.Redistribucion_En_Acciones).toBe(false);
  expect(Resultado.Overlay_Visible).toBe(true);
  expect(Resultado.Overlay_Z_Index).toBeGreaterThan(6000);
  expect(Resultado.Semestre).toBe(60);
  expect(Resultado.Trimestre).toBe(30);
  expect(Resultado.Mes).toBe(10);
  expect(Resultado.Overlay_Cerrado).toBe(false);
  expect(errores).toEqual([]);
});

test("Redistribucion permite fijar y anular periodos parciales",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Fondo",
      Emoji: "\uD83D\uDCB0",
      Target_Total: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "proyecto"
    });
    Abrir_Modal_Planes_Objetivo(Anio.Id, Objetivo.Id);
    document.getElementById("Planes_Objetivo_Redistribucion").click();
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    let Overlay = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    const Tipo = Overlay.querySelector("[data-plan-redis-tipo]");
    Tipo.value = "Mes";
    Tipo.dispatchEvent(new Event("change"));
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    Overlay = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));

    const Enero = Meses[0].Id;
    const Febrero = Meses[1].Id;
    const Fijar_Enero = Overlay.querySelector(
      `[data-plan-redis-fijar="${Enero}"]`
    );
    Fijar_Enero.checked = true;
    Fijar_Enero.dispatchEvent(new Event("change"));
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    Overlay = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    const Input_Enero = Overlay.querySelector(
      `[data-plan-redis-periodo="${Enero}"]`
    );
    Input_Enero.value = "0.25";
    Input_Enero.dispatchEvent(new Event("input"));
    const Display_Marzo_En_Vivo = Overlay.querySelector(
      `[data-plan-redis-periodo="${Meses[2].Id}"]`
    ).value;
    const Anular_Febrero = Overlay.querySelector(
      `[data-plan-redis-anular="${Febrero}"]`
    );
    Anular_Febrero.checked = true;
    Anular_Febrero.dispatchEvent(new Event("change"));
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    Overlay = Array.from(
      document.querySelectorAll(".Patron_Modal_Overlay.Activo")
    ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
    const Input_Marzo = Overlay.querySelector(
      `[data-plan-redis-periodo="${Meses[2].Id}"]`
    );
    const Display_Marzo = Input_Marzo.value;
    Overlay.querySelector("[data-plan-redis-guardar]").click();
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    await Guardar_Modal_Planes_Objetivo();

    const Guardado = Asegurar_Modelo_Planes().Objetivos[Objetivo.Id];
    const Targets =
      Planes_Targets_Redistribucion_Contextual(Guardado);
    Modelo.UI.Mostrar_Ocultos_Periodo = false;
    const Febrero_Visible = Planes_Filtrar_Objetivos(Meses[1]).length;
    const Febrero_Oculto = Planes_Objetivo_Oculto_En_Periodo(
      Guardado,
      Meses[1],
      Modelo
    );

    return {
      Tipo: Guardado.Redistribucion_Target.Tipo,
      Fijado_Enero: Guardado.Redistribucion_Target.Fijados[Enero],
      Anulado_Febrero: Guardado.Redistribucion_Target.Anulados[Febrero],
      Target_Enero: Targets.get(Enero),
      Target_Febrero: Targets.get(Febrero),
      Target_Marzo: Targets.get(Meses[2].Id),
      Display_Marzo_En_Vivo,
      Display_Marzo,
      Febrero_Visible,
      Febrero_Oculto
    };
  });

  expect(Resultado.Tipo).toBe("Mes");
  expect(Resultado.Fijado_Enero).toBe(true);
  expect(Resultado.Anulado_Febrero).toBe(true);
  expect(Resultado.Target_Enero).toBe(0.25);
  expect(Resultado.Target_Febrero).toBe(0);
  expect(Resultado.Target_Marzo).toBeCloseTo(0.075, 5);
  expect(Resultado.Display_Marzo_En_Vivo).toBe("0.07");
  expect(Resultado.Display_Marzo).toBe("0.08");
  expect(Resultado.Febrero_Visible).toBe(0);
  expect(Resultado.Febrero_Oculto).toBe(true);
  expect(errores).toEqual([]);
});

test("Redistribucion de deuda no cambia periodo cerrado al fijar",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    const Date_Real = window.Date;
    class Date_Fija extends Date_Real {
      constructor(...Args) {
        if (Args.length) {
          super(...Args);
          return;
        }
        super("2026-04-23T12:00:00");
      }
      static now() {
        return new Date_Real("2026-04-23T12:00:00").getTime();
      }
    }
    Date_Fija.UTC = Date_Real.UTC;
    Date_Fija.parse = Date_Real.parse;
    window.Date = Date_Fija;
    try {
      Abrir_Plan();
      const Modelo = Asegurar_Jerarquia_Planes();
      Modelo.UI.Anio_Desde = 2026;
      Modelo.UI.Anio_Hasta = 2026;
      Modelo.UI.Anio_Activo = 2026;
      const Anio = Planes_Crear_Periodo(
        Modelo,
        "Anio",
        "2026-01-01",
        "2026-12-31",
        null,
        2026
      );
      const Trimestres =
        Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
      const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 120,
        Unidad: "Personalizado",
        Unidad_Custom: "proyectos"
      });
      Abrir_Modal_Planes_Objetivo(Anio.Id, Objetivo.Id);
      document.getElementById("Planes_Objetivo_Redistribucion").click();
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      let Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      Overlay.querySelector("[data-plan-redis-tipo]").value = "Trimestre";
      Overlay.querySelector("[data-plan-redis-tipo]")
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      Overlay.querySelector("[data-plan-redis-modo]").value = "Deuda";
      Overlay.querySelector("[data-plan-redis-modo]")
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      const T2 = Trimestres[1].Id;
      Overlay.querySelector(`[data-plan-redis-fijar="${T2}"]`)
        .checked = true;
      Overlay.querySelector(`[data-plan-redis-fijar="${T2}"]`)
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      const Input_T2 = Overlay.querySelector(
        `[data-plan-redis-periodo="${T2}"]`
      );
      Input_T2.value = "80";
      Input_T2.dispatchEvent(new Event("input"));
      const Display = Trimestres.map((Periodo) => {
        return Overlay.querySelector(
          `[data-plan-redis-periodo="${Periodo.Id}"]`
        ).value;
      });
      Overlay.querySelector("[data-plan-redis-guardar]").click();
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      await Guardar_Modal_Planes_Objetivo();
      const Guardado = Asegurar_Modelo_Planes().Objetivos[Objetivo.Id];
      const Targets =
        Planes_Targets_Redistribucion_Contextual(Guardado);
      return {
        Display,
        T1: Targets.get(Trimestres[0].Id),
        T2: Targets.get(Trimestres[1].Id),
        T3: Targets.get(Trimestres[2].Id),
        T4: Targets.get(Trimestres[3].Id)
      };
    } finally {
      window.Date = Date_Real;
    }
  });

  expect(Resultado.Display).toEqual(["30", "80", "20", "20"]);
  expect(Resultado.T1).toBe(30);
  expect(Resultado.T2).toBe(80);
  expect(Resultado.T3).toBe(20);
  expect(Resultado.T4).toBe(20);
  expect(errores).toEqual([]);
});

test("Redistribucion de deuda contempla excedente en cerrado",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Date_Real = window.Date;
    class Date_Fija extends Date_Real {
      constructor(...Args) {
        if (Args.length) {
          super(...Args);
          return;
        }
        super("2026-04-23T12:00:00");
      }
      static now() {
        return new Date_Real("2026-04-23T12:00:00").getTime();
      }
    }
    Date_Fija.UTC = Date_Real.UTC;
    Date_Fija.parse = Date_Real.parse;
    window.Date = Date_Fija;
    try {
      Abrir_Plan();
      const Modelo = Asegurar_Jerarquia_Planes();
      Modelo.UI.Anio_Desde = 2026;
      Modelo.UI.Anio_Hasta = 2026;
      Modelo.UI.Anio_Activo = 2026;
      const Anio = Planes_Crear_Periodo(
        Modelo,
        "Anio",
        "2026-01-01",
        "2026-12-31",
        null,
        2026
      );
      const Trimestres =
        Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
      const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 120,
        Unidad: "Personalizado",
        Unidad_Custom: "proyectos",
        Redistribucion_Target: {
          Tipo: "Trimestre",
          Modo: "Deuda",
          Valores: {},
          Fijados: {},
          Anulados: {}
        }
      });
      const Avance_Id = Crear_Id_Avance_Plan();
      Modelo.Avances[Avance_Id] = Normalizar_Avance_Plan({
        Id: Avance_Id,
        Objetivo_Id: Objetivo.Id,
        Fuente: "Manual",
        Cantidad: 50,
        Unidad: "proyectos",
        Fecha: "2026-02-01",
        Hora: "10:00"
      });
      Planes_Actualizar_Progreso(Objetivo);
      const Targets =
        Planes_Targets_Redistribucion_Contextual(Objetivo);
      return {
        T1: Targets.get(Trimestres[0].Id),
        T2: Targets.get(Trimestres[1].Id),
        T3: Targets.get(Trimestres[2].Id),
        T4: Targets.get(Trimestres[3].Id)
      };
    } finally {
      window.Date = Date_Real;
    }
  });

  expect(Resultado.T1).toBe(30);
  expect(Resultado.T2).toBeCloseTo(23.333333, 5);
  expect(Resultado.T3).toBeCloseTo(23.333333, 5);
  expect(Resultado.T4).toBeCloseTo(23.333333, 5);
  expect(errores).toEqual([]);
});

test("Redistribucion de deuda no reparte en cerrado ni anulado",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    const Date_Real = window.Date;
    class Date_Fija extends Date_Real {
      constructor(...Args) {
        if (Args.length) {
          super(...Args);
          return;
        }
        super("2026-04-23T12:00:00");
      }
      static now() {
        return new Date_Real("2026-04-23T12:00:00").getTime();
      }
    }
    Date_Fija.UTC = Date_Real.UTC;
    Date_Fija.parse = Date_Real.parse;
    window.Date = Date_Fija;
    try {
      Abrir_Plan();
      const Modelo = Asegurar_Jerarquia_Planes();
      Modelo.UI.Anio_Desde = 2026;
      Modelo.UI.Anio_Hasta = 2026;
      Modelo.UI.Anio_Activo = 2026;
      const Anio = Planes_Crear_Periodo(
        Modelo,
        "Anio",
        "2026-01-01",
        "2026-12-31",
        null,
        2026
      );
      const Trimestres =
        Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
      const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 120,
        Unidad: "Personalizado",
        Unidad_Custom: "proyectos"
      });
      Abrir_Modal_Planes_Objetivo(Anio.Id, Objetivo.Id);
      document.getElementById("Planes_Objetivo_Redistribucion").click();
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      let Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      Overlay.querySelector("[data-plan-redis-tipo]").value = "Trimestre";
      Overlay.querySelector("[data-plan-redis-tipo]")
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      Overlay.querySelector("[data-plan-redis-modo]").value = "Deuda";
      Overlay.querySelector("[data-plan-redis-modo]")
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      const T2 = Trimestres[1].Id;
      Overlay.querySelector(`[data-plan-redis-anular="${T2}"]`)
        .checked = true;
      Overlay.querySelector(`[data-plan-redis-anular="${T2}"]`)
        .dispatchEvent(new Event("change"));
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      Overlay = Array.from(
        document.querySelectorAll(".Patron_Modal_Overlay.Activo")
      ).find((Nodo) => Nodo.querySelector("[data-plan-redis-tipo]"));
      const Display = Trimestres.map((Periodo) => {
        return Overlay.querySelector(
          `[data-plan-redis-periodo="${Periodo.Id}"]`
        ).value;
      });
      Overlay.querySelector("[data-plan-redis-guardar]").click();
      await new Promise((Resolver) => setTimeout(Resolver, 0));
      await Guardar_Modal_Planes_Objetivo();
      const Guardado = Asegurar_Modelo_Planes().Objetivos[Objetivo.Id];
      const Targets =
        Planes_Targets_Redistribucion_Contextual(Guardado);
      return {
        Display,
        T1: Targets.get(Trimestres[0].Id),
        T2: Targets.get(Trimestres[1].Id),
        T3: Targets.get(Trimestres[2].Id),
        T4: Targets.get(Trimestres[3].Id)
      };
    } finally {
      window.Date = Date_Real;
    }
  });

  expect(Resultado.Display).toEqual(["30", "0", "60", "60"]);
  expect(Resultado.T1).toBe(30);
  expect(Resultado.T2).toBe(0);
  expect(Resultado.T3).toBe(60);
  expect(Resultado.T4).toBe(60);
  expect(errores).toEqual([]);
});

test("Pausar objetivo cambia visual e indicador de ritmo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Independencia financiera",
      Emoji: "\uD83D\uDCB0",
      Target_Total: 100,
      Unidad: "Personalizado",
      Unidad_Custom: "proyectos"
    });
    Objetivo.Pausado = true;
    Render_Planes_Contenido();
    const Card = document.querySelector(
      `[data-plan-objetivo-id="${Objetivo.Id}"]`
    );
    const Ritmo_Pausado = Planes_Ritmo_Objetivo(Objetivo);
    Objetivo.Pausado = false;
    Objetivo.Progreso_Manual = 10;
    Objetivo.Modo_Progreso = "Manual";
    Planes_Actualizar_Progreso(Objetivo);
    const Ritmo_Activo = Planes_Ritmo_Objetivo(Objetivo);
    return {
      Clase_Pausada: Card?.classList.contains("Pausado") || false,
      Texto_Pausado: Card?.textContent.includes("Pausado") || false,
      Ritmo_Pausado: Ritmo_Pausado?.Clase || "",
      Ritmo_Activo: Ritmo_Activo?.Clase || ""
    };
  });

  expect(Resultado.Clase_Pausada).toBe(true);
  expect(Resultado.Texto_Pausado).toBe(true);
  expect(Resultado.Ritmo_Pausado).toBe("Pausado");
  expect(["En_Ritmo", "Atrasado"]).toContain(Resultado.Ritmo_Activo);
  expect(errores).toEqual([]);
});

test("Trasladar copia pendientes sin fechas y bloquea duplicados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2027;
    const Anio_2026 = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Anio_2027 = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2027-01-01",
      "2027-12-31",
      null,
      2027
    );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio_2026.Id, {
      Nombre: "Leer libros",
      Emoji: "\uD83D\uDCD6",
      Target_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    const Sub_Hecho_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro terminado",
      "\u2705"
    );
    const Sub_Hecho =
      Asegurar_Modelo_Planes().Subobjetivos[Sub_Hecho_Id];
    const Sub_Pendiente_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro pendiente",
      "\uD83D\uDCD8"
    );
    const Sub_Pendiente =
      Asegurar_Modelo_Planes().Subobjetivos[Sub_Pendiente_Id];
    Asegurar_Modelo_Planes().Subobjetivos[Sub_Hecho_Id].Hecha = true;
    Asegurar_Modelo_Planes().Subobjetivos[Sub_Hecho_Id].Estado =
      "Cumplido";
    const Sub_Pendiente_Actual =
      Asegurar_Modelo_Planes().Subobjetivos[Sub_Pendiente_Id];
    Sub_Pendiente_Actual.Fecha_Inicio = "2026-04-01";
    Sub_Pendiente_Actual.Fecha_Objetivo = "2026-05-01";
    const Parte_Realizada_Id = Crear_Id_Parte_Meta();
    Asegurar_Modelo_Planes().Partes[Parte_Realizada_Id] =
      Normalizar_Parte_Meta({
      Id: Parte_Realizada_Id,
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Pendiente_Id,
      Nombre: "Parte realizada",
      Aporte_Total: 1,
      Estado: "Realizada"
    });
    const Parte_Pendiente_Id = Crear_Id_Parte_Meta();
    Asegurar_Modelo_Planes().Partes[Parte_Pendiente_Id] =
      Normalizar_Parte_Meta({
      Id: Parte_Pendiente_Id,
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Pendiente_Id,
      Nombre: "Parte pendiente",
      Aporte_Total: 1,
      Estado: "Pendiente",
      Fecha_Inicio: "2026-04-16",
      Fecha_Objetivo: "2026-04-30"
    });
    const Copia = Planes_Copiar_Objetivo_A_Periodo(
      Objetivo,
      Anio_2027,
      {
        Solo_Pendientes: true,
        Limpiar_Fechas: true,
        Omitir_Partes_Realizadas: true
      }
    );
    const Duplicado = Planes_Copiar_Objetivo_A_Periodo(
      Objetivo,
      Anio_2027,
      {
        Solo_Pendientes: true,
        Limpiar_Fechas: true,
        Omitir_Partes_Realizadas: true
      }
    );
    const Subs = Planes_Subobjetivos_De_Objetivo(Copia.Id);
    const Partes = Object.values(Asegurar_Modelo_Planes().Partes)
      .filter((Parte) => Parte.Objetivo_Id === Copia.Id);
    return {
      Copia_Periodo: Copia.Periodo_Id,
      Duplicado_Nulo: Duplicado === null,
      Subs: Subs.map((Sub) => ({
        Texto: Sub.Texto,
        Hecha: Sub.Hecha,
        Fecha_Inicio: Sub.Fecha_Inicio,
        Fecha_Objetivo: Sub.Fecha_Objetivo
      })),
      Partes: Partes.map((Parte) => ({
        Nombre: Parte.Nombre,
        Estado: Parte.Estado,
        Fecha_Inicio: Parte.Fecha_Inicio,
        Fecha_Objetivo: Parte.Fecha_Objetivo
      }))
    };
  });

  expect(Resultado.Copia_Periodo).toBe("P_Anio_2027-01-01_2027-12-31");
  expect(Resultado.Duplicado_Nulo).toBe(true);
  expect(Resultado.Subs).toEqual([{
    Texto: "Libro pendiente",
    Hecha: false,
    Fecha_Inicio: "",
    Fecha_Objetivo: ""
  }]);
  expect(Resultado.Partes).toEqual([{
    Nombre: "Parte pendiente",
    Estado: "Pendiente",
    Fecha_Inicio: "",
    Fecha_Objetivo: ""
  }]);
  expect(errores).toEqual([]);
});

test("Atajos de capa eligen periodo presente y año queda primero",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Hoy = Formatear_Fecha_ISO(new Date());
    const Anio_Actual = Number(Hoy.slice(0, 4));
    Modelo.UI.Anio_Desde = Anio_Actual;
    Modelo.UI.Anio_Hasta = Anio_Actual;
    Modelo.UI.Anio_Activo = Anio_Actual;
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Subperiodo_Activo = 1;
    const Anio = Planes_Crear_Periodo_Seleccionado("Anio");
    Modelo.UI.Periodo_Activo_Id = Anio?.Id || null;
    Render_Planes_Controles();
    Render_Planes_Contenido();

    const Orden_Controles = Array.from(
      document.querySelectorAll(
        ".Planes_Controles > label, .Planes_Controles > button"
      )
    ).map((Nodo) =>
      Nodo.querySelector("select")?.id || Nodo.id || ""
    );

    const Bajo_Semestre = Planes_Navegar_Capa_Activa(1);
    const Semestre = Planes_Periodo_Activo();
    const Bajo_Trimestre = Planes_Navegar_Capa_Activa(1);
    const Trimestre = Planes_Periodo_Activo();
    const Sube_Semestre = Planes_Navegar_Capa_Activa(-1);
    const Semestre_Tras_Subir = Planes_Periodo_Activo();

    return {
      Orden_Controles,
      Bajo_Semestre,
      Bajo_Trimestre,
      Sube_Semestre,
      Semestre_Tipo: Semestre?.Tipo || "",
      Trimestre_Tipo: Trimestre?.Tipo || "",
      Semestre_Subido_Tipo: Semestre_Tras_Subir?.Tipo || "",
      Semestre_Presente:
        Planes_Periodo_Contiene_Fecha(Semestre, Hoy),
      Trimestre_Presente:
        Planes_Periodo_Contiene_Fecha(Trimestre, Hoy),
      Semestre_Subido_Presente:
        Planes_Periodo_Contiene_Fecha(Semestre_Tras_Subir, Hoy)
    };
  });

  expect(Resultado.Orden_Controles.slice(0, 2)).toEqual([
    "Planes_Anio_Select",
    "Planes_Capa_Select"
  ]);
  expect(Resultado.Bajo_Semestre).toBe(true);
  expect(Resultado.Bajo_Trimestre).toBe(true);
  expect(Resultado.Sube_Semestre).toBe(true);
  expect(Resultado.Semestre_Tipo).toBe("Semestre");
  expect(Resultado.Trimestre_Tipo).toBe("Trimestre");
  expect(Resultado.Semestre_Subido_Tipo).toBe("Semestre");
  expect(Resultado.Semestre_Presente).toBe(true);
  expect(Resultado.Trimestre_Presente).toBe(true);
  expect(Resultado.Semestre_Subido_Presente).toBe(true);
  expect(errores).toEqual([]);
});

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
    const Biblioteca_Rango = document.createRange();
    Biblioteca_Rango.selectNodeContents(Biblioteca);
    const Biblioteca_Texto = Biblioteca_Rango.getBoundingClientRect();
    const Biblioteca_Rect = Biblioteca.getBoundingClientRect();
    const Biblioteca_Aire_Izq =
      Biblioteca_Texto.left - Biblioteca_Rect.left;
    const Biblioteca_Aire_Der =
      Biblioteca_Rect.right - Biblioteca_Texto.right;
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
      bibliotecaAireParejo:
        Math.abs(Biblioteca_Aire_Izq - Biblioteca_Aire_Der) <= 2 &&
        Biblioteca_Aire_Der >= 8,
      tieneTuerca: Boolean(Config.querySelector("svg"))
    };
  });
  expect(Barra.configBg).toBe("rgba(0, 0, 0, 0)");
  expect(Barra.configBorder).toBe("none");
  expect(Barra.etiquetasBg).toBe("rgba(0, 0, 0, 0)");
  expect(Barra.etiquetasBorder).toBe("none");
  expect(Barra.cerrarRadius).toBe("999px");
  expect(Barra.vistaAncho).toBeGreaterThanOrEqual(150);
  expect(Math.abs(Barra.vistaTop - Barra.configTop)).toBeLessThanOrEqual(4);
  expect(Barra.bibliotecaSinCorte).toBe(true);
  expect(Barra.bibliotecaAireParejo).toBe(true);
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
    .toHaveCount(0);
  await expect(page.locator("#Planes_Objetivo_Form .Planes_Meta_Campo"))
    .toBeVisible();
  await page.click("#Planes_Objetivo_Cancelar");

  const Layout_Desktop = await page.evaluate(() => {
    const Panel = document.querySelector(".Planes_Archivero_Panel");
    const Cabecera = document.querySelector(".Planes_Cabecera");
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
      paddingCabecera: getComputedStyle(Cabecera).paddingLeft,
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
  expect(Layout_Desktop.panelAncho).toBeLessThanOrEqual(1040);
  expect(Layout_Desktop.paddingCabecera).toBe("36px");
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
  await expect(page.locator("#Planes_Form_Subobjetivos"))
    .toHaveCount(0);
  await page.locator("#Planes_Objetivo_Overlay").click({
    position: { x: 8, y: 8 }
  });
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Objetivo_Vinculo"))
    .toHaveCount(0);
  await expect(page.locator("#Planes_Objetivo_Bajar_A"))
    .toHaveCount(0);
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .not.toContainText("Vínculo");
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .not.toContainText("Bajar a");
  await expect(page.locator(".Planes_Meta_Campo"))
    .toContainText("Valor objetivo");
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
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toHaveValue("2026-01-01");
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toHaveValue("2026-12-31");
  await expect(page.locator("#Planes_Objetivo_Fecha_Inicio"))
    .toBeDisabled();
  await expect(page.locator("#Planes_Objetivo_Fecha_Objetivo"))
    .toBeDisabled();
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
    const Sub_Uno_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro planeado uno"
    );
    const Sub_Dos_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro planeado dos"
    );
    const Modelo_Subs = Asegurar_Modelo_Planes();
    Modelo_Subs.Subobjetivos[Sub_Uno_Id].Aporte_Meta = 4;
    Modelo_Subs.Subobjetivos[Sub_Uno_Id].Fecha_Inicio =
      "2026-01-01";
    Modelo_Subs.Subobjetivos[Sub_Uno_Id].Fecha_Objetivo =
      "2026-06-30";
    Modelo_Subs.Subobjetivos[Sub_Dos_Id].Aporte_Meta = 2;
    Modelo_Subs.Subobjetivos[Sub_Dos_Id].Fecha_Inicio =
      "2026-07-01";
    Modelo_Subs.Subobjetivos[Sub_Dos_Id].Fecha_Objetivo =
      "2026-12-31";
    Planes_Actualizar_Progreso(Modelo_Subs.Objetivos[Padre.Id]);
    Render_Plan();
    const Hijos = [Hijo];
    return {
      periodos: Object.keys(Planes_Periodo.Periodos).length,
      semanas: Object.values(Planes_Periodo.Periodos)
        .filter((Periodo) => Periodo.Tipo === "Semana")
        .length,
      hijos: Hijos.length,
      leido: Padre.Progreso_Leido,
      planeado: Planes_Aportes_Planeados_Objetivo(Padre),
      targetHijo: Hijos[0]?.Target_Total || 0,
      padreId: Padre.Id,
      hijoId: Hijos[0]?.Id || null
    };
  });

  expect(Modelo_Inicial.periodos).toBe(19);
  expect(Modelo_Inicial.semanas).toBe(0);
  expect(Modelo_Inicial.hijos).toBeGreaterThan(0);
  expect(Modelo_Inicial.leido).toBeGreaterThanOrEqual(2);
  expect(Modelo_Inicial.planeado).toBe(6);
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
  expect(Texto_Tarjeta).toContain(" faltan");
  expect(Texto_Tarjeta).toContain("6 asignados");
  expect(Texto_Tarjeta).toContain("·");
  expect(Texto_Tarjeta).not.toContain("(Faltan");
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
    const Ritmo = Card.querySelector(".Planes_Objetivo_Ritmo");
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
    const Ritmo_Rect = Ritmo.getBoundingClientRect();
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
        Avance_Rect.left > Ritmo_Rect.right &&
        Ritmo_Rect.left > Pct_Rect.right,
      avanceSeparado: Avance_Rect.left - Ritmo_Rect.right >= 8,
      ritmoVisible:
        getComputedStyle(Ritmo).display !== "none" &&
        Math.round(Ritmo_Rect.width) >= 9 &&
        Math.round(Ritmo_Rect.height) >= 9,
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
    "Valor objetivo",
    "Realizado",
    "Falta",
    "Tiempo aprox."
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
  expect(Layout_Detalle.ritmoVisible).toBe(true);
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
    const Modelo = Asegurar_Modelo_Planes();
    const Padre = Modelo.Objetivos[padreId];
    Padre.Unidad = "Personalizado";
    Padre.Unidad_Custom = "libros";
    const Id = Planes_Agregar_Subobjetivo(
      padreId,
      "Sub prueba modal"
    );
    const Sub = Asegurar_Modelo_Planes()
      .Subobjetivos[Id];
    Sub.Target_Total = 3;
    Sub.Unidad = "Personalizado";
    Sub.Unidad_Custom = "Paginas";
    Sub.Fecha_Inicio = "2026-03-11";
    Sub.Fecha_Objetivo = "2026-03-20";
    Sub.Fecha_Fin = "2026-04-02";
    Render_Plan();
    return Id;
  }, Modelo_Inicial.padreId);
  await Card_Objetivo.locator('[data-plan-accion="admin_subs"]')
    .click();
  await expect(page.locator("#Planes_Subobjetivos_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Subobjetivos_Titulo"))
    .toContainText("Leer");
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
    "#Planes_Subobjetivos_Filtro_Estado",
    "Todos"
  );
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
    const Padre = Asegurar_Modelo_Planes()
      .Subobjetivos[subId];
    const Hija_Id = Planes_Agregar_Subobjetivo(
      Padre.Objetivo_Id,
      "Sub hija",
      "\uD83D\uDCC4",
      subId
    );
    Render_Modal_Planes_Subobjetivos();
    const Hija = Asegurar_Modelo_Planes()
      .Subobjetivos[Hija_Id];
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
  const Layout_Sub_Modal = await page.evaluate(() => {
    const Campo = (Id) =>
      document.getElementById(Id).closest(".Campo")
        .getBoundingClientRect();
    const Inicio = Campo("Planes_Subobjetivo_Fecha_Inicio");
    const Objetivo = Campo("Planes_Subobjetivo_Fecha_Objetivo");
    const Modal = document.querySelector(".Planes_Subobjetivo_Modal");
    const Form = document.querySelector(".Planes_Subobjetivo_Form");
    return {
      aporteLabel: document.getElementById(
        "Planes_Subobjetivo_Aporte_Label"
      )?.textContent.trim(),
      modalOverflow: Modal.scrollWidth - Modal.clientWidth,
      formOverflow: Form.scrollWidth - Form.clientWidth,
      fechasMismaLinea:
        Math.abs(Inicio.top - Objetivo.top) <= 2,
      fechasOrdenadas:
        Inicio.left < Objetivo.left
    };
  });
  expect(Layout_Sub_Modal.aporteLabel).toBe("Aporte");
  expect(Layout_Sub_Modal.modalOverflow).toBeLessThanOrEqual(1);
  expect(Layout_Sub_Modal.formOverflow).toBeLessThanOrEqual(1);
  expect(Layout_Sub_Modal.fechasMismaLinea).toBe(true);
  expect(Layout_Sub_Modal.fechasOrdenadas).toBe(true);
  await page.evaluate(() => {
    const Emoji = document.getElementById("Planes_Subobjetivo_Emoji");
    Emoji.readOnly = false;
    Emoji.value = "\uD83D\uDCD6";
    Emoji.dispatchEvent(new Event("input", { bubbles: true }));
    Emoji.dispatchEvent(new Event("change", { bubbles: true }));
  });
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
    return {
      Select_Existe: Boolean(
        document.getElementById("Planes_Objetivo_Vinculo")
      ),
      Vinculo_Tipo: Padre.Vinculo_Tipo,
      Vinculo_Label: Planes_Label_Vinculo("Auto")
    };
  }, Modelo_Inicial.padreId);

  expect(Vinculos.Select_Existe).toBe(false);
  expect(Vinculos.Vinculo_Tipo).toBe("Auto");
  expect(Vinculos.Vinculo_Label).toBeTruthy();

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
  await expect(Card_Biblioteca.locator(".Planes_Objetivo_Ritmo"))
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
    Sub.Aporte_Meta = 0;
    Modelo.Avances.av_capitulo_metricado = Normalizar_Avance_Plan({
      Id: "av_capitulo_metricado",
      Objetivo_Id: padreId,
      Subobjetivo_Id: Sub.Id,
      Fuente: "Subobjetivo",
      Cantidad: 5,
      Unidad: "Veces",
      Fecha: "2026-04-12",
      Hora: "10:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo);
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
    metaA: "+1 libro",
    legacyAporte: 1,
    aporteCero: 0,
    progresoSub: 0,
    progresoTotal: 0,
    pendiente: 50,
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
    Sub_Anual.Target_Total = 1;
    Sub_Anual.Aporte_Meta = 1;
    Modelo.Avances.av_libro_fecha_anual = Normalizar_Avance_Plan({
      Id: "av_libro_fecha_anual",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Anual.Id,
      Fuente: "Subobjetivo",
      Cantidad: 1,
      Unidad: "libros",
      Fecha: Fecha_Anual,
      Hora: "10:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(Sub_Anual, Modelo);
    const Sub_Hijo_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro hijo abril"
    );
    Modelo = Asegurar_Modelo_Planes();
    const Sub_Hijo = Modelo.Subobjetivos[Sub_Hijo_Id];
    if (!Sub_Hijo) {
      return { error: "No se creo el subobjetivo mensual" };
    }
    Sub_Hijo.Target_Total = 1;
    Sub_Hijo.Aporte_Meta = 1;
    Modelo.Avances.av_libro_fecha_hijo = Normalizar_Avance_Plan({
      Id: "av_libro_fecha_hijo",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Hijo.Id,
      Fuente: "Subobjetivo",
      Cantidad: 1,
      Unidad: "libros",
      Fecha: Fecha_Hijo,
      Hora: "10:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(Sub_Hijo, Modelo);
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
    if (!Semestre || !Trimestre || !Mes) {
      return { error: "No se crearon los objetivos hijos" };
    }

    Modelo = Asegurar_Modelo_Planes();
    const Resultado = {
      anual: Modelo.Objetivos[Objetivo.Id].Progreso_Subobjetivos,
      semestre: Semestre.Progreso_Subobjetivos,
      trimestre: Trimestre.Progreso_Subobjetivos,
      mes: Mes.Progreso_Subobjetivos
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
    mes: 2
  });

  const Subestado = await page.evaluate(({ padreId, hijoId }) => {
    Planes_Agregar_Subobjetivo(padreId, "Capitulo 1");
    Planes_Importar_Subs(hijoId);
    const Subs = Object.values(Planes_Periodo.Subobjetivos);
    const Sub_Hijo = Subs.find((Sub) =>
      Sub.Objetivo_Id === hijoId && Sub.Parent_Subobjetivo_Id
    );
    Sub_Hijo.Target_Total = 1;
    Planes_Periodo.Avances.av_subestado_hijo =
      Normalizar_Avance_Plan({
        Id: "av_subestado_hijo",
        Objetivo_Id: hijoId,
        Subobjetivo_Id: Sub_Hijo.Id,
        Fuente: "Subobjetivo",
        Cantidad: 1,
        Unidad: "libros",
        Fecha: "2026-04-12",
        Hora: "10:00"
      });
    Planes_Recalcular_Progreso_Subobjetivo(
      Sub_Hijo,
      Planes_Periodo
    );
    Planes_Sincronizar_Estado_Familia_Subobjetivo(
      Sub_Hijo.Parent_Subobjetivo_Id || Sub_Hijo.Id,
      Planes_Periodo
    );
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
    .toHaveCount(0);
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "incluidos padres" })
    .click();
  await expect(page.locator(".Undo_Toast_Boton").first())
    .toContainText("Deshacer");
  const Eliminacion_Jerarquica = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Eliminacion_Jerarquica.padre).toBe(true);
  expect(Eliminacion_Jerarquica.hijo).toBe(true);
  await page.locator(".Undo_Toast_Boton").first().click();
  const Restaurado_Jerarquico = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      padre: Modelo.Objetivos[Ids.padreId].Eliminado_Local,
      hijo: Modelo.Objetivos[Ids.hijoId].Eliminado_Local
    };
  }, {
    padreId: Modelo_Inicial.padreId,
    hijoId: Modelo_Inicial.hijoId
  });
  expect(Restaurado_Jerarquico.padre).not.toBe(true);
  expect(Restaurado_Jerarquico.hijo).not.toBe(true);

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

test("Objetivos expandidos no se recuerdan al cambiar periodo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Datos = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Anio_Todos = false;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Subperiodo_Activo = 1;
    Modelo.UI.Vista = "Tarjetas";
    Modelo.UI.Objetivos_Expandidos = {};

    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Trimestres[0].Id,
      {
        Nombre: "Memoria visual",
        Emoji: "\uD83D\uDCD8",
        Target_Total: 12,
        Unidad: "Horas",
        Progreso_Manual: 3
      }
    );
    Planes_Crear_Objetivo_Silencioso(
      Trimestres[1].Id,
      {
        Nombre: "Otro trimestre",
        Emoji: "\uD83D\uDCD9",
        Target_Total: 12,
        Unidad: "Horas"
      }
    );
    Modelo.UI.Periodo_Activo_Id = Trimestres[0].Id;
    Render_Plan();
    return { Objetivo_Id: Objetivo.Id };
  });

  const Card = page.locator(
    `[data-plan-objetivo-id="${Datos.Objetivo_Id}"]`
  );
  await Card.click();
  await expect(Card).toHaveClass(/Expandida/);

  await page.locator("[data-plan-resumen-siguiente]").click();
  await expect(page.locator(".Planes_Resumen_Titulo"))
    .toHaveText("Trimestre 2");
  await page.locator("[data-plan-resumen-anterior]").click();
  await expect(page.locator(".Planes_Resumen_Titulo"))
    .toHaveText("Trimestre 1");
  await expect(Card).not.toHaveClass(/Expandida/);

  await page.locator('[data-plan-vista="Biblioteca"]').click();
  const Card_Biblioteca = page.locator(
    `[data-plan-objetivo-id="${Datos.Objetivo_Id}"]`
  );
  await Card_Biblioteca.click();
  await expect(Card_Biblioteca).toHaveClass(/Expandida/);
  await page.locator("[data-plan-resumen-siguiente]").click();
  await page.locator("[data-plan-resumen-anterior]").click();
  await expect(Card_Biblioteca).not.toHaveClass(/Expandida/);

  await page.locator('[data-plan-vista="Lista"]').click();
  await page.locator(
    `[data-plan-objetivo-id="${Datos.Objetivo_Id}"]`
  ).click();
  await page.locator('[data-plan-vista="Tarjetas"]').click();
  await expect(Card).not.toHaveClass(/Expandida/);
  expect(errores).toEqual([]);
});

test("Registrar avance lista solo objetivos pendientes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    let Modelo = Asegurar_Jerarquia_Planes();
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
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Periodo = Trimestres[1];
    const Pendiente = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Libros pendientes",
        Emoji: "\uD83D\uDCD7",
        Target_Total: 10,
        Unidad: "Horas",
        Progreso_Manual: 3
      }
    );
    const Terminado = Planes_Crear_Objetivo_Silencioso(
      Periodo.Id,
      {
        Nombre: "Libros terminados",
        Emoji: "\uD83D\uDCD5",
        Target_Total: 5,
        Unidad: "Horas",
        Progreso_Manual: 5
      }
    );
    const Sub_Pendiente_Id = Planes_Agregar_Subobjetivo(
      Pendiente.Id,
      "Sub pendiente"
    );
    const Sub_Terminado_Id = Planes_Agregar_Subobjetivo(
      Pendiente.Id,
      "Sub terminado"
    );
    Modelo = Asegurar_Modelo_Planes();
    Object.assign(Modelo.Subobjetivos[Sub_Pendiente_Id], {
      Target_Total: 4,
      Progreso_Inicial: 1,
      Hecha: false,
      Estado: "Activo"
    });
    Modelo.Partes.parte_pendiente = Normalizar_Parte_Meta({
      Id: "parte_pendiente",
      Objetivo_Id: Pendiente.Id,
      Subobjetivo_Id: Sub_Pendiente_Id,
      Emoji: "\uD83D\uDCD8",
      Nombre: "Capitulo corto",
      Aporte_Total: 3,
      Unidad: "Horas",
      Orden: 0
    });
    Object.assign(Modelo.Subobjetivos[Sub_Terminado_Id], {
      Target_Total: 4,
      Progreso_Inicial: 4
    });
    Modelo.Avances.av_sub_terminado = Normalizar_Avance_Plan({
      Id: "av_sub_terminado",
      Objetivo_Id: Pendiente.Id,
      Subobjetivo_Id: Sub_Terminado_Id,
      Fuente: "Subobjetivo",
      Cantidad: 4,
      Unidad: "Horas",
      Fecha: "2026-04-20",
      Hora: "10:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(
      Modelo.Subobjetivos[Sub_Pendiente_Id],
      Modelo
    );
    Planes_Recalcular_Progreso_Subobjetivo(
      Modelo.Subobjetivos[Sub_Terminado_Id],
      Modelo
    );
    Planes_Actualizar_Progreso(Pendiente);
    Planes_Actualizar_Progreso(Terminado);
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Render_Plan();
    Abrir_Modal_Planes_Avance("", {
      Tipo: "Periodo",
      Id: Periodo.Id
    });
    const Opciones = Array.from(
      document.querySelectorAll("#Planes_Avance_Item option")
    ).map((Opt) => Opt.textContent.trim());
    return {
      Pendiente_Id: Pendiente.Id,
      Sub_Pendiente_Id,
      Opciones,
      Terminado_Valido: Boolean(Planes_Item_Avance_Por_Valor(
        `Objetivo|${Terminado.Id}`,
        { Tipo: "Periodo", Id: Periodo.Id }
      )),
      Sub_Terminado_Valido: Boolean(Planes_Item_Avance_Por_Valor(
        `Subobjetivo|${Sub_Terminado_Id}`,
        { Tipo: "Periodo", Id: Periodo.Id }
      ))
    };
  });

  await expect(page.locator("#Planes_Avance_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Avance_Hasta_Final"))
    .toBeEnabled();
  await page.locator(".Planes_Avance_Boton").click();
  await expect(page.locator(".Planes_Avance_Menu")).toBeVisible();
  await page.locator(
    `.Planes_Avance_Item[data-toggle-sub="${Resultado.Sub_Pendiente_Id}"]`
  ).click();
  const Items_Menu = await page.locator(
    ".Planes_Avance_Menu .Planes_Avance_Item"
  ).evaluateAll((Items) =>
    Items.map((Item) => Item.textContent.trim())
  );
  expect(Items_Menu.join(" ")).toContain("Sub pendiente");
  expect(Items_Menu.join(" ")).toContain("Capitulo corto");
  expect(
    Items_Menu.some((Item) =>
      Item.includes("Libros pendientes") &&
      Item.includes("Capitulo corto")
    )
  ).toBe(false);
  const Menu_Estilos = await page.locator(
    ".Planes_Avance_Menu"
  ).evaluate((Menu) => {
    const Item = Menu.querySelector(".Planes_Avance_Item");
    const Estilos_Menu = getComputedStyle(Menu);
    const Estilos_Item = Item ? getComputedStyle(Item) : null;
    return {
      position: Estilos_Menu.position,
      fontSize: Estilos_Item?.fontSize || "",
      maxHeight: Estilos_Menu.maxHeight
    };
  });
  expect(Menu_Estilos.position).toBe("fixed");
  expect(parseFloat(Menu_Estilos.fontSize)).toBeLessThanOrEqual(12);
  expect(parseFloat(Menu_Estilos.maxHeight)).toBeGreaterThan(150);
  await page.mouse.click(20, 20);
  await page.locator("#Planes_Avance_Hasta_Final").check();
  await expect(page.locator("#Planes_Avance_Cantidad"))
    .toHaveValue("6");
  await expect(page.locator("#Planes_Avance_Cantidad"))
    .toBeDisabled();
  await page.locator("#Planes_Avance_Hasta_Final").uncheck();
  await expect(page.locator("#Planes_Avance_Cantidad"))
    .toBeEnabled();
  await page.locator("#Planes_Avance_Hasta_Final").check();
  await page.locator("#Planes_Avance_Guardar").click();
  await expect(page.locator("#Planes_Avance_Overlay"))
    .not.toHaveClass(/Activo/);
  const Finalizado = await page.evaluate((Objetivo_Id) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[Objetivo_Id];
    return {
      estado: Planes_Estado_Efectivo_Objetivo(Objetivo),
      manual: Number(Objetivo.Progreso_Manual) || 0,
      progreso: Number(Objetivo.Progreso_Total) || 0
    };
  }, Resultado.Pendiente_Id);
  expect(Finalizado).toEqual({
    estado: "Cumplido",
    manual: 9,
    progreso: 10
  });
  expect(Resultado.Opciones.join(" ")).toContain("Libros pendientes");
  expect(Resultado.Opciones.join(" ")).toContain("Sub pendiente");
  expect(Resultado.Opciones.join(" ")).toContain("Capitulo corto");
  expect(
    Resultado.Opciones.some((Item) =>
      Item.includes("Libros pendientes") &&
      Item.includes("Capitulo corto")
    )
  ).toBe(false);
  expect(Resultado.Opciones.join(" ")).not.toContain("Libros terminados");
  expect(Resultado.Opciones.join(" ")).not.toContain("Sub terminado");
  expect(Resultado.Terminado_Valido).toBe(false);
  expect(Resultado.Sub_Terminado_Valido).toBe(false);
  expect(errores).toEqual([]);
});

test("Registrar avance ordena por fecha objetivo en todos los niveles",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Secuencia = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.Periodos.p_orden_avance = Normalizar_Periodo_Plan({
      Id: "p_orden_avance",
      Tipo: "Mes",
      Inicio: "2026-04-01",
      Fin: "2026-04-30",
      Orden: 0
    });
    Modelo.Objetivos.obj_orden_avance = Normalizar_Objetivo_Plan({
      Id: "obj_orden_avance",
      Periodo_Id: "p_orden_avance",
      Emoji: "\uD83D\uDCD7",
      Nombre: "Lectura ordenada",
      Target_Total: 30,
      Unidad: "Paginas",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_avance_tarde =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_avance_tarde",
        Objetivo_Id: "obj_orden_avance",
        Emoji: "\uD83D\uDCD8",
        Texto: "Sub tarde",
        Target_Total: 10,
        Unidad: "Paginas",
        Fecha_Objetivo: "2026-04-25",
        Orden: 0
      });
    Modelo.Subobjetivos.sub_avance_temprano =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_avance_temprano",
        Objetivo_Id: "obj_orden_avance",
        Emoji: "\uD83D\uDCD9",
        Texto: "Sub temprano",
        Target_Total: 10,
        Unidad: "Paginas",
        Fecha_Objetivo: "2026-04-10",
        Orden: 1
      });
    Modelo.Partes.parte_avance_tardia = Normalizar_Parte_Meta({
      Id: "parte_avance_tardia",
      Objetivo_Id: "obj_orden_avance",
      Subobjetivo_Id: "sub_avance_temprano",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Parte tardia",
      Aporte_Total: 4,
      Unidad: "Paginas",
      Fecha_Objetivo: "2026-04-20",
      Orden: 0
    });
    Modelo.Partes.parte_avance_temprana = Normalizar_Parte_Meta({
      Id: "parte_avance_temprana",
      Objetivo_Id: "obj_orden_avance",
      Subobjetivo_Id: "sub_avance_temprano",
      Emoji: "\uD83D\uDCD5",
      Nombre: "Parte temprana",
      Aporte_Total: 4,
      Unidad: "Paginas",
      Fecha_Objetivo: "2026-04-12",
      Orden: 1
    });
    return Planes_Items_Avance_Disponibles({
      Tipo: "Periodo",
      Id: "p_orden_avance"
    }).map((Item) => `${Item.Tipo}:${Item.Id}`);
  });

  expect(Secuencia).toEqual([
    "Objetivo:obj_orden_avance",
    "Subobjetivo:sub_avance_temprano",
    "Parte:parte_avance_temprana",
    "Parte:parte_avance_tardia",
    "Subobjetivo:sub_avance_tarde"
  ]);
  expect(errores).toEqual([]);
});

test("Registrar avance distribuye padres con suma en hijos pendientes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.Objetivos.obj_principito = Normalizar_Objetivo_Plan({
      Id: "obj_principito",
      Periodo_Id: Anio.Id,
      Nombre: "Biblioteca",
      Target_Total: 30,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Subobjetivos.sub_principito =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_principito",
        Objetivo_Id: "obj_principito",
        Texto: "El principito",
        Target_Total: 30,
        Target_Suma_Componentes: true,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas"
      });
    ["1", "2", "3"].forEach((Numero, Indice) => {
      Modelo.Partes[`parte_cap_${Numero}`] = Normalizar_Parte_Meta({
        Id: `parte_cap_${Numero}`,
        Objetivo_Id: "obj_principito",
        Subobjetivo_Id: "sub_principito",
        Nombre: `Capitulo ${Numero}`,
        Aporte_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas",
        Orden: Indice
      });
    });
    Modelo.Avances.av_cap_1_previo = Normalizar_Avance_Plan({
      Id: "av_cap_1_previo",
      Objetivo_Id: "obj_principito",
      Subobjetivo_Id: "sub_principito",
      Parte_Id: "parte_cap_1",
      Fuente: "Subobjetivo",
      Cantidad: 4,
      Unidad: "paginas",
      Fecha: "2026-04-20",
      Hora: "09:00"
    });
    Planes_Recalcular_Progreso_Parte(Modelo.Partes.parte_cap_1);

    Modelo.Objetivos.obj_suma = Normalizar_Objetivo_Plan({
      Id: "obj_suma",
      Periodo_Id: Anio.Id,
      Nombre: "Objetivo suma",
      Target_Total: 30,
      Target_Suma_Componentes: true,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    ["1", "2", "3"].forEach((Numero, Indice) => {
      Modelo.Subobjetivos[`sub_obj_${Numero}`] =
        Normalizar_Subobjetivo_Plan({
          Id: `sub_obj_${Numero}`,
          Objetivo_Id: "obj_suma",
          Texto: `Sub ${Numero}`,
          Target_Total: 10,
          Aporte_Meta: 10,
          Unidad: "Personalizado",
          Unidad_Custom: "paginas",
          Orden: Indice
        });
    });
    Modelo.Avances.av_sub_1_previo = Normalizar_Avance_Plan({
      Id: "av_sub_1_previo",
      Objetivo_Id: "obj_suma",
      Subobjetivo_Id: "sub_obj_1",
      Fuente: "Subobjetivo",
      Cantidad: 4,
      Unidad: "paginas",
      Fecha: "2026-04-20",
      Hora: "09:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(
      Modelo.Subobjetivos.sub_obj_1
    );

    const Dialogos = [];
    const Mostrar_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(Mensaje?.textContent || String(Mensaje || ""));
      return true;
    };

    Abrir_Modal_Planes_Avance("Subobjetivo|sub_principito");
    document.getElementById("Planes_Avance_Cantidad").value = "10";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "10:00";
    await Guardar_Modal_Planes_Avance();

    Abrir_Modal_Planes_Avance("Objetivo|obj_suma");
    document.getElementById("Planes_Avance_Cantidad").value = "10";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "11:00";
    await Guardar_Modal_Planes_Avance();
    Mostrar_Dialogo = Mostrar_Original;

    const Modelo_Final = Asegurar_Modelo_Planes();
    const Avances = Object.values(Modelo_Final.Avances || {});
    const Suma_Parte = (Parte_Id) => Avances
      .filter((Avance) => Avance.Parte_Id === Parte_Id)
      .reduce((Total, Avance) => Total + Number(Avance.Cantidad), 0);
    const Suma_Sub = (Sub_Id) => Avances
      .filter((Avance) =>
        Avance.Subobjetivo_Id === Sub_Id && !Avance.Parte_Id
      )
      .reduce((Total, Avance) => Total + Number(Avance.Cantidad), 0);
    return {
      dialogos: Dialogos,
      partes: {
        cap1: Suma_Parte("parte_cap_1"),
        cap2: Suma_Parte("parte_cap_2"),
        cap3: Suma_Parte("parte_cap_3")
      },
      subs: {
        sub1: Suma_Sub("sub_obj_1"),
        sub2: Suma_Sub("sub_obj_2"),
        sub3: Suma_Sub("sub_obj_3")
      },
      avancesPadre: Avances.filter((Avance) =>
        (
          Avance.Subobjetivo_Id === "sub_principito" &&
          !Avance.Parte_Id
        ) || (
          Avance.Objetivo_Id === "obj_suma" &&
          !Avance.Subobjetivo_Id
        )
      ).length
    };
  });

  expect(Resultado.dialogos).toHaveLength(2);
  expect(Resultado.dialogos[0]).toContain("Se avanzara");
  expect(Resultado.dialogos[0]).toContain("Capitulo 1 -> 6 paginas");
  expect(Resultado.dialogos[0]).toContain("Capitulo 2 -> 4 paginas");
  expect(Resultado.dialogos[0]).not.toContain("El principito");
  expect(Resultado.dialogos[0]).not.toContain("Biblioteca");
  expect(Resultado.dialogos[1]).toContain("Sub 1 -> 6 paginas");
  expect(Resultado.dialogos[1]).toContain("Sub 2 -> 4 paginas");
  expect(Resultado.dialogos[1]).not.toContain("Objetivo suma");
  expect(Resultado.partes).toEqual({
    cap1: 10,
    cap2: 4,
    cap3: 0
  });
  expect(Resultado.subs).toEqual({
    sub1: 10,
    sub2: 4,
    sub3: 0
  });
  expect(Resultado.avancesPadre).toBe(0);
  expect(errores).toEqual([]);
});

test("Registrar avance pregunta antes de superar limite manual",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Id: "obj_limite_avance",
      Nombre: "Lectura limite",
      Emoji: "\uD83D\uDCD7",
      Target_Total: 20,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas"
    });
    const Sub_Id = "sub_limite_avance";
    Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Id,
      Objetivo_Id: Objetivo.Id,
      Texto: "Libro limite",
      Target_Total: 5,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas"
    });
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    Render_Plan();
    const Dialogos = [];
    const Mostrar_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(String(Mensaje || ""));
      return true;
    };
    Abrir_Modal_Planes_Avance(`Subobjetivo|${Sub_Id}`, {
      Tipo: "Periodo",
      Id: Anio.Id
    });
    document.getElementById("Planes_Avance_Cantidad").value = "7";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "09:30";
    await Guardar_Modal_Planes_Avance();
    Mostrar_Dialogo = Mostrar_Original;
    const Sub = Modelo.Subobjetivos[Sub_Id];
    return {
      dialogos: Dialogos,
      aporte: Sub.Target_Total,
      progreso: Sub.Progreso_Avances,
      estado: Sub.Estado,
      avances: Object.values(Modelo.Avances || {})
        .filter((Avance) => Avance.Subobjetivo_Id === Sub.Id)
        .map((Avance) => Number(Avance.Cantidad) || 0)
    };
  });

  expect(Resultado.dialogos).toHaveLength(1);
  expect(Resultado.dialogos[0]).toContain("faltan");
  expect(Resultado.dialogos[0]).toContain("Libro limite");
  expect(Resultado.dialogos[0]).not.toContain("Lectura limite");
  expect(Resultado.aporte).toBe(7);
  expect(Resultado.progreso).toBe(7);
  expect(Resultado.estado).toBe("Cumplido");
  expect(Resultado.avances).toEqual([7]);
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
  await expect(page.locator('[data-plan-registro-filtro="Fuente"]'))
    .toBeVisible();
  await expect(page.locator('[data-plan-registro-filtro="Item"]'))
    .toBeVisible();
  await expect(page.locator('[data-plan-registro-filtro="Parte"]'))
    .toBeVisible();
  await expect(page.locator(".Planes_Registro_Tabla th")
    .filter({ hasText: "Parte" })).toBeVisible();
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
  await page.fill("#Dialogo_Fecha_Campo", "2026-04-22");
  await page.fill("#Dialogo_Hora_Campo", "16:45");
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Guardar" })
    .click();
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("3 libros");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("22/04/2026");
  const Avance_Editado = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[objetivoId];
    const Avance = Object.values(Modelo.Avances || {})
      .find((Item) => Item.Objetivo_Id === objetivoId);
    return {
      manual: Objetivo.Progreso_Manual,
      cantidad: Avance?.Cantidad || 0,
      fecha: Avance?.Fecha || "",
      hora: Avance?.Hora || "",
      fechaHora: Avance?.Fecha_Hora || ""
    };
  }, Objetivo_Id);
  expect(Avance_Editado.manual).toBe(3);
  expect(Avance_Editado.cantidad).toBe(3);
  expect(Avance_Editado.fecha).toBe("2026-04-22");
  expect(Avance_Editado.hora).toBe("16:45");
  expect(Avance_Editado.fechaHora).toBe("2026-04-22T16:45");

  await page.locator('[data-plan-registro-editar="Avance"]')
    .click();
  await page.fill("#Dialogo_Input_Campo", "4");
  await page.fill("#Dialogo_Fecha_Campo", "2026-04-23");
  await page.fill("#Dialogo_Hora_Campo", "17:10");
  await page.press("#Dialogo_Hora_Campo", "Enter");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("4 libros");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("23/04/2026");
  const Avance_Editado_Enter = await page.evaluate((objetivoId) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivo = Modelo.Objetivos[objetivoId];
    const Avance = Object.values(Modelo.Avances || {})
      .find((Item) => Item.Objetivo_Id === objetivoId);
    return {
      manual: Objetivo.Progreso_Manual,
      cantidad: Avance?.Cantidad || 0,
      fecha: Avance?.Fecha || "",
      hora: Avance?.Hora || "",
      fechaHora: Avance?.Fecha_Hora || ""
    };
  }, Objetivo_Id);
  expect(Avance_Editado_Enter.manual).toBe(4);
  expect(Avance_Editado_Enter.cantidad).toBe(4);
  expect(Avance_Editado_Enter.fecha).toBe("2026-04-23");
  expect(Avance_Editado_Enter.hora).toBe("17:10");
  expect(Avance_Editado_Enter.fechaHora).toBe("2026-04-23T17:10");

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

test("Registro de planes edita avances de subobjetivos realizados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Datos = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Tipo === "Anio");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Lecturas registro sub",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Modo_Progreso: "Subobjetivos"
    });
    const Sub_Id = "sub_registro_realizado";
    Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Id,
      Objetivo_Id: Objetivo.Id,
      Texto: "Capitulo realizado",
      Emoji: "\uD83D\uDCD6",
      Target_Total: 100,
      Aporte_Meta: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Fecha_Inicio: "2026-04-01",
      Fecha_Objetivo: "2026-04-30"
    });
    const Sub = Modelo.Subobjetivos[Sub_Id];
    Planes_Agregar_Avance_Final_Subobjetivo(
      Sub,
      Objetivo,
      100,
      "2026-04-19",
      "15:34",
      Modelo
    );
    Sub.Hecha = true;
    Sub.Estado = "Cumplido";
    Sub.Fecha_Fin = "2026-04-19";
    Sub.Hora_Fin = "15:34";
    Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo);
    Planes_Recalcular_Desde(Objetivo);
    Abrir_Modal_Planes_Registro(Objetivo.Id);
    return {
      Objetivo_Id: Objetivo.Id,
      Sub_Id
    };
  });

  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("100 paginas");
  await page.locator('[data-plan-registro-editar="Avance"]')
    .click();
  await page.fill("#Dialogo_Input_Campo", "80");
  await page.fill("#Dialogo_Fecha_Campo", "2026-04-22");
  await page.fill("#Dialogo_Hora_Campo", "16:45");
  await page.locator("#Dialogo_Botones button")
    .filter({ hasText: "Guardar" })
    .click();

  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("80 paginas");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("22/04/2026");
  const Editado = await page.evaluate((datos) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Sub = Modelo.Subobjetivos[datos.Sub_Id];
    const Avance = Object.values(Modelo.Avances || {})
      .find((Item) => Item.Subobjetivo_Id === datos.Sub_Id);
    return {
      avance: Avance?.Cantidad || 0,
      fecha: Avance?.Fecha || "",
      hora: Avance?.Hora || "",
      progreso: Sub.Progreso_Avances,
      hecha: Sub.Hecha,
      fechaFin: Sub.Fecha_Fin || ""
    };
  }, Datos);
  expect(Editado.avance).toBe(80);
  expect(Editado.fecha).toBe("2026-04-22");
  expect(Editado.hora).toBe("16:45");
  expect(Editado.progreso).toBe(80);
  expect(Editado.hecha).toBe(false);
  expect(Editado.fechaFin).toBe("");
  expect(errores).toEqual([]);
});

test("Registro de planes edita avances de partes realizadas",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Datos = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Tipo === "Anio");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Lecturas registro parte",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Modo_Progreso: "Subobjetivos"
    });
    const Sub_Id = "sub_registro_parte";
    const Parte_Id = "parte_registro_realizada";
    Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Id,
      Objetivo_Id: Objetivo.Id,
      Texto: "Libro con partes",
      Emoji: "\uD83D\uDCD6",
      Target_Total: 20,
      Target_Suma_Componentes: true,
      Aporte_Meta: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Partes[Parte_Id] = Normalizar_Parte_Meta({
      Id: Parte_Id,
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Id,
      Emoji: "\uD83D\uDCD8",
      Nombre: "Parte realizada",
      Aporte_Total: 20,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Planes_Marcar_Parte_Realizada(Parte_Id, {
      Fecha: "2026-04-19",
      Hora: "15:34",
      Solo_Modelo: true
    });
    const Sub = Modelo.Subobjetivos[Sub_Id];
    Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo);
    Planes_Recalcular_Desde(Objetivo);
    Abrir_Modal_Planes_Registro(Objetivo.Id);
    return {
      Objetivo_Id: Objetivo.Id,
      Sub_Id,
      Parte_Id
    };
  });

  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("20 paginas");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("Parte realizada");
  await page.locator('[data-plan-registro-editar="Avance"]')
    .click();
  await page.fill("#Dialogo_Input_Campo", "12");
  await page.fill("#Dialogo_Fecha_Campo", "2026-04-23");
  await page.fill("#Dialogo_Hora_Campo", "17:10");
  await page.press("#Dialogo_Hora_Campo", "Enter");

  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("12 paginas");
  await expect(page.locator("#Planes_Registro_Cuerpo"))
    .toContainText("23/04/2026");
  const Editado = await page.evaluate((datos) => {
    const Modelo = Asegurar_Modelo_Planes();
    const Sub = Modelo.Subobjetivos[datos.Sub_Id];
    const Parte = Modelo.Partes[datos.Parte_Id];
    const Avance = Object.values(Modelo.Avances || {})
      .find((Item) => Item.Parte_Id === datos.Parte_Id);
    return {
      avance: Avance?.Cantidad || 0,
      fecha: Avance?.Fecha || "",
      hora: Avance?.Hora || "",
      subProgreso: Sub.Progreso_Avances,
      parteProgreso: Parte.Progreso_Total,
      parteEstado: Parte.Estado
    };
  }, Datos);
  expect(Editado.avance).toBe(12);
  expect(Editado.fecha).toBe("2026-04-23");
  expect(Editado.hora).toBe("17:10");
  expect(Editado.subProgreso).toBe(12);
  expect(Editado.parteProgreso).toBe(12);
  expect(Editado.parteEstado).toBe("Parcial");
  expect(errores).toEqual([]);
});

test("Subobjetivos ajustan target padre segun modo suma o manual",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    let Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Tipo === "Anio");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Producto target",
      Emoji: "\uD83D\uDCCC",
      Target_Total: 2,
      Unidad: "Personalizado",
      Unidad_Custom: "features",
      Unidad_Subobjetivos_Default: "Personalizado",
      Unidad_Subobjetivos_Custom_Default: "features"
    });
    Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Feature uno"
    );
    Abrir_Modal_Planes_Subobjetivos(Objetivo.Id);
    Abrir_Modal_Planes_Subobjetivo_Nuevo();
    document.getElementById("Planes_Subobjetivo_Texto").value =
      "Feature dos";
    document.getElementById("Planes_Subobjetivo_Aporte").value = "2";
    const Dialogos = [];
    const Mostrar_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(Mensaje);
      return false;
    };
    await Guardar_Modal_Planes_Subobjetivo();
    Modelo = Asegurar_Modelo_Planes();
    const Tras_Cancelar = {
      target: Modelo.Objetivos[Objetivo.Id].Target_Total,
      input: document.getElementById(
        "Planes_Subobjetivo_Aporte"
      ).value,
      modal: document.getElementById("Planes_Subobjetivo_Overlay")
        .classList.contains("Activo"),
      subs: Planes_Subobjetivos_De_Objetivo(Objetivo.Id).length
    };
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(Mensaje);
      return true;
    };
    document.getElementById("Planes_Subobjetivo_Aporte").value = "2";
    await Guardar_Modal_Planes_Subobjetivo();
    Modelo = Asegurar_Modelo_Planes();
    const Tras_Aceptar = {
      target: Modelo.Objetivos[Objetivo.Id].Target_Total,
      subs: Planes_Subobjetivos_De_Objetivo(Objetivo.Id).length
    };
    Modelo.Objetivos[Objetivo.Id].Target_Suma_Componentes = true;
    Modelo.Objetivos[Objetivo.Id].Target_Total =
      Planes_Total_Aporte_Subobjetivos_Objetivo(
        Modelo.Objetivos[Objetivo.Id],
        Modelo
      );
    Abrir_Modal_Planes_Subobjetivo_Nuevo();
    document.getElementById("Planes_Subobjetivo_Texto").value =
      "Feature tres";
    document.getElementById("Planes_Subobjetivo_Aporte").value = "3";
    await Guardar_Modal_Planes_Subobjetivo();
    Mostrar_Dialogo = Mostrar_Original;
    Modelo = Asegurar_Modelo_Planes();
    return {
      Tras_Cancelar,
      Tras_Aceptar,
      targetSuma: Modelo.Objetivos[Objetivo.Id].Target_Total,
      subs: Planes_Subobjetivos_De_Objetivo(Objetivo.Id).length,
      Dialogos
    };
  });

  expect(Resultado.Tras_Cancelar).toEqual({
    target: 2,
    input: "1",
    modal: true,
    subs: 1
  });
  expect(Resultado.Tras_Aceptar).toEqual({
    target: 3,
    subs: 2
  });
  expect(Resultado.targetSuma).toBe(6);
  expect(Resultado.subs).toBe(3);
  expect(Resultado.Dialogos.join(" ")).toContain("excediendo");
  expect(errores).toEqual([]);
});

// Legacy: estos casos validaban importacion por duplicacion.
// El flujo activo ahora muestra el objetivo padre por rango.
test.skip("Importar desde padres evita objetivos repetidos",
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

test.skip("Importar desde padres trae subobjetivos del periodo",
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
  expect(Abril_Importado.Hecha).toBe(true);
  expect(Abril_Importado.Padre_Local)
    .toBeTruthy();
  expect(Abril_Importado.Padre_Local)
    .toBe(Grupo_Importado.Id);
  expect(Resultado.Q2.map((Sub) => Sub.Texto))
    .not.toContain("Libro sin fecha");
  expect(Resultado.Q3.map((Sub) => Sub.Texto)).toEqual([]);
  expect(errores).toEqual([]);
});

test.skip("Actualizar periodos refresca importados de toda la capa",
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
  await expect(page.locator("#Dialogo_Ayuda_Btn"))
    .toHaveCount(0);
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

test.skip("Borrar importados limpia objetivos seleccionados de la capa",
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

test.skip("Importar pendiente redistribuye avance real del padre",
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
    const Centro_Titulo =
      Rect_Titulo.left + (Rect_Titulo.width / 2);
    const Centro_Rango =
      Rect_Rango.left + (Rect_Rango.width / 2);
    return {
      rangoDebajo: Rect_Rango.top > Rect_Titulo.bottom,
      diferenciaCentro: Math.abs(Centro_Rango - Centro_Titulo),
      fondoNav: getComputedStyle(Nav).backgroundColor,
      bordeNav: getComputedStyle(Nav).borderTopWidth,
      pesoRango: Number(getComputedStyle(Rango).fontWeight)
    };
  });
  expect(Header.rangoDebajo).toBe(true);
  expect(Header.diferenciaCentro).toBeLessThanOrEqual(2);
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
  expect(Controles.diferenciaAncho).toBeLessThanOrEqual(80);
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

test.skip("Importar pendiente descuenta hijos importados legacy",
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

test.skip("Importar pendiente descuenta subobjetivos realizados",
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

  await page.evaluate(({ periodoId }) => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.UI.Vista = "Tarjetas";
    Modelo.UI.Objetivos_Expandidos = {};
    Planes_Activar_Periodo_Desde_Coleccion(
      Modelo.Periodos[periodoId]
    );
    Render_Plan();
  }, {
    periodoId: Resultado.Hijos[0].Periodo_Id
  });

  const Card_T1 = page.locator(
    `[data-plan-objetivo-id="${Resultado.Hijos[0].Id}"]`
  );
  await Card_T1.click();
  await expect(Card_T1).toHaveClass(/Expandida/);
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
    const Ritmo = Card.querySelector(".Planes_Objetivo_Ritmo");
    return {
      porcentajeColor: getComputedStyle(Porcentaje).color,
      porcentajeFondo: getComputedStyle(Porcentaje).backgroundColor,
      estadoFondo: getComputedStyle(Ritmo).backgroundColor,
      estadoSombra: getComputedStyle(Ritmo).boxShadow
    };
  });
  expect(Estilo_Cerrado.porcentajeColor).toBe("rgb(166, 54, 49)");
  expect(Estilo_Cerrado.porcentajeFondo).toBe("rgba(0, 0, 0, 0)");
  expect(Estilo_Cerrado.estadoFondo).toBe("rgba(0, 0, 0, 0)");
  expect(Estilo_Cerrado.estadoSombra).toBe("none");
  expect(errores).toEqual([]);
});

test.skip("Actualizar capa redistribuye fecha final nueva del padre",
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
        Nombre: "Peliculas redistribuidas",
        Emoji: "\uD83C\uDFA5",
        Target_Total: 120,
        Unidad: "Personalizado",
        Unidad_Custom: "peliculas"
      }
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Items = Trimestres.map((Periodo) => ({
      Periodo_Id: Periodo.Id,
      Objetivo_Ids: [Padre.Id]
    }));

    Planes_Importar_Objetivos_Padres_A_Periodos(
      Items,
      { Modo: "Pendiente" }
    );

    const Antes = Trimestres.map((Periodo) =>
      Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id).Target_Total
    );
    Trimestres.forEach((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      Hijo.Fijado = true;
      Hijo.Target_Fijado = Hijo.Target_Total;
      Hijo.Target_Fijado_Por_Usuario = true;
      Hijo.Auto_Redistribucion = false;
    });
    const Sub_Id = Crear_Id_Subobjetivo_Plan();
    Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Id,
      Objetivo_Id: Padre.Id,
      Emoji: "\uD83C\uDFA5",
      Texto: "Pelicula Q1",
      Aporte_Meta: 1,
      Target_Total: 1,
      Progreso_Inicial: 1,
      Hecha: true,
      Estado: "Cumplido",
      Fecha_Fin: "2026-03-20"
    });
    Planes_Actualizar_Progreso(Padre);

    const Preview =
      Planes_Previsualizar_Actualizar_Importados_Capa("Trimestre");
    const Resumen =
      Planes_Actualizar_Importados_Capa("Trimestre");
    const Despues = Trimestres.map((Periodo) => {
      const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Periodo.Id);
      return {
        Target: Hijo.Target_Total,
        Target_Fijado: Hijo.Target_Fijado,
        Progreso: Hijo.Progreso_Total,
        Regla: Hijo.Regla_Distribucion,
        Fijado: Hijo.Fijado,
        Auto_Redistribucion: Hijo.Auto_Redistribucion
      };
    });
    return {
      Antes,
      Preview,
      Resumen,
      Despues,
      Padre_Progreso: Padre.Progreso_Total
    };
  });

  expect(Resultado.Antes[0]).toBeCloseTo(30, 5);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Antes[Indice]).toBeCloseTo(40, 5);
  });
  expect(Resultado.Preview.Total).toBeGreaterThan(0);
  expect(Resultado.Resumen.Total).toBeGreaterThan(0);
  expect(Resultado.Padre_Progreso).toBe(1);
  expect(Resultado.Despues[0].Target).toBeCloseTo(30, 5);
  [1, 2, 3].forEach((Indice) => {
    expect(Resultado.Despues[Indice].Target)
      .toBeCloseTo(119 / 3, 5);
    expect(Resultado.Despues[Indice].Target_Fijado)
      .toBeCloseTo(119 / 3, 5);
    expect(Resultado.Despues[Indice].Regla).toBe("Pendiente");
    expect(Resultado.Despues[Indice].Fijado).toBe(true);
    expect(Resultado.Despues[Indice].Auto_Redistribucion)
      .toBe(false);
  });
  expect(errores).toEqual([]);
});

test.skip("Importar pendiente recalcula importados borrados fijados",
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

test.skip("Importar pendiente reusa importados con padre obsoleto",
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

test.skip("Importar pendiente desde selector aplica modo pendiente",
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

test.skip("Importar pendiente descuenta hijos indirectos",
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

test.skip("Importar pendiente respeta abiertos fijados",
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

test.skip("Actualizar capa confirma y reubica subobjetivos por fecha",
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
  expect(Inicial.Abril).toContain("Por fecha objetivo");
  expect(Inicial.Mayo).toContain("Por fecha objetivo");
  expect(Inicial.Junio).toContain("Por fecha inicio");
  expect(Inicial.Julio).not.toContain("Por fecha objetivo");

  await page.click("[data-plan-universo-actualizar]");
  await expect(page.locator("#Dialogo_Overlay"))
    .not.toHaveClass(/Activo/);

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

  expect(Resultado.Mayo).toContain("Por fecha objetivo");
  expect(Resultado.Julio).toContain("Por fecha objetivo");
  expect(Resultado.Preview.Total).toBe(0);
  expect(errores).toEqual([]);
});

test.skip("Actualizar capa reordena subobjetivos pendientes por rango",
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
        Nombre: "Pendientes por rango",
        Emoji: "\uD83D\uDCC5",
        Target_Total: 12,
        Unidad: "Horas"
      }
    );
    const Crear_Sub = (Texto, Orden, Inicio, Fin) => {
      const Id = Crear_Id_Subobjetivo_Plan();
      Modelo.Subobjetivos[Id] = Normalizar_Subobjetivo_Plan({
        Id,
        Objetivo_Id: Padre.Id,
        Emoji: "\u2022",
        Texto,
        Orden,
        Fecha_Inicio: Inicio,
        Fecha_Fin: Fin,
        Aporte_Meta: 1,
        Unidad: "Horas"
      });
      return Modelo.Subobjetivos[Id];
    };
    Crear_Sub("Mayo", 0, "2026-05-01", "2026-05-31");
    Crear_Sub("Abril", 1, "2026-04-01", "2026-04-30");

    const Trimestres = Planes_Crear_Periodos_Distribucion(
      Anio,
      "Trimestre"
    );
    Planes_Importar_Objetivos_Padres_A_Periodos(
      [{
        Periodo_Id: Trimestres[1].Id,
        Objetivo_Ids: [Padre.Id]
      }],
      { Modo: "Pendiente" }
    );
    const Hijo = Planes_Objetivo_Hijo_De(
      Padre.Id,
      Trimestres[1].Id
    );
    const Subs = Planes_Subobjetivos_De_Objetivo(Hijo.Id)
      .filter((Sub) => !Sub.Eliminado_Local);
    Subs.find((Sub) => Sub.Texto === "Mayo").Orden = 0;
    Subs.find((Sub) => Sub.Texto === "Abril").Orden = 1;
    const Textos = () => Planes_Subobjetivos_De_Objetivo(Hijo.Id)
      .filter((Sub) => !Sub.Eliminado_Local)
      .map((Sub) => Sub.Texto);
    const Antes = Textos();
    const Resumen = Planes_Actualizar_Importados_Capa(
      "Trimestre",
      { Silencioso: true }
    );
    return {
      Antes,
      Despues: Textos(),
      Resumen
    };
  });

  expect(Resultado.Antes).toEqual(["Mayo", "Abril"]);
  expect(Resultado.Despues).toEqual(["Abril", "Mayo"]);
  expect(Resultado.Resumen.Subobjetivos).toBeGreaterThan(0);
  expect(Resultado.Resumen.Total).toBeGreaterThan(0);
  expect(errores).toEqual([]);
});

test.skip("Actualizar capa mueve subobjetivo directo al trimestre del rango",
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
        Nombre: "Objetivo anual con traslado",
        Emoji: "\uD83D\uDCC6",
        Target_Total: 12,
        Unidad: "Horas"
      }
    );
    const Trimestres = Planes_Crear_Periodos_Distribucion(
      Anio,
      "Trimestre"
    );
    Planes_Importar_Objetivos_Padres_A_Periodos(
      [{
        Periodo_Id: Trimestres[1].Id,
        Objetivo_Ids: [Padre.Id]
      }],
      { Modo: "Pendiente" }
    );
    const Hijo_T2 = Planes_Objetivo_Hijo_De(
      Padre.Id,
      Trimestres[1].Id
    );
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Hijo_T2.Id,
      "Mudanza a julio"
    );
    let M = Asegurar_Modelo_Planes();
    Object.assign(M.Subobjetivos[Sub_Id], {
      Fecha_Inicio: "2026-05-10",
      Fecha_Objetivo: "2026-05-20"
    });
    const Antes_T2 = Planes_Subobjetivos_De_Objetivo(Hijo_T2.Id)
      .filter((Sub) => !Sub.Eliminado_Local)
      .map((Sub) => Sub.Texto);
    Object.assign(M.Subobjetivos[Sub_Id], {
      Fecha_Inicio: "2026-07-01",
      Fecha_Objetivo: "2026-07-31"
    });
    const Resumen = Planes_Actualizar_Importados_Capa(
      "Trimestre",
      { Silencioso: true }
    );
    M = Asegurar_Modelo_Planes();
    const Hijo_T3 = Planes_Objetivo_Hijo_De(
      Padre.Id,
      Trimestres[2].Id
    );
    const Textos = (Objetivo) => Objetivo
      ? Planes_Subobjetivos_De_Objetivo(Objetivo.Id)
        .filter((Sub) => !Sub.Eliminado_Local)
        .map((Sub) => Sub.Texto)
      : [];
    return {
      Antes_T2,
      Despues_T2: Textos(Hijo_T2),
      Despues_T3: Textos(Hijo_T3),
      Sub_Objetivo_Id: M.Subobjetivos[Sub_Id]?.Objetivo_Id,
      Hijo_T3_Id: Hijo_T3?.Id || "",
      Hijo_T3_Importado:
        Planes_Objetivo_Padre_Id(Hijo_T3) === Padre.Id,
      Resumen
    };
  });

  expect(Resultado.Antes_T2).toContain("Mudanza a julio");
  expect(Resultado.Despues_T2).not.toContain("Mudanza a julio");
  expect(Resultado.Despues_T3).toContain("Mudanza a julio");
  expect(Resultado.Sub_Objetivo_Id).toBe(Resultado.Hijo_T3_Id);
  expect(Resultado.Hijo_T3_Importado).toBe(true);
  expect(Resultado.Resumen.Subobjetivos).toBeGreaterThan(0);
  expect(Resultado.Resumen.Total).toBeGreaterThan(0);
  expect(errores).toEqual([]);
});

test.skip("Objetivo permite editar distribucion importada",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Datos = await page.evaluate(() => {
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
        Nombre: "Distribucion familiar",
        Emoji: "\uD83D\uDCCA",
        Target_Total: 120,
        Unidad: "Horas"
      }
    );
    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    Planes_Importar_Objetivos_Padres_A_Periodos(
      [3, 4].map((Indice) => ({
        Periodo_Id: Meses[Indice].Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Proporcional" }
    );
    const Abril = Planes_Objetivo_Hijo_De(Padre.Id, Meses[3].Id);
    const Mayo = Planes_Objetivo_Hijo_De(Padre.Id, Meses[4].Id);
    Modelo.UI.Periodo_Activo_Id = Meses[3].Id;
    Render_Plan();
    return {
      Abril_Id: Abril.Id,
      Mayo_Id: Mayo.Id
    };
  });

  const Objetivo = page.locator(
    `[data-plan-objetivo-id="${Datos.Abril_Id}"]`
  );
  await expect(Objetivo).toBeVisible();
  await Objetivo.click({ button: "right" });
  await expect(
    page.locator(
      '.Planes_Context_Menu [data-plan-accion="distribucion"]'
    )
  ).toBeVisible();
  await page.locator(
    '.Planes_Context_Menu [data-plan-accion="distribucion"]'
  ).click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.getByRole("button", {
    name: "Redistribuir pendiente"
  }).click();
  await expect(page.locator("#Dialogo_Overlay"))
    .not.toHaveClass(/Activo/);

  const Resultado = await page.evaluate((Ids) => {
    const Modelo = Asegurar_Modelo_Planes();
    return {
      Abril_Regla:
        Modelo.Objetivos[Ids.Abril_Id]?.Regla_Distribucion,
      Mayo_Regla:
        Modelo.Objetivos[Ids.Mayo_Id]?.Regla_Distribucion
    };
  }, Datos);

  expect(Resultado.Abril_Regla).toBe("Pendiente");
  expect(Resultado.Mayo_Regla).toBe("Pendiente");
  expect(errores).toEqual([]);
});

test.skip("Actualizar capa traslada avances de subobjetivos importados",
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
        Nombre: "Libros Melville",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 12,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Sub_Id = Crear_Id_Subobjetivo_Plan();
    Modelo.Subobjetivos[Sub_Id] = Normalizar_Subobjetivo_Plan({
      Id: Sub_Id,
      Objetivo_Id: Padre.Id,
      Emoji: "\uD83D\uDCD6",
      Texto: "Cuentos de Melville",
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Target_Total: 4,
      Progreso_Inicial: 0,
      Aporte_Meta: 1,
      Fecha_Objetivo: "2026-04-30"
    });
    const Sub = Modelo.Subobjetivos[Sub_Id];
    const Registrar = (Fecha, Hora) => {
      const Id = Crear_Id_Avance_Plan();
      Modelo.Avances[Id] = Normalizar_Avance_Plan({
        Id,
        Objetivo_Id: Padre.Id,
        Subobjetivo_Id: Sub.Id,
        Fuente: "Subobjetivo",
        Cantidad: 1,
        Unidad: "paginas",
        Fecha,
        Hora,
        Fecha_Hora: `${Fecha}T${Hora}`
      });
    };
    Registrar("2026-04-12", "10:00");
    Registrar("2026-04-20", "11:00");
    Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo);
    Planes_Actualizar_Progreso(Padre);

    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    Planes_Importar_Objetivos_Padres_A_Periodos(
      Trimestres.map((Periodo) => ({
        Periodo_Id: Periodo.Id,
        Objetivo_Ids: [Padre.Id]
      })),
      { Modo: "Pendiente" }
    );
    const Segundo = Trimestres[1];
    const Hijo = Planes_Objetivo_Hijo_De(Padre.Id, Segundo.Id);
    const Sub_Hijo = Planes_Subobjetivos_De_Objetivo(Hijo.Id)
      .find((Item) =>
        !Item.Eliminado_Local &&
        Item.Parent_Subobjetivo_Id === Sub.Id
      );
    Planes_Recalcular_Progreso_Subobjetivo(Sub_Hijo, Modelo);
    Planes_Actualizar_Progreso(Hijo);
    const Registros = Planes_Registros_De_Objetivo(Hijo);

    return {
      Sub_Hijo_Existe: Boolean(Sub_Hijo),
      Sub_Hijo_Avances: Sub_Hijo?.Progreso_Avances || 0,
      Sub_Hijo_Total:
        Planes_Progreso_Total_Subobjetivo(Sub_Hijo, Modelo),
      Progreso_Subobjetivos: Hijo.Progreso_Subobjetivos,
      Progreso_Total: Hijo.Progreso_Total,
      Registros: Registros.map((Registro) => ({
        Fuente: Registro.Fuente,
        Item: Registro.Item,
        Editable: Registro.Editable,
        Cantidad: Registro.Cantidad
      }))
    };
  });

  expect(Resultado.Sub_Hijo_Existe).toBe(true);
  expect(Resultado.Sub_Hijo_Avances).toBe(2);
  expect(Resultado.Sub_Hijo_Total).toBe(2);
  expect(Resultado.Progreso_Subobjetivos).toBeCloseTo(0.5, 5);
  expect(Resultado.Progreso_Total).toBeCloseTo(0.5, 5);
  expect(Resultado.Registros).toHaveLength(2);
  expect(Resultado.Registros.map((Registro) => Registro.Item))
    .toEqual([
      "Cuentos de Melville",
      "Cuentos de Melville"
    ]);
  expect(Resultado.Registros.every((Registro) =>
    Registro.Editable === false
  )).toBe(true);
  expect(errores).toEqual([]);
});

test("Sincroniza subobjetivos importados entre padre e hijo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestre = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-04-01",
      "2026-06-30",
      Anio.Id,
      1
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Lecturas sincronizadas",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 12,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Hijo = Planes_Crear_Objetivo_Silencioso(
      Trimestre.Id,
      {
        Nombre: "Lecturas trimestre",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 3,
        Unidad: "Personalizado",
        Unidad_Custom: "libros",
        Objetivo_Padre_Id: Padre.Id
      }
    );
    const Sub_Padre_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Original"
    );
    let M = Asegurar_Modelo_Planes();
    Object.assign(M.Subobjetivos[Sub_Padre_Id], {
      Emoji: "\uD83D\uDCD6",
      Target_Total: 4,
      Aporte_Meta: 2,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Fecha_Inicio: "2026-04-01",
      Fecha_Objetivo: "2026-04-30"
    });
    Planes_Sincronizar_Familia_Objetivo(Padre.Id, M);
    M = Asegurar_Modelo_Planes();
    const Sub_Hijo = Planes_Subobjetivos_De_Objetivo(Hijo.Id)
      .find((Sub) =>
        !Sub.Eliminado_Local &&
        Sub.Parent_Subobjetivo_Id === Sub_Padre_Id
      );
    if (!Sub_Hijo) {
      return { error: "No se importo el subobjetivo hijo" };
    }
    Planes_Actualizar_Subobjetivo_Datos(Sub_Hijo.Id, {
      Texto: "Editado desde trimestre",
      Emoji: "\uD83D\uDCD8",
      Target_Total: 5,
      Aporte_Meta: 3,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Fecha_Inicio: "2026-04-10",
      Fecha_Objetivo: "2026-05-15",
      Metadatos: { Autor: "Melville" }
    });
    M = Asegurar_Modelo_Planes();
    const Sub_Padre = M.Subobjetivos[Sub_Padre_Id];
    const Sub_Hijo_Editado = M.Subobjetivos[Sub_Hijo.Id];
    const Dueno = Planes_Subobjetivo_Dueno_Partes(
      Sub_Hijo.Id,
      M
    );
    const Parte_Id = Crear_Id_Parte_Meta();
    M.Partes[Parte_Id] = Normalizar_Parte_Meta({
      Id: Parte_Id,
      Objetivo_Id: Dueno.Objetivo_Id,
      Subobjetivo_Id: Dueno.Id,
      Emoji: "\uD83D\uDCD1",
      Nombre: "Capitulo compartido",
      Aporte_Total: 5,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Planes_Recalcular_Parte_Y_Meta(M.Partes[Parte_Id], M);
    M = Asegurar_Modelo_Planes();
    const Partes_Antes = {
      Padre: Planes_Partes_De_Subobjetivo(Sub_Padre_Id, M)
        .map((Parte) => Parte.Nombre),
      Hijo: Planes_Partes_De_Subobjetivo(Sub_Hijo.Id, M)
        .map((Parte) => Parte.Nombre)
    };
    M.Partes[Parte_Id].Eliminado_Local = true;
    M.Partes[Parte_Id].Actualizado_En = new Date().toISOString();
    Planes_Recalcular_Desde(M.Objetivos[Dueno.Objetivo_Id]);
    M = Asegurar_Modelo_Planes();
    const Partes_Despues = {
      Padre: Planes_Partes_De_Subobjetivo(Sub_Padre_Id, M).length,
      Hijo: Planes_Partes_De_Subobjetivo(Sub_Hijo.Id, M).length
    };
    const Avance_Id = Crear_Id_Avance_Plan();
    M.Avances[Avance_Id] = Normalizar_Avance_Plan({
      Id: Avance_Id,
      Objetivo_Id: Hijo.Id,
      Subobjetivo_Id: Sub_Hijo.Id,
      Fuente: "Subobjetivo",
      Cantidad: 5,
      Unidad: "paginas",
      Fecha: "2026-04-20",
      Hora: "10:00",
      Fecha_Hora: "2026-04-20T10:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(
      M.Subobjetivos[Sub_Hijo.Id],
      M
    );
    Planes_Sincronizar_Estado_Familia_Subobjetivo(
      Sub_Hijo.Id,
      M
    );
    Planes_Recalcular_Desde(M.Objetivos[Hijo.Id]);
    M = Asegurar_Modelo_Planes();
    const Padre_Final = M.Subobjetivos[Sub_Padre_Id];
    const Hijo_Final = M.Subobjetivos[Sub_Hijo.Id];
    const Resultado_Final = {
      error: "",
      padreTexto: Sub_Padre.Texto,
      hijoTexto: Sub_Hijo_Editado.Texto,
      padreTarget: Sub_Padre.Target_Total,
      hijoTarget: Sub_Hijo_Editado.Target_Total,
      padreInicio: Sub_Padre.Fecha_Inicio,
      hijoInicio: Sub_Hijo_Editado.Fecha_Inicio,
      padreMeta: Sub_Padre.Metadatos.Autor,
      hijoMeta: Sub_Hijo_Editado.Metadatos.Autor,
      partesAntes: Partes_Antes,
      partesDespues: Partes_Despues,
      padreHecha: Padre_Final.Hecha,
      hijoHecha: Hijo_Final.Hecha,
      padreFin: Padre_Final.Fecha_Fin,
      hijoFin: Hijo_Final.Fecha_Fin,
      padreProgreso:
        Planes_Progreso_Total_Subobjetivo(Padre_Final, M),
      hijoProgreso:
        Planes_Progreso_Total_Subobjetivo(Hijo_Final, M)
    };
    Padre_Final.Hecha = false;
    Padre_Final.Estado = "Activo";
    Padre_Final.Fecha_Fin = "";
    Padre_Final.Hora_Fin = "";
    Planes_Periodo = Normalizar_Modelo_Planes(Planes_Periodo);
    const M_Reconciliado = Asegurar_Modelo_Planes();
    const Padre_Reconciliado =
      M_Reconciliado.Subobjetivos[Sub_Padre_Id];
    const Hijo_Reconciliado =
      M_Reconciliado.Subobjetivos[Sub_Hijo.Id];
    return {
      ...Resultado_Final,
      legacyPadreHecha: Padre_Reconciliado.Hecha,
      legacyHijoHecha: Hijo_Reconciliado.Hecha,
      legacyPadreFin: Padre_Reconciliado.Fecha_Fin,
      legacyHijoFin: Hijo_Reconciliado.Fecha_Fin
    };
  });

  expect(Resultado.error).toBe("");
  expect(Resultado.padreTexto).toBe("Editado desde trimestre");
  expect(Resultado.hijoTexto).toBe("Editado desde trimestre");
  expect(Resultado.padreTarget).toBe(5);
  expect(Resultado.hijoTarget).toBe(5);
  expect(Resultado.padreInicio).toBe("2026-04-10");
  expect(Resultado.hijoInicio).toBe("2026-04-10");
  expect(Resultado.padreMeta).toBe("Melville");
  expect(Resultado.hijoMeta).toBe("Melville");
  expect(Resultado.partesAntes.Padre)
    .toEqual(["Capitulo compartido"]);
  expect(Resultado.partesAntes.Hijo)
    .toEqual(["Capitulo compartido"]);
  expect(Resultado.partesDespues).toEqual({ Padre: 0, Hijo: 0 });
  expect(Resultado.padreHecha).toBe(true);
  expect(Resultado.hijoHecha).toBe(true);
  expect(Resultado.padreFin).toBe("2026-04-20");
  expect(Resultado.hijoFin).toBe("2026-04-20");
  expect(Resultado.padreProgreso).toBe(5);
  expect(Resultado.hijoProgreso).toBe(5);
  expect(Resultado.legacyPadreHecha).toBe(true);
  expect(Resultado.legacyHijoHecha).toBe(true);
  expect(Resultado.legacyPadreFin).toBe("2026-04-20");
  expect(Resultado.legacyHijoFin).toBe("2026-04-20");
  expect(errores).toEqual([]);
});

test("Padre embebe subobjetivos y avances de hijos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestre = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-04-01",
      "2026-06-30",
      Anio.Id,
      1
    );
    const Mes = Planes_Crear_Periodo(
      Modelo,
      "Mes",
      "2026-04-01",
      "2026-04-30",
      Trimestre.Id,
      3
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Libros anual",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 12,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Hijo = Planes_Crear_Objetivo_Silencioso(
      Trimestre.Id,
      {
        Nombre: "Libros trimestre",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 3,
        Unidad: "Personalizado",
        Unidad_Custom: "libros",
        Objetivo_Padre_Id: Padre.Id
      }
    );
    const Nieto = Planes_Crear_Objetivo_Silencioso(
      Mes.Id,
      {
        Nombre: "Libros mes",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 1,
        Unidad: "Personalizado",
        Unidad_Custom: "libros",
        Objetivo_Padre_Id: Hijo.Id
      }
    );
    const Directo_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro anual directo"
    );
    let Modelo_Subs = Asegurar_Modelo_Planes();
    Object.assign(Modelo_Subs.Subobjetivos[Directo_Id], {
      Aporte_Meta: 0,
      Target_Total: 1
    });
    Modelo_Subs.Avances.av_directo_anual = Normalizar_Avance_Plan({
      Id: "av_directo_anual",
      Objetivo_Id: Padre.Id,
      Subobjetivo_Id: Directo_Id,
      Fuente: "Subobjetivo",
      Cantidad: 1,
      Unidad: "libros",
      Fecha: "2026-04-10",
      Hora: "09:00"
    });
    Planes_Recalcular_Progreso_Subobjetivo(
      Modelo_Subs.Subobjetivos[Directo_Id],
      Modelo_Subs
    );
    Planes_Importar_Subs_En_Objetivo(Hijo);

    const Sub_Id = Planes_Agregar_Subobjetivo(
      Hijo.Id,
      "Cuentos de Melville"
    );
    Modelo_Subs = Asegurar_Modelo_Planes();
    const Sub = Modelo_Subs.Subobjetivos[Sub_Id];
    Object.assign(Sub, {
      Emoji: "\uD83D\uDCD6",
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Target_Total: 4,
      Aporte_Meta: 1
    });
    const Sub_Nieto_Id = Planes_Agregar_Subobjetivo(
      Nieto.Id,
      "Bartleby"
    );
    Modelo_Subs = Asegurar_Modelo_Planes();
    const Sub_Nieto = Modelo_Subs.Subobjetivos[Sub_Nieto_Id];
    Object.assign(Sub_Nieto, {
      Emoji: "\uD83D\uDCD6",
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Target_Total: 2,
      Aporte_Meta: 2
    });
    const Registrar = (Fecha, Hora) => {
      const Id = Crear_Id_Avance_Plan();
      Modelo_Subs.Avances[Id] = Normalizar_Avance_Plan({
        Id,
        Objetivo_Id: Hijo.Id,
        Subobjetivo_Id: Sub.Id,
        Fuente: "Subobjetivo",
        Cantidad: 1,
        Unidad: "paginas",
        Fecha,
        Hora,
        Fecha_Hora: `${Fecha}T${Hora}`
      });
    };
    const Registrar_Nieto = (Fecha, Hora) => {
      const Id = Crear_Id_Avance_Plan();
      Modelo_Subs.Avances[Id] = Normalizar_Avance_Plan({
        Id,
        Objetivo_Id: Nieto.Id,
        Subobjetivo_Id: Sub_Nieto.Id,
        Fuente: "Subobjetivo",
        Cantidad: 1,
        Unidad: "paginas",
        Fecha,
        Hora,
        Fecha_Hora: `${Fecha}T${Hora}`
      });
    };
    const Registrar_Manual_Hijo = (Fecha, Hora) => {
      const Id = Crear_Id_Avance_Plan();
      Modelo_Subs.Avances[Id] = Normalizar_Avance_Plan({
        Id,
        Objetivo_Id: Hijo.Id,
        Fuente: "Manual",
        Cantidad: 2,
        Unidad: "libros",
        Fecha,
        Hora,
        Fecha_Hora: `${Fecha}T${Hora}`
      });
    };
    Registrar("2026-04-12", "10:00");
    Registrar("2026-04-20", "11:00");
    Registrar_Nieto("2026-04-24", "12:00");
    Registrar_Manual_Hijo("2026-04-25", "13:00");
    Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo_Subs);
    Planes_Recalcular_Progreso_Subobjetivo(Sub_Nieto, Modelo_Subs);
    Planes_Actualizar_Progreso(Nieto);
    Planes_Actualizar_Progreso(Hijo);
    Planes_Actualizar_Progreso(Padre);
    Planes_Subobjetivos_Filtro_Estado = "Todos";
    Abrir_Modal_Planes_Subobjetivos(Padre.Id, false);
    const Items = Array.from(
      document.querySelectorAll(".Planes_Subobjetivo")
    );
    const Textos = Items.map((Item) =>
      Item.querySelector(".Planes_Subobjetivo_Nombre")
        ?.textContent?.trim()
    );
    const Embebido = Items.find((Item) =>
      Item.textContent.includes("Cuentos de Melville")
    );
    const Embebido_Nieto = Items.find((Item) =>
      Item.textContent.includes("Bartleby")
    );
    const Registros = Planes_Registros_De_Objetivo(Padre);
    const Vinculos = Meta_Aporte_Items_Semana("2026-04-13")
      .map(Meta_Aporte_Label_Item);
    return {
      Progreso_Padre: Padre.Progreso_Subobjetivos,
      Total_Padre: Padre.Progreso_Total,
      Textos,
      Vinculos,
      Directos_Conteo: Textos.filter((Texto) =>
        Texto === "Libro anual directo"
      ).length,
      Embebido: Boolean(Embebido),
      Embebido_Clase: Embebido?.classList.contains("Embebido") ||
        false,
      Embebido_Draggable: Embebido?.draggable || false,
      Meta: Embebido?.querySelector(".Planes_Subobjetivo_Meta")
        ?.textContent?.trim() || "",
      Nieto_Embebido: Boolean(Embebido_Nieto),
      Nieto_Clase:
        Embebido_Nieto?.classList.contains("Embebido") || false,
      Nieto_Meta: Embebido_Nieto
        ?.querySelector(".Planes_Subobjetivo_Meta")
        ?.textContent?.trim() || "",
      Registros: Registros.map((Registro) => ({
        Item: Registro.Item,
        Cantidad: Registro.Cantidad,
        Editable: Registro.Editable
      }))
    };
  });

  expect(Resultado.Progreso_Padre).toBeCloseTo(1.5, 5);
  expect(Resultado.Total_Padre).toBeCloseTo(3.5, 5);
  expect(Resultado.Textos).toContain("Cuentos de Melville");
  expect(Resultado.Textos).toContain("Bartleby");
  expect(Resultado.Vinculos.join(" | "))
    .toContain("Cuentos de Melville");
  expect(Resultado.Vinculos.join(" | ")).toContain("Bartleby");
  expect(Resultado.Vinculos.join(" | "))
    .not.toContain("Libro anual directo");
  expect(Resultado.Directos_Conteo).toBe(1);
  expect(Resultado.Embebido).toBe(true);
  expect(Resultado.Embebido_Clase).toBe(true);
  expect(Resultado.Embebido_Draggable).toBe(true);
  expect(Resultado.Meta).toContain("50%");
  expect(Resultado.Meta).toContain("2/4");
  expect(Resultado.Meta).toContain("+1 libro");
  expect(Resultado.Nieto_Embebido).toBe(true);
  expect(Resultado.Nieto_Clase).toBe(true);
  expect(Resultado.Nieto_Meta).toContain("50%");
  expect(Resultado.Nieto_Meta).toContain("1/2");
  expect(Resultado.Nieto_Meta).toContain("+2 libros");
  expect(Resultado.Registros).toHaveLength(5);
  expect(Resultado.Registros.filter((Registro) =>
    Registro.Item === "Cuentos de Melville"
  )).toHaveLength(2);
  expect(Resultado.Registros.filter((Registro) =>
    Registro.Item === "Bartleby"
  )).toHaveLength(1);
  expect(Resultado.Registros.filter((Registro) =>
    Registro.Item === "Libros anual" &&
    Registro.Cantidad === "2 libros"
  )).toHaveLength(1);
  expect(Resultado.Registros.filter((Registro) =>
    Registro.Item === "Libro anual directo" &&
    Registro.Editable === true
  )).toHaveLength(1);
  expect(Resultado.Registros.filter((Registro) =>
    Registro.Item !== "Libro anual directo"
  ).every((Registro) =>
    Registro.Editable === false
  )).toBe(true);
  expect(errores).toEqual([]);
});

test("Subobjetivos legacy de objetivos hijo eliminados se ven por fecha",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestre_2 = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-04-01",
      "2026-06-30",
      Anio.Id,
      2
    );
    const Trimestre_3 = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-07-01",
      "2026-09-30",
      Anio.Id,
      3
    );
    const Abril = Planes_Crear_Periodo(
      Modelo,
      "Mes",
      "2026-04-01",
      "2026-04-30",
      Trimestre_2.Id,
      4
    );
    const Junio = Planes_Crear_Periodo(
      Modelo,
      "Mes",
      "2026-06-01",
      "2026-06-30",
      Trimestre_2.Id,
      6
    );
    const Julio = Planes_Crear_Periodo(
      Modelo,
      "Mes",
      "2026-07-01",
      "2026-07-31",
      Trimestre_3.Id,
      7
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Independencia financiera",
      Emoji: "\uD83D\uDCB0",
      Target_Total: 3
    });
    const Hijo_Q2 = Planes_Crear_Objetivo_Silencioso(
      Trimestre_2.Id,
      {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 1,
        Objetivo_Padre_Id: Padre.Id
      }
    );
    const Hijo_Q3 = Planes_Crear_Objetivo_Silencioso(
      Trimestre_3.Id,
      {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 1,
        Objetivo_Padre_Id: Padre.Id
      }
    );
    const Semaplan_Id = Planes_Agregar_Subobjetivo(
      Hijo_Q2.Id,
      "Semaplan"
    );
    const Potredata_Id = Planes_Agregar_Subobjetivo(
      Hijo_Q2.Id,
      "Potredata"
    );
    const Mascoter_Id = Planes_Agregar_Subobjetivo(
      Hijo_Q3.Id,
      "Mascoter"
    );
    const Modelo_Actual = Asegurar_Modelo_Planes();
    Object.assign(Modelo_Actual.Subobjetivos[Semaplan_Id], {
      Fecha_Inicio: "2026-04-01",
      Fecha_Objetivo: "2026-04-30"
    });
    Object.assign(Modelo_Actual.Subobjetivos[Potredata_Id], {
      Fecha_Inicio: "2026-06-01",
      Fecha_Objetivo: "2026-06-30"
    });
    Object.assign(Modelo_Actual.Subobjetivos[Mascoter_Id], {
      Fecha_Inicio: "2026-07-01",
      Fecha_Objetivo: "2026-07-31"
    });
    Hijo_Q2.Eliminado_Local = true;
    Hijo_Q3.Eliminado_Local = true;

    const Textos_De = (Periodo) => {
      const Objetivo = Planes_Objetivo_Para_Periodo(Padre, Periodo);
      return Planes_Subobjetivos_Contexto_Objetivo(Objetivo)
        .Items
        .map((Sub) => Sub.Texto)
        .sort();
    };
    Abrir_Modal_Planes_Subobjetivos(Padre.Id, false, Abril.Id);
    const Modal_Abril = Array.from(
      document.querySelectorAll(".Planes_Subobjetivo_Nombre")
    ).map((Nodo) => Nodo.textContent.trim()).sort();
    Cerrar_Modal_Planes_Subobjetivos();

    return {
      Anio: Textos_De(Anio),
      Abril: Textos_De(Abril),
      Junio: Textos_De(Junio),
      Julio: Textos_De(Julio),
      Modal_Abril
    };
  });

  expect(Resultado.Anio).toEqual([
    "Mascoter",
    "Potredata",
    "Semaplan"
  ]);
  expect(Resultado.Abril).toEqual(["Semaplan"]);
  expect(Resultado.Junio).toEqual(["Potredata"]);
  expect(Resultado.Julio).toEqual(["Mascoter"]);
  expect(Resultado.Modal_Abril).toEqual(["Semaplan"]);
  expect(errores).toEqual([]);
});

test("Objetivo sin metrica administra subobjetivos embebidos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Ids = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Vista = "Tarjetas";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Id: "Obj_Padre_Sin_Metrica",
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica"
      }
    );
    const Mes = Planes_Crear_Periodo(
      Modelo,
      "Mes",
      "2026-04-01",
      "2026-04-30",
      Anio.Id,
      4
    );
    const Hijo = Planes_Crear_Objetivo_Silencioso(
      Mes.Id,
      {
        Id: "Obj_Hijo_Sin_Metrica",
        Nombre: "Finanzas abril",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica",
        Objetivo_Padre_Id: Padre.Id
      }
    );
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Hijo.Id,
      "Armar presupuesto"
    );
    const Sub_Dos_Id = Planes_Agregar_Subobjetivo(
      Hijo.Id,
      "Revisar inversiones"
    );
    const Modelo_Subs = Asegurar_Modelo_Planes();
    const Sub = Modelo_Subs.Subobjetivos[Sub_Id];
    Sub.Target_Total = 0;
    Sub.Aporte_Meta = 0;
    const Sub_Dos = Modelo_Subs.Subobjetivos[Sub_Dos_Id];
    Sub_Dos.Target_Total = 0;
    Sub_Dos.Aporte_Meta = 0;
    Planes_Actualizar_Progreso(Padre);
    Planes_Actualizar_Progreso(Hijo);
    Render_Planes_Contenido();
    return { Padre_Id: Padre.Id, Sub_Id, Sub_Dos_Id };
  });

  await page.locator(
    `[data-plan-objetivo-id="${Ids.Padre_Id}"]`
  ).click({ button: "right" });
  await expect(
    page.locator('.Planes_Context_Menu [data-plan-accion="editar"]')
  ).toBeVisible();
  await page.locator(
    '.Planes_Context_Menu [data-plan-accion="editar"]'
  ).click();
  await expect(page.locator("#Planes_Objetivo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Planes_Objetivo_Modo_Avance"))
    .toHaveCount(0);
  await expect(page.locator("#Planes_Objetivo_Target"))
    .toHaveValue("");
  await page.click("#Planes_Objetivo_Cancelar");

  await page.evaluate((Padre_Id) => {
    Abrir_Modal_Planes_Subobjetivos(Padre_Id, false);
  }, Ids.Padre_Id);
  const Sub_Embebido = page.locator(
    `[data-plan-subobjetivo-id="${Ids.Sub_Id}"]`
  );
  await expect(Sub_Embebido).toBeVisible();
  await expect(Sub_Embebido).toHaveClass(/Embebido/);
  await expect(Sub_Embebido).toHaveAttribute("draggable", "true");

  const Orden_Reordenado = await page.evaluate((Datos) => {
    Planes_Reordenar_Subobjetivo(
      Datos.Padre_Id,
      Datos.Sub_Id,
      Datos.Sub_Dos_Id,
      true
    );
    Render_Modal_Planes_Subobjetivos();
    return Array.from(
      document.querySelectorAll(".Planes_Subobjetivo_Nombre")
    ).map((Nodo) => Nodo.textContent.trim());
  }, Ids);
  expect(Orden_Reordenado.slice(0, 2)).toEqual([
    "Revisar inversiones",
    "Armar presupuesto"
  ]);

  await Sub_Embebido.click({ button: "right" });
  await expect(
    page.locator(
      '.Planes_Context_Menu [data-plan-sub-accion="editar"]'
    )
  ).toBeVisible();
  await expect(
    page.locator(
      '.Planes_Context_Menu [data-plan-sub-accion="distribucion"]'
    )
  ).toHaveCount(0);
  await page.locator(
    '.Planes_Context_Menu [data-plan-sub-accion="editar"]'
  ).click();
  await expect(page.locator("#Planes_Subobjetivo_Overlay"))
    .toHaveClass(/Activo/);
  await page.fill(
    "#Planes_Subobjetivo_Texto",
    "Presupuesto editado"
  );
  await page.click("#Planes_Subobjetivo_Guardar");
  await expect(
    Sub_Embebido.locator(".Planes_Subobjetivo_Nombre")
  ).toHaveText("Presupuesto editado");

  await Sub_Embebido.click({ button: "right" });
  await page.locator(
    '.Planes_Context_Menu [data-plan-sub-accion="eliminar"]'
  ).click();
  await expect(Sub_Embebido).toHaveCount(0);
  const Eliminado = await page.evaluate((Sub_Id) => {
    return Asegurar_Modelo_Planes()
      .Subobjetivos[Sub_Id]?.Eliminado_Local === true;
  }, Ids.Sub_Id);
  expect(Eliminado).toBe(true);
  expect(errores).toEqual([]);
});

test("Padre anual lista subobjetivos creados desde hijo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Vista = "Tarjetas";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Trimestre = Planes_Crear_Periodo(
      Modelo,
      "Trimestre",
      "2026-04-01",
      "2026-06-30",
      Anio.Id,
      2
    );
    const Padre = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica"
      }
    );
    const Hijo = Planes_Crear_Objetivo_Silencioso(
      Trimestre.Id,
      {
        Nombre: "Independencia financiera T2",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica",
        Objetivo_Padre_Id: Padre.Id
      }
    );
    ["Fondo de emergencia", "Presupuesto", "Inversiones"]
      .forEach((Texto) => {
        const Sub_Id = Planes_Agregar_Subobjetivo(Hijo.Id, Texto);
        const Modelo_Subs = Asegurar_Modelo_Planes();
        Modelo_Subs.Subobjetivos[Sub_Id].Aporte_Meta = 1;
      });
    Planes_Actualizar_Progreso(Hijo);
    Planes_Actualizar_Progreso(Padre);
    const Contexto = Planes_Subobjetivos_Contexto_Objetivo(Padre);
    const Aporte_Contexto = Contexto.Items.reduce((Total, Sub) => {
      return Total + (Number(Sub.Aporte_Meta) || 0);
    }, 0);

    Planes_Subobjetivos_Filtro_Estado = "Todos";
    Planes_Subobjetivos_Filtro_Periodo = "Periodo";
    Planes_Subobjetivos_Filtro_Metadato = "";
    Abrir_Modal_Planes_Subobjetivos(Padre.Id, false);
    const Textos = Array.from(
      document.querySelectorAll(".Planes_Subobjetivo_Nombre")
    ).map((Nodo) => Nodo.textContent.trim());
    const Vacio = document.querySelector(
      "#Planes_Subobjetivos_Lista .Planes_Vacio"
    )
      ?.textContent || "";
    return {
      Cantidad_Contexto: Contexto.Items.length,
      Aporte_Contexto,
      Textos,
      Vacio,
      Filtro: document.getElementById(
        "Planes_Subobjetivos_Filtro_Periodo"
      )?.value || ""
    };
  });

  expect(Resultado.Cantidad_Contexto).toBe(3);
  expect(Resultado.Aporte_Contexto).toBe(3);
  expect(Resultado.Textos).toEqual([
    "Fondo de emergencia",
    "Presupuesto",
    "Inversiones"
  ]);
  expect(Resultado.Vacio).toBe("");
  expect(Resultado.Filtro).toBe("Periodo");
  expect(errores).toEqual([]);
});

test("Subobjetivos ignora progreso legacy sin avances reales",
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
    const Modelo_Actual = Asegurar_Modelo_Planes();
    const Sub = Modelo_Actual.Subobjetivos[Sub_Id];
    Sub.Importado = true;
    Sub.Hecha = true;
    Sub.Estado = "Cumplido";
    Sub.Fecha_Fin = "2026-04-25";
    Sub.Progreso_Manual = 156;
    Planes_Subobjetivos_Filtro_Estado = "Todos";
    Planes_Actualizar_Progreso(
      Modelo_Actual.Objetivos[Objetivo.Id]
    );

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

  expect(Resultado.Meta).toMatch(/^0%/);
  expect(Resultado.Meta).toContain("0/156");
  expect(Resultado.Meta).toContain("+1 libro");
  expect(Resultado.Meta).not.toContain("(");
  expect(Resultado.Badge_Importado).toBe(false);
  expect(Resultado.Metadatos_Visibles).toBe(0);
  expect(Resultado.Texto).not.toContain("Importado");
  expect(errores).toEqual([]);
});

test("Mostrar por rango no duplica objetivos y filtra avances",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Vista = "Tarjetas";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 12,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Fecha_Inicio: "2026-04-10",
      Fecha_Fin: "2026-08-20"
    });
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Padre.Id,
      "Libro de julio"
    );
    let Modelo_Actual = Asegurar_Modelo_Planes();
    let Padre_Actual = Modelo_Actual.Objetivos[Padre.Id];
    const Sub = Modelo_Actual.Subobjetivos[Sub_Id];
    Sub.Fecha_Objetivo = "2026-07-15";
    Sub.Aporte_Meta = 1;
    const Resumen = Planes_Importar_Objetivos_Padres_A_Periodos([
      { Periodo_Id: Trimestres[1].Id, Objetivo_Ids: [Padre_Actual.Id] }
    ], { Modo: "Proporcional" });
    Modelo_Actual = Asegurar_Modelo_Planes();
    Padre_Actual = Modelo_Actual.Objetivos[Padre.Id];
    const Q2 = Planes_Filtrar_Objetivos(Trimestres[1]);
    const Q3 = Planes_Filtrar_Objetivos(Trimestres[2]);
    const Hijos = Object.values(Modelo_Actual.Objetivos)
      .filter((Objetivo) =>
        Planes_Objetivo_Padre_Id(Objetivo) === Padre_Actual.Id
      );
    const Avance_Id = Crear_Id_Avance_Plan();
    Modelo_Actual.Avances[Avance_Id] = Normalizar_Avance_Plan({
      Id: Avance_Id,
      Objetivo_Id: Padre_Actual.Id,
      Fuente: "Manual",
      Cantidad: 2,
      Unidad: "libros"
    });
    const Registro_Padre = Planes_Registros_De_Objetivo(Padre_Actual);
    const Registro_Q2 = Planes_Registros_De_Objetivo(Q2[0]);
    const Sub_Fuera = {
      Fecha_Objetivo: "2026-09-01"
    };
    const Sub_Dentro = {
      Fecha_Objetivo: "2026-07-15"
    };
    const Sub_Dentro_Ok =
      Planes_Rango_Subobjetivo_Dentro_Objetivo(Sub_Dentro, Padre_Actual);
    const Sub_Fuera_Ok =
      Planes_Rango_Subobjetivo_Dentro_Objetivo(Sub_Fuera, Padre_Actual);
    Padre_Actual.Fecha_Fin = "2026-06-30";
    const Q3_Despues = Planes_Filtrar_Objetivos(Trimestres[2]);
    const Avance = Modelo_Actual.Avances[Avance_Id];
    return {
      Resumen,
      Q2: Q2.map((Objetivo) => ({
        Id: Objetivo.Id,
        Target: Objetivo.Target_Total,
        Planeado: Planes_Aportes_Planeados_Objetivo(Objetivo)
      })),
      Q3: Q3.map((Objetivo) => Objetivo.Id),
      Q3_Despues: Q3_Despues.map((Objetivo) => ({
        Id: Objetivo.Id,
        Periodo_Id: Objetivo.Periodo_Id,
        Proyectado: Boolean(Objetivo.__Plan_Proyectado),
        Fecha_Inicio: Objetivo.Fecha_Inicio,
        Fecha_Fin: Objetivo.Fecha_Fin
      })),
      Hijos: Hijos.length,
      Registro_Padre: Registro_Padre.length,
      Registro_Q2: Registro_Q2.length,
      Aparece_Padre:
        Planes_Avance_Aparece_En_Registro_Objetivo(
          Avance,
          Padre_Actual,
          Modelo_Actual
        ),
      Aparece_Q2:
        Planes_Avance_Aparece_En_Registro_Objetivo(
          Avance,
          Q2[0],
          Modelo_Actual
        ),
      Sub_Dentro: Sub_Dentro_Ok,
      Sub_Fuera: Sub_Fuera_Ok
    };
  });

  expect(Resultado.Resumen.Creados).toBe(1);
  expect(Resultado.Hijos).toBe(0);
  expect(Resultado.Q2).toHaveLength(1);
  expect(Resultado.Q2[0].Target).toBe(3);
  expect(Resultado.Q2[0].Planeado).toBe(0);
  expect(Resultado.Q3).toHaveLength(1);
  expect(Resultado.Q3_Despues).toHaveLength(1);
  expect(Resultado.Registro_Padre).toBe(1);
  expect(Resultado.Registro_Q2).toBe(0);
  expect(Resultado.Aparece_Padre).toBe(true);
  expect(Resultado.Aparece_Q2).toBe(false);
  expect(Resultado.Sub_Dentro).toBe(true);
  expect(Resultado.Sub_Fuera).toBe(true);
  expect(errores).toEqual([]);
});

test("Avance parcial cuenta por fecha aunque el libro sea futuro",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Date_Real = Date;
    class Date_Fija extends Date {
      constructor(...Args) {
        if (Args.length) {
          super(...Args);
        } else {
          super("2026-04-23T12:00:00");
        }
      }

      static now() {
        return new Date_Real("2026-04-23T12:00:00").getTime();
      }
    }
    Date_Fija.UTC = Date_Real.UTC;
    Date_Fija.parse = Date_Real.parse;
    window.Date = Date_Fija;
    try {
      Abrir_Plan();
      const Modelo = Asegurar_Jerarquia_Planes();
      Modelo.UI.Anio_Activo = 2026;
      Modelo.UI.Filtro_Tipo = "Trimestre";
      Modelo.UI.Subperiodo_Activo = 1;
      const Anio = Planes_Crear_Periodo(
        Modelo,
        "Anio",
        "2026-01-01",
        "2026-12-31",
        null,
        2026
      );
      const Trimestres =
        Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
      const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
        Nombre: "Libros",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 4,
        Unidad: "Personalizado",
        Unidad_Custom: "libros",
        Redistribucion_Target: {
          Tipo: "Trimestre",
          Modo: "Deuda"
        }
      });
      const Sub_Id = Planes_Agregar_Subobjetivo(
        Padre.Id,
        "Libro de mayo"
      );
      const Modelo_Actual = Asegurar_Modelo_Planes();
      const Sub = Modelo_Actual.Subobjetivos[Sub_Id];
      Sub.Fecha_Inicio = "2026-05-01";
      Sub.Fecha_Objetivo = "2026-05-31";
      Sub.Target_Total = 100;
      Sub.Aporte_Meta = 1;
      Sub.Unidad = "Personalizado";
      Sub.Unidad_Custom = "paginas";
      const Avance_Id = Crear_Id_Avance_Plan();
      Modelo_Actual.Avances[Avance_Id] = Normalizar_Avance_Plan({
        Id: Avance_Id,
        Objetivo_Id: Padre.Id,
        Subobjetivo_Id: Sub_Id,
        Fuente: "Subobjetivo",
        Cantidad: 50,
        Unidad: "paginas",
        Fecha: "2026-01-01",
        Hora: "00:00"
      });
      Planes_Recalcular_Progreso_Subobjetivo(Sub, Modelo_Actual);
      Planes_Actualizar_Progreso(Padre);
      const T1 = Trimestres[0];
      const T2 = Trimestres[1];
      const Padre_T1 = Planes_Objetivo_Para_Periodo(Padre, T1);
      Planes_Actualizar_Progreso(Padre_T1);
      const Redistribucion =
        Planes_Targets_Redistribucion_Contextual(Padre);
      return {
        Ubicado_T1:
          Planes_Subobjetivo_Ubicado_En_Periodo(Sub, T1, Modelo_Actual),
        Aporte_T1:
          Planes_Aporte_Subobjetivo_En_Periodo(Sub, T1, Modelo_Actual),
        Aporte_T2:
          Planes_Aporte_Subobjetivo_En_Periodo(Sub, T2, Modelo_Actual),
        Avance_T1:
          Planes_Avance_Real_Objetivo_En_Periodo(Padre, T1),
        Progreso_T1: Padre_T1.Progreso_Total,
        Target_T2: Redistribucion.get(T2.Id)
      };
    } finally {
      window.Date = Date_Real;
    }
  });

  expect(Resultado.Ubicado_T1).toBe(false);
  expect(Resultado.Aporte_T1).toBeCloseTo(0.5, 5);
  expect(Resultado.Aporte_T2).toBe(0);
  expect(Resultado.Avance_T1).toBeCloseTo(0.5, 5);
  expect(Resultado.Progreso_T1).toBeCloseTo(0.5, 5);
  expect(Resultado.Target_T2).toBeCloseTo(7 / 6, 5);
  expect(errores).toEqual([]);
});

test("Asignados incluye aportes sin fecha en objetivo anual",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 40,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    const Con_Fecha = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Con fecha"
    );
    const Sin_Fecha = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Sin fecha"
    );
    const Modelo_Final = Asegurar_Modelo_Planes();
    Modelo_Final.Subobjetivos[Con_Fecha].Aporte_Meta = 21;
    Modelo_Final.Subobjetivos[Con_Fecha].Fecha_Objetivo = "2026-06-30";
    Modelo_Final.Subobjetivos[Sin_Fecha].Aporte_Meta = 10;
    Modelo_Final.Subobjetivos[Sin_Fecha].Fecha_Objetivo = "";
    Modelo_Final.Subobjetivos[Sin_Fecha].Fecha_Fin = "";
    Planes_Actualizar_Progreso(Objetivo);
    const Objetivo_Q2 =
      Planes_Objetivo_Para_Periodo(Objetivo, Trimestres[1]);

    return {
      asignados: Planes_Aportes_Planeados_Objetivo(Objetivo),
      asignadosQ2: Planes_Aportes_Planeados_Objetivo(Objetivo_Q2),
      resumen: Planes_Items_Resumen_Tarjeta_Objetivo(Objetivo)
        .map((Item) => Item.Texto)
    };
  });

  expect(Resultado.asignados).toBe(31);
  expect(Resultado.asignadosQ2).toBe(21);
  expect(Resultado.resumen.join(" ")).toContain("31 asignados");
  expect(errores).toEqual([]);
});

test("Objetivo padre se ve en hijos sin Mostrar ni ocultamiento",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Semestre";
    Modelo.UI.Vista = "Tarjetas";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Semestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Semestre");
    Modelo.UI.Periodo_Activo_Id = Semestres[0].Id;
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Proyecto anual",
      Emoji: "\uD83D\uDCCD",
      Target_Total: 10,
      Unidad: "Horas"
    });
    const Ajuste_Inicial = Planes_Asegurar_Ajuste_Periodo_Objetivo(
      Padre,
      Semestres[0].Id
    );
    Ajuste_Inicial.Estado_Vinculo = "Eliminado";
    Ajuste_Inicial.Eliminado_Local = true;
    Ajuste_Inicial.Regla_Distribucion = "Uniforme";
    Ajuste_Inicial.Target_Total = 5;
    Ajuste_Inicial.Target_Automatico = 5;
    Render_Plan();
    let Visibles = Planes_Filtrar_Objetivos(Semestres[0]);
    const Visible = Visibles.find((Objetivo) =>
      Objetivo.__Objetivo_Canonico_Id === Padre.Id
    );
    let Modelo_Actual = Asegurar_Modelo_Planes();
    let Padre_Actual = Modelo_Actual.Objetivos[Padre.Id];
    const Ajuste_Activo =
      Padre_Actual.Ajustes_Periodos?.[Semestres[0].Id];
    const Target_Activo = Number(Visible?.Target_Total) || 0;
    const Activo_Eliminado =
      Boolean(Ajuste_Activo?.Eliminado_Local);
    const Botones_Mostrar = document.querySelectorAll(
      "[data-plan-universo-importar], " +
      "[data-plan-periodo-importar], " +
      "[data-plan-importar-periodo]"
    ).length;

    Planes_Marcar_Objetivo_Mostrado_Eliminado(Visible);
    Render_Plan();
    Modelo_Actual = Asegurar_Modelo_Planes();
    Padre_Actual = Modelo_Actual.Objetivos[Padre.Id];
    const Ajuste_Eliminado =
      Padre_Actual.Ajustes_Periodos?.[Semestres[0].Id];
    const Eliminado = Boolean(Ajuste_Eliminado?.Eliminado_Local);
    const Visibles_Tras_Ocultar = Planes_Filtrar_Objetivos(
      Semestres[0]
    );
    const Visible_Tras_Ocultar = Visibles_Tras_Ocultar.find((Objetivo) =>
      Objetivo.__Objetivo_Canonico_Id === Padre.Id
    );

    return {
      Botones_Mostrar,
      Visibles_Inicial: Visibles.length,
      Target_Activo,
      Activo_Proyectado: Boolean(Visible?.__Plan_Proyectado),
      Activo_Eliminado,
      Eliminado,
      Visibles_Tras_Ocultar: Visibles_Tras_Ocultar.length,
      Proyectado_Tras_Ocultar:
        Boolean(Visible_Tras_Ocultar?.__Plan_Proyectado),
      Target_Tras_Ocultar:
        Number(Visible_Tras_Ocultar?.Target_Total) || 0
    };
  });

  expect(Resultado.Botones_Mostrar).toBe(0);
  expect(Resultado.Visibles_Inicial).toBe(1);
  expect(Resultado.Activo_Proyectado).toBe(true);
  expect(Resultado.Activo_Eliminado).toBe(true);
  expect(Resultado.Target_Activo).toBe(5);
  expect(Resultado.Eliminado).toBe(true);
  expect(Resultado.Visibles_Tras_Ocultar).toBe(1);
  expect(Resultado.Proyectado_Tras_Ocultar).toBe(true);
  expect(Resultado.Target_Tras_Ocultar).toBe(5);
  expect(errores).toEqual([]);
});

test("Ocultar objetivo en periodo afecta descendientes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Semestre";
    Modelo.UI.Vista = "Tarjetas";
    Modelo.UI.Mostrar_Ocultos_Periodo = false;
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Semestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Semestre");
    const Meses = Planes_Crear_Periodos_Distribucion(Anio, "Mes");
    const Enero = Meses.find((Periodo) =>
      Periodo.Inicio === "2026-01-01"
    );
    const Julio = Meses.find((Periodo) =>
      Periodo.Inicio === "2026-07-01"
    );
    Modelo.UI.Periodo_Activo_Id = Semestres[0].Id;
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros",
      Emoji: "\uD83D\uDCDA",
      Target_Total: 120,
      Unidad: "Personalizado",
      Unidad_Custom: "libros"
    });
    Render_Plan();
    const Boton_Ojo = Boolean(
      document.querySelector("[data-plan-universo-ocultos]")
    );
    const Menu_Antes =
      Render_Planes_Objetivo_Acciones(
        Padre,
        Semestres[0].Id
      );
    const Ocultar_Ok =
      Planes_Cambiar_Ocultamiento_Objetivo_Periodo(
        Padre.Id,
        Semestres[0].Id,
        true
      );
    const Ids = (Periodo) =>
      Planes_Filtrar_Objetivos(Periodo)
        .map((Objetivo) => Objetivo.__Objetivo_Canonico_Id || Objetivo.Id);
    const Sin_Ocultos = {
      Anio: Ids(Anio),
      Semestre_1: Ids(Semestres[0]),
      Semestre_2: Ids(Semestres[1]),
      Enero: Ids(Enero),
      Julio: Ids(Julio)
    };
    Asegurar_Modelo_Planes().UI.Mostrar_Ocultos_Periodo = true;
    const Con_Ocultos = {
      Semestre_1: Ids(Semestres[0]),
      Enero: Ids(Enero)
    };
    Asegurar_Modelo_Planes().UI.Periodo_Activo_Id = Semestres[0].Id;
    Render_Plan();
    const Card_Oculto = document.querySelector(
      ".Planes_Objetivo_Card.Oculto_Contextual"
    );
    const Menu_Despues =
      Render_Planes_Objetivo_Acciones(
        Padre,
        Semestres[0].Id
      );
    const Mostrar_Ok =
      Planes_Cambiar_Ocultamiento_Objetivo_Periodo(
        Padre.Id,
        Enero.Id,
        false
      );
    Asegurar_Modelo_Planes().UI.Mostrar_Ocultos_Periodo = false;
    const Restaurado = {
      Semestre_1: Ids(Semestres[0]),
      Enero: Ids(Enero)
    };
    return {
      Padre_Id: Padre.Id,
      Boton_Ojo,
      Menu_Antes,
      Menu_Despues,
      Ocultar_Ok,
      Mostrar_Ok,
      Sin_Ocultos,
      Con_Ocultos,
      Restaurado,
      Card_Oculto: Boolean(Card_Oculto)
    };
  });

  expect(Resultado.Boton_Ojo).toBe(true);
  expect(Resultado.Menu_Antes).toContain("Ocultar");
  expect(Resultado.Menu_Despues).toContain("Mostrar");
  expect(Resultado.Ocultar_Ok).toBe(true);
  expect(Resultado.Mostrar_Ok).toBe(true);
  expect(Resultado.Sin_Ocultos.Anio).toContain(Resultado.Padre_Id);
  expect(Resultado.Sin_Ocultos.Semestre_1).not.toContain(
    Resultado.Padre_Id
  );
  expect(Resultado.Sin_Ocultos.Semestre_2).toContain(
    Resultado.Padre_Id
  );
  expect(Resultado.Sin_Ocultos.Enero).not.toContain(Resultado.Padre_Id);
  expect(Resultado.Sin_Ocultos.Julio).toContain(Resultado.Padre_Id);
  expect(Resultado.Con_Ocultos.Semestre_1).toContain(Resultado.Padre_Id);
  expect(Resultado.Con_Ocultos.Enero).toContain(Resultado.Padre_Id);
  expect(Resultado.Card_Oculto).toBe(true);
  expect(Resultado.Restaurado.Semestre_1).toContain(Resultado.Padre_Id);
  expect(Resultado.Restaurado.Enero).toContain(Resultado.Padre_Id);
  expect(errores).toEqual([]);
});

test("Objetivo sin target muestra asignados fechados",
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
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    Modelo.UI.Periodo_Activo_Id = Trimestres[2].Id;
    Modelo.UI.Filtro_Tipo = "Trimestre";
    Modelo.UI.Vista = "Tarjetas";
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Trimestres[2].Id,
      {
        Nombre: "Independencia financiera",
        Emoji: "\uD83D\uDCB0",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica"
      }
    );
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Mascoter"
    );
    const Modelo_Actual = Asegurar_Modelo_Planes();
    const Objetivo_Actual = Modelo_Actual.Objetivos[Objetivo.Id];
    const Sub = Modelo_Actual.Subobjetivos[Sub_Id];
    Sub.Fecha_Objetivo = "2026-07-20";
    Sub.Aporte_Meta = 1;
    const Texto = Planes_Formatear_Meta_Objetivo(
      Objetivo_Actual,
      { Incluir_Faltante: true }
    );
    const Anio_Pasado = Planes_Crear_Periodo(
      Modelo_Actual,
      "Anio",
      "2020-01-01",
      "2020-12-31",
      null,
      2020
    );
    const Trimestres_Pasados =
      Planes_Crear_Periodos_Distribucion(Anio_Pasado, "Trimestre");
    const Objetivo_Pasado = Planes_Crear_Objetivo_Silencioso(
      Trimestres_Pasados[2].Id,
      {
        Nombre: "Planeado pasado",
        Emoji: "\uD83D\uDCC5",
        Target_Total: 0,
        Modo_Avance: "Sin_Metrica"
      }
    );
    const Sub_Pasado_Id = Planes_Agregar_Subobjetivo(
      Objetivo_Pasado.Id,
      "Hito pasado"
    );
    const Sub_Pasado = Modelo_Actual.Subobjetivos[Sub_Pasado_Id];
    Sub_Pasado.Fecha_Objetivo = "2020-07-20";
    Sub_Pasado.Aporte_Meta = 1;
    const Texto_Pasado = Planes_Formatear_Meta_Objetivo(
      Objetivo_Pasado,
      { Incluir_Faltante: true }
    );
    Modelo_Actual.UI.Periodo_Activo_Id = Trimestres_Pasados[2].Id;
    Modelo_Actual.UI.Filtro_Tipo = "Trimestre";
    Render_Planes_Contenido();
    const Principal_Pasado = document
      .getElementById("Plan_Overlay")
      ?.classList.contains("Periodo_Cerrado");
    Abrir_Modal_Planes_Objetivo(
      Trimestres_Pasados[2].Id,
      Objetivo_Pasado.Id
    );
    const Modal_Pasado = document
      .getElementById("Planes_Objetivo_Overlay")
      ?.classList.contains("Periodo_Cerrado");
    Cerrar_Modal_Planes_Objetivo();
    const Contexto =
      Planes_Subobjetivos_Contexto_Objetivo(Objetivo_Actual);
    return {
      Texto,
      Texto_Pasado,
      Principal_Pasado,
      Modal_Pasado,
      Aportes: Planes_Aportes_Planeados_Objetivo(Objetivo_Actual),
      Pasado_Cerrado: Planes_Periodo_Cerrado(
        Modelo_Actual.Periodos[Objetivo_Pasado.Periodo_Id]
      ),
      Periodo: Modelo_Actual.Periodos[Objetivo_Actual.Periodo_Id],
      Items: Contexto.Items.map((Item) => ({
        Texto: Item.Texto,
        Fecha_Objetivo: Item.Fecha_Objetivo,
        Aporte_Meta: Item.Aporte_Meta,
        Planeado:
          Planes_Subobjetivo_Planeado_En_Periodo(
            Item,
            Modelo_Actual.Periodos[Objetivo_Actual.Periodo_Id]
          )
      }))
    };
  });

  expect(Resultado.Texto).toContain("1 asignados");
  expect(Resultado.Pasado_Cerrado).toBe(true);
  expect(Resultado.Principal_Pasado).toBe(true);
  expect(Resultado.Modal_Pasado).toBe(false);
  expect(Resultado.Texto_Pasado).not.toContain("asignados");
  expect(Resultado.Aportes).toBe(1);
  expect(errores).toEqual([]);
});

test("Editar target muestra todos los periodos relacionados",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
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
    const Trimestres =
      Planes_Crear_Periodos_Distribucion(Anio, "Trimestre");
    const Padre = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Libros",
      Target_Total: 12,
      Unidad: "Personalizado",
      Unidad_Custom: "libros",
      Fecha_Inicio: "2026-04-10",
      Fecha_Fin: "2026-08-20"
    });
    const Tarea = Planes_Editar_Target(
      Padre.Id,
      Trimestres[1].Id
    );
    await new Promise((Resolver) => setTimeout(Resolver, 0));
    const Inputs = Array.from(document.querySelectorAll(
      "[data-plan-target-periodo]"
    ));
    const Periodos_Modal = Inputs.map((Input) =>
      Input.dataset.planTargetPeriodo
    );
    document.querySelector("[data-plan-target-padre]").value = "12";
    Inputs[1].value = "5";
    Inputs[2].value = "7";
    Inputs[1].closest(".Planes_Target_Fila")
      .querySelector("[data-plan-target-fijar]").checked = true;
    document.querySelector("[data-plan-target-guardar]").click();
    await Tarea;
    const Modelo_Actual = Asegurar_Modelo_Planes();
    const Padre_Actual = Modelo_Actual.Objetivos[Padre.Id];
    const Ajustes = Padre_Actual.Ajustes_Periodos || {};
    const Hijos = Object.values(Modelo_Actual.Objetivos)
      .filter((Objetivo) =>
        Planes_Objetivo_Padre_Id(Objetivo) === Padre.Id
      );
    return {
      Periodos_Modal,
      Target_Padre: Padre_Actual.Target_Total,
      Q2: Ajustes[Trimestres[1].Id],
      Q3: Ajustes[Trimestres[2].Id],
      Hijos: Hijos.length
    };
  });

  expect(Resultado.Periodos_Modal).toEqual([
    "P_Trimestre_2026-01-01_2026-03-31",
    "P_Trimestre_2026-04-01_2026-06-30",
    "P_Trimestre_2026-07-01_2026-09-30",
    "P_Trimestre_2026-10-01_2026-12-31"
  ]);
  expect(Resultado.Target_Padre).toBe(12);
  expect(Resultado.Q2.Target_Total).toBe(5);
  expect(Resultado.Q2.Fijado).toBe(true);
  expect(Resultado.Q3.Target_Total).toBe(7);
  expect(Resultado.Q3.Regla_Distribucion).toBe("Manual");
  expect(Resultado.Hijos).toBe(0);
  expect(errores).toEqual([]);
});

test("Toasts permiten cierre manual con cruz",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);

  await page.evaluate(() => {
    Mostrar_Toast_Info("Info de prueba", "\u2139\ufe0f", 5000);
  });
  await expect(
    page.locator("#Undo_Contenedor .Toast_Cerrar")
  ).toHaveCount(1);
  await page.locator("#Undo_Contenedor .Toast_Cerrar").first()
    .click();
  await expect(
    page.locator("#Undo_Contenedor .Undo_Toast")
  ).toHaveCount(0);

  await page.evaluate(() => {
    Mostrar_Toast_Undo("Undo de prueba", Capturar_Snapshot_Undo());
  });
  await expect(
    page.locator("#Undo_Contenedor .Toast_Cerrar")
  ).toHaveCount(1);
  await page.locator("#Undo_Contenedor .Toast_Cerrar").first()
    .click();
  await expect(
    page.locator("#Undo_Contenedor .Undo_Toast")
  ).toHaveCount(0);

  await page.evaluate(() => {
    Mostrar_Toast_Meta("Meta", "Subtitulo");
  });
  await expect(
    page.locator("#Meta_Toast_Contenedor .Toast_Cerrar")
  ).toHaveCount(1);
  await page.locator("#Meta_Toast_Contenedor .Toast_Cerrar")
    .first()
    .click();
  await expect(
    page.locator("#Meta_Toast_Contenedor .Meta_Toast")
  ).toHaveCount(0);

  expect(errores).toEqual([]);
});

test("Subobjetivos ordena por campos y direccion",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Lecturas",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    const Zeta = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Zeta"
    );
    const Alfa = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Alfa"
    );
    const Beta = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Beta"
    );
    const Modelo_Subs = Asegurar_Modelo_Planes();
    Object.assign(Modelo_Subs.Subobjetivos[Zeta], {
      Fecha_Inicio: "2026-05-02",
      Fecha_Objetivo: "2026-06-01"
    });
    Object.assign(Modelo_Subs.Subobjetivos[Alfa], {
      Target_Total: 1,
      Fecha_Inicio: "2026-04-01",
      Fecha_Objetivo: "2026-04-20"
    });
    Modelo_Subs.Avances.av_alfa_final = Normalizar_Avance_Plan({
      Id: "av_alfa_final",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Alfa,
      Fuente: "Subobjetivo",
      Cantidad: 1,
      Unidad: "libros",
      Fecha: "2026-04-25",
      Hora: "10:00"
    });
    Object.assign(Modelo_Subs.Subobjetivos[Beta], {
      Fecha_Inicio: "2026-03-15",
      Fecha_Objetivo: "2026-05-10"
    });
    Planes_Recalcular_Progreso_Subobjetivo(
      Modelo_Subs.Subobjetivos[Alfa],
      Modelo_Subs
    );
    Planes_Actualizar_Progreso(Objetivo);
    Planes_Subobjetivos_Filtro_Estado = "Todos";
    Abrir_Modal_Planes_Subobjetivos(Objetivo.Id, false);

    const Leer = () => Array.from(
      document.querySelectorAll(".Planes_Subobjetivo_Nombre")
    ).map((Nodo) => Nodo.textContent.trim());
    const Ordenar = (Campo, Direccion) => {
      Planes_Subobjetivos_Orden_Campo = Campo;
      Planes_Subobjetivos_Orden_Direccion = Direccion;
      Render_Modal_Planes_Subobjetivos();
      return Leer();
    };
    return {
      Tiene_Campo: Boolean(
        document.getElementById("Planes_Subobjetivos_Orden_Campo")
      ),
      Tiene_Direccion: Boolean(
        document.getElementById(
          "Planes_Subobjetivos_Orden_Direccion"
        )
      ),
      Nombre_Asc: Ordenar("Nombre", "Asc"),
      Nombre_Desc: Ordenar("Nombre", "Desc"),
      Estado_Asc: Ordenar("Estado", "Asc"),
      Inicio_Asc: Ordenar("Fecha_Inicio", "Asc"),
      Objetivo_Asc: Ordenar("Fecha_Objetivo", "Asc"),
      Fin_Desc: Ordenar("Fecha_Fin", "Desc")
    };
  });

  expect(Resultado.Tiene_Campo).toBe(true);
  expect(Resultado.Tiene_Direccion).toBe(true);
  expect(Resultado.Nombre_Asc).toEqual(["Alfa", "Beta", "Zeta"]);
  expect(Resultado.Nombre_Desc).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(Resultado.Estado_Asc).toEqual(["Zeta", "Beta", "Alfa"]);
  expect(Resultado.Inicio_Asc).toEqual(["Beta", "Alfa", "Zeta"]);
  expect(Resultado.Objetivo_Asc).toEqual(["Alfa", "Beta", "Zeta"]);
  expect(Resultado.Fin_Desc).toEqual(["Alfa", "Zeta", "Beta"]);
  expect(errores).toEqual([]);
});

test("Reordenar objetivos y subobjetivos no muestra undo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Primero = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      { Nombre: "Primero", Emoji: "\u0031\ufe0f\u20e3" }
    );
    const Segundo = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      { Nombre: "Segundo", Emoji: "\u0032\ufe0f\u20e3" }
    );
    const Sub_A = Planes_Agregar_Subobjetivo(
      Primero.Id,
      "Sub A"
    );
    const Sub_B = Planes_Agregar_Subobjetivo(
      Primero.Id,
      "Sub B"
    );
    const Ok_Objetivo = Planes_Reordenar_Objetivo(
      Anio.Id,
      Primero.Id,
      Segundo.Id,
      true
    );
    const Ok_Sub = Planes_Reordenar_Subobjetivo(
      Primero.Id,
      Sub_A,
      Sub_B,
      true
    );
    return {
      Ok_Objetivo,
      Ok_Sub,
      Toasts: document.querySelectorAll(".Undo_Toast").length,
      Objetivos: Planes_Objetivos_De_Periodo(Anio.Id)
        .map((Item) => Item.Nombre),
      Subs: Planes_Subobjetivos_De_Objetivo(Primero.Id)
        .map((Item) => Item.Texto)
    };
  });

  expect(Resultado.Ok_Objetivo).toBe(true);
  expect(Resultado.Ok_Sub).toBe(true);
  expect(Resultado.Toasts).toBe(0);
  expect(Resultado.Objetivos).toEqual(["Segundo", "Primero"]);
  expect(Resultado.Subs).toEqual(["Sub B", "Sub A"]);
  expect(errores).toEqual([]);
});

test("Emoji activo usa bola naranja en objetivos y subobjetivos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    Modelo.UI.Vista = "Tarjetas";
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Anio.Id;
    const Objetivo = Planes_Crear_Objetivo_Silencioso(
      Anio.Id,
      {
        Nombre: "Lecturas",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "libros"
      }
    );
    Planes_Agregar_Subobjetivo(Objetivo.Id, "Activo");
    Render_Planes_Contenido();
    const Obj_Emoji = document.querySelector(
      ".Planes_Objetivo_Card.Estado_Activo " +
      ".Planes_Objetivo_Emoji"
    );
    Abrir_Modal_Planes_Subobjetivos(Objetivo.Id, false);
    const Sub_Emoji = document.querySelector(
      ".Planes_Subobjetivo.Estado_Activo " +
      ".Planes_Subobjetivo_Emoji"
    );
    return {
      Objetivo_Bg: getComputedStyle(Obj_Emoji)
        .backgroundColor,
      Sub_Bg: getComputedStyle(Sub_Emoji)
        .backgroundColor
    };
  });

  expect(Resultado.Objetivo_Bg).toBe("rgb(245, 158, 11)");
  expect(Resultado.Sub_Bg).toBe("rgb(245, 158, 11)");
  expect(errores).toEqual([]);
});

test("Configuracion de Plan filtra capas visibles",
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
    Render_Plan();

    Abrir_Modal_Planes_Config();
    document.querySelectorAll(
      "#Planes_Config_Capas_Visibles " +
      "input[data-plan-config-capa]"
    ).forEach((Input) => {
      Input.checked = ["Anio", "Mes"].includes(
        Input.dataset.planConfigCapa
      );
    });
    Guardar_Modal_Planes_Config();

    const Opciones = Array.from(
      document.querySelectorAll("#Planes_Capa_Select option")
    ).map((Opt) => Opt.value);
    const Filtro = Modelo.UI.Filtro_Tipo;

    Abrir_Modal_Planes_Config();
    document.querySelectorAll(
      "#Planes_Config_Capas_Visibles " +
      "input[data-plan-config-capa]"
    ).forEach((Input) => {
      Input.checked = false;
    });
    Guardar_Modal_Planes_Config();
    const Sigue_Abierto = document
      .getElementById("Planes_Config_Overlay")
      .classList.contains("Activo");
    Cerrar_Modal_Planes_Config();

    return {
      Opciones,
      Filtro,
      Sigue_Abierto,
      Capas: Modelo.UI.Capas_Visibles
    };
  });

  expect(Resultado.Opciones).toEqual(["Anio", "Mes"]);
  expect(Resultado.Filtro).toBe("Anio");
  expect(Resultado.Sigue_Abierto).toBe(true);
  expect(Resultado.Capas).toEqual(["Anio", "Mes"]);
  expect(errores).toEqual([]);
});
