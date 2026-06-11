# Funcionamiento App Semaplan

Este documento resume la aplicacion operativa real de Semaplan para no
depender de releer todo `login.html` cada vez.

Complementa, no reemplaza, a
`Documentacion/Planes/Reglas_Operativas_Semaplan.md`.

`Reglas_Operativas_Semaplan.md` define criterios de UX, guardado y
consistencia.

Este archivo define panorama funcional, modulos, estructuras de estado
y funciones de entrada relevantes.

Debe mantenerse actualizado cuando cambien flujos operativos,
estructuras persistidas o relaciones importantes entre modulos.

## Entrypoints y archivos

- `index.html`: landing publica.
- `Semaplan.html`: redireccion liviana a `login.html`.
- `login.html`: aplicacion operativa principal.
- `supabase/functions/semaplan-ai`: gateway read-only en
  produccion para consultas de IA sobre datos de Semaplan en
  `https://cprdnxkkhuuhdispubds.supabase.co/functions/v1/semaplan-ai`.
  Ya valida tokens/JWT/OAuth, puede leer `estado_usuario` con filtrado
  seguro y expone `/agenda`, `/contexto`, `/tareas`, `/habitos`,
  `/slots`, `/planes/semana`, `/planes/periodos`, `/archivero`,
  `/archivero/buscar`, `/baul`, `/metas`, `/openapi.json`,
  `/oauth/authorize` y `/oauth/token` con vistas compactas y contrato
  publico para IA.
- `supabase/functions/semaplan-ai-mcp`: servidor MCP remoto por HTTP
  (streamable compatible) para ChatGPT Apps/Developer Mode. Expone
  `initialize`, `tools/list` y `tools/call` en el endpoint
  `/functions/v1/semaplan-ai-mcp/mcp`, incluyendo `search` y `fetch`
  para compatibilidad de conectores/deep research en ChatGPT. Reenvia
  tools de lectura al gateway `semaplan-ai` reutilizando
  `Authorization` OAuth o `X-Semaplan-AI-Token`.
- `supabase/functions/semaplan-telegram`: webhook de escritura acotada
  para bot de Telegram. Opera tareas, habitos, avances de Metas,
  avances de Decoteca y consulta de pendientes. Valida secreto de
  webhook, exige vinculo previo en `telegram_vinculos_usuario`,
  registra comandos en `telegram_comandos_usuario` para auditoria e
  idempotencia, usa confirmaciones persistidas para borrados y guarda
  `estado_usuario` con control de `version`.
- `Herramientas/Scripts/semaplan-ai-mcp-server.js`: puente MCP local
  por `stdio` que expone herramientas para Claude y las reenvia al
  gateway `semaplan-ai`, sin leer Supabase directo.
- `Aplicaciones/Desktop/Melomania`: app Electron personal para la
  meta musical `Melomania`. Conecta con Semaplan usando Supabase Auth
  de produccion, lee `Planes_Periodo`, lista albumes cargados como
  subobjetivos del objetivo `Melomania`, permite crear ese objetivo
  base si no existe y fija o borra la metrica `Puntuacion` del album
  dentro de los metadatos del subobjetivo. Spotify se conecta por
  OAuth PKCE con `playlist-modify-private`, `playlist-read-private` y
  `user-read-private`; abre el navegador externo y recibe el retorno
  en `/spotify/callback` del servidor local del `.exe`, evitando usar
  `file://` como redirect. Busca albumes, crea una playlist privada
  por album y guarda el subobjetivo con partes por cancion; si
  `Melomania` todavia no existe, la crea automaticamente al guardar el
  primer album. last.fm se conecta con API key y usuario, consulta
  conteos publicos por tema y marca partes/albumes como realizados
  cuando cada cancion llega al umbral elegido, sin persistir
  `Escuchas_Lastfm` en Semaplan.
- `supabase/functions/*`: Edge Functions remotas para suscripcion,
  ayuda, eliminar cuenta y demas integraciones.
- `supabase/migrations/*`: cambios de esquema remoto.

## Panorama general

Semaplan es una app de planificacion personal con varios sistemas que
comparten un mismo blob de estado.

Los modulos principales son estos.

- Calendario y agenda semanal.
- Objetivos de sidebar y eventos asociados.
- Slots vacios, tipos de slot y planes de slot.
- Tareas sueltas por fecha o cajon.
- Habitos con programacion y registros.
- Retos de varios dias vinculados a uno o mas habitos.
- Archivero para notas, etiquetas y adjuntos.
- Baul como backlog de objetivos e ideas accionables.
- Decoteca como archivo cultural persistido por tecas.
- Metas resumidas por fuente.
- Planes semanales.
- Planes por periodos con objetivos, subobjetivos y partes.
- Configuracion, backups, import/export y sync remoto.

## Estado persistido

La app construye el blob completo en `Construir_Estado_Completo()`.

Las claves centrales persistidas hoy son estas.

