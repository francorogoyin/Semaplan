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
    localStorage.setItem("Semaplan_Idioma", "es");
    localStorage.removeItem("Semaplan_Estado_V2");
  });

  await page.goto("/login.html");
  await page.waitForFunction(() =>
    typeof Inicializar === "function" &&
    typeof Abrir_Decoteca === "function" &&
    typeof Render_Decoteca === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    document.getElementById("App_Loader")?.classList.add("Oculto");
    Inicializar();
    Config.Plan_Actual = "Upgrade";
    Config.Menu_Estilo = "Iconos";
    Config.Menu_Botones_Visibles.Decoteca_Boton = true;
    Aplicar_Estilo_Menu();
  });
}

test("decoteca abre tecas con tarjetas verticales y detalle propio", async ({
  page
}) => {
  await Preparar(page);

  await page.locator("#Decoteca_Boton").click();
  await expect(page.locator("#Decoteca_Overlay"))
    .toHaveClass(/Activo/);

  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Biblioteca");
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Musicoteca");
  await expect(page.locator("#Decoteca_Tecas"))
    .toContainText("Videoteca");

  const proporcion = await page.evaluate(() => {
    const Card = document.querySelector(
      ".Decoteca_Card_Caratula"
    );
    const Rect = Card?.getBoundingClientRect();
    if (!Rect) return null;
    return Rect.height / Rect.width;
  });
  expect(proporcion).not.toBeNull();
  expect(proporcion).toBeGreaterThan(1.35);

  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Los detectives salvajes");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Partes");

  await page.locator('[data-decoteca-teca="Videoteca"]').click();
  await expect(page.locator("#Decoteca_Libreria_Titulo"))
    .toHaveText("Videoteca");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Director");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Plataforma");

  await page.locator("#Decoteca_Filtro_Estado")
    .selectOption("Terminada");
  await expect(page.locator("#Decoteca_Grilla"))
    .toContainText("La ciénaga");
  await expect(page.locator("#Decoteca_Grilla"))
    .not.toContainText("Stalker");

  await page.locator("#Decoteca_Nueva").click();
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Nueva obra");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Duración");
  await expect(page.locator("#Decoteca_Detalle"))
    .toContainText("Plataforma");

  await page.keyboard.press("Escape");
  await expect(page.locator("#Decoteca_Overlay"))
    .not.toHaveClass(/Activo/);
});
