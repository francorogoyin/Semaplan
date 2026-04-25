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

test("Partes editan fechas dentro del rango del subobjetivo",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Lecturas",
      Target_Total: 10,
      Unidad: "Horas",
      Unidad_Subobjetivos_Default: "Horas"
    });
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro"
    );
    Planes_Actualizar_Subobjetivo_Datos(Sub_Id, {
      Target_Total: 10,
      Unidad: "Horas",
      Fecha_Inicio: "2026-03-01",
      Fecha_Objetivo: "2026-05-31"
    });
    Abrir_Modal_Planes_Partes(Sub_Id);
    Abrir_Modal_Planes_Parte_Nueva();
    const Inicio = document.getElementById("Planes_Parte_Fecha_Inicio");
    const Objetivo_Fecha = document.getElementById(
      "Planes_Parte_Fecha_Objetivo"
    );
    const Limites = {
      inicioMin: Inicio.min,
      inicioMax: Inicio.max,
      inicioValor: Inicio.value,
      objetivoMin: Objetivo_Fecha.min,
      objetivoMax: Objetivo_Fecha.max,
      objetivoValor: Objetivo_Fecha.value,
      tieneAvanceParcial: Boolean(
        document.getElementById("Planes_Parte_Avance_Parcial")
      ),
      tieneEstado: Boolean(
        document.getElementById("Planes_Parte_Estado")
      )
    };
    document.getElementById("Planes_Parte_Nombre").value =
      "Capitulo";
    document.getElementById("Planes_Parte_Aporte_Total").value = "1";
    Inicio.value = "2026-05-25";
    Objetivo_Fecha.value = "2026-05-20";
    await Guardar_Modal_Planes_Parte();
    const Tras_Invertida = Object.values(
      Asegurar_Modelo_Planes().Partes || {}
    )
      .filter((Parte) => Parte.Subobjetivo_Id === Sub_Id)
      .length;
    Inicio.value = "2026-03-10";
    Objetivo_Fecha.value = "2026-06-01";
    await Guardar_Modal_Planes_Parte();
    const Tras_Fuera = Object.values(
      Asegurar_Modelo_Planes().Partes || {}
    )
      .filter((Parte) => Parte.Subobjetivo_Id === Sub_Id)
      .length;
    Objetivo_Fecha.value = "2026-05-20";
    await Guardar_Modal_Planes_Parte();
    const Partes = Object.values(Asegurar_Modelo_Planes().Partes || {})
      .filter((Parte) => Parte.Subobjetivo_Id === Sub_Id);
    return {
      Limites,
      Tras_Invertida,
      Tras_Fuera,
      Partes: Partes.map((Parte) => ({
        nombre: Parte.Nombre,
        inicio: Parte.Fecha_Inicio,
        objetivo: Parte.Fecha_Objetivo
      }))
    };
  });

  expect(Resultado.Limites).toEqual({
    inicioMin: "2026-03-01",
    inicioMax: "2026-05-31",
    inicioValor: "",
    objetivoMin: "2026-03-01",
    objetivoMax: "2026-05-31",
    objetivoValor: "",
    tieneAvanceParcial: false,
    tieneEstado: false
  });
  expect(Resultado.Tras_Invertida).toBe(0);
  expect(Resultado.Tras_Fuera).toBe(0);
  expect(Resultado.Partes).toEqual([
    {
      nombre: "Capitulo",
      inicio: "2026-03-10",
      objetivo: "2026-05-20"
    }
  ]);
  expect(errores).toEqual([]);
});

