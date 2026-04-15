const { test, expect } = require("@playwright/test");

async function Preparar(page, Estado_Inicial) {
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
  await page.addInitScript((Estado) => {
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
    window.__ultimo_alert = "";
    window.alert = (Mensaje) => {
      window.__ultimo_alert = String(Mensaje || "");
    };
    localStorage.setItem(
      "Semaplan_Estado_V2",
      JSON.stringify(Estado)
    );
  }, Estado_Inicial);
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

function Crear_Estado_Base() {
  return {
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
    Contador_Eventos: 10,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
    Inicio_Semana: "2026-04-13",
    Duracion_Defecto: 1,
    Config_Extra: {
      Inicio_Hora: 8,
      Fin_Hora: 18,
      Scroll_Inicial: 8,
      Duracion_Default: 1,
      Dias_Visibles: [0],
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
        Plan_Boton: true
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
    Slots_Muertos_Titulos_Visibles: {},
    Slots_Muertos_Nombres_Auto: {},
    Abordajes_Migrados_V1: true,
    Semanas_Con_Defaults: [],
    Planes_Semana: {}
  };
}

async function Crear_Escenario(page, Con_Conflicto = false) {
  return page.evaluate(({ Con_Conflicto_Local }) => {
    const Semana = Clave_Semana_Actual();
    const Objetivo_A = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre: "Bloque A",
        Emoji: "A",
        Color: "#1f6b4f",
        Es_Bolsa: false
      },
      Semana
    );
    const Objetivo_B = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre: "Bloque B",
        Emoji: "B",
        Color: "#9b2040",
        Es_Bolsa: false
      },
      Semana
    );
    const Objetivo_C = Crear_Objetivo_Semanal_Con_Datos(
      {
        Nombre: "Bloque C",
        Emoji: "C",
        Color: "#0f5f5a",
        Es_Bolsa: false
      },
      Semana
    );

    Eventos = [
      {
        Id: "ev_a",
        Objetivo_Id: Objetivo_A.Id,
        Fecha: "2026-04-13",
        Inicio: 9,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: Objetivo_A.Color
      },
      {
        Id: "ev_b",
        Objetivo_Id: Objetivo_B.Id,
        Fecha: "2026-04-13",
        Inicio: 11,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: Objetivo_B.Color
      }
    ];

    if (Con_Conflicto_Local) {
      Eventos.push({
        Id: "ev_conf",
        Objetivo_Id: Objetivo_C.Id,
        Fecha: "2026-04-13",
        Inicio: 14,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: Objetivo_C.Color
      });
    }

    Contador_Eventos = 20;
    Render_Emojis();
    Render_Calendario();
    Guardar_Estado();

    return {
      Evento_A_Id: "ev_a",
      Evento_B_Id: "ev_b",
      Evento_Conflicto_Id: Con_Conflicto_Local
        ? "ev_conf"
        : "",
      Objetivo_A_Id: Objetivo_A.Id,
      Objetivo_B_Id: Objetivo_B.Id,
      Objetivo_C_Id: Objetivo_C.Id
    };
  }, {
    Con_Conflicto_Local: Con_Conflicto
  });
}

async function Mover_Seleccion_Multi_A(
  page,
  fecha,
  hora
) {
  await page.click(
    '#Calendario_Multi_Grupo_Acciones button:has-text("Mover a")'
  );
  await expect(
    page.locator("#Dialogo_Overlay")
  ).toHaveClass(/Activo/);
  await expect(
    page.locator("#Dialogo_Fecha_Campo")
  ).toHaveAttribute("type", "date");
  await expect(
    page.locator("#Dialogo_Hora_Campo")
  ).toHaveAttribute("type", "time");
  await page.fill("#Dialogo_Fecha_Campo", fecha);
  await page.fill("#Dialogo_Hora_Campo", hora);
  await page.click(
    "#Dialogo_Botones .Dialogo_Boton_Primario"
  );
}

async function Arrastrar_Evento_A_Slot(
  page,
  Evento_Id,
  Hora_Destino
) {
  await page.evaluate(({ Evento_Id_Local, Hora_Destino_Local }) => {
    const Origen = document.querySelector(
      `.Evento[data-id="${Evento_Id_Local}"]`
    );
    const Destino = document.querySelector(
      ".Slot[data-fecha=\"2026-04-13\"]" +
      `[data-hora="${Hora_Destino_Local}"]`
    );
    if (!Origen || !Destino) {
      throw new Error("No se encontro origen o destino");
    }
    const Data = new DataTransfer();
    const Rect = Destino.getBoundingClientRect();

    Origen.dispatchEvent(
      new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
        dataTransfer: Data
      })
    );
    Destino.dispatchEvent(
      new DragEvent("dragover", {
        bubbles: true,
        cancelable: true,
        dataTransfer: Data,
        clientY: Rect.top + Rect.height / 2
      })
    );
    Destino.dispatchEvent(
      new DragEvent("drop", {
        bubbles: true,
        cancelable: true,
        dataTransfer: Data,
        clientY: Rect.top + Rect.height / 2
      })
    );
    Origen.dispatchEvent(
      new DragEvent("dragend", {
        bubbles: true,
        cancelable: true,
        dataTransfer: Data
      })
    );
  }, {
    Evento_Id_Local: Evento_Id,
    Hora_Destino_Local: Hora_Destino
  });
}

