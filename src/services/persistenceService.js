/**
 * PERSISTENCE SERVICE - SUPABASE
 * Central hub for all Supabase CRUD operations
 * Schema tables: profiles, workout_logs, daily_stats, exercise_prs, notifications, custom_workouts, workout_photos
 */

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// PROFILES (User Data)
// ─────────────────────────────────────────────────────────────────────────────

export const profiles = {
  /**
   * Get user profile
   * @param {string} userId
   */
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data || null;
  },

  /**
   * Create or update user profile
   * @param {string} userId
   * @param {object} profileData
   */
  async upsertProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert([{
        id: userId,
        ...profileData,
      }], { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update specific profile fields
   */
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY STATS (Water, Protein)
// ─────────────────────────────────────────────────────────────────────────────

export const dailyStats = {
  /**
   * Get or create daily stats for today
   * @param {string} userId
   * @param {string} date (YYYY-MM-DD)
   */
  async getOrCreateDailyStats(userId, date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (data) return data;

    // Create new entry
    const { data: newEntry, error: createError } = await supabase
      .from('daily_stats')
      .insert([{
        user_id: userId,
        date: targetDate,
        water_amount: 0,
        protein_amount: 0,
      }])
      .select()
      .single();

    if (createError) throw createError;
    return newEntry;
  },

  /**
   * Update water and/or protein
   */
  async updateDailyStats(userId, date, updates) {
    const { data, error } = await supabase
      .from('daily_stats')
      .update(updates)
      .eq('user_id', userId)
      .eq('date', date)
      .select()
      .single();

    if (error) throw error;

    // 🔄 SYNC: If weight is being updated, also update profile bio.weightKg
    if (updates.weight_kg !== undefined && userId) {
      try {
        await supabase
          .from('profiles')
          .update({ weight: updates.weight_kg })
          .eq('id', userId);
      } catch (syncErr) {
        console.warn('Failed to sync weight to profile:', syncErr);
        // Don't throw - weight was saved in daily_stats, profile sync is secondary
      }
    }

    return data;
  },

  /**
   * Get stats for date range
   */
  async getStatsRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('daily_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE PRs (Personal Records / Max Loads)
// ─────────────────────────────────────────────────────────────────────────────

export const exercisePRs = {
  /**
   * Get all PRs for user
   */
  async getPRs(userId) {
    const { data, error } = await supabase
      .from('exercise_prs')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Get PR for specific exercise
   */
  async getPR(userId, exerciseId) {
    const { data, error } = await supabase
      .from('exercise_prs')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  /**
   * Upsert PR (create or update)
   */
  async upsertPR(userId, exerciseId, maxLoad) {
    const { data, error } = await supabase
      .from('exercise_prs')
      .upsert([{
        user_id: userId,
        exercise_id: exerciseId,
        max_load: maxLoad,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'user_id,exercise_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update multiple PRs at once
   */
  async upsertMultiplePRs(userId, exerciseLoads) {
    // exerciseLoads: { exerciseId: maxLoad, ... }
    const rows = Object.entries(exerciseLoads).map(([exerciseId, maxLoad]) => ({
      user_id: userId,
      exercise_id: exerciseId,
      max_load: maxLoad,
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('exercise_prs')
      .upsert(rows, { onConflict: 'user_id,exercise_id' })
      .select();

    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const workoutLogs = {
  /**
   * Create workout log
   */
  async createLog(userId, workoutKey, durationSeconds) {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert([{
        user_id: userId,
        workout_key: workoutKey,
        duration_seconds: durationSeconds,
        completed_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Get logs for date range
   */
  async getLogsRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get recent logs
   */
  async getRecentLogs(userId, limit = 10) {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────

export const notifications = {
  /**
   * Get user notifications
   */
  async getNotifications(userId, unreadOnly = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mark all as read
   */
  async markAllAsRead(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .select();

    if (error) throw error;
    return data;
  },

  /**
   * Create notification (admin only)
   */
  async createNotification(userId, title, message) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title,
        message,
        is_read: false,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM WORKOUTS
// ─────────────────────────────────────────────────────────────────────────────

export const customWorkouts = {
  /**
   * Get user's custom workouts
   */
  async getCustomWorkouts(userId) {
    const { data, error } = await supabase
      .from('custom_workouts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Create custom workout
   * @param {string} userId
   * @param {string} workoutName
   * @param {array} exercises - array of exercise IDs
   */
  async createCustomWorkout(userId, workoutName, exercises) {
    const { data, error } = await supabase
      .from('custom_workouts')
      .insert([{
        user_id: userId,
        workout_name: workoutName,
        exercises: exercises, // stored as JSONB
        is_active: true,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update custom workout
   */
  async updateCustomWorkout(workoutId, updates) {
    const { data, error } = await supabase
      .from('custom_workouts')
      .update(updates)
      .eq('id', workoutId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deactivate custom workout
   */
  async deactivateWorkout(workoutId) {
    return this.updateCustomWorkout(workoutId, { is_active: false });
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// WORKOUT PHOTOS
// ─────────────────────────────────────────────────────────────────────────────

export const workoutPhotos = {
  /**
   * Get photos for workout log
   */
  async getPhotosForLog(workoutLogId) {
    const { data, error } = await supabase
      .from('workout_photos')
      .select('*')
      .eq('workout_log_id', workoutLogId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get all photos for user
   */
  async getUserPhotos(userId, limit = 50) {
    const { data, error } = await supabase
      .from('workout_photos')
      .select('*')
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  /**
   * Record photo
   */
  async recordPhoto(userId, workoutLogId, storagePath) {
    const { data, error } = await supabase
      .from('workout_photos')
      .insert([{
        user_id: userId,
        workout_log_id: workoutLogId,
        storage_path: storagePath,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete photo
   */
  async deletePhoto(photoId) {
    const { error } = await supabase
      .from('workout_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
    return true;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CACHE HELPERS (localStorage backup)
// ─────────────────────────────────────────────────────────────────────────────

export const cacheHelpers = {
  /**
   * Save data to localStorage as backup
   */
  saveToDisk(key, data) {
    try {
      localStorage.setItem(`zyron_cache_${key}`, JSON.stringify(data));
    } catch (err) {
      console.warn(`Failed to cache ${key}:`, err);
    }
  },

  /**
   * Load data from localStorage
   */
  loadFromDisk(key) {
    try {
      const cached = localStorage.getItem(`zyron_cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (err) {
      console.warn(`Failed to load cache ${key}:`, err);
      return null;
    }
  },

  /**
   * Clear cache for key
   */
  clearCache(key) {
    try {
      localStorage.removeItem(`zyron_cache_${key}`);
    } catch (err) {
      console.warn(`Failed to clear cache ${key}:`, err);
    }
  },

  /**
   * Clear all ZYRON cache
   */
  clearAllCache() {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('zyron_cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (err) {
      console.warn('Failed to clear all cache:', err);
    }
  },
};

export default {
  profiles,
  dailyStats,
  exercisePRs,
  workoutLogs,
  notifications,
  customWorkouts,
  workoutPhotos,
  cacheHelpers,
};
