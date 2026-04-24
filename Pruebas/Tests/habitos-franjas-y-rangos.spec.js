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
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")?.classList.remove("Activo");
    if (!Semana_Actual) {
      Semana_Actual = Obtener_Lunes(new Date());
    }
  });
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

test("permite cero caidas en habitos de evitar", async ({ page }) => {
  await Preparar(page);

  const meta = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Nombre: "Sin caidas",
      Tipo: "Evitar",
      Meta: {
        Modo: "Cantidad",
        Regla: "Como_Maximo",
        Cantidad: 0,
        Cantidad_Maxima: 0,
        Unidad: "caidas"
      }
    });
    return {
      Meta: Habito.Meta,
      Objetivo: Habito_Objetivo_Total(Habito)
    };
  });

  expect(meta.Meta.Modo).toBe("Cantidad");
  expect(meta.Meta.Regla).toBe("Como_Maximo");
  expect(meta.Meta.Cantidad).toBe(0);
  expect(meta.Meta.Cantidad_Maxima).toBe(0);
  expect(meta.Objetivo).toBe(0);
});

test("advierte antes de cerrar habito con cambios sin guardar", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [];
    Abrir_Modal_Habitos();
  });
  await page.fill("#Habito_Nombre", "Habito sin guardar");
  await page.click("#Habitos_Cerrar");

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("cambios sin guardar");

  await page.locator("#Dialogo_Botones .Dialogo_Boton_Cancelar").click();
  await expect(page.locator("#Habitos_Overlay"))
    .toHaveClass(/Activo/);
});

test("advierte al cambiar unidad con registros previos", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Test_Registros",
        Nombre: "Lectura",
        Tipo: "Hacer",
        Programacion: { Tipo: "Libre" },
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [
      Normalizar_Habito_Registro({
        Id: "Registro_Test",
        Habito_Id: "Habito_Test_Registros",
        Fecha: "2026-04-24",
        Hora: "09:00",
        Fecha_Hora: "2026-04-24T09:00",
        Periodo_Clave: "2026-04-24",
        Fuente: "Manual",
        Fuente_Id: "Manual_Test",
        Cantidad: 5
      })
    ];
    Abrir_Modal_Habitos("Habito_Test_Registros");
  });

  await page.fill("#Habito_Meta_Unidad", "hojas");
  await page.click("#Habitos_Nuevo");

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("ya tiene registros");
});

test("oculta origen tecnico en el log de habitos", async ({ page }) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Log_Origen",
        Nombre: "Leer",
        Tipo: "Hacer",
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [
      Normalizar_Habito_Registro({
        Id: "Registro_Log_Origen",
        Habito_Id: "Habito_Log_Origen",
        Fecha: "2026-04-24",
        Hora: "14:14",
        Fecha_Hora: "2026-04-24T14:14",
        Periodo_Clave: "2026-04-24",
        Fuente: "Manual",
        Fuente_Id: "Manual_Habito_Visible_No",
        Cantidad: 1,
        Unidad: "paginas"
      })
    ];
    Abrir_Modal_Habitos();
    Habitos_Navegar("Registro");
  });

  const tabla = page.locator(".Habitos_Tabla");
  await expect(tabla).toBeVisible();
  await expect(tabla.locator("thead th")).toHaveCount(5);
  await expect(tabla.locator("thead")).not.toContainText("Origin");
  await expect(tabla.locator("tbody")).not
    .toContainText("Manual_Habito_Visible_No");
});

test("explica que los patrones se filtran por tipo de slot", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Patrones = [];
    void Resolver_Items_Patron_Slot([], "Sueno");
  });

  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("compatibles");
  await expect(page.locator("#Dialogo_Mensaje"))
    .toContainText("tipo de slot");
});

