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

## Convenciones de código

Seguir el estilo global del proyecto:

- Pascal_Snake_Case para todo (variables, funciones, clases CSS, IDs).
- Todo en español.
- Sin librerías externas.
- Líneas ≤ 70 caracteres.
- Toda función nueva, texto nuevo o cambio visible en UI debe quedar
  traducido en todos los idiomas disponibles en la app en ese momento,
  dentro del mismo turno.
- No dejar textos hardcodeados en una sola lengua para "después".

## Comunicación

La fórmula `Entendí que...` se usa solo al iniciar una tarea nueva,
cuando el agente va a ponerse a ejecutar algo.

No usar `Entendí que...` en estos casos:

- cuando el usuario hace una pregunta y no está encargando una tarea;
- cuando el agente solo responde una duda o aclara una regla;
- cuando el agente solo notifica avance de algo ya iniciado.

Si el usuario da una instrucción explícita y ejecutable, el agente debe
actuar sin pedir confirmación previa. Solo corresponde frenar para
preguntar cuando haya ambigüedad material, impacto destructivo o un
riesgo no obvio que pueda cambiar la decisión.

## Flujo de trabajo por sesión

Al arrancar cada sesión, distinguir cuál de estos dos procedimientos
corresponde según el pedido del usuario.

### Reglas comunes para Playwright

1. Elegir la cuenta según el pedido:
   `patricioe.nogueroles@gmail.com` para próximas tareas;
   `tomashodel@gmail.com` para test de funciones.
2. Leer la contraseña correspondiente en `Credenciales.txt`.
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

### Procedimiento 1: próximas tareas

Usar este procedimiento cuando el pedido sea leer próximas tareas,
agregar nuevas tareas notificadas por chat, o eliminar/editar tareas ya
realizadas.

1. Ir a `Archivero` -> cajón `Semaplan`.
2. Tomar ese cajón como fuente de verdad para próximas tareas.
3. Si hay ítems ahí, preguntarle al usuario si quiere avanzar alguno,
   además de lo que haya pedido explícitamente en el chat.
4. Cuando el usuario pida revisar próximas tareas, usar siempre
   `Semaplan.com` -> `Archivero` -> cajón `Semaplan`.

### Procedimiento 2: test de funciones

Usar este procedimiento cuando el pedido sea probar o testear funciones
de Semaplan con Playwright/Codex.

1. Ejecutar la prueba pedida con Playwright/Codex.
2. Validar el resultado en la UI y, si corresponde, también tras
   recargar para confirmar persistencia real.

### Git después de cada cambio

1. Después de cada cambio funcional o cambio de instrucciones ya
   resuelto en esta sesión, commitear y pushear sin esperar al final
   de la sesión ni a que el usuario lo pida explícitamente.
2. Regla operativa de git: cada `commit` debe ir seguido en ese mismo
   flujo por su `push`. No dejar commits locales pendientes salvo que
   el usuario lo pida explícitamente.
3. Regla permanente: no cortar el flujo en `commit` dejando el
   `push` para después.

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
