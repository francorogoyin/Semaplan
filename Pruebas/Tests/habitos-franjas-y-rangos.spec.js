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

test("calcula periodos quincenales y mensuales de habitos", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Quincenal = Normalizar_Habito({
      Id: "Habito_Quincenal",
      Nombre: "Quincenal",
      Meta: {
        Modo: "Cantidad",
        Regla: "Al_Menos",
        Periodo: "Quincena",
        Cantidad: 30,
        Unidad: "paginas"
      }
    });
    const Mensual = Normalizar_Habito({
      Id: "Habito_Mensual",
      Nombre: "Mensual",
      Meta: {
        Modo: "Cantidad",
        Regla: "Al_Menos",
        Periodo: "Mes",
        Cantidad: 100,
        Unidad: "paginas"
      }
    });
    Habitos = [Quincenal, Mensual];
    Habitos_Registros = [];
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Quincenal",
      Fecha: "2026-04-10",
      Fuente: "Manual",
      Fuente_Id: "q1",
      Cantidad: 10,
      Unidad: "paginas"
    });
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Quincenal",
      Fecha: "2026-04-20",
      Fuente: "Manual",
      Fuente_Id: "q2",
      Cantidad: 20,
      Unidad: "paginas"
    });
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Mensual",
      Fecha: "2026-04-10",
      Fuente: "Manual",
      Fuente_Id: "m1",
      Cantidad: 40,
      Unidad: "paginas"
    });
    Habito_Registrar_Fuente({
      Habito_Id: "Habito_Mensual",
      Fecha: "2026-04-20",
      Fuente: "Manual",
      Fuente_Id: "m2",
      Cantidad: 50,
      Unidad: "paginas"
    });
    Abrir_Modal_Habitos();
    return {
      q10: Habito_Clave_Periodo(Quincenal, "2026-04-10"),
      q20: Habito_Clave_Periodo(Quincenal, "2026-04-20"),
      mes: Habito_Clave_Periodo(Mensual, "2026-04-20"),
      progresoQ10: Habito_Progreso_Actual(Quincenal, "2026-04-10"),
      progresoQ20: Habito_Progreso_Actual(Quincenal, "2026-04-20"),
      progresoMes: Habito_Progreso_Actual(Mensual, "2026-04-24"),
      metaQ: Habitos_Texto_Meta(Quincenal),
      metaM: Habitos_Texto_Meta(Mensual),
      tieneQuincena: Boolean(
        document.querySelector(
          '#Habito_Meta_Periodo option[value="Quincena"]'
        )
      ),
      tieneMes: Boolean(
        document.querySelector('#Habito_Meta_Periodo option[value="Mes"]')
      )
    };
  });

  expect(resultado).toEqual({
    q10: "2026-04-Q1",
    q20: "2026-04-Q2",
    mes: "2026-04",
    progresoQ10: 10,
    progresoQ20: 20,
    progresoMes: 90,
    metaQ: "30 paginas - Por quincena",
    metaM: "100 paginas - Por mes",
    tieneQuincena: true,
    tieneMes: true
  });
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

test("migra y oculta el tipo Limite de habitos", async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Habito = Normalizar_Habito({
      Nombre: "Limite viejo",
      Tipo: "Limite",
      Meta: {
        Modo: "Check",
        Regla: "Al_Menos",
        Cantidad: 5,
        Unidad: "paginas"
      }
    });
    Abrir_Modal_Habitos();
    return {
      Tipo: Habito.Tipo,
      Modo: Habito.Meta.Modo,
      Regla: Habito.Meta.Regla,
      Tiene_Option: Boolean(
        document.querySelector('#Habito_Tipo option[value="Limite"]')
      )
    };
  });

  expect(resultado).toEqual({
    Tipo: "Hacer",
    Modo: "Cantidad",
    Regla: "Como_Maximo",
    Tiene_Option: false
  });
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

