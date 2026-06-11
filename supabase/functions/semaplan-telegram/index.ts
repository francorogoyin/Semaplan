import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Mapa = Record<string, unknown>;

type Resultado_Mutacion = {
  Respuesta: string;
  Resultado?: Mapa;
  Cambios?: boolean;
};

type Respuesta_Ejecucion = Resultado_Mutacion & {
  Usuario_Id?: string | null;
  Estado?: string;
};

type Resultado_Busqueda =
  | {
    Ok: true;
    Item: Mapa;
  }
  | {
    Ok: false;
    Respuesta: Resultado_Mutacion;
  };

type Vinculo_Telegram = {
  usuario_id: string;
  telegram_user_id: string;
  alias?: string | null;
};

type Mensaje_Telegram = {
  message_id?: number;
  text?: string;
  chat?: {
    id?: number | string;
  };
  from?: {
    id?: number | string;
    username?: string;
    first_name?: string;
  };
};

type Update_Telegram = {
  update_id?: number;
  message?: Mensaje_Telegram;
  edited_message?: Mensaje_Telegram;
};

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-telegram-bot-api-secret-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const Timezone = "America/Argentina/Buenos_Aires";

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return Responder_Json({ Ok: true });
  }

  if (Req.method !== "POST") {
    return Responder_Json({
      Ok: false,
      Error: "method_not_allowed",
    }, 405);
  }

  const Webhook_Secret = String(
    Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || ""
  ).trim();
  if (Webhook_Secret) {
    const Header_Secret = String(
      Req.headers.get("X-Telegram-Bot-Api-Secret-Token") || ""
    ).trim();
    if (Header_Secret !== Webhook_Secret) {
      return Responder_Json({
        Ok: false,
        Error: "telegram_secret_invalid",
      }, 401);
    }
  }

  let Update: Update_Telegram;
  try {
    Update = await Req.json();
  } catch (_) {
    return Responder_Json({
      Ok: false,
      Error: "invalid_json",
    }, 400);
  }

  try {
    await Procesar_Update(Update);
  } catch (Error_Actual) {
    console.error("Error procesando update Telegram:", Error_Actual);
  }

  return Responder_Json({ Ok: true });
});

