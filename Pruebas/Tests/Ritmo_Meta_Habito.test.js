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
  Nombres.forEach((Nombre) => {
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

test("descuenta lo hecho hoy sin aumentar la pauta del día", () => {
  const Carga = {
    Calculable: true,
    Total: 100,
    Realizado: 20,
    Pendiente: 80,
    Unidad: "páginas",
    Unidad_Clave: "paginas"
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({}),
    Planes_Carga_Trabajo_Objetivo: () => Carga,
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
    Planes_Avances_Carga_Objetivo: (_O, _C, Inicio, Fin) =>
      Inicio === "2026-08-06" && Fin === "2026-08-06" ? 10 : 0,
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
  const Resultado = Contexto.Planes_Calcular_Ritmo_Meta(
    { Id: "Meta" },
    { Id: "Habito" },
    "2026-08-06"
  );
  assert.equal(Resultado.Cuota_Diaria_Total, 18);
  assert.equal(Resultado.Progreso_Hoy, 10);
  assert.equal(Resultado.Cantidad_Hoy, 8);
  assert.equal(Resultado.Dias_Validos_Restantes, 5);
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
