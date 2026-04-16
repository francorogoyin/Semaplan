const { test, expect } = require("@playwright/test");

test("deja espacio vertical entre acciones de cuenta y botones", async ({
  page
}) => {
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

  const medida = await page.evaluate(() => {
    const Seccion_Apps = document.querySelector(
      ".Config_Seccion_Apps"
    );
    const Seccion_Cuenta = document.querySelector(
      ".Config_Seccion_Cuenta"
    );
    const Campo = document.querySelector(
      ".Cfg_Cuenta_Campo_Acciones"
    );
    const Titulo_Apps = Seccion_Apps?.querySelector(
      ".Config_Seccion_Titulo"
    );
    const Titulo_Acciones = Campo?.querySelector(
      ".Config_Seccion_Titulo"
    );
    const Fila_Apps = Seccion_Apps?.querySelector(
      ".Cfg_Apps_Lista"
    );
    const Fila = Campo?.querySelector(
      ".Cfg_Cuenta_Acciones_Fila"
    );
    const Titulo_Version = Array.from(
      document.querySelectorAll(".Config_Seccion_Titulo")
    ).find((El) => {
      return (El.textContent || "").includes("Versi");
    });
    const Fila_Version = document.querySelector(
      "#Cfg_Version_Programa"
    )?.closest(".Config_Fila");
    const Detalle_Version = document.getElementById(
      "Cfg_Version_Detalle"
    );
    const Seccion_Version = Fila_Version?.closest(
      ".Config_Seccion"
    );
    if (
      !Seccion_Apps ||
      !Seccion_Cuenta ||
      !Campo ||
      !Titulo_Apps ||
      !Titulo_Acciones ||
      !Fila ||
      !Fila_Apps ||
      !Titulo_Version ||
      !Fila_Version ||
      !Detalle_Version ||
      !Seccion_Version
    ) {
      return null;
    }
    const Rect_Etiqueta =
      Titulo_Acciones.getBoundingClientRect();
    const Rect_Fila = Fila.getBoundingClientRect();
    const Rect_Titulo_Apps =
      Titulo_Apps.getBoundingClientRect();
    const Rect_Fila_Apps = Fila_Apps.getBoundingClientRect();
    const Rect_Seccion_Apps =
      Seccion_Apps.getBoundingClientRect();
    const Rect_Seccion_Cuenta =
      Seccion_Cuenta.getBoundingClientRect();
    const Rect_Campo = Campo.getBoundingClientRect();
    const Rect_Titulo_Version =
      Titulo_Version.getBoundingClientRect();
    const Rect_Fila_Version =
      Fila_Version.getBoundingClientRect();
    const Rect_Detalle_Version =
      Detalle_Version.getBoundingClientRect();
    const Rect_Seccion_Version =
      Seccion_Version.getBoundingClientRect();
    return {
      apps_antes_cuenta:
        Rect_Seccion_Apps.top <
        Rect_Seccion_Cuenta.top,
      gap_entre_secciones:
        Rect_Seccion_Cuenta.top -
        Rect_Seccion_Apps.bottom,
      gap: Rect_Fila.top - Rect_Etiqueta.bottom,
      gap_apps:
        Rect_Fila_Apps.top - Rect_Titulo_Apps.bottom,
      gap_version:
        Rect_Fila_Version.top - Rect_Titulo_Version.bottom,
      gap_inferior:
        Rect_Campo.bottom - Rect_Fila.bottom,
      gap_inferior_version:
        Rect_Seccion_Version.bottom -
        Rect_Detalle_Version.bottom
    };
  });

  expect(medida).not.toBeNull();
  expect(medida.apps_antes_cuenta).toBeTruthy();
  expect(medida.gap_entre_secciones).toBeGreaterThanOrEqual(20);
  expect(Math.abs(medida.gap_apps - medida.gap_version))
    .toBeLessThanOrEqual(2);
  expect(Math.abs(medida.gap - medida.gap_version))
    .toBeLessThanOrEqual(2);
  expect(
    Math.abs(
      medida.gap_inferior -
      medida.gap_inferior_version
    )
  ).toBeLessThanOrEqual(8);
});

