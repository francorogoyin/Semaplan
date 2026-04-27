# Semaplan

Aplicación web de planificación semanal con calendario,
bolsa de horas, subobjetivos, patrones, abordajes y resumen
semanal. Backend en Supabase: registro, login, datos
sincronizados en la nube y accesibles desde cualquier
dispositivo.

## Cómo poner en marcha

### 1. Configurar el esquema en Supabase

1. Abrí el dashboard de tu proyecto en
   <https://supabase.com/dashboard>.
2. En el menú lateral, entrá a **SQL Editor**.
3. Creá una query nueva.
4. Abrí `supabase/Supabase_Schema.sql`, copiá todo su
   contenido y pegalo en el editor.
5. Ejecutá la query.

### 2. Configurar autenticación por email

1. En Supabase, andá a **Authentication**.
2. Verificá que el provider **Email** esté habilitado.
3. Si querés evitar la confirmación por mail en desarrollo,
   desactivá la confirmación de email. En producción podés
   volver a activarla.

### 3. Abrir el proyecto

- `index.html` es la landing pública.
- `login.html` es la app principal y muestra el login.
- `Semaplan.html` redirige por compatibilidad al login.

## Estructura del proyecto

- `index.html` — landing pública.
- `login.html` — app web principal.
- `terms.html` — términos del servicio.
- `privacy.html` — política de privacidad.
- `refund.html` — política de reembolsos.
- `Semaplan.html` — redirect de compatibilidad al login.
- `Aplicaciones/` — wrappers y binarios auxiliares.
- `Documentacion/` — planes, auditorías y registros.
- `Herramientas/` — scripts de soporte.
- `Pruebas/` — tests y estado de Playwright.
- `supabase/` — configuración, funciones y esquema.
- `Local/` — archivos operativos no centrales.

## Sincronización

- Todos los datos viven en una fila JSON por usuario dentro
  de `estado_usuario` en Supabase.
- Cada cambio dispara guardado con debounce.
- La app muestra estado de guardado en la barra superior.
- También usa `localStorage` como caché para acelerar carga.

## Migración de datos

Si ya usabas Semaplan en una versión anterior basada solo en
`localStorage`, la app puede ofrecer importar esos datos a tu
cuenta la primera vez que entrás con login.
