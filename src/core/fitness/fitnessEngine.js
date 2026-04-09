import { FITNESS_CONSTANTS } from './constants';

/**
 * Calculates Basal Metabolic Rate using Harris-Benedict formula (revised)
 * @param {import('../profile/types').UserProfile} profile 
 * @returns {number}
 */
export function calculateBMR(profile) {
  const weight = profile.bio.weightKg ?? 0;
  const height = profile.bio.heightCm ?? 0;
  const age = profile.bio.age ?? 0;
  const gender = profile.bio.gender;

  if (!weight || !height || !age || !gender) return 0;

  // Harris-Benedict (Mifflin-St Jeor)
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }

  return 10 * weight + 6.25 * height - 5 * age - 161;
}

/**
 * Calculates derived metrics for a given user profile
 * @param {import('../profile/types').UserProfile} profile 
 * @returns {import('../profile/types').DerivedMetrics}
 */
export function calculateMetrics(profile) {
  const weight = profile.bio.weightKg ?? 0;
  const height = profile.bio.heightCm ?? 0;
  
  // 1. Hydration
  const waterFormula = profile.preferences?.waterFormulaMlPerKg || FITNESS_CONSTANTS.WATER_ML_PER_KG;
  const waterGoalMl = Math.round(weight * waterFormula);

  // 2. Protein based on Level
  const level = profile.goals?.level || 'intermediario';
  const proteinMultipliers = {
    iniciante: 1.6,
    intermediario: 1.8,
    avancado: 2.0
  };
  const proteinFormula = profile.preferences?.proteinFormulaGPerKg || proteinMultipliers[level] || FITNESS_CONSTANTS.PROTEIN_G_PER_KG;
  const proteinGoalG = Math.round(weight * proteinFormula);

  // 3. Basal Metabolic Rate
  const bmr = calculateBMR(profile);

  // 4. Activity Factor
  const activityFactor = profile.preferences?.activityFactor || FITNESS_CONSTANTS.DEFAULT_ACTIVITY_FACTOR;
  let caloriesGoalKcal = Math.round(bmr * activityFactor);

  // 5. Goal Adjustments (Superavit / Deficit)
  const goalAdjustments = {
    hipertrofia: 300,
    definicao: -500,
    forca: 200,
    manutencao: 0
  };
  const adjustment = goalAdjustments[profile.goals?.target] || 0;
  caloriesGoalKcal += adjustment;

  // 6. BMI
  const bmi =
    weight > 0 && height > 0
      ? Number((weight / ((height / 100) ** 2)).toFixed(1))
      : undefined;

  return {
    waterGoalMl,
    waterGoalLiters: Number((waterGoalMl / 1000).toFixed(1)),
    proteinGoalG,
    caloriesGoalKcal,
    bmi,
  };
}
