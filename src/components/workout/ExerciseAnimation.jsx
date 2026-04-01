import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * ExerciseAnimation — alternates between 2 static JPG frames
 * to simulate exercise movement, similar to Treino Mestre style.
 */
export default function ExerciseAnimation({
  frame0,
  frame1,
  muscles = [],
  tip = '',
  instructions = [],
  exerciseName = '',
  className = '',
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [loaded0, setLoaded0]       = useState(false);
  const [loaded1, setLoaded1]       = useState(false);
  const [error0, setError0]         = useState(false);
  const [error1, setError1]         = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const intervalRef = useRef(null);

  const bothLoaded = loaded0 && loaded1;
  const hasError   = error0 || error1;

  // Start animation once both frames load
  useEffect(() => {
    if (!bothLoaded || hasError) return;
    intervalRef.current = setInterval(() => {
      setFrameIndex(i => (i === 0 ? 1 : 0));
    }, 750);
    return () => clearInterval(intervalRef.current);
  }, [bothLoaded, hasError]);

  // Preload both frames
  useEffect(() => {
    const img0 = new Image();
    img0.onload  = () => setLoaded0(true);
    img0.onerror = () => setError0(true);
    img0.src = frame0;

    const img1 = new Image();
    img1.onload  = () => setLoaded1(true);
    img1.onerror = () => setError1(true);
    img1.src = frame1;

    return () => {
      img0.onload = img0.onerror = null;
      img1.onload = img1.onerror = null;
    };
  }, [frame0, frame1]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>

      {/* ── Skeleton loading state ── */}
      {!bothLoaded && !hasError && (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 border-2 border-yellow-400/30 rounded-full" />
              <div className="absolute inset-0 w-10 h-10 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
              Carregando animação
            </span>
          </div>
        </div>
      )}

      {/* ── Error fallback ── */}
      {hasError && (
        <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center z-10">
          <div className="text-center px-4">
            <div className="text-3xl mb-2">💪</div>
            <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
              {exerciseName}
            </p>
          </div>
        </div>
      )}

      {/* ── Frame 0 (start position) ── */}
      {!hasError && (
        <img
          src={frame0}
          alt={`${exerciseName} - posição inicial`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            frameIndex === 0 && bothLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ position: frameIndex === 0 ? 'relative' : 'absolute', inset: 0 }}
        />
      )}

      {/* ── Frame 1 (contracted position) ── */}
      {!hasError && (
        <img
          src={frame1}
          alt={`${exerciseName} - contração`}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
            frameIndex === 1 && bothLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* ── Shimmer overlay while loading ── */}
      {!bothLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 animate-pulse" />
      )}

      {/* ── Bottom gradient + info ── */}
      {bothLoaded && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-3 py-2">
          {/* Muscle chips */}
          <div className="flex flex-wrap gap-1 mb-1">
            {muscles.map((m, i) => (
              <span
                key={i}
                className="text-[7px] font-black uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full"
              >
                {m}
              </span>
            ))}
          </div>

          {/* Tip */}
          {tip && (
            <p className="text-[9px] font-bold text-yellow-300/80 leading-tight">
              ⚡ {tip}
            </p>
          )}
        </div>
      )}

      {/* ── Animation indicator badge ── */}
      {bothLoaded && !hasError && (
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">
            Animação
          </span>
        </div>
      )}

      {/* ── Instructions toggle ── */}
      {instructions.length > 0 && bothLoaded && !hasError && (
        <>
          <button
            className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 text-[7px] font-black text-white/70 uppercase tracking-widest hover:border-yellow-400/30 transition-all"
            onClick={(e) => { e.stopPropagation(); setShowInstructions(s => !s); }}
          >
            {showInstructions ? 'Fechar' : '📋 Passos'}
          </button>

          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="absolute inset-0 bg-black/92 backdrop-blur-sm flex flex-col justify-center p-4 z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">
                  Como executar
                </h4>
                <ol className="space-y-2">
                  {instructions.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 w-4 h-4 rounded-full bg-yellow-400 text-black text-[8px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <p className="text-[10px] text-neutral-300 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
                <button
                  className="mt-4 w-full py-1.5 bg-neutral-800 text-neutral-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5"
                  onClick={(e) => { e.stopPropagation(); setShowInstructions(false); }}
                >
                  Fechar
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
