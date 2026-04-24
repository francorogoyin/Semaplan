# Casos de uso del flujo de habitos.

Este documento lista casos de uso compuestos para auditar el flujo de
habitos completo. La idea no es probar controles aislados, sino
escenarios humanos donde un usuario quiere crear un habito, vincularlo,
usarlo y verificar sus consecuencias en panel, bloques, slots, metas,
subobjetivos, partes, avances, resumen e historial.

Los primeros casos son comunes. Los ultimos son deliberadamente
especificos y exigentes.

## Criterio de ejecucion.

Cada caso debe ejecutarse con navegador y cuenta de prueba. Cuando el
caso cree datos reales, debe comprobar persistencia con recarga y luego
limpiar los datos QA creados.

En cada caso se deben mirar tres cosas.

- Si el usuario entiende que esta configurando.
- Si el resultado aparece en todos los lugares donde corresponde.
- Si editar, cancelar, recargar o borrar deja el sistema coherente.

## 1. Lectura diaria de dias de semana.

Intencion: quiero leer 5 paginas por dia de lunes a viernes y vincular
ese habito a tres subobjetivos de lectura.

Configuracion esperada: habito `Lectura diaria`, tipo `Hacer`, modo
`Cantidad`, regla `Al menos`, periodo `Dia`, meta `5`, unidad
`paginas`, dias personalizados de lunes a viernes y horas `Todos`.

Verificaciones.

- [ ] Crear el habito y verificar nombre, emoji, color, unidad y meta en
  el panel.
- [ ] Vincular el habito a tres subobjetivos distintos con cantidad fija
  de 5 paginas.
- [ ] Verificar que la pantalla de vinculaciones agrupe los tres
  subobjetivos bajo el mismo habito.
- [ ] Registrar 3 paginas manualmente y verificar progreso parcial.
- [ ] Registrar 2 paginas mas y verificar cumplimiento del dia.
- [ ] Confirmar que sabado y domingo el habito no aparece como
  disponible.
- [ ] Recargar y confirmar persistencia de habito, vinculos y registros.

## 2. Meditacion diaria por tiempo.

Intencion: quiero meditar 15 minutos todos los dias y que el avance se
mida como tiempo, no como cantidad generica.

Configuracion esperada: habito `Meditacion`, tipo `Hacer`, modo
`Tiempo`, regla `Al menos`, periodo `Dia`, meta `15`, unidad
`Minutos`, dias `Todos` y horas `Todos`.

Verificaciones.

- [ ] Crear el habito y confirmar que aparece la unidad de tiempo.
- [ ] Vincularlo a un slot vacio de 15 minutos o 1 hora y revisar si la
  duracion se interpreta correctamente.
- [ ] Agregarlo a un plan de bloque y marcar el item como hecho.
- [ ] Verificar que el registro generado usa minutos o una conversion
  clara.
- [ ] Verificar el progreso diario en panel y registros.
- [ ] Probar mobile creando o marcando el avance desde el modal.
- [ ] Recargar y confirmar persistencia.

## 3. Entrenamiento semanal.

Intencion: quiero entrenar 3 veces por semana y que cuente durante toda
la semana, sin reiniciarse cada dia.

Configuracion esperada: habito `Entrenamiento`, tipo `Hacer`, modo
`Check`, periodo `Semana`, meta conceptual de 3 ocurrencias si el modo
actual lo soporta o alternativa clara si no lo soporta.

Verificaciones.

- [ ] Intentar configurar 3 veces por semana y verificar si la UI lo
  permite de forma clara.
- [ ] Si el modo `Check` no permite cantidad semanal, registrar el
  hallazgo como limitacion de producto.
- [ ] Vincular el habito a tres bloques de la semana.
- [ ] Marcar un bloque como hecho y verificar progreso semanal parcial.
- [ ] Marcar los tres bloques y verificar cumplimiento semanal.
- [ ] Recargar y confirmar que el progreso semanal se conserva.
- [ ] Revisar resumen semanal.

## 4. Agua diaria con avances parciales.

Intencion: quiero tomar 8 vasos de agua por dia y registrar avances
parciales varias veces.

Configuracion esperada: habito `Agua`, tipo `Hacer`, modo `Cantidad`,
regla `Al menos`, periodo `Dia`, meta `8`, unidad `vasos`, dias
`Todos`.

Verificaciones.

