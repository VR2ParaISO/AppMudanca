-- ========================================================
-- Script para adicionar Foto na tabela Casas
-- ========================================================

ALTER TABLE casas ADD COLUMN IF NOT EXISTS foto_url text;
