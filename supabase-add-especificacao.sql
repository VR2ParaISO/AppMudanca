-- ========================================================
-- Script para adicionar a coluna "especificacao" 
-- em todas as entidades para permitir detalhes extras
-- ========================================================

ALTER TABLE casas ADD COLUMN IF NOT EXISTS especificacao text DEFAULT '';
ALTER TABLE comodos ADD COLUMN IF NOT EXISTS especificacao text DEFAULT '';
ALTER TABLE locais ADD COLUMN IF NOT EXISTS especificacao text DEFAULT '';
