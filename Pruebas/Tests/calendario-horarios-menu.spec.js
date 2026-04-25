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
    "https://challenges.cloudflare.com/" +
    "turnstile/v0/api.js?render=explicit",
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
    localStorage.setItem("Semaplan_Idioma", "es");
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
    Render_Calendario();
  });
}

function crearEstado() {
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
      Dias_Visibles: [0, 1],
      Ocultar_Dias_Automatico: "Ninguno",
      Bloques_Horarios: {
        Madrugada: { Desde: 0, Hasta: 8 },
        Manana: { Desde: 8, Hasta: 13 },
        Tarde: { Desde: 13, Hasta: 20 },
        Noche: { Desde: 20, Hasta: 0 }
      },
      Bloques_Horarios_Visibles: [
        "Madrugada",
        "Manana",
        "Tarde",
        "Noche"
      ],
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
  "el encabezado horario permite seleccionar, mostrar y pegar",
  async ({ page }) => {
  await preparar(page, crearEstado());

  await page.evaluate(() => {
    Config.Enfoque_Hora_Actual_Modo = "Completo";
    const Fecha_Lunes = Formatear_Fecha_ISO(
      Obtener_Fecha_Semana(0)
    );
    const Fecha_Martes = Formatear_Fecha_ISO(
      Obtener_Fecha_Semana(1)
    );
    window.__Fecha_Lunes_Horario = Fecha_Lunes;
    window.__Fecha_Martes_Horario = Fecha_Martes;
    const Objetivo = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre: "Horario prueba",
        Emoji: "🧪",
        Color: "#1f6b4f",
        Es_Bolsa: false
      },
      Clave_Semana_Actual()
    );
    Eventos.push({
      Id: "Evento_Test_Hora",
      Objetivo_Id: Objetivo.Id,
      Fecha: Fecha_Lunes,
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Color: Objetivo.Color
    });
    Crear_Slot_Muerto(Fecha_Martes, 9, "Sueno");
    Render_Calendario();
  });

  await page.click('.Hora_Item[data-hora="9"]', {
    button: "right"
  });

  await expect(page.locator("#Dia_Accion_Menu"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Bloquear horario");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Mostrar horario");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Copiar horario");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Limpiar horario");
  await expect(page.locator(".Hora_Item.Hora_Fila_Seleccionada"))
    .toHaveCount(1);
  await expect(page.locator(".Slot.Hora_Fila_Seleccionada"))
    .toHaveCount(2);

  await page.mouse.click(5, 5);
  await expect(page.locator(".Hora_Fila_Seleccionada"))
    .toHaveCount(0);

  await page.click('.Hora_Item[data-hora="9"]', {
    button: "right"
  });
  await page.click('#Dia_Accion_Menu [data-accion="horario"]');
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Mostrar todo el día");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Mostrar solo madrugada");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Madrugada");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Tarde");

  await page.click(
    '#Dia_Accion_Menu [data-hora-atajo="solo-madrugada"]'
  );
  await expect(page.locator('.Hora_Item[data-hora="8"]'))
    .toHaveCount(0);
  await expect(page.locator('.Hora_Item[data-hora="0"]'))
    .toHaveCount(1);

  await page.click('#Dia_Accion_Menu [data-hora-bloque="Tarde"]');
  await expect(page.locator('.Hora_Item[data-hora="13"]'))
    .toHaveCount(1);
  await expect(page.locator('.Hora_Item[data-hora="20"]'))
    .toHaveCount(0);

  const bloquesVisibles = await page.evaluate(() => ({
    efectivos: Obtener_Bloques_Horarios_Visibles_Efectivos(),
    config: [...Config.Bloques_Horarios_Visibles]
  }));
  expect(bloquesVisibles.efectivos).toEqual([
    "Madrugada",
    "Tarde"
  ]);
  expect(bloquesVisibles.config).toEqual([
    "Madrugada",
    "Manana",
    "Tarde",
    "Noche"
  ]);

  await page.click('#Dia_Accion_Menu [data-hora-atajo="todo-dia"]');
  await expect(page.locator('.Hora_Item[data-hora="8"]'))
    .toHaveCount(1);
  await expect(page.locator('.Hora_Item[data-hora="20"]'))
    .toHaveCount(1);

  const todosLosBloques = await page.evaluate(() => ({
    efectivos: Obtener_Bloques_Horarios_Visibles_Efectivos(),
    config: [...Config.Bloques_Horarios_Visibles]
  }));
  expect(todosLosBloques.efectivos).toEqual([
    "Madrugada",
    "Manana",
    "Tarde",
    "Noche"
  ]);
  expect(todosLosBloques.config).toEqual([
    "Madrugada",
    "Manana",
    "Tarde",
    "Noche"
  ]);

  await page.evaluate(() => {
    Cerrar_Menu_Dia();
    Config.Bloques_Horarios_Visibles = [
      "Madrugada",
      "Manana",
      "Tarde",
      "Noche"
    ];
    Render_Calendario();
  });

  await page.click('.Hora_Item[data-hora="9"]', {
    button: "right"
  });
  await page.click('#Dia_Accion_Menu [data-accion="copiar-hora"]');
  await page.click('.Hora_Item[data-hora="10"]', {
    button: "right"
  });
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Pegar horario");

  await page.click('#Dia_Accion_Menu [data-accion="pegar-hora"]');
  await expect(page.locator("#Dialogo_Mensaje"))
    .toHaveText("¿Cómo pegar el horario?");
  await expect(page.locator("#Dialogo_Botones"))
    .toContainText("Completar lo que falta");
  await expect(page.locator("#Dialogo_Botones"))
    .toContainText("Reemplazar todo");
  await page.getByRole("button", { name: "Reemplazar todo" })
    .click();
  await page.waitForFunction(() =>
    Eventos.some((evento) =>
      evento.Fecha === window.__Fecha_Lunes_Horario &&
      evento.Inicio === 10
    ) &&
    Slot_Es_Muerto(window.__Fecha_Martes_Horario, 10)
  );

  const resultadoPegado = await page.evaluate(() => {
    return {
      tieneEventoOrigen: Eventos.some((evento) =>
        evento.Fecha === window.__Fecha_Lunes_Horario &&
        evento.Inicio === 9
      ),
      tieneEventoDestino: Eventos.some((evento) =>
        evento.Fecha === window.__Fecha_Lunes_Horario &&
        evento.Inicio === 10
      ),
      tieneSlotDestino:
        Slot_Es_Muerto(window.__Fecha_Martes_Horario, 10)
    };
  });

  expect(resultadoPegado.tieneEventoOrigen).toBe(true);
  expect(resultadoPegado.tieneEventoDestino).toBe(true);
  expect(resultadoPegado.tieneSlotDestino).toBe(true);
  }
);