test("Partes sincronizan target por suma y piden confirmar exceso manual",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(async () => {
    Abrir_Plan();
    let Modelo = Asegurar_Jerarquia_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_features = Normalizar_Objetivo_Plan({
      Id: "obj_features",
      Periodo_Id: "p2026",
      Emoji: "\uD83D\uDCCC",
      Nombre: "Producto",
      Target_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "features",
      Unidad_Subobjetivos_Default: "Personalizado",
      Unidad_Subobjetivos_Custom_Default: "features",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_features = Normalizar_Subobjetivo_Plan({
      Id: "sub_features",
      Objetivo_Id: "obj_features",
      Emoji: "\uD83D\uDCCC",
      Texto: "Semaplan",
      Target_Total: 3,
      Target_Suma_Componentes: true,
      Unidad: "Personalizado",
      Unidad_Custom: "features",
      Orden: 0
    });
    Modelo.Partes.parte_feature_1 = Normalizar_Parte_Meta({
      Id: "parte_feature_1",
      Objetivo_Id: "obj_features",
      Subobjetivo_Id: "sub_features",
      Emoji: "\uD83D\uDCCC",
      Nombre: "Feature uno",
      Aporte_Total: 1,
      Unidad: "Personalizado",
      Unidad_Custom: "features",
      Orden: 0
    });
    Modelo.Partes.parte_feature_2 = Normalizar_Parte_Meta({
      Id: "parte_feature_2",
      Objetivo_Id: "obj_features",
      Subobjetivo_Id: "sub_features",
      Emoji: "\uD83D\uDCCC",
      Nombre: "Feature dos",
      Aporte_Total: 2,
      Unidad: "Personalizado",
      Unidad_Custom: "features",
      Orden: 1
    });

    Abrir_Modal_Planes_Partes("sub_features");
    Abrir_Modal_Planes_Parte("parte_feature_2");
    document.getElementById("Planes_Parte_Aporte_Total").value = "4";
    await Guardar_Modal_Planes_Parte();
    Modelo = Asegurar_Modelo_Planes();
    const Tras_Editar_Alineado =
      Modelo.Subobjetivos.sub_features.Target_Total;

    Modelo.Subobjetivos.sub_features.Target_Total = 10;
    Modelo.Subobjetivos.sub_features.Target_Suma_Componentes = false;
    const Total_Antes_Manual =
      Planes_Total_Aporte_Partes_Subobjetivo(
        "sub_features",
        Modelo
      );
    Modelo.Partes.parte_feature_1.Aporte_Total = 2;
    Planes_Sincronizar_Target_Subobjetivo_Desde_Partes(
      "sub_features",
      Total_Antes_Manual,
      Modelo
    );
    const Tras_Editar_Manual =
      Modelo.Subobjetivos.sub_features.Target_Total;

    Modelo.Subobjetivos.sub_features.Target_Total = 5;
    const Dialogos = [];
    const Mostrar_Original = Mostrar_Dialogo;
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(Mensaje);
      return false;
    };
    Abrir_Modal_Planes_Parte("parte_feature_2");
    document.getElementById("Planes_Parte_Aporte_Total").value = "6";
    await Guardar_Modal_Planes_Parte();
    Modelo = Asegurar_Modelo_Planes();
    const Tras_Cancelar_Exceso = {
      target: Modelo.Subobjetivos.sub_features.Target_Total,
      aporte: Modelo.Partes.parte_feature_2.Aporte_Total,
      input: document.getElementById(
        "Planes_Parte_Aporte_Total"
      ).value,
      modal: document.getElementById("Planes_Parte_Overlay")
        .classList.contains("Activo")
    };
    Mostrar_Dialogo = async (Mensaje) => {
      Dialogos.push(Mensaje);
      return true;
    };
    document.getElementById("Planes_Parte_Aporte_Total").value = "6";
    await Guardar_Modal_Planes_Parte();
    Mostrar_Dialogo = Mostrar_Original;
    Modelo = Asegurar_Modelo_Planes();
    const Tras_Aceptar_Exceso = {
      target: Modelo.Subobjetivos.sub_features.Target_Total,
      aporte: Modelo.Partes.parte_feature_2.Aporte_Total
    };

    Modelo.Subobjetivos.sub_features.Target_Total =
      Planes_Total_Aporte_Partes_Subobjetivo(
        "sub_features",
        Modelo
      );
    Modelo.Subobjetivos.sub_features.Target_Suma_Componentes = true;
    const Total_Antes_Eliminar =
      Planes_Total_Aporte_Partes_Subobjetivo(
        "sub_features",
        Modelo
      );
    delete Modelo.Partes.parte_feature_1;
    Planes_Sincronizar_Target_Subobjetivo_Desde_Partes(
      "sub_features",
      Total_Antes_Eliminar,
      Modelo
    );

    return {
      Tras_Editar_Alineado,
      Tras_Editar_Manual,
      Tras_Cancelar_Exceso,
      Tras_Aceptar_Exceso,
      Dialogos,
      Tras_Eliminar_Alineado:
        Modelo.Subobjetivos.sub_features.Target_Total,
      Partes: Planes_Partes_De_Subobjetivo(
        "sub_features",
        Modelo
      ).map((Parte) => ({
        nombre: Parte.Nombre,
        aporte: Parte.Aporte_Total
      }))
    };
  });

  expect(Resultado.Tras_Editar_Alineado).toBe(5);
  expect(Resultado.Tras_Editar_Manual).toBe(10);
  expect(Resultado.Tras_Cancelar_Exceso).toEqual({
    target: 5,
    aporte: 4,
    input: "4",
    modal: true
  });
  expect(Resultado.Tras_Aceptar_Exceso).toEqual({
    target: 8,
    aporte: 6
  });
  expect(Resultado.Dialogos.join(" ")).toContain("excediendo");
  expect(Resultado.Tras_Eliminar_Alineado).toBe(6);
  expect(Resultado.Partes).toEqual([
    { nombre: "Feature dos", aporte: 6 }
  ]);
  expect(errores).toEqual([]);
});

