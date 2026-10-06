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

function Crear_Contexto_Destino_Exacto() {
  const Periodos = {
    Anio_2026: {
      Id: "Anio_2026", Tipo: "Anio",
      Inicio: "2026-01-01", Fin: "2026-12-31"
    },
    Mes_2026_11: {
      Id: "Mes_2026_11", Tipo: "Mes",
      Inicio: "2026-11-01", Fin: "2026-11-30"
    }
  };
  const Modelo = {
    Periodos,
    Objetivos: {
      Objetivo_Origen: {
        Id: "Objetivo_Origen",
        Nombre: "Lectofilia",
        Emoji: "📚",
        Periodo_Id: "Anio_2027"
      },
      Objetivo_Anual: {
        Id: "Objetivo_Anual",
        Nombre: "Lectofilia",
        Emoji: "📚",
        Periodo_Id: "Anio_2026"
      },
      Objetivo_Mensual: {
        Id: "Objetivo_Mensual",
        Nombre: "Lectofilia",
        Emoji: "📚",
        Periodo_Id: "Mes_2026_11"
      }
    }
  };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Normalizar_Texto_Meta_Objetivo: (Texto) =>
      String(Texto || "").trim().toLowerCase()
  };
  vm.createContext(Contexto);
  [
    "Planes_Periodos_Equivalentes",
    "Planes_Firma_Objetivo_Duplicado",
    "Planes_Objetivo_Duplicado_En_Periodo"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Modelo, Periodos };
}

function Crear_Contexto_Marca_Reprogramacion() {
  const Modelo = {
    Subobjetivos: {
      Fuente_Raiz: {
        Id: "Fuente_Raiz",
        Objetivo_Id: "Objetivo_Origen",
        Estado: "Activo"
      },
      Fuente_Hijo: {
        Id: "Fuente_Hijo",
        Objetivo_Id: "Objetivo_Origen",
        Estado: "Activo"
      },
      Fuente_No_Clonada: {
        Id: "Fuente_No_Clonada",
        Objetivo_Id: "Objetivo_Origen",
        Estado: "Cumplido",
        Hecha: true
      },
      Copia_Raiz: {
        Id: "Copia_Raiz",
        Objetivo_Id: "Objetivo_Destino"
      },
      Copia_Hijo: {
        Id: "Copia_Hijo",
        Objetivo_Id: "Objetivo_Destino"
      }
    }
  };
  const Contexto = {};
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Marcar_Copias_Reprogramadas"),
    Contexto
  );
  return { Contexto, Modelo };
}

function Crear_Contexto_Familia_Estructural() {
  const Modelo = {
    Subobjetivos: {
      Raiz: {
        Id: "Raiz",
        Subobjetivo_Padre_Id: ""
      },
      Hijo: {
        Id: "Hijo",
        Subobjetivo_Padre_Id: "Raiz"
      },
      Nieto: {
        Id: "Nieto",
        Subobjetivo_Padre_Id: "Hijo"
      },
      Ajeno: {
        Id: "Ajeno",
        Subobjetivo_Padre_Id: ""
      }
    }
  };
  const Contexto = {};
  vm.createContext(Contexto);
  [
    "Planes_Subobjetivo_Raiz_Id",
    "Planes_Subobjetivos_Familia_Ids",
    "Planes_Subobjetivos_Familia_Con_Hijos_Ids"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Modelo };
}

