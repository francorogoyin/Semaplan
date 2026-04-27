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

type Rango_Resultado =
  | {
    Ok: true;
    Desde: string;
    Hasta: string;
  }
  | {
    Ok: false;
    Status: number;
    Error: string;
    Detalle: string;
  };

type Resultado_Con_Error<T> =
  | ({ Ok: true } & T)
  | {
    Ok: false;
    Status: number;
    Error: string;
    Detalle: string;
  };

function Es_Fecha_ISO_Valida(Valor: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(Valor);
}

function Parsear_Fecha_ISO(
  Valor: string
) {
  if (!Es_Fecha_ISO_Valida(Valor)) {
    return null;
  }
  const Fecha = new Date(`${Valor}T00:00:00.000Z`);
  return Number.isNaN(Fecha.getTime())
    ? null
    : Fecha;
}

function Formatear_Fecha_ISO(
  Fecha: Date
) {
  return Fecha.toISOString().slice(0, 10);
}

function Sumar_Dias(
  Fecha: Date,
  Dias: number
) {
  const Copia = new Date(Fecha.getTime());
  Copia.setUTCDate(Copia.getUTCDate() + Dias);
  return Copia;
}

function Obtener_Hoy_ISO() {
  return Formatear_Fecha_ISO(new Date());
}

function Resolver_Rango(
  Url: URL
): Rango_Resultado {
  const Desde_Raw = String(
    Url.searchParams.get("desde") || ""
  ).trim();
  const Hasta_Raw = String(
    Url.searchParams.get("hasta") || ""
  ).trim();

  let Desde = Desde_Raw;
  let Hasta = Hasta_Raw;

  if (!Desde && !Hasta) {
    Desde = Obtener_Hoy_ISO();
    Hasta = Formatear_Fecha_ISO(
      Sumar_Dias(Parsear_Fecha_ISO(Desde)!, 6)
    );
  } else if (Desde && !Hasta) {
    Hasta = Desde;
  } else if (!Desde && Hasta) {
    Desde = Hasta;
  }

  const Desde_Fecha = Parsear_Fecha_ISO(Desde);
  const Hasta_Fecha = Parsear_Fecha_ISO(Hasta);
  if (!Desde_Fecha || !Hasta_Fecha) {
    return {
      Ok: false,
      Status: 400,
      Error: "Rango invalido",
      Detalle:
        "Las fechas deben usar formato YYYY-MM-DD.",
    };
  }

  if (Hasta < Desde) {
    return {
      Ok: false,
      Status: 400,
      Error: "Rango invalido",
      Detalle:
        "`hasta` no puede ser menor que `desde`.",
    };
  }

  const Dias = Math.floor(
    (Hasta_Fecha.getTime() -
      Desde_Fecha.getTime()) /
      86400000
  ) + 1;
  if (Dias > 45) {
    return {
      Ok: false,
      Status: 400,
      Error: "Rango excedido",
      Detalle:
        "El rango maximo permitido es de 45 dias.",
    };
  }

  return {
    Ok: true,
    Desde,
    Hasta,
  };
}

function Resolver_Rango_Optional(
  Url: URL
): Resultado_Con_Error<{
  Desde: string | null;
  Hasta: string | null;
}> {
  const Tiene_Desde = Url.searchParams.has(
    "desde"
  );
  const Tiene_Hasta = Url.searchParams.has(
    "hasta"
  );
  if (!Tiene_Desde && !Tiene_Hasta) {
    return {
      Ok: true,
      Desde: null,
      Hasta: null,
    };
  }
  const Rango = Resolver_Rango(Url);
  if (!Rango.Ok) {
    return Rango;
  }
  return {
    Ok: true,
    Desde: Rango.Desde,
    Hasta: Rango.Hasta,
  };
}

function Resolver_Limite(
  Url: URL,
  Default = 50,
  Maximo = 100
) {
  const Raw = String(
    Url.searchParams.get("limite") || ""
  ).trim();
  if (!Raw) {
    return Default;
  }
  const Numero = Math.floor(Number(Raw));
  if (!Number.isFinite(Numero) || Numero <= 0) {
    return Default;
  }
  return Math.min(Maximo, Numero);
}

function Resolver_Fecha_Referencia(
  Url: URL,
  Parametro = "fecha"
): Resultado_Con_Error<{
  Fecha: string;
}> {
  const Fecha = Normalizar_Texto(
    Url.searchParams.get(Parametro)
  ) || Obtener_Hoy_ISO();
  if (!Es_Fecha_ISO_Valida(Fecha)) {
    return {
      Ok: false,
      Status: 400,
      Error: "Fecha invalida",
      Detalle:
        "La fecha debe usar formato YYYY-MM-DD.",
    };
  }
  return {
    Ok: true,
    Fecha,
  };
}

function Obtener_Array_Estado(
  Estado: Record<string, unknown>,
  Clave: string
) {
  return Array.isArray(Estado[Clave])
    ? Estado[Clave] as unknown[]
    : [];
}

function Obtener_Objeto_Estado(
  Estado: Record<string, unknown>,
  Clave: string
) {
  const Valor = Estado[Clave];
  return Valor &&
      typeof Valor === "object" &&
      !Array.isArray(Valor)
    ? Valor as Record<string, unknown>
    : {};
}

function Normalizar_Texto(
  Valor: unknown
) {
  return String(Valor || "").trim();
}

function Numero_Entero(
  Valor: unknown,
  Fallback = 0
) {
  const Numero = Math.round(Number(Valor));
  return Number.isFinite(Numero)
    ? Numero
    : Fallback;
}

function Formatear_Hora(
  Hora: number
) {
  const Valor = Math.max(
    0,
    Math.min(24, Math.round(Hora))
  );
  return `${String(Valor).padStart(2, "0")}:00`;
}

function Construir_Mapa_Por_Id(
  Lista: unknown[]
) {
  const Mapa: Record<string, Record<string, unknown>> =
    {};
  Lista.forEach((Item) => {
    if (!Item || typeof Item !== "object") {
      return;
    }
    const Id = Normalizar_Texto(
      (Item as Record<string, unknown>).Id
    );
    if (!Id) {
      return;
    }
    Mapa[Id] = Item as Record<string, unknown>;
  });
  return Mapa;
}

function Parsear_Clave_Slot(
  Clave_Raw: unknown
) {
  const Clave = Normalizar_Texto(Clave_Raw);
  const [Fecha, Hora_Raw] = Clave.split("|");
  if (!Es_Fecha_ISO_Valida(Fecha)) {
    return null;
  }
  const Hora = Numero_Entero(Hora_Raw, -1);
  if (Hora < 0 || Hora > 23) {
    return null;
  }
  return {
    Clave,
    Fecha,
    Hora,
  };
}