test("Parte realizada muestra fecha final calculada y bloquea fechas",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const Resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    const Anio = Planes_Crear_Periodo(
      Modelo,
      "Anio",
      "2026-01-01",
      "2026-12-31",
      null,
      2026
    );
    const Objetivo = Planes_Crear_Objetivo_Silencioso(Anio.Id, {
      Nombre: "Lecturas",
      Target_Total: 10,
      Unidad: "Horas",
      Unidad_Subobjetivos_Default: "Horas"
    });
    const Sub_Id = Planes_Agregar_Subobjetivo(
      Objetivo.Id,
      "Libro"
    );
    const M = Asegurar_Modelo_Planes();
    const Parte = Normalizar_Parte_Meta({
      Id: "parte_fecha_final",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Id,
      Emoji: "\uD83D\uDCD6",
      Nombre: "Capitulo",
      Aporte_Total: 3,
      Unidad: "Horas",
      Fecha_Inicio: "2026-03-01",
      Fecha_Objetivo: "2026-05-31"
    });
    M.Partes[Parte.Id] = Parte;
    M.Avances.av_parte_fecha_final = Normalizar_Avance_Plan({
      Id: "av_parte_fecha_final",
      Objetivo_Id: Objetivo.Id,
      Subobjetivo_Id: Sub_Id,
      Parte_Id: Parte.Id,
      Fuente: "Subobjetivo",
      Cantidad: 3,
      Unidad: "Horas",
      Fecha: "2026-04-20",
      Hora: "11:15"
    });
    Planes_Recalcular_Progreso_Parte(Parte, M);
    Planes_Partes_Subobjetivo_Id = Sub_Id;
    Abrir_Modal_Planes_Parte(Parte.Id);
    const Inicio = document.getElementById(
      "Planes_Parte_Fecha_Inicio"
    );
    const Objetivo_Fecha = document.getElementById(
      "Planes_Parte_Fecha_Objetivo"
    );
    const Final = document.getElementById("Planes_Parte_Fecha_Fin");
    const Campo_Final = Final.closest(
      ".Planes_Parte_Fecha_Fin_Campo"
    );
    const Campo_Inicio = Inicio.closest(
      ".Planes_Parte_Fecha_Ini_Campo"
    );
    const Campo_Objetivo = Objetivo_Fecha.closest(
      ".Planes_Parte_Fecha_Obj_Campo"
    );
    const Rect_Inicio = Campo_Inicio.getBoundingClientRect();
    const Rect_Objetivo = Campo_Objetivo.getBoundingClientRect();
    const Rect_Final = Campo_Final.getBoundingClientRect();
    const Realizada = {
      inicioDisabled: Inicio.disabled,
      objetivoDisabled: Objetivo_Fecha.disabled,
      finalVisible: !Campo_Final.hidden,
      finalValor: Final.value,
      formConFechaFinal: document
        .getElementById("Planes_Parte_Form")
        .classList.contains("Con_Fecha_Final"),
      fechasMismaLinea:
        Math.abs(Rect_Inicio.top - Rect_Objetivo.top) < 2 &&
        Math.abs(Rect_Inicio.top - Rect_Final.top) < 2
    };
    Cerrar_Modal_Planes_Parte();
    delete M.Avances.av_parte_fecha_final;
    Planes_Recalcular_Progreso_Parte(Parte, M);
    Abrir_Modal_Planes_Parte(Parte.Id);
    const Abierta = {
      inicioDisabled: Inicio.disabled,
      objetivoDisabled: Objetivo_Fecha.disabled,
      finalVisible: !Campo_Final.hidden,
      finalValor: Final.value,
      fechaFinModelo: Parte.Fecha_Fin || "",
      formConFechaFinal: document
        .getElementById("Planes_Parte_Form")
        .classList.contains("Con_Fecha_Final")
    };
    return { Realizada, Abierta };
  });

  expect(Resultado).toEqual({
    Realizada: {
      inicioDisabled: true,
      objetivoDisabled: true,
      finalVisible: true,
      finalValor: "2026-04-20",
      formConFechaFinal: true,
      fechasMismaLinea: true
    },
    Abierta: {
      inicioDisabled: false,
      objetivoDisabled: false,
      finalVisible: false,
      finalValor: "",
      fechaFinModelo: "",
      formConFechaFinal: false
    }
  });
  expect(errores).toEqual([]);
});

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
      '[data-parte-importar-id="parte_1"]'
    ).checked = true;
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

    Eventos.push(Meta_Aporte_Preparar_Evento({
      Id: "evento_partes",
      Objetivo_Id: Semanal.Id,
      Fecha: "2026-04-13",
      Inicio: 10,
      Duracion: 1,
      Hecho: false,
      Color: "#1f6b4f"
    }, Semanal));
    const Evento = Evento_Por_Id("evento_partes");
    Evento.Meta_Aporte_Cantidad = 10;
    Evento.Meta_Aporte_Unidad = "paginas";
    Evento.Meta_Aporte_Tildado = true;
    Evento.Meta_Aporte_Planeado = true;
    Evento.Meta_Aporte_Distribucion = [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 6 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 4 }
    ];
    Evento.Meta_Aporte_Distribucion_Manual = true;
    const Distribucion_Valida =
      Meta_Aporte_Validar_Distribucion_Evento(Evento, false);
    Evento.Hecho = true;
    const Upsert_1 = Meta_Aporte_Upsert_Avance_Evento(Evento);
    const Avance_1 = Meta_Aporte_Buscar_Avance_Evento(Evento);
    const Modelo_Bloque_1 = Asegurar_Modelo_Planes();
    const Progreso_Bloque_1 = {
      parte1: Planes_Progreso_Total_Parte(
        Modelo_Bloque_1.Partes.parte_1,
        Modelo_Bloque_1
      ),
      parte2: Planes_Progreso_Total_Parte(
        Modelo_Bloque_1.Partes.parte_2,
        Modelo_Bloque_1
      ),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo_Bloque_1.Subobjetivos.sub_libro,
        Modelo_Bloque_1
      ),
      distribucion: Avance_1.Distribucion
    };

    Evento.Meta_Aporte_Distribucion = [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 1 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 1 }
    ];
    const Upsert_2 = Meta_Aporte_Upsert_Avance_Evento(Evento);
    const Avance_2 = Meta_Aporte_Buscar_Avance_Evento(Evento);
    const Modelo_Bloque_2 = Asegurar_Modelo_Planes();
    const Progreso_Bloque_2 = {
      parte1: Planes_Progreso_Total_Parte(
        Modelo_Bloque_2.Partes.parte_1,
        Modelo_Bloque_2
      ),
      parte2: Planes_Progreso_Total_Parte(
        Modelo_Bloque_2.Partes.parte_2,
        Modelo_Bloque_2
      ),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo_Bloque_2.Subobjetivos.sub_libro,
        Modelo_Bloque_2
      ),
      distribucion: Avance_2.Distribucion
    };

    Evento.Meta_Aporte_Cantidad = 10;
    Evento.Meta_Aporte_Distribucion = [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 6 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 5 }
    ];
    const Invalida_Suma =
      Meta_Aporte_Validar_Distribucion_Evento(Evento, false);
    Evento.Meta_Aporte_Cantidad = 40;
    Evento.Meta_Aporte_Distribucion = [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 36 }
    ];
    const Invalida_Maximo =
      Meta_Aporte_Validar_Distribucion_Evento(Evento, false);
    const Borro_Bloque = Meta_Aporte_Eliminar_Avance_Evento(Evento);
    const Modelo_Revertido = Asegurar_Modelo_Planes();
    const Progreso_Revertido = {
      parte1: Planes_Progreso_Total_Parte(
        Modelo_Revertido.Partes.parte_1,
        Modelo_Revertido
      ),
      parte2: Planes_Progreso_Total_Parte(
        Modelo_Revertido.Partes.parte_2,
        Modelo_Revertido
      ),
      sub: Planes_Progreso_Total_Subobjetivo(
        Modelo_Revertido.Subobjetivos.sub_libro,
        Modelo_Revertido
      )
    };
    Evento.Hecho = false;
    Evento.Meta_Aporte_Cantidad = 10;
    Evento.Meta_Aporte_Distribucion = [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 5 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 5 }
    ];
    Evento.Meta_Aporte_Distribucion_Manual = false;

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
      bloque: {
        valida: Distribucion_Valida,
        upsert1: Upsert_1,
        upsert2: Upsert_2,
        progreso1: Progreso_Bloque_1,
        progreso2: Progreso_Bloque_2,
        invalidaSuma: Invalida_Suma,
        invalidaMaximo: Invalida_Maximo,
        borro: Borro_Bloque,
        revertido: Progreso_Revertido
      },
      debug: { antes: Debug_Antes, marcar1: Marcar_1, marcar2: Marcar_2 }
    };
  });

  await page.evaluate(() => {
    Abrir_Modal_Abordaje("evento_partes");
  });
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Destinos")
  ).toBeVisible();
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_Destino")
  ).toHaveCount(2);
  await expect(
    page.locator("#Abordaje_Modal_Cuerpo .Aporte_Meta_General")
  ).toContainText("Aporte general");
  await page.evaluate(() => Cerrar_Modal_Abordaje());
  const focusDistribucion = await page.evaluate(() => {
    const Cuerpo = document.createElement("div");
    document.body.appendChild(Cuerpo);
    Render_Aporte_Meta_Focus(Cuerpo, Evento_Por_Id("evento_partes"));
    const Datos = {
      destinos: Cuerpo.querySelectorAll(".Aporte_Meta_Destino").length,
      confirmar: Boolean(
        Cuerpo.querySelector(".Aporte_Meta_Confirmar")
      ),
      general: Cuerpo.querySelector(".Aporte_Meta_General")
        ?.textContent || ""
    };
    Cuerpo.remove();
    return Datos;
  });
  expect(focusDistribucion).toEqual({
    destinos: 2,
    confirmar: true,
    general: "Aporte general: 0 paginas"
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
    page.locator(".Planes_Parte_Menu_Flotante")
  ).toHaveCount(0);
  await Parte_Item.locator("[data-parte-menu]").click();
  await expect(
    page.locator(
      '.Planes_Parte_Menu_Flotante [data-parte-accion="editar"]'
    )
  ).toBeVisible();
  const Menu_Flotante = await page.locator(
    ".Planes_Parte_Menu_Flotante"
  ).evaluate((El) => {
    const Estilos = getComputedStyle(El);
    return {
      parent: El.parentElement?.tagName,
      position: Estilos.position,
      zIndex: Number(Estilos.zIndex)
    };
  });
  expect(Menu_Flotante).toEqual({
    parent: "BODY",
    position: "fixed",
    zIndex: 10030
  });
  await page.mouse.click(20, 20);
  await expect(
    page.locator(".Planes_Parte_Menu_Flotante")
  ).toHaveCount(0);

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
  expect(resultado.importadas).toBe(2);
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
  expect(resultado.bloque.valida).toBeTruthy();
  expect(resultado.bloque.upsert1).toBeTruthy();
  expect(resultado.bloque.upsert2).toBeTruthy();
  expect(resultado.bloque.progreso1).toEqual({
    parte1: 11,
    parte2: 4,
    sub: 15,
    distribucion: [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 6 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 4 },
      { Tipo: "General", Parte_Id: "", Cantidad: 0 }
    ]
  });
  expect(resultado.bloque.progreso2).toEqual({
    parte1: 6,
    parte2: 1,
    sub: 15,
    distribucion: [
      { Tipo: "Parte", Parte_Id: "parte_1", Cantidad: 1 },
      { Tipo: "Parte", Parte_Id: "parte_2", Cantidad: 1 },
      { Tipo: "General", Parte_Id: "", Cantidad: 8 }
    ]
  });
  expect(resultado.bloque.invalidaSuma).toBeFalsy();
  expect(resultado.bloque.invalidaMaximo).toBeFalsy();
  expect(resultado.bloque.borro).toBeTruthy();
  expect(resultado.bloque.revertido).toEqual({
    parte1: 5,
    parte2: 0,
    sub: 5
  });
});

