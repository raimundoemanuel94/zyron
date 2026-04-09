import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const normalizeState = (state) => {
  if (!state) return 'prompt';
  if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
  return 'prompt';
};

export const isNativeRuntime = () => Capacitor.isNativePlatform();

export const isNativeIOS = () => isNativeRuntime() && Capacitor.getPlatform() === 'ios';

// ── Web / PWA helpers ────────────────────────────────────────────────────────

const queryWebPermission = async () => {
  if (!navigator.permissions) return 'prompt';
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return normalizeState(result.state);
  } catch {
    return 'prompt';
  }
};

// Triggers the browser permission dialog and resolves with the outcome.
const requestWebPermission = () =>
  new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ok: false, reason: 'NOT_SUPPORTED' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve({ ok: true, fine: 'granted', coarse: 'granted' }),
      (err) => {
        if (err.code === 1 /* PERMISSION_DENIED */) {
          resolve({ ok: false, fine: 'denied', coarse: 'denied', reason: 'DENIED' });
        } else {
          // Timeout or unavailable — permission may have been granted but GPS failed
          resolve({ ok: true, fine: 'granted', coarse: 'granted' });
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });

// ── Public API ───────────────────────────────────────────────────────────────

export const getLocationPermissionState = async () => {
  if (!isNativeRuntime()) {
    if (!navigator.geolocation) {
      return {
        supported: false,
        platform: 'web',
        fine: 'denied',
        coarse: 'denied',
        canBackgroundCheckin: false,
      };
    }

    const fine = await queryWebPermission();

    return {
      supported: true,
      platform: 'web',
      fine,
      coarse: fine,
      canBackgroundCheckin: false,
    };
  }

  const result = await Geolocation.checkPermissions();
  const fine = normalizeState(result.location);
  const coarse = normalizeState(result.coarseLocation);

  return {
    supported: true,
    platform: Capacitor.getPlatform(),
    fine,
    coarse,
    canBackgroundCheckin: isNativeIOS() && fine === 'granted',
  };
};

export const requestLocationPermission = async () => {
  if (!isNativeRuntime()) {
    if (!navigator.geolocation) {
      return {
        ok: false,
        reason: 'NOT_SUPPORTED',
        message: 'Geolocalização não disponível neste navegador.',
      };
    }

    const result = await requestWebPermission();
    return {
      ...result,
      canBackgroundCheckin: false,
      nextStep: result.ok ? 'READY_FOR_CHECKIN' : 'SHOW_MANUAL_FALLBACK',
    };
  }

  const result = await Geolocation.requestPermissions();
  const fine = normalizeState(result.location);
  const coarse = normalizeState(result.coarseLocation);
  const granted = fine === 'granted';

  return {
    ok: granted,
    fine,
    coarse,
    canBackgroundCheckin: isNativeIOS() && granted,
    nextStep: granted ? 'READY_FOR_CHECKIN' : 'SHOW_MANUAL_FALLBACK',
  };
};

export const getIOSPermissionGuidance = () => ({
  title: 'Permissão de Localização Necessária',
  description: 'Ative Sempre para permitir check-in contínuo com tela bloqueada.',
  steps: [
    'Abra Ajustes do iPhone',
    'Toque em ZYRON',
    'Toque em Localização',
    'Selecione Sempre',
    'Ative Localização Precisa',
  ],
});
