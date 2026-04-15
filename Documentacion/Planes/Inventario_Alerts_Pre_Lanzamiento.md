# Inventario de alerts pre lanzamiento

Fecha de corte: 2026-04-15

## Estado actual

- `index.html`: `0` usos de `alert()`.

## Inventario inicial que se reemplazo

- Fallback tecnico de `Resumen semanal`.
- SDK de Supabase no cargado en login.
- Validaciones de metas.
- Validaciones de fechas y rangos.
- Conflictos de calendario y bolsa de horas.
- Conflictos de pegado y movimiento multi.
- Validacion de semanas en Baul.

## Criterio de reemplazo aplicado

- Validacion o conflicto recuperable: toast.
- Error bloqueante o destructivo: dialogo.
- Error de auth al iniciar: mensaje en overlay de auth.
- Error tecnico importante: log + feedback visible.

## Riesgo residual

- Algunas validaciones hoy usan toast donde a futuro conviene
  pasar a error inline.
- El repo ya no depende de `alert()`, pero todavia conviene
  seguir afinando jerarquia visual entre warning, error y
  accion bloqueante.