test("Administradores restauran marcado realizado con partes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const resultado = await page.evaluate(async () => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_menus = Normalizar_Objetivo_Plan({
      Id: "obj_menus",
      Periodo_Id: "p2026",
      Emoji: "\uD83D\uDCDA",
      Nombre: "Libros",
      Target_Total: 105,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_parte = Normalizar_Subobjetivo_Plan({
      Id: "sub_parte",
      Objetivo_Id: "obj_menus",
      Emoji: "\uD83D\uDCD6",
      Texto: "Libro parcial",
      Target_Total: 40,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Fecha_Inicio: "2026-04-01",
      Fecha_Objetivo: "2026-06-15",
      Orden: 0
    });
    Modelo.Partes.parte_menu_1 = Normalizar_Parte_Meta({
      Id: "parte_menu_1",
      Objetivo_Id: "obj_menus",
      Subobjetivo_Id: "sub_parte",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Capitulo unico",
      Aporte_Total: 40,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Partes.parte_menu_2 = Normalizar_Parte_Meta({
      Id: "parte_menu_2",
      Objetivo_Id: "obj_menus",
      Subobjetivo_Id: "sub_parte",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Capitulo pendiente",
      Aporte_Total: 20,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 1
    });
    Modelo.Subobjetivos.sub_con_partes =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_con_partes",
        Objetivo_Id: "obj_menus",
        Emoji: "\uD83D\uDCD8",
        Texto: "Libro con partes",
        Target_Total: 65,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas",
        Orden: 1
      });
    Modelo.Subobjetivos.sub_menu_abierto =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_menu_abierto",
        Objetivo_Id: "obj_menus",
        Emoji: "\uD83D\uDCD9",
        Texto: "Libro abierto",
        Target_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas",
        Fecha_Inicio: "2026-04-01",
        Fecha_Objetivo: "2026-06-15",
        Orden: 2
      });
    Modelo.Partes.parte_menu_3 = Normalizar_Parte_Meta({
      Id: "parte_menu_3",
      Objetivo_Id: "obj_menus",
      Subobjetivo_Id: "sub_con_partes",
      Emoji: "\uD83D\uDCD8",
      Nombre: "Parte uno",
      Aporte_Total: 30,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 0
    });
    Modelo.Partes.parte_menu_4 = Normalizar_Parte_Meta({
      Id: "parte_menu_4",
      Objetivo_Id: "obj_menus",
      Subobjetivo_Id: "sub_con_partes",
      Emoji: "\uD83D\uDCD8",
      Nombre: "Parte dos",
      Aporte_Total: 35,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Orden: 1
    });

    const Capturar_Dialogo = async (Accion) => {
      const Original = Mostrar_Dialogo;
      let Mensaje = "";
      Mostrar_Dialogo = async (Texto) => {
        Mensaje = Texto;
        return true;
      };
      try {
        const Ok = await Accion();
        return { Ok, Mensaje };
      } finally {
        Mostrar_Dialogo = Original;
      }
    };

    const Parte = await Capturar_Dialogo(() =>
      Planes_Marcar_Parte_Como_Realizada("parte_menu_1")
    );
    const Sub = await Capturar_Dialogo(() =>
      Planes_Marcar_Subobjetivo_Como_Realizado(
        "sub_con_partes",
        "obj_menus"
      )
    );

    Abrir_Modal_Planes_Subobjetivos("obj_menus");
    const Alto_Subobjetivos = Math.round(
      document.querySelector(
        "#Planes_Subobjetivos_Overlay .Patron_Modal_Panel"
      ).getBoundingClientRect().height
    );
    const Subtitulos_Subobjetivo = document.querySelectorAll(
      "#Planes_Subobjetivos_Lista .Planes_Subobjetivo:first-child " +
      ".Planes_Subobjetivo_Meta"
    ).length;
    const Detalle_Subobjetivo = Array.from(document.querySelectorAll(
      "#Planes_Subobjetivos_Lista " +
      '[data-plan-subobjetivo-id="sub_menu_abierto"] ' +
      ".Planes_Subobjetivo_Meta"
    ))[1]?.textContent.trim() || "";
    const Sticky_Subobjetivos = getComputedStyle(
      document.querySelector(
        "#Planes_Subobjetivos_Overlay " +
        ".Planes_Subobjetivos_Filtros"
      )
    ).position;
    Abrir_Modal_Planes_Partes("sub_parte");
    const Alto_Partes = Math.round(
      document.querySelector(
        "#Planes_Partes_Overlay .Patron_Modal_Panel"
      ).getBoundingClientRect().height
    );
    const Sticky_Partes = getComputedStyle(
      document.querySelector(
        "#Planes_Partes_Overlay .Planes_Subobjetivos_Filtros"
      )
    ).position;
    const Capturar_Layout = (Selector, Nombre_Selector) => {
      const Item = document.querySelector(Selector);
      const Nombre = Item?.querySelector(Nombre_Selector);
      const Estilo = getComputedStyle(Item);
      const Estilo_Nombre = getComputedStyle(Nombre);
      return {
        columnas: Estilo.gridTemplateColumns
          .split(" ")
          .filter(Boolean).length,
        gap: Estilo.columnGap,
        alignItems: Estilo.alignItems,
        paddingTop: Estilo.paddingTop,
        paddingBottom: Estilo.paddingBottom,
        bordeInferior: Estilo.borderBottomWidth,
        nombrePeso: Estilo_Nombre.fontWeight,
        nombreTamanio: Estilo_Nombre.fontSize
      };
    };
    const Capturar_Controles = (Selector) => {
      const Items = Array.from(document.querySelectorAll(
        `${Selector} .Planes_Subobjetivos_Filtros ` +
        "> .Planes_Subobjetivos_Filtro"
      ));
      const Anchos = Items.map((Item) =>
        Math.round(Item.getBoundingClientRect().width)
      );
      const Controles_Llenos = Items.every((Item) => {
        const Control = Item.querySelector("select, input, button");
        if (!Control) return false;
        const Ancho_Item = Math.round(
          Item.getBoundingClientRect().width
        );
        const Ancho_Control = Math.round(
          Control.getBoundingClientRect().width
        );
        return Math.abs(Ancho_Item - Ancho_Control) <= 1;
      });
      return {
        cantidad: Items.length,
        diferenciaAnchos: Math.max(...Anchos) - Math.min(...Anchos),
        controlesLlenos: Controles_Llenos
      };
    };
    const Layout_Subobjetivo = Capturar_Layout(
      "#Planes_Subobjetivos_Lista .Planes_Subobjetivo",
      ".Planes_Subobjetivo_Nombre"
    );
    const Layout_Parte = Capturar_Layout(
      "#Planes_Partes_Lista .Planes_Parte",
      ".Planes_Parte_Nombre"
    );
    const Modelo_Final = Asegurar_Modelo_Planes();

    return {
      parte: {
        ok: Parte.Ok,
        mensaje: Parte.Mensaje,
        progreso: Planes_Progreso_Total_Parte(
          Modelo_Final.Partes.parte_menu_1,
          Modelo_Final
        ),
        estado: Planes_Estado_Calculado_Parte(
          Modelo_Final.Partes.parte_menu_1,
          Modelo_Final
        )
      },
      sub: {
        ok: Sub.Ok,
        mensaje: Sub.Mensaje,
        progreso: Planes_Progreso_Total_Subobjetivo(
          Modelo_Final.Subobjetivos.sub_con_partes,
          Modelo_Final
        ),
        estado: Planes_Estado_Normalizado_Subobjetivo(
          Modelo_Final.Subobjetivos.sub_con_partes
        ),
        partesRealizadas: [
          Modelo_Final.Partes.parte_menu_3,
          Modelo_Final.Partes.parte_menu_4
        ].filter((Parte_Item) =>
          Planes_Estado_Calculado_Parte(
            Parte_Item,
            Modelo_Final
          ) === "Realizada"
        ).length
      },
      sticky: {
        subobjetivos: Sticky_Subobjetivos,
        partes: Sticky_Partes
      },
      altos: {
        subobjetivos: Alto_Subobjetivos,
        partes: Alto_Partes
      },
      subtitulosSubobjetivo: Subtitulos_Subobjetivo,
      detalleSubobjetivo: Detalle_Subobjetivo,
      layout: {
        subobjetivo: Layout_Subobjetivo,
        parte: Layout_Parte
      },
      controles: {
        subobjetivos: Capturar_Controles(
          "#Planes_Subobjetivos_Overlay"
        ),
        partes: Capturar_Controles("#Planes_Partes_Overlay")
      }
    };
  });

  await expect(
    page.locator("#Planes_Partes_Lista .Planes_Parte").first()
  ).toBeVisible();
  await page.locator(
    "#Planes_Partes_Lista .Planes_Parte [data-parte-menu]"
  ).first().click();
  await expect(page.locator(
    '.Planes_Parte_Menu_Flotante [data-parte-accion="realizar"]'
  )).toBeVisible();
  await expect(page.locator(
    '.Planes_Parte_Menu_Flotante [data-parte-accion="subir"]'
  )).toHaveCount(0);
  await expect(page.locator(
    '.Planes_Parte_Menu_Flotante [data-parte-accion="bajar"]'
  )).toHaveCount(0);

  await page.evaluate(() => {
    Planes_Cerrar_Menus_Parte();
    Cerrar_Modal_Planes_Partes();
    Abrir_Modal_Planes_Subobjetivos("obj_menus");
  });
  await page.locator(
    "#Planes_Subobjetivos_Lista .Planes_Subobjetivo " +
    "[data-plan-sub-menu]"
  ).first().click();
  await expect(page.locator(
    '.Planes_Context_Menu [data-plan-sub-accion="realizar"]'
  )).toBeVisible();

  expect(errores).toEqual([]);
  expect(resultado.parte.ok).toBeTruthy();
  expect(resultado.parte.mensaje).toContain("40 paginas");
  expect(resultado.parte.estado).toBe("Realizada");
  expect(resultado.parte.progreso).toBe(40);
  expect(resultado.sub.ok).toBeTruthy();
  expect(resultado.sub.mensaje).toContain("2 partes");
  expect(resultado.sub.mensaje).toContain("65 paginas");
  expect(resultado.sub.estado).toBe("Cumplido");
  expect(resultado.sub.progreso).toBe(65);
  expect(resultado.sub.partesRealizadas).toBe(2);
  expect(resultado.sticky).toEqual({
    subobjetivos: "sticky",
    partes: "sticky"
  });
  expect(resultado.altos.subobjetivos).toBe(resultado.altos.partes);
  expect(resultado.subtitulosSubobjetivo).toBe(2);
  expect(resultado.detalleSubobjetivo).toContain("Del ");
  expect(resultado.detalleSubobjetivo).toContain(" a ");
  expect(resultado.detalleSubobjetivo).not.toContain("Fecha inicial");
  expect(resultado.detalleSubobjetivo).not.toContain("Fecha objetivo");
  expect(resultado.detalleSubobjetivo).not.toContain("En proceso");
  expect(resultado.layout.subobjetivo).toEqual(
    resultado.layout.parte
  );
  expect(resultado.controles.subobjetivos.cantidad).toBe(4);
  expect(
    resultado.controles.subobjetivos.diferenciaAnchos
  ).toBeLessThanOrEqual(1);
  expect(resultado.controles.subobjetivos.controlesLlenos).toBe(true);
  expect(resultado.controles.partes.cantidad).toBe(3);
  expect(
    resultado.controles.partes.diferenciaAnchos
  ).toBeLessThanOrEqual(1);
  expect(resultado.controles.partes.controlesLlenos).toBe(true);
});

