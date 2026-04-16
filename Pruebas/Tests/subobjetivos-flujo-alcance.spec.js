const { test, expect } = require("@playwright/test");

function addDaysIso(isoDate, days) {
  const copy = new Date(`${isoDate}T00:00:00`);
  copy.setDate(copy.getDate() + days);
  return copy.toISOString().slice(0, 10);
}

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
  await page.waitForLoadState("domcontentloaded");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    if (typeof window.Inicializar === "function") {
      window.Inicializar();
    }
  });
}

function crearEstadoBase() {
  const monday = "2026-04-13";
  const nextMonday = addDaysIso(monday, 7);
  return {
    monday,
    nextMonday,
    estado: {
      Objetivos: [
        {
          Id: "T1",
          Familia_Id: "F1",
          Fracasos_Semanales: {},
          Subobjetivos_Semanales: {
            [monday]: []
          },
          Subobjetivos_Contraidas_Semanales: {},
          Subobjetivos_Excluidos_Semanales: {},
          Nombre: "Proyecto repetido",
          Emoji: "🎯",
          Color: "#f1b77e",
          Horas_Semanales: 4,
          Restante: 4,
          Es_Bolsa: true,
          Es_Fija: false,
          Semana_Base: monday,
          Semana_Inicio: null,
          Semana_Fin: null,
          Categoria_Id: null,
          Etiquetas_Ids: []
        },
        {
          Id: "T2",
          Familia_Id: "F1",
          Fracasos_Semanales: {},
          Subobjetivos_Semanales: {
            [nextMonday]: []
          },
          Subobjetivos_Contraidas_Semanales: {},
          Subobjetivos_Excluidos_Semanales: {},
          Nombre: "Proyecto repetido",
          Emoji: "🎯",
          Color: "#f1b77e",
          Horas_Semanales: 4,
          Restante: 4,
          Es_Bolsa: true,
          Es_Fija: false,
          Semana_Base: nextMonday,
          Semana_Inicio: null,
          Semana_Fin: null,
          Categoria_Id: null,
          Etiquetas_Ids: []
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
      Contador_Eventos: 1,
      Objetivo_Seleccionada_Id: null,
      Modo_Editor_Abierto: false,
      Inicio_Semana: monday,
      Duracion_Defecto: 1,
      Config_Extra: {
        Inicio_Hora: 0,
        Fin_Hora: 24,
        Scroll_Inicial: 8,
        Duracion_Default: 1,
        Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
        Ocultar_Dias_Automatico: "Ninguno",
        Slots_Muertos_Default: {},
        Agrupar_Por_Categorias: false,
        Globito_Activo: true,
        Globito_Modo: "Horas",
        Globito_Posicion: "Arriba",
        Meta_Notificaciones_Activas: true,
        Meta_Notificaciones_Hitos: [25, 50, 75, 100],
        Color_Sueno: "#ddd4f4",
        Color_Descanso: "#d4e9f4",
        Color_Badge: "#9b2040",
        Color_Completa: "#1f6b4f",
        Color_Sin_Horas: "#c9a800",
        Color_Fracasada: "#8c2f2f",
        Resize_Personalizado: false,
        Notas_Hover: false,
        Mostrar_Archivadas: false,
        Focus_Auto: false,
        Menu_Estilo: "Iconos",
        Menu_Botones_Visibles: {
          Focus_Boton: true
        },
        Baul_Objetivos_Por_Fila: 5,
        Baul_Sombra_Estado: true,
        Baul_Vista_Modo: "Biblioteca",
        Baul_Ordenar_Por: "Personalizado",
        Baul_Agrupar_Por: "Ninguno",
        Baul_Mostrar_Archivadas: false,
        Plan_Actual: "Premium",
        Contador_Semanas_Activo: false,
        Contador_Semanas_Modo: "Ano",
        Contador_Semanas_Fecha_Ref: "",
        Contador_Semanas_Porcentaje: false,
        Contador_Semanas_Fecha_Final: "",
        Contador_Semanas_Vida_Anios: 80,
        Inicio_Semana_Dia: 0,
        Inicio_Semana_Hora: 8
      },
      Tipos_Slot: [],
      Tipos_Slot_Inicializados: false,
      Slots_Muertos_Tipos: {},
      Slots_Muertos_Nombres: {},
      Abordajes_Migrados_V1: true,
      Semanas_Con_Defaults: [],
      Planes_Semana: {}
    }
  };
}

test("al crear subobjetivo con enter pide alcance y la replica", async ({
  page
}) => {
  const { estado, monday, nextMonday } = crearEstadoBase();
  await preparar(page, estado);

  const resultado = await page.evaluate(async () => {
    Objetivo_Seleccionada_Id = "T1";
    Render_Resumen_Objetivo();
    const Objetivo = Objetivo_Por_Id("T1");
    const Nueva_Id = Agregar_Subobjetivo_Semana(Objetivo, "Semana");
    Subobjetivo_En_Edicion_Id = Nueva_Id;
    Render_Resumen_Objetivo();
    const Item = document.querySelector(
      `.Subobjetivo_Item[data-subobjetivo-id="${Nueva_Id}"]`
    );
    const Input = Item?.querySelector(".Subobjetivo_Texto_Input");
    if (!Input) return null;
    Input.value = "Nueva compartida";
    let Mensaje = "";
    const Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Texto) => {
      Mensaje = Texto;
      return "Todas";
    };
    try {
      Input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true
        })
      );
      await new Promise((Resolver) => setTimeout(Resolver, 0));
    } finally {
      Mostrar_Dialogo = Original;
    }
    return {
      Mensaje,
      Plantillas: Plantillas_Subobjetivos.length,
      Actual: Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T1"), true, "2026-04-13"
      ).map((Sub) => Sub.Texto),
      Siguiente: Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T2"), true, "2026-04-20"
      ).map((Sub) => Sub.Texto)
    };
  });

  expect(resultado.Mensaje).toContain("subobjetivo");
  expect(resultado.Plantillas).toBe(1);
  expect(resultado.Actual).toContain("Nueva compartida");
  expect(resultado.Siguiente).toContain("Nueva compartida");
});

