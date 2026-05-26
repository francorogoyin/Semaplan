"use strict";

const Path = require("path");
const {
  app,
  BrowserWindow,
  shell,
} = require("electron");
const {
  Iniciar_Servidor_Local,
} = require("../Servidor_Local");

const App_Id = "com.semaplan.melomania";

let Url_App = "";
let Servidor_Local = null;
let Spotify_Callback = null;

function Resolver_Raiz_App() {
  const Ruta_App = app.getAppPath();
  const Ruta_Normalizada = Ruta_App.replace(/\\/g, "/");
  if (Ruta_Normalizada.endsWith("Aplicaciones/Desktop/Melomania")) {
    return Path.resolve(Ruta_App, "../../..");
  }

  return Ruta_App;
}

const Raiz_App = Resolver_Raiz_App();
const Ruta_Icono = Path.join(
  Raiz_App,
  "Aplicaciones",
  "Desktop",
  "Semaplan.ico"
);

function Es_Url_Local(Url_Destino) {
  if (!Url_App) return false;

  try {
    const Base = new URL(Url_App);
    const Destino = new URL(Url_Destino);
    return Destino.origin === Base.origin;
  } catch {
    return false;
  }
}

function Responder_Json(Respuesta, Codigo, Datos) {
  Respuesta.writeHead(Codigo, {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store",
  });
  Respuesta.end(JSON.stringify(Datos));
}

function Responder_Html(Respuesta, Codigo, Html) {
  Respuesta.writeHead(Codigo, {
    "Content-Type": "text/html; charset=UTF-8",
    "Cache-Control": "no-store",
  });
  Respuesta.end(Html);
}

function Html_Retorno_Spotify(Url) {
  const Hay_Error = Boolean(Url.searchParams.get("error"));
  const Titulo = Hay_Error
    ? "Spotify no pudo conectarse"
    : "Spotify conectado";
  const Texto = Hay_Error
    ? "Volvi a Melomania para ver el detalle del error."
    : "Volvi a Melomania. Ya podes cerrar esta pestana.";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${Titulo}</title>
  <style>
    body {
      align-items: center;
      background: #f5f2ea;
      color: #1f2528;
      display: flex;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    main {
      border: 1px solid #d8d2c5;
      border-radius: 8px;
      max-width: 460px;
      padding: 28px;
      background: #fffaf0;
    }
    h1 { font-size: 24px; margin: 0 0 10px; }
    p { line-height: 1.5; margin: 0; }
  </style>
</head>
<body>
  <main>
    <h1>${Titulo}</h1>
    <p>${Texto}</p>
  </main>
  <script>
    setTimeout(() => window.close(), 1200);
  </script>
</body>
</html>`;
}

async function Manejar_Rutas_Melomania(Pedido, Respuesta) {
  const Url = new URL(Pedido.url || "/", "http://127.0.0.1");

  if (Url.pathname === "/spotify/callback") {
    Spotify_Callback = {
      Query: Url.search,
      Recibido_En: Date.now(),
    };
    Responder_Html(Respuesta, 200, Html_Retorno_Spotify(Url));
    return true;
  }

  if (Url.pathname === "/spotify/callback-result") {
    Responder_Json(Respuesta, 200, {
      Callback: Spotify_Callback,
    });
    return true;
  }

  if (Url.pathname === "/spotify/callback-clear") {
    if (Pedido.method !== "POST") {
      Responder_Json(Respuesta, 405, {
        error: "Metodo no permitido",
      });
      return true;
    }

    Spotify_Callback = null;
    Responder_Json(Respuesta, 200, {
      ok: true,
    });
    return true;
  }

  return false;
}

function Configurar_Navegacion(Ventana) {
  Ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (Es_Url_Local(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  Ventana.webContents.on(
    "will-navigate",
    (Evento, url) => {
      if (Es_Url_Local(url)) return;
      Evento.preventDefault();
      shell.openExternal(url);
    }
  );
}

function Crear_Ventana_Principal() {
  const Ventana = new BrowserWindow({
    autoHideMenuBar: true,
    backgroundColor: "#f5f2ea",
    height: 820,
    icon: Ruta_Icono,
    minHeight: 680,
    minWidth: 1040,
    show: false,
    title: "Semaplan Melomanía",
    width: 1180,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: Path.join(__dirname, "Preload.js"),
      sandbox: true,
    },
  });

  Configurar_Navegacion(Ventana);
  Ventana.once("ready-to-show", () => {
    Ventana.show();
  });
  Ventana.loadURL(Url_App);

  return Ventana;
}

async function Cerrar_Servidor_Local() {
  if (!Servidor_Local) return;
  await Servidor_Local.Cerrar().catch((Error) => {
    console.error("No se pudo cerrar Melomanía:", Error);
  });
  Servidor_Local = null;
}

async function Arrancar_App() {
  Servidor_Local = await Iniciar_Servidor_Local({
    Puerto_Preferido:
      Number(process.env.SEMAPLAN_MELOMANIA_PORT) || 4182,
    Raiz_App,
    Manejador_Extra: Manejar_Rutas_Melomania,
  });
  Url_App = `${Servidor_Local.Url_Base}` +
    "/Aplicaciones/Desktop/Melomania/index.html";

  Crear_Ventana_Principal();
}

app.setAppUserModelId(App_Id);

app.whenReady()
  .then(Arrancar_App)
  .then(() => {
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length > 0) return;
      Crear_Ventana_Principal();
    });
  })
  .catch((Error) => {
    console.error("No se pudo iniciar Melomanía:", Error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  app.quit();
});

app.on("before-quit", () => {
  Cerrar_Servidor_Local();
});
