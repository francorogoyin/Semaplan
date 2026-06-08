const { test, expect } = require("@playwright/test");

async function Preparar(page, Idioma = "es") {
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

  await page.addInitScript((Idioma_Seleccionado) => {
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
    localStorage.setItem("Semaplan_Idioma", Idioma_Seleccionado);
    localStorage.removeItem("Semaplan_Estado_V2");
  }, Idioma);

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Abrir_Decoteca === "function" &&
    typeof Render_Decoteca === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    Inicializar();
    Config.Plan_Actual = "Upgrade";
    Suscripcion_Remota = true;
    Config.Menu_Estilo = "Iconos";
    Config.Menu_Botones_Visibles.Decoteca_Boton = true;
    Aplicar_Estilo_Menu();
  });
}

async function Abrir_Decoteca(page) {
  const Boton = page.locator("#Decoteca_Boton");
  if (await Boton.isVisible()) {
    await Boton.click();
  } else {
    await page.evaluate(() => Abrir_Decoteca());
  }
  await expect(page.locator("#Decoteca_Overlay"))
    .toHaveClass(/Activo/);
}

async function Limpiar_Filtros(page) {
  await page.locator("#Decoteca_Buscar_Input").fill("");
  await page.locator("#Decoteca_Filtro_Estado")
    .selectOption("Todos");
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Todos");
  await page.locator("#Decoteca_Filtro_Formato")
    .selectOption("Todos");
}

test("decoteca abre tecas con tarjetas verticales y detalle propio", async ({
  page
}) => {
  await Preparar(page);

  await Abrir_Decoteca(page);

  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Biblioteca");
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Musicoteca");
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Videoteca");

  const proporcion = await page.evaluate(() => {
    const Card = document.querySelector(
      ".Decoteca_Card_Caratula"
    );
    const Rect = Card?.getBoundingClientRect();
    if (!Rect) return null;
    return Rect.height / Rect.width;
  });
  expect(proporcion).not.toBeNull();
  expect(proporcion).toBeGreaterThan(1.35);

  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Partes");

  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Videoteca");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Director");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Plataforma");

  await page.locator("#Decoteca_Filtro_Estado")
    .selectOption("Terminada");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("La ciénaga");
  await expect(page.locator("#Decoteca_Grilla"))
    .not.toContainText("Stalker");

  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nueva obra");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Duración");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Plataforma");

  await page.keyboard.press("Escape");
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
});

