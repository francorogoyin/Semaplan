const { test, expect } = require("@playwright/test");

function Crear_Estado(Menu_Estilo = "Iconos") {
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
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
      Ocultar_Dias_Automatico: "Ninguno",
      Slots_Muertos_Default: {},
      Agrupar_Por_Categorias: false,
      Globito_Activo: true,
      Globito_Modo: "Horas",
      Globito_Posicion: "Arriba",
      Meta_Notificaciones_Activas: true,
      Meta_Notificaciones_Hitos: [25, 50, 75, 100],
      Color_Sueno: "#ddd4f4",
      Color_Descanso: "#d4e9f4",
      Color_Badge: "#9b2040",
      Color_Completa: "#1f6b4f",
      Color_Sin_Horas: "#c9a800",
      Color_Fracasada: "#8c2f2f",
      Resize_Personalizado: false,
      Notas_Hover: false,
      Mostrar_Archivadas: false,
      Focus_Auto: false,
      Menu_Estilo,
      Menu_Botones_Visibles: {
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true,
        Patron_Boton: true,
        Limpiar_Semana_Boton: true,
        Ayuda_Boton: true,
        Logout_Boton: true
      },
      Version_Programa: "Demo",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
      Contador_Semanas_Activo: false,
      Contador_Semanas_Modo: "Ano",
      Contador_Semanas_Fecha_Ref: "",
      Contador_Semanas_Porcentaje: false,
      Contador_Semanas_Fecha_Final: "",
      Contador_Semanas_Vida_Anios: 80,
      Inicio_Semana_Dia: 0,
      Inicio_Semana_Hora: 8
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

async function Preparar(page, estado) {
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
  await page.addInitScript((estadoInicial) => {
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
      JSON.stringify(estadoInicial)
    );
  }, estado);

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    window.Abrir_Config();
  });
}

test("oculta opciones en hamburguesa", async ({ page }) => {
  await Preparar(page, Crear_Estado("Hamburguesa"));
  await expect(
    page.locator("#Cfg_Menu_Botones_Bloque")
  ).toBeHidden();
});

test("permite tildar y destildar todo", async ({ page }) => {
  await Preparar(page, Crear_Estado("Iconos"));
  const Checks = page.locator(
    "#Cfg_Menu_Botones_Lista input[type='checkbox']"
  );
  await expect(Checks.first()).toBeChecked();
  await page.click("#Cfg_Menu_Botones_Destildar");
  await expect(Checks.first()).not.toBeChecked();
  await page.click("#Cfg_Menu_Botones_Tildar");
  await expect(Checks.first()).toBeChecked();

  const posicion = await page.evaluate(() => {
    const Lista = document.getElementById(
      "Cfg_Menu_Botones_Lista"
    );
    const Acciones = document.getElementById(
      "Cfg_Menu_Botones_Acciones"
    );
    if (!Lista || !Acciones) return null;
    const Rect_Lista = Lista.getBoundingClientRect();
    const Rect_Acciones = Acciones.getBoundingClientRect();
    return {
      acciones_debajo: Rect_Acciones.top >= Rect_Lista.bottom
    };
  });

  expect(posicion).not.toBeNull();
  expect(posicion.acciones_debajo).toBeTruthy();
});

test("hamburguesa abre redes sociales en ayuda",
async ({ page }) => {
  await Preparar(page, Crear_Estado("Hamburguesa"));

  await page.evaluate(() => {
    Cerrar_Config();
    Config.Menu_Estilo = "Hamburguesa";
    Aplicar_Estilo_Menu();
    Mostrar_Menu_Hamburguesa();
  });

  const Popup = page.locator("#Menu_Hamburguesa_Popup");
  await expect(Popup).toBeVisible();

  const Redes = Popup.locator(
    ".Menu_Hamburguesa_Item_Redes"
  );
  await expect(Redes).toContainText("Redes sociales");
  await Redes.click();

  await expect(page.locator("#Ayuda_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Ayuda_Redes"))
    .toContainText("Redes sociales");

  const Links = page.locator("#Ayuda_Redes .Ayuda_Red_Link");
  await expect(Links).toHaveCount(4);
  await expect(page.locator("#Ayuda_Redes .Ayuda_Red_Icono"))
    .toHaveCount(4);

  const Geometria = await page.evaluate(() => {
    const Link = document.querySelector(
      "#Ayuda_Redes .Ayuda_Red_Link"
    );
    const Rect = Link.getBoundingClientRect();
    return {
      ancho: Math.round(Rect.width),
      alto: Math.round(Rect.height),
      radio: window.getComputedStyle(Link).borderRadius
    };
  });
  expect(Geometria.ancho).toBe(32);
  expect(Geometria.alto).toBe(32);
  expect(Geometria.radio).toBe("999px");

  const Url_Antes = page.url();
  await Links.first().click();
  expect(page.url()).toBe(Url_Antes);
});

