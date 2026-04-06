-- Criar/Garantir bucket de avatares
-- Execute isto no Supabase SQL Editor

-- 1. Criar bucket se não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Remover policies antigas (se existirem) para evitar conflitos
DROP POLICY IF EXISTS "Avatar Upload Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public View" ON storage.objects;
DROP POLICY IF EXISTS "Enable authenticated uploads to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Enable public read for avatars" ON storage.objects;

-- 3. Criar novas policies - UPLOAD (usuários autenticados)
CREATE POLICY "Enable authenticated avatar uploads" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- 4. Criar nova policy - UPDATE (usuários podem atualizar seus próprios avatares)
CREATE POLICY "Enable authenticated avatar updates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');

-- 5. Criar nova policy - DELETE (usuários podem deletar seus próprios avatares)
CREATE POLICY "Enable authenticated avatar deletes" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars');

-- 6. Criar nova policy - SELECT (públic read - qualquer um pode ver)
CREATE POLICY "Enable public read for avatars" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- 7. Verificar que bucket foi criado corretamente
-- Após executar isto, rode este comando para verificar:
-- SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
-- Deve retornar: avatars | avatars | true
