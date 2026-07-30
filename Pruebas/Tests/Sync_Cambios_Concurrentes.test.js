const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  const Inicio = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(
    Inicio,
    -1,
    `No se encontro la funcion ${Nombre}`
  );
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio);
  assert.notEqual(
    Fin_Parametros,
    -1,
    `No se encontro el cuerpo de ${Nombre}`
  );
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
  throw new Error(`La funcion ${Nombre} quedo incompleta`);
}

function Crear_Entorno({
  Revision_Actual = 1,
  Estado_Local = {},
  Sucio = true
} = {}) {
  const Eventos = {
    Indicadores: [],
    Programaciones: 0,
    Emisiones: 0,
    Sucios: [],
    Timers_Limpiados: []
  };
  const Contexto = {
    Sync_Local_Revision: Revision_Actual,
    Sync_Local_Sucio: Sucio,
    Sync_Reintento_Timer_Id: null,
    Sync_Reintento_Intentos: 3,
    Sync_Remoto_Fila_Existe: false,
    Sync_Remoto_Estado_Ultimo: null,
    Sync_Remoto_Version_Actual: 4,
    structuredClone,
    console
  };

  Contexto.clearTimeout = (Id) => {
    Eventos.Timers_Limpiados.push(Id);
  };
  Contexto.Clonar_Estado_Sync = (Estado) =>
    structuredClone(Estado);
  Contexto.Actualizar_Marca_Datos_Sync_Desde_Estado =
    () => {};
  Contexto.Actualizar_Meta_Remota = (Datos) => {
    if (Datos?.version) {
      Contexto.Sync_Remoto_Version_Actual = Datos.version;
    }
  };
  Contexto.Marcar_Sync_Remoto_Actualizado = () => {};
  Contexto.Leer_Estado_Local_Cache_Sync = () =>
    structuredClone(Estado_Local);
  Contexto.Fusionar_Estado_Raiz_Faltante = (Base, Nuevo) => ({
    ...(Base || {}),
    ...(Nuevo || {})
  });
  Contexto.Estados_Datos_Sync_Iguales = (A, B) =>
    JSON.stringify(A) === JSON.stringify(B);
  Contexto.Marcar_Sync_Local_Sucio = (Valor) => {
    Contexto.Sync_Local_Sucio = Boolean(Valor);
    Eventos.Sucios.push(Boolean(Valor));
  };
  Contexto.Actualizar_Sync_Indicador = (Valor) => {
    Eventos.Indicadores.push(Valor);
  };
  Contexto.Backend_Sync_Programar = () => {
    Eventos.Programaciones += 1;
  };
  Contexto.Emitir_Evento_Local_Sync = () => {
    Eventos.Emisiones += 1;
  };

  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Backend_Registrar_Sync_Exitoso"),
    Contexto
  );
  return { Contexto, Eventos };
}

test("confirma solo la misma revision y muestra Guardado", () => {
  const Estado = {
    Eventos: [{ Id: "Evento_1" }],
    Tareas: [{ Id: "Tarea_1" }]
  };
  const { Contexto, Eventos } = Crear_Entorno({
    Revision_Actual: 7,
    Estado_Local: Estado
  });

  const Resultado = Contexto.Backend_Registrar_Sync_Exitoso(
    { version: 5 },
    Estado,
    {
      Confirmar_Datos_Locales: true,
      Revision_Local: 7
    }
  );

  assert.equal(Resultado.Hay_Cambio_Posterior, false);
  assert.equal(Contexto.Sync_Local_Sucio, false);
  assert.deepEqual(Eventos.Indicadores, ["Guardado"]);
  assert.equal(Eventos.Programaciones, 0);
  assert.equal(Eventos.Emisiones, 1);
});