function Responder_Json(
  Cuerpo: Mapa,
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

function Crear_Supabase_Servicio() {
  const Url = String(Deno.env.get("SUPABASE_URL") || "").trim();
  const Key = String(
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  ).trim();
  if (!Url || !Key) {
    throw new Error("supabase_service_not_configured");
  }
  return createClient(Url, Key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function Procesar_Update(Update: Update_Telegram) {
  const Mensaje = Update.message || Update.edited_message;
  const Texto = String(Mensaje?.text || "").trim();
  const Update_Id = Number(Update.update_id);
  const Chat_Id = String(Mensaje?.chat?.id || "").trim();
  const Telegram_User_Id = String(Mensaje?.from?.id || "").trim();

  if (!Texto || !Chat_Id || !Telegram_User_Id) return;
  if (!Number.isFinite(Update_Id)) return;

  const Supa = Crear_Supabase_Servicio();
  const Existente = await Leer_Comando(Supa, Update_Id);
  if (Existente) return;

  const Insertado = await Registrar_Comando_Recibido(
    Supa,
    Update_Id,
    Number(Mensaje?.message_id) || null,
    Chat_Id,
    Telegram_User_Id,
    Texto
  );
  if (!Insertado) return;

  let Respuesta = "";
  let Usuario_Id: string | null = null;
  let Estado_Final = "aplicado";
  let Resultado: Mapa = {};
  let Error_Final = "";

  try {
    const Res = await Ejecutar_Comando(
      Supa,
      Texto,
      Chat_Id,
      Telegram_User_Id
    );
    Respuesta = Res.Respuesta;
    Usuario_Id = Res.Usuario_Id || null;
    Estado_Final = Res.Estado || "aplicado";
    Resultado = Res.Resultado || {};
  } catch (Error_Actual) {
    Estado_Final = "error";
    Error_Final = Error_Actual instanceof Error
      ? Error_Actual.message
      : String(Error_Actual);
    Respuesta =
      "No pude procesar ese comando. Revisa el formato o intenta " +
      "de nuevo en unos minutos.";
  }

  await Actualizar_Comando_Final(
    Supa,
    Update_Id,
    Usuario_Id,
    Estado_Final,
    Resultado,
    Error_Final
  );

  if (Respuesta) {
    await Enviar_Mensaje_Telegram(Chat_Id, Respuesta);
  }
}

async function Leer_Comando(Supa: ReturnType<typeof createClient>, Id: number) {
  const { data, error } = await Supa
    .from("telegram_comandos_usuario")
    .select("id")
    .eq("telegram_update_id", Id)
    .maybeSingle();
  if (error) {
    console.error("Error leyendo comando Telegram:", error);
    return null;
  }
  return data;
}

async function Registrar_Comando_Recibido(
  Supa: ReturnType<typeof createClient>,
  Update_Id: number,
  Message_Id: number | null,
  Chat_Id: string,
  Telegram_User_Id: string,
  Texto: string
) {
  const { error } = await Supa
    .from("telegram_comandos_usuario")
    .insert({
      telegram_update_id: Update_Id,
      telegram_message_id: Message_Id,
      telegram_chat_id: Chat_Id,
      telegram_user_id: Telegram_User_Id,
      comando: Primer_Token_Comando(Texto),
      texto_original: Texto,
      estado: "recibido",
    });
  if (!error) return true;
  if (String(error.code || "") === "23505") return false;
  throw error;
}

async function Actualizar_Comando_Final(
  Supa: ReturnType<typeof createClient>,
  Update_Id: number,
  Usuario_Id: string | null,
  Estado: string,
  Resultado: Mapa,
  Error_Final: string
) {
  const Patch: Mapa = {
    usuario_id: Usuario_Id,
    estado: Estado,
    resultado: Resultado,
    error: Error_Final || null,
    procesado_en: new Date().toISOString(),
  };
  const { error } = await Supa
    .from("telegram_comandos_usuario")
    .update(Patch)
    .eq("telegram_update_id", Update_Id);
  if (error) {
    console.error("Error actualizando comando Telegram:", error);
  }
}

async function Ejecutar_Comando(
  Supa: ReturnType<typeof createClient>,
  Texto: string,
  Chat_Id: string,
  Telegram_User_Id: string
): Promise<Respuesta_Ejecucion> {
  const Normalizado = Normalizar_Texto(Texto);

  if (Normalizado === "/id" || Normalizado === "id") {
    return {
      Respuesta:
        `Tu Telegram user id es ${Telegram_User_Id}.`,
      Estado: "aplicado",
      Resultado: { telegram_user_id: Telegram_User_Id },
    };
  }

  if (
    Normalizado === "/start" ||
    Normalizado === "start" ||
    Normalizado === "/ayuda" ||
    Normalizado === "ayuda" ||
    Normalizado === "help" ||
    Normalizado === "/help"
  ) {
    return {
      Respuesta: Texto_Ayuda(Telegram_User_Id),
      Estado: "aplicado",
      Resultado: { ayuda: true },
    };
  }

  const Vinculo = await Buscar_Vinculo(Supa, Telegram_User_Id);
  if (!Vinculo) {
    return {
      Respuesta:
        "Este Telegram todavia no esta vinculado a una cuenta " +
        "Semaplan. Primero vincula este user id: " +
        Telegram_User_Id + ".",
      Estado: "rechazado",
      Resultado: { telegram_user_id: Telegram_User_Id },
    };
  }

  const Confirmacion = Extraer_Confirmacion(Texto);
  if (Confirmacion) {
    const Res = await Ejecutar_Confirmacion(
      Supa,
      Vinculo,
      Telegram_User_Id,
      Confirmacion
    );
    return {
      ...Res,
      Usuario_Id: Vinculo.usuario_id,
      Estado: "aplicado",
    };
  }

  if (Normalizado === "pendientes" ||
      Normalizado === "/pendientes" ||
      Normalizado.startsWith("pendientes ")) {
    const Res = await Consultar_Pendientes(
      Supa,
      Vinculo,
      Texto
    );
    return {
      ...Res,
      Usuario_Id: Vinculo.usuario_id,
      Estado: "aplicado",
    };
  }

  const Accion = Clasificar_Comando(Texto);
  if (!Accion) {
    return {
      Respuesta:
        "No reconoci ese comando. Usa /ayuda para ver formatos " +
        "soportados.",
      Usuario_Id: Vinculo.usuario_id,
      Estado: "rechazado",
      Resultado: { motivo: "comando_desconocido" },
    };
  }

  const Res = await Ejecutar_Accion(
    Supa,
    Vinculo,
    Telegram_User_Id,
    Accion
  );
  return {
    ...Res,
    Usuario_Id: Vinculo.usuario_id,
    Estado: "aplicado",
  };
}

async function Buscar_Vinculo(
  Supa: ReturnType<typeof createClient>,
  Telegram_User_Id: string
): Promise<Vinculo_Telegram | null> {
  const { data, error } = await Supa
    .from("telegram_vinculos_usuario")
    .select("usuario_id, telegram_user_id, alias")
    .eq("telegram_user_id", Telegram_User_Id)
    .eq("habilitado", true)
    .maybeSingle();
  if (error) throw error;
  return data as Vinculo_Telegram | null;
}

function Texto_Ayuda(Telegram_User_Id: string) {
  return [
    "Comandos Semaplan Telegram:",
    "",
    "/id",
    "/pendientes",
    "/tarea Comprar filtros | manana 09:00",
    "/tarea_hecha Comprar filtros",
    "/tarea_deshecha Comprar filtros",
    "/tarea_horario Comprar filtros | 2026-06-12 10:30",
    "/tarea_borrar Comprar filtros",
    "/habito crear Lectura",
    "/habito_hecho Lectura",
    "/habito_deshecho Lectura",
    "/habito_horario Lectura | 21:00",
    "/habito_borrar Lectura",
    "/meta Tesis | 2 paginas | nota opcional",
    "/decoteca Vigilar y castigar | 20 paginas | nota opcional",
    "",
    "Borrados: Semaplan pide confirmar con /confirmar CODIGO.",
    `Tu Telegram user id es ${Telegram_User_Id}.`,
  ].join("\n");
}

function Primer_Token_Comando(Texto: string) {
  return String(Texto || "")
    .trim()
    .split(/\s+/)[0]
    ?.slice(0, 80) || "";
}

type Accion_Comando = {
  Modulo: "tarea" | "habito" | "meta" | "decoteca";
  Tipo: string;
  Argumento: string;
};

function Clasificar_Comando(Texto: string): Accion_Comando | null {
  const Limpio = Texto.trim();
  const Normalizado = Normalizar_Texto(Limpio);

  const Reglas: Array<[RegExp, Accion_Comando["Modulo"], string]> = [
    [/^\/?tarea\s+(.+)$/i, "tarea", "crear"],
    [/^\/?tarea_nueva\s+(.+)$/i, "tarea", "crear"],
    [/^nueva\s+tarea\s+(.+)$/i, "tarea", "crear"],
    [/^tarea\s+nueva\s+(.+)$/i, "tarea", "crear"],
    [/^\/?tarea_hecha\s+(.+)$/i, "tarea", "hecha"],
    [/^hecha\s+tarea\s+(.+)$/i, "tarea", "hecha"],
    [/^\/?tarea_deshecha\s+(.+)$/i, "tarea", "deshecha"],
    [/^deshecha\s+tarea\s+(.+)$/i, "tarea", "deshecha"],
    [/^\/?tarea_borrar\s+(.+)$/i, "tarea", "borrar"],
    [/^borrar\s+tarea\s+(.+)$/i, "tarea", "borrar"],
    [/^\/?tarea_horario\s+(.+)$/i, "tarea", "horario"],
    [/^horario\s+tarea\s+(.+)$/i, "tarea", "horario"],
    [/^\/?habito\s+crear\s+(.+)$/i, "habito", "crear"],
    [/^\/?habito_nuevo\s+(.+)$/i, "habito", "crear"],
    [/^nuevo\s+habito\s+(.+)$/i, "habito", "crear"],
    [/^\/?habito_hecho\s+(.+)$/i, "habito", "hecho"],
    [/^habito\s+hecho\s+(.+)$/i, "habito", "hecho"],
    [/^\/?habito_deshecho\s+(.+)$/i, "habito", "deshecho"],
    [/^habito\s+deshecho\s+(.+)$/i, "habito", "deshecho"],
    [/^\/?habito_borrar\s+(.+)$/i, "habito", "borrar"],
    [/^borrar\s+habito\s+(.+)$/i, "habito", "borrar"],
    [/^\/?habito_horario\s+(.+)$/i, "habito", "horario"],
    [/^horario\s+habito\s+(.+)$/i, "habito", "horario"],
    [/^\/?meta\s+(.+)$/i, "meta", "avance"],
    [/^avance\s+meta\s+(.+)$/i, "meta", "avance"],
    [/^\/?decoteca\s+(.+)$/i, "decoteca", "avance"],
    [/^avance\s+decoteca\s+(.+)$/i, "decoteca", "avance"],
  ];

  for (const [Regex, Modulo, Tipo] of Reglas) {
    const Match = Limpio.match(Regex);
    if (Match?.[1]) {
      return {
        Modulo,
        Tipo,
        Argumento: Match[1].trim(),
      };
    }
  }

  if (Normalizado.startsWith("/confirmar ")) return null;
  return null;
}

async function Ejecutar_Accion(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Telegram_User_Id: string,
  Accion: Accion_Comando
) {
  if (Accion.Modulo === "tarea") {
    return await Ejecutar_Tarea(
      Supa,
      Vinculo,
      Telegram_User_Id,
      Accion.Tipo,
      Accion.Argumento
    );
  }
  if (Accion.Modulo === "habito") {
    return await Ejecutar_Habito(
      Supa,
      Vinculo,
      Telegram_User_Id,
      Accion.Tipo,
      Accion.Argumento
    );
  }
  if (Accion.Modulo === "meta") {
    return await Ejecutar_Avance_Meta(
      Supa,
      Vinculo,
      Accion.Argumento
    );
  }
  return await Ejecutar_Avance_Decoteca(
    Supa,
    Vinculo,
    Accion.Argumento
  );
}

async function Ejecutar_Tarea(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Telegram_User_Id: string,
  Tipo: string,
  Argumento: string
) {
  if (Tipo === "crear") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Datos = Extraer_Fecha_Hora(Argumento);
        const Nombre = Datos.Texto.trim();
        if (!Nombre) {
          return {
            Respuesta: "La tarea necesita nombre.",
            Cambios: false,
          };
        }
        const Tareas = Asegurar_Array(Estado, "Tareas");
        const Ahora = new Date().toISOString();
        const Tarea = {
          Tipo_Dato: "Tarea",
          Id: Crear_Id("Tarea"),
          Emoji: "\u2022",
          Nombre,
          Cajon: "Inbox",
          Prioridad: "baja",
          Estado: "pendiente",
          Fecha: Datos.Fecha || "",
          Hora: Datos.Hora || "",
          Planeada: false,
          Evento_Id: "",
          Abordaje_Id: "",
          Plan_Clave: "",
          Plan_Item_Id: "",
          Fecha_Creacion: Ahora,
          Fecha_Actualizacion: Ahora,
          Fecha_Completado: "",
        };
        Tareas.push(Tarea);
        Asegurar_Cajon_Inbox(Estado);
        return {
          Respuesta:
            `Tarea creada: ${Nombre}${Texto_Fecha_Hora(Datos)}.`,
          Resultado: { tarea_id: Tarea.Id },
        };
      }
    );
  }

  if (Tipo === "hecha" || Tipo === "deshecha") {
    const Estado_Nuevo = Tipo === "hecha"
      ? "completada"
      : "pendiente";
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Tareas = Asegurar_Array(Estado, "Tareas");
        const Busqueda = Buscar_Por_Nombre(Tareas, Argumento, "Nombre");
        if (Busqueda.Ok !== true) return Busqueda.Respuesta;
        const Tarea = Busqueda.Item;
        const Ahora = new Date().toISOString();
        Tarea.Estado = Estado_Nuevo;
        Tarea.Fecha_Actualizacion = Ahora;
        Tarea.Fecha_Completado = Estado_Nuevo === "completada"
          ? Ahora
          : "";
        return {
          Respuesta:
            Estado_Nuevo === "completada"
              ? `Tarea marcada como hecha: ${Tarea.Nombre}.`
              : `Tarea marcada como pendiente: ${Tarea.Nombre}.`,
          Resultado: { tarea_id: Tarea.Id },
        };
      }
    );
  }

  if (Tipo === "horario") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Partes = Separar_Pipe(Argumento);
        if (Partes.length < 2) {
          return {
            Respuesta:
              "Usa /tarea_horario Nombre | fecha hora. Ejemplo: " +
              "/tarea_horario Comprar filtros | manana 09:00.",
            Cambios: false,
          };
        }
        const Nombre = Partes[0];
        const Datos = Extraer_Fecha_Hora(Partes.slice(1).join(" "));
        const Quitar_Horario = Normalizar_Texto(
          Partes.slice(1).join(" ")
        ).includes("sin horario");
        if (!Quitar_Horario && !Datos.Hora) {
          return {
            Respuesta:
              "Necesito una hora para fijar horario. Ejemplo: 09:00.",
            Cambios: false,
          };
        }
        const Tareas = Asegurar_Array(Estado, "Tareas");
        const Busqueda = Buscar_Por_Nombre(Tareas, Nombre, "Nombre");
        if (Busqueda.Ok !== true) return Busqueda.Respuesta;
        const Tarea = Busqueda.Item;
        if (Tarea_Esta_Vinculada(Tarea)) {
          return {
            Respuesta:
              "Esa tarea parece vinculada a agenda o planes. Cambiala " +
              "desde Semaplan para no dejar vinculos inconsistentes.",
            Cambios: false,
          };
        }
        const Ahora = new Date().toISOString();
        Tarea.Fecha = Quitar_Horario
          ? ""
          : (Datos.Fecha || String(Tarea.Fecha || "") ||
            Fecha_Argentina());
        Tarea.Hora = Quitar_Horario ? "" : Datos.Hora;
        Tarea.Planeada = false;
        Tarea.Evento_Id = "";
        Tarea.Abordaje_Id = "";
        Tarea.Plan_Clave = "";
        Tarea.Plan_Item_Id = "";
        Tarea.Fecha_Actualizacion = Ahora;
        return {
          Respuesta: Quitar_Horario
            ? `Horario quitado de tarea: ${Tarea.Nombre}.`
            : `Horario actualizado: ${Tarea.Nombre} ` +
              `${Tarea.Fecha} ${Tarea.Hora}.`,
          Resultado: { tarea_id: Tarea.Id },
        };
      }
    );
  }

  if (Tipo === "borrar") {
    const Estado = await Leer_Estado_Usuario(Supa, Vinculo.usuario_id);
    const Tareas = Array.isArray(Estado.Estado.Tareas)
      ? Estado.Estado.Tareas as Mapa[]
      : [];
    const Busqueda = Buscar_Por_Nombre(Tareas, Argumento, "Nombre");
    if (Busqueda.Ok !== true) return Busqueda.Respuesta;
    if (Tarea_Esta_Vinculada(Busqueda.Item)) {
      return {
        Respuesta:
          "Esa tarea esta vinculada a agenda o planes. Borrala desde " +
          "Semaplan para limpiar los vinculos.",
        Cambios: false,
      };
    }
    const Codigo = await Crear_Confirmacion(
      Supa,
      Vinculo,
      Telegram_User_Id,
      "borrar_tarea",
      { tarea_id: Busqueda.Item.Id }
    );
    return {
      Respuesta:
        `Para borrar la tarea "${Busqueda.Item.Nombre}", responde ` +
        `/confirmar ${Codigo}.`,
      Resultado: { confirmacion: Codigo },
      Cambios: false,
    };
  }

  return { Respuesta: "Accion de tarea no soportada.", Cambios: false };
}

