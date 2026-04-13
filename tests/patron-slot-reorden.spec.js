const { test, expect } = require("@playwright/test");

test("permite reordenar items al editar un patrón de slot", async ({
  page
}) => {
  const estadoInicial = {
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
    Patrones: [
      {
        Id: "P1",
        Nombre: "Patrón slot",
        Emoji: "🧩",
        Tipo: "Slot",
        Aplica_A: "Slot_Vacio",
        Items: [
          {
            Id: "I1",
            Emoji: "1️⃣",
            Texto: "Primero",
            Estado: "Planeado"
          },
          {
            Id: "I2",
            Emoji: "2️⃣",
            Texto: "Segundo",
            Estado: "Planeado"
          }
        ]
      }
    ],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
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
      Baul_Tareas_Por_Fila: 5,
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
  await page.waitForFunction(() => typeof window.Inicializar === "function");

  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    window.Abrir_Modal_Patron("P1");
  });

  const filas = page.locator(
    "#Patron_Modal_Cuerpo .Patron_Modal_Franja.Reordenable"
  );

  await expect(filas).toHaveCount(2);
  await expect(
    filas.nth(0).locator(".Patron_Modal_Nombre_Input")
  ).toHaveValue("Primero");

  await page.evaluate(() => {
    const filasModal = Array.from(
      document.querySelectorAll(
        "#Patron_Modal_Cuerpo .Patron_Modal_Franja.Reordenable"
      )
    );
    const origen = filasModal[0];
    const destino = filasModal[1];
    const rect = destino.getBoundingClientRect();
    const data = new DataTransfer();

    origen.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data
      })
    );

    destino.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientY: rect.bottom - 1
      })
    );

    destino.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: data,
        clientY: rect.bottom - 1
      })
    );
  });

  await expect(
    filas.nth(0).locator(".Patron_Modal_Nombre_Input")
  ).toHaveValue("Segundo");

  const orden = await page.evaluate(() => {
    return (Patron_En_Edicion?.Items || []).map(
      (item) => item.Texto
    );
  });

  expect(orden).toEqual(["Segundo", "Primero"]);
});
