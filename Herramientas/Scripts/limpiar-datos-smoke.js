const {
  Parsear_Args,
  Resolver_Supabase,
  Supabase_Fetch
} = require("./lib/supabase-operativo");

const EMAILS_DEFAULT = [
  "tomashodel@gmail.com"
];

function Normalizar_Lista(Valor) {
  if (!Valor) return [];
  return String(Valor)
    .split(",")
    .map((Item) => Item.trim().toLowerCase())
    .filter(Boolean);
}

function Es_Smoke(Valor) {
  return String(Valor || "").trim().startsWith("Smoke ");
}

function Es_Item_Smoke(Item) {
  return Es_Smoke(Item?.Nombre) ||
    Es_Smoke(Item?.Titulo) ||
    Es_Smoke(Item?.Texto);
}

function Filtrar_Array(Estado, Clave) {
  const Lista = Array.isArray(Estado?.[Clave])
    ? Estado[Clave]
    : [];
  const Limpia = Lista.filter((Item) => !Es_Item_Smoke(Item));
  Estado[Clave] = Limpia;
  return Lista.length - Limpia.length;
}

function Limpiar_Estado(Estado) {
  const Copia = JSON.parse(JSON.stringify(Estado || {}));
  const Resultado = {
    Objetivos: Filtrar_Array(Copia, "Objetivos"),
    Baul_Objetivos: Filtrar_Array(Copia, "Baul_Objetivos"),
    Notas_Archivero: Filtrar_Array(Copia, "Notas_Archivero")
  };
  Resultado.Total =
    Resultado.Objetivos +
    Resultado.Baul_Objetivos +
    Resultado.Notas_Archivero;
  return {
    Estado: Copia,
    Resultado
  };
}

async function Obtener_Usuarios(Config) {
  const Resp = await Supabase_Fetch(
    Config,
    "/auth/v1/admin/users?page=1&per_page=1000",
    { method: "GET" }
  );
  const Datos = await Resp.json();
  return Array.isArray(Datos?.users) ? Datos.users : [];
}

async function Obtener_Estado(Config, Usuario_Id) {
  const Params = new URLSearchParams();
  Params.set("select", "user_id,estado,version");
  Params.set("user_id", `eq.${Usuario_Id}`);
  Params.set("limit", "1");
  const Resp = await Supabase_Fetch(
    Config,
    `/rest/v1/estado_usuario?${Params.toString()}`,
    { method: "GET" }
  );
  const Filas = await Resp.json();
  return Array.isArray(Filas) ? Filas[0] || null : null;
}

async function Guardar_Estado(Config, Fila, Estado) {
  const Params = new URLSearchParams();
  Params.set("user_id", `eq.${Fila.user_id}`);
  const Version = Number(Fila.version || 1) + 1;
  await Supabase_Fetch(
    Config,
    `/rest/v1/estado_usuario?${Params.toString()}`,
    {
      method: "PATCH",
      headers: {
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        estado: Estado,
        version: Version
      })
    }
  );
}

async function main() {
  const Args = Parsear_Args();
  const Aplicar = Boolean(Args.aplicar);
  const Emails = Normalizar_Lista(Args.emails).length
    ? Normalizar_Lista(Args.emails)
    : EMAILS_DEFAULT;
  const Config = await Resolver_Supabase(Args);
  const Usuarios = await Obtener_Usuarios(Config);
  const Objetivo = Usuarios.filter((Usuario) => {
    return Emails.includes(
      String(Usuario.email || "").toLowerCase()
    );
  });

  console.log(`Entorno: ${Config.Entorno}`);
  console.log(`Modo: ${Aplicar ? "aplicar" : "dry-run"}`);
  console.log(`Usuarios objetivo: ${Emails.join(", ")}`);
  console.log("");

  let Total = 0;
  for (const Usuario of Objetivo) {
    const Fila = await Obtener_Estado(Config, Usuario.id);
    if (!Fila) {
      console.log(`- ${Usuario.email}: sin estado.`);
      continue;
    }
    const { Estado, Resultado } = Limpiar_Estado(Fila.estado);
    Total += Resultado.Total;
    console.log(
      `- ${Usuario.email}: ` +
        `${Resultado.Total} item(s) smoke. ` +
        `Objetivos=${Resultado.Objetivos}, ` +
        `Baul=${Resultado.Baul_Objetivos}, ` +
        `Notas=${Resultado.Notas_Archivero}.`
    );
    if (Aplicar && Resultado.Total > 0) {
      await Guardar_Estado(Config, Fila, Estado);
    }
  }

  if (!Objetivo.length) {
    console.log("- No se encontraron usuarios objetivo.");
  }

  console.log("");
  console.log(`Total detectado: ${Total}`);
  if (!Aplicar) {
    console.log("No se aplicaron cambios.");
  }
}

main().catch((Error) => {
  console.error("No se pudo limpiar datos de smoke.");
  console.error(Error.message || Error);
  process.exit(1);
});