- [ ] Crear el habito y revisar que el panel muestre `0/8 vasos`.
- [ ] Registrar 2 vasos a la manana.
- [ ] Registrar 3 vasos a la tarde.
- [ ] Registrar 3 vasos a la noche.
- [ ] Confirmar suma acumulada y estado cumplido.
- [ ] Editar el segundo registro de 3 a 2 y confirmar recalculo.
- [ ] Borrar un registro y confirmar recalculo.
- [ ] Recargar y confirmar persistencia.

## 5. Cafe como limite diario.

Intencion: quiero tomar como maximo 2 cafes por dia y que pasarme sea
una alerta, no un exito.

Configuracion esperada: habito `Cafe`, tipo `Limite`, modo `Cantidad`,
regla `Como maximo`, periodo `Dia`, meta `2`, unidad `cafes`.

Verificaciones.

- [ ] Crear el habito y revisar si la palabra `Limite` se entiende.
- [ ] Registrar 1 cafe y verificar estado correcto.
- [ ] Registrar 2 cafes y verificar que sigue dentro del limite.
- [ ] Registrar 3 cafes y verificar alerta o incumplimiento.
- [ ] Verificar que el resumen semanal no lo presenta como objetivo
  positivo completado.
- [ ] Editar el limite a 1 y verificar recalculo.
- [ ] Recargar y confirmar persistencia.

## 6. Evitar redes de noche.

Intencion: quiero evitar redes sociales despues de las 22:00 y registrar
cuando rompo el habito.

Configuracion esperada: habito `No redes de noche`, tipo `Evitar`,
periodo `Dia`, horario personalizado o rango nocturno y maximo permitido
`0` o `1`, segun lo que soporte la app.

Verificaciones.

- [ ] Crear el habito y revisar que el formulario de `Evitar` no parezca
  un objetivo positivo.
- [ ] Configurar disponibilidad nocturna.
- [ ] Verificar que el habito no aparece durante la manana.
- [ ] Registrar una caida y verificar que se ve como alerta.
- [ ] Revisar panel, registros y resumen semanal.
- [ ] Recargar y confirmar persistencia.
- [ ] Evaluar si un usuario nuevo entiende que debe registrar fallas y
  no cumplimientos.

## 7. Medicacion exacta.

Intencion: quiero tomar medicacion exactamente 2 veces por dia y que
tomar 1 o 3 quede mal.

Configuracion esperada: habito `Medicacion`, tipo `Hacer`, modo
`Cantidad`, regla `Exactamente`, periodo `Dia`, meta `2`, unidad
`tomas`, horas puntuales `09:00` y `21:00`.

Verificaciones.

- [ ] Crear el habito con dos horas puntuales.
- [ ] Confirmar que aparece como disponible en esas horas.
- [ ] Registrar 1 toma y verificar progreso incompleto.
- [ ] Registrar 2 tomas y verificar cumplimiento exacto.
- [ ] Registrar 3 tomas y verificar exceso.
- [ ] Revisar si el panel explica la diferencia entre incompleto,
  cumplido y excedido.
- [ ] Recargar y confirmar persistencia.

## 8. Escritura semanal con subobjetivos.

Intencion: quiero escribir 1.000 palabras por semana y repartirlo entre
subobjetivos de un proyecto.

Configuracion esperada: habito `Escritura`, tipo `Hacer`, modo
`Cantidad`, regla `Al menos`, periodo `Semana`, meta `1000`, unidad
`palabras`.

Verificaciones.

- [ ] Crear un objetivo semanal de escritura.
- [ ] Crear tres subobjetivos vinculados al habito con aportes
  parciales.
- [ ] Registrar avances desde un subobjetivo.
- [ ] Registrar avances manuales adicionales.
- [ ] Verificar suma semanal acumulada.
- [ ] Verificar que no se reinicia al dia siguiente dentro de la misma
  semana.
- [ ] Cerrar la semana y revisar historial.

## 9. Idioma de lunes a viernes.

Intencion: quiero estudiar ingles 30 minutos de lunes a viernes y que no
me moleste el fin de semana.

Configuracion esperada: habito `Ingles`, modo `Tiempo`, regla `Al
menos`, periodo `Dia`, meta `30`, unidad `Minutos`, dias lunes a
viernes.

Verificaciones.

- [ ] Crear el habito y verificar disponibilidad por dia.
- [ ] Vincularlo a un bloque recurrente de estudio si existe un bloque
  de prueba.
- [ ] Registrar avance desde el bloque.
- [ ] Ir a sabado y confirmar que no aparece como pendiente.
- [ ] Revisar resumen semanal para ver acumulado de lunes a viernes.
- [ ] Recargar y confirmar persistencia.

