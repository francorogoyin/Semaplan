// Edge Function: Consultar estado de suscripción.
// El frontend llama a esta función con el JWT del
// usuario para saber si tiene suscripción activa
// (Premium) o no.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  try {
    const Auth_Header = Req.headers.get(
      "Authorization"
    );
    if (!Auth_Header) {
      return new Response(
        JSON.stringify({
          Error: "No autorizado",
        }),
        {
          status: 401,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const Supa_Url = Deno.env.get(
      "SUPABASE_URL"
    )!;
    const Supa_Anon_Key = Deno.env.get(
      "SUPABASE_ANON_KEY"
    )!;

    // Verificar identidad del usuario.
    const Supa_Usuario = createClient(
      Supa_Url,
      Supa_Anon_Key,
      {
        global: {
          headers: {
            Authorization: Auth_Header,
          },
        },
      }
    );

    const {
      data: { user: Usuario },
      error: Error_Auth,
    } = await Supa_Usuario.auth.getUser();

    if (Error_Auth || !Usuario) {
      return new Response(
        JSON.stringify({
          Error: "Sesión inválida",
        }),
        {
          status: 401,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Buscar la suscripción del usuario.
    // Usa el JWT del usuario → la policy RLS
    // filtra automáticamente.
    const { data: Suscripcion, error: Error_Db } =
      await Supa_Usuario
        .from("suscripciones")
        .select(
          "estado, monto, moneda, " +
            "mp_preapproval_id, " +
            "payer_email, " +
            "fecha_creacion, " +
            "fecha_actualizacion"
        )
        .eq("usuario_id", Usuario.id)
        .order("fecha_creacion", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (Error_Db) {
      console.error("Error DB:", Error_Db);
      return new Response(
        JSON.stringify({
          Error: "Error consultando DB",
        }),
        {
          status: 500,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const {
      data: Historial,
      error: Error_Historial,
    } = await Supa_Usuario
      .from("suscripciones_historial")
      .select(
        "estado, monto, moneda, " +
          "payer_email, " +
          "mp_preapproval_id, " +
          "fecha_evento"
      )
      .eq("usuario_id", Usuario.id)
      .order("fecha_evento", {
        ascending: false,
      })
      .limit(12);

    if (Error_Historial) {
      console.error(
        "Error historial:",
        Error_Historial
      );
      return new Response(
        JSON.stringify({
          Error: "Error consultando historial",
        }),
        {
          status: 500,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const Es_Premium =
      Suscripcion?.estado === "authorized";

    return new Response(
      JSON.stringify({
        Es_Premium,
        Estado: Suscripcion?.estado || null,
        Suscripcion: Suscripcion || null,
        Historial: Historial || [],
      }),
      {
        status: 200,
        headers: {
          ...Cors_Headers,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (Error_General) {
    console.error("Error general:", Error_General);
    return new Response(
      JSON.stringify({
        Error: "Error interno",
      }),
      {
        status: 500,
        headers: {
          ...Cors_Headers,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
