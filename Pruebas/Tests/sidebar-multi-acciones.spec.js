const { test, expect } = require("@playwright/test");

function lunesIsoDe(fecha) {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  const dia = copia.getDay();
  const delta = dia === 0 ? -6 : 1 - dia;
  copia.setDate(copia.getDate() + delta);
  return copia.toISOString().slice(0, 10);
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
  await page.waitForFunction(
    () => typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

function crearEstadoBase() {
  const lunes = lunesIsoDe(new Date());
  return {
    Objetivos: [
      {
        Id: "o1",
        Familia_Id: "fam-o1",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {
          [lunes]: [
            {
              Id: "s1",
              Plantilla_Id: null,
              Origen_Plantilla_Id: null,
              Emoji: "✅",
              Texto: "Sub de copia",
              Hecha: false
            }
          ]
        },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Objetivo Uno",
        Descripcion_Corta: "Texto uno",
        Emoji: "🎯",
        Color: "#f1b77e",
        Horas_Semanales: 4,
        Restante: 4,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: lunes,
        Semana_Inicio: null,
        Semana_Fin: null,
        Categoria_Id: "cat1",
        Etiquetas_Ids: ["et1"]
      },
      {
        Id: "o2",
        Familia_Id: "fam-o2",
        Fracasos_Semanales: {},
        Subobjetivos_Semanales: {},
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {},
        Nombre: "Objetivo Dos",
        Descripcion_Corta: "Texto dos",
        Emoji: "🛠️",
        Color: "#8fbcd4",
        Horas_Semanales: 2,
        Restante: 2,
        Es_Bolsa: true,
        Es_Fija: false,
        Semana_Base: lunes,
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
    Categorias: [
      { Id: "cat1", Emoji: "💼", Nombre: "Trabajo", Metadatos: [] },
      { Id: "cat2", Emoji: "🏠", Nombre: "Casa", Metadatos: [] }
    ],
    Etiquetas: [
      { Id: "et1", Nombre: "Urgente", Color: "#a3d9a5" }
    ],
    Baul_Objetivos: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: lunes,
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
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true,
        Patron_Boton: true,
        Limpiar_Semana_Boton: true,
        Ayuda_Boton: true,
        Logout_Boton: true
      },
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
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
  };
}

test("la barra multi de objetivos conserva borrar y nuevas acciones", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Objetivos_Multi_Seleccion = new Set(["o1", "o2"]);
    Render_Emojis();
    Render_Barra_Multi_Seleccion();
    const Barra = document.getElementById("Multi_Sel_Barra");
    const Botones = Array.from(
      document.querySelectorAll("#Multi_Sel_Acciones button")
    ).map((Btn) => (Btn.textContent || "").trim());
    const Esperados = [
      t("borrar"),
      t("multi.cambiar_categoria"),
      t("multi.cambiar_color"),
      t("archivar"),
      t("desarchivar"),
      t("multi.enviar_baul"),
      t("multi.cambiar_alcance"),
      t("multi.duplicar"),
      t("multi.copiar")
    ];
    return {
      activa: Barra?.classList.contains("Activa") || false,
      botones: Botones,
      esperados: Esperados
    };
  });

  expect(resultado.activa).toBe(true);
  resultado.esperados.forEach((texto) => {
    expect(resultado.botones).toContain(texto);
  });
});

test("la regla global limpia selecciones multi fuera de barras", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Objetivos_Multi_Seleccion = new Set(["o1"]);
    Subobjetivos_Multi_Seleccion = new Set(["s1"]);
    Eventos_Multi_Seleccion = new Set(["e1"]);
    Slots_Multi_Seleccion = new Set(["2026-04-13|9"]);
    Baul_Multi_Seleccion = new Set(["b1"]);
    Archivero_Notas_Seleccionadas = new Set(["n1"]);
    Planes_Multi_Seleccion = new Set(["p1"]);
    document.body.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0
      })
    );
    return {
      objetivos: Objetivos_Multi_Seleccion.size,
      subobjetivos: Subobjetivos_Multi_Seleccion.size,
      eventos: Eventos_Multi_Seleccion.size,
      slots: Slots_Multi_Seleccion.size,
      baul: Baul_Multi_Seleccion.size,
      archivero: Archivero_Notas_Seleccionadas.size,
      planes: Planes_Multi_Seleccion.size
    };
  });

  expect(resultado).toEqual({
    objetivos: 0,
    subobjetivos: 0,
    eventos: 0,
    slots: 0,
    baul: 0,
    archivero: 0,
    planes: 0
  });
});

