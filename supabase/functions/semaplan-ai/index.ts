import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type, x-semaplan-ai-token",
  "Access-Control-Allow-Methods":
    "GET, POST, OPTIONS",
};

type Auth_Resultado =
  | {
    Ok: true;
    Usuario_Id: string;
    Fuente: "jwt" | "token";
  }
  | {
    Ok: false;
    Status: number;
    Error: string;
    Detalle: string;
  };

type Estado_Resultado =
  | {
    Ok: true;
    Estado: Record<string, unknown>;
    Version: number;
    Actualizado_En: string | null;
  }
  | {
    Ok: false;
    Status: number;
    Error: string;
    Detalle: string;
  };

const Claves_Estado_Seguras = new Set([
  "Objetivos",
  "Eventos",
  "Metas",
  "Slots_Muertos",
  "Planes_Slot",
  "Planes_Semana",
  "Planes_Periodo",
  "Plantillas_Subobjetivos",
  "Tareas",
  "Tareas_Cajones_Definidos",
  "Habitos",
  "Habitos_Registros",
  "Baul_Objetivos",
  "Archiveros",
  "Notas_Archivero",
  "Etiquetas_Archivero",
  "Patrones",
  "Categorias",
  "Etiquetas",
  "Tipos_Slot",
  "Tipos_Slot_Inicializados",
  "Slots_Muertos_Tipos",
  "Slots_Muertos_Nombres",
  "Slots_Muertos_Titulos_Visibles",
  "Slots_Muertos_Nombres_Auto",
  "Slots_Muertos_Grupo_Ids",
  "Config_Extra",
  "Inicio_Semana",
  "Contador_Eventos",
  "Semanas_Con_Defaults",
  "Esquema_Estado_Version",
  "Version_Programa_Actual",
]);

function Responder_Json(
  Cuerpo: Record<string, unknown>,
  Status = 200
) {
  return new Response(JSON.stringify(Cuerpo), {
    status: Status,
    headers: {
      ...Cors_Headers,
      "Content-Type": "application/json",
    },
  });
}

function Responder_Error(
  Status: number,
  Error: string,
  Detalle: string
) {
  return Responder_Json(
    {
      Ok: false,
      Error,
      Detalle,
    },
    Status
  );
}

function Obtener_Ruta_Relativa(Req: Request) {
  const Url = new URL(Req.url);
  const Segmentos = Url.pathname
    .split("/")
    .filter(Boolean);
  const Indice = Segmentos.lastIndexOf(
    "semaplan-ai"
  );
  if (Indice >= 0) {
    const Resto = Segmentos.slice(Indice + 1);
    return `/${Resto.join("/")}`.replace(
      /\/+$/,
      ""
    ) || "/";
  }
  return Url.pathname.replace(/\/+$/, "") || "/";
}

function Crear_Supabase_Servicio() {
  const Supabase_Url = Deno.env.get(
    "SUPABASE_URL"
  );
  const Service_Role_Key = Deno.env.get(
    "SUPABASE_SERVICE_ROLE_KEY"
  );
  if (!Supabase_Url || !Service_Role_Key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(
    Supabase_Url,
    Service_Role_Key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function Crear_Supabase_Usuario(Auth_Header: string) {
  const Supabase_Url = Deno.env.get(
    "SUPABASE_URL"
  );
  const Supabase_Anon_Key = Deno.env.get(
    "SUPABASE_ANON_KEY"
  );
  if (!Supabase_Url || !Supabase_Anon_Key) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_ANON_KEY."
    );
  }
  return createClient(
    Supabase_Url,
    Supabase_Anon_Key,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: Auth_Header,
        },
      },
    }
  );
}

async function Hash_Token(Token: string) {
  const Buffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(Token)
  );
  return Array.from(new Uint8Array(Buffer))
    .map((Byte) =>
      Byte.toString(16).padStart(2, "0")
    )
    .join("");
}

function Tiene_Scope_Lectura(
  Scopes: unknown
) {
  return Array.isArray(Scopes) &&
    Scopes.some((Scope) =>
      String(Scope || "").trim() === "read"
    );
}

