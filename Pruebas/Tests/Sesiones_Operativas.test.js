const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  let Inicio = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(
    Inicio,
    -1,
    `No se encontró la función ${Nombre}`
  );
  if (Codigo_Login.slice(Inicio - 6, Inicio) === "async ") {
    Inicio -= 6;
  }
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

function Crear_Entorno_Corte({
  Id = "ses_actual",
  Instancia = "inst_actual",
  Token = "corte_anterior",
  Corte_Ms = 100
} = {}) {
  const Guardado = new Map();
  const Contexto = {
    Clave_Sesion_Operativa_Corte_Aceptado: "corte_aceptado",
    Sesion_Operativa_Corte_Aceptado_Token: Token,
    Sesion_Operativa_Corte_Aceptado_Ms: Corte_Ms,
    Sesion_Operativa_Corte_Aceptado_Inicializado: true,
    Sync_Sesion_Cerrando: false,
    Sync_Sesion_Inicio_Local_Ms: 9_999_999_999_999,
    sessionStorage: {
      getItem(Clave) {
        return Guardado.get(Clave) || null;
      },
      setItem(Clave, Valor) {
        Guardado.set(Clave, String(Valor));
      }
    },
    Normalizar_Sesiones_Operativas(Estado) {
      return Estado?.Sesiones_Operativas || { Activas: {} };
    },
    Obtener_Sesion_Operativa_Id: () => Id,
    Obtener_Sesion_Operativa_Instancia_Id: () => Instancia
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Obtener_Corte_Token_Sesion_Operativa"),
    Contexto
  );
  vm.runInContext(
    Extraer_Funcion("Aceptar_Corte_Sesion_Operativa"),
    Contexto
  );
  vm.runInContext(
    Extraer_Funcion("Sesion_Operativa_Corte_Remoto_Activo"),
    Contexto
  );
  return { Contexto, Guardado };
}

test("expulsa una sesión ajena aunque su reloj esté adelantado", () => {
  const { Contexto } = Crear_Entorno_Corte();
  const Estado = {
    Sesiones_Operativas: {
      Corte_Ms: 50,
      Corte_Token: "corte_nuevo",
      Corte_Excepto_Id: "otra_sesion",
      Corte_Excepto_Instancia_Id: "otra_instancia",
      Activas: {}
    }
  };

  assert.equal(
    Contexto.Sesion_Operativa_Corte_Remoto_Activo(Estado),
    true
  );
});

test("la sesión que ordenó el cierre queda exceptuada", () => {
  const { Contexto } = Crear_Entorno_Corte();
  const Estado = {
    Sesiones_Operativas: {
      Corte_Ms: 200,
      Corte_Token: "corte_nuevo",
      Corte_Excepto_Id: "ses_actual",
      Corte_Excepto_Instancia_Id: "inst_actual",
      Activas: {}
    }
  };

  assert.equal(
    Contexto.Sesion_Operativa_Corte_Remoto_Activo(Estado),
    false
  );
});

test("un ingreso nuevo acepta el corte vigente sin autoexpulsarse", () => {
  const { Contexto, Guardado } = Crear_Entorno_Corte();
  const Estado = {
    Sesiones_Operativas: {
      Corte_Ms: 8_000_000_000_000,
      Corte_Token: "corte_vigente",
      Corte_Excepto_Id: "ses_anterior",
      Activas: {}
    }
  };

  Contexto.Aceptar_Corte_Sesion_Operativa(Estado);

  assert.equal(
    Contexto.Sesion_Operativa_Corte_Remoto_Activo(Estado),
    false
  );
  assert.deepEqual(
    JSON.parse(Guardado.get("corte_aceptado")),
    {
      Instancia_Id: "inst_actual",
      Token: "corte_vigente",
      Corte_Ms: 8_000_000_000_000
    }
  );
});

test("cerrar otras elimina marcas ajenas y crea un corte único", () => {
  const Contexto = {
    Es_Objeto_Json: (Valor) => Boolean(
      Valor && typeof Valor === "object" && !Array.isArray(Valor)
    ),
    Normalizar_Sesiones_Operativas(Estado) {
      return {
        ...(Estado?.Sesiones_Operativas || {}),
        Activas: Estado?.Sesiones_Operativas?.Activas || {}
      };
    },
    Obtener_Sesion_Operativa_Id: () => "ses_actual",
    Obtener_Sesion_Operativa_Instancia_Id: () => "inst_actual",
    Clave_Sesion_Operativa_Activa: (Id, Instancia) =>
      `${Id}::${Instancia}`,
    Clave_Sesion_Operativa_Desde_Sesion: (Sesion) =>
      `${Sesion.Id}::${Sesion.Instancia_Id}`,
    Sesion_Operativa_Es_La_Actual: (Sesion) =>
      Sesion?.Id === "ses_actual" &&
      Sesion?.Instancia_Id === "inst_actual",
    Sesion_Operativa_Es_Reciente: () => true,
    Construir_Marca_Sesion_Operativa: () => ({
      Id: "ses_actual",
      Instancia_Id: "inst_actual"
    }),
    Generar_Id_Sesion_Operativa: () => "corte_unico"
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Preparar_Estado_Sesiones_Operativas"),
    Contexto
  );
  const Estado = Contexto.Preparar_Estado_Sesiones_Operativas(
    {
      Sesiones_Operativas: {
        Corte_Ms: 100,
        Activas: {
          "ses_actual::inst_actual": {
            Id: "ses_actual",
            Instancia_Id: "inst_actual"
          },
          "ses_ajena::inst_ajena": {
            Id: "ses_ajena",
            Instancia_Id: "inst_ajena",
            Iniciada_Ms: 9_000_000_000_000
          }
        }
      }
    },
    { Cerrar_Otras: true }
  );

  assert.deepEqual(
    Object.keys(Estado.Sesiones_Operativas.Activas),
    ["ses_actual::inst_actual"]
  );
  assert.equal(
    Estado.Sesiones_Operativas.Corte_Token,
    "corte_unico"
  );
  assert.equal(
    Estado.Sesiones_Operativas.Corte_Excepto_Id,
    "ses_actual"
  );
  assert.ok(
    Estado.Sesiones_Operativas.Corte_Ms >
      9_000_000_000_000
  );
});

