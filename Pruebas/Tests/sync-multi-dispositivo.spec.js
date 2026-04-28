const { test, expect } = require("@playwright/test");

function Crear_Objetivo(Id, Nombre) {
  return {
    Id,
    Nombre,
    Emoji: "🧪",
    Color: "#f1b77e",
    Horas: 1,
    Dia: 0,
    Hora: 9,
    Duracion: 1,
    Subobjetivos: [],
    Copias_Semana: {}
  };
}

function Crear_Estado(Nombres) {
  return {
    Objetivos: Nombres.map((Nombre, Indice) =>
      Crear_Objetivo(Indice + 1, Nombre)
    ),
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
    Contador_Eventos: Nombres.length + 1,
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
}

function Crear_Estado_Con_Slot(Fecha, Hora) {
  const Estado = Crear_Estado(["Base remota"]);
  const Clave = `${Fecha}|${Hora}`;
  Estado.Slots_Muertos = [Clave];
  Estado.Slots_Muertos_Tipos = {
    [Clave]: "Comida"
  };
  Estado.Slots_Muertos_Nombres = {
    [Clave]: "Almuerzo"
  };
  Estado.Slots_Muertos_Titulos_Visibles = {
    [Clave]: true
  };
  Estado.Slots_Muertos_Nombres_Auto = {
    [Clave]: false
  };
  Estado.Planes_Slot = {
    [Clave]: {
      Items: [
        {
          Id: "plan_slot_1",
          Texto: "Idea central",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };
  Estado.Tipos_Slot = [
    {
      Id: "Comida",
      Nombre: "Comida",
      Color: "#f3d39d",
      Titulo: "Almuerzo",
      Titulo_Por_Defecto: true
    }
  ];
  Estado.Tipos_Slot_Inicializados = true;
  return Estado;
}

function Crear_Estado_Con_Plan_En_Slot_Vacio(
  Fecha,
  Hora
) {
  const Estado = Crear_Estado(["Base remota"]);
  const Clave = `${Fecha}|${Hora}`;
  Estado.Planes_Slot = {
    [Clave]: {
      Items: [
        {
          Id: "plan_slot_vacio_1",
          Texto: "Idea vacia",
          Emoji: "*",
          Estado: "Planeado"
        }
      ]
    }
  };
  return Estado;
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
        actualizado_en: "2026-04-14T00:00:00Z",
        version: Estado_Remoto_Inicial ? 1 : 0
      };
      window.__Keepalive_Llamadas = [];
      window.__SignOut_Llamadas = [];
      window.__Forzar_Error_Upsert = false;
      window.__Forzar_Error_Update = false;
      window.__Forzar_Error_Insert = false;

      const Es_Objeto_Json = (Valor) => {
        return Boolean(
          Valor &&
          typeof Valor === "object" &&
          !Array.isArray(Valor)
        );
      };

      const Merge_Profundo_Preservando_Faltantes = (
        Base,
        Incoming
      ) => {
        if (Incoming === undefined) {
          return Base;
        }
        if (Base === undefined) {
          return Incoming;
        }
        if (
          !Es_Objeto_Json(Base) ||
          !Es_Objeto_Json(Incoming)
        ) {
          return Incoming;
        }
        const Resultado = { ...Base };
        Object.entries(Incoming).forEach(([Clave, Valor]) => {
          if (
            Object.prototype.hasOwnProperty.call(
              Resultado,
              Clave
            )
          ) {
            Resultado[Clave] =
              Merge_Profundo_Preservando_Faltantes(
                Resultado[Clave],
                Valor
              );
            return;
          }
          Resultado[Clave] = Valor;
        });
        return Resultado;
      };

      const Fetch_Original =
        window.fetch.bind(window);
      window.fetch = async (Url, Opciones = {}) => {
        if (
          String(Url).includes(
            "/rest/v1/estado_usuario"
          )
        ) {
          const Url_Objeto = new URL(
            String(Url),
            window.location.origin
          );
          window.__Keepalive_Llamadas.push({
            keepalive: !!Opciones.keepalive,
            body: Opciones.body || "",
            method: Opciones.method || "GET",
            url: Url_Objeto.toString()
          });
          const Payload = JSON.parse(
            Opciones.body || "{}"
          );
          const Version_Filtro = Number(
            (
              Url_Objeto.searchParams.get("version")
              || ""
            ).replace("eq.", "")
          ) || 0;
          if (
            (Opciones.method || "GET") === "PATCH" &&
            Version_Filtro > 0 &&
            Version_Filtro !==
              Number(window.__Estado_Remoto?.version || 0)
          ) {
            return {
              ok: true,
              status: 204,
              async text() {
                return "";
              }
            };
          }
          const Estado_Actual =
            window.__Estado_Remoto?.estado || null;
          window.__Estado_Remoto = {
            estado:
              Merge_Profundo_Preservando_Faltantes(
                Estado_Actual,
                Payload.estado
              ),
            actualizado_en:
              "2026-04-14T00:00:10Z",
            version:
              Number(Payload.version) ||
              (
                Number(
                  window.__Estado_Remoto?.version || 0
                ) + 1
              ) ||
              1
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
              async signOut(Opciones = {}) {
                window.__SignOut_Llamadas.push(
                  Opciones.scope || "default"
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
                  if (this._accion === "update") {
                    if (window.__Forzar_Error_Update) {
                      return {
                        data: null,
                        error: {
                          message: "fallo update"
                        }
                      };
                    }
                    const Actual =
                      window.__Estado_Remoto || null;
                    if (!Actual) {
                      return {
                        data: null,
                        error: null
                      };
                    }
                    if (
                      Number(this.version || 0) !==
                      Number(Actual.version || 0)
                    ) {
                      return {
                        data: null,
                        error: null
                      };
                    }
                    window.__Estado_Remoto = {
                      estado:
                        Merge_Profundo_Preservando_Faltantes(
                          Actual.estado || null,
                          this._payload.estado
                        ),
                      actualizado_en:
                        "2026-04-14T00:00:05Z",
                      version:
                        Number(this._payload.version) ||
                        Number(Actual.version || 0) + 1
                    };
                    return {
                      data: {
                        version:
                          window.__Estado_Remoto.version,
                        actualizado_en:
                          window.__Estado_Remoto.actualizado_en
                      },
                      error: null
                    };
                  }
                  if (this._accion === "insert") {
                    if (window.__Forzar_Error_Insert) {
                      return {
                        data: null,
                        error: {
                          message: "fallo insert"
                        }
                      };
                    }
                    if (window.__Estado_Remoto) {
                      return {
                        data: null,
                        error: {
                          code: "23505",
                          message: "duplicate key"
                        }
                      };
                    }
                    window.__Estado_Remoto = {
                      estado: this._payload.estado,
                      actualizado_en:
                        "2026-04-14T00:00:05Z",
                      version: 1
                    };
                    return {
                      data: {
                        version: 1,
                        actualizado_en:
                          "2026-04-14T00:00:05Z"
                      },
                      error: null
                    };
                  }
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
                update(Payload) {
                  this._accion = "update";
                  this._payload = Payload;
                  return this;
                },
                insert(Payload) {
                  this._accion = "insert";
                  this._payload = Payload;
                  return this;
                },
                async upsert(Payload) {
                  if (window.__Forzar_Error_Upsert) {
                    return {
                      error: {
                        message: "fallo upsert"
                      }
                    };
                  }
                  if (Tabla === "estado_usuario") {
                    const Estado_Actual =
                      window.__Estado_Remoto?.estado || null;
                    window.__Estado_Remoto = {
                      estado:
                        Merge_Profundo_Preservando_Faltantes(
                          Estado_Actual,
                          Payload.estado
                        ),
                      actualizado_en:
                        "2026-04-14T00:00:05Z",
                      version:
                        Number(Payload.version) ||
                        (
                          Number(
                            window.__Estado_Remoto?.version || 0
                          ) + 1
                        ) ||
                        1
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

async function Preparar_App_Desktop(page, Estado_Remoto) {
  await page.addInitScript(() => {
    window.Semaplan_Desktop = {
      Activo: true
    };
  });

  await Preparar_App(page, Estado_Remoto);
}

test(
  "fuerza keepalive si la pagina se oculta con sync pendiente",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      Objetivos.push({
        Id: 99,
        Nombre: "Cambio ocultando",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
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
          Payload?.estado?.Objetivos?.map(
            (Objetivo) => Objetivo.Nombre
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
  "editar horario de una tarea dispara sync remoto inmediato",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    await page.evaluate(() => {
      Tareas = [
        Normalizar_Tarea({
          Id: "Tarea_Sync_Horario",
          Nombre: "Mover horario",
          Emoji: "☑",
          Cajon: "Inbox",
          Prioridad: "media",
          Estado: "pendiente",
          Fecha: "2026-04-14",
          Hora: "09:00"
        })
      ];
      Abrir_Modal_Tarea("Tarea_Sync_Horario");
    });

    await page.fill("#Tareas_Fecha", "2026-04-15");
    await page.fill("#Tareas_Hora", "11:30");
    await page.click("#Tareas_Editor_Guardar");

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const Remota = (
          window.__Estado_Remoto?.estado?.Tareas || []
        ).find((Tarea) => Tarea?.Id === "Tarea_Sync_Horario");
        return {
          Fecha: Remota?.Fecha || "",
          Hora: Remota?.Hora || "",
          Sync_Estado,
          Pendiente: Hay_Sync_Pendiente()
        };
      });
    }).toEqual({
      Fecha: "2026-04-15",
      Hora: "11:30",
      Sync_Estado: "Guardado",
      Pendiente: false
    });
  }
);

test(
  "registrar un habito manual dispara sync remoto inmediato",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    await page.evaluate(() => {
      Habitos = [
        Normalizar_Habito({
          Id: "Habito_Sync_Registro",
          Nombre: "Leer",
          Emoji: "📘",
          Activo: true,
          Programacion: {
            Tipo: "Libre"
          },
          Meta: {
            Modo: "Check",
            Regla: "Al_Menos",
            Periodo: "Dia",
            Cantidad: 1,
            Unidad: ""
          }
        })
      ];
      Habitos_Registros = [];
      Habitos_Registrar_Rapido_Desde_Panel(
        "Habito_Sync_Registro"
      );
    });

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const Registros = (
          window.__Estado_Remoto?.estado?.Habitos_Registros || []
        ).filter((Registro) =>
          Registro?.Habito_Id === "Habito_Sync_Registro"
        );
        return {
          Registros: Registros.length,
          Sync_Estado,
          Pendiente: Hay_Sync_Pendiente()
        };
      });
    }).toEqual({
      Registros: 1,
      Sync_Estado: "Guardado",
      Pendiente: false
    });
  }
);

test(
  "guardar un cambio de orden en objetivos fuerza sync critico automatico",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Primero", "Segundo"])
    );

    await page.evaluate(() => {
      const Movido = Objetivos.pop();
      Objetivos.unshift(Movido);
      Guardar_Estado();
    });

    await expect.poll(async () => {
      return await page.evaluate(() => {
        return {
          Orden: (
            window.__Estado_Remoto?.estado?.Objetivos || []
          ).map((Objetivo) => Objetivo?.Nombre || ""),
          Sync_Estado,
          Pendiente: Hay_Sync_Pendiente()
        };
      });
    }).toEqual({
      Orden: ["Segundo", "Primero"],
      Sync_Estado: "Guardado",
      Pendiente: false
    });
  }
);

test(
  "guardar un cambio en plan de slot fuerza sync critico automatico",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    await page.evaluate(() => {
      const Clave = "2026-04-13|10";
      Planes_Slot[Clave].Items[0].Texto =
        "Idea actualizada";
      Guardar_Estado();
    });

    await expect.poll(async () => {
      return await page.evaluate(() => {
        const Item = window.__Estado_Remoto?.estado
          ?.Planes_Slot?.["2026-04-13|10"]?.Items?.[0];
        return {
          Texto: Item?.Texto || "",
          Sync_Estado,
          Pendiente: Hay_Sync_Pendiente()
        };
      });
    }).toEqual({
      Texto: "Idea actualizada",
      Sync_Estado: "Guardado",
      Pendiente: false
    });
  }
);

test(
  "el sync no reintroduce slots muertos borrados " +
  "al moverlos de hora",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    const Resumen = await page.evaluate(async () => {
      const Clave_Origen = "2026-04-13|10";
      const Clave_Destino = "2026-04-13|12";

      Slots_Muertos = [Clave_Destino];
      Slots_Muertos_Tipos = {
        [Clave_Destino]:
          Slots_Muertos_Tipos[Clave_Origen]
      };
      Slots_Muertos_Nombres = {
        [Clave_Destino]:
          Slots_Muertos_Nombres[Clave_Origen]
      };
      Slots_Muertos_Titulos_Visibles = {
        [Clave_Destino]:
          Slots_Muertos_Titulos_Visibles[Clave_Origen]
      };
      Slots_Muertos_Nombres_Auto = {
        [Clave_Destino]:
          Slots_Muertos_Nombres_Auto[Clave_Origen]
      };
      Planes_Slot = {
        [Clave_Destino]:
          JSON.parse(
            JSON.stringify(Planes_Slot[Clave_Origen])
          )
      };

      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_slots: Estado_Local.Slots_Muertos || [],
        remoto_slots: Estado_Remoto.Slots_Muertos || [],
        remoto_tipo_origen:
          Estado_Remoto.Slots_Muertos_Tipos?.[
            Clave_Origen
          ] || "",
        remoto_tipo_destino:
          Estado_Remoto.Slots_Muertos_Tipos?.[
            Clave_Destino
          ] || "",
        remoto_plan_origen:
          Estado_Remoto.Planes_Slot?.[
            Clave_Origen
          ]?.Items?.length || 0,
        remoto_plan_destino:
          Estado_Remoto.Planes_Slot?.[
            Clave_Destino
          ]?.Items?.length || 0
      };
    });

    expect(Resumen.local_slots).toEqual([
      "2026-04-13|12"
    ]);
    expect(Resumen.remoto_slots).toEqual([
      "2026-04-13|12"
    ]);
    expect(Resumen.remoto_tipo_origen).toBe("");
    expect(Resumen.remoto_tipo_destino).toBe("Comida");
    expect(Resumen.remoto_plan_origen).toBe(0);
    expect(Resumen.remoto_plan_destino).toBe(1);
  }
);

