import { createClient } from '@supabase/supabase-js';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS Preflight
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
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), { status: 500 });
    }

    const { workout, sets } = await req.json();
    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid token' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), { status: 401 });
    }

    const userId = user.id;
    // 1. Insert Workout Log
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        workout_key: workout.workout_key,
        duration_seconds: workout.duration_seconds,
        created_at: workout.created_at || new Date().toISOString()
      })
      .select()
      .single();

    if (workoutError) {
      console.error('Workout Insert Error:', workoutError);
      throw new Error(`Workout insert failed: ${workoutError.message}`);
    }

    // 2. Handle Photo Upload (Base64 -> Supabase Storage)
    if (workout.photo_payload) {
      try {
        const parts = workout.photo_payload.split(',');
        const base64Data = parts[1];
        const contentType = parts[0].split(';')[0].split(':')[1];
        const fileName = `${userId}/${Date.now()}.jpg`;

        // Helper to decode base64 in Edge Runtime
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

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase
          .storage
          .from('workout_photos')
          .getPublicUrl(fileName);
          
        // Insert into workout_photos table
        await supabase.from('workout_photos').insert({
           workout_log_id: workoutLog.id,
           user_id: userId,
           storage_path: publicUrl
        });

      } catch (uploadErr) {
        console.error('Storage Upload Error:', uploadErr);
        // We continue without photo if upload fails, or we could throw. 
        // For UX, it's better to save the workout even if the photo fails.
      }
    }

    // 2. Insert Sets in Batch (linking via workout_id)
    if (sets && sets.length > 0) {
      const setLogs = sets.map(set => ({
        user_id: userId,
        workout_id: workoutLog.id,
        exercise_id: set.exercise_id,
        set_number: set.set_number || 1,
        weight_kg: parseFloat(set.weight_kg) || 0,
        reps: parseInt(set.reps) || 0,
        rpe: parseInt(set.rpe) || null
      }));

      const { error: setsError } = await supabase
        .from('set_logs')
        .insert(setLogs);

      if (setsError) {
        console.error('Set Logs Batch Error:', setsError);
        // We might want to delete the workoutLog here to be transactional, 
        // but Edge Functions don't support real SQL transactions easily across calls.
        throw new Error(`Sets batch insert failed: ${setsError.message}`);
      }
    }

    // 3. Update Profiles last_synced_at
    await supabase.from('profiles').update({ last_synced_at: new Date().toISOString() }).eq('id', userId);

    return new Response(JSON.stringify({ 
      success: true, 
      workoutId: workoutLog.id,
      syncedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });

  } catch (error) {
    console.error('[Sync-Workout] Fatal Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal Server Error', 
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
    });
  }
}
