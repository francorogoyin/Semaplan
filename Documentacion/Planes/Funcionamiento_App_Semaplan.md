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
  `/functions/v1/semaplan-ai-mcp/mcp`, y reenvia cada tool de lectura
  al gateway `semaplan-ai` reutilizando `Authorization` OAuth o
  `X-Semaplan-AI-Token`.
- `Herramientas/Scripts/semaplan-ai-mcp-server.js`: puente MCP local
  por `stdio` que expone herramientas para Claude y las reenvia al
  gateway `semaplan-ai`, sin leer Supabase directo.
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
- Archivero para notas, etiquetas y adjuntos.
- Baul como backlog de objetivos e ideas accionables.
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
- `Archiveros`
- `Notas_Archivero`
- `Etiquetas_Archivero`
- `Patrones`
- `Habitos`
- `Habitos_Registros`
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
7. `Backend_Sync_Ejecutar()` sube el estado a `estado_usuario`,
   con manejo de versionado, conflictos y reintentos.
8. La carga inicial ya no registra una `Sesiones_Operativas` propia ni
   mantiene heartbeat remoto por pestana. Esto evita escrituras
   periodicas que solo cambian metadata y acelera la recarga normal de
   una unica pantalla.
9. `Sesiones_Operativas` queda como metadata operativa/legacy para
   cortes globales y compatibilidad con estados previos, pero no forma
   parte del estado normal generado por `Construir_Estado_Completo()`
   ni se escribe por actividad pasiva de una pestana.
10. `Sync_Datos_Marca_Ms` marca cambios reales de datos generados por
   `Guardar_Estado()`. La metadata de sesiones no actualiza esa marca.
11. Si al iniciar hay cambios locales pendientes, la app no decide
   conflicto por `actualizado_en` remoto solamente. Solo abre
   conflicto si el estado remoto trae una marca de datos reales mas
   nueva que la local. Si el cambio remoto fue operativo o no tiene
   marca de datos mas nueva, el cache local pendiente se sincroniza.
12. La metadata operativa de sesiones (`Sesiones_Operativas` y
   `Sesion_Global_Corte_Ms`) no se trata como cambio de datos del
   usuario. Si el remoto cambio solo por metadata operativa, no se muestra
   conflicto ni toast de otro dispositivo. Antes de sobrescribir remoto,
   `Backend_Sync_Ejecutar()` relee la fila: si cambiaron datos reales
   con marca mas nueva abre conflicto; si el remoto no requiere
   conflicto, refresca version y reintenta el guardado aunque el
   `UPDATE` versionado haya perdido contra otra escritura reciente.
13. No hay heartbeat ni polling remoto permanente por defecto. La app
   revisa cambios remotos al volver al foco/visibilidad o por eventos
   locales de sync, sin marcar `Guardando` si no hay cambios propios.
14. `Hay_Sync_Pendiente()` representa trabajo real pendiente
   (timer, reintento o promesa en curso) y no solamente el texto
   visible `Guardando`. Si la UI queda en `Guardando` sin tarea activa,
   `Resolver_Sync_Guardando_Inactivo()` la normaliza a `Guardado`,
   reintento o `Error` segun haya datos locales sucios o conflicto.
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
- En Resumen > Metas un objetivo solo se incluye si su periodo solapa el
  rango visible, si tuvo avance dentro de ese rango o si su target
  contextual para ese rango es mayor a cero. Los objetivos de otros
  periodos no deben aparecer solo por tener avance acumulado global.

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
- En el modal de plan de slot, `Habitos sugeridos` muestra los
  habitos diarios solo cuando coinciden con el dia y la hora del slot.
  Los habitos semanales, quincenales y mensuales pendientes se sugieren
  dentro del periodo aunque su programacion tenga dias u horarios
  preferidos; dejan de aparecer cuando el periodo queda completo. La
  lista sugerida se ordena por periodo: diarios, semanales,
  quincenales y mensuales; y dentro de cada periodo por tipo: Check,
  Cantidad, Tiempo y Evitar.

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
- Objetivos, subobjetivos y partes pueden vincular habitos.
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
- filtros automaticos
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
