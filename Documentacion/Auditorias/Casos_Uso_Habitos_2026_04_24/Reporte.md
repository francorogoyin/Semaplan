# Auditoria de casos de uso de habitos

Fecha: 2026-04-24.
Cuenta: tomashodel@gmail.com.
Origen probado: http://127.0.0.1:4181.
Datos QA: QA Casos Habitos 1777007280380.

## Resumen

- Casos ejecutados: 36.
- OK: 17.
- Con observaciones: 16.
- Con fallas iniciales: 3. Fallas abiertas tras correccion: 0.
- Capturas: 14.
- Persistencia con recarga: FALLA inicial del arnes; reprueba focalizada OK.
- Limpieza final QA: OK.

## Reprueba posterior a correcciones.

Despues de corregir la logica de franjas horarias y la normalizacion de
la regla `Entre`, se reprobaron los bordes fallidos con datos QA nuevos.
La reprueba quedo OK y la limpieza final tambien quedo OK.

- [x] Caso 6: el rango nocturno 22:00 a 02:00 incluye las 23:00.
- [x] Caso 33: `Entre` ya no queda con maximo menor que minimo.
- [x] Caso 34: el rango 22:00 a 02:00 incluye las 23:00 y la 01:00,
  y excluye el mediodia.
- [x] Persistencia focalizada: habitos, objetivo, subobjetivo, parte,
  periodo y slot persistieron tras recargar.
- [x] Mobile: el boton flotante de metas sugeridas dejo de superponerse
  con el pie del modal de habitos.

Detalle: [Reprueba_Correcciones.md](Reprueba_Correcciones.md).

## Hallazgos transversales

- Patron de slot foco: 4 textos/controles con posible recorte.
- En mobile se detecto que el boton flotante de metas sugeridas quedaba
  encima del pie del modal de habitos; se corrigio bajando su capa por
  debajo de los overlays y se verifico con captura nueva.

## Casos

### 1. Lectura diaria de dias de semana - [OK]

Estado: OK.

Verificaciones:
- [x] El habito conserva nombre, emoji, color, unidad y meta.
- [x] Quedan tres subobjetivos vinculados al mismo habito.
- [x] El progreso manual 3+2 queda completo.
- [x] Sabado y domingo quedan fuera de disponibilidad.

Captura: [02_editor_habito_cantidad_desktop.png](capturas/02_editor_habito_cantidad_desktop.png).

### 2. Meditacion diaria por tiempo - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El modo tiempo conserva unidad minutos.
- [x] Un evento de 15 minutos registra 15 minutos.
- [x] El item de slot genera registro de tiempo al marcarse realizado.

Observaciones de usuario:
- En planes de slot se puede registrar un habito de tiempo, pero el selector de compatibilidad general prioriza eventos para tiempo; conviene revisar si eso es intencional.

### 3. Entrenamiento semanal - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El modo Check puede guardar una cantidad interna mayor a 1. La UI oculta meta en Check, por eso para usuario real conviene usar Cantidad/veces.
- [x] La alternativa cantidad/veces completa 3 ocurrencias semanales.
- [x] Los tres bloques semanales generan registros separados.

Observaciones de usuario:
- Para el usuario, `Check` semanal no expresa bien tres ocurrencias. La salida entendible hoy es `Cantidad + veces`.

### 4. Agua diaria con avances parciales - [OK]

Estado: OK.

Verificaciones:
- [x] El panel deberia poder mostrar 0/8 vasos antes de registrar.
- [x] Los registros parciales suman 8.
- [x] Editar un registro recalcula de 8 a 7.
- [x] Borrar un registro recalcula de 7 a 4.

Captura: [05_registros_habitos.png](capturas/05_registros_habitos.png).

### 5. Cafe como limite diario - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Limite 2 acepta 1 cafe como dentro del limite.
- [x] Limite 2 acepta 2 cafes como dentro del limite.
- [x] Limite 2 marca 3 cafes como incumplido.
- [x] Cambiar el limite a 1 recalcula como incumplido.

Observaciones de usuario:
- Como usuario puntilloso, ver un limite como `completo` con 0 o 1 consumos puede sentirse raro: semanticamente es `dentro del limite`, no `cumplido`.

### 6. Evitar redes de noche - [FALLA]

Estado: Falla.

Verificaciones:
- [x] El tipo Evitar fuerza regla como maximo.
- [x] La manana queda fuera del rango nocturno.
- [ ] Las 23:00 quedan dentro del rango nocturno.
- [x] Registrar una caida deja el habito dentro/fuera segun maximo permitido.

Observaciones de usuario:
- El modelo no permite meta 0: la normalizacion convierte 0 en 1. Para `evitar`, eso impide expresar `no tolero ninguna caida` sin una convencion rara.

