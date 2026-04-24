# Protocolo de verificacion de usuario del flujo de habitos

Este documento define como auditar el flujo de habitos con navegador,
capturas y cuenta real. No es solo una lista de pantallas: es una guia
para probar la app como la usarian varios usuarios humanos, con
distintos niveles de exigencia visual, funcional y conceptual.

La auditoria debe ejecutarse en `Semaplan.com` con la cuenta
`tomashodel@gmail.com`, siguiendo las reglas operativas de Playwright
del repo. Si durante la auditoria aparecen errores corregibles, el
agente debe intentar corregirlos al terminar la pasada, sin pedir OK
previo, salvo que la correccion sea destructiva, ambigua o implique una
decision de producto no deducible.

## Objetivo

Detectar y corregir problemas del flujo de habitos desde tres miradas:

- Visual: incoherencias de UI, cortes, solapamientos, jerarquias raras,
  errores de texto, microcopy confuso, estados vacios pobres,
  responsive roto, modales incomodos.
- Funcional: crear, editar, guardar, cancelar, borrar, filtrar,
  vincular, registrar avances, recargar y comprobar persistencia.
- Humana: evaluar si una persona entiende que hacer, para que sirve
  cada control y si el resultado coincide con la intencion del usuario.

## Perfiles de revision

En cada pantalla, alternar mentalmente entre estos perfiles:

- Usuario apurado: quiere completar la accion sin leer demasiado.
- Usuario puntilloso visual: nota alineacion, cortes, espaciado,
  inconsistencias, estados hover y textos raros.
- Usuario nuevo: no conoce el dominio y necesita que los labels,
  tooltips y estados expliquen lo suficiente.
- Usuario avanzado: prueba combinaciones, atajos, recarga, cambios de
  estado y efectos cruzados.
- Usuario desconfiado: cancela, cierra, vuelve atras, guarda sin
  cambios, prueba datos invalidos y espera no perder informacion.

## Artefactos obligatorios

Cada ejecucion completa debe producir:

- Carpeta de screenshots:
  `Documentacion/Auditorias/Flujo_Habitos_YYYY_MM_DD/`
- Reporte de resultados:
  `Documentacion/Auditorias/Flujo_Habitos_YYYY_MM_DD/Reporte.md`
- Si se corrigen errores: cambios en codigo, pruebas ejecutadas,
  registro en `Documentacion/Registros/Registro_Avance.txt`, commit y
  push.

## Formato de hallazgo

Usar este formato en el reporte:

```md
### 2.VIS.03 - Campo visible fuera de contexto

Estado: Falla
Tipo: Visual / Funcional / UX / Texto / Persistencia
Pantalla: 2 - Nuevo / editar habito
Viewport: Desktop 1366x900
Screenshot: 02-editor-cantidad-entre-desktop.png
Pasos:
1. Abrir Habitos.
2. Crear habito.
3. Elegir modo Check.
Resultado observado:
El campo Maximo sigue visible.
Resultado esperado:
En modo Check no deben mostrarse Meta, Maximo ni Unidad.
Impacto:
El usuario cree que Check requiere configuracion numerica.
Severidad: P1
Accion:
Corregir visibilidad condicional y reprobar.
```

## Severidad

- P0: rompe el flujo, pierde datos o impide guardar.
- P1: impide entender o completar una accion principal.
- P2: error visual, funcional o conceptual molesto pero sorteable.
- P3: pulido, copy, alineacion, hover, consistencia menor.

## Viewports minimos

Probar como minimo:

- Desktop: 1366 x 900.
- Mobile: 390 x 844.

Cuando una pantalla sea densa o modal, agregar si hace falta:

- Desktop bajo: 1280 x 720.
- Mobile chico: 360 x 740.

## Flujo general de ejecucion

1. Verificar estado git y remoto antes de empezar.
2. Entrar a `Semaplan.com` con `tomashodel@gmail.com`.
3. Preparar datos de prueba controlados.
4. Ejecutar cada pantalla en desktop.
5. Sacar screenshot de cada estado relevante.
6. Repetir estados criticos en mobile.
7. Registrar hallazgos visuales, funcionales y de comprension.
8. Recargar despues de acciones persistentes y confirmar que los datos
   siguen.
9. Corregir errores encontrados que sean corregibles sin decision de
   producto.
10. Reprobar los errores corregidos.
11. Actualizar reporte, registro de avance, commit y push.

## Datos base sugeridos

- Habito de accion: `Lectura diaria`, emoji de libro, color verde,
  tipo `Hacer`, modo `Cantidad`, regla `Al menos`, meta `20 paginas`.
- Habito de tiempo: `Meditacion`, emoji tranquilo, color azul, tipo
  `Hacer`, modo `Tiempo`, meta `15 minutos`.
