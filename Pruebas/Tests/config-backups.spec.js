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
    const Titulo_Historial = document.querySelector(
      ".Config_Backup_Historial > .Cfg_Cuenta_Etiqueta"
    );
    const Estilo_Titulo = Titulo_Historial
      ? window.getComputedStyle(Titulo_Historial)
      : null;
    const Rect_Titulo = Titulo_Historial
      ? Titulo_Historial.getBoundingClientRect()
      : null;
    const Rect_Lista = document.getElementById("Cfg_Backup_Lista")
      ?.getBoundingClientRect();
    const Obtener_Rect_Texto = (Elemento) => {
      if (!Elemento) return null;
      const Rango = document.createRange();
      Rango.selectNodeContents(Elemento);
      return Rango.getBoundingClientRect();
    };
    const Rect_Meta = Obtener_Rect_Texto(
      Primer_Item?.querySelector(".Config_Backup_Meta")
    );
    return {
      tipos: Lista.map((Item) => Item.Tipo),
      tituloHistorial: Titulo_Historial?.textContent?.trim()
        || "",
      visibles: document.querySelectorAll(
        "#Cfg_Backup_Lista .Config_Backup_Item"
      ).length,
      borderRadius: Estilo?.borderRadius || "",
      background: Estilo?.backgroundColor || "",
      bordeInferior: Estilo?.borderBottomWidth || "",
      orden_1: Primer_Item?.children?.[0]?.className || "",
      orden_2: Primer_Item?.children?.[1]?.className || "",
      fontWeightTitulo: Estilo_Titulo?.fontWeight || "",
      flexTitulo: Estilo_Titulo?.flexBasis || "",
      anchoTitulo: Estilo_Titulo?.width || "",
      separacionTituloLista: Rect_Titulo && Rect_Lista
        ? Rect_Lista.top - Rect_Titulo.bottom
        : null,
      separacionTituloTexto: Rect_Titulo && Rect_Meta
        ? Rect_Meta.top - Rect_Titulo.bottom
        : null,
      fontWeightTipo: Estilo_Tipo?.fontWeight || "",
      radioBoton: Estilo_Boton?.borderRadius || "",
      fondoBoton: Estilo_Boton?.backgroundColor || ""
    };
  });

  expect(resumen.tipos).toContain("Manual");
  expect(resumen.tituloHistorial).toBe("Historial de backups");
  expect(resumen.visibles).toBeGreaterThanOrEqual(1);
  expect(resumen.borderRadius).toBe("0px");
  expect(resumen.background).toBe("rgba(0, 0, 0, 0)");
  expect(resumen.bordeInferior).toBe("0px");
  expect(resumen.orden_1).toBe("Config_Backup_Meta");
  expect(resumen.orden_2).toBe("Config_Backup_Tipo");
  expect(Number(resumen.fontWeightTitulo)).toBeGreaterThanOrEqual(700);
  expect(resumen.flexTitulo).toBe("auto");
  expect(resumen.separacionTituloLista).toBeGreaterThanOrEqual(9);
  expect(resumen.separacionTituloLista).toBeLessThanOrEqual(11);
  expect(resumen.separacionTituloTexto).toBeGreaterThanOrEqual(8);
  expect(resumen.separacionTituloTexto).toBeLessThanOrEqual(12);
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

test("no dibuja separadores entre varias copias", async ({
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

  const bordes = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Crear_Backup_Local("Manual");
    Crear_Backup_Local("Manual");
    Abrir_Config();
    return Array.from(
      document.querySelectorAll(
        "#Cfg_Backup_Lista .Config_Backup_Item"
      )
    ).map((Item) =>
      window.getComputedStyle(Item).borderBottomWidth
    );
  });

  expect(bordes).toEqual(["0px", "0px"]);
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
          Estado: { Objetivos: [], Eventos: [] }
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

test("muestra horario, próximo backup y toast al crear",
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
        Config_Extra: {
          Backup_Auto_Activo: true,
          Backup_Auto_Horas: 24,
          Backup_Auto_Inicio: "09:30",
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
    Abrir_Config();
  });

  const antes = await page.evaluate(() => {
    const Detalle = document.getElementById(
      "Cfg_Backup_Auto_Detalle"
    );
    const Campo = document.getElementById(
      "Cfg_Backup_Auto_Inicio"
    );
    const Estilo = Campo
      ? window.getComputedStyle(Campo)
      : null;
    return {
      activo: Detalle?.classList.contains("Activo"),
      hora: document.getElementById(
        "Cfg_Backup_Auto_Inicio"
      )?.value || "",
      proximo: document.getElementById(
        "Cfg_Backup_Proximo"
      )?.textContent?.trim() || "",
      radio: Estilo?.borderRadius || "",
      borde: Estilo?.borderTopColor || "",
      ancho: Estilo?.width || ""
    };
  });

  expect(antes.activo).toBe(true);
  expect(antes.hora).toBe("09:30");
  expect(antes.proximo.length).toBeGreaterThan(10);
  expect(antes.radio).toBe("10px");
  expect(antes.borde).not.toBe("rgba(0, 0, 0, 0)");
  expect(antes.ancho).toBe("160px");

  await page.click("#Cfg_Backup_Manual_Btn");

  const despues = await page.evaluate(() => {
    const Toast = document.querySelector(
      "#Undo_Contenedor .Undo_Toast_Texto"
    );
    return {
      texto: Toast?.textContent?.trim() || "",
      total: JSON.parse(
        localStorage.getItem("Semaplan_Backups_V1") || "[]"
      ).length
    };
  });

  expect(despues.texto).toContain("Copia manual");
  expect(despues.total).toBeGreaterThan(0);
});

