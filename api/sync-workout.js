import { createClient } from '@supabase/supabase-js';
import { validateWorkoutSyncPayload, ValidationError } from './_lib/workout-validation.js';

export const config = {
  runtime: 'edge',
};

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
});

const parseOptionalInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const CLOCK_DRIFT_TOLERANCE_MS = 90 * 1000;

const normalizeClientTimestamp = (isoValue, toleranceMs = CLOCK_DRIFT_TOLERANCE_MS) => {
  const parsed = new Date(isoValue);
  const parsedMs = parsed.getTime();
  const nowMs = Date.now();

  if (!Number.isFinite(parsedMs)) {
    return {
      iso: new Date(nowMs).toISOString(),
      corrected: true,
      driftMs: null,
    };
  }

  const driftMs = parsedMs - nowMs;
  if (Math.abs(driftMs) > toleranceMs) {
    return {
      iso: new Date(nowMs).toISOString(),
      corrected: true,
      driftMs,
    };
  }

  return {
    iso: parsed.toISOString(),
    corrected: false,
    driftMs,
  };
};

const normalizeWorkoutTiming = (payload) => {
  const normalizedStart = normalizeClientTimestamp(payload.started_at);
  const normalizedEnd = normalizeClientTimestamp(payload.ended_at);

  let startedAt = normalizedStart.iso;
  let endedAt = normalizedEnd.iso;

  const startMs = new Date(startedAt).getTime();
  const endMs = new Date(endedAt).getTime();
  const requestedDurationSeconds = Math.max(60, Number(payload.duration_minutes || 1) * 60);

  if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs < startMs) {
    endedAt = new Date(startMs + requestedDurationSeconds * 1000).toISOString();
  }

  const normalizedStartMs = new Date(startedAt).getTime();
  const normalizedEndMs = new Date(endedAt).getTime();
  const derivedDurationSeconds = (
    Number.isFinite(normalizedStartMs)
    && Number.isFinite(normalizedEndMs)
    && normalizedEndMs >= normalizedStartMs
  )
    ? Math.max(1, Math.round((normalizedEndMs - normalizedStartMs) / 1000))
    : requestedDurationSeconds;

  return {
    ...payload,
    started_at: startedAt,
    ended_at: endedAt,
    duration_minutes: Math.max(1, Math.round(derivedDurationSeconds / 60)),
    duration_seconds: derivedDurationSeconds,
    _clock: {
      start: normalizedStart,
      end: normalizedEnd,
    },
  };
};

const selectExistingWorkout = async (supabase, userId, payload) => {
  // Always try by sync_id first
  const bySyncId = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('sync_id', payload.sync_id)
    .maybeSingle();

  if (!bySyncId.error && bySyncId.data) {
    return { existingLog: bySyncId.data, duplicateLogIds: [], matchedBySyncId: true };
  }

  // If sync_id not found, no fallback to other matching strategies
  // This prevents duplicates when sync_id is required
  if (bySyncId.error && bySyncId.error?.code !== '42703') {
    throw bySyncId.error;
  }

  return {
    existingLog: null,
    duplicateLogIds: [],
    matchedBySyncId: false,
  };
};

const writeWorkoutLog = async (supabase, userId, payload, existingLog) => {
  const durationSeconds = Number(payload.duration_seconds) > 0
    ? Number(payload.duration_seconds)
    : payload.duration_minutes * 60;

  const row = {
    user_id: userId,
    sync_id: payload.sync_id,
    workout_key: payload.workout_key || null,
    started_at: payload.started_at,
    ended_at: payload.ended_at,
    duration_seconds: durationSeconds,
    workout_name: payload.workout_name,
    location: payload.location,
    source: payload.source,
    synced_at: new Date().toISOString(),
    status: 'synced',
  };

  const request = (data) => existingLog
    ? supabase.from('workout_logs').update(data).eq('id', existingLog.id).select().single()
    : supabase.from('workout_logs').insert(data).select().single();

  const result = await request(row);
  if (result.error) throw result.error;
  return result.data;
};

