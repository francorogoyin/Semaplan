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

test("mantiene el titulo aunque se oculte", async ({
  page
}) => {
  const estadoInicial = {
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "Siesta",
        Titulo_Por_Defecto: false
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();

    Alternar_Slot_Muerto("2026-04-13", 10);
    const Clave_10 = "2026-04-13|10";
    const Titulo_Inicial =
      Slots_Muertos_Nombres[Clave_10] || "";
    const Titulo_Inicial_Visible = Boolean(
      Slots_Muertos_Titulos_Visibles[Clave_10]
    );

    Crear_Slot_Muerto("2026-04-13", 11, "Siesta");
    const Clave_11 = "2026-04-13|11";
    const Titulo_Oculto =
      Slots_Muertos_Nombres[Clave_11] || "";
    const Titulo_Oculto_Visible = Boolean(
      Slots_Muertos_Titulos_Visibles[Clave_11]
    );
    const Titulo_Oculto_En_UI =
      Obtener_Nombre_Slot_Visible("2026-04-13", 11);

    Mostrar_Menu_Slot("2026-04-13", 10, 10, 10);
    const Etiqueta_Quitar = document
      .querySelector('[data-acc="quitar-titulo-slot"]')
      ?.textContent?.trim() || "";
    document
      .querySelector('[data-acc="quitar-titulo-slot"]')
      ?.click();
    const Tras_Quitar =
      Slots_Muertos_Nombres[Clave_10] || "";
    const Tras_Quitar_Visible = Boolean(
      Slots_Muertos_Titulos_Visibles[Clave_10]
    );

    Mostrar_Menu_Slot("2026-04-13", 10, 10, 10);
    const Etiqueta_Colocar = document
      .querySelector('[data-acc="agregar-titulo-slot"]')
      ?.textContent?.trim() || "";
    document
      .querySelector('[data-acc="agregar-titulo-slot"]')
      ?.click();
    const Tras_Colocar =
      Slots_Muertos_Nombres[Clave_10] || "";
    const Tras_Colocar_Visible = Boolean(
      Slots_Muertos_Titulos_Visibles[Clave_10]
    );

    return {
      Titulo_Inicial,
      Titulo_Inicial_Visible,
      Titulo_Oculto,
      Titulo_Oculto_Visible,
      Titulo_Oculto_En_UI,
      Etiqueta_Quitar,
      Etiqueta_Colocar,
      Tras_Quitar,
      Tras_Quitar_Visible,
      Tras_Colocar,
      Tras_Colocar_Visible
    };
  });

  expect(resultado.Titulo_Inicial).toBe("Almuerzo");
  expect(resultado.Titulo_Inicial_Visible).toBeTruthy();
  expect(resultado.Titulo_Oculto).toBe("Siesta");
  expect(resultado.Titulo_Oculto_Visible).toBeFalsy();
  expect(resultado.Titulo_Oculto_En_UI).toBe("");
  expect(resultado.Etiqueta_Quitar).toBe("Borrar título");
  expect(resultado.Tras_Quitar).toBe("Almuerzo");
  expect(resultado.Tras_Quitar_Visible).toBeFalsy();
  expect(resultado.Etiqueta_Colocar).toBe("Colocar título");
  expect(resultado.Tras_Colocar).toBe("Almuerzo");
  expect(resultado.Tras_Colocar_Visible).toBeTruthy();
});

