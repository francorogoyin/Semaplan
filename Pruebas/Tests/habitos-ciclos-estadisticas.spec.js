const { test, expect } = require("@playwright/test");

async function Preparar(page) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2",
    async (route) => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    async (route) => route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: ""
    })
  );
  await page.addInitScript(() => {
    window.supabase = {
      createClient() {
        return {
          auth: {
            async getSession() {
              return { data: { session: null } };
            },
            onAuthStateChange() {
              return { data: { subscription: { unsubscribe() {} } } };
            }
          }
        };
      }
    };
    window.turnstile = { render() {}, remove() {}, reset() {} };
  });
  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Normalizar_Habito === "function" &&
    typeof Habito_Corresponde_En_Fecha === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    Habitos = [];
    Habitos_Registros = [];
  });
}

test("evalua ciclos personalizados de habitos", async ({ page }) => {
  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Id: "Habito_Ciclo",
      Nombre: "Lectura alternada",
      Fecha_Inicio: "2026-04-13",
      Programacion: {
        Tipo: "Libre",
        Tipo_Ciclo: "Ciclo",
        Semanas_Ciclo: 2,
        Dias_Ciclo: [[0, 1], [2, 3]]
      }
    });
    return {
      semanaA: [
        Habito_Corresponde_En_Fecha(Habito, "2026-04-13"),
        Habito_Corresponde_En_Fecha(Habito, "2026-04-15")
      ],
      semanaB: [
        Habito_Corresponde_En_Fecha(Habito, "2026-04-20"),
        Habito_Corresponde_En_Fecha(Habito, "2026-04-22")
      ]
    };
  });
  expect(Resultado).toEqual({
    semanaA: [true, false],
    semanaB: [false, true]
  });
});

test("abre estadisticas y resetea fecha al cambiar vista", async ({ page }) => {
  await Preparar(page);
  await page.evaluate(() => {
    Habitos = [Normalizar_Habito({
      Id: "Habito_Estadisticas",
      Nombre: "Lectura",
      Meta: { Modo: "Check", Cantidad: 1 }
    })];
    Abrir_Panel_Habitos();
    Habitos_Panel_Fecha = "2020-01-01";
    Render_Modal_Habitos();
  });
  await page.locator('[data-habitos-toggle="Habito_Estadisticas"]')
    .click();
  await page.locator('[data-habitos-estadisticas="Habito_Estadisticas"]')
    .click();
  await expect(page.locator(".Habitos_Estadisticas_Panel"))
    .toBeVisible();
  await expect(page.locator(".Habitos_Estadisticas_Grafico"))
    .toBeVisible();
  await page.locator('[data-habitos-estadisticas-cerrar]').click();
  await page.locator('[data-habitos-panel-modo="Semana"]').click();
  const Fecha = await page.evaluate(() => Habitos_Panel_Fecha);
  expect(Fecha).toBe(await page.evaluate(() => Habitos_Fecha_Hoy()));
});

