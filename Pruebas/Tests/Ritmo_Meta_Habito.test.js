const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  const Inicio = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(Inicio, -1, `No se encontró la función ${Nombre}`);
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio);
  assert.notEqual(Fin_Parametros, -1, `No se encontró el cuerpo de ${Nombre}`);
  const Inicio_Cuerpo = Fin_Parametros + 2;
  let Profundidad = 0;
  for (let Indice = Inicio_Cuerpo; Indice < Codigo_Login.length; Indice += 1) {
    if (Codigo_Login[Indice] === "{") Profundidad += 1;
    if (Codigo_Login[Indice] === "}") Profundidad -= 1;
    if (Profundidad === 0) {
      return Codigo_Login.slice(Inicio, Indice + 1);
    }
  }
  throw new Error(`La función ${Nombre} quedó incompleta`);
}

function Cargar_Funciones(Contexto, Nombres) {
  vm.createContext(Contexto);
  const Funciones = Nombres.includes("Planes_Calcular_Ritmo_Meta") &&
    !Nombres.includes("Planes_Carga_Ritmo_Objetivo")
    ? ["Planes_Carga_Ritmo_Objetivo", ...Nombres]
    : Nombres;
  Funciones.forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return Contexto;
}

function Parsear_Fecha(Valor) {
  const [Anio, Mes, Dia] = String(Valor).split("-").map(Number);
  return new Date(Anio, Mes - 1, Dia, 12, 0, 0, 0);
}

function Formatear_Fecha(Fecha) {
  const Anio = Fecha.getFullYear();
  const Mes = String(Fecha.getMonth() + 1).padStart(2, "0");
  const Dia = String(Fecha.getDate()).padStart(2, "0");
  return `${Anio}-${Mes}-${Dia}`;
}

function Sumar_Dias(Fecha, Cantidad) {
  const Resultado = new Date(Fecha);
  Resultado.setDate(Resultado.getDate() + Cantidad);
  return Resultado;
}

test("agrega una carga uniforme sin confundirla con la meta principal", () => {
  const Subs = [
    { Id: "A", Target_Total: 120, Unidad_Custom: "Páginas", Progreso: 40 },
    { Id: "B", Target_Total: 80, Unidad_Custom: "Páginas", Progreso: 20 }
  ];
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({ Items: Subs }),
    Planes_Normalizar_Modo_Avance: () => "Con_Metrica",
    Planes_Unidad_Label: () => "libros",
    Planes_Progreso_Total_Objetivo_Efectivo: () => 0,
    Planes_Unidad_Label_Subobjetivo: (Sub) => Sub.Unidad_Custom.toLowerCase(),
    Planes_Progreso_Total_Subobjetivo: (Sub) => Sub.Progreso,
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase()
  };
  Cargar_Funciones(Contexto, [
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo({
    Id: "Lectofilia",
    Target_Total: 2,
    Unidad: "Personalizado",
    Unidad_Custom: "Libros"
  });
  assert.equal(Resultado.Calculable, true);
  assert.equal(Resultado.Total, 200);
  assert.equal(Resultado.Realizado, 60);
  assert.equal(Resultado.Pendiente, 140);
  assert.equal(Resultado.Unidad, "páginas");
  assert.equal(Resultado.Cobertura_Completa, true);
});

test("usa la meta principal para el ritmo cuando los cuentos no tienen target", () => {
  const Subs = Array.from({ length: 10 }, (_, Indice) => ({
    Id: `Cuento_${Indice + 1}`
  }));
  const Objetivo = {
    Id: "Texturas",
    Target_Total: 40000,
    Unidad: "Personalizado",
    Unidad_Custom: "Palabras"
  };
  const Modelo = { Objetivos: { Texturas: Objetivo } };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Objetivo_Canonico_Contextual: () => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({ Items: Subs }),
    Planes_Normalizar_Modo_Avance: () => "Con_Metrica",
    Planes_Progreso_Total_Objetivo_Efectivo: () => 21665,
    Planes_Unidad_Label: () => "palabras",
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase(),
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: false,
      Motivo: "Sin_Metrica"
    })
  };
  Cargar_Funciones(Contexto, [
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Ritmo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Ritmo_Objetivo(
    Objetivo,
    Modelo
  );
  assert.equal(Resultado.Calculable, true);
  assert.equal(Resultado.Fuente, "Objetivo");
  assert.equal(Resultado.Total, 40000);
  assert.equal(Resultado.Realizado, 21665);
  assert.equal(Resultado.Pendiente, 18335);
  assert.equal(Resultado.Subobjetivos_Total, 10);
  assert.equal(Resultado.Items_Medidos, 0);
});

