import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

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

const registerServiceWorkerInProd = () => {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker
    .register('/sw.js')
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('zyron:sw-update'));
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.dispatchEvent(new CustomEvent('zyron:sw-update'));
      });
    })
    .catch((err) => {
      console.warn('[SW] Registration failed:', err);
    });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'UPDATE_AVAILABLE') {
      window.dispatchEvent(new CustomEvent('zyron:sw-update', { detail: event.data }));
    }
  });
};

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    cleanupServiceWorkersInDev();
  });
} else {
  window.addEventListener('load', () => {
    registerServiceWorkerInProd();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
