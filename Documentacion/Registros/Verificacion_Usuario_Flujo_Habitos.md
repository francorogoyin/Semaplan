# Verificacion de usuario del flujo de habitos

Este checklist sirve para revisar manualmente cada pantalla del flujo.
La numeracion coincide con el inventario de modales usado en la
revision. Marcar cada item despues de comprobarlo en la interfaz.

## Datos base sugeridos

- Habito de prueba: `Lectura diaria`, emoji de libro, color verde,
  tipo `Hacer`, modo `Cantidad`, regla `Al menos`, meta `20 paginas`.
- Habito de evitar: `No redes de noche`, emoji de bloqueo, color rojo,
  tipo `Evitar`, periodo `Por dia`, maximo permitido `0` o `1`.
- Objetivo semanal: `Leer ensayo`, con subobjetivos y al menos una
  parte vinculada a un habito.
- Slot de prueba: un slot vacio futuro y un slot muerto futuro.

## 1 - Panel de habitos

- [ ] Abrir el panel desde el menu y verificar que la cabecera muestre
  el simbolo de habitos, no una letra generica.
- [ ] Crear al menos dos habitos y verificar que las tarjetas muestren
  emoji, nombre, meta, programacion, tipo y cantidad de vinculos.
- [ ] Probar filtros de dia, hora y estado; confirmar que la lista se
  actualiza sin cerrar el panel.
- [ ] Aplicar una combinacion de filtros sin resultados y verificar que
  el mensaje vacio ocupa todo el ancho.
- [ ] Abrir una tarjeta y entrar a editar; confirmar que vuelve al panel
  al guardar o cancelar.

## 2 - Nuevo / editar habito

- [ ] Crear un habito con nombre, emoji, color, tipo `Hacer` y activo.
  Guardar y verificar que esos datos aparecen iguales en la tarjeta.
- [ ] Editar el habito y cambiar nombre, emoji y color; guardar y
  confirmar que los cambios persisten al cerrar y reabrir el panel.
- [ ] Pasar el mouse por los labels principales y verificar que cada
  tooltip explique el campo correspondiente.
- [ ] Probar modo `Check`; confirmar que no aparece campo `Meta` ni
  unidad.
- [ ] Probar modo `Tiempo`; confirmar que aparece meta mas unidad
  `Minutos`/`Horas`, y que se guarda la unidad elegida.
- [ ] Probar modo `Cantidad`; confirmar que aparece unidad de texto
  personalizada y que se guarda junto con la meta.
- [ ] Probar regla `Entre`; confirmar que aparece el campo `Maximo` y
  que desaparece al elegir otra regla.
- [ ] Probar tipo `Evitar`; confirmar que la meta se comporta como
  maximo permitido y no muestra controles innecesarios.
- [ ] Probar dias `Todos`, `Rango especifico` y `Personalizado`;
  verificar que solo aparecen los campos condicionales esperados.
- [ ] Probar horas `Todos`, `Rango especifico`, `Puntual` y
  `Personalizado`; verificar que cada opcion muestra su control propio.
- [ ] Guardar, recargar la app y confirmar que el habito mantiene
  nombre, emoji, color, tipo, activo, meta, unidad, dias y horas.

## 3 - Registro de habitos

- [ ] Generar avance desde un bloque, slot o plan y abrir `Registro`.
- [ ] Verificar fecha, hora, habito, avance, procedencia y origen.
- [ ] Editar la cantidad de un registro y confirmar que cambia en la
  tabla y en el progreso del habito.
- [ ] Eliminar un registro y verificar que desaparece y recalcula el
  progreso.

## 4 - Vinculaciones de habitos

- [ ] Crear vinculos desde objetivo, subobjetivo, parte, evento y slot
  cuando sea posible.
- [ ] Abrir `Vinculaciones` y verificar que cada habito agrupa sus
  fuentes correctamente.
- [ ] Confirmar que los nombres de fuentes se entienden y no aparecen
  ids tecnicos salvo que falte el objeto.

## 5 - Habitos del bloque

