-- Muscle Group Reference Table
CREATE TABLE IF NOT EXISTS muscles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'chest', 'back', 'shoulders', 'arms', 'legs', 'core'
  anatomical_region TEXT,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exercise-Muscle Relationship with Activation Levels
CREATE TABLE IF NOT EXISTS exercises_muscles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  muscle_id TEXT NOT NULL,
  activation_percentage INTEGER DEFAULT 50, -- 0-100 representing activation intensity
  is_primary BOOLEAN DEFAULT FALSE, -- True if this is a primary muscle group for the exercise
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_id),
  FOREIGN KEY (muscle_id) REFERENCES muscles(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscles_exercise_id ON exercises_muscles(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscles_muscle_id ON exercises_muscles(muscle_id);
CREATE INDEX IF NOT EXISTS idx_muscles_category ON muscles(category);

-- Insert default muscle groups
INSERT INTO muscles (id, name, category, anatomical_region) VALUES
-- Chest
('pec_major', 'Peitoral Maior', 'chest', 'chest'),
('pec_minor', 'Peitoral Menor', 'chest', 'chest'),

-- Back
('lats', 'Latíssimo do Dorso', 'back', 'back'),
('rhomboid', 'Romboide', 'back', 'back'),
('traps', 'Trapézio', 'back', 'back'),

-- Shoulders
('delt_front', 'Deltóide Anterior', 'shoulders', 'shoulder'),
('delt_mid', 'Deltóide Médio', 'shoulders', 'shoulder'),
('delt_rear', 'Deltóide Posterior', 'shoulders', 'shoulder'),

-- Arms
('biceps', 'Bíceps', 'arms', 'arm'),
('triceps', 'Tríceps', 'arms', 'arm'),
('forearm', 'Antebraço', 'arms', 'forearm'),

-- Legs
('quads', 'Quadríceps', 'legs', 'leg'),
('hamstring', 'Isquiotibiais', 'legs', 'leg'),
('glutes', 'Glúteos', 'legs', 'glute'),
('calves', 'Panturrilha', 'legs', 'calf'),

-- Core
('abs', 'Abdominal', 'core', 'abs'),
('obliques', 'Oblíquos', 'core', 'obliques')
ON CONFLICT (id) DO NOTHING;

-- Example: Map exercises to muscles (populate as needed for each exercise)
-- For Supino Reto (Bench Press - p1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('p1', 'pec_major', 90, true),
  ('p1', 'delt_front', 60, false),
  ('p1', 'triceps', 70, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Supino Inclinado (Incline Press - p2):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('p2', 'pec_major', 80, true),
  ('p2', 'delt_front', 75, true),
  ('p2', 'triceps', 65, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Cross Over (p3):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('p3', 'pec_major', 95, true),
  ('p3', 'delt_front', 50, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Triceps Pulley (t1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('t1', 'triceps', 95, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Triceps Rope (t2):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('t2', 'triceps', 95, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Triceps Forehead (t3):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('t3', 'triceps', 90, true),
  ('t3', 'delt_front', 30, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Lat Pulldown (c1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('c1', 'lats', 95, true),
  ('c1', 'biceps', 75, false),
  ('c1', 'rhomboid', 60, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Barbell Row (c_rc):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('c_rc', 'lats', 90, true),
  ('c_rc', 'rhomboid', 85, true),
  ('c_rc', 'biceps', 70, false),
  ('c_rc', 'traps', 65, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Barbell Curl (b1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('b1', 'biceps', 95, true),
  ('b1', 'forearm', 70, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Squat (l1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('l1', 'quads', 95, true),
  ('l1', 'glutes', 85, true),
  ('l1', 'hamstring', 70, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Leg Press (l2):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('l2', 'quads', 95, true),
  ('l2', 'glutes', 80, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Leg Extension (l3):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('l3', 'quads', 100, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Leg Curl (l4):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('l4', 'hamstring', 100, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Shoulder Press (s1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('s1', 'delt_front', 95, true),
  ('s1', 'delt_mid', 85, true),
  ('s1', 'triceps', 70, false),
  ('s1', 'traps', 60, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Lateral Raise (s2):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('s2', 'delt_mid', 95, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Front Raise (s3):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('s3', 'delt_front', 95, true),
  ('s3', 'delt_mid', 50, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Reverse Flye (s4):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('s4', 'delt_rear', 95, true),
  ('s4', 'rhomboid', 80, false)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- For Calf Raise (ca1):
INSERT INTO exercises_muscles (exercise_id, muscle_id, activation_percentage, is_primary)
VALUES
  ('ca1', 'calves', 100, true)
ON CONFLICT (exercise_id, muscle_id) DO NOTHING;

-- Set RLS policies (if using row level security)
-- ALTER TABLE muscles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE exercises_muscles ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow read access to muscles" ON muscles
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow read access to exercises_muscles" ON exercises_muscles
--   FOR SELECT USING (true);
