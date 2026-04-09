import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const normalizeState = (state) => {
  if (!state) return 'prompt';
  if (state === 'granted' || state === 'denied' || state === 'prompt') return state;
  return 'prompt';
};

export const isNativeRuntime = () => Capacitor.isNativePlatform();

export const isNativeIOS = () => isNativeRuntime() && Capacitor.getPlatform() === 'ios';

export const getLocationPermissionState = async () => {
  if (!isNativeRuntime()) {
    return {
      supported: false,
      platform: 'web',
      fine: 'prompt',
      coarse: 'prompt',
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
    return {
      ok: false,
      reason: 'NOT_NATIVE',
      message: 'Permissão nativa indisponível no web/PWA.',
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
    nextStep: granted
      ? 'READY_FOR_CHECKIN'
      : 'SHOW_MANUAL_FALLBACK',
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

