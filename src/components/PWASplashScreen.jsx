import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState('logo'); // 'logo' | 'slogan' | 'bar' | 'exit'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('slogan'), 700);
    const t2 = setTimeout(() => setPhase('bar'),    1100);
    const t3 = setTimeout(() => setPhase('exit'),   2600);
    const t4 = setTimeout(() => setIsVisible(false), 3100);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* ── Partículas de fundo ── */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-yellow-400/20"
              style={{
                width:  Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                left:   Math.random() * 100 + '%',
                bottom: '-10px',
                '--tx':       (Math.random() - 0.5) * 60 + 'px',
                '--duration': (Math.random() * 3 + 2) + 's',
                '--delay':    (Math.random() * 2) + 's',
              }}
            />
          ))}

          {/* ── Glow central ── */}
          <motion.div
            className="absolute w-72 h-72 bg-yellow-400/8 rounded-full blur-[80px] pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Linhas decorativas ── */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
          </div>

          {/* ── Logo ── */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 mb-3"
            style={{ filter: 'drop-shadow(0 0 32px rgba(253,200,0,0.55))' }}
          >
            <img
              src="/images/zyron-logo.png"
              alt="ZYRON"
              className="w-56 h-auto object-contain brightness-110 saturate-125"
            />
          </motion.div>

          {/* ── Slogan ── */}
          <AnimatePresence>
            {phase !== 'logo' && (
              <motion.p
                key="slogan"
                initial={{ opacity: 0, y: 8, letterSpacing: '0.1em' }}
                animate={{ opacity: 1, y: 0, letterSpacing: '0.35em' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="text-white/50 text-[11px] font-light tracking-[0.35em] uppercase z-10 mb-8"
              >
                A força da sua evolução.
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Barra de progresso ── */}
          <AnimatePresence>
            {phase === 'bar' || phase === 'exit' ? (
              <motion.div
                key="progress-wrap"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-14 left-1/2 -translate-x-1/2 w-48 z-10"
              >
                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-yellow-300 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.6, ease: 'easeInOut' }}
                    style={{ boxShadow: '0 0 12px rgba(253,224,71,0.6)' }}
                  />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-[9px] text-white/20 font-mono uppercase tracking-[0.2em] mt-2"
                >
                  Carregando...
                </motion.p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* ── Versão ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-6 text-[9px] text-white/30 font-mono tracking-widest uppercase z-10"
          >
            v1.0.0
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