test("incluye registros fuera del ciclo en las estadisticas", async ({ page }) => {
  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Id: "Habito_Lectura_Alternada",
      Nombre: "Lectura alternada",
      Fecha_Inicio: "2026-07-13",
      Meta: { Modo: "Cantidad", Cantidad: 60, Periodo: "Dia" },
      Programacion: {
        Tipo: "Libre",
        Tipo_Ciclo: "Ciclo",
        Semanas_Ciclo: 2,
        Dias_Ciclo: [[0, 1, 4, 5], [2, 3]]
      }
    });
    Habitos = [Habito];
    Habitos_Registros = [];
    [
      ["2026-07-13", 66],
      ["2026-07-14", 60],
      ["2026-07-17", 61],
      ["2026-07-18", 12],
      ["2026-07-20", 34]
    ].forEach(([Fecha, Cantidad], Indice) => {
      Habito_Registrar_Fuente({
        Habito_Id: Habito.Id,
        Fecha,
        Cantidad,
        Fuente: "Manual",
        Fuente_Id: `Manual_Lectura_${Indice}`
      });
    });
    const Por_Dia = Habitos_Estadisticas_Rango(
      Habito,
      "2026-07-13",
      "2026-07-20",
      "Dia"
    );
    const Por_Semana = Habitos_Estadisticas_Rango(
      Habito,
      "2026-07-13",
      "2026-07-20",
      "Semana"
    );
    const Por_Dia_Validos = Habitos_Estadisticas_Rango(
      Habito,
      "2026-07-13",
      "2026-07-20",
      "Dia",
      "Aplicables"
    );
    const Por_Dia_Con_Progreso = Habitos_Estadisticas_Rango(
      Habito,
      "2026-07-13",
      "2026-07-20",
      "Dia",
      "Con_Progreso"
    );
    return {
      dias: Por_Dia.map((Item) => ({
        fecha: Item.Clave,
        total: Item.Total,
        aplicables: Item.Aplicables,
        exitos: Item.Exitos
      })),
      diasValidos: Por_Dia_Validos.map((Item) => Item.Clave),
      diasConProgreso: Por_Dia_Con_Progreso.map((Item) => Item.Clave),
      semanas: Por_Semana.map((Item) => ({
        clave: Item.Clave,
        etiqueta: Item.Etiqueta,
        total: Item.Total
      }))
    };
  });

  await page.evaluate(() => {
    Habitos_Abrir_Estadisticas("Habito_Lectura_Alternada");
  });
  const Cobertura = page.locator(
    "[data-habitos-estadisticas-cobertura]"
  );
  await expect(Cobertura).toHaveValue("Todos");
  await expect(Cobertura.locator("option")).toHaveCount(3);
  await Cobertura.selectOption("Aplicables");
  await expect(Cobertura).toHaveValue("Aplicables");
  await Cobertura.selectOption("Con_Progreso");
  await expect(Cobertura).toHaveValue("Con_Progreso");

  expect(Resultado.dias).toEqual([
    { fecha: "2026-07-13", total: 66, aplicables: 1, exitos: 1 },
    { fecha: "2026-07-14", total: 60, aplicables: 1, exitos: 1 },
    { fecha: "2026-07-15", total: 0, aplicables: 0, exitos: 0 },
    { fecha: "2026-07-16", total: 0, aplicables: 0, exitos: 0 },
    { fecha: "2026-07-17", total: 61, aplicables: 1, exitos: 1 },
    { fecha: "2026-07-18", total: 12, aplicables: 1, exitos: 0 },
    { fecha: "2026-07-19", total: 0, aplicables: 0, exitos: 0 },
    { fecha: "2026-07-20", total: 34, aplicables: 0, exitos: 0 }
  ]);
  expect(Resultado.diasValidos).toEqual([
    "2026-07-13",
    "2026-07-14",
    "2026-07-17",
    "2026-07-18"
  ]);
  expect(Resultado.diasConProgreso).toEqual([
    "2026-07-13",
    "2026-07-14",
    "2026-07-17",
    "2026-07-18",
    "2026-07-20"
  ]);
  expect(Resultado.semanas).toEqual([
    { clave: "2026-07-13", etiqueta: "13–19 jul", total: 199 },
    { clave: "2026-07-20", etiqueta: "20–26 jul", total: 34 }
  ]);
});

test("permite registrar un habito fuera de su programacion", async ({ page }) => {
  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Id: "Habito_Fuera_Programacion",
      Nombre: "Lectura dominical",
      Fecha_Inicio: "2026-07-13",
      Programacion: { Tipo: "Dias", Dias: [0] },
      Meta: { Modo: "Check", Cantidad: 1, Periodo: "Dia" }
    });
    Habitos = [Habito];
    Habitos_Registros = [];
    Habitos_Panel_Modo = "Dia";
    const Fecha = "2026-07-19";
    const Accion_Disponible = Habitos_Render_Accion_Rapida(
      Habito,
      Fecha
    ).includes("data-habitos-registro-rapido");
    Habitos_Registrar_Manual(Habito, 60, Fecha);
    return {
      accionDisponible: Accion_Disponible,
      registrado: Habito_Tiene_Registro_En_Periodo(Habito, Fecha),
      cantidad: Habito_Progreso_Actual(Habito, Fecha),
      racha: Habitos_Calcular_Racha(Habito, Fecha)
    };
  });

  expect(Resultado).toEqual({
    accionDisponible: true,
    registrado: true,
    cantidad: 60,
    racha: 1
  });
});

