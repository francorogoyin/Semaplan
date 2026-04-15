const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..", "..");
const DESTINO = path.join(__dirname, "Web");
const DESTINO_DESKTOP = path.join(
  DESTINO,
  "Aplicaciones",
  "Desktop"
);

function Asegurar_Directorio(Ruta) {
  fs.mkdirSync(Ruta, { recursive: true });
}

function Copiar(Origen_Rel, Destino_Rel = Origen_Rel) {
  const Origen = path.join(RAIZ, Origen_Rel);
  const Destino_Archivo = path.join(DESTINO, Destino_Rel);
  Asegurar_Directorio(path.dirname(Destino_Archivo));
  fs.copyFileSync(Origen, Destino_Archivo);
}

Asegurar_Directorio(DESTINO);
Asegurar_Directorio(DESTINO_DESKTOP);

Copiar("index.html");
Copiar("Aplicaciones/Desktop/Semaplan.ico");
Copiar("Aplicaciones/Desktop/Semaplan.png");

console.log("Web Android preparada en:", DESTINO);
