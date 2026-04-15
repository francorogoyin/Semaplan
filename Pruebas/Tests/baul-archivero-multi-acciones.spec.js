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
  await page.waitForFunction(
    () => typeof window.Inicializar === "function"
  );
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
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
    Categorias: [
      { Id: "cat1", Emoji: "💼", Nombre: "Trabajo", Metadatos: [] },
      { Id: "cat2", Emoji: "🏠", Nombre: "Casa", Metadatos: [] }
    ],
    Etiquetas: [
      { Id: "et1", Nombre: "Cliente" }
    ],
    Baul_Objetivos: [
      {
        Id: "b1",
        Nombre: "Preparar propuesta",
        Emoji: "📄",
        Es_Bolsa: false,
        Categoria_Id: "cat1",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 0,
        Color_Baul: null
      },
      {
        Id: "b2",
        Nombre: "Llamar proveedor",
        Emoji: "📞",
        Es_Bolsa: false,
        Categoria_Id: "cat1",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Activa",
        Archivada: false,
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 1,
        Color_Baul: null
      }
    ],
    Baul_Grupos_Colapsados: {},
    Archiveros: [
      { Id: "c1", Nombre: "Semaplan", Emoji: "🗃️" }
    ],
    Notas_Archivero: [
      {
        Id: "n1",
        Archivero_Id: "c1",
        Texto: "Uno",
        Origen: "",
        Etiquetas: [],
        Tipo: "Texto",
        Fecha_Creacion: 1
      },
      {
        Id: "n2",
        Archivero_Id: "c1",
        Texto: "Dos",
        Origen: "",
        Etiquetas: [],
        Tipo: "Texto",
        Fecha_Creacion: 2
      }
    ],
    Patrones: [],
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Archivero_Seleccion_Id: "c1",
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 0,
      Fin_Hora: 24,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0, 1, 2, 3, 4, 5, 6],
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
        Baul_Boton: true,
        Archivero_Boton: true
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

test("el baul deja la multiaccion abajo del panel", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Render_Baul();
    Render_Barra_Multi_Seleccion();
    const Barra = document.getElementById("Baul_Multi_Acciones");
    const Conteo = document.getElementById("Baul_Multi_Conteo");
    const Grupo = document.getElementById("Baul_Multi_Grupo_Acciones");
    const Global = document.getElementById("Multi_Sel_Barra");
    const Libreria = document.getElementById("Baul_Libreria");
    const Lista = document.getElementById("Baul_Lista");
    const Estilo = window.getComputedStyle(Barra);
    const Estilo_Libreria = window.getComputedStyle(
      Libreria
    );
    const Botones = Array.from(
      Grupo.querySelectorAll("button")
    ).map((Btn) => Btn.textContent.trim());
    const Rect_Lista = Lista.getBoundingClientRect();
    const Rect_Barra = Barra.getBoundingClientRect();
    return {
      display: Estilo.display,
      justifyContent: Estilo.justifyContent,
      flexDirectionLibreria:
        Estilo_Libreria.flexDirection,
      conteo: Conteo.textContent.trim(),
      botones: Botones,
      globalActiva: Global.classList.contains("Activa"),
      barraDebajo:
        Rect_Barra.top >= Rect_Lista.bottom - 1
    };
  });

  expect(resultado.display).toBe("flex");
  expect(resultado.justifyContent).toBe("center");
  expect(resultado.flexDirectionLibreria).toBe("column");
  expect(resultado.conteo).toContain("2");
  expect(resultado.botones).toContain("Cambiar color");
  expect(resultado.botones).toContain("Definir estado");
  expect(resultado.botones).toContain("Agregar etiquetas");
  expect(resultado.botones).toContain("Quitar etiquetas");
  expect(resultado.botones).toContain(
    "Establecer fecha límite"
  );
  expect(resultado.botones).toContain(
    "Borrar fecha límite"
  );
  expect(resultado.globalActiva).toBe(false);
  expect(resultado.barraDebajo).toBe(true);
});

