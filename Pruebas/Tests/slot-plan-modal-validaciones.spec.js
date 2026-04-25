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
  await page.evaluate((Inicio_Semana) => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    if (Inicio_Semana) {
      Semana_Actual = Parsear_Fecha_ISO(Inicio_Semana);
      Render_Calendario();
    }
  }, estadoInicial.Inicio_Semana);
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

test("exige agregar despues del aviso de emoji y snapshot", async ({
  page
}) => {
  await Preparar(page, Estado_Base());
  await Abrir_Modal_Plan(page, "2026-04-13", 9);

  await page.click("#Plan_Slot_Cuerpo .Config_Boton");
  await page.fill("#Plan_Slot_Nuevo_Input", "Pensar ruta");
  await page.fill("#Plan_Slot_Nuevo_Emoji", "");
  await page.click("#Plan_Slot_Guardar");

  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Falta emoji");

  await page.evaluate(() => Construir_Estado_Completo());

  const claveActiva = await page.evaluate(() =>
    Plan_Slot_Clave_Activa
  );
  expect(claveActiva).toBe("2026-04-13|9");

  await page.fill("#Plan_Slot_Nuevo_Emoji", "*");
  await page.click("#Plan_Slot_Guardar");

  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Agregá el objetivo con + antes de guardar");
  await expect(page.locator("#Plan_Slot_Overlay"))
    .toHaveClass(/Activo/);

  const sinGuardar = await page.evaluate(() => ({
    borrador: Plan_Slot_Borrador.length,
    guardado: JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
      ?.Planes_Slot?.["2026-04-13|9"] || null
  }));
  expect(sinGuardar.borrador).toBe(0);
  expect(sinGuardar.guardado).toBeNull();

  await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");
  await page.click("#Plan_Slot_Guardar");

  await expect(page.locator("#Plan_Slot_Overlay"))
    .not.toHaveClass(/Activo/);

  const guardado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
      ?.Planes_Slot?.["2026-04-13|9"]?.Items?.[0] || null
  );
  expect(guardado?.Texto).toBe("Pensar ruta");
  expect(guardado?.Emoji).toBe("*");
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

test("slots vacios y muertos agregan despues del aviso", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  await Preparar(page, estado);

  for (const caso of [
    {
      hora: 9,
      clave: "2026-04-13|9",
      texto: "Pensar ruta"
    },
    {
      hora: 10,
      clave: "2026-04-13|10",
      texto: "Pedir almuerzo"
    }
  ]) {
    await Abrir_Modal_Plan(page, "2026-04-13", caso.hora);

    await page.click("#Plan_Slot_Guardar");
    await expect(
      page.locator(".Undo_Toast_Texto").first()
    ).toHaveText("Faltan objetivos");

    await page.fill("#Plan_Slot_Nuevo_Input", caso.texto);
    await page.fill("#Plan_Slot_Nuevo_Emoji", "*");
    await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");

    const borrador = await page.evaluate(() => ({
      cantidad: Plan_Slot_Borrador.length,
      texto: Plan_Slot_Borrador[0]?.Texto || "",
      mostrando_nuevo: Plan_Slot_Mostrando_Nuevo
    }));
    expect(borrador).toEqual({
      cantidad: 1,
      texto: caso.texto,
      mostrando_nuevo: false
    });

    await page.click("#Plan_Slot_Guardar");
    await expect(page.locator("#Plan_Slot_Overlay"))
      .not.toHaveClass(/Activo/);

    const guardado = await page.evaluate((clave) =>
      JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
        ?.Planes_Slot?.[clave]?.Items?.[0] || null,
      caso.clave
    );
    expect(guardado?.Texto).toBe(caso.texto);
    expect(guardado?.Emoji).toBe("*");
  }
});

test("no guarda objetivos sin texto en slots vacios y muertos", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  await Preparar(page, estado);

  for (const caso of [
    { fecha: "2026-04-13", hora: 9 },
    { fecha: "2026-04-13", hora: 10 }
  ]) {
    await Abrir_Modal_Plan(page, caso.fecha, caso.hora);
    await page.click("#Plan_Slot_Cuerpo .Config_Boton");
    await page.locator("#Plan_Slot_Nuevo_Emoji")
      .evaluate((input) => {
        input.value = "⭐";
        input.dispatchEvent(
          new Event("input", { bubbles: true })
        );
      });
    await page.click("#Plan_Slot_Guardar");

    await expect(
      page.locator(".Undo_Toast_Texto").first()
    ).toHaveText("Faltan objetivos");

    const guardado = await page.evaluate(({ fecha, hora }) =>
      JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
        ?.Planes_Slot?.[`${fecha}|${hora}`] || null,
      caso
    );
    expect(guardado).toBeNull();

    await page.evaluate(() => Cerrar_Modal_Plan_Slot());
  }
});

