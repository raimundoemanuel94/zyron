import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * Banner fixo no topo do app — aparece quando:
 * 1. O usuário perde conexão (avisa que os dados ficam salvos localmente)
 * 2. A conexão volta e a fila offline está sincronizando
 * 3. A sincronização termina (some sozinho depois de alguns segundos)
 */
export default function ConnectionBanner({ isOnline, pendingCount, isSyncing, justReconnected }) {
  const showOfflineBanner = !isOnline;
  const showSyncBanner = isOnline && (isSyncing || (justReconnected && pendingCount > 0));
  const showReconnectedBanner = isOnline && justReconnected && pendingCount === 0 && !isSyncing;

  const visible = showOfflineBanner || showSyncBanner || showReconnectedBanner;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[80] flex justify-center pointer-events-none"
          style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}
        >
          <div
            className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full mx-3"
            style={{
              background: showOfflineBanner ? 'rgba(245,158,11,0.95)' : 'rgba(20,20,23,0.97)',
              backdropFilter: 'blur(16px)',
              border: showOfflineBanner ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            {showOfflineBanner && (
              <>
                <WifiOff size={14} className="text-black shrink-0" />
                <span className="text-black text-[11.5px] font-bold">
                  Sem conexão — seus dados ficam salvos no aparelho
                </span>
              </>
            )}

            {showSyncBanner && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="shrink-0"
                >
                  <RefreshCw size={14} className="text-white" />
                </motion.div>
                <span className="text-white text-[11.5px] font-bold">
                  Sincronizando {pendingCount > 0 ? `${pendingCount} ${pendingCount === 1 ? 'item' : 'itens'}` : 'dados'}...
                </span>
              </>
            )}

            {showReconnectedBanner && (
              <>
                <CheckCircle2 size={14} className="text-[#4ADE80] shrink-0" />
                <span className="text-white text-[11.5px] font-bold">Conexão restabelecida</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
