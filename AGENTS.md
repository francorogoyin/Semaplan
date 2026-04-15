# Semaplan - AGENTS.md

## Dominio y hosting

El dominio de producciÃ³n es **semaplan.com** (registrado en
Namecheap). El sitio se sirve desde GitHub Pages:
`https://francorogoyin.github.io/Semaplan`

El dominio tambiÃ©n estÃ¡ configurado en Cloudflare (DNS, CDN,
y Turnstile para CAPTCHA en el login).

## Estructura del proyecto

La aplicaciÃ³n corre en `index.html`. Es un proyecto sin build y con
lÃ³gica inline, asÃ­ que los cambios principales suelen concentrarse ahÃ­.

## Convenciones de cÃ³digo

Seguir el estilo global del proyecto:

- Pascal_Snake_Case para todo (variables, funciones, clases CSS, IDs).
- Todo en espaÃ±ol.
- Sin librerÃ­as externas.
- LÃ­neas â‰¤ 70 caracteres.
- Toda funciÃ³n nueva, texto nuevo o cambio visible en UI debe quedar
  traducido en todos los idiomas disponibles en la app en ese momento,
  dentro del mismo turno.
- No dejar textos hardcodeados en una sola lengua para "despuÃ©s".

## ComunicaciÃ³n

La fÃ³rmula `EntendÃ­ que...` se usa solo al iniciar un objetivo nueva,
cuando el agente va a ponerse a ejecutar algo.

No usar `EntendÃ­ que...` en estos casos:

- cuando el usuario hace una pregunta y no estÃ¡ encargando un objetivo;
- cuando el agente solo responde una duda o aclara una regla;
- cuando el agente solo notifica avance de algo ya iniciado.

Si el usuario da una instrucciÃ³n explÃ­cita y ejecutable, el agente debe
actuar sin pedir confirmaciÃ³n previa. Solo corresponde frenar para
preguntar cuando haya ambigÃ¼edad material, impacto destructivo o un
riesgo no obvio que pueda cambiar la decisiÃ³n.

Si el usuario pide actualizar `AGENTS.md` o `CLAUDE.md`, actualizar
siempre ambos archivos aunque solo nombre uno de los dos.

Toda fecha u hora escrita por el agente debe usar hora local de
Argentina (`America/Buenos_Aires`). Esto incluye
`Registro_Avance.txt`.

## Flujo de trabajo por sesiÃ³n

Al arrancar cada sesiÃ³n, distinguir cuÃ¡l de estos dos procedimientos
corresponde segÃºn el pedido del usuario.

### Reglas comunes para Playwright

1. Elegir la cuenta segÃºn el pedido:
   `patricioe.nogueroles@gmail.com` para prÃ³ximas objetivos;
   `tomashodel@gmail.com` para test de funciones.
2. Leer la contraseÃ±a correspondiente en `Credenciales.txt`.
3. Entrar a `Semaplan.com` con Playwright.
4. Primero intentar con una sesiÃ³n existente de Playwright o Chrome.
5. Si no alcanza y hace falta bypass local de UI, setear
   `localStorage["Semaplan_QA_Sin_Captcha"] = "1"` y recargar.
6. Recordar que ese flag solo evita la exigencia de CAPTCHA en el
   frontend. Si Supabase Auth sigue exigiendo CAPTCHA, tambiÃ©n hay
   que desactivarlo temporalmente en la configuraciÃ³n hospedada:
   Dashboard del proyecto -> `Authentication` -> `Settings` ->
   `Bot and Abuse Protection` -> desactivar
   `Enable CAPTCHA protection` y guardar. Reactivarlo al
   terminar la prueba.
7. Cuando termine la prueba, remover el flag local si ya no hace
   falta: `localStorage.removeItem("Semaplan_QA_Sin_Captcha")`.

### Notas operativas para Playwright

1. Si la sesiÃ³n existente pertenece a otra cuenta, hacer `signOut`
   local antes de loguear la cuenta correcta.
2. No leer, agregar, editar ni borrar en la app hasta que la
   inicializaciÃ³n haya terminado.
3. Referencia prÃ¡ctica de inicializaciÃ³n lista: `Semana_Actual`
   existente y `Cargando_Inicial === false`.
4. DespuÃ©s de cambios que deban persistir en Supabase, esperar a que
   la sincronizaciÃ³n termine antes de recargar o cerrar el paso.
5. Referencia prÃ¡ctica de sincronizaciÃ³n completa:
   `Sync_Estado === "Guardado"` y
   `Hay_Sync_Pendiente() === false`.
6. Al buscar, editar o borrar notas del Archivero por texto, comparar
   con texto normalizado y no depender de acentos o codificaciÃ³n.
7. Si se agregan etiquetas en notas del Archivero, escribirlas con la
   primera palabra en mayÃºscula.
8. Si la nota corresponde a un objetivo pospuesta, usar la etiqueta
   `Pospuesta`.