test("tarjeta de habito abre registro filtrado", async ({ page }) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Filtro_Registro",
        Nombre: "Lectura filtrada",
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
        Id: "Habito_Otro_Registro",
        Nombre: "Otro habito",
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
        Id: "Registro_Filtrado",
        Habito_Id: "Habito_Filtro_Registro",
        Fecha: "2026-04-24",
        Hora: "09:00",
        Fecha_Hora: "2026-04-24T09:00",
        Periodo_Clave: "2026-04-24",
        Fuente: "Manual",
        Fuente_Id: "Manual_Filtrado",
        Cantidad: 5,
        Unidad: "paginas"
      }),
      Normalizar_Habito_Registro({
        Id: "Registro_Otro",
        Habito_Id: "Habito_Otro_Registro",
        Fecha: "2026-04-24",
        Hora: "10:00",
        Fecha_Hora: "2026-04-24T10:00",
        Periodo_Clave: "2026-04-24",
        Fuente: "Manual",
        Fuente_Id: "Manual_Otro",
        Cantidad: 3,
        Unidad: "paginas"
      })
    ];
    Abrir_Panel_Habitos();
  });

  await expect(page.locator("[data-habitos-ver-todos]"))
    .toHaveCount(0);
  await page.locator('[data-habitos-toggle="Habito_Filtro_Registro"]')
    .click();
  await expect(page.locator(".Habitos_Card_Ultimo")).toHaveCount(0);
  await expect(
    page.locator('[data-habitos-registro-habito="Habito_Filtro_Registro"]')
  ).toBeVisible();
  await page.locator(
    '[data-habitos-registro-habito="Habito_Filtro_Registro"]'
  ).click();

  await expect(page.locator("#Habitos_Titulo"))
    .toContainText("Lectura filtrada");
  await expect(page.locator(".Habitos_Tabla"))
    .toContainText("Lectura filtrada");
  await expect(page.locator(".Habitos_Tabla"))
    .not.toContainText("Otro habito");
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

test("vinculos de bloque aceptan tiempo check y cantidad", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Tiempo_Bloque",
        Nombre: "Foco",
        Emoji: "\u23f1\ufe0f",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Tiempo",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 90,
          Unidad: "Minutos"
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Check_Bloque",
        Nombre: "Sentarse",
        Emoji: "\u2705",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Cantidad_Bloque",
        Nombre: "Lectura",
        Emoji: "\uD83D\uDCD6",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 12,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [];
    Objetivos = [
      {
        Id: "Obj_Bloque_Habitos",
        Nombre: "Estudiar",
        Emoji: "\uD83C\uDF93",
        Horas_Semanales: 2,
        Restante: 2
      }
    ];
    Eventos = [
      {
        Id: "Evento_Bloque_Habitos",
        Objetivo_Id: "Obj_Bloque_Habitos",
        Fecha: "2026-04-24",
        Inicio: 9,
        Duracion: 1.5,
        Hecho: false,
        Habitos_Vinculos: [
          {
            Habito_Id: "Habito_Tiempo_Bloque",
            Cantidad_Modo: "Usar_Duracion",
            Cantidad: 1,
            Activo: true
          },
          {
            Habito_Id: "Habito_Check_Bloque",
            Cantidad_Modo: "Fija",
            Cantidad: 9,
            Activo: true
          },
          {
            Habito_Id: "Habito_Cantidad_Bloque",
            Cantidad_Modo: "Fija",
            Cantidad: 4,
            Activo: true
          }
        ]
      }
    ];

    Abrir_Habitos_Evento("Evento_Bloque_Habitos");
    const Texto_Modal =
      document.getElementById("Habitos_Evento_Cuerpo")?.innerText || "";
    const Opciones = Array.from(
      document.querySelectorAll("#Habitos_Evento_Cuerpo option")
    ).map((Opcion) => Opcion.textContent || "");
    Guardar_Habitos_Evento_Modal();

    await Meta_Aporte_Cambiar_Hecho_Evento(Eventos[0], true);

    return {
      textoModal: Texto_Modal,
      opciones: Opciones,
      registros: Habitos_Registros
        .map((Registro) => ({
          Habito_Id: Registro.Habito_Id,
          Cantidad: Registro.Cantidad,
          Unidad: Registro.Unidad,
          Fuente: Registro.Fuente,
          Fuente_Id: Registro.Fuente_Id,
          Hora: Registro.Hora
        }))
        .sort((A, B) => A.Habito_Id.localeCompare(B.Habito_Id))
    };
  });

  expect(resultado.opciones.join(" ")).toContain("Foco");
  expect(resultado.opciones.join(" ")).toContain("Sentarse");
  expect(resultado.opciones.join(" ")).toContain("Lectura");
  expect(resultado.textoModal).toContain(
    "Cantidades realizadas por bloque tildado"
  );
  expect(resultado.registros).toEqual([
    {
      Habito_Id: "Habito_Cantidad_Bloque",
      Cantidad: 4,
      Unidad: "paginas",
      Fuente: "Evento",
      Fuente_Id: "Evento_Bloque_Habitos",
      Hora: "09:00"
    },
    {
      Habito_Id: "Habito_Check_Bloque",
      Cantidad: 1,
      Unidad: "",
      Fuente: "Evento",
      Fuente_Id: "Evento_Bloque_Habitos",
      Hora: "09:00"
    },
    {
      Habito_Id: "Habito_Tiempo_Bloque",
      Cantidad: 90,
      Unidad: "min",
      Fuente: "Evento",
      Fuente_Id: "Evento_Bloque_Habitos",
      Hora: "09:00"
    }
  ]);
});