- `Objetivos`
- `Eventos`
- `Metas`
- `Slots_Muertos`
- `Planes_Slot`
- `Planes_Semana`
- `Planes_Periodo`
- `Plantillas_Subobjetivos`
- `Categorias`
- `Etiquetas`
- `Baul_Objetivos`
- `Decoteca`
- `Archiveros`
- `Notas_Archivero`
- `Etiquetas_Archivero`
- `Patrones`
- `Habitos`
- `Habitos_Registros`
- `Retos`
- `Tareas`
- `Tareas_Cajones_Definidos`
- `Config_Extra`
- `Sync_Datos_Marca_Ms`
- `Tipos_Slot`
- `Slots_Muertos_Tipos`
- `Slots_Muertos_Nombres`
- `Slots_Muertos_Titulos_Visibles`
- `Slots_Muertos_Nombres_Auto`
- `Slots_Muertos_Grupo_Ids`
- `Semanas_Con_Defaults`

La Decoteca persiste en la clave raiz `Decoteca`. Su formato canonico
tiene `Tecas`, `Obras` y `Avances`; `Normalizar_Decoteca()` completa
las tecas de sistema, normaliza obras viejas que usen `Teca` en lugar
de `Teca_Id`, migra partes simples a `Partes` estructuradas, y conserva
estados vacios ya inicializados para import/export y sync.

La carga local/restauracion pasa por `Cargar_Estado()` y luego por
`Normalizar_Estado()`.

## Carga, guardado y sync

El flujo operativo base es este.

1. `Inicializar_Supabase()` crea el cliente remoto.
2. `Cargar_Estado()` intenta levantar cache local y luego el estado
   remoto si hace falta.
3. `Normalizar_Estado()` deja todos los modulos en formato canonico.
4. Los renders principales reconstruyen UI segun el estado ya
   normalizado.
5. `Guardar_Estado()` serializa el estado completo y lo guarda en
   localStorage. Solo programa sync remoto si el estado de datos
   reales cambio respecto del cache anterior; cambios puramente
   operativos como sesiones o marcas de sync no ensucian remoto.
6. `Backend_Sync_Programar()` sube cambios reales casi al toque, con
   una demora minima para mantener un punto unico de ejecucion y sin
   debounce largo.
6.b Las mutaciones visibles del calendario que crean, mueven,
   redimensionan, repiten, limpian, pegan o tildan bloques, y las que
   crean, borran, limpian o planifican slots muertos/vacios, usan
   `Guardar_Estado_Cambio_Critico()` para no quedar atadas al debounce
   normal y evitar perder los ultimos cambios al reloguear.
7. `Backend_Sync_Ejecutar()` sube el estado a `estado_usuario`,
   con manejo de versionado, conflictos y reintentos.
7.b Despues de un sync exitoso, la foto remota interna se guarda como
   clon JSON limpio, no como referencia compartida con los arrays vivos
   de la app. Esto evita que mutaciones in-place posteriores de
   habitos, notas, slots, planes u otros modulos contaminen la referencia
   remota y queden invisibles para el diff de guardado.
8. Al iniciar una sesion logueada, la app lee remoto antes de entrar y
   registra una unica `Sesiones_Operativas` activa como lease
   exclusivo. Si detecta otra sesion reciente del mismo usuario,
   bloquea la entrada y ofrece cerrar las demas sesiones o salir.
9. El lease operativo se renueva con heartbeat remoto liviano. Si el
   usuario elige cerrar las demas sesiones, la app escribe un corte en
   `Sesiones_Operativas`, conserva solo la sesion actual y las otras
   quedan expulsadas cuando revisen remoto. Si una app se cierra o se
   cae sin liberar el lease, la sesion vence por TTL. El heartbeat y los
   cortes de sesion suben solo metadata operativa de sesion, no el blob
   completo del usuario, para evitar timeouts en cuentas grandes.
9.b `Sesiones_Operativas` es metadata operativa: no forma parte del
   estado normal generado por `Construir_Estado_Completo()` y no debe
   contarse como cambio de datos del usuario.
10. `Sync_Datos_Marca_Ms` marca cambios reales de datos generados por
   `Guardar_Estado()`. La metadata de sesiones no actualiza esa marca.
11. Si al iniciar hay cambios locales pendientes, la app no decide
   conflicto por `actualizado_en` remoto solamente. Solo abre
   conflicto si el estado remoto trae una marca de datos reales mas
   nueva que la local. Si el cambio remoto fue operativo o no tiene
   marca de datos mas nueva, el cache local pendiente se sincroniza.
11.b Si al iniciar hay `sync` local pendiente sin
   `Sync_Datos_Marca_Ms`, y la marca del pendiente local queda vieja
   frente a `actualizado_en` remoto por mas de 1 segundo, se descarta
   ese pendiente, se limpia el flag local y se recarga el estado
   remoto para evitar quedar en `Guardando` con cache obsoleto.
12. La metadata operativa de sesiones (`Sesiones_Operativas` y
   `Sesion_Global_Corte_Ms`) no se trata como cambio de datos del
   usuario. Si el remoto cambio solo por metadata operativa, no se muestra
   conflicto ni toast de otro dispositivo. Antes de sobrescribir remoto,
   `Backend_Sync_Ejecutar()` relee la fila: si cambiaron datos reales
   con marca mas nueva abre conflicto; si el remoto no requiere
   conflicto, refresca version y reintenta el guardado aunque el
   `UPDATE` versionado haya perdido contra otra escritura reciente.
13. Fuera del heartbeat del lease exclusivo, no hay polling remoto
   permanente por defecto. La app revisa cambios remotos al volver al
   foco/visibilidad o por eventos locales de sync, sin marcar
   `Guardando` si no hay cambios propios.