test(
  "muestra acciones del calendario al seleccionar con ctrl",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );

    await expect(
      page.locator("#Calendario_Multi_Acciones")
    ).toHaveClass(/Activa/);
    await expect(
      page.locator("#Calendario_Multi_Conteo")
    ).toContainText("2");

    const Botones = await page.locator(
      "#Calendario_Multi_Grupo_Acciones button"
    ).allTextContents();
    expect(Botones).toEqual(
      expect.arrayContaining([
        "Borrar",
        "Mover a...",
        "Copiar",
        "Tildar",
        "Destildar"
      ])
    );

    const Seleccion = await page.evaluate(() =>
      Array.from(Eventos_Multi_Seleccion).sort()
    );
    expect(Seleccion).toEqual(
      [Ids.Evento_A_Id, Ids.Evento_B_Id].sort()
    );
  }
);

test(
  "permite combinar con slots vacios y mantiene mover y copiar",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]',
      { modifiers: ["Control"] }
    );

    await expect(
      page.locator("#Calendario_Multi_Acciones")
    ).toHaveClass(/Activa/);
    await expect(
      page.locator("#Calendario_Multi_Conteo")
    ).toContainText("2");

    const Botones = await page.locator(
      "#Calendario_Multi_Grupo_Acciones button"
    ).allTextContents();
    expect(Botones).toEqual([
      "Mover a...",
      "Copiar",
      "Limpiar"
    ]);

    const Seleccion = await page.evaluate(() => ({
      eventos: Array.from(Eventos_Multi_Seleccion).sort(),
      slots: Array.from(Slots_Multi_Seleccion).sort()
    }));
    expect(Seleccion.eventos).toEqual([Ids.Evento_A_Id]);
    expect(Seleccion.slots).toEqual(["2026-04-13|13"]);

    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Limpiar")'
    );
    await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

    const Resultado = await page.evaluate(() => ({
      eventos: Eventos.map((Evento) => Evento.Id).sort(),
      seleccion_eventos: Array.from(
        Eventos_Multi_Seleccion
      ).sort(),
      seleccion_slots: Array.from(
        Slots_Multi_Seleccion
      ).sort(),
      barra_activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa")
    }));

    expect(Resultado.eventos).toEqual([Ids.Evento_B_Id]);
    expect(Resultado.seleccion_eventos).toEqual([]);
    expect(Resultado.seleccion_slots).toEqual([]);
    expect(Resultado.barra_activa).toBeFalsy();
  }
);

