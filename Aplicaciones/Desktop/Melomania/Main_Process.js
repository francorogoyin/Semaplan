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
const Ruta_Icono = Path.join(
  app.getAppPath(),
  "Aplicaciones",
  "Desktop",
  "Semaplan.ico"
);

let Url_App = "";
let Servidor_Local = null;

function Es_Url_Autorizacion(Url_Destino) {
  try {
    const Destino = new URL(Url_Destino);
    return Destino.origin === "https://accounts.spotify.com";
  } catch {
    return false;
  }
}

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

function Configurar_Navegacion(Ventana) {
  Ventana.webContents.setWindowOpenHandler(({ url }) => {
    if (Es_Url_Local(url) || Es_Url_Autorizacion(url)) {
      return { action: "allow" };
    }

    shell.openExternal(url);
    return { action: "deny" };
  });

  Ventana.webContents.on(
    "will-navigate",
    (Evento, url) => {
      if (Es_Url_Local(url)) return;
      if (Es_Url_Autorizacion(url)) return;
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
    Raiz_App: app.getAppPath(),
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
