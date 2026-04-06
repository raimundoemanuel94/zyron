-- Adicionar colunas faltantes ao profiles table
-- Execute isto no Supabase SQL Editor

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS body_fat_percent DECIMAL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS injuries TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restrictions TEXT;

-- Goals
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS frequency_per_week INTEGER DEFAULT 3;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_weight_kg DECIMAL;

-- Preferences
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_formula_ml_per_kg DECIMAL DEFAULT 35;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS protein_formula_g_per_kg DECIMAL DEFAULT 2.2;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS activity_factor DECIMAL DEFAULT 1.4;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS night_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT TRUE;

-- Settings
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS water_goal DECIMAL DEFAULT 2500;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS protein_goal DECIMAL DEFAULT 120;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Updated timestamp
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- Atualizar timestamp de profiles existentes
UPDATE public.profiles SET updated_at = COALESCE(updated_at, now()) WHERE updated_at IS NULL;
