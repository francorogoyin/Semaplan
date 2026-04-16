const { test, expect } = require("@playwright/test");

async function Preparar(page, estadoInicial) {
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
    "https://challenges.cloudflare.com/turnstile/v0/api.js" +
      "?render=explicit",
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
    window.Inicializar();
  });
}

function Estado_Base() {
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
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Slots_Muertos_Grupo_Ids: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

async function Abrir_Modal_Plan(page, fecha, hora) {
  await page.evaluate(({ Fecha, Hora }) => {
    Abrir_Modal_Plan_Slot(Fecha, Hora);
  }, {
    Fecha: fecha,
    Hora: hora
  });
  await expect(page.locator("#Plan_Slot_Overlay"))
    .toHaveClass(/Activo/);
}

test("avisa cuando falta emoji al agregar un objetivo", async ({
  page
}) => {
  await Preparar(page, Estado_Base());
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click("#Plan_Slot_Cuerpo .Config_Boton");
  await page.fill("#Plan_Slot_Nuevo_Input", "Pensar idea");
  await page.fill("#Plan_Slot_Nuevo_Emoji", "");
  await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");

  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Falta emoji");

  const datos = await page.evaluate(() => ({
    items: Plan_Slot_Borrador.length,
    selector_activo: document.getElementById(
      "Selector_Emojis_Popover"
    )?.classList.contains("Activo") || false,
    modal_activo: document.getElementById("Plan_Slot_Overlay")
      ?.classList.contains("Activo") || false
  }));

  expect(datos.items).toBe(0);
  expect(datos.selector_activo).toBeFalsy();
  expect(datos.modal_activo).toBeTruthy();
});

test("normaliza iconos mojibake en carteles", async ({
  page
}) => {
  await Preparar(page, Estado_Base());

  await page.evaluate(() => {
    Mostrar_Toast_Info("Info", "\u00f0\u0178\u201c\u2039");
  });
  await expect(
    page.locator(".Undo_Toast_Icono").first()
  ).toHaveText("📋");

  await page.evaluate(() => {
    Mostrar_Toast_Error("Error");
  });
  await expect(
    page.locator(".Undo_Toast_Icono").first()
  ).toHaveText("⚠️");
});

test("avisa y mantiene abierto al guardar un plan vacio", async ({
  page
}) => {
  await Preparar(page, Estado_Base());
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click("#Plan_Slot_Guardar");

  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Faltan objetivos");
  await expect(page.locator("#Plan_Slot_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Plan_Slot_Nuevo_Input"))
    .toBeFocused();

  const guardado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
      ?.Planes_Slot?.["2026-04-13|9"] || null
  );
  expect(guardado).toBeNull();
});

test("guarda un objetivo valido que todavia esta en borrador", async ({
  page
}) => {
  await Preparar(page, Estado_Base());
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click("#Plan_Slot_Cuerpo .Config_Boton");
  await page.fill("#Plan_Slot_Nuevo_Input", "Pensar idea");
  await page.locator("#Plan_Slot_Nuevo_Emoji").evaluate((input) => {
    input.value = "💡";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.click("#Plan_Slot_Guardar");

  await expect(page.locator("#Plan_Slot_Overlay"))
    .not.toHaveClass(/Activo/);

  const datos = await page.evaluate(() => ({
    guardado:
      JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
        ?.Planes_Slot?.["2026-04-13|9"]?.Items?.[0] || null
  }));

  expect(datos.guardado?.Texto).toBe("Pensar idea");
  expect(datos.guardado?.Emoji).toBe("💡");
  expect(datos.guardado?.Estado).toBe("Planeado");
});

test("menu de slot prioriza copiar y abre tipos por click", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  estado.Planes_Slot = {
    "2026-04-13|10": {
      Items: [
        {
          Id: "plan_1",
          Texto: "Preparar comida",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };

  await Preparar(page, estado);

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
    { button: "right" }
  );

  const orden = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).allTextContents();
  expect(orden.indexOf("Copiar plan"))
    .toBeLessThan(orden.indexOf("Editar plan"));

  const submenu = page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Submenu"
  );
  await expect(submenu).toBeHidden();

  await page.click(
    '#Dia_Accion_Menu [data-acc="cambiar-tipo-slot"]'
  );
  await expect(submenu).toBeVisible();

  await page.click(
    '#Dia_Accion_Menu [data-acc="cambiar-tipo-slot"]'
  );
  await expect(submenu).toBeHidden();
});

test("nuevo patron de slot usa desplegable con todos los tipos", async ({
  page
}) => {
  await Preparar(page, Estado_Base());

  await page.evaluate(() => {
    Abrir_Modal_Patron(null);
  });
  await page.locator(".Patron_Modal_Tipo_Sel").first()
    .selectOption("Slot");

  await expect(page.locator(".Patron_Slot_Aplica_Btn"))
    .toContainText("Todos los tipos");
  await expect(page.locator("select[multiple]"))
    .toHaveCount(0);

  await page.click(".Patron_Slot_Aplica_Btn");
  await expect(page.locator(".Patron_Slot_Aplica_Menu"))
    .toBeVisible();
  const estados = await page.locator(
    ".Patron_Slot_Aplica_Item .Dia_Accion_Submenu_Estado"
  ).allTextContents();
  expect(estados).toEqual(["✓", "✓"]);

  await page.click(".Patron_Modal_Nombre_Input");
  await expect(page.locator(".Patron_Slot_Aplica_Menu"))
    .toBeHidden();
});

test("menu de bloque distingue insertar y editar plan", async ({
  page
}) => {
  await Preparar(page, Estado_Base());

  const etiquetas = await page.evaluate(() => {
    const base = {
      Id: "Evento_Test",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Nota: ""
    };
    Mostrar_Menu_Evento({
      ...base,
      Abordaje: [{ Texto: "Ya tocado", Estado: "Abordado" }]
    }, 10, 10);
    const sinPlan = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    Cerrar_Menu_Dia();

    Mostrar_Menu_Evento({
      ...base,
      Abordaje: [{ Texto: "Planeado", Planeada: true }]
    }, 10, 10);
    const conPlan = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    Cerrar_Menu_Dia();

    return { sinPlan, conPlan };
  });

  expect(etiquetas.sinPlan).toBe("Insertar plan");
  expect(etiquetas.conPlan).toBe("Editar plan");
});

test("atajo de nueva nota cierra el menu contextual abierto", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Config_Extra.Plan_Actual = "Upgrade";
  await Preparar(page, estado);

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="9"]',
    { button: "right" }
  );
  await expect(page.locator("#Dia_Accion_Menu"))
    .toHaveClass(/Activo/);

  await page.keyboard.press("A");

  await expect(page.locator("#Dia_Accion_Menu"))
    .not.toHaveClass(/Activo/);
  await expect(page.locator("#Archivero_Nota_Overlay"))
    .toHaveClass(/Activo/);
});

