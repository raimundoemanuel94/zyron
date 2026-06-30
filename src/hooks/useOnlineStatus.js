import { useEffect, useState, useCallback } from 'react';
import { processOfflineQueue, countPendingActions } from '../utils/offlineQueue';

/**
 * Hook que rastreia o status de conexão do usuário e processa a fila
 * offline automaticamente assim que a internet volta.
 *
 * `syncHandler` é a função que sabe como reenviar cada tipo de ação
 * pendente para o Supabase — ela é injetada de fora para não acoplar
 * esse hook a um serviço específico.
 */
export function useOnlineStatus(syncHandler) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const count = await countPendingActions();
    setPendingCount(count);
  }, []);

  const syncNow = useCallback(async () => {
    if (!syncHandler || isSyncing) return;
    setIsSyncing(true);
    try {
      await processOfflineQueue(syncHandler);
    } finally {
      setIsSyncing(false);
      refreshPendingCount();
    }
  }, [syncHandler, isSyncing, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      setJustReconnected(true);
      syncNow();
      // Esconde o aviso de "reconectado" depois de alguns segundos
      setTimeout(() => setJustReconnected(false), 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setJustReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, isSyncing, justReconnected, syncNow, refreshPendingCount };
}