- [ ] Abrir un bloque del calendario y entrar a `Habitos del bloque`.
- [ ] Agregar un habito al bloque y guardar.
- [ ] Reabrir el bloque y confirmar que el vinculo sigue visible.
- [ ] Marcar el bloque como hecho y verificar que se registra avance del
  habito vinculado.

## 6 - Plan de tarea / abordaje de bloque semanal

- [ ] Abrir una tarea futura y entrar al modal de abordaje.
- [ ] Agregar items, subobjetivos y habitos vinculados.
- [ ] Guardar, reabrir y verificar que el plan conserva orden, textos y
  estados.
- [ ] Marcar items como hechos y confirmar impacto en habitos y metas
  vinculadas.

## 7 - Plan de slot vacio o slot muerto

- [ ] Abrir un slot vacio futuro y crear un plan con items.
- [ ] Agregar un item de habito y guardar.
- [ ] Reabrir el slot y confirmar que los items y habitos siguen.
- [ ] Repetir sobre un slot muerto futuro y verificar el mismo flujo.

## 8 - Nuevo / editar patron semanal o patron de slots

- [ ] Crear un patron con nombre, emoji, tipo y franjas.
- [ ] Agregar franjas bloqueadas y franjas con objetivo.
- [ ] Guardar y aplicar el patron a la semana.
- [ ] Editar el patron y confirmar que cambios de horario, tipo y
  objetivo se reflejan al reaplicar.

## 9 - Resumen semanal

- [ ] Abrir el resumen semanal con habitos y bloques cargados.
- [ ] Cambiar filtros disponibles y confirmar que el resumen se
  actualiza.
- [ ] Verificar que slots muertos, vacios, tareas y objetivos semanales
  se leen sin solapamientos visuales.

## 10 - Modal central de objetivo semanal

- [ ] Abrir un objetivo semanal desde la semana.
- [ ] Verificar nombre, emoji, color, progreso, subobjetivos y acciones.
- [ ] Editar datos del objetivo y confirmar que se reflejan en la semana.
- [ ] Probar cerrar el modal con `Esc`, cruz y click permitido.

## 11 - Plan de la semana

- [ ] Abrir `Plan de la semana` y verificar secciones de semana,
  cierre e historial cuando correspondan.
- [ ] Confirmar que los objetivos visibles coinciden con la semana
  actual.
- [ ] Navegar semanas y verificar que el contenido cambia sin mezclar
  datos.

## 12 - Cerrar semana

- [ ] Abrir cierre de semana con objetivos pendientes y realizados.
- [ ] Verificar totales, pendientes y acciones sugeridas.
- [ ] Ejecutar un cierre de prueba y confirmar que el historial refleja
  la semana cerrada.

## 13 - Historial de planes

- [ ] Abrir historial y revisar semanas cerradas.
- [ ] Verificar que cada entrada muestra fecha, resumen y objetivos
  principales.
- [ ] Abrir una semana del historial y confirmar que no modifica la
  semana actual.

## 14 - Metas / Plan principal

- [ ] Abrir Plan y revisar que filtros de anio, tipo, subperiodo,
  estado y etiqueta funcionen.
- [ ] Crear un objetivo desde la pantalla principal y confirmar que
  aparece en la capa correcta.
- [ ] Cambiar vista de tarjetas/lista/biblioteca y verificar que los
  datos visibles se mantienen.

## 15 - Como pensar las metas

- [ ] Abrir ayuda conceptual desde Plan.
- [ ] Verificar que el contenido se lee completo en desktop y mobile.
- [ ] Cerrar con cruz, `Esc` y backdrop si corresponde.

## 16 - Configuracion de Plan

- [ ] Abrir configuracion y cambiar rango de anios visibles.
- [ ] Guardar y verificar que el selector de anio respeta el rango.
- [ ] Activar/desactivar capas visibles y confirmar que queda al menos
  una disponible.

## 17 - Nuevo / editar objetivo de Plan

- [ ] Crear objetivo con emoji, nombre, valor objetivo, unidad, fechas,
  descripcion y etiquetas.
- [ ] Agregar vinculo con un habito y guardar.
- [ ] Reabrir el objetivo y verificar que todos los datos persisten.
- [ ] Editar el objetivo y confirmar que el cambio recalcula progreso si
  corresponde.