function Normalizar_Plan_Slot_IA(
  Plan_Raw: unknown
) {
  if (
    !Plan_Raw ||
    typeof Plan_Raw !== "object" ||
    Array.isArray(Plan_Raw)
  ) {
    return null;
  }
  const Plan = Plan_Raw as Record<string, unknown>;
  const Items = Array.isArray(Plan.Items)
    ? Plan.Items
      .filter((Item) =>
        Item && typeof Item === "object"
      )
      .map((Item) => {
        const Base =
          Item as Record<string, unknown>;
        return {
          Id: Normalizar_Texto(Base.Id),
          Emoji: Normalizar_Texto(
            Base.Emoji || "\u2022"
          ),
          Texto: Normalizar_Texto(Base.Texto),
          Estado: Normalizar_Texto(
            Base.Estado || "Planeado"
          ),
          Tarea_Id: Normalizar_Texto(
            Base.Tarea_Id
          ),
        };
      })
      .filter((Item) => Item.Texto || Item.Tarea_Id)
    : [];
  const Nota = Normalizar_Texto(Plan.Nota);
  if (!Items.length && !Nota) {
    return null;
  }
  return {
    Items,
    Nota,
  };
}

function Construir_Bloques_Agenda(
  Estado: Record<string, unknown>,
  Desde: string,
  Hasta: string
) {
  const Objetivos = Obtener_Array_Estado(
    Estado,
    "Objetivos"
  );
  const Categorias = Obtener_Array_Estado(
    Estado,
    "Categorias"
  );
  const Tipos_Slot = Obtener_Array_Estado(
    Estado,
    "Tipos_Slot"
  );
  const Eventos = Obtener_Array_Estado(
    Estado,
    "Eventos"
  );
  const Slots_Muertos = Obtener_Array_Estado(
    Estado,
    "Slots_Muertos"
  );
  const Planes_Slot = Obtener_Objeto_Estado(
    Estado,
    "Planes_Slot"
  );
  const Slots_Muertos_Tipos =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Tipos"
    );
  const Slots_Muertos_Nombres =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Nombres"
    );
  const Slots_Muertos_Titulos_Visibles =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Titulos_Visibles"
    );

  const Objetivos_Por_Id =
    Construir_Mapa_Por_Id(Objetivos);
  const Categorias_Por_Id =
    Construir_Mapa_Por_Id(Categorias);
  const Tipos_Slot_Por_Id =
    Construir_Mapa_Por_Id(Tipos_Slot);

  const Bloques: Record<string, unknown>[] = [];
  const Claves_Ocupadas = new Set<string>();
  const Claves_Slots_Muertos = new Set<string>();

  Eventos.forEach((Evento_Raw) => {
    if (
      !Evento_Raw ||
      typeof Evento_Raw !== "object"
    ) {
      return;
    }
    const Evento =
      Evento_Raw as Record<string, unknown>;
    const Fecha = Normalizar_Texto(
      Evento.Fecha
    );
    if (
      !Es_Fecha_ISO_Valida(Fecha) ||
      Fecha < Desde ||
      Fecha > Hasta
    ) {
      return;
    }

    const Inicio = Numero_Entero(
      Evento.Inicio,
      0
    );
    const Duracion = Math.max(
      1,
      Numero_Entero(Evento.Duracion, 1)
    );
    for (
      let Hora = Inicio;
      Hora < Inicio + Duracion;
      Hora += 1
    ) {
      Claves_Ocupadas.add(`${Fecha}|${Hora}`);
    }

    const Objetivo_Id = Normalizar_Texto(
      Evento.Objetivo_Id
    );
    const Objetivo =
      Objetivos_Por_Id[Objetivo_Id] || null;
    const Categoria_Id = Normalizar_Texto(
      Objetivo?.Categoria_Id
    );
    const Categoria =
      Categorias_Por_Id[Categoria_Id] || null;

    Bloques.push({
      Id:
        Normalizar_Texto(Evento.Id) ||
        `Evento_${Fecha}_${Inicio}`,
      Fecha,
      Inicio: Formatear_Hora(Inicio),
      Fin: Formatear_Hora(
        Math.min(24, Inicio + Duracion)
      ),
      Titulo:
        Normalizar_Texto(Objetivo?.Nombre) ||
        Normalizar_Texto(Evento.Titulo) ||
        "Evento",
      Tipo: "Evento",
      Objetivo_Id: Objetivo_Id || null,
      Objetivo_Nombre: Normalizar_Texto(
        Objetivo?.Nombre
      ),
      Categoria: Normalizar_Texto(
        Categoria?.Nombre
      ),
      Nota: Normalizar_Texto(Evento.Nota),
      Estado: "Planeado",
      Origen: "Calendario",
      Plan_Slot: null,
    });
  });

  Slots_Muertos.forEach((Item) => {
    const Slot =
      typeof Item === "string"
        ? Parsear_Clave_Slot(Item)
        : Parsear_Clave_Slot(
          (Item as Record<string, unknown>)
            ?.Clave ||
            `${Normalizar_Texto(
              (Item as Record<string, unknown>)
                ?.Fecha
            )}|${Numero_Entero(
              (Item as Record<string, unknown>)
                ?.Hora,
              -1
            )}`
        );
    if (!Slot) {
      return;
    }
    if (
      Slot.Fecha < Desde ||
      Slot.Fecha > Hasta
    ) {
      return;
    }
    Claves_Slots_Muertos.add(Slot.Clave);
    const Tipo_Id = Normalizar_Texto(
      Slots_Muertos_Tipos[Slot.Clave]
    );
    const Tipo_Slot =
      Tipos_Slot_Por_Id[Tipo_Id] || null;
    const Nombre = Normalizar_Texto(
      Slots_Muertos_Nombres[Slot.Clave]
    );
    const Titulo_Visible = Boolean(
      Slots_Muertos_Titulos_Visibles[
        Slot.Clave
      ]
    );
    const Plan_Slot = Normalizar_Plan_Slot_IA(
      Planes_Slot[Slot.Clave]
    );

    Bloques.push({
      Id: `Slot_${Slot.Clave}`,
      Fecha: Slot.Fecha,
      Inicio: Formatear_Hora(Slot.Hora),
      Fin: Formatear_Hora(
        Math.min(24, Slot.Hora + 1)
      ),
      Titulo:
        (Titulo_Visible && Nombre) ||
        Nombre ||
        Normalizar_Texto(Tipo_Slot?.Titulo) ||
        Normalizar_Texto(Tipo_Slot?.Nombre) ||
        "Slot muerto",
      Tipo: "Slot_Muerto",
      Objetivo_Id: null,
      Objetivo_Nombre: "",
      Categoria: "",
      Nota: Plan_Slot?.Nota || "",
      Estado: Plan_Slot ? "Planeado" : "Libre",
      Origen: "Slot_Muerto",
      Tipo_Slot_Id: Tipo_Id || null,
      Tipo_Slot_Nombre: Normalizar_Texto(
        Tipo_Slot?.Nombre
      ),
      Plan_Slot,
    });
  });

  Object.entries(Planes_Slot).forEach(
    ([Clave, Plan_Raw]) => {
      const Slot = Parsear_Clave_Slot(Clave);
      if (!Slot) {
        return;
      }
      if (
        Slot.Fecha < Desde ||
        Slot.Fecha > Hasta ||
        Claves_Slots_Muertos.has(Slot.Clave) ||
        Claves_Ocupadas.has(Slot.Clave)
      ) {
        return;
      }
      const Plan_Slot =
        Normalizar_Plan_Slot_IA(Plan_Raw);
      if (!Plan_Slot) {
        return;
      }
      const Primer_Item = Plan_Slot.Items[0];
      Bloques.push({
        Id: `Plan_${Slot.Clave}`,
        Fecha: Slot.Fecha,
        Inicio: Formatear_Hora(Slot.Hora),
        Fin: Formatear_Hora(
          Math.min(24, Slot.Hora + 1)
        ),
        Titulo:
          Normalizar_Texto(Primer_Item?.Texto) ||
          "Slot con plan",
        Tipo: "Slot_Vacio",
        Objetivo_Id: null,
        Objetivo_Nombre: "",
        Categoria: "",
        Nota: Plan_Slot.Nota || "",
        Estado: "Planeado",
        Origen: "Plan_Slot",
        Plan_Slot,
      });
    }
  );

  Bloques.sort((A, B) => {
    const Fecha_A = Normalizar_Texto(A.Fecha);
    const Fecha_B = Normalizar_Texto(B.Fecha);
    if (Fecha_A !== Fecha_B) {
      return Fecha_A.localeCompare(Fecha_B);
    }
    const Inicio_A = Normalizar_Texto(A.Inicio);
    const Inicio_B = Normalizar_Texto(B.Inicio);
    if (Inicio_A !== Inicio_B) {
      return Inicio_A.localeCompare(Inicio_B);
    }
    return Normalizar_Texto(A.Tipo)
      .localeCompare(Normalizar_Texto(B.Tipo));
  });

  return Bloques;
}

