-- Adiciona suporte a nomenclatura customizada por projeto (INDEXIA)
ALTER TABLE public.casas
ADD COLUMN label_nivel1 TEXT,
ADD COLUMN label_nivel2 TEXT,
ADD COLUMN label_nivel3 TEXT,
ADD COLUMN label_nivel4 TEXT;

-- Opcional: Atualizar a view ou rls, mas como as colunas são parte da tabela e a RLS original já cobre a tabela, não é necessário modificar a RLS.
