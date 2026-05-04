-- ========================================================
-- Script de Configuração: Upload de Fotos (Storage)
-- ========================================================

-- 1. Adicionar a coluna foto_url na tabela itens
ALTER TABLE itens ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- 2. Criar o Bucket no Supabase Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos', 'fotos', true) -- O bucket é "público" para leitura rápida via URL, mas as políticas abaixo controlam o resto
ON CONFLICT (id) DO NOTHING;

-- 3. Habilitar RLS na tabela de objetos do Storage
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Storage) para garantir o isolamento (Tenant)
-- O usuário logado só pode enviar, atualizar e deletar fotos dentro de uma pasta com o seu próprio ID (ex: fotos/uuid_do_usuario/foto.jpg)

-- Permite UPLOAD apenas na pasta do usuário
DROP POLICY IF EXISTS "Usuários podem fazer upload na própria pasta" ON storage.objects;
CREATE POLICY "Usuários podem fazer upload na própria pasta"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permite DELETE apenas na pasta do usuário
DROP POLICY IF EXISTS "Usuários podem apagar as próprias fotos" ON storage.objects;
CREATE POLICY "Usuários podem apagar as próprias fotos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permite UPDATE apenas na pasta do usuário
DROP POLICY IF EXISTS "Usuários podem atualizar as próprias fotos" ON storage.objects;
CREATE POLICY "Usuários podem atualizar as próprias fotos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Permite LEITURA pública para todas as imagens (já que o bucket foi criado como público e os links no app já têm UUID seguro/imprevisível)
DROP POLICY IF EXISTS "Fotos são visíveis publicamente" ON storage.objects;
CREATE POLICY "Fotos são visíveis publicamente"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'fotos');
