const fs = require("fs");
const path = require("path");

const ENTORNOS = {
  produccion: {
    Ref: "cprdnxkkhuuhdispubds",
    Url: "https://cprdnxkkhuuhdispubds.supabase.co"
  },
  staging: {
    Ref: "cukkxjmdspbefkqzjumh",
    Url: "https://cukkxjmdspbefkqzjumh.supabase.co"
  }
};

function Parsear_Args(Args = process.argv.slice(2)) {
  const Resultado = {};
  for (let I = 0; I < Args.length; I += 1) {
    const Arg = Args[I];
    if (!Arg.startsWith("--")) continue;
    const Sin_Prefijo = Arg.slice(2);
    const Igual = Sin_Prefijo.indexOf("=");
    if (Igual >= 0) {
      const Clave = Sin_Prefijo.slice(0, Igual);
      Resultado[Clave] = Sin_Prefijo.slice(Igual + 1);
      continue;
    }
    const Siguiente = Args[I + 1];
    if (Siguiente && !Siguiente.startsWith("--")) {
      Resultado[Sin_Prefijo] = Siguiente;
      I += 1;
      continue;
    }
    Resultado[Sin_Prefijo] = true;
  }
  return Resultado;
}

function Leer_Credenciales_Locales() {
  const Ruta = path.join(
    process.cwd(),
    "Local",
    "Credenciales.txt"
  );
  if (!fs.existsSync(Ruta)) {
    return {};
  }
  const Texto = fs.readFileSync(Ruta, "utf8");
  const Token = Texto.match(/sbp_[A-Za-z0-9_-]+/)?.[0] || "";
  const Ref = Texto.match(/Project ID:\s*([a-z0-9]+)/i)?.[1] ||
    "";
  const Url = Texto.match(
    /Project URL:\s*(https:\/\/[^\s]+)/i
  )?.[1] || "";
  return {
    Access_Token: Token,
    Ref,
    Url
  };
}

function Normalizar_Entorno(Valor = "") {
  const Entorno = String(Valor || "")
    .trim()
    .toLowerCase();
  return Entorno === "staging" ? "staging" : "produccion";
}

async function Obtener_Service_Key_Por_Api(Access_Token, Ref) {
  if (!Access_Token || !Ref) {
    return "";
  }
  const Resp = await fetch(
    `https://api.supabase.com/v1/projects/${Ref}` +
      "/api-keys?reveal=true",
    {
      headers: {
        Authorization: `Bearer ${Access_Token}`
      }
    }
  );
  if (!Resp.ok) {
    const Texto = await Resp.text().catch(() => "");
    throw new Error(
      "No se pudieron obtener api keys de Supabase: " +
        `${Resp.status} ${Texto}`
    );
  }
  const Keys = await Resp.json();
  const Service = Keys.find((Item) => {
    return Item.id === "service_role" ||
      Item.name === "service_role";
  });
  return Service?.api_key || "";
}

async function Resolver_Supabase(Args = {}) {
  const Local = Leer_Credenciales_Locales();
  const Entorno = Normalizar_Entorno(
    Args.entorno ||
    process.env.SEMAPLAN_ENTORNO ||
    process.env.SEMAPLAN_ENV
  );
  const Base = ENTORNOS[Entorno];
  const Ref =
    Args.ref ||
    process.env.SEMAPLAN_SUPABASE_PROJECT_REF ||
    process.env.SUPABASE_PROJECT_REF ||
    (Entorno === "produccion" ? Local.Ref : "") ||
    Base.Ref;
  const Url =
    Args.url ||
    process.env.SEMAPLAN_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    (Entorno === "produccion" ? Local.Url : "") ||
    Base.Url;
  const Access_Token =
    Args.token ||
    process.env.SEMAPLAN_SUPABASE_ACCESS_TOKEN ||
    process.env.SUPABASE_ACCESS_TOKEN ||
    Local.Access_Token ||
    "";
  let Service_Key =
    Args.service_key ||
    process.env.SEMAPLAN_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!Service_Key) {
    Service_Key = await Obtener_Service_Key_Por_Api(
      Access_Token,
      Ref
    );
  }
  if (!Url || !Service_Key) {
    throw new Error(
      "Falta configurar Supabase. Usar service role key " +
        "o access token con project ref."
    );
  }
  return {
    Entorno,
    Ref,
    Url,
    Service_Key
  };
}

async function Supabase_Fetch(Config, Ruta, Opciones = {}) {
  const Resp = await fetch(`${Config.Url}${Ruta}`, {
    ...Opciones,
    headers: {
      apikey: Config.Service_Key,
      Authorization: `Bearer ${Config.Service_Key}`,
      "Content-Type": "application/json",
      ...(Opciones.headers || {})
    }
  });
  if (!Resp.ok) {
    const Texto = await Resp.text().catch(() => "");
    throw new Error(
      `Supabase respondio ${Resp.status}: ${Texto}`
    );
  }
  return Resp;
}

module.exports = {
  Parsear_Args,
  Resolver_Supabase,
  Supabase_Fetch
};
