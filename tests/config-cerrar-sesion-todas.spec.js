const { test, expect } = require("@playwright/test");

test(
  "config permite cerrar sesion en todas las computadoras",
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
      const Usuario = {
        id: "user-config",
        email: "config@example.com"
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
                const Actual = JSON.parse(
                  localStorage.getItem(
                    "Test_SignOut_Llamadas"
                  ) || "[]"
                );
                Actual.push(
                  Opciones.scope || "default"
                );
                localStorage.setItem(
                  "Test_SignOut_Llamadas",
                  JSON.stringify(Actual)
                );
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
                select() {
                  return this;
                },
                eq() {
                  return this;
                },
                async maybeSingle() {
                  return { data: null, error: null };
                },
                async upsert() {
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

    expect(Orden.at(-1)).toBe(
      "Cerrar sesión en todas"
    );

    await page.locator("#Cfg_Cerrar_Sesion_Todas").click();
    await page.locator(
      "#Dialogo_Overlay .Dialogo_Boton_Peligro"
    ).click();

    const Resumen = await page.evaluate(() => {
      return {
        llamadas: JSON.parse(
          localStorage.getItem(
            "Test_SignOut_Llamadas"
          ) || "[]"
        )
      };
    });

    expect(Resumen.llamadas).toEqual([
      "global",
      "local"
    ]);
  }
);
