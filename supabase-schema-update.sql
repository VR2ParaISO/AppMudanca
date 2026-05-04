-- ========================================================
-- Script de Atualização para Multi-Usuário (Tenant)
-- ========================================================

-- 1. Adicionar coluna user_id nas tabelas com valor padrão
ALTER TABLE comodos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE locais ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE itens ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE comodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE locais ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens ENABLE ROW LEVEL SECURITY;

-- 3. Remover as políticas antigas se existirem (aquelas do schema inicial)
DROP POLICY IF EXISTS "Allow all on comodos" ON comodos;
DROP POLICY IF EXISTS "Allow all on locais" ON locais;
DROP POLICY IF EXISTS "Allow all on itens" ON itens;

-- 4. Criar novas políticas baseadas no user_id
-- O usuário só pode ver/modificar seus próprios registros.
-- (Deixamos os NULL acessíveis temporariamente para a migração logo abaixo funcionar para qualquer um rodando o comando)

CREATE POLICY "Tenant policy on comodos" ON comodos
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenant policy on locais" ON locais
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Tenant policy on itens" ON itens
FOR ALL USING (auth.uid() = user_id);

-- ========================================================
-- ATENÇÃO: EXECUTE A ETAPA ABAIXO *APÓS* CRIAR O SEU PRIMEIRO USUÁRIO!
-- ========================================================
-- Este bloco vinculará todos os registros existentes (sem dono) 
-- ao PRIMEIRO usuário criado no seu projeto.
-- 
-- DO $$
-- DECLARE
--   first_user_id UUID;
-- BEGIN
--   SELECT id INTO first_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
--   
--   IF first_user_id IS NOT NULL THEN
--     UPDATE comodos SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE locais SET user_id = first_user_id WHERE user_id IS NULL;
--     UPDATE itens SET user_id = first_user_id WHERE user_id IS NULL;
--   END IF;
-- END $$;
