import React, { useState, useEffect } from 'react';

export default function ForceUpdateBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mostrar banner após 3 segundos SEMPRE
    const timer = setTimeout(() => {
      console.log('🚀 BANNER FORÇADO - Mostrando atualização');
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    console.log('🚀 Forçando atualização completa...');
    
    // Limpar tudo
    localStorage.clear();
    sessionStorage.clear();
    
    // Forçar reload com timestamp
    window.location.href = window.location.origin + '?force_update=' + Date.now();
  };

  const handleClose = () => {
    console.log('🚀 Fechando banner forçado');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 shadow-lg animate-in slide-in-from-top duration-500">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 2.502-3.162V7c0-1.495-.962-2.502-2.502-3.162H7.084c-1.54 0-2.502 1.667-2.502 3.162v3.836c0 1.495.962 2.502 2.502 3.162h3.856z" />
            </svg>
          </div>
          <div>
            <p className="font-bold text-sm">ZYRON - ATUALIZAÇÃO NECESSÁRIA!</p>
            <p className="text-xs opacity-90">Clique para atualizar e corrigir os problemas</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleClose}
            className="px-3 py-1 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
          >
            Ignorar
          </button>
          
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-white text-red-600 rounded-md font-bold text-sm hover:bg-gray-100 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>ATUALIZAR AGORA</span>
          </button>
        </div>
      </div>
    </div>
  );
}
