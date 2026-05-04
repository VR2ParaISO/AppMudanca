-- ========================================================
-- Script de Configuração: Fotos em Cômodos e Locais
-- ========================================================

-- Adicionar a coluna foto_url na tabela comodos
ALTER TABLE comodos ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Adicionar a coluna foto_url na tabela locais
ALTER TABLE locais ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- (As permissões do Storage Bucket 'fotos' já foram configuradas no script anterior 
-- e são amplas o suficiente para aceitar arquivos em subpastas com o seu user_id)