test("objetivo semanal aplica habitos por defecto al tildar bloques", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Tiempo_Objetivo",
        Nombre: "Foco objetivo",
        Emoji: "\u23f1\ufe0f",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Tiempo",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 90,
          Unidad: "Minutos"
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Check_Objetivo",
        Nombre: "Bloques hechos",
        Emoji: "\u2705",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Cantidad_Objetivo",
        Nombre: "Paginas objetivo",
        Emoji: "\uD83D\uDCD6",
        Tipo: "Hacer",
        Activo: true,
        Meta: {
          Modo: "Cantidad",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 10,
          Unidad: "paginas"
        }
      })
    ];
    Habitos_Registros = [];
    Mostrar_Creador();
    const Creador_Tiene_Vinculos = Boolean(
      document.querySelector(
        "#Objetivo_Habitos_Bloques_Lista .Habitos_Vinculos_Barra"
      )
    );
    Ocultar_Creador();
    Objetivos = [
      {
        Id: "Obj_Habitos_Default",
        Nombre: "Lectura semanal",
        Emoji: "\uD83D\uDCD8",
        Horas_Semanales: 2,
        Restante: 2,
        Habitos_Vinculos_Bloques: [
          {
            Habito_Id: "Habito_Tiempo_Objetivo",
            Cantidad_Modo: "Usar_Duracion",
            Cantidad: 1,
            Activo: true
          },
          {
            Habito_Id: "Habito_Check_Objetivo",
            Cantidad_Modo: "Fija",
            Cantidad: 8,
            Activo: true
          },
          {
            Habito_Id: "Habito_Cantidad_Objetivo",
            Cantidad_Modo: "Fija",
            Cantidad: 5,
            Activo: true
          }
        ]
      }
    ];
    Eventos = [
      {
        Id: "Evento_Default_Habitos",
        Objetivo_Id: "Obj_Habitos_Default",
        Fecha: "2026-04-24",
        Inicio: 18,
        Duracion: 1.5,
        Hecho: false
      }
    ];

    Abrir_Habitos_Evento("Evento_Default_Habitos");
    const Modal_Max_Width = getComputedStyle(
      document.querySelector("#Habitos_Evento_Overlay .Patron_Modal_Panel")
    ).maxWidth;
    Cerrar_Habitos_Evento();

    await Meta_Aporte_Cambiar_Hecho_Evento(Eventos[0], true);
    const Registros_Creados = Habitos_Registros
      .filter((Registro) => Registro.Fuente === "Objetivo_Bloque")
      .map((Registro) => ({
        Habito_Id: Registro.Habito_Id,
        Cantidad: Registro.Cantidad,
        Unidad: Registro.Unidad,
        Fuente: Registro.Fuente,
        Fuente_Id: Registro.Fuente_Id,
        Hora: Registro.Hora
      }))
      .sort((A, B) => A.Habito_Id.localeCompare(B.Habito_Id));

    Objetivos[0].Habitos_Vinculos_Bloques = [];
    Habito_Recalcular_Bloques_Objetivo(Objetivos[0]);
    const Registros_Tras_Quitar = Habitos_Registros.filter(
      (Registro) => Registro.Fuente === "Objetivo_Bloque"
    ).length;

    return {
      menu: t("habitos.evento_menu"),
      titulo: t("habitos.evento_titulo"),
      creadorTieneVinculos: Creador_Tiene_Vinculos,
      modalMaxWidth: Modal_Max_Width,
      registrosCreados: Registros_Creados,
      registrosTrasQuitar: Registros_Tras_Quitar,
      vinculaciones: Habitos_Obtener_Vinculaciones()
        .filter((Vinculo) =>
          Vinculo.Habito_Id === "Habito_Cantidad_Objetivo"
        ).length
    };
  });

  expect(resultado.menu).toBe("Vincular hábitos");
  expect(resultado.titulo).toBe("Hábitos del bloque");
  expect(resultado.creadorTieneVinculos).toBe(true);
  expect(resultado.modalMaxWidth).toContain("820");
  expect(resultado.registrosCreados).toEqual([
    {
      Habito_Id: "Habito_Cantidad_Objetivo",
      Cantidad: 5,
      Unidad: "paginas",
      Fuente: "Objetivo_Bloque",
      Fuente_Id: "Evento_Default_Habitos",
      Hora: "18:00"
    },
    {
      Habito_Id: "Habito_Check_Objetivo",
      Cantidad: 1,
      Unidad: "",
      Fuente: "Objetivo_Bloque",
      Fuente_Id: "Evento_Default_Habitos",
      Hora: "18:00"
    },
    {
      Habito_Id: "Habito_Tiempo_Objetivo",
      Cantidad: 90,
      Unidad: "min",
      Fuente: "Objetivo_Bloque",
      Fuente_Id: "Evento_Default_Habitos",
      Hora: "18:00"
    }
  ]);
  expect(resultado.registrosTrasQuitar).toBe(0);
  expect(resultado.vinculaciones).toBe(0);
});

