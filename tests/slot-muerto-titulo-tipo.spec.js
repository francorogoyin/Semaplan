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
}

test("aplica y alterna titulo por tipo en slots muertos", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
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
      Baul_Tareas_Por_Fila: 5,
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "🍽️ Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "😴 Siesta",
        Titulo_Por_Defecto: false
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();

    Alternar_Slot_Muerto("2026-04-13", 10);
    const Clave_10 = "2026-04-13|10";
    const Titulo_Inicial =
      Slots_Muertos_Nombres[Clave_10] || "";

    Crear_Slot_Muerto("2026-04-13", 11, "Siesta");
    const Clave_11 = "2026-04-13|11";
    const Titulo_Sin_Default =
      Slots_Muertos_Nombres[Clave_11] || "";

    Mostrar_Menu_Slot("2026-04-13", 10, 10, 10);
    const Etiqueta_Quitar = document
      .querySelector('[data-acc="toggle-titulo-slot"]')
      ?.textContent?.trim() || "";
    document
      .querySelector('[data-acc="toggle-titulo-slot"]')
      ?.click();
    const Tras_Quitar =
      Slots_Muertos_Nombres[Clave_10] || "";

    Mostrar_Menu_Slot("2026-04-13", 10, 10, 10);
    const Etiqueta_Colocar = document
      .querySelector('[data-acc="toggle-titulo-slot"]')
      ?.textContent?.trim() || "";
    document
      .querySelector('[data-acc="toggle-titulo-slot"]')
      ?.click();
    const Tras_Colocar =
      Slots_Muertos_Nombres[Clave_10] || "";

    return {
      Titulo_Inicial,
      Titulo_Sin_Default,
      Etiqueta_Quitar,
      Etiqueta_Colocar,
      Tras_Quitar,
      Tras_Colocar
    };
  });

  expect(resultado.Titulo_Inicial).toBe("🍽️ Almuerzo");
  expect(resultado.Titulo_Sin_Default).toBe("");
  expect(resultado.Etiqueta_Quitar).toBe("Quitar título");
  expect(resultado.Tras_Quitar).toBe("");
  expect(resultado.Etiqueta_Colocar).toBe("Colocar título");
  expect(resultado.Tras_Colocar).toBe("🍽️ Almuerzo");
});

test("el doble click en un slot muerto con titulo sigue alternando", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|10"],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
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
      Baul_Tareas_Por_Fila: 5,
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "ðŸ½ï¸ Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "ðŸ˜´ Siesta",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {
      "2026-04-13|10": "Comida"
    },
    Slots_Muertos_Nombres: {
      "2026-04-13|10": "ðŸ½ï¸ Almuerzo"
    },
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
  );
  const box = await slot.boundingBox();
  if (!box) {
    throw new Error("No se pudo medir el slot muerto");
  }
  const X = box.x + box.width / 2;
  const Y = box.y + box.height / 2;
  await page.mouse.click(X, Y);
  await page.waitForTimeout(80);
  await page.mouse.click(X, Y);

  const resultado = await page.evaluate(() => {
    const clave = "2026-04-13|10";
    const nombre = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
      '.Slot_Muerto_Nombre'
    );
    return {
      tipo: Slots_Muertos_Tipos[clave] || "",
      titulo: Slots_Muertos_Nombres[clave] || "",
      user_select: nombre
        ? getComputedStyle(nombre).userSelect
        : ""
    };
  });

  expect(resultado.tipo).toBe("Siesta");
  expect(resultado.titulo).toBe("ðŸ˜´ Siesta");
  expect(resultado.user_select).toBe("none");
});

test("el doble click en un slot vacio lo convierte en slot muerto", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
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
      Baul_Tareas_Por_Fila: 5,
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Ã°Å¸ÂÂ½Ã¯Â¸Â Almuerzo",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });

  const slot = page.locator(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );
  const box = await slot.boundingBox();
  if (!box) {
    throw new Error("No se pudo medir el slot vacio");
  }
  const X = box.x + box.width / 2;
  const Y = box.y + box.height / 2;
  await page.mouse.click(X, Y);
  await page.waitForTimeout(80);
  await page.mouse.click(X, Y);

  const resultado = await page.evaluate(() => {
    const clave = "2026-04-13|12";
    return {
      existe: Slots_Muertos.includes(clave),
      tipo: Slots_Muertos_Tipos[clave] || "",
      titulo: Slots_Muertos_Nombres[clave] || ""
    };
  });

  expect(resultado.existe).toBe(true);
  expect(resultado.tipo).toBe("Comida");
  expect(resultado.titulo).toBe("Ã°Å¸ÂÂ½Ã¯Â¸Â Almuerzo");
});

test("aplica el titulo default segun el alcance elegido", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [
      "2026-04-07|10",
      "2026-04-13|10",
      "2026-04-16|10",
      "2026-04-20|10"
    ],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {},
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "🍽️ Almuerzo",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {
      "2026-04-07|10": "Comida",
      "2026-04-13|10": "Comida",
      "2026-04-16|10": "Comida",
      "2026-04-20|10": "Comida"
    },
    Slots_Muertos_Nombres: {
      "2026-04-07|10": "🍽️ Almuerzo",
      "2026-04-13|10": "🍽️ Almuerzo",
      "2026-04-16|10": "🍽️ Almuerzo",
      "2026-04-20|10": "🍽️ Almuerzo"
    },
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();

    const reset = () => {
      Slots_Muertos_Nombres["2026-04-07|10"] = "🍽️ Almuerzo";
      Slots_Muertos_Nombres["2026-04-13|10"] = "🍽️ Almuerzo";
      Slots_Muertos_Nombres["2026-04-16|10"] = "🍽️ Almuerzo";
      Slots_Muertos_Nombres["2026-04-20|10"] = "🍽️ Almuerzo";
    };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "🍝 Cena",
      "Semana"
    );
    const semana = { ...Slots_Muertos_Nombres };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "🍝 Cena",
      "Adelante"
    );
    const adelante = { ...Slots_Muertos_Nombres };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "🍝 Cena",
      "Todas"
    );
    const todas = { ...Slots_Muertos_Nombres };

    return { semana, adelante, todas };
  });

  expect(resultado.semana["2026-04-07|10"]).toBe("🍽️ Almuerzo");
  expect(resultado.semana["2026-04-13|10"]).toBe("🍝 Cena");
  expect(resultado.semana["2026-04-16|10"]).toBe("🍝 Cena");
  expect(resultado.semana["2026-04-20|10"]).toBe("🍽️ Almuerzo");

  expect(resultado.adelante["2026-04-07|10"]).toBe("🍽️ Almuerzo");
  expect(resultado.adelante["2026-04-13|10"]).toBe("🍽️ Almuerzo");
  expect(resultado.adelante["2026-04-16|10"]).toBe("🍝 Cena");
  expect(resultado.adelante["2026-04-20|10"]).toBe("🍝 Cena");

  expect(resultado.todas["2026-04-07|10"]).toBe("🍝 Cena");
  expect(resultado.todas["2026-04-13|10"]).toBe("🍝 Cena");
  expect(resultado.todas["2026-04-16|10"]).toBe("🍝 Cena");
  expect(resultado.todas["2026-04-20|10"]).toBe("🍝 Cena");
});
