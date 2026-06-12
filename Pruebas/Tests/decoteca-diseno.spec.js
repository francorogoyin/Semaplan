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

  const Responder_Imagen_Caratula = async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body:
        '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="540">' +
        '<rect width="360" height="540" fill="#315f6f"/>' +
        '<circle cx="245" cy="120" r="74" fill="#f3efe8" opacity=".72"/>' +
        '<text x="36" y="455" fill="#fff" font-size="42" ' +
        'font-family="Arial" font-weight="700">Cover</text></svg>'
    });
  };

  await page.route(
    "https://covers.openlibrary.org/**",
    Responder_Imagen_Caratula
  );
  await page.route(
    "https://is1-ssl.mzstatic.com/**",
    Responder_Imagen_Caratula
  );
  await page.route(
    "https://commons.wikimedia.org/**",
    Responder_Imagen_Caratula
  );

  await page.route(
    "https://openlibrary.org/search.json**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": "*"
        },
        body: JSON.stringify({
          docs: [
            {
              key: "/works/OL123W",
              title: "Solaris",
              author_name: ["Stanisław Lem"],
              first_publish_year: 1961,
              cover_i: 12345,
              subject: ["Science fiction", "Polish literature"],
              number_of_pages_median: 296,
              editions: {
                docs: [
                  {
                    number_of_pages: 296,
                    covers: [12345],
                    isbn_13: ["9780156027601"]
                  }
                ]
              }
            }
          ]
        })
      });
    }
  );

  await page.route(
    "https://openlibrary.org/works/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": "*"
        },
        body: JSON.stringify({
          description:
            "Descripcion editorial de Solaris con contexto de lectura."
        })
      });
    }
  );

  await page.route(
    "https://ww3.lectulandia.co/**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        headers: {
          "access-control-allow-origin": "*"
        },
        body: "<html><body><main></main></body></html>"
      });
    }
  );

  await page.route(
    "https://itunes.apple.com/search**",
    async (route) => {
      const Url = new URL(route.request().url());
      const Entity = Url.searchParams.get("entity");
      const Result = Entity === "album"
        ? {
          wrapperType: "collection",
          collectionType: "Album",
          collectionId: 7001,
          collectionName: "In Rainbows",
          artistName: "Radiohead",
          releaseDate: "2007-10-10T12:00:00Z",
          trackCount: 10,
          primaryGenreName: "Alternative",
          artworkUrl100:
            "https://is1-ssl.mzstatic.com/image/thumb/Music/in-rainbows/100x100bb.jpg"
        }
        : {
          wrapperType: "track",
          kind: "feature-movie",
          trackName: "Stalker",
          artistName: "Mosfilm",
          releaseDate: "1979-05-25T12:00:00Z",
          trackTimeMillis: 9780000,
          primaryGenreName: "Science Fiction",
          artworkUrl100:
            "https://is1-ssl.mzstatic.com/image/thumb/Video/stalker/100x100bb.jpg"
        };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": "*"
        },
        body: JSON.stringify({
          resultCount: 1,
          results: [Result]
        })
      });
    }
  );

  await page.route(
    "https://itunes.apple.com/lookup**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": "*"
        },
        body: JSON.stringify({
          resultCount: 4,
          results: [
            {
              wrapperType: "collection",
              collectionId: 7001,
              collectionName: "In Rainbows"
            },
            {
              wrapperType: "track",
              collectionId: 7001,
              trackName: "15 Step",
              trackNumber: 1,
              discNumber: 1,
              trackTimeMillis: 237000
            },
            {
              wrapperType: "track",
              collectionId: 7001,
              trackName: "Nude",
              trackNumber: 2,
              discNumber: 1,
              trackTimeMillis: 255000
            },
            {
              wrapperType: "track",
              collectionId: 7001,
              trackName: "Weird Fishes/ Arpeggi",
              trackNumber: 3,
              discNumber: 1,
              trackTimeMillis: 318000
            }
          ]
        })
      });
    }
  );

  await page.route(
    "https://query.wikidata.org/sparql**",
    async (route) => {
      const Url = new URL(route.request().url());
      const Query = Url.searchParams.get("query") || "";
      const Es_Libro = Query.includes("wd:Q571");
      const Body = Es_Libro
        ? {
          head: {
            vars: [
              "item",
              "itemLabel",
              "date",
              "authorLabel",
              "genreLabel",
              "pages",
              "desc"
            ]
          },
          results: {
            bindings: [
              {
                item: {
                  type: "uri",
                  value: "http://www.wikidata.org/entity/Q204708"
                },
                itemLabel: { type: "literal", value: "Solaris" },
                date: {
                  type: "literal",
                  value: "1961-01-01T00:00:00Z"
                },
                authorLabel: {
                  type: "literal",
                  value: "Stanisław Lem"
                },
                genreLabel: {
                  type: "literal",
                  value: "Science fiction"
                },
                pages: { type: "literal", value: "296" }
              }
            ]
          }
        }
        : {
          head: {
            vars: [
              "item",
              "itemLabel",
              "date",
              "directorLabel",
              "genreLabel",
              "runtime",
              "image"
            ]
          },
          results: {
            bindings: [
              {
                item: {
                  type: "uri",
                  value: "http://www.wikidata.org/entity/Q622618"
                },
                itemLabel: { type: "literal", value: "Stalker" },
                date: {
                  type: "literal",
                  value: "1979-05-25T00:00:00Z"
                },
                directorLabel: {
                  type: "literal",
                  value: "Andrei Tarkovsky"
                },
                genreLabel: {
                  type: "literal",
                  value: "Science fiction"
                },
                runtime: { type: "literal", value: "163" },
                image: {
                  type: "uri",
                  value:
                    "http://commons.wikimedia.org/wiki/Special:FilePath/Stalker-poster.jpg"
                }
              },
              {
                item: {
                  type: "uri",
                  value: "http://www.wikidata.org/entity/Q622618"
                },
                itemLabel: { type: "literal", value: "Stalker" },
                genreLabel: { type: "literal", value: "Drama" }
              }
            ]
          }
        };
      await route.fulfill({
        status: 200,
        contentType: "application/sparql-results+json",
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "accept,api-user-agent",
          "access-control-allow-methods": "GET,OPTIONS"
        },
        body: JSON.stringify(Body)
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
  await page.locator("#Decoteca_Filtro_Lista")
    .selectOption("Todas");
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Todos");
  await page.locator("#Decoteca_Filtro_Periodo_Criterio")
    .selectOption("Rango");
  await page.locator("#Decoteca_Filtro_Formato")
    .selectOption("Todos");
}

async function Esperar_Imagen_Cargada(Locator) {
  await expect.poll(async () =>
    Locator.evaluate((Imagen) =>
      Imagen.complete && Imagen.naturalWidth > 0
    )
  ).toBeTruthy();
}

async function Cerrar_Detalle_Decoteca(page) {
  const Detalle = page.locator("#Decoteca_Detalle");
  if (await Detalle.isVisible()) {
    await page.locator("[data-decoteca-detalle-cerrar]").click();
    await expect(Detalle).toBeHidden();
  }
}

async function Esperar_Emoji_Visible(Locator) {
  await expect.poll(async () =>
    Locator.evaluate((El) => {
      const Rect = El.getBoundingClientRect();
      return Boolean(
        El.textContent.trim() ||
        El.querySelector("img") ||
        (Rect.width > 0 && Rect.height > 0)
      );
    })
  ).toBeTruthy();
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
  await expect(page.locator(".Decoteca_Panel"))
    .toHaveAttribute("aria-label", "Decoteca");
  await expect(page.locator(".Decoteca_Hero"))
    .toHaveCount(0);
  await expect(page.locator(".Decoteca_Vistas"))
    .toHaveCount(1);
  await expect(page.locator("#Decoteca_Vista_Catalogo"))
    .toHaveText("Catalogo");
  await expect(page.locator("#Decoteca_Vista_Readlist"))
    .toHaveText("Readlist");
  await expect(page.locator("#Decoteca_Vista_En_Curso"))
    .toHaveText("En curso");
  await expect(page.locator("#Decoteca_Vista_Catalogo"))
    .toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#Decoteca_Periodo_Resumen"))
    .toBeHidden();
  await expect(page.locator("#Decoteca_Nueva"))
    .toHaveText("+");
  await expect(page.locator("#Decoteca_Avance_Abrir"))
    .toHaveAttribute("aria-label", "Registrar avance");
  await expect(page.locator("#Decoteca_Avance_Abrir"))
    .toHaveAttribute("title", "Registrar avance");
  await expect(page.locator("#Decoteca_Avance_Abrir"))
    .not.toContainText("D");
  await Esperar_Emoji_Visible(
    page.locator("#Decoteca_Avance_Abrir .Decoteca_Accion_Emoji")
  );
  await expect(page.locator("#Decoteca_Registro_Abrir"))
    .toHaveAttribute("aria-label", "Registro de avances");
  await expect(page.locator("#Decoteca_Registro_Abrir"))
    .not.toContainText("R");
  await Esperar_Emoji_Visible(
    page.locator("#Decoteca_Registro_Abrir .Decoteca_Accion_Emoji")
  );
  await expect(page.locator("#Decoteca_Nueva"))
    .toHaveAttribute("aria-label", "Nueva obra");
  await expect(page.locator("#Decoteca_Nueva"))
    .toHaveAttribute("title", "Nueva obra");
  await expect(page.locator('[data-decoteca-teca="Biblioteca"]'))
    .toHaveAttribute("aria-label", /Biblioteca/);
  await expect(page.locator('[data-decoteca-teca="Musicoteca"]'))
    .toHaveAttribute("aria-label", /Musicoteca/);
  await expect(page.locator('[data-decoteca-teca="Videoteca"]'))
    .toHaveAttribute("aria-label", /Videoteca/);

  const Tecas_Visual = await page.evaluate(() => {
    const Contenedor = document.getElementById("Decoteca_Tecas");
    const Boton = document.querySelector(
      '[data-decoteca-teca="Biblioteca"]'
    );
    const Icono = Boton?.querySelector(".Decoteca_Teca_Icono");
    const Rect_Boton = Boton?.getBoundingClientRect();
    const Rect_Icono = Icono?.getBoundingClientRect();
    const Estilos = Boton ? getComputedStyle(Boton) : null;
    return {
      Texto: Contenedor?.innerText || "",
      Ancho_Boton: Rect_Boton?.width || 0,
      Alto_Boton: Rect_Boton?.height || 0,
      Ancho_Icono: Rect_Icono?.width || 0,
      Alto_Icono: Rect_Icono?.height || 0,
      Borde: Estilos?.borderTopWidth || "",
      Fondo: Estilos?.backgroundColor || ""
    };
  });
  expect(Tecas_Visual.Texto).not.toContain("Biblioteca");
  expect(Tecas_Visual.Texto).not.toContain("Musicoteca");
  expect(Tecas_Visual.Texto).not.toContain("Videoteca");
  expect(Tecas_Visual.Ancho_Boton).toBeLessThanOrEqual(30);
  expect(Tecas_Visual.Alto_Boton).toBeLessThanOrEqual(30);
  expect(Tecas_Visual.Ancho_Icono).toBeLessThanOrEqual(24);
  expect(Tecas_Visual.Alto_Icono).toBeLessThanOrEqual(24);
  expect(Tecas_Visual.Borde).toBe("0px");
  expect(Tecas_Visual.Fondo).toBe("rgba(0, 0, 0, 0)");

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
    .toBeHidden();
  await expect(page.locator('[data-decoteca-obra="dec_bib_1"]'))
    .not.toHaveClass(/Activa/);

  await page.evaluate(() => {
    const Obra = Decoteca.Obras.find((Item) => Item.Id === "dec_bib_1");
    Obra.Partes[0].Cantidad_Total = 120;
    Obra.Partes[0].Unidad = "paginas";
    Decoteca.Avances.push({
      Id: "qa_avance_parte_detalle",
      Fecha: "2026-06-08",
      Teca_Id: "Biblioteca",
      Obra_Id: Obra.Id,
      Parte_Id: Obra.Partes[0].Id,
      Cantidad: 30,
      Unidad: "paginas",
      Tipo: "Cantidad",
      Hasta_Posicion: 30,
      Nota: "Avance de parte para detalle",
      Creado_Ms: 1
    });
    Decoteca = Normalizar_Decoteca(Decoteca);
    Render_Decoteca();
  });

  await page.locator('[data-decoteca-obra="dec_bib_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeVisible();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Partes");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("30 de 120 pag.");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("30 pags. / 120 pags.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("25%");
  await expect(page.locator(".Decoteca_Subitem_Dato")
    .filter({ hasText: "30 de 120 pag." }))
    .toHaveCSS("font-weight", "500");
  await expect(page.locator(".Decoteca_Subitem_Porcentaje")
    .filter({ hasText: "25%" }))
    .toHaveCSS("font-weight", "850");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Organizacion");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Lista: Biblioteca");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Prioridad: Alta");

  await Cerrar_Detalle_Decoteca(page);
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();
  await expect(page.locator('[data-decoteca-obra="dec_bib_1"]'))
    .not.toHaveClass(/Activa/);

  await page.locator('[data-decoteca-obra="dec_bib_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");

  await Cerrar_Detalle_Decoteca(page);
  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Videoteca");
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();
  await page.locator('[data-decoteca-obra="dec_vid_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Director");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Plataforma");

  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Filtro_Estado")
    .selectOption("Terminada");
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();
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
    .toContainText("Género");

  await Cerrar_Detalle_Decoteca(page);
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
      lista: "Proximas",
      periodo: "Mes:2026-10",
      formato: "Ensayo",
      campos: ["Autor", "Lista", "Prioridad", "Motivo"]
    },
    {
      teca: "Musicoteca",
      titulo: "Musicoteca",
      busqueda: "radiohead",
      resultado: "In Rainbows",
      estado: "En_Curso",
      lista: "Biblioteca",
      periodo: "Mes:2026-06",
      formato: "Alternative",
      campos: ["Artista", "Lista", "Prioridad", "Motivo"]
    },
    {
      teca: "Videoteca",
      titulo: "Videoteca",
      busqueda: "martel",
      resultado: "La ciénaga",
      estado: "Terminada",
      lista: "Archivo",
      periodo: "Mes:2026-05",
      formato: "Drama",
      campos: ["Director", "Lista", "Prioridad", "Motivo"]
    },
    {
      teca: "Ludoteca",
      titulo: "Ludoteca",
      busqueda: "disco",
      resultado: "Disco Elysium",
      estado: "En_Curso",
      lista: "Biblioteca",
      periodo: "Mes:2026-04",
      formato: "RPG",
      campos: ["Creador", "Lista", "Prioridad", "Motivo"]
    }
  ];

  for (const Caso of Casos) {
    await Cerrar_Detalle_Decoteca(page);
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

    await page.locator("#Decoteca_Filtro_Lista")
      .selectOption(Caso.lista);
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
    await Cerrar_Detalle_Decoteca(page);
  }

  await page.locator('[data-decoteca-teca="Biblioteca"]').click();
  await Limpiar_Filtros(page);
  await page.evaluate(() => {
    Decoteca.Avances.push(
      {
        Id: "qa_periodo_registro",
        Fecha: "2026-09-10",
        Teca_Id: "Biblioteca",
        Obra_Id: "dec_bib_2",
        Cantidad: 20,
        Unidad: "paginas",
        Tipo: "Cantidad",
        Hasta_Posicion: 20,
        Nota: "Registro parcial QA",
        Creado_Ms: 1
      },
      {
        Id: "qa_periodo_final",
        Fecha: "2026-11-15",
        Teca_Id: "Biblioteca",
        Obra_Id: "dec_bib_2",
        Cantidad: 360,
        Unidad: "paginas",
        Tipo: "Obra_Completa",
        Hasta_Posicion: 360,
        Nota: "Final QA",
        Creado_Ms: 2
      }
    );
    Decoteca = Normalizar_Decoteca(Decoteca);
    Render_Decoteca();
  });

  await page.locator("#Decoteca_Buscar_Input").fill("foucault");
  await page.locator("#Decoteca_Filtro_Periodo_Criterio")
    .selectOption("Objetivo");
  await expect(page.locator(
    '#Decoteca_Filtro_Periodo option[value="Mes:2026-10"]'
  )).toHaveCount(0);
  await expect(page.locator(
    '#Decoteca_Filtro_Periodo option[value="Mes:2026-12"]'
  )).toHaveCount(1);
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Mes:2026-12");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Vigilar y castigar");

  await page.locator("#Decoteca_Filtro_Periodo_Criterio")
    .selectOption("Registros");
  await expect(page.locator(
    '#Decoteca_Filtro_Periodo option[value="Mes:2026-09"]'
  )).toHaveCount(1);
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Mes:2026-09");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Vigilar y castigar");
  await expect(page.locator("#Decoteca_Periodo_Resumen"))
    .toBeVisible();
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Avance" }))
    .toContainText("20 pags.");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Tocadas" }))
    .toContainText("1");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Cierres" }))
    .toContainText("0");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Pendientes" }))
    .toContainText("1");

  await page.locator("#Decoteca_Filtro_Periodo_Criterio")
    .selectOption("Final");
  await expect(page.locator(
    '#Decoteca_Filtro_Periodo option[value="Mes:2026-11"]'
  )).toHaveCount(1);
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Mes:2026-11");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Vigilar y castigar");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Avance" }))
    .toContainText("360 pags.");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Cierres" }))
    .toContainText("1");
  await expect(page.locator(".Decoteca_Periodo_Item")
    .filter({ hasText: "Pendientes" }))
    .toContainText("0");

  await page.locator("#Decoteca_Filtro_Periodo_Criterio")
    .selectOption("Rango");
  await expect(page.locator(
    '#Decoteca_Filtro_Periodo option[value="Mes:2026-10"]'
  )).toHaveCount(1);
  await page.locator("#Decoteca_Filtro_Periodo")
    .selectOption("Mes:2026-10");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Vigilar y castigar");

  await page.locator('[data-decoteca-teca="Biblioteca"]').click();
  await Limpiar_Filtros(page);
  await expect(page.locator("#Decoteca_Periodo_Resumen"))
    .toBeHidden();

  await page.locator("#Decoteca_Vista_Readlist").click();
  await expect(page.locator("#Decoteca_Vista_Readlist"))
    .toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".Decoteca_Readlist_Item"))
    .toHaveCount(1);
  await expect(page.locator(".Decoteca_Readlist_Caratula"))
    .toHaveCount(1);
  await expect.poll(async () =>
    page.locator(".Decoteca_Readlist_Caratula").first()
      .evaluate((El) => {
        const Rect = El.getBoundingClientRect();
        return Rect.height / Rect.width;
      })
  ).toBeGreaterThan(1.35);
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Vigilar y castigar");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .not.toContainText("Lista:");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Alta");
  await expect(page.locator(".Decoteca_Readlist_Porcentaje").first())
    .toContainText("0%");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Base teorica");
  await page.locator(".Decoteca_Readlist_Item").first().click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Vigilar y castigar");
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Vista_Catalogo").click();
  await expect(page.locator("#Decoteca_Vista_Catalogo"))
    .toHaveAttribute("aria-selected", "true");

  await page.locator("#Decoteca_Vista_En_Curso").click();
  await expect(page.locator("#Decoteca_Vista_En_Curso"))
    .toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".Decoteca_Readlist_Item"))
    .toHaveCount(1);
  await expect(page.locator(".Decoteca_Readlist_Caratula"))
    .toHaveCount(1);
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Los detectives salvajes");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("0 de 609 pags.");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Sin avances");
  await expect(page.locator(".Decoteca_Readlist_Item").first())
    .toContainText("Ritmo:");
  await page.locator(".Decoteca_Readlist_Item").first().click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Vista_Catalogo").click();

  await page.locator("#Decoteca_Buscar_Input")
    .fill("obra inexistente zzz");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("No hay obras con esos filtros.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();

  await page.locator("#Decoteca_Buscar_Input").fill("");
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Los detectives salvajes");

  await page.locator('[data-decoteca-obra="dec_bib_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");

  await page.locator('[data-decoteca-accion="Editar"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Género");

  await page.locator('[data-decoteca-cancelar="true"]').click();
  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Texto de portada");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Tipo de portada");

  await page.locator('[data-decoteca-cancelar="true"]').click();
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Teca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nueva teca");

  await Cerrar_Detalle_Decoteca(page);
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

test("decoteca baja metadatos y caratulas por titulo", async ({ page }) => {
  await Preparar(page, "es", { Limpiar_Estado: false });
  await Abrir_Decoteca(page);

  await page.evaluate(() => {
    const Portada_Local =
      "data:image/png;base64," +
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0l" +
      "EQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
    window.Decoteca_Catalogo_Estructura_Libros = {
      Titulo: "Solaris",
      Autor: "Lem, Stanislaw",
      Anio: 1961,
      Genero: "Novela filosofica",
      Subgenero: "Ciencia ficcion",
      Descripcion:
        "Sinopsis local de Solaris tomada del catalogo personal.",
      Portada_Data_Url: Portada_Local,
      Caratula: {
        Metodo: "primera_pagina",
        Ruta_Imagen: "Portadas/Lem, Stanislaw. Solaris.png",
        Requiere_Revision: false
      },
      Numero_Paginas_Total: 296,
      Partes: [
        {
          Orden: 1,
          Titulo: "La llegada",
          Tipo: "capitulo",
          Pagina_Inicio: 5,
          Pagina_Fin: 12,
          Numero_Paginas: 8
        },
        {
          Orden: 2,
          Titulo: "Los Solaristas",
          Tipo: "capitulo",
          Pagina_Inicio: 13,
          Pagina_Fin: 25,
          Numero_Paginas: 13
        }
      ]
    };
    const Obra = Decoteca.Obras.find((Item) => Item.Id === "dec_bib_3");
    Obra.Creador = "Autor viejo";
    Obra.Anio = "1900";
    Obra.Genero = "Genero viejo";
    Obra.Subgenero = "Subgenero viejo";
    Obra.Descripcion = "Descripcion vieja";
    Obra.Datos_Teca = {
      Unidad: "paginas",
      Total_Unidades: 1,
      Fuente: "Manual"
    };
    Obra.Metadatos = [
      ["G\u00e9nero", "Genero viejo"],
      ["P\u00e1ginas", "1"],
      ["Fuente", "Manual"]
    ];
    Obra.Partes = [{
      Id: "parte_vieja",
      Titulo: "Parte vieja",
      Tipo: "Capitulo",
      Orden: 1,
      Unidad: "paginas",
      Cantidad_Total: 1,
      Pagina_Inicio: 1,
      Pagina_Fin: 1,
      Metadatos: []
    }];
    Obra.Portada_Tipo = "Url";
    Obra.Portada_Url = "https://example.com/decoteca-portada.png";
    Obra.Portada_Data_Url = "";
    Render_Decoteca();
  });
  await page.locator('[data-decoteca-obra="dec_bib_3"]').click();
  await page.locator('[data-decoteca-metadatos="Detalle"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Genero viejo");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("296");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Novela filosofica");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Ciencia ficcion");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Sinopsis local de Solaris");
  await expect(page.locator("#Decoteca_Detalle img"))
    .toHaveAttribute("src", /^data:image\/png;base64,/);
  await Esperar_Imagen_Cargada(page.locator("#Decoteca_Detalle img"));

  await Cerrar_Detalle_Decoteca(page);
  await page.locator('[data-decoteca-teca="Musicoteca"]').click();
  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo").fill("In Rainbows");
  await page.locator('[data-decoteca-metadatos="Form"]').click();
  await expect(page.locator("#Decoteca_Form_Creador"))
    .toHaveValue("Radiohead");
  await expect(page.locator("#Decoteca_Form_Titulo"))
    .toHaveValue("In rainbows");
  await expect(page.locator("#Decoteca_Form_Anio"))
    .toHaveValue("2007");
  await expect(page.locator("#Decoteca_Form_Genero"))
    .toHaveValue("Alternative");
  await expect(page.locator("#Decoteca_Form_Metadatos"))
    .toBeHidden();
  await expect(page.locator("#Decoteca_Form_Subobjetivos"))
    .toBeHidden();
  await expect(page.locator("#Decoteca_Form_Metadatos"))
    .toHaveValue(/Alternative/);
  await expect(page.locator("#Decoteca_Form_Subobjetivos"))
    .toHaveValue(/Nude \| 4:15/);
  await expect(page.locator("[data-decoteca-parte-row]"))
    .toHaveCount(3);
  await expect(page.locator("[data-decoteca-parte-titulo]").nth(1))
    .toHaveValue("Nude");
  await expect(page.locator("[data-decoteca-parte-total]").nth(1))
    .toHaveValue("1");
  await expect(page.locator("#Decoteca_Form_Portada_Url"))
    .toHaveValue(/600x600bb/);
  await page.locator('[data-decoteca-form="Obra"] .Primario').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Radiohead");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Canciones");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nude");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Apple/iTunes");
  await expect(page.locator("#Decoteca_Detalle img"))
    .toHaveAttribute("src", /600x600bb/);
  await Esperar_Imagen_Cargada(page.locator("#Decoteca_Detalle img"));

  await Cerrar_Detalle_Decoteca(page);
  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await page.locator('[data-decoteca-obra="dec_vid_1"]').click();
  await page.locator('[data-decoteca-metadatos="Detalle"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Andrei Tarkovsky");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("163 min");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Wikidata + Apple/iTunes");
  await expect(page.locator("#Decoteca_Detalle img"))
    .toHaveAttribute("src", /^https:\/\/commons\.wikimedia\.org/);
  await Esperar_Imagen_Cargada(page.locator("#Decoteca_Detalle img"));

  const Estado = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem(Clave_Local)).Decoteca;
  });
  const Libro = Estado.Obras.find((Obra) => Obra.Id === "dec_bib_3");
  expect(Libro.Creador).toBe("Lem, Stanislaw");
  expect(Libro.Anio).toBe("1961");
  expect(Libro.Genero).toBe("Novela filosofica");
  expect(Libro.Subgenero).toBe("Ciencia ficcion");
  expect(Libro.Descripcion)
    .toContain("Sinopsis local de Solaris");
  expect(Libro.Portada_Tipo).toBe("Archivo");
  expect(Libro.Portada_Data_Url).toContain("data:image/png;base64,");
  expect(Libro.Portada_Ruta_Local)
    .toBe("Portadas/Lem, Stanislaw. Solaris.png");
  expect(Libro.Portada_Metodo_Local).toBe("primera_pagina");
  expect(Libro.Portada_Requiere_Revision).toBe(false);
  expect(Libro.Datos_Teca.Total_Unidades).toBe(296);
  expect(Libro.Partes).toHaveLength(2);
  expect(Libro.Partes[0].Titulo).toBe("La llegada");
  expect(Libro.Partes[0].Cantidad_Total).toBe(8);
  expect(Libro.Partes.some((Parte) =>
    Parte.Titulo === "Parte vieja"
  )).toBeFalsy();
  expect(Libro.Metadatos.some(([Clave, Valor]) =>
    Clave === "Fuente" && Valor === "Biblioteca local"
  )).toBeTruthy();
  expect(Libro.Metadatos.some(([, Valor]) =>
    Valor === "Manual" || Valor === "Genero viejo"
  )).toBeFalsy();
  const Conservada = await page.evaluate(() => {
    const Base = {
      ...Decoteca.Obras.find((Obra) => Obra.Id === "dec_bib_3"),
      Id: "test_preserva_metadatos",
      Genero: "Manual",
      Subgenero: "Sub manual",
      Anio: "1999",
      Portada_Tipo: "Url",
      Portada_Url: "https://example.com/portada.jpg",
      Partes: [{
        Titulo: "Parte manual",
        Tipo: "Lectura",
        Orden: 1,
        Unidad: "paginas",
        Cantidad_Total: 12
      }],
      Metadatos: [["G\u00e9nero", "Manual"]]
    };
    return Decoteca_Aplicar_Metadatos_A_Obra(Base, {
      Titulo: "Libro sin datos completos",
      Creador: "Autor nuevo",
      Formato: "Libro",
      Genero: "",
      Subgenero: "",
      Anio: "",
      Datos_Teca: {
        Unidad: "paginas",
        Fuente: "Fuente parcial"
      },
      Partes: [],
      Metadatos: []
    });
  });
  expect(Conservada.Creador).toBe("Autor nuevo");
  expect(Conservada.Genero).toBe("Manual");
  expect(Conservada.Subgenero).toBe("Sub manual");
  expect(Conservada.Anio).toBe("1999");
  expect(Conservada.Portada_Tipo).toBe("Url");
  expect(Conservada.Portada_Url).toBe("https://example.com/portada.jpg");
  expect(Conservada.Datos_Teca.Total_Unidades).toBe(296);
  expect(Conservada.Datos_Teca.Fuente).toBe("Fuente parcial");
  expect(Conservada.Partes).toHaveLength(1);
  const Album = Estado.Obras.find((Obra) =>
    Obra.Titulo === "In rainbows" &&
    Obra.Creador === "Radiohead"
  );
  expect(Album.Portada_Tipo).toBe("Url");
  expect(Album.Portada_Url).toContain("600x600bb");
  expect(Album.Partes.some((Parte) =>
    Parte.Titulo === "Nude" &&
    Parte.Duracion_Segundos === 255
  )).toBeTruthy();
  expect(Album.Datos_Teca.Total_Unidades).toBe(Album.Partes.length);
  expect(Album.Metadatos.some(([Clave, Valor]) =>
    Clave === "Género" && Valor === "Alternative"
  )).toBeTruthy();
  expect(Album.Metadatos.some(([Clave, Valor]) =>
    Clave === "Fuente" && Valor === "Apple/iTunes"
  )).toBeTruthy();
  const Pelicula = Estado.Obras.find((Obra) => Obra.Id === "dec_vid_1");
  expect(Pelicula.Genero).toContain("Science fiction");
  expect(Pelicula.Datos_Teca.Total_Unidades).toBe(1);
  expect(Pelicula.Metadatos.some(([Clave, Valor]) =>
    Clave === "Fuente" && Valor.includes("Wikidata")
  )).toBeTruthy();

  const Portada_Archivo = await page.evaluate(() => {
    const Data_Url =
      "data:image/png;base64," +
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0l" +
      "EQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
    Decoteca_Teca_Activa = "Biblioteca";
    Decoteca_Editor_Modo = "Obra";
    Decoteca_Seleccion_Id = "";
    Decoteca_Editor_Id = "";
    Render_Decoteca();
    Decoteca_Rellenar_Form_Obra({
      Id: "test_archivo",
      Teca_Id: "Biblioteca",
      Titulo: "Archivo con portada",
      Creador: "Autora",
      Anio: "2026",
      Formato: "Libro",
      Estado: "Planeada",
      Periodo: "Sin_Periodo",
      Periodo_Label: "",
      Progreso: 0,
      Meta_Principal: "",
      Rating: "",
      Color: "#315f6f",
      Portada_Emoji: "📘",
      Portada_Texto: "Archivo con portada",
      Portada_Tipo: "Archivo",
      Portada_Url: "",
      Portada_Data_Url: Data_Url,
      Portada_Mime: "image/png",
      Portada_Nombre: "portada.png",
      Portada_Tamano: 68,
      Plan: "",
      Subobjetivos: [],
      Metadatos: []
    });
    return {
      Tipo: document.getElementById("Decoteca_Form_Portada_Tipo")?.value,
      Data_Url:
        document.getElementById("Decoteca_Form_Portada_Data_Url")?.value,
      Mime: document.getElementById("Decoteca_Form_Portada_Mime")?.value,
      Nombre:
        document.getElementById("Decoteca_Form_Portada_Nombre")?.value,
      Tamano:
        document.getElementById("Decoteca_Form_Portada_Tamano")?.value
    };
  });
  expect(Portada_Archivo.Tipo).toBe("Archivo");
  expect(Portada_Archivo.Data_Url).toContain("data:image/png;base64,");
  expect(Portada_Archivo.Mime).toBe("image/png");
  expect(Portada_Archivo.Nombre).toBe("portada.png");
  expect(Portada_Archivo.Tamano).toBe("68");
});