test(
  "desbloquear un dia no deja planes huerfanos en remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    const Resumen = await page.evaluate(async () => {
      Desbloquear_Dia_Completo("2026-04-13");
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_slots: Estado_Local.Slots_Muertos || [],
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_slots: Estado_Remoto.Slots_Muertos || [],
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        )
      };
    });

    expect(Resumen.local_slots).toEqual([]);
    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_slots).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
  }
);

test(
  "borrar un plan de slot tambien lo borra en remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    const Resumen = await page.evaluate(async () => {
      delete Planes_Slot["2026-04-13|10"];
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        remoto_plan:
          Estado_Remoto.Planes_Slot?.[
            "2026-04-13|10"
          ]?.Items?.length || 0
      };
    });

    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.remoto_plan).toBe(0);
  }
);

test(
  "limpia planes huerfanos de slots ocupados al sincronizar",
  async ({ page }) => {
    const Estado = Crear_Estado(["Base remota"]);
    Estado.Eventos = [
      {
        Id: "ev_ocupa",
        Objetivo_Id: 1,
        Fecha: "2026-04-13",
        Inicio: 10,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: "#f1b77e"
      }
    ];
    Estado.Planes_Slot = {
      "2026-04-13|10": {
        Items: [
          {
            Id: "plan_slot_huerfano",
            Texto: "Persistencia vieja",
            Emoji: "*",
            Estado: "Planeado"
          }
        ]
      }
    };
    await Preparar_App(page, Estado);

    const Resumen = await page.evaluate(async () => {
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();
      await Backend_Aplicar_Estado_Remoto();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        memoria_planes: Object.keys(Planes_Slot || {}),
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            '.Slot_Plan_Marca'
          )
        )
      };
    });

    expect(Resumen.memoria_planes).toEqual([]);
    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.ui_marca_plan).toBeFalsy();
  }
);