## 10. Caminata con rango saludable.

Intencion: quiero caminar entre 30 y 60 minutos por dia, porque menos es
poco y mucho no hace falta.

Configuracion esperada: habito `Caminata`, modo `Tiempo`, regla
`Entre`, periodo `Dia`, meta minima `30`, meta maxima `60`, unidad
`Minutos`.

Verificaciones.

- [ ] Crear el habito y verificar que aparecen minimo y maximo.
- [ ] Registrar 20 minutos y verificar incompleto.
- [ ] Registrar 40 minutos y verificar correcto.
- [ ] Registrar 75 minutos y verificar exceso o estado especial.
- [ ] Revisar si el texto `Entre` explica bien el resultado.
- [ ] Recargar y confirmar persistencia.

## 11. Orden de rutina matinal.

Intencion: quiero una rutina matinal con tres habitos en orden:
levantarse, agua y lectura.

Configuracion esperada: tres habitos activos, un slot de manana y un
patron de slot con esos tres items.

Verificaciones.

- [ ] Crear tres habitos simples.
- [ ] Crear un patron de slot `Rutina matinal`.
- [ ] Insertar los tres habitos como items del patron.
- [ ] Aplicar el patron a un slot vacio de la manana.
- [ ] Reordenar items y guardar.
- [ ] Marcar items como hechos y verificar avances.
- [ ] Recargar y confirmar orden, estados y registros.

## 12. Slot muerto de comida con habito.

Intencion: quiero que el slot muerto `Comida` tenga el habito de comer
sin pantalla y que se registre cuando completo la comida.

Configuracion esperada: habito `Comer sin pantalla`, tipo `Evitar` o
`Hacer` segun criterio, vinculado a plan de slot muerto `Comida`.

Verificaciones.

- [ ] Crear o usar un slot muerto de comida.
- [ ] Agregar el habito al plan del slot.
- [ ] Guardar, recargar y reabrir.
- [ ] Marcar el item como hecho o registrar cumplimiento.
- [ ] Verificar si `Evitar` sirve para esta intencion o si conviene
  formularlo como `Comer sin pantalla`.
- [ ] Revisar panel y registros.

## 13. Lectura dentro de partes.

Intencion: quiero que cada parte de un libro aporte al habito de lectura
cuando la marco como realizada.

Configuracion esperada: objetivo, subobjetivo con partes, habito
`Lectura`, vinculos por parte con cantidad de paginas.

Verificaciones.

- [ ] Crear objetivo y subobjetivo de lectura.
- [ ] Crear tres partes con paginas distintas.
- [ ] Vincular cada parte al habito con cantidad propia.
- [ ] Marcar una parte como realizada.
- [ ] Verificar registro generado con cantidad correcta.
- [ ] Marcar otra parte y verificar acumulado.
- [ ] Desmarcar o editar una parte si la UI lo permite y revisar
  recalculo.
- [ ] Recargar y confirmar persistencia.

## 14. Proyecto con habitos mixtos.

Intencion: quiero un proyecto semanal que combine lectura, escritura y
evitar distracciones.

Configuracion esperada: objetivo semanal con tres habitos vinculados:
uno de cantidad, uno de tiempo y uno de evitar.

Verificaciones.

- [ ] Crear objetivo semanal.
- [ ] Crear y vincular los tres habitos.
- [ ] Crear subobjetivos o partes que usen dos de esos habitos.
- [ ] Crear un plan de bloque que use el tercero.
- [ ] Registrar avances desde fuentes distintas.
- [ ] Verificar que la pantalla de vinculaciones no mezcle origenes.
- [ ] Revisar resumen semanal.

## 15. Habito creado desde un objetivo.

Intencion: quiero estar editando un objetivo, darme cuenta de que falta
un habito, crearlo y volver al objetivo sin perder lo escrito.

Configuracion esperada: abrir editor de objetivo, crear habito desde
vinculos, volver al editor y guardar objetivo.

Verificaciones.

- [ ] Abrir objetivo nuevo o existente.
- [ ] Escribir campos del objetivo sin guardar todavia.
- [ ] Crear habito desde el vinculo.
- [ ] Volver al objetivo y verificar que los campos escritos siguen.
- [ ] Guardar objetivo.
- [ ] Recargar y confirmar objetivo y vinculo.

## 16. Habito creado desde una parte.

Intencion: quiero estar creando una parte y crear el habito relacionado
sin salir del flujo.