test("equilibra los espacios entre miembro, aviso, pagos y backups",
async ({ page }) => {
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
    Usuario_Actual = {
      email: "demo@semaplan.com",
      created_at: "2026-04-07T00:00:00Z"
    };
    Suscripcion_Detalle_Remota = {
      estado: "authorized",
      fecha_actualizacion: "2026-05-12T00:00:00Z",
      fecha_evento: "2026-04-12T02:40:00Z",
      monto: 999,
      moneda: "ARS"
    };
    Suscripcion_Historial_Remoto = [
      {
        estado: "authorized",
        fecha_evento: "2026-04-12T02:40:00Z",
        monto: 999,
        moneda: "ARS"
      }
    ];
    Config.Plan_Actual = "Upgrade";
    Renderizar_Datos_Cuenta();
    Crear_Backup_Local("Manual");
  });

  const medida = await page.evaluate(() => {
    const Obtener_Rect_Texto = (Elemento) => {
      const Rango = document.createRange();
      Rango.selectNodeContents(Elemento);
      return Rango.getBoundingClientRect();
    };
    const Campo_Miembro = document.getElementById(
      "Cfg_Miembro_Desde"
    )?.closest(".Cfg_Cuenta_Campo");
    const Aviso = document.getElementById(
      "Cfg_Suscripcion_Aviso"
    );
    const Etiqueta_Historial = document.querySelector(
      ".Cfg_Cuenta_Campo_Historial .Cfg_Cuenta_Etiqueta"
    );
    const Primera_Celda = document.querySelector(
      "#Cfg_Pagos_Historial .Cfg_Pagos_Tabla td"
    );
    const Etiqueta_Backups = document.querySelector(
      ".Config_Backup_Historial > .Cfg_Cuenta_Etiqueta"
    );
    const Primer_Backup = document.querySelector(
      "#Cfg_Backup_Lista .Config_Backup_Meta"
    );
    if (
      !Campo_Miembro ||
      !Aviso ||
      Aviso.hidden ||
      !Etiqueta_Historial ||
      !Primera_Celda ||
      !Etiqueta_Backups ||
      !Primer_Backup
    ) {
      return null;
    }
    const Rect_Miembro = Campo_Miembro.getBoundingClientRect();
    const Rect_Aviso = Aviso.getBoundingClientRect();
    const Rect_Etiqueta =
      Obtener_Rect_Texto(Etiqueta_Historial);
    const Rect_Primera_Celda =
      Obtener_Rect_Texto(Primera_Celda);
    const Rect_Etiqueta_Backups =
      Obtener_Rect_Texto(Etiqueta_Backups);
    const Rect_Primer_Backup =
      Obtener_Rect_Texto(Primer_Backup);
    return {
      gap_miembro_aviso: Math.round(
        Rect_Aviso.top - Rect_Miembro.bottom
      ),
      gap_aviso_historial: Math.round(
        Rect_Etiqueta.top - Rect_Aviso.bottom
      ),
      gap_historial_primer_item: Math.round(
        Rect_Primera_Celda.top - Rect_Etiqueta.bottom
      ),
      gap_backups_primer_item: Math.round(
        Rect_Primer_Backup.top - Rect_Etiqueta_Backups.bottom
      )
    };
  });

  expect(medida).not.toBeNull();
  expect(medida.gap_miembro_aviso)
    .toBeGreaterThanOrEqual(28);
  expect(medida.gap_miembro_aviso)
    .toBeLessThanOrEqual(32);
  expect(medida.gap_aviso_historial)
    .toBeGreaterThanOrEqual(28);
  expect(medida.gap_aviso_historial)
    .toBeLessThanOrEqual(32);
  expect(medida.gap_historial_primer_item)
    .toBeGreaterThanOrEqual(8);
  expect(medida.gap_historial_primer_item)
    .toBeLessThanOrEqual(12);
  expect(medida.gap_backups_primer_item)
    .toBeGreaterThanOrEqual(8);
  expect(medida.gap_backups_primer_item)
    .toBeLessThanOrEqual(12);
  expect(
    Math.abs(
      medida.gap_historial_primer_item -
      medida.gap_backups_primer_item
    )
  ).toBeLessThanOrEqual(2);
});