test("al borrar una subobjetivo compartida pide alcance", async ({
  page
}) => {
  const { estado, monday, nextMonday } = crearEstadoBase();
  estado.Plantillas_Subobjetivos = [
    {
      Id: "PS1",
      Serie_Id: "PS1",
      Clave_Objetivo: "proyecto repetido||🎯",
      Emoji: "•",
      Texto: "Compartida",
      Desde_Semana: null,
      Hasta_Semana: null
    }
  ];
  estado.Objetivos[0].Subobjetivos_Semanales[monday] = [
    {
      Id: "S1",
      Plantilla_Id: "PS1",
      Emoji: "•",
      Texto: "Compartida",
      Hecha: false
    }
  ];
  estado.Objetivos[1].Subobjetivos_Semanales[nextMonday] = [
    {
      Id: "S2",
      Plantilla_Id: "PS1",
      Emoji: "•",
      Texto: "Compartida",
      Hecha: false
    }
  ];
  await preparar(page, estado);

  const mensaje = await page.evaluate(async () => {
    Objetivo_Seleccionada_Id = "T1";
    Render_Resumen_Objetivo();
    const Objetivo = Objetivo_Por_Id("T1");
    const Sub = Obtener_Subobjetivos_Semana(
      Objetivo, true, "2026-04-13"
    )[0];
    let Mensaje = "";
    const Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Texto) => {
      Mensaje = Texto;
      return null;
    };
    try {
      await Resolver_Alcance_Edicion_Subobjetivo(Objetivo, Sub);
    } finally {
      Mostrar_Dialogo = Original;
    }
    return Mensaje;
  });

  expect(mensaje).toContain("¿Dónde aplicar el cambio?");
});

