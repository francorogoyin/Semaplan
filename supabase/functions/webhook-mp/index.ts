// Edge Function: Webhook de Mercado Pago.
// MP envía un POST con { type, data: { id } }
// cuando cambia el estado de una suscripción.
// Esta función consulta el estado actual a la
// API de MP y actualiza la tabla suscripciones.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "content-type",
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
    const Body = await Req.json();
    console.log(
      "Webhook recibido:",
      JSON.stringify(Body)
    );

    // Solo procesar notificaciones de
    // suscripciones (preapproval).
    if (
      Body.type !== "subscription_preapproval"
    ) {
      return new Response(
        JSON.stringify({ Ok: true }),
        {
          status: 200,
          headers: {
            ...Cors_Headers,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const Mp_Id = Body.data?.id;
    if (!Mp_Id) {
      return new Response(
        JSON.stringify({
          Error: "Falta data.id",
        }),
        {
          status: 400,
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

    // Consultar el estado actual de la
    // suscripción en MP.
    const Mp_Response = await fetch(
      "https://api.mercadopago.com" +
        `/preapproval/${Mp_Id}`,
      {
        headers: {
          Authorization:
            `Bearer ${Mp_Access_Token}`,
        },
      }
    );

    if (!Mp_Response.ok) {
      console.error(
        "Error consultando MP:",
        Mp_Response.status
      );
      return new Response(
        JSON.stringify({
          Error: "Error consultando MP",
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

    const Mp_Data = await Mp_Response.json();
    const Estado = Mp_Data.status;
    const Payer_Email = Mp_Data.payer_email;

    console.log(
      `Suscripción ${Mp_Id}: ` +
        `estado=${Estado}, ` +
        `email=${Payer_Email}`
    );

    const Supa_Admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )!
    );

    // Buscar al usuario por su email en la
    // tabla suscripciones (lo registramos al
    // iniciar el checkout).
    const { data: Suscripcion_Existente } =
      await Supa_Admin
        .from("suscripciones")
        .select("usuario_id")
        .eq("payer_email", Payer_Email)
        .limit(1)
        .maybeSingle();

    if (Suscripcion_Existente) {
      // Actualizar la suscripción existente
      // con el ID de MP y el nuevo estado.
      await Supa_Admin
        .from("suscripciones")
        .update({
          mp_preapproval_id: Mp_Id,
          estado: Estado,
        })
        .eq(
          "usuario_id",
          Suscripcion_Existente.usuario_id
        );

      console.log(
        "Suscripción actualizada para " +
          Suscripcion_Existente.usuario_id
      );
    } else {
      // No encontramos al usuario por email.
      // Guardar la suscripción igual para que
      // se pueda vincular después.
      await Supa_Admin
        .from("suscripciones")
        .insert({
          mp_preapproval_id: Mp_Id,
          estado: Estado,
          payer_email: Payer_Email,
          monto:
            Mp_Data.auto_recurring
              ?.transaction_amount,
          moneda:
            Mp_Data.auto_recurring
              ?.currency_id || "ARS",
        });

      console.log(
        "Suscripción nueva sin usuario: " +
          Payer_Email
      );
    }

    // Siempre devolver 200.
    return new Response(
      JSON.stringify({ Ok: true }),
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
      "Webhook error:",
      Error_General
    );
    return new Response(
      JSON.stringify({ Ok: true }),
      {
        status: 200,
        headers: {
          ...Cors_Headers,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
