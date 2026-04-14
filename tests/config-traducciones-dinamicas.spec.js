const { test, expect } = require("@playwright/test");

async function preparar(page, estadoInicial) {
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
  await page.addInitScript((estado) => {
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
      JSON.stringify(estado)
    );
  }, estadoInicial);
  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
}

test("re-renderiza backups y menu del config al cambiar idioma", async ({
  page
}) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Menu_Estilo: "Iconos",
      Menu_Botones_Visibles: {
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true
      },
      Plan_Actual: "Premium"
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Abrir_Config();

    const Leer = () => ({
      backup: document.getElementById("Cfg_Backup_Lista")
        ?.textContent?.trim() || "",
      menu: Array.from(
        document.querySelectorAll(
          "#Cfg_Menu_Botones_Lista label span:last-child"
        )
      ).map((item) => item.textContent.trim())
    });

    const es = Leer();
    Cambiar_Idioma("en");
    const en = Leer();
    Cambiar_Idioma("pt");
    const pt = Leer();

    return { es, en, pt };
  });

  expect(resultado.es.backup).toContain(
    "Todavía no hay copias guardadas."
  );
  expect(resultado.es.menu).toContain("Plan actual");
  expect(resultado.es.menu).toContain("Modo foco");

  expect(resultado.en.backup).toContain(
    "There are no backups yet."
  );
  expect(resultado.en.menu).toContain("Current plan");
  expect(resultado.en.menu).toContain("Focus mode");

  expect(resultado.pt.backup).toContain(
    "Ainda nao ha copias salvas."
  );
  expect(resultado.pt.menu).toContain("Plano atual");
  expect(resultado.pt.menu).toContain("Modo foco");
});

test("re-renderiza suscripcion, topbar, baul y archivero",
async ({ page }) => {
  const estadoInicial = {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [
      {
        Id: "CAT_AUD",
        Nombre: "Casa",
        Emoji: "🏠",
        Color_Baul: "#d9e4d0",
        Metadatos: []
      }
    ],
    Etiquetas: [],
    Baul_Tareas: [
      {
        Id: "BAUL_AUD",
        Nombre: "Ordenar",
        Emoji: "🧰",
        Categoria_Id: "CAT_AUD",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1
      }
    ],
    Baul_Grupos_Colapsados: {},
    Archiveros: [
      {
        Id: "ARC_AUD",
        Nombre: "Audit",
        Emoji: "🗃️",
        Fecha_Creacion: 1
      }
    ],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Menu_Estilo: "Iconos",
      Menu_Botones_Visibles: {
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true
      },
      Plan_Actual: "Upgrade",
      Baul_Tareas_Por_Fila: 5,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno"
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };

  await preparar(page, estadoInicial);

  const resultado = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();

    const Trial_Hasta = "2026-05-14T03:24:00Z";
    Suscripcion_Detalle_Remota = {
      estado: "trial",
      trial_hasta: Trial_Hasta,
      detalle: {
        trial_hasta: Trial_Hasta
      }
    };
    Config.Plan_Actual = "Upgrade";

    const Leer_Suscripcion = () => ({
      aviso: document.getElementById("Plan_Top_Indicador")
        ?.textContent?.trim() || "",
      estado: document.getElementById(
        "Suscripcion_Estado_Upgrade"
      )?.textContent?.trim() || "",
      sync: Array.from(
        document.querySelectorAll(
          "#Suscripcion_Card_Upgrade .Suscripcion_Feature"
        )
      ).at(-1)?.textContent?.trim() || ""
    });

    Abrir_Suscripcion();
    const es = Leer_Suscripcion();
    Cambiar_Idioma("en");
    const en = Leer_Suscripcion();
    Cambiar_Idioma("pt");
    const pt = Leer_Suscripcion();

    document.getElementById("Suscripcion_Overlay")
      ?.classList.remove("Activo");

    Cambiar_Idioma("en");
    Abrir_Baul();
    const baul_en = document.querySelector(
      "#Baul_Ordenar_Por option:checked"
    )?.textContent?.trim() || "";

    document.getElementById("Baul_Overlay")
      ?.classList.remove("Activo");

    Cambiar_Idioma("pt");
    Abrir_Archivero();
    const archivero_pt = document.querySelector(
      "#Archivero_Filtro_Etiqueta_Select option:checked"
    )?.textContent?.trim() || "";

    return {
      es,
      en,
      pt,
      baul_en,
      archivero_pt
    };
  });

  expect(resultado.es.aviso).toContain(
    "prueba finaliza"
  );
  expect(resultado.es.estado).toContain(
    "prueba"
  );
  expect(resultado.es.sync).toContain(
    "dispositivos"
  );

  expect(resultado.en.aviso).toContain(
    "trial ends on"
  );
  expect(resultado.en.estado).toBe(
    "Your trial is active"
  );
  expect(resultado.en.sync).toBe(
    "Cross-device sync"
  );

  expect(resultado.pt.aviso).toContain(
    "teste termina"
  );
  expect(resultado.pt.estado).toContain(
    "teste"
  );
  expect(resultado.pt.sync).toContain(
    "dispositivos"
  );

  expect(resultado.baul_en).toBe("Custom");
  expect(resultado.archivero_pt).toBe("Todos");
});
