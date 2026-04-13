import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Mp_Plan_Id =
  Deno.env.get("MP_PREAPPROVAL_PLAN_ID") ||
  "27f7a8694a4b4343ba024178d135b32c";

const Mp_Init_Point =
  "https://www.mercadopago.com.ar" +
  "/subscriptions/checkout" +
  "?preapproval_plan_id=" + Mp_Plan_Id;

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, " +
    "apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

function Obtener_Fecha_Vigencia(Suscripcion: any) {
  const Detalle = Suscripcion?.detalle || {};
  const Auto = Detalle?.auto_recurring || {};
  return (
    Suscripcion?.trial_hasta
    || Detalle.trial_hasta
    || Detalle.next_payment_date
    || Auto.next_payment_date
    || Auto.end_date
    || Suscripcion?.fecha_actualizacion
    || Suscripcion?.fecha_creacion
    || null
  );
}

function Trial_Activo(Suscripcion: any) {
  if (!Suscripcion) return false;
  const Estado = String(
    Suscripcion.estado || ""
  ).toLowerCase();
  if (Estado === "authorized") {
    return false;
  }
  const Hasta = Obtener_Fecha_Vigencia(
    Suscripcion
  );
  if (!Hasta) return false;
  const Fecha = new Date(Hasta);
  if (Number.isNaN(Fecha.getTime())) {
    return false;
  }
  return Date.now() < Fecha.getTime() && Boolean(
    Suscripcion.trial_hasta
    || Suscripcion.detalle?.trial_hasta
  );
}

function Suscripcion_Sigue_Vigente(Suscripcion: any) {
  if (!Suscripcion) return false;
  const Estado = String(
    Suscripcion.estado || ""
  ).toLowerCase();
  if (Trial_Activo(Suscripcion)) {
    return true;
  }
  if (Estado === "authorized") {
    return true;
  }
  if (
    Estado !== "cancelled"
    && Estado !== "paused"
  ) {
    return false;
  }
  const Fecha = Obtener_Fecha_Vigencia(
    Suscripcion
  );
  if (!Fecha) return false;
  const Limite = new Date(Fecha);
  if (Number.isNaN(Limite.getTime())) {
    return false;
  }
  return Date.now() < Limite.getTime();
}

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
    const Supa_Service_Key = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
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
      Supa_Service_Key
    );

    const {
      data: Suscripcion_Existente,
      error: Error_Consulta,
    } = await Supa_Admin
      .from("suscripciones")
      .select("*")
      .eq("usuario_id", Usuario.id)
      .limit(1)
      .maybeSingle();

    if (Error_Consulta) {
      return new Response(
        JSON.stringify({
          Error: "Error consultando suscripción",
          Detalle: Error_Consulta,
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

    const Estado_Registro =
      Trial_Activo(Suscripcion_Existente)
        ? "trial"
        : Suscripcion_Sigue_Vigente(
            Suscripcion_Existente
          )
        ? String(
            Suscripcion_Existente?.estado
            || "pending"
          ).toLowerCase()
        : "pending";

    const Registro = {
      usuario_id: Usuario.id,
      mp_preapproval_id:
        Suscripcion_Existente?.mp_preapproval_id
        || null,
      mp_plan_id: Mp_Plan_Id,
      external_reference: Usuario.id,
      estado: Estado_Registro,
      payer_email:
        Usuario.email
        || Suscripcion_Existente?.payer_email
        || null,
      monto:
        Suscripcion_Existente?.monto || 999,
      moneda:
        Suscripcion_Existente?.moneda || "ARS",
      detalle:
        Suscripcion_Existente?.detalle || null,
      trial_hasta:
        Suscripcion_Existente?.trial_hasta
        || null,
      trial_iniciado_en:
        Suscripcion_Existente?.trial_iniciado_en
        || null,
      trial_origen:
        Suscripcion_Existente?.trial_origen
        || null,
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
          Error: "Error guardando suscripción",
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
        Init_Point: Mp_Init_Point,
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
        Error:
          Err instanceof Error
            ? Err.message
            : String(Err),
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
