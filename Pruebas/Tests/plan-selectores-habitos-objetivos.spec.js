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
    Tareas = [
      Normalizar_Tarea({
        Tipo_Dato: "Tarea",
        Id: "tar_mismo_horario",
        Nombre: "Tarea dentro del horario",
        Emoji: "\u{1F4DD}",
        Estado: "pendiente",
        Fecha: "2026-05-04",
        Hora: "09:00"
      }),
      Normalizar_Tarea({
        Tipo_Dato: "Tarea",
        Id: "tar_sin_horario",
        Nombre: "Tarea sin horario",
        Emoji: "\u{1F4E5}",
        Estado: "pendiente"
      }),
      Normalizar_Tarea({
        Tipo_Dato: "Tarea",
        Id: "tar_otro_horario",
        Nombre: "Tarea de otro horario",
        Emoji: "\u{1F552}",
        Estado: "pendiente",
        Fecha: "2026-05-04",
        Hora: "10:00"
      }),
      Normalizar_Tarea({
        Tipo_Dato: "Tarea",
        Id: "tar_bloque",
        Nombre: "Tarea del bloque",
        Emoji: "\u{1F4CC}",
        Estado: "pendiente",
        Fecha: "2026-05-05",
        Hora: "10:00"
      })
    ];
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

test("slots y bloques agregan habitos y tareas con desplegables",
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

    const Plan_Tarea = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="tarea"]'
    );
    const Plan_Tarea_Select = Plan_Tarea.querySelector("select");
    const Orden_Tareas_Slot = Array.from(Plan_Tarea_Select.options)
      .map((Option) => Option.value)
      .filter(Boolean);
    Plan_Tarea_Select.value = "tar_mismo_horario";
    Plan_Tarea.querySelector("button").click();
    const Items_Slot = Plan_Slot_Borrador.map((Item) => ({
      Tipo: Item.Tipo,
      Habito_Id: Item.Habito_Id || "",
      Tarea_Id: Item.Tarea_Id || "",
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

    const Muerto_Tarea = document.querySelector(
      '#Plan_Slot_Cuerpo [data-plan-select="tarea"]'
    );
    const Muerto_Tarea_Select =
      Muerto_Tarea.querySelector("select");
    Muerto_Tarea_Select.value = "tar_sin_horario";
    Muerto_Tarea.querySelector("button").click();
    const Items_Slot_Muerto = Plan_Slot_Borrador.map((Item) => ({
      Tipo: Item.Tipo,
      Habito_Id: Item.Habito_Id || "",
      Tarea_Id: Item.Tarea_Id || "",
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

    const Bloque_Tarea = document.querySelector(
      '#Abordaje_Modal_Cuerpo [data-plan-select="tarea"]'
    );
    const Bloque_Tarea_Select = Bloque_Tarea.querySelector("select");
    Bloque_Tarea_Select.value = "tar_bloque";
    Bloque_Tarea.querySelector("button").click();
    const Items_Bloque = Abordaje_Borrador
      .filter((Item) => Item.Suelta)
      .map((Item) => ({
        Tipo: Item.Tipo,
        Habito_Id: Item.Habito_Id || "",
        Tarea_Id: Item.Tarea_Id || "",
        Texto: Item.Texto,
        Planeada: Boolean(Item.Planeada)
      }));
    return {
      Orden_Tareas_Slot,
      Items_Slot,
      Items_Slot_Muerto,
      Items_Bloque
    };
  });

  expect(resultado.Orden_Tareas_Slot).toEqual([
    "tar_mismo_horario",
    "tar_sin_horario",
    "tar_otro_horario",
    "tar_bloque"
  ]);
  expect(resultado.Items_Slot).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Tarea_Id: "",
      Texto: "Lectura"
    },
    {
      Tipo: "Tarea",
      Habito_Id: "",
      Tarea_Id: "tar_mismo_horario",
      Texto: "Tarea dentro del horario"
    }
  ]);
  expect(resultado.Items_Slot_Muerto).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Tarea_Id: "",
      Texto: "Lectura"
    },
    {
      Tipo: "Tarea",
      Habito_Id: "",
      Tarea_Id: "tar_sin_horario",
      Texto: "Tarea sin horario"
    }
  ]);
  expect(resultado.Items_Bloque).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Tarea_Id: "",
      Texto: "Lectura",
      Planeada: true
    },
    {
      Tipo: "Tarea",
      Habito_Id: "",
      Tarea_Id: "tar_bloque",
      Texto: "Tarea del bloque",
      Planeada: true
    }
  ]);
});

