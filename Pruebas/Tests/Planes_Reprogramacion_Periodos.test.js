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
  const Inicio = Codigo_Login.slice(
    Math.max(0, Inicio_Funcion - 6),
    Inicio_Funcion
  ) === "async "
    ? Inicio_Funcion - 6
    : Inicio_Funcion;
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio);
  assert.notEqual(Fin_Parametros, -1);
  let Profundidad = 0;
  for (let Indice = Fin_Parametros + 2; Indice < Codigo_Login.length;
    Indice += 1) {
    if (Codigo_Login[Indice] === "{") Profundidad += 1;
    if (Codigo_Login[Indice] === "}") Profundidad -= 1;
    if (Profundidad === 0) return Codigo_Login.slice(Inicio, Indice + 1);
  }
  throw new Error(`La función ${Nombre} quedó incompleta`);
}

function Crear_Contexto() {
  const Contexto = {
    Planes_Tipos: ["Anio", "Semestre", "Trimestre", "Mes", "Semana"],
    Planes_Normalizar_Fecha_Comparacion: (Fecha) =>
      /^\d{4}-\d{2}-\d{2}$/.test(String(Fecha || ""))
        ? String(Fecha)
        : "",
    Planes_Periodos_Destino_Misma_Capa: () => [],
    Planes_Crear_Periodos_Capa_Visibles: () => [],
    Planes_Cantidad_Subperiodos: () => 1,
    Planes_Crear_Periodo_Por_Capa: (Tipo, Anio) => ({
      Id: `${Tipo}_${Anio}`,
      Tipo,
      Inicio: `${Anio}-01-01`,
      Fin: `${Anio}-12-31`
    }),
    Asegurar_Modelo_Planes: () => ({
      UI: { Anio_Desde: 2027, Anio_Hasta: 2027 }
    }),
    Mostrar_Toast_Error: () => {},
    t: (Clave) => Clave
  };
  vm.createContext(Contexto);
  [
    "Planes_Periodos_Destino_Agrupados",
    "Planes_Periodo_Destino_Elegido",
    "Planes_Periodo_Destino_Es_Posterior",
    "Planes_Periodo_Destino_Es_Admisible",
    "Planes_Fecha_Limite_Reprogramacion",
    "Planes_Elegir_Periodo_Destino"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return Contexto;
}

function Crear_Contexto_Enfoque_Destino() {
  const Activados = [];
  const Contextos_Aplicados = [];
  const Periodos = {
    Anio_2026: { Id: "Anio_2026", Tipo: "Anio" },
    Mes_2026_11: { Id: "Mes_2026_11", Tipo: "Mes" }
  };
  const Overlay = {
    classList: { contains: (Clase) => Clase === "Activo" }
  };
  const Contexto = {
    Planes_Subobjetivos_Objetivo_Id: "Objetivo_2027",
    Planes_Subobjetivos_Periodo_Contexto_Id: "Anio_2027",
    Planes_Subobjetivos_Modal_Seleccion: new Set(["Sub_2027"]),
    Asegurar_Modelo_Planes: () => ({ Periodos }),
    document: {
      getElementById: (Id) => Id === "Planes_Subobjetivos_Overlay"
        ? Overlay
        : null
    },
    Planes_Activar_Periodo_Desde_Coleccion: (Periodo) => {
      Activados.push(Periodo.Id);
    },
    Planes_Aplicar_Contexto_Modal_Periodo: (Overlay_Id, Periodo_Id) => {
      Contextos_Aplicados.push([Overlay_Id, Periodo_Id]);
    }
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Enfocar_Destino_Reprogramado"),
    Contexto
  );
  return { Activados, Contexto, Contextos_Aplicados, Periodos };
}

test("agrupa los destinos por año y después por capa", () => {
  const Contexto = Crear_Contexto();
  const Agrupados = Contexto.Planes_Periodos_Destino_Agrupados([
    { Id: "Sem_2027", Tipo: "Semana", Inicio: "2027-01-04" },
    { Id: "Anio_2026", Tipo: "Anio", Inicio: "2026-01-01" },
    { Id: "Mes_2026", Tipo: "Mes", Inicio: "2026-02-01" },
    { Id: "Sem_2026", Tipo: "Semana", Inicio: "2026-01-04" }
  ]);

  assert.deepEqual(JSON.parse(JSON.stringify(Agrupados)), [
    {
      Anio: "2026",
      Tipos: [
        {
          Tipo: "Anio",
          Periodos: [{ Id: "Anio_2026", Tipo: "Anio", Inicio: "2026-01-01" }]
        },
        {
          Tipo: "Mes",
          Periodos: [{ Id: "Mes_2026", Tipo: "Mes", Inicio: "2026-02-01" }]
        },
        {
          Tipo: "Semana",
          Periodos: [{ Id: "Sem_2026", Tipo: "Semana", Inicio: "2026-01-04" }]
        }
      ]
    },
    {
      Anio: "2027",
      Tipos: [
        {
          Tipo: "Semana",
          Periodos: [{ Id: "Sem_2027", Tipo: "Semana", Inicio: "2027-01-04" }]
        }
      ]
    }
  ]);
});

test("devuelve un período futuro creado para la selección", () => {
  const Contexto = Crear_Contexto();
  const Periodo_Futuro = {
    Id: "Semana_2027_02",
    Tipo: "Semana",
    Inicio: "2027-01-11",
    Fin: "2027-01-17"
  };
  const Resultado = Contexto.Planes_Periodo_Destino_Elegido(
    [Periodo_Futuro],
    Periodo_Futuro.Id
  );

  assert.deepEqual(JSON.parse(JSON.stringify(Resultado)), Periodo_Futuro);
});

test("reprograma después del vencimiento propio del subobjetivo", () => {
  const Contexto = Crear_Contexto();
  const Limite = Contexto.Planes_Fecha_Limite_Reprogramacion([
    {
      Fecha_Inicio: "2026-10-01",
      Fecha_Objetivo: "2026-12-31"
    }
  ], {
    Inicio: "2026-01-01",
    Fin: "2026-12-31"
  });

  assert.equal(Limite, "2026-12-31");
  assert.equal(
    Contexto.Planes_Periodo_Destino_Es_Posterior(
      { Inicio: "2026-01-05" },
      Limite
    ),
    false
  );
  assert.equal(
    Contexto.Planes_Periodo_Destino_Es_Posterior(
      { Inicio: "2027-01-04" },
      Limite
    ),
    true
  );
});

test("Reprogramar admite destinos anteriores sin relajar Trasladar", () => {
  const Contexto = Crear_Contexto();
  const Periodo_Anterior = { Inicio: "2026-01-05" };

  assert.equal(
    Contexto.Planes_Periodo_Destino_Es_Admisible(
      Periodo_Anterior,
      "2026-12-31"
    ),
    false
  );
  assert.equal(
    Contexto.Planes_Periodo_Destino_Es_Admisible(
      Periodo_Anterior,
      "2026-12-31",
      true
    ),
    true
  );
});

test("Reprogramar genera el año anterior aunque no esté visible", async () => {
  const Contexto = Crear_Contexto();
  let Periodos_Mostrados = [];
  Contexto.Planes_Mostrar_Dialogo_Periodo_Destino = async (
    _Mensaje,
    Periodos
  ) => {
    Periodos_Mostrados = Periodos;
    return Periodos[0]?.Id || "";
  };

  const Destino = await Contexto.Planes_Elegir_Periodo_Destino(
    { Id: "Anio_2027", Tipo: "Anio", Inicio: "2027-01-01" },
    "Elegí destino",
    null,
    true,
    {
      Fecha_Limite: "2027-12-31",
      Permitir_Anterior: true
    }
  );

  assert.ok(Periodos_Mostrados.some((Periodo) =>
    Periodo.Inicio === "2026-01-01"
  ));
  assert.equal(Destino?.Inicio, "2026-01-01");
});

test("al reprogramar enfoca el período real de la copia anterior", () => {
  const {
    Activados,
    Contexto,
    Contextos_Aplicados,
    Periodos
  } = Crear_Contexto_Enfoque_Destino();

  const Enfoco = Contexto.Planes_Enfocar_Destino_Reprogramado(
    { Id: "Objetivo_2026", Periodo_Id: "Mes_2026_11" },
    Periodos.Anio_2026
  );

  assert.equal(Enfoco, true);
  assert.equal(
    Contexto.Planes_Subobjetivos_Objetivo_Id,
    "Objetivo_2026"
  );
  assert.equal(
    Contexto.Planes_Subobjetivos_Periodo_Contexto_Id,
    "Mes_2026_11"
  );
  assert.equal(Contexto.Planes_Subobjetivos_Modal_Seleccion.size, 0);
  assert.deepEqual(Activados, ["Mes_2026_11"]);
  assert.deepEqual(Contextos_Aplicados, [[
    "Planes_Subobjetivos_Overlay",
    "Mes_2026_11"
  ]]);
});