test("mostrar horario respeta alcance semanal", async ({ page }) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Config.Enfoque_Hora_Actual_Modo = "Completo";
    Config.Bloques_Horarios_Visibles = ["Madrugada"];

    Cambiar_Semana_Actual(new Date());
    Render_Calendario();
    const Semana_Actual_Auto = {
      bloques: Obtener_Bloques_Horarios_Visibles_Efectivos(),
      hora0: Boolean(document.querySelector(
        '.Hora_Item[data-hora="0"]'
      )),
      hora8: Boolean(document.querySelector(
        '.Hora_Item[data-hora="8"]'
      ))
    };

    Fijar_Bloques_Horarios_Visibles_Manual(["Tarde"]);
    const Semana_Actual_Manual = {
      bloques: Obtener_Bloques_Horarios_Visibles_Efectivos(),
      hora0: Boolean(document.querySelector(
        '.Hora_Item[data-hora="0"]'
      )),
      hora13: Boolean(document.querySelector(
        '.Hora_Item[data-hora="13"]'
      ))
    };

    Cambiar_Semana_Actual(
      Sumar_Dias(Obtener_Lunes(new Date()), 7)
    );
    Render_Calendario();
    const Semana_Futura_Auto = {
      bloques: Obtener_Bloques_Horarios_Visibles_Efectivos(),
      hora8: Boolean(document.querySelector(
        '.Hora_Item[data-hora="8"]'
      )),
      hora13: Boolean(document.querySelector(
        '.Hora_Item[data-hora="13"]'
      ))
    };

    Fijar_Bloques_Horarios_Visibles_Manual(["Tarde"]);
    const Semana_Futura_Manual = {
      bloques: Obtener_Bloques_Horarios_Visibles_Efectivos(),
      hora8: Boolean(document.querySelector(
        '.Hora_Item[data-hora="8"]'
      )),
      hora13: Boolean(document.querySelector(
        '.Hora_Item[data-hora="13"]'
      ))
    };

    Cambiar_Semana_Actual(new Date());
    Render_Calendario();
    const Semana_Actual_Al_Volver = {
      bloques: Obtener_Bloques_Horarios_Visibles_Efectivos(),
      hora0: Boolean(document.querySelector(
        '.Hora_Item[data-hora="0"]'
      )),
      hora13: Boolean(document.querySelector(
        '.Hora_Item[data-hora="13"]'
      ))
    };

    return {
      semanaActualAuto: Semana_Actual_Auto,
      semanaActualManual: Semana_Actual_Manual,
      semanaFuturaAuto: Semana_Futura_Auto,
      semanaFuturaManual: Semana_Futura_Manual,
      semanaActualAlVolver: Semana_Actual_Al_Volver,
      config: [...Config.Bloques_Horarios_Visibles]
    };
  });

  expect(resultado.semanaActualAuto.bloques).toEqual([
    "Madrugada"
  ]);
  expect(resultado.semanaActualAuto.hora0).toBe(true);
  expect(resultado.semanaActualAuto.hora8).toBe(false);
  expect(resultado.semanaActualManual.bloques).toEqual(["Tarde"]);
  expect(resultado.semanaActualManual.hora0).toBe(false);
  expect(resultado.semanaActualManual.hora13).toBe(true);
  expect(resultado.semanaFuturaAuto.bloques).toEqual([
    "Madrugada",
    "Manana",
    "Tarde",
    "Noche"
  ]);
  expect(resultado.semanaFuturaAuto.hora8).toBe(true);
  expect(resultado.semanaFuturaAuto.hora13).toBe(true);
  expect(resultado.semanaFuturaManual.bloques).toEqual(["Tarde"]);
  expect(resultado.semanaFuturaManual.hora8).toBe(false);
  expect(resultado.semanaFuturaManual.hora13).toBe(true);
  expect(resultado.semanaActualAlVolver.bloques).toEqual([
    "Madrugada"
  ]);
  expect(resultado.semanaActualAlVolver.hora0).toBe(true);
  expect(resultado.semanaActualAlVolver.hora13).toBe(false);
  expect(resultado.config).toEqual(["Madrugada"]);
});

