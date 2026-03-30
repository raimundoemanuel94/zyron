/**
 * muscleMapping.js
 * Maps exercises to the muscle groups they primarily target
 * Used with AnatomyMap2D to highlight active muscles during workouts
 */

export const EXERCISE_MUSCLE_MAP = {
  // Chest Exercises
  'p1': { primaryMuscles: ['Peito'], secondaryMuscles: ['Ombro', 'Tríceps'] },
  'p2': { primaryMuscles: ['Peito'], secondaryMuscles: ['Ombro', 'Tríceps'] },
  'p_cm': { primaryMuscles: ['Peito'], secondaryMuscles: ['Ombro'] },
  'p3': { primaryMuscles: ['Peito'], secondaryMuscles: ['Tríceps', 'Ombro'] },

  // Triceps Exercises
  't1': { primaryMuscles: ['Tríceps'], secondaryMuscles: ['Ombro'] },
  't2': { primaryMuscles: ['Tríceps'], secondaryMuscles: ['Peito'] },
  't3': { primaryMuscles: ['Tríceps'], secondaryMuscles: ['Ombro'] },
  't_mb': { primaryMuscles: ['Tríceps', 'Peito'], secondaryMuscles: ['Ombro'] },
  't_mb2': { primaryMuscles: ['Tríceps', 'Peito'], secondaryMuscles: ['Ombro'] },

  // Back Exercises
  'c1': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },
  'c_rc': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps', 'Antebraço'] },
  'c_rm': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },
  'c_pd': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },

  // Biceps Exercises
  'b1': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },
  'b_ra': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },
  'b2': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },
  'b3': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },
  'b_bi': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },
  'b_rw': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },

  // Leg Exercises
  'l1': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },
  'l2': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },
  'l3': { primaryMuscles: ['Perna'], secondaryMuscles: [] },
  'l4': { primaryMuscles: ['Perna', 'Posterior'], secondaryMuscles: ['Glúteos'] },
  'l_st': { primaryMuscles: ['Posterior', 'Perna'], secondaryMuscles: ['Glúteos'] },
  'l_ep': { primaryMuscles: ['Glúteos', 'Posterior'], secondaryMuscles: ['Perna'] },

  // Calf Exercises
  'ca1': { primaryMuscles: ['Panturrilha'], secondaryMuscles: [] },
  'ca_s': { primaryMuscles: ['Panturrilha'], secondaryMuscles: [] },

  // Shoulder Exercises
  's1': { primaryMuscles: ['Ombro'], secondaryMuscles: ['Tríceps', 'Peito'] },
  's2': { primaryMuscles: ['Ombro'], secondaryMuscles: [] },
  's3': { primaryMuscles: ['Ombro'], secondaryMuscles: [] },
  's4': { primaryMuscles: ['Ombro'], secondaryMuscles: ['Costas'] },
  's_et': { primaryMuscles: ['Ombro'], secondaryMuscles: ['Costas'] },
};

/**
 * Get all active muscle groups for an exercise
 * Combines primary and secondary muscles
 */
export function getActiveMuscles(exerciseId) {
  const mapping = EXERCISE_MUSCLE_MAP[exerciseId];
  if (!mapping) return [];
  return [...mapping.primaryMuscles, ...mapping.secondaryMuscles];
}

/**
 * Get primary muscles only (for stronger highlight effect)
 */
export function getPrimaryMuscles(exerciseId) {
  const mapping = EXERCISE_MUSCLE_MAP[exerciseId];
  return mapping?.primaryMuscles || [];
}