test("atajo de nueva nota queda sobre config y dialogo", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Config_Extra.Plan_Actual = "Upgrade";
  await Preparar(page, estado);

  await page.evaluate(() => {
    Abrir_Config();
    window.__Dialogo_Test_Nota = Mostrar_Dialogo(
      "Dialogo abierto",
      [{
        Etiqueta: "Cerrar",
        Valor: true,
        Tipo: "Primario"
      }]
    );
  });
  await expect(page.locator("#Config_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);

  await page.keyboard.press("A");

  await expect(page.locator("#Archivero_Nota_Overlay"))
    .toHaveClass(/Activo/);
  const capas = await page.evaluate(() => {
    const Z = (Id) => Number.parseInt(
      getComputedStyle(document.getElementById(Id)).zIndex,
      10
    ) || 0;
    return {
      nota: Z("Archivero_Nota_Overlay"),
      config: Z("Config_Overlay"),
      dialogo: Z("Dialogo_Overlay")
    };
  });

  expect(capas.nota).toBeGreaterThan(capas.config);
  expect(capas.nota).toBeGreaterThan(capas.dialogo);
});

test("atajo de nueva nota no interrumpe campos de texto", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Config_Extra.Plan_Actual = "Upgrade";
  await Preparar(page, estado);

  await page.evaluate(() => {
    const Input = document.createElement("input");
    Input.id = "Input_Test_Atajo_Nota";
    document.body.appendChild(Input);
    Input.focus();
  });
  await page.keyboard.press("A");

  await expect(page.locator("#Archivero_Nota_Overlay"))
    .not.toHaveClass(/Activo/);
});

test("inserta un patron desde el modal de un slot vacio", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Patrones = [
    {
      Id: "pat_vacio",
      Tipo: "Slot",
      Nombre: "Base vacia",
      Emoji: "*",
      Aplica_A: "Slot_Vacio",
      Items: [
        {
          Id: "pat_vacio_1",
          Emoji: "*",
          Texto: "Pensar ruta",
          Estado: "Planeado"
        }
      ]
    }
  ];

  await Preparar(page, estado);
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click(
    '#Plan_Slot_Cuerpo button:has-text("Insertar patrón")'
  );
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.click(
    '#Dialogo_Botones .Dialogo_Boton:has-text("Base vacia")'
  );

  const datos = await page.evaluate(() => ({
    textos: Plan_Slot_Borrador.map((item) => item.Texto),
    overlay_modal: document.getElementById("Plan_Slot_Overlay")
      ?.classList.contains("Activo") || false
  }));

  expect(datos.textos).toEqual(["Pensar ruta"]);
  expect(datos.overlay_modal).toBeTruthy();
});

