-- ============================================================
-- Timeblock - Esquema de base de datos para Supabase
-- ============================================================
-- Pegar este script entero en el SQL Editor de Supabase y
-- ejecutarlo (botón Run). Crea la tabla, las políticas de RLS,
-- y los triggers necesarios.
-- ============================================================

-- Tabla principal: estado del usuario.
-- Cada fila = un usuario, con su blob JSON de estado completo.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.estado_usuario (
  user_id        UUID PRIMARY KEY
                 REFERENCES auth.users(id)
                 ON DELETE CASCADE,
  estado         JSONB NOT NULL DEFAULT '{}'::jsonb,
  version        INTEGER NOT NULL DEFAULT 1,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Row Level Security: cada usuario solo ve y
-- modifica su propia fila.
-- ============================================================
ALTER TABLE public.estado_usuario ENABLE ROW LEVEL SECURITY;

-- Política: SELECT solo el estado propio.
DROP POLICY IF EXISTS "Estado propio: ver"
  ON public.estado_usuario;
CREATE POLICY "Estado propio: ver"
  ON public.estado_usuario
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: INSERT solo el estado propio.
DROP POLICY IF EXISTS "Estado propio: insertar"
  ON public.estado_usuario;
CREATE POLICY "Estado propio: insertar"
  ON public.estado_usuario
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: UPDATE solo el estado propio.
DROP POLICY IF EXISTS "Estado propio: actualizar"
  ON public.estado_usuario;
CREATE POLICY "Estado propio: actualizar"
  ON public.estado_usuario
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: DELETE solo el estado propio.
DROP POLICY IF EXISTS "Estado propio: borrar"
  ON public.estado_usuario;
CREATE POLICY "Estado propio: borrar"
  ON public.estado_usuario
  FOR DELETE
  USING (auth.uid() = user_id);

-- Compatibilidad de raíz: preservar solo claves de primer nivel
-- que el cliente todavía no conoce. No mergear profundo porque
-- eso revive borrados anidados del blob de estado.
-- ============================================================
CREATE OR REPLACE FUNCTION
  public.jsonb_deep_merge_preserving_missing(
    base jsonb,
    incoming jsonb
  )
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  key text;
BEGIN
  IF incoming IS NULL THEN
    RETURN base;
  END IF;

  IF base IS NULL THEN
    RETURN incoming;
  END IF;

  IF jsonb_typeof(base) <> 'object'
     OR jsonb_typeof(incoming) <> 'object' THEN
    RETURN incoming;
  END IF;

  result := incoming;

  FOR key IN
    SELECT jsonb_object_keys(base)
  LOOP
    IF result ? key THEN
      CONTINUE;
    END IF;
    result := jsonb_set(
      result,
      ARRAY[key],
      base -> key,
      true
    );
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION
  public.proteger_estado_usuario_claves_nuevas()
RETURNS TRIGGER AS $$
BEGIN
  NEW.estado :=
    public.jsonb_deep_merge_preserving_missing(
      OLD.estado,
      NEW.estado
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS
  trigger_estado_preservar_claves
  ON public.estado_usuario;
CREATE TRIGGER trigger_estado_preservar_claves
  BEFORE UPDATE ON public.estado_usuario
  FOR EACH ROW
  EXECUTE FUNCTION
    public.proteger_estado_usuario_claves_nuevas();

CREATE OR REPLACE FUNCTION public.actualizar_timestamp_estado()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_estado_actualizado
  ON public.estado_usuario;
CREATE TRIGGER trigger_estado_actualizado
  BEFORE UPDATE ON public.estado_usuario
  FOR EACH ROW
  EXECUTE FUNCTION public.actualizar_timestamp_estado();

-- Trigger: cuando se crea un usuario nuevo en auth.users,
-- crear automáticamente una fila vacía en estado_usuario.
-- ============================================================
CREATE OR REPLACE FUNCTION public.crear_estado_para_usuario_nuevo()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.estado_usuario (user_id, estado)
  VALUES (NEW.id, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_usuario_nuevo
  ON auth.users;
CREATE TRIGGER trigger_usuario_nuevo
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.crear_estado_para_usuario_nuevo();

-- ============================================================
-- Tabla de suscripciones (Mercado Pago).
-- Cada fila = una suscripción de un usuario.
-- Las Edge Functions la usan con service_role_key.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.suscripciones (
  id                  UUID PRIMARY KEY
                      DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL
                      REFERENCES auth.users(id)
                      ON DELETE CASCADE,
  mp_preapproval_id   TEXT,
  estado              TEXT NOT NULL
                      DEFAULT 'pending',
  payer_email         TEXT,
  monto               NUMERIC(10, 2),
  moneda              TEXT DEFAULT 'ARS',
  fecha_creacion      TIMESTAMPTZ NOT NULL
                      DEFAULT NOW(),
  fecha_actualizacion TIMESTAMPTZ NOT NULL
                      DEFAULT NOW()
);

-- Un usuario = una suscripción activa a la vez.
CREATE UNIQUE INDEX IF NOT EXISTS
  idx_suscripciones_usuario_unico
  ON public.suscripciones (usuario_id);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_suscripciones_mp_id
  ON public.suscripciones (mp_preapproval_id);

ALTER TABLE public.suscripciones
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suscripcion propia: ver"
  ON public.suscripciones;
CREATE POLICY "Suscripcion propia: ver"
  ON public.suscripciones
  FOR SELECT
  USING (auth.uid() = usuario_id);

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
-- Tabla de tokens de lectura para integraciones de IA.
-- Guarda solo hashes SHA-256 y permite revocacion.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tokens_ia_usuario (
  id                  UUID PRIMARY KEY
                      DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL
                      REFERENCES auth.users(id)
                      ON DELETE CASCADE,
  nombre              TEXT NOT NULL
                      DEFAULT 'Integracion IA',
  token_hash          TEXT NOT NULL UNIQUE,
  scopes              TEXT[] NOT NULL
                      DEFAULT ARRAY['read']::TEXT[],
  ultimo_uso_en       TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ NOT NULL
                      DEFAULT NOW(),
  revocado_en         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS
  idx_tokens_ia_usuario_usuario
  ON public.tokens_ia_usuario (usuario_id);

CREATE INDEX IF NOT EXISTS
  idx_tokens_ia_usuario_revocado
  ON public.tokens_ia_usuario (usuario_id, revocado_en);

ALTER TABLE public.tokens_ia_usuario
  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tokens IA propios: ver"
  ON public.tokens_ia_usuario;
CREATE POLICY "Tokens IA propios: ver"
  ON public.tokens_ia_usuario
  FOR SELECT
  USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Tokens IA propios: insertar"
  ON public.tokens_ia_usuario;
CREATE POLICY "Tokens IA propios: insertar"
  ON public.tokens_ia_usuario
  FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Tokens IA propios: actualizar"
  ON public.tokens_ia_usuario;
CREATE POLICY "Tokens IA propios: actualizar"
  ON public.tokens_ia_usuario
  FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Tokens IA propios: borrar"
  ON public.tokens_ia_usuario;
CREATE POLICY "Tokens IA propios: borrar"
  ON public.tokens_ia_usuario
  FOR DELETE
  USING (auth.uid() = usuario_id);

-- ============================================================
-- Tabla de codigos OAuth para integracion con ChatGPT Actions.
-- Guarda hashes del auth code y permite intercambio seguro.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.oauth_ia_codigos (
  id                  UUID PRIMARY KEY
                      DEFAULT gen_random_uuid(),
  usuario_id          UUID NOT NULL
                      REFERENCES auth.users(id)
                      ON DELETE CASCADE,
  cliente_id          TEXT NOT NULL,
  redirect_uri        TEXT NOT NULL,
  scopes              TEXT[] NOT NULL
                      DEFAULT ARRAY['read']::TEXT[],
  code_hash           TEXT NOT NULL UNIQUE,
  expira_en           TIMESTAMPTZ NOT NULL,
  usado_en            TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ NOT NULL
                      DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS
  idx_oauth_ia_codigos_usuario
  ON public.oauth_ia_codigos (usuario_id);

CREATE INDEX IF NOT EXISTS
  idx_oauth_ia_codigos_expira
  ON public.oauth_ia_codigos (expira_en);

ALTER TABLE public.oauth_ia_codigos
  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Listo. Verificación opcional:
-- ============================================================
-- Para verificar que todo está bien, podés correr:
--
--   SELECT * FROM public.estado_usuario;
--   SELECT * FROM public.suscripciones;
--   SELECT * FROM public.tokens_ia_usuario;
--
-- Deberían devolver 0 filas sin error.
-- ============================================================