test("Administrador de partes muestra unidades en minuscula",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));

  await Preparar(page);
  const resultado = await page.evaluate(() => {
    Abrir_Plan();
    const Modelo = Asegurar_Jerarquia_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_partes_minusculas = Normalizar_Objetivo_Plan({
      Id: "obj_partes_minusculas",
      Periodo_Id: "p2026",
      Emoji: "\uD83D\uDCDA",
      Nombre: "Libro",
      Target_Total: 6,
      Unidad: "Personalizado",
      Unidad_Custom: "P\u00E1ginas",
      Orden: 0
    });
    Modelo.Subobjetivos.sub_partes_minusculas =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_partes_minusculas",
        Objetivo_Id: "obj_partes_minusculas",
        Emoji: "\uD83D\uDCD6",
        Texto: "Capitulo",
        Target_Total: 6,
        Unidad: "Personalizado",
        Unidad_Custom: "P\u00E1ginas",
        Orden: 0
      });
    Modelo.Partes.parte_minusculas = Normalizar_Parte_Meta({
      Id: "parte_minusculas",
      Objetivo_Id: "obj_partes_minusculas",
      Subobjetivo_Id: "sub_partes_minusculas",
      Emoji: "\uD83D\uDCD6",
      Nombre: "Parte uno",
      Aporte_Total: 6,
      Unidad: "Personalizado",
      Unidad_Custom: "P\u00E1ginas",
      Orden: 0
    });
    Planes_Marcar_Parte_Realizada("parte_minusculas");

    Planes_Partes_Filtro_Estado = "Todos";
    Abrir_Modal_Planes_Partes("sub_partes_minusculas");

    return {
      resumen: document.getElementById("Planes_Partes_Resumen")
        .textContent,
      meta: document.querySelector("#Planes_Partes_Lista .Planes_Parte_Meta")
        .textContent
    };
  });

  expect(errores).toEqual([]);
  expect(resultado.resumen).toContain("6 p\u00E1ginas asignadas");
  expect(resultado.resumen).toContain("0 p\u00E1ginas");
  expect(resultado.meta).toContain("6/6 p\u00E1ginas");
  expect(resultado.resumen).not.toContain("P\u00E1ginas");
  expect(resultado.meta).not.toContain("P\u00E1ginas");
  expect(resultado.meta).not.toContain("Realizada");
});