test("elige patrones de slot desde un desplegable", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Patrones = [
      {
        Id: "Patron_Slot_Drop",
        Nombre: "Base lectura",
        Emoji: "\uD83E\uDDE9",
        Tipo: "Slot",
        Aplica_A: "Slot_Vacio",
        Aplica_A_Lista: ["Slot_Vacio"],
        Items: [
          {
            Id: "Item_Base_Lectura",
            Emoji: "\u2022",
            Texto: "Leer",
            Estado: "Planeado"
          }
        ]
      }
    ];
    window.__Items_Patron_Drop =
      Resolver_Items_Patron_Slot([], "Slot_Vacio");
  });

  const Select = page.locator("#Dialogo_Mensaje select.Config_Select");
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(Select).toBeVisible();
  await expect(Select).toContainText("Base lectura");
  await page.selectOption("#Dialogo_Mensaje select.Config_Select", {
    value: "Patron_Slot_Drop"
  });
  await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

  const Items = await page.evaluate(() => window.__Items_Patron_Drop);
  expect(Items).toHaveLength(1);
  expect(Items[0].Texto).toBe("Leer");
});

test("agrega habitos a patrones de slot desde un desplegable", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Patron_Drop",
        Nombre: "Lectura desplegable",
        Emoji: "\uD83D\uDCD6",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      })
    ];
    Patrones = [
      {
        Id: "Patron_Add_Habito_Drop",
        Nombre: "Patron habito",
        Emoji: "\uD83E\uDDE9",
        Tipo: "Slot",
        Aplica_A: "Slot_Vacio",
        Aplica_A_Lista: ["Slot_Vacio"],
        Items: []
      }
    ];
    Abrir_Modal_Patron("Patron_Add_Habito_Drop");
  });

  await page.locator(".Patron_Modal_Agregar_Franja").last().click();
  const Select = page.locator("#Dialogo_Mensaje select.Config_Select");
  await expect(Select).toBeVisible();
  await expect(Select).toContainText("Lectura desplegable");
  await page.selectOption("#Dialogo_Mensaje select.Config_Select", {
    value: "Habito_Patron_Drop"
  });
  await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

  const Item = await page.evaluate(() => Patron_En_Edicion.Items[0]);
  expect(Item).toMatchObject({
    Tipo: "Habito",
    Habito_Id: "Habito_Patron_Drop",
    Texto: "Lectura desplegable"
  });
});

test("vincula habitos desde items de patrones de slot", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Link_Patron",
        Nombre: "Lectura patron",
        Tipo: "Hacer",
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [];
    Planes_Slot = {};
    Patrones = [
      {
        Id: "Patron_Link_Items",
        Nombre: "Patron con links",
        Emoji: "\u2726",
        Tipo: "Slot",
        Aplica_A: "Slot_Vacio",
        Aplica_A_Lista: ["Slot_Vacio"],
        Items: [
          {
            Id: "Item_Linkable",
            Emoji: "\u2022",
            Texto: "Leer capitulo",
            Estado: "Realizado",
            Tipo: "Texto",
            Habitos_Vinculos: [
              {
                Habito_Id: "Habito_Link_Patron",
                Cantidad_Modo: "Fija",
                Cantidad: 3,
                Activo: true
              }
            ]
          }
        ]
      }
    ];
    Abrir_Modal_Patron("Patron_Link_Items");
  });

  await page.click('[data-patron-item-habitos="Item_Linkable"]');
  await expect(page.locator(".Patron_Modal_Item_Vinculos"))
    .toBeVisible();
  await expect(page.locator(".Patron_Modal_Item_Vinculos"))
    .toContainText("Lectura patron");
  await expect(page.locator(".Habitos_Vinculo_Fila"))
    .toHaveCount(1);

  const resultado = await page.evaluate(() => {
    const Patron = Patrones.find((Item) =>
      Item.Id === "Patron_Link_Items"
    );
    Normalizar_Patron(Patron);
    const Items = Clonar_Items_Plan_Slot(Patron.Items);
    const Item = Items[0];
    Planes_Slot = {
      "2026-04-24_09": {
        Items
      }
    };
    Habitos_Registros = [
      Normalizar_Habito_Registro({
        Habito_Id: "Habito_Link_Patron",
        Fecha: "2026-04-24",
        Hora: "09:00",
        Fecha_Hora: "2026-04-24T09:00",
        Periodo_Clave: "2026-04-24",
        Fuente: "Plan_Slot_Item",
        Fuente_Id: Item.Id,
        Cantidad: 99,
        Unidad: "paginas"
      })
    ];

    Habito_Sincronizar_Items_Plan_Slot(
      "2026-04-24",
      [],
      Items,
      "Plan_Slot_Item",
      9
    );

    return {
      PatronLinks: Patron.Items[0].Habitos_Vinculos.length,
      ClonLinks: Item.Habitos_Vinculos.length,
      Registros: Habitos_Registros.map((Registro) => ({
        Habito_Id: Registro.Habito_Id,
        Cantidad: Registro.Cantidad,
        Unidad: Registro.Unidad,
        Fuente: Registro.Fuente,
        Fuente_Id: Registro.Fuente_Id,
        Hora: Registro.Hora
      })),
      Usos: Habito_Contar_Usos("Habito_Link_Patron"),
      Vinculaciones: Habitos_Obtener_Vinculaciones()
        .filter((Vinculo) =>
          Vinculo.Habito_Id === "Habito_Link_Patron"
        ).map((Vinculo) => Vinculo.Tipo)
    };
  });

  expect(resultado.PatronLinks).toBe(1);
  expect(resultado.ClonLinks).toBe(1);
  expect(resultado.Registros).toEqual([
    {
      Habito_Id: "Habito_Link_Patron",
      Cantidad: 3,
      Unidad: "paginas",
      Fuente: "Plan_Slot_Item",
      Fuente_Id: expect.any(String),
      Hora: "09:00"
    }
  ]);
  expect(resultado.Usos).toEqual({
    planes: 1,
    patrones: 1,
    fuentes: 0
  });
  expect(resultado.Vinculaciones.length).toBeGreaterThanOrEqual(2);
});

