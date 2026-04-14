const { test, expect } = require("@playwright/test");

async function preparar(page, idioma) {
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
  await page.addInitScript((lang) => {
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
    localStorage.setItem("Semaplan_Idioma", lang);
    localStorage.removeItem("Semaplan_Estado_V2");
  }, idioma);
  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
}

test("usa defaults localizados al arrancar en ingles", async ({ page }) => {
  await preparar(page, "en");

  const resultado = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Inicializar_Archiveros_Default();
    return {
      tareas: Tareas.map((Tarea) => Tarea.Nombre),
      cajones: Archiveros.map((Cajon) => Cajon.Nombre),
      tipos: Obtener_Tipos_Slot().map((Tipo) => Tipo.Nombre)
    };
  });

  expect(resultado.tareas).toEqual([
    "Focus project",
    "Workout",
    "Calls"
  ]);
  expect(resultado.cajones).toEqual([
    "Mental notes",
    "Ideas",
    "Quotes",
    "Links",
    "Concepts"
  ]);
  expect(resultado.tipos).toEqual([
    "Sleep",
    "Rest"
  ]);
});

test("arranca con menú hamburguesa por default", async ({
  page
}) => {
  await preparar(page, "es");

  const resultado = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Aplicar_Estilo_Menu();
    const Estado = JSON.parse(
      localStorage.getItem("Semaplan_Estado_V2") || "{}"
    );
    return {
      menu:
        Estado.Config_Extra?.Menu_Estilo || null,
      boton_hamburguesa:
        window.getComputedStyle(
          document.getElementById(
            "Menu_Hamburguesa_Boton"
          )
        ).display,
      boton_plan:
        window.getComputedStyle(
          document.getElementById("Plan_Boton")
        ).display
    };
  });

  expect(resultado.menu).toBe("Hamburguesa");
  expect(resultado.boton_hamburguesa).not.toBe("none");
  expect(resultado.boton_plan).toBe("none");
});
