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

function Crear_Contexto(Opciones = {}) {
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
    Mes_2026_12: {
      Id: "Mes_2026_12", Tipo: "Mes",
      Inicio: "2026-12-01", Fin: "2026-12-31"
    },
    Semana_2026_40: {
      Id: "Semana_2026_40", Tipo: "Semana",
      Inicio: "2026-10-05", Fin: "2026-10-11"
    }
  };
  const Periodos_Con_Contenido = new Set(
    Opciones.Periodos_Con_Contenido || Object.keys(Periodos)
  );
  const Activados = [];
  const Contexto = {
    Planes_Subobjetivos_Objetivo_Id: "Objetivo_Lectofilia",
    Planes_Subobjetivos_Periodo_Contexto_Id: "Mes_2026_10",
    Planes_Subobjetivos_Modal_Seleccion: new Set(["Sub_1"]),
    Asegurar_Modelo_Planes: () => ({
      Objetivos: {
        Objetivo_Lectofilia: {
          Id: "Objetivo_Lectofilia",
          Periodo_Id: "Anio_2026"
        }
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
    Planes_Objetivo_Para_Periodo: (Objetivo, Periodo) => ({
      ...Objetivo,
      Periodo_Id: Periodo.Id
    }),
    Planes_Subobjetivos_Contexto_Objetivo: (Objetivo) => {
      const Tiene_Contenido = Periodos_Con_Contenido.has(
        Objetivo.Periodo_Id
      );
      const Info = { Sub: { Id: "Sub_1" } };
      return {
        Hijos_Por_Padre: new Map([
          ["", Tiene_Contenido ? [Info] : []]
        ])
      };
    },
    Planes_Subobjetivo_Rama_Visible_Contexto: () => true,
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
    "Planes_Subobjetivos_Mostrables_En_Periodo",
    "Planes_Periodo_Vecino_Con_Subobjetivos",
    "Planes_Periodo_Capa_Con_Subobjetivos",
    "Planes_Activar_Periodo_Subobjetivos",
    "Planes_Navegar_Subobjetivos_Periodo",
    "Planes_Navegar_Subobjetivos_Capa"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Periodos, Activados };
}

function Crear_Contexto_Visibilidad() {
  const Periodo_Mes = { Id: "Mes_2026_11", Tipo: "Mes" };
  const Periodo_Trimestre = {
    Id: "Trimestre_2026_4",
    Tipo: "Trimestre"
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({
      Objetivos: {
        Objetivo_Lectofilia: { Periodo_Id: Periodo_Mes.Id }
      },
      Periodos: {
        [Periodo_Mes.Id]: Periodo_Mes,
        [Periodo_Trimestre.Id]: Periodo_Trimestre
      }
    }),
    Planes_Rango_Subobjetivo_Para_Prorateo: () => null,
    Planes_Periodo_Contiene_Periodo: (Padre, Hijo) =>
      Padre.Id === Periodo_Trimestre.Id && Hijo?.Id === Periodo_Mes.Id
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Subobjetivo_Visible_Contexto_Objetivo"),
    Contexto
  );
  return { Contexto, Periodo_Trimestre };
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

test("saltea períodos laterales sin subobjetivos visibles", () => {
  const { Contexto, Activados } = Crear_Contexto({
    Periodos_Con_Contenido: ["Mes_2026_10", "Mes_2026_12"]
  });

  assert.equal(Contexto.Planes_Navegar_Subobjetivos_Periodo(1), true);
  assert.equal(
    Contexto.Planes_Subobjetivos_Periodo_Contexto_Id,
    "Mes_2026_12"
  );
  assert.deepEqual(Activados, ["Mes_2026_12"]);
});

test("los subobjetivos sin fechas siguen visibles en una capa padre", () => {
  const { Contexto, Periodo_Trimestre } = Crear_Contexto_Visibilidad();

  assert.equal(
    Contexto.Planes_Subobjetivo_Visible_Contexto_Objetivo(
      { Objetivo_Id: "Objetivo_Lectofilia" },
      {},
      Periodo_Trimestre
    ),
    true
  );
});
