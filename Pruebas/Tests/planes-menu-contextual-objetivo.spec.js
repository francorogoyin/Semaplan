const { test, expect } = require("@playwright/test");

function Crear_Estado() {
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
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
      Ocultar_Dias_Automatico: "Ninguno",
      Slots_Muertos_Default: {},
      Agrupar_Por_Categorias: false,
      Globito_Activo: true,
      Globito_Modo: "Horas",
      Globito_Posicion: "Arriba",
      Meta_Notificaciones_Activas: false,
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
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true,
        Patron_Boton: true,
        Limpiar_Semana_Boton: true,
        Ayuda_Boton: true,
        Logout_Boton: true
      },
      Plan_Actual: "Upgrade",
      Backup_Auto_Activo: false,
      Backup_Auto_Horas: 24,
      Backup_Auto_Inicio: "",
      Backup_Auto_Ultimo: "",
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
    Planes_Semana: {},
    Planes_Periodo: {}
  };
}

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
  await page.addInitScript((estadoInicial) => {
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
      JSON.stringify(estadoInicial)
    );
  }, Crear_Estado());

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("menu contextual de objetivo agrupa acciones y usa textos cortos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Periodo = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Proyecto menu",
      Target_Total: 10,
      Unidad: "Horas"
    });
    Render_Plan();
  });

  await page.locator(".Planes_Objetivo_Card").first()
    .click({ button: "right" });

  const Menu = page.locator(".Planes_Context_Menu");
  await expect(Menu).toBeVisible();

  const Textos = await Menu.locator("button").evaluateAll((Botones) =>
    Botones.map((Boton) => Boton.textContent.trim())
  );

  expect(Textos).toEqual([
    "Editar",
    "Pausar",
    "Ocultar",
    "Copiar",
    "Mover",
    "Trasladar",
    "Ver subobjetivos",
    "Ver avances",
    "Registrar avance",
    "Cambiar estado",
    "Eliminar"
  ]);
  await expect(Menu.getByRole("button", { name: "Pegar objetivo" }))
    .toHaveCount(0);
  await expect(Menu.getByRole("button", { name: "Editar objetivo" }))
    .toHaveCount(0);
  await expect(Menu.getByRole("button", { name: "Copiar objetivo" }))
    .toHaveCount(0);
  await expect(Menu.getByRole("button", {
    name: "Administrar subobjetivos"
  })).toHaveCount(0);
  await expect(Menu.locator(".Planes_Context_Menu_Separador"))
    .toHaveCount(4);

  const Tarjeta = page.locator(".Planes_Objetivo_Card").first();
  await expect(Tarjeta.locator(".Planes_Objetivo_Estado"))
    .toHaveCount(0);
  await expect(Tarjeta.locator(".Planes_Objetivo_Ritmo"))
    .toHaveCount(1);

  await Menu.getByRole("button", { name: "Copiar" }).click();
  await page.locator("#Plan_Cuerpo").dispatchEvent("contextmenu", {
    button: 2,
    clientX: 240,
    clientY: 240,
    bubbles: true,
    cancelable: true
  });
  await expect(Menu).toBeVisible();
  await expect(Menu.getByRole("button", { name: "Pegar objetivo" }))
    .toBeVisible();
  await expect(Menu.getByRole("button", { name: "Editar" }))
    .toHaveCount(0);
  await expect(Menu.locator(".Planes_Context_Menu_Separador"))
    .toHaveCount(0);

  await page.locator(".Planes_Objetivo_Card").first()
    .click({ button: "right" });
  await Menu.getByRole("button", { name: "Ver avances" }).click();
  await expect(page.locator("#Planes_Registro_Overlay"))
    .toHaveClass(/Activo/);
  expect(errores).toEqual([]);
});

test("mover y trasladar objetivos ofrecen destino aunque haya un solo anio",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.UI.Anio_Desde = 2026;
    Modelo.UI.Anio_Hasta = 2026;
    Modelo.UI.Anio_Activo = 2026;
    Modelo.UI.Filtro_Tipo = "Anio";
    const Periodo = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    Modelo.UI.Periodo_Activo_Id = Periodo.Id;
    Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Proyecto mover",
      Target_Total: 10,
      Unidad: "Horas"
    });
    Planes_Crear_Objetivo_Silencioso(Periodo.Id, {
      Nombre: "Proyecto trasladar",
      Target_Total: 10,
      Unidad: "Horas"
    });
    Render_Plan();
  });

  await page.locator(".Planes_Objetivo_Card", {
    hasText: "Proyecto mover"
  }).click({ button: "right" });
  await page.locator(".Planes_Context_Menu")
    .getByRole("button", { name: "Mover" })
    .click();
  await page.locator("#Dialogo_Botones")
    .getByRole("button", { name: "2027" })
    .click();
  await page.locator("#Dialogo_Botones")
    .getByRole("button", { name: "Mover" })
    .click();

  await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.UI.Periodo_Activo_Id = Object.values(Modelo.Periodos)
      .find((Periodo) => Periodo.Inicio === "2026-01-01")?.Id;
    Render_Plan();
  });

  await page.locator(".Planes_Objetivo_Card", {
    hasText: "Proyecto trasladar"
  }).click({ button: "right" });
  await page.locator(".Planes_Context_Menu")
    .getByRole("button", { name: "Trasladar" })
    .click();
  await page.locator("#Dialogo_Botones")
    .getByRole("button", { name: "2027" })
    .click();
  await page.locator("#Dialogo_Botones")
    .getByRole("button", { name: "Borrar realizadas" })
    .click();

  const Resultado = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    const Objetivos = Object.values(Modelo.Objetivos);
    const Mover = Objetivos.find((Objetivo) =>
      Objetivo.Nombre === "Proyecto mover"
    );
    const Trasladados = Objetivos.filter((Objetivo) =>
      Objetivo.Nombre === "Proyecto trasladar"
    );
    const Periodo_Mover = Modelo.Periodos[Mover?.Periodo_Id || ""];
    const Periodos_Trasladados = Trasladados.map((Objetivo) =>
      Modelo.Periodos[Objetivo.Periodo_Id]?.Inicio
    ).sort();
    return {
      moverInicio: Periodo_Mover?.Inicio || "",
      trasladados: Periodos_Trasladados
    };
  });

  expect(Resultado).toEqual({
    moverInicio: "2027-01-01",
    trasladados: ["2026-01-01", "2027-01-01"]
  });
  expect(errores).toEqual([]);
});
