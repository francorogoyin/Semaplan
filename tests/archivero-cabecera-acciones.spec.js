const { test, expect } = require("@playwright/test");

async function preparar(page) {
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
    window.alert = () => {};
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify({
        Tareas: [],
        Eventos: [],
        Metas: [],
        Slots_Muertos: [],
        Plantillas_Subtareas: [],
        Planes_Slot: {},
        Categorias: [],
        Etiquetas: [],
        Baul_Tareas: [],
        Baul_Grupos_Colapsados: {},
        Archiveros: [
          {
            Id: "ARC_1",
            Nombre: "Semaplan",
            Emoji: "🗃️",
            Fecha_Creacion: 1
          }
        ],
        Notas_Archivero: [
          {
            Id: "NOTA_1",
            Archivero_Id: "ARC_1",
            Texto: "Nota visible",
            Tipo: "Texto",
            Fecha_Creacion: Date.now(),
            Fecha_Actualizacion: Date.now(),
            Etiquetas: [],
            Origen: ""
          }
        ],
        Patrones: [],
        Contador_Eventos: 1,
        Tarea_Seleccionada_Id: null,
        Modo_Editor_Abierto: false,
        Inicio_Semana: "2026-04-13",
        Duracion_Defecto: 1,
        Config_Extra: {},
        Tipos_Slot: [],
        Tipos_Slot_Inicializados: false,
        Slots_Muertos_Tipos: {},
        Slots_Muertos_Nombres: {},
        Abordajes_Migrados_V1: true,
        Semanas_Con_Defaults: [],
        Planes_Semana: {},
        Archivero_Seleccion_Id: "ARC_1"
      })
    );
  });

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Archivero_Seleccion_Id = "ARC_1";
    Abrir_Archivero();
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
  });
}

test("usa acciones sobrias en la cabecera del archivero", async ({
  page
}) => {
  await preparar(page);

  const Selectores = [
    "#Archivero_Btn_Nueva_Nota",
    "#Archivero_Btn_Gestionar_Etiquetas",
    "#Archivero_Btn_Exportar_Cajon"
  ];

  for (const Selector of Selectores) {
    const estilos = await page.locator(Selector).evaluate((el) => {
      const Css = window.getComputedStyle(el);
      return {
        borderTop: Css.borderTopWidth,
        fondo: Css.backgroundColor,
        peso: Css.fontWeight,
        radio: Css.borderRadius
      };
    });

    expect(estilos.borderTop).toBe("0px");
    expect(estilos.fondo).toBe("rgba(0, 0, 0, 0)");
    expect(Number(estilos.peso)).toBeGreaterThanOrEqual(700);
    expect(estilos.radio).toBe("0px");
  }

  const Acciones = await page.evaluate(() => {
    const Cont = document.querySelector(
      ".Archivero_Acciones"
    );
    const Botones = Array.from(
      Cont?.querySelectorAll("button") || []
    );
    const Gap = Cont
      ? window.getComputedStyle(Cont).gap
      : "";
    return {
      textos: Botones.map((Boton) =>
        (Boton.textContent || "").trim()
      ),
      gap: Gap
    };
  });

  expect(Acciones.textos).toEqual([
    "Exportar",
    "#",
    "+"
  ]);
  expect(Acciones.gap).toBe("20px");

  const Regla_Hover = await page.evaluate(() => {
    for (const Hoja of Array.from(document.styleSheets)) {
      let Reglas = [];
      try {
        Reglas = Array.from(Hoja.cssRules || []);
      } catch (_) {
        continue;
      }
      const Regla = Reglas.find((Item) =>
        Item.selectorText ===
          ".Archivero_Btn_Nueva_Nota_Icono:hover"
      );
      if (Regla) {
        return Regla.cssText;
      }
    }
    return "";
  });

  expect(Regla_Hover).toContain("color: var(--Acento)");
});
