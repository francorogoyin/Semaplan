create table if not exists public.ia_mutaciones_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  origen text not null default 'chatgpt',
  accion text not null,
  scope text not null,
  idempotency_key text,
  payload jsonb not null default '{}'::jsonb,
  resultado jsonb not null default '{}'::jsonb,
  estado text not null default 'aplicado',
  error text,
  version_antes bigint,
  version_despues bigint,
  estado_antes jsonb,
  creado_en timestamptz not null default now()
);

create unique index if not exists
  ia_mutaciones_usuario_idempotency_idx
  on public.ia_mutaciones_usuario (usuario_id, idempotency_key)
  where idempotency_key is not null
    and idempotency_key <> '';

create index if not exists ia_mutaciones_usuario_usuario_idx
  on public.ia_mutaciones_usuario (usuario_id, creado_en desc);

create table if not exists public.ia_confirmaciones_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  origen text not null default 'chatgpt',
  accion text not null,
  scope text not null,
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente',
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null
    default (now() + interval '10 minutes'),
  resuelto_en timestamptz
);

create index if not exists ia_confirmaciones_usuario_usuario_idx
  on public.ia_confirmaciones_usuario (usuario_id, creado_en desc);

create index if not exists ia_confirmaciones_usuario_estado_idx
  on public.ia_confirmaciones_usuario
  (usuario_id, estado, expira_en);

alter table public.ia_mutaciones_usuario
  enable row level security;

alter table public.ia_confirmaciones_usuario
  enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ia_mutaciones_usuario'
      and policyname = 'ia_mutaciones_select_propias'
  ) then
    create policy "ia_mutaciones_select_propias"
      on public.ia_mutaciones_usuario
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
      and tablename = 'ia_confirmaciones_usuario'
      and policyname = 'ia_confirmaciones_select_propias'
  ) then
    create policy "ia_confirmaciones_select_propias"
      on public.ia_confirmaciones_usuario
      for select
      to authenticated
      using (auth.uid() = usuario_id);
  end if;
end
$$;
