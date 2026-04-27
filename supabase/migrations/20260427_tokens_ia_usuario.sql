create table if not exists public.tokens_ia_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  nombre text not null default 'Integracion IA',
  token_hash text not null unique,
  scopes text[] not null default array['read']::text[],
  ultimo_uso_en timestamptz,
  creado_en timestamptz not null default now(),
  revocado_en timestamptz
);

create index if not exists tokens_ia_usuario_usuario_idx
  on public.tokens_ia_usuario (usuario_id);

create index if not exists tokens_ia_usuario_revocado_idx
  on public.tokens_ia_usuario (usuario_id, revocado_en);

alter table public.tokens_ia_usuario enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tokens_ia_usuario'
      and policyname = 'tokens_ia_usuario_select_propios'
  ) then
    create policy "tokens_ia_usuario_select_propios"
      on public.tokens_ia_usuario
      for select
      to authenticated
      using (auth.uid() = usuario_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tokens_ia_usuario'
      and policyname = 'tokens_ia_usuario_insert_propios'
  ) then
    create policy "tokens_ia_usuario_insert_propios"
      on public.tokens_ia_usuario
      for insert
      to authenticated
      with check (auth.uid() = usuario_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tokens_ia_usuario'
      and policyname = 'tokens_ia_usuario_update_propios'
  ) then
    create policy "tokens_ia_usuario_update_propios"
      on public.tokens_ia_usuario
      for update
      to authenticated
      using (auth.uid() = usuario_id)
      with check (auth.uid() = usuario_id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'tokens_ia_usuario'
      and policyname = 'tokens_ia_usuario_delete_propios'
  ) then
    create policy "tokens_ia_usuario_delete_propios"
      on public.tokens_ia_usuario
      for delete
      to authenticated
      using (auth.uid() = usuario_id);
  end if;
end
$$;
