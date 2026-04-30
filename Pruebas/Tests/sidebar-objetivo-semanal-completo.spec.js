const { test, expect } = require("@playwright/test");

async function Preparar(page, Estado_Inicial) {
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
  await page.addInitScript((Estado) => {
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
      JSON.stringify(Estado)
    );
  }, Estado_Inicial);

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

function Crear_Objetivo_Base() {
  return {
    Id: "obj_base",
    Familia_Id: "fam_obj",
    Nombre: "Informe",
    Emoji: "T",
    Color: "#1f6b4f",
    Horas_Semanales: 0,
    Restante: 0,
    Es_Bolsa: false,
    Es_Fija: true,
    Semana_Base: null,
    Semana_Inicio: "2026-04-13",
    Semana_Fin: null,
    Categoria_Id: null,
    Etiquetas_Ids: [],
    Fracasos_Semanales: {},
    Subobjetivos_Semanales: {},
    Subobjetivos_Contraidas_Semanales: {},
    Subobjetivos_Excluidos_Semanales: {}
  };
}

function Crear_Objetivo_Semanal() {
  return {
    Id: "obj_semana",
    Familia_Id: "fam_obj",
    Nombre: "Informe actualizado",
    Emoji: "T",
    Color: "#1f6b4f",
    Horas_Semanales: 0,
    Restante: 0,
    Es_Bolsa: false,
    Es_Fija: false,
    Semana_Base: "2026-04-13",
    Semana_Inicio: null,
    Semana_Fin: null,
    Categoria_Id: null,
    Etiquetas_Ids: [],
    Fracasos_Semanales: {},
    Subobjetivos_Semanales: {},
    Subobjetivos_Contraidas_Semanales: {},
    Subobjetivos_Excluidos_Semanales: {}
  };
}

