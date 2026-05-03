-- ===========================================
-- OrganizaMudança - Schema SQL para Supabase
-- ===========================================

-- Tabela: comodos
create table if not exists comodos (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  created_at timestamptz default now()
);

-- Tabela: locais
create table if not exists locais (
  id uuid default gen_random_uuid() primary key,
  comodo_id uuid not null references comodos(id) on delete cascade,
  nome text not null,
  created_at timestamptz default now()
);

-- Tabela: itens
create table if not exists itens (
  id uuid default gen_random_uuid() primary key,
  local_id uuid not null references locais(id) on delete cascade,
  nome text not null,
  especificacao text default '',
  created_at timestamptz default now()
);

-- Índices para performance
create index if not exists idx_locais_comodo_id on locais(comodo_id);
create index if not exists idx_itens_local_id on itens(local_id);

-- RLS (Row Level Security) - desabilitado por enquanto para simplicidade
-- Habilite se adicionar autenticação futuramente
alter table comodos enable row level security;
alter table locais enable row level security;
alter table itens enable row level security;

-- Políticas abertas (acesso público via anon key)
create policy "Allow all on comodos" on comodos for all using (true) with check (true);
create policy "Allow all on locais" on locais for all using (true) with check (true);
create policy "Allow all on itens" on itens for all using (true) with check (true);