- Habito de evitar: `No redes de noche`, emoji de bloqueo, color rojo,
  tipo `Evitar`, periodo `Por dia`, maximo permitido `1`.
- Objetivo semanal: `Leer ensayo`, con subobjetivos y al menos una
  parte vinculada a un habito.
- Slot de prueba: un slot vacio futuro y un slot muerto futuro.

## Reglas visuales por pantalla

En cada pantalla sacar screenshot y revisar:

- No hay textos cortados, superpuestos, corruptos o sin traducir.
- Los botones principales se distinguen de acciones secundarias.
- Los controles condicionales aparecen solo cuando tienen sentido.
- Los estados vacios ocupan el espacio correcto y explican que hacer.
- La cruz de cierre y acciones de cancelar/guardar son consistentes.
- El scroll del modal no tapa acciones ni deja contenido inaccesible.
- Emoji, color, checkbox, selects e inputs usan patrones coherentes.
- Hover, disabled, activo, seleccionado y error se entienden.
- En mobile no hay columnas imposibles, botones cortados ni texto que
  rebalse.

## Reglas funcionales por pantalla

En cada pantalla probar, cuando aplique:

- Crear con datos minimos.
- Crear con datos completos.
- Editar un campo simple.
- Editar varios campos.
- Cancelar con cambios.
- Guardar sin cambios.
- Guardar con cambios.
- Cerrar con cruz, `Esc` y backdrop si corresponde.
- Borrar o desvincular.
- Recargar y comprobar persistencia.
- Probar datos invalidos.
- Verificar que el resultado aparezca en pantallas relacionadas.

## Matriz central de habitos

La pantalla 2 debe probar combinaciones cruzadas. No hace falta probar
el producto cartesiano completo si ya hay equivalencias, pero si cubrir
estas familias:

- Tipo: `Hacer`, `Evitar`, `Limite`.
- Modo: `Check`, `Cantidad`, `Tiempo`.
- Regla: `Al menos`, `Exactamente`, `Como maximo`, `Entre`.
- Periodo: `Por dia`, `Por semana`.
- Dias: `Todos`, `Rango especifico`, `Personalizado`.
- Horas: `Todos`, `Rango especifico`, `Puntual`, `Personalizado`.
- Estado: activo, inactivo.
- Vinculo: sin vinculo, objetivo, subobjetivo, parte, evento, slot.
- Fuente de avance: bloque hecho, slot, parte/subobjetivo, registro
  manual si existe.

## 1 - Panel de habitos

- [ ] Screenshot desktop con lista vacia.
- [ ] Screenshot desktop con varios habitos.
- [ ] Screenshot mobile con varios habitos.
- [ ] Verificar que cabecera, icono y acciones principales se entienden.
- [ ] Crear al menos dos habitos y verificar tarjeta: emoji, nombre,
  meta, programacion, tipo, estado y vinculos.
- [ ] Probar filtros de dia, hora y estado en combinaciones con y sin
  resultados.
- [ ] Verificar que el estado vacio ocupa el ancho correcto.
- [ ] Abrir tarjeta, editar, volver al panel y confirmar que no se
  pierde contexto.

## 2 - Nuevo / editar habito

- [ ] Screenshot desktop de modo `Check`.
- [ ] Screenshot desktop de modo `Cantidad` con regla `Entre`.
- [ ] Screenshot desktop de modo `Tiempo`.
- [ ] Screenshot desktop de tipo `Evitar`.
- [ ] Screenshot mobile de editor completo.
- [ ] Crear habito con nombre, emoji, color, tipo y activo; verificar
  tarjeta resultante.
- [ ] Editar nombre, emoji y color; guardar, cerrar, reabrir y recargar.
- [ ] Probar todos los tooltips principales y evaluar si explican lo
  suficiente para un usuario nuevo.
- [ ] Probar modo `Check`; confirmar que no aparecen meta, maximo ni
  unidad.
- [ ] Probar modo `Tiempo`; confirmar meta mas unidad `Minutos`/`Horas`.
- [ ] Probar modo `Cantidad`; confirmar unidad personalizada.
- [ ] Probar regla `Entre`; confirmar minimo y maximo.
- [ ] Probar tipo `Evitar`; confirmar que se lee como maximo permitido.
- [ ] Probar dias `Todos`, `Rango especifico`, `Personalizado`.
- [ ] Probar horas `Todos`, `Rango especifico`, `Puntual`,
  `Personalizado`.
- [ ] Guardar sin cambios y verificar que no genera ruido visual.
- [ ] Cancelar con cambios y verificar que no se pierden datos sin
  advertencia si corresponde.

## 3 - Registro de habitos

