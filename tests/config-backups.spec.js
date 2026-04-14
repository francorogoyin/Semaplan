const { test, expect } = require("@playwright/test");

test("crea backups automaticos y manuales en config", async ({
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
          Backup_Auto_Activo: true,
          Backup_Auto_Horas: 24,
          Backup_Auto_Ultimo: 0
        },
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
    Guardar_Estado();
    Abrir_Config();
  });

  await page.click("#Cfg_Backup_Manual_Btn");

  const resumen = await page.evaluate(() => {
    const Lista = JSON.parse(
      localStorage.getItem("Semaplan_Backups_V1") || "[]"
    );
    const Primer_Item = document.querySelector(
      "#Cfg_Backup_Lista .Config_Backup_Item"
    );
    const Estilo = Primer_Item
      ? window.getComputedStyle(Primer_Item)
      : null;
    const Tipo = Primer_Item?.querySelector(
      ".Config_Backup_Tipo"
    );
    const Estilo_Tipo = Tipo
      ? window.getComputedStyle(Tipo)
      : null;
    const Boton = Primer_Item?.querySelector(
      ".Config_Backup_Accion_Btn"
    );
    const Estilo_Boton = Boton
      ? window.getComputedStyle(Boton)
      : null;
    return {
      tipos: Lista.map((Item) => Item.Tipo),
      visibles: document.querySelectorAll(
        "#Cfg_Backup_Lista .Config_Backup_Item"
      ).length,
      borderRadius: Estilo?.borderRadius || "",
      background: Estilo?.backgroundColor || "",
      bordeInferior: Estilo?.borderBottomWidth || "",
      orden_1: Primer_Item?.children?.[0]?.className || "",
      orden_2: Primer_Item?.children?.[1]?.className || "",
      fontWeightTipo: Estilo_Tipo?.fontWeight || "",
      radioBoton: Estilo_Boton?.borderRadius || "",
      fondoBoton: Estilo_Boton?.backgroundColor || ""
    };
  });

  expect(resumen.tipos).toEqual(["Manual", "Auto"]);
  expect(resumen.visibles).toBe(2);
  expect(resumen.borderRadius).toBe("0px");
  expect(resumen.background).toBe("rgba(0, 0, 0, 0)");
  expect(resumen.bordeInferior).toBe("1px");
  expect(resumen.orden_1).toBe("Config_Backup_Meta");
  expect(resumen.orden_2).toBe("Config_Backup_Tipo");
  expect(Number(resumen.fontWeightTipo)).toBeLessThan(500);
  expect(resumen.radioBoton).toBe("999px");
  expect(resumen.fondoBoton).not.toBe("rgba(0, 0, 0, 0)");
});

test("no deja doble separador cuando hay una sola copia", async ({
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

  const resumen = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Crear_Backup_Local("Manual");
    Abrir_Config();
    const Item = document.querySelector(
      "#Cfg_Backup_Lista .Config_Backup_Item"
    );
    const Estilo = Item
      ? window.getComputedStyle(Item)
      : null;
    return {
      visibles: document.querySelectorAll(
        "#Cfg_Backup_Lista .Config_Backup_Item"
      ).length,
      bordeInferior: Estilo?.borderBottomWidth || ""
    };
  });

  expect(resumen.visibles).toBe(1);
  expect(resumen.bordeInferior).toBe("0px");
});

test("mantiene backups separados por usuario", async ({
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
              return {
                data: {
                  session: {
                    user: {
                      id: "user-b",
                      email: "b@example.com"
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
      "Semaplan_Estado_Usuario_V1",
      "user-a"
    );
    localStorage.setItem(
      "Semaplan_Backups_V1",
      JSON.stringify([
        {
          Id: "bkp-a",
          Tipo: "Manual",
          Fecha: 1,
          Estado: { Tareas: [], Eventos: [] }
        }
      ])
    );
  });

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );

  const resumen = await page.evaluate(() => {
    Usuario_Actual = {
      id: "user-b",
      email: "b@example.com"
    };
    Aislar_Cache_Local_Por_Usuario();
    Crear_Backup_Local("Manual");
    const Guardado_A = JSON.parse(
      localStorage.getItem(
        "Semaplan_Backups_V1_user-a"
      ) || "[]"
    );
    const Guardado_B = JSON.parse(
      localStorage.getItem(
        "Semaplan_Backups_V1_user-b"
      ) || "[]"
    );
    return {
      legado: localStorage.getItem(
        "Semaplan_Backups_V1"
      ),
      a: Guardado_A.map((Item) => Item.Id),
      b: Guardado_B.map((Item) => Item.Tipo)
    };
  });

  expect(resumen.legado).toBeNull();
  expect(resumen.a).toEqual(["bkp-a"]);
  expect(resumen.b).toEqual(["Manual"]);
});