test("vinculo semanal con meta indenta subobjetivos", async ({
  page
}) => {
  await Preparar(page);

  const etiquetas = await page.evaluate(() => {
    const Item = {
      Tipo: "Subobjetivo",
      Objetivo: {
        Emoji: "\uD83D\uDCD8",
        Nombre: "Lecturas"
      },
      Sub: {
        Emoji: "\u2696\ufe0f",
        Texto: "Kant"
      }
    };
    return {
      normal: Meta_Aporte_Label_Item(Item),
      select: Meta_Aporte_Label_Select_Item(Item)
    };
  });

  expect(etiquetas.normal).toBe("\u2696\ufe0f Kant");
  expect(etiquetas.select).toBe("\u00a0\u00a0\u00a0\u00a0\u2696\ufe0f Kant");
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
    Config.Mostrar_Habitos_Sidebar = true;
    Config.Mostrar_Globitos_Habitos = true;
    Render_Emojis();
    const Estado_Sidebar = () => {
      const Btn = document.querySelector(
        '[data-sidebar-habito-id="Habito_Leer_Planes"]'
      );
      return {
        clase: Btn?.className || "",
        titulo: Btn?.title || "",
        indicador: Btn?.querySelector(".Sidebar_Habito_Indicador")
          ?.textContent || ""
      };
    };
    const Sidebar_Antes = Estado_Sidebar();

    Abrir_Modal_Planes_Avance("Parte|parte_habitos");
    document.getElementById("Planes_Avance_Cantidad").value = "7";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "10:00";
    document.getElementById("Planes_Avance_Hasta_Final").checked = true;
    await Guardar_Modal_Planes_Avance();
    const Sidebar_Tras_Avance = Estado_Sidebar();

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
      sidebarAntes: Sidebar_Antes,
      sidebarTrasAvance: Sidebar_Tras_Avance,
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
  expect(resultado.sidebarAntes.clase).toContain("Pendiente");
  expect(resultado.sidebarAntes.indicador).toBe("0/20 paginas");
  expect(resultado.sidebarTrasAvance.clase).toContain("En_Proceso");
  expect(resultado.sidebarTrasAvance.indicador).toBe("7/20 paginas");
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

test("deshacer avance de planes revierte habitos vinculados", async ({
  page
}) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Planes_Periodo = Planes_Modelo_Base();
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Undo_Planes",
        Nombre: "Leer undo",
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
    Config.Mostrar_Habitos_Sidebar = true;
    Config.Mostrar_Globitos_Habitos = true;

    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Objetivos.obj_undo_habitos = Normalizar_Objetivo_Plan({
      Id: "obj_undo_habitos",
      Nombre: "Lecturas undo",
      Target_Total: 7,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Subobjetivos.sub_undo_habitos =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_undo_habitos",
        Objetivo_Id: "obj_undo_habitos",
        Texto: "Libro undo",
        Target_Total: 7,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas"
      });
    Modelo.Partes.parte_undo_habitos = Normalizar_Parte_Meta({
      Id: "parte_undo_habitos",
      Objetivo_Id: "obj_undo_habitos",
      Subobjetivo_Id: "sub_undo_habitos",
      Nombre: "Capitulo undo",
      Aporte_Total: 7,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Undo_Planes",
          Cantidad_Modo: "Usar_Fuente",
          Cantidad: 1,
          Activo: true
        }
      ]
    });

    const Estado_Sidebar = () => {
      const Btn = document.querySelector(
        '[data-sidebar-habito-id="Habito_Undo_Planes"]'
      );
      return {
        clase: Btn?.className || "",
        indicador: Btn?.querySelector(".Sidebar_Habito_Indicador")
          ?.textContent || ""
      };
    };

    Render_Habitos_Sidebar();
    const Antes = Estado_Sidebar();
    Abrir_Modal_Planes_Avance("Parte|parte_undo_habitos");
    document.getElementById("Planes_Avance_Cantidad").value = "7";
    document.getElementById("Planes_Avance_Fecha").value =
      "2026-04-24";
    document.getElementById("Planes_Avance_Hora").value = "10:00";
    document.getElementById("Planes_Avance_Hasta_Final").checked = true;
    await Guardar_Modal_Planes_Avance();
    const Despues_Avance = Estado_Sidebar();
    const Registros_Tras_Avance = Habitos_Registros.length;

    Ejecutar_Ultimo_Undo();
    const Despues_Undo = Estado_Sidebar();
    const Modelo_Restaurado = Asegurar_Modelo_Planes();
    return {
      Antes,
      Despues_Avance,
      Registros_Tras_Avance,
      Despues_Undo,
      Registros_Tras_Undo: Habitos_Registros.length,
      Avances_Tras_Undo: Object.keys(Modelo_Restaurado.Avances).length
    };
  });

  expect(resultado.Antes.clase).toContain("Pendiente");
  expect(resultado.Antes.indicador).toBe("0/20 paginas");
  expect(resultado.Despues_Avance.clase).toContain("En_Proceso");
  expect(resultado.Despues_Avance.indicador).toBe("7/20 paginas");
  expect(resultado.Registros_Tras_Avance).toBe(1);
  expect(resultado.Despues_Undo.clase).toContain("Pendiente");
  expect(resultado.Despues_Undo.indicador).toBe("0/20 paginas");
  expect(resultado.Registros_Tras_Undo).toBe(0);
  expect(resultado.Avances_Tras_Undo).toBe(0);
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
      }),
      Normalizar_Habito({
        Id: "Habito_Quincenal_Sidebar",
        Nombre: "Revision quincenal",
        Emoji: "\u25D0",
        Activo: true,
        Orden: 3,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Quincena",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Mensual_Sidebar",
        Nombre: "Revision mensual",
        Emoji: "\u{1f5d3}\uFE0F",
        Activo: true,
        Orden: 4,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Mes",
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
    labels: [
      "\u{1F4C5} SEMANALES",
      "\u25D0 QUINCENALES",
      "\u{1F5D3}\uFE0F MENSUALES",
      "\u2713 DIARIOS"
    ],
    divisores: 0,
    grupos: [
      ["Habito_Semanal_Sidebar"],
      ["Habito_Quincenal_Sidebar"],
      ["Habito_Mensual_Sidebar"],
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
  const Orden_Menu_Sidebar = await page.locator(
    "#Dia_Accion_Menu [data-acc]"
  ).evaluateAll((Items) =>
    Items.map((Item) => Item.dataset.acc)
  );
  expect(Orden_Menu_Sidebar).toEqual([
    "habito-registrar-avance",
    "habito-marcar-realizado"
  ]);
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
    Cantidad: 5,
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
  const Orden_Menu_Panel = await page.locator(
    "#Dia_Accion_Menu [data-acc]"
  ).evaluateAll((Items) =>
    Items.map((Item) => Item.dataset.acc)
  );
  expect(Orden_Menu_Panel).toEqual([
    "habito-editar",
    "habito-cancelar",
    "habito-archivar"
  ]);
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

test("panel de habitos mantiene orden y alterna realizados", async ({
  page
}) => {
  await Preparar(page);

  await page.evaluate(() => {
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Primero",
        Nombre: "Primero",
        Orden: 0,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Segundo",
        Nombre: "Segundo",
        Orden: 1,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Tercero",
        Nombre: "Tercero",
        Orden: 2,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Dia",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Semanal_Vista",
        Nombre: "Semanal vista",
        Orden: 3,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Semana",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Quincenal_Vista",
        Nombre: "Quincenal vista",
        Orden: 4,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Quincena",
          Cantidad: 1
        }
      }),
      Normalizar_Habito({
        Id: "Habito_Mensual_Vista",
        Nombre: "Mensual vista",
        Orden: 5,
        Meta: {
          Modo: "Check",
          Regla: "Al_Menos",
          Periodo: "Mes",
          Cantidad: 1
        }
      })
    ];
    Habitos_Registros = [];
    Habitos_Ocultar_Realizados = false;
    Abrir_Panel_Habitos();
  });

  const orden = () => page.locator("[data-habitos-card]")
    .evaluateAll((Cards) =>
      Cards.map((Card) => Card.getAttribute("data-habitos-card"))
    );

  await expect(page.locator("#Habitos_Toggle_Realizados"))
    .toBeVisible();
  await expect(page.locator("[data-habitos-panel-modo]"))
    .toHaveCount(4);
  await expect(page.locator("#Habitos_Toggle_Realizados"))
    .toContainText("Ocultar realizados");
  await expect(page.locator("#Habitos_Cancelar"))
    .toContainText("Cerrar");
  await expect(page.locator(".Habitos_Lista_Titulo")).toHaveCount(0);
  expect(await orden()).toEqual([
    "Habito_Primero",
    "Habito_Segundo",
    "Habito_Tercero"
  ]);

  await page.click('[data-habitos-toggle="Habito_Primero"]');
  const columnas = await page.locator(
    '[data-habitos-card="Habito_Primero"] .Habitos_Card_MetaGrid'
  ).evaluate((Grid) =>
    getComputedStyle(Grid).gridTemplateColumns
      .split(" ")
      .filter(Boolean).length
  );
  expect(columnas).toBe(5);

  await page.click(
    '[data-habitos-registro-rapido="Habito_Primero"]'
  );
  expect(await orden()).toEqual([
    "Habito_Primero",
    "Habito_Segundo",
    "Habito_Tercero"
  ]);

  await page.click("#Habitos_Toggle_Realizados");
  await expect(page.locator("#Habitos_Toggle_Realizados"))
    .toContainText("Mostrar realizados");
  expect(await orden()).toEqual([
    "Habito_Segundo",
    "Habito_Tercero"
  ]);

  await page.click("#Habitos_Toggle_Realizados");
  await expect(page.locator("#Habitos_Toggle_Realizados"))
    .toContainText("Ocultar realizados");
  expect(await orden()).toEqual([
    "Habito_Primero",
    "Habito_Segundo",
    "Habito_Tercero"
  ]);

  await page.click('[data-habitos-panel-modo="Semana"]');
  expect(await orden()).toEqual(["Habito_Semanal_Vista"]);
  await page.click('[data-habitos-panel-modo="Quincena"]');
  expect(await orden()).toEqual(["Habito_Quincenal_Vista"]);
  await page.click('[data-habitos-panel-modo="Mes"]');
  expect(await orden()).toEqual(["Habito_Mensual_Vista"]);
});