test("mantiene validaciones tras borrar items del plan de slot muerto",
async ({ page }) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
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
    }
  };

  await Preparar(page, estado);
  await Abrir_Modal_Plan(page, "2026-04-13", 10);

  await page.click("#Plan_Slot_Cuerpo .Config_Boton");
  await page.fill("#Plan_Slot_Nuevo_Input", "Sin emoji");
  await page.fill("#Plan_Slot_Nuevo_Emoji", "");
  await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");

  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Falta emoji");

  await page.click(".Abordaje_Item_Borrar");
  await expect(page.locator("#Plan_Slot_Nuevo_Input"))
    .toHaveValue("Sin emoji");

  await page.click("#Plan_Slot_Guardar");
  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Falta emoji");

  await page.fill("#Plan_Slot_Nuevo_Input", "");
  await page.click("#Plan_Slot_Guardar");
  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Faltan objetivos");

  const datos = await page.evaluate(() => ({
    borrador: Plan_Slot_Borrador.length,
    guardado: JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
      ?.Planes_Slot?.["2026-04-13|10"]?.Items || []
  }));
  expect(datos.borrador).toBe(0);
  expect(datos.guardado).toHaveLength(1);
  expect(datos.guardado[0].Texto).toBe("Plan muerto");
});

test("no guarda un objetivo valido todavia en borrador", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  await Preparar(page, estado);

  for (const caso of [
    {
      hora: 9,
      clave: "2026-04-13|9",
      texto: "Pensar idea"
    },
    {
      hora: 10,
      clave: "2026-04-13|10",
      texto: "Comprar almuerzo"
    }
  ]) {
    await Abrir_Modal_Plan(page, "2026-04-13", caso.hora);

    await page.click("#Plan_Slot_Cuerpo .Config_Boton");
    await page.fill("#Plan_Slot_Nuevo_Input", caso.texto);
    await page.locator("#Plan_Slot_Nuevo_Emoji")
      .evaluate((input) => {
        input.value = "*";
        input.dispatchEvent(
          new Event("input", { bubbles: true })
        );
      });
    await page.click("#Plan_Slot_Guardar");

    await expect(
      page.locator(".Undo_Toast_Texto").first()
    ).toHaveText("Agregá el objetivo con + antes de guardar");
    await expect(page.locator("#Plan_Slot_Overlay"))
      .toHaveClass(/Activo/);

    const sinGuardar = await page.evaluate((clave) => ({
      borrador: Plan_Slot_Borrador.length,
      guardado: JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
        ?.Planes_Slot?.[clave] || null
    }), caso.clave);
    expect(sinGuardar.borrador).toBe(0);
    expect(sinGuardar.guardado).toBeNull();

    await page.click("#Plan_Slot_Cuerpo .Abordaje_Nuevo_Btn");
    await page.click("#Plan_Slot_Guardar");

    await expect(page.locator("#Plan_Slot_Overlay"))
      .not.toHaveClass(/Activo/);

    const datos = await page.evaluate((clave) => ({
      guardado:
        JSON.parse(localStorage.getItem("Semaplan_Estado_V2"))
          ?.Planes_Slot?.[clave]?.Items?.[0] || null
    }), caso.clave);

    expect(datos.guardado?.Texto).toBe(caso.texto);
    expect(datos.guardado?.Emoji).toBe("*");
    expect(datos.guardado?.Estado).toBe("Planeado");
  }
});