test(
  "el click normal sobre otro elemento del calendario solo limpia la seleccion actual",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );

    let Resultado = await page.evaluate(() => ({
      eventos: Array.from(Eventos_Multi_Seleccion).sort(),
      slots: Array.from(Slots_Multi_Seleccion).sort(),
      slot_13: document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
      )?.classList.contains("Multi_Activa") || false
    }));

    expect(Resultado.eventos).toEqual([]);
    expect(Resultado.slots).toEqual([]);
    expect(Resultado.slot_13).toBeFalsy();

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );
    await page.waitForTimeout(420);
    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`
    );

    Resultado = await page.evaluate(() => ({
      eventos: Array.from(Eventos_Multi_Seleccion).sort(),
      slots: Array.from(Slots_Multi_Seleccion).sort(),
      evento_activo: document.querySelector(
        `.Evento[data-id="${"ev_a"}"]`
      )?.classList.contains("Multi_Activa") || false
    }));

    expect(Resultado.eventos).toEqual([]);
    expect(Resultado.slots).toEqual([]);
    expect(Resultado.evento_activo).toBeFalsy();
  }
);

test(
  "muestra mover y copiar al seleccionar varios slots muertos",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    await page.evaluate(() => {
      const Datos = {
        Tipo_Id: "Sueno",
        Nombre: "Dormir",
        Visible: true,
        Nombre_Auto: false,
        Plan_Items: [
          {
            Id: "plan_slot_1",
            Emoji: "ðŸŒ™",
            Texto: "Rutina",
            Estado: "Planeado"
          }
        ]
      };
      Aplicar_Datos_Slot_Muerto("2026-04-13", 9, Datos, true);
      Aplicar_Datos_Slot_Muerto("2026-04-13", 10, Datos, true);
      Render_Calendario();
      Guardar_Estado();
    });

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="9"]',
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { modifiers: ["Control"] }
    );

    const Botones = await page.locator(
      "#Calendario_Multi_Grupo_Acciones button"
    ).allTextContents();
    expect(Botones).toEqual([
      "Mover a...",
      "Copiar",
      "Limpiar"
    ]);

    await Mover_Seleccion_Multi_A(
      page,
      "2026-04-13",
      "10:00"
    );

    const Resultado = await page.evaluate(() => ({
      slots: [
        "2026-04-13|10",
        "2026-04-13|11"
      ].map((Clave) => ({
        Clave,
        Existe: Slots_Muertos.includes(Clave),
        Nombre: Slots_Muertos_Nombres[Clave] || "",
        Plan: (Planes_Slot[Clave]?.Items || []).length
      })),
      seleccion: Array.from(Slots_Multi_Seleccion).sort()
    }));

    expect(Resultado.slots).toEqual([
      {
        Clave: "2026-04-13|10",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      },
      {
        Clave: "2026-04-13|11",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      }
    ]);
    expect(Resultado.seleccion).toEqual([
      "2026-04-13|10",
      "2026-04-13|11"
    ]);
  }
);

test(
  "copia una seleccion mixta de bloque y slot muerto",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.evaluate(() => {
      const Datos = {
        Tipo_Id: "Sueno",
        Nombre: "Dormir",
        Visible: true,
        Nombre_Auto: false,
        Plan_Items: [
          {
            Id: "plan_slot_1",
            Emoji: "ðŸŒ™",
            Texto: "Rutina",
            Estado: "Planeado"
          }
        ]
      };
      Aplicar_Datos_Slot_Muerto("2026-04-13", 10, Datos, true);
      Render_Calendario();
      Guardar_Estado();
    });

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="12"]',
      { modifiers: ["Control"] }
    );

    const Botones = await page.locator(
      "#Calendario_Multi_Grupo_Acciones button"
    ).allTextContents();
    expect(Botones).toEqual([
      "Mover a...",
      "Copiar",
      "Limpiar"
    ]);

    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Copiar")'
    );

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );
    await page.waitForTimeout(420);
    await page.keyboard.press("Control+v");

    const Resultado = await page.evaluate(() => ({
      modo: Portapapeles_Calendario_Modo,
      evento_copiado: Eventos.some((Evento) =>
        Evento.Fecha === "2026-04-13" &&
        Evento.Inicio === 13
      ),
      slot_copiado: Slots_Muertos.includes("2026-04-13|14"),
      slot_vacio_ignorado:
        !Slots_Muertos.includes("2026-04-13|15"),
      seleccion_eventos: Array.from(
        Eventos_Multi_Seleccion
      ).sort(),
      seleccion_slots: Array.from(
        Slots_Multi_Seleccion
      ).sort()
    }));

    expect(Resultado.modo).toBe("Calendario_Mixto");
    expect(Resultado.evento_copiado).toBeTruthy();
    expect(Resultado.slot_copiado).toBeTruthy();
    expect(Resultado.slot_vacio_ignorado).toBeTruthy();
    expect(Resultado.seleccion_eventos).toEqual([]);
    expect(Resultado.seleccion_slots).toEqual([]);
  }
);

test(
  "permite seleccionar con rectangulo y mover bloques juntos",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    const Caja_A = await page.locator(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`
    ).boundingBox();
    const Caja_B = await page.locator(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`
    ).boundingBox();

    if (!Caja_A || !Caja_B) {
      throw new Error("No se encontraron los bloques");
    }

    await page.mouse.move(Caja_A.x + 10, Caja_A.y - 8);
    await page.mouse.down();
    await page.mouse.move(
      Caja_B.x + Caja_B.width - 10,
      Caja_B.y + Caja_B.height + 8,
      { steps: 12 }
    );
    await page.mouse.up();

    const Seleccion = await page.evaluate(() =>
      Array.from(Eventos_Multi_Seleccion).sort()
    );
    expect(Seleccion).toEqual(
      [Ids.Evento_A_Id, Ids.Evento_B_Id].sort()
    );

    await Arrastrar_Evento_A_Slot(page, Ids.Evento_A_Id, 13);

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos
        .filter((Evento) =>
          ["ev_a", "ev_b"].includes(Evento.Id)
        )
        .map((Evento) => ({
          Id: Evento.Id,
          Inicio: Evento.Inicio
        }))
        .sort((A, B) => A.Inicio - B.Inicio)
    }));

    expect(Resultado.Eventos).toEqual([
      { Id: "ev_a", Inicio: 13 },
      { Id: "ev_b", Inicio: 15 }
    ]);
  }
);

test(
  "mueve varios bloques a una hora exacta",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );

    await Mover_Seleccion_Multi_A(
      page,
      "2026-04-13",
      "10:00"
    );

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos
        .filter((Evento) =>
          ["ev_a", "ev_b"].includes(Evento.Id)
        )
        .map((Evento) => ({
          Id: Evento.Id,
          Fecha: Evento.Fecha,
          Inicio: Evento.Inicio
        }))
        .sort((A, B) => A.Inicio - B.Inicio),
      Seleccion: Array.from(Eventos_Multi_Seleccion).sort()
    }));

    expect(Resultado.Eventos).toEqual([
      {
        Id: "ev_a",
        Fecha: "2026-04-13",
        Inicio: 10
      },
      {
        Id: "ev_b",
        Fecha: "2026-04-13",
        Inicio: 12
      }
    ]);
    expect(Resultado.Seleccion).toEqual(
      [Ids.Evento_A_Id, Ids.Evento_B_Id].sort()
    );
  }
);

test(
  "mueve varios bloques a otra fecha exacta",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await page.evaluate(() => {
      Config.Dias_Visibles = [0, 1];
      const Semana = Clave_Semana_Actual();
      const Objetivo_A = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "Bloque A",
          Emoji: "A",
          Color: "#1f6b4f",
          Es_Bolsa: false
        },
        Semana
      );
      const Objetivo_B = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "Bloque B",
          Emoji: "B",
          Color: "#9b2040",
          Es_Bolsa: false
        },
        Semana
      );

      Eventos = [
        {
          Id: "ev_a",
          Objetivo_Id: Objetivo_A.Id,
          Fecha: "2026-04-13",
          Inicio: 9,
          Duracion: 1,
          Hecho: false,
          Anulada: false,
          Color: Objetivo_A.Color
        },
        {
          Id: "ev_b",
          Objetivo_Id: Objetivo_B.Id,
          Fecha: "2026-04-13",
          Inicio: 11,
          Duracion: 1,
          Hecho: false,
          Anulada: false,
          Color: Objetivo_B.Color
        }
      ];

      Render_Emojis();
      Render_Calendario();
      Guardar_Estado();
      return {
        Evento_A_Id: "ev_a",
        Evento_B_Id: "ev_b"
      };
    });

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );

    await Mover_Seleccion_Multi_A(
      page,
      "2026-04-14",
      "09:00"
    );

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos
        .filter((Evento) =>
          ["ev_a", "ev_b"].includes(Evento.Id)
        )
        .map((Evento) => ({
          Id: Evento.Id,
          Fecha: Evento.Fecha,
          Inicio: Evento.Inicio
        }))
        .sort((A, B) => A.Inicio - B.Inicio),
      Seleccion: Array.from(Eventos_Multi_Seleccion).sort()
    }));

    expect(Resultado.Eventos).toEqual([
      {
        Id: "ev_a",
        Fecha: "2026-04-14",
        Inicio: 9
      },
      {
        Id: "ev_b",
        Fecha: "2026-04-14",
        Inicio: 11
      }
    ]);
    expect(Resultado.Seleccion).toEqual(
      [Ids.Evento_A_Id, Ids.Evento_B_Id].sort()
    );
  }
);

test(
  "permite borrar muchos bloques con la tecla delete",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    const Ids = await page.evaluate(() => {
      const Semana = Clave_Semana_Actual();
      const Colores = [
        "#1f6b4f",
        "#9b2040",
        "#0f5f5a",
        "#8c6a46"
      ];
      const Objetivos_Creados = ["A", "B", "C", "D"]
        .map((Nombre, Indice) =>
          Crear_Objetivo_Semanal_Con_Datos(
            {
              Nombre: `Bloque ${Nombre}`,
              Emoji: Nombre,
              Color: Colores[Indice],
              Es_Bolsa: false
            },
            Semana
          )
        );

      Eventos = Objetivos_Creados.map((Objetivo, Indice) => ({
        Id: `ev_${Indice}`,
        Objetivo_Id: Objetivo.Id,
        Fecha: "2026-04-13",
        Inicio: 9 + Indice,
        Duracion: 1,
        Hecho: false,
        Anulada: false,
        Color: Objetivo.Color
      }));

      Contador_Eventos = 50;
      Render_Emojis();
      Render_Calendario();
      Guardar_Estado();
      return Eventos.map((Evento) => Evento.Id);
    });

    for (const Evento_Id of Ids) {
      await page.click(
        `.Evento[data-id="${Evento_Id}"]`,
        { modifiers: ["Control"] }
      );
    }

    await page.keyboard.press("Delete");

    await expect(
      page.locator("#Dialogo_Overlay")
    ).toHaveClass(/Activo/);
    await expect(
      page.locator("#Dialogo_Mensaje")
    ).toContainText("4");

    await page.click("#Dialogo_Botones .Dialogo_Boton_Peligro");

    const Resultado = await page.evaluate(() => ({
      Cantidad_Eventos: Eventos.length,
      Seleccion: Array.from(Eventos_Multi_Seleccion),
      Barra_Activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa")
    }));

    expect(Resultado.Cantidad_Eventos).toBe(0);
    expect(Resultado.Seleccion).toEqual([]);
    expect(Resultado.Barra_Activa).toBeFalsy();
  }
);

test(
  "copia bloques y pega en slot vacio con opcion de reemplazo",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page, true);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Copiar")'
    );

    await page.evaluate(() => {
      const Original = Mostrar_Dialogo;
      window.__dialogos_multi = [];
      Mostrar_Dialogo = async (Texto, Botones = []) => {
        window.__dialogos_multi.push({
          Texto,
          Valores: Botones.map((Boton) => Boton.Valor)
        });
        return "Reemplazar";
      };
      window.__restaurar_dialogo_multi = () => {
        Mostrar_Dialogo = Original;
      };
    });

    await page.evaluate(() => {
      const Slot = document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
      );
      if (!Slot) throw new Error("No se encontro el slot");
      const Rect = Slot.getBoundingClientRect();
      Mostrar_Menu_Slot(
        "2026-04-13",
        12,
        Rect.left + 8,
        Rect.top + 8
      );
    });

    await expect(
      page.locator(
        '#Dia_Accion_Menu [data-acc="pegar-bloques-slot"]'
      )
    ).toBeVisible();
    await page.click(
      '#Dia_Accion_Menu [data-acc="pegar-bloques-slot"]'
    );
    await page.evaluate(() => {
      window.__restaurar_dialogo_multi?.();
    });

    const Resultado = await page.evaluate(({ Objetivo_C_Id_Local }) => ({
      Dialogos: window.__dialogos_multi || [],
      Eventos: Eventos
        .filter((Evento) => Evento.Fecha === "2026-04-13")
        .map((Evento) => ({
          Id: Evento.Id,
          Inicio: Evento.Inicio,
          Objetivo_Id: Evento.Objetivo_Id
        }))
        .sort((A, B) => A.Inicio - B.Inicio),
      Seleccion: Array.from(Eventos_Multi_Seleccion).sort(),
      Sigue_Conflicto: Eventos.some(
        (Evento) => Evento.Objetivo_Id === Objetivo_C_Id_Local
      )
    }), {
      Objetivo_C_Id_Local: Ids.Objetivo_C_Id
    });

    expect(Resultado.Dialogos).toHaveLength(1);
    expect(Resultado.Dialogos[0].Texto).toContain(
      "Completar o reemplazar"
    );
    expect(Resultado.Dialogos[0].Valores).toEqual([
      "Completar",
      "Reemplazar",
      null
    ]);
    expect(Resultado.Sigue_Conflicto).toBeFalsy();
    expect(Resultado.Eventos.map((Evento) => Evento.Inicio)).toEqual([
      9,
      11,
      12,
      14
    ]);
    expect(Resultado.Seleccion).toHaveLength(0);
  }
);

test(
  "muestra toast de cinco segundos al copiar bloques",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Copiar")'
    );

    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast").first()
    ).toHaveClass(/Activo/);
    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast_Texto").first()
    ).toContainText("2 bloques");
    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast_Segundos").first()
    ).toHaveText("5");
  }
);

test(
  "avisa con toast si al pegar no quedan horas en la bolsa",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    const Ids = await page.evaluate(() => {
      const Semana = Clave_Semana_Actual();
      const Objetivo_Bolsa = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "Bolsa",
          Emoji: "B",
          Color: "#1f6b4f",
          Es_Bolsa: true,
          Horas_Semanales: 1
        },
        Semana
      );

      Eventos = [
        {
          Id: "ev_bolsa",
          Objetivo_Id: Objetivo_Bolsa.Id,
          Fecha: "2026-04-13",
          Inicio: 9,
          Duracion: 1,
          Hecho: false,
          Anulada: false,
          Color: Objetivo_Bolsa.Color
        }
      ];

      Contador_Eventos = 40;
      Render_Emojis();
      Render_Calendario();
      Guardar_Estado();

      return {
        Evento_Id: "ev_bolsa"
      };
    });

    await page.click(
      `.Evento[data-id="${Ids.Evento_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Copiar")'
    );

    await page.evaluate(() => {
      const Slot = document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
      );
      if (!Slot) throw new Error("No se encontro el slot");
      const Rect = Slot.getBoundingClientRect();
      Mostrar_Menu_Slot(
        "2026-04-13",
        12,
        Rect.left + 8,
        Rect.top + 8
      );
    });

    await expect(
      page.locator(
        '#Dia_Accion_Menu [data-acc="pegar-bloques-slot"]'
      )
    ).toBeVisible();
    await page.click(
      '#Dia_Accion_Menu [data-acc="pegar-bloques-slot"]'
    );

    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast").first()
    ).toHaveClass(/Activo/);
    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast_Texto").first()
    ).toContainText("No hay horas suficientes");
    await expect(
      page.locator("#Undo_Contenedor .Undo_Toast_Segundos").first()
    ).toHaveText("5");

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos.map((Evento) => ({
        Id: Evento.Id,
        Inicio: Evento.Inicio
      })),
      Seleccion: Array.from(Eventos_Multi_Seleccion)
    }));

    expect(Resultado.Eventos).toEqual([
      { Id: "ev_bolsa", Inicio: 9 }
    ]);
    expect(Resultado.Seleccion).toEqual([]);
  }
);

