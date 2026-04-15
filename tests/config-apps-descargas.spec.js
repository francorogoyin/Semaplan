const { test, expect } = require("@playwright/test");

async function Preparar(page) {
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
  await page.addInitScript(() => {
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
      JSON.stringify({
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
        Config_Extra: {},
        Tipos_Slot: [],
        Tipos_Slot_Inicializados: false,
        Slots_Muertos_Tipos: {},
        Slots_Muertos_Nombres: {},
        Abordajes_Migrados_V1: true,
        Semanas_Con_Defaults: [],
        Planes_Semana: {}
      })
    );
  });

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
    Abrir_Config();
  });
}

test("muestra apps en config y descarga inactiva", async ({
  page
}) => {
  await Preparar(page);

  await expect(page.locator("#Cfg_App_Desktop_Btn"))
    .toContainText("Desktop");
  await expect(page.locator("#Cfg_App_Android_Btn"))
    .toContainText("Android");

  await page.click("#Cfg_App_Desktop_Btn");
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Cfg_App_Desktop_Descargar"))
    .toBeDisabled();
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .toContainText("Windows");

  await page.keyboard.press("Escape");
  await expect(page.locator("#Cfg_App_Desktop_Overlay"))
    .not.toHaveClass(/Activo/);

  await page.click("#Cfg_App_Android_Btn");
  await expect(page.locator("#Cfg_App_Android_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Cfg_App_Android_Descargar"))
    .toBeDisabled();
  await expect(page.locator("#Cfg_App_Android_Overlay"))
    .toContainText("teléfono");
});

test("centra el contenido de los modales de apps", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Leer = (Tipo) => {
      Abrir_Modal_App_Config(Tipo);
      const Overlay = document.getElementById(
        `Cfg_App_${Tipo}_Overlay`
      );
      const Panel = Overlay?.querySelector(".Cfg_App_Panel");
      const Cabecera = Panel?.querySelector(
        ".Patron_Modal_Cabecera"
      );
      const Titulo = Panel?.querySelector(
        ".Patron_Modal_Titulo"
      );
      const Cuerpo = Panel?.querySelector(".Cfg_App_Cuerpo");
      const Texto = Panel?.querySelector(".Cfg_App_Texto");
      const Nota = Panel?.querySelector(".Cfg_App_Nota");
      const Acciones = Panel?.querySelector(".Cfg_App_Acciones");
      const Boton = Panel?.querySelector(
        ".Cfg_App_Descargar_Btn"
      );
      const Datos = {
        cabecera_justify: Cabecera
          ? getComputedStyle(Cabecera).justifyContent
          : "",
        titulo_align: Titulo
          ? getComputedStyle(Titulo).textAlign
          : "",
        cuerpo_align_items: Cuerpo
          ? getComputedStyle(Cuerpo).alignItems
          : "",
        cuerpo_text_align: Cuerpo
          ? getComputedStyle(Cuerpo).textAlign
          : "",
        texto_align: Texto
          ? getComputedStyle(Texto).textAlign
          : "",
        nota_align: Nota
          ? getComputedStyle(Nota).textAlign
          : "",
        acciones_justify: Acciones
          ? getComputedStyle(Acciones).justifyContent
          : "",
        boton_left: Boton
          ? Math.round(Boton.getBoundingClientRect().left)
          : 0,
        boton_right: Boton
          ? Math.round(Boton.getBoundingClientRect().right)
          : 0,
        panel_left: Panel
          ? Math.round(Panel.getBoundingClientRect().left)
          : 0,
        panel_right: Panel
          ? Math.round(Panel.getBoundingClientRect().right)
          : 0
      };
      Cerrar_Modal_App_Config(Tipo);
      return Datos;
    };

    return {
      desktop: Leer("Desktop"),
      android: Leer("Android")
    };
  });

  for (const datos of [resultado.desktop, resultado.android]) {
    expect(datos.cabecera_justify).toBe("center");
    expect(datos.titulo_align).toBe("center");
    expect(datos.cuerpo_align_items).toBe("center");
    expect(datos.cuerpo_text_align).toBe("center");
    expect(datos.texto_align).toBe("center");
    expect(datos.nota_align).toBe("center");
    expect(datos.acciones_justify).toBe("center");

    const centro_panel =
      (datos.panel_left + datos.panel_right) / 2;
    const centro_boton =
      (datos.boton_left + datos.boton_right) / 2;
    expect(Math.abs(centro_boton - centro_panel))
      .toBeLessThanOrEqual(2);
  }
});