async function Ejecutar_Habito(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Telegram_User_Id: string,
  Tipo: string,
  Argumento: string
) {
  if (Tipo === "crear") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Nombre = Argumento.trim();
        if (!Nombre) {
          return {
            Respuesta: "El habito necesita nombre.",
            Cambios: false,
          };
        }
        const Habitos = Asegurar_Array(Estado, "Habitos");
        const Habito = {
          Id: Crear_Id("Habito"),
          Nombre,
          Emoji: "\u2022",
          Color: "#426f94",
          Activo: true,
          Archivado: false,
          Fecha_Inicio: Fecha_Argentina(),
          Tipo: "Hacer",
          Programacion: {
            Tipo: "Libre",
            Dias: [],
            Horas: [],
            Desde: 0,
            Hasta: 0,
          },
          Meta: {
            Modo: "Check",
            Regla: "Al_Menos",
            Periodo: "Dia",
            Cantidad: 1,
            Cantidad_Maxima: 1,
            Unidad: "",
          },
          Orden: Habitos.length,
          Orden_Manual: false,
        };
        Habitos.push(Habito);
        return {
          Respuesta: `Habito creado: ${Nombre}.`,
          Resultado: { habito_id: Habito.Id },
        };
      }
    );
  }

  if (Tipo === "hecho") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Datos = Extraer_Fecha_Hora(Argumento, true);
        const Partes = Separar_Pipe(Datos.Texto);
        const Nombre = Partes[0] || Datos.Texto;
        const Cantidad_Pedida = Partes[1]
          ? Parsear_Numero(Partes[1])
          : null;
        const Habitos = Asegurar_Array(Estado, "Habitos");
        const Registros = Asegurar_Array(
          Estado,
          "Habitos_Registros"
        );
        const Busqueda = Buscar_Por_Nombre(Habitos, Nombre, "Nombre");
        if (Busqueda.Ok !== true) return Busqueda.Respuesta;
        const Habito = Busqueda.Item;
        const Fecha = Datos.Fecha || Fecha_Argentina();
        const Periodo_Clave = Habito_Clave_Periodo(Habito, Fecha);
        const Cantidad_Base =
          Cantidad_Pedida ??
          (Number((Habito.Meta as Mapa)?.Cantidad) || 1);
        const Cantidad = Habito.Tipo === "Evitar"
          ? 0
          : Math.max(0, Cantidad_Base);
        const Fuente = Habito.Tipo === "Evitar" ? "Manual" : "Telegram";
        const Fuente_Id = Habito.Tipo === "Evitar"
          ? `Manual_Evitar_${Habito.Id}_${Periodo_Clave}`
          : Crear_Id("Telegram_Habito");
        const Hora = Hora_Argentina();
        Quitar_Registros_Habito_Fuente(
          Registros,
          String(Habito.Id),
          Fuente,
          Fuente_Id,
          Periodo_Clave
        );
        Registros.push({
          Id: Crear_Id("Habito_Reg"),
          Habito_Id: String(Habito.Id),
          Fecha,
          Hora,
          Fecha_Hora: `${Fecha}T${Hora}`,
          Periodo_Clave,
          Fuente,
          Fuente_Id,
          Cantidad,
          Unidad: Habito_Unidad(Habito),
          Nota: "Telegram",
          Skip: false,
        });
        return {
          Respuesta:
            `Habito registrado: ${Habito.Nombre} (${Fecha}).`,
          Resultado: { habito_id: Habito.Id, fecha: Fecha },
        };
      }
    );
  }

  if (Tipo === "deshecho") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Datos = Extraer_Fecha_Hora(Argumento, true);
        const Habitos = Asegurar_Array(Estado, "Habitos");
        const Registros = Asegurar_Array(
          Estado,
          "Habitos_Registros"
        );
        const Busqueda = Buscar_Por_Nombre(
          Habitos,
          Datos.Texto,
          "Nombre"
        );
        if (Busqueda.Ok !== true) return Busqueda.Respuesta;
        const Habito = Busqueda.Item;
        const Fecha = Datos.Fecha || Fecha_Argentina();
        const Periodo_Clave = Habito_Clave_Periodo(Habito, Fecha);
        const Antes = Registros.length;
        const Filtrados = Registros.filter((Registro) => {
          return !(
            Registro.Habito_Id === Habito.Id &&
            Registro.Periodo_Clave === Periodo_Clave &&
            ["Telegram", "Manual"].includes(
              String(Registro.Fuente || "")
            )
          );
        });
        Estado.Habitos_Registros = Filtrados;
        if (Filtrados.length === Antes) {
          return {
            Respuesta:
              `No encontre una marca manual/Telegram para ` +
              `${Habito.Nombre} en ${Fecha}.`,
            Cambios: false,
          };
        }
        return {
          Respuesta:
            `Habito desmarcado: ${Habito.Nombre} (${Fecha}).`,
          Resultado: { habito_id: Habito.Id, fecha: Fecha },
        };
      }
    );
  }

  if (Tipo === "horario") {
    return await Mutar_Estado(
      Supa,
      Vinculo.usuario_id,
      (Estado) => {
        const Partes = Separar_Pipe(Argumento);
        if (Partes.length < 2) {
          return {
            Respuesta:
              "Usa /habito_horario Nombre | 21:00 o " +
              "/habito_horario Nombre | libre.",
            Cambios: false,
          };
        }
        const Habitos = Asegurar_Array(Estado, "Habitos");
        const Busqueda = Buscar_Por_Nombre(Habitos, Partes[0], "Nombre");
        if (Busqueda.Ok !== true) return Busqueda.Respuesta;
        const Habito = Busqueda.Item;
        const Config = Habito.Programacion as Mapa;
        const Texto_Horario = Partes.slice(1).join(" ");
        if (Normalizar_Texto(Texto_Horario).includes("libre")) {
          Habito.Programacion = {
            ...Config,
            Tipo: "Libre",
            Horas: [],
          };
          return {
            Respuesta: `Horario libre para habito: ${Habito.Nombre}.`,
            Resultado: { habito_id: Habito.Id },
          };
        }
        const Datos = Extraer_Fecha_Hora(Texto_Horario);
        if (!Datos.Hora) {
          return {
            Respuesta: "Necesito una hora. Ejemplo: 21:00.",
            Cambios: false,
          };
        }
        Habito.Programacion = {
          ...Config,
          Tipo: "Horas",
          Horas: [Hora_A_Numero(Datos.Hora)],
        };
        return {
          Respuesta:
            `Horario actualizado: ${Habito.Nombre} ${Datos.Hora}.`,
          Resultado: { habito_id: Habito.Id },
        };
      }
    );
  }

  if (Tipo === "borrar") {
    const Estado = await Leer_Estado_Usuario(Supa, Vinculo.usuario_id);
    const Habitos = Array.isArray(Estado.Estado.Habitos)
      ? Estado.Estado.Habitos as Mapa[]
      : [];
    const Busqueda = Buscar_Por_Nombre(Habitos, Argumento, "Nombre");
    if (Busqueda.Ok !== true) return Busqueda.Respuesta;
    const Codigo = await Crear_Confirmacion(
      Supa,
      Vinculo,
      Telegram_User_Id,
      "borrar_habito",
      { habito_id: Busqueda.Item.Id }
    );
    return {
      Respuesta:
        `Para borrar el habito "${Busqueda.Item.Nombre}", responde ` +
        `/confirmar ${Codigo}.`,
      Resultado: { confirmacion: Codigo },
      Cambios: false,
    };
  }

  return {
    Respuesta: "Accion de habito no soportada.",
    Cambios: false,
  };
}

