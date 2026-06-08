const { test, expect } = require("@playwright/test");

async function Preparar(page, Idioma = "es", Opciones = {}) {
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

  await page.route(
    "https://example.com/decoteca-portada.png",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0l" +
          "EQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
          "base64"
        )
      });
    }
  );

  await page.addInitScript((Config_Test) => {
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
    localStorage.setItem("Semaplan_Idioma", Config_Test.Idioma);
    if (Config_Test.Limpiar_Estado) {
      localStorage.removeItem("Semaplan_Estado_V2");
    }
  }, {
    Idioma,
    Limpiar_Estado: Opciones.Limpiar_Estado !== false
  });

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

async function Activar_App(page) {
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

  await expect(page.locator(".Decoteca_Panel"))
    .toHaveAttribute("role", "dialog");
  await expect(page.locator(".Decoteca_Panel"))
    .toHaveAttribute("aria-modal", "true");
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
    .toContainText("Director");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Progreso");

  await page.locator("#Decoteca_Cerrar").click();
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
      campos: ["Autor", "Nombre del período", "Metadatos"]
    },
    {
      teca: "Musicoteca",
      titulo: "Musicoteca",
      busqueda: "radiohead",
      resultado: "In Rainbows",
      estado: "En_Curso",
      periodo: "Semana",
      formato: "Álbum",
      campos: ["Artista", "Nombre del período", "Metadatos"]
    },
    {
      teca: "Videoteca",
      titulo: "Videoteca",
      busqueda: "martel",
      resultado: "La ciénaga",
      estado: "Terminada",
      periodo: "Mes",
      formato: "Película",
      campos: ["Director", "Nombre del período", "Metadatos"]
    },
    {
      teca: "Ludoteca",
      titulo: "Ludoteca",
      busqueda: "disco",
      resultado: "Disco Elysium",
      estado: "En_Curso",
      periodo: "Trimestre",
      formato: "RPG",
      campos: ["Creador", "Nombre del período", "Metadatos"]
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
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Editá la ficha");

  await page.locator('[data-decoteca-cancelar="true"]').click();
  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Texto de portada");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Tipo de portada");

  await page.locator('[data-decoteca-cancelar="true"]').click();
  await page.locator("#Decoteca_Teca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nueva teca");

  await page.locator("#Decoteca_Cerrar").click();
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
  await Abrir_Decoteca(page);
  await page.locator("#Decoteca_Buscar_Input").focus();
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
    .toContainText("Edit the sheet");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Period name");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Nombre del período");

  await page.locator('[data-decoteca-teca="Musicoteca"]').click();
  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Artist");
});

test("decoteca traduce campos de alta en portugues", async ({ page }) => {
  await Preparar(page, "pt");
  await Abrir_Decoteca(page);
  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Edite a ficha");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nome do periodo");
});

test("decoteca crea edita portada y persiste", async ({ page }) => {
  await Preparar(page, "es", { Limpiar_Estado: false });
  await Abrir_Decoteca(page);

  await page.locator("#Decoteca_Teca_Nueva").click();
  await page.locator("#Decoteca_Form_Teca_Nombre")
    .fill("Ensayoteca");
  await page.locator("#Decoteca_Form_Teca_Descripcion")
    .fill("Ensayos, papers y notas largas");
  await page.locator("#Decoteca_Form_Teca_Icono").fill("🧪");
  await page.locator("#Decoteca_Form_Teca_Color").fill("#235a6f");
  await page.locator('[data-decoteca-form="Teca"] .Primario')
    .click();

  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Ensayoteca");
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Ensayoteca");

  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Cuaderno de pruebas");
  await page.locator("#Decoteca_Form_Creador")
    .fill("Equipo Semaplan");
  await page.locator("#Decoteca_Form_Anio").fill("2026");
  await page.locator("#Decoteca_Form_Formato").fill("Ensayo");
  await page.locator("#Decoteca_Form_Estado")
    .selectOption("En_Curso");
  await page.locator("#Decoteca_Form_Periodo")
    .selectOption("Mes");
  await page.locator("#Decoteca_Form_Periodo_Label")
    .fill("Julio 2026");
  await page.locator("#Decoteca_Form_Progreso").fill("15");
  await page.locator("#Decoteca_Form_Meta")
    .fill("15 / 100 páginas");
  await page.locator("#Decoteca_Form_Rating").fill("Pendiente");
  await page.locator("#Decoteca_Form_Plan")
    .fill("Revisar dos secciones por semana.");
  await page.locator("#Decoteca_Form_Subobjetivos")
    .fill("Hipótesis\nDesarrollo\nCierre");
  await page.locator("#Decoteca_Form_Metadatos")
    .fill("Tema: Decoteca\nFuente: QA");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();

  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Cuaderno de pruebas");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("15%");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Hipótesis");

  await page.locator('[data-decoteca-accion="Editar"]').click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Cuaderno editado");
  await page.locator("#Decoteca_Form_Progreso").fill("55");
  await page.locator("#Decoteca_Form_Plan")
    .fill("Cerrar el ensayo y pasar notas al Archivero.");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();

  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Cuaderno editado");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("55%");

  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await page.locator("#Decoteca_Form_Portada_Tipo")
    .selectOption("Url");
  await page.locator("#Decoteca_Form_Portada_Url")
    .fill("https://example.com/decoteca-portada.png");
  await page.locator("#Decoteca_Form_Portada_Emoji").fill("🧪");
  await page.locator("#Decoteca_Form_Portada_Texto")
    .fill("Ensayo Vivo");
  await page.locator("#Decoteca_Form_Color").fill("#123456");
  await expect(page.locator("#Decoteca_Form_Preview img"))
    .toHaveAttribute("src", /decoteca-portada\.png/);
  await page.locator('[data-decoteca-form="Caratula"] .Primario')
    .click();

  await expect(page.locator(".Decoteca_Caratula_Imagen").first())
    .toHaveAttribute("src", /decoteca-portada\.png/);

  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await page.locator("#Decoteca_Form_Portada_Tipo")
    .selectOption("Archivo");
  await page.locator("#Decoteca_Form_Portada_Archivo")
    .setInputFiles({
      name: "portada-decoteca.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0l" +
        "EQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
        "base64"
      )
    });
  await expect(page.locator("#Decoteca_Form_Preview img"))
    .toHaveAttribute("src", /^data:image\/png;base64,/);
  await page.locator('[data-decoteca-form="Caratula"] .Primario')
    .click();
  await expect(page.locator(".Decoteca_Caratula_Imagen").first())
    .toHaveAttribute("src", /^data:image\/png;base64,/);

  const Estado_Antes = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem(Clave_Local)).Decoteca;
  });
  expect(Estado_Antes.Tecas.some((Teca) =>
    Teca.Nombre === "Ensayoteca"
  )).toBeTruthy();
  expect(Estado_Antes.Obras.some((Obra) =>
    Obra.Titulo === "Cuaderno editado" &&
    Obra.Portada_Texto === "Ensayo Vivo" &&
    Obra.Portada_Tipo === "Archivo" &&
    String(Obra.Portada_Data_Url || "").startsWith("data:image/png") &&
    Obra.Progreso === 55
  )).toBeTruthy();

  await page.reload();
  await Activar_App(page);
  await Abrir_Decoteca(page);
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Ensayoteca");
  await page.locator(".Decoteca_Teca_Btn")
    .filter({ hasText: "Ensayoteca" })
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Cuaderno editado");
  await expect(page.locator(".Decoteca_Caratula_Imagen").first())
    .toHaveAttribute("src", /^data:image\/png;base64,/);
});

