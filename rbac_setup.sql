/* 🗄️ ZYRON RBAC & Security Industrial - Migration Script */

/* 1. Tabela de Relacionamento Treinador-Aluno */
CREATE TABLE IF NOT EXISTS public.trainer_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(trainer_id, student_id)
);

ALTER TABLE public.trainer_students ENABLE ROW LEVEL SECURITY;

/* Políticas para trainer_students */
CREATE POLICY "Personals can manage their students link" ON public.trainer_students
  FOR ALL USING (auth.uid() = trainer_id);

CREATE POLICY "Admins can manage all links" ON public.trainer_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

/* 2. Reforço de RLS em Tabelas Core para Acesso de Personal */

/* PROFILES: Permitir que Personal veja perfis de seus alunos */
DROP POLICY IF EXISTS "Personals can view profiles by email" ON public.profiles;
CREATE POLICY "Personals can view their students' profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.profiles.id)
    OR role = 'PERSONAL' AND id = auth.uid()
  );

/* WORKOUT_LOGS: Permitir que Personal veja logs de seus alunos */
CREATE POLICY "Personals can view their students' logs" ON public.workout_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.workout_logs.user_id)
  );

/* DAILY_STATS: Permitir que Personal veja stats de seus alunos */
CREATE POLICY "Personals can view their students' stats" ON public.daily_stats
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.daily_stats.user_id)
  );

/* BODY_MEASUREMENTS: Permitir que Personal veja medidas de seus alunos */
CREATE POLICY "Personals can manage their students' measurements" ON public.body_measurements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.body_measurements.user_id)
  );

/* CUSTOM_WORKOUTS: Permitir que Personal gerencie treinos apenas de seus alunos */
CREATE POLICY "Personals can manage their students' custom workouts" ON public.custom_workouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.trainer_students WHERE trainer_id = auth.uid() AND student_id = public.custom_workouts.user_id)
  );
