-- Agregar constraint UNIQUE en usuario_id para
-- que el upsert funcione (un usuario = una
-- suscripción activa a la vez).

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_suscripciones_usuario_unico
  ON public.suscripciones (usuario_id);
