import { useState, useEffect } from 'react';

export function usePWAUpdate() {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    // Detectar novas versões do PWA
    if ('serviceWorker' in navigator) {
      let refreshing = false;
      let registration;

      const checkForUpdates = async () => {
        try {
          registration = await navigator.serviceWorker.getRegistration();
          
          if (registration) {
            console.log('🔍 Verificando atualizações do PWA...');
            
            // Verificar se já tem update esperando
            if (registration.waiting) {
              console.log('🔄 Update já está esperando, mostrando banner');
              setNeedsUpdate(true);
              setUpdateInfo({
                version: 'Pendente',
                message: 'Atualização pronta para instalar!'
              });
              return;
            }
            
            // Verificar se há atualização
            await registration.update();
            
            // Escutar por novas versões
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              
              console.log('🔍 Nova versão encontrada, aguardando instalação...');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível
                  console.log('🔄 Nova versão do PWA detectada!');
                  setNeedsUpdate(true);
                  setUpdateInfo({
                    version: new Date().toISOString(),
                    message: 'Nova atualização disponível!'
                  });
                }
              });
            });
          }
        } catch (error) {
          console.error('Erro ao verificar atualizações:', error);
        }
      };

      // Verificar atualizações ao carregar
      checkForUpdates();

      // Verificar periodicamente (a cada 10 minutos)
      const interval = setInterval(checkForUpdates, 10 * 60 * 1000);

      // Escutar por refresh automático
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('🔄 PWA atualizado, recarregando...');
          window.location.reload();
        }
      });

      return () => clearInterval(interval);
    }
  }, []);

  const installUpdate = async () => {
    if (!needsUpdate) return;

    setIsInstalling(true);
    
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (registration && registration.waiting) {
        // Enviar mensagem para o service worker instalar
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        console.log('🚀 Forçando instalação da atualização...');
        
        // Forçar reload após 2 segundos se não acontecer automaticamente
        setTimeout(() => {
          console.log('🔄 Forçando reload manual...');
          window.location.reload();
        }, 2000);
        
      } else {
        // Fallback: recarregar e limpar cache
        console.log('🔄 Fallback: limpando cache e recarregando...');
        
        // Limpar todos os caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }
        
        // Recarregar
        window.location.reload(true);
      }
    } catch (error) {
      console.error('Erro ao instalar atualização:', error);
      
      // Fallback agressivo
      window.location.href = window.location.href + '?t=' + Date.now();
    } finally {
      setIsInstalling(false);
    }
  };

  const forceRefresh = () => {
    console.log('🔄 Forçando refresh completo...');
    
    // Limpar storage se necessário
    localStorage.removeItem('zyron_last_track');
    localStorage.removeItem('zyron_player_pos');
    localStorage.removeItem('zyron_player_minimized');
    
    // Forçar reload com timestamp
    window.location.href = window.location.origin + '?force=' + Date.now();
  };

  return {
    needsUpdate,
    isInstalling,
    updateInfo,
    installUpdate,
    forceRefresh
  };
}
