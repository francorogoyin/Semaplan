begin;

drop policy if exists "Estado propio: insertar"
  on public.estado_usuario;
drop policy if exists "Estado propio: actualizar"
  on public.estado_usuario;

create or replace function
  public.jsonb_deep_merge_preserving_missing(
    base jsonb,
    incoming jsonb
  )
returns jsonb as $$
declare
  result jsonb;
  key text;
begin
  if incoming is null then
    return base;
  end if;
  if base is null then
    return incoming;
  end if;
  if jsonb_typeof(base) <> 'object'
     or jsonb_typeof(incoming) <> 'object' then
    return incoming;
  end if;

  result := incoming;
  for key in
    select jsonb_object_keys(base)
  loop
    if result ? key then
      continue;
    end if;
    result := jsonb_set(
      result,
      array[key],
      base -> key,
      true
    );
  end loop;
  return result;
end;
$$ language plpgsql;

create or replace function
  public.proteger_estado_usuario_claves_nuevas()
returns trigger as $$
begin
  if current_setting('semaplan.skip_deep_merge', true) = '1' then
    return new;
  end if;
  new.estado :=
    public.jsonb_deep_merge_preserving_missing(
      old.estado,
      new.estado
    );
  return new;
end;
$$ language plpgsql;

create or replace function public.semaplan_version_codigo(
  p_version text
)
returns bigint
language plpgsql
immutable
as $$
declare
  v_partes text[];
begin
  v_partes := regexp_match(
    coalesce(p_version, ''),
    '^([0-9]+)\.([0-9]+)\.([0-9]+)'
  );
  if v_partes is null then
    return 0;
  end if;
  return least(v_partes[1]::bigint, 999999) * 1000000000000
    + least(v_partes[2]::bigint, 999999) * 1000000
    + least(v_partes[3]::bigint, 999999);
end;
$$;

create or replace function public.aplicar_estado_usuario_web(
  p_estado jsonb,
  p_version_esperada integer,
  p_cliente_version text
)
returns table(version integer, actualizado_en timestamptz)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_usuario_id uuid;
  v_estado_actual jsonb;
  v_version_actual integer;
  v_version_estado text;
  v_version_nueva integer;
  v_actualizado_en timestamptz;
begin
  v_usuario_id := auth.uid();
  if v_usuario_id is null then
    raise exception using
      errcode = '42501',
      message = 'semaplan_sesion_requerida';
  end if;
  if p_estado is null or jsonb_typeof(p_estado) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'semaplan_estado_invalido';
  end if;

  select eu.estado, eu.version
  into v_estado_actual, v_version_actual
  from public.estado_usuario eu
  where eu.user_id = v_usuario_id
  for update;

  if v_version_actual is null then
    if coalesce(p_version_esperada, 0) <> 0 then
      return;
    end if;
    insert into public.estado_usuario(user_id, estado)
    values (v_usuario_id, p_estado)
    on conflict (user_id) do nothing
    returning estado_usuario.version,
      estado_usuario.actualizado_en
    into v_version_nueva, v_actualizado_en;
    if v_version_nueva is null then
      return;
    end if;
    return query
      select v_version_nueva, v_actualizado_en;
    return;
  end if;

  if v_version_actual <> coalesce(p_version_esperada, 0) then
    return;
  end if;

  v_version_estado :=
    v_estado_actual #>> '{Config_Extra,Version_Programa}';
  if public.semaplan_version_codigo(p_cliente_version) <
     public.semaplan_version_codigo(v_version_estado) then
    raise exception using
      errcode = 'P0001',
      message = 'semaplan_cliente_obsoleto',
      detail = 'Actualice Semaplan antes de guardar.';
  end if;

  update public.estado_usuario eu
  set estado = public.jsonb_deep_merge_preserving_missing(
        v_estado_actual,
        p_estado
      ),
      version = eu.version + 1
  where eu.user_id = v_usuario_id
    and eu.version = v_version_actual
  returning eu.version, eu.actualizado_en
  into v_version_nueva, v_actualizado_en;

  if v_version_nueva is null then
    return;
  end if;
  return query
    select v_version_nueva, v_actualizado_en;
end;
$$;

revoke all on function
  public.aplicar_estado_usuario_web(jsonb, integer, text)
  from public;
grant execute on function
  public.aplicar_estado_usuario_web(jsonb, integer, text)
  to authenticated;

commit;