test("menu de slot ordena plan y abre tipos por click", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|10"];
  estado.Slots_Muertos_Tipos["2026-04-13|10"] = "Comida";
  estado.Slots_Muertos_Nombres["2026-04-13|10"] = "Almuerzo";
  estado.Slots_Muertos_Titulos_Visibles["2026-04-13|10"] = true;
  estado.Slots_Muertos_Nombres_Auto["2026-04-13|10"] = false;
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
  await page.evaluate(() => Cambiar_Idioma("en"));

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
    { button: "right" }
  );

  const orden = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).allTextContents();
  expect(orden).toContain("Delete title");
  expect(orden).not.toContain("Remove title");
  expect(orden.indexOf("Edit plan"))
    .toBeLessThan(orden.indexOf("Copy plan"));
  expect(orden.indexOf("Copy plan"))
    .toBeLessThan(orden.indexOf("Delete plan"));

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
      Objetivo_Id: "obj_test",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Nota: ""
    };
    Portapapeles_Plan_Evento = {
      Objetivo_Id: "obj_test",
      Items: [{ Texto: "Copiable", Planeada: true }]
    };
    Portapapeles_Calendario_Modo = "Plan_Evento";

    Mostrar_Menu_Evento(base, 10, 10);
    const sinPlan = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    const accionesSinPlan = Array.from(document.querySelectorAll(
      "#Dia_Accion_Menu .Dia_Accion_Item"
    )).map((item) => item.getAttribute("data-acc"));
    Cerrar_Menu_Dia();

    const Evento_Contenido = {
      ...base,
      Abordaje: [{ Texto: "Ya tocado", Estado: "Abordado" }]
    };
    Mostrar_Menu_Evento(Evento_Contenido, 10, 10);
    const conContenido = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    const accionesContenido = Array.from(
      document.querySelectorAll(
        "#Dia_Accion_Menu .Dia_Accion_Item"
      )
    ).map((item) => item.getAttribute("data-acc"));
    const reemplazarContenido = document.querySelector(
      '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
    )?.textContent?.trim() || "";
    const copiaContenidoOk = Copiar_Plan_Evento(
      Evento_Contenido
    );
    const copiaContenido = {
      texto: Portapapeles_Plan_Evento?.Items?.[0]?.Texto || "",
      planeada:
        Boolean(Portapapeles_Plan_Evento?.Items?.[0]?.Planeada)
    };
    Cerrar_Menu_Dia();

    Mostrar_Menu_Evento({
      ...base,
      Abordaje: [{ Texto: "Planeado", Planeada: true }]
    }, 10, 10);
    const conPlan = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    Cerrar_Menu_Dia();

    Mostrar_Menu_Evento({
      ...base,
      Abordaje: [{ Texto: "Planeado legado", Estado: "Planeado" }]
    }, 10, 10);
    const conPlanLegado = document.querySelector(
      '#Dia_Accion_Menu [data-acc="abordaje"]'
    )?.textContent?.trim() || "";
    const accionesLegado = Array.from(document.querySelectorAll(
      "#Dia_Accion_Menu .Dia_Accion_Item"
    )).map((item) => item.getAttribute("data-acc"));
    Cerrar_Menu_Dia();

    return {
      sinPlan,
      accionesSinPlan,
      conContenido,
      accionesContenido,
      reemplazarContenido,
      copiaContenidoOk,
      copiaContenido,
      conPlan,
      conPlanLegado,
      accionesLegado
    };
  });

  expect(etiquetas.sinPlan).toBe("Insertar plan");
  expect(etiquetas.accionesSinPlan)
    .toContain("pegar-plan-evento");
  expect(etiquetas.conContenido).toBe("Editar plan");
  expect(etiquetas.accionesContenido)
    .toContain("copiar-plan-evento");
  expect(etiquetas.accionesContenido)
    .toContain("cortar-plan-evento");
  expect(etiquetas.accionesContenido)
    .toContain("borrar-plan-evento");
  expect(etiquetas.accionesContenido)
    .toContain("pegar-plan-evento");
  expect(etiquetas.reemplazarContenido)
    .toBe("Reemplazar plan");
  expect(etiquetas.copiaContenidoOk).toBeTruthy();
  expect(etiquetas.copiaContenido.texto).toBe("Ya tocado");
  expect(etiquetas.copiaContenido.planeada).toBeTruthy();
  expect(etiquetas.conPlan).toBe("Editar plan");
  expect(etiquetas.conPlanLegado).toBe("Editar plan");
  expect(etiquetas.accionesLegado)
    .toContain("copiar-plan-evento");
  expect(etiquetas.accionesLegado)
    .toContain("cortar-plan-evento");
  expect(etiquetas.accionesLegado)
    .toContain("borrar-plan-evento");
});