14. `Hay_Sync_Pendiente()` representa trabajo real pendiente
   (timer, reintento o promesa en curso) y no solamente el texto
   visible `Guardando`. Si la UI queda en `Guardando` sin tarea activa,
   `Resolver_Sync_Guardando_Inactivo()` la normaliza a `Guardado`,
   reintento o `Error` segun haya datos locales sucios o conflicto.
14.b Los reintentos automaticos de sync tienen tope. Si se alcanza el
   maximo de intentos consecutivos sin exito, la app deja de quedar en
   `Guardando` indefinido y pasa a `Error` hasta un reintento manual.
14.c Si el backend responde timeout de consulta (`code 57014` /
   `statement timeout`) durante un guardado, la app agota de inmediato
   los reintentos automaticos y pasa a `Error` para evitar ciclos largos
   en `Guardando`.
14.d Cuando hay muchos cambios acumulados, el sync versionado envia el
   estado en lotes por claves raiz para evitar timeouts por payload
   grande. Cada lote actualiza la misma fila con control de version y la
   app confirma `Guardado` al terminar el ultimo lote.
15. `Cerrar sesion en todas` registra primero un corte global propio en
   el estado remoto. Si Supabase rechaza el `signOut` global, la app
   registra el error pero igualmente cierra la sesion local, porque el
   corte remoto propio es el mecanismo que expulsa a las otras
   sesiones al revisar sync. Si el corte propio falla (por ejemplo por
   timeout) pero `signOut` global responde, tambien se cierra la sesion
   local sin mostrar falso error de cambios sin guardar.
16. Si `Cerrar sesion en todas` encuentra sync local pendiente, fuerza
   el corte global usando el estado local actual como base remota. Si
   hay un conflicto pendiente, interrumpe el cierre y muestra el
   conflicto para que el usuario lo resuelva antes de expulsar otras
   sesiones.

Funciones transversales importantes.

- `Construir_Estado_Completo()`
- `Cargar_Estado()`
- `Normalizar_Estado()`
- `Guardar_Estado()`
- `Guardar_Estado_Cambio_Critico()`
- `Backend_Sync_Programar()`
- `Backend_Sync_Ejecutar()`
- `Backend_Verificar_Remoto_Antes_De_Sync()`
- `Preparar_Sesion_Operativa_Entrada()`
- `Backend_Registrar_Corte_Sesion_Global()`
- `Backend_Forzar_Corte_Global_Desde_Local()`
- `Invocar_Edge_Con_Sesion()`
- `Aplicar_Importacion_Objeto()`

## Calendario y objetivos

El calendario semanal sigue siendo el eje visual principal.

Objetos centrales.

- `Objetivos`: objetivos del sistema tradicional ligados al sidebar y
  a eventos.
- `Eventos`: bloques del calendario.
- `Semana_Actual`: semana visible.

Funciones utiles para entrar a este subsistema.

- `Render_Calendario()`
- `Render_Eventos()`
- `Render_Editor()`
- `Render_Resumen_Semanal()`

Notas operativas.

- Muchos flujos vecinos terminan impactando eventos aunque se disparen
  desde tareas, slots, habitos o planes.
- Si se toca creacion, edicion, borrado o movimiento de eventos hay
  que revisar efectos colaterales en planes semanales, planes de slot,
  metas y sync.
- Al copiar o mover bloques entre semanas, el `Objetivo_Id` del evento
  se remapea a la instancia semanal de destino (misma familia/plantilla
  cuando existe, o override semanal si falta). Ese remapeo debe gatillar
  recalculo de vinculos a habitos y redistribucion de aportes de metas
  para que el computo quede en la semana nueva y no en la de origen.
- La duracion por defecto de eventos define tambien el paso visible de
  la grilla del calendario. Solo se permiten 15 minutos, 30 minutos y
  1 hora. Al cambiarla, `Duracion_Grilla_Eventos` permite detectar el
  paso anterior y migrar eventos, slots muertos y `Planes_Slot`: al
  partir una hora los items generales van al primer sub-bloque y las
  tareas con hora van al sub-bloque correspondiente; al fusionar
  sub-bloques se unifican items y notas sin generar copias duplicadas.
- Los selectores de franjas de patrones y de slots muertos por defecto
  deben usar el mismo paso visible de la grilla. Con grilla de 15
  minutos tienen que ofrecer 21:00, 21:15, 21:30 y 21:45, sin truncar
  los valores decimales al guardar.
- Al aplicar una franja bloqueada de patron o de slots muertos por
  defecto, todos los sub-slots generados por esa franja comparten
  `Slots_Muertos_Grupo_Ids` para que se vean y operen como una franja
  continua al repetir, redimensionar o arrastrar.
- En migracion a grilla mas fina (1h -> 30m/15m), los bloques no se
  fragmentan en copias hijas y los slots muertos tampoco se duplican:
  se conserva solo el primer bloque/slot resultante para evitar
  multiplicaciones artificiales en calendario y planes.
- El resumen accesible desde el calendario ya no esta limitado a la
  semana visible: permite leer semana, quincena, mes, ano o rango
  personalizado. Sus pestanas de objetivos, dias y metas comparten el
  mismo rango de lectura.
