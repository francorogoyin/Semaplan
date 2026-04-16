const { test, expect } = require("@playwright/test");

test("renderiza turnstile si la api llega tarde", async ({
  page
}) => {
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
