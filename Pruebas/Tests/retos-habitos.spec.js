const { test, expect } = require("@playwright/test");

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

  await page.addInitScript(() => {
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
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.removeItem("Semaplan_Estado_V2");
  });

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Abrir_Retos === "function" &&
    typeof Retos_Estado_Dia === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    Inicializar();
    Habitos = [
      Normalizar_Habito({
        Id: "hab_lectura",
        Nombre: "Lectura",
        Emoji: "\u{1F4D6}",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "hab_movimiento",
        Nombre: "Movimiento",
        Emoji: "\u{1F3C3}",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      })
    ];
    Habitos_Registros = [];
    Retos = [];
    Normalizar_Habitos();
    Normalizar_Habitos_Registros();
    Normalizar_Retos();
  });
}

test("crea un reto vinculado a varios habitos y calcula progreso", async ({
  page
}) => {
  await Preparar(page);

  const hoy = await page.evaluate(() => Retos_Fecha_Hoy());

  await page.locator("#Retos_Boton").click();
  await expect(page.locator("#Retos_Overlay")).toHaveClass(/Activo/);

  await page.locator("#Retos_Nuevo").click();
  await page.locator("#Reto_Nombre").fill("100 dias de base");
  await page.locator("#Reto_Fecha_Inicio").fill(hoy);
  await page.locator("#Reto_Duracion").fill("100");
  await page.locator("#Reto_Regla").selectOption("Todos");
  await page.locator('[data-reto-habito-id="hab_lectura"]').check();
  await page.locator('[data-reto-habito-id="hab_movimiento"]').check();
  await page.locator("#Retos_Nuevo").click();

  await expect(page.locator(".Retos_Card")).toContainText(
    "100 dias de base"
  );

  const vinculos = await page.evaluate(() => Retos[0].Habito_Ids);
  expect(vinculos).toEqual(["hab_lectura", "hab_movimiento"]);

  const estados = await page.evaluate(() => {
    const Fecha = Retos[0].Fecha_Inicio;
    Habito_Registrar_Fuente({
      Habito_Id: "hab_lectura",
      Fecha,
      Fuente: "Manual",
      Fuente_Id: "manual_lectura",
      Cantidad: 1,
      Unidad: ""
    });
    Normalizar_Habitos_Registros();
    const parcial = Retos_Estado_Dia(Retos[0], Fecha);

    Habito_Registrar_Fuente({
      Habito_Id: "hab_movimiento",
      Fecha,
      Fuente: "Manual",
      Fuente_Id: "manual_movimiento",
      Cantidad: 1,
      Unidad: ""
    });
    Normalizar_Habitos_Registros();
    Retos_Refrescar_Si_Abierto();
    const cumplido = Retos_Estado_Dia(Retos[0], Fecha);
    return { parcial, cumplido };
  });

  expect(estados.parcial).toMatchObject({
    Clave: "Parcial",
    Cumplidos: 1,
    Total: 2
  });
  expect(estados.cumplido).toMatchObject({
    Clave: "Cumplido",
    Cumplidos: 2,
    Total: 2
  });
});

test("no penaliza dias previos al inicio de un habito nuevo", async ({
  page
}) => {
  await Preparar(page);

  const estados = await page.evaluate(() => {
    const Inicio = Formatear_Fecha_ISO(Sumar_Dias(new Date(), -10));
    const Dia_8 = Formatear_Fecha_ISO(
      Sumar_Dias(Parsear_Fecha_ISO(Inicio), 7)
    );
    const Dia_9 = Formatear_Fecha_ISO(
      Sumar_Dias(Parsear_Fecha_ISO(Inicio), 8)
    );
    Habitos = Habitos.map((Habito) =>
      Normalizar_Habito({
        ...Habito,
        Fecha_Inicio: Inicio
      })
    );
    Habitos.push(Normalizar_Habito({
      Id: "hab_nuevo",
      Nombre: "Nuevo tramo",
      Emoji: "\u{2728}",
      Tipo: "Hacer",
      Activo: true,
      Fecha_Inicio: Dia_9,
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Periodo: "Dia",
        Cantidad: 1
      }
    }));
    Retos = [Normalizar_Reto({
      Nombre: "100 dias ampliado",
      Fecha_Inicio: Inicio,
      Duracion_Dias: 100,
      Regla_Cumplimiento: "Todos",
      Habito_Ids: [
        "hab_lectura",
        "hab_movimiento",
        "hab_nuevo"
      ]
    })];

    Array.from({ length: 9 }, (_, Indice) =>
      Formatear_Fecha_ISO(
        Sumar_Dias(Parsear_Fecha_ISO(Inicio), Indice)
      )
    ).forEach((Fecha) => {
      ["hab_lectura", "hab_movimiento"].forEach((Habito_Id) => {
        Habito_Registrar_Fuente({
          Habito_Id,
          Fecha,
          Fuente: "Manual",
          Fuente_Id: `manual_${Habito_Id}_${Fecha}`,
          Cantidad: 1,
          Unidad: ""
        });
      });
    });

    Normalizar_Habitos_Registros();
    return {
      dia8: Retos_Estado_Dia(Retos[0], Dia_8),
      dia9: Retos_Estado_Dia(Retos[0], Dia_9),
      stats: Retos_Estadisticas(Retos[0])
    };
  });

  expect(estados.dia8).toMatchObject({
    Clave: "Cumplido",
    Cumplidos: 2,
    Total: 2
  });
  expect(estados.dia9).toMatchObject({
    Clave: "Parcial",
    Cumplidos: 2,
    Total: 3
  });
  expect(estados.stats.Cumplidos).toBe(8);
});
