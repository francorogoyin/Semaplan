import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function Sumar_Dias(Fecha: Date, Dias: number) {
  const Copia = new Date(Fecha);
  Copia.setUTCDate(Copia.getUTCDate() + Dias);
  return Copia;
}

function Trial_Activo(Suscripcion: any) {
  if (!Suscripcion) return false;
  const Estado = String(
    Suscripcion.estado || ""
  ).toLowerCase();
  if (Estado !== "trial") return false;
  const Hasta = Suscripcion.trial_hasta;
  if (!Hasta) return false;
  const Fecha = new Date(Hasta);
  if (Number.isNaN(Fecha.getTime())) {
    return false;
  }
  return Date.now() < Fecha.getTime();
}

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  try {
    const Cuerpo = Req.method === "POST"
      ? await Req.json().catch(() => ({}))
      : {};
    const Origen = String(
      Cuerpo?.Origen || "app"
    ).trim() || "app";

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

    const Supa_Admin = createClient(
      Supa_Url,
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )!
    );

    const { data: Suscripcion, error: Error_Db } =
      await Supa_Admin
        .from("suscripciones")
        .select("*")
        .eq("usuario_id", Usuario.id)
        .limit(1)
        .maybeSingle();

    if (Error_Db) {
      return new Response(
        JSON.stringify({
          Error: "Error consultando suscripción",
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

    if (Suscripcion?.trial_iniciado_en) {
      return new Response(
        JSON.stringify({
          Error: "El trial ya fue usado",
        }),
        {
          status: 409,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (Suscripcion?.estado === "authorized") {
      return new Response(
        JSON.stringify({
          Error: "La cuenta ya tiene Premium",
        }),
        {
          status: 409,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (Trial_Activo(Suscripcion)) {
      return new Response(
        JSON.stringify({
          Error: "El trial ya está activo",
        }),
        {
          status: 409,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const Ahora = new Date();
    const Trial_Hasta = Sumar_Dias(Ahora, 30);
    const Registro = {
      usuario_id: Usuario.id,
      estado: "trial",
      payer_email:
        Suscripcion?.payer_email
        || Usuario.email
        || null,
      monto: Suscripcion?.monto || null,
      moneda: Suscripcion?.moneda || "ARS",
      mp_preapproval_id:
        Suscripcion?.mp_preapproval_id || null,
      mp_plan_id:
        Suscripcion?.mp_plan_id || null,
      external_reference:
        Suscripcion?.external_reference
        || Usuario.id,
      detalle: {
        ...(Suscripcion?.detalle || {}),
        trial_hasta: Trial_Hasta.toISOString(),
      },
      trial_iniciado_en: Ahora.toISOString(),
      trial_hasta: Trial_Hasta.toISOString(),
      trial_origen: Origen,
    };

    const { error: Error_Upsert } =
      await Supa_Admin
        .from("suscripciones")
        .upsert(Registro, {
          onConflict: "usuario_id",
        });

    if (Error_Upsert) {
      return new Response(
        JSON.stringify({
          Error: "Error guardando trial",
          Detalle: Error_Upsert,
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

    return new Response(
      JSON.stringify({
        Ok: true,
        Es_Premium: true,
        Suscripcion: Registro,
      }),
      {
        status: 200,
        headers: {
          ...Cors_Headers,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (Err) {
    return new Response(
      JSON.stringify({
        Error: String(Err),
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