test("enfoque automatico alrededor de ahora respeta manual", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Config.Enfoque_Hora_Actual_Modo = "Enfocar";
    Config.Enfoque_Hora_Actual_Atras = 1;
    Config.Enfoque_Hora_Actual_Adelante = 3;
    Cambiar_Semana_Actual(new Date());
    Render_Calendario();

    const Hora_Actual = new Date().getHours();
    const Desde = Math.max(0, Hora_Actual - 1);
    const Hasta = Math.min(24, Hora_Actual + 4);
    const Esperadas = [];
    for (let H = Desde; H < Hasta; H++) Esperadas.push(H);

    const Automatico = Obtener_Horas_Visibles_Efectivas();

    Fijar_Bloques_Horarios_Visibles_Manual(["Tarde"]);
    const Manual = Obtener_Horas_Visibles_Efectivas();

    Cambiar_Semana_Actual(
      Sumar_Dias(Obtener_Lunes(new Date()), 7)
    );
    Render_Calendario();
    const Futura = Obtener_Horas_Visibles_Efectivas();

    return {
      automatico: Automatico,
      esperadas: Esperadas,
      manual: Manual,
      futura: Futura
    };
  });

  expect(resultado.automatico).toEqual(resultado.esperadas);
  expect(resultado.manual).toEqual([13, 14, 15, 16, 17, 18, 19]);
  expect(resultado.futura).toEqual([
    0, 1, 2, 3, 4, 5, 6, 7,
    8, 9, 10, 11, 12, 13, 14, 15,
    16, 17, 18, 19, 20, 21, 22, 23
  ]);
});

test("config permite ajustar bloques horarios", async ({ page }) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Abrir_Config();
    const Valor = (id) =>
      document.getElementById(id)?.value || "";
    const inicial = {
      madrugadaDesde: Valor("Cfg_Bloque_Madrugada_Desde"),
      madrugadaHasta: Valor("Cfg_Bloque_Madrugada_Hasta"),
      mananaDesde: Valor("Cfg_Bloque_Manana_Desde"),
      mananaHasta: Valor("Cfg_Bloque_Manana_Hasta"),
      tardeDesde: Valor("Cfg_Bloque_Tarde_Desde"),
      tardeHasta: Valor("Cfg_Bloque_Tarde_Hasta"),
      nocheDesde: Valor("Cfg_Bloque_Noche_Desde"),
      nocheHasta: Valor("Cfg_Bloque_Noche_Hasta")
    };

    document.getElementById(
      "Cfg_Bloque_Madrugada_Hasta"
    ).value = "7";
    document.getElementById(
      "Cfg_Bloque_Manana_Desde"
    ).value = "7";
    document.getElementById(
      "Cfg_Bloque_Manana_Hasta"
    ).value = "12";
    Guardar_Config();

    return {
      inicial,
      guardado: {
        Madrugada: Config.Bloques_Horarios.Madrugada,
        Manana: Config.Bloques_Horarios.Manana,
        Tarde: Config.Bloques_Horarios.Tarde,
        Noche: Config.Bloques_Horarios.Noche
      }
    };
  });

  expect(resultado.inicial).toEqual({
    madrugadaDesde: "0",
    madrugadaHasta: "8",
    mananaDesde: "8",
    mananaHasta: "13",
    tardeDesde: "13",
    tardeHasta: "20",
    nocheDesde: "20",
    nocheHasta: "0"
  });
  expect(resultado.guardado.Madrugada).toEqual({
    Desde: 0,
    Hasta: 7
  });
  expect(resultado.guardado.Manana).toEqual({
    Desde: 7,
    Hasta: 12
  });
  expect(resultado.guardado.Tarde).toEqual({
    Desde: 13,
    Hasta: 20
  });
  expect(resultado.guardado.Noche).toEqual({
    Desde: 20,
    Hasta: 0
  });
});

