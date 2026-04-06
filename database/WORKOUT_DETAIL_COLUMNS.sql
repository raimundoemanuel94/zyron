-- ============================================================
-- ZYRON — Workout Detail Columns
-- Execute no Supabase SQL Editor
-- ============================================================

-- 1. Adicionar colunas de detalhe em workout_logs
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS workout_name   TEXT,
  ADD COLUMN IF NOT EXISTS started_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS location       TEXT;

-- 2. Backfill: usar created_at como ended_at para logs antigos
UPDATE public.workout_logs
SET ended_at = created_at
WHERE ended_at IS NULL;

-- 3. Garantir que set_logs existe com todos os campos
CREATE TABLE IF NOT EXISTS public.set_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id   UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_id  TEXT NOT NULL,
  set_number   INTEGER,
  weight_kg    NUMERIC,
  reps         INTEGER,
  rpe          INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS para set_logs
ALTER TABLE public.set_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own set_logs" ON public.set_logs;
CREATE POLICY "Users can manage own set_logs" ON public.set_logs
  FOR ALL USING (auth.uid() = user_id);

-- 5. Garantir que workout_photos existe
CREATE TABLE IF NOT EXISTS public.workout_photos (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id   UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path     TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own workout_photos" ON public.workout_photos;
CREATE POLICY "Users can manage own workout_photos" ON public.workout_photos
  FOR ALL USING (auth.uid() = user_id);

-- 6. Recarregar schema cache do PostgREST
NOTIFY pgrst, 'reload schema';