function Construir_Resumen_Tareas(
  Estado: Record<string, unknown>,
  Desde: string,
  Hasta: string
) {
  const Tareas =
    Construir_Tareas_Normalizadas_IA(Estado);

  const En_Rango = Tareas
    .filter((Tarea) =>
      Tarea.Fecha &&
      Tarea.Fecha >= Desde &&
      Tarea.Fecha <= Hasta
    )
    .sort((A, B) =>
      `${A.Fecha}|${A.Hora}`.localeCompare(
        `${B.Fecha}|${B.Hora}`
      )
    );

  return {
    Total: Tareas.length,
    Pendientes: Tareas.filter((Tarea) =>
      Tarea.Estado === "pendiente"
    ).length,
    Realizadas: Tareas.filter((Tarea) =>
      Tarea.Estado === "completada"
    ).length,
    Pospuestas: Tareas.filter((Tarea) =>
      Tarea.Estado === "pospuesta"
    ).length,
    Proximas: En_Rango.slice(0, 12),
  };
}

function Construir_Resumen_Habitos(
  Estado: Record<string, unknown>,
  Desde: string,
  Hasta: string
) {
  const Habitos =
    Construir_Habitos_Normalizados_IA(Estado);
  const Registros =
    Construir_Registros_Habitos_IA(Estado);

  const Registros_En_Rango = Registros
    .filter((Registro) =>
      Registro.Fecha &&
      Registro.Fecha >= Desde &&
      Registro.Fecha <= Hasta
    )
    .sort((A, B) =>
      `${B.Fecha}|${B.Hora}`.localeCompare(
        `${A.Fecha}|${A.Hora}`
      )
    );

  return {
    Total: Habitos.length,
    Activos: Habitos.filter((Habito) =>
      Habito.Activo && !Habito.Archivado
    ).length,
    Archivados: Habitos.filter((Habito) =>
      Habito.Archivado
    ).length,
    Registros_En_Rango: Registros_En_Rango.length,
    Destacados: Habitos
      .filter((Habito) => !Habito.Archivado)
      .slice(0, 12),
    Registros_Recientes:
      Registros_En_Rango.slice(0, 12),
  };
}

function Construir_Resumen_Slots(
  Estado: Record<string, unknown>
) {
  const Slots_Muertos = Obtener_Array_Estado(
    Estado,
    "Slots_Muertos"
  );
  const Planes_Slot = Obtener_Objeto_Estado(
    Estado,
    "Planes_Slot"
  );
  const Tipos_Slot = Obtener_Array_Estado(
    Estado,
    "Tipos_Slot"
  );

  return {
    Slots_Muertos_Total:
      Slots_Muertos.length,
    Con_Plan_Total: Object.keys(Planes_Slot)
      .filter((Clave) =>
        Boolean(
          Normalizar_Plan_Slot_IA(
            Planes_Slot[Clave]
          )
        )
      )
      .length,
    Tipos_Total: Tipos_Slot.length,
  };
}

function Construir_Resumen_Planes_Semana(
  Estado: Record<string, unknown>,
  Desde: string,
  Hasta: string
) {
  const Planes_Semana =
    Obtener_Objeto_Estado(
      Estado,
      "Planes_Semana"
    );
  const Semanas = Object.keys(Planes_Semana)
    .filter(Es_Fecha_ISO_Valida)
    .sort();
  return {
    Total: Semanas.length,
    Semanas_En_Rango: Semanas.filter(
      (Semana) =>
        Semana >= Desde && Semana <= Hasta
    ).length,
    Claves: Semanas.slice(0, 12),
  };
}

function Construir_Resumen_Planes_Periodo(
  Estado: Record<string, unknown>
) {
  const Planes_Periodo =
    Obtener_Objeto_Estado(
      Estado,
      "Planes_Periodo"
    );
  const Periodos = Object.values(Planes_Periodo)
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      return {
        Id:
          Normalizar_Texto(Base.Id) ||
          Normalizar_Texto(Base.Periodo_Id),
        Nombre: Normalizar_Texto(Base.Nombre),
        Tipo: Normalizar_Texto(Base.Tipo),
        Estado: Normalizar_Texto(Base.Estado),
        Fecha_Inicio: Normalizar_Texto(
          Base.Fecha_Inicio
        ),
        Fecha_Fin: Normalizar_Texto(
          Base.Fecha_Fin
        ),
      };
    })
    .filter((Periodo) =>
      Periodo.Id || Periodo.Nombre
    );

  return {
    Total: Periodos.length,
    Destacados: Periodos.slice(0, 12),
  };
}

