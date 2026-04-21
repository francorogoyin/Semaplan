const { test, expect } = require("@playwright/test");

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
    Contador_Eventos: 1,
    Objetivo_Seleccionada_Id: null,
    Modo_Editor_Abierto: false,
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
      Meta_Notificaciones_Activas: false,
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
        Plan_Boton: true,
        Resumen_Sem_Boton: true,
        Focus_Boton: true,
        Metas_Boton: true,
        Planear_Boton: true,
        Cerrar_Semana_Boton: true,
        Historial_Planes_Boton: true,
        Baul_Boton: true,
        Archivero_Boton: true,
        Patron_Boton: true,
        Limpiar_Semana_Boton: true,
        Ayuda_Boton: true,
        Logout_Boton: true
      },
      Version_Programa: "Test",
      Baul_Objetivos_Por_Fila: 5,
      Baul_Sombra_Estado: true,
      Baul_Vista_Modo: "Biblioteca",
      Baul_Ordenar_Por: "Personalizado",
      Baul_Agrupar_Por: "Ninguno",
      Baul_Mostrar_Archivadas: false,
      Plan_Actual: "Upgrade",
      Backup_Auto_Activo: false,
      Backup_Auto_Horas: 24,
      Backup_Auto_Inicio: "",
      Backup_Auto_Ultimo: "",
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
    Planes_Semana: {},
    Planes_Periodo: {}
  };
}

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
  await page.addInitScript((estadoInicial) => {
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
      JSON.stringify(estadoInicial)
    );
  }, Crear_Estado_Base());

  await page.goto("/index.html");
  await page.waitForFunction(() => typeof window.Inicializar === "function");
  await page.evaluate(() => {
    document.getElementById("Auth_Overlay")
      ?.classList.remove("Activo");
    document.getElementById("App_Loader")
      ?.classList.add("Oculto");
    window.Inicializar();
  });
}

