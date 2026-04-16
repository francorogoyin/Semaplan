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
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
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
      { Id: "c1", Nombre: "Semaplan", Emoji: "A" }
    ],
    Notas_Archivero: [],
    Etiquetas_Archivero: [],
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

test("guarda adjuntos y permite descargarlos", async ({ page }) => {
  await preparar(page, estadoBase());

  await page.click("#Archivero_Btn_Nueva_Nota");
  await page.fill(
    "#Archivero_Nota_Texto_Input",
    "Nota con adjunto"
  );
  await page.locator("#Archivero_Nota_Adjuntos_Input")
    .setInputFiles({
      name: "resumen.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Contenido")
    });

  await expect(
    page.locator(".Archivero_Adjunto_Item")
  ).toContainText(["resumen.txt"]);
  await page.click("#Archivero_Nota_Guardar");

  const adjunto = await page.evaluate(() => {
    return Notas_Archivero[0]?.Adjuntos?.[0] || null;
  });
  expect(adjunto.Nombre).toBe("resumen.txt");
  expect(adjunto.Tamano).toBe(9);
  expect(adjunto.Datos_Base64)
    .toBe(Buffer.from("Contenido").toString("base64"));

  const boton = page.locator(
    ".Archivero_Nota_Card .Archivero_Nota_Adjunto_Btn"
  );
  await expect(boton).toContainText("resumen.txt");
  const descarga = page.waitForEvent("download");
  await boton.click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toBe("resumen.txt");
});

test("bloquea adjuntos que superan 1 mb por nota", async ({
  page
}) => {
  await preparar(page, estadoBase());

  await page.click("#Archivero_Btn_Nueva_Nota");
  const input = page.locator("#Archivero_Nota_Adjuntos_Input");
  await input.setInputFiles({
    name: "base.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(700 * 1024, 1)
  });
  await expect(page.locator(".Archivero_Adjunto_Item"))
    .toHaveCount(1);

  await input.setInputFiles({
    name: "extra.bin",
    mimeType: "application/octet-stream",
    buffer: Buffer.alloc(400 * 1024, 1)
  });
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("superar 1 MB en total");
  await page.locator(
    "#Dialogo_Botones .Dialogo_Boton_Primario"
  ).click();
  await expect(page.locator(".Archivero_Adjunto_Item"))
    .toHaveCount(1);
});