test("decoteca traduce campos de alta en ingles", async ({ page }) => {
  await Preparar(page, "en");
  await Abrir_Decoteca(page);

  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Genre");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Start date");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Nombre del período");

  await Cerrar_Detalle_Decoteca(page);
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
    .toContainText("Genero");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Data inicial");
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
  await page.locator("#Decoteca_Form_Teca_Unidad").fill("ensayo");
  await page.locator("#Decoteca_Form_Teca_Subunidad").fill("seccion");
  await page.locator("#Decoteca_Form_Teca_Metrica").fill("paginas");
  await page.locator('[data-decoteca-form="Teca"] .Primario')
    .click();

  await expect(page.locator('.Decoteca_Teca_Btn[aria-label^="Ensayoteca"]'))
    .toHaveCount(1);
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Ensayoteca");

  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Cuaderno de pruebas");
  await page.locator("#Decoteca_Form_Creador")
    .fill("Equipo Semaplan");
  await page.locator("#Decoteca_Form_Anio").fill("2026");
  await page.locator("#Decoteca_Form_Genero").fill("Ensayo");
  await page.locator("#Decoteca_Form_Estado")
    .selectOption("En_Curso");
  await page.locator("#Decoteca_Form_Lista")
    .selectOption("Readlist");
  await page.locator("#Decoteca_Form_Prioridad")
    .selectOption("Alta");
  await page.locator("#Decoteca_Form_Fecha_Ingreso")
    .fill("2026-06-11");
  await page.locator("#Decoteca_Form_Origen")
    .fill("Ensayo de prueba");
  await page.locator("#Decoteca_Form_Motivo")
    .fill("Validar que una obra pueda vivir en readlist.");
  await page.locator("#Decoteca_Form_Fecha_Inicio")
    .fill("2026-07-01");
  await page.locator("#Decoteca_Form_Fecha_Fin")
    .fill("2026-07-31");
  await page.locator("#Decoteca_Form_Total").fill("100");
  await expect(page.locator("#Decoteca_Form_Rating")).toHaveCount(1);
  await page.locator("#Decoteca_Form_Rating").selectOption("4");
  await page.locator("#Decoteca_Form_Descripcion")
    .fill("Revisar dos secciones por semana.");
  await expect(page.locator("#Decoteca_Form_Subobjetivos"))
    .toBeHidden();
  await expect(page.locator("#Decoteca_Form_Metadatos"))
    .toBeHidden();
  await page.locator("[data-decoteca-parte-agregar]").click();
  const Parte_Nueva = page.locator("[data-decoteca-parte-row]").last();
  await Parte_Nueva.locator("[data-decoteca-parte-titulo]")
    .fill("Seccion inicial");
  await Parte_Nueva.locator("[data-decoteca-parte-total]").fill("40");
  await expect(page.locator("#Decoteca_Form_Subobjetivos"))
    .toHaveValue(/Seccion inicial \| 40 pags\./);
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();

  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Cuaderno de pruebas");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("100 pags.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("★★★★");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Lista: Readlist");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Prioridad: Alta");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Revisar dos secciones por semana.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Seccion inicial");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("40 pags.");

  const Parte_Id_Antes = await page.evaluate(() => {
    const Estado = JSON.parse(localStorage.getItem(Clave_Local)).Decoteca;
    const Obra = Estado.Obras.find((Item) =>
      Item.Titulo === "Cuaderno de pruebas"
    );
    return Obra.Partes.find((Parte) =>
      Parte.Titulo === "Seccion inicial"
    )?.Id;
  });
  expect(Parte_Id_Antes).toBeTruthy();

  await page.locator('[data-decoteca-accion="Editar"]').click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Cuaderno editado");
  const Parte_Editada = page.locator("[data-decoteca-parte-row]").first();
  await expect(Parte_Editada.locator("[data-decoteca-parte-titulo]"))
    .toHaveValue("Seccion inicial");
  await Parte_Editada.locator("[data-decoteca-parte-titulo]")
    .fill("Seccion revisada");
  await Parte_Editada.locator("[data-decoteca-parte-total]").fill("45");
  await page.locator("#Decoteca_Form_Lista")
    .selectOption("Proximas");
  await page.locator("#Decoteca_Form_Prioridad")
    .selectOption("Media");
  await page.locator("#Decoteca_Form_Motivo")
    .fill("Pasa a proximas por plan concreto.");
  await page.locator("#Decoteca_Form_Total").fill("120");
  await page.locator("#Decoteca_Form_Descripcion")
    .fill("Cerrar el ensayo y pasar notas al Archivero.");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();

  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Cuaderno editado");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("120 pags.");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Lista: Proximas");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Seccion revisada");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("45 pags.");

  await page.locator('[data-decoteca-accion="Caratula"]').click();
  await page.locator("#Decoteca_Form_Portada_Tipo")
    .selectOption("Url");
  const Campo_Url_Portada = page.locator("#Decoteca_Form_Portada_Url");
  await expect(Campo_Url_Portada).toBeVisible();
  await Campo_Url_Portada
    .fill("https://example.com/decoteca-portada.png");
  await expect(Campo_Url_Portada)
    .toHaveValue("https://example.com/decoteca-portada.png");
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
    Obra.Genero === "Ensayo" &&
    Obra.Descripcion === "Cerrar el ensayo y pasar notas al Archivero." &&
    Obra.Datos_Teca.Total_Unidades === 120 &&
    Obra.Lista === "Proximas" &&
    Obra.Prioridad === "Media" &&
    Obra.Motivo === "Pasa a proximas por plan concreto." &&
    Obra.Origen === "Ensayo de prueba" &&
    Obra.Fecha_Ingreso === "2026-06-11" &&
    Obra.Partes.some((Parte) =>
      Parte.Id === Parte_Id_Antes &&
      Parte.Titulo === "Seccion revisada" &&
      Parte.Cantidad_Total === 45
    )
  )).toBeTruthy();

  await page.reload();
  await Activar_App(page);
  await Abrir_Decoteca(page);
  await expect(page.locator('.Decoteca_Teca_Btn[aria-label^="Ensayoteca"]'))
    .toHaveCount(1);
  await page.locator('.Decoteca_Teca_Btn[aria-label^="Ensayoteca"]')
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
  await expect(
    page.locator('.Decoteca_Teca_Btn[aria-label^="Cineteca QA editada"]')
  ).toHaveCount(1);

  await page.locator("#Decoteca_Nueva").click();
  await page.locator("#Decoteca_Form_Titulo")
    .fill("Obra para borrar");
  await page.locator("#Decoteca_Form_Creador").fill("QA");
  await page.locator("#Decoteca_Form_Genero").fill("Drama");
  await page.locator("#Decoteca_Form_Total").fill("1");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Obra para borrar");

  await Cerrar_Detalle_Decoteca(page);
  const Card_Obra_Borrar = page.locator(".Decoteca_Card")
    .filter({ hasText: "Obra para borrar" });
  await Card_Obra_Borrar.click({ button: "right" });
  await expect(page.locator(".Decoteca_Context_Menu"))
    .toBeVisible();
  await expect(page.locator(".Decoteca_Context_Menu"))
    .toContainText("Editar");
  await expect(page.locator(".Decoteca_Context_Menu"))
    .toContainText("Borrar");
  await page.locator(
    '.Decoteca_Context_Menu [data-decoteca-menu-accion="Editar"]'
  ).click();
  await expect(page.locator("#Decoteca_Form_Titulo"))
    .toHaveValue("Obra para borrar");
  await page.locator('[data-decoteca-cancelar="true"]').click();
  await Cerrar_Detalle_Decoteca(page);

  await Card_Obra_Borrar.click({ button: "right" });
  await page.locator(
    '.Decoteca_Context_Menu [data-decoteca-menu-accion="Borrar"]'
  ).click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Secundario")
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("Obra para borrar");

  await Card_Obra_Borrar.click({ button: "right" });
  await page.locator(
    '.Decoteca_Context_Menu [data-decoteca-menu-accion="Borrar"]'
  ).click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();
  await expect(page.locator("#Decoteca_Grilla"))
    .not.toContainText("Obra para borrar");

  await page.locator("#Decoteca_Teca_Editar").click();
  await page.locator('[data-decoteca-borrar-teca="true"]').click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();
  await expect(
    page.locator('.Decoteca_Teca_Btn[aria-label^="Cineteca QA editada"]')
  ).toHaveCount(0);

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
  await page.locator("#Decoteca_Form_Genero").fill("Ensayo");
  await page.locator('[data-decoteca-form="Obra"] .Primario')
    .click();
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Teca_Editar").click();
  await page.locator('[data-decoteca-borrar-teca="true"]').click();
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Primario")
    .click();
  await expect(
    page.locator('.Decoteca_Teca_Btn[aria-label^="Teca mover QA"]')
  ).toHaveCount(0);
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

