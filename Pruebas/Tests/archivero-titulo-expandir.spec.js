const { test, expect } = require("@playwright/test");

async function preparar(page, estadoInicial) {
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
    "https://challenges.cloudflare.com/turnstile/" +
    "v0/api.js?render=explicit",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.addInitScript((estado) => {
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
      JSON.stringify(estado)
    );
  }, estadoInicial);

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
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
    Render_Archivero();
  });
}

function estadoBase() {
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
    Archiveros: [
      {
        Id: "c1",
        Nombre: "Semaplan",
        Emoji: "🗃️",
        Fecha_Creacion: 1
      }
    ],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Archivero_Seleccion_Id: "c1",
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Plan_Actual: "Premium",
      Menu_Botones_Visibles: {
        Archivero_Boton: true
      }
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

test("guarda titulo y alterna expansion en notas largas", async ({
  page
}) => {
  await preparar(page, estadoBase());

  const Cuerpo_Largo = Array.from(
    { length: 16 },
    (_, Indice) => `- ingrediente ${Indice + 1}`
  ).join("\n");

  await page.click("#Archivero_Btn_Nueva_Nota");
  await expect(
    page.locator("#Archivero_Nota_Titulo_Input")
  ).toBeVisible();
  await page.fill(
    "#Archivero_Nota_Titulo_Input",
    "Budin de soja"
  );
  await page.fill(
    "#Archivero_Nota_Texto_Input",
    Cuerpo_Largo
  );
  await page.click("#Archivero_Nota_Guardar");

  await expect(page.locator(".Archivero_Nota_Card"))
    .toHaveCount(1);

  await expect.poll(async () => {
    return page.evaluate(() => {
      const Card = document.querySelector(
        ".Archivero_Nota_Card"
      );
      const Texto = Card?.querySelector(
        ".Archivero_Nota_Texto"
      );
      return {
        titulo: document.querySelector(
          ".Archivero_Nota_Titulo_Nota"
        )?.textContent || "",
        guardado: Notas_Archivero[0]?.Titulo || "",
        colapsada: Card?.classList.contains("Colapsada") || false,
        expandida: Card?.getAttribute("aria-expanded") || "",
        desborde:
          Card?.classList.contains("Tiene_Desborde") || false,
        truncada: Texto
          ? Texto.scrollHeight > Texto.clientHeight + 2
          : false
      };
    });
  }).toEqual({
    titulo: "Budin de soja",
    guardado: "Budin de soja",
    colapsada: true,
    expandida: "false",
    desborde: true,
    truncada: true
  });

  await page.click(".Archivero_Nota_Card");

  await expect.poll(async () => {
    return page.evaluate(() => {
      const Card = document.querySelector(
        ".Archivero_Nota_Card"
      );
      const Texto = Card?.querySelector(
        ".Archivero_Nota_Texto"
      );
      return {
        colapsada: Card?.classList.contains("Colapsada") || false,
        expandida: Card?.getAttribute("aria-expanded") || "",
        truncada: Texto
          ? Texto.scrollHeight > Texto.clientHeight + 2
          : false
      };
    });
  }).toEqual({
    colapsada: false,
    expandida: "true",
    truncada: false
  });

  await page.click(".Archivero_Nota_Card");

  await expect.poll(async () => {
    return page.evaluate(() => {
      const Card = document.querySelector(
        ".Archivero_Nota_Card"
      );
      const Texto = Card?.querySelector(
        ".Archivero_Nota_Texto"
      );
      return {
        colapsada: Card?.classList.contains("Colapsada") || false,
        expandida: Card?.getAttribute("aria-expanded") || "",
        truncada: Texto
          ? Texto.scrollHeight > Texto.clientHeight + 2
          : false
      };
    });
  }).toEqual({
    colapsada: true,
    expandida: "false",
    truncada: true
  });
});