test("el doble click en un slot muerto con titulo sigue alternando", async ({
  page
}) => {
  const estadoInicial = {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|10"],
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "Siesta",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {
      "2026-04-13|10": "Comida"
    },
    Slots_Muertos_Nombres: {
      "2026-04-13|10": "Almuerzo"
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
  expect(resultado.titulo).toContain("Siesta");
  expect(["", "none"]).toContain(resultado.user_select);
});

test("el doble click en un slot vacio lo convierte en slot muerto", async ({
  page
}) => {
  const estadoInicial = {
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
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
  expect(resultado.titulo).toBe("Almuerzo");
});

test("al rotar toma el titulo propio del tipo", async ({
  page
}) => {
  const estadoInicial = {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: ["2026-04-13|12"],
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
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "Almuerzo",
        Titulo_Por_Defecto: true
      },
      {
        Id: "Siesta",
        Nombre: "Siesta",
        Color: "#cfd8ff",
        Titulo: "Siesta",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {
      "2026-04-13|12": "Comida"
    },
    Slots_Muertos_Nombres: {
      "2026-04-13|12": "Bloque fijo"
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

  async function dobleClickSlot() {
    const slot = page.locator(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
    );
    const box = await slot.boundingBox();
    if (!box) {
      throw new Error("No se pudo medir el slot");
    }
    const X = box.x + box.width / 2;
    const Y = box.y + box.height / 2;
    await page.mouse.click(X, Y);
    await page.waitForTimeout(80);
    await page.mouse.click(X, Y);
  }

  await dobleClickSlot();
  const trasCambiarTipo = await page.evaluate(() => {
    const clave = "2026-04-13|12";
    const visible = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
      '.Slot_Muerto_Nombre'
    );
    return {
      tipo: Slots_Muertos_Tipos[clave] || "",
      titulo: Slots_Muertos_Nombres[clave] || "",
      visible: visible?.textContent?.trim() || ""
    };
  });

  await dobleClickSlot();
  const trasLiberar = await page.evaluate(() => {
    const clave = "2026-04-13|12";
    const visible = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
      '.Slot_Muerto_Nombre'
    );
    return {
      existe: Slots_Muertos.includes(clave),
      titulo: Slots_Muertos_Nombres[clave] || "",
      visible: visible?.textContent?.trim() || ""
    };
  });

  await dobleClickSlot();
  const trasRecuperar = await page.evaluate(() => {
    const clave = "2026-04-13|12";
    const visible = document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
      '.Slot_Muerto_Nombre'
    );
    return {
      tipo: Slots_Muertos_Tipos[clave] || "",
      titulo: Slots_Muertos_Nombres[clave] || "",
      visible: visible?.textContent?.trim() || ""
    };
  });

  expect(trasCambiarTipo.tipo).toBe("Siesta");
  expect(trasCambiarTipo.titulo).toBe("Siesta");
  expect(trasCambiarTipo.visible).toBe("Siesta");

  expect(trasLiberar.existe).toBe(false);
  expect(trasLiberar.titulo).toBe("");
  expect(trasLiberar.visible).toBe("");

  expect(trasRecuperar.tipo).toBe("Comida");
  expect(trasRecuperar.titulo).toBe("Almuerzo");
  expect(trasRecuperar.visible).toBe("Almuerzo");
});

test("aplica el titulo default segun el alcance elegido", async ({
  page
}) => {
  const estadoInicial = {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [
      "2026-04-07|10",
      "2026-04-13|10",
      "2026-04-16|10",
      "2026-04-20|10"
    ],
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
    Config_Extra: {},
    Tipos_Slot: [
      {
        Id: "Comida",
        Nombre: "Comida",
        Color: "#f3d39d",
        Titulo: "ðŸ½ï¸ Almuerzo",
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
      "2026-04-07|10": "ðŸ½ï¸ Almuerzo",
      "2026-04-13|10": "ðŸ½ï¸ Almuerzo",
      "2026-04-16|10": "ðŸ½ï¸ Almuerzo",
      "2026-04-20|10": "ðŸ½ï¸ Almuerzo"
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
      Slots_Muertos_Nombres["2026-04-07|10"] = "ðŸ½ï¸ Almuerzo";
      Slots_Muertos_Nombres["2026-04-13|10"] = "ðŸ½ï¸ Almuerzo";
      Slots_Muertos_Nombres["2026-04-16|10"] = "ðŸ½ï¸ Almuerzo";
      Slots_Muertos_Nombres["2026-04-20|10"] = "ðŸ½ï¸ Almuerzo";
    };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "ðŸ Cena",
      "Semana"
    );
    const semana = { ...Slots_Muertos_Nombres };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "ðŸ Cena",
      "Adelante"
    );
    const adelante = { ...Slots_Muertos_Nombres };

    reset();
    Aplicar_Titulo_Default_Tipo_Slot(
      "Comida",
      "ðŸ Cena",
      "Todas"
    );
    const todas = { ...Slots_Muertos_Nombres };

    return { semana, adelante, todas };
  });

  expect(resultado.semana["2026-04-07|10"]).toBe("ðŸ½ï¸ Almuerzo");
  expect(resultado.semana["2026-04-13|10"]).toBe("ðŸ Cena");
  expect(resultado.semana["2026-04-16|10"]).toBe("ðŸ Cena");
  expect(resultado.semana["2026-04-20|10"]).toBe("ðŸ½ï¸ Almuerzo");

  expect(resultado.adelante["2026-04-07|10"]).toBe("ðŸ½ï¸ Almuerzo");
  expect(resultado.adelante["2026-04-13|10"]).toBe("ðŸ½ï¸ Almuerzo");
  expect(resultado.adelante["2026-04-16|10"]).toBe("ðŸ Cena");
  expect(resultado.adelante["2026-04-20|10"]).toBe("ðŸ Cena");

  expect(resultado.todas["2026-04-07|10"]).toBe("ðŸ Cena");
  expect(resultado.todas["2026-04-13|10"]).toBe("ðŸ Cena");
  expect(resultado.todas["2026-04-16|10"]).toBe("ðŸ Cena");
  expect(resultado.todas["2026-04-20|10"]).toBe("ðŸ Cena");
});

test(
  "el doble click al volver a blanco borra el plan persistido",
  async ({ page }) => {
    const estadoInicial = {
      Objetivos: [],
      Eventos: [],
      Metas: [],
      Slots_Muertos: ["2026-04-13|10"],
      Plantillas_Subobjetivos: [],
      Planes_Slot: {
        "2026-04-13|10": {
          Items: [
            {
              Id: "ps_1",
              Texto: "Plan fantasma",
              Emoji: "*",
              Estado: "Planeado"
            }
          ]
        }
      },
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
      Tipos_Slot: [
        {
          Id: "Comida",
          Nombre: "Comida",
          Color: "#f3d39d",
          Titulo: "Almuerzo",
          Titulo_Por_Defecto: true
        }
      ],
      Tipos_Slot_Inicializados: true,
      Slots_Muertos_Tipos: {
        "2026-04-13|10": "Comida"
      },
      Slots_Muertos_Nombres: {
        "2026-04-13|10": "Almuerzo"
      },
      Slots_Muertos_Titulos_Visibles: {
        "2026-04-13|10": true
      },
      Slots_Muertos_Nombres_Auto: {
        "2026-04-13|10": false
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
      const estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") || "{}"
      );
      return {
        existe_slot: Slots_Muertos.includes(clave),
        existe_plan: Boolean(Planes_Slot[clave]),
        existe_plan_local: Boolean(
          estado.Planes_Slot?.[clave]
        ),
        marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            ".Slot_Plan_Marca"
          )
        )
      };
    });

    expect(resultado.existe_slot).toBeFalsy();
    expect(resultado.existe_plan).toBeFalsy();
    expect(resultado.existe_plan_local).toBeFalsy();
    expect(resultado.marca_plan).toBeFalsy();
  }
);