const upsertWorkoutPhotoRows = async (supabase, userId, workoutLogId, photos) => {
  const photoRows = photos
    .map(photo => photo.storage_path || photo.path || photo.url)
    .filter(Boolean)
    .map(storagePath => ({
      workout_log_id: workoutLogId,
      user_id: userId,
      storage_path: storagePath,
    }));

  if (photoRows.length > 0) {
    const { error } = await supabase.from('workout_photos').insert(photoRows);
    if (error) console.warn('Workout photo rows insert error:', error);
  }
};

const uploadInlinePhoto = async (supabase, userId, workoutLogId, photoPayload) => {
  if (!photoPayload) return;

  try {
    const parts = photoPayload.split(',');
    const base64Data = parts[1];
    const contentType = parts[0].split(';')[0].split(':')[1];
    const fileName = `${userId}/${Date.now()}.jpg`;

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

    await upsertWorkoutPhotoRows(supabase, userId, workoutLogId, [{ path: publicUrl }]);
  } catch (uploadErr) {
    console.error('Storage Upload Error:', uploadErr);
  }
};

const insertSetLogs = async (supabase, userId, workoutLogId, sets) => {
  if (!sets.length) return;

  // All sets are pre-validated by validateWorkoutSyncPayload
  const setLogs = sets.map((set) => ({
    user_id: userId,
    workout_id: workoutLogId,
    exercise_id: set.exercise_id,
    set_number: set.set_number,
    weight_kg: set.weight_kg,
    reps: set.reps,
    rpe: set.rpe,
    rir: set.rir,
    rest_seconds: set.rest_seconds,
    duration_seconds: set.duration_seconds,
    status: set.status,
  }));

  const { error } = await supabase.from('set_logs').insert(setLogs);
  if (error) throw error;
};

const upsertCardioLog = async (supabase, userId, workoutLog, payload, body) => {
  const cardio = payload?.cardio || null;
  if (!cardio) return null;

  const startedAt = cardio.started_at || payload.started_at;
  const endedAt = cardio.ended_at || payload.ended_at || null;
  const durationSeconds = Number(cardio.duration_seconds);
  const resolvedDuration = Number.isFinite(durationSeconds) && durationSeconds >= 0
    ? Math.round(durationSeconds)
    : (() => {
        const startMs = startedAt ? new Date(startedAt).getTime() : null;
        const endMs = endedAt ? new Date(endedAt).getTime() : null;
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
          return Math.max(1, Math.round((endMs - startMs) / 1000));
        }
        return 0;
      })();

  const row = {
    user_id: userId,
    workout_log_id: workoutLog.id,
    workout_sync_id: cardio.workout_sync_id || payload.sync_id || workoutLog.sync_id || null,
    session_id: cardio.session_id || cardio.workout_sync_id || payload.sync_id || workoutLog.sync_id || null,
    workout_key: cardio.workout_key || payload.workout_key || workoutLog.workout_key || null,
    cardio_type: cardio.cardio_type,
    context: cardio.context || null,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: resolvedDuration,
    status: cardio.status || (endedAt ? 'completed' : 'active'),
    source: cardio.source || payload.source || 'workout_sync',
    synced_at: new Date().toISOString(),
  };

  if (row.status !== 'active' && !row.ended_at) {
    row.ended_at = payload.ended_at;
  }
  if ((!row.duration_seconds || row.duration_seconds <= 0) && row.started_at && row.ended_at) {
    const startMs = new Date(row.started_at).getTime();
    const endMs = new Date(row.ended_at).getTime();
    if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
      row.duration_seconds = Math.max(1, Math.round((endMs - startMs) / 1000));
    }
  }

  const requestById = cardio.cardio_log_id
    ? supabase
      .from('cardio_logs')
      .update(row)
      .eq('id', cardio.cardio_log_id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle()
    : null;

  if (requestById) {
    const updateResult = await requestById;
    if (!updateResult.error && updateResult.data) {
      return updateResult.data;
    }
    if (updateResult.error) {
      console.warn('[sync-workout] cardio update by id failed', {
        sync_id: payload.sync_id,
        cardio_log_id: cardio.cardio_log_id,
        error: updateResult.error?.message,
      });
    }
  }

  const fallbackLookup = await supabase
    .from('cardio_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('workout_sync_id', row.workout_sync_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackLookup.error) {
    console.warn('[sync-workout] cardio lookup fallback failed', {
      sync_id: payload.sync_id,
      error: fallbackLookup.error?.message,
    });
  }

  if (!fallbackLookup.error && fallbackLookup.data?.id) {
    const bySyncUpdate = await supabase
      .from('cardio_logs')
      .update(row)
      .eq('id', fallbackLookup.data.id)
      .eq('user_id', userId)
      .select('*')
      .maybeSingle();

    if (!bySyncUpdate.error && bySyncUpdate.data) {
      return bySyncUpdate.data;
    }

    if (bySyncUpdate.error) {
      console.warn('[sync-workout] cardio update by workout_sync_id failed', {
        sync_id: payload.sync_id,
        cardio_log_id: fallbackLookup.data.id,
        error: bySyncUpdate.error?.message,
      });
    }
  }

  const insertPayload = cardio.cardio_log_id
    ? { ...row, id: cardio.cardio_log_id }
    : row;

  const insertResult = await supabase
    .from('cardio_logs')
    .insert(insertPayload)
    .select('*')
    .single();

  if (insertResult.error) {
    console.warn('[sync-workout] cardio insert failed', {
      sync_id: payload.sync_id,
      error: insertResult.error?.message,
      cardio_payload: body?.cardio || null,
    });
    return null;
  }

  return insertResult.data;
};

