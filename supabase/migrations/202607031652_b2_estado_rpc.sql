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

create or replace function public.aplicar_estado_usuario_b2(
  p_usuario_id uuid,
  p_estado jsonb,
  p_version_esperada integer
)
returns table(version integer)
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('semaplan.skip_deep_merge', '1', true);

  return query
  update public.estado_usuario eu
  set estado = p_estado,
      version = eu.version + 1
  where eu.user_id = p_usuario_id
    and eu.version = p_version_esperada
  returning eu.version;
end;
$$;

revoke all on function
  public.aplicar_estado_usuario_b2(uuid, jsonb, integer)
  from public;

grant execute on function
  public.aplicar_estado_usuario_b2(uuid, jsonb, integer)
  to service_role;