async function Ejecutar_Avance_Meta(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Argumento: string
) {
  const Datos = Parsear_Avance(Argumento);
  if (!Datos.Nombre || Datos.Cantidad <= 0) {
    return {
      Respuesta:
        "Usa /meta Nombre | cantidad unidad | nota opcional.",
      Cambios: false,
    };
  }
  return await Mutar_Estado(
    Supa,
    Vinculo.usuario_id,
    (Estado) => {
      const Modelo = Obtener_Modelo_Planes(Estado);
      if (!Modelo) {
        return {
          Respuesta: "No encontre el modelo de Metas en Semaplan.",
          Cambios: false,
        };
      }
      const Busqueda = Buscar_Item_Meta(Modelo, Datos.Nombre);
      if (Busqueda.Ok !== true) return Busqueda.Respuesta;
      const Item = Busqueda.Item;
      const Id = Crear_Id("Plan_Avance");
      const Fecha = Datos.Fecha || Fecha_Argentina();
      const Hora = Datos.Hora || Hora_Argentina();
      Modelo.Avances = Es_Mapa(Modelo.Avances) ? Modelo.Avances : {};
      const Avances = Modelo.Avances as Mapa;
      Avances[Id] = {
        Id,
        Objetivo_Id: String(Item.Objetivo_Id || ""),
        Subobjetivo_Id: String(Item.Subobjetivo_Id || ""),
        Parte_Id: String(Item.Parte_Id || ""),
        Fuente: Item.Tipo === "Objetivo" ? "Manual" : "Subobjetivo",
        Cantidad: Datos.Cantidad,
        Cantidad_Total: 0,
        Unidad: Datos.Unidad || String(Item.Unidad || ""),
        Fecha,
        Hora,
        Fecha_Hora: `${Fecha}T${Hora || "00:00"}`,
        Nota: Datos.Nota || "Telegram",
        Origen_Tipo: "Telegram",
        Origen_Id: Id,
        Origen_Objetivo_Semanal_Id: "",
        Origen_Subobjetivo_Semanal_Id: "",
        Automatico: false,
        Distribucion: [],
        Orden: Object.keys(Avances).length,
        Creado_En: new Date().toISOString(),
        Actualizado_En: new Date().toISOString(),
      };
      Estado.Planes_Periodo = Modelo;
      return {
        Respuesta:
          `Avance de Meta cargado: ${Item.Nombre} ` +
          `${Formatear_Numero(Datos.Cantidad)}` +
          `${Datos.Unidad ? ` ${Datos.Unidad}` : ""}.`,
        Resultado: { avance_id: Id },
      };
    }
  );
}

