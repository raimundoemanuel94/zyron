import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';

export default function ForceUpdateBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Mostrar banner após 3 segundos SEMPRE
    const timer = setTimeout(() => {
      console.log('🚀 BANNER FORÇADO - Mostrando atualização');
      logger.systemEvent('Banner forçado aparecendo', {
        delay: '3 segundos',
        reason: 'Banner forçado sempre aparece'
      });
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = async () => {
    if (isUpdating) return;
    
    console.log('🚀 Iniciando atualização completa...');
    logger.userAction('Usuário clicou em ATUALIZAR AGORA (banner forçado)', {
      action: 'force_update',
      bannerType: 'forced'
    });
    
    setIsUpdating(true);
    
    // Animação de loading
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🧹 Limpando cache e recarregando...');
    logger.systemEvent('Iniciando limpeza de cache e reload', {
      localStorage: 'cleared',
      sessionStorage: 'cleared',
      reload: 'forced'
    });
    
    // Limpar tudo com animação
    localStorage.clear();
    sessionStorage.clear();
    
    // Efeito visual de "desligando"
    document.body.style.transition = 'opacity 0.5s ease-out';
    document.body.style.opacity = '0';
    
    setTimeout(() => {
      logger.systemEvent('Reload forçado executado', {
        newUrl: window.location.origin + '?force_update=' + Date.now()
      });
      
      // Forçar reload com timestamp
      window.location.href = window.location.origin + '?force_update=' + Date.now();
    }, 500);
  };

  const handleClose = () => {
    console.log('🚀 Fechando banner forçado');
    logger.userAction('Usuário clicou em IGNORAR (banner forçado)', {
      action: 'ignore',
      bannerType: 'forced'
    });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 shadow-lg animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`animate-pulse ${isUpdating ? 'animate-spin' : ''}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.162V7c0-1.495-.962-2.502-2.502-3.162H7.084c-1.54 0-2.502 1.667-2.502 3.162v3.836c0 1.495.962 2.502 2.502 3.162h3.856z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">
              {isUpdating ? 'ATUALIZANDO...' : 'ZYRON - ATUALIZAÇÃO NECESSÁRIA!'}
            </p>
            <p className="text-xs opacity-90">
              {isUpdating 
                ? 'Limpando cache e recarregando...' 
                : 'Clique para atualizar e corrigir os problemas'
              }
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClose}
            disabled={isUpdating}
            className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ignorar
          </button>
          
          <button
            onClick={handleUpdate}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md font-bold text-sm transition-all duration-200 flex items-center space-x-2 ${
              isUpdating 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-white text-red-600 hover:bg-gray-100 hover:scale-105 active:scale-95'
            }`}
          >
            {isUpdating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>PROCESSANDO...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>ATUALIZAR AGORA</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