function Construir_Resumen_Archivero(
  Estado: Record<string, unknown>
) {
  const Archiveros = Obtener_Array_Estado(
    Estado,
    "Archiveros"
  );
  const Notas = Obtener_Array_Estado(
    Estado,
    "Notas_Archivero"
  );
  const Etiquetas = Obtener_Array_Estado(
    Estado,
    "Etiquetas_Archivero"
  );

  const Cantidad_Por_Cajon: Record<
    string,
    number
  > = {};
  Notas.forEach((Nota) => {
    if (!Nota || typeof Nota !== "object") {
      return;
    }
    const Cajon_Id = Normalizar_Texto(
      (Nota as Record<string, unknown>)
        .Archivero_Id
    );
    if (!Cajon_Id) {
      return;
    }
    Cantidad_Por_Cajon[Cajon_Id] =
      (Cantidad_Por_Cajon[Cajon_Id] || 0) + 1;
  });

  const Cajones = Archiveros
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      const Id = Normalizar_Texto(Base.Id);
      return {
        Id,
        Nombre: Normalizar_Texto(Base.Nombre),
        Notas_Total:
          Cantidad_Por_Cajon[Id] || 0,
      };
    })
    .filter((Cajon) => Cajon.Nombre);

  return {
    Cajones_Total: Archiveros.length,
    Notas_Total: Notas.length,
    Etiquetas_Total: Etiquetas.length,
    Cajones: Cajones.slice(0, 12),
  };
}

function Construir_Resumen_Baul(
  Estado: Record<string, unknown>
) {
  const Baul = Obtener_Array_Estado(
    Estado,
    "Baul_Objetivos"
  )
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      return {
        Id: Normalizar_Texto(Base.Id),
        Nombre: Normalizar_Texto(Base.Nombre),
        Emoji: Normalizar_Texto(
          Base.Emoji || "\u2022"
        ),
        Estado: Normalizar_Texto(Base.Estado),
        Archivada: Base.Archivada === true,
        Timeline: Normalizar_Texto(
          Base.Timeline
        ),
      };
    })
    .filter((Objetivo) => Objetivo.Nombre);

  return {
    Total: Baul.length,
    Activas: Baul.filter((Objetivo) =>
      !Objetivo.Archivada
    ).length,
    Archivadas: Baul.filter((Objetivo) =>
      Objetivo.Archivada
    ).length,
    Destacadas: Baul
      .filter((Objetivo) => !Objetivo.Archivada)
      .slice(0, 12),
  };
}

function Construir_Resumen_Metas(
  Estado: Record<string, unknown>
) {
  const Metas = Obtener_Array_Estado(
    Estado,
    "Metas"
  )
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      return {
        Id: Normalizar_Texto(Base.Id),
        Nombre: Normalizar_Texto(Base.Nombre),
        Periodo: Normalizar_Texto(
          Base.Periodo
        ),
        Fecha_Desde: Normalizar_Texto(
          Base.Fecha_Desde
        ),
        Fecha_Hasta: Normalizar_Texto(
          Base.Fecha_Hasta
        ),
        Archivada: Base.Archivada === true,
      };
    })
    .filter((Meta) => Meta.Nombre);

  return {
    Total: Metas.length,
    Activas: Metas.filter((Meta) =>
      !Meta.Archivada
    ).length,
    Archivadas: Metas.filter((Meta) =>
      Meta.Archivada
    ).length,
    Destacadas: Metas
      .filter((Meta) => !Meta.Archivada)
      .slice(0, 12),
  };
}

function Construir_Tareas_Normalizadas_IA(
  Estado: Record<string, unknown>
) {
  return Obtener_Array_Estado(
    Estado,
    "Tareas"
  )
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      const Estado_Tarea =
        Normalizar_Texto(
          Base.Estado ||
            Base.estado ||
            "pendiente"
        ) || "pendiente";
      const Pospuesta =
        Estado_Tarea === "pospuesta";
      return {
        Id: Normalizar_Texto(Base.Id),
        Nombre: Normalizar_Texto(
          Base.Nombre || Base.Texto
        ),
        Emoji: Normalizar_Texto(
          Base.Emoji || "\u2022"
        ),
        Cajon: Normalizar_Texto(
          Base.Cajon || "Inbox"
        ) || "Inbox",
        Prioridad: Normalizar_Texto(
          Base.Prioridad ||
            Base.prioridad ||
            "baja"
        ) || "baja",
        Estado: Estado_Tarea,
        Fecha: Pospuesta
          ? ""
          : Normalizar_Texto(Base.Fecha),
        Hora: Pospuesta
          ? ""
          : Normalizar_Texto(Base.Hora).slice(
            0,
            5
          ),
        Planeada: Boolean(Base.Planeada),
        Evento_Id: Normalizar_Texto(
          Base.Evento_Id
        ),
        Abordaje_Id: Normalizar_Texto(
          Base.Abordaje_Id
        ),
        Plan_Clave: Normalizar_Texto(
          Base.Plan_Clave
        ),
        Plan_Item_Id: Normalizar_Texto(
          Base.Plan_Item_Id
        ),
        Fecha_Creacion: Normalizar_Texto(
          Base.Fecha_Creacion
        ),
        Fecha_Actualizacion: Normalizar_Texto(
          Base.Fecha_Actualizacion
        ),
        Fecha_Completado: Normalizar_Texto(
          Base.Fecha_Completado
        ),
      };
    })
    .filter((Tarea) => Tarea.Nombre);
}

