-- ═══════════════════════════════════════════════════════════════════════
-- ZYRON - CORREÇÃO COMPLETA DO BANCO DE DADOS
-- Execute TUDO isso no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────
-- 1. TABELA PROFILES - Garantir todas as colunas
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 25,
  ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male',
  ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 175,
  ADD COLUMN IF NOT EXISTS weight NUMERIC(5,2) DEFAULT 75,
  ADD COLUMN IF NOT EXISTS goal TEXT DEFAULT 'hipertrofia',
  ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'iniciante',
  ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS target_weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS water_goal INTEGER DEFAULT 2500,
  ADD COLUMN IF NOT EXISTS protein_goal INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS observations TEXT,
  ADD COLUMN IF NOT EXISTS medical_history TEXT,
  ADD COLUMN IF NOT EXISTS injuries TEXT,
  ADD COLUMN IF NOT EXISTS restrictions TEXT,
  ADD COLUMN IF NOT EXISTS plan_status TEXT DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- ─────────────────────────────────────────────────────────────────────
-- 2. TABELA DAILY_STATS - Garantir todas as colunas
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_amount INTEGER DEFAULT 0,
  protein_amount INTEGER DEFAULT 0,
  weight_kg NUMERIC(5,2),
  calories_kcal INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_stats
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS calories_kcal INTEGER DEFAULT 0;

-- ─────────────────────────────────────────────────────────────────────
-- 3. TABELA WORKOUT_LOGS - Garantir estrutura
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_key TEXT,
  duration_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS workout_key TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- ─────────────────────────────────────────────────────────────────────
-- 4. TABELA WORKOUT_PHOTOS - Garantir estrutura
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 5. TABELA EXERCISE_COMPLETIONS - Garantir estrutura
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT,
  reps INTEGER,
  sets INTEGER,
  notes TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. TABELA EXERCISE_PRS (Personal Records)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exercise_prs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT,
  max_load NUMERIC(6,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. RLS - ATIVAR E CONFIGURAR TODAS AS TABELAS
-- ─────────────────────────────────────────────────────────────────────

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- DAILY_STATS
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own daily stats" ON public.daily_stats;
CREATE POLICY "Users can manage own daily stats" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WORKOUT_LOGS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own workout logs" ON public.workout_logs;
CREATE POLICY "Users can manage own workout logs" ON public.workout_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WORKOUT_PHOTOS
ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own workout photos" ON public.workout_photos;
CREATE POLICY "Users can manage own workout photos" ON public.workout_photos
  FOR ALL USING (auth.uid()::text = user_id::text) WITH CHECK (auth.uid()::text = user_id::text);

-- EXERCISE_COMPLETIONS
ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own exercise completions" ON public.exercise_completions;
CREATE POLICY "Users can manage own exercise completions" ON public.exercise_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- EXERCISE_PRS
ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own exercise prs" ON public.exercise_prs;
CREATE POLICY "Users can manage own exercise prs" ON public.exercise_prs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 8. STORAGE - BUCKETS E POLÍTICAS
-- ─────────────────────────────────────────────────────────────────────

-- Bucket avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Bucket workout_photos
INSERT INTO storage.buckets (id, name, public) VALUES ('workout_photos', 'workout_photos', true) ON CONFLICT (id) DO NOTHING;

-- Policies storage avatars
DROP POLICY IF EXISTS "avatars-public-read" ON storage.objects;
DROP POLICY IF EXISTS "avatars-auth-insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars-auth-update" ON storage.objects;

CREATE POLICY "avatars-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars-auth-update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Policies storage workout_photos
DROP POLICY IF EXISTS "workout-photos-public-read" ON storage.objects;
DROP POLICY IF EXISTS "workout-photos-auth-insert" ON storage.objects;

CREATE POLICY "workout-photos-public-read" ON storage.objects FOR SELECT USING (bucket_id = 'workout_photos');
CREATE POLICY "workout-photos-auth-insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'workout_photos' AND auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────
-- 9. TRIGGER - Auto-criar profile ao criar usuário
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────
-- 10. REFRESH DO SCHEMA CACHE DO POSTGREST
-- ─────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';
