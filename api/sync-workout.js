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
  const durationSeconds = payload.duration_minutes * 60;

  const row = {
    user_id: userId,
    sync_id: payload.sync_id,
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

    // Strict validation - no fallbacks
    let payload;
    try {
      payload = validateWorkoutSyncPayload(body);
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

    // Check if already synced
    const { existingLog, matchedBySyncId } = await selectExistingWorkout(supabase, userId, payload);

    if (matchedBySyncId) {
      return json({
        success: true,
        sync_id: payload.sync_id,
        workout_id: existingLog.id,
        message: 'Workout already synced',
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

    // Save photos
    await upsertWorkoutPhotoRows(supabase, userId, workoutLog.id, payload.photos);

    // Update profile
    await supabase.from('profiles').update({ last_synced_at: new Date().toISOString() }).eq('id', userId);

    return json({
      success: true,
      sync_id: payload.sync_id,
      workout_id: workoutLog.id,
      message: 'Workout synced successfully',
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync-Workout] Fatal Error:', error);
    return json({
      error: 'Internal Server Error',
      details: error.message,
    }, 500);
  }
}