test("decoteca registra avances propios por teca", async ({ page }) => {
  await Preparar(page, "es", { Limpiar_Estado: false });
  await Abrir_Decoteca(page);

  await page.locator("#Decoteca_Avance_Abrir").click();
  const Modal_Avance = page.locator("#Decoteca_Avance_Overlay");
  await expect(Modal_Avance).toHaveClass(/Activo/);
  await expect(Modal_Avance)
    .toContainText("Registrar avance");
  await expect(Modal_Avance)
    .not.toContainText("Resumen del periodo");
  await expect(Modal_Avance)
    .not.toContainText("Registros");
  await expect(page.locator("#Decoteca_Detalle"))
    .not.toContainText("Registrar avance");

  await page.locator(".Decoteca_Avance_Boton").click();
  const Menu_Avance = page.locator(".Decoteca_Avance_Menu");
  await expect(Menu_Avance).toBeVisible();
  const Teca_Biblioteca = Menu_Avance.locator(
    '[data-decoteca-avance-clave="Teca|Biblioteca"]'
  );
  await expect(Teca_Biblioteca).toHaveText("-");
  const Obra_Detectives = Menu_Avance.locator(
    '[data-decoteca-avance-valor="Obra|dec_bib_1"]'
  );
  await expect(Obra_Detectives).toBeVisible();
  const Nodo_Detectives = Menu_Avance.locator(
    '[data-decoteca-avance-clave="Teca|Biblioteca/Obra|dec_bib_1"]'
  );
  await expect(Nodo_Detectives).toHaveText("+");
  await Nodo_Detectives.click();
  await expect(Nodo_Detectives).toHaveText("-");
  await expect(
    Menu_Avance.locator('[data-decoteca-avance-valor^="Parte|dec_bib_1|"]')
      .first()
  ).toBeVisible();
  await Obra_Detectives.click();
  await expect(page.locator(".Decoteca_Avance_Boton"))
    .toContainText("Los detectives salvajes");
  await page.locator("#Decoteca_Avance_Fecha").fill("2026-06-09");
  await page.locator("#Decoteca_Avance_Cantidad").fill("90");
  await page.locator("#Decoteca_Avance_Nota")
    .fill("Lectura de prueba QA");
  await page.locator("#Decoteca_Avance_Guardar").click();

  await expect(Modal_Avance)
    .not.toContainText("Lectura de prueba QA");

  await page.locator("#Decoteca_Avance_Cerrar").click();
  await expect(Modal_Avance).not.toHaveClass(/Activo/);
  await page.evaluate(() => {
    Decoteca.Avances.push({
      Id: "qa_decoteca_avance_mismo_dia",
      Fecha: "2026-06-09",
      Teca_Id: "Biblioteca",
      Obra_Id: "dec_bib_2",
      Cantidad: 30,
      Unidad: "paginas",
      Tipo: "Cantidad",
      Hasta_Posicion: 30,
      Nota: "Lectura vecina QA",
      Creado_Ms: 1
    });
    Decoteca = Normalizar_Decoteca(Decoteca);
    Render_Decoteca();
  });
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Registro_Abrir").click();
  const Modal_Registro = page.locator("#Decoteca_Registro_Overlay");
  await expect(Modal_Registro).toHaveClass(/Activo/);
  await expect(Modal_Registro)
    .toContainText("Registro de avances");
  await expect(Modal_Registro)
    .toContainText("Lectura de prueba QA");
  await expect(Modal_Registro)
    .toContainText("90 pags.");
  await expect(Modal_Registro)
    .toContainText("30 pags.");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Resumen"))
    .toContainText("Registros");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Resumen_Item")
    .filter({ hasText: "Registros" }))
    .toContainText("2");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Resumen_Item")
    .filter({ hasText: "Avance" }))
    .toContainText("120 pags.");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Resumen_Item")
    .filter({ hasText: "Obras" }))
    .toContainText("2");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Dia").first())
    .toContainText("2026-06-09 \u00b7 120 pags. \u00b7 2 registros");
  await Modal_Registro.locator("[data-decoteca-registro-agrupar]")
    .selectOption("Semana");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Dia").first())
    .toContainText(
      "2026-06-08 - 2026-06-14 \u00b7 120 pags. \u00b7 2 registros"
    );

  await Modal_Registro
    .locator("[data-decoteca-registro-editar]").first().click();
  await expect(Modal_Registro).not.toHaveClass(/Activo/);
  await expect(Modal_Avance).toHaveClass(/Activo/);
  await expect(page.locator("#Decoteca_Avance_Cantidad"))
    .toHaveValue("90");
  await page.locator("#Decoteca_Avance_Cantidad").fill("120");
  await page.locator("#Decoteca_Avance_Guardar").click();
  await page.locator("#Decoteca_Avance_Cerrar").click();
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Registro_Abrir").click();
  await expect(Modal_Registro).toContainText("120 pags.");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Resumen_Item")
    .filter({ hasText: "Avance" }))
    .toContainText("150 pags.");
  await expect(Modal_Registro.locator(".Decoteca_Registro_Dia").first())
    .toContainText("2026-06-09 \u00b7 150 pags. \u00b7 2 registros");

  await Modal_Registro
    .locator("[data-decoteca-registro-borrar]").first().click();
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await page.locator("#Dialogo_Botones .Dialogo_Boton_Peligro")
    .click();
  await expect(Modal_Registro)
    .not.toContainText("Lectura de prueba QA");
  await page.locator("#Decoteca_Registro_Cerrar").click();
  await expect(Modal_Registro).not.toHaveClass(/Activo/);

  const Estado = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem(Clave_Local)).Decoteca;
  });
  expect(Estado.Avances.filter((Avance) =>
    Avance.Obra_Id === "dec_bib_1"
  )).toHaveLength(0);
  const Obra = Estado.Obras.find((Item) => Item.Id === "dec_bib_1");
  expect(Obra.Partes.length).toBeGreaterThan(0);
  expect(Obra.Datos_Teca.Total_Unidades).toBe(609);
});

