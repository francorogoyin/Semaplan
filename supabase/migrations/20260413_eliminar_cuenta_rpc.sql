create or replace function public.eliminar_cuenta()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    raise exception 'No autenticado';
  end if;

  delete from public.estado_usuario
  where user_id = _uid;

  delete from public.suscripciones_historial
  where usuario_id = _uid;

  delete from public.suscripciones
  where usuario_id = _uid;

  delete from auth.users
  where id = _uid;
end;
$$;

revoke all on function public.eliminar_cuenta() from public;
grant execute on function public.eliminar_cuenta() to authenticated;
