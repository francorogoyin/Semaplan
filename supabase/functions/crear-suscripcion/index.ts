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

    const Registro = {
      usuario_id: Usuario.id,
      mp_preapproval_id: null,
      mp_plan_id: Mp_Plan_Id,
      external_reference: Usuario.id,
      estado: "pending",
      payer_email: Usuario.email,
      monto: 999,
      moneda: "ARS",
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