test("colorea las barras de estadisticas segun el tipo de habito", async ({
  page
}) => {
  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    const Hoy = Habitos_Fecha_Hoy();
    const Ayer = Formatear_Fecha_ISO(
      Sumar_Dias(Parsear_Fecha_ISO(Hoy), -1)
    );
    const Anteayer = Formatear_Fecha_ISO(
      Sumar_Dias(Parsear_Fecha_ISO(Hoy), -2)
    );
    const Clases = () => Array.from(document.querySelectorAll(
      ".Habitos_Estadisticas_Columna"
    )).map((Columna) => Columna.className);

    const Cantidad = Normalizar_Habito({
      Id: "Habito_Colores_Cantidad",
      Nombre: "Lectura",
      Meta: { Modo: "Cantidad", Cantidad: 60, Periodo: "Dia" }
    });
    Habitos = [Cantidad];
    Habitos_Registros = [];
    Habito_Registrar_Fuente({
      Habito_Id: Cantidad.Id,
      Fecha: Anteayer,
      Cantidad: 60,
      Fuente: "Manual",
      Fuente_Id: "Cantidad_Completa"
    });
    Habito_Registrar_Fuente({
      Habito_Id: Cantidad.Id,
      Fecha: Ayer,
      Cantidad: 30,
      Fuente: "Manual",
      Fuente_Id: "Cantidad_Parcial"
    });
    Abrir_Panel_Habitos();
    Habitos_Abrir_Estadisticas(Cantidad.Id);
    Habitos_Render_Estadisticas(Cantidad, 7, "Dia");
    const Barras_Cantidad = Clases();

    const Cantidad_Fuera = Normalizar_Habito({
      Id: "Habito_Colores_Cantidad_Fuera",
      Nombre: "Lectura excepcional",
      Meta: { Modo: "Cantidad", Cantidad: 60, Periodo: "Dia" },
      Programacion: { Tipo: "Dias", Dias: [0] }
    });
    const Fecha_Fuera = Array.from({ length: 7 }, (_, Indice) =>
      Formatear_Fecha_ISO(Sumar_Dias(Parsear_Fecha_ISO(Hoy), -Indice))
    ).find((Fecha) => !Habito_Corresponde_En_Fecha(Cantidad_Fuera, Fecha));
    Habitos = [Cantidad_Fuera];
    Habitos_Registros = [];
    Habito_Registrar_Fuente({
      Habito_Id: Cantidad_Fuera.Id,
      Fecha: Fecha_Fuera,
      Cantidad: 30,
      Fuente: "Manual",
      Fuente_Id: "Cantidad_Excepcional_Parcial"
    });
    Habitos_Render_Estadisticas(Cantidad_Fuera, 7, "Dia");
    const Barras_Cantidad_Fuera = Clases();

    const Check = Normalizar_Habito({
      Id: "Habito_Colores_Check",
      Nombre: "Meditar",
      Meta: { Modo: "Check", Cantidad: 1, Periodo: "Dia" }
    });
    Habitos = [Check];
    Habitos_Registros = [];
    Habitos_Registrar_Manual(Check, 1, Ayer);
    Habitos_Render_Estadisticas(Check, 7, "Dia");
    const Barras_Check = Clases();

    const Tiempo = Normalizar_Habito({
      Id: "Habito_Colores_Tiempo",
      Nombre: "Caminar",
      Meta: { Modo: "Tiempo", Cantidad: 60, Periodo: "Dia" }
    });
    Habitos = [Tiempo];
    Habitos_Registros = [];
    Habito_Registrar_Fuente({
      Habito_Id: Tiempo.Id,
      Fecha: Ayer,
      Cantidad: 30,
      Fuente: "Manual",
      Fuente_Id: "Tiempo_Parcial"
    });
    Habitos_Render_Estadisticas(Tiempo, 7, "Dia");
    const Barras_Tiempo = Clases();

    const Evitar = Normalizar_Habito({
      Id: "Habito_Colores_Evitar",
      Nombre: "No fumar",
      Tipo: "Evitar",
      Meta: { Cantidad: 0, Periodo: "Dia" }
    });
    Habitos = [Evitar];
    Habitos_Registros = [];
    Habitos_Registrar_Manual(Evitar, 0, Ayer);
    Habitos_Render_Estadisticas(Evitar, 7, "Dia");
    return {
      Barras_Cantidad,
      Barras_Cantidad_Fuera,
      Barras_Check,
      Barras_Tiempo,
      Barras_Evitar: Clases()
    };
  });

  expect(Resultado.Barras_Cantidad.some((Clase) =>
    Clase.includes("Naranja")
  )).toBe(true);
  expect(Resultado.Barras_Cantidad.some((Clase) =>
    Clase.includes("Nula")
  )).toBe(true);
  expect(Resultado.Barras_Cantidad.some((Clase) =>
    !Clase.includes("Naranja") && !Clase.includes("Nula")
  )).toBe(true);
  expect(Resultado.Barras_Cantidad_Fuera.some((Clase) =>
    Clase.includes("Naranja")
  )).toBe(true);
  expect(Resultado.Barras_Check.some((Clase) =>
    Clase.includes("Naranja")
  )).toBe(false);
  expect(Resultado.Barras_Check.some((Clase) =>
    Clase.includes("Nula")
  )).toBe(true);
  expect(Resultado.Barras_Check.some((Clase) =>
    !Clase.includes("Naranja") && !Clase.includes("Nula")
  )).toBe(true);
  expect(Resultado.Barras_Tiempo.some((Clase) =>
    Clase.includes("Naranja")
  )).toBe(true);
  expect(Resultado.Barras_Evitar.some((Clase) =>
    Clase.includes("Naranja")
  )).toBe(false);
  expect(Resultado.Barras_Evitar.some((Clase) =>
    !Clase.includes("Naranja") && !Clase.includes("Nula")
  )).toBe(true);
});