test("los botones de subtareas borran y trasladan", async ({
  page
}) => {
  const { estado, monday } = crearEstadoBase();
  estado.Objetivos[0].Subobjetivos_Contraidas_Semanales[monday] =
    false;
  estado.Objetivos[0].Subobjetivos_Semanales[monday] = [
    {
      Id: "S_check",
      Emoji: "*",
      Texto: "Tildar",
      Hecha: false
    },
    {
      Id: "S_borrar",
      Emoji: "*",
      Texto: "Borrar",
      Hecha: false
    },
    {
      Id: "S_trasladar",
      Emoji: "*",
      Texto: "Trasladar",
      Hecha: false
    }
  ];
  await preparar(page, estado);

  await page.evaluate(() => {
    Objetivo_Seleccionada_Id = "T1";
    Render_Resumen_Objetivo();
    Mostrar_Dialogo = async (Texto) => {
      const Texto_Dialogo = String(Texto || "");
      if (Texto_Dialogo.includes("transferir")) {
        return "siguiente";
      }
      if (Texto_Dialogo.includes("Mover o copiar")) {
        return "Mover";
      }
      return "Semana";
    };
  });

  await page.click(
    '.Subobjetivo_Item[data-subobjetivo-id="S_check"] ' +
    ".Subobjetivo_Check"
  );
  await page.waitForFunction(() => {
    const Objetivo = Objetivo_Por_Id("T1");
    return Obtener_Subobjetivos_Semana(
      Objetivo, true, "2026-04-13"
    ).find((Sub) => Sub.Id === "S_check")?.Hecha === true;
  });

  await page.click(
    '.Subobjetivo_Item[data-subobjetivo-id="S_borrar"] ' +
    ".Subobjetivo_Borrar"
  );
  await page.waitForFunction(() => {
    const Objetivo = Objetivo_Por_Id("T1");
    return !Obtener_Subobjetivos_Semana(
      Objetivo, true, "2026-04-13"
    ).some((Sub) => Sub.Id === "S_borrar");
  });

  await page.click(
    '.Subobjetivo_Item[data-subobjetivo-id="S_trasladar"] ' +
    ".Subobjetivo_Transferir"
  );
  await page.waitForFunction(() => {
    const Origen = Objetivo_Por_Id("T1");
    const Destino = Objetivo_Por_Id("T2");
    const En_Origen = Obtener_Subobjetivos_Semana(
      Origen, true, "2026-04-13"
    ).some((Sub) => Sub.Id === "S_trasladar");
    const En_Destino = Obtener_Subobjetivos_Semana(
      Destino, true, "2026-04-20"
    ).some((Sub) => Sub.Texto === "Trasladar");
    return !En_Origen && En_Destino;
  });

  const resultado = await page.evaluate(() => ({
    origen: Obtener_Subobjetivos_Semana(
      Objetivo_Por_Id("T1"), true, "2026-04-13"
    ).map((Sub) => ({
      texto: Sub.Texto,
      hecha: Boolean(Sub.Hecha)
    })),
    destino: Obtener_Subobjetivos_Semana(
      Objetivo_Por_Id("T2"), true, "2026-04-20"
    ).map((Sub) => Sub.Texto)
  }));

  expect(resultado.origen).toEqual([
    { texto: "Tildar", hecha: true }
  ]);
  expect(resultado.destino).toContain("Trasladar");
});