Configuracion esperada: editor de parte con accion para crear habito y
volver al mismo formulario.

Verificaciones.

- [ ] Abrir editor de parte.
- [ ] Completar nombre, cantidad y fechas.
- [ ] Crear habito desde la seccion de vinculos.
- [ ] Volver a la parte sin perder datos.
- [ ] Guardar parte y verificar vinculo.
- [ ] Recargar y confirmar persistencia.

## 17. Panel con muchos habitos.

Intencion: quiero tener 30 habitos y poder seguir encontrando los
importantes.

Configuracion esperada: crear o simular 30 habitos con tipos, colores,
metas y horarios distintos.

Verificaciones.

- [ ] Abrir panel desktop con 30 habitos.
- [ ] Abrir panel mobile con 30 habitos.
- [ ] Probar filtros por dia, hora y estado.
- [ ] Confirmar que el estado vacio ocupa el ancho correcto.
- [ ] Verificar que tarjetas largas no rompen la grilla.
- [ ] Editar un habito desde el medio de la lista y volver al panel.
- [ ] Recargar y confirmar persistencia.

## 18. Nombres largos y emojis raros.

Intencion: quiero usar nombres muy largos, emojis poco comunes y unidades
largas sin que la UI se rompa.

Configuracion esperada: habito con nombre largo, emoji compuesto, unidad
personalizada larga y color no default.

Verificaciones.

- [ ] Crear habito con nombre de mas de 80 caracteres.
- [ ] Usar unidad larga, por ejemplo `paginas tecnicas revisadas`.
- [ ] Revisar panel, editor, registros, vinculaciones y resumen.
- [ ] Probar mobile.
- [ ] Verificar que no haya texto pisado, cortado o botones deformados.
- [ ] Recargar y confirmar persistencia.

## 19. Dos habitos con el mismo nombre.

Intencion: quiero tener dos habitos llamados `Lectura`, uno diario y uno
semanal, y distinguirlos por emoji, color o contexto.

Configuracion esperada: dos habitos con mismo nombre y configuraciones
distintas.

Verificaciones.

- [ ] Crear ambos habitos.
- [ ] Verificar panel y selector de vinculos.
- [ ] Vincular cada uno a una fuente distinta.
- [ ] Registrar avances para ambos.
- [ ] Confirmar que registros y vinculaciones no se mezclan.
- [ ] Evaluar si la UI necesita mostrar mas contexto en selectores.

## 20. Cambio de modo con registros previos.

Intencion: quiero cambiar un habito de `Cantidad` a `Check` despues de
haber registrado avances.

Configuracion esperada: habito con registros de cantidad, luego cambio a
check.

Verificaciones.

- [ ] Crear habito de cantidad y registrar avances.
- [ ] Cambiar modo a `Check`.
- [ ] Verificar si la app avisa consecuencias.
- [ ] Confirmar que campos ocultos no siguen afectando la evaluacion.
- [ ] Revisar registros historicos.
- [ ] Recargar y confirmar coherencia.
- [ ] Decidir si hace falta bloqueo o advertencia de producto.

## 21. Cambio de unidad con registros previos.

Intencion: quiero cambiar la unidad de `paginas` a `capitulos` despues
de usar el habito.

Configuracion esperada: habito de cantidad con registros previos y
cambio de unidad.

Verificaciones.

- [ ] Crear habito y registrar avances en paginas.
- [ ] Cambiar unidad a capitulos.
- [ ] Revisar si los registros viejos quedan claros.
- [ ] Verificar resumen y panel.
- [ ] Evaluar si la app deberia advertir que cambia el significado.
- [ ] Recargar y confirmar persistencia.

## 22. Borrado de habito sin vinculos.

Intencion: quiero borrar un habito simple que no uso mas.

Configuracion esperada: habito sin vinculos y con o sin registros
manuales.

Verificaciones.

- [ ] Crear habito sin vinculos.
- [ ] Registrar un avance.
- [ ] Borrar el habito.
- [ ] Confirmar si los registros se eliminan o quedan ocultos.
- [ ] Recargar y verificar que no queda basura visible.
- [ ] Revisar si el dialogo explica bien la consecuencia.

## 23. Borrado de habito con muchos vinculos.

Intencion: quiero borrar un habito que esta vinculado a objetivos,
subobjetivos, partes, eventos y slots.

Configuracion esperada: habito con multiples referencias y registros.

Verificaciones.

