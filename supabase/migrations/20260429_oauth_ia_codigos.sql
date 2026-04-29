create table if not exists public.oauth_ia_codigos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null
    references auth.users(id)
    on delete cascade,
  cliente_id text not null,
  redirect_uri text not null,
  scopes text[] not null default array['read']::text[],
  code_hash text not null unique,
  expira_en timestamptz not null,
  usado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists oauth_ia_codigos_usuario_idx
  on public.oauth_ia_codigos (usuario_id);

create index if not exists oauth_ia_codigos_expira_idx
  on public.oauth_ia_codigos (expira_en);

alter table public.oauth_ia_codigos enable row level security;