test("rechaza unidades mezcladas en vez de inventar una equivalencia", () => {
  const Subs = [
    { Id: "A", Target_Total: 10, Unidad_Custom: "Kilómetros" },
    { Id: "B", Target_Total: 4, Unidad_Custom: "Sesiones" }
  ];
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({ Items: Subs }),
    Planes_Normalizar_Modo_Avance: () => "Con_Metrica",
    Planes_Unidad_Label_Subobjetivo: (Sub) => Sub.Unidad_Custom,
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase()
  };
  Cargar_Funciones(Contexto, [
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo({ Id: "Meta" });
  assert.equal(Resultado.Calculable, false);
  assert.equal(Resultado.Motivo, "Unidades_Mixtas");
});

test("un exceso de un subobjetivo no compensa otro pendiente", () => {
  const Subs = [
    { Id: "A", Target_Total: 100, Unidad_Custom: "Páginas", Progreso: 130 },
    { Id: "B", Target_Total: 100, Unidad_Custom: "Páginas", Progreso: 10 }
  ];
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({ Items: Subs }),
    Planes_Normalizar_Unidad_Subobjetivo: () => "Personalizado",
    Planes_Unidad_Label_Subobjetivo: () => "páginas",
    Planes_Progreso_Total_Subobjetivo: (Sub) => Sub.Progreso,
    Planes_Formatear_Numero_Texto: (Numero) => String(Numero),
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase()
  };
  Cargar_Funciones(Contexto, [
    "Planes_Total_Unidades_Subobjetivos_Uniforme",
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo({ Id: "Meta" });
  assert.equal(Resultado.Realizado, 110);
  assert.equal(Resultado.Pendiente, 90);
  assert.equal(Resultado.Subobjetivos_Realizados, 1);
  assert.equal(Resultado.Subobjetivos_Pendientes, 1);
  const Totales = Contexto.Planes_Total_Unidades_Subobjetivos_Uniforme({
    Id: "Meta"
  });
  assert.equal(Totales.Realizadas, 110);
  assert.equal(Totales.Faltantes, 90);
});

test("incluye la carga consolidada de subobjetivos sumados desde partes", () => {
  const Subs = [
    {
      Id: "A",
      Target_Total: 300,
      Target_Suma_Componentes: true,
      Unidad_Custom: "Paginas",
      Progreso: 100
    },
    {
      Id: "B",
      Target_Total: 400,
      Target_Suma_Componentes: true,
      Unidad_Custom: "Paginas",
      Progreso: 0
    },
    {
      Id: "C",
      Target_Total: 500,
      Target_Suma_Componentes: false,
      Unidad_Custom: "Paginas",
      Progreso: 500
    }
  ];
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({ Items: Subs }),
    Planes_Normalizar_Modo_Avance: () => "Con_Metrica",
    Planes_Unidad_Label_Subobjetivo: () => "paginas",
    Planes_Progreso_Total_Subobjetivo: (Sub) => Sub.Progreso,
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase()
  };
  Cargar_Funciones(Contexto, [
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo({ Id: "Meta" });
  assert.equal(Resultado.Calculable, true);
  assert.equal(Resultado.Total, 1200);
  assert.equal(Resultado.Realizado, 600);
  assert.equal(Resultado.Pendiente, 600);
  assert.equal(Resultado.Sin_Avance, 400);
  assert.equal(Resultado.Pendiente_En_Curso, 200);
  assert.equal(Resultado.Subobjetivos_Sin_Avance, 1);
  assert.equal(Resultado.Items_Medidos, 3);
});

test("no duplica la carga de divisiones internas anidadas", () => {
  const Padre = {
    Id: "Libro",
    Target_Total: 300,
    Unidad_Custom: "Paginas",
    Progreso: 120
  };
  const Division = {
    Id: "Parte_Interna",
    Target_Total: 100,
    Unidad_Custom: "Paginas",
    Progreso: 50
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({
      Items: [Padre, Division],
      Items_Por_Id: new Map([
        [Padre.Id, { Padre_Id: "" }],
        [Division.Id, { Padre_Id: Padre.Id }]
      ])
    }),
    Planes_Normalizar_Modo_Avance: () => "Con_Metrica",
    Planes_Unidad_Label_Subobjetivo: () => "paginas",
    Planes_Progreso_Total_Subobjetivo: (Sub) => Sub.Progreso,
    Normalizar_Texto_Archivero: (Texto) => Texto.toLowerCase()
  };
  Cargar_Funciones(Contexto, [
    "Planes_Normalizar_Clave_Unidad_Ritmo",
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo({ Id: "Meta" });
  assert.equal(Resultado.Total, 300);
  assert.equal(Resultado.Realizado, 120);
  assert.equal(Resultado.Pendiente, 180);
  assert.equal(Resultado.Items_Medidos, 1);
});

test("respeta semanas alternadas dentro de un ciclo quincenal", () => {
  const Contexto = {
    Parsear_Fecha_ISO: Parsear_Fecha,
    Obtener_Lunes: (Fecha) => Sumar_Dias(
      Fecha,
      -((Fecha.getDay() + 6) % 7)
    ),
    Dias_Entre: (A, B) => Math.round((B - A) / 86400000),
    Habito_Coincide_Con_Dia: () => false
  };
  Cargar_Funciones(Contexto, ["Habito_Corresponde_En_Fecha"]);
  const Habito = {
    Fecha_Inicio: "2026-08-03",
    Programacion: {
      Tipo_Ciclo: "Ciclo",
      Semanas_Ciclo: 2,
      Fecha_Ancla: "2026-08-03",
      Dias_Ciclo: [[0, 2, 4], [1, 3, 5]]
    }
  };
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-03"),
    true
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-04"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-10"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-11"),
    true
  );
});

test("corrige un ciclo de semanas legado de una sola semana", () => {
  const Contexto = {
    Parsear_Fecha_ISO: Parsear_Fecha,
    Obtener_Lunes: (Fecha) => Sumar_Dias(
      Fecha,
      -((Fecha.getDay() + 6) % 7)
    ),
    Dias_Entre: (A, B) => Math.round((B - A) / 86400000),
    Habito_Coincide_Con_Dia: () => false
  };
  Cargar_Funciones(Contexto, ["Habito_Corresponde_En_Fecha"]);
  const Habito = {
    Fecha_Inicio: "2026-08-03",
    Programacion: {
      Patron_Dias: "Ciclo_Semanas",
      Semanas_Ciclo: 1,
      Fecha_Ancla: "2026-08-03",
      Dias_Ciclo: [[0], [1]]
    }
  };
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-03"),
    true
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-04"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-10"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Habito, "2026-08-11"),
    true
  );
});

test("admite días del mes, ciclos de días y excepciones puntuales", () => {
  const Contexto = {
    Parsear_Fecha_ISO: Parsear_Fecha,
    Obtener_Lunes: (Fecha) => Sumar_Dias(
      Fecha,
      -((Fecha.getDay() + 6) % 7)
    ),
    Dias_Entre: (A, B) => Math.round((B - A) / 86400000),
    Habito_Coincide_Con_Dia: () => false
  };
  Cargar_Funciones(Contexto, ["Habito_Corresponde_En_Fecha"]);
  const Mensual = {
    Fecha_Inicio: "2026-08-01",
    Programacion: {
      Patron_Dias: "Mensual",
      Dias_Mes: [1, 10, 20],
      Fechas_Activas: ["2026-08-15"],
      Fechas_Inactivas: ["2026-08-10"]
    }
  };
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Mensual, "2026-08-01"),
    true
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Mensual, "2026-08-10"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Mensual, "2026-08-15"),
    true
  );
  const Ciclo = {
    Fecha_Inicio: "2026-08-01",
    Programacion: {
      Patron_Dias: "Ciclo_Dias",
      Fecha_Ancla: "2026-08-01",
      Ciclo_Dias_Total: 14,
      Ciclo_Dias_Activos: [1, 2]
    }
  };
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Ciclo, "2026-08-02"),
    true
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Ciclo, "2026-08-03"),
    false
  );
  assert.equal(
    Contexto.Habito_Corresponde_En_Fecha(Ciclo, "2026-08-15"),
    true
  );
});