## 18 - Redistribucion de objetivo

- [ ] Abrir redistribucion desde un objetivo con metrica.
- [ ] Probar granularidad y modo equitativo, deuda y manual.
- [ ] Fijar y anular periodos; verificar que los valores recalculan.
- [ ] Guardar y comprobar que el resumen de redistribucion se actualiza.

## 19 - Ajustar valores por periodos

- [ ] Abrir ajuste de valores por periodos.
- [ ] Cambiar valor padre y valores hijos.
- [ ] Usar redistribuir y verificar que respeta periodos fijados.
- [ ] Guardar y confirmar que los objetivos de periodos hijos cambian.

## 20 - Subobjetivos de un objetivo

- [ ] Abrir subobjetivos de un objetivo.
- [ ] Probar filtros de estado, periodo, metadato, vista y orden.
- [ ] Agregar un subobjetivo desde el boton superior.
- [ ] Verificar que el resumen de aportes se actualiza.

## 21 - Nuevo / editar subobjetivo

- [ ] Crear subobjetivo con emoji, texto, unidad, aporte, fechas y
  metadatos.
- [ ] Agregar vinculo con habito.
- [ ] Guardar y verificar que aparece en el listado del objetivo.
- [ ] Marcarlo realizado y confirmar impacto en avance y habitos.

## 22 - Partes de un subobjetivo

- [ ] Abrir partes desde un subobjetivo.
- [ ] Probar filtros y orden.
- [ ] Agregar parte y verificar que aparece en la lista.
- [ ] Confirmar que el resumen de partes refleja pendientes y realizadas.

## 23 - Nueva / editar parte

- [ ] Crear parte con emoji, nombre, unidad, aporte total, avance
  parcial, fechas y estado.
- [ ] Agregar vinculo con habito.
- [ ] Guardar y reabrir para verificar persistencia.
- [ ] Cambiar estado a realizada y confirmar impacto en progreso.

## 24 - Importar partes de la meta

- [ ] Abrir importar partes desde una meta con partes disponibles.
- [ ] Seleccionar una o varias partes.
- [ ] Confirmar importacion y verificar que aparecen como subobjetivos o
  partes vinculadas segun el flujo.
- [ ] Repetir sin seleccionar nada y verificar que no genera cambios.

## 25 - Registrar avance

- [ ] Abrir registrar avance.
- [ ] Elegir objetivo o subobjetivo, cantidad, fecha y hora.
- [ ] Guardar y confirmar que el avance se refleja en tarjetas y
  registros.
- [ ] Probar `Realizado hasta el final` y verificar que calcula la
  cantidad esperada.

## 26 - Registro de avances

- [ ] Abrir registro de avances de un objetivo.
- [ ] Verificar fecha, hora, cantidad, origen y total acumulado.
- [ ] Editar un avance y confirmar recalculo.
- [ ] Eliminar un avance y confirmar que desaparece y recalcula.

## 27 - Objetivos vencidos

- [ ] Abrir objetivos vencidos con al menos un objetivo atrasado.
- [ ] Seleccionar objetivos y probar mover al actual.
- [ ] Repetir con clonar al actual.
- [ ] Confirmar que el objetivo original y el nuevo quedan en el estado
  correcto.

## 28 - Gestionar etiquetas del Plan

- [ ] Crear etiqueta nueva.
- [ ] Asignarla a un objetivo y confirmar que aparece en filtros.
- [ ] Editar o eliminar etiqueta y verificar que el cambio no deja
  etiquetas rotas.

## 29 - Metas simples / legacy

- [ ] Abrir Metas simples si la pantalla sigue disponible.
- [ ] Crear meta simple con nombre, horas objetivo, periodo y fuente.
- [ ] Verificar que aparece en lista y que los filtros funcionan.
- [ ] Editar, archivar y borrar una meta simple.

## 30 - Nueva / editar meta simple

- [ ] Crear meta simple semanal.
- [ ] Crear meta simple mensual.
- [ ] Crear meta simple personalizada con fechas desde/hasta.
- [ ] Verificar fuentes por categoria, etiqueta y objetivo.
- [ ] Guardar, reabrir y confirmar que todos los campos persisten.
