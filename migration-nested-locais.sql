-- ========================================================
-- Script de Migração: Locais Aninhados (Sub-locais)
-- ========================================================

-- Adiciona a coluna para referenciar o local "pai" (opcional)
ALTER TABLE locais ADD COLUMN IF NOT EXISTS parent_local_id UUID REFERENCES locais(id) ON DELETE CASCADE;

-- Atualiza a política de segurança para cobrir possíveis novas interações de update, caso necessário
-- A política atual baseada em user_id já cobre isso perfeitamente (auth.uid() = user_id)