async function Ejecutar_Avance_Decoteca(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Argumento: string
) {
  const Datos = Parsear_Avance(Argumento);
  if (!Datos.Nombre || Datos.Cantidad <= 0) {
    return {
      Respuesta:
        "Usa /decoteca Obra | cantidad unidad | nota opcional.",
      Cambios: false,
    };
  }
  return await Mutar_Estado(
    Supa,
    Vinculo.usuario_id,
    (Estado) => {
      const Decoteca = Es_Mapa(Estado.Decoteca)
        ? Estado.Decoteca as Mapa
        : null;
      if (!Decoteca) {
        return {
          Respuesta: "No encontre Decoteca en Semaplan.",
          Cambios: false,
        };
      }
      const Busqueda = Buscar_Item_Decoteca(Decoteca, Datos.Nombre);
      if (Busqueda.Ok !== true) return Busqueda.Respuesta;
      const Item = Busqueda.Item;
      const Avances = Array.isArray(Decoteca.Avances)
        ? Decoteca.Avances as Mapa[]
        : [];
      const Id = Crear_Id("Dec_Avance");
      const Fecha = Datos.Fecha || Fecha_Argentina();
      Avances.push({
        Id,
        Fecha,
        Teca_Id: Item.Teca_Id,
        Obra_Id: Item.Obra_Id,
        Parte_Id: Item.Parte_Id || "",
        Cantidad: Datos.Cantidad,
        Unidad: Datos.Unidad || Item.Unidad || "unidades",
        Nota: Datos.Nota || "Telegram",
        Creado_Ms: Date.now(),
      });
      Decoteca.Avances = Avances.sort((A, B) =>
        String(B.Fecha || "").localeCompare(String(A.Fecha || ""))
      );
      Estado.Decoteca = Decoteca;
      return {
        Respuesta:
          `Avance de Decoteca cargado: ${Item.Nombre} ` +
          `${Formatear_Numero(Datos.Cantidad)}` +
          `${Datos.Unidad ? ` ${Datos.Unidad}` : ""}.`,
        Resultado: { avance_id: Id },
      };
    }
  );
}

async function Consultar_Pendientes(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Texto: string
) {
  const Estado = await Leer_Estado_Usuario(Supa, Vinculo.usuario_id);
  const Hoy = Fecha_Argentina();
  const Solo_Hoy = Normalizar_Texto(Texto).includes("hoy");
  const Lineas: string[] = [];

  const Tareas = Array.isArray(Estado.Estado.Tareas)
    ? Estado.Estado.Tareas as Mapa[]
    : [];
  const Tareas_Pendientes = Tareas
    .filter((Tarea) => String(Tarea.Estado || "pendiente") === "pendiente")
    .filter((Tarea) => {
      if (!Solo_Hoy) return true;
      const Fecha = String(Tarea.Fecha || "");
      return !Fecha || Fecha <= Hoy;
    })
    .sort(Ordenar_Por_Fecha_Hora)
    .slice(0, 8);

  Lineas.push("Tareas:");
  Lineas.push(...(
    Tareas_Pendientes.length
      ? Tareas_Pendientes.map((Tarea) =>
        `- ${Tarea.Nombre}${Texto_Item_Fecha_Hora(Tarea)}`
      )
      : ["- Sin tareas pendientes en este filtro."]
  ));

  const Habitos = Array.isArray(Estado.Estado.Habitos)
    ? Estado.Estado.Habitos as Mapa[]
    : [];
  const Registros = Array.isArray(Estado.Estado.Habitos_Registros)
    ? Estado.Estado.Habitos_Registros as Mapa[]
    : [];
  const Habitos_Pendientes = Habitos
    .filter((Habito) =>
      Habito.Activo !== false &&
      Habito.Archivado !== true &&
      Habito_Coincide_Con_Dia(Habito, Hoy) &&
      !Habito_Completo(Habito, Hoy, Registros)
    )
    .slice(0, 8);

  Lineas.push("", "Habitos de hoy:");
  Lineas.push(...(
    Habitos_Pendientes.length
      ? Habitos_Pendientes.map((Habito) => `- ${Habito.Nombre}`)
      : ["- Sin habitos pendientes para hoy."]
  ));

  const Modelo = Obtener_Modelo_Planes(Estado.Estado);
  if (Modelo) {
    const Metas = Object.values(Modelo.Objetivos || {})
      .filter((Item) =>
        Es_Mapa(Item) &&
        String((Item as Mapa).Estado || "") !== "Cumplido" &&
        (Item as Mapa).Pausado !== true &&
        (Item as Mapa).Eliminado_Local !== true
      )
      .slice(0, 5) as Mapa[];
    Lineas.push("", "Metas:");
    Lineas.push(...(
      Metas.length
        ? Metas.map((Item) => `- ${Item.Nombre}`)
        : ["- Sin metas activas detectadas."]
    ));
  }

  const Decoteca = Es_Mapa(Estado.Estado.Decoteca)
    ? Estado.Estado.Decoteca as Mapa
    : null;
  const Obras = Array.isArray(Decoteca?.Obras)
    ? Decoteca?.Obras as Mapa[]
    : [];
  const Obras_Pendientes = Obras
    .filter((Obra) =>
      ["En_Curso", "Planeada"].includes(String(Obra.Estado || ""))
    )
    .slice(0, 5);
  Lineas.push("", "Decoteca:");
  Lineas.push(...(
    Obras_Pendientes.length
      ? Obras_Pendientes.map((Obra) => `- ${Obra.Titulo}`)
      : ["- Sin obras pendientes detectadas."]
  ));

  return {
    Respuesta: Lineas.join("\n").slice(0, 3900),
    Resultado: { consulta: "pendientes" },
  };
}

async function Ejecutar_Confirmacion(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Telegram_User_Id: string,
  Codigo: string
) {
  const { data, error } = await Supa
    .from("telegram_confirmaciones_usuario")
    .select("id, accion, payload, expira_en")
    .eq("telegram_user_id", Telegram_User_Id)
    .eq("usuario_id", Vinculo.usuario_id)
    .eq("codigo", Codigo)
    .eq("estado", "pendiente")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return {
      Respuesta: "No encontre una confirmacion pendiente con ese codigo.",
      Cambios: false,
    };
  }
  if (new Date(String(data.expira_en)).getTime() < Date.now()) {
    await Marcar_Confirmacion(Supa, String(data.id), "expirada");
    return {
      Respuesta: "Esa confirmacion expiro. Pedi el borrado de nuevo.",
      Cambios: false,
    };
  }

  const Accion = String(data.accion || "");
  const Payload = Es_Mapa(data.payload) ? data.payload as Mapa : {};
  let Res: Resultado_Mutacion;
  if (Accion === "borrar_tarea") {
    Res = await Confirmar_Borrar_Tarea(Supa, Vinculo, Payload);
  } else if (Accion === "borrar_habito") {
    Res = await Confirmar_Borrar_Habito(Supa, Vinculo, Payload);
  } else {
    Res = { Respuesta: "Confirmacion sin accion valida.", Cambios: false };
  }
  await Marcar_Confirmacion(Supa, String(data.id), "resuelta");
  return Res;
}

async function Confirmar_Borrar_Tarea(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Payload: Mapa
) {
  return await Mutar_Estado(
    Supa,
    Vinculo.usuario_id,
    (Estado) => {
      const Tarea_Id = String(Payload.tarea_id || "");
      const Tareas = Asegurar_Array(Estado, "Tareas");
      const Tarea = Tareas.find((Item) => Item.Id === Tarea_Id);
      if (!Tarea) {
        return {
          Respuesta: "La tarea ya no existe.",
          Cambios: false,
        };
      }
      if (Tarea_Esta_Vinculada(Tarea)) {
        return {
          Respuesta:
            "La tarea quedo vinculada a agenda o planes. Borrala " +
            "desde Semaplan.",
          Cambios: false,
        };
      }
      Estado.Tareas = Tareas.filter((Item) => Item.Id !== Tarea_Id);
      return {
        Respuesta: `Tarea borrada: ${Tarea.Nombre}.`,
        Resultado: { tarea_id: Tarea_Id },
      };
    }
  );
}