Correccion posterior:
- [x] La disponibilidad nocturna que cruza medianoche fue corregida y
  reprobada.

Captura: [03_editor_habito_evitar_nocturno.png](capturas/03_editor_habito_evitar_nocturno.png).

### 7. Medicacion exacta - [OK]

Estado: OK.

Verificaciones:
- [x] Aparece en 09:00 y 21:00.
- [x] No aparece fuera de horas puntuales.
- [x] Una toma es incompleta.
- [x] Dos tomas cumple exacto.
- [x] Tres tomas queda excedido/incumplido.

### 8. Escritura semanal con subobjetivos - [OK]

Estado: OK.

Verificaciones:
- [x] Tres subobjetivos quedan vinculados.
- [x] La suma semanal acumula fuentes y manuales.
- [x] El progreso no se reinicia al dia siguiente dentro de la semana.

### 9. Idioma de lunes a viernes - [OK]

Estado: OK.

Verificaciones:
- [x] Disponible de lunes a viernes.
- [x] No molesta sabado.
- [x] El evento de 30 minutos registra avance.

### 10. Caminata con rango saludable - [OK]

Estado: OK.

Verificaciones:
- [x] La regla Entre conserva minimo y maximo.
- [x] 20 minutos queda incompleto.
- [x] 40 minutos queda correcto.
- [x] 75 minutos queda fuera del rango.

### 11. Orden de rutina matinal - [OK]

Estado: OK.

Verificaciones:
- [x] El patron contiene tres habitos.
- [x] Aplicar el patron al slot crea tres items independientes.
- [x] Reordenar y marcar registra avances.

Captura: [06_plan_de_slot_rutina.png](capturas/06_plan_de_slot_rutina.png).

### 12. Slot muerto de comida con habito - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El slot muerto Comida queda creado.
- [x] El plan del slot contiene el habito.
- [x] Marcarlo realizado registra cumplimiento.

Observaciones de usuario:
- Para esta intencion, `Hacer: comer sin pantalla` se entiende mejor que `Evitar: pantalla`, porque la accion positiva encaja mejor con completar una comida.

### 13. Lectura dentro de partes - [OK]

Estado: OK.

Verificaciones:
- [x] Cada parte conserva vinculo y cantidad propia.
- [x] Marcar dos partes suma 18 paginas.
- [x] Desmarcar una parte recalcula a 10 paginas.

### 14. Proyecto con habitos mixtos - [OK]

Estado: OK.

Verificaciones:
- [x] El objetivo mantiene tres vinculos mixtos.
- [x] El subobjetivo mantiene lectura y escritura sin mezclar foco.
- [x] El slot registra el tercer habito.

Captura: [04_vinculaciones_habitos.png](capturas/04_vinculaciones_habitos.png).

### 15. Habito creado desde un objetivo - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El objetivo conserva campos despues de agregar un vinculo.
- [x] El habito nuevo queda disponible en el sistema.

Observaciones de usuario:
- La persistencia de campos se valido sobre el modelo. Falta una pasada manual de microinteraccion si se quiere verificar perdida de foco/caracteres exactos en el formulario abierto.

### 16. Habito creado desde una parte - [OBS]

Estado: Observacion.

Verificaciones:
- [x] La parte conserva datos y vinculo.
- [x] El habito creado queda disponible.

Observaciones de usuario:
- Validacion de modelo correcta; el recorrido exacto de abrir parte, crear habito y volver al formulario necesita inspeccion visual/click puntual.

### 17. Panel con muchos habitos - [OK]

Estado: OK.

Verificaciones:
- [x] Hay al menos 30 habitos QA para probar densidad.
- [x] El filtro de disponibilidad puede dejar lista vacia sin romper modelo.
- [x] Editar un habito del medio conserva identidad.

Captura: [01_panel_habitos_desktop_denso.png](capturas/01_panel_habitos_desktop_denso.png).

### 18. Nombres largos y emojis raros - [OK]

Estado: OK.

Verificaciones:
- [x] El nombre largo se guarda completo.
- [x] La unidad larga se conserva.
- [x] El emoji compuesto no impide guardar.

Captura: [12_editor_habito_largo_mobile.png](capturas/12_editor_habito_largo_mobile.png).

### 19. Dos habitos con el mismo nombre - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Dos habitos con mismo nombre tienen ids distintos.
- [x] Registros no se mezclan.
- [x] Emoji/periodo permiten distinguirlos parcialmente.

Observaciones de usuario:
- En selectores, dos nombres iguales siguen necesitando mas contexto visible que solo nombre/emoji para evitar errores.

### 20. Cambio de modo con registros previos - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Los registros historicos quedan presentes.
- [x] El cambio a Check no borra progreso.
- [x] El progreso formateado no muestra unidad vieja.

