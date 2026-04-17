# Staging pre lanzamiento

Fecha de corte: 2026-04-15

## Estado actual

El staging real quedo operativo.

- URL activa: `https://semaplan.com/?entorno=staging`
- Backend separado: proyecto Supabase `Timeblocking-Staging`
- Auth aislada: cuentas de prueba creadas en ese backend
- Edge Functions desplegadas: `activar-trial`,
  `cancelar-suscripcion`, `crear-suscripcion`,
  `eliminar-cuenta`, `enviar-ayuda-consulta`,
  `estado-suscripcion` y `webhook-mp`
- Storage local aislado por entorno para no mezclar
  `localStorage` entre produccion y staging

## Comandos operativos

Guardar auth de staging:

```powershell
npm run auth:semaplan:staging
```

Smoke de staging:

```powershell
npm run test:smoke:staging
```

Smoke de staging con archivo o URL manual:

```powershell
npm run test:smoke:staging -- `
  -BaseUrl https://semaplan.com/?entorno=staging `
  -AuthFile Pruebas/Playwright/.auth/semaplan-staging.json
```

## Decisiones tecnicas

- No se creo un subdominio aparte en esta etapa.
- El selector de entorno se resuelve por URL:
  `?entorno=staging`.
- Produccion conserva las claves legacy de
  `localStorage`; staging usa claves sufijadas.
- El anon key de staging queda publicado en frontend,
  igual que en produccion. Eso es correcto para Supabase.

## Falta opcional

No bloquea el uso de staging, pero sigue siendo mejora:

- mover staging a un subdominio propio;
- separar tambien Turnstile por entorno;
- usar mails de destino exclusivos de staging para ayuda;
- definir una cuenta humana exclusiva para pruebas manuales.
