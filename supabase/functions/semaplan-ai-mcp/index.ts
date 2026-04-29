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
const Url_Canonica_Semaplan = "https://semaplan.com/login.html";
const Prefijo_Id_Fetch = "spmcp_";
const OAUTH_SCOPE_LECTURA = "read";
const OAUTH_SCOPE_REFRESH = "offline_access";

type Mapa = Record<string, unknown>;

type Herramienta_MCP = {
  Nombre: string;
  Descripcion: string;
  Ruta: string;
  Input_Schema: Mapa;
};

type Documento_Fetch = {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, unknown>;
};

const Herramientas_MCP: Herramienta_MCP[] = [
  {
    Nombre: "search",
    Descripcion:
      "Busca contenido de Semaplan para usar en ChatGPT " +
      "Apps y deep research.",
    Ruta: "",
    Input_Schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Consulta en lenguaje natural.",
        },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    Nombre: "fetch",
    Descripcion:
      "Recupera el contenido completo de un resultado de " +
      "busqueda de Semaplan.",
    Ruta: "",
    Input_Schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description:
            "Identificador devuelto por la herramienta search.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
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

function Request_Tiene_Bearer_O_Token(Req: Request) {
  const Auth = String(
    Req.headers.get("authorization") || "",
  ).trim();
  const Token = String(
    Req.headers.get("x-semaplan-ai-token") || "",
  ).trim();
  return Boolean(Auth || Token);
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

function Obtener_Config_OAuth() {
  const Cliente_Id = String(
    Deno.env.get("SEMAPLAN_AI_OAUTH_CLIENT_ID") ||
      "semaplan-chatgpt",
  ).trim();
  const Cliente_Secret = String(
    Deno.env.get("SEMAPLAN_AI_OAUTH_CLIENT_SECRET") ||
      "",
  ).trim();
  return {
    Cliente_Id,
    Cliente_Secret,
    Habilitado: Boolean(Cliente_Id && Cliente_Secret),
  };
}

function Quitar_Slash_Final(Valor: string) {
  return Valor.replace(/\/+$/, "");
}

function Quitar_Slash_Inicial(Valor: string) {
  return Valor.replace(/^\/+/, "");
}

function Unir_Url(Base: string, Ruta: string) {
  const Base_Limpia = Quitar_Slash_Final(
    String(Base || ""),
  );
  const Ruta_Limpia = Quitar_Slash_Inicial(
    String(Ruta || ""),
  );
  if (!Base_Limpia) {
    return `/${Ruta_Limpia}`;
  }
  if (!Ruta_Limpia) {
    return Base_Limpia;
  }
  return `${Base_Limpia}/${Ruta_Limpia}`;
}

function Obtener_Origen_Publico(Req: Request) {
  const Url = new URL(Req.url);
  const Url_Supabase = String(
    Deno.env.get("SUPABASE_URL") || "",
  ).trim();
  if (Url_Supabase) {
    return Quitar_Slash_Final(
      Url_Supabase.replace(/^http:\/\//i, "https://"),
    );
  }

  const Protocolo_Header = String(
    Req.headers.get("x-forwarded-proto") ||
      Req.headers.get("x-forwarded-protocol") ||
      "",
  )
    .split(",")[0]
    .trim()
    .replace(/:$/, "");
  const Host_Header = String(
    Req.headers.get("x-forwarded-host") ||
      Req.headers.get("host") ||
      "",
  )
    .split(",")[0]
    .trim();
  if (Host_Header) {
    const Protocolo = Protocolo_Header || "https";
    return `${Protocolo}://${Host_Header}`
      .replace(/^http:\/\//i, "https://");
  }

  return Url.origin.replace(/^http:\/\//i, "https://");
}

function Obtener_Prefijo_Publico_Funciones(
  Req: Request,
) {
  const Url = new URL(Req.url);
  const Segmentos = Url.pathname
    .split("/")
    .filter(Boolean);
  const Indice = Segmentos.lastIndexOf(
    "semaplan-ai-mcp",
  );
  if (Indice > 0) {
    return `/${Segmentos
      .slice(0, Indice)
      .join("/")}`;
  }
  return "/functions/v1";
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
  const Base_Funciones = Unir_Url(
    Obtener_Origen_Publico(Req),
    Obtener_Prefijo_Publico_Funciones(Req),
  );
  return Unir_Url(Base_Funciones, "semaplan-ai");
}

function Obtener_Url_Base_MCP(Req: Request) {
  const Base_Funciones = Unir_Url(
    Obtener_Origen_Publico(Req),
    Obtener_Prefijo_Publico_Funciones(Req),
  );
  return Unir_Url(
    Base_Funciones,
    "semaplan-ai-mcp",
  );
}

function Obtener_Url_Endpoint_MCP(Req: Request) {
  return `${Quitar_Slash_Final(
    Obtener_Url_Base_MCP(Req),
  )}/mcp`;
}

function Obtener_Url_Metadata_Recurso(Req: Request) {
  return `${Quitar_Slash_Final(
    Obtener_Url_Base_MCP(Req),
  )}/.well-known/oauth-protected-resource`;
}

function Obtener_Url_Metadata_Authorization_Server(
  Req: Request,
) {
  return `${Quitar_Slash_Final(
    Obtener_Url_Base_MCP(Req),
  )}/.well-known/oauth-authorization-server`;
}

function Construir_Header_WWW_Authenticate(
  Req: Request,
  Parametros: {
    error?: string;
    error_description?: string;
    scope?: string;
  } = {},
) {
  const Partes = [
    `Bearer realm="${MCP_SERVER_NAME}"`,
    `resource_metadata="${Obtener_Url_Metadata_Recurso(Req)}"`,
  ];
  const Scope = String(
    Parametros.scope || OAUTH_SCOPE_LECTURA,
  ).trim();
  if (Scope) {
    Partes.push(`scope="${Scope}"`);
  }
  if (Parametros.error) {
    Partes.push(`error="${Parametros.error}"`);
  }
  if (Parametros.error_description) {
    Partes.push(
      `error_description="${Parametros.error_description}"`,
    );
  }
  return Partes.join(", ");
}

function Es_Ruta_WellKnown(
  Ruta: string,
  Sufijo: string,
) {
  const Limpia = (Ruta || "").replace(/\/+$/, "");
  if (!Limpia) return false;
  const Base = `/.well-known/${Sufijo}`;
  return Limpia === Base ||
    Limpia.startsWith(`${Base}/`) ||
    Limpia.endsWith(Base) ||
    Limpia.includes(`${Base}/`);
}

function Construir_Metadata_Recurso(Req: Request) {
  const Endpoint_MCP = Obtener_Url_Endpoint_MCP(Req);
  const Auth_Server = Quitar_Slash_Final(
    Obtener_Url_Base_MCP(Req),
  );
  return {
    resource: Endpoint_MCP,
    authorization_servers: [Auth_Server],
    scopes_supported: [OAUTH_SCOPE_LECTURA],
    bearer_methods_supported: ["header"],
    resource_name: "Semaplan MCP",
    resource_documentation: Url_Canonica_Semaplan,
  };
}

function Construir_Metadata_Authorization_Server(
  Req: Request,
) {
  const Issuer = Quitar_Slash_Final(
    Obtener_Url_Base_MCP(Req),
  );
  const Base_OAuth = Quitar_Slash_Final(
    Obtener_Url_Base_Gateway(Req),
  );
  return {
    issuer: Issuer,
    authorization_endpoint:
      `${Base_OAuth}/oauth/authorize`,
    token_endpoint: `${Base_OAuth}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    client_id_metadata_document_supported: true,
    scopes_supported: [OAUTH_SCOPE_LECTURA],
  };
}

function Responder_OAuth_Unauthorized(
  Req: Request,
  Parametros: {
    error?: string;
    error_description?: string;
    scope?: string;
  } = {},
) {
  return Responder_Sin_Cuerpo(401, {
    "WWW-Authenticate":
      Construir_Header_WWW_Authenticate(
        Req,
        Parametros,
      ),
  });
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

function Normalizar_Texto_Plano(
  Valor: unknown,
  Largo_Max = 900,
) {
  const Texto = String(Valor ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!Texto) return "";
  return Texto.slice(0, Largo_Max);
}

function Campo_String(Item: Mapa, Claves: string[]) {
  for (const Clave of Claves) {
    const Valor = Item?.[Clave];
    if (Valor === undefined || Valor === null) continue;
    const Texto = Normalizar_Texto_Plano(Valor);
    if (Texto) return Texto;
  }
  return "";
}

function Base64Url_Encode(Texto: string) {
  const Bytes = new TextEncoder().encode(Texto);
  let Binario = "";
  for (let I = 0; I < Bytes.length; I += 1) {
    Binario += String.fromCharCode(Bytes[I]);
  }
  return btoa(Binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function Base64Url_Decode(Token: string) {
  const Base64 = String(Token || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  if (!Base64) return "";
  const Relleno = Base64.length % 4;
  const Completo = Base64 +
    (Relleno ? "=".repeat(4 - Relleno) : "");
  const Binario = atob(Completo);
  const Bytes = new Uint8Array(Binario.length);
  for (let I = 0; I < Binario.length; I += 1) {
    Bytes[I] = Binario.charCodeAt(I);
  }
  return new TextDecoder().decode(Bytes);
}

function Crear_Documento_Fetch_Desde_Item(
  Item: Mapa,
  Indice: number,
  Query: string,
): Documento_Fetch {
  const Titulo = Campo_String(Item, [
    "Titulo",
    "title",
    "Nombre",
    "name",
    "Texto",
    "text",
    "Contenido",
    "contenido",
  ]) || `Resultado ${Indice + 1}`;
  const Texto = Campo_String(Item, [
    "Contenido",
    "contenido",
    "Texto",
    "text",
    "Descripcion",
    "descripcion",
    "Detalle",
    "detalle",
    "Resumen",
    "resumen",
  ]) || JSON.stringify(Item, null, 2);
  const Id_Base = Campo_String(Item, [
    "Id",
    "id",
    "Nota_Id",
    "Objetivo_Id",
    "Meta_Id",
  ]) || `q:${Query}:i:${Indice}`;
  return {
    id: Id_Base,
    title: Titulo,
    text: Texto,
    url: Url_Canonica_Semaplan,
    metadata: {
      fuente: "semaplan.archivero.buscar",
      query: Query,
    },
  };
}

function Construir_Id_Fetch(Doc: Documento_Fetch) {
  return `${Prefijo_Id_Fetch}${Base64Url_Encode(
    JSON.stringify(Doc),
  )}`;
}

function Parsear_Id_Fetch(Id: string) {
  try {
    if (!Id.startsWith(Prefijo_Id_Fetch)) return null;
    const Payload = Id.slice(Prefijo_Id_Fetch.length);
    if (!Payload) return null;
    const Json = Base64Url_Decode(Payload);
    const Doc = Parsear_Json_Seguro(Json) as Documento_Fetch;
    if (!Doc || typeof Doc !== "object") return null;
    if (!Doc.id || !Doc.title || !Doc.text) return null;
    return {
      id: String(Doc.id),
      title: String(Doc.title),
      text: String(Doc.text),
      url: String(Doc.url || Url_Canonica_Semaplan),
      metadata:
        Doc.metadata &&
          typeof Doc.metadata === "object"
          ? Doc.metadata as Record<string, unknown>
          : undefined,
    } satisfies Documento_Fetch;
  } catch (_) {
    return null;
  }
}

async function Consultar_Gateway_Lectura(
  Req: Request,
  Ruta: string,
  Argumentos: Mapa,
) {
  const Base_Gateway = Obtener_Url_Base_Gateway(Req);
  const Url = new URL(`${Base_Gateway}${Ruta}`);
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
    return {
      Ok: Resp.ok,
      Status: Resp.status,
      Payload: Parsear_Json_Seguro(Texto),
      Url: Url.toString(),
    };
  } catch (Error) {
    return {
      Ok: false,
      Status: 0,
      Payload: {
        Ok: false,
        Error: "Fallo MCP",
        Detalle: String(
          Error && (Error as Error).message
            ? (Error as Error).message
            : Error,
        ),
      },
      Url: Url.toString(),
    };
  }
}

async function Ejecutar_Herramienta(
  Req: Request,
  Herramienta: Herramienta_MCP,
  Argumentos: Mapa,
) {
  const Resp = await Consultar_Gateway_Lectura(
    Req,
    Herramienta.Ruta,
    Argumentos,
  );
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(Resp.Payload, null, 2),
      },
    ],
    ...(Resp.Ok ? {} : { isError: true }),
  };
}

async function Ejecutar_Search_Compat(
  Req: Request,
  Argumentos: Mapa,
) {
  try {
    const Query = String(
      Argumentos.query ??
        Argumentos.q ??
        "",
    ).trim();
    if (!Query) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ results: [] }),
          },
        ],
      };
    }

    const Resp = await Consultar_Gateway_Lectura(
      Req,
      "/archivero/buscar",
      {
        q: Query,
        limite: 12,
      },
    );
    if (!Resp.Ok) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              results: [],
              notice: "search_unavailable_without_auth",
            }),
          },
        ],
      };
    }

    const Payload = (Resp.Payload &&
        typeof Resp.Payload === "object"
      ? Resp.Payload
      : {}) as Mapa;
    const Candidatos = (
      Array.isArray(Payload.Resultados)
        ? Payload.Resultados
        : Array.isArray(Payload.Notas)
        ? Payload.Notas
        : Array.isArray(Payload.resultados)
        ? Payload.resultados
        : Array.isArray(Payload.notas)
        ? Payload.notas
        : []
    )
      .filter((Item) => Item && typeof Item === "object")
      .slice(0, 12) as Mapa[];

    const Results = Candidatos.map((Item, Indice) => {
      const Doc = Crear_Documento_Fetch_Desde_Item(
        Item,
        Indice,
        Query,
      );
      return {
        id: Construir_Id_Fetch(Doc),
        title: Doc.title,
        url: Doc.url || Url_Canonica_Semaplan,
      };
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results: Results }),
        },
      ],
    };
  } catch (_) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ results: [] }),
        },
      ],
    };
  }
}

async function Ejecutar_Fetch_Compat(
  Argumentos: Mapa,
) {
  const Id = String(
    Argumentos.id ??
      Argumentos.document_id ??
      "",
  ).trim();
  if (!Id) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: "",
            title: "",
            text: "",
            url: Url_Canonica_Semaplan,
            metadata: {
              notice: "missing_id",
            },
          }),
        },
      ],
    };
  }

  const Doc = Parsear_Id_Fetch(Id);
  if (!Doc) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            id: "",
            title: "",
            text: "",
            url: Url_Canonica_Semaplan,
            metadata: {
              notice: "invalid_id",
            },
          }),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          id: Doc.id,
          title: Doc.title,
          text: Normalizar_Texto_Plano(Doc.text, 8000),
          url: Doc.url || Url_Canonica_Semaplan,
          metadata: Doc.metadata || {},
        }),
      },
    ],
  };
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

  if (Nombre === "search") {
    const Resultado_Search = await Ejecutar_Search_Compat(
      Req,
      Argumentos,
    );
    return Respuesta_MCP_Ok(
      Request_Id,
      Resultado_Search,
    );
  }

  if (Nombre === "fetch") {
    const Resultado_Fetch = await Ejecutar_Fetch_Compat(
      Argumentos,
    );
    return Respuesta_MCP_Ok(
      Request_Id,
      Resultado_Fetch,
    );
  }

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

  if (
    Req.method === "GET" &&
    Es_Ruta_WellKnown(
      Ruta,
      "oauth-protected-resource",
    )
  ) {
    return Responder_Json(
      Construir_Metadata_Recurso(Req),
    );
  }

  if (
    Req.method === "GET" &&
    (
      Es_Ruta_WellKnown(
        Ruta,
        "oauth-authorization-server",
      ) ||
      Es_Ruta_WellKnown(
        Ruta,
        "openid-configuration",
      )
    )
  ) {
    return Responder_Json(
      Construir_Metadata_Authorization_Server(
        Req,
      ),
    );
  }

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
    return Responder_OAuth_Unauthorized(
      Req,
      {
        error: "invalid_token",
        error_description:
          "Se requiere OAuth Bearer para usar este MCP.",
        scope: OAUTH_SCOPE_LECTURA,
      },
    );
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

  const Hay_Tools_Call = Requests.some(
    (Request_MCP) =>
      String(
        Request_MCP?.method || "",
      ).trim() === "tools/call",
  );
  if (
    Hay_Tools_Call &&
    !Request_Tiene_Bearer_O_Token(Req)
  ) {
    return Responder_OAuth_Unauthorized(
      Req,
      {
        error: "invalid_token",
        error_description:
          "Falta Bearer token OAuth para tools/call.",
        scope: OAUTH_SCOPE_LECTURA,
      },
    );
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
