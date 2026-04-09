export const CHECKIN_STATUS = {
  IDLE: 'IDLE',
  WAITING_PERMISSION: 'WAITING_PERMISSION',
  WAITING_GPS: 'WAITING_GPS',
  IN_RANGE_PENDING: 'IN_RANGE_PENDING',
  ACTIVE: 'ACTIVE',
  OUT_OF_RANGE_PENDING: 'OUT_OF_RANGE_PENDING',
  MANUAL_ACTIVE: 'MANUAL_ACTIVE',
  ENDED: 'ENDED',
  ERROR: 'ERROR',
};

export const CHECKIN_EVENT = {
  START: 'CHECKIN_START',
  HEARTBEAT: 'CHECKIN_HEARTBEAT',
  END: 'CHECKIN_END',
};

export const DEFAULT_CHECKIN_CONFIG = {
  entryConfirmations: 2,
  exitConfirmations: 2,
  maxAccuracyM: 80,
  fallbackRadiusM: 120,
  heartbeatIntervalMs: 2 * 60 * 1000,
  distanceFilterM: 20,
};

const toRad = (value) => (value * Math.PI) / 180;

export const haversineDistanceMeters = (from, to) => {
  if (
    !from
    || !to
    || !Number.isFinite(from.lat)
    || !Number.isFinite(from.lng)
    || !Number.isFinite(to.lat)
    || !Number.isFinite(to.lng)
  ) {
    return null;
  }

  const earthRadiusM = 6371000;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const a = (
    Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * (Math.sin(dLng / 2) ** 2)
  );

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusM * c;
};

export const getTimezoneInfo = () => {
  const now = new Date();
  return {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    utc_iso: now.toISOString(),
    local_iso: new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString(),
  };
};

const randomId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const normalizeGeoReading = (position, source = 'gps') => {
  const coords = position?.coords || position;
  const timestamp = position?.timestamp ? new Date(position.timestamp).toISOString() : new Date().toISOString();

  return {
    lat: Number(coords?.latitude),
    lng: Number(coords?.longitude),
    accuracy_m: Number(coords?.accuracy ?? 9999),
    source,
    captured_at_utc: timestamp,
  };
};

export const assessReadingAgainstGym = (reading, gym, config = DEFAULT_CHECKIN_CONFIG) => {
  const maxAccuracyM = Number(config.maxAccuracyM || DEFAULT_CHECKIN_CONFIG.maxAccuracyM);
  const reliable = Number.isFinite(reading?.accuracy_m) && reading.accuracy_m > 0 && reading.accuracy_m <= maxAccuracyM;

  const gymPoint = {
    lat: Number(gym?.lat),
    lng: Number(gym?.lng),
  };

  const distance_m = haversineDistanceMeters(
    { lat: Number(reading?.lat), lng: Number(reading?.lng) },
    gymPoint,
  );

  const radius_m = Number(gym?.radius_m || gym?.radiusM || config.fallbackRadiusM || DEFAULT_CHECKIN_CONFIG.fallbackRadiusM);
  const in_range = Number.isFinite(distance_m) && distance_m <= radius_m;

  return {
    ...reading,
    distance_m,
    radius_m,
    reliable,
    in_range,
    gym_id: gym?.id || null,
  };
};

export const createInitialCheckinState = () => ({
  status: CHECKIN_STATUS.IDLE,
  session: null,
  last_reading: null,
  last_distance_m: null,
  consecutive_in_range: 0,
  consecutive_out_of_range: 0,
  heartbeat_count: 0,
  last_heartbeat_at_utc: null,
  manual_fallback_recommended: false,
  error: null,
});

const createSession = ({ gymId, mode, reading, heartbeatCount = 0 }) => {
  const tz = getTimezoneInfo();
  return {
    id: randomId('chk'),
    gym_id: gymId || null,
    mode,
    started_at_utc: tz.utc_iso,
    started_at_local: tz.local_iso,
    timezone: tz.timezone,
    started_lat: reading?.lat ?? null,
    started_lng: reading?.lng ?? null,
    started_accuracy_m: reading?.accuracy_m ?? null,
    source: reading?.source || (mode === 'manual' ? 'manual' : 'gps'),
    last_heartbeat_at_utc: tz.utc_iso,
    heartbeat_count: heartbeatCount,
  };
};

const closeSession = (session, reading, reason) => {
  if (!session) return null;

  const ended = new Date();
  const started = session.started_at_utc ? new Date(session.started_at_utc) : ended;
  const duration_minutes = Math.max(0, Math.round((ended.getTime() - started.getTime()) / 60000));
  const tz = getTimezoneInfo();

  return {
    ...session,
    ended_at_utc: ended.toISOString(),
    ended_at_local: new Date(ended.getTime() - (ended.getTimezoneOffset() * 60000)).toISOString(),
    duration_minutes,
    ended_lat: reading?.lat ?? null,
    ended_lng: reading?.lng ?? null,
    ended_accuracy_m: reading?.accuracy_m ?? null,
    ended_reason: reason || 'manual',
    timezone: tz.timezone,
  };
};