test("decoteca abre registro de avances con D global", async ({
  page
}) => {
  await Preparar(page, "es", { Limpiar_Estado: false });

  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
  await page.keyboard.press("d");
  const Modal_Avance = page.locator("#Decoteca_Avance_Overlay");
  await expect(Modal_Avance).toHaveClass(/Activo/);
  await expect(Modal_Avance).toContainText("Registrar avance");
  await Esperar_Emoji_Visible(
    Modal_Avance.locator(".Decoteca_Avance_Titulo_Icono")
  );
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.locator("#Decoteca_Avance_Cerrar").click();
  await expect(Modal_Avance).not.toHaveClass(/Activo/);

  await page.evaluate(() => Abrir_Plan());
  await expect(page.locator("#Plan_Overlay"))
    .toHaveClass(/Activo/);
  await page.keyboard.press("D");
  await expect(Modal_Avance).toHaveClass(/Activo/);
  await expect(page.locator("#Plan_Overlay"))
    .toHaveClass(/Activo/);
});

test("decoteca mobile no recorta el detalle", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await Preparar(page);
  await Abrir_Decoteca(page);

  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toBeHidden();
  await page.locator('[data-decoteca-obra="dec_vid_1"]').click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Stalker");

  const Medidas = await page.evaluate(() => {
    const Detalle = document.getElementById("Decoteca_Detalle");
    const Cuerpo = document.querySelector(".Decoteca_Cuerpo");
    const Fila_Tecas = document.querySelector(".Decoteca_Tecas_Fila");
    const Teca_Activa = document.querySelector(
      '[data-decoteca-teca="Videoteca"]'
    );
    const Cerrar = document.getElementById("Decoteca_Cerrar");
    const Barra = document.querySelector(".Decoteca_Barra_Superior");
    const Rect_Fila = Fila_Tecas?.getBoundingClientRect();
    const Rect_Teca = Teca_Activa?.getBoundingClientRect();
    const Rect_Cerrar = Cerrar?.getBoundingClientRect();
    const Rect_Barra = Barra?.getBoundingClientRect();
    return {
      Detalle_Alto: Detalle?.getBoundingClientRect().height || 0,
      Detalle_Scroll: Detalle?.scrollHeight || 0,
      Cuerpo_Overflow: getComputedStyle(Cuerpo).overflowY,
      Teca_Fila_Alto: Rect_Fila?.height || 0,
      Teca_Activa_Alto: Rect_Teca?.height || 0,
      Teca_Fila_Bottom: Rect_Fila?.bottom || 0,
      Teca_Fila_Right: Rect_Fila?.right || 0,
      Cerrar_Left: Rect_Cerrar?.left || 0,
      Barra_Top: Rect_Barra?.top || 0
    };
  });

  expect(Medidas.Cuerpo_Overflow).toBe("auto");
  expect(Medidas.Teca_Fila_Alto)
    .toBeGreaterThanOrEqual(Medidas.Teca_Activa_Alto);
  expect(Medidas.Teca_Fila_Bottom)
    .toBeLessThanOrEqual(Medidas.Barra_Top);
  expect(Medidas.Teca_Fila_Right)
    .toBeLessThanOrEqual(Medidas.Cerrar_Left);
  expect(Medidas.Detalle_Alto)
    .toBeGreaterThanOrEqual(Medidas.Detalle_Scroll - 2);

  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Avance_Abrir").click();
  const Modal_Avance = page.locator("#Decoteca_Avance_Overlay");
  await expect(Modal_Avance).toHaveClass(/Activo/);
  await expect(Modal_Avance).toContainText("Registrar avance");

  const Medidas_Modal = await page.evaluate(() => {
    const Panel = document.querySelector(".Decoteca_Avance_Modal");
    const Cuerpo = document.getElementById("Decoteca_Avance_Cuerpo");
    const Guardar = document.getElementById("Decoteca_Avance_Guardar");
    const Rect_Panel = Panel?.getBoundingClientRect();
    const Rect_Guardar = Guardar?.getBoundingClientRect();
    return {
      Panel_Top: Rect_Panel?.top || 0,
      Panel_Bottom: Rect_Panel?.bottom || 0,
      Panel_Right: Rect_Panel?.right || 0,
      Guardar_Right: Rect_Guardar?.right || 0,
      Cuerpo_Overflow: Cuerpo ? getComputedStyle(Cuerpo).overflowY : "",
      Cuerpo_Alto: Cuerpo?.clientHeight || 0,
      Cuerpo_Scroll: Cuerpo?.scrollHeight || 0,
      Ventana_Alto: window.innerHeight,
      Ventana_Ancho: window.innerWidth
    };
  });
  expect(Medidas_Modal.Panel_Top).toBeGreaterThanOrEqual(0);
  expect(Medidas_Modal.Panel_Bottom)
    .toBeLessThanOrEqual(Medidas_Modal.Ventana_Alto);
  expect(Medidas_Modal.Panel_Right)
    .toBeLessThanOrEqual(Medidas_Modal.Ventana_Ancho);
  expect(Medidas_Modal.Guardar_Right)
    .toBeLessThanOrEqual(Medidas_Modal.Panel_Right);
  expect(Medidas_Modal.Cuerpo_Overflow).toBe("auto");
  expect(Medidas_Modal.Cuerpo_Scroll)
    .toBeGreaterThanOrEqual(Medidas_Modal.Cuerpo_Alto);

  await expect(Modal_Avance).toContainText("Visionado");
  await expect(Modal_Avance).toContainText("1 vis.");
  await page.locator("#Decoteca_Avance_Guardar").click();
  await page.locator("#Decoteca_Avance_Cuerpo")
    .evaluate((El) => {
      El.scrollTop = El.scrollHeight;
    });
  await expect(Modal_Avance).toContainText("1 vis.");
  await expect(Modal_Avance).not.toContainText("Editar");
  await page.locator("#Decoteca_Avance_Cerrar").click();
  await Cerrar_Detalle_Decoteca(page);
  await page.locator("#Decoteca_Registro_Abrir").click();
  const Modal_Registro = page.locator("#Decoteca_Registro_Overlay");
  await expect(Modal_Registro).toHaveClass(/Activo/);
  await expect(Modal_Registro).toContainText("Stalker");
  await expect(Modal_Registro).toContainText("1 vis.");
  await expect(
    Modal_Registro.locator("[data-decoteca-registro-editar]")
  ).toHaveCount(1);
});
