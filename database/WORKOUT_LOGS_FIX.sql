-- ═══════════════════════════════════════════════════════════════════════════════
-- ZYRON — FIX DEFINITIVO: workout_logs 400 Bad Request
-- Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- PASSO 1: Ver o que está acontecendo (execute separado primeiro para diagnóstico)
-- SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'workout_logs';
-- SELECT column_name, data_type, column_default, is_generated FROM information_schema.columns WHERE table_name = 'workout_logs' AND table_schema = 'public' ORDER BY ordinal_position;

-- PASSO 2: Dropar qualquer coluna gerada que cause problemas
DO $$
DECLARE
  col RECORD;
BEGIN
  FOR col IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workout_logs'
      AND is_generated = 'ALWAYS'
  LOOP
    EXECUTE format('ALTER TABLE public.workout_logs DROP COLUMN IF EXISTS %I', col.column_name);
    RAISE NOTICE 'Dropped generated column: %', col.column_name;
  END LOOP;
END $$;

-- PASSO 3: Garantir colunas corretas (sem generated, tudo simples)
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS workout_key TEXT,
  ADD COLUMN IF NOT EXISTS workout_name TEXT,
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exercises_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

-- Sincronizar duration_minutes para registros existentes
UPDATE public.workout_logs
SET duration_minutes = COALESCE(duration_seconds / 60, 0)
WHERE duration_minutes IS NULL OR duration_minutes = 0;

-- PASSO 4: Dropar TODAS as policies do workout_logs e recriar limpas
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'workout_logs' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.workout_logs', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wl_select_own" ON public.workout_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "wl_insert_own" ON public.workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wl_update_own" ON public.workout_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "wl_delete_own" ON public.workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- PASSO 5: Mesma coisa para daily_stats (garantir políticas limpas)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'daily_stats' AND schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_stats', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ds_all_own" ON public.daily_stats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- PASSO 6: Garantir coluna stat_date no daily_stats
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS stat_date DATE;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2);
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS water_amount NUMERIC(6,2) DEFAULT 0;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS protein_amount NUMERIC(6,2) DEFAULT 0;
ALTER TABLE public.daily_stats ADD COLUMN IF NOT EXISTS calories_kcal INTEGER DEFAULT 0;

-- Preencher stat_date onde estiver nulo (usando coluna 'date' se existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'daily_stats' AND column_name = 'date'
  ) THEN
    UPDATE public.daily_stats SET stat_date = date WHERE stat_date IS NULL;
  ELSE
    UPDATE public.daily_stats SET stat_date = CURRENT_DATE WHERE stat_date IS NULL;
  END IF;
END $$;

-- PASSO 7: Refresh cache do PostgREST
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload schema');

-- VERIFICAÇÃO FINAL: deve retornar as policies novas
SELECT tablename, policyname, cmd FROM pg_policies
WHERE tablename IN ('workout_logs', 'daily_stats', 'profiles')
ORDER BY tablename, cmd;
