import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { db as zyronDB } from '../utils/db';

/**
 * useSyncWorkout Hook - ZYRON Advanced Sync v2 (Photos Support)
 */
export function useSyncWorkout(user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('ZYRON_PENDING_WORKOUTS');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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
  }, [syncQueue]);

  useEffect(() => {
    localStorage.setItem('ZYRON_PENDING_WORKOUTS', JSON.stringify(syncQueue));
  }, [syncQueue]);

  const performSync = useCallback(async () => {
    if (!navigator.onLine || syncQueue.length === 0) return;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    logger.systemEvent('Iniciando sincronização de treinos pendentes', { items: syncQueue.length });

    const updatedQueue = [...syncQueue];
    const failedItems = [];

    for (const item of updatedQueue) {
      try {
        // ZYRON ADVANCED: Check if there's a photo in IndexedDB for this workout
        if (item.workout.photo_id) {
          const photoData = await zyronDB.getPhoto(item.workout.photo_id);
          if (photoData) {
            item.workout.photo_payload = photoData;
          }
        }

        const response = await fetch('/api/sync-workout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify(item)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.details || errorData.error || 'Sync failed');
        }

        // Success: Clean up IndexedDB if a photo was synced
        if (item.workout.photo_id) {
          await zyronDB.deletePhoto(item.workout.photo_id);
        }

        logger.systemEvent('Treino (com foto) sincronizado com sucesso', { workoutKey: item.workout.workout_key });
      } catch (err) {
        logger.error('Falha ao sincronizar treino individual', { workoutKey: item.workout.workout_key }, err);
        failedItems.push(item);
      }
    }

    setSyncQueue(failedItems);
  }, [syncQueue]);

  /**
   * Main method to log a workout
   * @param {Object} workout - Now includes photo_id (indexedDB) and photo_payload (base64)
   * @param {Array} sets
   */
  const logWorkout = useCallback(async (workout, sets) => {
    const payload = { workout, sets };

    // If offline, queue immediately. Photo is already in indexedDB via WorkoutCompleted.jsx
    if (!navigator.onLine) {
      logger.warn('Offline: Treino salvo localmente (ZYRON_PENDING_WORKOUTS + IndexedDB)');
      setSyncQueue(prev => [...prev, payload]);
      return { success: true, status: 'queued' };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch('/api/sync-workout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API unstable, queueing for later');
      }

      // If it was an immediate Success, and there was a photo_id, clean it from DB
      if (workout.photo_id) {
        await zyronDB.deletePhoto(workout.photo_id);
      }

      logger.systemEvent('Treino enviado para nuvem com sucesso');
      return { success: true, status: 'synced' };
    } catch (err) {
      logger.warn('Erro na sincronização imediata, enfileirando...', {}, err);
      // Ensure payload is queued
      setSyncQueue(prev => [...prev, payload]);
      return { success: true, status: 'queued' };
    }
  }, []);

  return { 
    isOnline, 
    logWorkout, 
    syncPending: syncQueue.length, 
    performSync 
  };
}