test("menu de bloque copia pega y borra plan", async ({ page }) => {
  const estado = Estado_Base();
  estado.Objetivos = [{
    Id: "obj_plan_menu",
    Nombre: "Tarea de plan",
    Emoji: "*",
    Color: "#1f6b4f",
    Horas_Semanales: 1,
    Es_Bolsa: false,
    Subobjetivos_Semanales: {},
    Subobjetivos_Contraidas_Semanales: {},
    Subobjetivos_Excluidos_Semanales: {}
  }];
  estado.Eventos = [
    {
      Id: "ev_plan_origen",
      Objetivo_Id: "obj_plan_menu",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [
        {
          Id: "ab_origen",
          Texto: "Plan bloque",
          Emoji: "*",
          Suelta: true,
          Estado: "Planeado"
        }
      ]
    },
    {
      Id: "ev_plan_destino",
      Objetivo_Id: "obj_plan_menu",
      Fecha: "2026-04-13",
      Inicio: 11,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: ""
    }
  ];
  await Preparar(page, estado);
  await page.evaluate(() => {
    Forzar_Sync_Inmediato_Cambio_Critico = async () => true;
  });

  const origen = page.locator('.Evento[data-id="ev_plan_origen"]');
  await expect(origen).toBeVisible();
  await origen.click({ button: "right" });

  const accionesOrigen = await page.locator(
    "#Dia_Accion_Menu .Dia_Accion_Item"
  ).evaluateAll((items) =>
    items.map((item) => item.getAttribute("data-acc"))
  );
  expect(accionesOrigen).toContain("copiar-plan-evento");
  expect(accionesOrigen).toContain("cortar-plan-evento");
  expect(accionesOrigen).toContain("borrar-plan-evento");

  await page.click(
    '#Dia_Accion_Menu [data-acc="copiar-plan-evento"]'
  );
  await expect(
    page.locator(".Undo_Toast_Texto").first()
  ).toHaveText("Plan del bloque copiado");

  const destino = page.locator(
    '.Evento[data-id="ev_plan_destino"]'
  );
  await destino.click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
    )
  ).toBeVisible();
  await page.click(
    '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
  );

  const pegado = await page.evaluate(() => {
    const Evento = Eventos.find((Ev) =>
      Ev.Id === "ev_plan_destino"
    );
    const Item = Evento?.Abordaje?.[0] || null;
    return {
      texto: Item?.Texto || "",
      id: Item?.Id || "",
      planeada: Boolean(Item?.Planeada),
      total: Evento?.Abordaje?.length || 0
    };
  });

  expect(pegado.texto).toBe("Plan bloque");
  expect(pegado.id).not.toBe("ab_origen");
  expect(pegado.planeada).toBeTruthy();
  expect(pegado.total).toBe(1);

  await destino.click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="borrar-plan-evento"]'
    )
  ).toBeVisible();
  await page.click(
    '#Dia_Accion_Menu [data-acc="borrar-plan-evento"]'
  );
  await page.getByRole("button", { name: "Confirmar" }).click();

  const borrado = await page.evaluate(() => {
    const Evento = Eventos.find((Ev) =>
      Ev.Id === "ev_plan_destino"
    );
    return {
      total: Evento?.Abordaje?.length || 0,
      tiene_plan: Boolean(Evento?.Abordaje?.some((Item) =>
        Item.Planeada
      ))
    };
  });

  expect(borrado.total).toBe(0);
  expect(borrado.tiene_plan).toBeFalsy();
});

test("menu de bloque reemplaza plan con confirmacion", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Objetivos = [{
    Id: "obj_reemplazo",
    Nombre: "Tarea reemplazo",
    Emoji: "*",
    Color: "#1f6b4f",
    Horas_Semanales: 1,
    Es_Bolsa: false,
    Subobjetivos_Semanales: {},
    Subobjetivos_Contraidas_Semanales: {},
    Subobjetivos_Excluidos_Semanales: {}
  }];
  estado.Eventos = [
    {
      Id: "ev_plan_origen",
      Objetivo_Id: "obj_reemplazo",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [
        {
          Id: "ab_origen",
          Texto: "Plan nuevo",
          Emoji: "*",
          Suelta: true,
          Estado: "Planeado"
        }
      ]
    },
    {
      Id: "ev_plan_destino",
      Objetivo_Id: "obj_reemplazo",
      Fecha: "2026-04-13",
      Inicio: 11,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [
        {
          Id: "ab_viejo",
          Texto: "Plan viejo",
          Emoji: "*",
          Suelta: true,
          Planeada: true
        }
      ]
    }
  ];
  await Preparar(page, estado);

  await page.locator('.Evento[data-id="ev_plan_origen"]')
    .click({ button: "right" });
  await page.click(
    '#Dia_Accion_Menu [data-acc="copiar-plan-evento"]'
  );

  await page.locator('.Evento[data-id="ev_plan_destino"]')
    .click({ button: "right" });
  const accion = page.locator(
    '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
  );
  await expect(accion).toHaveText("Reemplazar plan");
  await accion.click();

  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("Este bloque ya tiene un plan");
  await expect(
    page.getByRole("button", { name: "Agregar" })
  ).toHaveCount(0);
  await page.getByRole("button", {
    name: "Reemplazar plan"
  }).click();

  const resultado = await page.evaluate(() => {
    const Evento = Eventos.find((Ev) =>
      Ev.Id === "ev_plan_destino"
    );
    return (Evento?.Abordaje || []).map((Item) => ({
      texto: Item.Texto,
      planeada: Boolean(Item.Planeada)
    }));
  });

  expect(resultado).toEqual([
    { texto: "Plan nuevo", planeada: true }
  ]);
});

