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
const EMAIL_OBJETIVO =
  process.env.SEMAPLAN_EMAIL_OBJETIVO ||
  "patricioe.nogueroles@gmail.com";

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

test("categoriza peliculas del baul sin categoria en Cine", async ({
  page
}) => {
  test.skip(
    !fs.existsSync(ARCHIVO_AUTH),
    "Falta la sesion real. Corre npm run auth:semaplan."
  );

  await page.goto(BASE_URL, {
    waitUntil: "domcontentloaded",
    timeout: 120000
  });
  await esperarAppLista(page);
  await esperarSyncEstable(page, 60000, 180000);

  const Email = await page.evaluate(() => {
    return String(Usuario_Actual?.email || "");
  });
  expect(Email).toBe(EMAIL_OBJETIVO);

  const Resultado = await page.evaluate(async () => {
    const Emoji_Cine = "🎬";

    const Normalizar = (Texto) => {
      return (Texto || "")
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
    };

    const Cat_Lista = Array.isArray(Categorias)
      ? Categorias
      : [];
    const Nombre_Cine = "cine";

    let Cat_Cine = Cat_Lista.find((Cat) => {
      return Normalizar(Cat?.Nombre) === Nombre_Cine;
    });
    let Cine_Creada = false;
    if (!Cat_Cine) {
      const Id =
        typeof Crear_Id_Categoria === "function"
          ? Crear_Id_Categoria()
          : `Cat_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      Cat_Cine = {
        Id,
        Emoji: Emoji_Cine,
        Nombre: "Cine",
        Metadatos: []
      };
      Cat_Lista.push(Cat_Cine);
      Cine_Creada = true;
    }

    const Baul = Array.isArray(Baul_Objetivos)
      ? Baul_Objetivos
      : [];
    const Categoria_Existe = (Categoria_Id) => {
      return Cat_Lista.some((Cat) => Cat.Id === Categoria_Id);
    };
    const Es_Sin_Categoria = (Item) => {
      const Id = Item?.Categoria_Id;
      return !Id || !Categoria_Existe(Id);
    };

    const Sin_Categoria_Antes = Baul.filter(Es_Sin_Categoria)
      .length;
    let Actualizados = 0;
    let Emoji_Agregados = 0;

    Baul.forEach((Item) => {
      if (!Item || !Es_Sin_Categoria(Item)) return;

      if (String(Item?.Emoji || "").trim() === "") {
        Item.Emoji = Emoji_Cine;
        Emoji_Agregados += 1;
      }
      Item.Categoria_Id = Cat_Cine.Id;
      Actualizados += 1;
    });

    if (typeof Guardar_Estado === "function") {
      Guardar_Estado();
    }

    return {
      cineCreada: Cine_Creada,
      sinCategoriaAntes: Sin_Categoria_Antes,
      actualizados: Actualizados,
      emojiAgregados: Emoji_Agregados
    };
  });

  await esperarSyncEstable(page, 60000, 180000);

  const Sin_Categoria_Despues = await page.evaluate(() => {
    const Cat_Lista = Array.isArray(Categorias)
      ? Categorias
      : [];
    const Categoria_Existe = (Categoria_Id) => {
      return Cat_Lista.some((Cat) => Cat.Id === Categoria_Id);
    };
    const Es_Sin_Categoria = (Item) => {
      const Id = Item?.Categoria_Id;
      return !Id || !Categoria_Existe(Id);
    };
    const Baul = Array.isArray(Baul_Objetivos)
      ? Baul_Objetivos
      : [];
    return Baul.filter(Es_Sin_Categoria).length;
  });

  console.log(
    JSON.stringify(
      {
        ...Resultado,
        sinCategoriaDespues: Sin_Categoria_Despues
      },
      null,
      2
    )
  );
  expect(Sin_Categoria_Despues).toBe(0);
});

