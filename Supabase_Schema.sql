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

-- Trigger: actualizar `actualizado_en` automáticamente en
-- cada UPDATE.
-- ============================================================
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
-- Listo. Verificación opcional:
-- ============================================================
-- Para verificar que todo está bien, podés correr:
--
--   SELECT * FROM public.estado_usuario;
--
-- Debería devolver 0 filas (todavía no hay usuarios) sin error.
-- ============================================================