function Construir_Habitos_Normalizados_IA(
  Estado: Record<string, unknown>
) {
  return Obtener_Array_Estado(
    Estado,
    "Habitos"
  )
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      const Programacion =
        Base.Programacion &&
          typeof Base.Programacion ===
            "object" &&
          !Array.isArray(Base.Programacion)
          ? Base.Programacion as Record<
            string,
            unknown
          >
          : {};
      const Meta =
        Base.Meta &&
          typeof Base.Meta === "object" &&
          !Array.isArray(Base.Meta)
          ? Base.Meta as Record<
            string,
            unknown
          >
          : {};
      return {
        Id: Normalizar_Texto(Base.Id),
        Nombre: Normalizar_Texto(Base.Nombre),
        Emoji: Normalizar_Texto(
          Base.Emoji || "\u2022"
        ),
        Tipo: Normalizar_Texto(
          Base.Tipo || "Hacer"
        ) || "Hacer",
        Activo: Base.Activo !== false,
        Archivado: Base.Archivado === true,
        Fecha_Inicio: Normalizar_Texto(
          Base.Fecha_Inicio
        ),
        Programacion: {
          Tipo: Normalizar_Texto(
            Programacion.Tipo || "Libre"
          ) || "Libre",
          Dias: Array.isArray(Programacion.Dias)
            ? Programacion.Dias
              .map((Dia) =>
                Numero_Entero(Dia, -1)
              )
              .filter((Dia) =>
                Dia >= 0 && Dia <= 6
              )
            : [],
          Horas: Array.isArray(
            Programacion.Horas
          )
            ? Programacion.Horas
              .map((Hora) =>
                Number(Hora)
              )
              .filter((Hora) =>
                Number.isFinite(Hora)
              )
            : [],
          Desde: Number(Programacion.Desde) || 0,
          Hasta: Number(Programacion.Hasta) || 0,
        },
        Meta: {
          Modo: Normalizar_Texto(
            Meta.Modo || "Check"
          ) || "Check",
          Regla: Normalizar_Texto(
            Meta.Regla || "Al_Menos"
          ) || "Al_Menos",
          Periodo: Normalizar_Texto(
            Meta.Periodo || "Dia"
          ) || "Dia",
          Cantidad: Number(Meta.Cantidad) || 0,
          Cantidad_Maxima:
            Number(Meta.Cantidad_Maxima) || 0,
          Unidad: Normalizar_Texto(Meta.Unidad),
        },
      };
    })
    .filter((Habito) => Habito.Nombre);
}

function Construir_Registros_Habitos_IA(
  Estado: Record<string, unknown>
) {
  return Obtener_Array_Estado(
    Estado,
    "Habitos_Registros"
  )
    .filter((Item) =>
      Item && typeof Item === "object"
    )
    .map((Item) => {
      const Base =
        Item as Record<string, unknown>;
      return {
        Id: Normalizar_Texto(Base.Id),
        Habito_Id: Normalizar_Texto(
          Base.Habito_Id
        ),
        Fecha: Normalizar_Texto(Base.Fecha),
        Hora: Normalizar_Texto(Base.Hora).slice(
          0,
          5
        ),
        Fecha_Hora: Normalizar_Texto(
          Base.Fecha_Hora
        ),
        Periodo_Clave: Normalizar_Texto(
          Base.Periodo_Clave
        ),
        Fuente: Normalizar_Texto(
          Base.Fuente
        ),
        Fuente_Id: Normalizar_Texto(
          Base.Fuente_Id
        ),
        Cantidad: Number(Base.Cantidad) || 0,
        Unidad: Normalizar_Texto(Base.Unidad),
        Nota: Normalizar_Texto(Base.Nota),
        Skip: Base.Skip === true,
      };
    });
}

function Resolver_Modo_Habitos(
  Url: URL
) {
  const Modo = Normalizar_Texto(
    Url.searchParams.get("modo") || "Dia"
  );
  return ["Dia", "Semana", "Quincena", "Mes"]
      .includes(Modo)
    ? Modo
    : "Dia";
}

function Obtener_Lunes_UTC(
  Fecha: Date
) {
  const Dia = Fecha.getUTCDay();
  const Delta = Dia === 0 ? -6 : 1 - Dia;
  return Sumar_Dias(Fecha, Delta);
}

function Resolver_Rango_Habitos(
  Fecha: string,
  Modo: string
) {
  const Base =
    Parsear_Fecha_ISO(Fecha) || new Date();
  if (Modo === "Semana") {
    const Inicio = Obtener_Lunes_UTC(Base);
    return {
      Inicio: Formatear_Fecha_ISO(Inicio),
      Fin: Formatear_Fecha_ISO(
        Sumar_Dias(Inicio, 6)
      ),
    };
  }
  if (Modo === "Quincena") {
    const Lunes = Obtener_Lunes_UTC(Base);
    const Ancla = new Date(
      Date.UTC(1970, 0, 5)
    );
    const Semanas_Desde_Ancla = Math.floor(
      (Lunes.getTime() -
        Ancla.getTime()) /
        86400000 / 7
    );
    const Offset =
      ((Semanas_Desde_Ancla % 2) + 2) % 2;
    const Inicio = Sumar_Dias(
      Lunes,
      -7 * Offset
    );
    return {
      Inicio: Formatear_Fecha_ISO(Inicio),
      Fin: Formatear_Fecha_ISO(
        Sumar_Dias(Inicio, 13)
      ),
    };
  }
  if (Modo === "Mes") {
    const Inicio = new Date(
      Date.UTC(
        Base.getUTCFullYear(),
        Base.getUTCMonth(),
        1
      )
    );
    const Fin = new Date(
      Date.UTC(
        Base.getUTCFullYear(),
        Base.getUTCMonth() + 1,
        0
      )
    );
    return {
      Inicio: Formatear_Fecha_ISO(Inicio),
      Fin: Formatear_Fecha_ISO(Fin),
    };
  }
  return {
    Inicio: Fecha,
    Fin: Fecha,
  };
}

function Habito_Coincide_Con_Dia_IA(
  Habito: Record<string, unknown>,
  Fecha: string
) {
  const Dias = Array.isArray(
    (
      Habito.Programacion as Record<
        string,
        unknown
      >
    )?.Dias
  )
    ? (Habito.Programacion as Record<
      string,
      unknown
    >).Dias as number[]
    : [];
  if (!Dias.length) {
    return true;
  }
  const Fecha_Obj = Parsear_Fecha_ISO(Fecha);
  if (!Fecha_Obj) {
    return false;
  }
  const Dia_JS = Fecha_Obj.getUTCDay();
  const Dia = Dia_JS === 0 ? 6 : Dia_JS - 1;
  return Dias.includes(Dia);
}

function Habito_Fecha_Inicio_Futura_IA(
  Habito: Record<string, unknown>,
  Fecha: string
) {
  const Inicio = Normalizar_Texto(
    Habito.Fecha_Inicio
  );
  return Boolean(Inicio && Inicio > Fecha);
}

function Habito_Periodo_IA(
  Habito: Record<string, unknown>
) {
  const Periodo = Normalizar_Texto(
    (
      Habito.Meta as Record<string, unknown>
    )?.Periodo || "Dia"
  );
  return ["Dia", "Semana", "Quincena", "Mes"]
      .includes(Periodo)
    ? Periodo
    : "Dia";
}

