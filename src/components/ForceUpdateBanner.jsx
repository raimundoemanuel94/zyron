import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import hardcorePWA from '../utils/hardcorePWA';

/**
 * Banner moderno de atualização do PWA.
 * 
 * Usa glassmorphism + cores do app (amarelo ZYRON + fundo escuro).
 * Aparece suavemente quando o Service Worker detecta nova versão.
 * O usuário decide quando atualizar — SEM reloads automáticos.
 */
export default function ForceUpdateBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  useEffect(() => {
    // Escutar update do PWA manager
    if (hardcorePWA) {
      hardcorePWA.onUpdate(() => setIsVisible(true));
    }

    // Fallback: escutar evento DOM
    const handler = () => setIsVisible(true);
    window.addEventListener('zyron-update-available', handler);
    return () => window.removeEventListener('zyron-update-available', handler);
  }, []);

  // Animação de progresso fake ao clicar "Atualizar"
  const handleUpdate = () => {
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 25 + 10;
      if (p >= 100) {
        p = 100;
        clearInterval(progressRef.current);
        // Aplica update via PWA manager
        if (hardcorePWA) {
          hardcorePWA.applyUpdate();
        } else {
          window.location.reload();
        }
      }
      setProgress(p);
    }, 200);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed top-0 left-0 right-0 z-[100] p-3"
      >
        <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-xl shadow-[0_8px_40px_rgba(253,224,71,0.15)]">
          {/* Barra de progresso amarela no topo */}
          {progress > 0 && (
            <motion.div
              className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-yellow-400 to-yellow-200"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          )}

          <div className="flex items-center gap-3 px-4 py-3">
            {/* Ícone animado */}
            <div className="relative flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-400/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 21h5v-5" />
                </svg>
              </motion.div>
              {/* Pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 rounded-xl bg-yellow-400/30 blur-md"
              />
            </div>

            {/* Texto */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                Nova versão disponível
              </p>
              <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
                Toque para atualizar o ZYRON
              </p>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {progress === 0 ? (
                <>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="text-neutral-500 text-xs font-medium px-2 py-1.5 rounded-lg hover:text-white hover:bg-white/10 transition-all"
                  >
                    Depois
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs font-black uppercase tracking-wide shadow-lg shadow-yellow-400/20 hover:shadow-yellow-400/40 active:scale-95 transition-all"
                  >
                    Atualizar
                  </button>
                </>
              ) : (
                <span className="text-yellow-400 text-xs font-bold animate-pulse">
                  Atualizando...
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