test("click derecho en seleccionable limpia sin abrir menu", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Objetivos_Multi_Seleccion = new Set(["o1", "o2"]);
    Render_Emojis();
    Render_Barra_Multi_Seleccion();
    const Item = document.querySelector(".Emoji_Item");
    const Evento = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2
    });
    const Permitido = Item.dispatchEvent(Evento);
    return {
      defaultPrevented: Evento.defaultPrevented,
      permitido: Permitido,
      objetivos: Objetivos_Multi_Seleccion.size,
      menuActivo: document.getElementById("Dia_Accion_Menu")
        ?.classList.contains("Activo") || false
    };
  });

  expect(resultado.defaultPrevented).toBe(true);
  expect(resultado.permitido).toBe(false);
  expect(resultado.objetivos).toBe(0);
  expect(resultado.menuActivo).toBe(false);
});

test("las barras de lote no rompen la seleccion", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Objetivos_Multi_Seleccion = new Set(["o1", "o2"]);
    Render_Emojis();
    Render_Barra_Multi_Seleccion();
    const Barra = document.getElementById("Multi_Sel_Barra");
    Barra.dispatchEvent(
      new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        button: 0
      })
    );
    const Despues_Click = Objetivos_Multi_Seleccion.size;
    const Evento = new MouseEvent("contextmenu", {
      bubbles: true,
      cancelable: true,
      button: 2
    });
    const Permitido = Barra.dispatchEvent(Evento);
    return {
      despuesClick: Despues_Click,
      despuesDerecho: Objetivos_Multi_Seleccion.size,
      defaultPrevented: Evento.defaultPrevented,
      permitido: Permitido
    };
  });

  expect(resultado.despuesClick).toBe(2);
  expect(resultado.despuesDerecho).toBe(2);
  expect(resultado.defaultPrevented).toBe(false);
  expect(resultado.permitido).toBe(true);
});

test("copia y pega objetivos multi en otra semana", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Objetivos_Multi_Seleccion = new Set(["o1"]);
    Copiar_Objetivos_Multi_Al_Portapapeles();
    Semana_Actual = Sumar_Dias(Semana_Actual, 7);
    const Semana_Destino = Clave_Semana_Actual();
    Pegar_Objetivos_Multi_En_Semana_Actual();
    const Copias = Objetivos.filter((Objetivo) =>
      Objetivo.Id !== "o1" &&
      Objetivo.Semana_Base === Semana_Destino &&
      Objetivo.Nombre === "Objetivo Uno"
    );
    const Copia = Copias[0] || null;
    const Subobjetivos = Copia?.Subobjetivos_Semanales?.[
      Semana_Destino
    ] || [];
    return {
      cantidadCopias: Copias.length,
      categoria: Copia?.Categoria_Id || null,
      etiquetas: Copia?.Etiquetas_Ids || [],
      subobjetivos: Subobjetivos.length
    };
  });

  expect(resultado.cantidadCopias).toBe(1);
  expect(resultado.categoria).toBe("cat1");
  expect(resultado.etiquetas).toEqual(["et1"]);
  expect(resultado.subobjetivos).toBe(1);
});

test("el emoji de categoria queda fijado en boton visible", async ({
  page
}) => {
  await preparar(page, crearEstadoBase());

  const resultado = await page.evaluate(() => {
    Abrir_Config();
    Render_Config_Categorias();

    const Boton_Nuevo = document.getElementById("Cfg_Cat_Emoji_Btn");
    const Input_Nuevo = document.getElementById("Cfg_Cat_Emoji");
    Boton_Nuevo?.click();
    const Foco_Tras_Click = document.activeElement?.id || "";
    Input_Nuevo.value = "🧠";
    Input_Nuevo.dispatchEvent(new Event("input", { bubbles: true }));

    const Boton_Existente = document.querySelector(
      "#Cfg_Categorias_Lista .Config_Cat_Emoji_Btn"
    );
    const Input_Existente = document.querySelector(
      "#Cfg_Categorias_Lista .Config_Cat_Input_Emoji_Oculto"
    );
    Input_Existente.value = "📌";
    Input_Existente.dispatchEvent(
      new Event("input", { bubbles: true })
    );

    return {
      focoTrasClick: Foco_Tras_Click,
      emojiNuevo: Boton_Nuevo?.dataset.emojiTexto || "",
      emojiExistente: Boton_Existente?.dataset.emojiTexto || ""
    };
  });

  expect(resultado.focoTrasClick).toBe("Cfg_Cat_Emoji");
  expect(resultado.emojiNuevo).toContain("🧠");
  expect(resultado.emojiExistente).toContain("📌");
});
