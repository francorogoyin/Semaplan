// Edge Function: Crear suscripción en Mercado Pago.
// Verifica que el usuario esté autenticado y
// devuelve la URL del plan de suscripción de MP.
// El webhook se encarga de actualizar la DB
// cuando MP confirma el pago.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Mp_Init_Point =
  "https://www.mercadopago.com.ar" +
  "/subscriptions/checkout" +
  "?preapproval_plan_id=" +
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