- [ ] Screenshot con registros.
- [ ] Screenshot sin registros.
- [ ] Generar avance desde bloque, slot o plan y verificar fecha, hora,
  habito, avance, procedencia y origen.
- [ ] Editar cantidad y confirmar recalculo de progreso.
- [ ] Eliminar registro y confirmar que desaparece y recalcula.
- [ ] Recargar y verificar persistencia.

## 4 - Vinculaciones de habitos

- [ ] Screenshot con habitos vinculados a varias fuentes.
- [ ] Screenshot sin vinculos.
- [ ] Crear vinculos desde objetivo, subobjetivo, parte, evento y slot.
- [ ] Verificar que cada habito agrupa fuentes correctamente.
- [ ] Evaluar si los nombres de origen son comprensibles para usuario
  humano y no ids tecnicos.

## 5 - Habitos del bloque

- [ ] Screenshot del modal con y sin vinculos.
- [ ] Agregar habito al bloque y guardar.
- [ ] Reabrir y confirmar persistencia.
- [ ] Marcar bloque como hecho y confirmar avance del habito.
- [ ] Desmarcar o anular bloque si aplica y confirmar recalculo.

## 6 - Plan de tarea / abordaje de bloque semanal

- [ ] Screenshot de bloque futuro.
- [ ] Screenshot de bloque pasado o vencido si existe.
- [ ] Agregar items, subobjetivos y habitos vinculados.
- [ ] Guardar, reabrir y verificar orden, textos, estados y vinculos.
- [ ] Marcar items como hechos y confirmar impacto en habitos y metas.

## 7 - Plan de slot vacio o slot muerto

- [ ] Screenshot de slot vacio con plan.
- [ ] Screenshot de slot muerto con plan.
- [ ] Crear item de tarea y item de habito.
- [ ] Guardar, reabrir y recargar.
- [ ] Verificar que completar items registra avance cuando corresponde.

## 8 - Nuevo / editar patron semanal o patron de slots

- [ ] Screenshot de patron nuevo.
- [ ] Screenshot de patron editado con varias franjas.
- [ ] Crear patron con nombre, emoji, tipo y franjas.
- [ ] Agregar franjas bloqueadas y franjas con objetivo.
- [ ] Guardar, aplicar a semana y verificar calendario.
- [ ] Editar y reaplicar para confirmar cambios.

## 9 - Resumen semanal

- [ ] Screenshot desktop.
- [ ] Screenshot mobile.
- [ ] Verificar que tareas, slots muertos, slots vacios, objetivos
  semanales y avances se leen sin solapamientos.
- [ ] Cambiar filtros y confirmar actualizacion.
- [ ] Evaluar si el resumen sirve para entender la semana.

## 10 - Modal central de objetivo semanal

- [ ] Screenshot con objetivo simple.
- [ ] Screenshot con subobjetivos.
- [ ] Verificar nombre, emoji, color, progreso, acciones y estados.
- [ ] Editar datos y confirmar reflejo en la semana.
- [ ] Cerrar con cruz, `Esc` y click permitido.

## 11 - Plan de la semana

- [ ] Screenshot de semana con objetivos.
- [ ] Screenshot de semana vacia o casi vacia.
- [ ] Confirmar que secciones visibles corresponden a semana actual.
- [ ] Navegar semanas y verificar que no se mezclan datos.
- [ ] Evaluar si un usuario entiende que hacer desde esta pantalla.

## 12 - Cerrar semana

- [ ] Screenshot con pendientes y realizados.
- [ ] Verificar totales, pendientes y acciones sugeridas.
- [ ] Ejecutar cierre de prueba si el estado lo permite.
- [ ] Confirmar que historial refleja la semana cerrada.

## 13 - Historial de planes

- [ ] Screenshot con semanas cerradas.
- [ ] Verificar fecha, resumen y objetivos principales.
- [ ] Abrir semana historica y confirmar que no modifica semana actual.

## 14 - Metas / Plan principal

- [ ] Screenshot desktop de Plan.
- [ ] Screenshot mobile de Plan.
- [ ] Probar filtros de anio, tipo, subperiodo, estado y etiqueta.
- [ ] Crear objetivo y verificar capa correcta.
- [ ] Cambiar vista tarjetas/lista/biblioteca y confirmar datos.

## 15 - Como pensar las metas

- [ ] Screenshot desktop.
- [ ] Screenshot mobile.
- [ ] Verificar legibilidad completa.
- [ ] Evaluar si ayuda a entender el modelo mental de metas.

## 16 - Configuracion de Plan

- [ ] Screenshot de configuracion.
- [ ] Cambiar rango de anios y guardar.
- [ ] Activar/desactivar capas visibles.
- [ ] Confirmar que queda al menos una capa disponible.