test(
  "usa Ctrl+C y Ctrl+V para bloques seleccionados",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+c");

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]',
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+v");

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos
        .filter((Evento) => Evento.Fecha === "2026-04-13")
        .map((Evento) => ({
          Inicio: Evento.Inicio,
          Duracion: Evento.Duracion
        }))
        .sort((A, B) => A.Inicio - B.Inicio),
      Seleccion_Eventos: Array.from(
        Eventos_Multi_Seleccion
      ).sort(),
      Seleccion_Slots: Array.from(
        Slots_Multi_Seleccion
      ).sort(),
      Barra_Activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa")
    }));

    expect(Resultado.Eventos).toEqual([
      { Inicio: 9, Duracion: 1 },
      { Inicio: 11, Duracion: 1 },
      { Inicio: 13, Duracion: 1 },
      { Inicio: 15, Duracion: 1 }
    ]);
    expect(Resultado.Seleccion_Eventos).toEqual([]);
    expect(Resultado.Seleccion_Slots).toEqual([]);
    expect(Resultado.Barra_Activa).toBeFalsy();
  }
);

test(
  "usa Ctrl+X y Ctrl+V para cortar y pegar bloques",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());
    const Ids = await Crear_Escenario(page);

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+x");

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]',
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+v");

    const Resultado = await page.evaluate(() => ({
      Eventos: Eventos
        .filter((Evento) => Evento.Fecha === "2026-04-13")
        .map((Evento) => ({
          Inicio: Evento.Inicio,
          Duracion: Evento.Duracion
        }))
        .sort((A, B) => A.Inicio - B.Inicio),
      Seleccion_Eventos: Array.from(
        Eventos_Multi_Seleccion
      ).sort(),
      Seleccion_Slots: Array.from(
        Slots_Multi_Seleccion
      ).sort()
    }));

    expect(Resultado.Eventos).toEqual([
      { Inicio: 13, Duracion: 1 },
      { Inicio: 15, Duracion: 1 }
    ]);
    expect(Resultado.Seleccion_Eventos).toEqual([]);
    expect(Resultado.Seleccion_Slots).toEqual([]);
  }
);