Observaciones de usuario:
- No aparece una advertencia especifica antes de cambiar el significado de un habito usado. Para usuario cuidadoso, esto es riesgoso.

### 21. Cambio de unidad con registros previos - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El registro viejo conserva su unidad original.
- [x] El habito nuevo muestra la unidad actual.

Observaciones de usuario:
- Aunque el dato viejo conserva unidad, el usuario no recibe advertencia clara de cambio semantico.

### 22. Borrado de habito sin vinculos - [OK]

Estado: OK.

Verificaciones:
- [x] El habito desaparece.
- [x] Sus registros desaparecen.

### 23. Borrado de habito con muchos vinculos - [OK]

Estado: OK.

Verificaciones:
- [x] Eliminar referencias limpia objetivo/sub/parte/slot/patron.
- [x] Convertir referencias deja texto humano sin Habito_Id.

### 24. Desactivar sin borrar - [OK]

Estado: OK.

Verificaciones:
- [x] El habito inactivo no aparece como disponible nuevo.
- [x] El item ya vinculado sigue visible en su slot.
- [x] Los registros historicos siguen presentes.

### 25. Patron reutilizable de foco - [OK]

Estado: OK.

Verificaciones:
- [x] El patron existe luego de guardarlo.
- [x] Insertarlo en otro slot clona ids.
- [x] Marcar avances en copia genera registros.

Captura: [07_patron_de_slot_foco.png](capturas/07_patron_de_slot_foco.png).

### 26. Patron no aplicable - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El patron de comida aparece en slot Comida.
- [x] El patron de comida no aparece en slot vacio.
- [x] El patron de slot vacio aparece en slot vacio.

Observaciones de usuario:
- Cuando hay pocos patrones, el dialogo deberia explicar el filtro aplicado para que el usuario no piense que se perdieron.

### 27. Cierre de semana con habitos incompletos - [OBS]

Estado: Observacion.

Verificaciones:
- [x] La semana queda fijada con plan base.
- [x] Hay un bloque hecho y otro pendiente para evaluar cierre.

Observaciones de usuario:
- El cierre muestra bloques, pero no resume de forma dedicada los habitos incompletos; hay que inferirlo desde eventos/bloques.

Captura: [08_cierre_semana_con_habitos.png](capturas/08_cierre_semana_con_habitos.png).

### 28. Historial de semana cerrada - [OK]

Estado: OK.

Verificaciones:
- [x] La semana cerrada queda en Planes_Semana.
- [x] Conserva nota inicial y nota de cierre.
- [x] El plan base conserva eventos historicos.

Captura: [09_historial_semana_cerrada.png](capturas/09_historial_semana_cerrada.png).

### 29. Resumen semanal con datos densos - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Hay al menos 10 habitos y 5 objetivos para resumen denso.
- [x] Hay al menos 20 registros para estresar resumen.

Observaciones de usuario:
- En densidad alta, la utilidad depende de que limite/evitar no se lean como habitos positivos completados.

Captura: [10_resumen_semanal_desktop.png](capturas/10_resumen_semanal_desktop.png).

### 30. Mobile de punta a punta - [OK]

Estado: OK.

Verificaciones:
- [x] El habito mobile queda creado.
- [x] Queda vinculado a una fuente.
- [x] El avance mobile queda registrado.

Captura: [11_panel_habitos_mobile.png](capturas/11_panel_habitos_mobile.png).

### 31. Usuario nuevo sin entender metas - [OBS]

Estado: Observacion.

Verificaciones:
- [x] El camino minimo crea y registra sin plan.
- [x] El sistema tiene ayudas hover para conceptos clave. Se verifica visualmente en la captura del editor.

Observaciones de usuario:
- Terminos como tipo, modo, periodo, regla y meta siguen siendo tecnicos; los hovers ayudan, pero no reemplazan buenos defaults y ejemplos.

Captura: [02_editor_habito_cantidad_desktop.png](capturas/02_editor_habito_cantidad_desktop.png).

### 32. Usuario obsesivo con cancelar - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Cancelar sin guardar no persiste cambios.
- [x] Guardar sin cambios no duplica habitos.

Observaciones de usuario:
- El modal de habitos puede cerrarse sin advertencia de cambios no guardados. Para un usuario obsesivo con cancelar, falta una defensa explicita contra perdida silenciosa.

### 33. Datos invalidos y bordes numericos - [FALLA]

Estado: Falla.

Verificaciones:
- [x] Meta cero no queda como cero corrupto.
- [x] Meta negativa no queda como negativa.
- [x] Decimal valido se conserva.
- [ ] Rango Entre no permite maximo menor que minimo.
- [x] Hora personalizada mal escrita se ignora en normalizacion.