test("conserva pendiente una revision creada durante el envio", () => {
  const Estado_Enviado = {
    Habitos_Registros: [{ Id: "Registro_1" }]
  };
  const Estado_Local = {
    Habitos_Registros: [
      { Id: "Registro_1" },
      { Id: "Registro_2" }
    ]
  };
  const { Contexto, Eventos } = Crear_Entorno({
    Revision_Actual: 8,
    Estado_Local
  });

  const Resultado = Contexto.Backend_Registrar_Sync_Exitoso(
    { version: 5 },
    Estado_Enviado,
    {
      Confirmar_Datos_Locales: true,
      Revision_Local: 7
    }
  );

  assert.equal(Resultado.Hay_Cambio_Posterior, true);
  assert.equal(Contexto.Sync_Local_Sucio, true);
  assert.deepEqual(Eventos.Indicadores, ["Guardando"]);
  assert.equal(Eventos.Programaciones, 1);
  assert.equal(Eventos.Emisiones, 0);
});

test("detecta contenido posterior aunque la revision no cambie", () => {
  const Estado_Enviado = {
    Notas_Archivero: [{ Id: "Nota_1", Texto: "Antes" }]
  };
  const Estado_Local = {
    Notas_Archivero: [{ Id: "Nota_1", Texto: "Despues" }]
  };
  const { Contexto, Eventos } = Crear_Entorno({
    Revision_Actual: 3,
    Estado_Local
  });

  const Resultado = Contexto.Backend_Registrar_Sync_Exitoso(
    null,
    Estado_Enviado,
    {
      Confirmar_Datos_Locales: true,
      Revision_Local: 3
    }
  );

  assert.equal(Resultado.Hay_Cambio_Posterior, true);
  assert.equal(Contexto.Sync_Local_Sucio, true);
  assert.deepEqual(Eventos.Indicadores, ["Guardando"]);
  assert.equal(Eventos.Programaciones, 1);
});

test("un guardado operativo no limpia cambios de datos", () => {
  const Estado = {
    Tareas: [{ Id: "Tarea_1" }],
    Sesiones_Operativas: { Activas: {} }
  };
  const { Contexto, Eventos } = Crear_Entorno({
    Revision_Actual: 4,
    Estado_Local: Estado,
    Sucio: true
  });
  Contexto.Sync_Reintento_Timer_Id = 23;

  const Resultado = Contexto.Backend_Registrar_Sync_Exitoso(
    { version: 5 },
    Estado
  );

  assert.equal(Resultado.Datos_Confirmados, false);
  assert.equal(Contexto.Sync_Local_Sucio, true);
  assert.deepEqual(Eventos.Sucios, []);
  assert.deepEqual(Eventos.Indicadores, []);
  assert.equal(Eventos.Programaciones, 0);
  assert.deepEqual(Eventos.Timers_Limpiados, []);
});

test("reconoce timeouts de servidor y cancelacion cliente", () => {
  const Contexto = {};
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Sync_Error_Timeout_Query"),
    Contexto
  );

  assert.equal(
    Contexto.Sync_Error_Timeout_Query({ code: "57014" }),
    true
  );
  assert.equal(
    Contexto.Sync_Error_Timeout_Query({
      name: "AbortError",
      message: "The operation was aborted"
    }),
    true
  );
  assert.equal(
    Contexto.Sync_Error_Timeout_Query({
      message: "signal timed out"
    }),
    true
  );
  assert.equal(
    Contexto.Sync_Error_Timeout_Query({
      message: "duplicate key"
    }),
    false
  );
});

test("el contrato cubre los modulos persistidos principales", () => {
  const Claves = [
    "Objetivos",
    "Eventos",
    "Planes_Slot",
    "Baul_Objetivos",
    "Archiveros",
    "Notas_Archivero",
    "Habitos",
    "Habitos_Registros",
    "Retos",
    "Tareas",
    "Planes_Periodo"
  ];

  for (const Clave of Claves) {
    assert.match(
      Codigo_Login,
      new RegExp(`"${Clave}"|\\b${Clave},`)
    );
  }
  assert.equal(
    (
      Codigo_Login.match(
        /Confirmar_Datos_Locales:\s*true/g
      ) || []
    ).length,
    4
  );
  assert.match(
    Codigo_Login,
    /const Sync_Timeout_Consulta_Ms = 45000;/
  );
  assert.ok(
    (
      Codigo_Login.match(
        /Aplicar_Timeout_Consulta_Sync\(/g
      ) || []
    ).length >= 5
  );
});
