-- ========================================================
-- Script de Migração para Multi-Casas (Projetos)
-- ========================================================

-- 1. Criar tabela casas
CREATE TABLE IF NOT EXISTS casas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid(),
  nome text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Habilitar RLS e políticas
ALTER TABLE casas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant policy on casas" ON casas
FOR ALL USING (auth.uid() = user_id);

-- 3. Adicionar casa_id em comodos
ALTER TABLE comodos ADD COLUMN IF NOT EXISTS casa_id uuid REFERENCES casas(id) ON DELETE CASCADE;

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_comodos_casa_id ON comodos(casa_id);
CREATE INDEX IF NOT EXISTS idx_casas_user_id ON casas(user_id);

-- 5. Script de migração de dados otimizado para o usuário atual
DO $$
DECLARE
  v_user_id UUID := '4e4d206e-4a0c-41a7-a11f-c8b566288e1d';
  v_casa_id UUID;
BEGIN
  -- Verificar se já existe uma casa para o usuário
  SELECT id INTO v_casa_id FROM casas WHERE user_id = v_user_id LIMIT 1;
  
  -- Se não existir, criar a primeira casa
  IF v_casa_id IS NULL THEN
    INSERT INTO casas (user_id, nome) VALUES (v_user_id, 'Minha Casa') RETURNING id INTO v_casa_id;
  END IF;

  -- Vincular todos os cômodos (com ou sem usuário definido) para a nova casa e usuário
  UPDATE comodos SET casa_id = v_casa_id, user_id = COALESCE(user_id, v_user_id) WHERE casa_id IS NULL;
  
END $$;
