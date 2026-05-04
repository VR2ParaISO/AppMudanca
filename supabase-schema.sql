-- ===========================================
-- OrganizaMudança - Schema SQL para Supabase
-- ===========================================

-- Tabela: comodos
create table if not exists comodos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  created_at timestamptz default now()
);

-- Tabela: locais
create table if not exists locais (
  id uuid default gen_random_uuid() primary key,
  comodo_id uuid not null references comodos(id) on delete cascade,
  parent_local_id uuid references locais(id) on delete cascade,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  created_at timestamptz default now()
);

-- Tabela: itens
create table if not exists itens (
  id uuid default gen_random_uuid() primary key,
  local_id uuid not null references locais(id) on delete cascade,
  user_id uuid references auth.users(id) default auth.uid(),
  nome text not null,
  especificacao text default '',
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_locais_comodo_id on locais(comodo_id);
create index if not exists idx_itens_local_id on itens(local_id);
create index if not exists idx_comodos_user_id on comodos(user_id);
create index if not exists idx_locais_user_id on locais(user_id);
create index if not exists idx_itens_user_id on itens(user_id);

-- RLS (Row Level Security) - Habilitado para Multi-Tenant
alter table comodos enable row level security;
alter table locais enable row level security;
alter table itens enable row level security;

-- Políticas de segurança (Tenant)
create policy "Tenant policy on comodos" on comodos for all using (auth.uid() = user_id);
create policy "Tenant policy on locais" on locais for all using (auth.uid() = user_id);
create policy "Tenant policy on itens" on itens for all using (auth.uid() = user_id);
