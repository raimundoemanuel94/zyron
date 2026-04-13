import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import logger from '../utils/logger';
import {
  CHECKIN_EVENT,
  CHECKIN_STATUS,
  DEFAULT_CHECKIN_CONFIG,
  applyAssessmentToState,
  assessReadingAgainstGym,
  createInitialCheckinState,
  endSession,
  normalizeGeoReading,
  setCheckinError,
  startManualSession,
} from '../services/checkin/checkinService';
import { checkinApi } from '../services/checkin/checkinApiService';
import {
  getLocationPermissionState,
  requestLocationPermission,
} from '../services/native/locationPermissionService';
import { startLocationWatch } from '../services/native/backgroundLocationService';

export function useGymCheckin({
  gym = null,
  enabled = true,
  config = {},
  onEvent = null,
  onCheckinStart = null,
  onCheckinHeartbeat = null,
  onCheckinEnd = null,
  onError = null,
} = {}) {
  const mergedConfig = useMemo(
    () => ({
      ...DEFAULT_CHECKIN_CONFIG,
      ...(config || {}),
    }),
    [config],
  );

  const [state, setState] = useState(createInitialCheckinState);
  const [permission, setPermission] = useState({
    supported: true,
    fine: 'prompt',
    coarse: 'prompt',
    canBackgroundCheckin: false,
  });

  const stateRef = useRef(state);
  const gymRef = useRef(gym);
  const watchRuntimeRef = useRef(null);

  // FASE 2: refs para controle da API
  const checkinDbIdRef = useRef(null);       // ID do check-in salvo no banco
  const apiStartLockRef = useRef(false);     // evita start duplicado
  const heartbeatIntervalRef = useRef(null); // intervalo de 2 min
  const inactivityTimeoutRef = useRef(null); // timeout de 5 min sem GPS

  const updateState = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  const emitEvent = useCallback((event) => {
    if (!event) return;

    try {
      if (typeof onEvent === 'function') onEvent(event);

      if (event.type === CHECKIN_EVENT.START && typeof onCheckinStart === 'function') {
        onCheckinStart(event);
      }

      if (event.type === CHECKIN_EVENT.HEARTBEAT && typeof onCheckinHeartbeat === 'function') {
        onCheckinHeartbeat(event);
      }

      if (event.type === CHECKIN_EVENT.END && typeof onCheckinEnd === 'function') {
        onCheckinEnd(event);
      }
    } catch (eventErr) {
      logger.warn('Checkin event callback error', { error: eventErr?.message });
    }
  }, [onCheckinEnd, onCheckinHeartbeat, onCheckinStart, onEvent]);

  const pushError = useCallback((message, details = {}) => {
    const next = setCheckinError(stateRef.current, message, details);
    updateState(next);
    logger.error('Gym checkin error', { message, details });
    if (typeof onError === 'function') onError(next.error);
  }, [onError, updateState]);

  // FASE 2: limpar timers de API
  const clearApiTimers = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
      inactivityTimeoutRef.current = null;
    }
  }, []);

  // FASE 2: reiniciar timeout de inatividade (5 min)
  const resetInactivityTimeout = useCallback(() => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current);
    inactivityTimeoutRef.current = setTimeout(() => {
      const cur = stateRef.current;
      if (cur.status !== CHECKIN_STATUS.ACTIVE && cur.status !== CHECKIN_STATUS.MANUAL_ACTIVE) return;

      const session = cur.session;
      const started = session?.started_at_utc ? new Date(session.started_at_utc) : new Date();
      const duration_minutes = Math.max(0, Math.round((Date.now() - started.getTime()) / 60000));
      const reading = cur.last_reading;

      checkinApi.end({
        checkin_id: checkinDbIdRef.current,
        duration_minutes,
        reason: 'inactivity',
        lat: reading?.lat,
        lng: reading?.lng,
        accuracy_m: reading?.accuracy_m,
        source: reading?.source || 'gps',
      }).catch((err) => logger.warn('API end (inactivity) failed', { error: err?.message }));

      clearApiTimers();
      checkinDbIdRef.current = null;
      apiStartLockRef.current = false;
    }, 5 * 60 * 1000);
  }, [clearApiTimers]);

  // FASE 2: sincronizar evento local com API real
  const syncWithApi = useCallback((event, reading) => {
    if (!event) return;

    if (event.type === CHECKIN_EVENT.START) {
      if (apiStartLockRef.current) return; // evitar duplicata
      apiStartLockRef.current = true;

      const gym = gymRef.current;
      checkinApi.start({
        lat: reading?.lat,
        lng: reading?.lng,
        accuracy_m: reading?.accuracy_m,
        gym_id: gym?.id,
        timestamp: reading?.captured_at_utc || new Date().toISOString(),
        source: reading?.source || 'gps',
        client_session_id: event.session?.id || null,
      })
        .then((res) => {
          checkinDbIdRef.current = res?.data?.checkin?.id || null;
          logger.info('Checkin started in DB', { checkin_id: checkinDbIdRef.current });

          // Iniciar heartbeat a cada 2 min
          clearApiTimers();
          heartbeatIntervalRef.current = setInterval(() => {
            const cur = stateRef.current;
            if (cur.status !== CHECKIN_STATUS.ACTIVE && cur.status !== CHECKIN_STATUS.MANUAL_ACTIVE) {
              clearApiTimers();
              return;
            }
            const r = cur.last_reading;
            checkinApi.heartbeat({
              checkin_id: checkinDbIdRef.current,
              lat: r?.lat,
              lng: r?.lng,
              accuracy_m: r?.accuracy_m,
              source: r?.source || 'gps',
              timestamp: new Date().toISOString(),
            }).catch((err) => logger.warn('Heartbeat API failed', { error: err?.message }));
          }, mergedConfig.heartbeatIntervalMs || 2 * 60 * 1000);

          resetInactivityTimeout();
        })
        .catch((err) => {
          apiStartLockRef.current = false;
          logger.warn('Checkin start API failed', { error: err?.message });
        });
    }

    if (event.type === CHECKIN_EVENT.HEARTBEAT) {
      // GPS ainda ativo → reiniciar inatividade
      resetInactivityTimeout();
    }

    if (event.type === CHECKIN_EVENT.END) {
      const session = event.session;
      const started = session?.started_at_utc ? new Date(session.started_at_utc) : new Date();
      const duration_minutes = Math.max(0, Math.round((Date.now() - started.getTime()) / 60000));

      checkinApi.end({
        checkin_id: checkinDbIdRef.current,
        duration_minutes,
        reason: event.reason || 'left_geofence',
        lat: reading?.lat,
        lng: reading?.lng,
        accuracy_m: reading?.accuracy_m,
        source: reading?.source || 'gps',
      }).catch((err) => logger.warn('Checkin end API failed', { error: err?.message }));

      clearApiTimers();
      checkinDbIdRef.current = null;
      apiStartLockRef.current = false;
    }
  }, [clearApiTimers, mergedConfig.heartbeatIntervalMs, resetInactivityTimeout]);

  const processReading = useCallback((reading) => {
    const activeGym = gymRef.current;
    if (!activeGym?.lat || !activeGym?.lng) {
      pushError('Gym coordinates are missing', { gym: activeGym });
      return;
    }

    const assessment = assessReadingAgainstGym(reading, activeGym, mergedConfig);
    const { nextState, event } = applyAssessmentToState({
      state: stateRef.current,
      assessment,
      gym: activeGym,
      config: mergedConfig,
    });

    updateState(nextState);
    emitEvent(event);
    syncWithApi(event, assessment); // FASE 2: chamar API
  }, [emitEvent, mergedConfig, pushError, syncWithApi, updateState]);

  const clearWatch = useCallback(async () => {
    try {
      if (!watchRuntimeRef.current?.stop) return;
      await watchRuntimeRef.current.stop();
    } catch (watchErr) {
      logger.warn('Failed to clear checkin watch', { error: watchErr?.message });
    } finally {
      watchRuntimeRef.current = null;
    }
  }, []);

  const handlePermission = useCallback(async () => {
    const status = await getLocationPermissionState();
    setPermission(status);

    if (!status.supported) {
      return {
        ok: false,
        reason: 'NOT_SUPPORTED',
      };
    }

    if (status.fine === 'granted') {
      return {
        ok: true,
        status,
      };
    }

    const requested = await requestLocationPermission();
    const refreshed = await getLocationPermissionState();
    setPermission(refreshed);

    if (!requested.ok || refreshed.fine !== 'granted') {
      return {
        ok: false,
        reason: 'DENIED',
      };
    }

    return {
      ok: true,
      status: refreshed,
    };
  }, []);

  const startWatch = useCallback(async (gymOverride = null, initialPosition = null) => {
    if (!enabled) return false;

    const activeGym = gymOverride || gymRef.current;
    if (!activeGym?.lat || !activeGym?.lng) {
      pushError('Gym coordinates are missing', { gym: activeGym });
      return false;
    }
    gymRef.current = activeGym;

    await clearWatch();

    const waitingState = {
      ...stateRef.current,
      status: CHECKIN_STATUS.WAITING_PERMISSION,
      manual_fallback_recommended: false,
      error: null,
    };
    updateState(waitingState);

    const permissionResult = await handlePermission();
    if (!permissionResult.ok) {
      const denied = setCheckinError(
        stateRef.current,
        'Location permission denied',
        { reason: permissionResult.reason || 'DENIED' },
      );
      updateState(denied);
      return false;
    }

    const waitingGpsState = {
      ...stateRef.current,
      status: CHECKIN_STATUS.WAITING_GPS,
      error: null,
    };
    updateState(waitingGpsState);

    if (initialPosition?.coords) {
      try {
        processReading(normalizeGeoReading(initialPosition, 'gps'));
      } catch (seedErr) {
        logger.warn('Failed to seed initial location reading', {
          error: seedErr?.message,
        });
      }
    }

    const onPosition = (position) => {
      try {
        if (!position?.coords) return;
        processReading(normalizeGeoReading(position, 'gps'));
      } catch (positionErr) {
        pushError('Failed to process location reading', {
          error: positionErr?.message,
        });
      }
    };

    const onPositionError = (positionError) => {
      pushError('Location watch failed', {
        code: positionError?.code,
        message: positionError?.message,
      });
    };

    try {
      watchRuntimeRef.current = await startLocationWatch({
        preferBackground: true,
        distanceFilterM: mergedConfig.distanceFilterM,
        onReading: onPosition,
        onError: onPositionError,
      });

      logger.systemEvent('Check-in location watch iniciado', {
        mode: watchRuntimeRef.current?.mode || 'unknown',
        watch_id: watchRuntimeRef.current?.id || null,
      });
    } catch (startErr) {
      pushError('Geolocation watch failed to start', {
        error: startErr?.message || 'UNKNOWN_START_ERROR',
      });
      return false;
    }

    return true;
  }, [clearWatch, enabled, handlePermission, processReading, pushError, updateState]);

  const stopWatch = useCallback(async () => {
    await clearWatch();

    if (
      stateRef.current.status === CHECKIN_STATUS.WAITING_GPS
      || stateRef.current.status === CHECKIN_STATUS.WAITING_PERMISSION
      || stateRef.current.status === CHECKIN_STATUS.IN_RANGE_PENDING
      || stateRef.current.status === CHECKIN_STATUS.OUT_OF_RANGE_PENDING
    ) {
      updateState({
        ...stateRef.current,
        status: CHECKIN_STATUS.IDLE,
      });
    }
  }, [clearWatch, updateState]);

  const startManualCheckin = useCallback(() => {
    const next = startManualSession(stateRef.current, gymRef.current);
    updateState(next);
    emitEvent({
      type: CHECKIN_EVENT.START,
      session: next.session,
      reading: next.last_reading,
      mode: 'manual',
    });
    return next.session;
  }, [emitEvent, updateState]);

  const endCheckin = useCallback((reason = 'manual') => {
    const prevSession = stateRef.current.session;
    const reading = stateRef.current.last_reading;
    const next = endSession(stateRef.current, reason, reading);
    updateState(next);

    if (prevSession) {
      const started = prevSession.started_at_utc ? new Date(prevSession.started_at_utc) : new Date();
      const duration_minutes = Math.max(0, Math.round((Date.now() - started.getTime()) / 60000));

      // FASE 2: chamar API ao encerrar manualmente
      checkinApi.end({
        checkin_id: checkinDbIdRef.current,
        duration_minutes,
        reason,
        lat: reading?.lat,
        lng: reading?.lng,
        accuracy_m: reading?.accuracy_m,
        source: reading?.source || 'gps',
      }).catch((err) => logger.warn('Checkin end API failed', { error: err?.message }));

      clearApiTimers();
      checkinDbIdRef.current = null;
      apiStartLockRef.current = false;

      emitEvent({
        type: CHECKIN_EVENT.END,
        session: next.session,
        reading,
        reason,
      });
    }

    return next.session;
  }, [clearApiTimers, emitEvent, updateState]);

  const endByWorkout = useCallback(() => endCheckin('workout_finished'), [endCheckin]);

  const resetCheckin = useCallback(async () => {
    await clearWatch();
    updateState(createInitialCheckinState());
  }, [clearWatch, updateState]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    gymRef.current = gym;
  }, [gym]);

  useEffect(() => () => {
    clearWatch();
    clearApiTimers();
  }, [clearApiTimers, clearWatch]);

  return {
    status: state.status,
    state,
    session: state.session,
    permission,
    lastReading: state.last_reading,
    distanceMeters: state.last_distance_m,
    manualFallbackRecommended: state.manual_fallback_recommended,
    error: state.error,
    startWatch,
    stopWatch,
    startManualCheckin,
    endCheckin,
    endByWorkout,
    resetCheckin,
    checkPermission: handlePermission,
  };
}
