import { supabase } from '../../lib/supabase';
import { mapDBToProfile, mapProfileToDB } from './profileMapper';

/**
 * ZYRON Profile Service - Centralized database interactions
 */
export const profileService = {
  /**
   * Fetches the profile for a given user ID
   * @param {string} userId 
   * @returns {Promise<import('./types').UserProfile>}
   */
  async getProfile(userId) {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[ProfileService] Error fetching profile:', error);
        return null;
      }

      return mapDBToProfile(data);
    } catch (err) {
      console.error('[ProfileService] Exception in getProfile:', err);
      return null;
    }
  },

  /**
   * Updates an existing profile
   * @param {string} userId 
   * @param {import('./types').UserProfile} profile 
   * @returns {Promise<boolean>}
   */
  async updateProfile(userId, profile) {
    if (!userId || !profile) return false;

    try {
      const dbProfile = mapProfileToDB(profile);

      // Remove undefined fields to avoid overwriting with null
      const cleanProfile = Object.fromEntries(
        Object.entries(dbProfile).filter(([_, v]) => v !== undefined)
      );

      const { error } = await supabase
        .from('profiles')
        .update(cleanProfile)
        .eq('id', userId);

      if (error) {
        console.error('[ProfileService] Error updating profile:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Exception in updateProfile:', err);
      return false;
    }
  },

  /**
   * Patches specific fields of a profile
   * @param {string} userId
   * @param {Object} patch - Partial raw DB fields or partial Profile object
   * @returns {Promise<boolean>}
   */
  async patchProfile(userId, patch) {
    if (!userId || !patch) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...patch,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('[ProfileService] Error patching profile:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Exception in patchProfile:', err);
      return false;
    }
  },

  /**
   * Creates a new profile for a user (using upsert to bypass RLS issues)
   * @param {string} userId
   * @param {Object} data - Initial profile data
   * @returns {Promise<boolean>}
   */
  async createProfile(userId, data = {}) {
    if (!userId) return false;

    try {
      // Use only columns from the original schema (before migrations)
      // to avoid PostgREST schema cache issues with newly added columns
      const defaultProfile = {
        id: userId,
        name: data.name || 'ATLETA',
        email: data.email || '',
        role: data.role || 'USER',
        age: data.age || 25,
        height: data.height || 175,
        weight: data.weight || 75,
        goal: data.goal || 'hipertrofia',
        level: data.level || 'iniciante',
        water_goal: data.water_goal || 2500,
        protein_goal: data.protein_goal || 120,
        plan_status: 'ACTIVE',
      };

      // Use upsert instead of insert to handle RLS better
      const { error } = await supabase
        .from('profiles')
        .upsert([defaultProfile], { onConflict: 'id' });

      if (error) {
        console.error('[ProfileService] Error creating profile:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('[ProfileService] Exception in createProfile:', err);
      return false;
    }
  },

  /**
   * Fetches all profiles (Admin use only)
   * @returns {Promise<import('./types').UserProfile[]>}
   */
  async getAllProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapDBToProfile);
    } catch (err) {
      console.error('[ProfileService] Error in getAllProfiles:', err);
      return [];
    }
  },

  /**
   * Updates last synced timestamp
   * @param {string} userId 
   */
  async updateLastSynced(userId) {
    return this.patchProfile(userId, { last_synced_at: new Date().toISOString() });
  },

  /**
   * Deletes a profile
   * @param {string} userId 
   */
  async deleteProfile(userId) {
    if (!userId) return false;
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      return !error;
    } catch (err) {
      console.error('[ProfileService] Error deleting profile:', err);
      return false;
    }
  },

  /**
   * Fetches profile statistics (streak, weekly, monthly)
   * @param {string} userId 
   * @returns {Promise<import('./types').ProfileStats>}
   */
  async getProfileStats(userId) {
    if (!userId) return { weeklyTrainedDays: 0, weeklyTargetDays: 0, monthlyWorkouts: 0, currentStreak: 0 };

    try {
      const now = new Date();
      
      // Start of current week (fixed to Monday for consistency)
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      // Start of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch logs
      const { data: logs, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const trainedDates = (logs || []).map(l => new Date(l.completed_at).toISOString().split('T')[0]);
      const uniqueDates = [...new Set(trainedDates)];

      // 1. Weekly Trained Days
      const weekLogs = uniqueDates.filter(d => new Date(d) >= startOfWeek);
      const weeklyTrainedDays = weekLogs.length;

      // 2. Monthly Workouts
      // Note: monthlyWorkouts usually counts total sessions, not just unique days
      const monthlyLogs = (logs || []).filter(l => new Date(l.completed_at) >= startOfMonth);
      const monthlyWorkouts = monthlyLogs.length;

      // 3. Current Streak
      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      // Check if trained today or yesterday
      const todayStr = checkDate.toISOString().split('T')[0];
      const yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (uniqueDates.includes(todayStr) || uniqueDates.includes(yesterdayStr)) {
        // Start counting back
        let streakSearchDate = uniqueDates.includes(todayStr) ? checkDate : yesterday;
        while (uniqueDates.includes(streakSearchDate.toISOString().split('T')[0])) {
          currentStreak++;
          streakSearchDate.setDate(streakSearchDate.getDate() - 1);
        }
      }

      return {
        weeklyTrainedDays,
        weeklyTargetDays: 0, // Will be filled by useProfile using profile data
        monthlyWorkouts,
        currentStreak
      };
    } catch (err) {
      console.error('[ProfileService] Error in getProfileStats:', err);
      return { weeklyTrainedDays: 0, weeklyTargetDays: 0, monthlyWorkouts: 0, currentStreak: 0 };
    }
  },

  /**
   * Fetches profiles by role
   * @param {string} role 
   * @returns {Promise<import('./types').UserProfile[]>}
   */
  async getProfilesByRole(role) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', role);

      if (error) throw error;
      return (data || []).map(mapDBToProfile);
    } catch (err) {
      console.error('[ProfileService] Error in getProfilesByRole:', err);
      return [];
    }
  }
};