test("el filtro abiertas muestra activas y postergadas", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Baul_Objetivos[1].Estado = "Postergada";
    Baul_Objetivos.push(
      {
        Id: "b3",
        Nombre: "Cerrar informe",
        Emoji: "📘",
        Es_Bolsa: false,
        Categoria_Id: "cat1",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Realizada",
        Archivada: false,
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 2,
        Color_Baul: null
      },
      {
        Id: "b4",
        Nombre: "Descartar idea",
        Emoji: "🗃️",
        Es_Bolsa: false,
        Categoria_Id: "cat2",
        Etiquetas_Ids: [],
        Metadatos: {},
        Estado: "Anulada",
        Archivada: false,
        Horas_Aprox: 0,
        Timeline: null,
        Orden_Personalizado: 3,
        Color_Baul: null
      }
    );
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    El_Baul_Filtro_Estado.value = "Abiertas";
    const Nombres = Obtener_Baul_Objetivos_Filtradas()
      .map((Objetivo) => Objetivo.Nombre);
    const Opciones = Array.from(
      El_Baul_Filtro_Estado.options
    ).map((Opt) => ({
      valor: Opt.value,
      texto: (Opt.textContent || "").trim()
    }));
    return { Nombres, Opciones };
  });

  expect(resultado.Opciones).toContainEqual({
    valor: "Abiertas",
    texto: "Abiertas"
  });
  expect(resultado.Nombres).toEqual([
    "Preparar propuesta",
    "Llamar proveedor"
  ]);
});

test("aplica color y etiquetas en multiaccion del baul", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Aplicar_Color_Baul_Multi("#112233");
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Aplicar_Estado_Baul_Multi("Postergada");
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Aplicar_Etiquetas_Baul_Multi(
      "Agregar",
      "Urgente, Cliente"
    );
    return {
      colores: Baul_Objetivos.map((Objetivo) => Objetivo.Color_Baul),
      estados: Baul_Objetivos.map((Objetivo) => Objetivo.Estado),
      etiquetas: Baul_Objetivos.map((Objetivo) =>
        Obtener_Nombres_Etiquetas(Objetivo.Etiquetas_Ids)
      ),
      catalogo: Etiquetas.map((Etiqueta) => Etiqueta.Nombre)
    };
  });

  expect(resultado.colores).toEqual(["#112233", "#112233"]);
  expect(resultado.estados).toEqual([
    "Postergada",
    "Postergada"
  ]);
  expect(resultado.etiquetas).toEqual([
    ["Urgente", "Cliente"],
    ["Urgente", "Cliente"]
  ]);
  expect(resultado.catalogo).toContain("Urgente");
});

test("baul define estado en multiaccion desde la UI", async ({
  page
}) => {
  await preparar(page, crearEstado());

  await page.evaluate(() => {
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    Dialogo_Abierto = false;
    Dialogo_Resolver_Fn = null;
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Render_Baul();
    Render_Barra_Multi_Seleccion();
  });

  await page.locator(
    "#Baul_Multi_Grupo_Acciones button"
  ).filter({
    hasText: "Definir estado"
  }).click();

  const Seleccion_Con_Dialogo = await page.evaluate(() => ({
    dialogoActivo: document
      .getElementById("Dialogo_Overlay")
      ?.classList.contains("Activo") || false,
    seleccion: Array.from(Baul_Multi_Seleccion)
  }));

  expect(Seleccion_Con_Dialogo.dialogoActivo).toBe(true);
  expect(Seleccion_Con_Dialogo.seleccion).toEqual([
    "b1",
    "b2"
  ]);

  await page.locator(".Dialogo_Boton").filter({
    hasText: "Postergada"
  }).click();

  const Resultado = await page.evaluate(() => ({
    estados: Baul_Objetivos.map(
      (Objetivo) => Objetivo.Estado
    ),
    iconos: Array.from(
      document.querySelectorAll(".Baul_Estado_Icono")
    ).map((Nodo) => Nodo.dataset.estado || ""),
    seleccion: Array.from(Baul_Multi_Seleccion)
  }));

  expect(Resultado.estados).toEqual([
    "Postergada",
    "Postergada"
  ]);
  expect(Resultado.iconos.every(
    (Estado) => Estado === "Postergada"
  )).toBe(true);
  expect(Resultado.seleccion).toEqual([]);
});

