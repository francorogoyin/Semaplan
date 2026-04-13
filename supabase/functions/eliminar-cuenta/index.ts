import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const Cors_Headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, " +
    "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
    const Supa_Service_Role_Key = Deno.env.get(
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
      Supa_Service_Role_Key
    );

    const { error: Error_Historial } =
      await Supa_Admin
        .from("suscripciones_historial")
        .delete()
        .eq("usuario_id", Usuario.id);

    if (Error_Historial) {
      return new Response(
        JSON.stringify({
          Error: "No se pudo borrar el historial",
          Detalle: Error_Historial.message,
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

    const { error: Error_Suscripcion } =
      await Supa_Admin
        .from("suscripciones")
        .delete()
        .eq("usuario_id", Usuario.id);

    if (Error_Suscripcion) {
      return new Response(
        JSON.stringify({
          Error: "No se pudo borrar la suscripción",
          Detalle: Error_Suscripcion.message,
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

    const { error: Error_Estado_Usuario } =
      await Supa_Admin
        .from("estado_usuario")
        .delete()
        .eq("user_id", Usuario.id);

    if (Error_Estado_Usuario) {
      return new Response(
        JSON.stringify({
          Error: "No se pudo borrar el estado",
          Detalle: Error_Estado_Usuario.message,
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

    const { error: Error_Delete_User } =
      await Supa_Admin.auth.admin.deleteUser(
        Usuario.id
      );

    if (Error_Delete_User) {
      return new Response(
        JSON.stringify({
          Error: "No se pudo borrar el usuario",
          Detalle: Error_Delete_User.message,
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
    return new Response(
      JSON.stringify({
        Error: "Error inesperado",
        Detalle:
          Error_General instanceof Error
            ? Error_General.message
            : String(Error_General),
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