const insertExerciseCompletions = async (supabase, userId, workoutLogId, sets) => {
  const exerciseMap = new Map();
  sets.forEach(set => {
    const exerciseId = set.exercise_id || set.exerciseId;
    if (!exerciseId) return;
    const current = exerciseMap.get(exerciseId) || {
      exercise_id: exerciseId,
      exercise_name: set.exercise_name || set.exerciseName || null,
      reps: 0,
      sets: 0,
      failed: false,
    };

    current.reps += parseOptionalInt(set.reps) || 0;
    current.sets += 1;
    current.failed = current.failed || set.status === 'failed';
    exerciseMap.set(exerciseId, current);
  });

  const rows = Array.from(exerciseMap.values()).map(exercise => ({
    session_id: workoutLogId,
    user_id: userId,
    exercise_id: exercise.exercise_id,
    exercise_name: exercise.exercise_name,
    reps: exercise.reps,
    sets: exercise.sets,
    notes: exercise.failed ? 'Falha registrada em pelo menos uma serie' : null,
    completed_at: new Date().toISOString(),
  }));

  if (!rows.length) return;

  const { error } = await supabase.from('exercise_completions').insert(rows);
  if (error) console.warn('Exercise completions insert error:', error);
};

const updateExercisePRs = async (supabase, userId, sets) => {
  const maxByExercise = new Map();

  // Sets are pre-validated, weight_kg is guaranteed to be a number
  sets.forEach(set => {
    const exerciseId = set.exercise_id;
    const weight = set.weight_kg;

    const current = maxByExercise.get(exerciseId);
    if (current === undefined || weight > current) {
      maxByExercise.set(exerciseId, weight);
    }
  });

  for (const [exerciseId, maxLoad] of maxByExercise.entries()) {
    const { data: current, error: fetchError } = await supabase
      .from('exercise_prs')
      .select('max_load')
      .eq('user_id', userId)
      .eq('exercise_id', exerciseId)
      .maybeSingle();

    if (fetchError) {
      console.warn('Exercise PR fetch error:', fetchError);
      continue;
    }

    if (!current || maxLoad > Number(current.max_load || 0)) {
      const { error } = await supabase.from('exercise_prs').upsert({
        user_id: userId,
        exercise_id: exerciseId,
        max_load: maxLoad,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,exercise_id' });

      if (error) console.warn('Exercise PR upsert error:', error);
    }
  }
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return json({ error: 'Server configuration error' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid token' }, 401);
    }

    // Parse and validate request body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return json({ error: 'Invalid JSON in request body' }, 400);
    }

    const incomingSyncId = body?.sync_id ?? body?.syncId ?? null;
    const incomingSets = Array.isArray(body?.sets) ? body.sets : [];
    console.warn('[sync-debug][backend][incoming]', {
      sync_id: incomingSyncId,
      started_at: body?.started_at ?? body?.startedAt ?? null,
      ended_at: body?.ended_at ?? body?.endedAt ?? null,
      sets_count: incomingSets.length,
      first_set: incomingSets[0] || null,
      client_sync_debug: body?.client_sync_debug ?? null,
    });

    // Strict validation - no fallbacks
    let payload;
    try {
      payload = normalizeWorkoutTiming(validateWorkoutSyncPayload(body));
    } catch (e) {
      if (e instanceof ValidationError) {
        return json({
          error: 'Validation error',
          field: e.field,
          message: e.message,
          details: e.details,
        }, 400);
      }
      throw e;
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Unauthorized', details: authError?.message }, 401);
    }

    const userId = user.id;

    if (payload._clock?.start?.corrected || payload._clock?.end?.corrected) {
      console.warn('[sync-workout] timestamp corrected due clock drift', {
        sync_id: payload.sync_id,
        start_drift_ms: payload._clock?.start?.driftMs ?? null,
        end_drift_ms: payload._clock?.end?.driftMs ?? null,
      });
    }

    if (!payload.sets?.length) {
      console.warn('[sync-workout] empty sets payload', {
        sync_id: payload.sync_id,
        workout_key: payload.workout_key,
      });
    }

    // Check if already synced
    const { existingLog, matchedBySyncId } = await selectExistingWorkout(supabase, userId, payload);

    if (matchedBySyncId) {
      const cardioLog = await upsertCardioLog(
        supabase,
        userId,
        {
          ...existingLog,
          sync_id: payload.sync_id,
          workout_key: payload.workout_key,
        },
        payload,
        body
      );

      return json({
        success: true,
        sync_id: payload.sync_id,
        workout_id: existingLog.id,
        message: 'Workout already synced',
        cardio_log_id: cardioLog?.id || null,
      });
    }

    // Write workout
    const workoutLog = await writeWorkoutLog(supabase, userId, payload, existingLog);

    // Clean up old data if updating
    if (existingLog) {
      await supabase.from('set_logs').delete().eq('workout_id', workoutLog.id);
      await supabase.from('exercise_completions').delete().eq('session_id', workoutLog.id);
      await supabase.from('workout_photos').delete().eq('workout_log_id', workoutLog.id);
    }

    // Save sets, completions, and PRs
    await insertSetLogs(supabase, userId, workoutLog.id, payload.sets);
    await insertExerciseCompletions(supabase, userId, workoutLog.id, payload.sets);
    await updateExercisePRs(supabase, userId, payload.sets);
    const cardioLog = await upsertCardioLog(supabase, userId, workoutLog, payload, body);

    // Save photos (URL rows first)
    await upsertWorkoutPhotoRows(supabase, userId, workoutLog.id, payload.photos);

    // Backward compatibility: if photos array is empty but inline payload exists, upload on server
    if (!payload.photos?.length) {
      const inlinePhotoPayload = body?.workout?.photo_payload || body?.photo_payload || null;
      if (inlinePhotoPayload) {
        await uploadInlinePhoto(supabase, userId, workoutLog.id, inlinePhotoPayload);
      }
    }

    // Update profile
    await supabase.from('profiles').update({ last_synced_at: new Date().toISOString() }).eq('id', userId);

    return json({
      success: true,
      sync_id: payload.sync_id,
      workout_id: workoutLog.id,
      message: 'Workout synced successfully',
      synced_at: new Date().toISOString(),
      cardio_log_id: cardioLog?.id || null,
    });
  } catch (error) {
    console.error('[Sync-Workout] Fatal Error:', error);
    return json({
      error: 'Internal Server Error',
      details: error.message,
    }, 500);
  }
}