test("vinculos de planes registran habitos al finalizar avances", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Planes_Periodo = Planes_Modelo_Base();
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Leer_Planes",
        Nombre: "Leer",
        Emoji: "\uD83D\uDCD6",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 20,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [];
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Objetivos.obj_habitos = Normalizar_Objetivo_Plan({
      Id: "obj_habitos",
      Nombre: "Lecturas",
      Target_Total: 14,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas"
    });
    Modelo.Subobjetivos.sub_habitos = Normalizar_Subobjetivo_Plan({
      Id: "sub_habitos",
      Objetivo_Id: "obj_habitos",
      Texto: "Libro",
      Target_Total: 7,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Leer_Planes",
          Cantidad_Modo: "Fija",
          Cantidad: 1,
          Activo: true
        }
      ]
    });
    Modelo.Partes.parte_habitos = Normalizar_Parte_Meta({
      Id: "parte_habitos",
      Objetivo_Id: "obj_habitos",
      Subobjetivo_Id: "sub_habitos",
      Nombre: "Capitulo",
      Aporte_Total: 7,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Leer_Planes",
          Cantidad_Modo: "Fija",
          Cantidad: 1,
          Activo: true
        }
      ]
    });
    Modelo.Subobjetivos.sub_parcial_habitos =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_parcial_habitos",
        Objetivo_Id: "obj_habitos",
        Texto: "Libro largo",
        Target_Total: 28,
        Unidad: "Personalizado",
        Unidad_Custom: "p\u00e1ginas"
      });
    Modelo.Partes.parte_parcial_habitos = Normalizar_Parte_Meta({
      Id: "parte_parcial_habitos",
      Objetivo_Id: "obj_habitos",
      Subobjetivo_Id: "sub_parcial_habitos",
      Nombre: "Capitulo largo",
      Aporte_Total: 28,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Leer_Planes",
          Cantidad_Modo: "Fija",
          Cantidad: 1,
          Activo: true
        }
      ]
    });
    Modelo.Partes.parte_click_habitos = Normalizar_Parte_Meta({
      Id: "parte_click_habitos",
      Objetivo_Id: "obj_habitos",
      Subobjetivo_Id: "sub_habitos",
      Nombre: "Capitulo click",
      Aporte_Total: 5,
      Unidad: "Personalizado",
      Unidad_Custom: "p\u00e1ginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Leer_Planes",
          Cantidad_Modo: "Fija",
          Cantidad: 1,
          Activo: true
        }
      ]
    });
    Modelo.Subobjetivos.sub_directo_habitos =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_directo_habitos",
        Objetivo_Id: "obj_habitos",
        Texto: "Apunte",
        Target_Total: 7,
        Unidad: "Personalizado",
        Unidad_Custom: "p\u00e1ginas",
        Habitos_Vinculos: [
          {
            Habito_Id: "Habito_Leer_Planes",
            Cantidad_Modo: "Fija",
            Cantidad: 1,
            Activo: true
          }
        ]
      });
    Modelo.Subobjetivos.sub_click_habitos =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_click_habitos",
        Objetivo_Id: "obj_habitos",
        Texto: "Resumen",
        Target_Total: 4,
        Unidad: "Personalizado",
        Unidad_Custom: "p\u00e1ginas",
        Habitos_Vinculos: [
          {
            Habito_Id: "Habito_Leer_Planes",
            Cantidad_Modo: "Fija",
            Cantidad: 1,
            Activo: true
          }
        ]
      });

    const Default_Parte = Habito_Vinculo_Default(
      "Plan_Parte",
      "Habito_Leer_Planes"
    );

    Abrir_Modal_Planes_Avance("Parte|parte_habitos");
    document.getElementById("Planes_Avance_Cantidad").value = "7";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "10:00";
    document.getElementById("Planes_Avance_Hasta_Final").checked = true;
    await Guardar_Modal_Planes_Avance();

    Abrir_Modal_Planes_Avance("Subobjetivo|sub_directo_habitos");
    document.getElementById("Planes_Avance_Cantidad").value = "7";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "11:00";
    document.getElementById("Planes_Avance_Hasta_Final").checked = true;
    await Guardar_Modal_Planes_Avance();

    Abrir_Modal_Planes_Avance("Parte|parte_parcial_habitos");
    document.getElementById("Planes_Avance_Cantidad").value = "1";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "12:00";
    await Guardar_Modal_Planes_Avance();

    const Dialogo_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async () => true;
    await Planes_Marcar_Parte_Como_Realizada("parte_click_habitos");
    await Planes_Marcar_Subobjetivo_Como_Realizado(
      "sub_click_habitos"
    );
    Mostrar_Dialogo = Dialogo_Original;

    return {
      defaultModo: Default_Parte.Cantidad_Modo,
      registros: Habitos_Registros
        .filter((Registro) =>
          Registro.Habito_Id === "Habito_Leer_Planes"
        )
        .map((Registro) => ({
          Fuente: Registro.Fuente,
          Fuente_Id: Registro.Fuente_Id,
          Cantidad: Registro.Cantidad,
          Unidad: Registro.Unidad,
          Fecha: Registro.Fecha,
          Hora: Registro.Hora
        }))
        .sort((A, B) => A.Hora.localeCompare(B.Hora))
    };
  });

  expect(resultado.defaultModo).toBe("Usar_Fuente");
  expect(resultado.registros).toEqual(expect.arrayContaining([
    expect.objectContaining({
      Fuente: "Plan_Parte",
      Cantidad: 7,
      Unidad: "paginas",
      Fecha: "2026-04-24",
      Hora: "10:00"
    }),
    expect.objectContaining({
      Fuente: "Plan_Subobjetivo",
      Cantidad: 7,
      Unidad: "paginas",
      Fecha: "2026-04-24",
      Hora: "11:00"
    }),
    expect.objectContaining({
      Fuente: "Plan_Parte",
      Cantidad: 1,
      Unidad: "paginas",
      Fecha: "2026-04-24",
      Hora: "12:00"
    }),
    expect.objectContaining({
      Fuente: "Plan_Parte",
      Fuente_Id: "parte_click_habitos",
      Cantidad: 5,
      Unidad: "paginas"
    }),
    expect.objectContaining({
      Fuente: "Plan_Subobjetivo",
      Fuente_Id: "sub_click_habitos",
      Cantidad: 4,
      Unidad: "paginas"
    })
  ]));
});

