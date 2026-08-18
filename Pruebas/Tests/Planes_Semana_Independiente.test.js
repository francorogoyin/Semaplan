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