test("invalida en Supabase solamente las otras sesiones", async () => {
  const Llamadas = [];
  const Contexto = {
    Supa: {
      auth: {
        async signOut(Opciones) {
          Llamadas.push(Opciones);
          return { error: null };
        }
      }
    },
    Log_Error_App: () => {}
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Invalidar_Otras_Sesiones_Auth"),
    Contexto
  );

  assert.equal(
    await Contexto.Invalidar_Otras_Sesiones_Auth(),
    true
  );
  assert.equal(Llamadas.length, 1);
  assert.equal(Llamadas[0].scope, "others");
});

test("el sondeo remoto ejecuta el cierre de una sesión ajena", async () => {
  const { Contexto } = Crear_Entorno_Corte();
  let Cierres = 0;
  Contexto.Supa = {};
  Contexto.Usuario_Actual = { id: "usuario_1" };
  Contexto.Sesion_Operativa_Revision_En_Curso = false;
  Contexto.Sync_Sesion_Global_Corte_Ms = 0;
  Contexto.Backend_Leer_Corte_Sesion_Remota = async () => ({
    data: {
      estado: {
        Sesiones_Operativas: {
          Corte_Ms: 50,
          Corte_Token: "corte_nuevo",
          Corte_Excepto_Id: "otra_sesion",
          Activas: {}
        }
      }
    },
    error: null
  });
  Contexto.Limpiar_Tombstones_Json = (Estado) => Estado;
  Contexto.Obtener_Corte_Sesion_Global = () => 0;
  Contexto.Sesion_Global_Remota_Activa = () => false;
  Contexto.Cerrar_Sesion_Por_Corte_Global = async () => {
    Cierres += 1;
  };
  vm.runInContext(
    Extraer_Funcion("Revisar_Corte_Sesion_Operativa_Remoto"),
    Contexto
  );

  assert.equal(
    await Contexto.Revisar_Corte_Sesion_Operativa_Remoto(),
    true
  );
  assert.equal(Cierres, 1);
  assert.equal(
    Contexto.Sesion_Operativa_Revision_En_Curso,
    false
  );
});

test("al salir detiene el latido y el sondeo rápido", () => {
  const Timers = [];
  const Contexto = {
    Sesion_Operativa_Heartbeat_Timer_Id: 31,
    Sesion_Operativa_Revision_Timer_Id: 32,
    Sesion_Operativa_Revision_En_Curso: true,
    clearInterval(Id) {
      Timers.push(Id);
    }
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Detener_Heartbeat_Sesion_Operativa"),
    Contexto
  );

  Contexto.Detener_Heartbeat_Sesion_Operativa();

  assert.deepEqual(Timers, [31, 32]);
  assert.equal(Contexto.Sesion_Operativa_Heartbeat_Timer_Id, null);
  assert.equal(Contexto.Sesion_Operativa_Revision_Timer_Id, null);
  assert.equal(Contexto.Sesion_Operativa_Revision_En_Curso, false);
});

test("web y desktop mantienen activo el detector en segundo plano", () => {
  const Ruta_Desktop = path.resolve(
    __dirname,
    "../../Aplicaciones/Desktop/Main_Process.js"
  );
  const Codigo_Desktop = fs.readFileSync(Ruta_Desktop, "utf8");

  assert.match(
    Codigo_Login,
    /const Sesion_Operativa_Revision_Ms = 5000;/
  );
  assert.match(
    Extraer_Funcion("Iniciar_Heartbeat_Sesion_Operativa"),
    /Revisar_Corte_Sesion_Operativa_Remoto/
  );
  assert.match(
    Extraer_Funcion("Backend_Leer_Corte_Sesion_Remota"),
    /estado->Sesiones_Operativas/
  );
  assert.doesNotMatch(
    Extraer_Funcion("Revisar_Corte_Sesion_Operativa_Remoto"),
    /Backend_Leer_Fila_Remota/
  );
  assert.match(Codigo_Desktop, /backgroundThrottling: false/);
});
