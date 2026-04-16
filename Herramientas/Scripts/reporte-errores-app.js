const {
  Parsear_Args,
  Resolver_Supabase,
  Supabase_Fetch
} = require("./lib/supabase-operativo");

function Numero_Arg(Valor, Defecto) {
  const Numero = Number(Valor);
  return Number.isFinite(Numero) ? Numero : Defecto;
}

function Contar_Por(Items, Campo) {
  const Conteo = new Map();
  Items.forEach((Item) => {
    const Clave = String(Item?.[Campo] || "sin_dato");
    Conteo.set(Clave, (Conteo.get(Clave) || 0) + 1);
  });
  return Array.from(Conteo.entries())
    .sort((A, B) => B[1] - A[1])
    .map(([Clave, Cantidad]) => ({ Clave, Cantidad }));
}

function Recortar(Texto, Max = 160) {
  const Valor = String(Texto || "").replace(/\s+/g, " ");
  if (Valor.length <= Max) return Valor;
  return `${Valor.slice(0, Max - 3)}...`;
}

function Imprimir_Texto(Reporte) {
  console.log("Reporte Errores_App");
  console.log(`Entorno: ${Reporte.entorno}`);
  console.log(`Desde: ${Reporte.desde}`);
  console.log(`Hasta: ${Reporte.hasta}`);
  console.log(`Total: ${Reporte.total}`);
  console.log("");

  console.log("Por modulo:");
  if (!Reporte.por_modulo.length) {
    console.log("- Sin errores.");
  }
  Reporte.por_modulo.forEach((Item) => {
    console.log(`- ${Item.Clave}: ${Item.Cantidad}`);
  });
  console.log("");

  console.log("Por accion:");
  if (!Reporte.por_accion.length) {
    console.log("- Sin errores.");
  }
  Reporte.por_accion.forEach((Item) => {
    console.log(`- ${Item.Clave}: ${Item.Cantidad}`);
  });
  console.log("");

  console.log("Ultimos errores:");
  if (!Reporte.ultimos.length) {
    console.log("- Sin errores.");
  }
  Reporte.ultimos.forEach((Item) => {
    const Email = Item.email || "sin_email";
    console.log(
      `- ${Item.fecha} | ${Item.modulo} | ` +
        `${Item.accion} | ${Email} | ` +
        Recortar(Item.mensaje)
    );
  });
}

async function Obtener_Errores(Config, Desde, Limite) {
  const Params = new URLSearchParams();
  Params.set(
    "select",
    "id,fecha,email,modulo,accion,mensaje,contexto_json"
  );
  Params.set("fecha", `gte.${Desde.toISOString()}`);
  Params.set("order", "fecha.desc");
  Params.set("limit", String(Limite));
  const Resp = await Supabase_Fetch(
    Config,
    `/rest/v1/Errores_App?${Params.toString()}`,
    { method: "GET" }
  );
  return await Resp.json();
}

async function main() {
  const Args = Parsear_Args();
  const Horas = Numero_Arg(
    Args.horas,
    Args.dias ? Numero_Arg(Args.dias, 1) * 24 : 24
  );
  const Limite = Numero_Arg(Args.limite, 200);
  const Max_Mostrar = Numero_Arg(Args["max-mostrar"], 12);
  const Desde = new Date(Date.now() - Horas * 60 * 60 * 1000);
  const Hasta = new Date();
  const Config = await Resolver_Supabase(Args);
  const Errores = await Obtener_Errores(
    Config,
    Desde,
    Limite
  );
  const Reporte = {
    entorno: Config.Entorno,
    desde: Desde.toISOString(),
    hasta: Hasta.toISOString(),
    total: Errores.length,
    limite_consulta: Limite,
    por_modulo: Contar_Por(Errores, "modulo"),
    por_accion: Contar_Por(Errores, "accion"),
    ultimos: Errores.slice(0, Max_Mostrar)
  };

  if (Args.json) {
    console.log(JSON.stringify(Reporte, null, 2));
  } else {
    Imprimir_Texto(Reporte);
  }

  if (Args["fallar-si"] !== undefined) {
    const Umbral = Numero_Arg(Args["fallar-si"], 1);
    if (Reporte.total >= Umbral) {
      process.exitCode = 2;
    }
  }
}

main().catch((Error) => {
  console.error("No se pudo generar el reporte.");
  console.error(Error.message || Error);
  process.exit(1);
});
