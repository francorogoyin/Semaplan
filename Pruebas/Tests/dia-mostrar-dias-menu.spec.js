const { test, expect } = require("@playwright/test");

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
    Render_Calendario();
  });
}

function crearEstado() {
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
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 8,
      Fin_Hora: 12,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 2, 4],
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
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

test("el menu del encabezado alterna dias visibles", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    const Header_Lunes = document.querySelector(
      '.Dia_Header[data-dia="0"]'
    );
    Mostrar_Menu_Dia(
      Header_Lunes.dataset.fecha,
      Header_Lunes.getBoundingClientRect(),
      0
    );
    const Menu = document.getElementById("Dia_Accion_Menu");
    const Texto_Menu = Menu.textContent || "";
    Menu.querySelector('[data-accion="dias"]')?.click();
    const Submenu_Abierto = Boolean(
      Menu.querySelector(
        ".Dia_Accion_Submenu_Grupo.Abierto"
      )
    );
    const Titulo_Atajos = Menu.querySelector(
      ".Dia_Accion_Submenu_Titulo"
    )?.textContent || "";
    const Textos_Atajos = Array.from(
      Menu.querySelectorAll("[data-dia-atajo]")
    ).map((Btn) => Btn.textContent || "");
    const Atajos = Array.from(
      Menu.querySelectorAll("[data-dia-atajo]")
    ).map((Btn) => Btn.dataset.diaAtajo || "");
    const Btn_Martes = Menu.querySelector(
      '[data-dia-toggle="1"]'
    );
    const Texto_Martes = Btn_Martes?.textContent || "";
    Btn_Martes?.click();

    const Menu_Activo_Tras_Martes = Menu.classList.contains("Activo");
    const Submenu_Tras_Martes = Boolean(
      Menu.querySelector(
        ".Dia_Accion_Submenu_Grupo.Abierto"
      )
    );

    const Estado_Con_Martes = Obtener_Dias_Visibles_Efectivos();
    const Tiene_Header_Martes = Boolean(
      document.querySelector('.Dia_Header[data-dia="1"]')
    );

    const Header_Martes = document.querySelector(
      '.Dia_Header[data-dia="1"]'
    );
    Mostrar_Menu_Dia(
      Header_Martes.dataset.fecha,
      Header_Martes.getBoundingClientRect(),
      1
    );
    document
      .querySelector('#Dia_Accion_Menu [data-accion="dias"]')
      ?.click();
    const Btn_Viernes = document.querySelector(
      '#Dia_Accion_Menu [data-dia-toggle="4"]'
    );
    const Texto_Viernes = Btn_Viernes?.textContent || "";
    Btn_Viernes?.click();
    const Estado_Sin_Viernes = Obtener_Dias_Visibles_Efectivos();
    const Tiene_Header_Viernes = Boolean(
      document.querySelector('.Dia_Header[data-dia="4"]')
    );

    const Header_Lunes_2 = document.querySelector(
      '.Dia_Header[data-dia="0"]'
    );
    Mostrar_Menu_Dia(
      Header_Lunes_2.dataset.fecha,
      Header_Lunes_2.getBoundingClientRect(),
      0
    );
    document
      .querySelector('#Dia_Accion_Menu [data-accion="dias"]')
      ?.click();
    document
      .querySelector('#Dia_Accion_Menu [data-dia-atajo="solo-hoy"]')
      ?.click();

    return {
      textoMenu: Texto_Menu,
      submenuAbierto: Submenu_Abierto,
      tituloAtajos: Titulo_Atajos,
      textosAtajos: Textos_Atajos,
      atajos: Atajos,
      textoMartes: Texto_Martes,
      menuActivoTrasMartes: Menu_Activo_Tras_Martes,
      submenuTrasMartes: Submenu_Tras_Martes,
      diasConMartes: Estado_Con_Martes,
      tieneHeaderMartes: Tiene_Header_Martes,
      textoViernes: Texto_Viernes,
      diasSinViernes: Estado_Sin_Viernes,
      tieneHeaderViernes: Tiene_Header_Viernes,
      diasSoloHoy: Obtener_Dias_Visibles_Efectivos(),
      diaHoy: Obtener_Dia_Hoy_Index(),
      tieneHeaderSoloHoy: Boolean(
        document.querySelector(
          `.Dia_Header[data-dia="${Obtener_Dia_Hoy_Index()}"]`
        )
      ),
      tieneHeaderLunesSoloHoy: Boolean(
        document.querySelector('.Dia_Header[data-dia="0"]')
      )
    };
  });

  expect(resultado.textoMenu).toContain("Mostrar días");
  expect(resultado.submenuAbierto).toBeTruthy();
  expect(resultado.tituloAtajos).toContain("Atajos");
  expect(resultado.textosAtajos.join(" ")).toContain(
    "Ocultar todos menos hoy"
  );
  expect(resultado.atajos.slice(0, 3)).toEqual([
    "todos-dias",
    "ocultar-fin-semana",
    "ocultar-dias-semana"
  ]);
  expect(resultado.textosAtajos.join(" ")).toContain(
    "Ocultar días anteriores"
  );
  expect(resultado.textosAtajos.join(" ")).toContain(
    "Ocultar días posteriores"
  );
  expect(resultado.textoMartes).toContain("Martes");
  expect(resultado.textoMartes).toContain("✕");
  expect(resultado.menuActivoTrasMartes).toBeTruthy();
  expect(resultado.submenuTrasMartes).toBeTruthy();
  expect(resultado.diasConMartes).toEqual([0, 1, 2, 4]);
  expect(resultado.tieneHeaderMartes).toBe(true);
  expect(resultado.textoViernes).toContain("Viernes");
  expect(resultado.textoViernes).toContain("✓");
  expect(resultado.diasSinViernes).toEqual([0, 1, 2]);
  expect(resultado.tieneHeaderViernes).toBe(false);
  expect(resultado.diasSoloHoy).toEqual([resultado.diaHoy]);
  expect(resultado.tieneHeaderSoloHoy).toBe(true);
  expect(resultado.tieneHeaderLunesSoloHoy).toBe(resultado.diaHoy === 0);
});

