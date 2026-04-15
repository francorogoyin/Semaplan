# Plan de staging pre lanzamiento

Fecha de corte: 2026-04-15

## Objetivo

Dejar preparado un staging real para probar Auth, sync, Edge
Functions y smoke remoto sin usar produccion como laboratorio.

## Lo que ya quedo preparado en el repo

- El smoke remoto ahora acepta `SEMAPLAN_BASE_URL` y
  `SEMAPLAN_AUTH_FILE`.
- Existe el comando `npm run test:smoke:prod` para produccion.
- Existe el comando `npm run test:smoke:staging` para staging,
  pasando la URL por parametro o variable de entorno.
- Existe el script
  `Herramientas/Scripts/Run_Smoke_Staging.ps1`.

## Comandos operativos

Produccion:

```powershell
npm run test:smoke:prod
```

Staging con parametro:

```powershell
npm run test:smoke:staging -- -BaseUrl https://staging.semaplan.com
```

Staging con variables:

```powershell
$env:SEMAPLAN_BASE_URL="https://staging.semaplan.com"
$env:SEMAPLAN_AUTH_FILE="Pruebas/Playwright/.auth/semaplan-patricio.json"
npm run test:smoke:staging
```

## Minimo viable de staging

1. URL separada de produccion.
2. Proyecto Supabase separado o al menos aislado.
3. Keys de Turnstile y callbacks propias.
4. Cuentas de test exclusivas.
5. Mails de prueba no productivos.
6. Auth file propio para la cuenta de staging.

## Checklist tecnico para habilitarlo

- Duplicar frontend en una URL separada.
- Apuntar esa URL a Supabase staging.
- Crear cuentas de test para objetivo y para funciones.
- Guardar una sesion Playwright especifica de staging.
- Correr smoke staging en verde dos veces seguidas.
- Recién despues probar features nuevas ahi antes de main.

## Bloqueos externos

Esto no se puede cerrar solo desde el repo:

- dominio o subdominio staging;
- proyecto Supabase staging;
- keys reales de CAPTCHA y correo;
- cuentas reales de prueba en ese backend.
