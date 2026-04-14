import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function Json(Status: number, Body: Record<string, unknown>) {
  return new Response(
    JSON.stringify(Body),
    {
      status: Status,
      headers: {
        ...Cors_Headers,
        "Content-Type": "application/json",
      },
    }
  );
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
      return Json(401, {
        Error: "No autorizado",
      });
    }

    const Cuerpo = await Req.json().catch(() => ({}));
    const Asunto = String(
      Cuerpo?.Asunto || ""
    ).trim();
    const Mensaje = String(
      Cuerpo?.Mensaje || ""
    ).trim();
    const Url = String(
      Cuerpo?.Url || ""
    ).trim();

    if (!Asunto || !Mensaje) {
      return Json(400, {
        Error: "Faltan asunto o mensaje",
      });
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
      return Json(401, {
        Error: "Sesión inválida",
      });
    }

    const Resend_Key = Deno.env.get(
      "RESEND_API_KEY"
    );
    if (!Resend_Key) {
      return Json(500, {
        Error: "Falta RESEND_API_KEY",
      });
    }

    const Destino =
      Deno.env.get("AYUDA_DESTINO_EMAIL")
      || "patricioe.nogueroles@gmail.com";
    const Origen =
      Deno.env.get("AYUDA_ORIGEN_EMAIL")
      || "Semaplan <onboarding@resend.dev>";

    const Texto = [
      `Usuario: ${Usuario.email || "sin email"}`,
      `User ID: ${Usuario.id}`,
      Url ? `URL: ${Url}` : "",
      "",
      Mensaje,
    ].filter(Boolean).join("\n");

    const Html = [
      `<p><strong>Usuario:</strong> ${
        Usuario.email || "sin email"
      }</p>`,
      `<p><strong>User ID:</strong> ${Usuario.id}</p>`,
      Url
        ? `<p><strong>URL:</strong> ${Url}</p>`
        : "",
      "<hr>",
      `<pre style="white-space:pre-wrap;font:inherit;">${
        Mensaje
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
      }</pre>`,
    ].filter(Boolean).join("");

    const Resp = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Resend_Key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Origen,
          to: [Destino],
          reply_to: Usuario.email
            ? [Usuario.email]
            : undefined,
          subject: `[Semaplan] ${Asunto}`,
          text: Texto,
          html: Html,
        }),
      }
    );

    const Data = await Resp.json().catch(() => ({}));
    if (!Resp.ok) {
      return Json(502, {
        Error: "Error enviando email",
        Detalle: Data,
      });
    }

    return Json(200, {
      Ok: true,
      Id: Data?.id || null,
    });
  } catch (Error) {
    return Json(500, {
      Error: "Error inesperado",
      Detalle: String(
        Error instanceof Error
          ? Error.message
          : Error
      ),
    });
  }
});