test("normaliza y conserva los patrones nuevos del hábito", () => {
  const Contexto = {
    Crear_Id_Habito: () => "Habito",
    Normalizar_Emoji: (Valor) => Valor,
    Normalizar_Color_Hex: (Valor) => Valor || "#000000",
    Normalizar_Habito_Meta_Historial: () => []
  };
  Cargar_Funciones(Contexto, ["Normalizar_Habito"]);
  const Resultado = Contexto.Normalizar_Habito({
    Nombre: "Trabajar",
    Fecha_Inicio: "2026-08-01",
    Programacion: {
      Patron_Dias: "Mensual",
      Dias_Mes: [1, 10, 32],
      Fechas_Activas: ["2026-08-15", "fecha inválida"],
      Fechas_Inactivas: ["2026-08-10"]
    },
    Meta: { Modo: "Cantidad", Cantidad: 1 }
  });
  assert.equal(Resultado.Programacion.Patron_Dias, "Mensual");
  assert.equal(JSON.stringify(Resultado.Programacion.Dias_Mes), "[1,10]");
  assert.equal(
    JSON.stringify(Resultado.Programacion.Fechas_Activas),
    '["2026-08-15"]'
  );
  assert.equal(
    JSON.stringify(Resultado.Programacion.Fechas_Inactivas),
    '["2026-08-10"]'
  );
});

