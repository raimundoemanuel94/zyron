-- ═══════════════════════════════════════════════════════════════════════════════
-- FIX: Workout Photos Storage and Table Permissions
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ensure workout_photos bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('workout_photos', 'workout_photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set public access to bucket
UPDATE storage.buckets
SET public = true
WHERE id = 'workout_photos';

-- 3. Drop old policies and create new ones
DROP POLICY IF EXISTS "Allow public read from workout_photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload workout photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own workout photos" ON storage.objects;

-- 4. Create new policies for workout_photos bucket
CREATE POLICY "Allow public read from workout_photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'workout_photos');

CREATE POLICY "Allow users to upload workout photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'workout_photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Allow users to delete own workout photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'workout_photos'
  AND owner_id = auth.uid()
);

-- 5. Ensure workout_photos table has correct RLS
ALTER TABLE public.workout_photos ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies on workout_photos table
DROP POLICY IF EXISTS "Users can insert own workout photos" ON public.workout_photos;
DROP POLICY IF EXISTS "Users can view own workout photos" ON public.workout_photos;
DROP POLICY IF EXISTS "Users can delete own workout photos" ON public.workout_photos;

-- 7. Create RLS policies for workout_photos table
CREATE POLICY "Users can insert own workout photos"
ON public.workout_photos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own workout photos"
ON public.workout_photos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout photos"
ON public.workout_photos FOR DELETE
USING (auth.uid() = user_id);

-- 8. Optional: Admin can view all
CREATE POLICY "Admins can view all workout photos"
ON public.workout_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  )
);

COMMIT;
