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

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Normalizar_Habito === "function" &&
    typeof Obtener_Habitos_Disponibles_Plan_Slot === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    if (!Semana_Actual) {
      Semana_Actual = Obtener_Lunes(new Date());
    }
  });
}

test("sugiere habitos de periodo largo pendientes en planes", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Diario_Finde = Normalizar_Habito({
      Id: "Habito_Diario_Finde",
      Nombre: "Diario finde",
      Programacion: {
        Tipo: "Dias",
        Dias: [5, 6]
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Periodo: "Dia",
        Cantidad: 1
      }
    });
    const Semanal_Finde = Normalizar_Habito({
      Id: "Habito_Semanal_Finde",
      Nombre: "Semanal finde",
      Programacion: {
        Tipo: "Dias",
        Dias: [5, 6]
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Periodo: "Semana",
        Cantidad: 1
      }
    });
    const Quincenal_Finde = Normalizar_Habito({
      Id: "Habito_Quincenal_Finde",
      Nombre: "Quincenal finde",
      Programacion: {
        Tipo: "Dias",
        Dias: [5, 6]
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Periodo: "Quincena",
        Cantidad: 1
      }
    });
    const Mensual_Finde = Normalizar_Habito({
      Id: "Habito_Mensual_Finde",
      Nombre: "Mensual finde",
      Programacion: {
        Tipo: "Dias",
        Dias: [5, 6]
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Periodo: "Mes",
        Cantidad: 1
      }
    });
    Habitos = [
      Diario_Finde,
      Semanal_Finde,
      Quincenal_Finde,
      Mensual_Finde
    ];
    Habitos_Registros = [];

    const Sugeridos_Lunes =
      Obtener_Habitos_Disponibles_Plan_Slot(
        "2026-04-13",
        9,
        true
      ).map((Habito) => Habito.Id);

    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Semanal_Finde",
      Fecha: "2026-04-13",
      Fuente: "Manual",
      Fuente_Id: "semana",
      Cantidad: 1
    });
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Quincenal_Finde",
      Fecha: "2026-04-13",
      Fuente: "Manual",
      Fuente_Id: "quincena",
      Cantidad: 1
    });
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Mensual_Finde",
      Fecha: "2026-04-13",
      Fuente: "Manual",
      Fuente_Id: "mes",
      Cantidad: 1
    });

    const Sugeridos_Completos =
      Obtener_Habitos_Disponibles_Plan_Slot(
        "2026-04-13",
        9,
        true
      ).map((Habito) => Habito.Id);
    const Sugeridos_Sabado =
      Obtener_Habitos_Disponibles_Plan_Slot(
        "2026-04-18",
        9,
        true
      ).map((Habito) => Habito.Id);

    return {
      Sugeridos_Lunes,
      Sugeridos_Completos,
      Sugeridos_Sabado
    };
  });

  expect(resultado).toEqual({
    Sugeridos_Lunes: [
      "Habito_Semanal_Finde",
      "Habito_Quincenal_Finde",
      "Habito_Mensual_Finde"
    ],
    Sugeridos_Completos: [],
    Sugeridos_Sabado: ["Habito_Diario_Finde"]
  });
});

test("ordena habitos sugeridos por periodo y tipo", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Crear = (Periodo, Tipo_Orden) => {
      const Es_Evitar = Tipo_Orden === "Evitar";
      const Modo = Tipo_Orden === "Evitar"
        ? "Cantidad"
        : Tipo_Orden;
      return Normalizar_Habito({
        Id: `Habito_${Periodo}_${Tipo_Orden}`,
        Nombre: `${Periodo} ${Tipo_Orden}`,
        Tipo: Es_Evitar ? "Evitar" : "Hacer",
        Programacion: {
          Tipo: "Dias",
          Dias: [0]
        },
        Meta: {
          Modo,
          Regla: Es_Evitar ? "Como_Maximo" : "Al_Menos",
          Periodo,
          Cantidad: Es_Evitar ? 0 : 1,
          Unidad: Modo === "Tiempo" ? "Minutos" : "u"
        }
      });
    };
    Habitos = [
      Crear("Mes", "Evitar"),
      Crear("Quincena", "Tiempo"),
      Crear("Dia", "Cantidad"),
      Crear("Semana", "Evitar"),
      Crear("Mes", "Check"),
      Crear("Dia", "Evitar"),
      Crear("Quincena", "Cantidad"),
      Crear("Semana", "Tiempo"),
      Crear("Dia", "Check"),
      Crear("Mes", "Cantidad"),
      Crear("Semana", "Check"),
      Crear("Quincena", "Evitar"),
      Crear("Dia", "Tiempo"),
      Crear("Semana", "Cantidad"),
      Crear("Quincena", "Check"),
      Crear("Mes", "Tiempo")
    ];
    Habitos_Registros = [];
    return Obtener_Habitos_Disponibles_Plan_Slot(
      "2026-04-13",
      9,
      true
    ).map((Habito) => Habito.Id);
  });

  expect(resultado).toEqual([
    "Habito_Dia_Check",
    "Habito_Dia_Cantidad",
    "Habito_Dia_Tiempo",
    "Habito_Dia_Evitar",
    "Habito_Semana_Check",
    "Habito_Semana_Cantidad",
    "Habito_Semana_Tiempo",
    "Habito_Semana_Evitar",
    "Habito_Quincena_Check",
    "Habito_Quincena_Cantidad",
    "Habito_Quincena_Tiempo",
    "Habito_Quincena_Evitar",
    "Habito_Mes_Check",
    "Habito_Mes_Cantidad",
    "Habito_Mes_Tiempo",
    "Habito_Mes_Evitar"
  ]);
});
