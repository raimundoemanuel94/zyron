import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState('logo'); // 'logo' | 'slogan' | 'exit'

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('slogan'), 900);
    const t2 = setTimeout(() => setPhase('exit'), 2000);
    const t3 = setTimeout(() => setIsVisible(false), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 bg-black z-[200] flex flex-col items-center justify-center"
        >
          {/* Glow de fundo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 bg-yellow-400/10 rounded-full blur-[100px]" />
          </div>

          {/* Logo */}
          <motion.div
            initial={{ scale: 0.75, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative z-10 mb-4"
          >
            <img
              src="/images/zyron-logo.png"
              alt="ZYRON"
              className="w-64 h-auto object-contain brightness-110 saturate-125"
              style={{ filter: 'drop-shadow(0 0 24px rgba(253,200,0,0.5))' }}
            />
          </motion.div>

          {/* Slogan */}
          <AnimatePresence>
            {phase !== 'logo' && (
              <motion.p
                key="slogan"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-white/80 text-sm font-light tracking-[0.3em] uppercase z-10"
              >
                A força da sua evolução.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Barra de carregamento */}
          <motion.div
            className="absolute bottom-12 left-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
            initial={{ width: '0%', left: '50%' }}
            animate={{ width: '60%', left: '20%' }}
            transition={{ duration: 1.8, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
