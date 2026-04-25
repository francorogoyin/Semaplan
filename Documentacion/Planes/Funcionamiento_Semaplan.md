# Funcionamiento Semaplan

Este documento es la referencia base antes de tocar frontend,
modales, guardado o reglas de UX en Semaplan. Conviene mantenerlo como
un unico documento: funcionamiento y estilo se pisan en muchos flujos
de esta app, y separarlos aumenta la chance de aplicar una regla y
olvidar la otra.

## Convenciones de codigo

- Usar Pascal_Snake_Case para variables, funciones, clases CSS, IDs,
  carpetas y archivos propios.
- Usar palabras completas y espanol.
- No sumar librerias externas salvo decision explicita.
- Mantener lineas de hasta 70 caracteres cuando sea razonable.
- Toda funcion nueva, texto nuevo o cambio visible de UI debe quedar
  traducido en todos los idiomas disponibles en la app dentro del
  mismo cambio.
- No dejar textos hardcodeados en una sola lengua para despues.

## Emojis

- Si un elemento de UI muestra emojis, aplicar `Con_Fallback_Emoji` o
  sumar su selector al bloque CSS de fallback emoji.
- El fallback debe incluir `"Segoe UI Emoji"`, `"Apple Color Emoji"`,
  `"Noto Color Emoji"` y `"Segoe UI Symbol"`.
- Si el emoji se renderiza dinamicamente como icono, badge, marca de
  plan o estado, usar `Aplicar_Emoji_En_Elemento()` en lugar de
  `textContent` o `innerHTML` directo. Ese helper usa imagen/fallback y
  evita cuadrados en navegadores con soporte incompleto.
- Todo campo editable de emoji debe usar `Con_Selector_Emoji`.
- Esos campos no deben permitir autocomplete, autocorrect,
  sugerencias ni spellcheck del navegador.
- Al abrir el selector de emojis, el input de origen debe quedar
  `readonly` hasta cerrar el selector.

## Modales

- Toda cruz de cierre de modal debe usar `button.Config_Cerrar` con
  `&times;`.
- No usar `Config_Boton`, estilos inline ni variantes cuadradas para
  una cruz de cierre salvo excepcion documentada.
- El formato estandar es circular, de 28 x 28 px, con `display: grid`,
  `place-items: center`, `line-height: 1`, fondo suave y hover suave.
- Si un modal necesita layout propio, ajustar su contenedor sin
  sobreescribir el estilo visual de `.Config_Cerrar`.

## Guardado

- Antes de confirmar una edicion, comparar el estado normalizado
  anterior contra el estado normalizado nuevo.
- Si no hay cambios reales, no disparar toast de edicion, no crear
  snapshot de undo y no llamar a `Guardar_Estado()`.
- La regla aplica a objetivos, metas, subobjetivos, notas,
  configuracion y cualquier modal de edicion.
- Una normalizacion invisible no cuenta como cambio real salvo que
  corrija persistencia necesaria o un dato efectivamente invalido.

## Seleccion multiple

Cuando una seleccion multiple muestra una barra de acciones en lote
(calendario, Archivero, Baul, sidebar o Planes), un click izquierdo
fuera de la barra y fuera de otro elemento seleccionable debe limpiar
la seleccion sin abrir modales ni menus. Un click derecho fuera de esa
barra, incluso sobre otro elemento seleccionable, debe limpiar la
seleccion y no abrir menu contextual. El click izquierdo sobre otro
elemento seleccionable conserva su accion normal.

## Filtros del calendario

Los filtros manuales del encabezado del calendario tienen prioridad
sobre cualquier filtro automatico de Configuracion. Esto aplica tanto
a dias visibles como a horas o bloques horarios visibles.

El filtro automatico solo debe actuar en la semana real actual. En
semanas pasadas o futuras se muestran todos los dias y horarios salvo
que el usuario aplique un filtro manual desde el encabezado.

El filtro manual se limita a la semana visible donde se aplica y no
debe modificar la configuracion automatica persistida.
