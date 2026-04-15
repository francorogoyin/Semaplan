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
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
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
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Render_Baul();
  });
}

test("hereda color por categoria y permite override por nota", async ({
  page
}) => {
  await preparar(page, {
    Objetivos: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subobjetivos: [],
    Planes_Slot: {},
    Categorias: [
      {
        Id: "cat1",
        Emoji: "💼",
        Nombre: "Trabajo",
        Color_Baul: "#c1d7ae",
        Metadatos: []
      },
      {
        Id: "cat2",
        Emoji: "🏠",
        Nombre: "Casa",
        Color_Baul: "#a6c8e5",
        Metadatos: []
      }
    ],
    Etiquetas: [],
    Baul_Objetivos: [
      {
        Id: "b1",
        Nombre: "Sin override",
        Emoji: "📄",
        Categoria_Id: "cat1",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1
      },
      {
        Id: "b2",
        Nombre: "Con override",
        Emoji: "📌",
        Categoria_Id: "cat1",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Color_Baul: "#f2a4a0",
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 2
      }
    ],
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
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true
    },
    Tipos_Slot: [],
    Tipos_Slot_Inicializados: false,
    Slots_Muertos_Tipos: {},
    Slots_Muertos_Nombres: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  });

  await page.waitForSelector('[data-baul-id="b1"]');

  const colores = await page.evaluate(() => {
    const T1 = document.querySelector('[data-baul-id="b1"]');
    const T2 = document.querySelector('[data-baul-id="b2"]');
    return {
      herencia: T1.style.getPropertyValue("--Baul-Color-Base"),
      override: T2.style.getPropertyValue("--Baul-Color-Base")
    };
  });

  expect(colores.herencia).toBe("#c1d7ae");
  expect(colores.override).toBe("#f2a4a0");

  await page.evaluate(() => {
    Abrir_Nueva_Objetivo_Baul();
  });
  await page.fill("#Baul_Nombre_Input", "Nueva con color");
  await page.selectOption("#Baul_Categoria_Input", "cat2");
  await expect(page.locator("#Baul_Color_Input"))
    .toHaveValue("#a6c8e5");
  const nueva = await page.evaluate(() => {
    const Input = document.getElementById("Baul_Color_Input");
    Input.value = "#112233";
    Input.dispatchEvent(new Event("input", { bubbles: true }));
    const Ultima = Obtener_Datos_Form_Baul();
    return {
      color: Ultima?.Color_Baul || "",
      categoria: Ultima?.Categoria_Id || ""
    };
  });

  expect(nueva.categoria).toBe("cat2");
  expect(nueva.color).toBe("#112233");
});
