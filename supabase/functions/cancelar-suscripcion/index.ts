import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function Suscripcion_Sigue_Vigente(Suscripcion: any) {
  if (!Suscripcion) return false;
  const Estado = String(
    Suscripcion.estado || ""
  ).toLowerCase();
  if (Estado === "authorized") {
    return true;
  }
  if (
    Estado !== "cancelled"
    && Estado !== "paused"
  ) {
    return false;
  }
  const Detalle = Suscripcion.detalle || {};
  const Auto = Detalle.auto_recurring || {};
  const Fecha =
    Detalle.next_payment_date
    || Auto.next_payment_date
    || Auto.end_date
    || Suscripcion.fecha_actualizacion
    || Suscripcion.fecha_creacion
    || null;
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

    if (!Suscripcion?.mp_preapproval_id) {
      return new Response(
        JSON.stringify({
          Error: "No hay suscripción activa",
        }),
        {
          status: 404,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const Mp_Access_Token = Deno.env.get(
      "MP_ACCESS_TOKEN"
    )!;
    const Mp_Response = await fetch(
      "https://api.mercadopago.com/preapproval/" +
        Suscripcion.mp_preapproval_id,
      {
        method: "PUT",
        headers: {
          Authorization:
            `Bearer ${Mp_Access_Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "cancelled",
        }),
      }
    );

    const Mp_Data = await Mp_Response.json();
    if (!Mp_Response.ok) {
      return new Response(
        JSON.stringify({
          Error: "Error cancelando en Mercado Pago",
          Detalle: Mp_Data,
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

    const Registro = {
      usuario_id: Usuario.id,
      mp_preapproval_id:
        Mp_Data.id
        || Suscripcion.mp_preapproval_id,
      mp_plan_id:
        Mp_Data.preapproval_plan_id
        || Suscripcion.mp_plan_id
        || null,
      external_reference:
        String(
          Mp_Data.external_reference
          || Suscripcion.external_reference
          || Usuario.id
        ),
      estado: Mp_Data.status || "cancelled",
      payer_email:
        Mp_Data.payer_email
        || Suscripcion.payer_email
        || Usuario.email,
      monto:
        Mp_Data.auto_recurring
          ?.transaction_amount
        || Suscripcion.monto
        || null,
      moneda:
        Mp_Data.auto_recurring?.currency_id
        || Suscripcion.moneda
        || "ARS",
      detalle: Mp_Data,
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
          Error: "Error guardando cancelación",
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

    await Supa_Admin
      .from("suscripciones_historial")
      .insert(Registro);

    const {
      data: Historial,
      error: Error_Historial,
    } = await Supa_Admin
      .from("suscripciones_historial")
      .select(
        "estado, monto, moneda, " +
          "payer_email, detalle, " +
          "mp_preapproval_id, " +
          "fecha_evento"
      )
      .eq("usuario_id", Usuario.id)
      .order("fecha_evento", {
        ascending: false,
      })
      .limit(12);

    if (Error_Historial) {
      return new Response(
        JSON.stringify({
          Error: "Cancelada, pero falló el historial",
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
        Es_Premium:
          Suscripcion_Sigue_Vigente(Registro),
        Suscripcion: Registro,
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
