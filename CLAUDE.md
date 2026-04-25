# Semaplan - CLAUDE.md

## Dominio y hosting

El dominio de producción es **semaplan.com** (registrado en
Namecheap). El sitio se sirve desde GitHub Pages:
`https://francorogoyin.github.io/Semaplan`

El dominio también está configurado en Cloudflare (DNS, CDN,
y Turnstile para CAPTCHA en el login).

## Estructura del proyecto

La aplicación corre en `index.html`. Es un proyecto sin build y con
lógica inline, así que los cambios principales suelen concentrarse ahí.

Rutas operativas principales:

- `Aplicaciones/Android`
- `Aplicaciones/Desktop`
- `Aplicaciones/Web_Versiones`
- `Documentacion/Planes`
- `Documentacion/Registros`
- `Herramientas/Scripts`
- `Pruebas/Tests`
- `Local/Credenciales.txt`
- `supabase/Supabase_Schema.sql`

## Versionado de releases

- El documento maestro para este tema es
  `Documentacion/Planes/Arquitectura_Versiones_Aplicacion.txt`.
- El registro de releases publicados vive en
  `Aplicaciones/Web_Versiones/Manifest_Versiones.json`.
- Cada release congelado debe publicarse como
  `Semaplan_Version_X_Y_Z.html` en la raíz.
- `index.html` debe quedar como entrypoint de la versión más nueva.
- `Version_Programa_Actual` es la versión del frontend.
- `Esquema_Estado_Version` es la versión del formato de datos.
- `Sync_Remoto_Version_Actual` es un contador técnico de sync y no
  debe tratarse como versión de producto.

### Procedimiento breve para nueva versión

1. Definir el semver nuevo (`major`, `minor` o `patch`).
2. Revisar si cambia `Esquema_Estado_Version`.
3. Congelar el release copiando `index.html` a
   `Semaplan_Version_X_Y_Z.html`.
4. Agregar o actualizar la entrada correspondiente en
   `Aplicaciones/Web_Versiones/Manifest_Versiones.json`.
5. Verificar que el selector de Configuración muestre y abra esa
   versión.
6. No habilitar una versión vieja en el selector si ya no soporta el
   esquema de datos actual.

## Reordenamiento de estructura

- Usar Pascal_Snake_Case, palabras completas y español
  para carpetas y archivos siempre que el ecosistema no
  imponga otro nombre.
- Preservar nombres exigidos por herramientas o terceros,
  por ejemplo `package.json`, `package-lock.json`,
  `.gitignore`, `node_modules`, `playwright.config.js`,
  `supabase`, `CNAME`, `README.md`, `AGENTS.md` y
  `CLAUDE.md`.
- Mantener en raíz los entrypoints y configs públicas
  salvo razón fuerte para moverlos: `index.html`,
  `Semaplan.html`, `CNAME`, `package.json`,
  `package-lock.json`, `playwright.config.js`,
  `.gitignore`, `README.md`, `AGENTS.md` y `CLAUDE.md`.
- Agrupar por dominios claros: `Aplicaciones`,
  `Documentacion`, `Herramientas`, `Pruebas` y `Local`.
- Antes de mover, revisar referencias en scripts,
  documentación, pruebas, empaquetado, hosting y assets.
- Al mover, actualizar referencias dentro del mismo turno.

## Convenciones de codigo

Antes de tocar frontend, modales, guardado o UX, leer
`Documentacion/Planes/Funcionamiento_Semaplan.md`. Ese archivo es la
fuente base para reglas de funcionamiento y estilo.

## Regla UX de seleccion multiple

Seguir `Documentacion/Planes/Funcionamiento_Semaplan.md`.

## Comunicación

La fórmula `Entendí que...` se usa solo al iniciar un objetivo nueva,
cuando el agente va a ponerse a ejecutar algo.

No usar `Entendí que...` en estos casos:

- cuando el usuario hace una pregunta y no está encargando un objetivo;
- cuando el agente solo responde una duda o aclara una regla;
- cuando el agente solo notifica avance de algo ya iniciado.

Si el usuario da una instrucción explícita y ejecutable, el agente debe
actuar sin pedir confirmación previa. Solo corresponde frenar para
preguntar cuando haya ambigüedad material, impacto destructivo o un
riesgo no obvio que pueda cambiar la decisión.

Si el usuario pide actualizar `AGENTS.md` o `CLAUDE.md`, actualizar
siempre ambos archivos aunque solo nombre uno de los dos.

Toda fecha u hora escrita por el agente debe usar hora local de
Argentina (`America/Buenos_Aires`). Esto incluye
`Documentacion/Registros/Registro_Avance.txt`.

## Flujo de trabajo por sesión

### Verificacion inicial de remoto

