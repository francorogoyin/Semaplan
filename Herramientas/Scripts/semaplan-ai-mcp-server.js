#!/usr/bin/env node

const process = require("node:process");

const SERVER_NAME = "semaplan-ai-mcp";
const SERVER_VERSION = "1.0.0";
const PROTOCOL_VERSION = "2024-11-05";

const TOOL_DEFINITIONS = [
  {
    name: "semaplan_contexto",
    description:
      "Obtiene el contexto compacto general de Semaplan para un rango de fechas.",
    path: "/contexto",
    inputSchema: {
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
    name: "semaplan_agenda",
    description:
      "Lee agenda, eventos, slots muertos y planes de slot por rango.",
    path: "/agenda",
    inputSchema: {
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
    name: "semaplan_tareas",
    description:
      "Lista tareas por rango, cajon, estado y limite.",
    path: "/tareas",
    inputSchema: {
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
    name: "semaplan_habitos",
    description:
      "Lista habitos visibles para una fecha, modo y limite.",
    path: "/habitos",
    inputSchema: {
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
    name: "semaplan_slots",
    description:
      "Lista slots vacios o muertos por rango.",
    path: "/slots",
    inputSchema: {
      type: "object",
      properties: {
        desde: { type: "string" },
        hasta: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "semaplan_plan_semana",
    description:
      "Lee snapshot y diff del plan semanal.",
    path: "/planes/semana",
    inputSchema: {
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
    name: "semaplan_planes_periodos",
    description:
      "Lista periodos o devuelve el arbol compacto de un periodo.",
    path: "/planes/periodos",
    inputSchema: {
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
    name: "semaplan_buscar_archivero",
    description:
      "Busca notas del Archivero por texto normalizado.",
    path: "/archivero/buscar",
    inputSchema: {
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
    name: "semaplan_listar_archivero",
    description:
      "Lista cajones y notas del Archivero.",
    path: "/archivero",
    inputSchema: {
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
    name: "semaplan_listar_baul",
    description:
      "Lista objetivos del Baul por categoria, estado y limite.",
    path: "/baul",
    inputSchema: {
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
    name: "semaplan_listar_metas",
    description:
      "Lista metas resumidas con progreso calculado.",
    path: "/metas",
    inputSchema: {
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

const TOOLS_BY_NAME = new Map(
  TOOL_DEFINITIONS.map((tool) => [tool.name, tool])
);

function writeMessage(message) {
  const body = Buffer.from(
    JSON.stringify(message),
    "utf8"
  );
  process.stdout.write(
    `Content-Length: ${body.length}\r\n\r\n`
  );
  process.stdout.write(body);
}

function writeResponse(id, result) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    result,
  });
}

function writeError(id, code, message, data) {
  writeMessage({
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      data,
    },
  });
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getGatewayConfig() {
  return {
    baseUrl: normalizeBaseUrl(
      process.env.SEMAPLAN_AI_BASE_URL
    ),
    token: String(
      process.env.SEMAPLAN_AI_TOKEN || ""
    ).trim(),
    timeoutMs: Number(
      process.env.SEMAPLAN_AI_TIMEOUT_MS || 30000
    ),
  };
}

async function callGateway(tool, args) {
  const config = getGatewayConfig();
  if (!config.baseUrl) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text:
            "Falta SEMAPLAN_AI_BASE_URL. Ejemplo: " +
            "https://<project>.supabase.co/functions/v1/semaplan-ai",
        },
      ],
    };
  }
  if (!config.token) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text:
            "Falta SEMAPLAN_AI_TOKEN para consultar el gateway.",
        },
      ],
    };
  }

  const url = new URL(
    `${config.baseUrl}${tool.path}`
  );
  Object.entries(args || {}).forEach(
    ([key, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return;
      }
      url.searchParams.set(key, String(value));
    }
  );

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, Number.isFinite(config.timeoutMs)
    ? config.timeoutMs
    : 30000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-Semaplan-AI-Token": config.token,
      },
      signal: controller.signal,
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      payload = { raw: text };
    }

    return {
      isError: !response.ok,
      content: [
        {
          type: "text",
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              Ok: false,
              Error: "Fallo MCP",
              Detalle:
                error && error.name === "AbortError"
                  ? "La llamada al gateway vencio por timeout."
                  : String(
                      error && error.message
                        ? error.message
                        : error
                    ),
            },
            null,
            2
          ),
        },
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function handleRequest(message) {
  const { id, method, params } = message;

  if (method === "initialize") {
    writeResponse(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
    });
    return;
  }

  if (method === "notifications/initialized") {
    return;
  }

  if (method === "tools/list") {
    writeResponse(id, {
      tools: TOOL_DEFINITIONS.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    });
    return;
  }

  if (method === "tools/call") {
    const toolName = params?.name;
    const tool = TOOLS_BY_NAME.get(toolName);
    if (!tool) {
      writeError(
        id,
        -32602,
        `Herramienta desconocida: ${toolName}`
      );
      return;
    }

    const result = await callGateway(
      tool,
      params?.arguments || {}
    );
    writeResponse(id, result);
    return;
  }

  writeError(
    id,
    -32601,
    `Metodo no soportado: ${method}`
  );
}

let buffer = Buffer.alloc(0);

function processBuffer() {
  while (true) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) {
      return;
    }

    const headerText = buffer
      .slice(0, headerEnd)
      .toString("utf8");
    const lengthMatch = headerText.match(
      /Content-Length:\s*(\d+)/i
    );
    if (!lengthMatch) {
      buffer = Buffer.alloc(0);
      return;
    }

    const contentLength = Number(lengthMatch[1]);
    const messageEnd =
      headerEnd + 4 + contentLength;
    if (buffer.length < messageEnd) {
      return;
    }

    const body = buffer
      .slice(headerEnd + 4, messageEnd)
      .toString("utf8");
    buffer = buffer.slice(messageEnd);

    let message;
    try {
      message = JSON.parse(body);
    } catch (error) {
      writeError(
        null,
        -32700,
        "JSON invalido",
        String(error)
      );
      continue;
    }

    handleRequest(message).catch((error) => {
      writeError(
        message?.id ?? null,
        -32000,
        "Error interno del MCP",
        String(
          error && error.message
            ? error.message
            : error
        )
      );
    });
  }
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on("end", () => {
  process.exit(0);
});

process.stdin.resume();
