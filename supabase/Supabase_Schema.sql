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

-- Las escrituras web pasan exclusivamente por la RPC
-- aplicar_estado_usuario_web. Esto permite validar version de fila
-- y version de cliente antes de tocar cualquier parte del estado.
DROP POLICY IF EXISTS "Estado propio: insertar"
  ON public.estado_usuario;

DROP POLICY IF EXISTS "Estado propio: actualizar"
  ON public.estado_usuario;

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
  IF current_setting('semaplan.skip_deep_merge', true) = '1' THEN
    RETURN NEW;
  END IF;

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

CREATE OR REPLACE FUNCTION public.semaplan_version_codigo(
  p_version text
)
RETURNS bigint
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_partes text[];
BEGIN
  v_partes := regexp_match(
    COALESCE(p_version, ''),
    '^([0-9]+)\.([0-9]+)\.([0-9]+)'
  );
  IF v_partes IS NULL THEN
    RETURN 0;
  END IF;
  RETURN LEAST(v_partes[1]::bigint, 999999) * 1000000000000
    + LEAST(v_partes[2]::bigint, 999999) * 1000000
    + LEAST(v_partes[3]::bigint, 999999);
END;
$$;

CREATE OR REPLACE FUNCTION public.aplicar_estado_usuario_web(
  p_estado jsonb,
  p_version_esperada integer,
  p_cliente_version text
)
RETURNS TABLE(version integer, actualizado_en timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_usuario_id uuid;
  v_estado_actual jsonb;
  v_version_actual integer;
  v_version_estado text;
  v_version_nueva integer;
  v_actualizado_en timestamptz;
BEGIN
  v_usuario_id := auth.uid();
  IF v_usuario_id IS NULL THEN
    RAISE EXCEPTION USING
      ERRCODE = '42501',
      MESSAGE = 'semaplan_sesion_requerida';
  END IF;
  IF p_estado IS NULL OR jsonb_typeof(p_estado) <> 'object' THEN
    RAISE EXCEPTION USING
      ERRCODE = '22023',
      MESSAGE = 'semaplan_estado_invalido';
  END IF;

  SELECT eu.estado, eu.version
  INTO v_estado_actual, v_version_actual
  FROM public.estado_usuario eu
  WHERE eu.user_id = v_usuario_id
  FOR UPDATE;

  IF v_version_actual IS NULL THEN
    IF COALESCE(p_version_esperada, 0) <> 0 THEN
      RETURN;
    END IF;
    INSERT INTO public.estado_usuario(user_id, estado)
    VALUES (v_usuario_id, p_estado)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING estado_usuario.version,
      estado_usuario.actualizado_en
    INTO v_version_nueva, v_actualizado_en;
    IF v_version_nueva IS NULL THEN
      RETURN;
    END IF;
    RETURN QUERY
      SELECT v_version_nueva, v_actualizado_en;
    RETURN;
  END IF;

  IF v_version_actual <> COALESCE(p_version_esperada, 0) THEN
    RETURN;
  END IF;

  v_version_estado :=
    v_estado_actual #>> '{Config_Extra,Version_Programa}';
  IF public.semaplan_version_codigo(p_cliente_version) <
     public.semaplan_version_codigo(v_version_estado) THEN
    RAISE EXCEPTION USING
      ERRCODE = 'P0001',
      MESSAGE = 'semaplan_cliente_obsoleto',
      DETAIL = 'Actualice Semaplan antes de guardar.';
  END IF;

  UPDATE public.estado_usuario eu
  SET estado = public.jsonb_deep_merge_preserving_missing(
        v_estado_actual,
        p_estado
      ),
      version = eu.version + 1
  WHERE eu.user_id = v_usuario_id
    AND eu.version = v_version_actual
  RETURNING eu.version, eu.actualizado_en
  INTO v_version_nueva, v_actualizado_en;

  IF v_version_nueva IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY
    SELECT v_version_nueva, v_actualizado_en;
END;
$$;

REVOKE ALL ON FUNCTION
  public.aplicar_estado_usuario_web(jsonb, integer, text)
  FROM public;
GRANT EXECUTE ON FUNCTION
  public.aplicar_estado_usuario_web(jsonb, integer, text)
  TO authenticated;

CREATE OR REPLACE FUNCTION public.aplicar_estado_usuario_b2(
  p_usuario_id uuid,
  p_estado jsonb,
  p_version_esperada integer
)
RETURNS TABLE(version integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM set_config('semaplan.skip_deep_merge', '1', true);

  RETURN QUERY
  UPDATE public.estado_usuario eu
  SET estado = p_estado,
      version = eu.version + 1
  WHERE eu.user_id = p_usuario_id
    AND eu.version = p_version_esperada
  RETURNING eu.version;
END;
$$;

REVOKE ALL ON FUNCTION
  public.aplicar_estado_usuario_b2(uuid, jsonb, integer)
  FROM public;

GRANT EXECUTE ON FUNCTION
  public.aplicar_estado_usuario_b2(uuid, jsonb, integer)
  TO service_role;

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