Antes de iniciar cualquier cambio, hacer una verificacion rapida
contra remoto: revisar `git status`, actualizar referencias de
`origin` y comprobar si la rama activa esta detras de su upstream.
Si hay commits remotos pendientes, hacer `pull --rebase` antes de
editar. Si existen cambios locales no commiteados o riesgo de
conflicto, frenar y ordenar el estado de git antes de avanzar. Esta
comprobacion busca evitar trabajar sobre una base vieja y pisar
cambios hechos desde otra computadora o sesion.

Al arrancar cada sesión, distinguir cuál de estos dos procedimientos
corresponde según el pedido del usuario.

### Reglas comunes para Playwright

1. Elegir la cuenta según el pedido:
   `patricioe.nogueroles@gmail.com` para próximas objetivos;
   `tomashodel@gmail.com` para test de funciones.
2. Leer la contraseña correspondiente en
   `Local/Credenciales.txt`.
3. Entrar a `Semaplan.com` con Playwright.
4. Primero intentar con una sesión existente de Playwright o Chrome.
5. Si no alcanza y hace falta bypass local de UI, setear
   `localStorage["Semaplan_QA_Sin_Captcha"] = "1"` y recargar.
6. Recordar que ese flag solo evita la exigencia de CAPTCHA en el
   frontend. Si Supabase Auth sigue exigiendo CAPTCHA, también hay
   que desactivarlo temporalmente en la configuración hospedada:
   Dashboard del proyecto -> `Authentication` -> `Settings` ->
   `Bot and Abuse Protection` -> desactivar
   `Enable CAPTCHA protection` y guardar. Reactivarlo al
   terminar la prueba.
7. Cuando termine la prueba, remover el flag local si ya no hace
   falta: `localStorage.removeItem("Semaplan_QA_Sin_Captcha")`.

### Notas operativas para Playwright

1. Si la sesión existente pertenece a otra cuenta, hacer `signOut`
   local antes de loguear la cuenta correcta.
2. No leer, agregar, editar ni borrar en la app hasta que la
   inicialización haya terminado.
3. Referencia práctica de inicialización lista: `Semana_Actual`
   existente y `Cargando_Inicial === false`.
4. Después de cambios que deban persistir en Supabase, esperar a que
   la sincronización termine antes de recargar o cerrar el paso.
5. Referencia práctica de sincronización completa:
   `Sync_Estado === "Guardado"` y
   `Hay_Sync_Pendiente() === false`.
6. Al buscar, editar o borrar notas del Archivero por texto, comparar
   con texto normalizado y no depender de acentos o codificación.
7. Si se agregan etiquetas en notas del Archivero, escribirlas con la
   primera palabra en mayúscula.
8. Si la nota corresponde a un objetivo pospuesta, usar la etiqueta
   `Pospuesta`.
9. Cuando una sesión deje una regla operativa útil para el futuro,
   registrar la regla en esta sección de notas operativas y no el
   relato detallado de cómo se llegó a ella. Priorizar instrucciones
   reutilizables y evitar historial de prueba y error que no aporte
   decisión operativa.
10. Si Playwright no puede abrir el perfil de navegador en uso para
    leer o editar `Semaplan.com`, usar una copia temporal del perfil y
    no trabajar sobre el perfil real bloqueado.
11. Si se usa una sesión clonada para consultar la fuente viva de
    `Semaplan.com`, limpiar antes `Semaplan_Estado_V2` y
    `Time_Blocking_Estado_V2` en esa sesión temporal para forzar carga
    desde Supabase y evitar que `localStorage` viejo falsee el estado
    remoto.
12. Si Playwright o Chromium fallan por bloqueo de sandbox o permisos,
    pedir escalado enseguida y no repetir intentos inútiles dentro del
    sandbox.
13. Al cargar partes de lectura desde un PDF en Semaplan, no dejar
    nombres en mayúsculas sostenidas salvo siglas o casos editoriales
    inevitables. Normalizar a capitalización legible y, si el PDF
    organiza capítulos bajo partes mayores, incluir el nombre de la
    parte padre en cada título, por ejemplo
    `Disciplina I. Los cuerpos dóciles`, para que `I`, `II` o `III`
    no queden ambiguos.

### Procedimiento 1: próximas objetivos

Usar este procedimiento cuando el pedido sea leer próximas objetivos,
agregar nuevas objetivos notificadas por chat, o eliminar/editar objetivos ya
realizadas.

1. Ir a `Archivero` -> cajón `Semaplan`.
2. Tomar ese cajón como fuente de verdad para próximas objetivos.
3. Si hay ítems ahí, preguntarle al usuario si quiere avanzar alguno,
   además de lo que haya pedido explícitamente en el chat.
4. Cuando el usuario pida revisar próximas objetivos, usar siempre
   `Semaplan.com` -> `Archivero` -> cajón `Semaplan`.