export const applyAssessmentToState = ({
  state,
  assessment,
  gym,
  config = DEFAULT_CHECKIN_CONFIG,
}) => {
  const entryConfirmations = Number(config.entryConfirmations || DEFAULT_CHECKIN_CONFIG.entryConfirmations);
  const exitConfirmations = Number(config.exitConfirmations || DEFAULT_CHECKIN_CONFIG.exitConfirmations);
  const heartbeatIntervalMs = Number(config.heartbeatIntervalMs || DEFAULT_CHECKIN_CONFIG.heartbeatIntervalMs);

  const next = {
    ...state,
    last_reading: assessment,
    last_distance_m: assessment?.distance_m ?? null,
    error: null,
  };

  if (!assessment?.reliable) {
    next.status = next.session ? next.status : CHECKIN_STATUS.WAITING_GPS;
    return { nextState: next, event: null };
  }

  const nowMs = Date.now();

  if (
    next.status === CHECKIN_STATUS.IDLE
    || next.status === CHECKIN_STATUS.WAITING_PERMISSION
    || next.status === CHECKIN_STATUS.WAITING_GPS
    || next.status === CHECKIN_STATUS.IN_RANGE_PENDING
    || next.status === CHECKIN_STATUS.ENDED
  ) {
    if (assessment.in_range) {
      next.consecutive_in_range += 1;
      next.consecutive_out_of_range = 0;
      next.status = CHECKIN_STATUS.IN_RANGE_PENDING;

      if (next.consecutive_in_range >= entryConfirmations) {
        const session = createSession({
          gymId: gym?.id,
          mode: 'auto',
          reading: assessment,
          heartbeatCount: 1,
        });

        next.session = session;
        next.heartbeat_count = 1;
        next.last_heartbeat_at_utc = session.last_heartbeat_at_utc;
        next.status = CHECKIN_STATUS.ACTIVE;
        next.consecutive_in_range = 0;

        return {
          nextState: next,
          event: {
            type: CHECKIN_EVENT.START,
            session,
            reading: assessment,
          },
        };
      }
    } else {
      next.consecutive_in_range = 0;
      next.consecutive_out_of_range = 0;
      next.status = CHECKIN_STATUS.WAITING_GPS;
    }

    return { nextState: next, event: null };
  }

  if (next.status === CHECKIN_STATUS.ACTIVE || next.status === CHECKIN_STATUS.OUT_OF_RANGE_PENDING) {
    if (assessment.in_range) {
      next.consecutive_in_range += 1;
      next.consecutive_out_of_range = 0;
      next.status = CHECKIN_STATUS.ACTIVE;

      const lastHeartbeatMs = next.last_heartbeat_at_utc ? new Date(next.last_heartbeat_at_utc).getTime() : 0;
      if (!lastHeartbeatMs || (nowMs - lastHeartbeatMs) >= heartbeatIntervalMs) {
        const heartbeatAt = new Date().toISOString();
        next.heartbeat_count += 1;
        next.last_heartbeat_at_utc = heartbeatAt;
        if (next.session) {
          next.session = {
            ...next.session,
            heartbeat_count: next.heartbeat_count,
            last_heartbeat_at_utc: heartbeatAt,
          };
        }

        return {
          nextState: next,
          event: {
            type: CHECKIN_EVENT.HEARTBEAT,
            session: next.session,
            reading: assessment,
          },
        };
      }

      return { nextState: next, event: null };
    }

    next.consecutive_out_of_range += 1;
    next.consecutive_in_range = 0;
    next.status = CHECKIN_STATUS.OUT_OF_RANGE_PENDING;

    if (next.consecutive_out_of_range >= exitConfirmations) {
      const closedSession = closeSession(next.session, assessment, 'left_geofence');
      next.session = closedSession;
      next.status = CHECKIN_STATUS.ENDED;
      next.consecutive_out_of_range = 0;

      return {
        nextState: next,
        event: {
          type: CHECKIN_EVENT.END,
          session: closedSession,
          reading: assessment,
          reason: 'left_geofence',
        },
      };
    }

    return { nextState: next, event: null };
  }

  if (next.status === CHECKIN_STATUS.MANUAL_ACTIVE && next.session) {
    const lastHeartbeatMs = next.last_heartbeat_at_utc ? new Date(next.last_heartbeat_at_utc).getTime() : 0;
    if (!lastHeartbeatMs || (nowMs - lastHeartbeatMs) >= heartbeatIntervalMs) {
      const heartbeatAt = new Date().toISOString();
      next.heartbeat_count += 1;
      next.last_heartbeat_at_utc = heartbeatAt;
      next.session = {
        ...next.session,
        heartbeat_count: next.heartbeat_count,
        last_heartbeat_at_utc: heartbeatAt,
      };

      return {
        nextState: next,
        event: {
          type: CHECKIN_EVENT.HEARTBEAT,
          session: next.session,
          reading: assessment,
        },
      };
    }
  }

  return { nextState: next, event: null };
};

export const startManualSession = (state, gym) => {
  const session = createSession({
    gymId: gym?.id,
    mode: 'manual',
    reading: {
      source: 'manual',
      lat: null,
      lng: null,
      accuracy_m: null,
    },
    heartbeatCount: 1,
  });

  return {
    ...state,
    status: CHECKIN_STATUS.MANUAL_ACTIVE,
    session,
    heartbeat_count: 1,
    last_heartbeat_at_utc: session.last_heartbeat_at_utc,
    manual_fallback_recommended: false,
    error: null,
  };
};

export const endSession = (state, reason = 'manual', reading = null) => {
  if (!state?.session) {
    return {
      ...state,
      status: CHECKIN_STATUS.ENDED,
      error: null,
    };
  }

  const closedSession = closeSession(state.session, reading || state.last_reading, reason);
  return {
    ...state,
    status: CHECKIN_STATUS.ENDED,
    session: closedSession,
    consecutive_in_range: 0,
    consecutive_out_of_range: 0,
    error: null,
  };
};

export const setCheckinError = (state, message, details = {}) => ({
  ...state,
  status: CHECKIN_STATUS.ERROR,
  error: {
    message,
    details,
    at_utc: new Date().toISOString(),
  },
  manual_fallback_recommended: true,
});