test(
  "borrar plan desde UI persiste al recargar remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { button: "right" }
    );
    await page.click(
      '#Dia_Accion_Menu [data-acc="borrar-plan-slot"]'
    );
    await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

    const Resumen = await page.evaluate(async () => {
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();
      await Backend_Aplicar_Estado_Remoto();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            '.Slot_Plan_Marca'
          )
        )
      };
    });

    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.ui_marca_plan).toBeFalsy();
  }
);

test(
  "borrar plan de slot vacio desde UI persiste al recargar remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Plan_En_Slot_Vacio(
        "2026-04-13",
        10
      )
    );

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { button: "right" }
    );
    await page.click(
      '#Dia_Accion_Menu [data-acc="borrar-plan-slot"]'
    );
    await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

    const Resumen = await page.evaluate(async () => {
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();
      await Backend_Aplicar_Estado_Remoto();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            ".Slot_Plan_Marca"
          )
        )
      };
    });

    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.ui_marca_plan).toBeFalsy();
  }
);

test(
  "vaciar plan desde el modal persiste al recargar remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    await page.evaluate(() => {
      Abrir_Modal_Plan_Slot("2026-04-13", 10);
    });
    await page.click("#Plan_Slot_Cuerpo .Abordaje_Item_Borrar");
    await page.click("#Plan_Slot_Guardar");

    const Resumen = await page.evaluate(async () => {
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      await Backend_Sync_Ejecutar();
      await Backend_Aplicar_Estado_Remoto();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            '.Slot_Plan_Marca'
          )
        )
      };
    });

    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.ui_marca_plan).toBeFalsy();
  }
);

