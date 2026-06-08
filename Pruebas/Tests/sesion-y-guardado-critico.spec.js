const { test, expect } = require("@playwright/test");

async function Preparar_Funciones(page) {
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
    "https://challenges.cloudflare.com/turnstile/v0/api.js" +
      "?render=explicit",
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
    localStorage.setItem("Semaplan_Idioma", "es");
  });
  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Preparar_Sesion_Operativa_Entrada === "function" &&
    typeof Guardar_Estado_Cambio_Critico === "function"
  );
}

async function Instalar_Backend_Sesion(page, estadoRemoto) {
  await page.evaluate((estado) => {
    window.__Fila_Sesion = estado === null
      ? null
      : {
        estado,
        actualizado_en: "2026-06-08T12:00:00.000Z",
        version: 1
      };
    window.__SignOuts = [];
    window.__MostroAuth = false;
    window.__IntervaloMs = 0;
    window.setInterval = (_fn, ms) => {
      window.__IntervaloMs = ms;
      return 12345;
    };
    window.clearInterval = () => {};

    const clonar = (valor) =>
      valor === null || valor === undefined
        ? valor
        : JSON.parse(JSON.stringify(valor));

    const crearBuilder = () => {
      const builder = {
        accion: "leer",
        payload: null,
        versionEsperada: null,
        select() {
          return this;
        },
        eq(campo, valor) {
          if (campo === "version") {
            this.versionEsperada = valor;
          }
          return this;
        },
        update(payload) {
          this.accion = "update";
          this.payload = payload;
          return this;
        },
        insert(payload) {
          this.accion = "insert";
          this.payload = payload;
          return this;
        },
        async maybeSingle() {
          if (this.accion === "leer") {
            return {
              data: clonar(window.__Fila_Sesion),
              error: null
            };
          }
          if (this.accion === "insert") {
            window.__Fila_Sesion = {
              estado: clonar(this.payload.estado),
              actualizado_en:
                "2026-06-08T12:00:01.000Z",
              version: 1
            };
            return {
              data: {
                actualizado_en:
                  window.__Fila_Sesion.actualizado_en,
                version: 1
              },
              error: null
            };
          }
          if (!window.__Fila_Sesion) {
            return { data: null, error: null };
          }
          if (
            this.versionEsperada &&
            window.__Fila_Sesion.version !==
              this.versionEsperada
          ) {
            return { data: null, error: null };
          }
          window.__Fila_Sesion = {
            ...window.__Fila_Sesion,
            estado: clonar(this.payload.estado),
            actualizado_en:
              "2026-06-08T12:00:02.000Z",
            version:
              Number(this.payload.version) ||
              window.__Fila_Sesion.version
          };
          return {
            data: {
              actualizado_en:
                window.__Fila_Sesion.actualizado_en,
              version: window.__Fila_Sesion.version
            },
            error: null
          };
        }
      };
      return builder;
    };

    Supa = {
      auth: {
        async signOut(opciones) {
          window.__SignOuts.push(opciones || {});
          return { error: null };
        }
      },
      from() {
        return crearBuilder();
      }
    };
    Usuario_Actual = {
      id: "user-sesion",
      email: "sesion@example.com"
    };
    Mostrar_Dialogo = async () => true;
    Mostrar_Auth = () => {
      window.__MostroAuth = true;
    };
  }, estadoRemoto);
}

function Estado_Con_Sesion_Ajena() {
  const ahora = Date.now();
  return {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Sesiones_Operativas: {
      Activas: {
        "otra::instancia": {
          Id: "otra",
          Instancia_Id: "instancia",
          Usuario_Id: "user-sesion",
          Email: "otra@example.com",
          Iniciada_Ms: ahora - 2000,
          Ultimo_Visto_Ms: ahora - 1000,
          Version_Programa: "test"
        }
      }
    }
  };
}

test("registra una sesion operativa exclusiva y heartbeat", async ({
  page
}) => {
  await Preparar_Funciones(page);
  await Instalar_Backend_Sesion(page, {});

  const resultado = await page.evaluate(async () => {
    Preparar_Sesion_Local_Activa();
    const ok = await Preparar_Sesion_Operativa_Entrada();
    const sesiones = Object.values(
      window.__Fila_Sesion.estado.Sesiones_Operativas.Activas
    );
    return {
      ok,
      cantidad: sesiones.length,
      email: sesiones[0]?.Email || "",
      intervalo: window.__IntervaloMs
    };
  });

  expect(resultado).toEqual({
    ok: true,
    cantidad: 1,
    email: "sesion@example.com",
    intervalo: 30000
  });
});

