const { test, expect } = require("@playwright/test");

function Crear_Tarea(Id, Nombre) {
  return {
    Id,
    Nombre,
    Emoji: "🧪",
    Color: "#f1b77e",
    Horas: 1,
    Dia: 0,
    Hora: 9,
    Duracion: 1,
    Subtareas: [],
    Copias_Semana: {}
  };
}

function Crear_Estado(Nombres) {
  return {
    Tareas: Nombres.map((Nombre, Indice) =>
      Crear_Tarea(Indice + 1, Nombre)
    ),
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
    Contador_Eventos: Nombres.length + 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Plan_Actual: "Free"
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

async function Preparar_App(page, Estado_Remoto) {
  await page.route(
    "https://cdn.jsdelivr.net/npm/@supabase/" +
    "supabase-js@2",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );
  await page.route(
    "https://challenges.cloudflare.com/" +
    "turnstile/v0/api.js?render=explicit",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: ""
      });
    }
  );

  await page.addInitScript(
    ({ Estado_Remoto_Inicial }) => {
      const Usuario = {
        id: "user-sync",
        email: "sync@example.com"
      };

      const Respuesta_Suscripcion = {
        Es_Premium: false,
        Suscripcion: {
          estado: "paused",
          detalle: {},
          fecha_actualizacion:
            "2026-04-14T00:00:00Z"
        },
        Historial: [
          {
            estado: "paused",
            fecha_evento: "2026-04-14T00:00:00Z"
          }
        ]
      };

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Inicial,
        actualizado_en: "2026-04-14T00:00:00Z"
      };
      window.__Keepalive_Llamadas = [];

      const Fetch_Original =
        window.fetch.bind(window);
      window.fetch = async (Url, Opciones = {}) => {
        if (
          String(Url).includes(
            "/rest/v1/estado_usuario"
          )
        ) {
          window.__Keepalive_Llamadas.push({
            keepalive: !!Opciones.keepalive,
            body: Opciones.body || ""
          });
          const Payload = JSON.parse(
            Opciones.body || "{}"
          );
          window.__Estado_Remoto = {
            estado: Payload.estado,
            actualizado_en:
              "2026-04-14T00:00:10Z"
          };
          return {
            ok: true,
            status: 201,
            async text() {
              return "";
            }
          };
        }
        return Fetch_Original(Url, Opciones);
      };

      window.supabase = {
        createClient() {
          return {
            auth: {
              async getSession() {
                return {
                  data: {
                    session: {
                      access_token: "token-demo",
                      user: Usuario
                    }
                  }
                };
              },
              onAuthStateChange() {
                return {
                  data: {
                    subscription: {
                      unsubscribe() {}
                    }
                  }
                };
              },
              async signOut() {
                return { error: null };
              },
              async refreshSession() {
                return {
                  data: {
                    session: {
                      access_token: "token-demo",
                      user: Usuario
                    }
                  },
                  error: null
                };
              }
            },
            functions: {
              async invoke(Nombre) {
                if (Nombre === "estado-suscripcion") {
                  return {
                    data: Respuesta_Suscripcion,
                    error: null
                  };
                }
                return {
                  data: null,
                  error: null
                };
              }
            },
            from(Tabla) {
              return {
                select() {
                  return this;
                },
                eq(Campo, Valor) {
                  this[Campo] = Valor;
                  return this;
                },
                async maybeSingle() {
                  if (
                    Tabla !== "estado_usuario" ||
                    this.user_id !== Usuario.id
                  ) {
                    return {
                      data: null,
                      error: null
                    };
                  }
                  return {
                    data: window.__Estado_Remoto,
                    error: null
                  };
                },
                async upsert(Payload) {
                  if (Tabla === "estado_usuario") {
                    window.__Estado_Remoto = {
                      estado: Payload.estado,
                      actualizado_en:
                        "2026-04-14T00:00:05Z"
                    };
                  }
                  return { error: null };
                }
              };
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
    },
    { Estado_Remoto_Inicial: Estado_Remoto }
  );

  await page.goto("/index.html");
  await page.waitForFunction(() => {
    const Loader =
      document.getElementById("App_Loader");
    const Auth =
      document.getElementById("Auth_Overlay");
    return Loader?.classList.contains("Oculto") &&
      !Auth?.classList.contains("Activo");
  });
}

test(
  "fuerza keepalive si la pagina se oculta con sync pendiente",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      Tareas.push({
        Id: 99,
        Nombre: "Cambio ocultando",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subtareas: [],
        Copias_Semana: {}
      });
      Guardar_Estado();

      const Pendiente_Antes =
        Hay_Sync_Pendiente();
      const Inicio_Keepalive =
        Backend_Sync_Forzar_Keepalive();

      await new Promise((Resolver) =>
        setTimeout(Resolver, 0)
      );

      const Llamada =
        window.__Keepalive_Llamadas[0] || null;
      const Payload = Llamada
        ? JSON.parse(Llamada.body)
        : null;

      return {
        pendienteAntes: Pendiente_Antes,
        inicioKeepalive: Inicio_Keepalive,
        keepalive: Llamada?.keepalive || false,
        nombres:
          Payload?.estado?.Tareas?.map(
            (Tarea) => Tarea.Nombre
          ) || [],
        syncEstado: Sync_Estado
      };
    });

    expect(Resumen.pendienteAntes).toBe(true);
    expect(Resumen.inicioKeepalive).toBe(true);
    expect(Resumen.keepalive).toBe(true);
    expect(Resumen.nombres).toContain(
      "Cambio ocultando"
    );
    expect(Resumen.syncEstado).toBe("Guardado");
  }
);