test(
  "usa Ctrl+C, Ctrl+X y Ctrl+V con slots muertos",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    await page.evaluate(() => {
      const Datos = {
        Tipo_Id: "Sueno",
        Nombre: "Dormir",
        Visible: true,
        Nombre_Auto: false,
        Plan_Items: [
          {
            Id: "plan_slot_1",
            Emoji: "🌙",
            Texto: "Rutina",
            Estado: "Planeado"
          }
        ]
      };
      Aplicar_Datos_Slot_Muerto("2026-04-13", 9, Datos, true);
      Aplicar_Datos_Slot_Muerto("2026-04-13", 10, Datos, true);
      Render_Calendario();
      Guardar_Estado();
    });

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="9"]',
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="10"]',
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+c");

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]'
    );
    await page.waitForTimeout(420);
    await page.keyboard.press("Control+v");

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]',
      { modifiers: ["Control"] }
    );
    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="14"]',
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+x");

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="15"]',
      { modifiers: ["Control"] }
    );
    await page.keyboard.press("Control+v");

    const Resultado = await page.evaluate(() => {
      const Claves = [
        "2026-04-13|9",
        "2026-04-13|10",
        "2026-04-13|15",
        "2026-04-13|16"
      ];
      return {
        Slots: Claves.map((Clave) => ({
          Clave,
          Existe: Slots_Muertos.includes(Clave),
          Nombre: Slots_Muertos_Nombres[Clave] || "",
          Plan: (Planes_Slot[Clave]?.Items || []).length
        })),
        Claves_Limpiadas: [
          Slots_Muertos.includes("2026-04-13|13"),
          Slots_Muertos.includes("2026-04-13|14")
        ],
        Seleccion_Slots: Array.from(
          Slots_Multi_Seleccion
        ).sort()
      };
    });

    expect(Resultado.Slots).toEqual([
      {
        Clave: "2026-04-13|9",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      },
      {
        Clave: "2026-04-13|10",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      },
      {
        Clave: "2026-04-13|15",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      },
      {
        Clave: "2026-04-13|16",
        Existe: true,
        Nombre: "Dormir",
        Plan: 1
      }
    ]);
    expect(Resultado.Claves_Limpiadas).toEqual([false, false]);
    expect(Resultado.Seleccion_Slots).toEqual([]);
  }
);