- La pestana Metas del resumen es de solo lectura y cruza el rango
  seleccionado contra `Planes_Periodo`, mostrando avance dentro del
  rango y acumulado actual de objetivos, subobjetivos y partes.
- En Resumen > Metas las tarjetas son compactas y expandibles. La barra
  y el porcentaje usan unidades avanzadas del rango contra el valor
  objetivo contextual de ese periodo; el detalle muestra primero
  subobjetivos y partes con avance, ordenados de mayor a menor, y deja
  los items sin avance detras de botones de expansion.
- En Resumen > Metas un objetivo solo se incluye si tuvo avance dentro
  del rango visible, si su target contextual para ese rango es mayor a
  cero o si su periodo solapa el rango y tiene target total definido.
  Si no tiene meta ni avance en el rango, queda oculto; si tiene avance
  pero no meta, se muestra como 100%.
- Si la vista visible estaba siguiendo el dia actual con el filtro
  automatico o manual de solo hoy, el refresco automatico por cambio de
  fecha tambien reubica la semana visible. Al pasar de domingo a lunes,
  la vista queda en el lunes de la nueva semana y no en el domingo de la
  semana anterior.
- La seleccion multiple de objetivos semanales conserva los ids
  seleccionados mientras se abre el dialogo de cambio de categoria.
  La categoria se aplica en lote al confirmar y recien despues se
  limpia la seleccion.

## Slots vacios, bloques y planes de slot

Este subsistema modela disponibilidad y planificacion liviana dentro de
franjas horarias.

Objetos centrales.

- `Slots_Muertos`
- `Tipos_Slot`
- `Planes_Slot`
- `Slots_Muertos_Tipos`
- `Slots_Muertos_Nombres`
- `Slots_Muertos_Titulos_Visibles`

Funciones de entrada recomendadas.

- `Normalizar_Slots_Muertos()`
- `Normalizar_Planes_Slot()`
- `Render_Config_Tipos_Slot()`
- `Render_Config_Slots_Muertos()`
- `Render_Modal_Plan_Slot()`
- `Render_Fila_Plan_Slot()`

Relaciones importantes.

- Un slot puede tener metadata propia y a la vez items planeados.
- Si un slot deja de ser vacio y aparece un evento real, parte del
  plan de slot puede transferirse al evento.
- Los patrones de tipo slot alimentan este sistema.
- En pedidos de reforma de `Planes` de bloques, el alcance operativo
  por defecto incluye bloques, slots muertos y slots vacios, salvo que
  el usuario aclare otra cosa.
- En el modal de plan de slot o bloque, los habitos sugeridos ya no se
  muestran en un apartado separado: aparecen primero dentro del
  desplegable de habitos y el selector se pinta en gris cuando contiene
  sugerencias. Los habitos diarios se sugieren solo cuando coinciden
  con el dia y la hora del slot. Los habitos semanales, quincenales y
  mensuales pendientes se sugieren dentro del periodo aunque su
  programacion tenga dias u horarios preferidos; dejan de aparecer
  cuando el periodo queda completo. La lista sugerida se ordena por
  periodo: diarios, semanales, quincenales y mensuales; y dentro de
  cada periodo por tipo: Check, Cantidad, Tiempo y Evitar.
- Los planes de slots vacios, slots muertos y bloques usan controles
  desplegables equivalentes para agregar habitos y tareas, no objetivos
  semanales. En el desplegable de tareas van primero las tareas del
  mismo dia y horario, despues las tareas sin horario y al final las de
  otros horarios. Las tareas agregadas se guardan como items con
  `Tarea_Id`, se deduplican por ese identificador y conservan el
  vinculo al persistir o transferirse entre plan de slot y bloque.

## Tareas

Las tareas son entidades propias, separadas de `Objetivos`.

Objetos centrales.

- `Tareas`
- `Tareas_Cajones_Definidos`

Modelo basico de tarea normalizada.

- `Id`
- `Nombre`
- `Emoji`
- `Cajon`
- `Prioridad`
- `Estado`
- `Fecha`
- `Hora`
- `Planeada`
- `Evento_Id`
- `Abordaje_Id`
- `Plan_Clave`
- `Plan_Item_Id`

Funciones de entrada recomendadas.

- `Normalizar_Tarea()`
- `Normalizar_Tareas()`
- `Render_Tareas()`
- `Render_Tareas_Panel()`
- `Render_Tareas_Editor()`
- `Render_Tareas_Cajones()`

Relaciones importantes.

- Una tarea puede existir sin evento.
- Una tarea puede quedar planeada y vinculada a un slot, evento o
  abordaje.
- Cambios en tareas pueden impactar agenda, planes de slot y sync
  critico.

## Habitos

Los habitos tienen definicion, programacion y registros historicos.

Objetos centrales.

- `Habitos`
- `Habitos_Registros`
- `Patrones`

Modelo basico de habito normalizado.

- `Id`
- `Nombre`
- `Emoji`
- `Color`
- `Activo`
- `Archivado`
- `Fecha_Inicio`
- `Tipo`
- `Programacion`
- `Meta`

Funciones de entrada recomendadas.

- `Normalizar_Habito()`
- `Normalizar_Habitos()`
- `Normalizar_Habito_Registro()`
- `Render_Modal_Habitos()`
- `Render_Habitos_Panel()`
- `Render_Habitos_Registro()`
- `Render_Modal_Habito_Editor()`
- `Render_Habitos_Sidebar()`

