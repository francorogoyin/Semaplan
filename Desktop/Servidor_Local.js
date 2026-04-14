"use strict";

const Fs = require("fs");
const Http = require("http");
const Path = require("path");

const Mime_Por_Extension = {
  ".css": "text/css; charset=UTF-8",
  ".html": "text/html; charset=UTF-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=UTF-8",
};

function Resolver_Ruta_Local(Raiz_App, Url_Solicitada) {
  const Url = new URL(Url_Solicitada, "http://127.0.0.1");
  let Ruta = decodeURIComponent(Url.pathname);

  if (Ruta === "/") {
    Ruta = "/index.html";
  }

  const Ruta_Absoluta = Path.normalize(
    Path.join(Raiz_App, `.${Ruta}`)
  );
  const Ruta_Relativa = Path.relative(Raiz_App, Ruta_Absoluta);

  if (
    Ruta_Relativa.startsWith("..") ||
    Path.isAbsolute(Ruta_Relativa)
  ) {
    return null;
  }

  return Ruta_Absoluta;
}

function Responder_Texto(Respuesta, Codigo, Texto) {
  Respuesta.writeHead(Codigo, {
    "Content-Type": "text/plain; charset=UTF-8",
    "Cache-Control": "no-store",
  });
  Respuesta.end(Texto);
}

function Crear_Manejador(Raiz_App) {
  return async function Atender(Pedido, Respuesta) {
    try {
      const Ruta_Local = Resolver_Ruta_Local(
        Raiz_App,
        Pedido.url || "/"
      );

      if (!Ruta_Local) {
        Responder_Texto(Respuesta, 403, "Acceso denegado");
        return;
      }

      const Estado = await Fs.promises.stat(Ruta_Local)
        .catch(() => null);

      if (!Estado || !Estado.isFile()) {
        Responder_Texto(Respuesta, 404, "Archivo no encontrado");
        return;
      }

      const Extension = Path.extname(Ruta_Local).toLowerCase();
      const Tipo = Mime_Por_Extension[Extension] ||
        "application/octet-stream";
      const Buffer_Archivo = await Fs.promises.readFile(Ruta_Local);

      Respuesta.writeHead(200, {
        "Content-Type": Tipo,
        "Cache-Control": "no-store",
      });
      Respuesta.end(Buffer_Archivo);
    } catch (Error) {
      console.error("Error sirviendo Semaplan Desktop:", Error);
      Responder_Texto(Respuesta, 500, "Error interno");
    }
  };
}

function Escuchar_Servidor(Servidor, Puerto) {
  return new Promise((Resolver, Rechazar) => {
    const Al_Escuchar = () => {
      Servidor.off("error", Al_Error);
      Resolver();
    };
    const Al_Error = (Error) => {
      Servidor.off("listening", Al_Escuchar);
      Rechazar(Error);
    };

    Servidor.once("listening", Al_Escuchar);
    Servidor.once("error", Al_Error);
    Servidor.listen(Puerto, "127.0.0.1");
  });
}

async function Iniciar_Servidor_Local({
  Puerto_Preferido = 4173,
  Raiz_App,
}) {
  const Servidor = Http.createServer(Crear_Manejador(Raiz_App));
  let Puerto_Activo = Puerto_Preferido;

  try {
    await Escuchar_Servidor(Servidor, Puerto_Preferido);
  } catch (Error) {
    if (Error && Error.code !== "EADDRINUSE") {
      throw Error;
    }
    await Escuchar_Servidor(Servidor, 0);
    Puerto_Activo = Servidor.address().port;
  }

  return {
    Puerto: Puerto_Activo,
    Servidor,
    Url_Base: `http://127.0.0.1:${Puerto_Activo}`,
    async Cerrar() {
      if (!Servidor.listening) return;
      await new Promise((Resolver, Rechazar) => {
        Servidor.close((Error) => {
          if (Error) {
            Rechazar(Error);
            return;
          }
          Resolver();
        });
      });
    },
  };
}

module.exports = {
  Iniciar_Servidor_Local,
};
