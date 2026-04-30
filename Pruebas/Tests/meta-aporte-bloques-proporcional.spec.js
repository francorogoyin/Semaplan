const { test, expect } = require("@playwright/test");

async function Preparar(page) {
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
    localStorage.removeItem("Semaplan_Estado_V2");
  });

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Abrir_Modal_Abordaje === "function" &&
    typeof Meta_Aporte_Preparar_Evento === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    Inicializar();
    Semana_Actual = Parsear_Fecha_ISO("2026-05-04");
    Objetivos = [
      {
        Id: "obj_meta",
        Familia_Id: "obj_meta",
        Nombre: "Lectura",
        Emoji: "\u{1F4D6}",
        Color: "#1f6b4f",
        Horas_Semanales: 4,
        Restante: 4,
        Semana_Base: "2026-05-04",
        Es_Bolsa: false,
        Meta_Vinculo_Tipo: "Subobjetivo",
        Meta_Vinculo_Id: "sub_paginas",
        Meta_Aporte_Semanal: 80,
        Meta_Aporte_Unidad: "paginas",
        Subobjetivos_Semanales: { "2026-05-04": [] },
        Subobjetivos_Contraidas_Semanales: {},
        Subobjetivos_Excluidos_Semanales: {}
      }
    ];
    Planes_Periodo = {
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
        obj_libro: {
          Id: "obj_libro",
          Periodo_Id: "anio_2026",
          Nombre: "Libro",
          Emoji: "\u{1F4DA}",
          Target_Total: 400,
          Unidad: "Personalizado",
          Unidad_Custom: "paginas",
          Estado: "Activo",
          Orden: 0
        }
      },
      Subobjetivos: {
        sub_paginas: {
          Id: "sub_paginas",
          Objetivo_Id: "obj_libro",
          Texto: "Capitulo",
          Emoji: "\u{1F4D6}",
          Target_Total: 400,
          Unidad: "Personalizado",
          Unidad_Custom: "paginas",
          Estado: "Activo",
          Orden: 0
        }
      },
      Avances: {},
      UI: {}
    };
    Eventos = [
      Meta_Aporte_Preparar_Evento({
        Id: "ev_quince",
        Objetivo_Id: "obj_meta",
        Fecha: "2026-05-05",
        Inicio: 9,
        Duracion: 0.25,
        Hecho: false,
        Anulada: false,
        Color: "#1f6b4f"
      }, Objetivos[0]),
      Meta_Aporte_Preparar_Evento({
        Id: "ev_hora",
        Objetivo_Id: "obj_meta",
        Fecha: "2026-05-05",
        Inicio: 10,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: "#1f6b4f"
      }, Objetivos[0])
    ];
    Meta_Aporte_Redistribuir_Objetivo(Objetivos[0]);
  });
}

test("el aporte de metas inicia desmarcado y proporcional al bloque",
async ({ page }) => {
  await Preparar(page);

  const inicial = await page.evaluate(() => ({
    quince: {
      cantidad: Eventos[0].Meta_Aporte_Cantidad,
      tildado: Eventos[0].Meta_Aporte_Tildado,
      planeado: Eventos[0].Meta_Aporte_Planeado
    },
    hora: {
      cantidad: Eventos[1].Meta_Aporte_Cantidad,
      tildado: Eventos[1].Meta_Aporte_Tildado,
      planeado: Eventos[1].Meta_Aporte_Planeado
    }
  }));

  expect(inicial).toEqual({
    quince: { cantidad: 5, tildado: false, planeado: false },
    hora: { cantidad: 20, tildado: false, planeado: false }
  });

  await page.evaluate(() => Abrir_Modal_Abordaje("ev_quince"));
  await expect(page.locator(".Aporte_Meta_Contador"))
    .toContainText("Aporte a la meta: 0 (5 sugeridos)");
  await expect(page.locator(".Aporte_Meta_General_Input"))
    .toHaveValue("0");
  await expect(page.locator(".Aporte_Meta_General_Input"))
    .toBeDisabled();
  await page.click("#Abordaje_Modal_Guardar_Btn");

  const sinActivar = await page.evaluate(() => {
    const Evento = Eventos.find((Item) => Item.Id === "ev_quince");
    return {
      cantidad: Evento.Meta_Aporte_Cantidad,
      asignado: Meta_Aporte_Asignado_Evento(Evento),
      tildado: Evento.Meta_Aporte_Tildado,
      planeado: Evento.Meta_Aporte_Planeado,
      avances: Object.keys(Asegurar_Modelo_Planes().Avances).length
    };
  });

  expect(sinActivar).toEqual({
    cantidad: 5,
    asignado: 0,
    tildado: false,
    planeado: false,
    avances: 0
  });

  await page.evaluate(() => Abrir_Modal_Abordaje("ev_quince"));
  await page.locator(
    ".Aporte_Meta_General .Aporte_Meta_Destino_Check"
  ).check();
  await expect(page.locator(".Aporte_Meta_General_Input"))
    .toBeEnabled();
  await page.fill(".Aporte_Meta_General_Input", "5");
  await expect(page.locator(".Aporte_Meta_Contador"))
    .toContainText("Aporte a la meta: 5 (5 sugeridos)");
  await page.evaluate(() => {
    Mostrar_Dialogo = async () => true;
  });
  await page.click("#Abordaje_Modal_Guardar_Btn");

  const activado = await page.evaluate(() => {
    const Evento = Eventos.find((Item) => Item.Id === "ev_quince");
    return {
      cantidad: Evento.Meta_Aporte_Cantidad,
      tildado: Evento.Meta_Aporte_Tildado,
      planeado: Evento.Meta_Aporte_Planeado,
      manual: Evento.Meta_Aporte_Manual
    };
  });

  expect(activado).toEqual({
    cantidad: 5,
    tildado: true,
    planeado: true,
    manual: true
  });
});
