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
  });

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof Normalizar_Habito === "function" &&
    typeof Habito_Coincide_Con_Slot === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    if (!Semana_Actual) {
      Semana_Actual = Obtener_Lunes(new Date());
    }
  });
}

test("evalua rangos horarios de habitos que cruzan medianoche", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Nombre: "Nocturno",
      Activo: true,
      Programacion: {
        Tipo: "Franjas",
        Desde: 22,
        Hasta: 2
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Cantidad: 1
      }
    });

    return {
      a23: Habito_Coincide_Con_Slot(Habito, "2026-04-13", 23),
      a01: Habito_Coincide_Con_Slot(Habito, "2026-04-14", 1),
      a12: Habito_Coincide_Con_Slot(Habito, "2026-04-13", 12),
      texto23:
        Habito_Coincide_Con_Slot(Habito, "2026-04-13", "23:00"),
      texto01:
        Habito_Coincide_Con_Slot(Habito, "2026-04-14", "01:00")
    };
  });

  expect(resultado).toEqual({
    a23: true,
    a01: true,
    a12: false,
    texto23: true,
    texto01: true
  });
});

test("normaliza regla Entre sin maximo menor que minimo", async ({
  page
}) => {
  await Preparar(page);

  const meta = await page.evaluate(() => {
    return Normalizar_Habito({
      Nombre: "Rango invalido",
      Meta: {
        Modo: "Cantidad",
        Regla: "Entre",
        Cantidad: 10,
        Cantidad_Maxima: 5,
        Unidad: "u"
      }
    }).Meta;
  });

  expect(meta.Cantidad).toBe(10);
  expect(meta.Cantidad_Maxima).toBe(10);
});

test("permite cero caidas en habitos de evitar", async ({ page }) => {
  await Preparar(page);

  const meta = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Nombre: "Sin caidas",
      Tipo: "Evitar",
      Meta: {
        Modo: "Cantidad",
        Regla: "Como_Maximo",
        Cantidad: 0,
        Cantidad_Maxima: 0,
        Unidad: "caidas"
      }
    });
    return {
      Meta: Habito.Meta,
      Objetivo: Habito_Objetivo_Total(Habito)
    };
  });

  expect(meta.Meta.Modo).toBe("Cantidad");
  expect(meta.Meta.Regla).toBe("Como_Maximo");
  expect(meta.Meta.Cantidad).toBe(0);
  expect(meta.Meta.Cantidad_Maxima).toBe(0);
  expect(meta.Objetivo).toBe(0);
});

test("advierte antes de cerrar habito con cambios sin guardar", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [];
    Abrir_Modal_Habitos();
  });
  await page.fill("#Habito_Nombre", "Habito sin guardar");
  await page.click("#Habitos_Cerrar");

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("cambios sin guardar");

  await page.locator("#Dialogo_Botones .Dialogo_Boton_Cancelar").click();
  await expect(page.locator("#Habitos_Overlay"))
    .toHaveClass(/Activo/);
});

test("advierte al cambiar unidad con registros previos", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Test_Registros",
        Nombre: "Lectura",
        Tipo: "Hacer",
        Programacion: { Tipo: "Libre" },
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [
      Normalizar_Habito_Registro({
        Id: "Registro_Test",
        Habito_Id: "Habito_Test_Registros",
        Fecha: "2026-04-24",
        Hora: "09:00",
        Fecha_Hora: "2026-04-24T09:00",
        Periodo_Clave: "2026-04-24",
        Fuente: "Manual",
        Fuente_Id: "Manual_Test",
        Cantidad: 5
      })
    ];
    Abrir_Modal_Habitos("Habito_Test_Registros");
  });

  await page.fill("#Habito_Meta_Unidad", "hojas");
  await page.click("#Habitos_Nuevo");

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("ya tiene registros");
});

test("explica que los patrones se filtran por tipo de slot", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Patrones = [];
    void Resolver_Items_Patron_Slot([], "Sueno");
  });

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("compatibles");
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("tipo de slot");
});

test("panel de habitos registra avances manuales desde la lista", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Check_Rapido",
        Nombre: "Check rapido",
        Tipo: "Hacer",
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Cantidad_Rapida",
        Nombre: "Lectura rapida",
        Tipo: "Hacer",
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Evitar_Rapido",
        Nombre: "Evitar rapido",
        Tipo: "Evitar",
        Meta: {
          Modo: "Cantidad",
          Regla: "Como_Maximo",
          Periodo: "Dia",
          Cantidad: 0,
          Unidad: "caidas"
        }
      })
    ];
    Habitos_Registros = [];
    Abrir_Panel_Habitos();
  });

  await expect(page.locator("#Habitos_Header_Acciones button"))
    .toHaveCount(3);

  const filtrosDebajo = await page.evaluate(() => {
    const Lista = document.querySelector(".Habitos_Lista");
    return Lista?.nextElementSibling?.classList
      .contains("Habitos_Panel_Filtros");
  });
  expect(filtrosDebajo).toBe(true);

  await page.click(
    '[data-habitos-registro-rapido="Habito_Check_Rapido"]'
  );
  await expect(page.locator(".Undo_Toast").first())
    .toContainText("Hábito realizado");

  await page.fill(
    '[data-habitos-registro-input="Habito_Cantidad_Rapida"]',
    "2"
  );
  await page.click(
    '[data-habitos-registro-rapido="Habito_Cantidad_Rapida"]'
  );

  await page.click(
    '[data-habitos-registro-rapido="Habito_Evitar_Rapido"]'
  );
  await expect(page.locator(
    '[data-habitos-registro-rapido="Habito_Evitar_Rapido"]'
  )).toBeDisabled();

  const resumen = await page.evaluate(() => ({
    Total: Habitos_Registros.length,
    Check: Habito_Progreso_Actual(
      Habito_Por_Id("Habito_Check_Rapido"),
      Habitos_Fecha_Referencia()
    ),
    Cantidad: Habito_Progreso_Actual(
      Habito_Por_Id("Habito_Cantidad_Rapida"),
      Habitos_Fecha_Referencia()
    ),
    EvitarCantidad: Habitos_Registros.find((Registro) =>
      Registro.Habito_Id === "Habito_Evitar_Rapido"
    )?.Cantidad,
    EvitarEstado: Habitos_Estado(
      Habito_Por_Id("Habito_Evitar_Rapido")
    ).Clave
  }));

  expect(resumen).toEqual({
    Total: 3,
    Check: 1,
    Cantidad: 2,
    EvitarCantidad: 0,
    EvitarEstado: "Realizado"
  });
});
