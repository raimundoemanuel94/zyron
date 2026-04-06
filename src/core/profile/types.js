/**
 * @typedef {Object} UserProfile
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [avatarUrl]
 * @property {string} [phone]
 * @property {'USER' | 'ADMIN' | 'PERSONAL'} [role]
 * 
 * @property {Object} bio
 * @property {'male' | 'female'} [bio.gender]
 * @property {string} [bio.birthDate]
 * @property {number} [bio.age]
 * @property {number} [bio.heightCm]
 * @property {number} [bio.weightKg]
 * @property {number} [bio.bodyFatPercent]
 * @property {string} [bio.observations]
 * @property {string} [bio.medicalHistory]
 * @property {string} [bio.injuries]
 * @property {string} [bio.restrictions]
 * 
 * @property {Object} goals
 * @property {'hipertrofia' | 'definicao' | 'forca' | 'manutencao'} goals.target
 * @property {'iniciante' | 'intermediario' | 'avancado'} goals.level
 * @property {number} goals.frequencyPerWeek
 * @property {number} [goals.targetWeightKg]
 * 
 * @property {Object} preferences
 * @property {number} preferences.waterFormulaMlPerKg
 * @property {number} preferences.proteinFormulaGPerKg
 * @property {number} preferences.activityFactor
 * 
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

/**
 * @typedef {Object} DerivedMetrics
 * @property {number} waterGoalMl
 * @property {number} waterGoalLiters
 * @property {number} proteinGoalG
 * @property {number} caloriesGoalKcal
 * @property {number} [bmi]
 */
 
/**
 * @typedef {Object} ProfileStats
 * @property {number} weeklyTrainedDays
 * @property {number} weeklyTargetDays
 * @property {number} monthlyWorkouts
 * @property {number} currentStreak
 */

export {};