- [ ] Crear habito con al menos cinco fuentes vinculadas.
- [ ] Intentar borrarlo.
- [ ] Elegir eliminar referencias y verificar limpieza.
- [ ] Repetir con otro habito y elegir convertir referencias si existe.
- [ ] Verificar que no quedan ids tecnicos en pantallas.
- [ ] Recargar y confirmar coherencia.

## 24. Desactivar sin borrar.

Intencion: quiero pausar un habito por un mes sin perder historial ni
vinculos.

Configuracion esperada: habito activo con vinculos y registros, luego
desactivado.

Verificaciones.

- [ ] Crear habito y vincularlo a una fuente.
- [ ] Registrar avances.
- [ ] Desactivarlo.
- [ ] Verificar que no aparece como sugerencia nueva.
- [ ] Verificar que sigue visible donde ya estaba vinculado, si
  corresponde.
- [ ] Revisar panel con filtro de activos e inactivos.
- [ ] Recargar y confirmar persistencia.

## 25. Patron reutilizable de foco.

Intencion: quiero guardar un slot de foco como patron y reutilizarlo con
tareas y habitos.

Configuracion esperada: slot con item manual, habito de tiempo y habito
check, guardado como patron de slot.

Verificaciones.

- [ ] Crear dos habitos.
- [ ] Crear plan de slot con item manual y ambos habitos.
- [ ] Guardar el slot como patron.
- [ ] Recargar y confirmar que el patron existe.
- [ ] Insertar el patron en otro slot.
- [ ] Confirmar que se copian items y no se vinculan accidentalmente al
  slot original.
- [ ] Marcar avances y verificar registros.

## 26. Patron no aplicable.

Intencion: quiero que un patron de comida no aparezca cuando estoy
planeando un slot vacio de trabajo, salvo que aplique a todos.

Configuracion esperada: patron de slot aplicable solo a `Comida` y otro
aplicable a `Slot vacio`.

Verificaciones.

- [ ] Crear patron de comida.
- [ ] Crear patron de slot vacio.
- [ ] Abrir slot muerto `Comida` e insertar patron.
- [ ] Verificar que aparece el patron de comida.
- [ ] Abrir slot vacio y verificar que no aparece el patron de comida.
- [ ] Evaluar si el dialogo explica por que hay pocos patrones.

## 27. Cierre de semana con habitos incompletos.

Intencion: quiero cerrar una semana y entender que paso con mis habitos
incompletos.

Configuracion esperada: semana con objetivos, bloques y habitos
parcialmente cumplidos.

Verificaciones.

- [ ] Crear habitos vinculados a bloques.
- [ ] Cumplir algunos y dejar otros pendientes.
- [ ] Abrir cierre de semana.
- [ ] Revisar si el cierre muestra suficiente informacion para decidir.
- [ ] Mover, descartar o mandar al baul un bloque pendiente.
- [ ] Confirmar cierre.
- [ ] Abrir historial y resumen.

## 28. Historial de semana cerrada.

Intencion: quiero mirar una semana cerrada y entender que habitos se
cumplieron sin modificar la semana actual.

Configuracion esperada: semana cerrada con registros de habitos y plan
base.

Verificaciones.

- [ ] Abrir historial de planes.
- [ ] Entrar al detalle de una semana cerrada.
- [ ] Verificar nota inicial, nota de cierre, plan base y estado.
- [ ] Confirmar que no aparecen acciones destructivas por accidente.
- [ ] Volver al historial.
- [ ] Confirmar que semana actual no cambia.

## 29. Resumen semanal con datos densos.

Intencion: quiero ver si mi semana fue buena cuando tengo muchos
habitos, objetivos, bloques y partes.

Configuracion esperada: al menos 10 habitos, 5 objetivos, registros
manuales y avances desde partes o slots.

Verificaciones.

- [ ] Abrir resumen semanal desktop.
- [ ] Abrir resumen semanal mobile.
- [ ] Cambiar filtros y orden.
- [ ] Verificar que nombres largos no rompen filas.
- [ ] Verificar si el resumen permite entender cumplimiento real.
- [ ] Revisar si los habitos de evitar o limite se leen distinto.

## 30. Mobile de punta a punta.

Intencion: quiero crear, vincular y registrar un habito usando solo
mobile.

Configuracion esperada: viewport mobile, habito simple y un vinculo con
subobjetivo o slot.

Verificaciones.

