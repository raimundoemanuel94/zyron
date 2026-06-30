import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';

/**
 * ExerciseAnimationModal
 *
 * Modal flutuante que mostra a animação de movimento (2 frames em loop)
 * de um exercício, igual ao MiniPlayer de música: pode ser minimizado
 * (vira uma pílula pequena no canto) ou fechado de vez (X).
 *
 * Só existe UMA instância montada por vez no app inteiro — controlada
 * por um contexto simples via props vindas do WorkoutCard ativo.
 */
export default function ExerciseAnimationModal({
  exercise,
  animData,
  onClose,
}) {
  const [minimized, setMinimized] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [src0, setSrc0] = useState(animData?.frame0);
  const [src1, setSrc1] = useState(animData?.frame1);
  const [allFailed, setAllFailed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const frameIntervalRef = useRef(null);

  useEffect(() => {
    setSrc0(animData?.frame0);
    setSrc1(animData?.frame1);
    setAllFailed(false);
    setShowInstructions(false);
  }, [exercise?.id, animData?.frame0, animData?.frame1]);

  useEffect(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (!allFailed && (src0 || src1)) {
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrame((f) => (f === 0 ? 1 : 0));
      }, 750);
    }
    return () => clearInterval(frameIntervalRef.current);
  }, [src0, src1, allFailed]);

  const handleImg0Error = () => {
    if (src0 !== animData?.frame0fb && animData?.frame0fb) setSrc0(animData.frame0fb);
    else setAllFailed(true);
  };
  const handleImg1Error = () => {
    if (src1 !== animData?.frame1fb && animData?.frame1fb) setSrc1(animData.frame1fb);
  };

  if (!exercise) return null;

  // ── MINIMIZADO — pílula flutuante, igual MiniPlayer de música ──────────
  if (minimized) {
    return (
      <motion.div
        initial={{ y: 80, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        className="fixed left-0 right-0 z-[58] mx-auto cursor-pointer"
        style={{ bottom: 'calc(140px + env(safe-area-inset-bottom))', maxWidth: 430, padding: '0 10px' }}
        onClick={() => setMinimized(false)}
      >
        <div
          className="relative overflow-hidden flex items-center gap-3 px-3 py-2.5"
          style={{
            background: 'rgba(20,20,23,0.97)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 16,
            boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          }}
        >
          <div className="relative shrink-0 w-10 h-10 rounded-[10px] overflow-hidden bg-neutral-900">
            {!allFailed && (src0 || src1) ? (
              <>
                {src0 && <img src={src0} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${currentFrame === 0 ? 'opacity-100' : 'opacity-0'}`} onError={handleImg0Error} crossOrigin="anonymous" />}
                {src1 && <img src={src1} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${currentFrame === 1 ? 'opacity-100' : 'opacity-0'}`} onError={handleImg1Error} crossOrigin="anonymous" />}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Maximize2 size={14} className="text-white/30" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[12.5px] font-bold truncate leading-tight">{exercise.name}</p>
            <p className="text-white/40 text-[10px] font-medium truncate mt-0.5">Toque para expandir</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}
            aria-label="Fechar"
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  // ── EXPANDIDO — modal grande sobre a tela ───────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="exercise-modal-scrim"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[57]"
        style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
        onClick={() => setMinimized(true)}
      />

      <motion.div
        key="exercise-modal"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        className="fixed left-1/2 top-1/2 z-[58] w-[90vw] max-w-sm"
        style={{ transform: 'translate(-50%, -50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative overflow-hidden rounded-[24px]"
          style={{
            background: 'rgba(14,14,17,0.98)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: '0 28px 64px rgba(0,0,0,0.7)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-white text-[14px] font-black truncate leading-tight">{exercise.name}</p>
              <p className="text-white/40 text-[10px] font-semibold mt-0.5">Demonstração do movimento</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setMinimized(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                aria-label="Minimizar"
              >
                <Minus size={15} />
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
                aria-label="Fechar"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Animação grande */}
          <div className="relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900" style={{ aspectRatio: '1 / 1' }}>
            {!allFailed && (src0 || src1) ? (
              <>
                {src0 && (
                  <img
                    src={src0}
                    alt={`${exercise.name} início`}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 0 ? 'opacity-100' : 'opacity-0'}`}
                    crossOrigin="anonymous"
                    onError={handleImg0Error}
                  />
                )}
                {src1 && (
                  <img
                    src={src1}
                    alt={`${exercise.name} contração`}
                    className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 1 ? 'opacity-100' : 'opacity-0'}`}
                    crossOrigin="anonymous"
                    onError={handleImg1Error}
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 300" className="w-28 h-36 opacity-20" xmlns="http://www.w3.org/2000/svg">
                  <motion.circle cx="100" cy="40" r="20" fill="none" stroke="white" strokeWidth="2" animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
                  <motion.rect x="85" y="65" width="30" height="50" fill="none" stroke="white" strokeWidth="2" animate={{ scaleY: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} />
                  <line x1="85" y1="75" x2="40" y2="100" stroke="white" strokeWidth="2" />
                  <line x1="115" y1="75" x2="160" y2="100" stroke="white" strokeWidth="2" />
                  <line x1="90" y1="115" x2="80" y2="180" stroke="white" strokeWidth="2" />
                  <line x1="110" y1="115" x2="120" y2="180" stroke="white" strokeWidth="2" />
                </svg>
              </div>
            )}

            {/* Indicador "ao vivo" */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Movimento</span>
            </div>
          </div>

          {/* Info: músculos + dica */}
          <div className="px-4 py-3.5">
            {animData?.muscles?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {animData.muscles.slice(0, 4).map((m, i) => (
                  <span key={i} className="text-[9px] font-black uppercase tracking-wider bg-white/8 text-white/75 border border-white/15 px-2 py-1 rounded-full">
                    {m}
                  </span>
                ))}
              </div>
            )}
            {animData?.tip && (
              <p className="text-[12px] font-semibold text-white/65 leading-relaxed mb-3">⚡ {animData.tip}</p>
            )}

            {animData?.instructions?.length > 0 && (
              <>
                <button
                  onClick={() => setShowInstructions((s) => !s)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[14px]"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-white/70">
                    {showInstructions ? 'Ocultar passo a passo' : '📋 Ver passo a passo'}
                  </span>
                </button>

                <AnimatePresence>
                  {showInstructions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <ol className="space-y-2 pt-3">
                        {animData.instructions.map((step, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span className="shrink-0 w-5 h-5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                            <p className="text-[11.5px] text-white/65 leading-relaxed flex-1">{step}</p>
                          </li>
                        ))}
                      </ol>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
