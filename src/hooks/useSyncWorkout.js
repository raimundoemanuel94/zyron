import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { db as zyronDB } from '../utils/db';
import { sanitizeWorkoutState } from '../utils/sanitizer';
import { profileService } from '../core/profile/profileService';

/**
 * useSyncWorkout Hook - ZYRON Advanced Sync v2 (Photos + IndexedDB Queue)
 * NOW DIRECTLY USING SUPABASE CLIENT Bypassing /api endpoint for local dev/Vite compat
 */
export function useSyncWorkout(user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(0);

  // Initialize queue length from IndexedDB
  useEffect(() => {
    const initQueue = async () => {
      try {
        const queue = await zyronDB.getSyncQueue();
        setSyncPending(queue.length);
      } catch (e) {
        console.error('Failed to init sync queue', e);
      }
    };
    initQueue();
  }, []);

  const processItem = async (item, session) => {
    const userId = session.user.id;
    
    // 1. Insert Workout Log
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        user_id:          userId,
        workout_key:      String(item.workout.workout_key),
        duration_seconds: item.workout.duration_seconds,
        created_at:       item.workout.created_at  || new Date().toISOString(),
        workout_name:     item.workout.workout_name || null,
        started_at:       item.workout.started_at   || null,
        ended_at:         item.workout.ended_at     || null,
        location:         item.workout.location     || null,
      })
      .select()
      .single();

    if (workoutError) throw new Error(workoutError.message);

    // 2. Handle Photo Upload
    if (item.workout.photo_payload) {
      try {
        const parts = item.workout.photo_payload.split(',');
        const base64Data = parts[1];
        const contentType = parts[0].split(';')[0].split(':')[1];
        const fileName = `${userId}/${Date.now()}.jpg`;

        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('workout_photos')
          .upload(fileName, bytes, {
            contentType: contentType,
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('workout_photos')
            .getPublicUrl(fileName);
            
          await supabase.from('workout_photos').insert({
            workout_log_id: workoutLog.id,
            user_id: userId,
            storage_path: publicUrl
          });
        }
      } catch (uploadErr) {
        logger.error('Storage Upload Error:', {}, uploadErr);
      }
    }

    // 3. Insert Sets
    if (item.sets && item.sets.length > 0) {
      const setLogs = item.sets.map((set, idx) => ({
        user_id: userId,
        workout_id: workoutLog.id,
        exercise_id: set.exercise_id,
        set_number: set.set_number || (idx + 1),
        weight_kg: parseFloat(set.weight_kg) || 0,
        reps: parseInt(set.reps) || 0,
        rpe: parseInt(set.rpe) || null
      }));

      const { error: setsError } = await supabase
        .from('set_logs')
        .insert(setLogs);

      if (setsError) throw new Error(setsError.message);
    }

    // 4. Update Profile metadata
    await profileService.updateLastSynced(userId);
  };

  const performSync = useCallback(async () => {
    if (!navigator.onLine) return;
    
    try {
      const queue = await zyronDB.getSyncQueue();
      if (queue.length === 0) {
        setSyncPending(0);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      logger.systemEvent('Iniciando sincronização de itens pendentes', { items: queue.length });

      for (const item of queue) {
        try {
          if (item.retryCount >= 5) {
             logger.warn('Skip sync for item (max retries)', { id: item.id });
             continue;
          }

          if (item.workout && item.workout.photo_id && !item.workout.photo_payload) {
            const photoData = await zyronDB.getPhoto(item.workout.photo_id);
            if (photoData) {
              item.workout.photo_payload = photoData;
            }
          }

          // Process using Supabase directly
          await processItem(item, session);

          // Success: Clean up IndexedDB photo and queue item
          if (item.workout && item.workout.photo_id) {
            await zyronDB.deletePhoto(item.workout.photo_id);
          }
          await zyronDB.removeFromSyncQueue(item.id);
          
          logger.systemEvent('Item sincronizado com sucesso', { id: item.id });
        } catch (err) {
          logger.error('Falha ao sincronizar item individual', { id: item.id }, err);
          await zyronDB.updateSyncRetry(item.id, (item.retryCount || 0) + 1, 'failed');
        }
      }

      // Re-evaluate pending
      const newQueue = await zyronDB.getSyncQueue();
      setSyncPending(newQueue.length);
      
    } catch (e) {
       logger.error('Sync process failed globally', {}, e);
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  const logWorkout = useCallback(async (workout, sets) => {
    // NUCLEAR CLEANUP: Sanitize inputs before anything
    const cleanWorkout = sanitizeWorkoutState(workout);
    const cleanSets = sanitizeWorkoutState(sets);
    const payload = { type: 'workout_log', workout: cleanWorkout, sets: cleanSets };

    if (!navigator.onLine) {
      logger.warn('Offline: Treino salvo no IndexedDB Queue');
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Process direct to Supabase
      await processItem(payload, session);

      // Clean photo db if success
      if (workout.photo_id) {
        await zyronDB.deletePhoto(workout.photo_id);
      }

      logger.systemEvent('Treino enviado para nuvem com sucesso');
      return { success: true, status: 'synced' };
    } catch (err) {
      logger.warn('Erro na sincronização imediata, enfileirando...', {}, err);
      if (workout.photo_id && workout.photo_payload) {
         await zyronDB.savePhoto(workout.photo_id, workout.photo_payload);
         delete payload.workout.photo_payload; // reduce size in queue
      }
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued' };
    }
  }, []);

  return { 
    isOnline, 
    logWorkout, 
    syncPending, 
    performSync 
  };
}
