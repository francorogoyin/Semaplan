const { test, expect } = require("@playwright/test");

test.use({
  viewport: { width: 412, height: 839 },
  hasTouch: true,
  isMobile: true
});

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
      Menu_Estilo: "Hamburguesa",
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
      Version_Programa: "Demo",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
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

async function Preparar(page, estado) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/" +
    "supabase-js@2",
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
  }, estado);

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
  });
}

async function Pulsar_Largo_Touch(page, selector) {
  const Caja = await page.locator(selector).boundingBox();
  if (!Caja) {
    throw new Error(`No se encontro ${selector}`);
  }
  const X = Math.round(Caja.x + Caja.width / 2);
  const Y = Math.round(Caja.y + Caja.height / 2);
  const Datos = { selector, X, Y };

  await page.evaluate(({ selector, X, Y }) => {
    const El = document.querySelector(selector);
    if (!El) throw new Error(`No existe ${selector}`);
    const Touch_1 = new Touch({
      identifier: 1,
      target: El,
      clientX: X,
      clientY: Y,
      pageX: X + window.scrollX,
      pageY: Y + window.scrollY,
      screenX: X,
      screenY: Y,
      radiusX: 2,
      radiusY: 2,
      force: 1
    });
    El.dispatchEvent(new TouchEvent("touchstart", {
      touches: [Touch_1],
      targetTouches: [Touch_1],
      changedTouches: [Touch_1],
      bubbles: true,
      cancelable: true
    }));
  }, Datos);

  await page.waitForTimeout(460);

  await page.evaluate(({ selector, X, Y }) => {
    const El = document.querySelector(selector);
    if (!El) throw new Error(`No existe ${selector}`);
    const Touch_1 = new Touch({
      identifier: 1,
      target: El,
      clientX: X,
      clientY: Y,
      pageX: X + window.scrollX,
      pageY: Y + window.scrollY,
      screenX: X,
      screenY: Y,
      radiusX: 2,
      radiusY: 2,
      force: 1
    });
    El.dispatchEvent(new TouchEvent("touchend", {
      touches: [],
      targetTouches: [],
      changedTouches: [Touch_1],
      bubbles: true,
      cancelable: true
    }));
  }, Datos);
}

async function Abrir_Objetivos_Compactos(page) {
  await page.click("#Sidebar_Compacta_Boton");
  await expect(
    page.locator("#Sidebar_Compacta_Overlay")
  ).toHaveClass(/Activo/);
}

test(
  "permite flujo touch para crear y gestionar bloques",
  async ({ page }) => {
    await Preparar(page, Crear_Estado());

    const Objetivo_Id = await page.evaluate(() => {
      const Objetivo = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "QA tap temp",
          Emoji: "🧪",
          Color: "#1f6b4f",
          Es_Bolsa: false
        },
        Clave_Semana_Actual()
      );
      Render_Emojis();
      return Objetivo.Id;
    });

    await Abrir_Objetivos_Compactos(page);
    await page.click(
      `#Barra_Emojis button[data-objetivo-id="${Objetivo_Id}"]`
    );

    const Estado_Touch = await page.evaluate(() => {
      return {
        Sidebar_Compacta: document.getElementById(
          "Sidebar_Compacta_Overlay"
        )?.classList.contains("Activo"),
        Overlay: document.getElementById(
          "Objetivo_Modal_Overlay"
        )?.classList.contains("Activo"),
        Modo_Touch: document.body.classList.contains(
          "Modo_Touch_Asignar"
        ),
        Armado: Objetivo_Touch_Para_Bloque_Id,
        Seleccionado: Objetivo_Seleccionada_Id
      };
    });

    expect(Estado_Touch.Overlay).toBeFalsy();
    expect(Estado_Touch.Sidebar_Compacta).toBeFalsy();
    expect(Estado_Touch.Modo_Touch).toBeTruthy();
    expect(Estado_Touch.Armado).toBe(Objetivo_Id);
    expect(Estado_Touch.Seleccionado).toBeNull();

    await page.click(
      '.Slot[data-fecha="2026-04-15"][data-hora="14"]'
    );

    await expect(page.locator(".Evento")).toHaveCount(1);
    await expect(
      page.locator(".Evento .Evento_Nombre_Texto")
    ).toHaveText("QA tap temp");

    await page.click(".Evento");
    await expect(
      page.locator("#Dia_Accion_Menu")
    ).toHaveClass(/Activo/);
  }
);

test(
  "permite menu touch prolongado y reordenar objetivos",
  async ({ page }) => {
    await Preparar(page, Crear_Estado());

    const Objetivos_Ids = await page.evaluate(() => {
      const Base = [
        { Nombre: "Uno", Emoji: "1️⃣" },
        { Nombre: "Dos", Emoji: "2️⃣" },
        { Nombre: "Tres", Emoji: "3️⃣" }
      ];
      return Base.map((Item) =>
        Crear_Objetivo_Semanal_Con_Datos(
          {
            Nombre: Item.Nombre,
            Emoji: Item.Emoji,
            Color: "#1f6b4f",
            Es_Bolsa: false
          },
          Clave_Semana_Actual()
        ).Id
      );
    });

    await page.evaluate(() => {
      Render_Emojis();
    });

    await Abrir_Objetivos_Compactos(page);
    const Selector =
      `#Barra_Emojis button[data-objetivo-id="${Objetivos_Ids[1]}"]`;
    await Pulsar_Largo_Touch(page, Selector);

    await expect(
      page.locator("#Dia_Accion_Menu")
    ).toHaveClass(/Activo/);
    await expect(
      page.locator(
        '#Dia_Accion_Menu [data-acc="mover-arriba"]'
      )
    ).toBeVisible();
    await expect(
      page.locator(
        '#Dia_Accion_Menu [data-acc="mover-abajo"]'
      )
    ).toBeVisible();

    const Estado_Menu = await page.evaluate(() => ({
      Armado: Objetivo_Touch_Para_Bloque_Id,
      Seleccionado: Objetivo_Seleccionada_Id
    }));

    expect(Estado_Menu.Armado).toBeNull();
    expect(Estado_Menu.Seleccionado).toBeNull();

    await page.click(
      '#Dia_Accion_Menu [data-acc="mover-arriba"]'
    );

    const Orden = await page.evaluate(() =>
      Objetivos.slice(0, 3).map((Objetivo) => Objetivo.Nombre)
    );

    expect(Orden).toEqual(["Dos", "Uno", "Tres"]);
  }
);
