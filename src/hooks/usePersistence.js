/**
 * PERSISTENCE HOOKS - Supabase with localStorage fallback
 * All data persists to Supabase with instant local cache
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { dailyStats, exercisePRs, cacheHelpers } from '../services/persistenceService';

// ─────────────────────────────────────────────────────────────────────────────
// DAILY METRICS HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useDailyMetrics(userId) {
  const [metrics, setMetrics] = useState(() => {
    // Initialize from cache on first render
    try {
      const today = new Date().toISOString().split('T')[0];
      const cached = cacheHelpers.loadFromDisk(`daily_metrics_${today}`);
      return cached || { waterMl: 0, proteinG: 0, weightKg: 0 };
    } catch {
      return { waterMl: 0, proteinG: 0, weightKg: 0 };
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isSyncingRef = useRef(false);

  // Load metrics from Supabase on mount
  useEffect(() => {
    if (!userId) return;

    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];
        const data = await dailyStats.getOrCreateDailyStats(userId, today);

        const parsed = {
          waterMl: data.water_amount || 0,
          proteinG: data.protein_amount || 0,
          weightKg: data.weight_kg || 0,
        };

        setMetrics(parsed);
        cacheHelpers.saveToDisk(`daily_metrics_${today}`, parsed);
      } catch (err) {
        console.error('Failed to load daily metrics:', err);
        setError(err.message);
        // Fall back to cache
        const cached = cacheHelpers.loadFromDisk(`daily_metrics_${new Date().toISOString().split('T')[0]}`);
        if (cached) setMetrics(cached);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [userId]);

  // Update metrics with optimistic updates and Supabase sync
  const updateMetrics = useCallback((updates) => {
    if (!userId) return;

    try {
      setError(null);

      // 1️⃣ Optimistic update (instant UI feedback)
      // Capture the merged values for Supabase sync
      let mergedMetrics;
      setMetrics(prev => {
        mergedMetrics = { ...prev, ...updates };
        const today = new Date().toISOString().split('T')[0];
        cacheHelpers.saveToDisk(`daily_metrics_${today}`, mergedMetrics);
        return mergedMetrics;
      });

      // 2️⃣ Sync to Supabase with MERGED values (async, non-blocking)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;

        // Use a Promise to ensure we have the latest metrics
        Promise.resolve().then(() => {
          const today = new Date().toISOString().split('T')[0];

          // Build Supabase updates with merged values
          // NOTE: weight_kg is saved separately to profiles, not daily_stats
          const supabaseUpdates = {
            water_amount: mergedMetrics?.waterMl ?? metrics.waterMl,
            protein_amount: mergedMetrics?.proteinG ?? metrics.proteinG,
            // weight_kg is handled by persistenceService.updateDailyStats
            // which syncs to profiles.weight automatically
          };

          return dailyStats.updateDailyStats(userId, today, supabaseUpdates);
        })
          .catch(err => {
            console.error('Failed to sync metrics to Supabase:', err);
            setError(err.message);
          })
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    } catch (err) {
      console.error('Failed to update metrics:', err);
      setError(err.message);
    }
  }, [userId]);

  return {
    metrics,
    updateMetrics,
    loading,
    error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE LOADS HOOK (Personal Records)
// ─────────────────────────────────────────────────────────────────────────────

export function useExerciseLoads(userId) {
  const [loads, setLoads] = useState(() => {
    // Initialize from cache on first render
    try {
      const cached = cacheHelpers.loadFromDisk('exercise_loads');
      return cached || {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isSyncingRef = useRef(false);

  // Load PRs from Supabase on mount
  useEffect(() => {
    if (!userId) return;

    const loadPRs = async () => {
      try {
        setLoading(true);
        setError(null);

        const prs = await exercisePRs.getPRs(userId);
        const loadsMap = {};
        prs.forEach(pr => {
          loadsMap[pr.exercise_id] = { kg: pr.max_load };
        });

        setLoads(loadsMap);
        cacheHelpers.saveToDisk('exercise_loads', loadsMap);
      } catch (err) {
        console.error('Failed to load exercise loads:', err);
        setError(err.message);
        // Fall back to cache
        const cached = cacheHelpers.loadFromDisk('exercise_loads');
        if (cached) setLoads(cached);
      } finally {
        setLoading(false);
      }
    };

    loadPRs();
  }, [userId]);

  // Update load with optimistic updates and Supabase sync
  const updateLoad = useCallback((exerciseId, exerciseName, loadKg) => {
    if (!userId) return;

    try {
      setError(null);

      // 1️⃣ Optimistic update
      setLoads(prev => {
        const updated = {
          ...prev,
          [exerciseId]: { kg: loadKg }
        };
        cacheHelpers.saveToDisk('exercise_loads', updated);
        return updated;
      });

      // 2️⃣ Sync to Supabase (async)
      if (!isSyncingRef.current) {
        isSyncingRef.current = true;

        exercisePRs.upsertPR(userId, exerciseId, loadKg)
          .catch(err => {
            console.error('Failed to sync load to Supabase:', err);
            setError(err.message);
          })
          .finally(() => {
            isSyncingRef.current = false;
          });
      }
    } catch (err) {
      console.error('Failed to update load:', err);
      setError(err.message);
    }
  }, [userId]);

  return {
    loads,
    updateLoad,
    loading,
    error,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE COMPLETION HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useExerciseCompletion(userId, workoutKey) {
  const [completedExercises, setCompletedExercises] = useState(() => {
    // Initialize from cache
    try {
      const today = new Date().toISOString().split('T')[0];
      const cached = cacheHelpers.loadFromDisk(`completions_${today}`);
      return cached || [];
    } catch {
      return [];
    }
  });
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize session and load completions
  useEffect(() => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split('T')[0];
      const sessionKey = `session_${userId}_${workoutKey}_${today}`;

      // Get or create session ID
      let sid = localStorage.getItem(sessionKey);
      if (!sid) {
        sid = `session_${Date.now()}`;
        localStorage.setItem(sessionKey, sid);
      }
      setSessionId(sid);

      // Load completions from cache
      const completionsKey = `completions_${today}`;
      const cached = cacheHelpers.loadFromDisk(completionsKey);
      setCompletedExercises(cached || []);
    } catch (err) {
      console.error('Failed to initialize session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId, workoutKey]);

  // Toggle exercise completion with Supabase sync
  const toggleExercise = useCallback((exerciseId, exerciseName, data = {}) => {
    if (!userId) return;

    try {
      setError(null);
      const isCompleting = !completedExercises.includes(exerciseId);

      // 1️⃣ Optimistic update (instant UI feedback)
      setCompletedExercises(prev =>
        isCompleting
          ? [...prev, exerciseId]
          : prev.filter(id => id !== exerciseId)
      );

      // 2️⃣ Save to cache
      const today = new Date().toISOString().split('T')[0];
      const completionsKey = `completions_${today}`;
      const updated = isCompleting
        ? [...completedExercises, exerciseId]
        : completedExercises.filter(id => id !== exerciseId);
      cacheHelpers.saveToDisk(completionsKey, updated);

      // 3️⃣ Sync to Supabase (async, non-blocking)
      syncExerciseToSupabase(
        exerciseId,
        exerciseName,
        isCompleting,
        data
      ).catch(err => {
        console.error('Failed to sync exercise completion:', err);
        setError(err.message);
        // Rollback on failure
        setCompletedExercises(prev =>
          isCompleting
            ? prev.filter(id => id !== exerciseId)
            : [...prev, exerciseId]
        );
      });
    } catch (err) {
      console.error('Failed to toggle exercise:', err);
      setError(err.message);
      // Rollback optimistic update
      setCompletedExercises(prev =>
        prev.includes(exerciseId)
          ? prev.filter(id => id !== exerciseId)
          : [...prev, exerciseId]
      );
    }
  }, [userId, completedExercises]);

  // Sync exercise completion to Supabase
  const syncExerciseToSupabase = async (
    exerciseId,
    exerciseName,
    isCompleting,
    data = {}
  ) => {
    if (!userId) return;

    const { supabase } = await import('../lib/supabase');
    const today = new Date().toISOString().split('T')[0];

    if (isCompleting) {
      // Create workout session if doesn't exist
      const { data: existingSession, error: fetchError } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('workout_key', workoutKey)
        .gte('completed_at', `${today}T00:00:00`)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      let sessionId = existingSession?.id;

      // Create new session if needed
      if (!sessionId) {
        const { data: newSession, error: createError } = await supabase
          .from('workout_logs')
          .insert([{
            user_id: userId,
            workout_key: workoutKey,
            duration_seconds: 0,
            completed_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (createError) throw createError;
        sessionId = newSession?.id;
      }

      // Insert exercise completion
      if (sessionId) {
        await supabase.from('exercise_completions').insert([{
          session_id: sessionId,
          user_id: userId,
          exercise_id: exerciseId,
          exercise_name: exerciseName,
          reps: data.reps || null,
          sets: data.sets || null,
          notes: data.notes || null,
          completed_at: new Date().toISOString(),
        }]);
      }
    } else {
      // Remove completion
      await supabase
        .from('exercise_completions')
        .delete()
        .eq('user_id', userId)
        .eq('exercise_id', exerciseId)
        .gte('completed_at', `${today}T00:00:00`);
    }
  };

  return {
    completedExercises,
    toggleExercise,
    sessionId,
    loading,
    error,
  };
}
