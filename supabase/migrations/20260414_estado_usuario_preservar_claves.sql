CREATE OR REPLACE FUNCTION
  public.jsonb_deep_merge_preserving_missing(
    base jsonb,
    incoming jsonb
  )
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  key text;
  value jsonb;
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

  result := base;

  FOR key, value IN
    SELECT *
    FROM jsonb_each(incoming)
  LOOP
    IF result ? key THEN
      result := jsonb_set(
        result,
        ARRAY[key],
        public.jsonb_deep_merge_preserving_missing(
          result -> key,
          value
        ),
        true
      );
    ELSE
      result := jsonb_set(
        result,
        ARRAY[key],
        value,
        true
      );
    END IF;
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