## 17 - Nuevo / editar objetivo de Plan

- [ ] Screenshot de objetivo nuevo.
- [ ] Screenshot de objetivo con vinculo de habito.
- [ ] Crear objetivo con emoji, nombre, valor, unidad, fechas,
  descripcion y etiquetas.
- [ ] Agregar vinculo con habito y guardar.
- [ ] Reabrir y confirmar persistencia.
- [ ] Editar y verificar recalculo de progreso.

## 18 - Redistribucion de objetivo

- [ ] Screenshot de redistribucion equitativa.
- [ ] Screenshot de modo manual con valores fijados.
- [ ] Probar granularidad y modos equitativo, deuda y manual.
- [ ] Fijar/anular periodos y confirmar recalculo.
- [ ] Guardar y verificar resumen.

## 19 - Ajustar valores por periodos

- [ ] Screenshot con periodos hijos.
- [ ] Cambiar valor padre e hijos.
- [ ] Redistribuir respetando fijados.
- [ ] Guardar y confirmar cambios en periodos hijos.

## 20 - Subobjetivos de un objetivo

- [ ] Screenshot en vista tarjetas.
- [ ] Screenshot en vista lista o biblioteca.
- [ ] Probar filtros de estado, periodo, metadato, vista y orden.
- [ ] Agregar subobjetivo y verificar resumen de aportes.

## 21 - Nuevo / editar subobjetivo

- [ ] Screenshot de formulario completo.
- [ ] Crear subobjetivo con emoji, texto, unidad, aporte, fechas y
  metadatos.
- [ ] Agregar vinculo con habito.
- [ ] Guardar y verificar listado.
- [ ] Marcar realizado y confirmar avance y habitos.

## 22 - Partes de un subobjetivo

- [ ] Screenshot con partes.
- [ ] Screenshot vacio.
- [ ] Probar filtros y orden.
- [ ] Agregar parte y verificar resumen.

## 23 - Nueva / editar parte

- [ ] Screenshot de formulario completo.
- [ ] Crear parte con emoji, nombre, unidad, aporte total, avance
  parcial, fechas y estado.
- [ ] Agregar vinculo con habito.
- [ ] Guardar, reabrir y verificar persistencia.
- [ ] Cambiar estado a realizada y confirmar impacto.

## 24 - Importar partes de la meta

- [ ] Screenshot con partes disponibles.
- [ ] Screenshot sin partes disponibles si se puede.
- [ ] Seleccionar una o varias partes e importar.
- [ ] Repetir sin seleccion y verificar que no genera cambios.

## 25 - Registrar avance

- [ ] Screenshot de formulario.
- [ ] Elegir objetivo o subobjetivo, cantidad, fecha y hora.
- [ ] Guardar y confirmar impacto en tarjetas y registros.
- [ ] Probar `Realizado hasta el final`.

## 26 - Registro de avances

- [ ] Screenshot con avances.
- [ ] Verificar fecha, hora, cantidad, origen y total acumulado.
- [ ] Editar avance y confirmar recalculo.
- [ ] Eliminar avance y confirmar recalculo.

## 27 - Objetivos vencidos

- [ ] Screenshot con vencidos.
- [ ] Seleccionar objetivos y probar mover al actual.
- [ ] Repetir con clonar al actual.
- [ ] Confirmar estado de original y nuevo.

## 28 - Gestionar etiquetas del Plan

- [ ] Screenshot de gestion de etiquetas.
- [ ] Crear etiqueta.
- [ ] Asignarla a objetivo y confirmar filtro.
- [ ] Editar o eliminar y verificar que no quedan etiquetas rotas.

## 29 - Metas simples / legacy

- [ ] Screenshot si la pantalla sigue disponible.
- [ ] Crear meta simple con nombre, horas, periodo y fuente.
- [ ] Verificar lista y filtros.
- [ ] Editar, archivar y borrar.

## 30 - Nueva / editar meta simple

- [ ] Screenshot de meta semanal.
- [ ] Screenshot de meta mensual.
- [ ] Screenshot de meta personalizada.
- [ ] Verificar fuentes por categoria, etiqueta y objetivo.
- [ ] Guardar, reabrir y confirmar persistencia.

## Cierre de auditoria

Al terminar una pasada:

1. Clasificar hallazgos por severidad.
2. Corregir automaticamente los problemas claros y acotados.
3. Reprobar los casos corregidos.
4. Dejar sin corregir solo decisiones de producto ambiguas o cambios
   peligrosos, explicando por que.
5. Actualizar el reporte de auditoria.
6. Registrar avance.
7. Commit y push de cada funcionalidad o tanda coherente.
