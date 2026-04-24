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
  });

  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof Normalizar_Habito === "function" &&
    typeof Habito_Coincide_Con_Slot === "function"
  );
}

test("evalua rangos horarios de habitos que cruzan medianoche", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Nombre: "Nocturno",
      Activo: true,
      Programacion: {
        Tipo: "Franjas",
        Desde: 22,
        Hasta: 2
      },
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Cantidad: 1
      }
    });

    return {
      a23: Habito_Coincide_Con_Slot(Habito, "2026-04-13", 23),
      a01: Habito_Coincide_Con_Slot(Habito, "2026-04-14", 1),
      a12: Habito_Coincide_Con_Slot(Habito, "2026-04-13", 12),
      texto23:
        Habito_Coincide_Con_Slot(Habito, "2026-04-13", "23:00"),
      texto01:
        Habito_Coincide_Con_Slot(Habito, "2026-04-14", "01:00")
    };
  });

  expect(resultado).toEqual({
    a23: true,
    a01: true,
    a12: false,
    texto23: true,
    texto01: true
  });
});

test("normaliza regla Entre sin maximo menor que minimo", async ({
  page
}) => {
  await Preparar(page);

  const meta = await page.evaluate(() => {
    return Normalizar_Habito({
      Nombre: "Rango invalido",
      Meta: {
        Modo: "Cantidad",
        Regla: "Entre",
        Cantidad: 10,
        Cantidad_Maxima: 5,
        Unidad: "u"
      }
    }).Meta;
  });

  expect(meta.Cantidad).toBe(10);
  expect(meta.Cantidad_Maxima).toBe(10);
});
