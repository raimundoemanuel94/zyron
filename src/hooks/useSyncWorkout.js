import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { db as zyronDB } from '../utils/db';

/**
 * useSyncWorkout Hook - ZYRON Advanced Sync v2 (Photos + IndexedDB Queue)
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

          // ZYRON ADVANCED: Check if there's a photo in IndexedDB for this workout
          if (item.workout && item.workout.photo_id) {
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

  /**
   * Main method to log a workout
   * @param {Object} workout - Now includes photo_id (indexedDB) and photo_payload (base64)
   * @param {Array} sets
   */
  const logWorkout = useCallback(async (workout, sets) => {
    const payload = { type: 'workout_log', workout, sets };

    // If offline, queue immediately. Photo is already in indexedDB via WorkoutCompleted.jsx
    if (!navigator.onLine) {
      logger.warn('Offline: Treino salvo no IndexedDB Queue');
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
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
