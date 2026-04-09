import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ── Service Worker Registration ────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // When a new SW is found (update), notify app
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              window.dispatchEvent(new CustomEvent('zyron:sw-update'));
            }
          });
        });

        // If a new SW took control while the page was open
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          // Dispatch so the app can show a "reload" prompt instead of force-reload
          window.dispatchEvent(new CustomEvent('zyron:sw-update'));
        });
      })
      .catch((err) => {
        console.warn('[SW] Registration failed:', err);
      });

    // Forward SW → page messages to the app
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_AVAILABLE') {
        window.dispatchEvent(new CustomEvent('zyron:sw-update', { detail: event.data }));
      }
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
