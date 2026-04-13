// ZYRON - Strict Workout Payload Validation
// Enforces consistent, complete workout data contracts

const ValidationError = class extends Error {
  constructor(field, message, details = {}) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.details = details;
  }
};

/**
 * STRICT VALIDATION - no fallbacks, no defaults beyond what's required
 */

const validateUUID = (value, fieldName = 'id') => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!value || !UUID_REGEX.test(String(value))) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a valid UUID`,
      { received: value }
    );
  }
  return String(value);
};

const validateISOString = (value, fieldName = 'timestamp') => {
  if (!value || typeof value !== 'string') {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a string`,
      { received: typeof value }
    );
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a valid ISO 8601 string`,
      { received: value }
    );
  }

  return parsed.toISOString();
};

const validateInteger = (value, fieldName = 'integer', min = null, max = null) => {
  const num = parseInt(value, 10);

  if (!Number.isFinite(num)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a valid integer`,
      { received: value }
    );
  }

  if (min !== null && num < min) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be >= ${min}`,
      { received: num, min }
    );
  }

  if (max !== null && num > max) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be <= ${max}`,
      { received: num, max }
    );
  }

  return num;
};

const validateFloat = (value, fieldName = 'float', min = null, max = null) => {
  const num = parseFloat(value);

  if (!Number.isFinite(num)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a valid number`,
      { received: value }
    );
  }

  if (min !== null && num < min) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be >= ${min}`,
      { received: num, min }
    );
  }

  if (max !== null && num > max) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be <= ${max}`,
      { received: num, max }
    );
  }

  return num;
};

const validateString = (value, fieldName = 'text', minLen = 1, maxLen = 1000) => {
  if (typeof value !== 'string') {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be a string`,
      { received: typeof value }
    );
  }

  const trimmed = value.trim();

  if (trimmed.length < minLen) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be at least ${minLen} characters`,
      { received: trimmed.length, minLen }
    );
  }

  if (trimmed.length > maxLen) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be at most ${maxLen} characters`,
      { received: trimmed.length, maxLen }
    );
  }

  return trimmed;
};

const validateEnum = (value, fieldName = 'field', validValues = []) => {
  if (!validValues.includes(value)) {
    throw new ValidationError(
      fieldName,
      `${fieldName} must be one of: ${validValues.join(', ')}`,
      { received: value, validValues }
    );
  }
  return value;
};

/**
 * Validate a complete set (exercise attempt)
 */
const validateSet = (set, index) => {
  if (!set || typeof set !== 'object') {
    throw new ValidationError(
      `sets[${index}]`,
      `Set at index ${index} must be an object`
    );
  }

  return {
    // exercise_id uses short keys like 'p1', 'c1' — not UUIDs
    exercise_id: validateString(set.exercise_id ?? set.exerciseId, `sets[${index}].exercise_id`, 1, 100),
    set_number: validateInteger(set.set_number ?? set.setNumber ?? (index + 1), `sets[${index}].set_number`, 1),
    reps: validateInteger(set.reps, `sets[${index}].reps`, 0),
    weight_kg: validateFloat(set.weight_kg ?? set.weight, `sets[${index}].weight_kg`, 0),
    rpe: set.rpe ? validateInteger(set.rpe, `sets[${index}].rpe`, 1, 10) : null,
    rir: set.rir ? validateInteger(set.rir, `sets[${index}].rir`, 0) : null,
    rest_seconds: set.rest_seconds ?? set.restSeconds ? validateInteger(set.rest_seconds ?? set.restSeconds, `sets[${index}].rest_seconds`, 0) : null,
    duration_seconds: set.duration_seconds ?? set.durationSeconds ? validateInteger(set.duration_seconds ?? set.durationSeconds, `sets[${index}].duration_seconds`, 0) : null,
    status: validateEnum(
      set.status || (set.completed === false ? 'failed' : 'completed'),
      `sets[${index}].status`,
      ['completed', 'failed']
    ),
  };
};

/**
 * Validate a photo reference
 */
const validatePhoto = (photo, index) => {
  if (!photo || typeof photo !== 'object') {
    throw new ValidationError(
      `photos[${index}]`,
      `Photo at index ${index} must be an object`
    );
  }

  const path = photo.storage_path ?? photo.path ?? photo.url;
  if (!path) {
    throw new ValidationError(
      `photos[${index}].path`,
      'Photo must have storage_path, path, or url'
    );
  }

  return {
    storage_path: validateString(path, `photos[${index}].path`, 1, 500),
  };
};

const normalizeLocation = (rawLocation) => {
  if (!rawLocation) return null;

  if (typeof rawLocation === 'string') {
    return validateString(rawLocation, 'location', 0, 255);
  }

  if (typeof rawLocation === 'object') {
    const candidate = rawLocation.address ?? rawLocation.label ?? rawLocation.name ?? null;
    if (!candidate) return null;
    return validateString(candidate, 'location', 0, 255);
  }

  throw new ValidationError(
    'location',
    'location must be a string or object with address',
    { received: typeof rawLocation }
  );
};

/**
 * PRIMARY VALIDATION - Workout Sync Payload
 * This is the contract between client and server
 */
export const validateWorkoutSyncPayload = (body) => {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('body', 'Request body must be an object');
  }

  // REQUIRED: sync_id (or sync ID generation on client)
  const sync_id = validateUUID(
    body.sync_id ?? body.syncId,
    'sync_id'
  );

  // REQUIRED: timing
  const started_at = validateISOString(body.started_at ?? body.startedAt, 'started_at');
  const ended_at = validateISOString(body.ended_at ?? body.endedAt, 'ended_at');

  // Validate timing order
  const startTime = new Date(started_at).getTime();
  const endTime = new Date(ended_at).getTime();
  if (startTime >= endTime) {
    throw new ValidationError(
      'timing',
      'started_at must be before ended_at',
      { started_at, ended_at }
    );
  }

  // REQUIRED: duration
  const duration_minutes = validateInteger(
    body.duration_minutes ?? body.durationMinutes,
    'duration_minutes',
    1
  );

  // OPTIONAL: exercises (set details may be empty; workout log still syncs)
  const sets = Array.isArray(body.sets) ? body.sets : [];
  const validatedSets = sets.map((set, idx) => validateSet(set, idx));

  // OPTIONAL: photos
  const photos = Array.isArray(body.photos) ? body.photos : [];
  const validatedPhotos = photos.map((photo, idx) => validatePhoto(photo, idx));

  // OPTIONAL: metadata
  const rawWorkoutName = body.workout_name ?? body.workoutName ?? body.workout?.workout_name ?? body.workout?.workoutName;
  const workout_name = rawWorkoutName ? validateString(rawWorkoutName, 'workout_name', 0, 255) : null;
  const rawWorkoutKey = body.workout_key ?? body.workout?.workout_key ?? null;
  const workout_key = rawWorkoutKey ? validateString(rawWorkoutKey, 'workout_key', 1, 100) : null;
  const location = normalizeLocation(body.location ?? body.workout?.location ?? null);
  const source = body.source ? validateEnum(body.source, 'source', ['web', 'mobile', 'ios', 'android']) : 'web';

  return {
    sync_id,
    started_at,
    ended_at,
    duration_minutes,
    sets: validatedSets,
    photos: validatedPhotos,
    workout_name,
    workout_key,
    location,
    source,
  };
};

export { ValidationError };
