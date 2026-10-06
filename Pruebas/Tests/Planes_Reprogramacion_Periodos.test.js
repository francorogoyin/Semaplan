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
    "Planes_Periodo_Destino_Predeterminado",
    "Planes_Periodo_Destino_Es_Posterior",
    "Planes_Periodo_Destino_Es_Admisible",
    "Planes_Fecha_Limite_Reprogramacion",
    "Planes_Elegir_Periodo_Destino"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return Contexto;
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
      String(Texto || "").trim().toLowerCase(),
    Planes_Objetivo_Padre_Id: (Objetivo) =>
      Objetivo.Objetivo_Padre_Id || "",
    Planes_Objetivo_Mostrable_En_Periodo: (Objetivo, Periodo) => {
      const Base = Periodos[Objetivo.Periodo_Id];
      return Boolean(
        Base &&
        Periodo.Inicio >= Base.Inicio &&
        Periodo.Fin <= Base.Fin
      );
    }
  };
  vm.createContext(Contexto);
  [
    "Planes_Periodos_Equivalentes",
    "Planes_Firma_Objetivo_Duplicado",
    "Planes_Objetivo_Duplicado_En_Periodo",
    "Planes_Objetivo_Destino_Reprogramacion"
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
    "Planes_Subobjetivo_Pendiente_Reprogramable",
    "Planes_Clonar_Rama_Reprogramada",
    "Planes_Marcar_Copias_Reprogramadas"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Modelo };
}

