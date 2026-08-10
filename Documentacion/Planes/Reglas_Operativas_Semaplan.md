# Reglas Operativas de Semaplan

Este documento es la referencia base antes de tocar frontend,
modales, guardado, botones, procedimientos o reglas de UX en
Semaplan. Conviene mantenerlo como un unico documento: funcionamiento,
estilo y operacion se pisan en muchos flujos de esta app, y separarlos
aumenta la chance de aplicar una regla y olvidar la otra.

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
- Si el icono es un simbolo de interfaz y no un emoji real
  (`hamburguesa`, engranaje, tres puntos, check, mas, flecha,
  estrella, etc.), debe renderizarse como SVG inline local desde el
  helper comun, no como Twemoji remoto ni como texto suelto.
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
- Cada cambio real debe persistirse primero en el dispositivo y verificarse
  por lectura antes de considerarse capturado. La sincronizacion remota es
  silenciosa, automatica y no debe bloquear el trabajo normal.
- No mostrar estados permanentes `Guardando`, `Pendiente` o `Error`. Una
  falla remota conserva el pendiente y reintenta con backoff; solo una falla
  local no recuperable justifica una advertencia visible por riesgo de
  perdida de datos.

## Sesiones operativas

- `Cerrar otras sesiones` debe conservar exclusivamente la instancia
  que ejecuta la accion y expulsar las demas, tanto web como Desktop.
- El corte principal debe identificarse con una generacion unica y no
  depender de comparar el reloj local de dos dispositivos.
- La sesion actual acepta la nueva generacion solo despues de que el
  corte remoto se haya guardado. Las otras instancias deben detectarla
  con una revision liviana en pocos segundos y cerrar su autenticacion
  local.
- La invalidacion de autenticacion debe usar alcance `others`: nunca
  debe invalidar el token de renovacion de la sesion que ordeno el
  cierre.
- El heartbeat y la revision rapida son metadata operativa: no deben
  confirmar, limpiar ni sobrescribir cambios de datos pendientes.

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

Los filtros manuales de dias y horas existen solo mientras haya una
opcion manual activada en el menu del encabezado. Si el usuario vuelve
a tocar la opcion activa, se limpia el filtro manual de esa semana y
vuelve a regir la configuracion automatica correspondiente. La opcion
Personalizado muestra los items individuales y, al desactivarse,
tambien vuelve al automatico.

Si el filtro manual corresponde a la semana real actual, debe
persistir al abrir o guardar Configuracion y tambien al recargar la
app. Esa persistencia no convierte el filtro manual en configuracion
automatica global: sigue siendo una memoria de vista de la semana
actual y se limpia al cambiar de semana o al desactivar la opcion
manual.

El modo automatico de horarios "Enfocar alrededor de ahora" muestra
la hora actual mas el margen configurado hacia atras y hacia adelante.
Tambien queda limitado a la semana real actual y queda por debajo del
filtro manual del encabezado.

## Resumen por periodo

El resumen abierto desde el calendario debe usar un unico rango de
lectura para todas sus pestanas. Si el usuario cambia entre semana,
quincena, mes, ano o personalizado, las vistas de objetivos, dias y
metas deben recalcularse sobre ese mismo rango.

La pestana Metas debe ser informativa: no modifica `Planes_Periodo`,
no cierra periodos y no registra avances. Debe diferenciar el avance
generado dentro del rango visible del acumulado total actual para no
confundir una lectura historica con el estado global de la meta.

## Pauta diaria de metas

La pauta asociada a una meta se fija una sola vez al comenzar cada día
activo. El avance registrado durante ese día puede reducir el faltante
de hoy, pero nunca debe recalcular ni sobrescribir la pauta ya fijada.
El próximo día activo se calcula con el pool pendiente actualizado, de
modo que absorbe automáticamente tanto déficits como adelantos.

El realizado histórico se deriva siempre de los avances de la meta. Una
edición o eliminación de un avance pasado debe corregir el realizado y
el balance de esa fecha, sin reescribir su pauta original. Los targets de
subobjetivos se descuentan con tope individual: completar de más uno no
puede ocultar el pendiente de otro.

Las excepciones de calendario tienen prioridad sobre la recurrencia. Una
fecha inactiva explícita prevalece sobre una fecha activa explícita; una
fecha activa explícita prevalece sobre el patrón semanal, mensual o
cíclico. Cambiar el calendario durante una jornada no modifica la pauta
ya fijada y sólo afecta las próximas jornadas.

En el editor de un hábito asociado, `Meta` es una salida derivada y debe
recalcularse en el momento ante cualquier cambio de período, fecha de
inicio, días semanales, rango, ciclo, días del mes o fechas excepcionales.
Si hoy no es válido, el editor usa la primera fecha válida futura como
referencia. Este cálculo de configuración es sólo una vista previa: no
crea ni sobrescribe la pauta histórica ya fijada para la jornada.

Una vez asociado el hábito, el detalle de la meta no debe repetir una
tarjeta ampliada con realizado, faltante, pool, días válidos, historial o
acciones del hábito. La lectura operativa muestra sólo la cuota completa
recomendada por día activo, aun cuando hoy sea un descanso; no debe usar el
faltante de hoy ni convertir la meta del período en una cifra diaria. Si no
existe hábito asociado, se conserva una vía clara para crearlo.

## Lectura del progreso de una meta

El detalle de una meta debe permitir decidir qué hacer sin mezclar escalas.
La cuota por día activo se integra de manera compacta en la lectura
operativa; la meta madre es contexto global y los tres indicadores
principales son cuota esperada del período, compromiso explícito de
subobjetivos y trabajo operativo acumulado.

El tablero no debe abrir con un encabezado que repita período, nombre de la
sección o una explicación genérica. De esa franja sólo se conserva el estado
efectivo de la meta, integrado junto a su identidad y avance global.

La identidad de la meta madre debe nombrar su horizonte temporal real
(`Anual`, `Semestral`, `Trimestral`, `Mensual`, etc.) en lugar de la etiqueta
genérica `Avance global`. Ese horizonte sale del período base de la meta
canónica y no del período hijo que se esté consultando.

La cuota usa el resultado cumplido contra la parte proporcional de la
meta asignada al período. El compromiso usa subobjetivos raíz cumplidos
contra los cargados para ese período. El trabajo usa unidades realizadas
contra la suma uniforme de unidades de esos subobjetivos. Si una métrica
no es calculable, se informa su ausencia: no se muestra un cero falso ni
se equiparan unidades distintas.

El numerador y el denominador del trabajo operativo deben salir del
mismo inventario de subobjetivos medibles. Un subobjetivo cuyo target se
obtiene sumando sus partes se cuenta una vez con ese total consolidado y
con el avance agregado de su familia: no se lo excluye ni se vuelven a
sumar sus partes. La vista debe explicitar total, realizado, pendiente y
la porción pendiente que pertenece a subobjetivos todavía sin avance. En
`Trabajo operativo`, la cuenta principal ya expresa realizado sobre total:
el desglose no debe repetir realizado ni agregar una explicación genérica;
sólo conserva pendiente y sin iniciar.

Cumplir un subobjetivo fuera del período previsto no cambia el período al
que fue comprometido. `Fecha_Inicio` y `Fecha_Objetivo` expresan la
decisión de planificación; `Fecha_Fin` expresa la ejecución real. Los
porcentajes pueden superar el 100 %, aunque la barra visual se limite al
ancho disponible.