Relaciones importantes.

- Los habitos pueden vincularse a objetivos, subobjetivos, partes,
  items de patron y slots.
- Cambios en programacion o registros pueden alterar sidebar,
  indicadores, planes y enfoque diario.
- El modal principal de Habitos se cierra con Escape igual que los
  submodales internos, para mantener consistencia con el resto de la UI.
- Los vinculos de habitos en bloques/eventos muestran una ayuda breve
  sobre como se computan las cantidades realizadas por bloque tildado.
- Cuando una parte o subobjetivo se marca como realizado o se cancela
  esa realizacion, la UI de habitos debe refrescar sidebar y modal
  desde `Habitos_Registros` en el mismo flujo para reflejar color,
  estado e indicador sin esperar un render posterior.

## Retos

Los retos son compromisos de varios dias que agrupan habitos. No tienen
registros diarios propios: su progreso se calcula desde
`Habitos_Registros` para evitar duplicar fuentes de verdad.

Objetos centrales.

- `Retos`
- `Habitos`
- `Habitos_Registros`

Modelo basico de reto normalizado.

- `Id`
- `Nombre`
- `Emoji`
- `Color`
- `Fecha_Inicio`
- `Duracion_Dias`
- `Estado`
- `Regla_Cumplimiento`
- `Habito_Ids`
- `Notas`
- `Fecha_Cierre`
- `Orden`

Funciones de entrada recomendadas.

- `Normalizar_Reto()`
- `Normalizar_Retos()`
- `Abrir_Retos()`
- `Render_Modal_Retos()`
- `Render_Retos_Panel()`
- `Render_Modal_Reto_Editor()`
- `Retos_Estado_Dia()`
- `Retos_Estadisticas()`

Relaciones importantes.

- Un reto puede vincular muchos habitos mediante `Habito_Ids`.
- `Regla_Cumplimiento` define si el dia cuenta cuando se cumplen todos
  los habitos vinculados o cualquiera de ellos.
- Marcar, destildar o cancelar un habito refresca Retos si el modal
  esta abierto, porque el estado diario se deriva de los registros de
  habitos.
- El total exigido por dia usa solo los habitos vigentes en esa fecha.
  Si se agrega a un reto un habito cuya `Fecha_Inicio` es posterior al
  inicio del reto, los dias previos no quedan marcados como incompletos
  por ese nuevo vinculo.
- Al borrar un habito, se quita su id de los retos vinculados. El reto
  puede quedar sin habitos y se muestra como tal hasta que el usuario lo
  edite o lo borre.
- Crear, editar o borrar retos usa guardado critico porque cambia una
  clave persistida del estado completo.
- El modal principal de Retos se cierra con Escape y refresca su vista
  cuando cambian registros de habitos vinculados.

## Archivero

El Archivero funciona como memoria organizada por cajones.

Objetos centrales.

- `Archiveros`
- `Notas_Archivero`
- `Etiquetas_Archivero`

Funciones de entrada recomendadas.

- `Inicializar_Archiveros_Default()`
- `Normalizar_Texto_Archivero()`
- `Normalizar_Etiquetas_Archivero()`
- `Normalizar_Adjuntos_Archivero()`
- `Render_Archivero()`
- `Render_Archivero_Notas()`
- `Render_Modal_Etiquetas_Archivero()`

Relaciones importantes.

- Las etiquetas usan comparacion normalizada sin depender de acentos.
- Las notas pueden tener texto, origen, color y adjuntos en base64.
- El modal de nota permite editar dia y horario de `Fecha_Creacion`.
  Ese timestamp se normaliza al cargar estado y define la fecha visible
  y el orden cronologico de la nota.
- Hay seleccion multiple, mover entre cajones y gestion de etiquetas.

## Baul

El Baul es el backlog de objetivos e items accionables no agendados.

Objeto central.

- `Baul_Objetivos`

Funciones de entrada recomendadas.

- `Normalizar_Baul_Objetivo()`
- `Render_Baul()`
- `Render_Detalle_Baul()`
- `Cargar_Objetivo_En_Form_Baul()`

Relaciones importantes.

- Un item del Baul puede tener categoria, etiquetas, estado, timeline,
  descripcion y metadatos visibles.
- Puede alimentar agenda, objetivos o decisiones semanales.

## Decoteca

La Decoteca es un archivo cultural persistido por tecas. Toma el
lenguaje frontal del Baul, pero cambia la grilla a tarjetas altas y
angostas tipo caratula.

Estado actual.

- Modelo persistido en `Decoteca`, con `Tecas`, `Obras` y `Avances`.
  Las obras pueden guardar `Partes` estructuradas y `Datos_Teca`
  para totales propios de su universo.
- Cada obra separa el ciclo de consumo (`Estado`: planeada, en curso,
  terminada o abandonada) de la organizacion de biblioteca
  (`Lista`: Biblioteca, Readlist, Proximas, Wishlist, Pausadas o
  Archivo). Tambien guarda `Prioridad`, `Motivo`, `Origen` y
  `Fecha_Ingreso` para que la readlist conserve criterio historico y no
  sea solo un estado visual.