test(
  "si hay sync local pendiente, no pisa con remoto",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    const Resumen = await page.evaluate(async () => {
      const Clave = "2026-04-13|10";
      delete Planes_Slot[Clave];
      Guardar_Estado();

      Marcar_Sync_Local_Pendiente_Usuario(
        Usuario_Actual?.id || "",
        true
      );
      Sync_Local_Sucio = false;
      if (Sync_Timer_Id) {
        clearTimeout(Sync_Timer_Id);
        Sync_Timer_Id = null;
      }

      window.__Estado_Remoto = {
        ...(window.__Estado_Remoto || {}),
        estado: {
          ...(window.__Estado_Remoto?.estado || {}),
          Planes_Slot: {
            [Clave]: {
              Items: [
                {
                  Id: "plan_slot_1",
                  Texto: "Idea central",
                  Emoji: "*",
                  Estado: "Planeado"
                }
              ]
            }
          }
        },
        actualizado_en: "2026-04-14T00:00:20Z",
        version: 2
      };

      await Iniciar_App_Logueada();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      return {
        memoria_planes: Object.keys(Planes_Slot || {}),
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Limpiar_Tombstones_Json(
            window.__Estado_Remoto?.estado?.Planes_Slot || {}
          )
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            ".Slot_Plan_Marca"
          )
        ),
        sync_pendiente: Sync_Local_Pendiente_Usuario_Actual()
      };
    });

    expect(Resumen.memoria_planes).toEqual([]);
    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.ui_marca_plan).toBeFalsy();
    expect(Resumen.sync_pendiente).toBeFalsy();
  }
);

