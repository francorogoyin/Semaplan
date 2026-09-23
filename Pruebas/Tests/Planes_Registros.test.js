const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  const Inicio = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(Inicio, -1, `No se encontró la función ${Nombre}`);
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio);
  assert.notEqual(
    Fin_Parametros,
    -1,
    `No se encontró el cuerpo de ${Nombre}`
  );
  const Inicio_Cuerpo = Fin_Parametros + 2;
  let Profundidad = 0;
  for (let Indice = Inicio_Cuerpo; Indice < Codigo_Login.length; Indice += 1) {
    if (Codigo_Login[Indice] === "{") Profundidad += 1;
    if (Codigo_Login[Indice] === "}") Profundidad -= 1;
    if (Profundidad === 0) {
      return Codigo_Login.slice(Inicio, Indice + 1);
    }
  }
  throw new Error(`La función ${Nombre} quedó incompleta`);
}

test("reemplaza el registro editado en el modelo antes de recalcularlo", () => {
  const Avance_Original = {
    Id: "avance_prefacio",
    Objetivo_Id: "lectofilia",
    Subobjetivo_Id: "karamazov",
    Parte_Id: "prefacio",
    Cantidad: 8,
    Cantidad_Total: 8,
    Unidad: "Páginas",
    Nota: "Lectura inicial",
    Orden: 3,
    Creado_En: "2026-07-26T10:00:00.000Z"
  };
  const Modelo = { Avances: { [Avance_Original.Id]: Avance_Original } };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Normalizar_Avance_Plan: (Avance) => ({
      ...Avance,
      Cantidad: Number(Avance.Cantidad),
      Cantidad_Total: Number(Avance.Cantidad_Total)
    })
  };
  vm.createContext(Contexto);
  vm.runInContext(
    Extraer_Funcion("Planes_Reemplazar_Avance_Registro"),
    Contexto
  );

  const Actualizado = Contexto.Planes_Reemplazar_Avance_Registro(
    Avance_Original,
    {
      Cantidad: 7,
      Cantidad_Total: 7,
      Fecha: "2026-07-26",
      Hora: "10:30",
      Fecha_Hora: "2026-07-26T10:30",
      Actualizado_En: "2026-09-23T14:35:00.000Z"
    },
    Modelo
  );

  assert.notStrictEqual(Actualizado, Avance_Original);
  assert.strictEqual(Modelo.Avances.avance_prefacio, Actualizado);
  assert.equal(Modelo.Avances.avance_prefacio.Cantidad, 7);
  assert.equal(Modelo.Avances.avance_prefacio.Cantidad_Total, 7);
  assert.equal(Modelo.Avances.avance_prefacio.Nota, "Lectura inicial");
  assert.equal(Modelo.Avances.avance_prefacio.Orden, 3);
  assert.equal(
    Modelo.Avances.avance_prefacio.Fecha_Hora,
    "2026-07-26T10:30"
  );
});

test("editar sin cambiar destino conserva la asociación del registro", () => {
  const Funcion = Extraer_Funcion("Planes_Editar_Avance_Registro");
  const Inicio_Cambios = Funcion.indexOf("const Cambios_Avance = {");
  const Inicio_Reemplazo = Funcion.indexOf(
    "const Avance_Actualizado = Planes_Reemplazar_Avance_Registro"
  );
  assert.notEqual(Inicio_Cambios, -1);
  assert.notEqual(Inicio_Reemplazo, -1);

  const Bloque_Cambios = Funcion.slice(Inicio_Cambios, Inicio_Reemplazo);
  assert.match(Bloque_Cambios, /if \(Cambio_Destino\) \{/);
  assert.match(Bloque_Cambios, /Distribucion: \[\]/);
  assert.match(Bloque_Cambios, /Parte_Id:/);
  assert.match(Bloque_Cambios, /Cantidad,/);
  assert.ok(
    Bloque_Cambios.indexOf("if (Cambio_Destino) {") <
      Bloque_Cambios.indexOf("Distribucion: []"),
    "La distribución solo se reinicia al cambiar el destino"
  );
});

test("editar un registro refresca Partes si ese modal sigue abierto", () => {
  const Funcion_Refresco = Extraer_Funcion(
    "Planes_Refrescar_Modal_Partes_Si_Abierto"
  );
  const Funcion_Recalculo = Extraer_Funcion(
    "Planes_Recalcular_Avance_Subobjetivo"
  );
  const Overlay = {
    classList: { contains: (Clase) => Clase === "Activo" }
  };
  let Renderizados = 0;
  const Contexto = {
    document: {
      getElementById: (Id) =>
        Id === "Planes_Partes_Overlay" ? Overlay : null
    },
    Render_Modal_Planes_Partes: () => { Renderizados += 1; }
  };
  vm.createContext(Contexto);
  vm.runInContext(Funcion_Refresco, Contexto);

  assert.equal(Contexto.Planes_Refrescar_Modal_Partes_Si_Abierto(), true);
  assert.equal(Renderizados, 1);
  assert.match(
    Funcion_Recalculo,
    /Render_Modal_Planes_Registro\([\s\S]*?\);\s*\n\s*Planes_Refrescar_Modal_Partes_Si_Abierto\(\);/
  );
});