test("plan de bloque solo pega en bloques de la misma tarea", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Objetivos = [
    {
      Id: "obj_a",
      Nombre: "Tarea A",
      Emoji: "*",
      Color: "#1f6b4f",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {},
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    },
    {
      Id: "obj_b",
      Nombre: "Tarea B",
      Emoji: "*",
      Color: "#8c2f2f",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {},
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }
  ];
  estado.Eventos = [
    {
      Id: "ev_origen",
      Objetivo_Id: "obj_a",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [{
        Id: "ab_origen",
        Texto: "Plan tarea A",
        Emoji: "*",
        Suelta: true,
        Estado: "Planeado"
      }]
    },
    {
      Id: "ev_misma",
      Objetivo_Id: "obj_a",
      Fecha: "2026-04-13",
      Inicio: 11,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: ""
    },
    {
      Id: "ev_otra",
      Objetivo_Id: "obj_b",
      Fecha: "2026-04-13",
      Inicio: 13,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#8c2f2f",
      Nota: ""
    }
  ];
  await Preparar(page, estado);

  const resultado = await page.evaluate(async () => {
    const Origen = Eventos.find((Ev) => Ev.Id === "ev_origen");
    const Misma = Eventos.find((Ev) => Ev.Id === "ev_misma");
    const Otra = Eventos.find((Ev) => Ev.Id === "ev_otra");
    Copiar_Plan_Evento(Origen);

    Mostrar_Menu_Evento(Misma, 10, 10);
    const mismaAccion = Boolean(document.querySelector(
      '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
    ));
    Cerrar_Menu_Dia();

    Mostrar_Menu_Evento(Otra, 10, 10);
    const otraAccion = Boolean(document.querySelector(
      '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
    ));
    Cerrar_Menu_Dia();

    const pegarOtra = await Pegar_Plan_En_Evento(Otra);
    const pegarMisma = await Pegar_Plan_En_Evento(Misma);

    return {
      mismaAccion,
      otraAccion,
      pegarOtra,
      pegarMisma,
      mismaPlan: (Misma.Abordaje || []).map((Item) => Item.Texto),
      otraPlan: (Otra.Abordaje || []).map((Item) => Item.Texto)
    };
  });

  expect(resultado.mismaAccion).toBeTruthy();
  expect(resultado.otraAccion).toBeFalsy();
  expect(resultado.pegarOtra).toBeFalsy();
  expect(resultado.pegarMisma).toBeTruthy();
  expect(resultado.mismaPlan).toEqual(["Plan tarea A"]);
  expect(resultado.otraPlan).toEqual([]);
});

test("cortar plan de bloque lo mueve tras pegar correctamente", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Objetivos = [{
    Id: "obj_movible",
    Nombre: "Tarea movible",
    Emoji: "*",
    Color: "#1f6b4f",
    Horas_Semanales: 1,
    Es_Bolsa: false,
    Subobjetivos_Semanales: {},
    Subobjetivos_Contraidas_Semanales: {},
    Subobjetivos_Excluidos_Semanales: {}
  }];
  estado.Eventos = [
    {
      Id: "ev_plan_origen",
      Objetivo_Id: "obj_movible",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "Nota origen",
      Abordaje: [{
        Id: "ab_origen",
        Texto: "Plan movible",
        Emoji: "*",
        Suelta: true,
        Estado: "Planeado"
      }]
    },
    {
      Id: "ev_plan_destino",
      Objetivo_Id: "obj_movible",
      Fecha: "2026-04-13",
      Inicio: 11,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: ""
    }
  ];
  await Preparar(page, estado);

  await page.locator('.Evento[data-id="ev_plan_origen"]')
    .click({ button: "right" });
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="cortar-plan-evento"]'
    )
  ).toBeVisible();
  await page.click(
    '#Dia_Accion_Menu [data-acc="cortar-plan-evento"]'
  );

  await page.locator('.Evento[data-id="ev_plan_destino"]')
    .click({ button: "right" });
  await page.click(
    '#Dia_Accion_Menu [data-acc="pegar-plan-evento"]'
  );

  const resultado = await page.evaluate(() => {
    const Origen = Eventos.find((Ev) =>
      Ev.Id === "ev_plan_origen"
    );
    const Destino = Eventos.find((Ev) =>
      Ev.Id === "ev_plan_destino"
    );
    return {
      origenNota: Origen?.Nota || "",
      origenTotal: Origen?.Abordaje?.length || 0,
      destinoPlan: (Destino?.Abordaje || []).map((Item) => ({
        texto: Item.Texto,
        planeada: Boolean(Item.Planeada)
      }))
    };
  });

  expect(resultado.origenNota).toBe("Nota origen");
  expect(resultado.origenTotal).toBe(0);
  expect(resultado.destinoPlan).toEqual([
    { texto: "Plan movible", planeada: true }
  ]);
});

test("cortar plan de slot lo mueve y conserva metadatos del slot", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Slots_Muertos = ["2026-04-13|9"];
  estado.Slots_Muertos_Tipos = {
    "2026-04-13|9": "Comida"
  };
  estado.Slots_Muertos_Nombres = {
    "2026-04-13|9": "Almuerzo"
  };
  estado.Slots_Muertos_Titulos_Visibles = {
    "2026-04-13|9": true
  };
  estado.Planes_Slot = {
    "2026-04-13|9": {
      Nota: "Nota slot",
      Items: [{
        Id: "ps_origen",
        Texto: "Plan de slot",
        Emoji: "*",
        Estado: "Planeado"
      }]
    }
  };
  await Preparar(page, estado);

  const resultado = await page.evaluate(async () => {
    Cortar_Plan_Slot("2026-04-13", 9);
    const pegado = await Pegar_Plan_En_Slot("2026-04-13", 11);
    return {
      pegado,
      origenItems:
        Planes_Slot["2026-04-13|9"]?.Items?.length || 0,
      origenNota: Planes_Slot["2026-04-13|9"]?.Nota || "",
      origenTipo: Slots_Muertos_Tipos["2026-04-13|9"] || "",
      destino: Planes_Slot["2026-04-13|11"]?.Items?.map(
        (Item) => Item.Texto
      ) || []
    };
  });

  expect(resultado.pegado).toBeTruthy();
  expect(resultado.origenItems).toBe(0);
  expect(resultado.origenNota).toBe("Nota slot");
  expect(resultado.origenTipo).toBe("Comida");
  expect(resultado.destino).toEqual(["Plan de slot"]);
});