test("decoteca edita borra tecas y obras con confirmacion", async ({
  page
}) => {
  await Preparar(page);
  await Abrir_Decoteca(page);

  await expect(page.locator("#Decoteca_Teca_Editar"))
    .toHaveCount(0);

  await page.locator("#Decoteca_Teca_Nueva").click();
  await page.locator("#Decoteca_Form_Teca_Nombre")
    .fill("Cineteca QA");
  await page.locator("#Decoteca_Form_Teca_Descripcion")
    .fill("Seccion temporal de verificacion");
  await page.locator("#Decoteca_Form_Teca_Icono").fill("Q");
  await page.locator("#Decoteca_Form_Teca_Color").fill("#4b6f8f");
  await page.locator('[data-decoteca-form="Teca"] .Primario')
    .click();
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Cineteca QA");

  await page.locator("#Decoteca_Teca_Editar").click();
  await page.locator("#Decoteca_Form_Teca_Nombre")
    .fill("Cineteca QA editada");
  await page.locator("#Decoteca_Form_Teca_Descripcion")
    .fill("Seccion temporal editada");
  await page.locator("#Decoteca_Form_Teca_Color").fill("#7a3f5a");
  await page.locator('[data-decoteca-form="Teca"] .Primario')
    .click();
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Cineteca QA editada");

  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Obra para borrar");
  await page.locator("#Decoteca_Form_Creador").fill("QA");
  await page.locator("#Decoteca_Form_Formato").fill("Pelicula");
  await page.locator("#Decoteca_Form_Progreso").fill("10");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Obra para borrar");

  await page.locator('[data-decoteca-accion="Borrar"]').click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Secundario")
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Obra para borrar");

  await page.locator('[data-decoteca-accion="Borrar"]').click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .not.toContainText("Obra para borrar");

  await page.locator("#Decoteca_Teca_Editar").click();
  await page.locator('[data-decoteca-borrar-teca="true"]').click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();
  await expect(page.locator("#Decoteca_Tecas"))
    .not.toContainText("Cineteca QA editada");

  await page.locator("#Decoteca_Teca_Nueva").click();
  await page.locator("#Decoteca_Form_Teca_Nombre")
    .fill("Teca mover QA");
  await page.locator("#Decoteca_Form_Teca_Icono").fill("M");
  await page.locator("#Decoteca_Form_Teca_Color").fill("#235a6f");
  await page.locator('[data-decoteca-form="Teca"] .Primario')
    .click();
  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Obra movible QA");
  await page.locator("#Decoteca_Form_Formato").fill("Ensayo");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();
  await page.locator("#Decoteca_Teca_Editar").click();
  await page.locator('[data-decoteca-borrar-teca="true"]').click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Primario")
    .click();
  await expect(page.locator("#Decoteca_Tecas"))
    .not.toContainText("Teca mover QA");
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Biblioteca");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Obra movible QA");

  const Estado = await page.evaluate(() =>
    JSON.parse(localStorage.getItem(Clave_Local)).Decoteca
  );
  expect(Estado.Tecas.some((Teca) =>
    Teca.Nombre === "Cineteca QA editada" ||
    Teca.Nombre === "Teca mover QA"
  )).toBeFalsy();
  expect(Estado.Obras.some((Obra) =>
    Obra.Titulo === "Obra para borrar"
  )).toBeFalsy();
  expect(Estado.Obras.some((Obra) =>
    Obra.Titulo === "Obra movible QA" &&
    Obra.Teca_Id === "Biblioteca"
  )).toBeTruthy();
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
