import React, { useState, useEffect } from 'react';
import { usePWAUpdate } from '../hooks/usePWAUpdate';

export default function PWAUpdateBanner() {
  const { needsUpdate, isInstalling, updateInfo, installUpdate, forceRefresh } = usePWAUpdate();
  const [isVisible, setIsVisible] = useState(false);

  // Adicionar delay para o banner não aparecer e desaparecer rápido demais
  useEffect(() => {
    if (needsUpdate) {
      // Esperar 8 segundos antes de mostrar o banner
      const timer = setTimeout(() => {
        console.log('🎯 Mostrando banner de atualização após 8 segundos');
        setIsVisible(true);
      }, 8000); // Aumentado para 8 segundos
      
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [needsUpdate]);

  // Adicionar delay para esconder o banner (para dar tempo de ler)
  const handleHideBanner = (action) => {
    console.log('🎯 Escondendo banner após 1 segundo para ação:', action);
    setIsVisible(false);
    
    // Executar a ação após o banner esconder
    setTimeout(() => {
      if (action === 'force') {
        forceRefresh();
      } else if (action === 'install') {
        installUpdate();
      }
    }, 1000);
  };

  // Fechar banner manualmente
  const handleCloseBanner = () => {
    console.log('🎯 Fechando banner manualmente');
    setIsVisible(false);
  };

  if (!needsUpdate || !isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCloseBanner}
            className="p-1 text-white/80 hover:text-white transition-colors"
            title="Fechar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">ZYRON Atualização Disponível!</p>
            <p className="text-xs opacity-90">{updateInfo?.message || 'Nova versão com melhorias'}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleHideBanner('force')}
            className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            disabled={isInstalling}
          >
            Forçar
          </button>
          
          <button
            onClick={() => handleHideBanner('install')}
            disabled={isInstalling}
            className="px-4 py-2 bg-white text-purple-600 rounded-md font-bold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isInstalling ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Instalando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Atualizar Agora</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