test("normaliza el historial diario sin aceptar fechas o pautas rotas", () => {
  const Contexto = {};
  Cargar_Funciones(Contexto, ["Planes_Normalizar_Historial_Ritmo_Diario"]);
  const Resultado = Contexto.Planes_Normalizar_Historial_Ritmo_Diario({
    "2026-08-06": {
      Pauta: 18,
      Unidad: "páginas",
      Pendiente_Inicial: 90,
      Dias_Activos_Restantes: 5
    },
    ayer: { Pauta: 10 },
    "2026-08-07": { Pauta: -2 }
  });
  assert.deepEqual(Object.keys(Resultado), ["2026-08-06"]);
  assert.equal(Resultado["2026-08-06"].Pauta, 18);
  assert.equal(Resultado["2026-08-06"].Pendiente_Inicial, 90);
});

test("fija la pauta de hoy y recalcula recién el día siguiente", () => {
  let Progreso_Hoy = 10;
  let Carga = {
    Calculable: true,
    Total: 100,
    Realizado: 20,
    Pendiente: 80,
    Unidad: "páginas",
    Unidad_Clave: "paginas"
  };
  const Objetivo = {
    Id: "Meta",
    Ritmo_Diario_Historial: {
      "2026-08-06": {
        Fecha: "2026-08-06",
        Habito_Id: "Habito",
        Pauta: 18,
        Unidad: "páginas",
        Unidad_Clave: "paginas",
        Pendiente_Inicial: 90,
        Dias_Activos_Restantes: 5
      }
    }
  };
  const Modelo = { Objetivos: { Meta: Objetivo } };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Objetivo_Canonico_Contextual: (Meta) => Meta,
    Planes_Carga_Trabajo_Objetivo: () => Carga,
    Planes_Rango_Ritmo_Objetivo: () => ({
      Inicio: Parsear_Fecha("2026-08-01"),
      Fin: Parsear_Fecha("2026-08-10")
    }),
    Habitos_Fecha_Hoy: () => "2026-08-06",
    Formatear_Fecha_ISO: Formatear_Fecha,
    Parsear_Fecha_ISO: Parsear_Fecha,
    Sumar_Dias,
    Planes_Fechas_Validas_Ritmo: (_H, Inicio) => Inicio === "2026-08-06"
      ? [
        "2026-08-06",
        "2026-08-07",
        "2026-08-08",
        "2026-08-09",
        "2026-08-10"
      ]
      : ["2026-08-07", "2026-08-08", "2026-08-09", "2026-08-10"],
    Habito_Corresponde_En_Fecha: () => true,
    Planes_Avances_Carga_Objetivo: (_O, _C, Inicio, Fin) =>
      Inicio === "2026-08-06" && Fin === "2026-08-06"
        ? Progreso_Hoy
        : 0,
    Planes_Pendiente_Inicial_Ritmo: (_O, _C, Fecha) =>
      Fecha === "2026-08-06"
        ? Carga.Pendiente + Progreso_Hoy
        : Carga.Pendiente,
    Planes_Vinculo_Ritmo_Habito: () => null,
    Planes_Ritmo_Real_Objetivo: () => ({
      Cantidad: 0,
      Dias: 0,
      Tiene_Datos: false
    }),
    Planes_Proyectar_Fecha_Ritmo: () => ""
  };
  Cargar_Funciones(Contexto, [
    "Planes_Redondear_Cuota_Ritmo",
    "Planes_Registro_Ritmo_Diario",
    "Planes_Calcular_Ritmo_Meta"
  ]);
  const Resultado = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    { Id: "Habito" },
    "2026-08-06"
  );
  assert.equal(Resultado.Cuota_Diaria_Total, 18);
  assert.equal(Resultado.Progreso_Hoy, 10);
  assert.equal(Resultado.Cantidad_Hoy, 8);
  assert.equal(Resultado.Dias_Validos_Restantes, 5);
  Progreso_Hoy = 20;
  Carga = { ...Carga, Realizado: 30, Pendiente: 70 };
  const Mismo_Dia = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    { Id: "Habito" },
    "2026-08-06"
  );
  assert.equal(Mismo_Dia.Cuota_Diaria_Total, 18);
  assert.equal(Mismo_Dia.Cantidad_Hoy, 0);
  const Dia_Siguiente = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    { Id: "Habito" },
    "2026-08-07"
  );
  assert.equal(Dia_Siguiente.Cuota_Diaria_Total, 18);
  assert.equal(Dia_Siguiente.Dias_Validos_Restantes, 4);
});

