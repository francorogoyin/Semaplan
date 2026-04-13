# Semaplan — CLAUDE.md

## Dominio y hosting

El dominio de producción es **semaplan.com** (registrado en
Namecheap). El sitio se sirve desde GitHub Pages:
`https://francorogoyin.github.io/Semaplan`

El dominio también está configurado en Cloudflare (DNS, CDN,
y Turnstile para CAPTCHA en el login).

## Estructura del proyecto

Aplicación de planificación semanal en un único archivo HTML autocontenido
(`Semaplan.html`). Sin frameworks, sin dependencias externas, sin
proceso de build. Todo el CSS y JS está inline en el mismo archivo.

## Estado global

El estado vive en variables JS globales y se persiste en `localStorage`
bajo la clave `Semaplan_Estado_V2`. Las variables principales son:

- `Tareas` — lista de tareas del sidebar
- `Eventos` — bloques colocados en el calendario
- `Slots_Muertos` — celdas marcadas como no disponibles (doble clic)
- `Plantillas_Subtareas` — plantillas reutilizables de subtareas
- `Semana_Actual` — fecha del lunes de la semana visible

La función `Guardar_Estado()` serializa todo a localStorage.
La función `Cargar_Estado()` lo restaura al iniciar.

## Configuración del calendario

```js
const Config = {
  Inicio_Hora: 0,             // Primera hora visible
  Fin_Hora: 24,               // Última hora (exclusiva)
  Altura_Slot: 48,            // Alto en px de cada celda
  Duracion_Default: 1,        // Duración por defecto en horas
  Scroll_Inicial: 8,          // Hora donde arranca el scroll
  Dias_Visibles: [0..6],      // Índices de días mostrados
  Slots_Muertos_Default: {}   // { "0": {Desde:0, Hasta:8}, ... }
};
```

Toda la configuración se persiste en `localStorage` bajo la clave
`Config_Extra`. El usuario la edita desde el modal de la tuerca (⚙)
en la esquina del calendario.

`Semanas_Con_Defaults` es un `Set<string>` de fechas ISO de lunes
(ej. `"2026-04-06"`). Cuando una semana no está en el set,
`Aplicar_Slots_Muertos_Default_Si_Necesario()` agrega los slots
bloqueados por defecto a `Slots_Muertos` y marca la semana como
inicializada. Resetear el set (ej. al guardar nueva config) fuerza
que los defaults se re-apliquen a todas las semanas.

## Tipos de tarea

- **Normal** (`Es_Bolsa: false`): tarea simple, sin conteo de horas.
- **Bolsa de horas** (`Es_Bolsa: true`): tiene `Horas_Semanales` y un
  saldo restante que se descuenta al asignar eventos.

## Render del calendario

La función `Render_Calendario()` reconstruye el DOM del calendario
completo. `Render_Eventos()` solo redibuja los bloques encima de los
slots ya existentes. Ambas deben llamarse tras cambiar semana o modificar
eventos.

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

Al arrancar cada sesión, **antes** de actuar sobre cualquier pedido
que haga el usuario en el chat, revisar la referencia viva de próximas
tareas en `Semaplan.com`, entrando con Playwright:

1. Usar la cuenta `patricioe.nogueroles@gmail.com`.
2. La contraseña está en `Credenciales.txt`.
3. Entrar a `Semaplan.com` con Playwright.
4. Ir a `Archivero` -> cajón `Semaplan`.
5. Tomar ese cajón como fuente de verdad para próximas tareas.
6. Si hay ítems ahí, preguntarle al usuario si quiere avanzar alguno,
   además de lo que haya pedido explícitamente en el chat.
7. Cuando el usuario pida revisar próximas tareas, no usar
   `Proximos_Avances.txt`; usar siempre `Semaplan.com` -> `Archivero`
   -> cajón `Semaplan`.
8. Al final de la sesión (cuando el usuario dice "listo", "ok",
   "perfecto" o similar tras un cambio funcional), commitear y
   pushear los cambios. No esperar a que el usuario lo pida
   explícitamente si ya hay trabajo completo sin commitear.
9. Regla operativa de git: si una sesión hace `commit`, en ese
   mismo flujo tiene que hacer `push`. No dejar commits locales
   pendientes salvo que el usuario lo pida explícitamente.
10. Regla permanente: siempre commitear y luego pushear. No cortar
    el flujo en `commit` dejando el `push` para después.

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