async function Confirmar_Borrar_Habito(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Payload: Mapa
) {
  return await Mutar_Estado(
    Supa,
    Vinculo.usuario_id,
    (Estado) => {
      const Habito_Id = String(Payload.habito_id || "");
      const Habitos = Asegurar_Array(Estado, "Habitos");
      const Habito = Habitos.find((Item) => Item.Id === Habito_Id);
      if (!Habito) {
        return {
          Respuesta: "El habito ya no existe.",
          Cambios: false,
        };
      }
      Estado.Habitos = Habitos.filter((Item) => Item.Id !== Habito_Id);
      const Registros = Asegurar_Array(Estado, "Habitos_Registros");
      Estado.Habitos_Registros = Registros.filter((Registro) =>
        Registro.Habito_Id !== Habito_Id
      );
      const Retos = Array.isArray(Estado.Retos)
        ? Estado.Retos as Mapa[]
        : [];
      Retos.forEach((Reto) => {
        if (Array.isArray(Reto.Habito_Ids)) {
          Reto.Habito_Ids = (Reto.Habito_Ids as unknown[])
            .filter((Id) => String(Id) !== Habito_Id);
        }
      });
      return {
        Respuesta: `Habito borrado: ${Habito.Nombre}.`,
        Resultado: { habito_id: Habito_Id },
      };
    }
  );
}

async function Marcar_Confirmacion(
  Supa: ReturnType<typeof createClient>,
  Id: string,
  Estado: string
) {
  const { error } = await Supa
    .from("telegram_confirmaciones_usuario")
    .update({
      estado: Estado,
      resuelto_en: new Date().toISOString(),
    })
    .eq("id", Id);
  if (error) console.error("Error cerrando confirmacion:", error);
}

async function Crear_Confirmacion(
  Supa: ReturnType<typeof createClient>,
  Vinculo: Vinculo_Telegram,
  Telegram_User_Id: string,
  Accion: string,
  Payload: Mapa
) {
  const Codigo = Generar_Codigo();
  const { error } = await Supa
    .from("telegram_confirmaciones_usuario")
    .insert({
      telegram_user_id: Telegram_User_Id,
      usuario_id: Vinculo.usuario_id,
      codigo: Codigo,
      accion: Accion,
      payload: Payload,
    });
  if (error) throw error;
  return Codigo;
}

async function Mutar_Estado(
  Supa: ReturnType<typeof createClient>,
  Usuario_Id: string,
  Mutador: (Estado: Mapa) => Resultado_Mutacion,
  Intento = 0
): Promise<Resultado_Mutacion> {
  const Fila = await Leer_Estado_Usuario(Supa, Usuario_Id);
  const Estado = Clonar(Fila.Estado);
  const Resultado = Mutador(Estado);
  if (Resultado.Cambios === false) return Resultado;

  Estado.Sync_Datos_Marca_Ms = Date.now();

  if (!Fila.Existe) {
    const { error } = await Supa
      .from("estado_usuario")
      .insert({
        user_id: Usuario_Id,
        estado: Estado,
      });
    if (error) throw error;
    return Resultado;
  }

  const { data, error } = await Supa
    .from("estado_usuario")
    .update({
      estado: Estado,
      version: Fila.Version + 1,
    })
    .eq("user_id", Usuario_Id)
    .eq("version", Fila.Version)
    .select("version")
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    if (Intento < 1) {
      return await Mutar_Estado(
        Supa,
        Usuario_Id,
        Mutador,
        Intento + 1
      );
    }
    return {
      Respuesta:
        "No aplique el cambio porque el estado remoto cambio al " +
        "mismo tiempo. Reintenta el comando.",
      Cambios: false,
    };
  }
  return Resultado;
}

async function Leer_Estado_Usuario(
  Supa: ReturnType<typeof createClient>,
  Usuario_Id: string
) {
  const { data, error } = await Supa
    .from("estado_usuario")
    .select("estado, version")
    .eq("user_id", Usuario_Id)
    .maybeSingle();
  if (error) throw error;
  return {
    Existe: Boolean(data),
    Estado: Es_Mapa(data?.estado) ? data?.estado as Mapa : {},
    Version: Number(data?.version) || 1,
  };
}

function Asegurar_Array(Estado: Mapa, Clave: string): Mapa[] {
  if (!Array.isArray(Estado[Clave])) {
    Estado[Clave] = [];
  }
  return Estado[Clave] as Mapa[];
}

function Asegurar_Cajon_Inbox(Estado: Mapa) {
  const Cajones = Array.isArray(Estado.Tareas_Cajones_Definidos)
    ? Estado.Tareas_Cajones_Definidos as unknown[]
    : [];
  const Normalizados = Cajones.map((Item) => String(Item || ""));
  if (!Normalizados.some((Item) =>
    Normalizar_Texto(Item) === "inbox"
  )) {
    Normalizados.unshift("Inbox");
  }
  Estado.Tareas_Cajones_Definidos = Array.from(new Set(Normalizados));
}

function Buscar_Por_Nombre(
  Items: Mapa[],
  Texto: string,
  Campo: string
): Resultado_Busqueda {
  const Busqueda = Normalizar_Texto(Texto);
  if (!Busqueda) {
    return {
      Ok: false,
      Respuesta: {
        Respuesta: "Necesito un texto de busqueda.",
        Cambios: false,
      },
    };
  }
  const Exactas = Items.filter((Item) =>
    Normalizar_Texto(String(Item[Campo] || "")) === Busqueda
  );
  const Coinciden = Exactas.length
    ? Exactas
    : Items.filter((Item) =>
      Normalizar_Texto(String(Item[Campo] || "")).includes(Busqueda)
    );
  if (!Coinciden.length) {
    return {
      Ok: false,
      Respuesta: {
        Respuesta: `No encontre coincidencias para "${Texto}".`,
        Cambios: false,
      },
    };
  }
  if (Coinciden.length > 1) {
    return {
      Ok: false,
      Respuesta: {
        Respuesta:
          "Hay varias coincidencias. Se mas especifico:\n" +
          Coinciden
            .slice(0, 6)
            .map((Item) => `- ${Item[Campo]}`)
            .join("\n"),
        Cambios: false,
      },
    };
  }
  return {
    Ok: true,
    Item: Coinciden[0],
  };
}

function Tarea_Esta_Vinculada(Tarea: Mapa) {
  return Boolean(
    Tarea.Planeada ||
    Tarea.Evento_Id ||
    Tarea.Abordaje_Id ||
    Tarea.Plan_Clave ||
    Tarea.Plan_Item_Id
  );
}

function Obtener_Modelo_Planes(Estado: Mapa) {
  const Modelo = Estado.Planes_Periodo;
  if (!Es_Mapa(Modelo)) return null;
  const M = Modelo as Mapa;
  if (!Es_Mapa(M.Objetivos)) M.Objetivos = {};
  if (!Es_Mapa(M.Subobjetivos)) M.Subobjetivos = {};
  if (!Es_Mapa(M.Partes)) M.Partes = {};
  if (!Es_Mapa(M.Avances)) M.Avances = {};
  return M;
}

