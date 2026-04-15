const fs = require("fs");
const path = require("path");
const { test, expect } = require("@playwright/test");

const ARCHIVO_AUTH_DEFAULT = path.join(
  process.cwd(),
  "Pruebas",
  "Playwright",
  ".auth",
  "semaplan-smoke.json"
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

async function esperarSyncEstable(
  page,
  timeout = 30000,
  timeoutReintento = 120000
) {
  const Esperar = async (Tiempo) => {
    await page.waitForFunction(() => {
      return Sync_Estado === "Guardado" &&
        Hay_Sync_Pendiente() === false;
    }, null, { timeout: Tiempo });
  };

  try {
    await Esperar(timeout);
    return;
  } catch (Error) {
    const Reintentar = page.locator(
      "#Sync_Reintentar_Btn"
    );
    if (!(await Reintentar.isVisible().catch(() => false))) {
      throw Error;
    }
    await Reintentar.click();
    await Esperar(timeoutReintento);
  }
}

test("smoke de produccion", async ({ page }) => {
  test.skip(
    !fs.existsSync(ARCHIVO_AUTH),
    "Falta la sesion real. Corre npm run auth:semaplan."
  );

  const Marca = `Smoke ${Date.now()}`;

  await page.goto(BASE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });

  await page.waitForSelector("#Archivero_Boton", {
    timeout: 120000
  });
  await page.waitForFunction(() => {
    const Loader = document.getElementById("App_Loader");
    const Auth = document.getElementById("Auth_Overlay");
    return Loader?.classList.contains("Oculto") &&
      !Auth?.classList.contains("Activo");
  }, null, { timeout: 120000 });

  await page.evaluate(() => {
    if (
      typeof Aplicar_Estilo_Menu === "function" &&
      typeof Config === "object" &&
      Config
    ) {
      Config.Menu_Estilo = "Iconos";
      Aplicar_Estilo_Menu();
    }
  });

  await page.waitForFunction(() => {
    return (
      typeof Es_Premium === "function" &&
      Es_Premium() === true
    );
  }, null, { timeout: 120000 });

  await expect(page.locator("#Archivero_Boton")).toBeVisible();
  await expect(page.locator("#Baul_Boton")).toBeVisible();
  await expect(page.locator("#Ayuda_Boton")).toBeVisible();

  await page.evaluate(async (Nombre) => {
    const Semana = Clave_Semana_Actual();
    const Objetivo = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre,
        Descripcion_Corta: "Smoke produccion",
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

  await esperarSyncEstable(page, 120000, 120000);

  await page.evaluate(() => {
    if (typeof Limpiar_Seleccion === "function") {
      Limpiar_Seleccion();
    }
  });

  await page.locator("#Baul_Boton").click();
  await expect(page.locator("#Baul_Overlay"))
    .toHaveClass(/Activo/);
  await page.keyboard.press("Escape");

  await page.locator("#Archivero_Boton").click();
  await expect(page.locator("#Archivero_Overlay"))
    .toHaveClass(/Activo/);

  await page.evaluate((Nombre) => {
    Inicializar_Archiveros_Default();
    const Cajon =
      Archiveros.find((Item) => {
        return String(Item?.Nombre || "").trim() ===
          "Semaplan";
      }) ||
      Archiveros[0] ||
      null;
    if (!Cajon) {
      throw new Error("No existe ningun cajon disponible");
    }
    Registrar_Etiquetas_Archivero(["Smoke"]);
    Notas_Archivero.unshift({
      Id: Generar_Id_Archivero(),
      Archivero_Id: Cajon.Id,
      Titulo: Nombre,
      Texto: "Nota smoke",
      Origen: "Smoke produccion",
      Etiquetas: ["Smoke"],
      Color_Fondo: "",
      Tipo: "Texto",
      Fecha_Creacion: Date.now()
    });
    Archivero_Seleccion_Id = Cajon.Id;
    Render_Archivero();
    Guardar_Estado();
  }, Marca);

  await page.keyboard.press("Escape");
  await expect(page.locator("#Archivero_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.locator("#Ayuda_Boton").click();
  await expect(page.locator("#Ayuda_Overlay"))
    .toHaveClass(/Activo/);

  await page.locator("#Ayuda_Consulta_Btn").click();
  await expect(page.locator("#Ayuda_Consulta_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator("#Ayuda_Consulta_Asunto").fill(Marca);
  await page.locator("#Ayuda_Consulta_Mensaje").fill(
    "Consulta smoke pre lanzamiento"
  );
  await page.locator("#Ayuda_Consulta_Enviar").click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator(
    "#Dialogo_Botones .Dialogo_Boton_Primario"
  ).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#Ayuda_Consulta_Overlay"))
    .not.toHaveClass(/Activo/);
  await page.keyboard.press("Escape");
  await expect(page.locator("#Ayuda_Overlay"))
    .not.toHaveClass(/Activo/);

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

  try {
    await esperarSyncEstable(page, 10000, 10000);
  } catch (_) {}

  await page.locator("#Config_Abrir").click();
  await page.locator("#Cfg_Cerrar_Sesion").click();
  await page.waitForSelector("#Dialogo_Botones button", {
    timeout: 10000
  });
  if (
    await page.locator(
      "#Dialogo_Botones .Dialogo_Boton_Peligro"
    ).count() === 0
  ) {
    await page.locator(
      "#Dialogo_Botones .Dialogo_Boton_Primario"
    ).click();
    await page.evaluate(async () => {
      if (typeof Reintentar_Sync_Manual === "function") {
        await Reintentar_Sync_Manual();
        return;
      }
      if (
        typeof Forzar_Sync_Inmediato_Cambio_Critico ===
        "function"
      ) {
        await Forzar_Sync_Inmediato_Cambio_Critico();
      }
    });
    await esperarSyncEstable(page, 15000, 15000);
    await page.locator("#Cfg_Cerrar_Sesion").click();
    await page.waitForSelector(
      "#Dialogo_Botones .Dialogo_Boton_Peligro",
      { timeout: 10000 }
    );
  }
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();

  await page.waitForFunction(() => {
    const Auth = document.getElementById("Auth_Overlay");
    return Auth?.classList.contains("Activo");
  }, null, { timeout: 120000 });
});
