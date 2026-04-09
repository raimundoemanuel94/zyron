import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import logger from '../../utils/logger';

const BackgroundGeolocation = registerPlugin('BackgroundGeolocation');

const WEB_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 15000,
};

const NATIVE_WATCH_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 20000,
  maximumAge: 15000,
};

const IOS_BACKGROUND_OPTIONS = {
  backgroundMessage: 'ZYRON check-in ativo para registrar presenca no treino.',
  backgroundTitle: 'ZYRON Check-in',
  requestPermissions: false,
  stale: false,
  distanceFilter: 0,
};

const normalizePluginLocation = (location) => {
  if (!location) return null;
  return {
    coords: {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      accuracy: Number(location.accuracy ?? 9999),
      altitude: location.altitude ?? null,
      altitudeAccuracy: location.altitudeAccuracy ?? null,
      heading: location.bearing ?? null,
      speed: location.speed ?? null,
    },
    timestamp: Number(location.time || Date.now()),
  };
};

const createError = (message, details = {}) => ({
  code: details.code || 'LOCATION_ERROR',
  message,
  details,
});

const isIOSNative = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

export async function startLocationWatch({
  onReading,
  onError,
  preferBackground = true,
  distanceFilterM = 0,
} = {}) {
  if (typeof onReading !== 'function') {
    throw new Error('onReading callback is required');
  }

  const safeError = (error) => {
    if (typeof onError === 'function') onError(error);
  };

  if (preferBackground && isIOSNative()) {
    try {
      const watcherId = await BackgroundGeolocation.addWatcher(
        {
          ...IOS_BACKGROUND_OPTIONS,
          distanceFilter: Number.isFinite(Number(distanceFilterM))
            ? Number(distanceFilterM)
            : IOS_BACKGROUND_OPTIONS.distanceFilter,
        },
        (location, error) => {
          if (error) {
            safeError(createError('Background location callback failed', {
              code: error?.code || 'BG_CALLBACK_ERROR',
              message: error?.message || 'Unknown background location error',
            }));
            return;
          }

          const normalized = normalizePluginLocation(location);
          if (!normalized?.coords) return;
          onReading(normalized);
        },
      );

      logger.systemEvent('Background location watcher ativo', {
        mode: 'ios_background',
        watcherId,
      });

      return {
        mode: 'ios_background',
        id: watcherId,
        stop: async () => {
          await BackgroundGeolocation.removeWatcher({ id: watcherId });
          logger.systemEvent('Background location watcher parado', {
            mode: 'ios_background',
            watcherId,
          });
        },
      };
    } catch (error) {
      logger.warn('Falha ao iniciar watcher nativo em background; aplicando fallback', {
        mode: 'ios_background',
        error: error?.message,
      });
    }
  }

  if (Capacitor.isNativePlatform()) {
    const watchId = await Geolocation.watchPosition(
      NATIVE_WATCH_OPTIONS,
      (position, error) => {
        if (error) {
          safeError(createError('Native location callback failed', {
            code: error?.code || 'NATIVE_CALLBACK_ERROR',
            message: error?.message || 'Unknown native location error',
          }));
          return;
        }

        if (!position?.coords) return;
        onReading(position);
      },
    );

    logger.systemEvent('Native location watcher ativo', {
      mode: 'native_foreground',
      watchId: String(watchId),
    });

    return {
      mode: 'native_foreground',
      id: String(watchId),
      stop: async () => {
        await Geolocation.clearWatch({ id: String(watchId) });
        logger.systemEvent('Native location watcher parado', {
          mode: 'native_foreground',
          watchId: String(watchId),
        });
      },
    };
  }

  if (!navigator.geolocation) {
    throw createError('Geolocation API unavailable', { code: 'WEB_GEO_UNAVAILABLE' });
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      if (!position?.coords) return;
      onReading(position);
    },
    (error) => {
      safeError(createError('Web location callback failed', {
        code: error?.code || 'WEB_CALLBACK_ERROR',
        message: error?.message || 'Unknown web location error',
      }));
    },
    WEB_WATCH_OPTIONS,
  );

  logger.systemEvent('Web location watcher ativo', {
    mode: 'web_foreground',
    watchId: Number(watchId),
  });

  return {
    mode: 'web_foreground',
    id: watchId,
    stop: async () => {
      navigator.geolocation.clearWatch(watchId);
      logger.systemEvent('Web location watcher parado', {
        mode: 'web_foreground',
        watchId: Number(watchId),
      });
    },
  };
}
