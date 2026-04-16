const { test, expect } = require("@playwright/test");

async function Preparar_Login(page) {
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
    window.alert = () => {};
  });

  await page.goto("/index.html");
}

test("renderiza turnstile si la api llega tarde", async ({
  page
}) => {
  await Preparar_Login(page);
  await expect(page.locator("#Auth_Overlay"))
    .toHaveClass(/Activo/);
  await expect(
    page.locator("#Auth_Turnstile .Turnstile_Test_Render")
  ).toHaveCount(0);

  await page.evaluate(() => {
    window.__Turnstile_Renders = 0;
    window.__Turnstile_Language = "";
    window.turnstile = {
      render(Cont, Opciones) {
        window.__Turnstile_Renders += 1;
        window.__Turnstile_Language =
          Opciones?.language || "";
        const Render = document.createElement("div");
        Render.className = "Turnstile_Test_Render";
        Render.textContent = "ok";
        Cont.appendChild(Render);
        return 7;
      },
      remove() {},
      reset() {}
    };
  });

  await expect(
    page.locator("#Auth_Turnstile .Turnstile_Test_Render")
  ).toHaveText("ok");

  const Datos = await page.evaluate(() => ({
    renders: window.__Turnstile_Renders || 0,
    idioma: window.__Turnstile_Language || ""
  }));

  expect(Datos.renders).toBeGreaterThanOrEqual(1);
  expect(Datos.idioma).toBe("es");
});

test("usa el logo nuevo en login y recovery", async ({
  page
}) => {
  await Preparar_Login(page);

  const Logo_Login = page.locator(
    "#Auth_Panel_Login img.Auth_Logo"
  );
  await expect(Logo_Login).toBeVisible();
  await expect(Logo_Login)
    .toHaveAttribute(
      "src",
      "Aplicaciones/Desktop/Semaplan.png"
    );

  await page.evaluate(() => {
    document.getElementById("Auth_Panel_Login")
      .style.display = "none";
    document.getElementById("Auth_Recovery_Panel")
      .style.display = "";
  });

  const Logo_Recovery = page.locator(
    "#Auth_Recovery_Panel img.Auth_Logo"
  );
  await expect(Logo_Recovery).toBeVisible();
  await expect(Logo_Recovery)
    .toHaveAttribute(
      "src",
      "Aplicaciones/Desktop/Semaplan.png"
    );

  const Info = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll(".Auth_Logo")
    ).map((Logo) => ({
      tag: Logo.tagName,
      texto: Logo.textContent.trim(),
      ancho_css: window.getComputedStyle(Logo).width
    }));
  });

  expect(Info.every((Item) => Item.tag === "IMG")).toBeTruthy();
  expect(Info.every((Item) => Item.texto === "")).toBeTruthy();
  expect(
    Info.every((Item) => parseFloat(Item.ancho_css) >= 50)
  ).toBeTruthy();
});