test("baul mantiene seleccion al cambiar color desde la UI", async ({
  page
}) => {
  await preparar(page, crearEstado());

  await page.evaluate(() => {
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    document.getElementById("Dialogo_Overlay")
      ?.classList.remove("Activo");
    Dialogo_Abierto = false;
    Dialogo_Resolver_Fn = null;
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Render_Baul();
    Render_Barra_Multi_Seleccion();
  });

  await page.locator(
    "#Baul_Multi_Grupo_Acciones button"
  ).filter({
    hasText: "Cambiar color"
  }).click();

  const Seleccion_Con_Dialogo = await page.evaluate(() => ({
    dialogoActivo: document
      .getElementById("Dialogo_Overlay")
      ?.classList.contains("Activo") || false,
    seleccion: Array.from(Baul_Multi_Seleccion)
  }));

  expect(Seleccion_Con_Dialogo.dialogoActivo).toBe(true);
  expect(Seleccion_Con_Dialogo.seleccion).toEqual([
    "b1",
    "b2"
  ]);

  await page.evaluate(() => {
    const Campo = document.getElementById(
      "Dialogo_Input_Campo"
    );
    Campo.value = "#112233";
    Campo.dispatchEvent(new Event("input", {
      bubbles: true
    }));
    Campo.dispatchEvent(new Event("change", {
      bubbles: true
    }));
  });

  await page.locator(".Dialogo_Boton_Primario").click();

  const Resultado = await page.evaluate(() => ({
    colores: Baul_Objetivos.map(
      (Objetivo) => Objetivo.Color_Baul
    ),
    seleccion: Array.from(Baul_Multi_Seleccion)
  }));

  expect(Resultado.colores).toEqual([
    "#112233",
    "#112233"
  ]);
  expect(Resultado.seleccion).toEqual([]);
});

test("aplica y borra fecha limite en multiaccion del baul", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Aplicar_Timeline_Baul_Multi("2026-04-30");
    const Con_Fecha = Baul_Objetivos.map((Objetivo) => Objetivo.Timeline);
    const Toast_Aplicar = document.querySelector(
      "#Undo_Contenedor .Undo_Toast_Texto"
    )?.textContent?.trim() || "";
    const Seleccion_Luego_De_Aplicar = Array.from(
      Baul_Multi_Seleccion
    );
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Borrar_Timeline_Baul_Multi();
    const Toast_Borrar = document.querySelector(
      "#Undo_Contenedor .Undo_Toast_Texto"
    )?.textContent?.trim() || "";
    return {
      conFecha: Con_Fecha,
      sinFecha: Baul_Objetivos.map((Objetivo) => Objetivo.Timeline),
      toastAplicar: Toast_Aplicar,
      toastBorrar: Toast_Borrar,
      multiTrasAplicar: Seleccion_Luego_De_Aplicar,
      multiTrasBorrar: Array.from(Baul_Multi_Seleccion)
    };
  });

  expect(resultado.conFecha).toEqual([
    "2026-04-30",
    "2026-04-30"
  ]);
  expect(resultado.sinFecha).toEqual([null, null]);
  expect(resultado.toastAplicar).toBe(
    "Objetivos actualizados"
  );
  expect(resultado.toastBorrar).toBe(
    "Objetivos actualizados"
  );
  expect(resultado.multiTrasAplicar).toEqual([]);
  expect(resultado.multiTrasBorrar).toEqual([]);
});