function Habito_Clave_Periodo_IA(
  Habito: Record<string, unknown>,
  Fecha: string
) {
  const Periodo = Habito_Periodo_IA(Habito);
  if (Periodo === "Semana") {
    return Resolver_Rango_Habitos(
      Fecha,
      "Semana"
    ).Inicio;
  }
  const Fecha_Obj = Parsear_Fecha_ISO(Fecha);
  if (!Fecha_Obj) {
    return Fecha;
  }
  if (Periodo === "Quincena") {
    return `Q2S-${Resolver_Rango_Habitos(
      Fecha,
      "Quincena"
    ).Inicio}`;
  }
  if (Periodo === "Mes") {
    return `${Fecha_Obj.getUTCFullYear()}-${String(
      Fecha_Obj.getUTCMonth() + 1
    ).padStart(2, "0")}`;
  }
  return Fecha;
}

function Habito_Regla_IA(
  Habito: Record<string, unknown>
) {
  const Regla = Normalizar_Texto(
    (
      Habito.Meta as Record<string, unknown>
    )?.Regla || "Al_Menos"
  );
  return [
    "Al_Menos",
    "Exactamente",
    "Como_Maximo",
    "Entre",
  ].includes(Regla)
    ? Regla
    : "Al_Menos";
}

function Habito_Objetivo_IA(
  Habito: Record<string, unknown>
) {
  const Cantidad = Number(
    (
      Habito.Meta as Record<string, unknown>
    )?.Cantidad
  );
  if (Number.isFinite(Cantidad)) {
    return Cantidad;
  }
  return Habito.Tipo === "Evitar" ? 0 : 1;
}

function Habito_Modo_IA(
  Habito: Record<string, unknown>
) {
  return Normalizar_Texto(
    (
      Habito.Meta as Record<string, unknown>
    )?.Modo || "Check"
  ) || "Check";
}

function Habito_Cancelado_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Registros: Record<string, unknown>[]
) {
  const Periodo_Clave =
    Habito_Clave_Periodo_IA(Habito, Fecha);
  return Registros.some((Registro) =>
    Registro.Habito_Id === Habito.Id &&
    Registro.Periodo_Clave === Periodo_Clave &&
    Registro.Skip === true
  );
}

function Habito_Evitar_Confirmado_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Registros: Record<string, unknown>[]
) {
  if (Habito.Tipo !== "Evitar") {
    return false;
  }
  const Periodo_Clave =
    Habito_Clave_Periodo_IA(Habito, Fecha);
  return Registros.some((Registro) =>
    Registro.Habito_Id === Habito.Id &&
    Registro.Periodo_Clave === Periodo_Clave &&
    Registro.Fuente === "Manual" &&
    Registro.Skip !== true
  );
}

function Habito_Progreso_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Registros: Record<string, unknown>[]
) {
  const Periodo_Clave =
    Habito_Clave_Periodo_IA(Habito, Fecha);
  return Registros
    .filter((Registro) =>
      Registro.Habito_Id === Habito.Id &&
      Registro.Periodo_Clave === Periodo_Clave &&
      Registro.Skip !== true
    )
    .reduce(
      (Total, Registro) =>
        Total + (Number(Registro.Cantidad) || 0),
      0
    );
}

function Habito_Periodo_Finalizado_IA(
  Habito: Record<string, unknown>,
  Fecha: string
) {
  const Rango = Resolver_Rango_Habitos(
    Fecha,
    Habito_Periodo_IA(Habito)
  );
  const Fin = Parsear_Fecha_ISO(Rango.Fin);
  const Hoy = Parsear_Fecha_ISO(
    Obtener_Hoy_ISO()
  );
  return Boolean(
    Fin && Hoy && Fin.getTime() < Hoy.getTime()
  );
}

function Habito_Esta_Completo_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Registros: Record<string, unknown>[]
) {
  const Actual = Habito_Progreso_IA(
    Habito,
    Fecha,
    Registros
  );
  const Objetivo = Habito_Objetivo_IA(
    Habito
  );
  const Regla = Habito_Regla_IA(Habito);
  if (Habito.Tipo === "Evitar") {
    return Actual <= Objetivo &&
      Habito_Evitar_Confirmado_IA(
        Habito,
        Fecha,
        Registros
      );
  }
  if (Regla === "Como_Maximo") {
    if (Habito_Modo_IA(Habito) === "Tiempo") {
      return Habito_Periodo_Finalizado_IA(
        Habito,
        Fecha
      ) && Actual <= Objetivo;
    }
    return Actual <= Objetivo;
  }
  if (Regla === "Entre") {
    const Maximo = Number(
      (
        Habito.Meta as Record<string, unknown>
      )?.Cantidad_Maxima
    ) || Objetivo;
    return Actual >= Objetivo &&
      Actual <= Maximo;
  }
  if (Regla === "Exactamente") {
    return Math.abs(Actual - Objetivo) < 0.0001;
  }
  return Actual >= Objetivo;
}

function Habito_Estado_Visible_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Registros: Record<string, unknown>[]
) {
  if (Habito.Archivado === true) {
    return "Inactivo";
  }
  if (
    Habito_Fecha_Inicio_Futura_IA(
      Habito,
      Fecha
    )
  ) {
    return "Inactivo";
  }
  if (
    Habito_Cancelado_IA(
      Habito,
      Fecha,
      Registros
    )
  ) {
    return "Cancelado";
  }
  if (Habito.Activo === false) {
    return "Inactivo";
  }
  const Actual = Habito_Progreso_IA(
    Habito,
    Fecha,
    Registros
  );
  const Regla = Habito_Regla_IA(Habito);
  const Objetivo = Habito_Objetivo_IA(
    Habito
  );
  if (Regla === "Como_Maximo") {
    if (Actual > Objetivo) {
      return "Pendiente";
    }
    if (
      Habito_Modo_IA(Habito) === "Tiempo" &&
      Habito_Periodo_Finalizado_IA(
        Habito,
        Fecha
      )
    ) {
      return "Realizado";
    }
    if (
      Habito.Tipo === "Evitar" &&
      Habito_Evitar_Confirmado_IA(
        Habito,
        Fecha,
        Registros
      )
    ) {
      return "Realizado";
    }
    return Actual > 0
      ? "En_Proceso"
      : "Pendiente";
  }
  if (Actual <= 0) {
    return "Pendiente";
  }
  return Habito_Esta_Completo_IA(
      Habito,
      Fecha,
      Registros
    )
    ? "Realizado"
    : "En_Proceso";
}