function Crear_Estado() {
  return {
    Objetivos: [
      Crear_Objetivo_Base(),
      Crear_Objetivo_Semanal()
    ],
    Eventos: [
      {
        Id: "ev_base",
        Objetivo_Id: "obj_base",
        Fecha: "2026-04-13",
        Inicio: 9,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: "#1f6b4f"
      }
    ],
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
      Inicio_Hora: 8,
      Fin_Hora: 18,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
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
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("el objetivo semanal se completa con evento de su familia",
async ({ page }) => {
  await Preparar(page, Crear_Estado());
  await page.evaluate(() => {
    Semana_Actual = Obtener_Lunes(
      Parsear_Fecha_ISO("2026-04-13")
    );
    Render_Calendario();
    Render_Emojis();
    Render_Eventos();
  });

  const Emoji = page.locator('[data-objetivo-id="obj_semana"]');
  await expect(Emoji).toBeVisible();
  await expect(Emoji).not.toHaveClass(/Completa/);

  await page.locator(
    '.Evento[data-id="ev_base"] .Evento_Boton'
  ).first().click();

  await expect(page.locator('.Evento[data-id="ev_base"]'))
    .toHaveClass(/Evento_Hecho/);
  await expect(Emoji).toHaveClass(/Completa/);
});

test("edita aporte a meta desde el plan sin redistribuirlo",
async ({ page }) => {
  const Estado = Crear_Estado();
  Estado.Inicio_Semana = "2026-04-20";
  Estado.Objetivos = [
    {
      ...Crear_Objetivo_Semanal(),
      Id: "obj_meta",
      Familia_Id: "obj_meta",
      Semana_Base: "2026-04-20",
      Nombre: "Lectura semanal",
      Meta_Vinculo_Tipo: "Subobjetivo",
      Meta_Vinculo_Id: "sub_melville",
      Meta_Aporte_Semanal: 9,
      Meta_Aporte_Unidad: "p\u00e1ginas"
    }
  ];
  Estado.Eventos = [
    {
      Id: "ev_meta",
      Objetivo_Id: "obj_meta",
      Fecha: "2026-04-22",
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Anulada: false,
      Color: "#1f6b4f",
      Meta_Aporte_Cantidad: 9,
      Meta_Aporte_Unidad: "p\u00e1ginas",
      Meta_Aporte_Planeado: true,
      Meta_Aporte_Tildado: true
    }
  ];
  Estado.Contador_Eventos = 2;
  Estado.Planes_Periodo = {
    Version: 2,
    Periodos: {
      anio_2026: {
        Id: "anio_2026",
        Tipo: "Anio",
        Inicio: "2026-01-01",
        Fin: "2026-12-31",
        Estado: "Activo",
        Orden: 0
      }
    },
    Objetivos: {
      obj_libros: {
        Id: "obj_libros",
        Periodo_Id: "anio_2026",
        Nombre: "Libros",
        Emoji: "\uD83D\uDCDA",
        Target_Total: 180,
        Unidad: "Personalizado",
        Unidad_Custom: "p\u00e1ginas",
        Estado: "Activo",
        Orden: 0
      }
    },
    Subobjetivos: {
      sub_melville: {
        Id: "sub_melville",
        Objetivo_Id: "obj_libros",
        Texto: "Cuentos de Melville",
        Emoji: "\uD83D\uDCD6",
        Target_Total: 180,
        Unidad: "Personalizado",
        Unidad_Custom: "p\u00e1ginas",
        Estado: "Activo",
        Orden: 0
      }
    },
    Avances: {},
    UI: {}
  };

  await Preparar(page, Estado);
  await page.evaluate(() => {
    Semana_Actual = Obtener_Lunes(
      Parsear_Fecha_ISO("2026-04-20")
    );
    Abrir_Modal_Abordaje("ev_meta");
  });

  await expect(page.locator("#Abordaje_Modal_Overlay"))
    .toHaveClass(/Activo/);
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Btn:visible")
  ).toHaveCount(0);
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("border-top-width", "0px");
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("border-radius", "0px");
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(
    page.locator(
      "#Abordaje_Modal_Cuerpo .Aporte_Meta_General " +
        ".Aporte_Meta_Destino_Check"
    )
  ).toBeChecked();
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_General_Input")
  ).toHaveCSS("border-radius", "8px");
  await page.fill(
    "#Abordaje_Modal_Cuerpo .Aporte_Meta_General_Input",
    "25"
  );
  await page.evaluate(() => {
    Mostrar_Dialogo = async () => true;
  });
  await page.click("#Abordaje_Modal_Guardar_Btn");

  const Datos = await page.evaluate(() => {
    const Evento = Eventos.find((Item) => Item.Id === "ev_meta");
    return {
      cantidad: Evento?.Meta_Aporte_Cantidad,
      manual: Evento?.Meta_Aporte_Manual,
      planeado: Evento?.Meta_Aporte_Planeado,
      tildado: Evento?.Meta_Aporte_Tildado
    };
  });

  expect(Datos).toEqual({
    cantidad: 25,
    manual: true,
    planeado: true,
    tildado: true
  });

  await page.evaluate(() => {
    Focus_Navegacion_Id = "ev_meta";
    Abrir_Focus_Mode();
  });
  await expect(page.locator("#Focus_Overlay"))
    .toHaveClass(/Activo/);
  await expect(
    page.locator("#Focus_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("border-top-width", "0px");
  await expect(
    page.locator("#Focus_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("border-radius", "0px");
  await expect(
    page.locator("#Focus_Cuerpo .Aporte_Meta_Bloque")
  ).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(
    page.locator(
      "#Focus_Cuerpo .Aporte_Meta_General " +
        ".Aporte_Meta_Destino_Check"
    )
  ).toBeChecked();
  await expect(
    page.locator("#Focus_Cuerpo .Aporte_Meta_General_Input")
  ).toHaveValue("25");
  await page.evaluate(() => Cerrar_Focus_Mode());

  await page.evaluate(() => Abrir_Modal_Abordaje("ev_meta"));
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_General_Input")
  )
    .toHaveValue("25");
});