test("slot vacio pega solo planes copiados desde slots", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Eventos = [
    {
      Id: "ev_plan_bloque",
      Objetivo_Id: null,
      Fecha: "2026-04-13",
      Inicio: 10,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [
        {
          Id: "ab_bloque",
          Texto: "Plan de bloque",
          Emoji: "*",
          Suelta: true,
          Estado: "Planeado"
        }
      ]
    }
  ];
  estado.Planes_Slot = {
    "2026-04-13|9": {
      Items: [
        {
          Id: "ps_origen",
          Texto: "Plan portable",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };

  await Preparar(page, estado);

  const resultado = await page.evaluate(async () => {
    Copiar_Plan_Evento(Eventos[0]);
    Mostrar_Menu_Slot("2026-04-13", 11, 10, 10);
    const bloqueEnSlot = Boolean(document.querySelector(
      '#Dia_Accion_Menu [data-acc="pegar-plan-slot"]'
    ));
    const pegadoBloque = await Pegar_Plan_En_Slot(
      "2026-04-13",
      11
    );
    Cerrar_Menu_Dia();

    Copiar_Plan_Slot("2026-04-13", 9);
    Mostrar_Menu_Slot("2026-04-13", 11, 10, 10);
    const accionSlot = document.querySelector(
      '#Dia_Accion_Menu [data-acc="pegar-plan-slot"]'
    )?.textContent?.trim() || "";
    Cerrar_Menu_Dia();
    const pegadoSlot = await Pegar_Plan_En_Slot(
      "2026-04-13",
      11
    );

    return {
      bloqueEnSlot,
      pegadoBloque,
      accionSlot,
      pegadoSlot,
      destino: Planes_Slot["2026-04-13|11"]?.Items?.map(
        (Item) => Item.Texto
      ) || []
    };
  });

  expect(resultado.bloqueEnSlot).toBeFalsy();
  expect(resultado.pegadoBloque).toBeFalsy();
  expect(resultado.accionSlot).toBe("Pegar plan");
  expect(resultado.pegadoSlot).toBeTruthy();
  expect(resultado.destino).toEqual(["Plan portable"]);
});

test("menu de bloque reconoce plan heredado del slot", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Objetivos = [
    {
      Id: "obj_plan_slot",
      Nombre: "Verduras",
      Emoji: "*",
      Color: "#ef9a9a",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {
        "2026-04-13": []
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }
  ];
  estado.Eventos = [
    {
      Id: "ev_plan_slot",
      Objetivo_Id: "obj_plan_slot",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#ef9a9a",
      Nota: ""
    }
  ];
  estado.Planes_Slot = {
    "2026-04-13|9": {
      Items: [
        {
          Id: "plan_slot_heredado",
          Emoji: "*",
          Texto: "Plan heredado",
          Estado: "Planeado"
        }
      ]
    }
  };

  await Preparar(page, estado);

  const bloque = page.locator('.Evento[data-id="ev_plan_slot"]');
  await expect(bloque).toBeVisible();
  await bloque.click({ button: "right" });

  await expect(
    page.locator('#Dia_Accion_Menu [data-acc="abordaje"]')
  ).toHaveText("Editar plan");
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="copiar-plan-evento"]'
    )
  ).toBeVisible();
  await expect(
    page.locator(
      '#Dia_Accion_Menu [data-acc="borrar-plan-evento"]'
    )
  ).toBeVisible();

  await page.click('#Dia_Accion_Menu [data-acc="abordaje"]');
  await expect(page.locator("#Abordaje_Modal_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.getByText("Plan heredado")).toBeVisible();
  await page.click("#Abordaje_Modal_Guardar_Btn");

  const guardado = await page.evaluate(() => {
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2")
    );
    const Evento = Estado.Eventos.find((Ev) =>
      Ev.Id === "ev_plan_slot"
    );
    const Item = Evento?.Abordaje?.find((Ab) =>
      Ab.Texto === "Plan heredado"
    );
    return {
      planeada: Boolean(Item?.Planeada),
      suelta: Boolean(Item?.Suelta),
      estado: Item?.Estado || "",
      plan_slot: Estado.Planes_Slot?.["2026-04-13|9"] || null
    };
  });

  expect(guardado.planeada).toBeTruthy();
  expect(guardado.suelta).toBeTruthy();
  expect(guardado.estado).toBe("");
  expect(guardado.plan_slot).toBeNull();
});