function Crear_Contexto_Madame_Bovary() {
  const Partes = {};
  for (let Indice = 0; Indice < 36; Indice += 1) {
    const Id = `Madame_Parte_${Indice + 1}`;
    Partes[Id] = {
      Id,
      Objetivo_Id: "Lectofilia_2027",
      Subobjetivo_Id: "Madame_Bovary_2027",
      Aporte_Total: Indice === 35 ? 2 : 8,
      Estado: "Pendiente",
      Eliminado_Local: false
    };
  }
  const Modelo = {
    Subobjetivos: {
      Madame_Bovary_2027: {
        Id: "Madame_Bovary_2027",
        Nombre: "Madame Bovary",
        Objetivo_Id: "Lectofilia_2027",
        Subobjetivo_Padre_Id: "",
        Target_Total: 282,
        Aporte_Meta: 1,
        Estado: "Activo",
        Hecha: false,
        Eliminado_Local: false
      }
    },
    Partes
  };
  let Parte_Siguiente = 0;
  const Contexto = {
    Crear_Id_Subobjetivo_Plan: () => "Madame_Bovary_2026",
    Planes_Progreso_Total_Subobjetivo: () => 0,
    Planes_Subobjetivos_De_Objetivo: (Objetivo_Id) =>
      Object.values(Modelo.Subobjetivos)
        .filter((Sub) => Sub.Objetivo_Id === Objetivo_Id),
    Normalizar_Subobjetivo_Plan: (Sub) => ({ ...Sub }),
    Planes_Partes_De_Subobjetivo: (Sub_Id) =>
      Object.values(Modelo.Partes)
        .filter((Parte) => Parte.Subobjetivo_Id === Sub_Id),
    Planes_Progreso_Total_Parte: () => 0,
    Crear_Id_Parte_Meta: () => {
      Parte_Siguiente += 1;
      return `Madame_Parte_2026_${Parte_Siguiente}`;
    },
    Normalizar_Parte_Meta: (Parte) => ({ ...Parte }),
    Planes_Subobjetivos_Hijos: () => []
  };
  vm.createContext(Contexto);
  [
    "Planes_Subobjetivo_Pendiente_Reprogramable",
    "Planes_Clonar_Rama_Reprogramada",
    "Planes_Marcar_Copias_Reprogramadas"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return { Contexto, Modelo };
}

function Crear_Contexto_Reprogramacion_Sin_Salto(Pendiente = true) {
  const Hijo_Pendiente = Pendiente === "Hijo_Pendiente";
  const Modelo = {
    Periodos: {
      Anio_2027: { Id: "Anio_2027", Tipo: "Anio" },
      Anio_2026: { Id: "Anio_2026", Tipo: "Anio" }
    },
    Objetivos: {
      Lectofilia_2027: {
        Id: "Lectofilia_2027",
        Periodo_Id: "Anio_2027"
      },
      Lectofilia_2026: {
        Id: "Lectofilia_2026",
        Periodo_Id: "Anio_2026"
      }
    },
    Subobjetivos: {
      Madame_Bovary_2027: {
        Id: "Madame_Bovary_2027",
        Objetivo_Id: "Lectofilia_2027",
        Subobjetivo_Padre_Id: "",
        Hecha: false,
        Eliminado_Local: false
      }
    }
  };
  if (Hijo_Pendiente) {
    Modelo.Subobjetivos.Padre_2027 = {
      Id: "Padre_2027",
      Objetivo_Id: "Lectofilia_2027",
      Subobjetivo_Padre_Id: "",
      Hecha: false,
      Eliminado_Local: false
    };
    Modelo.Subobjetivos.Madame_Bovary_2027.Subobjetivo_Padre_Id =
      "Padre_2027";
  }
  if (!Pendiente) delete Modelo.Objetivos.Lectofilia_2026;
  let Renderizados = 0;
  let Objetivos_Creados = 0;
  const Subobjetivos_Clonados = [];
  const Contexto = {
    Planes_Subobjetivos_Objetivo_Id: "Lectofilia_2027",
    Planes_Subobjetivos_Periodo_Contexto_Id: "Anio_2027",
    Planes_Subobjetivos_Modal_Seleccion: new Set(
      Hijo_Pendiente
        ? ["Padre_2027", "Madame_Bovary_2027"]
        : ["Madame_Bovary_2027"]
    ),
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Subobjetivo_Reprogramado: () => false,
    Mostrar_Toast_Error: () => {},
    t: (Clave) => Clave,
    Planes_Fecha_Limite_Reprogramacion: () => "2027-12-31",
    Planes_Elegir_Periodo_Destino: async () => Modelo.Periodos.Anio_2026,
    Planes_Subobjetivo_Pendiente_Reprogramable: (Sub) =>
      Hijo_Pendiente ? Sub.Id === "Madame_Bovary_2027" : Pendiente,
    Capturar_Snapshot_Undo: () => ({}),
    Planes_Objetivo_Destino_Reprogramacion: () =>
      Modelo.Objetivos.Lectofilia_2026 || null,
    Planes_Crear_Objetivo_Silencioso: () => {
      Objetivos_Creados += 1;
      return { Id: "Lectofilia_Nueva" };
    },
    Planes_Clonar_Datos_Objetivo: () => ({}),
    Planes_Clonar_Rama_Reprogramada: (
      Sub,
      _Objetivo_Destino_Id,
      _Padre_Destino_Id,
      _Modelo,
      Mapa,
      Raices
    ) => {
      Subobjetivos_Clonados.push(Sub.Id);
      Mapa.set(Sub.Id, "Madame_Bovary_2026");
      Raices.push({ Id: "Madame_Bovary_2026" });
    },
    Planes_Marcar_Copias_Reprogramadas: (Mapa) => Mapa.size,
    Planes_Actualizar_Progreso: () => {},
    Guardar_Estado: () => {},
    Mostrar_Toast_Undo: () => {},
    Render_Plan: () => { Renderizados += 1; },
    Render_Modal_Planes_Subobjetivos: () => { Renderizados += 1; }
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Reprogramar_Subobjetivos_A_Periodo"),
    Contexto
  );
  return {
    Contexto,
    Leer_Objetivos_Creados: () => Objetivos_Creados,
    Leer_Renderizados: () => Renderizados,
    Leer_Subobjetivos_Clonados: () => Subobjetivos_Clonados
  };
}

function Crear_Contexto_Limpieza_Huerfanos() {
  const Modelo = {
    Objetivos: {
      Huerfano: {
        Id: "Huerfano",
        Periodo_Origen: "Anio_2027",
        Estado_Vinculo: "Directo",
        Eliminado_Local: false
      },
      Manual_Vacio: {
        Id: "Manual_Vacio",
        Periodo_Origen: "",
        Estado_Vinculo: "Directo",
        Eliminado_Local: false
      },
      Reprogramado_Con_Sub: {
        Id: "Reprogramado_Con_Sub",
        Periodo_Origen: "Anio_2027",
        Estado_Vinculo: "Directo",
        Eliminado_Local: false
      }
    },
    Subobjetivos: {
      Copia: {
        Id: "Copia",
        Objetivo_Id: "Reprogramado_Con_Sub",
        Eliminado_Local: false
      }
    },
    Avances: {}
  };
  const Contexto = {
    Planes_Objetivo_Padre_Id: (Objetivo) =>
      Objetivo.Objetivo_Padre_Id || ""
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Limpiar_Objetivos_Reprogramacion_Huerfanos"),
    Contexto
  );
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
  let Predeterminado = "";
  Contexto.Planes_Mostrar_Dialogo_Periodo_Destino = async (
    _Mensaje,
    Periodos,
    Valor_Predeterminado
  ) => {
    Periodos_Mostrados = Periodos;
    Predeterminado = Valor_Predeterminado;
    return Valor_Predeterminado;
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
  assert.equal(Predeterminado, "Anio_2026");
  assert.equal(Destino?.Inicio, "2026-01-01");
});

test("preselecciona el período anterior equivalente más cercano", () => {
  const Contexto = Crear_Contexto();
  const Destino = Contexto.Planes_Periodo_Destino_Predeterminado(
    [
      { Id: "Anio_2025", Tipo: "Anio", Inicio: "2025-01-01" },
      { Id: "Mes_2026_10", Tipo: "Mes", Inicio: "2026-10-01" },
      { Id: "Anio_2026", Tipo: "Anio", Inicio: "2026-01-01" },
      { Id: "Anio_2028", Tipo: "Anio", Inicio: "2028-01-01" }
    ],
    { Id: "Anio_2027", Tipo: "Anio", Inicio: "2027-01-01" },
    null,
    true
  );

  assert.equal(Destino?.Id, "Anio_2026");
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

test("reprogramar reutiliza la meta anual visible en el mes", () => {
  const { Contexto, Modelo, Periodos } =
    Crear_Contexto_Destino_Exacto();
  Modelo.Objetivos.Objetivo_Mensual.Eliminado_Local = true;

  const Destino = Contexto.Planes_Objetivo_Destino_Reprogramacion(
    Modelo.Objetivos.Objetivo_Origen,
    Periodos.Mes_2026_11,
    Modelo
  );

  assert.equal(Destino?.Id, "Objetivo_Anual");
});

test("reprogramar hacia adelante conserva la misma meta anual", () => {
  const { Contexto, Modelo, Periodos } =
    Crear_Contexto_Destino_Exacto();
  Modelo.Objetivos.Objetivo_Origen.Periodo_Id = "Anio_2026";
  Modelo.Objetivos.Objetivo_Anual.Eliminado_Local = true;
  Modelo.Objetivos.Objetivo_Mensual.Eliminado_Local = true;

  const Destino = Contexto.Planes_Objetivo_Destino_Reprogramacion(
    Modelo.Objetivos.Objetivo_Origen,
    Periodos.Mes_2026_11,
    Modelo
  );

  assert.equal(Destino?.Id, "Objetivo_Origen");
});

test("limpia sólo contenedores huérfanos creados al reprogramar", () => {
  const { Contexto, Modelo } = Crear_Contexto_Limpieza_Huerfanos();

  const Limpiados =
    Contexto.Planes_Limpiar_Objetivos_Reprogramacion_Huerfanos(Modelo);

  assert.equal(Limpiados, 1);
  assert.equal(Modelo.Objetivos.Huerfano.Eliminado_Local, true);
  assert.equal(Modelo.Objetivos.Huerfano.Estado_Vinculo, "Eliminado");
  assert.equal(Modelo.Objetivos.Manual_Vacio.Eliminado_Local, false);
  assert.equal(
    Modelo.Objetivos.Reprogramado_Con_Sub.Eliminado_Local,
    false
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
    Raices_Creadas,
    {
      Id: "Anio_2026",
      Inicio: "2026-01-01",
      Fin: "2026-12-31"
    }
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

test("Madame Bovary conserva sus 282 páginas y 36 partes", () => {
  const { Contexto, Modelo } = Crear_Contexto_Madame_Bovary();
  const Mapa = new Map();
  const Raices_Creadas = [];

  Contexto.Planes_Clonar_Rama_Reprogramada(
    Modelo.Subobjetivos.Madame_Bovary_2027,
    "Lectofilia_2026",
    "",
    Modelo,
    Mapa,
    Raices_Creadas,
    {
      Id: "Anio_2026",
      Inicio: "2026-01-01",
      Fin: "2026-12-31"
    }
  );
  Contexto.Planes_Marcar_Copias_Reprogramadas(
    Mapa,
    "Lectofilia_2026",
    Modelo,
    "2026-10-06T03:00:00.000Z"
  );
  const Partes_Copiadas = Object.values(Modelo.Partes)
    .filter((Parte) => Parte.Subobjetivo_Id === "Madame_Bovary_2026");

  assert.equal(Raices_Creadas[0]?.Target_Total, 282);
  assert.equal(Raices_Creadas[0]?.Fecha_Inicio, "2026-01-01");
  assert.equal(Raices_Creadas[0]?.Fecha_Objetivo, "2026-12-31");
  assert.equal(Partes_Copiadas.length, 36);
  assert.equal(
    Partes_Copiadas.reduce(
      (Total, Parte) => Total + Number(Parte.Aporte_Total || 0),
      0
    ),
    282
  );
  assert.equal(
    Modelo.Subobjetivos.Madame_Bovary_2027
      .Reprogramado_A_Subobjetivo_Id,
    "Madame_Bovary_2026"
  );
});

test("no crea una meta destino si no queda pendiente clonable", async () => {
  const { Contexto, Leer_Objetivos_Creados, Leer_Renderizados } =
    Crear_Contexto_Reprogramacion_Sin_Salto(false);

  await Contexto.Planes_Reprogramar_Subobjetivos_A_Periodo([
    "Madame_Bovary_2027"
  ]);

  assert.equal(Leer_Objetivos_Creados(), 0);
  assert.equal(Leer_Renderizados(), 0);
});

test("un padre agotado no bloquea a su hijo pendiente", async () => {
  const { Contexto, Leer_Subobjetivos_Clonados } =
    Crear_Contexto_Reprogramacion_Sin_Salto("Hijo_Pendiente");

  await Contexto.Planes_Reprogramar_Subobjetivos_A_Periodo([
    "Padre_2027",
    "Madame_Bovary_2027"
  ]);

  assert.deepEqual(
    Leer_Subobjetivos_Clonados(),
    ["Madame_Bovary_2027"]
  );
});

test("reprogramar conserva abierto el período de origen", async () => {
  const { Contexto, Leer_Renderizados } =
    Crear_Contexto_Reprogramacion_Sin_Salto();

  await Contexto.Planes_Reprogramar_Subobjetivos_A_Periodo([
    "Madame_Bovary_2027"
  ]);

  assert.equal(
    Contexto.Planes_Subobjetivos_Objetivo_Id,
    "Lectofilia_2027"
  );
  assert.equal(
    Contexto.Planes_Subobjetivos_Periodo_Contexto_Id,
    "Anio_2027"
  );
  assert.equal(Contexto.Planes_Subobjetivos_Modal_Seleccion.size, 0);
  assert.equal(Leer_Renderizados(), 2);
});