test("inserta un patron especifico desde el modal de un slot muerto", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|10"] = true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|10"] = false;
  estado.Patrones = [
    {
      Id: "pat_comida",
      Tipo: "Slot",
      Nombre: "Base comida",
      Emoji: "*",
      Aplica_A: "Comida",
      Items: [
        {
          Id: "pat_comida_1",
          Emoji: "*",
          Texto: "Almorzar",
          Estado: "Planeado"
        }
      ]
    }
  ];

  await Preparar(page, estado);
  await Abrir_Modal_Plan(page, "2026-04-13", 10);

  await page.click(
    '#Plan_Slot_Cuerpo button:has-text("Insertar patrón")'
  );
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.click(
    '#Dialogo_Botones .Dialogo_Boton:has-text("Base comida")'
  );

  const datos = await page.evaluate(() => ({
    textos: Plan_Slot_Borrador.map((item) => item.Texto),
    tipo_slot:
      Slots_Muertos_Tipos["2026-04-13|10"] || ""
  }));

  expect(datos.textos).toEqual(["Almorzar"]);
  expect(datos.tipo_slot).toBe("Comida");
});

test("guarda y persiste un plan en slot vacio", async ({
  page
}) => {
  await Preparar(page, Estado_Base());
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click("#Plan_Slot_Cuerpo .Config_Boton");
  await page.evaluate(() => {
    const input = document.getElementById(
      "Plan_Slot_Nuevo_Emoji"
    );
    input.value = "🧠";
    input.dispatchEvent(
      new Event("input", { bubbles: true })
    );
    input.dispatchEvent(
      new Event("change", { bubbles: true })
    );
  });
  await page.fill("#Plan_Slot_Nuevo_Input", "Pensar idea");
  await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");
  await page.click("#Plan_Slot_Guardar");

  await expect(page.locator("#Plan_Slot_Overlay"))
    .not.toHaveClass(/Activo/);

  const estadoGuardado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
  );
  expect(
    estadoGuardado.Planes_Slot["2026-04-13|9"]
      ?.Items?.[0]?.Texto
  ).toBe("Pensar idea");

  const pageRecargada = await page.context().newPage();
  await Preparar(pageRecargada, estadoGuardado);

  const datos = await pageRecargada.evaluate(() => ({
    texto: Planes_Slot["2026-04-13|9"]?.Items?.[0]?.Texto || "",
    marca: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="9"] ' +
        ".Slot_Plan_Marca"
      )
    )
  }));

  await pageRecargada.close();

  expect(datos.texto).toBe("Pensar idea");
  expect(datos.marca).toBeTruthy();
});

test("borra planes de slots vacios y muertos sin que reaparezcan", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Planes_Slot = {
    "2026-04-13|10": {
      Items: [
        {
          Id: "plan_muerto",
          Texto: "Plan muerto",
          Emoji: "🍽️",
          Estado: "Planeado"
        }
      ]
    },
    "2026-04-13|12": {
      Items: [
        {
          Id: "plan_vacio",
          Texto: "Plan vacio",
          Emoji: "📝",
          Estado: "Planeado"
        }
      ]
    }
  };
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|10"] = true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|10"] = false;

  await Preparar(page, estado);
  await page.evaluate(() => {
    window.__sync_calls = 0;
    Forzar_Sync_Inmediato_Cambio_Critico = async () => {
      window.__sync_calls += 1;
      return true;
    };
  });

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]',
    { button: "right" }
  );
  await page.click('#Dia_Accion_Menu [data-acc="limpiar-celda"]');
  await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
    { button: "right" }
  );
  await page.click(
    '#Dia_Accion_Menu [data-acc="borrar-plan-slot"]'
  );
  await page.getByRole("button", { name: "Confirmar" }).click();

  const estadoGuardado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
  );
  expect(
    estadoGuardado.Planes_Slot["2026-04-13|10"]
  ).toBeUndefined();
  expect(
    estadoGuardado.Planes_Slot["2026-04-13|12"]
  ).toBeUndefined();

  const sync_calls = await page.evaluate(() =>
    window.__sync_calls || 0
  );
  expect(sync_calls).toBeGreaterThanOrEqual(2);

  const pageRecargada = await page.context().newPage();
  await Preparar(pageRecargada, estadoGuardado);

  const datos = await pageRecargada.evaluate(() => ({
    muerto: Boolean(Planes_Slot["2026-04-13|10"]),
    vacio: Boolean(Planes_Slot["2026-04-13|12"]),
    slot_muerto: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]'
    )?.classList.contains("Slot_Muerto") || false,
    marca_muerto: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
        ".Slot_Plan_Marca"
      )
    ),
    marca_vacio: Boolean(
      document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"] ' +
        ".Slot_Plan_Marca"
      )
    )
  }));

  await pageRecargada.close();

  expect(datos.muerto).toBeFalsy();
  expect(datos.vacio).toBeFalsy();
  expect(datos.slot_muerto).toBeTruthy();
  expect(datos.marca_muerto).toBeFalsy();
  expect(datos.marca_vacio).toBeFalsy();
});
