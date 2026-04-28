const { test, expect } = require("@playwright/test");

async function Preparar_App_Config_Tokens(page) {
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
      id: "user-config-tokens",
      email: "config@example.com"
    };
    const Tokens_Iniciales = [
      {
        id: "token-activo",
        usuario_id: Usuario.id,
        nombre: "Servidor principal",
        scopes: ["read"],
        creado_en: "2026-04-26T09:00:00Z",
        ultimo_uso_en: "2026-04-28T11:15:00Z",
        revocado_en: null
      },
      {
        id: "token-revocado",
        usuario_id: Usuario.id,
        nombre: "Token viejo",
        scopes: ["read"],
        creado_en: "2026-04-21T08:30:00Z",
        ultimo_uso_en: null,
        revocado_en: "2026-04-24T18:00:00Z"
      }
    ];

    const Leer_Tokens = () => {
      const Guardados = localStorage.getItem(
        "Test_IA_Tokens_Datos"
      );
      if (Guardados) return JSON.parse(Guardados);
      localStorage.setItem(
        "Test_IA_Tokens_Datos",
        JSON.stringify(Tokens_Iniciales)
      );
      return JSON.parse(JSON.stringify(Tokens_Iniciales));
    };

    const Guardar_Tokens = (Tokens) => {
      localStorage.setItem(
        "Test_IA_Tokens_Datos",
        JSON.stringify(Tokens)
      );
    };

    const Leer_Flag = (Clave) =>
      localStorage.getItem(Clave) === "1";

    const Error_Timeout = {
      code: "57014",
      message: "canceling statement due to statement timeout"
    };

    function Crear_Query(Tabla) {
      return {
        _tabla: Tabla,
        _accion: "select",
        _payload: null,
        _eq: [],
        _is: [],
        _not: [],
        _order: null,
        select() {
          this._accion = "select";
          return this;
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
        delete() {
          this._accion = "delete";
          return this;
        },
        eq(Clave, Valor) {
          this._eq.push([Clave, Valor]);
          return this;
        },
        is(Clave, Valor) {
          this._is.push([Clave, Valor]);
          return this;
        },
        not(Clave, Operador, Valor) {
          this._not.push([Clave, Operador, Valor]);
          return this;
        },
        order(Clave, Config = {}) {
          this._order = {
            Clave,
            Asc: Config.ascending !== false
          };
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
                actualizado_en: "2026-04-14T00:00:00Z"
              },
              error: null
            };
          }
          return { data: null, error: null };
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
        },
        _coincide(Item) {
          const Eq_Ok = this._eq.every(([Clave, Valor]) => {
            return Item?.[Clave] === Valor;
          });
          const Is_Ok = this._is.every(([Clave, Valor]) => {
            return Valor === null
              ? Item?.[Clave] == null
              : Item?.[Clave] === Valor;
          });
          const Not_Ok = this._not.every(
            ([Clave, Operador, Valor]) => {
              if (Operador === "is" && Valor === null) {
                return Item?.[Clave] != null;
              }
              return true;
            }
          );
          return Eq_Ok && Is_Ok && Not_Ok;
        },
        async _ejecutar_Tokens() {
          let Tokens = Leer_Tokens();
          if (this._accion === "select") {
            let Resultado = Tokens.filter((Item) =>
              this._coincide(Item)
            );
            if (this._order?.Clave) {
              const Clave = this._order.Clave;
              const Factor = this._order.Asc ? 1 : -1;
              Resultado = [...Resultado].sort((A, B) => {
                return (
                  String(A?.[Clave] || "").localeCompare(
                    String(B?.[Clave] || "")
                  ) * Factor
                );
              });
            }
            return { data: Resultado, error: null };
          }

          if (this._accion === "insert") {
            const Ahora = new Date().toISOString();
            const Nuevo = {
              id: `token-${Date.now()}`,
              usuario_id: this._payload.usuario_id,
              nombre: this._payload.nombre,
              scopes: this._payload.scopes || ["read"],
              creado_en: Ahora,
              ultimo_uso_en: null,
              revocado_en: null
            };
            Tokens.unshift(Nuevo);
            Guardar_Tokens(Tokens);
            return { data: [Nuevo], error: null };
          }

          if (this._accion === "update") {
            Tokens = Tokens.map((Item) => {
              if (!this._coincide(Item)) return Item;
              return {
                ...Item,
                ...this._payload
              };
            });
            Guardar_Tokens(Tokens);
            return { data: null, error: null };
          }

          if (this._accion === "delete") {
            Tokens = Tokens.filter((Item) => !this._coincide(Item));
            Guardar_Tokens(Tokens);
            return { data: null, error: null };
          }

          return { data: null, error: null };
        },
        then(resolve, reject) {
          if (this._tabla === "tokens_ia_usuario") {
            return this._ejecutar_Tokens().then(
              resolve,
              reject
            );
          }
          return Promise.resolve({
            data: null,
            error: null
          }).then(resolve, reject);
        }
      };
    }

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
          from(Tabla) {
            return Crear_Query(Tabla);
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
    const Loader = document.getElementById("App_Loader");
    const Auth = document.getElementById("Auth_Overlay");
    return Loader?.classList.contains("Oculto") &&
      !Auth?.classList.contains("Activo");
  });
}

test(
  "config permite crear, renombrar, revocar y borrar tokens IA",
  async ({ page }) => {
    await Preparar_App_Config_Tokens(page);

    await page.evaluate(() => {
      Abrir_Config();
    });

    const Lista = page.locator("#Cfg_IA_Tokens_Lista");
    await expect(Lista).toContainText("Servidor principal");
    await expect(Lista).toContainText("Token viejo");

    const Meta_Usado = page.locator(
      ".Cfg_IA_Token_Meta_Ultimo_Usado"
    );
    await expect(Meta_Usado).toHaveCount(1);

    await page.locator("#Cfg_IA_Token_Crear_Btn").click();

    const Token_Visible = page.locator(
      "#Cfg_IA_Token_Ultimo_Valor"
    );
    await expect(Token_Visible).toContainText("sai_");

    const Tarjeta_Nueva = page
      .locator(".Cfg_IA_Token_Card")
      .first();
    await expect(Tarjeta_Nueva).toContainText(
      "Integracion IA 3"
    );

    await Tarjeta_Nueva
      .locator("[data-ia-token-renombrar]")
      .click();
    await page.locator("#Dialogo_Input_Campo").fill(
      "Agente semanal"
    );
    await page
      .locator(".Dialogo_Boton_Primario")
      .click();

    await expect(Tarjeta_Nueva).toContainText("Agente semanal");

    await Tarjeta_Nueva
      .locator("[data-ia-token-revocar]")
      .click();
    await page.locator(".Dialogo_Boton_Peligro").click();

    await expect(Tarjeta_Nueva).toContainText("Revocado");
    await expect(
      Tarjeta_Nueva.locator("[data-ia-token-eliminar]")
    ).toBeVisible();

    await Tarjeta_Nueva
      .locator("[data-ia-token-eliminar]")
      .click();
    await page.locator(".Dialogo_Boton_Peligro").click();

    await expect(Lista).not.toContainText("Agente semanal");
    await expect(page.locator(".Cfg_IA_Token_Card"))
      .toHaveCount(2);
  }
);