test("persiste la primera pauta calculada de una jornada activa", () => {
  const Objetivo = { Id: "Meta", Ritmo_Diario_Historial: {} };
  const Habito = { Id: "Habito" };
  const Modelo = { Objetivos: { Meta: Objetivo } };
  let Guardados = 0;
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Objetivo_Canonico_Contextual: (Meta) => Meta,
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: true,
      Fuente: "Objetivo",
      Total: 90,
      Realizado: 0,
      Pendiente: 90,
      Unidad: "páginas",
      Unidad_Clave: "paginas",
      Subobjetivos_Pendientes: 3
    }),
    Planes_Rango_Ritmo_Objetivo: () => ({
      Inicio: Parsear_Fecha("2026-08-01"),
      Fin: Parsear_Fecha("2026-08-10")
    }),
    Habitos_Fecha_Hoy: () => "2026-08-06",
    Formatear_Fecha_ISO: Formatear_Fecha,
    Parsear_Fecha_ISO: Parsear_Fecha,
    Sumar_Dias,
    Planes_Fechas_Validas_Ritmo: () => [
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
      "2026-08-10"
    ],
    Habito_Corresponde_En_Fecha: () => true,
    Planes_Avances_Carga_Objetivo: () => 0,
    Planes_Pendiente_Inicial_Ritmo: () => 90,
    Planes_Vinculo_Ritmo_Habito: () => ({ Habito }),
    Planes_Ritmo_Real_Objetivo: () => ({
      Cantidad: 0,
      Dias: 0,
      Tiene_Datos: false
    }),
    Planes_Proyectar_Fecha_Ritmo: () => "",
    Guardar_Estado: () => {
      Guardados += 1;
    }
  };
  Cargar_Funciones(Contexto, [
    "Planes_Redondear_Cuota_Ritmo",
    "Planes_Registro_Ritmo_Diario",
    "Planes_Fijar_Registro_Ritmo_Diario",
    "Planes_Calcular_Ritmo_Meta"
  ]);
  const Resultado = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    Habito,
    "2026-08-06"
  );
  assert.equal(Resultado.Cuota_Diaria_Total, 18);
  assert.equal(Resultado.Pauta_Fijada, true);
  assert.equal(
    Objetivo.Ritmo_Diario_Historial["2026-08-06"].Pendiente_Inicial,
    90
  );
  assert.equal(Guardados, 1);
});