- Alta y edicion de obras desde el panel de detalle.
- Vista `Catalogo` con caratulas y vista `Readlist` con filas densas
  para decidir proximas lecturas, escuchas, visionados o partidas. La
  vista `Readlist` prioriza `Proximas`, `Readlist`, `Wishlist` y
  `Pausadas`, ordena por prioridad y fechas, y muestra motivo, origen,
  avance y restante sin obligar a abrir cada ficha.
- Vista `En curso` con filas operativas para obras activas: avance
  registrado, total, restante, porcentaje calculado desde registros,
  fecha final, ultimo avance o marca de ausencia de avances, dias sin
  tocar cuando existe historial y ritmo requerido por dia cuando hay
  fecha final.
- El panel de detalle de obra no se abre por defecto: aparece solo al
  seleccionar una obra y se oculta al tocar fuera de una obra o cambiar
  filtros, vista o teca.
- En el bloque de partes del detalle, cada parte muestra avance sobre
  total cuando existen avance registrado y total de parte, por ejemplo
  `30 de 120 pag.`. Ese dato usa peso normal y el porcentaje queda
  destacado en negrita; si falta avance o total, se muestra solo el
  dato disponible.
- Click derecho sobre una tarjeta de obra abre un menu contextual con
  `Editar` y `Borrar`, usando los mismos flujos del detalle.
- Edicion de caratula visible de cada obra: icono, texto, color, URL
  publica o archivo de imagen embebido con limite de peso.
- Creacion y edicion de tecas propias con nombre, descripcion, icono,
  color, unidad, subunidad y metrica. Esos campos definen el tipo de
  obra, la estructura interna y la unidad de avance por defecto.
- Borrado de obras con confirmacion. Borrado de tecas propias con
  confirmacion y opcion de mover sus obras a otra teca disponible o
  borrar teca y obras.
- `Bajar metadatos` aparece en la ficha seleccionada y en el alta o
  edicion de obra para Biblioteca, Musicoteca y Videoteca. Busca por
  titulo y creador cuando corresponde, y reemplaza los datos
  descriptivos de la ficha con la fuente elegida: titulo, creador,
  anio, genero, subgenero, descripcion, caratula, `Datos_Teca`,
  `Partes` y metadatos. La fuente queda guardada internamente, pero no
  se muestra como metadato principal en la ficha.
- En libros, Wikidata/Wikipedia se usa para identidad, autoria, anio y
  genero; Open Library aporta paginas, portada y descripcion cuando
  esta disponible; Lectulandia queda como complemento best-effort para
  portada y descripcion.
- Los datos bajados normalizan titulos de obras y partes con formato
  de frase, y autores/artistas/directores con formato de nombre
  propio. Los campos escritos manualmente por el usuario se conservan.
- El boton/atajo `D` de Decoteca abre un modal/cartel global de
  registro de avance, separado del panel de detalle y equivalente al
  patron visual usado para registrar avances en Metas/Planes. Puede
  abrirse desde cualquier parte principal de Semaplan, no solo dentro
  de Decoteca. Registra avances propios por teca sin mezclarlos con
  Metas. Permite elegir fecha, cantidad, nota y un item anidado del
  arbol `Teca -> Obra -> Parte`, con `+` y `-` para desplegar ramas.
  El cartel `D` no muestra resumen de periodo; queda limitado al acto
  de registrar avance rapido.
- El boton `R` de Decoteca abre el registro historico de avances en un
  modal separado. Ese registro tiene filtros por anio, teca, obra y
  parte, y permite editar o borrar registros con confirmacion sin
  mezclar el historial dentro del formulario `D`.
- Los filtros de periodo de Decoteca se generan desde fechas de
  planificacion o consumo: `Fecha_Inicio`/`Fecha_Fin` de la obra y
  registros de avance que completan o repiten consumo. El anio de
  publicacion o estreno no se usa como periodo de lectura, escucha o
  visionado.
- El filtro de periodo tiene selector de criterio: `Rango` usa el tramo
  `Fecha_Inicio`-`Fecha_Fin`, `Objetivo` usa solo `Fecha_Fin`,
  `Registros` usa todos los registros de avance y `Final` usa el
  registro de cierre o, para datos viejos sin registros, `Fecha_Fin` de
  obras terminadas. El selector recalcula las opciones de mes/anio
  disponibles y la grilla respeta esa semantica.
- La barra de filtros incluye `Lista` como dimension independiente de
  `Estado`, para distinguir archivo, readlist, proximas lecturas,
  wishlist, pausadas y obras archivadas sin alterar el estado de
  consumo.
- El editor visible de obra muestra ficha descriptiva, fechas, total y
  descripcion, mas la organizacion de lista/prioridad/motivo/origen.
  Las partes se editan en filas estructuradas dentro del sidebar
  (titulo, total, unidad y borrar/agregar), preservando el `Id` de cada
  parte existente para no romper avances historicos. El textarea crudo
  de partes queda oculto solo como compatibilidad interna. Los
  metadatos siguen sin editarse como textarea libre visible.
- Normalizacion de datos viejos y base inicial de demostracion cuando
  todavia no existe estado persistido de Decoteca.
- Las obras viejas sin campos de portada nueva siguen usando el modo
  `Emoji`; las portadas nuevas normalizan `Portada_Tipo`,
  `Portada_Url`, `Portada_Data_Url`, `Portada_Mime`,
  `Portada_Nombre` y `Portada_Tamano`.
