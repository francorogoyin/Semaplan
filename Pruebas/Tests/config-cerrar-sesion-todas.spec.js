const { test, expect } = require("@playwright/test");

async function Preparar_App_Config(page) {
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
    const Usuario = {
      id: "user-config",
      email: "config@example.com"
    };

    const Leer_Flag = (Clave) =>
      localStorage.getItem(Clave) === "1";
    const Error_Timeout = {
      code: "57014",
      message: "canceling statement due to statement timeout"
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
                  subscription: { unsubscribe() {} }
                }
              };
            },
            async signOut(Opciones = {}) {
              const Scope = Opciones.scope || "default";
              const Actual = JSON.parse(
                localStorage.getItem(
                  "Test_SignOut_Llamadas"
                ) || "[]"
              );
              Actual.push(Scope);
              localStorage.setItem(
                "Test_SignOut_Llamadas",
                JSON.stringify(Actual)
              );
              if (
                Scope === "global" &&
                Leer_Flag("Test_Forzar_Error_SignOut_Global")
              ) {
                throw new Error(
                  "fallo signOut global simulado"
                );
              }
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
                  data: {
                    Es_Premium: false,
                    Suscripcion: {
                      estado: "paused",
                      detalle: {},
                      fecha_actualizacion:
                        "2026-04-14T00:00:00Z"
                    },
                    Historial: []
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
          from() {
            return {
              _accion: "",
              _payload: null,
              select() {
                return this;
              },
              eq() {
                return this;
              },
              async maybeSingle() {
                if (this._accion === "update") {
                  if (Leer_Flag("Test_Forzar_Error_Update")) {
                    return {
                      data: null,
                      error: Error_Timeout
                    };
                  }
                }
                if (this._accion === "insert") {
                  if (Leer_Flag("Test_Forzar_Error_Insert")) {
                    return {
                      data: null,
                      error: Error_Timeout
                    };
                  }
                }
                if (
                  this._accion === "insert" ||
                  this._accion === "update"
                ) {
                  localStorage.setItem(
                    "Test_Ultimo_Upsert_Estado",
                    JSON.stringify(this._payload)
                  );
                  return {
                    data: {
                      version: 1,
                      actualizado_en:
                        "2026-04-14T00:00:00Z"
                    },
                    error: null
                  };
                }
                return { data: null, error: null };
              },
              insert(Payload) {
                this._accion = "insert";
                this._payload = Payload;
                return this;
              },
              update(Payload) {
                this._accion = "update";
                this._payload = Payload;
                return this;
              },
              async upsert(Payload) {
                if (Leer_Flag("Test_Forzar_Error_Upsert")) {
                  return { error: Error_Timeout };
                }
                localStorage.setItem(
                  "Test_Ultimo_Upsert_Estado",
                  JSON.stringify(Payload)
                );
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

  await page.goto("/login.html");
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
  "config permite cerrar sesion en todas las computadoras",
  async ({ page }) => {
    await Preparar_App_Config(page);

    await page.evaluate(() => {
      Abrir_Config();
    });

    const Orden = await page.evaluate(() => {
      return Array.from(
        document.querySelectorAll(
          ".Cfg_Cuenta_Acciones_Fila button span:last-child"
        )
      ).map((El) => El.textContent.trim());
    });

    expect(Orden.at(-1)).toMatch(
      /Cerrar sesi.n en todas/
    );

    await page.locator("#Cfg_Cerrar_Sesion_Todas").click();
    await page.locator(
      "#Dialogo_Overlay .Dialogo_Boton_Peligro"
    ).click();

    const Resumen = await page.evaluate(() => {
      return {
        corte:
          JSON.parse(
            localStorage.getItem(
              "Test_Ultimo_Upsert_Estado"
            ) || "null"
          )?.estado?.Sesion_Global_Corte_Ms || 0,
        llamadas: JSON.parse(
          localStorage.getItem(
            "Test_SignOut_Llamadas"
          ) || "[]"
        )
      };
    });

    expect(Resumen.corte).toBeGreaterThan(0);
    expect(Resumen.llamadas).toEqual([
      "global",
      "local"
    ]);
  }
);

test(
  "cerrar sesion en todas usa signOut global si falla registrar corte",
  async ({ page }) => {
    await Preparar_App_Config(page);

    await page.evaluate(() => {
      localStorage.setItem("Test_Forzar_Error_Insert", "1");
      localStorage.removeItem("Test_Dialogos_Cerrar_Todas");

      const Dialogo_Original = Mostrar_Dialogo;
      Mostrar_Dialogo = async (
        Texto,
        Botones = []
      ) => {
        const Dialogos = JSON.parse(
          localStorage.getItem("Test_Dialogos_Cerrar_Todas") ||
          "[]"
        );
        Dialogos.push(Texto);
        localStorage.setItem(
          "Test_Dialogos_Cerrar_Todas",
          JSON.stringify(Dialogos)
        );
        return Botones[0]?.Valor ?? true;
      };
      window.__Restaurar_Dialogo_Test = () => {
        Mostrar_Dialogo = Dialogo_Original;
      };
    });

    await page.evaluate(() => {
      Abrir_Config();
    });
    await page.locator("#Cfg_Cerrar_Sesion_Todas").click();

    await page.waitForFunction(() => {
      const Llamadas = JSON.parse(
        localStorage.getItem("Test_SignOut_Llamadas") ||
        "[]"
      );
      return (
        Llamadas.includes("global") &&
        Llamadas.includes("local")
      );
    });

    const Resumen = await page.evaluate(() => {
      window.__Restaurar_Dialogo_Test?.();
      return {
        dialogos: JSON.parse(
          localStorage.getItem("Test_Dialogos_Cerrar_Todas") ||
          "[]"
        ),
        llamadas: JSON.parse(
          localStorage.getItem("Test_SignOut_Llamadas") ||
          "[]"
        )
      };
    });

    expect(Resumen.dialogos.at(0)).toMatch(
      /Cerrar sesi.n/
    );
    expect(
      Resumen.dialogos.some((Texto) =>
        Texto.includes("cambios sin guardar")
      )
    ).toBe(false);
    expect(Resumen.llamadas).toEqual([
      "global",
      "local"
    ]);
  }
);

test(
  "sesiones operativas conserva dos pestañas con mismo id y distinta instancia",
  async ({ page }) => {
    await Preparar_App_Config(page);

    const Resumen = await page.evaluate(() => {
      const Id = Obtener_Sesion_Operativa_Id();
      const Instancia_Actual =
        Obtener_Sesion_Operativa_Instancia_Id();
      const Instancia_Otra = `${Instancia_Actual}_otra`;
      const Estado_Base = {
        Sesiones_Operativas: {
          Activas: {
            [Id]: {
              Id,
              Instancia_Id: Instancia_Otra,
              Ultimo_Visto_Ms: Date.now()
            }
          },
          Actualizado_Ms: Date.now()
        }
      };

      const Estado_Preparado =
        Preparar_Estado_Sesiones_Operativas(
          Estado_Base
        );
      const Activas =
        Estado_Preparado?.Sesiones_Operativas?.Activas ||
        {};
      const Activas_Sin_Actual =
        Obtener_Sesiones_Operativas_Activas(
          { Sesiones_Operativas: { Activas } },
          Id
        );

      return {
        id: Id,
        instanciaActual: Instancia_Actual,
        instanciaOtra: Instancia_Otra,
        claves: Object.keys(Activas),
        cantidad: Object.keys(Activas).length,
        otrasAbiertas: Activas_Sin_Actual.length
      };
    });

    expect(Resumen.claves).toContain(
      `${Resumen.id}::${Resumen.instanciaActual}`
    );
    expect(Resumen.claves).toContain(
      `${Resumen.id}::${Resumen.instanciaOtra}`
    );
    expect(Resumen.cantidad).toBe(2);
    expect(Resumen.otrasAbiertas).toBe(1);
  }
);
