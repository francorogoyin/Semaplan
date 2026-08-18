const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const Ruta_Login = path.resolve(__dirname, "../../login.html");
const Codigo_Login = fs.readFileSync(Ruta_Login, "utf8");

function Extraer_Funcion(Nombre) {
  const Inicio = Codigo_Login.indexOf(`function ${Nombre}(`);
  assert.notEqual(Inicio, -1, `No se encontro ${Nombre}`);
  const Fin_Parametros = Codigo_Login.indexOf(") {", Inicio);
  assert.notEqual(Fin_Parametros, -1);
  const Inicio_Cuerpo = Fin_Parametros + 2;
  let Profundidad = 0;
  for (
    let Indice = Inicio_Cuerpo;
    Indice < Codigo_Login.length;
    Indice += 1
  ) {
    if (Codigo_Login[Indice] === "{") Profundidad += 1;
    if (Codigo_Login[Indice] === "}") Profundidad -= 1;
    if (Profundidad === 0) {
      return Codigo_Login.slice(Inicio, Indice + 1);
    }
  }
  throw new Error(`La funcion ${Nombre} quedo incompleta`);
}

function Crear_Entorno_Nutrifit() {
  const Contexto = {};
  vm.createContext(Contexto);
  [
    "Nutrifit_Texto",
    "Nutrifit_Clave_Texto",
    "Nutrifit_Numero_Entrada",
    "Nutrifit_Unidad",
    "Nutrifit_Calcular_Ingredientes"
  ].forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return Contexto;
}

const Traducir = (Clave) => Clave;

test("Nutrifit calcula decimales y cantidades cero", () => {
  const Contexto = Crear_Entorno_Nutrifit();
  const Resultado = Contexto.Nutrifit_Calcular_Ingredientes(
    [
      {
        Id: "fila_1",
        Alimento_Id: "pollo",
        Alimento_Nombre: "Pechuga",
        Cantidad: "100,5",
        Unidad: "g"
      },
      {
        Id: "fila_2",
        Alimento_Id: "aceite",
        Alimento_Nombre: "Aceite",
        Cantidad: 0,
        Unidad: "ml"
      }
    ],
    [
      {
        Id: "pollo",
        Nombre: "Pechuga",
        Unidad_Base: "g",
        Calorias_Base: 1.65,
        Proteina_Base: 0.31,
        Aproximado: false,
        Fuente: ""
      },
      {
        Id: "aceite",
        Nombre: "Aceite",
        Unidad_Base: "ml",
        Calorias_Base: 8.8,
        Proteina_Base: 0,
        Aproximado: true,
        Fuente: "Referencia propia"
      }
    ],
    Traducir
  );

  assert.equal(Resultado.Valido, true);
  assert.equal(Resultado.Total_Calorias, 165.83);
  assert.equal(Resultado.Total_Proteina, 31.16);
  assert.equal(
    JSON.stringify(Array.from(Resultado.Supuestos)),
    JSON.stringify(["Aceite (Referencia propia)"])
  );
});

test("Nutrifit rechaza unidades incompatibles, negativos y alimentos ausentes", () => {
  const Contexto = Crear_Entorno_Nutrifit();
  const Resultado = Contexto.Nutrifit_Calcular_Ingredientes(
    [
      {
        Id: "fila_1",
        Alimento_Id: "pollo",
        Alimento_Nombre: "Pechuga",
        Cantidad: 100,
        Unidad: "ml"
      },
      {
        Id: "fila_2",
        Alimento_Id: "pollo",
        Alimento_Nombre: "Pechuga",
        Cantidad: -1,
        Unidad: "g"
      },
      {
        Id: "fila_3",
        Alimento_Id: "",
        Alimento_Nombre: "Desconocido",
        Cantidad: 50,
        Unidad: "g"
      }
    ],
    [
      {
        Id: "pollo",
        Nombre: "Pechuga",
        Unidad_Base: "g",
        Calorias_Base: 1.65,
        Proteina_Base: 0.31,
        Aproximado: false,
        Fuente: ""
      }
    ],
    Traducir
  );

  assert.equal(Resultado.Valido, false);
  assert.equal(Resultado.Ingredientes.length, 3);
  assert.equal(Resultado.Total_Calorias, 0);
  assert.equal(Resultado.Errores.length, 3);
});

test("Nutrifit conserva porción como unidad calculable", () => {
  const Contexto = Crear_Entorno_Nutrifit();
  assert.equal(Contexto.Nutrifit_Unidad("porción"), "porcion");
  const Resultado = Contexto.Nutrifit_Calcular_Ingredientes(
    [{
      Id: "fila_porcion",
      Alimento_Id: "faina",
      Alimento_Nombre: "Fainá",
      Cantidad: 1,
      Unidad: "porcion"
    }],
    [{
      Id: "faina",
      Nombre: "Fainá",
      Unidad_Base: "porcion",
      Calorias_Base: 250,
      Proteina_Base: 8,
      Aproximado: false,
      Fuente: ""
    }],
    Traducir
  );

  assert.equal(Resultado.Valido, true);
  assert.equal(Resultado.Total_Calorias, 250);
  assert.equal(Resultado.Total_Proteina, 8);
  assert.equal(Resultado.Ingredientes[0].Unidad, "porcion");
});
