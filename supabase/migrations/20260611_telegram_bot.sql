create table if not exists public.telegram_vinculos_usuario (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null unique,
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  alias text,
  habilitado boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index if not exists telegram_vinculos_usuario_usuario_idx
  on public.telegram_vinculos_usuario (usuario_id);

create index if not exists telegram_vinculos_usuario_habilitado_idx
  on public.telegram_vinculos_usuario
  (telegram_user_id, habilitado);

create table if not exists public.telegram_comandos_usuario (
  id uuid primary key default gen_random_uuid(),
  telegram_update_id bigint not null unique,
  telegram_message_id bigint,
  telegram_chat_id text not null,
  telegram_user_id text not null,
  usuario_id uuid
    references auth.users(id)
    on delete set null,
  comando text not null,
  texto_original text not null,
  estado text not null default 'recibido',
  resultado jsonb not null default '{}'::jsonb,
  error text,
  creado_en timestamptz not null default now(),
  procesado_en timestamptz
);

create index if not exists telegram_comandos_usuario_usuario_idx
  on public.telegram_comandos_usuario (usuario_id, creado_en desc);

create index if not exists telegram_comandos_usuario_telegram_idx
  on public.telegram_comandos_usuario
  (telegram_user_id, creado_en desc);

create table if not exists public.telegram_confirmaciones_usuario (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id text not null,
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  codigo text not null,
  accion text not null,
  payload jsonb not null default '{}'::jsonb,
  estado text not null default 'pendiente',
  creado_en timestamptz not null default now(),
  expira_en timestamptz not null
    default (now() + interval '10 minutes'),
  resuelto_en timestamptz
);

create unique index if not exists
  telegram_confirmaciones_usuario_codigo_idx
  on public.telegram_confirmaciones_usuario
  (telegram_user_id, codigo)
  where estado = 'pendiente';

create index if not exists
  telegram_confirmaciones_usuario_usuario_idx
  on public.telegram_confirmaciones_usuario
  (usuario_id, creado_en desc);

create or replace function
  public.actualizar_timestamp_telegram()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists
  trigger_telegram_vinculos_actualizado
  on public.telegram_vinculos_usuario;
create trigger trigger_telegram_vinculos_actualizado
  before update on public.telegram_vinculos_usuario
  for each row
  execute function public.actualizar_timestamp_telegram();

alter table public.telegram_vinculos_usuario
  enable row level security;

alter table public.telegram_comandos_usuario
  enable row level security;

alter table public.telegram_confirmaciones_usuario
  enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'telegram_vinculos_usuario'
      and policyname = 'telegram_vinculos_select_propios'
  ) then
    create policy "telegram_vinculos_select_propios"
      on public.telegram_vinculos_usuario
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
      and tablename = 'telegram_vinculos_usuario'
      and policyname = 'telegram_vinculos_insert_propios'
  ) then
    create policy "telegram_vinculos_insert_propios"
      on public.telegram_vinculos_usuario
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
      and tablename = 'telegram_vinculos_usuario'
      and policyname = 'telegram_vinculos_update_propios'
  ) then
    create policy "telegram_vinculos_update_propios"
      on public.telegram_vinculos_usuario
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
      and tablename = 'telegram_vinculos_usuario'
      and policyname = 'telegram_vinculos_delete_propios'
  ) then
    create policy "telegram_vinculos_delete_propios"
      on public.telegram_vinculos_usuario
      for delete
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
      and tablename = 'telegram_comandos_usuario'
      and policyname = 'telegram_comandos_select_propios'
  ) then
    create policy "telegram_comandos_select_propios"
      on public.telegram_comandos_usuario
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
      and tablename = 'telegram_confirmaciones_usuario'
      and policyname = 'telegram_confirmaciones_select_propias'
  ) then
    create policy "telegram_confirmaciones_select_propias"
      on public.telegram_confirmaciones_usuario
      for select
      to authenticated
      using (auth.uid() = usuario_id);
  end if;
end
$$;