test("Partes registran, revierten e importan sin duplicar",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);

  const resultado = await page.evaluate(() => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_libros = Normalizar_Objetivo_Plan({
      Id: "obj_libros",
      Periodo_Id: "p2026",
      Emoji: "\uD83D\uDCDA",
      Nombre: "Libros",
      Target_Total: 120,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_libro = Normalizar_Subobjetivo_Plan({
      Id: "sub_libro",
      Objetivo_Id: "obj_libros",
      Emoji: "\uD83D\uDCD6",
      Texto: "Libro de prueba",
      Target_Total: 120,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Partes.parte_1 = Normalizar_Parte_Meta({
      Id: "parte_1",
      Objetivo_Id: "obj_libros",
      Subobjetivo_Id: "sub_libro",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Capitulo 1",
      Aporte_Total: 40,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Partes.parte_2 = Normalizar_Parte_Meta({
      Id: "parte_2",
      Objetivo_Id: "obj_libros",
      Subobjetivo_Id: "sub_libro",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Capitulo 2",
      Aporte_Total: 25,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 1
    });

    const Parte_1 = Modelo.Partes.parte_1;
    Planes_Upsert_Avance_Parte(
      Parte_1,
      5,
      "Parte_Meta_Manual",
      Parte_1.Id,
      { Solo_Modelo: true }
    );
    Planes_Recalcular_Parte_Y_Meta(Parte_1, Modelo);
    const Parcial = {
      parte: Planes_Progreso_Total_Parte(Parte_1, Modelo),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo.Subobjetivos.sub_libro,
        Modelo
      )
    };

    const Debug_Antes = {
      cantidad: Planes_Cantidad_Auto_Realizada_Parte(
        Parte_1,
        "Parte_Meta",
        Parte_1.Id,
        Modelo
      ),
      maximo: Planes_Maximo_Registrable_Parte(
        Parte_1.Id,
        "Parte_Meta",
        Parte_1.Id,
        Modelo
      )
    };
    const Marcar_1 = Planes_Marcar_Parte_Realizada(Parte_1.Id);
    const Marcar_2 = Planes_Marcar_Parte_Realizada(Parte_1.Id);
    const Modelo_Realizada = Asegurar_Modelo_Planes();
    const Parte_1_Realizada = Modelo_Realizada.Partes.parte_1;
    const Avances_Parte_1 = Planes_Avances_De_Parte(
      Parte_1.Id,
      Modelo_Realizada
    );
    const Auto = Avances_Parte_1.find(
      (Avance) => Avance.Origen_Tipo === "Parte_Meta"
    );
    const Despues_Realizada = {
      parte: Planes_Progreso_Total_Parte(
        Parte_1_Realizada,
        Modelo_Realizada
      ),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo_Realizada.Subobjetivos.sub_libro,
        Modelo_Realizada
      ),
      auto: Number(Auto?.Cantidad) || 0,
      autos: Avances_Parte_1.filter(
        (Avance) => Avance.Origen_Tipo === "Parte_Meta"
      ).length
    };

    Planes_Desmarcar_Parte_Realizada(Parte_1.Id);
    const Modelo_Desmarcada = Asegurar_Modelo_Planes();
    const Parte_1_Desmarcada = Modelo_Desmarcada.Partes.parte_1;
    const Despues_Desmarcar = {
      parte: Planes_Progreso_Total_Parte(
        Parte_1_Desmarcada,
        Modelo_Desmarcada
      ),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo_Desmarcada.Subobjetivos.sub_libro,
        Modelo_Desmarcada
      ),
      manuales: Planes_Avances_De_Parte(
        Parte_1.Id,
        Modelo_Desmarcada
      )
        .filter((Avance) =>
          Avance.Origen_Tipo === "Parte_Meta_Manual"
        ).length,
      autos: Planes_Avances_De_Parte(
        Parte_1.Id,
        Modelo_Desmarcada
      )
        .filter((Avance) =>
          Avance.Origen_Tipo === "Parte_Meta"
        ).length
    };

    const Clave_Semana = Clave_Semana_Actual();
    const Semanal = Crear_Objetivo_Semanal_Con_Datos({
      Nombre: "Leer libro",
      Descripcion_Corta: "",
      Emoji: "\uD83D\uDCD6",
      Color: "#1f6b4f",
      Es_Bolsa: false,
      Horas_Semanales: 0,
      Categoria_Id: null,
      Etiquetas_Ids: [],
      Meta_Vinculo_Tipo: "Subobjetivo",
      Meta_Vinculo_Id: "sub_libro",
      Meta_Aporte_Semanal: 0,
      Meta_Aporte_Unidad: "paginas"
    }, Clave_Semana);
    Abrir_Modal_Importar_Partes_Meta(Semanal.Id);
    document.querySelector(
      '[data-parte-importar-id="parte_2"]'
    ).checked = true;
    Importar_Partes_Meta_A_Semana();
    const Subs = Obtener_Subobjetivos_Semana(
      Semanal,
      true,
      Clave_Semana
    );
    const Sub_Parte = Subs.find((Sub) =>
      Sub.Parte_Meta_Id === "parte_2"
    );
    Sub_Parte.Hecha = true;
    Semana_Sync_Avance_Parte_Subobjetivo(
      Semanal,
      Sub_Parte,
      true
    );
    Semana_Sync_Avance_Parte_Subobjetivo(
      Semanal,
      Sub_Parte,
      true
    );
    const Modelo_Semana = Asegurar_Modelo_Planes();
    const Avances_Semana = Planes_Avances_De_Parte(
      "parte_2",
      Modelo_Semana
    ).filter((Avance) =>
      Avance.Origen_Tipo === "Semana_Parte"
    );
    Sub_Parte.Hecha = false;
    Semana_Sync_Avance_Parte_Subobjetivo(
      Semanal,
      Sub_Parte,
      false
    );
    const Modelo_Semana_Final = Asegurar_Modelo_Planes();
    const Avances_Semana_Finales = Planes_Avances_De_Parte(
      "parte_2",
      Modelo_Semana_Final
    ).filter((Avance) =>
      Avance.Origen_Tipo === "Semana_Parte"
    );

    return {
      parcial: Parcial,
      despuesRealizada: Despues_Realizada,
      despuesDesmarcar: Despues_Desmarcar,
      importadas: Subs.length,
      parteImportada: {
        parteId: Sub_Parte?.Parte_Meta_Id,
        nombre: Sub_Parte?.Texto,
        aporte: Sub_Parte?.Aporte_Total
      },
      avanceSemana: {
        cantidad: Number(Avances_Semana[0]?.Cantidad) || 0,
        registros: Avances_Semana.length,
        finales: Avances_Semana_Finales.length
      },
      debug: { antes: Debug_Antes, marcar1: Marcar_1, marcar2: Marcar_2 }
    };
  });

  await page.evaluate(() => {
    Abrir_Modal_Planes_Partes("sub_libro");
  });
  const Parte_Item = page.locator(
    "#Planes_Partes_Lista .Planes_Parte"
  ).first();
  await expect(Parte_Item).toBeVisible();
  const Estilos_Parte = await Parte_Item.evaluate((El) => {
    const Estilos = getComputedStyle(El);
    return {
      background: Estilos.backgroundColor,
      borderBottom: Estilos.borderBottomWidth,
      borderRadius: Estilos.borderRadius,
      borderTop: Estilos.borderTopWidth
    };
  });
  expect(Estilos_Parte).toEqual({
    background: "rgba(0, 0, 0, 0)",
    borderBottom: "1px",
    borderRadius: "0px",
    borderTop: "0px"
  });
  await expect(
    Parte_Item.locator('[data-parte-accion="editar"]')
  ).toBeHidden();
  await Parte_Item.locator("[data-parte-menu]").click();
  await expect(
    Parte_Item.locator('[data-parte-accion="editar"]')
  ).toBeVisible();
  await page.mouse.click(20, 20);
  await expect(
    Parte_Item.locator('[data-parte-accion="editar"]')
  ).toBeHidden();

  expect(errores).toEqual([]);
  expect(resultado.parcial).toEqual({ parte: 5, sub: 5 });
  expect(resultado.debug).toEqual({
    antes: { cantidad: 35, maximo: 35 },
    marcar1: true,
    marcar2: true
  });
  expect(resultado.despuesRealizada).toEqual({
    parte: 40,
    sub: 40,
    auto: 35,
    autos: 1
  });
  expect(resultado.despuesDesmarcar).toEqual({
    parte: 5,
    sub: 5,
    manuales: 1,
    autos: 0
  });
  expect(resultado.importadas).toBe(1);
  expect(resultado.parteImportada).toEqual({
    parteId: "parte_2",
    nombre: "Capitulo 2",
    aporte: 25
  });
  expect(resultado.avanceSemana).toEqual({
    cantidad: 25,
    registros: 1,
    finales: 0
  });
});
