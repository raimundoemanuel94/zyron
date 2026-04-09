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
  }, [emitEvent, mergedConfig, pushError, updateState]);

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

  const startWatch = useCallback(async (gymOverride = null) => {
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
    const next = endSession(stateRef.current, reason, stateRef.current.last_reading);
    updateState(next);

    if (prevSession) {
      emitEvent({
        type: CHECKIN_EVENT.END,
        session: next.session,
        reading: next.last_reading,
        reason,
      });
    }

    return next.session;
  }, [emitEvent, updateState]);

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
  }, [clearWatch]);

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