9. Cuando una sesiÃ³n deje una regla operativa Ãºtil para el futuro,
   registrar la regla en esta secciÃ³n de notas operativas y no el
   relato detallado de cÃ³mo se llegÃ³ a ella. Priorizar instrucciones
   reutilizables y evitar historial de prueba y error que no aporte
   decisiÃ³n operativa.
10. Si Playwright no puede abrir el perfil de navegador en uso para
    leer o editar `Semaplan.com`, usar una copia temporal del perfil y
    no trabajar sobre el perfil real bloqueado.
11. Si se usa una sesiÃ³n clonada para consultar la fuente viva de
    `Semaplan.com`, limpiar antes `Semaplan_Estado_V2` y
    `Time_Blocking_Estado_V2` en esa sesiÃ³n temporal para forzar carga
    desde Supabase y evitar que `localStorage` viejo falsee el estado
    remoto.
12. Si Playwright o Chromium fallan por bloqueo de sandbox o permisos,
    pedir escalado enseguida y no repetir intentos inÃºtiles dentro del
    sandbox.

### Procedimiento 1: prÃ³ximas objetivos

Usar este procedimiento cuando el pedido sea leer prÃ³ximas objetivos,
agregar nuevas objetivos notificadas por chat, o eliminar/editar objetivos ya
realizadas.

1. Ir a `Archivero` -> cajÃ³n `Semaplan`.
2. Tomar ese cajÃ³n como fuente de verdad para prÃ³ximas objetivos.
3. Si hay Ã­tems ahÃ­, preguntarle al usuario si quiere avanzar alguno,
   ademÃ¡s de lo que haya pedido explÃ­citamente en el chat.
4. Cuando el usuario pida revisar prÃ³ximas objetivos, usar siempre
   `Semaplan.com` -> `Archivero` -> cajÃ³n `Semaplan`.
5. Si el usuario lo pide, agregar nuevas notas en ese cajÃ³n.
6. Cuando Codex agregue un objetivo normal en ese cajÃ³n, usar la
   etiqueta `Inmediata`.
7. Si el usuario lo pide, editar notas existentes en ese cajÃ³n.
8. Si el usuario lo pide, borrar notas existentes en ese cajÃ³n.
9. Las prÃ³ximas objetivos a leer son siempre las notas de ese cajÃ³n
   que tengan la etiqueta `Inmediata`.
10. Si un objetivo de ese cajÃ³n fue realizada por el agente, borrar la
   nota del Archivero y dejar registro con fecha y hora en
   `Registro_Avance.txt`, basÃ¡ndose en la plantilla de ese archivo. Ese
   registro se agrega siempre al comienzo, una vez terminada el objetivo.
11. Verificar que los registros estÃ©n ordenados por fecha y hora,
   colocÃ¡ndose los nuevos primero. Si no estÃ¡n ordenados, ordenarlos.

### Procedimiento 2: test de funciones

Usar este procedimiento cuando el pedido sea probar o testear funciones
de Semaplan con Playwright/Codex.

1. Ejecutar la prueba pedida con Playwright/Codex.
2. Validar el resultado en la UI y, si corresponde, tambiÃ©n tras
   recargar para confirmar persistencia real.

### Git despuÃ©s de cada cambio

1. Antes de cerrar un cambio funcional, validarlo con Playwright sobre
   el flujo afectado, sea cambio, agregado, ediciÃ³n o borrado.
2. DespuÃ©s de cada cambio funcional o cambio de instrucciones ya
   resuelto en esta sesiÃ³n, commitear y pushear sin esperar al final
   de la sesiÃ³n ni a que el usuario lo pida explÃ­citamente.
3. Regla operativa de git: cada `commit` debe ir seguido en ese mismo
   flujo por su `push`. No dejar commits locales pendientes salvo que
   el usuario lo pida explÃ­citamente.
4. Regla permanente: no cortar el flujo en `commit` dejando el
   `push` para despuÃ©s.
5. Si en una misma sesiÃ³n se resuelven varias funcionalidades
   independientes, hacer un `commit` y `push` separado por cada
   funcionalidad. No agrupar varias funcionalidades resueltas en un
   solo commit.
6. Si `git add`, `git commit` o acciones sobre `.git` fallan por
   sandbox, permisos o `index.lock`, escalar de inmediato y no seguir
   probando la misma operaciÃ³n dentro del sandbox.

## Sesiones paralelas y staging de commits

Es habitual que el usuario tenga varias sesiones de Claude/Codex
trabajando sobre este repo a la vez. Para evitar que una sesiÃ³n
arrastre el trabajo de otra dentro de un commit con mensaje
equivocado:

- **Nunca** usar `git add -A`, `git add .` ni `git commit -a`.
- Stagear siempre archivos puntuales por nombre
  (`git add Semaplan.html AGENTS.md`).
- Si al revisar `git status` aparecen cambios en archivos que
  esta sesiÃ³n no tocÃ³, no incluirlos en el commit: probablemente
  son de otra sesiÃ³n paralela y le corresponden a ella commitearlos
  con su propio mensaje.