Errores o riesgos:
- La normalizacion permite guardar `Entre` con maximo menor que minimo; eso crea un objetivo imposible.

Correccion posterior:
- [x] La normalizacion de `Entre` ahora eleva el maximo al minimo cuando
  el usuario o un dato viejo trae un maximo menor.

### 34. Disponibilidad que cruza medianoche - [FALLA]

Estado: Falla.

Verificaciones:
- [x] El rango 22:00 a 02:00 conserva desde y hasta.
- [ ] Disponible a las 23:00.
- [ ] Disponible a la 01:00.
- [x] No disponible al mediodia.

Errores o riesgos:
- El rango horario que cruza medianoche no se evalua correctamente.

Correccion posterior:
- [x] La franja 22:00 a 02:00 ahora incluye 23:00 y 01:00, excluye
  12:00 y tambien acepta horas como texto (`23:00`, `01:00`).

Captura: [03_editor_habito_evitar_nocturno.png](capturas/03_editor_habito_evitar_nocturno.png).

### 35. Importacion o restauracion con vinculos - [OBS]

Estado: Observacion.

Verificaciones:
- [x] La exportacion no destructiva conserva habitos.
- [x] Los vinculos exportados resuelven a nombres humanos.
- [x] Los registros exportados conservan Habito_Id resoluble.

Observaciones de usuario:
- No se ejecuto una restauracion destructiva sobre la cuenta real; se valido snapshot no destructivo de exportacion/restauracion en memoria. Para importar de verdad conviene usar una cuenta vacia o entorno staging.

### 36. Caso de maxima densidad - [OBS]

Estado: Observacion.

Verificaciones:
- [x] Hay 30+ habitos, objetivos, registros, patrones y slots.
- [x] Vinculaciones, registros y slots siguen referenciando ids existentes.

Observaciones de usuario:
- A maxima densidad se entiende el flujo si uno ya sabe que busca; para exploracion casual faltan jerarquia y filtros mas explicitos.

Captura: [10_resumen_semanal_desktop.png](capturas/10_resumen_semanal_desktop.png).

## Capturas

- [Panel habitos desktop denso](capturas/01_panel_habitos_desktop_denso.png) - Panel con muchos habitos y filtros.
- [Editor habito cantidad desktop](capturas/02_editor_habito_cantidad_desktop.png) - Editor con identidad, meta, disponibilidad y hovers.
- [Editor habito evitar nocturno](capturas/03_editor_habito_evitar_nocturno.png) - Editor de tipo Evitar con rango nocturno.
- [Vinculaciones habitos](capturas/04_vinculaciones_habitos.png) - Agrupacion de habitos vinculados a objetivos, subobjetivos, partes y slots.
- [Registros habitos](capturas/05_registros_habitos.png) - Registros manuales y automaticos generados desde fuentes distintas.
- [Plan de slot rutina](capturas/06_plan_de_slot_rutina.png) - Slot con patron de rutina y habitos marcados.
- [Patron de slot foco](capturas/07_patron_de_slot_foco.png) - Patron reutilizable con tarea manual y habitos.
- [Cierre semana con habitos](capturas/08_cierre_semana_con_habitos.png) - Cierre de semana con bloques hechos y pendientes.
- [Historial semana cerrada](capturas/09_historial_semana_cerrada.png) - Historial de semana cerrada con nota inicial/cierre y plan base.
- [Resumen semanal desktop](capturas/10_resumen_semanal_desktop.png) - Resumen semanal con datos densos.
- [Panel habitos mobile](capturas/11_panel_habitos_mobile.png) - Panel de habitos en mobile.
- [Editor habito largo mobile](capturas/12_editor_habito_largo_mobile.png) - Nombre, emoji y unidad larga en mobile.
- [Resumen semanal mobile](capturas/13_resumen_semanal_mobile.png) - Resumen semanal denso en mobile.
- [Editor habito mobile corregido](capturas/14_editor_habito_mobile_boton_flotante_corregido.png) - Verificacion de boton flotante por debajo del modal.

## Persistencia y limpieza

- Antes de recargar: {"habits":60,"records":58,"planSlots":12,"patterns":5,"modelObjectives":12,"modelSubs":10,"modelParts":5,"legacyObjectives":1}.
- Despues de recargar: {"habits":60,"records":58,"planSlots":12,"patterns":5,"modelObjectives":6,"modelSubs":10,"modelParts":5,"legacyObjectives":1}.
- Restos QA despues de limpiar: {"habitos":0,"registros":0,"patrones":0,"slots":0,"objetivosPlan":0,"subobjetivosPlan":0,"partesPlan":0,"objetivosSemana":0}.