test("el filtro manual de dias prevalece sobre el automatico", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Config.Dias_Visibles = [0, 1, 2, 3, 4, 5, 6];
    Config.Ocultar_Dias_Automatico = "Ambos";
    Cambiar_Semana_Actual(new Date());
    Render_Calendario();

    const Automatico = {
      dias: Obtener_Dias_Visibles_Efectivos(),
      diaHoy: Obtener_Dia_Hoy_Index()
    };

    Fijar_Dias_Visibles_Manual([0, 1]);
    const Manual = {
      dias: Obtener_Dias_Visibles_Efectivos(),
      tieneLunes: Boolean(
        document.querySelector('.Dia_Header[data-dia="0"]')
      ),
      tieneMartes: Boolean(
        document.querySelector('.Dia_Header[data-dia="1"]')
      ),
      tieneHoy: Boolean(
        document.querySelector(
          `.Dia_Header[data-dia="${Obtener_Dia_Hoy_Index()}"]`
        )
      )
    };

    return { automatico: Automatico, manual: Manual };
  });

  expect(resultado.automatico.dias).toEqual([
    resultado.automatico.diaHoy
  ]);
  expect(resultado.manual.dias).toEqual([0, 1]);
  expect(resultado.manual.tieneLunes).toBe(true);
  expect(resultado.manual.tieneMartes).toBe(true);
  expect(resultado.manual.tieneHoy).toBe(
    [0, 1].includes(resultado.automatico.diaHoy)
  );
});

test("el encabezado permite limpiar un dia con confirmacion", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const Fecha = await page.evaluate(() =>
    document.querySelector('.Dia_Header[data-dia="0"]')?.dataset.fecha ||
    Clave_Semana_Actual()
  );

  await page.evaluate((Fecha_Dia) => {
    const Objetivo = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre: "Limpiar prueba",
        Emoji: "🧪",
        Color: "#1f6b4f",
        Es_Bolsa: false
      },
      Clave_Semana_Actual()
    );
    Eventos.push({
      Id: "Evento_Test_Dia",
      Objetivo_Id: Objetivo.Id,
      Fecha: Fecha_Dia,
      Inicio: 9,
      Duracion: 1,
      Hecho: false,
      Color: Objetivo.Color
    });
    const Clave = Crear_Slot_Muerto(
      Fecha_Dia,
      10,
      "Sueno"
    );
    Guardar_Nombre_Slot_Muerto(
      Clave,
      "Dormir",
      true,
      false
    );
    Planes_Slot[Clave] = {
      Items: [{ Id: "Plan_Test", Texto: "Apagar todo" }]
    };
    Render_Calendario();
    Render_Emojis();
  }, Fecha);

  await page.click(`.Dia_Header[data-fecha="${Fecha}"]`);
  await expect(
    page.locator("#Dia_Accion_Menu")
  ).not.toHaveClass(/Activo/);

  await page.click(`.Dia_Header[data-fecha="${Fecha}"]`, {
    button: "right"
  });

  await expect(
    page.locator("#Dia_Accion_Menu")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator('#Dia_Accion_Menu [data-accion="limpiar-dia"]')
  ).toHaveText("Limpiar día");

  await page.click(
    '#Dia_Accion_Menu [data-accion="limpiar-dia"]'
  );

  await expect(
    page.locator("#Dialogo_Overlay")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator("#Dialogo_Mensaje")
  ).toContainText("Limpiar este día completo");

  await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

  await expect(
    page.locator("#Dialogo_Overlay")
  ).not.toHaveClass(/Activo/);

  const Estado = await page.evaluate((Fecha_Dia) => ({
    Eventos_Dia: Eventos.filter(
      (Ev) => Ev.Fecha === Fecha_Dia
    ).length,
    Slots_Dia: Slots_Muertos.filter((Clave) =>
      Clave.startsWith(`${Fecha_Dia}|`)
    ).length,
    Nombres_Dia: Object.keys(Slots_Muertos_Nombres).filter(
      (Clave) => Clave.startsWith(`${Fecha_Dia}|`)
    ).length,
    Planes_Dia: Object.keys(Planes_Slot).filter((Clave) =>
      Clave.startsWith(`${Fecha_Dia}|`)
    ).length
  }), Fecha);

  expect(Estado.Eventos_Dia).toBe(0);
  expect(Estado.Slots_Dia).toBe(0);
  expect(Estado.Nombres_Dia).toBe(0);
  expect(Estado.Planes_Dia).toBe(0);
});
