const { test, expect } = require("@playwright/test");

test("permite seleccionar y copiar una nota completa del archivero", async ({
  page
}) => {
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
    window.__Texto_Copiado_Archivero = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(Texto) {
          window.__Texto_Copiado_Archivero = Texto;
          return Promise.resolve();
        }
      }
    });
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
            Etiquetas: ["Inmediata", "UX"],
            Origen: "https://semaplan.com"
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
    Render_Archivero_Notas();
  });

  const estilos = await page.evaluate(() => {
    const Texto = document.querySelector(
      ".Archivero_Nota_Texto"
    );
    const Meta = document.querySelector(
      ".Archivero_Nota_Meta"
    );
    return {
      texto: Texto
        ? window.getComputedStyle(Texto).userSelect
        : "",
      meta: Meta
        ? window.getComputedStyle(Meta).userSelect
        : ""
    };
  });

  expect(estilos.texto).toBe("text");
  expect(estilos.meta).toBe("text");

  const seleccion = await page.evaluate(() => {
    const Card = document.querySelector(
      ".Archivero_Nota_Card"
    );
    if (!Card) return null;
    const Original = window.getSelection;
    Object.defineProperty(window, "getSelection", {
      configurable: true,
      value() {
        return {
          toString() {
            return "Nota visible";
          }
        };
      }
    });
    Card.dispatchEvent(new MouseEvent("click", {
      bubbles: true
    }));
    Object.defineProperty(window, "getSelection", {
      configurable: true,
      value: Original
    });
    return {
      activa: Card.classList.contains("Activa")
    };
  });

  expect(seleccion).toEqual({ activa: false });

  await page.evaluate(() => {
    window.getSelection()?.removeAllRanges();
    const Meta = document.querySelector(
      ".Archivero_Nota_Meta"
    );
    Meta?.dispatchEvent(new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true
    }));
  });

  await expect.poll(async () => {
    return page.evaluate(() =>
      window.__Texto_Copiado_Archivero
    );
  }).toBe(
    "Nota visible\n\nhttps://semaplan.com\n\n#Inmediata #UX"
  );

  await expect(page.locator(".Undo_Toast_Texto").first())
    .toHaveText("Nota copiada");
});
