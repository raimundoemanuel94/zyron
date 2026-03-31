/* 1. Tabela de Medidas Corporais (Usada no TabEvolucao.jsx) */
CREATE TABLE IF NOT EXISTS public.body_measurements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  weight DECIMAL,
  height DECIMAL,
  chest DECIMAL,
  waist DECIMAL,
  biceps DECIMAL,
  thigh DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own measurements" ON public.body_measurements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

/* 2. Storage Bucket para Avatares (Usada no TabPerfil.jsx) */
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

/* Políticas para o Bucket de Avatares (Storage API) */
CREATE POLICY "Avatar Upload Policy" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Avatar Update Policy" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Avatar Public View" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
