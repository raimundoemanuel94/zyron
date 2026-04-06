/**
 * Fitness Constants - ZYRON Core
 */

export const FITNESS_CONSTANTS = {
  // Default ml per kg for hydration
  WATER_ML_PER_KG: 35,
  
  // Default g per kg for protein
  PROTEIN_G_PER_KG: 2,
  
  // Default activity factor if not specified (Sedentary: 1.2, Light: 1.375, Moderate: 1.55, Active: 1.725, Athlete: 1.9)
  DEFAULT_ACTIVITY_FACTOR: 1.55,
  
  // Goals mapping to activity factors if we want to tie them later
  GOAL_ACTIVITY_FACTORS: {
    hipertrofia: 1.6,
    definicao: 1.5,
    forca: 1.7,
    manutencao: 1.55
  }
};