test("Reordenar partes no muestra toast de parte actualizada",
async ({ page }) => {
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_reorden_partes = Normalizar_Objetivo_Plan({
      Id: "obj_reorden_partes",
      Periodo_Id: "p2026",
      Nombre: "Objetivo partes",
      Target_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Subobjetivos.sub_reorden_partes =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_reorden_partes",
        Objetivo_Id: "obj_reorden_partes",
        Texto: "Sub partes",
        Target_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas"
      });
    Modelo.Partes.parte_reorden_a = Normalizar_Parte_Meta({
      Id: "parte_reorden_a",
      Objetivo_Id: "obj_reorden_partes",
      Subobjetivo_Id: "sub_reorden_partes",
      Nombre: "Parte A",
      Aporte_Total: 5,
      Orden: 0
    });
    Modelo.Partes.parte_reorden_b = Normalizar_Parte_Meta({
      Id: "parte_reorden_b",
      Objetivo_Id: "obj_reorden_partes",
      Subobjetivo_Id: "sub_reorden_partes",
      Nombre: "Parte B",
      Aporte_Total: 5,
      Orden: 1
    });

    Abrir_Modal_Planes_Partes("sub_reorden_partes");
    await Planes_Ejecutar_Accion_Parte("parte_reorden_b", "subir");
    return {
      orden: Planes_Partes_De_Subobjetivo(
        "sub_reorden_partes",
        Modelo
      ).map((Parte) => Parte.Id),
      toasts: Array.from(document.querySelectorAll(".Undo_Toast_Texto"))
        .map((Nodo) => Nodo.textContent)
    };
  });

  expect(resultado.orden).toEqual([
    "parte_reorden_b",
    "parte_reorden_a"
  ]);
  expect(resultado.toasts.join(" ")).not.toContain("Parte actualizada");
});

