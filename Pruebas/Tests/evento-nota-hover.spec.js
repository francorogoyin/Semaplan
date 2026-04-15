const { test, expect } = require("@playwright/test");

function Crear_Estado_Base() {
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
    Contador_Eventos: 2,
    Objetivo_Seleccionada_Id: null,
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
      Menu_Estilo: "Hamburguesa",
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

async function Preparar(page, estadoInicial) {
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
    "https://challenges.cloudflare.com/turnstile/" +
    "v0/api.js?render=explicit",
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

test("muestra la nota del bloque tras 2 segundos de hover", async ({
  page
}) => {
  const estado = Crear_Estado_Base();
  estado.Objetivos = [
    {
      Id: "T1",
      Nombre: "Bloque con nota",
      Emoji: "📝",
      Color: "#1f6b4f",
      Categoria_Id: null,
      Etiquetas_Ids: [],
      Metadatos: {},
      Estado: "Activa",
      Archivada: false,
      Horas_Aprox: 0,
      Timeline: null,
      Orden_Personalizado: 1
    }
  ];
  estado.Eventos = [
    {
      Id: "E1",
      Objetivo_Id: "T1",
      Fecha: "2026-04-13",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Color: "#1f6b4f",
      Nota: "Nota visible por hover"
    }
  ];

  await Preparar(page, estado);

  const bloque = page.locator('.Evento[data-id="E1"]');
  const marca = bloque.locator(".Evento_Nota_Marca");
  await expect(
    marca
  ).not.toHaveAttribute("title", /.+/);
  await bloque.hover();
  await page.waitForTimeout(2100);

  const popupNota = page.locator(".Evento_Nota_Popup");
  await expect(popupNota).toHaveText(
    "Nota visible por hover"
  );
  await expect(page.locator(".Evento_Abordaje_Popup"))
    .toHaveCount(0);
  const cajaMarca = await marca.boundingBox();
  const cajaPopup = await popupNota.boundingBox();
  expect(cajaMarca).not.toBeNull();
  expect(cajaPopup).not.toBeNull();
  expect(
    Math.abs(cajaPopup.x - cajaMarca.x)
  ).toBeLessThan(3);
  expect(
    Math.abs(
      cajaPopup.y - (cajaMarca.y + cajaMarca.height + 4)
    )
  ).toBeLessThan(3);

  await marca.click();
  await expect(page.locator(".Evento_Nota_Popup"))
    .toHaveCount(0);

  await marca.click();
  await expect(popupNota).toHaveText(
    "Nota visible por hover"
  );

  await page.mouse.move(4, 4);
  await expect(page.locator(".Evento_Nota_Popup"))
    .toHaveCount(0);
});

test("mantiene el popup de abordaje si el bloque no tiene nota", async ({
  page
}) => {
  const estado = Crear_Estado_Base();
  estado.Objetivos = [
    {
      Id: "T2",
      Nombre: "Bloque sin nota",
      Emoji: "📚",
      Color: "#2b5a9b",
      Categoria_Id: null,
      Etiquetas_Ids: [],
      Metadatos: {},
      Estado: "Activa",
      Archivada: false,
      Horas_Aprox: 0,
      Timeline: null,
      Orden_Personalizado: 1
    }
  ];
  estado.Eventos = [
    {
      Id: "E2",
      Objetivo_Id: "T2",
      Fecha: "2026-04-13",
      Inicio: 11,
      Duracion: 1,
      Hecho: false,
      Color: "#2b5a9b",
      Abordaje: [
        {
          Id: "A1",
          Emoji: "•",
          Texto: "Paso de abordaje",
          Estado: "Planeado"
        }
      ]
    }
  ];

  await Preparar(page, estado);

  const bloque = page.locator('.Evento[data-id="E2"]');
  await bloque.hover();
  await page.waitForTimeout(2100);

  const popupAbordaje = page.locator(".Evento_Abordaje_Popup");
  await expect(popupAbordaje).toContainText(
    "Paso de abordaje"
  );
  await expect(page.locator(".Evento_Nota_Popup"))
    .toHaveCount(0);
});

test("cerrar la nota con click afuera no selecciona el slot", async ({
  page
}) => {
  const estado = Crear_Estado_Base();
  estado.Objetivos = [
    {
      Id: "T1",
      Nombre: "Bloque con nota",
      Emoji: "📝",
      Color: "#1f6b4f",
      Categoria_Id: null,
      Etiquetas_Ids: [],
      Metadatos: {},
      Estado: "Activa",
      Archivada: false,
      Es_Bolsa: false,
      Horas_Semanales: 0,
      Semana_Base: "2026-04-13",
      Copias_Semana: {},
      Abordaje_Default: []
    }
  ];
  estado.Eventos = [
    {
      Id: "EV1",
      Objetivo_Id: "T1",
      Fecha: "2026-04-13",
      Inicio: 10,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Nota: "Nota para cerrar con click afuera"
    }
  ];

  await Preparar(page, estado);

  const bloque = page.locator('.Evento[data-id="EV1"]');
  const marca = bloque.locator(".Evento_Nota_Marca");
  await marca.click();
  await expect(page.locator(".Evento_Nota_Popup"))
    .toHaveText("Nota para cerrar con click afuera");

  await page.click(
    '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
  );

  const data = await page.evaluate(() => ({
    popup_activo: Boolean(
      document.querySelector(".Evento_Nota_Popup")
    ),
    seleccion_slots: Array.from(Slots_Multi_Seleccion).sort(),
    seleccion_eventos: Array.from(Eventos_Multi_Seleccion).sort(),
    clase_activa: document.querySelector(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
    )?.classList.contains("Multi_Activa") || false,
    barra_activa: document.getElementById(
      "Calendario_Multi_Acciones"
    )?.classList.contains("Activa") || false
  }));

  expect(data.popup_activo).toBeFalsy();
  expect(data.seleccion_slots).toEqual([]);
  expect(data.seleccion_eventos).toEqual([]);
  expect(data.clase_activa).toBeFalsy();
  expect(data.barra_activa).toBeFalsy();
});
