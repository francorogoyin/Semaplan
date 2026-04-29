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
    window.alert = () => {};
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.removeItem("Semaplan_Estado_V2");
  });

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Meta_Aporte_Cambiar_Hecho_Evento === "function" &&
    typeof Habito_Sincronizar_Items_Plan_Slot === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    Inicializar();
    Semana_Actual = Parsear_Fecha_ISO("2026-04-20");
  });
}

test("habitos de tiempo descuentan la duracion real de bloques chicos",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Tiempo_Chico",
        Nombre: "Foco corto",
        Emoji: "\u23f1\ufe0f",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Tiempo",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 60,
          Unidad: "Minutos"
        }
      })
    ];
    Habitos_Registros = [];

    const Crear_Evento = (Id, Inicio, Duracion) => ({
      Id,
      Objetivo_Id: "Obj_Bloque_Chico",
      Fecha: "2026-04-24",
      Inicio,
      Duracion,
      Hecho: false,
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Tiempo_Chico",
          Cantidad_Modo: "Usar_Duracion",
          Cantidad: 1,
          Activo: true
        }
      ]
    });

    Objetivos = [
      {
        Id: "Obj_Bloque_Chico",
        Nombre: "Bloques chicos",
        Emoji: "\u23f1\ufe0f",
        Color: "#1f6b4f",
        Horas_Semanales: 1,
        Restante: 1
      }
    ];
    Eventos = [
      Crear_Evento("Evento_Media_Hora", 9, 0.5),
      Crear_Evento("Evento_Cuarto_Hora", 9.5, 0.25)
    ];

    await Meta_Aporte_Cambiar_Hecho_Evento(Eventos[0], true);
    await Meta_Aporte_Cambiar_Hecho_Evento(Eventos[1], true);

    Config.Duracion_Default = 0.5;
    Config.Duracion_Grilla_Eventos = 0.5;
    const Item_Media_Hora = {
      Id: "Plan_Media_Hora",
      Tipo: "Habito",
      Habito_Id: "Habito_Tiempo_Chico",
      Estado: "Realizado"
    };
    Habito_Sincronizar_Items_Plan_Slot(
      "2026-04-24",
      [],
      [Item_Media_Hora],
      "Plan_Slot_Item",
      10
    );

    Config.Duracion_Default = 0.25;
    Config.Duracion_Grilla_Eventos = 0.25;
    const Item_Cuarto_Hora = {
      Id: "Plan_Cuarto_Hora",
      Tipo: "Habito",
      Habito_Id: "Habito_Tiempo_Chico",
      Estado: "Realizado"
    };
    Habito_Sincronizar_Items_Plan_Slot(
      "2026-04-24",
      [],
      [Item_Cuarto_Hora],
      "Plan_Slot_Item",
      10.5
    );

    return Habitos_Registros
      .map((Registro) => ({
        Fuente: Registro.Fuente,
        Fuente_Id: Registro.Fuente_Id,
        Cantidad: Registro.Cantidad,
        Unidad: Registro.Unidad,
        Hora: Registro.Hora
      }))
      .sort((A, B) =>
        `${A.Fuente}-${A.Fuente_Id}`.localeCompare(
          `${B.Fuente}-${B.Fuente_Id}`
        )
      );
  });

  expect(resultado).toEqual([
    {
      Fuente: "Evento",
      Fuente_Id: "Evento_Cuarto_Hora",
      Cantidad: 15,
      Unidad: "min",
      Hora: "09:30"
    },
    {
      Fuente: "Evento",
      Fuente_Id: "Evento_Media_Hora",
      Cantidad: 30,
      Unidad: "min",
      Hora: "09:00"
    },
    {
      Fuente: "Plan_Slot_Item",
      Fuente_Id: "Plan_Cuarto_Hora",
      Cantidad: 15,
      Unidad: "min",
      Hora: "10:30"
    },
    {
      Fuente: "Plan_Slot_Item",
      Fuente_Id: "Plan_Media_Hora",
      Cantidad: 30,
      Unidad: "min",
      Hora: "10:00"
    }
  ]);
});
