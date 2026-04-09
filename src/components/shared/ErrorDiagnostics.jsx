import React, { useState, useEffect } from 'react';

export default function ErrorDiagnostics() {
  const [isVisible, setIsVisible] = useState(false);
  const [diagnostics, setDiagnostics] = useState({});

  useEffect(() => {
    const runDiagnostics = () => {
      const results = {
        // 1. Verificar Service Worker
        serviceWorker: {
          registered: !!navigator.serviceWorker,
          controller: !!navigator.serviceWorker?.controller,
          ready: navigator.serviceWorker?.controller?.state === 'activated'
        },
        
        // 2. Verificar PWA
        pwa: {
          standalone: window.matchMedia('(display-mode: standalone)').matches,
          installed: window.localStorage.getItem('pwa-installed') === 'true',
          beforeinstallprompt: 'onbeforeinstallprompt' in window
        },
        
        // 3. Verificar Storage
        storage: {
          localStorage: !!window.localStorage,
          sessionStorage: !!window.sessionStorage,
          indexedDB: 'indexedDB' in window
        },
        
        // 4. Verificar Network
        network: {
          online: navigator.onLine,
          effectiveType: navigator.connection?.effectiveType,
          downlink: navigator.connection?.downlink,
          rtt: navigator.connection?.rtt
        },
        
        // 5. Verificar Hardware
        hardware: {
          cores: navigator.hardwareConcurrency,
          memory: navigator.deviceMemory,
          vibration: 'vibrate' in navigator
        },
        
        // 6. Verificar Áudio
        audio: {
          context: 'AudioContext' in window,
          webAudio: 'webkitAudioContext' in window,
          mediaDevices: navigator.mediaDevices?.getUserMedia
        }
      };
      
      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  const refreshDiagnostics = () => {
    runDiagnostics();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-md max-h-96 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">🔧 Diagnóstico do Sistema</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <h4 className="font-medium text-green-400 mb-2">✅ Service Worker</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Registrado:</span>
              <span className={diagnostics.serviceWorker?.registered ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.serviceWorker?.registered ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Controller:</span>
              <span className={diagnostics.serviceWorker?.controller ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.serviceWorker?.controller ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className={diagnostics.serviceWorker?.ready ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.serviceWorker?.ready ? 'Pronto' : 'Não pronto'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-blue-400 mb-2">📱 PWA</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Standalone:</span>
              <span className={diagnostics.pwa?.standalone ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.pwa?.standalone ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Instalado:</span>
              <span className={diagnostics.pwa?.installed ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.pwa?.installed ? 'Sim' : 'Não'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-purple-400 mb-2">💾 Storage</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>LocalStorage:</span>
              <span className={diagnostics.storage?.localStorage ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.storage?.localStorage ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SessionStorage:</span>
              <span className={diagnostics.storage?.sessionStorage ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.storage?.sessionStorage ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IndexedDB:</span>
              <span className={diagnostics.storage?.indexedDB ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.storage?.indexedDB ? 'Disponível' : 'Desconhecido'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-yellow-400 mb-2">🌐 Network</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Online:</span>
              <span className={diagnostics.network?.online ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.network?.online ? 'Sim' : 'Não'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conexão:</span>
              <span className="text-gray-400">
                {diagnostics.network?.effectiveType || 'Desconhecida'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-orange-400 mb-2">🔧 Hardware</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>CPU Cores:</span>
              <span className="text-gray-400">
                {diagnostics.hardware?.cores || 'Desconhecido'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Memória:</span>
              <span className="text-gray-400">
                {diagnostics.hardware?.memory ? `${Math.round(diagnostics.hardware.memory * 1024)} MB` : 'Desconhecida'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Vibração:</span>
              <span className={diagnostics.hardware?.vibration ? 'text-green-400' : 'text-gray-400'}>
                {diagnostics.hardware?.vibration ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium text-red-400 mb-2">🎵 Áudio</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>AudioContext:</span>
              <span className={diagnostics.audio?.context ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.audio?.context ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Web Audio:</span>
              <span className={diagnostics.audio?.webAudio ? 'text-green-400' : 'text-red-400'}>
                {diagnostics.audio?.webAudio ? 'Disponível' : 'Indisponível'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Media Devices:</span>
              <span className={diagnostics.audio?.mediaDevices ? 'text-green-400' : 'text-yellow-400'}>
                {diagnostics.audio?.mediaDevices ? 'Disponível' : 'Permissão necessária'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={refreshDiagnostics}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
        >
          Atualizar
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