test(
  "permite seleccionar un slot muerto con click y pegarle plan",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    await page.evaluate(() => {
      Aplicar_Datos_Slot_Muerto(
        "2026-04-13",
        9,
        {
          Tipo_Id: "Sueno",
          Nombre: "Dormir",
          Visible: true,
          Nombre_Auto: false,
          Plan_Items: [
            {
              Id: "plan_origen",
              Emoji: "🌙",
              Texto: "Rutina",
              Estado: "Planeado"
            }
          ]
        },
        true
      );
      Aplicar_Datos_Slot_Muerto(
        "2026-04-13",
        11,
        {
          Tipo_Id: "Sueno",
          Nombre: "Dormir",
          Visible: true,
          Nombre_Auto: false,
          Plan_Items: []
        },
        true
      );
      Copiar_Plan_Slot("2026-04-13", 9);
      Render_Calendario();
      Guardar_Estado();
    });

    await page.click(
      '.Slot[data-fecha="2026-04-13"][data-hora="11"]'
    );
    await page.waitForTimeout(420);

    const Seleccion_Antes = await page.evaluate(() =>
      Array.from(Slots_Multi_Seleccion).sort()
    );
    await page.keyboard.press("Control+v");

    const Resultado = await page.evaluate(() => ({
      Plan_Destino: (
        Planes_Slot["2026-04-13|11"]?.Items || []
      ).map((Item) => Item.Texto),
      Alerta: window.__ultimo_alert || ""
    }));

    expect(Seleccion_Antes).toEqual([
      "2026-04-13|11"
    ]);
    expect(Resultado.Plan_Destino).toEqual(["Rutina"]);
    expect(Resultado.Alerta).toBe("");
  }
);

