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
  assert.notEqual(Fin_Parametros, -1);
  const Inicio_Cuerpo = Fin_Parametros + 2;
  let Profundidad = 0;
  for (
    let Indice = Inicio_Cuerpo;
    Indice < Codigo_Login.length;
    Indice += 1
  ) {
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

function Crear_Contexto(Objetivos, Periodos) {
  const Modelo = { Objetivos, Periodos };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo
  };
  return Cargar_Funciones(Contexto, [
    "Parsear_Fecha_ISO",
    "Planes_Objetivo_Padre_Id",
    "Planes_Objetivo_Raiz_Id",
    "Planes_Periodo_Base_Objetivo",
    "Planes_Dias_Rango_Inclusive",
    "Planes_Dias_Rango_Solapado",
    "Planes_Objetivos_Familia",
    "Planes_Madre_Escala_Objetivo",
    "Planes_Target_Semana_Desde_Madre"
  ]);
}

test("prorratea madres mensuales al cruzar dos meses", () => {
  const Periodos = {
    Ago: { Tipo: "Mes", Inicio: "2026-08-01", Fin: "2026-08-31" },
    Sep: { Tipo: "Mes", Inicio: "2026-09-01", Fin: "2026-09-30" }
  };
  const Objetivos = {
    Agosto: {
      Id: "Agosto",
      Periodo_Id: "Ago",
      Target_Total: 31
    },
    Septiembre: {
      Id: "Septiembre",
      Objetivo_Padre_Id: "Agosto",
      Periodo_Id: "Sep",
      Target_Total: 60
    }
  };
  const Contexto = Crear_Contexto(Objetivos, Periodos);
  const Resultado = Contexto.Planes_Target_Semana_Desde_Madre(
    Objetivos.Agosto,
    {
      Tipo: "Semana",
      Inicio: "2026-08-30",
      Fin: "2026-09-05"
    }
  );
  assert.equal(Resultado, 12);
});

test("usa siempre la madre de mayor escala disponible", () => {
  const Periodos = {
    Anual: {
      Tipo: "Anio",
      Inicio: "2026-01-01",
      Fin: "2026-12-31"
    },
    Semestral: {
      Tipo: "Semestre",
      Inicio: "2026-07-01",
      Fin: "2026-12-31"
    },
    Trimestral: {
      Tipo: "Trimestre",
      Inicio: "2026-07-01",
      Fin: "2026-09-30"
    },
    Mensual: {
      Tipo: "Mes",
      Inicio: "2026-08-01",
      Fin: "2026-08-31"
    }
  };
  const Objetivos = {
    Madre: {
      Id: "Madre",
      Periodo_Id: "Anual",
      Target_Total: 365
    },
    Semestre: {
      Id: "Semestre",
      Objetivo_Padre_Id: "Madre",
      Periodo_Id: "Semestral",
      Target_Total: 180
    },
    Trimestre: {
      Id: "Trimestre",
      Objetivo_Padre_Id: "Semestre",
      Periodo_Id: "Trimestral",
      Target_Total: 90
    },
    Mes: {
      Id: "Mes",
      Objetivo_Padre_Id: "Trimestre",
      Periodo_Id: "Mensual",
      Target_Total: 31
    }
  };
  const Contexto = Crear_Contexto(Objetivos, Periodos);
  const Resultado = Contexto.Planes_Target_Semana_Desde_Madre(
    Objetivos.Madre,
    {
      Tipo: "Semana",
      Inicio: "2026-08-31",
      Fin: "2026-09-06"
    }
  );
  assert.equal(Resultado, 7);
});

test("nombra la semana sólo con su número ISO", () => {
  const Contexto = {
    t: () => "Semana",
    Planes_Nombre_Mes_Largo: () => "",
    Meses_Cortos: []
  };
  Cargar_Funciones(Contexto, [
    "Parsear_Fecha_ISO",
    "Planes_Numero_Semana_ISO",
    "Planes_Titulo_Periodo_Mostrable"
  ]);
  assert.equal(
    Contexto.Planes_Titulo_Periodo_Mostrable({
      Tipo: "Semana",
      Inicio: "2026-07-06",
      Fin: "2026-07-12"
    }),
    "Semana 28"
  );
});