test("deja en apps el mismo aire visual que pagos", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    Suscripcion_Historial_Remoto = [
      {
        fecha_evento: "2026-04-12T05:40:00Z",
        monto: 999,
        moneda: "ARS",
        estado: "approved"
      }
    ];
    Suscripcion_Detalle_Remota = null;
    Renderizar_Historial_Pagos_Cuenta();

    const Separadores = document.querySelectorAll(
      ".Cfg_Cuenta_Separador"
    );
    const Sep_Pagos = Separadores[0];
    const Sep_Apps = Separadores[1];
    const Pago = document.querySelector(
      "#Cfg_Pagos_Historial .Cfg_Pagos_Tabla"
    );
    const Boton = document.querySelector(
      ".Cfg_Apps_Lista .Config_Dato_Btn:last-child"
    );
    const Estilos_Apps = getComputedStyle(
      document.querySelector(".Cfg_Apps_Lista")
    );

    return {
      gapPagos: Math.round(
        Sep_Pagos.getBoundingClientRect().top -
        Pago.getBoundingClientRect().bottom
      ),
      gapApps: Math.round(
        Sep_Apps.getBoundingClientRect().top -
        Boton.getBoundingClientRect().bottom
      ),
      marginBottomApps: Estilos_Apps.marginBottom,
      colorSeparador: getComputedStyle(Sep_Apps)
        .backgroundColor
    };
  });

  expect(resultado.marginBottomApps).toBe("10px");
  expect(resultado.colorSeparador).toBe(
    "rgba(143, 124, 98, 0.16)"
  );
  expect(
    Math.abs(resultado.gapApps - resultado.gapPagos)
  ).toBeLessThanOrEqual(2);
});

test("traduce la seccion de apps y sus modales", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Leer = (Tipo) => {
      Abrir_Modal_App_Config(Tipo);
      const Datos = {
        apps: document.querySelector(
          '[data-i18n="config.apps"]'
        )?.textContent?.trim() || "",
        hint: document.querySelector(
          '[data-i18n="config.apps_hint"]'
        )?.textContent?.trim() || "",
        titulo: document.querySelector(
          `#Cfg_App_${Tipo}_Overlay ` +
          '[data-i18n$="_titulo"]'
        )?.textContent?.trim() || "",
        nota: document.querySelector(
          `#Cfg_App_${Tipo}_Overlay ` +
          '[data-i18n="config.app_sin_link"]'
        )?.textContent?.trim() || "",
        boton: document.querySelector(
          `#Cfg_App_${Tipo}_Descargar`
        )?.textContent?.trim() || ""
      };
      Cerrar_Modal_App_Config(Tipo);
      return Datos;
    };

    const es = Leer("Desktop");
    Cambiar_Idioma("en");
    const en = Leer("Android");
    Cambiar_Idioma("pt");
    const pt = Leer("Desktop");
    return { es, en, pt };
  });

  expect(resultado.es.apps).toBe("Apps");
  expect(resultado.es.hint).toContain("descarga");
  expect(resultado.es.titulo).toBe("App Desktop");
  expect(resultado.es.nota).toContain("todavía");
  expect(resultado.es.boton).toBe("Descargar");

  expect(resultado.en.apps).toBe("Apps");
  expect(resultado.en.hint).toContain("download");
  expect(resultado.en.titulo).toBe("Android app");
  expect(resultado.en.nota).toContain("not been published");
  expect(resultado.en.boton).toBe("Download");

  expect(resultado.pt.apps).toBe("Apps");
  expect(resultado.pt.hint).toContain("download");
  expect(resultado.pt.titulo).toBe("App Desktop");
  expect(resultado.pt.nota).toContain("ainda não");
  expect(resultado.pt.boton).toBe("Baixar");
});
