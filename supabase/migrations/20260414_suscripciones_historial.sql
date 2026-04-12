ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS mp_plan_id TEXT;

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS
    external_reference TEXT;

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS detalle JSONB;

CREATE TABLE IF NOT EXISTS
  public.suscripciones_historial (
    id UUID PRIMARY KEY
       DEFAULT gen_random_uuid(),
    usuario_id UUID
      REFERENCES auth.users(id)
      ON DELETE CASCADE,
    mp_preapproval_id TEXT,
    mp_plan_id TEXT,
    external_reference TEXT,
    estado TEXT NOT NULL,
    payer_email TEXT,
    monto NUMERIC(10, 2),
    moneda TEXT DEFAULT 'ARS',
    detalle JSONB,
    fecha_evento TIMESTAMPTZ NOT NULL
      DEFAULT NOW()
  );

CREATE INDEX IF NOT EXISTS
  idx_suscripciones_historial_usuario
  ON public.suscripciones_historial (
    usuario_id, fecha_evento DESC
  );

CREATE INDEX IF NOT EXISTS
  idx_suscripciones_historial_mp_id
  ON public.suscripciones_historial (
    mp_preapproval_id
  );

ALTER TABLE public.suscripciones_historial
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS
  "Historial suscripcion propio: ver"
  ON public.suscripciones_historial;

CREATE POLICY
  "Historial suscripcion propio: ver"
  ON public.suscripciones_historial
  FOR SELECT
  USING (auth.uid() = usuario_id);

INSERT INTO public.suscripciones_historial (
  usuario_id,
  mp_preapproval_id,
  mp_plan_id,
  external_reference,
  estado,
  payer_email,
  monto,
  moneda,
  detalle,
  fecha_evento
)
SELECT
  s.usuario_id,
  s.mp_preapproval_id,
  s.mp_plan_id,
  s.external_reference,
  s.estado,
  s.payer_email,
  s.monto,
  s.moneda,
  s.detalle,
  COALESCE(
    s.fecha_actualizacion,
    s.fecha_creacion,
    NOW()
  )
FROM public.suscripciones s
WHERE NOT EXISTS (
  SELECT 1
  FROM public.suscripciones_historial h
  WHERE h.usuario_id IS NOT DISTINCT FROM
    s.usuario_id
    AND h.mp_preapproval_id IS NOT DISTINCT FROM
      s.mp_preapproval_id
    AND h.estado = s.estado
);