- [ ] Crear habito desde mobile.
- [ ] Vincularlo a una fuente desde mobile.
- [ ] Registrar avance desde mobile.
- [ ] Editar el avance.
- [ ] Revisar panel, registros y vinculaciones.
- [ ] Recargar en mobile y confirmar persistencia.
- [ ] Verificar que botones no quedan fuera de pantalla.

## 31. Usuario nuevo sin entender metas.

Intencion: quiero crear mi primer habito util sin saber que son metas,
subobjetivos, partes o slots.

Configuracion esperada: habito simple, sin vinculos.

Verificaciones.

- [ ] Entrar al panel de habitos sin leer documentacion.
- [ ] Crear un habito basico.
- [ ] Entender que significan tipo, modo, periodo, regla y meta.
- [ ] Guardar y registrar un avance.
- [ ] Verificar que el camino minimo no obliga a entender Plan.
- [ ] Anotar todos los terminos que puedan confundir a un usuario nuevo.

## 32. Usuario obsesivo con cancelar.

Intencion: quiero probar si puedo salir, cancelar o cerrar sin perder
datos de forma silenciosa.

Configuracion esperada: formularios de habito, vinculo, parte, slot y
patron con cambios sin guardar.

Verificaciones.

- [ ] Modificar un habito y cerrar con cruz.
- [ ] Modificar un habito y cancelar.
- [ ] Modificar un patron y cerrar.
- [ ] Modificar un slot con habito y cancelar.
- [ ] Verificar si hay advertencia cuando corresponde.
- [ ] Confirmar que guardar sin cambios no genera ruido.
- [ ] Recargar y verificar que solo persistio lo guardado.

## 33. Datos invalidos y bordes numericos.

Intencion: quiero ver que pasa con cero, negativos, decimales, maximos
menores que minimos y horas raras.

Configuracion esperada: habitos de cantidad, tiempo, rango y entre.

Verificaciones.

- [ ] Intentar meta `0`.
- [ ] Intentar meta negativa.
- [ ] Intentar decimal valido.
- [ ] Intentar regla `Entre` con maximo menor que minimo.
- [ ] Intentar hora personalizada mal escrita.
- [ ] Verificar mensajes de error, foco y recuperacion.
- [ ] Confirmar que no se guarda estado corrupto.

## 34. Disponibilidad que cruza medianoche.

Intencion: quiero un habito nocturno de 22:00 a 02:00 y necesito saber
si el sistema lo soporta.

Configuracion esperada: rango horario nocturno con cruce de dia.

Verificaciones.

- [ ] Intentar configurar desde 22:00 hasta 02:00.
- [ ] Verificar si la app lo permite, lo normaliza o lo bloquea.
- [ ] Confirmar disponibilidad a las 23:00.
- [ ] Confirmar disponibilidad a la 01:00.
- [ ] Confirmar comportamiento al cambiar de dia.
- [ ] Registrar hallazgo si el modelo no soporta rangos cruzados.

## 35. Importacion o restauracion con vinculos.

Intencion: quiero restaurar o importar datos y que los habitos vinculados
no queden rotos.

Configuracion esperada: estado con habitos, registros y vinculos a
objetivos, subobjetivos, partes y slots.

Verificaciones.

- [ ] Preparar datos con varios vinculos.
- [ ] Exportar o generar backup si el flujo lo permite.
- [ ] Restaurar o importar en entorno de prueba.
- [ ] Verificar que los ids de habitos resuelven a nombres humanos.
- [ ] Verificar registros y resumen.
- [ ] Confirmar que no aparecen referencias huerfanas.

## 36. Caso de maxima densidad.

Intencion: quiero simular un usuario pesado que usa todo a la vez y ver
si el flujo sigue siendo entendible.

Configuracion esperada: 30 habitos, 10 objetivos, subobjetivos con
partes, 20 registros, patrones de slot, slots muertos, semana cerrada e
historial.

Verificaciones.

- [ ] Abrir panel de habitos y filtrar.
- [ ] Abrir editor de un habito denso.
- [ ] Abrir vinculaciones.
- [ ] Abrir registros.
- [ ] Abrir resumen semanal.
- [ ] Abrir cierre e historial.
- [ ] Probar mobile.
- [ ] Anotar problemas de performance, scroll, textos, densidad,
  jerarquia visual y comprension.

## Cierre.

Cuando el usuario valide estos casos, conviene transformarlos en una
matriz de ejecucion con estado `Pendiente`, `Ejecutado`, `Falla`,
`Corregido` y `Reprobado`. Tambien conviene asignar prioridad para no
ejecutar primero los casos mas exoticos.