- Los guardados de Decoteca usan el flujo de cambio critico cuando
  esta disponible, para subir al remoto sin depender del debounce
  normal.
- Boton propio `Decoteca_Boton` en el menu superior configurable.
- Modal `Decoteca_Overlay`.
- Desde la version de frontend `1.4.0`, la Decoteca con partes
  estructuradas y avances propios usa
  `Esquema_Estado_Version_Actual = 5`; versiones anteriores quedan
  limitadas a esquemas previos en el manifest.
- Desde la version de frontend `1.4.1`, el registro de Decoteca se
  presenta como modal/cartel independiente y no reemplaza el detalle de
  obra.
- Desde la version de frontend `1.4.2`, el registro de Decoteca usa la
  letra `D` y puede abrirse globalmente desde las secciones principales
  de Semaplan.
- Desde la version de frontend `1.4.3`, el cartel `D` queda limitado a
  registrar avances y el registro historico pasa al modal `R`; el
  selector de item de avance usa arbol anidado con tecas, obras y
  partes.

Tecas iniciales.

- Biblioteca: libros, capitulos, paginas, lectura y relectura.
- Musicoteca: albumes, canciones, escuchas y reescuchas.
- Videoteca: peliculas, visionados y revisionados; la duracion queda
  como dato descriptivo secundario.
- Ludoteca: juegos, sesiones y horas.

Funciones de entrada recomendadas.

- `Abrir_Decoteca()`
- `Cerrar_Decoteca()`
- `Render_Decoteca()`
- `Decoteca_Cambiar_Teca()`
- `Decoteca_Abrir_Nuevo()`
- `Decoteca_Abrir_Editar()`
- `Decoteca_Abrir_Caratula()`
- `Decoteca_Abrir_Nueva_Teca()`
- `Decoteca_Abrir_Editar_Teca()`
- `Decoteca_Guardar_Obra()`
- `Decoteca_Guardar_Caratula()`
- `Decoteca_Guardar_Teca()`
- `Decoteca_Render_Partes_Editor()`
- `Decoteca_Leer_Partes_Form()`
- `Decoteca_Bajar_Metadatos()`
- `Decoteca_Buscar_Metadatos()`
- `Decoteca_Abrir_Avance()`
- `Decoteca_Guardar_Avance()`
- `Decoteca_Abrir_Registro()`
- `Decoteca_Render_Modal_Registro()`
- `Decoteca_Cerrar_Registro()`
- `Decoteca_Editar_Avance()`
- `Decoteca_Borrar_Avance()`
- `Decoteca_Borrar_Obra()`
- `Decoteca_Borrar_Teca()`
- `Normalizar_Decoteca()`

Relaciones importantes.

- Cada teca debe poder tener universo, campos y reglas propias.
- Las obras muestran caratula, estado, periodo de consumo, avance
  calculado, repeticiones, metadatos relevantes y subpartes.
- `Decoteca` entra en `Construir_Estado_Completo()`, `Cargar_Estado()`,
  `Normalizar_Estado()`, sync remoto e import/export como clave raiz
  normal del estado.

## Metas

Las metas son un sistema resumido de seguimiento por fuente.

Objeto central.

- `Metas`

Modelo basico de meta normalizada.

- `Id`
- `Nombre`
- `Horas_Objetivo`
- `Periodo`
- `Semana_Ref` o `Mes_Ref`
- `Fecha_Desde`
- `Fecha_Hasta`
- `Fuente_Tipo`
- `Fuente_Valor`
- `Fuente_Clave`
- `Archivada`

Funciones de entrada recomendadas.

- `Normalizar_Meta()`
- `Render_Metas()`
- `Cargar_Meta_En_Form()`

Relaciones importantes.

- Las metas resumen progreso por categoria, etiqueta u objetivo.
- Cambios en agenda y objetivos pueden cambiar indirectamente sus
  calculos y mensajes.
- En bloques vinculados a metas de planes por periodo, el aporte por
  bloque separa el aporte real del aporte sugerido. El contador muestra
  `Aporte a la meta: X (Y sugeridos)`, donde `X` suma el aporte general
  y los aportes de partes seleccionadas, e `Y` se calcula de forma
  proporcional a la duracion real del bloque cuando el objetivo tiene
  horas semanales. El aporte general arranca en cero, usa el mismo
  estilo que las partes y solo se registra si el usuario lo tilda y le
  asigna cantidad.
- Las metas sugeridas arrancan destildadas por defecto. El usuario debe
  marcar explicitamente que filas importar, incluso cuando el sistema ya
  calcule aporte, horas y partes sugeridas.
- En `Metas sugeridas`, un subobjetivo solo entra al listado si tiene
  fecha explicita propia y su rango cruza la semana visible. Los
  subobjetivos sin fecha explicita quedan fuera aunque tengan partes con
  fecha.

## Planes semanales

Este modulo guarda un snapshot del plan base de una semana y permite
compararlo con el estado actual.

Objeto central.

- `Planes_Semana`

Funciones de entrada recomendadas.

- `Obtener_Plan_Semana()`
- `Snapshot_Eventos_Semana()`
- `Calcular_Diff_Plan()`
- `Fijar_Plan_Semana()`
- `Cerrar_Plan_Semana()`
- `Render_Plan()`
- `Render_Planear()`
- `Render_Cerrar_Semana()`
- `Render_Historial_Planes()`