test("la vista previa recalcula sin tocar la pauta diaria fijada", () => {
  const Registro = {
    Pauta: 99,
    Pendiente_Inicial: 100,
    Dias_Activos_Restantes: 5
  };
  let Fijados = 0;
  const Objetivo = { Id: "Meta" };
  const Modelo = { Objetivos: { Meta: Objetivo } };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: true,
      Total: 100,
      Pendiente: 100,
      Unidad: "paginas",
      Unidad_Clave: "paginas",
      Subobjetivos_Pendientes: 1
    }),
    Planes_Rango_Ritmo_Objetivo: () => ({
      Inicio: Parsear_Fecha("2026-08-01"),
      Fin: Parsear_Fecha("2026-08-10")
    }),
    Habitos_Fecha_Hoy: () => "2026-08-06",
    Formatear_Fecha_ISO: Formatear_Fecha,
    Parsear_Fecha_ISO: Parsear_Fecha,
    Sumar_Dias,
    Planes_Fechas_Validas_Ritmo: () => [
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
      "2026-08-10"
    ],
    Planes_Registro_Ritmo_Diario: () => Registro,
    Habito_Corresponde_En_Fecha: () => true,
    Planes_Avances_Carga_Objetivo: () => 0,
    Planes_Pendiente_Inicial_Ritmo: () => 100,
    Planes_Vinculo_Ritmo_Habito: () => ({ Habito: { Id: "Habito" } }),
    Planes_Fijar_Registro_Ritmo_Diario: () => {
      Fijados += 1;
      return Registro;
    },
    Planes_Ritmo_Real_Objetivo: () => ({
      Cantidad: 0,
      Dias: 0,
      Tiene_Datos: false
    }),
    Planes_Proyectar_Fecha_Ritmo: () => ""
  };
  Cargar_Funciones(Contexto, [
    "Planes_Redondear_Cuota_Ritmo",
    "Planes_Calcular_Ritmo_Meta"
  ]);
  const Previa = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    { Id: "Habito" },
    "2026-08-06",
    Modelo,
    {
      Vista_Previa: true,
      Ignorar_Registro_Diario: true
    }
  );
  assert.equal(Previa.Cuota_Diaria_Total, 20);
  assert.equal(Previa.Pauta_Fijada, false);
  assert.equal(Previa.Registro_Diario, null);
  assert.equal(Fijados, 0);
  const Operativa = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    { Id: "Habito" },
    "2026-08-06",
    Modelo
  );
  assert.equal(Operativa.Cuota_Diaria_Total, 99);
  assert.equal(Operativa.Pauta_Fijada, true);
});

test("el editor usa la primera fecha válida futura para actualizar Meta", () => {
  let Opciones_Recibidas = null;
  let Fecha_Recibida = "";
  const Info = {
    Calculable: true,
    Completa: false,
    Es_Hoy_Valido: false,
    Proxima_Fecha_Valida: "2026-08-10"
  };
  const Contexto = {
    Habitos_Fecha_Hoy: () => "2026-08-09",
    Planes_Calcular_Ritmo_Meta: (_O, _H, _F, _M, Opciones) => {
      Opciones_Recibidas = Opciones;
      return Info;
    },
    Planes_Cuota_Periodo_Ritmo_Meta: (_O, _H, Fecha) => {
      Fecha_Recibida = Fecha;
      return 41.25;
    },
    Planes_Redondear_Cuota_Ritmo: (Valor) => Valor
  };
  Cargar_Funciones(Contexto, ["Planes_Calcular_Meta_Editor_Ritmo"]);
  const Resultado = Contexto.Planes_Calcular_Meta_Editor_Ritmo(
    { Id: "Meta" },
    { Id: "Habito" }
  );
  assert.equal(Opciones_Recibidas?.Vista_Previa, true);
  assert.equal(Opciones_Recibidas?.Ignorar_Registro_Diario, true);
  assert.equal(Fecha_Recibida, "2026-08-10");
  assert.equal(Resultado.Fecha_Referencia, "2026-08-10");
  assert.equal(Resultado.Cantidad, 41.25);
});