test("el move queda neutro y delete rojo en multiaccion del baul", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Abrir_Baul();
    document.getElementById("Baul_Overlay")
      ?.classList.add("Activo");
    Baul_Multi_Seleccion = new Set(["b1", "b2"]);
    Render_Baul();
    Render_Barra_Multi_Seleccion();
    const Botones = Array.from(
      document.querySelectorAll(
        "#Baul_Multi_Grupo_Acciones button"
      )
    );
    const Mover = Botones.find((Btn) =>
      (Btn.textContent || "").includes("Mover")
    );
    const Eliminar = Botones.find((Btn) =>
      (Btn.textContent || "").includes("Eliminar")
    );
    return {
      moverClases: Mover?.className || "",
      eliminarClases: Eliminar?.className || ""
    };
  });

  expect(resultado.moverClases).not.toContain("Primario");
  expect(resultado.moverClases).not.toContain("Peligro");
  expect(resultado.eliminarClases).toContain("Peligro");
});

test("archivero permite cambiar color en multiaccion", async ({
  page
}) => {
  await preparar(page, crearEstado());

  const resultado = await page.evaluate(() => {
    Abrir_Archivero();
    document.getElementById("Archivero_Overlay")
      ?.classList.add("Activo");
    Archivero_Notas_Seleccionadas = new Set(["n1", "n2"]);
    Render_Archivero();
    Aplicar_Color_A_Notas_Seleccionadas_Archivero("#334455");
    const Primer_Boton = document.querySelector(
      "#Archivero_Multi_Acciones .Archivero_Multi_Grupo button"
    );
    return {
      colores: Notas_Archivero.map(
        (Nota) => Nota.Color_Fondo
      ),
      primerBoton: Primer_Boton?.id || ""
    };
  });

  expect(resultado.colores).toEqual(["#334455", "#334455"]);
  expect(resultado.primerBoton).toBe("Archivero_Multi_Color_Btn");
});

test("baul y archivero comparten picker circular de color", async ({
  page
}) => {
  await preparar(page, crearEstado());

  await page.evaluate(() => {
    Baul_Multi_Seleccion = new Set(["b1"]);
    window.__Dialogo_Color = Pedir_Color_Baul_Multi();
  });

  const Dialogo_Baul = await page.evaluate(() => {
    const Cont = document.getElementById(
      "Dialogo_Input_Contenedor"
    );
    const Campo = document.getElementById(
      "Dialogo_Input_Campo"
    );
    const Estilo_Cont = window.getComputedStyle(Cont);
    const Estilo_Campo = window.getComputedStyle(Campo);
    return {
      modoColor: Cont.classList.contains("Modo_Color"),
      display: Estilo_Cont.display,
      justifyContent: Estilo_Cont.justifyContent,
      width: Estilo_Campo.width,
      height: Estilo_Campo.height,
      borderRadius: Estilo_Campo.borderRadius,
      valor: Campo.value
    };
  });

  expect(Dialogo_Baul.modoColor).toBe(true);
  expect(Dialogo_Baul.display).toBe("flex");
  expect(Dialogo_Baul.justifyContent).toBe("center");
  expect(Dialogo_Baul.width).toBe("76px");
  expect(Dialogo_Baul.height).toBe("76px");
  expect(Dialogo_Baul.borderRadius).toBe("999px");
  expect(Dialogo_Baul.valor).toBe("#f1b77e");

  await page.locator(".Dialogo_Boton_Cancelar").click();

  await page.evaluate(() => {
    Notas_Archivero[0].Color_Fondo = "#445566";
    Archivero_Notas_Seleccionadas = new Set(["n1"]);
    window.__Dialogo_Color = Pedir_Color_Multi_Archivero();
  });

  const Dialogo_Archivero = await page.evaluate(() => {
    const Cont = document.getElementById(
      "Dialogo_Input_Contenedor"
    );
    const Campo = document.getElementById(
      "Dialogo_Input_Campo"
    );
    return {
      modoColor: Cont.classList.contains("Modo_Color"),
      valor: Campo.value
    };
  });

  expect(Dialogo_Archivero.modoColor).toBe(true);
  expect(Dialogo_Archivero.valor).toBe("#445566");
});