function Habito_Pasa_Contexto_IA(
  Habito: Record<string, unknown>,
  Fecha: string,
  Modo: string
) {
  const Periodo = Habito_Periodo_IA(
    Habito
  );
  if (Modo === "Dia") {
    return Periodo === "Dia" &&
      Habito_Coincide_Con_Dia_IA(
        Habito,
        Fecha
      );
  }
  if (Modo === "Semana") {
    return Periodo === "Semana";
  }
  if (Modo === "Quincena") {
    return Periodo === "Quincena";
  }
  if (Modo === "Mes") {
    return Periodo === "Mes";
  }
  return true;
}

function Construir_Slots_Normalizados_IA(
  Estado: Record<string, unknown>,
  Desde: string,
  Hasta: string
) {
  const Config_Extra =
    Obtener_Objeto_Estado(
      Estado,
      "Config_Extra"
    );
  const Tipos_Slot = Obtener_Array_Estado(
    Estado,
    "Tipos_Slot"
  );
  const Planes_Slot = Obtener_Objeto_Estado(
    Estado,
    "Planes_Slot"
  );
  const Slots_Muertos = new Set(
    Obtener_Array_Estado(
      Estado,
      "Slots_Muertos"
    )
      .map((Item) => {
        if (typeof Item === "string") {
          return Item;
        }
        const Base =
          Item as Record<string, unknown>;
        return (
          Normalizar_Texto(Base?.Clave) ||
          `${Normalizar_Texto(Base?.Fecha)}|${Numero_Entero(
            Base?.Hora,
            -1
          )}`
        );
      })
      .filter(Boolean)
  );
  const Slots_Muertos_Tipos =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Tipos"
    );
  const Slots_Muertos_Nombres =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Nombres"
    );
  const Slots_Muertos_Titulos_Visibles =
    Obtener_Objeto_Estado(
      Estado,
      "Slots_Muertos_Titulos_Visibles"
    );
  const Tipos_Slot_Por_Id =
    Construir_Mapa_Por_Id(Tipos_Slot);
  const Inicio_Hora = Math.max(
    0,
    Math.min(
      23,
      Numero_Entero(
        Config_Extra.Inicio_Hora,
        0
      )
    )
  );
  const Fin_Hora = Math.max(
    Inicio_Hora + 1,
    Math.min(
      24,
      Numero_Entero(Config_Extra.Fin_Hora, 24)
    )
  );
  const Ocupadas = new Set(
    Construir_Bloques_Agenda(
      Estado,
      Desde,
      Hasta
    )
      .filter((Bloque) => Bloque.Tipo === "Evento")
      .flatMap((Bloque) => {
        const Inicio = Numero_Entero(
          String(Bloque.Inicio).slice(0, 2),
          -1
        );
        const Fin = Numero_Entero(
          String(Bloque.Fin).slice(0, 2),
          -1
        );
        const Claves: string[] = [];
        for (
          let Hora = Inicio;
          Hora >= 0 && Hora < Fin;
          Hora += 1
        ) {
          Claves.push(
            `${Normalizar_Texto(
              Bloque.Fecha
            )}|${Hora}`
          );
        }
        return Claves;
      })
  );
  const Resultado: Record<string, unknown>[] =
    [];
  let Fecha_Actual = Desde;
  while (Fecha_Actual <= Hasta) {
    for (
      let Hora = Inicio_Hora;
      Hora < Fin_Hora;
      Hora += 1
    ) {
      const Clave = `${Fecha_Actual}|${Hora}`;
      if (Ocupadas.has(Clave)) {
        continue;
      }
      const Tipo_Id = Normalizar_Texto(
        Slots_Muertos_Tipos[Clave]
      );
      const Tipo =
        Tipos_Slot_Por_Id[Tipo_Id] || null;
      const Nombre = Normalizar_Texto(
        Slots_Muertos_Nombres[Clave]
      );
      const Plan =
        Normalizar_Plan_Slot_IA(
          Planes_Slot[Clave]
        );
      Resultado.push({
        Fecha: Fecha_Actual,
        Hora: Formatear_Hora(Hora),
        Tipo: Slots_Muertos.has(Clave)
          ? "Slot_Muerto"
          : "Slot_Vacio",
        Es_Slot_Muerto:
          Slots_Muertos.has(Clave),
        Tipo_Id: Tipo_Id || null,
        Tipo_Nombre: Normalizar_Texto(
          Tipo?.Nombre
        ),
        Titulo_Visible: Boolean(
          Slots_Muertos_Titulos_Visibles[Clave]
        )
          ? Nombre
          : "",
        Nombre_Slot: Nombre,
        Plan,
      });
    }
    Fecha_Actual = Formatear_Fecha_ISO(
      Sumar_Dias(
        Parsear_Fecha_ISO(Fecha_Actual)!,
        1
      )
    );
  }
  return Resultado;
}

function Responder_Tareas(
  Estado: Record<string, unknown>,
  Url: URL
) {
  const Rango = Resolver_Rango_Optional(Url);
  if (!Rango.Ok) {
    return Responder_Error(
      Rango.Status,
      Rango.Error,
      Rango.Detalle
    );
  }
  const Limite = Resolver_Limite(
    Url,
    50,
    100
  );
  const Cajon = Normalizar_Texto(
    Url.searchParams.get("cajon")
  );
  const Estado_Filtro = Normalizar_Texto(
    Url.searchParams.get("estado")
  ).toLowerCase();

  const Tareas =
    Construir_Tareas_Normalizadas_IA(Estado)
      .filter((Tarea) =>
        !Cajon ||
        Tarea.Cajon.toLowerCase() ===
          Cajon.toLowerCase()
      )
      .filter((Tarea) =>
        !Estado_Filtro ||
        Tarea.Estado.toLowerCase() ===
          Estado_Filtro
      )
      .filter((Tarea) => {
        if (!Rango.Desde || !Rango.Hasta) {
          return true;
        }
        if (!Tarea.Fecha) {
          return false;
        }
        return Tarea.Fecha >= Rango.Desde &&
          Tarea.Fecha <= Rango.Hasta;
      })
      .sort((A, B) => {
        const Clave_A =
          `${A.Fecha || "9999-12-31"}|${A.Hora || "99:99"}|${A.Nombre}`;
        const Clave_B =
          `${B.Fecha || "9999-12-31"}|${B.Hora || "99:99"}|${B.Nombre}`;
        return Clave_A.localeCompare(Clave_B);
      })
      .slice(0, Limite);

  return Responder_Json({
    Ok: true,
    Tareas,
  });
}

