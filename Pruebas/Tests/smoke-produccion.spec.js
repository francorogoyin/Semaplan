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
test.setTimeout(300000);

async function esperarSyncEstable(
  page,
  timeout = 30000,
  timeoutReintento = 120000
) {
  const Esperar = async (Tiempo, Detectar_Reintento) => {
    const Resultado = await page.waitForFunction(
      (Permitir_Reintento) => {
        const Esta_Guardado =
          Sync_Estado === "Guardado" &&
          Hay_Sync_Pendiente() === false;
        if (Esta_Guardado) {
          return "guardado";
        }

        const Reintentar = document.getElementById(
          "Sync_Reintentar_Btn"
        );
        const Puede_Reintentar =
          Permitir_Reintento &&
          Reintentar &&
          !Reintentar.hidden &&
          Reintentar.offsetParent !== null;
        return Puede_Reintentar ? "reintentar" : false;
      },
      Detectar_Reintento,
      { timeout: Tiempo }
    );
    return await Resultado.jsonValue();
  };

  const Estado = await Esperar(timeout, true);
  if (Estado === "guardado") {
    return;
  }

  await page.evaluate(async () => {
    if (typeof Reintentar_Sync_Manual === "function") {
      await Reintentar_Sync_Manual();
      return;
    }

    document.getElementById("Sync_Reintentar_Btn")
      ?.click();
  });
  await Esperar(timeoutReintento, false);
}

async function esperarAppLista(page) {
  await page.waitForSelector("#Archivero_Boton", {
    timeout: 120000
  });

  const Bloqueo = page.locator("#Sesion_Bloqueo_Overlay.Activo");
  if (await Bloqueo.count()) {
    await page.locator("#Sesion_Bloqueo_Cerrar_Otras").click();
    await expect(Bloqueo).toHaveCount(0, { timeout: 120000 });
  }

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
}

async function recargarSinEstadoLocal(page) {
  await page.evaluate(() => {
    [
      "Semaplan_Estado_V2",
      "Semaplan_Estado_V2_staging",
      "Time_Blocking_Estado_V2",
      "Time_Blocking_Estado_V2_staging"
    ].forEach((Clave) => {
      localStorage.removeItem(Clave);
    });
  });

  await page.reload({
    waitUntil: "domcontentloaded",
    timeout: 120000
  });
  await esperarAppLista(page);
}

async function validarPersistenciaRemota(page, Marca) {
  await page.waitForFunction((Nombre) => {
    const Objetivo = (Objetivos || []).find((Item) => {
      return String(Item?.Nombre || "") ===
        `${Nombre} editado`;
    });
    if (!Objetivo) {
      return false;
    }

    const Subs = Obtener_Subobjetivos_Semana(
      Objetivo,
      true
    );
    const Tiene_Sub = Subs.some((Sub) => {
      return String(Sub?.Texto || "") === "Subobjetivo smoke";
    });
    const Tiene_Nota = (Notas_Archivero || []).some((Nota) => {
      return String(Nota?.Titulo || "") === Nombre &&
        String(Nota?.Texto || "") === "Nota smoke";
    });
    return Tiene_Sub && Tiene_Nota;
  }, Marca, { timeout: 120000 });
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

  await esperarAppLista(page);

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

  await page.evaluate(async (Nombre) => {
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
    await Forzar_Sync_Inmediato_Cambio_Critico();
  }, Marca);

  await esperarSyncEstable(page, 120000, 120000);
  await recargarSinEstadoLocal(page);
  await validarPersistenciaRemota(page, Marca);

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
});
