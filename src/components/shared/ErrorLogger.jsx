import React, { useState, useEffect } from 'react';

export default function ErrorLogger() {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Capturar erros globais
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      const error = {
        timestamp: new Date(),
        message: args.join(' '),
        stack: new Error().stack,
        level: 'error'
      };
      
      setErrors(prev => [...prev, error]);
      originalError(...args);
    };

    console.warn = (...args) => {
      const warning = {
        timestamp: new Date(),
        message: args.join(' '),
        level: 'warning'
      };
      
      setErrors(prev => [...prev, warning]);
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const clearErrors = () => {
    setErrors([]);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">📋 Error Logger</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {errors.length === 0 ? (
          <p className="text-gray-400 text-center">Nenhum erro capturado</p>
        ) : (
          errors.map((error, index) => (
            <div key={index} className={`text-xs p-2 rounded ${
              error.level === 'error' ? 'bg-red-900' :
              error.level === 'warning' ? 'bg-yellow-900' : 'bg-gray-800'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400">
                  {error.timestamp.toLocaleTimeString()}
                </span>
                <span className={`px-2 py-1 rounded text-xs ${
                  error.level === 'error' ? 'bg-red-600' :
                  error.level === 'warning' ? 'bg-yellow-600' : 'bg-gray-600'
                }`}>
                  {error.level.toUpperCase()}
                </span>
              </div>
              <div className="text-gray-200">{error.message}</div>
            </div>
          ))
        )}
      </div>
      
      <div className="flex space-x-2 mt-4">
        <button
          onClick={clearErrors}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
        >
          Limpar Erros
        </button>
        <button
          onClick={() => {
            const dataStr = JSON.stringify(errors, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `zyron-errors-${new Date().toISOString()}.json`;
            a.click();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
        >
          Exportar
        </button>
      </div>
    </div>
  );
}
