// Edge Function: Crear suscripción en Mercado Pago.
// Verifica que el usuario esté autenticado y
// devuelve la URL del plan de suscripción de MP.
// El webhook se encarga de actualizar la DB
// cuando MP confirma el pago.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Mp_Plan_Id =
  Deno.env.get("MP_PREAPPROVAL_PLAN_ID") ||
  "27f7a8694a4b4343ba024178d135b32c";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, " +
    "apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (Req) => {
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  try {
    const Body = await Req.json().catch(() => ({}));
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

    const Supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
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
    } = await Supa.auth.getUser();

    if (!Usuario) {
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

    const Supa_Url = Deno.env.get("SUPABASE_URL")!;
    const Supa_Admin = createClient(
      Supa_Url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const Mp_Access_Token = Deno.env.get(
      "MP_ACCESS_TOKEN"
    )!;
    const Back_Url =
      typeof Body?.Back_Url === "string" &&
      Body.Back_Url.trim()
        ? Body.Back_Url.trim()
        : "https://semaplan.com";
    const Webhook_Url =
      `${Supa_Url}/functions/v1/webhook-mp`;

    const Mp_Response = await fetch(
      "https://api.mercadopago.com/preapproval",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${Mp_Access_Token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          preapproval_plan_id: Mp_Plan_Id,
          reason: "Semaplan Premium",
          external_reference: Usuario.id,
          payer_email: Usuario.email,
          back_url: Back_Url,
          notification_url: Webhook_Url,
          status: "pending",
        }),
      }
    );

    const Mp_Data = await Mp_Response.json();
    if (!Mp_Response.ok) {
      return new Response(
        JSON.stringify({
          Error: "Error creando suscripción",
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
      mp_preapproval_id: Mp_Data.id || null,
      mp_plan_id: Mp_Plan_Id,
      external_reference: Usuario.id,
      estado: Mp_Data.status || "pending",
      payer_email:
        Mp_Data.payer_email || Usuario.email,
      monto:
        Mp_Data.auto_recurring
          ?.transaction_amount || null,
      moneda:
        Mp_Data.auto_recurring?.currency_id ||
        "ARS",
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

    await Supa_Admin
      .from("suscripciones_historial")
      .insert(Registro);

    return new Response(
      JSON.stringify({
        Init_Point: Mp_Data.init_point || null,
        Mp_Id: Mp_Data.id || null,
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
    console.error("Error:", Err);
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
