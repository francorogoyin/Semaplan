"use strict";

const Fs = require("fs");
const Path = require("path");
const Zlib = require("zlib");

const Tamano = 256;

function Crear_Tabla_Crc32() {
  const Tabla = new Uint32Array(256);

  for (let Indice = 0; Indice < 256; Indice += 1) {
    let Valor = Indice;

    for (let Paso = 0; Paso < 8; Paso += 1) {
      const Lsb = Valor & 1;
      Valor >>>= 1;
      if (Lsb) {
        Valor ^= 0xedb88320;
      }
    }

    Tabla[Indice] = Valor >>> 0;
  }

  return Tabla;
}

const Tabla_Crc32 = Crear_Tabla_Crc32();

function Calcular_Crc32(Buffer_Datos) {
  let Crc = 0xffffffff;

  for (const Byte of Buffer_Datos) {
    const Indice = (Crc ^ Byte) & 0xff;
    Crc = (Crc >>> 8) ^ Tabla_Crc32[Indice];
  }

  return (Crc ^ 0xffffffff) >>> 0;
}

function Chunk_Png(Tipo, Datos) {
  const Buffer_Tipo = Buffer.from(Tipo, "ascii");
  const Buffer_Longitud = Buffer.alloc(4);
  Buffer_Longitud.writeUInt32BE(Datos.length, 0);

  const Buffer_Crc = Buffer.alloc(4);
  Buffer_Crc.writeUInt32BE(
    Calcular_Crc32(Buffer.concat([Buffer_Tipo, Datos])),
    0
  );

  return Buffer.concat([
    Buffer_Longitud,
    Buffer_Tipo,
    Datos,
    Buffer_Crc,
  ]);
}

function Esta_En_Rect_Redondeado(X, Y, Caja) {
  if (
    X < Caja.X ||
    Y < Caja.Y ||
    X >= Caja.X + Caja.Ancho ||
    Y >= Caja.Y + Caja.Alto
  ) {
    return false;
  }

  const Radio = Caja.Radio;
  const Centro_X = Math.min(
    Math.max(X, Caja.X + Radio),
    Caja.X + Caja.Ancho - Radio - 1
  );
  const Centro_Y = Math.min(
    Math.max(Y, Caja.Y + Radio),
    Caja.Y + Caja.Alto - Radio - 1
  );
  const Delta_X = X - Centro_X;
  const Delta_Y = Y - Centro_Y;

  return Delta_X * Delta_X + Delta_Y * Delta_Y <= Radio * Radio;
}

function Esta_En_S(X, Y) {
  const Trazo = 30;
  const Bloques = [
    { X: 56, Y: 48, Ancho: 144, Alto: Trazo, Radio: 14 },
    { X: 56, Y: 48, Ancho: Trazo, Alto: 82, Radio: 14 },
    { X: 56, Y: 114, Ancho: 144, Alto: Trazo, Radio: 14 },
    { X: 170, Y: 114, Ancho: Trazo, Alto: 94, Radio: 14 },
    { X: 56, Y: 190, Ancho: 144, Alto: Trazo, Radio: 14 },
  ];

  return Bloques.some((Bloque) =>
    Esta_En_Rect_Redondeado(X, Y, Bloque)
  );
}

function Color_De_Fondo(X, Y) {
  const Mezcla_X = X / (Tamano - 1);
  const Mezcla_Y = Y / (Tamano - 1);

  const Rojo = Math.round(15 + 18 * Mezcla_X);
  const Verde = Math.round(91 + 62 * Mezcla_Y);
  const Azul = Math.round(115 + 48 * Mezcla_X);

  return [Rojo, Verde, Azul, 255];
}

function Crear_Png() {
  const Firma = Buffer.from([
    0x89, 0x50, 0x4e, 0x47,
    0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  const Ihdr = Buffer.alloc(13);
  Ihdr.writeUInt32BE(Tamano, 0);
  Ihdr.writeUInt32BE(Tamano, 4);
  Ihdr[8] = 8;
  Ihdr[9] = 6;
  Ihdr[10] = 0;
  Ihdr[11] = 0;
  Ihdr[12] = 0;

  const Lienzo = {
    X: 16,
    Y: 16,
    Ancho: 224,
    Alto: 224,
    Radio: 54,
  };
  const Sombra = {
    X: 24,
    Y: 28,
    Ancho: 208,
    Alto: 208,
    Radio: 50,
  };

  const Filas = [];

  for (let Y = 0; Y < Tamano; Y += 1) {
    const Fila = Buffer.alloc(1 + Tamano * 4);
    Fila[0] = 0;

    for (let X = 0; X < Tamano; X += 1) {
      const Offset = 1 + X * 4;
      let Pixel = [0, 0, 0, 0];

      if (Esta_En_Rect_Redondeado(X, Y, Sombra)) {
        Pixel = [8, 32, 41, 90];
      }

      if (Esta_En_Rect_Redondeado(X, Y, Lienzo)) {
        Pixel = Color_De_Fondo(X, Y);
      }

      if (Esta_En_S(X, Y)) {
        Pixel = [245, 248, 250, 255];
      }

      Fila[Offset] = Pixel[0];
      Fila[Offset + 1] = Pixel[1];
      Fila[Offset + 2] = Pixel[2];
      Fila[Offset + 3] = Pixel[3];
    }

    Filas.push(Fila);
  }

  const Datos_Imagen = Buffer.concat(Filas);
  const Idat = Zlib.deflateSync(Datos_Imagen, {
    level: 9,
  });

  return Buffer.concat([
    Firma,
    Chunk_Png("IHDR", Ihdr),
    Chunk_Png("IDAT", Idat),
    Chunk_Png("IEND", Buffer.alloc(0)),
  ]);
}

function Crear_Ico(Buffer_Png) {
  const Cabecera = Buffer.alloc(6);
  Cabecera.writeUInt16LE(0, 0);
  Cabecera.writeUInt16LE(1, 2);
  Cabecera.writeUInt16LE(1, 4);

  const Entrada = Buffer.alloc(16);
  Entrada[0] = 0;
  Entrada[1] = 0;
  Entrada[2] = 0;
  Entrada[3] = 0;
  Entrada.writeUInt16LE(1, 4);
  Entrada.writeUInt16LE(32, 6);
  Entrada.writeUInt32LE(Buffer_Png.length, 8);
  Entrada.writeUInt32LE(22, 12);

  return Buffer.concat([Cabecera, Entrada, Buffer_Png]);
}

function Guardar_Icono() {
  const Buffer_Png = Crear_Png();
  const Buffer_Ico = Crear_Ico(Buffer_Png);
  const Ruta_Salida = Path.join(
    __dirname,
    "..",
    "Semaplan.ico"
  );

  Fs.writeFileSync(Ruta_Salida, Buffer_Ico);
  console.log(`Icono actualizado en ${Ruta_Salida}`);
}

Guardar_Icono();
