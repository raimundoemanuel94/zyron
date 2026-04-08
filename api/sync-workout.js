import { createClient } from '@supabase/supabase-js';

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
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalFloat = (value, fallback = null) => {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const dayBounds = (isoDate) => {
  const date = isoDate ? new Date(isoDate) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
};

const normalizePayload = (body) => {
  const workout = body.workout || {};
  const stats = body.stats || {};
  const location = body.location || {};
  const syncId = body.syncId || body.sync_id || body.id || workout.sync_id || crypto.randomUUID();
  const endedAt = workout.ended_at || workout.finishedAt || workout.finished_at || workout.completed_at || workout.created_at || new Date().toISOString();
  const startedAt = workout.started_at || workout.startedAt || null;
  const workoutKey = String(workout.workout_key || workout.workoutKey || workout.id || workout.key || '0');
  const workoutName = workout.workout_name || workout.workoutName || workout.name || null;
  const durationSeconds = workout.duration_seconds
    ?? workout.durationSeconds
    ?? (stats.durationMinutes ? Number(stats.durationMinutes) * 60 : null);

  return {
    syncId,
    source: body.source || workout.source || 'web',
    workout: {
      workout_key: workoutKey,
      duration_seconds: parseOptionalInt(durationSeconds) || 0,
      created_at: workout.created_at || endedAt,
      started_at: startedAt,
      ended_at: endedAt,
      workout_name: workoutName,
      location: workout.location || location.address || null,
      photo_payload: workout.photo_payload || null,
    },
    sets: Array.isArray(body.sets) ? body.sets : [],
    photos: Array.isArray(body.photos) ? body.photos : [],
  };
};

const selectExistingWorkout = async (supabase, userId, payload) => {
  const bySyncId = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('sync_id', payload.syncId)
    .maybeSingle();

  if (!bySyncId.error && bySyncId.data) {
    return { existingLog: bySyncId.data, duplicateLogIds: [], supportsSyncId: true, matchedBySyncId: true };
  }

  const supportsSyncId = bySyncId.error?.code !== '42703' && !String(bySyncId.error?.message || '').includes('sync_id');
  const { startIso, endIso } = dayBounds(payload.workout.ended_at || payload.workout.created_at);

  const byWorkoutDay = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', userId)
    .eq('workout_key', payload.workout.workout_key)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false });

  if (byWorkoutDay.error) throw byWorkoutDay.error;

  return {
    existingLog: byWorkoutDay.data?.[0] || null,
    duplicateLogIds: byWorkoutDay.data?.slice(1).map(log => log.id) || [],
    supportsSyncId,
    matchedBySyncId: false,
  };
};

