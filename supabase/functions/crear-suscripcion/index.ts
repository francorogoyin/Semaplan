// Edge Function: Crear suscripción en Mercado Pago.
// Usa un plan de suscripción pre-creado en MP.
// El init_point del plan redirige al checkout
// donde el usuario se loguea con su propia cuenta
// de MP y autoriza el cobro recurrente.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ID del plan creado en MP (producción).
const Mp_Plan_Id =
  "27f7a8694a4b4343ba024178d135b32c";
const Mp_Init_Point =
  "https://www.mercadopago.com.ar" +
  "/subscriptions/checkout" +
  "?preapproval_plan_id=" + Mp_Plan_Id;

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (Req) => {
  // Preflight CORS.
  if (Req.method === "OPTIONS") {
    return new Response("ok", {
      headers: Cors_Headers,
    });
  }

  try {
    // Verificar que el usuario está autenticado.
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

    const Supa_Url =
      Deno.env.get("SUPABASE_URL")!;
    const Supa_Anon_Key =
      Deno.env.get("SUPABASE_ANON_KEY")!;
    const Supa_Service_Key =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Registrar en la tabla suscripciones que
    // este usuario inició el flujo de pago.
    const Supa_Admin = createClient(
      Supa_Url,
      Supa_Service_Key
    );

    await Supa_Admin
      .from("suscripciones")
      .upsert(
        {
          usuario_id: Usuario.id,
          estado: "pending",
          payer_email: Usuario.email,
          monto: 999,
          moneda: "ARS",
        },
        { onConflict: "usuario_id" }
      );

    // Devolver la URL de checkout del plan.
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
  } catch (Error_General) {
    console.error(
      "Error general:",
      Error_General
    );
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