test("Cancelar realizacion de parte borra avances y habitos",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Planes_Periodo = Planes_Modelo_Base();
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Cancel_Parte",
        Nombre: "Leer parte",
        Emoji: "\uD83D\uDCD6",
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
    Config.Mostrar_Habitos_Sidebar = true;
    Config.Mostrar_Globitos_Habitos = true;

    const Modelo = Asegurar_Modelo_Planes();
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_cancel_parte = Normalizar_Objetivo_Plan({
      Id: "obj_cancel_parte",
      Periodo_Id: "p2026",
      Nombre: "Lectura cancelable",
      Target_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Subobjetivos.sub_cancel_parte =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_cancel_parte",
        Objetivo_Id: "obj_cancel_parte",
        Texto: "Libro cancelable",
        Target_Total: 10,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas"
      });
    Modelo.Partes.parte_cancelable = Normalizar_Parte_Meta({
      Id: "parte_cancelable",
      Objetivo_Id: "obj_cancel_parte",
      Subobjetivo_Id: "sub_cancel_parte",
      Nombre: "Capitulo cancelable",
      Aporte_Total: 10,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas",
      Habitos_Vinculos: [
        {
          Habito_Id: "Habito_Cancel_Parte",
          Cantidad_Modo: "Usar_Fuente",
          Cantidad: 1,
          Activo: true
        }
      ]
    });

    Abrir_Modal_Planes_Partes("sub_cancel_parte");
    const Dialogo_Original = Mostrar_Dialogo;
    const Mensajes = [];
    Mostrar_Dialogo = async (Texto) => {
      Mensajes.push(
        typeof Texto === "string" ? Texto : Texto?.textContent || ""
      );
      return true;
    };
    try {
      await Planes_Marcar_Parte_Como_Realizada("parte_cancelable");
      const Acciones_Realizada =
        Render_Planes_Parte_Acciones(Modelo.Partes.parte_cancelable);
      const Registros_Antes = Habitos_Registros.length;
      const Ok = await Planes_Cancelar_Realizacion_Parte(
        "parte_cancelable"
      );
      const Modelo_Final = Asegurar_Modelo_Planes();
      const Parte = Modelo_Final.Partes.parte_cancelable;
      const Sidebar = document.querySelector(
        '[data-sidebar-habito-id="Habito_Cancel_Parte"]'
      );
      return {
        ok: Ok,
        mensajes: Mensajes,
        accionesRealizada: Acciones_Realizada,
        registrosAntes: Registros_Antes,
        registrosDespues: Habitos_Registros.length,
        avancesDespues: Object.keys(Modelo_Final.Avances).length,
        progreso: Planes_Progreso_Total_Parte(Parte, Modelo_Final),
        estado: Planes_Estado_Calculado_Parte(Parte, Modelo_Final),
        sidebarClase: Sidebar?.className || "",
        sidebarIndicador: Sidebar
          ?.querySelector(".Sidebar_Habito_Indicador")
          ?.textContent || "",
        toastSegundos: document.querySelector(".Undo_Toast_Segundos")
          ?.textContent || "",
        toastTexto: document.querySelector(".Undo_Toast_Texto")
          ?.textContent || ""
      };
    } finally {
      Mostrar_Dialogo = Dialogo_Original;
    }
  });

  expect(errores).toEqual([]);
  expect(resultado.accionesRealizada).toContain(
    'data-parte-accion="cancelar-realizacion"'
  );
  expect(resultado.ok).toBeTruthy();
  expect(resultado.mensajes.at(-1)).toContain("1 registro");
  expect(resultado.registrosAntes).toBe(1);
  expect(resultado.registrosDespues).toBe(0);
  expect(resultado.avancesDespues).toBe(0);
  expect(resultado.progreso).toBe(0);
  expect(resultado.estado).toBe("Pendiente");
  expect(resultado.sidebarClase).toContain("Pendiente");
  expect(resultado.sidebarIndicador).toBe("0/10 paginas");
  expect(resultado.toastSegundos).toBe("30");
  expect(resultado.toastTexto).toContain("Realizacion cancelada");
});