test(
  "limpiar una celda con plan sincroniza antes del debounce",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado_Con_Slot("2026-04-13", 10)
    );

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { button: "right" }
    );
    await page.click(
      '#Dia_Accion_Menu [data-acc="limpiar-celda"]'
    );
    await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

    await page.waitForFunction(
      () =>
        Object.keys(
          Limpiar_Tombstones_Json(
            window.__Estado_Remoto?.estado?.Planes_Slot || {}
          )
        ).length === 0,
      null,
      { timeout: 1500 }
    );

    const Resumen = await page.evaluate(async () => {
      await Backend_Aplicar_Estado_Remoto();
      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );
      const Estado_Remoto = Limpiar_Tombstones_Json(
        window.__Estado_Remoto?.estado || {}
      );

      return {
        memoria_planes: Object.keys(Planes_Slot || {}),
        local_planes: Object.keys(
          Estado_Local.Planes_Slot || {}
        ),
        remoto_planes: Object.keys(
          Estado_Remoto.Planes_Slot || {}
        ),
        slot_sigue_muerto: Slot_Es_Muerto(
          "2026-04-13",
          10
        ),
        ui_marca_plan: Boolean(
          document.querySelector(
            '.Slot[data-fecha="2026-04-13"][data-hora="10"] ' +
            '.Slot_Plan_Marca'
          )
        )
      };
    });

    expect(Resumen.memoria_planes).toEqual([]);
    expect(Resumen.local_planes).toEqual([]);
    expect(Resumen.remoto_planes).toEqual([]);
    expect(Resumen.slot_sigue_muerto).toBeFalsy();
    expect(Resumen.ui_marca_plan).toBeFalsy();
  }
);