test(
  "permite volver a seleccionar slots vacios tras limpiar la seleccion",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    const Slot_13 =
      '.Slot[data-fecha="2026-04-13"][data-hora="13"]';
    const Slot_14 =
      '.Slot[data-fecha="2026-04-13"][data-hora="14"]';
    const Slot_15 =
      '.Slot[data-fecha="2026-04-13"][data-hora="15"]';

    await page.click(Slot_13);
    await page.waitForTimeout(420);

    let Resultado = await page.evaluate(() => ({
      slots: Array.from(Slots_Multi_Seleccion).sort(),
      barra_activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa") || false
    }));

    expect(Resultado.slots).toEqual(["2026-04-13|13"]);
    expect(Resultado.barra_activa).toBeTruthy();

    await page.click(Slot_13);
    Resultado = await page.evaluate(() => ({
      slots: Array.from(Slots_Multi_Seleccion).sort(),
      barra_activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa") || false
    }));

    expect(Resultado.slots).toEqual([]);
    expect(Resultado.barra_activa).toBeFalsy();

    await page.click(Slot_14);
    await page.waitForTimeout(420);
    Resultado = await page.evaluate(() => ({
      slots: Array.from(Slots_Multi_Seleccion).sort()
    }));
    expect(Resultado.slots).toEqual(["2026-04-13|14"]);

    await page.keyboard.press("Escape");
    Resultado = await page.evaluate(() => ({
      slots: Array.from(Slots_Multi_Seleccion).sort(),
      barra_activa: document.getElementById(
        "Calendario_Multi_Acciones"
      )?.classList.contains("Activa") || false
    }));
    expect(Resultado.slots).toEqual([]);
    expect(Resultado.barra_activa).toBeFalsy();

    await page.click(Slot_15);
    await page.waitForTimeout(420);
    Resultado = await page.evaluate(() => ({
      slots: Array.from(Slots_Multi_Seleccion).sort()
    }));
    expect(Resultado.slots).toEqual(["2026-04-13|15"]);
  }
);

