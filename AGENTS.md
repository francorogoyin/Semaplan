# Time Blocking — AGENTS.md

## Estructura del proyecto

Aplicación de planificación semanal en un único archivo HTML autocontenido
(`Time_Blocking.html`). Sin frameworks, sin dependencias externas, sin
proceso de build. Todo el CSS y JS está inline en el mismo archivo.

## Estado global

El estado vive en variables JS globales y se persiste en `localStorage`
bajo la clave `Time_Blocking_Estado_V2`. Las variables principales son:

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