test("pide confirmación y password en restore y delete",
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

  const resumen = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Usuario_Actual = {
      id: "usr",
      email: "tester@example.com"
    };
    Supa = {};
    Crear_Backup_Local("Manual");
    Abrir_Config();

    const Llamadas = {
      confirmaciones: [],
      passwords: 0,
      restaurar: 0
    };
    Mostrar_Dialogo = async (mensaje) => {
      Llamadas.confirmaciones.push(mensaje);
      return true;
    };
    Mostrar_Dialogo_Con_Password_Y_Captcha = async () => {
      Llamadas.passwords += 1;
      return {
        Password: "secreta",
        Captcha_Token: "qa"
      };
    };
    Verificar_Password_Actual = async () => ({
      Ok: true,
      Msg: ""
    });
    Aplicar_Importacion_Objeto = async () => {
      Llamadas.restaurar += 1;
      return true;
    };

    const Backup = Backups_Locales[0];
    await Restaurar_Backup_Local(Backup);
    await Eliminar_Backup_Local(Backup);

    return {
      confirmaciones: Llamadas.confirmaciones.length,
      passwords: Llamadas.passwords,
      restaurar: Llamadas.restaurar,
      restantes: document.querySelectorAll(
        "#Cfg_Backup_Lista .Config_Backup_Item"
      ).length
    };
  });

  expect(resumen.confirmaciones).toBe(2);
  expect(resumen.passwords).toBe(2);
  expect(resumen.restaurar).toBe(1);
  expect(resumen.restantes).toBe(0);
});

test("preserva backups manuales aunque entren automaticos", async ({
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

  const resumen = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    const Manuales = [];
    for (let I = 0; I < 3; I += 1) {
      Manuales.push(Crear_Backup_Local("Manual").Id);
    }
    for (let I = 0; I < 15; I += 1) {
      Crear_Backup_Local("Auto");
    }
    const Lista = JSON.parse(
      localStorage.getItem("Semaplan_Backups_V1") || "[]"
    );
    return {
      total: Lista.length,
      manuales: Lista
        .filter((Item) => Item.Tipo === "Manual")
        .map((Item) => Item.Id),
      autos: Lista.filter((Item) => Item.Tipo === "Auto")
        .length,
      manuales_esperados: Manuales
    };
  });

  expect(resumen.total).toBe(12);
  expect(resumen.autos).toBe(9);
  expect(resumen.manuales).toEqual(
    resumen.manuales_esperados.reverse()
  );
});

test("el salvavidas persiste cambios locales desfasados", async ({
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
        Config_Extra: {
          Inicio_Hora: 8
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

  const resumen = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Cargando_Inicial = false;
    Cargar_Backups_Locales();
    Config.Inicio_Hora = 7;
    Objetivos.push({
      Id: "obj_1",
      Nombre: "Persistido",
      Emoji: "P",
      Color: "#123456"
    });
    Backups_Locales = [
      {
        Id: "bkp-manual",
        Tipo: "Manual",
        Fecha: 1,
        Estado: Construir_Estado_Completo()
      }
    ];
    Ejecutar_Salvavidas_Persistencia_Local();
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2") || "{}"
    );
    return {
      inicio_hora: Estado.Config_Extra?.Inicio_Hora,
      objetivos: (Estado.Objetivos || []).map(
        (Item) => Item.Id
      ),
      backups: JSON.parse(
        localStorage.getItem("Semaplan_Backups_V1") || "[]"
      ).map((Item) => Item.Id)
    };
  });

  expect(resumen.inicio_hora).toBe(7);
  expect(resumen.objetivos).toContain("obj_1");
  expect(resumen.backups).toEqual(["bkp-manual"]);
});