test("fecha de inicio y días activos cambian la cuota recomendada", () => {
  const Objetivo = { Id: "Meta" };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: { Meta: Objetivo } }),
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: true,
      Total: 700,
      Pendiente: 700,
      Unidad: "paginas",
      Unidad_Clave: "paginas",
      Subobjetivos_Pendientes: 1
    }),
    Planes_Rango_Ritmo_Objetivo: () => ({
      Inicio: Parsear_Fecha("2026-08-10"),
      Fin: Parsear_Fecha("2026-08-23")
    }),
    Habitos_Fecha_Hoy: () => "2026-08-09",
    Formatear_Fecha_ISO: Formatear_Fecha,
    Parsear_Fecha_ISO: Parsear_Fecha,
    Sumar_Dias,
    Dias_Entre: (A, B) => Math.round((B - A) / 86400000),
    Obtener_Lunes: (Fecha) => Sumar_Dias(
      Fecha,
      -((Fecha.getDay() + 6) % 7)
    ),
    Planes_Avances_Carga_Objetivo: () => 0,
    Planes_Pendiente_Inicial_Ritmo: () => 700,
    Planes_Vinculo_Ritmo_Habito: () => null,
    Planes_Ritmo_Real_Objetivo: () => ({
      Cantidad: 0,
      Dias: 0,
      Tiene_Datos: false
    }),
    Planes_Proyectar_Fecha_Ritmo: () => ""
  };
  Cargar_Funciones(Contexto, [
    "Habito_Coincide_Con_Dia",
    "Habito_Corresponde_En_Fecha",
    "Planes_Fechas_Validas_Ritmo",
    "Planes_Redondear_Cuota_Ritmo",
    "Planes_Calcular_Ritmo_Meta"
  ]);
  const Habito = (Fecha_Inicio, Dias = []) => ({
    Id: "Habito",
    Fecha_Inicio,
    Programacion: {
      Patron_Dias: "Semanal",
      Dias
    }
  });
  const Desde_El_Diez = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    Habito("2026-08-10"),
    "2026-08-09",
    null,
    {
      Vista_Previa: true,
      Ignorar_Registro_Diario: true
    }
  );
  assert.equal(Desde_El_Diez.Dias_Validos_Restantes, 14);
  assert.equal(Desde_El_Diez.Cuota_Diaria_Total, 50);
  const Desde_El_Diecisiete = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    Habito("2026-08-17"),
    "2026-08-09",
    null,
    {
      Vista_Previa: true,
      Ignorar_Registro_Diario: true
    }
  );
  assert.equal(Desde_El_Diecisiete.Dias_Validos_Restantes, 7);
  assert.equal(Desde_El_Diecisiete.Cuota_Diaria_Total, 100);
  const Lunes_A_Sabado = Contexto.Planes_Calcular_Ritmo_Meta(
    Objetivo,
    Habito("2026-08-10", [0, 1, 2, 3, 4, 5]),
    "2026-08-09",
    null,
    {
      Vista_Previa: true,
      Ignorar_Registro_Diario: true
    }
  );
  assert.equal(Lunes_A_Sabado.Dias_Validos_Restantes, 12);
  assert.equal(Lunes_A_Sabado.Cuota_Diaria_Total, 59);
});

test("todos los campos de días disparan el recálculo de Meta", () => {
  const Contexto = {};
  Cargar_Funciones(Contexto, ["Habito_Campo_Afecta_Ritmo_Meta"]);
  const Campo = (Selector_Campo) => ({
    matches: (Selectores) => Selectores.split(",")
      .map((Selector) => Selector.trim())
      .includes(Selector_Campo)
  });
  [
    "#Habito_Dias_Modo",
    "[data-habito-dia]",
    "#Habito_Meta_Periodo",
    "#Habito_Dia_Desde",
    "#Habito_Dia_Hasta",
    "#Habito_Fecha_Inicio",
    "#Habito_Dias_Mes",
    "#Habito_Ciclo_Semanas",
    "#Habito_Ciclo_Dias_Total",
    "#Habito_Ciclo_Dias_Activos",
    "#Habito_Fechas_Activas",
    "#Habito_Fechas_Inactivas"
  ].forEach((Selector) => {
    assert.equal(
      Contexto.Habito_Campo_Afecta_Ritmo_Meta(Campo(Selector)),
      true,
      Selector
    );
  });
  assert.equal(
    Contexto.Habito_Campo_Afecta_Ritmo_Meta(Campo("#Habito_Nombre")),
    false
  );
});

test("el ritmo real no penaliza el día actual todavía abierto", () => {
  const Rangos = [];
  const Contexto = {
    Parsear_Fecha_ISO: Parsear_Fecha,
    Formatear_Fecha_ISO: Formatear_Fecha,
    Sumar_Dias,
    Habito_Corresponde_En_Fecha: () => true,
    Planes_Avances_Carga_Objetivo: (_O, _C, Inicio, Fin) => {
      Rangos.push([Inicio, Fin]);
      return 70;
    }
  };
  Cargar_Funciones(Contexto, ["Planes_Ritmo_Real_Objetivo"]);
  const Resultado = Contexto.Planes_Ritmo_Real_Objetivo(
    { Id: "Meta" },
    { Unidad_Clave: "unidades" },
    { Id: "Habito" },
    "2026-08-08",
    { Inicio: Parsear_Fecha("2026-08-01") }
  );
  assert.equal(Resultado.Dias, 7);
  assert.equal(Resultado.Cantidad, 10);
  assert.deepEqual(Rangos, [["2026-08-01", "2026-08-07"]]);
});