test("sidebar de habitos rotula y separa semanales de diarios", async ({
  page
}) => {
  await Preparar(page);

  const estructura = await page.evaluate(() => {
    Config.Mostrar_Habitos_Sidebar = true;
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Diario_Sidebar",
        Nombre: "Agua",
        Emoji: "\u{1f4a7}",
        Activo: true,
        Orden: 1,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Semanal_Sidebar",
        Nombre: "Revision semanal",
        Emoji: "\u2713",
        Activo: true,
        Orden: 2,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Semana",
          Cantidad: 1
        }
      })
    ];
    Habitos_Registros = [];
    Render_Habitos_Sidebar();

    const Root = document.getElementById("Sidebar_Habitos");
    const Label = Root.querySelector(".Sidebar_Habitos_Label");
    const Habito = Root.querySelector(".Sidebar_Habito");
    const Indicador = Root.querySelector(".Sidebar_Habito_Indicador");
    const Fila = Root.querySelector(".Sidebar_Habitos_Fila");
    return {
      oculto: Root.classList.contains("Oculto"),
      titulo: Root.querySelector(".Sidebar_Habitos_Titulo")
        ?.textContent,
      labels: Array.from(
        Root.querySelectorAll(".Sidebar_Habitos_Label")
      ).map((Nodo) => Nodo.textContent),
      divisores: Root.querySelectorAll(
        ".Sidebar_Habitos_Divisor"
      ).length,
      grupos: Array.from(
        Root.querySelectorAll(".Sidebar_Habitos_Grupo")
      ).map((Grupo) =>
        Array.from(
          Grupo.querySelectorAll("[data-sidebar-habito-id]")
        ).map((Btn) => Btn.dataset.sidebarHabitoId)
      ),
      bordeRoot: getComputedStyle(Root).borderRadius,
      margenIzquierdo: getComputedStyle(Root).marginLeft,
      fondoRoot: getComputedStyle(Root).backgroundColor,
      labelPeso: getComputedStyle(Label).fontWeight,
      filaGap: getComputedStyle(Fila).gap,
      habitoAncho: getComputedStyle(Habito).width,
      habitoAlto: getComputedStyle(Habito).height,
      habitoFondo: getComputedStyle(Habito).backgroundColor,
      indicadorAlto: getComputedStyle(Indicador).height
    };
  });

  expect(estructura).toEqual({
    oculto: false,
    titulo: "H\u00e1bitos",
    labels: ["\u{1F4C5} SEMANALES", "\u2713 DIARIOS"],
    divisores: 0,
    grupos: [
      ["Habito_Semanal_Sidebar"],
      ["Habito_Diario_Sidebar"]
    ],
    bordeRoot: "0px",
    margenIzquierdo: "-14px",
    fondoRoot: "rgba(54, 47, 39, 0.06)",
    labelPeso: "400",
    filaGap: "10px",
    habitoAncho: "25px",
    habitoAlto: "25px",
    habitoFondo: "rgb(255, 255, 255)",
    indicadorAlto: "7px"
  });
});