test("modal de bloque normaliza plan legacy", async ({ page }) => {
  const estado = Estado_Base();
  estado.Objetivos = [
    {
      Id: "obj_legacy",
      Nombre: "Semaplan",
      Emoji: "*",
      Color: "#1f6b4f",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {
        "2026-04-13": [
          {
            Id: "sub_legacy",
            Texto: "Planeado legado",
            Emoji: "*"
          }
        ]
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }
  ];
  estado.Eventos = [
    {
      Id: "ev_legacy",
      Objetivo_Id: "obj_legacy",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "",
      Abordaje: [
        {
          Id: "ab_legacy",
          Plantilla_Id: null,
          Texto: "Planeado legado",
          Emoji: "*",
          Estado: "Planeado",
          Suelta: false
        }
      ]
    }
  ];

  await Preparar(page, estado);

  await page.locator('.Evento[data-id="ev_legacy"]')
    .click({ button: "right" });
  await page.click('#Dia_Accion_Menu [data-acc="abordaje"]');
  await expect(page.locator("#Abordaje_Modal_Overlay"))
    .toHaveClass(/Activo/);

  const borrador = await page.evaluate(() => {
    const Item = Abordaje_Borrador.find((I) =>
      I.Texto === "Planeado legado"
    );
    return {
      marcado: Boolean(Item?.Marcado),
      planeada: Boolean(Item?.Planeada),
      estado: Item?.Estado || ""
    };
  });

  expect(borrador.marcado).toBeFalsy();
  expect(borrador.planeada).toBeTruthy();
  expect(borrador.estado).toBe("Abordado");

  await page.click("#Abordaje_Modal_Guardar_Btn");

  const guardado = await page.evaluate(() => {
    const Evento = Eventos.find((Ev) => Ev.Id === "ev_legacy");
    const Item = Evento?.Abordaje?.[0] || null;
    return {
      estado: Item?.Estado || "",
      planeada: Boolean(Item?.Planeada)
    };
  });

  expect(guardado.estado).toBe("");
  expect(guardado.planeada).toBeTruthy();
});

test("modal de bloque valida texto y emoji nuevo", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Inicio_Semana = "2026-04-20";
  estado.Objetivos = [
    {
      Id: "obj_nuevo_plan",
      Nombre: "Semaplan",
      Emoji: "*",
      Color: "#1f6b4f",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {
        "2026-04-20": []
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }
  ];
  estado.Eventos = [
    {
      Id: "ev_nuevo_plan",
      Objetivo_Id: "obj_nuevo_plan",
      Fecha: "2026-04-20",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: ""
    }
  ];

  await Preparar(page, estado);
  await page.evaluate(() => {
    Abrir_Modal_Abordaje("ev_nuevo_plan");
  });

  await page.locator(
    "#Abordaje_Modal_Overlay .Abordaje_Nuevo_Cont " +
    ".Abordaje_Nuevo_Btn"
  ).first().click();
  await expect(
    page.locator(".Undo_Toast_Texto", { hasText: "Falta texto" })
  ).toBeVisible();

  await page.fill("#Abordaje_Nuevo_Input", "Pensar enfoque");
  await page.locator(
    "#Abordaje_Modal_Overlay .Abordaje_Nuevo_Cont " +
    ".Abordaje_Nuevo_Btn"
  ).first().click();
  await expect(
    page.locator(".Undo_Toast_Texto", { hasText: "Falta emoji" })
  ).toBeVisible();
});

test("modal de bloque agrega subtarea o item suelto", async ({
  page
}) => {
  const estado = Estado_Base();
  estado.Inicio_Semana = "2026-04-20";
  estado.Objetivos = [
    {
      Id: "obj_plan_add",
      Nombre: "Semaplan",
      Emoji: "*",
      Color: "#1f6b4f",
      Horas_Semanales: 1,
      Es_Bolsa: false,
      Subobjetivos_Semanales: {
        "2026-04-20": []
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {}
    }
  ];
  estado.Eventos = [
    {
      Id: "ev_plan_add",
      Objetivo_Id: "obj_plan_add",
      Fecha: "2026-04-20",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: ""
    }
  ];

  await Preparar(page, estado);
  await page.evaluate(() => {
    Abrir_Modal_Abordaje("ev_plan_add");
  });
  await expect(page.locator("#Abordaje_Modal_Overlay"))
    .toHaveClass(/Activo/);

  await page.evaluate(() => {
    document.getElementById("Abordaje_Nuevo_Emoji").value =
      "\uD83D\uDCDD";
    document.getElementById("Abordaje_Nuevo_Input").value =
      "Nueva subtarea";
  });
  await page.locator(
    "#Abordaje_Modal_Overlay .Abordaje_Nuevo_Cont " +
    ".Abordaje_Nuevo_Btn"
  ).first().click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.getByRole("button", { name: "Subtarea" }).click();

  await page.evaluate(() => {
    document.getElementById("Abordaje_Nuevo_Emoji").value =
      "\uD83D\uDCA1";
    document.getElementById("Abordaje_Nuevo_Input").value =
      "Idea suelta";
  });
  await page.locator(
    "#Abordaje_Modal_Overlay .Abordaje_Nuevo_Cont " +
    ".Abordaje_Nuevo_Btn"
  ).first().click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.getByRole("button", { name: "Ítem suelto" })
    .click();

  await page.click("#Abordaje_Modal_Guardar_Btn");

  const guardado = await page.evaluate(() => {
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2")
    );
    const Objetivo = Estado.Objetivos.find((Obj) =>
      Obj.Id === "obj_plan_add"
    );
    const Evento = Estado.Eventos.find((Ev) =>
      Ev.Id === "ev_plan_add"
    );
    return {
      subs: Objetivo?.Subobjetivos_Semanales?.[
        "2026-04-20"
      ] || [],
      abordaje: Evento?.Abordaje || []
    };
  });

  const Sub = guardado.subs.find((Item) =>
    Item.Texto === "Nueva subtarea"
  );
  const Plan_Sub = guardado.abordaje.find((Item) =>
    Item.Texto === "Nueva subtarea"
  );
  const Plan_Suelto = guardado.abordaje.find((Item) =>
    Item.Texto === "Idea suelta"
  );

  expect(Sub?.Emoji).toBe("\uD83D\uDCDD");
  expect(Plan_Sub?.Planeada).toBeTruthy();
  expect(Plan_Sub?.Suelta).toBeFalsy();
  expect(Plan_Sub?.Estado || "").toBe("");
  expect(Plan_Suelto?.Planeada).toBeTruthy();
  expect(Plan_Suelto?.Suelta).toBeTruthy();
  expect(Plan_Suelto?.Estado || "").toBe("");
});

test("tarea rapida pide emoji y nombre en un solo modal", async ({
  page
}) => {
  await Preparar(page, Estado_Base());

  await page.evaluate(() => {
    window.__Tarea_Rapida_Promise =
      Crear_Tarea_Rapida_Desde_Slot("2026-04-13", 9);
  });
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator(".Dialogo_Inputs_Dobles .Dialogo_Input"))
    .toHaveCount(2);
  await expect(
    page.locator(".Dialogo_Inputs_Dobles .Con_Selector_Emoji")
  ).toHaveCount(1);

  const Config_Emoji = await page.evaluate(() => {
    const Input = document.querySelector(
      ".Dialogo_Inputs_Dobles .Con_Selector_Emoji"
    );
    return {
      autocomplete: Input?.getAttribute("autocomplete"),
      autocorrect: Input?.getAttribute("autocorrect"),
      spellcheck: Input?.getAttribute("spellcheck"),
      inputmode: Input?.getAttribute("inputmode")
    };
  });
  expect(Config_Emoji).toEqual({
    autocomplete: "off",
    autocorrect: "off",
    spellcheck: "false",
    inputmode: "none"
  });

  await page.locator(
    ".Dialogo_Inputs_Dobles .Con_Selector_Emoji"
  ).click();
  await page.locator(".Selector_Emojis_Btn").first().click();
  const Emoji_Elegido = await page.locator(
    ".Dialogo_Inputs_Dobles .Con_Selector_Emoji"
  ).inputValue();
  await page.fill(
    ".Dialogo_Inputs_Dobles .Dialogo_Input:not(.Con_Selector_Emoji)",
    "Ensayo rapido"
  );
  await page.locator(".Dialogo_Boton_Primario").click();

  const Resultado = await page.evaluate(async () => {
    await window.__Tarea_Rapida_Promise;
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2")
    );
    const Objetivo = Estado.Objetivos.find((Item) =>
      Item.Nombre === "Ensayo rapido"
    );
    const Evento = Estado.Eventos.find((Item) =>
      Item.Objetivo_Id === Objetivo?.Id
    );
    return {
      objetivo: Objetivo
        ? {
          nombre: Objetivo.Nombre,
          emoji: Objetivo.Emoji,
          color: Objetivo.Color,
          categoria: Objetivo.Categoria_Id ?? null,
          bolsa: Boolean(Objetivo.Es_Bolsa)
        }
        : null,
      evento: Evento
        ? {
          fecha: Evento.Fecha,
          inicio: Evento.Inicio
        }
        : null
    };
  });

  expect(Resultado).toEqual({
    objetivo: {
      nombre: "Ensayo rapido",
      emoji: Emoji_Elegido,
      color: "#7f8b7a",
      categoria: null,
      bolsa: false
    },
    evento: {
      fecha: "2026-04-13",
      inicio: 9
    }
  });
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