Relaciones importantes.

- El plan semanal depende de `Eventos`.
- Tiene nota inicial, nota de cierre, refijadas e historial.
- Cerrar semana puede disparar rollover hacia Baul o movimiento de
  eventos.

## Planes por periodos

Es el sistema jerarquico mas grande de la app.

Objeto central.

- `Planes_Periodo`

Subestructuras centrales.

- `Periodos`
- `Objetivos`
- `Subobjetivos`
- `Partes`
- `Avances`
- `UI`

Funciones de entrada recomendadas.

- `Planes_Modelo_Base()`
- `Normalizar_Modelo_Planes()`
- `Normalizar_Periodo_Plan()`
- `Normalizar_Objetivo_Plan()`
- `Normalizar_Subobjetivo_Plan()`
- `Normalizar_Parte_Meta()`
- `Render_Planner_Periodos()`
- `Render_Planes_Contenido()`
- `Render_Planes_Objetivo()`
- `Render_Modal_Planes_Subobjetivos()`
- `Render_Modal_Planes_Partes()`
- `Render_Modal_Planes_Registro()`

Relaciones importantes.

- Un objetivo puede pertenecer a un periodo y a la vez colgar de otro
  objetivo padre.
- Un subobjetivo puede tener partes.
- Los menus de subobjetivos y partes permiten duplicar. El duplicado de
  subobjetivo clona su rama y el duplicado de parte crea una copia
  pendiente junto a la original, sin avances ni fecha/hora de cierre, y
  recalcula targets cuando el subobjetivo suma componentes.
- Objetivos, subobjetivos y partes pueden vincular habitos.
- El modal de registrar avance usa un selector visual en arbol: agrupa
  por anio, objetivo, subobjetivo y parte. Los nodos con boton `+`
  siguen siendo seleccionables; el boton solo abre o cierra la rama. Al
  abrir una rama se cierran sus hermanos del mismo nivel y la expansion
  queda recordada localmente para la proxima apertura con `M`.
- La descripcion de un periodo en Metas se muestra contraida cuando ya
  tiene texto. El boton propio de expansion solo contrae o expande; el
  click en el cuerpo de la descripcion sigue abriendo la edicion.
- Los avances recalculan progreso y pueden afectar vistas, estados y
  metricas.

## Configuracion, backups e import/export

La configuracion no es decorativa: cambia comportamiento real de la
app.

Areas importantes.

- visibilidad de dias y horas
- memoria manual de dias y bloques horarios visibles de la semana
  actual, persistida en `Config_Extra` sin convertirla en default
  automatico global
- al navegar de semana, los filtros manuales de la semana actual se
  conservan en su memoria dedicada; los filtros manuales de semanas no
  actuales son transitorios por semana y no deben pisar esa memoria
- filtros automaticos
- vista automatica de horario con tres modos (`Completo`, `Enfocar`
  y `Por bloques`), limitada a la semana actual y siempre por debajo
  de los filtros manuales del encabezado
- comportamiento de habitos en sidebar
- colores y modos de UI
- datos de cuenta y tokens de integracion IA read-only
- backups locales
- import/export completo
- selector de versiones del frontend

Funciones de entrada recomendadas.

- `Renderizar_Datos_Cuenta()`
- `Cargar_Tokens_IA_Cuenta()`
- `Crear_Token_IA_Cuenta()`
- `Renombrar_Token_IA_Cuenta()`
- `Revocar_Token_IA_Cuenta()`
- `Eliminar_Token_IA_Cuenta()`
- `Render_Config_Backups()`
- `Cargar_Backups_Locales()`
- `Aplicar_Importacion_Objeto()`
- `Render_Config_Versiones_Programa()`
- `Cargar_Registro_Versiones_Programa()`

Notas operativas de este bloque.

- Los tokens IA se generan en cliente y solo se guarda `token_hash`
  en `tokens_ia_usuario`.
- El token plano se muestra una sola vez en la UI de Cuenta y no debe
  persistirse en estado ni en `localStorage`.
- La UI de Cuenta permite renombrar tokens, revocarlos y eliminar del
  historial visible los que ya fueron revocados, sin recuperar nunca el
  valor plano.
- Si el entorno remoto todavia no tiene la tabla
  `tokens_ia_usuario`, la UI debe degradar con mensaje claro y sin
  intentar crear tokens.

## Orden sugerido de lectura cuando haya que tocar algo

1. Leer `Reglas_Operativas_Semaplan.md`.
2. Leer este archivo para ubicar el subsistema correcto.
3. Buscar la funcion normalizadora de ese subsistema.
4. Buscar sus renders principales.
5. Revisar `Construir_Estado_Completo()`, `Cargar_Estado()` y
   `Guardar_Estado()` si el cambio toca persistencia o sync.

## Cuando actualizar este documento

Actualizar este archivo en el mismo turno cuando haya alguno de estos
cambios.

- nueva pantalla o modulo operativo;
- cambio en flujos visibles importantes;
- cambio en claves persistidas o relaciones entre modulos;
- cambio en carga, guardado, import/export o sync;
- cambio que vuelva engañoso este panorama funcional.

Si el cambio es solo estetico o microcopy puro y no altera flujos ni
estado, no hace falta tocar este archivo.
