import { FITNESS_CONSTANTS } from '../fitness/constants';

/**
 * Maps database profile to internal UserProfile
 * @param {Object} dbProfile - Raw database profile
 * @returns {import('./types').UserProfile}
 */
export function mapDBToProfile(dbProfile) {
  if (!dbProfile) return null;

  return {
    id: dbProfile.id,
    name: dbProfile.name || 'ATLETA',
    email: dbProfile.email || '',
    avatarUrl: dbProfile.avatar_url,
    phone: dbProfile.phone,
    role: dbProfile.role || 'USER',

    bio: {
      gender: dbProfile.gender || 'male',
      birthDate: dbProfile.birth_date,
      age: dbProfile.age || 25,
      heightCm: dbProfile.height || 175,
      weightKg: dbProfile.weight || 75,
      bodyFatPercent: dbProfile.body_fat_percent || 0,
      observations: dbProfile.observations,
      medicalHistory: dbProfile.medical_history,
      injuries: dbProfile.injuries,
      restrictions: dbProfile.restrictions
    },

    goals: {
      target: dbProfile.goal || 'hipertrofia',
      level: dbProfile.level || 'iniciante',
      frequencyPerWeek: dbProfile.frequency_per_week || 3,
      targetWeightKg: dbProfile.target_weight_kg || 0
    },

    preferences: {
      waterFormulaMlPerKg: dbProfile.water_formula_ml_per_kg || FITNESS_CONSTANTS.WATER_ML_PER_KG,
      proteinFormulaGPerKg: dbProfile.protein_formula_g_per_kg || FITNESS_CONSTANTS.PROTEIN_G_PER_KG,
      activityFactor: dbProfile.activity_factor || FITNESS_CONSTANTS.DEFAULT_ACTIVITY_FACTOR,
      nightMode: dbProfile.night_mode || false,
      language: dbProfile.language || 'pt-BR',
      notificationsEnabled: dbProfile.notifications_enabled !== false
    },

    settings: {
      planStatus: dbProfile.plan_status || 'ACTIVE',
      waterGoal: dbProfile.water_goal || 2500,
      proteinGoal: dbProfile.protein_goal || 120
    },

    createdAt: dbProfile.created_at,
    updatedAt: dbProfile.updated_at,
    lastSyncedAt: dbProfile.last_synced_at
  };
}

/**
 * Maps internal UserProfile to database profile
 * @param {import('./types').UserProfile} profile 
 * @returns {Object}
 */
export function mapProfileToDB(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    role: profile.role,
    
    // Bio
    gender: profile.bio.gender,
    birth_date: profile.bio.birthDate,
    age: profile.bio.age,
    height: profile.bio.heightCm,
    weight: profile.bio.weightKg,
    body_fat_percent: profile.bio.bodyFatPercent,
    observations: profile.bio.observations,
    medical_history: profile.bio.medicalHistory,
    injuries: profile.bio.injuries,
    restrictions: profile.bio.restrictions,
    
    // Goals
    goal: profile.goals.target,
    level: profile.goals.level,
    frequency_per_week: profile.goals.frequencyPerWeek,
    target_weight_kg: profile.goals.targetWeightKg,
    
    // Preferences
    water_formula_ml_per_kg: profile.preferences?.waterFormulaMlPerKg,
    protein_formula_g_per_kg: profile.preferences?.proteinFormulaGPerKg,
    activity_factor: profile.preferences?.activityFactor,
    night_mode: profile.preferences?.nightMode,
    language: profile.preferences?.language,
    notifications_enabled: profile.preferences?.notificationsEnabled,

    // Settings
    plan_status: profile.settings?.planStatus,
    water_goal: profile.settings?.waterGoal,
    protein_goal: profile.settings?.proteinGoal,

    updated_at: new Date().toISOString()
  };
}