test("las tareas de un plan de slot pasan al bloque",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    Planes_Slot[Clave_Slot("2026-05-05", 10)] = {
      Items: [
        Crear_Item_Habito_Plan_Slot(Habito_Por_Id("hab_lectura")),
        Crear_Item_Tarea_Plan_Slot(Tarea_Por_Id("tar_bloque"))
      ]
    };
    Abrir_Modal_Abordaje("ev_bloque");
    return Abordaje_Borrador
      .filter((Item) => Item.Suelta)
      .map((Item) => ({
        Tipo: Item.Tipo,
        Habito_Id: Item.Habito_Id || "",
        Tarea_Id: Item.Tarea_Id || "",
        Texto: Item.Texto,
        Planeada: Boolean(Item.Planeada)
      }));
  });

  expect(resultado).toEqual([
    {
      Tipo: "Habito",
      Habito_Id: "hab_lectura",
      Tarea_Id: "",
      Texto: "Lectura",
      Planeada: true
    },
    {
      Tipo: "Tarea",
      Habito_Id: "",
      Tarea_Id: "tar_bloque",
      Texto: "Tarea del bloque",
      Planeada: true
    }
  ]);
});

test("guardar tareas en planes sincroniza el vinculo de la tarea",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    const Clave = Clave_Slot("2026-05-04", 9);
    Abrir_Modal_Plan_Slot("2026-05-04", 9);
    Agregar_Tarea_A_Plan_Slot("tar_mismo_horario");
    await Guardar_Modal_Plan_Slot();

    const Tarea_Slot = Tarea_Por_Id("tar_mismo_horario");
    const Despues_Slot = {
      fecha: Tarea_Slot.Fecha,
      hora: Tarea_Slot.Hora,
      planeada: Tarea_Slot.Planeada,
      planClave: Tarea_Slot.Plan_Clave,
      planItem: Boolean(Tarea_Slot.Plan_Item_Id),
      itemsSlot: (Planes_Slot[Clave]?.Items || [])
        .map((Item) => Item.Tarea_Id || "")
    };

    Abrir_Modal_Abordaje("ev_bloque");
    Agregar_Tarea_A_Abordaje("tar_mismo_horario");
    await Guardar_Modal_Abordaje();

    const Tarea_Bloque = Tarea_Por_Id("tar_mismo_horario");
    const Evento = Evento_Por_Id("ev_bloque");
    return {
      Despues_Slot,
      Despues_Bloque: {
        fecha: Tarea_Bloque.Fecha,
        hora: Tarea_Bloque.Hora,
        planeada: Tarea_Bloque.Planeada,
        eventoId: Tarea_Bloque.Evento_Id,
        abordajeId: Boolean(Tarea_Bloque.Abordaje_Id),
        planClave: Tarea_Bloque.Plan_Clave,
        itemsSlot: (Planes_Slot[Clave]?.Items || [])
          .map((Item) => Item.Tarea_Id || ""),
        itemsBloque: (Evento.Abordaje || [])
          .map((Item) => Item.Tarea_Id || "")
      }
    };
  });

  expect(resultado.Despues_Slot).toEqual({
    fecha: "2026-05-04",
    hora: "09:00",
    planeada: true,
    planClave: "2026-05-04|9",
    planItem: true,
    itemsSlot: ["tar_mismo_horario"]
  });
  expect(resultado.Despues_Bloque).toEqual({
    fecha: "2026-05-05",
    hora: "10:00",
    planeada: true,
    eventoId: "ev_bloque",
    abordajeId: true,
    planClave: "",
    itemsSlot: [],
    itemsBloque: ["tar_mismo_horario"]
  });
});
