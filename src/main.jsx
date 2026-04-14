import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

const APP_BUILD_ID = typeof __APP_BUILD_ID__ === 'string' ? __APP_BUILD_ID__ : 'dev';

const dispatchSwUpdate = (detail = {}) => {
  window.dispatchEvent(new CustomEvent('zyron:sw-update', { detail }));
};

const cleanupServiceWorkersInDev = async () => {
  if (!('serviceWorker' in navigator) || !('caches' in window)) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));

    const cacheNames = await caches.keys();
    const zyronCaches = cacheNames.filter((name) => name.startsWith('zyron-pwa'));
    await Promise.all(zyronCaches.map((name) => caches.delete(name)));
  } catch (err) {
    console.warn('[SW] Dev cleanup failed:', err);
  }
};

const registerServiceWorkerInProd = async () => {
  if (!('serviceWorker' in navigator)) return;

  const swUrl = `/sw.js?v=${encodeURIComponent(APP_BUILD_ID)}`;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_AVAILABLE') {
      dispatchSwUpdate({
        ...event.data,
        buildId: APP_BUILD_ID,
        reason: 'sw-message',
      });
    }
  });

  try {
    const reg = await navigator.serviceWorker.register(swUrl, { updateViaCache: 'none' });

    const notifyIfWaiting = () => {
      if (reg.waiting) {
        dispatchSwUpdate({ buildId: APP_BUILD_ID, reason: 'waiting-worker' });
      }
    };

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        const hasController = !!navigator.serviceWorker.controller;
        if (newWorker.state === 'installed' && hasController) {
          dispatchSwUpdate({ buildId: APP_BUILD_ID, reason: 'installed-worker' });
        }
        if (newWorker.state === 'activated' && hasController) {
          dispatchSwUpdate({ buildId: APP_BUILD_ID, reason: 'activated-worker' });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      dispatchSwUpdate({ buildId: APP_BUILD_ID, reason: 'controllerchange' });
    });

    notifyIfWaiting();

    const checkForUpdates = () => {
      reg.update().catch((err) => {
        console.warn('[SW] update() failed:', err);
      });
    };

    checkForUpdates();

    const updateIntervalId = window.setInterval(checkForUpdates, 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
        notifyIfWaiting();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('beforeunload', () => {
      window.clearInterval(updateIntervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
  } catch (err) {
    console.warn('[SW] Registration failed:', err);
  }
};

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    cleanupServiceWorkersInDev();
  });
} else {
  window.addEventListener('load', () => {
    registerServiceWorkerInProd().catch((err) => {
      console.warn('[SW] Unexpected registration error:', err);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