const writeWorkoutLog = async (supabase, userId, payload, existingLog) => {
  const baseLog = {
    user_id: userId,
    workout_key: payload.workout.workout_key,
    duration_seconds: payload.workout.duration_seconds,
    created_at: payload.workout.created_at,
    workout_name: payload.workout.workout_name,
    started_at: payload.workout.started_at,
    ended_at: payload.workout.ended_at,
    location: payload.workout.location,
  };

  const richLog = {
    ...baseLog,
    sync_id: payload.syncId,
    source: payload.source,
    synced_at: new Date().toISOString(),
    status: 'synced',
  };

  const request = (row) => existingLog
    ? supabase.from('workout_logs').update(row).eq('id', existingLog.id).select().single()
    : supabase.from('workout_logs').insert(row).select().single();

  const richResult = await request(richLog);
  if (!richResult.error) return richResult.data;

  const missingSyncColumns = ['sync_id', 'source', 'synced_at', 'status'].some(column =>
    richResult.error?.code === '42703' || String(richResult.error?.message || '').includes(column)
  );

  if (!missingSyncColumns) throw richResult.error;

  const fallbackResult = await request(baseLog);
  if (fallbackResult.error) throw fallbackResult.error;
  return fallbackResult.data;
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

  const baseSetLogs = sets.map((set, idx) => ({
    user_id: userId,
    workout_id: workoutLogId,
    exercise_id: set.exercise_id || set.exerciseId,
    set_number: set.set_number || set.setNumber || (idx + 1),
    weight_kg: parseOptionalFloat(set.weight_kg ?? set.weight, 0),
    reps: parseOptionalInt(set.reps) || 0,
    rpe: parseOptionalInt(set.rpe),
  }));

  const richSetLogs = baseSetLogs.map((setLog, idx) => ({
    ...setLog,
    rir: parseOptionalInt(sets[idx].rir),
    rest_seconds: parseOptionalInt(sets[idx].rest_seconds ?? sets[idx].restSeconds),
    duration_seconds: parseOptionalInt(sets[idx].duration_seconds ?? sets[idx].durationSeconds),
    status: sets[idx].status || (sets[idx].completed === false ? 'failed' : 'completed'),
  }));

  const { error: richSetsError } = await supabase.from('set_logs').insert(richSetLogs);
  if (!richSetsError) return;

  console.warn('Set Logs Rich Batch Error, retrying basic payload:', richSetsError);
  const { error: setsError } = await supabase.from('set_logs').insert(baseSetLogs);
  if (setsError) throw setsError;
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

  sets.forEach(set => {
    const exerciseId = set.exercise_id || set.exerciseId;
    const weight = parseOptionalFloat(set.weight_kg ?? set.weight, null);
    if (!exerciseId || weight === null) return;
    const current = maxByExercise.get(exerciseId);
    if (current === undefined || weight > current) maxByExercise.set(exerciseId, weight);
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
      status: 200,
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

    const body = await req.json();
    const payload = normalizePayload(body);
    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return json({ error: 'Unauthorized', details: authError?.message }, 401);
    }

    const userId = user.id;
    const { existingLog, duplicateLogIds, matchedBySyncId } = await selectExistingWorkout(supabase, userId, payload);

    if (matchedBySyncId) {
      return json({
        success: true,
        syncId: payload.syncId,
        workoutLogId: existingLog.id,
        message: 'Workout already synced',
      });
    }

    const workoutLog = await writeWorkoutLog(supabase, userId, payload, existingLog);

    if (existingLog) {
      const { error: setsDeleteError } = await supabase.from('set_logs').delete().eq('workout_id', workoutLog.id);
      if (setsDeleteError) throw setsDeleteError;

      const { error: completionDeleteError } = await supabase.from('exercise_completions').delete().eq('session_id', workoutLog.id);
      if (completionDeleteError) console.warn('Exercise completions cleanup error:', completionDeleteError);

      const { error: photosDeleteError } = await supabase.from('workout_photos').delete().eq('workout_log_id', workoutLog.id);
      if (photosDeleteError) console.warn('Workout photos cleanup error:', photosDeleteError);
    }

    if (duplicateLogIds.length > 0) {
      const { error: duplicateDeleteError } = await supabase.from('workout_logs').delete().in('id', duplicateLogIds);
      if (duplicateDeleteError) console.warn('Duplicate workout cleanup error:', duplicateDeleteError);
    }

    await uploadInlinePhoto(supabase, userId, workoutLog.id, payload.workout.photo_payload);
    await upsertWorkoutPhotoRows(supabase, userId, workoutLog.id, payload.photos);
    await insertSetLogs(supabase, userId, workoutLog.id, payload.sets);
    await insertExerciseCompletions(supabase, userId, workoutLog.id, payload.sets);
    await updateExercisePRs(supabase, userId, payload.sets);

    await supabase.from('profiles').update({ last_synced_at: new Date().toISOString() }).eq('id', userId);

    return json({
      success: true,
      syncId: payload.syncId,
      workoutLogId: workoutLog.id,
      message: 'Workout synced successfully',
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Sync-Workout] Fatal Error:', error);
    return json({
      error: 'Internal Server Error',
      details: error.message,
    }, 500);
  }
}
