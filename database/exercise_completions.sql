-- Tabela para rastrear exercícios completados em uma sessão
CREATE TABLE IF NOT EXISTS public.exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  reps INTEGER,
  sets INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own exercise completions" ON public.exercise_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exercise completions" ON public.exercise_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exercise completions" ON public.exercise_completions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own exercise completions" ON public.exercise_completions
  FOR DELETE USING (auth.uid() = user_id);

-- Index para melhor performance
CREATE INDEX IF NOT EXISTS idx_exercise_completions_session
  ON public.exercise_completions(session_id);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_user
  ON public.exercise_completions(user_id, completed_at DESC);
