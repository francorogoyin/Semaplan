# Timeblock

Aplicación web de planificación semanal con calendario,
bolsa de horas, subtareas, patrones, abordajes y resumen
semanal. Backend en Supabase: registro, login, datos
sincronizados en la nube y accesibles desde cualquier
dispositivo.

## Cómo poner en marcha

### 1. Configurar el esquema en Supabase (una sola vez)

1. Abrí el dashboard de tu proyecto en
   <https://supabase.com/dashboard>.
2. En el menú lateral, click en **SQL Editor**.
3. Click en **New query**.
4. Abrí el archivo `Supabase_Schema.sql` que está en esta
   carpeta, copiá todo su contenido y pegalo en el editor.
5. Click en **Run** (abajo a la derecha).
6. Si todo salió bien, verás "Success. No rows returned."

### 2. Configurar autenticación por email (una sola vez)

1. En el dashboard, andá a **Authentication** → **Providers**.
2. Verificá que **Email** esté habilitado (viene así por default).
3. Para que NO requiera confirmación por mail al registrarse
   (más cómodo en desarrollo), andá a **Authentication** →
   **Sign In / Providers** → **Email** y desactivá
   "Confirm email". Cuando vayas a producción, lo podés
   reactivar.

### 3. Abrir la app

Abrí `Time_Blocking.html` en el navegador. Va a aparecer la
pantalla de login. Hacé click en "Crear cuenta", poné tu mail
y una contraseña, y listo.

## Estructura del proyecto

- `Time_Blocking.html` — la app (HTML autocontenido)
- `Supabase_Schema.sql` — esquema de la base de datos
- `README.md` — este archivo

## Cómo funciona la sincronización

- Todos tus datos viven en una sola fila JSON en la tabla
  `estado_usuario` de Supabase, indexada por tu user_id.
- Cada cambio en la app dispara un guardado **con debounce
  de 2 segundos**: si hacés muchos cambios rápido, espera a
  que pares y manda uno solo.
- Hay un indicador en la barra superior que dice "Guardado",
  "Guardando..." o "Error" según el estado.
- Los datos se mantienen también en localStorage como caché
  para que la app cargue rápido al abrir.

## Migración de datos del HTML viejo (sin backend)

Si ya usabas Timeblock con localStorage en otra carpeta, la
primera vez que entres a tu cuenta nueva, la app te va a
preguntar si querés importar los datos del localStorage actual
de este navegador a tu cuenta. Si decís que sí, los sube y
quedan asociados a tu user_id.
