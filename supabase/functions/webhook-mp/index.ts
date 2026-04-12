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
    const External_Reference = String(
      Mp_Data.external_reference || ""
    ).trim() || null;
    const Mp_Plan_Id =
      Mp_Data.preapproval_plan_id || null;
    const Registro_Base = {
      mp_preapproval_id: Mp_Id,
      mp_plan_id: Mp_Plan_Id,
      external_reference: External_Reference,
      estado: Estado,
      payer_email: Payer_Email,
      monto:
        Mp_Data.auto_recurring
          ?.transaction_amount || null,
      moneda:
        Mp_Data.auto_recurring?.currency_id ||
        "ARS",
      detalle: Mp_Data,
    };

    const Supa_Admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      )!
    );

    let Usuario_Id = External_Reference;

    if (!Usuario_Id && Payer_Email) {
      const { data: Suscripcion_Existente } =
        await Supa_Admin
          .from("suscripciones")
          .select("usuario_id")
          .eq("payer_email", Payer_Email)
          .limit(1)
          .maybeSingle();
      Usuario_Id =
        Suscripcion_Existente?.usuario_id || null;
    }

    if (Usuario_Id) {
      await Supa_Admin
        .from("suscripciones")
        .upsert(
          {
            usuario_id: Usuario_Id,
            ...Registro_Base,
          },
          {
            onConflict: "usuario_id",
          }
        );
    }

    await Supa_Admin
      .from("suscripciones_historial")
      .insert({
        usuario_id: Usuario_Id,
        ...Registro_Base,
      });

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
  } catch (_) {
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
