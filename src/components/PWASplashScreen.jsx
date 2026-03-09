import React, { useEffect, useState } from 'react';

export default function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Esconder splash screen após 2 segundos
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-4">
            <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">ZYRON</h1>
          <p className="text-lg text-gray-300 mb-8">Sua academia inteligente</p>
        </div>
        
        <div className="w-16 h-16 mx-auto">
          <div className="w-full h-full border-4 border-gray-600 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-2 border-gray-500 border-t-transparent rounded-full"></div>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4">
            <div className="w-full h-full bg-gray-700 rounded-lg animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-400">Carregando...</p>
        </div>
      </div>
    </div>
  );
}