test("si solo hay copias pasadas no pide alcance al crear subobjetivo", async ({
  page
}) => {
  const monday = "2026-04-13";
  const prevMonday = addDaysIso(monday, -7);
  const estado = crearEstadoBase().estado;
  estado.Objetivos = [
    {
      Id: "T0",
      Familia_Id: "F1",
      Fracasos_Semanales: {},
      Subobjetivos_Semanales: {
        [prevMonday]: []
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {},
      Nombre: "Proyecto repetido",
      Emoji: "🎯",
      Color: "#f1b77e",
      Horas_Semanales: 4,
      Restante: 4,
      Es_Bolsa: true,
      Es_Fija: false,
      Semana_Base: prevMonday,
      Semana_Inicio: null,
      Semana_Fin: null,
      Categoria_Id: null,
      Etiquetas_Ids: []
    },
    {
      Id: "T1",
      Familia_Id: "F1",
      Fracasos_Semanales: {},
      Subobjetivos_Semanales: {
        [monday]: []
      },
      Subobjetivos_Contraidas_Semanales: {},
      Subobjetivos_Excluidos_Semanales: {},
      Nombre: "Proyecto repetido",
      Emoji: "🎯",
      Color: "#f1b77e",
      Horas_Semanales: 4,
      Restante: 4,
      Es_Bolsa: true,
      Es_Fija: false,
      Semana_Base: monday,
      Semana_Inicio: null,
      Semana_Fin: null,
      Categoria_Id: null,
      Etiquetas_Ids: []
    }
  ];
  estado.Inicio_Semana = monday;
  await preparar(page, estado);

  const resultado = await page.evaluate(async (Semana_Actual) => {
    Objetivo_Seleccionada_Id = "T1";
    Render_Resumen_Objetivo();
    const Objetivo = Objetivo_Por_Id("T1");
    const Nueva_Id = Agregar_Subobjetivo_Semana(Objetivo, "Semana");
    Subobjetivo_En_Edicion_Id = Nueva_Id;
    Render_Resumen_Objetivo();
    const Item = document.querySelector(
      `.Subobjetivo_Item[data-subobjetivo-id="${Nueva_Id}"]`
    );
    const Input = Item?.querySelector(".Subobjetivo_Texto_Input");
    if (!Input) return null;
    Input.value = "Solo actual";
    let Mensaje = "";
    const Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Texto) => {
      Mensaje = Texto;
      return "Todas";
    };
    try {
      Input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true
        })
      );
      await new Promise((Resolver) => setTimeout(Resolver, 0));
    } finally {
      Mostrar_Dialogo = Original;
    }
    return {
      Mensaje,
      Plantillas: Plantillas_Subobjetivos.length,
      Actual: Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T1"), true, Semana_Actual
      ).map((Sub) => Sub.Texto)
    };
  }, monday);

  expect(resultado.Mensaje).toBe("");
  expect(resultado.Plantillas).toBe(0);
  expect(resultado.Actual).toContain("Solo actual");
});

test("el focus respeta alcance al editar y borrar subobjetivos", async ({
  page
}) => {
  const { estado, monday, nextMonday } = crearEstadoBase();
  await preparar(page, estado);

  const resultado = await page.evaluate(async () => {
    const Objetivo = Objetivo_Por_Id("T1");
    const Evento = {
      Id: "E1",
      Objetivo_Id: "T1",
      Fecha: "2026-04-13",
      Hora: 10,
      Duracion: 1
    };
    let Mensajes = [];
    const Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Texto) => {
      Mensajes.push(Texto);
      return "Todas";
    };
    try {
      Focus_Agregar_Subobjetivo(Objetivo, Evento);
      const Sub_Id = Focus_Sub_Editando_Id;
      await Focus_Confirmar_Edicion_Subobjetivo(
        Objetivo,
        Evento,
        Sub_Id,
        "📝",
        "Desde focus"
      );
      const Actual_1 = Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T1"), true, "2026-04-13"
      ).length;
      const Siguiente_1 = Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T2"), true, "2026-04-20"
      ).length;
      const Sub_Actual = Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T1"), true, "2026-04-13"
      )[0];
      await Focus_Borrar_Subobjetivo(Objetivo, Sub_Actual.Id);
      const Actual_2 = Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T1"), true, "2026-04-13"
      ).length;
      const Siguiente_2 = Obtener_Subobjetivos_Semana(
        Objetivo_Por_Id("T2"), true, "2026-04-20"
      ).length;
      return {
        Mensajes,
        Actual_1,
        Siguiente_1,
        Actual_2,
        Siguiente_2
      };
    } finally {
      Mostrar_Dialogo = Original;
    }
  });

  expect(resultado.Mensajes).toHaveLength(2);
  expect(resultado.Actual_1).toBe(1);
  expect(resultado.Siguiente_1).toBe(1);
  expect(resultado.Actual_2).toBe(0);
  expect(resultado.Siguiente_2).toBe(0);
});
