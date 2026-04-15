# Semaplan

AplicaciÃ³n web de planificaciÃ³n semanal con calendario,
bolsa de horas, subobjetivos, patrones, abordajes y resumen
semanal. Backend en Supabase: registro, login, datos
sincronizados en la nube y accesibles desde cualquier
dispositivo.

## CÃ³mo poner en marcha

### 1. Configurar el esquema en Supabase (una sola vez)

1. AbrÃ­ el dashboard de tu proyecto en
   <https://supabase.com/dashboard>.
2. En el menÃº lateral, click en **SQL Editor**.
3. Click en **New query**.
4. AbrÃ­ el archivo `supabase/Supabase_Schema.sql`, copiÃ¡
   todo su contenido y pegalo en el editor.
5. Click en **Run** (abajo a la derecha).
6. Si todo saliÃ³ bien, verÃ¡s "Success. No rows returned."

### 2. Configurar autenticaciÃ³n por email (una sola vez)

1. En el dashboard, andÃ¡ a **Authentication** â†’ **Providers**.
2. VerificÃ¡ que **Email** estÃ© habilitado (viene asÃ­ por default).
3. Para que NO requiera confirmaciÃ³n por mail al registrarse
   (mÃ¡s cÃ³modo en desarrollo), andÃ¡ a **Authentication** â†’
   **Sign In / Providers** â†’ **Email** y desactivÃ¡
   "Confirm email". Cuando vayas a producciÃ³n, lo podÃ©s
   reactivar.

### 3. Abrir la app

AbrÃ­ `index.html` en el navegador. Va a aparecer la
pantalla de login. HacÃ© click en "Crear cuenta", ponÃ© tu mail
y una contraseÃ±a, y listo.

## Estructura del proyecto

- `index.html` â€” la app web principal
- `Semaplan.html` â€” redirect de compatibilidad
- `Aplicaciones/` â€” wrappers y binarios auxiliares
- `Documentacion/` â€” planes, auditorÃ­as y registros
- `Herramientas/` â€” scripts de soporte
- `Pruebas/` â€” tests y estado de Playwright
- `supabase/` â€” configuraciÃ³n, funciones y esquema
- `Local/` â€” archivos operativos no centrales
- `README.md` â€” este archivo

## CÃ³mo funciona la sincronizaciÃ³n

- Todos tus datos viven en una sola fila JSON en la tabla
  `estado_usuario` de Supabase, indexada por tu user_id.
- Cada cambio en la app dispara un guardado **con debounce
  de 2 segundos**: si hacÃ©s muchos cambios rÃ¡pido, espera a
  que pares y manda uno solo.
- Hay un indicador en la barra superior que dice "Guardado",
  "Guardando..." o "Error" segÃºn el estado.
- Los datos se mantienen tambiÃ©n en localStorage como cachÃ©
  para que la app cargue rÃ¡pido al abrir.

## MigraciÃ³n de datos del HTML viejo (sin backend)

Si ya usabas Semaplan (antes "Timeblock") con localStorage
en otra carpeta, la primera vez que entres a tu cuenta nueva,
la app te va a preguntar si querÃ©s importar los datos del
localStorage actual de este navegador a tu cuenta. Si decÃ­s
que sÃ­, los sube y quedan asociados a tu user_id.