test(
  "recarga cambios remotos mas nuevos al volver al foco",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Solo remoto"])
    );

    await page.evaluate(({ Estado_Remoto_Nuevo }) => {
      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:20Z"
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Solo remoto",
        "Agregado desde otra compu"
      ])
    });

    const Resumen = await page.evaluate(async () => {
      const Refresco =
        await Backend_Revisar_Cambios_Remotos(true);
      const Estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Toast = document.querySelector(
        "#Undo_Contenedor .Undo_Toast_Texto"
      );

      return {
        refresco: Refresco,
        nombres:
          (Estado.Tareas || []).map(
            (Tarea) => Tarea.Nombre
          ),
        toast: Toast?.textContent?.trim() || ""
      };
    });

    expect(Resumen.refresco).toBe(true);
    expect(Resumen.nombres).toContain(
      "Agregado desde otra compu"
    );
    expect(Resumen.toast).toContain(
      "otro dispositivo"
    );
  }
);

test(
  "bloquea la app y deja recargar la version remota " +
  "si hay conflicto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    await page.evaluate(({ Estado_Remoto_Nuevo }) => {
      Tareas.push({
        Id: 99,
        Nombre: "Cambio local",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subtareas: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      Actualizar_Sync_Indicador("Guardado");

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:30Z"
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Base remota",
        "Cambio remoto"
      ])
    });

    await page.evaluate(async () => {
      await Backend_Revisar_Cambios_Remotos(true);
    });

    await expect(
      page.locator("#Dialogo_Overlay")
    ).toHaveClass(/Activo/);
    await expect(
      page.locator(".App_Contenedor")
    ).toHaveClass(/Sync_Bloqueada/);

    await page.getByRole(
      "button",
      { name: "Recargar cambios" }
    ).click();

    const Resumen = await page.evaluate(() => {
      const Estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      return {
        nombres:
          (Estado.Tareas || []).map(
            (Tarea) => Tarea.Nombre
          ),
        bloqueada: document
          .querySelector(".App_Contenedor")
          ?.classList.contains("Sync_Bloqueada"),
        sucio: Sync_Local_Sucio,
        conflicto: Sync_Conflicto_Pendiente
      };
    });

    expect(Resumen.nombres).toContain("Cambio remoto");
    expect(Resumen.nombres).not.toContain(
      "Cambio local"
    );
    expect(Resumen.bloqueada).toBe(false);
    expect(Resumen.sucio).toBe(false);
    expect(Resumen.conflicto).toBe(false);
  }
);

test(
  "permite conservar la version local y " +
  "sobrescribir la remota ante conflicto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    await page.evaluate(({ Estado_Remoto_Nuevo }) => {
      Tareas.push({
        Id: 77,
        Nombre: "Cambio local final",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subtareas: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      Actualizar_Sync_Indicador("Guardado");

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:40Z"
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Base remota",
        "Cambio remoto"
      ])
    });

    await page.evaluate(async () => {
      await Backend_Revisar_Cambios_Remotos(true);
    });

    await expect(
      page.locator("#Dialogo_Overlay")
    ).toHaveClass(/Activo/);

    await page.getByRole(
      "button",
      { name: "Conservar esta versión" }
    ).click();

    const Resumen = await page.evaluate(() => {
      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      return {
        local:
          (Estado_Local.Tareas || []).map(
            (Tarea) => Tarea.Nombre
          ),
        remoto:
          (window.__Estado_Remoto?.estado?.Tareas || [])
            .map((Tarea) => Tarea.Nombre),
        bloqueada: document
          .querySelector(".App_Contenedor")
          ?.classList.contains("Sync_Bloqueada"),
        sucio: Sync_Local_Sucio,
        conflicto: Sync_Conflicto_Pendiente
      };
    });

    expect(Resumen.local).toContain(
      "Cambio local final"
    );
    expect(Resumen.remoto).toContain(
      "Cambio local final"
    );
    expect(Resumen.remoto).not.toContain(
      "Cambio remoto"
    );
    expect(Resumen.bloqueada).toBe(false);
    expect(Resumen.sucio).toBe(false);
    expect(Resumen.conflicto).toBe(false);
  }
);