test(
  "ofrece pegar en columna cuando la copia mezcla dias",
  async ({ page }) => {
    await Preparar(page, Crear_Estado_Base());

    const Ids = await page.evaluate(() => {
      Config.Dias_Visibles = [0, 1];
      const Semana = Clave_Semana_Actual();
      const Objetivo_A = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "Bloque A",
          Emoji: "A",
          Color: "#1f6b4f",
          Es_Bolsa: false
        },
        Semana
      );
      const Objetivo_B = Crear_Objetivo_Semanal_Con_Datos(
        {
          Nombre: "Bloque B",
          Emoji: "B",
          Color: "#9b2040",
          Es_Bolsa: false
        },
        Semana
      );

      Eventos = [
        {
          Id: "ev_dia_a",
          Objetivo_Id: Objetivo_A.Id,
          Fecha: "2026-04-13",
          Inicio: 9,
          Duracion: 1,
          Hecho: false,
          Anulada: false,
          Color: Objetivo_A.Color
        },
        {
          Id: "ev_dia_b",
          Objetivo_Id: Objetivo_B.Id,
          Fecha: "2026-04-14",
          Inicio: 10,
          Duracion: 1,
          Hecho: false,
          Anulada: false,
          Color: Objetivo_B.Color
        }
      ];

      Contador_Eventos = 80;
      Render_Emojis();
      Render_Calendario();
      Guardar_Estado();

      return {
        Evento_A_Id: "ev_dia_a",
        Evento_B_Id: "ev_dia_b"
      };
    });

    await page.click(
      `.Evento[data-id="${Ids.Evento_A_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      `.Evento[data-id="${Ids.Evento_B_Id}"]`,
      { modifiers: ["Control"] }
    );
    await page.click(
      '#Calendario_Multi_Grupo_Acciones button:has-text("Copiar")'
    );

    await page.evaluate(() => {
      const Original = Mostrar_Dialogo;
      window.__dialogos_multi = [];
      Mostrar_Dialogo = async (Texto, Botones = []) => {
        window.__dialogos_multi.push({
          Texto,
          Valores: Botones.map((Boton) => Boton.Valor)
        });
        return "Columna";
      };
      window.__restaurar_dialogo_multi = () => {
        Mostrar_Dialogo = Original;
      };
    });

    await page.evaluate(() => {
      const Slot = document.querySelector(
        '.Slot[data-fecha="2026-04-13"][data-hora="12"]'
      );
      if (!Slot) throw new Error("No se encontro el slot");
      const Rect = Slot.getBoundingClientRect();
      Mostrar_Menu_Slot(
        "2026-04-13",
        12,
        Rect.left + 8,
        Rect.top + 8
      );
    });

    await page.click(
      '#Dia_Accion_Menu [data-acc="pegar-bloques-slot"]'
    );
    await page.evaluate(() => {
      window.__restaurar_dialogo_multi?.();
    });

    const Resultado = await page.evaluate(() => ({
      Dialogos: window.__dialogos_multi || [],
      Eventos: Eventos
        .map((Evento) => ({
          Id: Evento.Id,
          Fecha: Evento.Fecha,
          Inicio: Evento.Inicio
        }))
        .sort((A, B) => {
          if (A.Fecha !== B.Fecha) {
            return A.Fecha.localeCompare(B.Fecha);
          }
          return A.Inicio - B.Inicio;
        }),
      Seleccion: Array.from(Eventos_Multi_Seleccion)
    }));

    expect(Resultado.Dialogos).toHaveLength(1);
    expect(Resultado.Dialogos[0].Texto).toContain(
      "varios"
    );
    expect(Resultado.Dialogos[0].Valores).toEqual([
      "Forma",
      "Columna",
      null
    ]);
    expect(Resultado.Eventos).toEqual([
      { Id: "ev_dia_a", Fecha: "2026-04-13", Inicio: 9 },
      { Id: "Evento_80", Fecha: "2026-04-13", Inicio: 12 },
      { Id: "Evento_81", Fecha: "2026-04-13", Inicio: 13 },
      { Id: "ev_dia_b", Fecha: "2026-04-14", Inicio: 10 }
    ]);
    expect(Resultado.Seleccion).toEqual([]);
  }
);
