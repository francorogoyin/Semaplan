ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS trial_hasta TIMESTAMPTZ;

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS trial_iniciado_en TIMESTAMPTZ;

ALTER TABLE public.suscripciones
  ADD COLUMN IF NOT EXISTS trial_origen TEXT;