5. Si el usuario lo pide, agregar nuevas notas en ese cajón.
6. Cuando Codex agregue un objetivo normal en ese cajón, usar la
   etiqueta `Inmediata`.
7. Si el usuario lo pide, editar notas existentes en ese cajón.
8. Si el usuario lo pide, borrar notas existentes en ese cajón.
9. Las próximas objetivos a leer son siempre las notas de ese cajón
   que tengan la etiqueta `Inmediata`.
10. Si un objetivo de ese cajón fue realizada por el agente, borrar la
   nota del Archivero y dejar registro con fecha y hora en
   `Documentacion/Registros/Registro_Avance.txt`,
   basándose en la plantilla de ese archivo. Ese registro
   se agrega siempre al comienzo, una vez terminada el
   objetivo.
11. Verificar que los registros estén ordenados por fecha y hora,
   colocándose los nuevos primero. Si no están ordenados, ordenarlos.

### Procedimiento 2: test de funciones

Usar este procedimiento cuando el pedido sea probar o testear funciones
de Semaplan con Playwright/Codex.

1. Ejecutar la prueba pedida con Playwright/Codex.
2. Validar el resultado en la UI y, si corresponde, también tras
   recargar para confirmar persistencia real.

### Registro de avance de mejoras

Cada vez que se complete una mejora, cambio funcional o cambio de
instrucciones, agregar un resumen breve al comienzo de
`Documentacion/Registros/Registro_Avance.txt`, usando la plantilla del
archivo y hora local de Argentina (`America/Buenos_Aires`). El registro
debe quedar antes de los registros anteriores.

### Control de cierre de avances

Antes de dar por cerrado cualquier avance, hacer una revision critica
breve despues de implementar y probar. La pregunta guia es: "Ademas
del caso pedido, falta cubrir alguna variante razonable, caso borde,
flujo vecino o efecto colateral?".

La revision debe considerar, segun aplique: estados vacios, edicion,
borrado, deshacer, persistencia tras recargar, sync, mobile/desktop,
menus contextuales, permisos, traducciones, datos viejos y relacion con
funciones cercanas. Si aparece una omision concreta y razonable, volver
al codigo y resolverla antes de registrar, commitear y pushear. Si no
aparece nada relevante, no inventar trabajo extra: registrar solo que
el avance quedo validado con pruebas y revision de variantes.

### Regla general de funcionamiento

Seguir `Documentacion/Planes/Funcionamiento_Semaplan.md` como
referencia general de funcionamiento de la pagina. No tratarlo como
un documento limitado al guardado: tambien define reglas de UX,
modales, seleccion multiple, comportamiento visible, estilo operativo y
criterios de consistencia entre flujos.

### Git después de cada cambio

1. Antes de cerrar un cambio funcional, validarlo con Playwright sobre
   el flujo afectado, sea cambio, agregado, edición o borrado.
2. Después de cada cambio funcional o cambio de instrucciones ya
   resuelto en esta sesión, commitear y pushear sin esperar al final
   de la sesión ni a que el usuario lo pida explícitamente.
3. Regla operativa de git: cada `commit` debe ir seguido en ese mismo
   flujo por su `push`. No dejar commits locales pendientes salvo que
   el usuario lo pida explícitamente.
4. Regla permanente: no cortar el flujo en `commit` dejando el
   `push` para después.
5. Si en una misma sesión se resuelven varias funcionalidades
   independientes, hacer un `commit` y `push` separado por cada
   funcionalidad. No agrupar varias funcionalidades resueltas en un
   solo commit.
6. Si `git add`, `git commit` o acciones sobre `.git` fallan por
   sandbox, permisos o `index.lock`, escalar de inmediato y no seguir
   probando la misma operación dentro del sandbox.

### Regla de deploy pre lanzamiento

- Si el cambio toca Auth, sync, Edge Functions, import/export,
  ayuda o cualquier flujo de guardado, correr tambien el smoke de
  produccion antes de darlo por cerrado.
- Comando base: `npm run test:smoke:prod`
- Flujos de alto riesgo que siempre requieren chequeo explicito:
  login, sync, import/export, eliminar cuenta, suscripcion y ayuda
  por mail.

## Sesiones paralelas y staging de commits

Es habitual que el usuario tenga varias sesiones de Claude/Codex
trabajando sobre este repo a la vez. Para evitar que una sesión
arrastre el trabajo de otra dentro de un commit con mensaje
equivocado:

- **Nunca** usar `git add -A`, `git add .` ni `git commit -a`.
- Stagear siempre archivos puntuales por nombre
  (`git add Semaplan.html CLAUDE.md`).
- Si al revisar `git status` aparecen cambios en archivos que
  esta sesión no tocó, no incluirlos en el commit: probablemente
  son de otra sesión paralela y le corresponden a ella commitearlos
  con su propio mensaje.


