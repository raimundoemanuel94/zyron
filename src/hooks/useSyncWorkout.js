import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';
import { db as zyronDB } from '../utils/db';
import { sanitizeWorkoutState } from '../utils/sanitizer';
import { profileService } from '../core/profile/profileService';

const SHOULD_USE_SERVER_SYNC = import.meta.env.PROD || import.meta.env.VITE_USE_SERVER_SYNC === 'true';
const ALLOW_CLIENT_SYNC_FALLBACK = import.meta.env.DEV || import.meta.env.VITE_ALLOW_CLIENT_SYNC_FALLBACK === 'true';

const getLocalDayBounds = (isoDate) => {
  const day = isoDate ? new Date(isoDate) : new Date();
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const shouldProcessQueuedItem = (item) => {
  if (!item?.nextRetryAt) return true;
  return Date.now() >= Number(item.nextRetryAt);
};

const uploadWorkoutPhotoToStorage = async (userId, payload) => {
  const photoPayload = payload?.workout?.photo_payload;
  if (!userId || !photoPayload || payload?.photos?.length) return payload;

  const parts = photoPayload.split(',');
  const base64Data = parts[1];
  const contentType = parts[0]?.split(';')[0]?.split(':')[1] || 'image/jpeg';
  const extension = contentType.includes('png') ? 'png' : 'jpg';
  const fileName = `${userId}/${payload.syncId || crypto.randomUUID()}.${extension}`;

  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i += 1) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const { error: uploadError } = await supabase
    .storage
    .from('workout_photos')
    .upload(fileName, bytes, {
      contentType,
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase
    .storage
    .from('workout_photos')
    .getPublicUrl(fileName);

  return {
    ...payload,
    workout: {
      ...payload.workout,
      photo_storage_path: publicUrl,
      photo_payload: null,
    },
    photos: [{ path: publicUrl, fileName }],
  };
};

const toAddressLabel = (location) => {
  if (!location) return null;
  if (typeof location === 'string') return location;
  return location.address || null;
};

const buildSyncPayload = (userId, workout, sets, syncId) => {
  const finishedAt = workout.ended_at || workout.finishedAt || workout.created_at || new Date().toISOString();
  const startedAt = workout.started_at || workout.startedAt || finishedAt;
  const durationMinutes = Math.max(1, Math.round((Number(workout.duration_seconds) || 0) / 60));
  const photoPath = workout.photo_storage_path || workout.photoPath || null;
  const photos = photoPath ? [{ path: photoPath, fileName: workout.photo_file_name || null }] : [];

  return {
    // ── Root-level fields required by validateWorkoutSyncPayload ──
    sync_id: syncId,
    syncId,
    started_at: startedAt,
    ended_at: finishedAt,
    duration_minutes: durationMinutes,
    // ─────────────────────────────────────────────────────────────
    id: syncId,
    type: 'workout_log',
    userId,
    source: 'web',
    workout: {
      id: workout.local_id || workout.id || workout.workout_key,
      workout_key: String(workout.workout_key),
      date: finishedAt.slice(0, 10),
      startedAt,
      finishedAt,
      created_at: workout.created_at || finishedAt,
      ended_at: workout.ended_at || finishedAt,
      started_at: workout.started_at || startedAt,
      workoutName: workout.workout_name || workout.workoutName || null,
      workout_name: workout.workout_name || workout.workoutName || null,
      notes: workout.notes || null,
      durationMinutes: Math.round((Number(workout.duration_seconds) || 0) / 60),
      duration_seconds: Number(workout.duration_seconds) || 0,
      location: toAddressLabel(workout.location),
      photo_payload: workout.photo_payload || null,
      photo_id: workout.photo_id || null,
      photo_storage_path: photoPath,
    },
    sets: (sets || []).map((set, index) => ({
      exerciseId: set.exercise_id,
      exercise_id: set.exercise_id,
      exerciseName: set.exercise_name || null,
      exercise_name: set.exercise_name || null,
      setNumber: set.set_number || (index + 1),
      set_number: set.set_number || (index + 1),
      reps: Number(set.reps) || 0,
      weight: Number(set.weight_kg) || 0,
      weight_kg: Number(set.weight_kg) || 0,
      rpe: set.rpe ?? null,
      rir: set.rir ?? null,
      restSeconds: set.rest_seconds ?? null,
      rest_seconds: set.rest_seconds ?? null,
      durationSeconds: set.duration_seconds ?? null,
      duration_seconds: set.duration_seconds ?? null,
      status: set.status || 'completed',
      completed: set.status !== 'failed',
    })),
    photos,
    stats: {
      durationMinutes: Math.round((Number(workout.duration_seconds) || 0) / 60),
      completedExercises: new Set((sets || []).map(set => set.exercise_id)).size,
      volume: (sets || []).reduce((total, set) => total + ((Number(set.weight_kg) || 0) * (Number(set.reps) || 0)), 0),
    },
    location: {
      address: toAddressLabel(workout.location),
    },
    retryCount: 0,
    status: 'pending',
    timestamp: Date.now(),
  };
};

const createDirectSyncProcessor = async (item, session) => {
  const userId = session.user.id;
  const workoutKey = String(item.workout.workout_key);
  const workoutDate = item.workout.ended_at || item.workout.finishedAt || item.workout.created_at || new Date().toISOString();
  const { startIso, endIso } = getLocalDayBounds(workoutDate);

  const logPayload = {
    user_id: userId,
    workout_key: workoutKey,
    duration_seconds: item.workout.duration_seconds,
    created_at: item.workout.created_at || workoutDate,
    workout_name: item.workout.workout_name || item.workout.workoutName || null,
    started_at: item.workout.started_at || item.workout.startedAt || null,
    ended_at: item.workout.ended_at || item.workout.finishedAt || null,
    location: item.workout.location || item.location?.address || null,
  };

  const { data: existingLogs, error: lookupError } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('workout_key', workoutKey)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false });

  if (lookupError) throw new Error(lookupError.message);

  const existingLog = existingLogs?.[0] || null;
  const duplicateLogIds = existingLogs?.slice(1).map(log => log.id) || [];

  const workoutLogRequest = existingLog
    ? supabase.from('workout_logs').update(logPayload).eq('id', existingLog.id).select().single()
    : supabase.from('workout_logs').insert(logPayload).select().single();

  const { data: workoutLog, error: workoutError } = await workoutLogRequest;
  if (workoutError) throw new Error(workoutError.message);

  if (existingLog) {
    const { error: setsDeleteError } = await supabase.from('set_logs').delete().eq('workout_id', workoutLog.id);
    if (setsDeleteError) throw new Error(setsDeleteError.message);

    const { error: photosDeleteError } = await supabase.from('workout_photos').delete().eq('workout_log_id', workoutLog.id);
    if (photosDeleteError) logger.warn('Falha ao limpar foto anterior do treino atualizado', { workoutLogId: workoutLog.id }, photosDeleteError);
  }

  if (duplicateLogIds.length > 0) {
    const { error: duplicateDeleteError } = await supabase.from('workout_logs').delete().in('id', duplicateLogIds);
    if (duplicateDeleteError) logger.warn('Falha ao remover logs duplicados do mesmo dia', { duplicateLogIds }, duplicateDeleteError);
  }

  if (item.workout.photo_payload) {
    try {
      const parts = item.workout.photo_payload.split(',');
      const base64Data = parts[1];
      const contentType = parts[0].split(';')[0].split(':')[1];
      const fileName = `${userId}/${Date.now()}.jpg`;

      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i += 1) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage.from('workout_photos').upload(fileName, bytes, {
        contentType,
        upsert: true,
      });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('workout_photos').getPublicUrl(fileName);
        await supabase.from('workout_photos').insert({
          workout_log_id: workoutLog.id,
          user_id: userId,
          storage_path: publicUrl,
        });
      }
    } catch (uploadErr) {
      logger.error('Storage Upload Error:', {}, uploadErr);
    }
  }

  if (item.sets && item.sets.length > 0) {
    const baseSetLogs = item.sets.map((set, idx) => ({
      user_id: userId,
      workout_id: workoutLog.id,
      exercise_id: set.exercise_id || set.exerciseId,
      set_number: set.set_number || set.setNumber || (idx + 1),
      weight_kg: parseFloat(set.weight_kg ?? set.weight) || 0,
      reps: parseInt(set.reps, 10) || 0,
      rpe: set.rpe === null || set.rpe === undefined || set.rpe === '' ? null : parseInt(set.rpe, 10),
    }));

    const richSetLogs = baseSetLogs.map((setLog, idx) => ({
      ...setLog,
      rir: item.sets[idx].rir === null || item.sets[idx].rir === undefined || item.sets[idx].rir === '' ? null : parseInt(item.sets[idx].rir, 10),
      rest_seconds: item.sets[idx].rest_seconds === null || item.sets[idx].rest_seconds === undefined || item.sets[idx].rest_seconds === '' ? null : parseInt(item.sets[idx].rest_seconds, 10),
      duration_seconds: item.sets[idx].duration_seconds === null || item.sets[idx].duration_seconds === undefined || item.sets[idx].duration_seconds === '' ? null : parseInt(item.sets[idx].duration_seconds, 10),
      status: item.sets[idx].status || 'completed',
    }));

    const { error: richSetsError } = await supabase.from('set_logs').insert(richSetLogs);
    if (richSetsError) {
      logger.warn('Falha ao salvar campos avancados da serie; tentando formato basico', {}, richSetsError);
      const { error: fallbackSetsError } = await supabase.from('set_logs').insert(baseSetLogs);
      if (fallbackSetsError) throw new Error(fallbackSetsError.message);
    }
  }

  await profileService.updateLastSynced(userId);
};

