/* 🗄️ ZYRON RBAC & Security Industrial - Migration Script v1.2 (Bypass Infinite Recursion) */

/* 1. Garantir RLS em todas as tabelas críticas */
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_workouts ENABLE ROW LEVEL SECURITY;

/* 
  ⚡ SEGURANÇA INDUSTRIAL: Evitando Recursão Infinita (500 Error)
  Para evitar que a tabela "profiles" consulte a si mesma repetidamente, 
  criamos uma função SEGURA que roda com privilégios de bypass (SECURITY DEFINER).
*/
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/* 2. Políticas de Base para Perfis (Profiles) */
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

/* 3. Tabela de Relacionamento Treinador-Aluno */
CREATE TABLE IF NOT EXISTS public.trainer_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

/* Políticas para trainer_students */
DROP POLICY IF EXISTS "Personals can manage their students link" ON public.trainer_students;
CREATE POLICY "Personals can manage their students link" ON public.trainer_students
  FOR ALL USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Admins can manage all links" ON public.trainer_students;
CREATE POLICY "Admins can manage all links" ON public.trainer_students
  FOR ALL USING (public.is_admin());

/* 4. Acesso de Personal a Dados de Alunos */

/* PROFILES: Personal vê perfis de seus alunos */
DROP POLICY IF EXISTS "Personals can view their students' profiles" ON public.profiles;
CREATE POLICY "Personals can view their students' profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.profiles.id)
  );

/* WORKOUT_LOGS: Personal vê logs de seus alunos */
DROP POLICY IF EXISTS "Personals can view their students' logs" ON public.workout_logs;
CREATE POLICY "Personals can view their students' logs" ON public.workout_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.workout_logs.user_id)
  );

/* DAILY_STATS: Personal vê stats de seus alunos */
DROP POLICY IF EXISTS "Personals can view their students' stats" ON public.daily_stats;
CREATE POLICY "Personals can view their students' stats" ON public.daily_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.daily_stats.user_id)
  );

/* BODY_MEASUREMENTS: Personal gerencia medidas de seus alunos */
DROP POLICY IF EXISTS "Personals can manage their students' measurements" ON public.body_measurements;
CREATE POLICY "Personals can manage their students' measurements" ON public.body_measurements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.body_measurements.user_id)
  );

/* CUSTOM_WORKOUTS: Personal gerencia treinos de seus alunos */
DROP POLICY IF EXISTS "Personals can manage their students' custom workouts" ON public.custom_workouts;
CREATE POLICY "Personals can manage their students' custom workouts" ON public.custom_workouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.custom_workouts.user_id)
  );

