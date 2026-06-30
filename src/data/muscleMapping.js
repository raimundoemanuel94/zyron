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

  // Core & Abs
  'crunch': { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },
  'leg_raise': { primaryMuscles: ['Abdômen'], secondaryMuscles: ['Perna'] },
  'plank': { primaryMuscles: ['Abdômen'], secondaryMuscles: ['Ombro', 'Perna'] },

  // Functional & Others
  'push_up': { primaryMuscles: ['Peito'], secondaryMuscles: ['Tríceps', 'Ombro'] },
  'pull_up': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },
  'deadlift': { primaryMuscles: ['Posterior', 'Perna'], secondaryMuscles: ['Costas', 'Glúteos'] },
  'lunges': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },

  // ═══════════════════════════════════════════════════════════
  // PROGRAMA PPL + UPPER — 12 semanas
  // ═══════════════════════════════════════════════════════════

  // Push A — Segunda (Peito · Ombro · Tríceps)
  'pa1': { primaryMuscles: ['Peito'], secondaryMuscles: ['Ombro', 'Tríceps'] },           // Supino Reto com Barra
  'pa2': { primaryMuscles: ['Ombro'], secondaryMuscles: ['Tríceps'] },                     // Desenvolvimento com Halteres
  'pa3': { primaryMuscles: ['Peito'], secondaryMuscles: [] },                              // Crucifixo Inclinado Halteres
  'pa4': { primaryMuscles: ['Ombro'], secondaryMuscles: [] },                              // Elevação Lateral Halteres
  'pa5': { primaryMuscles: ['Tríceps'], secondaryMuscles: [] },                            // Tríceps Pulley Corda
  'pa6': { primaryMuscles: ['Tríceps'], secondaryMuscles: [] },                            // Tríceps Testa Barra EZ

  // Pull A — Terça (Costas · Bíceps · Face pull)
  'pla1': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },                    // Barra Fixa Pronada
  'pla2': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps', 'Antebraço'] },        // Remada Curvada com Barra
  'pla3': { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },                    // Pulldown Pegada Neutra
  'pla4': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },                  // Rosca Direta Barra EZ
  'pla5': { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },                  // Rosca Martelo Halteres
  'pla6': { primaryMuscles: ['Ombro'], secondaryMuscles: ['Costas'] },                      // Face Pull com Corda

  // Legs A — Quarta (Quadríceps · Glúteo · Panturrilha)
  'la1': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },                      // Agachamento Livre com Barra
  'la2': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },                      // Leg Press 45°
  'la3': { primaryMuscles: ['Perna'], secondaryMuscles: [] },                               // Cadeira Extensora
  'la4': { primaryMuscles: ['Posterior', 'Perna'], secondaryMuscles: ['Glúteos'] },         // Stiff com Halteres
  'la5': { primaryMuscles: ['Panturrilha'], secondaryMuscles: [] },                         // Panturrilha em Pé

  // Upper B — Quinta (Peito · Costas · Ombro · Braços · Core)
  'ub1':  { primaryMuscles: ['Peito'], secondaryMuscles: ['Ombro'] },                       // Supino Inclinado Halteres
  'ub2':  { primaryMuscles: ['Costas'], secondaryMuscles: ['Bíceps'] },                     // Remada Cavalinho / Máquina
  'ub3':  { primaryMuscles: ['Ombro'], secondaryMuscles: ['Tríceps'] },                     // Desenvolvimento Arnold
  'ub4':  { primaryMuscles: ['Peito'], secondaryMuscles: [] },                              // Crucifixo Cabo Polia Alta
  'ub5':  { primaryMuscles: ['Bíceps'], secondaryMuscles: ['Antebraço'] },                  // Rosca Concentrada Halter
  'ub6':  { primaryMuscles: ['Tríceps'], secondaryMuscles: [] },                            // Tríceps Francês Halter
  'ub7':  { primaryMuscles: ['Ombro'], secondaryMuscles: [] },                              // Elevação Lateral Cabo Baixo
  'ub8':  { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },                            // Prancha Abdominal
  'ub9':  { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },                            // Crunch Polia Alta
  'ub10': { primaryMuscles: ['Abdômen'], secondaryMuscles: ['Perna'] },                     // Elevação de Pernas na Barra

  // Legs B + Core — Sexta (Posterior · Búlgaro · Abdômen)
  'lb1': { primaryMuscles: ['Posterior', 'Perna'], secondaryMuscles: ['Costas', 'Glúteos'] }, // Levantamento Terra Convencional
  'lb2': { primaryMuscles: ['Perna'], secondaryMuscles: ['Glúteos'] },                      // Agachamento Búlgaro Halteres
  'lb3': { primaryMuscles: ['Posterior'], secondaryMuscles: [] },                           // Cadeira Flexora (Leg Curl)
  'lb4': { primaryMuscles: ['Glúteos'], secondaryMuscles: ['Posterior'] },                  // Hip Thrust com Barra
  'lb5': { primaryMuscles: ['Panturrilha'], secondaryMuscles: [] },                         // Panturrilha Sentado (Sóleo)
  'lb6': { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },                             // Dead Bug
  'lb7': { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },                             // Ab Wheel (Roda Abdominal)
  'lb8': { primaryMuscles: ['Abdômen'], secondaryMuscles: [] },                             // Bicicleta Abdominal
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