function Crear_Contexto_Clonado_Completo() {
  const Modelo = {
    Subobjetivos: {
      Fuente_Raiz: {
        Id: "Fuente_Raiz",
        Objetivo_Id: "Objetivo_Origen",
        Subobjetivo_Padre_Id: "",
        Target_Total: 10,
        Progreso_Prueba: 2,
        Estado: "Activo"
      },
      Fuente_Hijo: {
        Id: "Fuente_Hijo",
        Objetivo_Id: "Objetivo_Origen",
        Subobjetivo_Padre_Id: "Fuente_Raiz",
        Target_Total: 5,
        Progreso_Prueba: 1,
        Estado: "Activo"
      }
    },
    Partes: {}
  };
  const Ids = ["Copia_Raiz", "Copia_Hijo"];
  const Contexto = {
    Crear_Id_Subobjetivo_Plan: () => Ids.shift(),
    Planes_Progreso_Total_Subobjetivo: (Sub) =>
      Sub.Progreso_Prueba || 0,
    Planes_Subobjetivos_De_Objetivo: (Objetivo_Id) =>
      Object.values(Modelo.Subobjetivos)
        .filter((Sub) => Sub.Objetivo_Id === Objetivo_Id),
    Normalizar_Subobjetivo_Plan: (Sub) => ({ ...Sub }),
    Planes_Partes_De_Subobjetivo: () => [],
    Planes_Progreso_Total_Parte: () => 0,
    Crear_Id_Parte_Meta: () => "",
    Normalizar_Parte_Meta: (Parte) => ({ ...Parte }),
    Planes_Subobjetivos_Hijos: (Sub_Id) =>
      Object.values(Modelo.Subobjetivos)
        .filter((Sub) =>
          Sub.Objetivo_Id === "Objetivo_Origen" &&
          Sub.Subobjetivo_Padre_Id === Sub_Id
        )
  };
  vm.createContext(Contexto);
  [
    "Planes_Clonar_Rama_Reprogramada",
    "Planes_Marcar_Copias_Reprogramadas"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Modelo };
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

test("reutiliza sólo el objetivo del período exacto elegido", () => {
  const { Contexto, Modelo, Periodos } =
    Crear_Contexto_Destino_Exacto();

  const Destino = Contexto.Planes_Objetivo_Duplicado_En_Periodo(
    Modelo.Objetivos.Objetivo_Origen,
    Periodos.Anio_2026,
    Modelo
  );

  assert.equal(Destino?.Id, "Objetivo_Anual");
  Modelo.Objetivos.Objetivo_Anual.Eliminado_Local = true;
  assert.equal(
    Contexto.Planes_Objetivo_Duplicado_En_Periodo(
      Modelo.Objetivos.Objetivo_Origen,
      Periodos.Anio_2026,
      Modelo
    ),
    null
  );
});

test("marca cada fuente con su copia exacta y no toca las omitidas", () => {
  const { Contexto, Modelo } = Crear_Contexto_Marca_Reprogramacion();
  const Mapa = new Map([
    ["Fuente_Raiz", "Copia_Raiz"],
    ["Fuente_Hijo", "Copia_Hijo"]
  ]);

  const Marcados = Contexto.Planes_Marcar_Copias_Reprogramadas(
    Mapa,
    "Objetivo_Destino",
    Modelo,
    "2026-10-06T03:00:00.000Z"
  );

  assert.equal(Marcados, 2);
  assert.equal(
    Modelo.Subobjetivos.Fuente_Raiz.Reprogramado_A_Subobjetivo_Id,
    "Copia_Raiz"
  );
  assert.equal(
    Modelo.Subobjetivos.Fuente_Hijo.Reprogramado_A_Subobjetivo_Id,
    "Copia_Hijo"
  );
  assert.equal(
    Modelo.Subobjetivos.Fuente_No_Clonada.Reprogramado,
    undefined
  );
});

test("reactivar una raíz alcanza también a todos sus hijos", () => {
  const { Contexto, Modelo } = Crear_Contexto_Familia_Estructural();

  const Familia = Contexto.Planes_Subobjetivos_Familia_Con_Hijos_Ids(
    "Raiz",
    Modelo
  );

  assert.deepEqual(
    [...Familia].sort(),
    ["Hijo", "Nieto", "Raiz"]
  );
});

test("clona y vincula una rama completa hacia atrás", () => {
  const { Contexto, Modelo } = Crear_Contexto_Clonado_Completo();
  const Mapa = new Map();
  const Raices_Creadas = [];

  Contexto.Planes_Clonar_Rama_Reprogramada(
    Modelo.Subobjetivos.Fuente_Raiz,
    "Objetivo_Destino",
    "",
    Modelo,
    Mapa,
    Raices_Creadas
  );
  const Marcados = Contexto.Planes_Marcar_Copias_Reprogramadas(
    Mapa,
    "Objetivo_Destino",
    Modelo,
    "2026-10-06T03:00:00.000Z"
  );

  assert.equal(Raices_Creadas[0]?.Id, "Copia_Raiz");
  assert.equal(
    Modelo.Subobjetivos.Copia_Hijo.Subobjetivo_Padre_Id,
    "Copia_Raiz"
  );
  assert.equal(Modelo.Subobjetivos.Copia_Raiz.Target_Total, 8);
  assert.equal(Modelo.Subobjetivos.Copia_Hijo.Target_Total, 4);
  assert.equal(Marcados, 2);
  assert.equal(
    Modelo.Subobjetivos.Fuente_Hijo.Reprogramado_A_Subobjetivo_Id,
    "Copia_Hijo"
  );
});
