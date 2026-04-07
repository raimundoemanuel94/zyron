import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWASplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(false), 3900);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-black"
        >
          <div
            className="absolute inset-0 z-0 bg-cover bg-center opacity-24"
            style={{ backgroundImage: "url('/images/zyron-hero-impact.png')" }}
          />
          <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/78 to-black/92" />

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center"
          >
            <motion.svg
              width="62"
              height="62"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mb-5"
              animate={{ y: [0, -2, 0], opacity: [0.82, 1, 0.82] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <path d="M10 32L22 8H30L18 32H10Z" fill="#FDC800" />
              <path d="M22 32L34 8H26L14 32H22Z" fill="#FDC800" fillOpacity="0.7" />
            </motion.svg>

            <h2 className="text-[34px] font-black italic uppercase tracking-tight text-white">ZYRON</h2>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.26em] text-white/55">Carregando app</p>

            <div className="mt-6 flex items-center gap-2.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i === 1 ? 'bg-[#FDC800]' : 'bg-white/85'}`}
                  animate={{ y: [0, -8, 0], opacity: [0.35, 1, 0.35], scale: [0.94, 1, 0.94] }}
                  transition={{ duration: 0.66, repeat: Infinity, delay: i * 0.16, ease: 'easeInOut' }}
                  style={i === 1 ? { boxShadow: '0 0 10px rgba(253,200,0,0.45)' } : undefined}
                />
              ))}
            </div>
          </motion.div>

          <p className="absolute bottom-6 z-10 text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">
            Zyron Engine
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
