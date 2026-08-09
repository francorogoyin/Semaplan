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

function Cargar_Funciones(Contexto, Nombres) {
  vm.createContext(Contexto);
  Nombres.forEach((Nombre) => {
    vm.runInContext(Extraer_Funcion(Nombre), Contexto);
  });
  return Contexto;
}

test("separa meta global, cuota, compromiso y trabajo operativo", () => {
  const Canonico = {
    Id: "Meta",
    Nombre: "Objetivo abstracto",
    Target_Total: 40,
    Progreso_Total: 5
  };
  const Periodo = {
    Id: "Trimestre_3",
    Inicio: "2026-07-01",
    Fin: "2026-09-30"
  };
  const Subs = Array.from({ length: 10 }, (_, Indice) => ({
    Id: `Sub_${Indice + 1}`,
    Hecha: Indice < 5,
    Aporte_Meta: 1
  }));
  const Items_Por_Id = new Map(Subs.map((Sub) => [Sub.Id, {
    Sub,
    Padre_Id: ""
  }]));
  const Modelo = { Objetivos: { Meta: Canonico }, Periodos: {} };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Objetivo_Canonico_Contextual: () => Canonico,
    Planes_Periodo_Contexto_Objetivo: () => Periodo,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({
      Items: Subs,
      Items_Por_Id
    }),
    Planes_Target_Suma_Componentes_Activo: () => false,
    Planes_Estado_Normalizado_Subobjetivo: (Sub) =>
      Sub.Hecha ? "Cumplido" : "Activo",
    Planes_Aporte_Meta_Efectivo: (Sub) => Sub.Aporte_Meta,
    Planes_Avance_Real_Objetivo_En_Periodo: () => 0,
    Planes_Carga_Trabajo_Objetivo: () => ({
      Calculable: true,
      Total: 10000,
      Realizado: 1000,
      Pendiente: 9000,
      Unidad: "páginas"
    }),
    Planes_Progreso_Total_Objetivo_Efectivo: () => 5
  };
  Cargar_Funciones(Contexto, [
    "Planes_Metrica_Progreso",
    "Planes_Aporte_Cumplido_Para_Resumen",
    "Planes_Resumen_Progreso_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Resumen_Progreso_Objetivo({
    Id: "Meta",
    __Objetivo_Canonico_Id: "Meta",
    Target_Total: 7.5
  });
  assert.equal(Resultado.Global.Porcentaje, 12.5);
  assert.ok(Math.abs(Resultado.Cuota.Porcentaje - 66.6666667) < 0.0001);
  assert.equal(Resultado.Compromiso.Porcentaje, 50);
  assert.equal(Resultado.Trabajo.Porcentaje, 10);
  assert.equal(Resultado.Compromiso.Pendiente, 5);
  assert.equal(Resultado.Trabajo.Pendiente, 9000);
});

test("no cuenta como compromiso las divisiones internas anidadas", () => {
  const Raiz = { Id: "Resultado", Hecha: true, Aporte_Meta: 1 };
  const Parte = { Id: "Parte", Hecha: true, Aporte_Meta: 0 };
  const Subs = [Raiz, Parte];
  const Modelo = { Objetivos: {}, Periodos: {} };
  const Contexto = {
    Asegurar_Modelo_Planes: () => Modelo,
    Planes_Objetivo_Canonico_Contextual: (Objetivo) => Objetivo,
    Planes_Periodo_Contexto_Objetivo: () => null,
    Planes_Subobjetivos_Contexto_Objetivo: () => ({
      Items: Subs,
      Items_Por_Id: new Map([
        [Raiz.Id, { Sub: Raiz, Padre_Id: "" }],
        [Parte.Id, { Sub: Parte, Padre_Id: Raiz.Id }]
      ])
    }),
    Planes_Target_Suma_Componentes_Activo: (Sub) => Sub.Id === Raiz.Id,
    Planes_Estado_Normalizado_Subobjetivo: () => "Cumplido",
    Planes_Aporte_Meta_Efectivo: (Sub) => Sub.Aporte_Meta,
    Planes_Avance_Real_Objetivo_En_Periodo: () => 0,
    Planes_Carga_Trabajo_Objetivo: () => ({ Calculable: false }),
    Planes_Progreso_Total_Objetivo_Efectivo: () => 1
  };
  Cargar_Funciones(Contexto, [
    "Planes_Metrica_Progreso",
    "Planes_Aporte_Cumplido_Para_Resumen",
    "Planes_Resumen_Progreso_Objetivo"
  ]);
  const Resultado = Contexto.Planes_Resumen_Progreso_Objetivo({
    Id: "Meta",
    Target_Total: 1
  });
  assert.equal(Resultado.Compromisos.length, 1);
  assert.equal(Resultado.Cumplidos.length, 1);
  assert.equal(Resultado.Compromiso.Porcentaje, 100);
});

test("muestra el exceso real y limita solamente la barra visual", () => {
  const Contexto = {};
  Cargar_Funciones(Contexto, ["Planes_Metrica_Progreso"]);
  const Resultado = Contexto.Planes_Metrica_Progreso(125, 100);
  assert.equal(Resultado.Porcentaje, 125);
  assert.equal(Resultado.Barra, 100);
  assert.equal(Resultado.Pendiente, 0);
});

test("un exceso interno no compensa otro resultado pendiente", () => {
  const Contexto = {
    Asegurar_Modelo_Planes: () => ({}),
    Planes_Estado_Normalizado_Subobjetivo: () => "Cumplido",
    Planes_Aporte_Meta_Efectivo: () => 150
  };
  Cargar_Funciones(Contexto, [
    "Planes_Aporte_Cumplido_Para_Resumen"
  ]);
  const Resultado = Contexto.Planes_Aporte_Cumplido_Para_Resumen({
    Hecha: true,
    Aporte_Meta_Automatico: true,
    Target_Total: 100
  });
  assert.equal(Resultado, 100);
});

test("la fecha real no reemplaza el período comprometido", () => {
  const Contexto = {
    Planes_Normalizar_Fecha_Comparacion: (Fecha) => Fecha,
    Planes_Rango_Item_Fechado: () => ({
      Inicio: "2026-06-15",
      Fin: "2026-06-15"
    })
  };
  Cargar_Funciones(Contexto, ["Planes_Rango_Planeado_Item"]);
  const Resultado = Contexto.Planes_Rango_Planeado_Item({
    Fecha_Objetivo: "2026-09-30",
    Fecha_Fin: "2026-06-15"
  });
  assert.equal(Resultado.Inicio, "2026-09-30");
  assert.equal(Resultado.Fin, "2026-09-30");
});
