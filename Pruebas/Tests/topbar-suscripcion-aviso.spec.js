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
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("muestra aviso trial arriba en rojo y alineado a derecha",
async ({ page }) => {
  await Preparar(page);

  const Resumen = await page.evaluate(() => {
    Suscripcion_Detalle_Remota = {
      estado: "trial",
      trial_hasta: "2026-04-20T00:00:00Z"
    };
    Actualizar_UI_Plan();
    const El = document.getElementById(
      "Plan_Top_Indicador"
    );
    const Top = document.querySelector(
      ".Calendario_Top"
    );
    const Estilo = window.getComputedStyle(El);
    const Rect_El = El.getBoundingClientRect();
    const Rect_Top = Top.getBoundingClientRect();
    return {
      texto: El.textContent.trim(),
      color: Estilo.color,
      fontSize: Estilo.fontSize,
      fontWeight: Estilo.fontWeight,
      justifyContent: Estilo.justifyContent,
      background: Estilo.backgroundColor,
      borderTopWidth: Estilo.borderTopWidth,
      arriba_de_barra: Rect_El.bottom <= Rect_Top.top
    };
  });

  expect(Resumen.texto).toContain(
    "período de prueba"
  );
  expect(Resumen.color).toBe("rgb(182, 69, 69)");
  expect(Resumen.fontSize).toBe("10px");
  expect(Number(Resumen.fontWeight)).toBeGreaterThanOrEqual(
    700
  );
  expect(Resumen.background).toBe("rgba(0, 0, 0, 0)");
  expect(Resumen.borderTopWidth).toBe("0px");
  expect(Resumen.arriba_de_barra).toBeTruthy();
});

test("muestra aviso cancelada con mismo estilo",
async ({ page }) => {
  await Preparar(page);

  const Resumen = await page.evaluate(() => {
    Suscripcion_Detalle_Remota = {
      estado: "cancelled",
      fecha_actualizacion: "2026-04-20T00:00:00Z"
    };
    Actualizar_UI_Plan();
    const El = document.getElementById(
      "Plan_Top_Indicador"
    );
    const Estilo = window.getComputedStyle(El);
    return {
      texto: El.textContent.trim(),
      color: Estilo.color
    };
  });

  expect(Resumen.texto).toContain(
    "suscripción"
  );
  expect(Resumen.color).toBe("rgb(182, 69, 69)");
});

test("muestra precio premium actualizado",
async ({ page }) => {
  await Preparar(page);

  const Precio = await page.evaluate(() => {
    Abrir_Suscripcion();
    const Card = document.getElementById(
      "Suscripcion_Card_Upgrade"
    );
    const Moneda = Card?.querySelector(
      ".Suscripcion_Precio_Moneda"
    );
    const Nota = Card?.querySelector(
      ".Suscripcion_Nota_Internacional"
    );
    const Rect_Precio = Card?.querySelector(
      ".Suscripcion_Precio_Num"
    )?.getBoundingClientRect();
    const Rect_Moneda = Moneda?.getBoundingClientRect();
    const Estilo_Moneda = Moneda
      ? window.getComputedStyle(Moneda)
      : null;
    const Estilo_Nota = Nota
      ? window.getComputedStyle(Nota)
      : null;
    return {
      precio: Card?.querySelector(
        ".Suscripcion_Precio_Num"
      )?.textContent?.trim(),
      moneda: Moneda?.textContent?.trim(),
      nota: Nota?.textContent?.trim(),
      monedaALaDerecha: Rect_Precio && Rect_Moneda
        ? Rect_Moneda.left > Rect_Precio.right
        : false,
      fontMoneda: Estilo_Moneda?.fontSize || "",
      fontNota: Estilo_Nota?.fontSize || ""
    };
  });

  expect(Precio.precio).toBe("$7.499");
  expect(Precio.moneda).toBe("ARS");
  expect(Precio.nota).toBe(
    "Para pagos internacionales se cobrará 5 USD"
  );
  expect(Precio.monedaALaDerecha).toBe(true);
  expect(Precio.fontMoneda).toBe("11px");
  expect(Precio.fontNota).toBe("11px");
});