function Responder_Habitos(
  Estado: Record<string, unknown>,
  Url: URL
) {
  const Fecha = Resolver_Fecha_Referencia(
    Url
  );
  if (!Fecha.Ok) {
    return Responder_Error(
      Fecha.Status,
      Fecha.Error,
      Fecha.Detalle
    );
  }
  const Limite = Resolver_Limite(
    Url,
    50,
    100
  );
  const Modo = Resolver_Modo_Habitos(Url);
  const Registros =
    Construir_Registros_Habitos_IA(Estado);
  const Habitos =
    Construir_Habitos_Normalizados_IA(Estado)
      .filter((Habito) =>
        Habito.Activo !== false &&
        Habito.Archivado !== true &&
        !Habito_Fecha_Inicio_Futura_IA(
          Habito,
          Fecha.Fecha
        )
      )
      .filter((Habito) =>
        Habito_Pasa_Contexto_IA(
          Habito,
          Fecha.Fecha,
          Modo
        )
      )
      .map((Habito) => {
        const Registros_Habito = Registros
          .filter((Registro) =>
            Registro.Habito_Id === Habito.Id &&
            Registro.Skip !== true
          )
          .sort((A, B) =>
            `${B.Fecha}|${B.Hora}`.localeCompare(
              `${A.Fecha}|${A.Hora}`
            )
          );
        return {
          ...Habito,
          Estado_Visible:
            Habito_Estado_Visible_IA(
              Habito,
              Fecha.Fecha,
              Registros
            ),
          Periodo_Clave:
            Habito_Clave_Periodo_IA(
              Habito,
              Fecha.Fecha
            ),
          Progreso_Actual:
            Habito_Progreso_IA(
              Habito,
              Fecha.Fecha,
              Registros
            ),
          Objetivo_Actual:
            Habito_Objetivo_IA(Habito),
          Ultimo_Registro:
            Registros_Habito[0] || null,
        };
      })
      .slice(0, Limite);

  return Responder_Json({
    Ok: true,
    Fecha: Fecha.Fecha,
    Modo,
    Rango: Resolver_Rango_Habitos(
      Fecha.Fecha,
      Modo
    ),
    Habitos,
  });
}

function Responder_Slots(
  Estado: Record<string, unknown>,
  Url: URL
) {
  const Rango = Resolver_Rango(Url);
  if (!Rango.Ok) {
    return Responder_Error(
      Rango.Status,
      Rango.Error,
      Rango.Detalle
    );
  }
  const Limite = Resolver_Limite(
    Url,
    100,
    200
  );
  return Responder_Json({
    Ok: true,
    Desde: Rango.Desde,
    Hasta: Rango.Hasta,
    Slots: Construir_Slots_Normalizados_IA(
      Estado,
      Rango.Desde,
      Rango.Hasta
    ).slice(0, Limite),
  });
}

function Responder_Agenda(
  Estado: Record<string, unknown>,
  Url: URL
) {
  const Rango = Resolver_Rango(Url);
  if (!Rango.Ok) {
    return Responder_Error(
      Rango.Status,
      Rango.Error,
      Rango.Detalle
    );
  }
  return Responder_Json({
    Ok: true,
    Desde: Rango.Desde,
    Hasta: Rango.Hasta,
    Bloques: Construir_Bloques_Agenda(
      Estado,
      Rango.Desde,
      Rango.Hasta
    ),
  });
}

function Responder_Contexto(
  Estado: Record<string, unknown>,
  Version: number,
  Actualizado_En: string | null,
  Url: URL
) {
  const Rango = Resolver_Rango(Url);
  if (!Rango.Ok) {
    return Responder_Error(
      Rango.Status,
      Rango.Error,
      Rango.Detalle
    );
  }

  const Bloques_Agenda =
    Construir_Bloques_Agenda(
      Estado,
      Rango.Desde,
      Rango.Hasta
    );

  return Responder_Json({
    Ok: true,
    Contexto: {
      Desde: Rango.Desde,
      Hasta: Rango.Hasta,
      Version_Estado: Version,
      Actualizado_En,
      Agenda: {
        Bloques_Total:
          Bloques_Agenda.length,
        Eventos_Total:
          Bloques_Agenda.filter((Bloque) =>
            Bloque.Tipo === "Evento"
          ).length,
        Slots_Muertos_Total:
          Bloques_Agenda.filter((Bloque) =>
            Bloque.Tipo === "Slot_Muerto"
          ).length,
        Planes_Slot_Total:
          Bloques_Agenda.filter((Bloque) =>
            Bloque.Plan_Slot
          ).length,
        Proximos_Bloques:
          Bloques_Agenda.slice(0, 15),
      },
      Tareas: Construir_Resumen_Tareas(
        Estado,
        Rango.Desde,
        Rango.Hasta
      ),
      Habitos: Construir_Resumen_Habitos(
        Estado,
        Rango.Desde,
        Rango.Hasta
      ),
      Slots: Construir_Resumen_Slots(
        Estado
      ),
      Planes_Semana:
        Construir_Resumen_Planes_Semana(
          Estado,
          Rango.Desde,
          Rango.Hasta
        ),
      Planes_Periodo:
        Construir_Resumen_Planes_Periodo(
          Estado
        ),
      Archivero: Construir_Resumen_Archivero(
        Estado
      ),
      Baul: Construir_Resumen_Baul(
        Estado
      ),
      Metas: Construir_Resumen_Metas(
        Estado
      ),
    },
  });
}

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  const Ruta = Obtener_Ruta_Relativa(Req);
  const Url = new URL(Req.url);

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

    if (Req.method !== "GET") {
      return Responder_Error(
        405,
        "Metodo no permitido",
        "Esta ruta por ahora solo acepta GET."
      );
    }

    if (Ruta === "/agenda") {
      return Responder_Agenda(
        Estado.Estado,
        Url
      );
    }

    if (Ruta === "/contexto") {
      return Responder_Contexto(
        Estado.Estado,
        Estado.Version,
        Estado.Actualizado_En,
        Url
      );
    }

    if (Ruta === "/tareas") {
      return Responder_Tareas(
        Estado.Estado,
        Url
      );
    }

    if (Ruta === "/habitos") {
      return Responder_Habitos(
        Estado.Estado,
        Url
      );
    }

    if (Ruta === "/slots") {
      return Responder_Slots(
        Estado.Estado,
        Url
      );
    }

    // TODO: Fase posterior.
    // Agregar rate limit por token antes de abrir
    // la API en produccion.
    return Responder_Error(
      501,
      "No implementado",
      "La fase actual expone /salud, " +
        "/agenda, /contexto, /tareas, /habitos, " +
        "/slots y lectura segura del estado."
    );
  }

  return Responder_Error(
    404,
    "Ruta inexistente",
    `No existe la ruta ${Ruta}.`
  );
});
