# Inventario de Edge Functions y acciones sensibles

| Recurso | Tipo | Privada/Publica | `verify_jwt` gateway | Validación interna esperada | Error esperado sin sesión | Reintento frontend |
| --- | --- | --- | --- | --- | --- | --- |
| `enviar-ayuda-consulta` | Edge Function | Privada | Sí | Usuario autenticado y email presente | `401/403` y mensaje consistente | Sí, una vez con refresh |
| `estado-suscripcion` | Edge Function | Privada | Sí | Usuario autenticado | `401/403` y payload uniforme | Sí, una vez con refresh |
| `crear-suscripcion` | Edge Function | Privada | Sí | Usuario autenticado y plan válido | `401/403` y detalle | No automático; mostrar CTA |
| `cancelar-suscripcion` | Edge Function | Privada | Sí | Usuario autenticado y suscripción activa | `401/403` y detalle | No automático; repetir acción |
| `activar-trial` | Edge Function | Privada | Sí | Usuario autenticado y elegibilidad | `401/403` y detalle | No automático; repetir acción |
| `eliminar_cuenta` | RPC Supabase | Privada | N/A | Usuario autenticado y password ya verificada en frontend | Error RPC consistente | No |

## Notas operativas

- El frontend ya usa `Invocar_Edge_Con_Sesion` y reintenta una vez
  si detecta `401` o `Invalid JWT`.
- Falta revisar en backend desplegado que cada function devuelva
  formato homogéneo: `Ok`, `Error`, `Codigo`, `Detalle`.
- Si alguna function requiere `verify_jwt = false` en gateway, dejar
  razón explícita en la misma carpeta de la function.
- `eliminar_cuenta` hoy no es Edge Function: es RPC. Igual entra en
  la lista crítica porque es destructiva.