test("sidebar de habitos oculta globitos y registra desde menu", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Config.Mostrar_Habitos_Sidebar = true;
    Config.Mostrar_Globitos_Habitos = false;
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Check_Menu",
        Nombre: "Check menu",
        Emoji: "\u2713",
        Activo: true,
        Orden: 1,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Cantidad_Menu",
        Nombre: "Paginas menu",
        Emoji: "\u{1f4d6}",
        Activo: true,
        Orden: 2,
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Evitar_Menu",
        Nombre: "Evitar menu",
        Emoji: "\u26d4",
        Tipo: "Evitar",
        Activo: true,
        Orden: 3,
        Meta: {
          Modo: "Cantidad",
          Regla: "Como_Maximo",
          Periodo: "Dia",
          Cantidad: 0,
          Unidad: "caidas"
        }
      })
    ];
    Habitos_Registros = [];
    Render_Habitos_Sidebar();
  });

  await expect(page.locator("#Sidebar_Habitos"))
    .toHaveClass(/Sin_Globitos/);
  await expect(page.locator(".Sidebar_Habito_Indicador"))
    .toHaveCount(0);

  await page.evaluate(() => Abrir_Config());
  await expect(page.locator("#Cfg_Globito_Habitos_Activo"))
    .toBeVisible();
  await expect(page.locator("#Cfg_Globito_Habitos_Activo"))
    .not.toBeChecked();
  await page.check("#Cfg_Globito_Habitos_Activo");
  await page.click("#Config_Guardar_Btn");
  await expect(page.locator("#Config_Overlay"))
    .not.toHaveClass(/Activo/);
  await expect(page.locator(".Sidebar_Habito_Indicador"))
    .toHaveCount(2);

  await page.click(
    '[data-sidebar-habito-id="Habito_Check_Menu"]',
    { button: "right" }
  );
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Marcar como realizado");
  await expect(page.locator("#Dia_Accion_Menu"))
    .toContainText("Registrar avance");
  await page.click(
    '#Dia_Accion_Menu [data-acc="habito-registrar-avance"]'
  );

  await page.click(
    '[data-sidebar-habito-id="Habito_Cantidad_Menu"]',
    { button: "right" }
  );
  await page.click(
    '#Dia_Accion_Menu [data-acc="habito-registrar-avance"]'
  );
  await expect(page.locator("#Dialogo_Overlay"))
    .toHaveClass(/Activo/);
  await expect(page.locator("#Dialogo_Input_Campo"))
    .toHaveValue("1");
  await page.fill("#Dialogo_Input_Campo", "3");
  await page.click("#Dialogo_Botones .Dialogo_Boton_Primario");

  await page.click(
    '[data-sidebar-habito-id="Habito_Cantidad_Menu"]',
    { button: "right" }
  );
  await page.click(
    '#Dia_Accion_Menu [data-acc="habito-marcar-realizado"]'
  );

  await page.click(
    '[data-sidebar-habito-id="Habito_Evitar_Menu"]',
    { button: "right" }
  );
  await expect(page.locator(
    '#Dia_Accion_Menu [data-acc="habito-registrar-avance"]'
  )).toHaveCount(0);
  await page.click(
    '#Dia_Accion_Menu [data-acc="habito-marcar-realizado"]'
  );

  const resumen = await page.evaluate(() => {
    const Fecha = Habitos_Fecha_Referencia();
    return {
      Check: Habito_Progreso_Actual(
        Habito_Por_Id("Habito_Check_Menu"),
        Fecha
      ),
      Cantidad: Habito_Progreso_Actual(
        Habito_Por_Id("Habito_Cantidad_Menu"),
        Fecha
      ),
      EvitarConfirmado: Habitos_Evitar_Confirmado_En_Periodo(
        Habito_Por_Id("Habito_Evitar_Menu"),
        Fecha
      ),
      EvitarCantidad: Habitos_Registros.find((Registro) =>
        Registro.Habito_Id === "Habito_Evitar_Menu"
      )?.Cantidad
    };
  });

  expect(resumen).toEqual({
    Check: 1,
    Cantidad: 4,
    EvitarConfirmado: true,
    EvitarCantidad: 0
  });
});

