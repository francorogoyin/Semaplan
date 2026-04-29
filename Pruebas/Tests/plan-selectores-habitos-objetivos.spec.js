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
    typeof Abrir_Modal_Plan_Slot === "function" &&
    typeof Abrir_Modal_Abordaje === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    Inicializar();
    Semana_Actual = Parsear_Fecha_ISO("2026-05-04");
    Config.Dias_Visibles = [0, 1];
    Config.Inicio_Hora = 8;
    Config.Fin_Hora = 12;
    Objetivos = [
      {
        Id: "obj_bloque",
        Nombre: "Bloque base",
        Emoji: "\u{1F9ED}",
        Color: "#1f6b4f",
        Horas_Semanales: 2,
        Semana_Base: "2026-05-04",
        Es_Bolsa: false,
        Subobjetivos_Semanales: { "2026-05-04": [] },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {}
      },
      {
        Id: "obj_extra",
        Nombre: "Proyecto extra",
        Emoji: "\u{1F4CC}",
        Color: "#9b2040",
        Horas_Semanales: 2,
        Semana_Base: "2026-05-04",
        Es_Bolsa: false,
        Subobjetivos_Semanales: { "2026-05-04": [] },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {}
      }
    ];
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
      })
    ];
    Habitos_Registros = [];
    Eventos = [
      {
        Id: "ev_bloque",
        Objetivo_Id: "obj_bloque",
        Fecha: "2026-05-05",
        Inicio: 10,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: "#1f6b4f"
      }
    ];
    Planes_Slot = {};
    Slots_Muertos = [];
    Slots_Muertos_Tipos = {};
  });
}

test("slots y bloques agregan habitos y objetivos con desplegables",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    Abrir_Modal_Plan_Slot("2026-05-04", 9);
    const Plan_Habito = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="habito"]'
    );
    const Plan_Habito_Select = Plan_Habito.querySelector("select");
    Plan_Habito_Select.value = "hab_lectura";
    Plan_Habito.querySelector("button").click();

    const Plan_Objetivo = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="objetivo"]'
    );
    const Plan_Objetivo_Select = Plan_Objetivo.querySelector("select");
    Plan_Objetivo_Select.value = "obj_extra";
    Plan_Objetivo.querySelector("button").click();
    const Items_Slot = Plan_Slot_Borrador.map((Item) => ({
      Tipo: Item.Tipo,
      Habito_Id: Item.Habito_Id || "",
      Objetivo_Id: Item.Objetivo_Id || "",
      Texto: Item.Texto
    }));
    Cerrar_Modal_Plan_Slot();

    const Clave_Muerto = Clave_Slot("2026-05-04", 11);
    Slots_Muertos = [Clave_Muerto];
    Slots_Muertos_Tipos[Clave_Muerto] = "Sueno";
    Abrir_Modal_Plan_Slot("2026-05-04", 11);
    const Muerto_Habito = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="habito"]'
    );
    const Muerto_Habito_Select = Muerto_Habito.querySelector("select");
    Muerto_Habito_Select.value = "hab_lectura";
    Muerto_Habito.querySelector("button").click();

    const Muerto_Objetivo = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="objetivo"]'
    );
    const Muerto_Objetivo_Select =
      Muerto_Objetivo.querySelector("select");
    Muerto_Objetivo_Select.value = "obj_extra";
    Muerto_Objetivo.querySelector("button").click();
    const Items_Slot_Muerto = Plan_Slot_Borrador.map((Item) => ({
      Tipo: Item.Tipo,
      Habito_Id: Item.Habito_Id || "",
      Objetivo_Id: Item.Objetivo_Id || "",
      Texto: Item.Texto
    }));
    Cerrar_Modal_Plan_Slot();

    Abrir_Modal_Abordaje("ev_bloque");
    const Bloque_Habito = document.querySelector(
      '#Abordaje_Modal_Cuerpo [data-plan-select="habito"]'
    );
    const Bloque_Habito_Select = Bloque_Habito.querySelector("select");
    Bloque_Habito_Select.value = "hab_lectura";
    Bloque_Habito.querySelector("button").click();

    const Bloque_Objetivo = document.querySelector(
      '#Abordaje_Modal_Cuerpo [data-plan-select="objetivo"]'
    );
    const Bloque_Objetivo_Select = Bloque_Objetivo.querySelector("select");
    Bloque_Objetivo_Select.value = "obj_extra";
    Bloque_Objetivo.querySelector("button").click();
    const Items_Bloque = Abordaje_Borrador
      .filter((Item) => Item.Suelta)
      .map((Item) => ({
        Tipo: Item.Tipo,
        Habito_Id: Item.Habito_Id || "",
        Objetivo_Id: Item.Objetivo_Id || "",
        Texto: Item.Texto,
        Planeada: Boolean(Item.Planeada)
      }));
    return { Items_Slot, Items_Slot_Muerto, Items_Bloque };
  });

  expect(resultado.Items_Slot).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Objetivo_Id: "",
      Texto: "Lectura"
    },
    {
      Tipo: "Objetivo",
      Habito_Id: "",
      Objetivo_Id: "obj_extra",
      Texto: "Proyecto extra"
    }
  ]);
  expect(resultado.Items_Slot_Muerto).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Objetivo_Id: "",
      Texto: "Lectura"
    },
    {
      Tipo: "Objetivo",
      Habito_Id: "",
      Objetivo_Id: "obj_extra",
      Texto: "Proyecto extra"
    }
  ]);
  expect(resultado.Items_Bloque).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Objetivo_Id: "",
      Texto: "Lectura",
      Planeada: true
    },
    {
      Tipo: "Objetivo",
      Habito_Id: "",
      Objetivo_Id: "obj_extra",
      Texto: "Proyecto extra",
      Planeada: true
    }
  ]);
});

test("los objetivos de un plan de slot pasan al bloque",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    Planes_Slot[Clave_Slot("2026-05-05", 10)] = {
      Items: [
        Crear_Item_Habito_Plan_Slot(Habito_Por_Id("hab_lectura")),
        Crear_Item_Objetivo_Plan_Slot(Objetivo_Por_Id("obj_extra"))
      ]
    };
    Abrir_Modal_Abordaje("ev_bloque");
    return Abordaje_Borrador
      .filter((Item) => Item.Suelta)
      .map((Item) => ({
        Tipo: Item.Tipo,
        Habito_Id: Item.Habito_Id || "",
        Objetivo_Id: Item.Objetivo_Id || "",
        Texto: Item.Texto,
        Planeada: Boolean(Item.Planeada)
      }));
  });

  expect(resultado).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Objetivo_Id: "",
      Texto: "Lectura",
      Planeada: true
    },
    {
      Tipo: "Objetivo",
      Habito_Id: "",
      Objetivo_Id: "obj_extra",
      Texto: "Proyecto extra",
      Planeada: true
    }
  ]);
});
