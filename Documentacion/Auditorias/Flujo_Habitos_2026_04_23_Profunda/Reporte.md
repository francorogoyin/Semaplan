# Auditoria profunda - Flujo de Habitos

Fecha: 2026-04-23.

Cuenta usada: tomashodel.

Alcance ejecutado:

- Crear, guardar, recargar y borrar habitos reales de prueba contra Supabase.
- Probar habitos Check, Cantidad, Tiempo, Evitar y un caso de borrado.
- Probar vinculos reales con objetivo de Plan, subobjetivo, parte, evento y slot.
- Revisar modales secundarios del Plan con datos densos: objetivo, subobjetivo, parte, registrar avance y registro de avances.
- Reprobar los errores corregidos con recarga desde Supabase.

## Evidencia generada

- `01-habitos-creados-panel.png`
- `02-habitos-persisten-tras-recarga.png`
- `03-borrar-habito-real-ui.png`
- `04-plan-objetivo-con-habito-vinculado.png`
- `05-nuevo-habito-desde-vinculo-objetivo.png`
- `06-subobjetivos-con-datos.png`
- `07-editor-subobjetivo-con-habito.png`
- `08-partes-con-datos.png`
- `09-editor-parte-con-habito.png`
- `10-registrar-avance-denso.png`
- `11-registro-avances-denso.png`
- `12-habitos-evento-vinculado.png`
- `13-plan-slot-con-habito.png`
- `14-panel-vinculaciones-con-datos.png`
- `15-limpieza-final-sin-qa.png`
- `16-fix-parte-vinculo-persistente.png`
- `17-fix-slot-tiempo-disponible.png`
- `18-borrar-habito-vinculado-dialogo.png`
- `19-borrar-habito-vinculado-post-ui.png`

Archivos de resultado:

- `resultados_profundos.json`
- `verificacion_fix.json`
- `verificacion_borrado_vinculado.json`
- `limpieza_confirmada.json`

## Resultado funcional

- Se crearon 5 habitos reales de prueba y se confirmo que seguian visibles despues de recargar desde Supabase.
- Se borro por UI un habito real no vinculado y se confirmo tras recarga que habia desaparecido.
- Se crearon datos densos vinculados a objetivo, subobjetivo, parte, avance, evento y slot.
- El panel de vinculaciones mostro las fuentes QA esperadas.
- Se verifico que objetivo, subobjetivo y parte conservan sus vinculos de habito despues de guardar y recargar desde Supabase.
- Se borro por UI un habito vinculado a objetivo, subobjetivo y parte. El dialogo aviso las 3 fuentes y, tras confirmar, el habito desaparecio y las referencias quedaron limpias luego de recargar.
- La limpieza final dejo la cuenta sin datos QA residuales de esta pasada.

## Hallazgos corregidos

### PROF-01 - Partes perdian vinculos de habito

Estado: Corregido.

Tipo: Persistencia.

Pantalla: Nueva / editar parte.

Como usuario que vincula una parte de una meta a un habito, esperaba que el vinculo siguiera existiendo al reabrir o recargar. El normalizador de partes descartaba `Habitos_Vinculos`, por lo que el dato podia perderse. Se corrigio el normalizador y se reprobo con `16-fix-parte-vinculo-persistente.png`.

### PROF-02 - Objetivos y subobjetivos tambien podian descartar vinculos

Estado: Corregido.

Tipo: Persistencia.

Pantallas: Nuevo / editar objetivo de Plan y Nuevo / editar subobjetivo.

La auditoria de borrado vinculado mostro que el mismo riesgo existia en objetivos y subobjetivos. Si soy un usuario que conecta un objetivo o subobjetivo a un habito, no deberia depender de que el vinculo sobreviva solo en memoria. Se agrego preservacion de `Habitos_Vinculos` en ambos normalizadores y se verifico guardado, recarga y borrado posterior.

### PROF-03 - Las filas de vinculos quedaban comprimidas

Estado: Corregido.

Tipo: Visual / UX.

Pantallas: Habitos del bloque, objetivo, subobjetivo y parte.

La fila de vinculo mezclaba selector, modo, cantidad y borrar con una grilla generica. En datos densos se leia apretada y, en evento, el control de borrar quedaba especialmente pobre. Se agrego una clase especifica para filas de vinculo y se ajusto su grilla.

### PROF-04 - Boton duplicado para agregar vinculo

Estado: Corregido.

Tipo: UX.

Pantallas: Objetivo, subobjetivo y parte.

El bloque ya renderizaba selector + boton `Agregar`; ademas habia un segundo boton estatico `Agregar vinculo` debajo. Como usuario no quedaba claro cual era el camino correcto. Se elimino el boton redundante.

### PROF-05 - Habitos de tiempo no aparecian en slots vacios

Estado: Corregido.

Tipo: Funcional / UX.

Pantalla: Plan de slot vacio.

Si soy un usuario que quiere reservar una hora para un habito de tiempo antes de crear un bloque, el habito no aparecia como opcion. Se habilitaron habitos de tiempo en slots y se calcula el aporte como 1 hora o 60 minutos segun la unidad del habito. Verificado en `17-fix-slot-tiempo-disponible.png`.

### PROF-06 - Textos visibles sin acento

Estado: Corregido en el flujo auditado.

Tipo: Texto.

Pantallas: Habitos, vinculaciones y dialogo de borrado.

Se corrigieron textos como `Habitos`, `habito`, `Vinculos`, `Dia`, `dias`, `patron` y el dialogo de borrado vinculado. La ultima verificacion confirmo el texto con tildes: `Este hábito aparece en 0 plan(es), 0 patrón(es) y 3 fuente(s).`

## Hallazgos no bloqueantes anotados

### PROF-UX-01 - Vincular habitos en Plan sigue poco descubrible

Estado: Anotado.

Tipo: UX.

Pantallas: Objetivo, subobjetivo y parte.

Si soy un usuario que crea o edita un objetivo y quiero asociarlo a un habito, la seccion `Habitos vinculados` aparece despues de muchos campos. Funciona, pero no esta cerca de la decision conceptual de progreso. Puede convenir subirla o darle mas jerarquia si los habitos son centrales para metas.

### PROF-UX-02 - `Cantidad fija` vs `Usar fuente` necesita explicacion

Estado: Anotado.

Tipo: UX / Copy.

Pantallas: Vinculos de habitos.

Si soy un usuario nuevo, no es obvio cuando elegir `Cantidad fija`, `Usar fuente` o `Usar duracion`. La opcion funciona, pero el modelo mental no queda explicado en el punto de decision. Conviene agregar hover o microcopy local.

### PROF-UX-03 - Borrar un habito vinculado es potente y merece copy mas humano

Estado: Anotado.

Tipo: UX / Riesgo.

Pantalla: Dialogo de borrar habito.

El dialogo ya avisa cuantas fuentes usan el habito y permite eliminar referencias o convertir en tarea. Aun asi, para una persona no tecnica `fuente(s)` puede sonar abstracto. Un texto mas concreto podria decir que se quitaran vinculos en objetivos, subobjetivos, partes, bloques o slots.

## Cierre

La auditoria profunda que habia quedado pendiente ya fue ejecutada. Los problemas corregibles sin decision de producto quedaron corregidos y reprobrados. Los puntos restantes son mejoras de criterio/jerarquia, no fallas tecnicas bloqueantes.