async function Validar_Request(
  Req: Request
): Promise<Auth_Resultado> {
  const Token_IA = String(
    Req.headers.get("X-Semaplan-AI-Token") || ""
  ).trim();
  if (Token_IA) {
    try {
      const Supa_Servicio =
        Crear_Supabase_Servicio();
      const Token_Hash = await Hash_Token(Token_IA);
      const {
        data: Token_Registro,
        error: Error_Token,
      } = await Supa_Servicio
        .from("tokens_ia_usuario")
        .select(
          "id, usuario_id, scopes, revocado_en"
        )
        .eq("token_hash", Token_Hash)
        .maybeSingle();

      if (Error_Token) {
        console.error(
          "Error validando token IA:",
          Error_Token
        );
        return {
          Ok: false,
          Status: 500,
          Error: "Error interno",
          Detalle:
            "No se pudo validar el token de IA.",
        };
      }

      if (!Token_Registro) {
        return {
          Ok: false,
          Status: 401,
          Error: "No autorizado",
          Detalle: "Token invalido.",
        };
      }

      if (Token_Registro.revocado_en) {
        return {
          Ok: false,
          Status: 403,
          Error: "Token revocado",
          Detalle:
            "El token de IA fue revocado.",
        };
      }

      if (
        !Tiene_Scope_Lectura(
          Token_Registro.scopes
        )
      ) {
        return {
          Ok: false,
          Status: 403,
          Error: "Scope insuficiente",
          Detalle:
            "El token no tiene permiso de lectura.",
        };
      }

      await Supa_Servicio
        .from("tokens_ia_usuario")
        .update({
          ultimo_uso_en:
            new Date().toISOString(),
        })
        .eq("id", Token_Registro.id);

      return {
        Ok: true,
        Usuario_Id: String(
          Token_Registro.usuario_id
        ),
        Fuente: "token",
      };
    } catch (Error_General) {
      console.error(
        "Error general validando token IA:",
        Error_General
      );
      return {
        Ok: false,
        Status: 500,
        Error: "Error interno",
        Detalle:
          "No se pudo validar el token de IA.",
      };
    }
  }

  const Auth_Header = String(
    Req.headers.get("Authorization") || ""
  ).trim();
  if (
    Auth_Header &&
    Auth_Header.toLowerCase().startsWith(
      "bearer "
    )
  ) {
    try {
      const Supa_Usuario =
        Crear_Supabase_Usuario(Auth_Header);
      const {
        data: { user: Usuario },
        error: Error_Auth,
      } = await Supa_Usuario.auth.getUser();

      if (Error_Auth || !Usuario) {
        return {
          Ok: false,
          Status: 401,
          Error: "Sesion invalida",
          Detalle:
            "No se pudo validar el JWT del usuario.",
        };
      }

      return {
        Ok: true,
        Usuario_Id: Usuario.id,
        Fuente: "jwt",
      };
    } catch (Error_General) {
      console.error(
        "Error general validando JWT:",
        Error_General
      );
      return {
        Ok: false,
        Status: 500,
        Error: "Error interno",
        Detalle:
          "No se pudo validar la sesion.",
      };
    }
  }

  return {
    Ok: false,
    Status: 401,
    Error: "No autorizado",
    Detalle:
      "Falta X-Semaplan-AI-Token o Authorization.",
  };
}

function Filtrar_Campos_Seguros(
  Estado_Raw: unknown
) {
  const Estado =
    Estado_Raw &&
    typeof Estado_Raw === "object" &&
    !Array.isArray(Estado_Raw)
      ? (Estado_Raw as Record<string, unknown>)
      : {};
  const Resultado: Record<string, unknown> = {};
  Object.entries(Estado).forEach(
    ([Clave, Valor]) => {
      if (!Claves_Estado_Seguras.has(Clave)) {
        return;
      }
      Resultado[Clave] = Valor;
    }
  );
  return Resultado;
}

async function Leer_Estado_Usuario(
  Usuario_Id: string
): Promise<Estado_Resultado> {
  try {
    const Supa_Servicio =
      Crear_Supabase_Servicio();
    const {
      data: Fila_Estado,
      error: Error_Estado,
    } = await Supa_Servicio
      .from("estado_usuario")
      .select(
        "user_id, estado, version, actualizado_en"
      )
      .eq("user_id", Usuario_Id)
      .maybeSingle();

    if (Error_Estado) {
      console.error(
        "Error leyendo estado_usuario:",
        Error_Estado
      );
      return {
        Ok: false,
        Status: 500,
        Error: "Error interno",
        Detalle:
          "No se pudo leer el estado del usuario.",
      };
    }

    if (!Fila_Estado) {
      return {
        Ok: false,
        Status: 404,
        Error: "Estado inexistente",
        Detalle:
          "No existe un estado remoto para el usuario.",
      };
    }

    return {
      Ok: true,
      Estado: Filtrar_Campos_Seguros(
        Fila_Estado.estado
      ),
      Version:
        Number(Fila_Estado.version) || 1,
      Actualizado_En:
        typeof Fila_Estado.actualizado_en ===
          "string"
          ? Fila_Estado.actualizado_en
          : null,
    };
  } catch (Error_General) {
    console.error(
      "Error general leyendo estado del usuario:",
      Error_General
    );
    return {
      Ok: false,
      Status: 500,
      Error: "Error interno",
      Detalle:
        "No se pudo leer el estado del usuario.",
    };
  }
}

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  const Ruta = Obtener_Ruta_Relativa(Req);

  if (Req.method === "GET" && Ruta === "/salud") {
    return Responder_Json({
      Ok: true,
      Servicio: "Semaplan AI Gateway",
      Version: "1.0.0",
    });
  }

  const Rutas_Reservadas = new Set([
    "/contexto",
    "/agenda",
    "/tareas",
    "/habitos",
    "/slots",
    "/planes/semana",
    "/planes/periodos",
    "/archivero",
    "/archivero/buscar",
    "/baul",
    "/metas",
    "/openapi.json",
  ]);

  if (Rutas_Reservadas.has(Ruta)) {
    const Auth = await Validar_Request(Req);
    if (!Auth.Ok) {
      return Responder_Error(
        Auth.Status,
        Auth.Error,
        Auth.Detalle
      );
    }

    const Estado = await Leer_Estado_Usuario(
      Auth.Usuario_Id
    );
    if (!Estado.Ok) {
      return Responder_Error(
        Estado.Status,
        Estado.Error,
        Estado.Detalle
      );
    }

    // TODO: Fase posterior.
    // Agregar rate limit por token antes de abrir
    // la API en produccion.
    return Responder_Error(
      501,
      "No implementado",
      "La fase actual expone /salud, " +
        "validacion base y lectura segura del estado."
    );
  }

  return Responder_Error(
    404,
    "Ruta inexistente",
    `No existe la ruta ${Ruta}.`
  );
});