function Buscar_Item_Meta(Modelo: Mapa, Texto: string) {
  const Items: Mapa[] = [];
  Object.values(Modelo.Objetivos as Mapa)
    .forEach((Objetivo) => {
      if (!Es_Mapa(Objetivo)) return;
      const Obj = Objetivo as Mapa;
      if (Obj.Eliminado_Local === true) return;
      Items.push({
        Tipo: "Objetivo",
        Nombre: String(Obj.Nombre || ""),
        Objetivo_Id: String(Obj.Id || ""),
        Unidad: Obj.Unidad_Custom || Obj.Unidad || "",
      });
    });
  Object.values(Modelo.Subobjetivos as Mapa)
    .forEach((Subobjetivo) => {
      if (!Es_Mapa(Subobjetivo)) return;
      const Sub = Subobjetivo as Mapa;
      if (Sub.Eliminado_Local === true) return;
      Items.push({
        Tipo: "Subobjetivo",
        Nombre: String(Sub.Nombre || ""),
        Objetivo_Id: String(Sub.Objetivo_Id || ""),
        Subobjetivo_Id: String(Sub.Id || ""),
        Unidad: Sub.Unidad_Custom || Sub.Unidad || "",
      });
    });
  Object.values(Modelo.Partes as Mapa)
    .forEach((Parte) => {
      if (!Es_Mapa(Parte)) return;
      const P = Parte as Mapa;
      if (P.Eliminado_Local === true) return;
      const Sub = (Modelo.Subobjetivos as Mapa)[
        String(P.Subobjetivo_Id || "")
      ] as Mapa | undefined;
      Items.push({
        Tipo: "Parte",
        Nombre: String(P.Titulo || P.Nombre || ""),
        Objetivo_Id:
          String(P.Objetivo_Id || Sub?.Objetivo_Id || ""),
        Subobjetivo_Id: String(P.Subobjetivo_Id || ""),
        Parte_Id: String(P.Id || ""),
        Unidad: P.Unidad_Custom || P.Unidad ||
          Sub?.Unidad_Custom || Sub?.Unidad || "",
      });
    });
  return Buscar_Por_Nombre(Items, Texto, "Nombre");
}

function Buscar_Item_Decoteca(Decoteca: Mapa, Texto: string) {
  const Obras = Array.isArray(Decoteca.Obras)
    ? Decoteca.Obras as Mapa[]
    : [];
  const Items: Mapa[] = [];
  Obras.forEach((Obra) => {
    const Teca_Id = String(Obra.Teca_Id || Obra.Teca || "");
    const Unidad = String(
      (Es_Mapa(Obra.Datos_Teca)
        ? (Obra.Datos_Teca as Mapa).Unidad
        : "") || Unidad_Decoteca(Teca_Id)
    );
    Items.push({
      Tipo: "Obra",
      Nombre: String(Obra.Titulo || ""),
      Obra_Id: String(Obra.Id || ""),
      Teca_Id,
      Unidad,
    });
    const Partes = Array.isArray(Obra.Partes)
      ? Obra.Partes as Mapa[]
      : [];
    Partes.forEach((Parte) => {
      Items.push({
        Tipo: "Parte",
        Nombre: `${Obra.Titulo} - ${Parte.Titulo}`,
        Obra_Id: String(Obra.Id || ""),
        Teca_Id,
        Parte_Id: String(Parte.Id || ""),
        Unidad: String(Parte.Unidad || Unidad),
      });
    });
  });
  return Buscar_Por_Nombre(Items, Texto, "Nombre");
}

function Unidad_Decoteca(Teca_Id: string) {
  if (Teca_Id === "Biblioteca") return "paginas";
  if (Teca_Id === "Musicoteca") return "minutos";
  if (Teca_Id === "Videoteca") return "minutos";
  if (Teca_Id === "Ludoteca") return "horas";
  return "unidades";
}