test(
  "ignora cambios remotos que solo actualizan sesiones",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Solo remoto"])
    );

    const Resumen = await page.evaluate(async () => {
      const Estado_Operativo = JSON.parse(JSON.stringify(
        window.__Estado_Remoto.estado
      ));
      Estado_Operativo.Sesiones_Operativas = {
        Activas: {
          [Obtener_Sesion_Operativa_Id()]: {
            Id: Obtener_Sesion_Operativa_Id(),
            Instancia_Id:
              Obtener_Sesion_Operativa_Instancia_Id(),
            Ultimo_Visto_Ms: Date.now()
          }
        },
        Actualizado_Ms: Date.now()
      };
      window.__Estado_Remoto = {
        estado: Estado_Operativo,
        actualizado_en: "2026-04-14T00:00:18Z",
        version:
          Number(window.__Estado_Remoto.version || 0) + 1
      };

      const Refresco =
        await Backend_Revisar_Cambios_Remotos(true);
      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );

      return {
        refresco: Refresco,
        conflicto: Sync_Conflicto_Pendiente,
        nombres:
          (Estado_Local.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
          )
      };
    });

    expect(Resumen.refresco).toBe(false);
    expect(Resumen.conflicto).toBe(false);
    expect(Resumen.nombres).toEqual(["Solo remoto"]);
  }
);

test(
  "guarda si la version remota cambio solo por sesiones",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      Objetivos.push({
        Id: 128,
        Nombre: "Cambio local con heartbeat",
        Emoji: "*",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;

      const Estado_Operativo = JSON.parse(JSON.stringify(
        window.__Estado_Remoto.estado
      ));
      Estado_Operativo.Sesiones_Operativas = {
        Activas: {
          sesion_vieja: {
            Id: "sesion_vieja",
            Instancia_Id: "instancia_vieja",
            Ultimo_Visto_Ms: Date.now()
          }
        },
        Actualizado_Ms: Date.now()
      };
      window.__Estado_Remoto = {
        estado: Estado_Operativo,
        actualizado_en: "2026-04-14T00:00:52Z",
        version:
          Number(window.__Estado_Remoto.version || 0) + 1
      };

      const Ok = await Backend_Sync_Ejecutar();

      return {
        ok: Ok,
        conflicto: Sync_Conflicto_Pendiente,
        remoto:
          (window.__Estado_Remoto?.estado?.Objetivos || [])
            .map((Objetivo) => Objetivo.Nombre)
      };
    });

    expect(Resumen.ok).toBe(true);
    expect(Resumen.conflicto).toBe(false);
    expect(Resumen.remoto).toContain(
      "Cambio local con heartbeat"
    );
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
        actualizado_en: "2026-04-14T00:00:20Z",
        version: 2
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
          (Estado.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
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
  "al volver al foco fuerza la revision remota " +
  "aunque la ultima consulta sea reciente",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Solo remoto"])
    );

    await page.evaluate(({ Estado_Remoto_Nuevo }) => {
      Sync_Remoto_Ultima_Revision_Ms = Date.now();
      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:25Z",
        version: 2
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Solo remoto",
        "Cambio al volver al foco"
      ])
    });

    const Resumen = await page.evaluate(async () => {
      window.dispatchEvent(new Event("focus"));
      await new Promise((Resolver) =>
        setTimeout(Resolver, 50)
      );

      const Estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );

      return {
        nombres:
          (Estado.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
          ),
        syncRemotoUltimaRevisionMs:
          Sync_Remoto_Ultima_Revision_Ms
      };
    });

    expect(Resumen.nombres).toContain(
      "Cambio al volver al foco"
    );
    expect(
      Resumen.syncRemotoUltimaRevisionMs
    ).toBeGreaterThan(0);
  }
);

