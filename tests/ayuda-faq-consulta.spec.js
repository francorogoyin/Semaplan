const { test, expect } = require("@playwright/test");

async function preparar(page, estado) {
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
  await page.addInitScript((estadoInicial) => {
    window.__Invocaciones_Edge = [];
    window.supabase = {
      createClient() {
        return {
          auth: {
            async getSession() {
              return {
                data: {
                  session: {
                    access_token: "token-demo"
                  }
                }
              };
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
          },
          functions: {
            async invoke(nombre, opciones) {
              window.__Invocaciones_Edge.push({
                nombre,
                opciones
              });
              return {
                data: { Ok: true, Id: "mail_1" },
                error: null
              };
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
      JSON.stringify(estadoInicial)
    );
  }, estado);
  await page.goto("/index.html");
  await page.waitForFunction(() =>
    typeof window.Inicializar === "function"
  );
}

function estadoBase() {
  return {
    Tareas: [],
    Eventos: [],
    Metas: [],
    Slots_Muertos: [],
    Plantillas_Subtareas: [],
    Planes_Slot: {},
    Categorias: [],
    Etiquetas: [],
    Baul_Tareas: [],
    Baul_Grupos_Colapsados: {},
    Archiveros: [],
    Notas_Archivero: [],
    Patrones: [],
    Contador_Eventos: 1,
    Tarea_Seleccionada_Id: null,
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
  };
}

test("ayuda traduce título, abre faq separado y envía consulta real",
async ({ page }) => {
  await preparar(page, estadoBase());

  const resultado = await page.evaluate(async () => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Usuario_Actual = {
      id: "usr",
      email: "tester@example.com"
    };
    let Dialogos = [];
    const Dialogo_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (texto) => {
      Dialogos.push(texto);
      return true;
    };
    Abrir_Ayuda();
    const Es = {
      titulo: document.querySelector(
        "#Ayuda_Overlay .Patron_Modal_Titulo"
      )?.textContent?.trim() || "",
      faq: document.getElementById("Ayuda_Faq_Btn")
        ?.textContent?.trim() || "",
      resumen: document.querySelector(
        "#Ayuda_Overlay .Ayuda_Faq_Nota"
      )?.textContent?.trim() || ""
    };
    document.getElementById("Ayuda_Faq_Btn").click();
    const Faq_Activa = document.getElementById(
      "Ayuda_Faq_Overlay"
    )?.classList.contains("Activo");
    const Preguntas = Array.from(
      document.querySelectorAll(
        "#Ayuda_Faq_Lista_Modal strong"
      )
    ).map((el) => el.textContent?.trim() || "");
    document.getElementById("Ayuda_Consulta_Btn").click();
    document.getElementById("Ayuda_Consulta_Asunto").value =
      "Consulta";
    document.getElementById("Ayuda_Consulta_Mensaje").value =
      "Necesito ayuda.";
    await Enviar_Ayuda_Consulta();
    Cambiar_Idioma("en");
    const En = document.querySelector(
      "#Ayuda_Overlay .Patron_Modal_Titulo"
    )?.textContent?.trim() || "";
    Cambiar_Idioma("pt");
    const Pt = document.querySelector(
      "#Ayuda_Overlay .Patron_Modal_Titulo"
    )?.textContent?.trim() || "";
    const Invocacion =
      window.__Invocaciones_Edge[0] || null;
    Mostrar_Dialogo = Dialogo_Original;
    return {
      Es,
      En,
      Pt,
      Faq_Activa,
      Preguntas,
      Invocacion,
      Dialogos
    };
  });

  expect(resultado.Es.titulo).toBe("Ayuda");
  expect(resultado.Es.faq).toBe("Abrir FAQ");
  expect(resultado.Es.resumen.length).toBeGreaterThan(20);
  expect(resultado.Faq_Activa).toBe(true);
  expect(resultado.Preguntas.length).toBeGreaterThan(5);
  expect(resultado.Preguntas).toContain(
    "¿Cómo recupero una semana si toqué algo por error?"
  );
  expect(resultado.En).toBe("Help");
  expect(resultado.Pt).toBe("Ajuda");
  expect(resultado.Invocacion.nombre).toBe(
    "enviar-ayuda-consulta"
  );
  expect(resultado.Invocacion.opciones.body.Asunto).toBe(
    "Consulta"
  );
  expect(resultado.Invocacion.opciones.body.Mensaje).toBe(
    "Necesito ayuda."
  );
  expect(resultado.Dialogos).toContain(
    "Consulta enviada. Te vamos a responder por mail."
  );
});

test("modal de consulta usa campos redondeados y mensaje ancho",
async ({ page }) => {
  await preparar(page, estadoBase());

  const estilos = await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
    Usuario_Actual = {
      id: "usr",
      email: "tester@example.com"
    };
    Abrir_Ayuda();
    Abrir_Ayuda_Consulta();
    const Panel = document.querySelector(".Ayuda_Consulta_Panel");
    const Asunto = document.getElementById("Ayuda_Consulta_Asunto");
    const Mensaje = document.getElementById(
      "Ayuda_Consulta_Mensaje"
    );
    const Estilo_Asunto = getComputedStyle(Asunto);
    const Estilo_Mensaje = getComputedStyle(Mensaje);
    return {
      Radio_Asunto: Estilo_Asunto.borderRadius,
      Radio_Mensaje: Estilo_Mensaje.borderRadius,
      Ancho_Panel: Math.round(
        Panel.getBoundingClientRect().width
      ),
      Ancho_Mensaje: Math.round(
        Mensaje.getBoundingClientRect().width
      )
    };
  });

  expect(estilos.Radio_Asunto).toBe("10px");
  expect(estilos.Radio_Mensaje).toBe("10px");
  expect(estilos.Ancho_Mensaje).toBeGreaterThan(
    estilos.Ancho_Panel - 70
  );
});
