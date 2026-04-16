# Monitoreo de errores app.

Fecha de corte: 2026-04-16.

## Objetivo.

Usar la tabla `Errores_App` como senal operativa para detectar
fallos reales de frontend, sync y Edge Functions despues del
lanzamiento.

## Reporte manual.

Produccion.

```powershell
npm run errores:reporte
```

Staging.

```powershell
npm run errores:reporte:staging
```

Ultimos siete dias.

```powershell
npm run errores:reporte -- --dias 7
```

Salida JSON.

```powershell
npm run errores:reporte -- --json
```

Fallar si hay cinco o mas errores en el periodo.

```powershell
npm run errores:reporte -- --fallar-si 5
```

## Variables para CI.

El reporte puede autenticarse de dos formas.

- `SEMAPLAN_SUPABASE_SERVICE_ROLE_KEY`.
- `SEMAPLAN_SUPABASE_ACCESS_TOKEN` mas
  `SEMAPLAN_SUPABASE_PROJECT_REF`.

En local, si existe `Local/Credenciales.txt`, el script puede usar el
token operativo guardado ahi. Ese archivo no se versiona.

## GitHub Actions.

Existe el workflow `.github/workflows/smoke-remoto.yml`.

Corre en cada push a `main`, manualmente y todos los dias a las
06:30 de Argentina.

Secrets esperados para smokes.

- `SEMAPLAN_PROD_AUTH_STATE_B64`.
- `SEMAPLAN_STAGING_AUTH_STATE_B64`.

Secrets esperados para reporte.

- `SEMAPLAN_SUPABASE_ACCESS_TOKEN`.
- `SEMAPLAN_PROD_SERVICE_ROLE_KEY`.
- `SEMAPLAN_STAGING_SERVICE_ROLE_KEY`.

Si no hay auth secrets, los smokes se saltean sin fallar el workflow.
Si no hay secrets de Supabase, el reporte se saltea sin fallar el
workflow.

Para generar un auth state en base64.

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes(
    "Pruebas/Playwright/.auth/semaplan-smoke.json"
  )
)
```

## Umbrales recomendados.

- Cualquier error de `auth` en 24 horas debe revisarse.
- Mas de cinco errores de `sync` en 24 horas debe bloquear deploys
  nuevos hasta entender la causa.
- Cualquier error repetido de Edge Function debe revisarse junto con
  logs de Supabase.
- Errores aislados de importacion pueden tratarse caso por caso.

## Limpieza de smoke.

Dry-run de produccion.

```powershell
npm run smoke:limpiar
```

Aplicar limpieza de produccion.

```powershell
npm run smoke:limpiar:aplicar
```

Dry-run de staging.

```powershell
npm run smoke:limpiar:staging
```

Aplicar limpieza de staging.

```powershell
npm run smoke:limpiar:staging:aplicar
```

La limpieza solo apunta por defecto a
`tomashodel@gmail.com` y borra items cuyo nombre, titulo o texto
empieza con `Smoke `. Para otras cuentas usar `--emails`.
