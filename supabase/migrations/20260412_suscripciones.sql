-- ============================================================
-- Semaplan - Tabla de suscripciones (Mercado Pago)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.suscripciones (
  id                 UUID PRIMARY KEY
                     DEFAULT gen_random_uuid(),
  usuario_id         UUID NOT NULL
                     REFERENCES auth.users(id)
                     ON DELETE CASCADE,
  mp_preapproval_id  TEXT,
  estado             TEXT NOT NULL
                     DEFAULT 'pending',
  payer_email        TEXT,
  monto              NUMERIC(10, 2),
  moneda             TEXT DEFAULT 'ARS',
  fecha_creacion     TIMESTAMPTZ NOT NULL
                     DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL
                     DEFAULT NOW()
);

-- Índice para buscar rápido por usuario.
CREATE INDEX IF NOT EXISTS
  idx_suscripciones_usuario
  ON public.suscripciones (usuario_id);

-- Índice para buscar por ID de MP (webhooks).
CREATE UNIQUE INDEX IF NOT EXISTS
  idx_suscripciones_mp_id
  ON public.suscripciones (mp_preapproval_id);

-- RLS: cada usuario solo ve su propia suscripción.
ALTER TABLE public.suscripciones
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suscripcion propia: ver"
  ON public.suscripciones;
CREATE POLICY "Suscripcion propia: ver"
  ON public.suscripciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

-- Los INSERTs y UPDATEs los hace el backend
-- (Edge Functions con service_role_key), no el
-- usuario directo. Por eso no hay políticas de
-- INSERT/UPDATE para el rol anon.

-- Trigger para actualizar fecha_actualizacion.
CREATE OR REPLACE FUNCTION
  public.actualizar_timestamp_suscripcion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS
  trigger_suscripcion_actualizada
  ON public.suscripciones;
CREATE TRIGGER trigger_suscripcion_actualizada
  BEFORE UPDATE ON public.suscripciones
  FOR EACH ROW
  EXECUTE FUNCTION
    public.actualizar_timestamp_suscripcion();

-- ============================================================
-- Listo. La tabla queda lista para que las Edge
-- Functions de Mercado Pago la usen.
-- ============================================================
