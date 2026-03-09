import React, { useState, useEffect } from 'react';

export default function ForceUpdateBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verificar se há atualização disponível
    const checkForUpdate = () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CHECK_UPDATE'
        });
      }
    };

    // Listener para mensagens do Service Worker
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        setIsVisible(true);
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-600 text-white p-4 z-50 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 008-8v1a1 1 0 00-1 1H9a1 1 0 00-1-1v1a1 1 0 00-1 1H3a1 1 0 00-1-1v1a1 1 0 002 0zm1 9a1 1 0 00-1 1v3a1 1 0 001 1h8a1 1 0 001 1v-3a1 1 0 00-2-2z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">Atualização Disponível</span>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleReload}
            className="bg-white text-red-600 px-4 py-2 rounded font-medium hover:bg-red-50 transition-colors"
          >
            Atualizar Agora
          </button>
          <button
            onClick={handleDismiss}
            className="text-red-200 hover:text-white px-2 py-2 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
