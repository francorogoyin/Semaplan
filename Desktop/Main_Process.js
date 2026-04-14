"use strict";

const Path = require("path");
const {
  app,
  BrowserWindow,
  shell,
} = require("electron");
const {
  Iniciar_Servidor_Local,
} = require("./Servidor_Local");

let Url_App = "";
let Servidor_Local = null;

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
    height: 900,
    icon: Path.join(app.getAppPath(), "Semaplan.ico"),
    minHeight: 720,
    minWidth: 1024,
    show: false,
    title: "Semaplan",
    width: 1440,
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
    console.error("No se pudo cerrar el servidor local:", Error);
  });
  Servidor_Local = null;
}

async function Arrancar_App() {
  Servidor_Local = await Iniciar_Servidor_Local({
    Puerto_Preferido:
      Number(process.env.SEMAPLAN_DESKTOP_PORT) || 4173,
    Raiz_App: app.getAppPath(),
  });
  Url_App = `${Servidor_Local.Url_Base}/index.html`;

  Crear_Ventana_Principal();
}

app.whenReady()
  .then(Arrancar_App)
  .then(() => {
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length > 0) return;
      Crear_Ventana_Principal();
    });
  })
  .catch((Error) => {
    console.error("No se pudo iniciar Semaplan Desktop:", Error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform === "darwin") return;
  app.quit();
});

app.on("before-quit", () => {
  Cerrar_Servidor_Local();
});