test("panel de habitos registra avances manuales desde la lista", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Check_Rapido",
        Nombre: "Check rapido",
        Tipo: "Hacer",
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Cantidad_Rapida",
        Nombre: "Lectura rapida",
        Tipo: "Hacer",
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 5,
          Unidad: "paginas"
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Evitar_Rapido",
        Nombre: "Evitar rapido",
        Tipo: "Evitar",
        Meta: {
          Modo: "Cantidad",
          Regla: "Como_Maximo",
          Periodo: "Dia",
          Cantidad: 0,
          Unidad: "caidas"
        }
      })
    ];
    Habitos_Registros = [];
    Abrir_Panel_Habitos();
  });

  await expect(page.locator("#Habitos_Header_Acciones button"))
    .toHaveCount(4);

  const layout = await page.evaluate(() => {
    const Lista = document.querySelector(".Habitos_Lista");
    const Card = document.querySelector(
      '[data-habitos-card="Habito_Check_Rapido"]'
    );
    return {
      Columnas: getComputedStyle(Lista).gridTemplateColumns
        .split(" ")
        .filter(Boolean).length,
      Tiene_Filtros_Visibles: Boolean(
        document.querySelector(
          ".Habitos_Panel_Principal > .Habitos_Panel_Filtros"
        )
      ),
      Tiene_Estado_Visible: Boolean(
        document.querySelector(".Habitos_Card_Estado")
      ),
      Tiene_Drag_Visible: Boolean(
        document.querySelector(".Habitos_Card_Drag")
      ),
      Tiene_Cancelar_Visible: Boolean(
        document.querySelector("[data-habitos-cancelar]")
      ),
      Card_Clases: Card?.className || "",
      Card_Color: Card ? getComputedStyle(Card).backgroundColor : ""
    };
  });
  expect(layout.Columnas).toBe(1);
  expect(layout.Tiene_Filtros_Visibles).toBe(false);
  expect(layout.Tiene_Estado_Visible).toBe(false);
  expect(layout.Tiene_Drag_Visible).toBe(false);
  expect(layout.Tiene_Cancelar_Visible).toBe(false);
  expect(layout.Card_Clases).toContain("Pendiente");
  expect(layout.Card_Color).toBe("rgba(246, 243, 238, 0.78)");

  await page.locator('[data-habitos-card="Habito_Check_Rapido"]')
    .click({ button: "right" });
  await expect(page.locator(
    '#Dia_Accion_Menu [data-acc="habito-cancelar"]'
  )).toContainText(/Cancelar este per/);
  await page.mouse.click(10, 10);

  await page.click(
    '[data-habitos-registro-rapido="Habito_Check_Rapido"]'
  );
  await expect(page.locator(
    '[data-habitos-registro-rapido="Habito_Check_Rapido"]'
  )).toHaveClass(/Confirmado/);
  await page.waitForTimeout(1050);
  await expect(page.locator(
    '[data-habitos-registro-rapido="Habito_Check_Rapido"]'
  )).not.toHaveClass(/Confirmado/);
  await expect(page.locator(".Undo_Toast").first())
    .toContainText("Hábito realizado");

  await page.fill(
    '[data-habitos-registro-input="Habito_Cantidad_Rapida"]',
    "2"
  );
  await page.click(
    '[data-habitos-registro-rapido="Habito_Cantidad_Rapida"]'
  );

  await page.click(
    '[data-habitos-registro-rapido="Habito_Evitar_Rapido"]'
  );
  await expect(page.locator(
    '[data-habitos-registro-rapido="Habito_Evitar_Rapido"]'
  )).toHaveClass(/Confirmado/);

  const resumen = await page.evaluate(() => ({
    Total: Habitos_Registros.length,
    Check: Habito_Progreso_Actual(
      Habito_Por_Id("Habito_Check_Rapido"),
      Habitos_Fecha_Referencia()
    ),
    Cantidad: Habito_Progreso_Actual(
      Habito_Por_Id("Habito_Cantidad_Rapida"),
      Habitos_Fecha_Referencia()
    ),
    EvitarCantidad: Habitos_Registros.find((Registro) =>
      Registro.Habito_Id === "Habito_Evitar_Rapido"
    )?.Cantidad,
    EvitarEstado: Habitos_Estado(
      Habito_Por_Id("Habito_Evitar_Rapido")
    ).Clave
  }));

  expect(resumen).toEqual({
    Total: 3,
    Check: 1,
    Cantidad: 2,
    EvitarCantidad: 0,
    EvitarEstado: "Realizado"
  });

  await page.click('[data-habitos-filtros="abrir"]');
  await expect(page.locator("#Habitos_Filtros_Overlay"))
    .toBeVisible();
  await expect(page.locator("#Habitos_Filtros_Overlay select"))
    .toHaveCount(3);
  await page.selectOption("#Habitos_Filtro_Estado", "Realizado");
  await expect(page.locator(".Habitos_Card")).toHaveCount(3);
  await page.click("#Habitos_Filtros_Aceptar");
  await expect(page.locator(".Habitos_Card")).toHaveCount(2);
});