test("decoteca responde a controles, filtros y botones", async ({
  page
}) => {
  const Errores_Pagina = [];
  page.on("pageerror", (Error) => {
    Errores_Pagina.push(Error.message);
  });

  await Preparar(page);
  await Abrir_Decoteca(page);

  const Casos = [
    {
      teca: "Biblioteca",
      titulo: "Biblioteca",
      busqueda: "foucault",
      resultado: "Vigilar y castigar",
      estado: "Planeada",
      periodo: "Trimestre",
      formato: "Ensayo",
      campos: ["Autor", "Partes y capítulos", "Total y avance"]
    },
    {
      teca: "Musicoteca",
      titulo: "Musicoteca",
      busqueda: "radiohead",
      resultado: "In Rainbows",
      estado: "En_Curso",
      periodo: "Semana",
      formato: "Álbum",
      campos: ["Artista", "Álbum, EP o playlist", "Escuchas"]
    },
    {
      teca: "Videoteca",
      titulo: "Videoteca",
      busqueda: "martel",
      resultado: "La ciénaga",
      estado: "Terminada",
      periodo: "Mes",
      formato: "Película",
      campos: ["Director", "Duración", "Plataforma"]
    },
    {
      teca: "Ludoteca",
      titulo: "Ludoteca",
      busqueda: "disco",
      resultado: "Disco Elysium",
      estado: "En_Curso",
      periodo: "Trimestre",
      formato: "RPG",
      campos: ["Tipo propio", "Sesiones, partidas o avance"]
    }
  ];

  for (const Caso of Casos) {
    await page.locator(`[data-decoteca-teca="${Caso.teca}"]`).click();
    await Limpiar_Filtros(page);

    await expect(page.locator("#Decoteca_Libreria_Titulo"))
      .toHaveText(Caso.titulo);
    await expect(page.locator(`[data-decoteca-teca="${Caso.teca}"]`))
      .toHaveAttribute("aria-pressed", "true");

    await page.locator("#Decoteca_Buscar_Input")
      .fill(Caso.busqueda);
    await expect(page.locator("#Decoteca_Grilla"))
      .toContainText(Caso.resultado);

    await page.locator("#Decoteca_Filtro_Estado")
      .selectOption(Caso.estado);
    await expect(page.locator("#Decoteca_Grilla"))
      .toContainText(Caso.resultado);

    await page.locator("#Decoteca_Filtro_Periodo")
      .selectOption(Caso.periodo);
    await expect(page.locator("#Decoteca_Grilla"))
      .toContainText(Caso.resultado);

    await page.locator("#Decoteca_Filtro_Formato")
      .selectOption(Caso.formato);
    await expect(page.locator("#Decoteca_Grilla"))
      .toContainText(Caso.resultado);

    await page.locator("#Decoteca_Nueva").click();
    await expect(page.locator("#Decoteca_Detalle"))
      .toContainText("Nueva obra");
    for (const Campo of Caso.campos) {
      await expect(page.locator("#Decoteca_Detalle"))
        .toContainText(Campo);
    }
  }

  await page.locator('[data-decoteca-teca="Biblioteca"]').click();
  await Limpiar_Filtros(page);

  await page.locator("#Decoteca_Buscar_Input")
    .fill("obra inexistente zzz");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("No hay obras con esos filtros.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Elegí una obra");

  await page.locator("#Decoteca_Buscar_Input").fill("");
  await page.locator("#Decoteca_Vista_Periodos").click();
  await expect(page.locator("#Decoteca_Vista_Periodos"))
    .toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Junio 2026");
  await page.locator("#Decoteca_Vista_Catalogo").click();
  await expect(page.locator("#Decoteca_Vista_Catalogo"))
    .toHaveAttribute("aria-pressed", "true");

  await page.locator('[data-decoteca-obra="dec_bib_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");

  await page.locator('[data-decoteca-accion="Editar"]').click();
  await expect(page.locator("#Undo_Contenedor"))
    .toContainText("La edición real de fichas");

  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await expect(page.locator("#Undo_Contenedor"))
    .toContainText("La carga de carátulas");

  await page.locator("#Decoteca_Teca_Nueva").click();
  await expect(page.locator("#Undo_Contenedor"))
    .toContainText("La creación de tecas nuevas");

  await page.locator("#Decoteca_Cerrar").click();
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
  await Abrir_Decoteca(page);
  await page.keyboard.press("Escape");
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
  expect(Errores_Pagina).toEqual([]);
});

test("decoteca traduce campos de alta en ingles", async ({ page }) => {
  await Preparar(page, "en");
  await Abrir_Decoteca(page);

  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Name of the work");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Period, objective and rhythm");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Nombre de la obra");

  await page.locator('[data-decoteca-teca="Musicoteca"]').click();
  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Album, EP or playlist");
});

test("decoteca traduce campos de alta en portugues", async ({ page }) => {
  await Preparar(page, "pt");
  await Abrir_Decoteca(page);
  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nome da obra");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Periodo, objetivo e ritmo");
});

test("decoteca mobile no recorta el detalle", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await Preparar(page);
  await Abrir_Decoteca(page);

  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await page.locator("#Decoteca_Vista_Periodos").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Stalker");

  const Medidas = await page.evaluate(() => {
    const Detalle = document.getElementById("Decoteca_Detalle");
    const Cuerpo = document.querySelector(".Decoteca_Cuerpo");
    const Fila_Tecas = document.querySelector(".Decoteca_Tecas_Fila");
    const Teca_Activa = document.querySelector(
      '[data-decoteca-teca="Videoteca"]'
    );
    const Barra = document.querySelector(".Decoteca_Barra_Superior");
    const Rect_Fila = Fila_Tecas?.getBoundingClientRect();
    const Rect_Teca = Teca_Activa?.getBoundingClientRect();
    const Rect_Barra = Barra?.getBoundingClientRect();
    return {
      Detalle_Alto: Detalle?.getBoundingClientRect().height || 0,
      Detalle_Scroll: Detalle?.scrollHeight || 0,
      Cuerpo_Overflow: getComputedStyle(Cuerpo).overflowY,
      Teca_Fila_Alto: Rect_Fila?.height || 0,
      Teca_Activa_Alto: Rect_Teca?.height || 0,
      Teca_Fila_Bottom: Rect_Fila?.bottom || 0,
      Barra_Top: Rect_Barra?.top || 0
    };
  });

  expect(Medidas.Cuerpo_Overflow).toBe("auto");
  expect(Medidas.Teca_Fila_Alto)
    .toBeGreaterThanOrEqual(Medidas.Teca_Activa_Alto);
  expect(Medidas.Teca_Fila_Bottom)
    .toBeLessThanOrEqual(Medidas.Barra_Top);
  expect(Medidas.Detalle_Alto)
    .toBeGreaterThanOrEqual(Medidas.Detalle_Scroll - 2);
});
