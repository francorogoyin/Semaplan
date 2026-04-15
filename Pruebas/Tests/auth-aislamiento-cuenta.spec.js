const { test, expect } = require("@playwright/test");

test(
  "no reutiliza cache local de otra cuenta",
  async ({ page }) => {
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

    await page.addInitScript(() => {
      const Estado_Patricio = {
        Objetivos: [
          {
            Id: 1,
            Nombre: "Objetivo de Patricio",
            Emoji: "🧪",
            Color: "#f1b77e",
            Horas: 1,
            Dia: 0,
            Hora: 9,
            Duracion: 1,
            Subobjetivos: [],
            Copias_Semana: {}
          }
        ],
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
        Contador_Eventos: 2,
        Objetivo_Seleccionada_Id: null,
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

      localStorage.setItem(
        "Semaplan_Estado_V2",
        JSON.stringify(Estado_Patricio)
      );
      localStorage.setItem(
        "Semaplan_Estado_Usuario_V1",
        "patricio-id"
      );

      window.__Estado_Remoto_Por_Usuario = {};
      window.__Upserts_Estado_Usuario = [];

      window.supabase = {
        createClient() {
          return {
            auth: {
              async getSession() {
                return {
                  data: {
                    session: {
                      access_token: "token-demo",
                      user: {
                        id: "tomas-id",
                        email: "tomashodel@gmail.com",
                        user_metadata: {}
                      }
                    }
                  }
                };
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
              },
              async refreshSession() {
                return {
                  data: {
                    session: {
                      access_token: "token-demo",
                      user: {
                        id: "tomas-id",
                        email: "tomashodel@gmail.com",
                        user_metadata: {}
                      }
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
                    data: {
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
                          fecha_evento:
                            "2026-04-14T00:00:00Z"
                        }
                      ]
                    },
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
                  if (Tabla !== "estado_usuario") {
                    return { data: null, error: null };
                  }
                  return {
                    data:
                      window.__Estado_Remoto_Por_Usuario[
                        this.user_id
                      ] || null,
                    error: null
                  };
                },
                async upsert(Payload) {
                  if (Tabla === "estado_usuario") {
                    window.__Upserts_Estado_Usuario.push(
                      Payload
                    );
                    window.__Estado_Remoto_Por_Usuario[
                      Payload.user_id
                    ] = {
                      estado: Payload.estado
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
    });

    await page.goto("/index.html");
    await page.waitForFunction(() => {
      const Loader =
        document.getElementById("App_Loader");
      const Auth =
        document.getElementById("Auth_Overlay");
      return Loader?.classList.contains("Oculto") &&
        !Auth?.classList.contains("Activo");
    });

    const Resumen = await page.evaluate(() => {
      const Estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") || "{}"
      );
      return {
        Usuario_Cache: localStorage.getItem(
          "Semaplan_Estado_Usuario_V1"
        ),
        Nombres_Objetivos:
          (Estado.Objetivos || []).map((T) => T.Nombre),
        Upserts:
          window.__Upserts_Estado_Usuario.map(
            (Item) => ({
              user_id: Item.user_id,
              nombres:
                (Item.estado?.Objetivos || [])
                  .map((T) => T.Nombre)
            })
          )
      };
    });

    expect(Resumen.Usuario_Cache).toBe("tomas-id");
    expect(Resumen.Nombres_Objetivos).not.toContain(
      "Objetivo de Patricio"
    );
    expect(Resumen.Upserts).toHaveLength(1);
    expect(Resumen.Upserts[0].user_id).toBe("tomas-id");
    expect(Resumen.Upserts[0].nombres).not.toContain(
      "Objetivo de Patricio"
    );
  }
);