function Parsear_Avance(Argumento: string) {
  const Partes = Separar_Pipe(Argumento);
  let Nombre = "";
  let Datos = "";
  let Nota = "";
  if (Partes.length >= 2) {
    Nombre = Partes[0];
    Datos = Partes[1];
    Nota = Partes.slice(2).join(" | ");
  } else {
    const Match = Argumento.match(/^(.+?):\s*(.+)$/);
    if (Match) {
      Nombre = Match[1].trim();
      Datos = Match[2].trim();
    } else {
      Nombre = Argumento.trim();
    }
  }
  const Cantidad = Parsear_Numero(Datos);
  const Unidad = Datos
    .replace(/[-+]?\d+(?:[.,]\d+)?/, "")
    .replace(/\b(hoy|manana|ma\u00f1ana)\b/ig, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join(" ");
  const Fecha_Hora = Extraer_Fecha_Hora(Datos, true);
  return {
    Nombre,
    Cantidad: Cantidad || 0,
    Unidad,
    Nota,
    Fecha: Fecha_Hora.Fecha,
    Hora: Fecha_Hora.Hora,
  };
}

function Extraer_Fecha_Hora(Texto: string, Fecha_Default = false) {
  let Restante = String(Texto || "").trim();
  let Fecha = "";
  let Hora = "";

  const Normalizado = Normalizar_Texto(Restante);
  if (Normalizado.includes("pasado manana")) {
    Fecha = Fecha_Argentina(2);
    Restante = Restante.replace(/pasado\s+ma(?:n|\u00f1)ana/ig, " ");
  } else if (Normalizado.includes("manana")) {
    Fecha = Fecha_Argentina(1);
    Restante = Restante.replace(/ma(?:n|\u00f1)ana/ig, " ");
  } else if (Normalizado.includes("hoy")) {
    Fecha = Fecha_Argentina();
    Restante = Restante.replace(/\bhoy\b/ig, " ");
  }

  const Iso = Restante.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (Iso) {
    Fecha = Iso[1];
    Restante = Restante.replace(Iso[0], " ");
  }
  const Fecha_Corta = Restante.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (!Fecha && Fecha_Corta) {
    const Dia = Fecha_Corta[1].padStart(2, "0");
    const Mes = Fecha_Corta[2].padStart(2, "0");
    const Anio_Base = new Date().getFullYear();
    const Anio = Fecha_Corta[3]
      ? Fecha_Corta[3].padStart(4, "20")
      : String(Anio_Base);
    Fecha = `${Anio}-${Mes}-${Dia}`;
    Restante = Restante.replace(Fecha_Corta[0], " ");
  }

  const Hora_Match = Restante.match(
    /(?:\ba\s+las\s+([01]?\d|2[0-3])(?::([0-5]\d))?)|\b([01]?\d|2[0-3])[:.]([0-5]\d)\b|\b([01]?\d|2[0-3])\s*h\b/i
  );
  if (Hora_Match) {
    const H = Hora_Match[1] || Hora_Match[3] || Hora_Match[5] || "0";
    const M = Hora_Match[2] || Hora_Match[4] || "00";
    Hora = `${H.padStart(2, "0")}:${M.padStart(2, "0")}`;
    Restante = Restante.replace(Hora_Match[0], " ");
  }

  if (!Fecha && Fecha_Default) Fecha = Fecha_Argentina();

  return {
    Texto: Restante.replace(/\s+/g, " ").trim(),
    Fecha,
    Hora,
  };
}

function Separar_Pipe(Texto: string) {
  return String(Texto || "")
    .split("|")
    .map((Parte) => Parte.trim())
    .filter(Boolean);
}

function Parsear_Numero(Texto: string) {
  const Match = String(Texto || "").match(/-?\d+(?:[.,]\d+)?/);
  if (!Match) return null;
  const Numero = Number(Match[0].replace(",", "."));
  return Number.isFinite(Numero) ? Numero : null;
}

function Texto_Fecha_Hora(Datos: { Fecha?: string; Hora?: string }) {
  if (!Datos.Fecha && !Datos.Hora) return "";
  return ` (${Datos.Fecha || "sin fecha"}${Datos.Hora ? ` ${Datos.Hora}` : ""})`;
}

function Texto_Item_Fecha_Hora(Item: Mapa) {
  const Fecha = String(Item.Fecha || "");
  const Hora = String(Item.Hora || "");
  if (!Fecha && !Hora) return "";
  return ` (${Fecha || "sin fecha"}${Hora ? ` ${Hora}` : ""})`;
}

function Ordenar_Por_Fecha_Hora(A: Mapa, B: Mapa) {
  const FA = String(A.Fecha || "9999-12-31");
  const FB = String(B.Fecha || "9999-12-31");
  if (FA !== FB) return FA.localeCompare(FB);
  return String(A.Hora || "99:99").localeCompare(
    String(B.Hora || "99:99")
  );
}

function Habito_Clave_Periodo(Habito: Mapa, Fecha: string) {
  const Periodo = Es_Mapa(Habito.Meta)
    ? String((Habito.Meta as Mapa).Periodo || "Dia")
    : "Dia";
  if (Periodo === "Semana") return Lunes_De_Fecha(Fecha);
  if (Periodo === "Quincena") {
    return `Q2S-${Inicio_Quincena(Fecha)}`;
  }
  if (Periodo === "Mes") return Fecha.slice(0, 7);
  return Fecha;
}

function Habito_Unidad(Habito: Mapa) {
  const Meta = Es_Mapa(Habito.Meta) ? Habito.Meta as Mapa : {};
  if (Meta.Modo === "Tiempo") {
    return Meta.Unidad === "Horas" ? "h" : "min";
  }
  return String(Meta.Unidad || "");
}

function Habito_Coincide_Con_Dia(Habito: Mapa, Fecha: string) {
  const Programacion = Es_Mapa(Habito.Programacion)
    ? Habito.Programacion as Mapa
    : {};
  const Dias = Array.isArray(Programacion.Dias)
    ? Programacion.Dias as number[]
    : [];
  if (!Dias.length) return true;
  const Fecha_Obj = Parsear_Fecha_ISO(Fecha);
  if (!Fecha_Obj) return false;
  const Dia_JS = Fecha_Obj.getDay();
  const Dia = Dia_JS === 0 ? 6 : Dia_JS - 1;
  return Dias.includes(Dia);
}

function Habito_Completo(
  Habito: Mapa,
  Fecha: string,
  Registros: Mapa[]
) {
  const Periodo_Clave = Habito_Clave_Periodo(Habito, Fecha);
  const Total = Registros
    .filter((Registro) =>
      Registro.Habito_Id === Habito.Id &&
      Registro.Periodo_Clave === Periodo_Clave &&
      Registro.Skip !== true
    )
    .reduce((Suma, Registro) =>
      Suma + (Number(Registro.Cantidad) || 0), 0);
  if (Habito.Tipo === "Evitar") {
    const Fuente_Id = `Manual_Evitar_${Habito.Id}_${Periodo_Clave}`;
    return Registros.some((Registro) =>
      Registro.Habito_Id === Habito.Id &&
      Registro.Periodo_Clave === Periodo_Clave &&
      Registro.Fuente === "Manual" &&
      Registro.Fuente_Id === Fuente_Id
    ) && Total <= 0;
  }
  const Meta = Es_Mapa(Habito.Meta) ? Habito.Meta as Mapa : {};
  const Objetivo = Number(Meta.Cantidad) || 1;
  return Total >= Objetivo;
}

function Quitar_Registros_Habito_Fuente(
  Registros: Mapa[],
  Habito_Id: string,
  Fuente: string,
  Fuente_Id: string,
  Periodo_Clave: string
) {
  for (let I = Registros.length - 1; I >= 0; I -= 1) {
    const Registro = Registros[I];
    if (
      Registro.Habito_Id === Habito_Id &&
      Registro.Fuente === Fuente &&
      Registro.Fuente_Id === Fuente_Id &&
      Registro.Periodo_Clave === Periodo_Clave
    ) {
      Registros.splice(I, 1);
    }
  }
}

function Extraer_Confirmacion(Texto: string) {
  const Match = Texto.trim().match(/^\/?confirmar\s+([a-z0-9]{4,12})$/i);
  return Match ? Match[1].toUpperCase() : "";
}

function Generar_Codigo() {
  return Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase();
}

function Crear_Id(Prefijo: string) {
  return `${Prefijo}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function Normalizar_Texto(Texto: string) {
  return String(Texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function Es_Mapa(Valor: unknown): Valor is Mapa {
  return Boolean(
    Valor &&
    typeof Valor === "object" &&
    !Array.isArray(Valor)
  );
}

function Clonar<T>(Valor: T): T {
  return JSON.parse(JSON.stringify(Valor || {}));
}

function Fecha_Argentina(Offset_Dias = 0) {
  const Partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: Timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const Mapa_Partes = Object.fromEntries(
    Partes.map((Parte) => [Parte.type, Parte.value])
  );
  const Fecha = new Date(
    `${Mapa_Partes.year}-${Mapa_Partes.month}-` +
    `${Mapa_Partes.day}T00:00:00-03:00`
  );
  Fecha.setDate(Fecha.getDate() + Offset_Dias);
  return Fecha.toISOString().slice(0, 10);
}

function Hora_Argentina() {
  const Partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: Timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const Mapa_Partes = Object.fromEntries(
    Partes.map((Parte) => [Parte.type, Parte.value])
  );
  return `${Mapa_Partes.hour}:${Mapa_Partes.minute}`;
}

function Parsear_Fecha_ISO(Fecha: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(Fecha)) return null;
  const Date_Obj = new Date(`${Fecha}T00:00:00`);
  return Number.isNaN(Date_Obj.getTime()) ? null : Date_Obj;
}

function Lunes_De_Fecha(Fecha: string) {
  const Date_Obj = Parsear_Fecha_ISO(Fecha) || new Date();
  const Dia = Date_Obj.getDay();
  const Offset = Dia === 0 ? -6 : 1 - Dia;
  Date_Obj.setDate(Date_Obj.getDate() + Offset);
  return Date_Obj.toISOString().slice(0, 10);
}

function Inicio_Quincena(Fecha: string) {
  const Lunes = Parsear_Fecha_ISO(Lunes_De_Fecha(Fecha)) || new Date();
  const Ancla = new Date(1970, 0, 5);
  const Dias = Math.floor(
    (Lunes.getTime() - Ancla.getTime()) / 86400000
  );
  const Semanas = Math.floor(Dias / 7);
  const Offset = ((Semanas % 2) + 2) % 2;
  Lunes.setDate(Lunes.getDate() - (7 * Offset));
  return Lunes.toISOString().slice(0, 10);
}

function Hora_A_Numero(Hora: string) {
  const [H, M] = Hora.split(":").map(Number);
  return (Number(H) || 0) + ((Number(M) || 0) / 60);
}

function Formatear_Numero(Valor: number) {
  if (Math.abs(Valor - Math.round(Valor)) < 0.001) {
    return String(Math.round(Valor));
  }
  return String(Math.round(Valor * 100) / 100).replace(".", ",");
}

async function Enviar_Mensaje_Telegram(Chat_Id: string, Texto: string) {
  const Token = String(Deno.env.get("TELEGRAM_BOT_TOKEN") || "").trim();
  if (!Token) {
    console.warn("TELEGRAM_BOT_TOKEN no configurado.");
    return;
  }
  const Url = `https://api.telegram.org/bot${Token}/sendMessage`;
  const Res = await fetch(Url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: Chat_Id,
      text: Texto.slice(0, 4000),
      disable_web_page_preview: true,
    }),
  });
  if (!Res.ok) {
    console.error("Telegram sendMessage fallo:", await Res.text());
  }
}
