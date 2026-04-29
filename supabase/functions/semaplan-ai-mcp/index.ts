const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type, accept, origin, mcp-protocol-version, " +
    "mcp-session-id, x-semaplan-ai-token",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS, DELETE",
};

const MCP_PROTOCOL_VERSION = "2025-03-26";
const MCP_SERVER_NAME = "semaplan-ai-mcp";
const MCP_SERVER_VERSION = "1.0.0";

type Mapa = Record<string, unknown>;

type Herramienta_MCP = {
  Nombre: string;
  Descripcion: string;
  Ruta: string;
  Input_Schema: Mapa;
};

const Herramientas_MCP: Herramienta_MCP[] = [
  {
    Nombre: "semaplan_contexto",
    Descripcion:
      "Obtiene el contexto compacto general de Semaplan " +
      "para un rango de fechas.",
    Ruta: "/contexto",
    Input_Schema: {
      type: "object",
      properties: {
        desde: {
          type: "string",
          description: "Fecha YYYY-MM-DD.",
        },
        hasta: {
          type: "string",
          description: "Fecha YYYY-MM-DD.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_agenda",
    Descripcion:
      "Lee agenda, eventos, slots muertos y planes de slot " +
      "por rango.",
    Ruta: "/agenda",
    Input_Schema: {
      type: "object",
      properties: {
        desde: {
          type: "string",
          description: "Fecha YYYY-MM-DD.",
        },
        hasta: {
          type: "string",
          description: "Fecha YYYY-MM-DD.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_tareas",
    Descripcion:
      "Lista tareas por rango, cajon, estado y limite.",
    Ruta: "/tareas",
    Input_Schema: {
      type: "object",
      properties: {
        desde: { type: "string" },
        hasta: { type: "string" },
        cajon: { type: "string" },
        estado: { type: "string" },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_habitos",
    Descripcion:
      "Lista habitos visibles para una fecha, modo y limite.",
    Ruta: "/habitos",
    Input_Schema: {
      type: "object",
      properties: {
        fecha: { type: "string" },
        modo: {
          type: "string",
          enum: ["Dia", "Semana", "Quincena", "Mes", "Todos"],
        },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_slots",
    Descripcion:
      "Lista slots vacios o muertos por rango.",
    Ruta: "/slots",
    Input_Schema: {
      type: "object",
      properties: {
        desde: { type: "string" },
        hasta: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_plan_semana",
    Descripcion:
      "Lee snapshot y diff del plan semanal.",
    Ruta: "/planes/semana",
    Input_Schema: {
      type: "object",
      properties: {
        semana: {
          type: "string",
          description:
            "Fecha YYYY-MM-DD dentro de la semana deseada.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_planes_periodos",
    Descripcion:
      "Lista periodos o devuelve el arbol compacto de un " +
      "periodo.",
    Ruta: "/planes/periodos",
    Input_Schema: {
      type: "object",
      properties: {
        periodo_id: { type: "string" },
        tipo: { type: "string" },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_buscar_archivero",
    Descripcion:
      "Busca notas del Archivero por texto normalizado.",
    Ruta: "/archivero/buscar",
    Input_Schema: {
      type: "object",
      properties: {
        q: {
          type: "string",
          maxLength: 200,
        },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 50,
        },
      },
      required: ["q"],
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_listar_archivero",
    Descripcion:
      "Lista cajones y notas del Archivero.",
    Ruta: "/archivero",
    Input_Schema: {
      type: "object",
      properties: {
        cajon_id: { type: "string" },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_listar_baul",
    Descripcion:
      "Lista objetivos del Baul por categoria, estado y " +
      "limite.",
    Ruta: "/baul",
    Input_Schema: {
      type: "object",
      properties: {
        categoria: { type: "string" },
        estado: { type: "string" },
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
  {
    Nombre: "semaplan_listar_metas",
    Descripcion:
      "Lista metas resumidas con progreso calculado.",
    Ruta: "/metas",
    Input_Schema: {
      type: "object",
      properties: {
        limite: {
          type: "integer",
          minimum: 1,
          maximum: 100,
        },
      },
      additionalProperties: false,
    },
  },
];

const Herramientas_Por_Nombre = new Map(
  Herramientas_MCP.map((H) => [H.Nombre, H])
);

function Responder_Json(
  Cuerpo: unknown,
  Status = 200,
  Headers_Extra: Record<string, string> = {},
) {
  return new Response(JSON.stringify(Cuerpo), {
    status: Status,
    headers: {
      ...Cors_Headers,
      ...Headers_Extra,
      "Content-Type": "application/json",
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    },
  });
}

function Responder_Sin_Cuerpo(
  Status = 204,
  Headers_Extra: Record<string, string> = {},
) {
  return new Response(null, {
    status: Status,
    headers: {
      ...Cors_Headers,
      ...Headers_Extra,
      "MCP-Protocol-Version": MCP_PROTOCOL_VERSION,
    },
  });
}

function Respuesta_MCP_Ok(Id: unknown, Resultado: unknown) {
  return {
    jsonrpc: "2.0",
    id: Id,
    result: Resultado,
  };
}

function Respuesta_MCP_Error(
  Id: unknown,
  Codigo: number,
  Mensaje: string,
  Data?: unknown,
) {
  return {
    jsonrpc: "2.0",
    id: Id,
    error: {
      code: Codigo,
      message: Mensaje,
      ...(Data === undefined ? {} : { data: Data }),
    },
  };
}

function Es_Mensaje_JSONRPC_Request(M: unknown) {
  return Boolean(
    M &&
      typeof M === "object" &&
      typeof (M as Mapa).method === "string",
  );
}

function Normalizar_Origen_Item(Valor: string) {
  const Limpio = String(Valor || "").trim();
  if (!Limpio) return "";
  if (Limpio.includes("://")) {
    try {
      const Url = new URL(Limpio);
      return Url.origin.toLowerCase();
    } catch (_) {
      return "";
    }
  }
  return Limpio.toLowerCase();
}

function Obtener_Origenes_Permitidos() {
  const Defaults = [
    "https://chatgpt.com",
    "https://chat.openai.com",
    "https://platform.openai.com",
    "https://developers.openai.com",
    "https://localhost",
    "http://localhost",
  ];
  const Extra = String(
    Deno.env.get("SEMAPLAN_MCP_ALLOWED_ORIGINS") || "",
  )
    .split(",")
    .map((Item) => Normalizar_Origen_Item(Item))
    .filter(Boolean);
  return new Set(
    [...Defaults, ...Extra]
      .map((Item) => Normalizar_Origen_Item(Item))
      .filter(Boolean),
  );
}

function Origen_Valido(Req: Request) {
  const Origen = String(
    Req.headers.get("origin") || "",
  ).trim();
  if (!Origen) return true;
  const Origen_Normalizado = Normalizar_Origen_Item(
    Origen,
  );
  if (!Origen_Normalizado) return false;
  const Permitidos = Obtener_Origenes_Permitidos();
  if (Permitidos.has(Origen_Normalizado)) {
    return true;
  }
  try {
    const Url = new URL(Origen_Normalizado);
    return Permitidos.has(Url.hostname.toLowerCase());
  } catch (_) {
    return false;
  }
}

function Obtener_Ruta_Relativa(Req: Request) {
  const Url = new URL(Req.url);
  const Segmentos = Url.pathname
    .split("/")
    .filter(Boolean);
  const Indice = Segmentos.lastIndexOf(
    "semaplan-ai-mcp",
  );
  if (Indice >= 0) {
    const Resto = Segmentos.slice(Indice + 1);
    return `/${Resto.join("/")}`.replace(
      /\/+$/,
      "",
    ) || "/";
  }
  return Url.pathname.replace(/\/+$/, "") || "/";
}

function Obtener_Url_Base_Gateway(Req: Request) {
  const Url = new URL(Req.url);
  const Segmentos = Url.pathname
    .split("/")
    .filter(Boolean);
  const Indice = Segmentos.lastIndexOf(
    "semaplan-ai-mcp",
  );
  if (Indice >= 0) {
    const Base = Segmentos
      .slice(0, Indice)
      .join("/");
    return `${Url.origin}/${Base}/semaplan-ai`;
  }
  return `${Url.origin}/functions/v1/semaplan-ai`;
}

function Agregar_Query(Url: URL, Argumentos: Mapa) {
  Object.entries(Argumentos || {}).forEach(
    ([Clave, Valor]) => {
      if (
        Valor === undefined ||
        Valor === null ||
        Valor === ""
      ) {
        return;
      }
      Url.searchParams.set(Clave, String(Valor));
    },
  );
}

function Parsear_Json_Seguro(Texto: string) {
  try {
    return Texto ? JSON.parse(Texto) : {};
  } catch (_) {
    return { raw: Texto };
  }
}

async function Ejecutar_Herramienta(
  Req: Request,
  Herramienta: Herramienta_MCP,
  Argumentos: Mapa,
) {
  const Base_Gateway = Obtener_Url_Base_Gateway(Req);
  const Url = new URL(`${Base_Gateway}${Herramienta.Ruta}`);
  Agregar_Query(Url, Argumentos);

  const Headers = new Headers({
    Accept: "application/json",
  });
  const Auth = String(
    Req.headers.get("authorization") || "",
  ).trim();
  const Token_Legacy = String(
    Req.headers.get("x-semaplan-ai-token") || "",
  ).trim();
  if (Auth) {
    Headers.set("Authorization", Auth);
  }
  if (Token_Legacy) {
    Headers.set("X-Semaplan-AI-Token", Token_Legacy);
  }

  try {
    const Resp = await fetch(Url, {
      method: "GET",
      headers: Headers,
    });
    const Texto = await Resp.text();
    const Payload = Parsear_Json_Seguro(Texto);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(Payload, null, 2),
        },
      ],
      ...(Resp.ok ? {} : { isError: true }),
    };
  } catch (Error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              Ok: false,
              Error: "Fallo MCP",
              Detalle: String(
                Error && (Error as Error).message
                  ? (Error as Error).message
                  : Error,
              ),
            },
            null,
            2,
          ),
        },
      ],
    };
  }
}

function Procesar_Initialize(Request_Id: unknown) {
  return Respuesta_MCP_Ok(Request_Id, {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: MCP_SERVER_NAME,
      version: MCP_SERVER_VERSION,
    },
  });
}

function Procesar_Listar_Herramientas(Request_Id: unknown) {
  return Respuesta_MCP_Ok(Request_Id, {
    tools: Herramientas_MCP.map((H) => ({
      name: H.Nombre,
      description: H.Descripcion,
      inputSchema: H.Input_Schema,
    })),
  });
}

async function Procesar_Llamar_Herramienta(
  Req: Request,
  Request_Id: unknown,
  Params: Mapa,
) {
  const Nombre = String(Params?.name || "").trim();
  if (!Nombre) {
    return Respuesta_MCP_Error(
      Request_Id,
      -32602,
      "Falta params.name en tools/call.",
    );
  }
  const Herramienta = Herramientas_Por_Nombre.get(Nombre);
  if (!Herramienta) {
    return Respuesta_MCP_Error(
      Request_Id,
      -32602,
      `Herramienta desconocida: ${Nombre}`,
    );
  }
  const Argumentos = (
    Params?.arguments &&
      typeof Params.arguments === "object"
      ? Params.arguments
      : {}
  ) as Mapa;
  const Resultado = await Ejecutar_Herramienta(
    Req,
    Herramienta,
    Argumentos,
  );
  return Respuesta_MCP_Ok(Request_Id, Resultado);
}

async function Procesar_Request_MCP(
  Req: Request,
  Mensaje: Mapa,
) {
  const Id = Mensaje.id ?? null;
  const Metodo = String(Mensaje.method || "");
  const Params = (
    Mensaje.params && typeof Mensaje.params === "object"
      ? Mensaje.params
      : {}
  ) as Mapa;

  if (Metodo === "initialize") {
    return Procesar_Initialize(Id);
  }

  if (Metodo === "notifications/initialized") {
    return null;
  }

  if (Metodo === "tools/list") {
    return Procesar_Listar_Herramientas(Id);
  }

  if (Metodo === "tools/call") {
    return await Procesar_Llamar_Herramienta(
      Req,
      Id,
      Params,
    );
  }

  return Respuesta_MCP_Error(
    Id,
    -32601,
    `Metodo no soportado: ${Metodo}`,
  );
}

function Error_Parseo_JSON() {
  return Respuesta_MCP_Error(
    null,
    -32700,
    "JSON invalido.",
  );
}

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  if (!Origen_Valido(Req)) {
    return Responder_Json(
      Respuesta_MCP_Error(
        null,
        -32000,
        "Origin no permitido.",
      ),
      403,
    );
  }

  const Ruta = Obtener_Ruta_Relativa(Req);
  if (Ruta !== "/" && Ruta !== "/mcp") {
    return Responder_Json(
      Respuesta_MCP_Error(
        null,
        -32601,
        `Ruta MCP inexistente: ${Ruta}`,
      ),
      404,
    );
  }

  if (Req.method === "GET") {
    return Responder_Sin_Cuerpo(405, {
      Allow: "POST",
    });
  }

  if (Req.method === "DELETE") {
    return Responder_Sin_Cuerpo(405, {
      Allow: "POST",
    });
  }

  if (Req.method !== "POST") {
    return Responder_Sin_Cuerpo(405, {
      Allow: "POST",
    });
  }

  let Cuerpo: unknown;
  try {
    Cuerpo = await Req.json();
  } catch (_) {
    return Responder_Json(Error_Parseo_JSON(), 400);
  }

  const Lote = Array.isArray(Cuerpo)
    ? Cuerpo
    : [Cuerpo];
  if (!Lote.length) {
    return Responder_Json(
      Respuesta_MCP_Error(
        null,
        -32600,
        "Batch vacio no permitido.",
      ),
      400,
    );
  }

  const Requests = Lote.filter(
    Es_Mensaje_JSONRPC_Request,
  ) as Mapa[];
  if (!Requests.length) {
    return Responder_Sin_Cuerpo(202);
  }

  const Respuestas: unknown[] = [];
  for (const Request_MCP of Requests) {
    const Respuesta = await Procesar_Request_MCP(
      Req,
      Request_MCP,
    );
    if (Respuesta) {
      Respuestas.push(Respuesta);
    }
  }

  if (!Respuestas.length) {
    return Responder_Sin_Cuerpo(202);
  }

  return Responder_Json(
    Respuestas.length === 1
      ? Respuestas[0]
      : Respuestas,
  );
});

