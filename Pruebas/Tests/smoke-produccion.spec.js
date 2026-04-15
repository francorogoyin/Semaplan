const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const ARCHIVO_AUTH_DEFAULT = path.join(
  process.cwd(),
  "Pruebas",
  "Playwright",
  ".auth",
  "semaplan-patricio.json"
);
const ARCHIVO_AUTH =
  process.env.SEMAPLAN_AUTH_FILE ||
  ARCHIVO_AUTH_DEFAULT;
const BASE_URL =
  process.env.SEMAPLAN_BASE_URL ||
  "https://semaplan.com";

test.use({
  baseURL: BASE_URL,
  storageState: fs.existsSync(ARCHIVO_AUTH)
    ? ARCHIVO_AUTH
    : { cookies: [], origins: [] }
});

test("smoke de producción", async ({ page }) => {
  test.skip(
    !fs.existsSync(ARCHIVO_AUTH),
    "Falta la sesión real. Corré npm run auth:semaplan."
  );

  const Marca = `Smoke ${Date.now()}`;

  await page.goto("/", {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  await page.waitForFunction(() => {
    return typeof window.Inicializar === "function" &&
      window.Cargando_Inicial === false &&
      Boolean(window.Semana_Actual);
  }, null, { timeout: 120000 });

  await expect(page.locator("#Archivero_Boton")).toBeVisible();
  await expect(page.locator("#Baul_Boton")).toBeVisible();
  await expect(page.locator("#Ayuda_Boton")).toBeVisible();

  await page.evaluate(async (Nombre) => {
    const Semana = Clave_Semana_Actual();
    const Objetivo = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre,
        Descripcion_Corta: "Smoke producción",
        Emoji: "🧪",
        Color: "#7aa7ff",
        Horas_Semanales: 1,
        Es_Bolsa: false,
        Categoria_Id: null,
        Etiquetas_Ids: []
      },
      Semana
    );
    Objetivo_Seleccionada_Id = Objetivo.Id;
    Objetivo.Nombre = `${Nombre} editado`;
    Objetivo.Color = "#5e8f5e";
    const Sub_Id = Agregar_Subobjetivo_Semana(
      Objetivo,
      "Semana"
    );
    const Lista = Obtener_Subobjetivos_Semana(
      Objetivo,
      true
    );
    const Sub = Lista.find((Item) => Item.Id === Sub_Id);
    if (Sub) {
      Sub.Texto = "Subobjetivo smoke";
    }
    Render_Emojis();
    Render_Resumen_Objetivo();
    Guardar_Estado();
    await Forzar_Sync_Inmediato_Cambio_Critico();
  }, Marca);

  await page.waitForFunction(() => {
    return window.Sync_Estado === "Guardado" &&
      window.Hay_Sync_Pendiente() === false;
  }, null, { timeout: 120000 });

  await page.locator("#Baul_Boton").click();
  await expect(page.locator("#Baul_Overlay")).toHaveClass(/Activo/);
  await page.keyboard.press("Escape");

  await page.locator("#Archivero_Boton").click();
  await expect(page.locator("#Archivero_Overlay")).toHaveClass(/Activo/);

  await page.evaluate((Nombre) => {
    const Cajon = (Archiveros || []).find((Item) => {
      return String(Item?.Nombre || "").trim() === "Semaplan";
    });
    if (!Cajon) {
      throw new Error("No existe el cajón Semaplan");
    }
    const Nota = {
      Id: Crear_Id(),
      Cajon_Id: Cajon.Id,
      Titulo: Nombre,
      Contenido: "Nota smoke",
      Color: null,
      Etiquetas: ["Smoke"]
    };
    Notas_Archivero.unshift(Nota);
    Render_Archivero();
    Guardar_Estado();
  }, Marca);

  await page.locator("#Ayuda_Boton").click();
  await expect(page.locator("#Ayuda_Overlay")).toHaveClass(/Activo/);

  await page.evaluate(async (Nombre) => {
    Usuario_Actual = Usuario_Actual || {
      id: "smoke",
      email: "smoke@example.com"
    };
    Abrir_Ayuda_Consulta();
    document.getElementById("Ayuda_Consulta_Asunto").value = Nombre;
    document.getElementById("Ayuda_Consulta_Mensaje").value =
      "Consulta smoke pre lanzamiento";
    await Enviar_Ayuda_Consulta();
  }, Marca);

  await page.evaluate(async (Nombre) => {
    const Objetivo = (Objetivos || []).find((Item) =>
      String(Item?.Nombre || "").startsWith(Nombre)
    );
    if (Objetivo) {
      await Borrar_Objetivo(Objetivo.Id);
    }
    Notas_Archivero = (Notas_Archivero || []).filter((Nota) => {
      return String(Nota?.Titulo || "") !== Nombre;
    });
    Render_Archivero();
    Guardar_Estado();
    await Forzar_Sync_Inmediato_Cambio_Critico();
  }, Marca);

  await page.locator("#Config_Abrir").click();
  await page.locator("#Cfg_Cerrar_Sesion").click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro").click();

  await page.waitForFunction(() => {
    const Auth = document.getElementById("Auth_Overlay");
    return Auth?.classList.contains("Activo");
  }, null, { timeout: 120000 });
});
