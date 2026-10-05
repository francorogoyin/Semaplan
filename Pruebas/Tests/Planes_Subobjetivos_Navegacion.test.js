const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  const Inicio_Funcion = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(
    Inicio_Funcion,
    -1,
    `No se encontró la función ${Nombre}`
  );
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio_Funcion);
  assert.notEqual(Fin_Parametros, -1);
  let Profundidad = 0;
  for (let Indice = Fin_Parametros + 2; Indice < Codigo_Login.length;
    Indice += 1) {
    if (Codigo_Login[Indice] === "{") Profundidad += 1;
    if (Codigo_Login[Indice] === "}") Profundidad -= 1;
    if (Profundidad === 0) {
      return Codigo_Login.slice(Inicio_Funcion, Indice + 1);
    }
  }
  throw new Error(`La función ${Nombre} quedó incompleta`);
}

function Contiene(Periodo, Fecha) {
  return Fecha >= Periodo.Inicio && Fecha <= Periodo.Fin;
}

function Crear_Contexto() {
  const Periodos = {
    Anio_2026: {
      Id: "Anio_2026", Tipo: "Anio",
      Inicio: "2026-01-01", Fin: "2026-12-31"
    },
    Trimestre_2026_4: {
      Id: "Trimestre_2026_4", Tipo: "Trimestre",
      Inicio: "2026-10-01", Fin: "2026-12-31"
    },
    Mes_2026_09: {
      Id: "Mes_2026_09", Tipo: "Mes",
      Inicio: "2026-09-01", Fin: "2026-09-30"
    },
    Mes_2026_10: {
      Id: "Mes_2026_10", Tipo: "Mes",
      Inicio: "2026-10-01", Fin: "2026-10-31"
    },
    Mes_2026_11: {
      Id: "Mes_2026_11", Tipo: "Mes",
      Inicio: "2026-11-01", Fin: "2026-11-30"
    },
    Semana_2026_40: {
      Id: "Semana_2026_40", Tipo: "Semana",
      Inicio: "2026-10-05", Fin: "2026-10-11"
    }
  };
  const Activados = [];
  const Contexto = {
    Planes_Subobjetivos_Objetivo_Id: "Objetivo_Lectofilia",
    Planes_Subobjetivos_Periodo_Contexto_Id: "Mes_2026_10",
    Planes_Subobjetivos_Modal_Seleccion: new Set(["Sub_1"]),
    Asegurar_Modelo_Planes: () => ({
      Objetivos: {
        Objetivo_Lectofilia: { Periodo_Id: "Anio_2026" }
      },
      Periodos
    }),
    Planes_Periodo_Activo: () => Periodos.Mes_2026_10,
    Planes_Capas_Visibles: () => [
      "Anio", "Trimestre", "Mes", "Semana"
    ],
    Planes_Crear_Periodos_Capa_Visibles: (Tipo) => Object.values(
      Periodos
    ).filter((Periodo) => Periodo.Tipo === Tipo),
    Formatear_Fecha_ISO: () => "2026-10-05",
    Planes_Periodo_Contiene_Fecha: Contiene,
    Planes_Periodo_Contiene_Periodo: (Padre, Hijo) =>
      Padre.Inicio <= Hijo.Inicio && Padre.Fin >= Hijo.Fin,
    Planes_Vecinos_Periodo_Misma_Capa: (Periodo) => {
      const Mismos = Object.values(Periodos)
        .filter((Item) => Item.Tipo === Periodo.Tipo)
        .sort((A, B) => A.Inicio.localeCompare(B.Inicio));
      const Indice = Mismos.findIndex((Item) => Item.Id === Periodo.Id);
      return {
        Anterior: Mismos[Indice - 1] || null,
        Siguiente: Mismos[Indice + 1] || null
      };
    },
    Planes_Activar_Periodo_Desde_Coleccion: (Periodo) => {
      Activados.push(Periodo.Id);
    },
    Planes_Cerrar_Menus_Objetivo: () => {},
    Render_Modal_Planes_Subobjetivos: () => {},
    Planes_Aplicar_Contexto_Modal_Periodo: () => {}
  };
  vm.createContext(Contexto);
  [
    "Planes_Periodo_Equivalente_En_Capa",
    "Planes_Periodo_Subobjetivos_Actual",
    "Planes_Activar_Periodo_Subobjetivos",
    "Planes_Navegar_Subobjetivos_Periodo",
    "Planes_Navegar_Subobjetivos_Capa"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Periodos, Activados };
}

test("encuentra la capa vecina que contiene al período abierto", () => {
  const { Contexto, Periodos } = Crear_Contexto();

  assert.equal(
    Contexto.Planes_Periodo_Equivalente_En_Capa(
      Periodos.Mes_2026_10,
      -1
    )?.Id,
    "Trimestre_2026_4"
  );
  assert.equal(
    Contexto.Planes_Periodo_Equivalente_En_Capa(
      Periodos.Mes_2026_10,
      1
    )?.Id,
    "Semana_2026_40"
  );
});

test("navegar Subobjetivos cambia el contexto y limpia selección", () => {
  const { Contexto, Activados } = Crear_Contexto();

  assert.equal(Contexto.Planes_Navegar_Subobjetivos_Periodo(1), true);
  assert.equal(
    Contexto.Planes_Subobjetivos_Periodo_Contexto_Id,
    "Mes_2026_11"
  );
  assert.equal(Contexto.Planes_Subobjetivos_Modal_Seleccion.size, 0);
  assert.deepEqual(Activados, ["Mes_2026_11"]);
});

test("la flecha vertical conserva el objetivo y cambia de capa", () => {
  const { Contexto, Activados } = Crear_Contexto();

  assert.equal(Contexto.Planes_Navegar_Subobjetivos_Capa(-1), true);
  assert.equal(
    Contexto.Planes_Subobjetivos_Periodo_Contexto_Id,
    "Trimestre_2026_4"
  );
  assert.deepEqual(Activados, ["Trimestre_2026_4"]);
});