test("la cuota del período usa sólo sus fechas válidas restantes", () => {
  const Info = {
    Calculable: true,
    Completa: false,
    Fin: "2026-08-31",
    Cuota_Diaria_Total: 10,
    Es_Hoy_Valido: true,
    Progreso_Hoy: 2,
    Carga: { Pendiente: 100, Unidad: "unidades" }
  };
  const Contexto = {
    Planes_Calcular_Ritmo_Meta: () => Info,
    Planes_Rango_Periodo_Habito: () => ({
      Inicio: "2026-08-03",
      Fin: "2026-08-09"
    }),
    Planes_Fechas_Validas_Ritmo: () => [
      "2026-08-05",
      "2026-08-07",
      "2026-08-09"
    ],
    Planes_Avances_Carga_Objetivo: () => 12,
    Planes_Redondear_Cuota_Ritmo: (Valor) => Math.ceil(Valor * 100) / 100
  };
  Cargar_Funciones(Contexto, ["Planes_Cuota_Periodo_Ritmo_Meta"]);
  const Resultado = Contexto.Planes_Cuota_Periodo_Ritmo_Meta(
    { Id: "Meta" },
    { Meta: { Periodo: "Semana" } },
    "2026-08-05",
    Info
  );
  assert.equal(Resultado, 40);
});

test("la normalización conserva el rol operativo del vínculo", () => {
  const Contexto = {};
  Cargar_Funciones(Contexto, ["Normalizar_Vinculos_Habito_Fuente"]);
  const [Vinculo] = Contexto.Normalizar_Vinculos_Habito_Fuente([{
    Habito_Id: "Habito_1",
    Cantidad_Modo: "Usar_Fuente",
    Cantidad: 1,
    Activo: true,
    Rol: "Ritmo_Meta"
  }]);
  assert.equal(Vinculo.Rol, "Ritmo_Meta");
  assert.equal(Vinculo.Redistribucion, "Flexible");
  assert.equal(Vinculo.Cantidad_Modo, "Usar_Fuente");
});

test("un hábito de ritmo sólo puede pertenecer a una meta", () => {
  const Modelo = {
    Objetivos: {
      Meta_A: { Id: "Meta_A", Habitos_Vinculos: [] },
      Meta_B: {
        Id: "Meta_B",
        Habitos_Vinculos: [
          {
            Habito_Id: "Habito_1",
            Cantidad_Modo: "Usar_Fuente",
            Rol: "Ritmo_Meta"
          },
          {
            Habito_Id: "Habito_2",
            Cantidad_Modo: "Fija",
            Cantidad: 2
          }
        ]
      }
    }
  };
  const Recalculados = [];
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Habito_Por_Id: (Id) => ({ Id }),
    Planes_Recalcular_Registros_Habito_Ritmo_Objetivo: (Meta, Id) => {
      Recalculados.push([Meta.Id, Id]);
    },
    Render_Plan: () => {},
    Mostrar_Toast_Info: () => {},
    t: (Clave) => Clave
  };
  Cargar_Funciones(Contexto, [
    "Normalizar_Vinculos_Habito_Fuente",
    "Planes_Vincular_Habito_Ritmo_Objetivo"
  ]);
  assert.equal(
    Contexto.Planes_Vincular_Habito_Ritmo_Objetivo(
      "Meta_A",
      "Habito_1"
    ),
    true
  );
  assert.equal(
    Modelo.Objetivos.Meta_A.Habitos_Vinculos.some((Vinculo) =>
      Vinculo.Rol === "Ritmo_Meta" && Vinculo.Habito_Id === "Habito_1"
    ),
    true
  );
  assert.equal(
    Modelo.Objetivos.Meta_B.Habitos_Vinculos.some((Vinculo) =>
      Vinculo.Rol === "Ritmo_Meta" && Vinculo.Habito_Id === "Habito_1"
    ),
    false
  );
  assert.equal(
    Modelo.Objetivos.Meta_B.Habitos_Vinculos.some((Vinculo) =>
      Vinculo.Habito_Id === "Habito_2"
    ),
    true
  );
  assert.deepEqual(Recalculados, [["Meta_A", "Habito_1"]]);
});