test("no inventa trabajo operativo si no hay subobjetivos", () => {
  const Canonico = {
    Id: "Etica",
    Target_Total: 7
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({ Objetivos: {} }),
    Planes_Objetivo_Canonico_Contextual: () => Canonico,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({
      Items: [],
      Items_Por_Id: new Map()
    })
  };
  Cargar_Funciones(Contexto, [
    "Planes_Carga_Trabajo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Trabajo_Objetivo(Canonico);
  assert.equal(Resultado.Calculable, false);
  assert.equal(Resultado.Motivo, "Sin_Metrica");
});

test("el ritmo de una semana usa su cuota proyectada", () => {
  const Canonico = {
    Id: "Etica",
    Target_Total: 7
  };
  const Proyectado = {
    Id: "Etica",
    Target_Total: 0.88,
    __Objetivo_Canonico_Id: "Etica",
    __Plan_Proyectado: true
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({}),
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: false,
      Motivo: "Sin_Metrica"
    }),
    Planes_Objetivo_Canonico_Contextual: () => Canonico,
    Planes_Normalizar_Modo_Avance: () => "Metrica",
    Planes_Unidad_Label: () => "libros",
    Planes_Normalizar_Clave_Unidad_Ritmo: (Unidad) => Unidad,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({
      Items: [],
      Items_Por_Id: new Map()
    }),
    Planes_Periodo_Contexto_Objetivo: () => ({ Id: "Semana" }),
    Planes_Avance_Real_Objetivo_En_Periodo: () => 0.4,
    Planes_Progreso_Total_Objetivo_Efectivo: () => 7
  };
  Cargar_Funciones(Contexto, [
    "Planes_Carga_Ritmo_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Carga_Ritmo_Objetivo(
    Proyectado
  );
  assert.equal(Resultado.Total, 0.88);
  assert.equal(Resultado.Unidad, "libros");
  assert.equal(Resultado.Realizado, 0.4);
});

test("prorratea un subobjetivo por el rango que cruza la semana", () => {
  const Modelo = {
    Objetivos: {
      Lectofilia: {
        Id: "Lectofilia",
        Periodo_Id: "Anual"
      }
    },
    Periodos: {
      Anual: {
        Tipo: "Anio",
        Inicio: "2026-01-01",
        Fin: "2026-12-31"
      }
    }
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Normalizar_Fecha_Comparacion: (Fecha) => Fecha
  };
  Cargar_Funciones(Contexto, [
    "Parsear_Fecha_ISO",
    "Planes_Dias_Rango_Inclusive",
    "Planes_Dias_Rango_Solapado",
    "Planes_Rango_Item_Fechado",
    "Planes_Rango_Planeado_Item",
    "Planes_Fechas_Periodo_Objetivo",
    "Planes_Periodo_De_Objetivo",
    "Planes_Fechas_Objetivo_Por_Periodo",
    "Planes_Rango_Objetivo",
    "Planes_Rango_Subobjetivo_Para_Prorateo",
    "Planes_Peso_Subobjetivo_En_Periodo"
  ]);
  const Resultado = Contexto.Planes_Peso_Subobjetivo_En_Periodo(
    {
      Id: "Sub",
      Objetivo_Id: "Lectofilia",
      Fecha_Inicio: "2026-08-01",
      Fecha_Objetivo: "2026-09-25"
    },
    {
      Tipo: "Semana",
      Inicio: "2026-08-17",
      Fin: "2026-08-23"
    }
  );
  assert.equal(Resultado, 0.125);
});

test("vincula el subobjetivo cumplido con el registro que cruza la semana", () => {
  const Sub = {
    Id: "Sub",
    Target_Total: 10,
    Estado: "Activo"
  };
  const Modelo = {
    Subobjetivos: { Sub },
    Partes: {},
    Avances: {
      Antes: {
        Id: "Antes",
        Subobjetivo_Id: "Sub",
        Cantidad: 6,
        Fecha: "2026-08-10",
        Fuente: "Subobjetivo"
      },
      Semana: {
        Id: "Semana",
        Subobjetivo_Id: "Sub",
        Cantidad: 4,
        Fecha: "2026-08-20",
        Fuente: "Subobjetivo"
      }
    }
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Normalizar_Fecha_Comparacion: (Fecha) => Fecha
  };
  Cargar_Funciones(Contexto, [
    "Planes_Subobjetivo_Raiz_Id",
    "Planes_Subobjetivos_Familia_Ids",
    "Planes_Periodo_Contiene_Fecha",
    "Planes_Fecha_Avance_Plan",
    "Planes_Estado_Normalizado_Subobjetivo",
    "Planes_Avances_Subobjetivo_Familia",
    "Planes_Subobjetivo_Completado_En_Periodo"
  ]);
  assert.equal(
    Contexto.Planes_Subobjetivo_Completado_En_Periodo(
      Sub,
      {
        Inicio: "2026-08-17",
        Fin: "2026-08-23"
      }
    ),
    true
  );
  assert.equal(
    Contexto.Planes_Subobjetivo_Completado_En_Periodo(
      Sub,
      {
        Inicio: "2026-08-10",
        Fin: "2026-08-16"
      }
    ),
    false
  );
});

test("mantiene el nombre Semana y el número ISO en los títulos antiguos", () => {
  const Contexto = {
    t: () => "Semana",
    Meses_Cortos: []
  };
  Cargar_Funciones(Contexto, [
    "Parsear_Fecha_ISO",
    "Planes_Numero_Semana_ISO",
    "Planes_Titulo_Tipo",
    "Planes_Titulo_Periodo"
  ]);
  assert.equal(Contexto.Planes_Titulo_Tipo("Semana"), "Semana");
  assert.equal(
    Contexto.Planes_Titulo_Periodo(
      "Semana",
      "2026-07-06",
      "2026-07-12"
    ),
    "Semana 28"
  );
});