test("config permite activar enfoque alrededor de ahora", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Abrir_Config();
    const Modo = document.getElementById(
      "Cfg_Enfoque_Hora_Actual_Modo"
    );
    const Campos = document.getElementById(
      "Cfg_Enfoque_Hora_Actual_Campos"
    );
    const Nota = document.getElementById(
      "Cfg_Enfoque_Hora_Actual_Nota"
    );
    const Atras = document.getElementById(
      "Cfg_Enfoque_Hora_Actual_Atras"
    );
    const Adelante = document.getElementById(
      "Cfg_Enfoque_Hora_Actual_Adelante"
    );
    const Inicial = {
      modo: Modo?.value || "",
      camposOcultos: Boolean(Campos?.hidden),
      camposDisplay: getComputedStyle(Campos).display,
      notaOculta: Boolean(Nota?.hidden),
      notaDisplay: getComputedStyle(Nota).display,
      atras: Atras?.value || "",
      adelante: Adelante?.value || ""
    };
    Modo.value = "Completo";
    Modo.dispatchEvent(new Event("change"));
    Modo.value = "Enfocar";
    Modo.dispatchEvent(new Event("change"));
    const Tras_Modo = {
      camposOcultos: Boolean(Campos?.hidden),
      camposDisplay: getComputedStyle(Campos).display,
      notaOculta: Boolean(Nota?.hidden),
      notaDisplay: getComputedStyle(Nota).display,
      atrasDeshabilitado: Boolean(Atras?.disabled),
      adelanteDeshabilitado: Boolean(Adelante?.disabled)
    };
    Modo.value = "Completo";
    Modo.dispatchEvent(new Event("change"));
    const Tras_Completo = {
      camposOcultos: Boolean(Campos?.hidden),
      camposDisplay: getComputedStyle(Campos).display,
      notaOculta: Boolean(Nota?.hidden),
      notaDisplay: getComputedStyle(Nota).display,
      atrasDeshabilitado: Boolean(Atras?.disabled),
      adelanteDeshabilitado: Boolean(Adelante?.disabled)
    };
    Modo.value = "Enfocar";
    Modo.dispatchEvent(new Event("change"));
    Atras.value = "2";
    Adelante.value = "5";
    Guardar_Config();
    return {
      inicial: Inicial,
      trasModo: Tras_Modo,
      trasCompleto: Tras_Completo,
      guardado: {
        modo: Config.Enfoque_Hora_Actual_Modo,
        atras: Config.Enfoque_Hora_Actual_Atras,
        adelante: Config.Enfoque_Hora_Actual_Adelante
      }
    };
  });

  expect(resultado.inicial).toEqual({
    modo: "Completo",
    camposOcultos: true,
    camposDisplay: "none",
    notaOculta: true,
    notaDisplay: "none",
    atras: "1",
    adelante: "6"
  });
  expect(resultado.trasModo).toEqual({
    camposOcultos: false,
    camposDisplay: "flex",
    notaOculta: false,
    notaDisplay: "block",
    atrasDeshabilitado: false,
    adelanteDeshabilitado: false
  });
  expect(resultado.trasCompleto).toEqual({
    camposOcultos: true,
    camposDisplay: "none",
    notaOculta: true,
    notaDisplay: "none",
    atrasDeshabilitado: true,
    adelanteDeshabilitado: true
  });
  expect(resultado.guardado).toEqual({
    modo: "Enfocar",
    atras: 2,
    adelante: 5
  });
});