test("more apps muestra enlaces muertos sin titulo duplicado",
async ({ page }) => {
  await Preparar(page, Crear_Estado("Hamburguesa"));

  const resultado = await page.evaluate(() => {
    Cerrar_Config();
    Abrir_Otras_Apps();
    const Overlay = document.getElementById(
      "Otras_Apps_Overlay"
    );
    const Panel = Overlay?.querySelector(".Otras_Apps_Panel");
    const Cabecera = Panel?.querySelector(
      ".Patron_Modal_Cabecera"
    );
    const Cuerpo = Panel?.querySelector(".Otras_Apps_Cuerpo");
    const Intro = Panel?.querySelector(".Otras_Apps_Intro");
    const Intro_Rect = Intro?.getBoundingClientRect();
    const Cuerpo_Rect = Cuerpo?.getBoundingClientRect();
    const Links = Array.from(
      Panel?.querySelectorAll(".Otras_Apps_Item") || []
    ).map((Link) => ({
      nombre: Link.querySelector(".Otras_Apps_Nombre")
        ?.textContent?.trim() || "",
      descripcion: Link.querySelector(".Otras_Apps_Desc")
        ?.textContent?.trim() || "",
      href: Link.getAttribute("href") || "",
      onclick: Link.getAttribute("onclick") || "",
      target: Link.getAttribute("target") || "",
      rel: Link.getAttribute("rel") || ""
    }));
    return {
      activo: Overlay?.classList.contains("Activo") || false,
      titulo: Boolean(
        Panel?.querySelector(".Patron_Modal_Titulo")
      ),
      intro_en_cabecera: Boolean(Cabecera?.contains(Intro)),
      intro_en_cuerpo: Boolean(Cuerpo?.contains(Intro)),
      intro_sobre_cuerpo: Boolean(
        Intro_Rect &&
        Cuerpo_Rect &&
        Intro_Rect.bottom <= Cuerpo_Rect.top
      ),
      links: Links
    };
  });

  expect(resultado.activo).toBeTruthy();
  expect(resultado.titulo).toBeFalsy();
  expect(resultado.intro_en_cabecera).toBeTruthy();
  expect(resultado.intro_en_cuerpo).toBeFalsy();
  expect(resultado.intro_sobre_cuerpo).toBeTruthy();
  expect(resultado.links).toEqual([
    {
      nombre: "Highlighter",
      descripcion:
        "Próximamente: app para extraer y organizar " +
        "recortes de libros.",
      href: "#",
      onclick: "event.preventDefault()",
      target: "",
      rel: ""
    },
    {
      nombre: "Mascoter",
      descripcion:
        "Próximamente: software de administración para " +
        "pet shops.",
      href: "#",
      onclick: "event.preventDefault()",
      target: "",
      rel: ""
    },
    {
      nombre: "Potredata",
      descripcion:
        "Próximamente: buscador minucioso de " +
        "estadísticas de fútbol.",
      href: "#",
      onclick: "event.preventDefault()",
      target: "",
      rel: ""
    },
    {
      nombre: "BotAFIP",
      descripcion:
        "Próximamente: bot para facturar " +
        "automáticamente en AFIP.",
      href: "#",
      onclick: "event.preventDefault()",
      target: "",
      rel: ""
    }
  ]);

  const Url_Antes = page.url();
  await page.locator(".Otras_Apps_Item").first().click();
  expect(page.url()).toBe(Url_Antes);
});