test("Cancelar realizacion de subobjetivo borra avances de sus partes",
async ({ page }) => {
  const errores = [];
  page.on("pageerror", (error) => errores.push(error.message));
  await Preparar(page);

  const resultado = await page.evaluate(async () => {
    Planes_Periodo = Planes_Modelo_Base();
    Habitos = [
      Normalizar_Habito({
        Id: "Habito_Cancel_Sub",
        Nombre: "Leer sub",
        Emoji: "\uD83D\uDCD6",
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
    Modelo.Periodos.p2026 = Normalizar_Periodo_Plan({
      Id: "p2026",
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31",
      Orden: 0
    });
    Modelo.Objetivos.obj_cancel_sub = Normalizar_Objetivo_Plan({
      Id: "obj_cancel_sub",
      Periodo_Id: "p2026",
      Nombre: "Objetivo sub cancelable",
      Target_Total: 20,
      Unidad: "Personalizado",
      Unidad_Custom: "paginas"
    });
    Modelo.Subobjetivos.sub_cancelable =
      Normalizar_Subobjetivo_Plan({
        Id: "sub_cancelable",
        Objetivo_Id: "obj_cancel_sub",
        Texto: "Sub cancelable",
        Target_Total: 20,
        Unidad: "Personalizado",
        Unidad_Custom: "paginas",
        Habitos_Vinculos: [
          {
            Habito_Id: "Habito_Cancel_Sub",
            Cantidad_Modo: "Usar_Fuente",
            Cantidad: 1,
            Activo: true
          }
        ]
      });
    ["a", "b"].forEach((Sufijo, Indice) => {
      Modelo.Partes[`parte_cancel_sub_${Sufijo}`] =
        Normalizar_Parte_Meta({
          Id: `parte_cancel_sub_${Sufijo}`,
          Objetivo_Id: "obj_cancel_sub",
          Subobjetivo_Id: "sub_cancelable",
          Nombre: `Parte ${Sufijo}`,
          Aporte_Total: 10,
          Unidad: "Personalizado",
          Unidad_Custom: "paginas",
          Orden: Indice,
          Habitos_Vinculos: [
            {
              Habito_Id: "Habito_Cancel_Sub",
              Cantidad_Modo: "Usar_Fuente",
              Cantidad: 1,
              Activo: true
            }
          ]
        });
    });

    const Dialogo_Original = Mostrar_Dialogo;
    const Mensajes = [];
    Mostrar_Dialogo = async (Texto) => {
      Mensajes.push(
        typeof Texto === "string" ? Texto : Texto?.textContent || ""
      );
      return true;
    };
    try {
      await Planes_Marcar_Subobjetivo_Como_Realizado(
        "sub_cancelable",
        "obj_cancel_sub"
      );
      const Acciones_Realizado =
        Render_Planes_Subobjetivo_Acciones(
          Modelo.Subobjetivos.sub_cancelable
        );
      const Registros_Antes = Habitos_Registros.length;
      const Ok = await Planes_Cancelar_Realizacion_Subobjetivo(
        "sub_cancelable"
      );
      const Modelo_Final = Asegurar_Modelo_Planes();
      const Sub = Modelo_Final.Subobjetivos.sub_cancelable;
      const Partes = Planes_Partes_De_Subobjetivo(
        "sub_cancelable",
        Modelo_Final
      );
      return {
        ok: Ok,
        mensajes: Mensajes,
        accionesRealizado: Acciones_Realizado,
        registrosAntes: Registros_Antes,
        registrosDespues: Habitos_Registros.length,
        avancesDespues: Object.keys(Modelo_Final.Avances).length,
        progresoSub: Planes_Progreso_Total_Subobjetivo(
          Sub,
          Modelo_Final
        ),
        estadoSub: Planes_Estado_Normalizado_Subobjetivo(Sub),
        progresosPartes: Partes.map((Parte) =>
          Planes_Progreso_Total_Parte(Parte, Modelo_Final)
        ),
        estadosPartes: Partes.map((Parte) =>
          Planes_Estado_Calculado_Parte(Parte, Modelo_Final)
        ),
        toastSegundos: document.querySelector(".Undo_Toast_Segundos")
          ?.textContent || ""
      };
    } finally {
      Mostrar_Dialogo = Dialogo_Original;
    }
  });

  expect(errores).toEqual([]);
  expect(resultado.accionesRealizado).toContain(
    'data-plan-sub-accion="cancelar-realizacion"'
  );
  expect(resultado.ok).toBeTruthy();
  expect(resultado.mensajes.at(-1)).toContain("2 registros");
  expect(resultado.registrosAntes).toBe(3);
  expect(resultado.registrosDespues).toBe(0);
  expect(resultado.avancesDespues).toBe(0);
  expect(resultado.progresoSub).toBe(0);
  expect(resultado.estadoSub).toBe("Activo");
  expect(resultado.progresosPartes).toEqual([0, 0]);
  expect(resultado.estadosPartes).toEqual(["Pendiente", "Pendiente"]);
  expect(resultado.toastSegundos).toBe("30");
});