export function useSyncWorkout(user) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncPending, setSyncPending] = useState(0);

  useEffect(() => {
    const initQueue = async () => {
      try {
        const queue = await zyronDB.getSyncQueue();
        setSyncPending(queue.length);
        if (navigator.onLine && queue.length > 0) {
          logger.systemEvent('Fila offline encontrada ao iniciar app', { items: queue.length });
        }
      } catch (e) {
        console.error('Failed to init sync queue', e);
      }
    };
    initQueue();
  }, []);

  const sendViaServer = useCallback(async (item, session) => {
    const response = await fetch('/api/sync-workout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(item),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.details || result.error || `HTTP ${response.status}`);
    }

    return result;
  }, []);

  const processWithOfficialSync = useCallback(async (item, session) => {
    if (SHOULD_USE_SERVER_SYNC) {
      try {
        return await sendViaServer(item, session);
      } catch (serverErr) {
        if (!ALLOW_CLIENT_SYNC_FALLBACK) throw serverErr;
        logger.warn('Server sync indisponivel; usando fallback legado no client', { syncId: item.syncId || item.id }, serverErr);
      }
    }

    await createDirectSyncProcessor(item, session);
    return { success: true, message: 'Workout synced through legacy fallback' };
  }, [sendViaServer]);

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

      logger.systemEvent('Iniciando sincronizacao de itens pendentes', { items: queue.length });

      for (const item of queue) {
        try {
          if (item.retryCount >= 5) {
             logger.warn('Skip sync for item (max retries)', { id: item.id });
             continue;
          }

          if (!shouldProcessQueuedItem(item)) {
            continue;
          }

          if (item.workout?.photo_id && !item.workout.photo_payload) {
            const photoData = await zyronDB.getPhoto(item.workout.photo_id);
            if (photoData) item.workout.photo_payload = photoData;
          }

          let itemToProcess = item;
          if (item.workout?.photo_payload && !item.photos?.length) {
            try {
              itemToProcess = await uploadWorkoutPhotoToStorage(session.user.id, item);
              await zyronDB.updateSyncItem(item.id, {
                workout: itemToProcess.workout,
                photos: itemToProcess.photos,
                status: 'pending',
              });
            } catch (photoErr) {
              logger.warn('Falha ao subir foto antes do sync; mantendo inline payload', { id: item.id, syncId: item.syncId }, photoErr);
            }
          }

          await zyronDB.updateSyncItem(item.id, {
            status: 'processing',
            lastAttemptAt: Date.now(),
          });

          await processWithOfficialSync(itemToProcess, session);

          if (item.workout?.photo_id) await zyronDB.deletePhoto(item.workout.photo_id);
          await zyronDB.removeFromSyncQueue(item.id);
          logger.systemEvent('Item sincronizado com sucesso', { id: item.id, syncId: item.syncId });
        } catch (err) {
          logger.error('Falha ao sincronizar item individual', { id: item.id, syncId: item.syncId }, err);
          await zyronDB.updateSyncRetry(item.id, (item.retryCount || 0) + 1, 'failed');
        }
      }

      const newQueue = await zyronDB.getSyncQueue();
      setSyncPending(newQueue.length);
    } catch (e) {
      logger.error('Sync process failed globally', {}, e);
    }
  }, [processWithOfficialSync]);

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

  useEffect(() => {
    if (navigator.onLine) {
      performSync();
    }
  }, [performSync]);

  useEffect(() => {
    if (navigator.onLine && user?.id) {
      performSync();
    }
  }, [performSync, user?.id]);

  useEffect(() => {
    if (!navigator.onLine) return undefined;

    const intervalId = window.setInterval(() => {
      performSync();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [performSync, isOnline]);

  const logWorkout = useCallback(async (workout, sets) => {
    const cleanWorkout = sanitizeWorkoutState(workout);
    const cleanSets = sanitizeWorkoutState(sets);
    const syncId = crypto.randomUUID();
    const payload = buildSyncPayload(user?.id || null, cleanWorkout, cleanSets, syncId);
    let payloadToSend = payload;

    if (!navigator.onLine) {
      logger.warn('Offline: Treino salvo na fila offline', { syncId });
      if (payload.workout.photo_id && payload.workout.photo_payload) {
        await zyronDB.savePhoto(payload.workout.photo_id, payload.workout.photo_payload);
        delete payload.workout.photo_payload;
      }
      await zyronDB.addToSyncQueue(payload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued', syncId };
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      if (payload.workout.photo_payload) {
        try {
          payloadToSend = await uploadWorkoutPhotoToStorage(session.user.id, payload);
        } catch (photoErr) {
          logger.warn('Falha ao subir foto antes do sync imediato; enviando inline payload', { syncId }, photoErr);
        }
      }

      await processWithOfficialSync(payloadToSend, session);

      if (payload.workout.photo_id) await zyronDB.deletePhoto(payload.workout.photo_id);
      logger.systemEvent('Treino enviado para nuvem com sucesso', { syncId, mode: SHOULD_USE_SERVER_SYNC ? 'server' : 'fallback' });
      return { success: true, status: 'synced', syncId };
    } catch (err) {
      logger.warn('Erro na sincronizacao imediata, enfileirando...', { syncId }, err);
      const queuedPayload = payloadToSend || payload;
      if (queuedPayload.workout.photo_id && queuedPayload.workout.photo_payload) {
        await zyronDB.savePhoto(queuedPayload.workout.photo_id, queuedPayload.workout.photo_payload);
        delete queuedPayload.workout.photo_payload;
      }
      await zyronDB.addToSyncQueue(queuedPayload);
      setSyncPending(prev => prev + 1);
      return { success: true, status: 'queued', syncId };
    }
  }, [processWithOfficialSync, user?.id]);

  return {
    isOnline,
    logWorkout,
    syncPending,
    performSync,
  };
}
