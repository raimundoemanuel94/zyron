-- ═══════════════════════════════════════════════════════════════════════════════
-- ZYRON — FIX COMPLETO: Recursão Infinita + Schema + Trigger
-- Execute TUDO isso no Supabase SQL Editor de uma vez
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 1: DROPAR TODAS AS POLICIES DA TABELA PROFILES (inclusive a recursiva)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 2: DROPAR POLICIES DEPENDENTES DA is_admin() E DEPOIS A FUNÇÃO
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all links"                       ON public.trainer_students;
DROP POLICY IF EXISTS "Admins have full access to profiles"               ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all workout logs"                  ON public.workout_logs;
DROP POLICY IF EXISTS "Admins can view all daily stats"                   ON public.daily_stats;
DROP POLICY IF EXISTS "Admins can manage all measurements"                ON public.body_measurements;
DROP POLICY IF EXISTS "Admins can manage all custom workouts"             ON public.custom_workouts;

-- Dropar qualquer outra policy que use is_admin() (varredura completa)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE qual LIKE '%is_admin%' OR with_check LIKE '%is_admin%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 3: RECRIAR POLICIES SIMPLES E SEGURAS (sem recursão)
-- Regra: nunca consultar a própria tabela profiles dentro de uma policy dela
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 4: GARANTIR TODAS AS COLUNAS DA TABELA PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
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

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 5: GARANTIR TABELA DAILY_STATS COM COLUNA stat_date
-- (renomear date → stat_date para evitar conflito com palavra reservada)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  water_amount NUMERIC(6,2) DEFAULT 0,
  protein_amount NUMERIC(6,2) DEFAULT 0,
  weight_kg NUMERIC(5,2),
  calories_kcal INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, stat_date)
);

-- Se a tabela já existe com coluna 'date', adicionar stat_date como alias seguro
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS stat_date DATE;
UPDATE public.daily_stats SET stat_date = date WHERE stat_date IS NULL AND date IS NOT NULL;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS calories_kcal INTEGER DEFAULT 0;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS water_amount NUMERIC(6,2) DEFAULT 0;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS protein_amount NUMERIC(6,2) DEFAULT 0;

-- RLS daily_stats
ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own daily stats" ON public.daily_stats;
DROP POLICY IF EXISTS "daily_stats_own" ON public.daily_stats;
CREATE POLICY "daily_stats_own" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 6: GARANTIR TABELA WORKOUT_LOGS COM COLUNAS CORRETAS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_key TEXT,
  workout_name TEXT,
  duration_seconds INTEGER DEFAULT 0,
  duration_minutes INTEGER GENERATED ALWAYS AS (COALESCE(duration_seconds / 60, 0)) STORED,
  exercises_completed INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS workout_key TEXT,
  ADD COLUMN IF NOT EXISTS workout_name TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exercises_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Adicionar duration_minutes se não existir (computed ou regular)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_logs'
      AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE public.workout_logs ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- Sincronizar duration_minutes com duration_seconds para registros existentes
UPDATE public.workout_logs
SET duration_minutes = COALESCE(duration_seconds / 60, 0)
WHERE duration_minutes IS NULL AND duration_seconds IS NOT NULL;

-- RLS workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "workout_logs_own" ON public.workout_logs;
CREATE POLICY "workout_logs_own" ON public.workout_logs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 7: GARANTIR TABELA WORKOUT_PHOTOS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workout_photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own workout photos" ON public.workout_photos;
DROP POLICY IF EXISTS "workout_photos_own" ON public.workout_photos;
CREATE POLICY "workout_photos_own" ON public.workout_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 8: EXERCISE_COMPLETIONS E EXERCISE_PRS
-- ─────────────────────────────────────────────────────────────────────────────
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

ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercise_completions_own" ON public.exercise_completions;
CREATE POLICY "exercise_completions_own" ON public.exercise_completions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.exercise_prs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT,
  max_load NUMERIC(6,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "exercise_prs_own" ON public.exercise_prs;
CREATE POLICY "exercise_prs_own" ON public.exercise_prs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 9: STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('workout_photos', 'workout_photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies storage — dropar e recriar
DROP POLICY IF EXISTS "avatars-public-read"    ON storage.objects;
DROP POLICY IF EXISTS "avatars-auth-insert"    ON storage.objects;
DROP POLICY IF EXISTS "avatars-auth-update"    ON storage.objects;
DROP POLICY IF EXISTS "avatars-auth-delete"    ON storage.objects;
DROP POLICY IF EXISTS "workout-photos-public-read"  ON storage.objects;
DROP POLICY IF EXISTS "workout-photos-auth-insert"  ON storage.objects;
DROP POLICY IF EXISTS "workout-photos-auth-delete"  ON storage.objects;

CREATE POLICY "avatars-public-read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars-auth-insert"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars-auth-update"   ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars-auth-delete"   ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

CREATE POLICY "workout-photos-public-read"  ON storage.objects FOR SELECT USING (bucket_id = 'workout_photos');
CREATE POLICY "workout-photos-auth-insert"  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'workout_photos' AND auth.uid() IS NOT NULL);
CREATE POLICY "workout-photos-auth-delete"  ON storage.objects FOR DELETE USING (bucket_id = 'workout_photos' AND auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 10: TRIGGER HANDLE_NEW_USER (sem recursão, SECURITY DEFINER correto)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'USER'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 11: CRIAR PERFIL PARA USUÁRIOS EXISTENTES QUE NÃO TÊM PERFIL
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.profiles (id, name, email, role)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'USER'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- ─────────────────────────────────────────────────────────────────────────────
-- PASSO 12: REFRESH DO SCHEMA CACHE
-- ─────────────────────────────────────────────────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ✅ PRONTO! O app deve funcionar normalmente agora.