test(
  "desktop usa una revision remota mas frecuente " +
  "sin forzar foco",
  async ({ page }) => {
    await Preparar_App_Desktop(
      page,
      Crear_Estado(["Solo remoto"])
    );

    await page.evaluate(({ Estado_Remoto_Nuevo }) => {
      Sync_Remoto_Ultima_Revision_Ms =
        Date.now() - 3000;
      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:27Z",
        version: 2
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Solo remoto",
        "Cambio remoto desktop"
      ])
    });

    const Resumen = await page.evaluate(async () => {
      const Refresco =
        await Backend_Revisar_Cambios_Remotos();
      const Estado = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );

      return {
        refresco: Refresco,
        nombres:
          (Estado.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
          )
      };
    });

    expect(Resumen.refresco).toBe(true);
    expect(Resumen.nombres).toContain(
      "Cambio remoto desktop"
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
      Objetivos.push({
        Id: 99,
        Nombre: "Cambio local",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      Actualizar_Sync_Indicador("Guardado");

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:30Z",
        version: 2
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
          (Estado.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
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
      Objetivos.push({
        Id: 77,
        Nombre: "Cambio local final",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      Actualizar_Sync_Indicador("Guardado");

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:40Z",
        version: 2
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
          (Estado_Local.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
          ),
        remoto:
          (window.__Estado_Remoto?.estado?.Objetivos || [])
            .map((Objetivo) => Objetivo.Nombre),
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

test(
  "bloquea cerrar sesion si falla el ultimo sync",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      window.__Dialogos = [];
      const Dialogo_Original = Mostrar_Dialogo;
      Mostrar_Dialogo = async (
        Texto,
        Botones = []
      ) => {
        window.__Dialogos.push(Texto);
        return Botones[0]?.Valor ?? true;
      };

      Objetivos.push({
        Id: 123,
        Nombre: "Cambio sin guardar",
        Emoji: "ðŸ§ª",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      window.__Forzar_Error_Update = true;

      await Cerrar_Sesion();
      Mostrar_Dialogo = Dialogo_Original;

      return {
        dialogos: window.__Dialogos,
        signOuts: window.__SignOut_Llamadas,
        syncEstado: Sync_Estado
      };
    });

    expect(Resumen.dialogos.at(0)).toContain(
      "Cerrar sesión"
    );
    expect(Resumen.dialogos.at(-1)).toContain(
      "todavía hay cambios sin guardar"
    );
    expect(Resumen.signOuts).toEqual([]);
    expect(Resumen.syncEstado).toBe("Guardando");
  }
);

test(
  "reintenta el sync automaticamente hasta guardar",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      Sync_Reintento_Demoras_Ms = [20, 20, 20];

      Objetivos.push({
        Id: 126,
        Nombre: "Cambio con retry",
        Emoji: "Ã°Å¸Â§Âª",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      window.__Forzar_Error_Update = true;

      const Primer_Intento = await Backend_Sync_Ejecutar();
      const Estado_Tras_Fallo = Sync_Estado;
      const Retry_Programado =
        Boolean(Sync_Reintento_Timer_Id);

      setTimeout(() => {
        window.__Forzar_Error_Update = false;
      }, 30);

      await new Promise((Resolver) =>
        setTimeout(Resolver, 120)
      );

      return {
        primerIntento: Primer_Intento,
        estadoTrasFallo: Estado_Tras_Fallo,
        retryProgramado: Retry_Programado,
        syncEstadoFinal: Sync_Estado,
        timerActivo: Boolean(Sync_Reintento_Timer_Id),
        sucio: Sync_Local_Sucio,
        remoto:
          (window.__Estado_Remoto?.estado?.Objetivos || [])
            .map((Objetivo) => Objetivo.Nombre)
      };
    });

    expect(Resumen.primerIntento).toBe(false);
    expect(Resumen.estadoTrasFallo).toBe("Guardando");
    expect(Resumen.retryProgramado).toBe(true);
    expect(Resumen.syncEstadoFinal).toBe("Guardado");
    expect(Resumen.timerActivo).toBe(false);
    expect(Resumen.sucio).toBe(false);
    expect(Resumen.remoto).toContain("Cambio con retry");
  }
);

test(
  "reintento manual vuelve a enviar si quedo solo estado error",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async () => {
      Objetivos.push({
        Id: 127,
        Nombre: "Cambio reintento manual",
        Emoji: "ÃƒÂ°Ã…Â¸Ã‚Â§Ã‚Âª",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Marcar_Sync_Local_Sucio(false);
      Actualizar_Sync_Indicador("Error");

      const Ok = await Reintentar_Sync_Manual();

      return {
        ok: Ok,
        syncEstadoFinal: Sync_Estado,
        sucio: Sync_Local_Sucio,
        remoto:
          (window.__Estado_Remoto?.estado?.Objetivos || [])
            .map((Objetivo) => Objetivo.Nombre)
      };
    });

    expect(Resumen.ok).toBe(true);
    expect(Resumen.syncEstadoFinal).toBe("Guardado");
    expect(Resumen.sucio).toBe(false);
    expect(Resumen.remoto).toContain("Cambio reintento manual");
  }
);

test(
  "detecta conflicto versionado al guardar " +
  "y no pisa la version remota",
  async ({ page }) => {
    await Preparar_App(
      page,
      Crear_Estado(["Base remota"])
    );

    const Resumen = await page.evaluate(async ({
      Estado_Remoto_Nuevo
    }) => {
      Objetivos.push({
        Id: 124,
        Nombre: "Cambio local versionado",
        Emoji: "ðŸ§ª",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });
      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;

      window.__Estado_Remoto = {
        estado: Estado_Remoto_Nuevo,
        actualizado_en: "2026-04-14T00:00:55Z",
        version: 2
      };

      const Ok = await Backend_Sync_Ejecutar();

      const Estado_Local = JSON.parse(
        localStorage.getItem("Semaplan_Estado_V2") ||
        "{}"
      );

      return {
        ok: Ok,
        conflicto: Sync_Conflicto_Pendiente,
        remoto:
          (window.__Estado_Remoto?.estado?.Objetivos || [])
            .map((Objetivo) => Objetivo.Nombre),
        local:
          (Estado_Local.Objetivos || []).map(
            (Objetivo) => Objetivo.Nombre
          )
      };
    }, {
      Estado_Remoto_Nuevo: Crear_Estado([
        "Base remota",
        "Cambio remoto final"
      ])
    });

    expect(Resumen.ok).toBe(false);
    expect(Resumen.conflicto).toBe(true);
    expect(Resumen.remoto).toContain(
      "Cambio remoto final"
    );
    expect(Resumen.remoto).not.toContain(
      "Cambio local versionado"
    );
    expect(Resumen.local).toContain(
      "Cambio local versionado"
    );
  }
);

test(
  "preserva baul y archivero si un cliente " +
  "viejo sincroniza sin esas claves",
  async ({ page }) => {
    const Estado_Remoto = Crear_Estado([
      "Base remota"
    ]);
    Estado_Remoto.Baul_Objetivos = [
      {
        Id: "b1",
        Nombre: "Molde remoto",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Orden: 1,
        Categoria: "",
        Archivada: false,
        Subobjetivos: [],
        Etiquetas_Ids: [],
        Timeline: null
      }
    ];
    Estado_Remoto.Archiveros = [
      {
        Id: "c1",
        Nombre: "Caja remota",
        Emoji: "🗃️",
        Color_Fondo: "#ffffff",
        Fecha_Creacion: 1
      }
    ];
    Estado_Remoto.Notas_Archivero = [
      {
        Id: "n1",
        Archivero_Id: "c1",
        Texto: "Nota remota",
        Origen: "",
        Etiquetas: [],
        Color_Fondo: "",
        Tipo: "Texto",
        Fecha_Creacion: 2
      }
    ];

    await Preparar_App(page, Estado_Remoto);

    const Resumen = await page.evaluate(async () => {
      const Construir_Original =
        Construir_Estado_Completo;

      Construir_Estado_Completo = () => {
        const Estado = Construir_Original();
        const {
          Baul_Objetivos,
          Baul_Grupos_Colapsados,
          Archiveros,
          Notas_Archivero,
          Etiquetas_Archivero,
          ...Estado_Viejo
        } = Estado;
        return Estado_Viejo;
      };

      Objetivos.push({
        Id: 125,
        Nombre: "Cambio desde cliente viejo",
        Emoji: "🧪",
        Color: "#f1b77e",
        Horas: 1,
        Dia: 0,
        Hora: 9,
        Duracion: 1,
        Subobjetivos: [],
        Copias_Semana: {}
      });

      Guardar_Estado();
      clearTimeout(Sync_Timer_Id);
      Sync_Timer_Id = null;
      const Ok = await Backend_Sync_Ejecutar();

      Construir_Estado_Completo =
        Construir_Original;

      return {
        ok: Ok,
        remotoBaul:
          (window.__Estado_Remoto?.estado?.Baul_Objetivos
            || []).map((Objetivo) => Objetivo.Nombre),
        remotoCajones:
          (window.__Estado_Remoto?.estado?.Archiveros
            || []).map((Cajon) => Cajon.Nombre),
        remotoNotas:
          (
            window.__Estado_Remoto?.estado
              ?.Notas_Archivero || []
          ).map((Nota) => Nota.Texto),
        remotoObjetivos:
          (window.__Estado_Remoto?.estado?.Objetivos
            || []).map((Objetivo) => Objetivo.Nombre)
      };
    });

    expect(Resumen.ok).toBe(true);
    expect(Resumen.remotoBaul).toContain(
      "Molde remoto"
    );
    expect(Resumen.remotoCajones).toContain(
      "Caja remota"
    );
    expect(Resumen.remotoNotas).toContain(
      "Nota remota"
    );
    expect(Resumen.remotoObjetivos).toContain(
      "Cambio desde cliente viejo"
    );
  }
);
