# Integración Telegram Semaplan

La integración permite operar Semaplan desde un bot de Telegram con un
alcance deliberadamente acotado: tareas, hábitos, avances de Metas,
avances de Decoteca y consulta de pendientes.

## Arquitectura

El flujo es:

1. Telegram envía el mensaje al webhook público.
2. `supabase/functions/semaplan-telegram` valida el secreto del webhook.
3. La función busca el vínculo entre `telegram_user_id` y usuario de
   Semaplan en `telegram_vinculos_usuario`.
4. El comando se registra en `telegram_comandos_usuario` para auditoría
   e idempotencia por `telegram_update_id`.
5. La función lee `estado_usuario`, aplica una mutación acotada y guarda
   con control de `version`.
6. Los borrados pasan antes por `telegram_confirmaciones_usuario`.

La función usa `SUPABASE_SERVICE_ROLE_KEY`, por eso no debe exponerse en
frontend. El acceso del usuario no se decide por el chat de Telegram
solamente, sino por el vínculo explícito en base.

## Secretos requeridos

- `TELEGRAM_BOT_TOKEN`: token entregado por BotFather.
- `TELEGRAM_WEBHOOK_SECRET`: secreto propio para validar el header
  `X-Telegram-Bot-Api-Secret-Token`.
- `SUPABASE_URL`: URL del proyecto Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: clave service role del proyecto.

## Despliegue

Aplicar la migración:

```bash
supabase db push
```

Configurar secretos:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="TOKEN_DEL_BOT"
supabase secrets set TELEGRAM_WEBHOOK_SECRET="SECRETO_LARGO"
```

Desplegar la función:

```bash
supabase functions deploy semaplan-telegram --no-verify-jwt
```

Registrar el webhook en Telegram:

```bash
curl -X POST "https://api.telegram.org/botTOKEN_DEL_BOT/setWebhook" \
  -d "url=https://cprdnxkkhuuhdispubds.supabase.co/functions/v1/semaplan-telegram" \
  -d "secret_token=SECRETO_LARGO"
```

## Vinculación de usuario

Primero hablarle al bot y mandar:

```text
/id
```

El bot devuelve el `telegram_user_id`. Después vincularlo con el usuario
de Semaplan desde SQL:

```sql
insert into public.telegram_vinculos_usuario (
  telegram_user_id,
  usuario_id,
  alias
)
select
  'TELEGRAM_USER_ID',
  id,
  'Patricio'
from auth.users
where email = 'EMAIL_DE_SEMAPLAN'
on conflict (telegram_user_id) do update
set
  usuario_id = excluded.usuario_id,
  alias = excluded.alias,
  habilitado = true,
  actualizado_en = now();
```

## Comandos soportados

```text
/pendientes
/pendientes hoy

/tarea Comprar filtros | mañana 09:00
/tarea_hecha Comprar filtros
/tarea_deshecha Comprar filtros
/tarea_horario Comprar filtros | 2026-06-12 10:30
/tarea_horario Comprar filtros | sin horario
/tarea_borrar Comprar filtros

/habito crear Lectura
/habito_hecho Lectura
/habito_hecho Lectura | 30
/habito_deshecho Lectura
/habito_horario Lectura | 21:00
/habito_horario Lectura | libre
/habito_borrar Lectura

/meta Tesis | 2 páginas | nota opcional
/decoteca Vigilar y castigar | 20 páginas | nota opcional
```

Los borrados responden con un código:

```text
/confirmar ABC123
```

## Criterios y límites

- Si hay varias coincidencias por nombre, no se aplica ningún cambio y
  el bot pide ser más específico.
- Borrar tareas requiere confirmación.
- Cambiar horario o borrar tareas vinculadas a agenda o planes se
  rechaza para no dejar vínculos internos inconsistentes.
- Borrar hábitos elimina el hábito y sus registros; también limpia el
  hábito de retos si estaba vinculado.
- Los avances de Metas se agregan al modelo `Planes_Periodo.Avances`.
  No distribuyen automáticamente entre componentes cuando eso requeriría
  confirmación visual en la app.
- Los avances de Decoteca se agregan en `Decoteca.Avances`, sobre obra o
  parte encontrada por nombre.
- No hay interpretación libre con IA: el parser es intencionalmente
  simple para evitar cambios por inferencia débil.