test("bloquea la entrada cuando existe otra sesion activa", async ({
  page
}) => {
  await Preparar_Funciones(page);
  await Instalar_Backend_Sesion(page, Estado_Con_Sesion_Ajena());
  await page.evaluate(() => {
    window.__BloqueoCantidad = 0;
    Mostrar_Bloqueo_Sesion_Operativa = async (sesiones) => {
      window.__BloqueoCantidad = sesiones.length;
      return "Salir";
    };
  });

  const resultado = await page.evaluate(async () => {
    Preparar_Sesion_Local_Activa();
    const ok = await Preparar_Sesion_Operativa_Entrada();
    return {
      ok,
      bloqueoCantidad: window.__BloqueoCantidad,
      signOuts: window.__SignOuts.length,
      mostroAuth: window.__MostroAuth,
      cantidadRemota: Object.keys(
        window.__Fila_Sesion.estado.Sesiones_Operativas.Activas
      ).length
    };
  });

  expect(resultado).toEqual({
    ok: false,
    bloqueoCantidad: 1,
    signOuts: 1,
    mostroAuth: true,
    cantidadRemota: 1
  });
});

test("cerrar otras sesiones deja solo la sesion actual", async ({
  page
}) => {
  await Preparar_Funciones(page);
  await Instalar_Backend_Sesion(page, Estado_Con_Sesion_Ajena());
  await page.evaluate(() => {
    Mostrar_Bloqueo_Sesion_Operativa = async () => "Cerrar_Otras";
  });

  const resultado = await page.evaluate(async () => {
    Preparar_Sesion_Local_Activa();
    const ok = await Preparar_Sesion_Operativa_Entrada();
    const sesiones = Object.values(
      window.__Fila_Sesion.estado.Sesiones_Operativas.Activas
    );
    return {
      ok,
      cantidad: sesiones.length,
      email: sesiones[0]?.Email || "",
      corte:
        Number(
          window.__Fila_Sesion.estado.Sesiones_Operativas.Corte_Ms
        ) > 0,
      intervalo: window.__IntervaloMs
    };
  });

  expect(resultado).toEqual({
    ok: true,
    cantidad: 1,
    email: "sesion@example.com",
    corte: true,
    intervalo: 30000
  });
});

function Estado_Base_Local() {
  return {
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
    Habitos: [],
    Habitos_Registros: [],
    Retos: [],
    Tareas: [],
    Tareas_Cajones_Definidos: ["Inbox"],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 8,
      Fin_Hora: 11,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 1],
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
        Plan_Boton: true
      },
      Version_Programa: "Demo",
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
    Tipos_Slot: [
      {
        Id: "Sueno",
        Nombre: "Sueño",
        Color: "#ddd4f4",
        Titulo: "Dormir",
        Titulo_Por_Defecto: true
      }
    ],
    Tipos_Slot_Inicializados: true,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Slots_Muertos_Grupo_Ids: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {},
    Planes_Periodo: {}
  };
}

test("slots, dias y planes de slot usan guardado critico", async ({
  page
}) => {
  await Preparar_Funciones(page);
  await page.evaluate((estado) => {
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify(estado)
    );
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    Inicializar();
    Cargando_Inicial = false;
    Usuario_Actual = {
      id: "user-local",
      email: "local@example.com"
    };
    Semana_Actual = Parsear_Fecha_ISO("2026-04-13");
    Render_Calendario();
  }, Estado_Base_Local());

  const resultado = await page.evaluate(async () => {
    window.__Criticos = 0;
    window.__Normales = 0;
    Guardar_Estado_Cambio_Critico = () => {
      window.__Criticos += 1;
    };
    Guardar_Estado = () => {
      window.__Normales += 1;
    };
    Forzar_Sync_Inmediato_Cambio_Critico =
      async () => true;
    Mostrar_Dialogo = async () => true;

    const fecha = "2026-04-13";
    Bloquear_Dia_Completo(fecha, "Sueno");
    Desbloquear_Dia_Completo(fecha);
    Bloquear_Horario_Completo(9, "Sueno");
    await Limpiar_Horario_Completo(9);
    await Limpiar_Dia_Completo(fecha);

    Abrir_Modal_Plan_Slot(fecha, 9);
    Plan_Slot_Borrador = [
      {
        Id: "plan_test",
        Texto: "Leer capítulo",
        Emoji: "📘",
        Estado: "Planeado"
      }
    ];
    await Guardar_Modal_Plan_Slot();
    await Borrar_Plan_Slot_Con_Confirmacion(fecha, 9);

    Crear_Slot_Muerto(fecha, 9, "Sueno");
    Guardar_Plan_Slot_Clave(Clave_Slot(fecha, 9), [
      {
        Id: "plan_borrar",
        Texto: "Cerrar idea",
        Emoji: "🧩",
        Estado: "Planeado"
      }
    ]);
    await Eliminar_Slot_Muerto_Con_Confirmacion(fecha, 9);

    return {
      criticos: window.__Criticos,
      normales: window.__Normales,
      slotMuerto: Slot_Es_Muerto(fecha, 9),
      itemsPlan: Contar_Items_Plan_Slot(fecha, 9)
    };
  });

  expect(resultado).toEqual({
    criticos: 8,
    normales: 0,
    slotMuerto: false,
    itemsPlan: 0
  });
});
