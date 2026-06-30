import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Play, Check } from 'lucide-react';

function clampNumber(value, min, max) {
  if (value === '') return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  return String(Math.min(max, Math.max(min, parsed)));
}

/**
 * ExerciseAnimationModal — TELA CHEIA de execução do exercício.
 *
 * Abre automaticamente quando o usuário toca em um exercício na sessão.
 * Mostra: animação do movimento em loop no topo + registro de série
 * (carga, reps, RPE/RIR, descanso) — tudo numa única tela, sem precisar
 * voltar para a lista. Pode ser minimizado (vira pílula, como o player
 * de música) ou fechado.
 */
export default function ExerciseAnimationModal({ exercise, animData, setControls, onClose }) {
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
    setMinimized(false);
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

  const sc = setControls || {};
  const totalSets = sc.totalSets || 1;
  const activeSet = sc.activeSet || 1;
  const isRunning = sc.isRunning;
  const loggedSets = sc.loggedSets || [];

  // ── MINIMIZADO — pílula, igual ao player de música ──────────────────────
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
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[12.5px] font-bold truncate leading-tight">{exercise.name}</p>
            <p className="text-white/40 text-[10px] font-medium truncate mt-0.5">Série {activeSet} de {totalSets} · Toque para voltar</p>
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

  // ── TELA CHEIA ────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="exercise-fullscreen"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        className="fixed inset-0 z-[59] flex flex-col overflow-hidden"
        style={{ background: '#0a0a0c' }}
      >
        {/* Header fixo */}
        <div className="flex items-center justify-between px-4 shrink-0" style={{ paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setMinimized(true)}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
            aria-label="Minimizar"
          >
            <Minus size={16} />
          </button>
          <div className="text-center flex-1 px-2 min-w-0">
            <p className="text-white text-[13px] font-black truncate leading-tight">{exercise.name}</p>
            <p className="text-white/35 text-[10px] font-bold mt-0.5">Série {activeSet} de {totalSets}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)' }}
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto px-4 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>

          {/* Animação grande */}
          <div className="relative w-full mt-4 rounded-[20px] overflow-hidden bg-gradient-to-b from-neutral-800 to-neutral-900" style={{ aspectRatio: '4 / 3', border: '1px solid rgba(255,255,255,0.08)' }}>
            {!allFailed && (src0 || src1) ? (
              <>
                {src0 && <img src={src0} alt={`${exercise.name} início`} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 0 ? 'opacity-100' : 'opacity-0'}`} crossOrigin="anonymous" onError={handleImg0Error} />}
                {src1 && <img src={src1} alt={`${exercise.name} contração`} className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 1 ? 'opacity-100' : 'opacity-0'}`} crossOrigin="anonymous" onError={handleImg1Error} />}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 200 300" className="w-24 h-32 opacity-15" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="100" cy="40" r="20" fill="none" stroke="white" strokeWidth="2" />
                  <rect x="85" y="65" width="30" height="50" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="85" y1="75" x2="40" y2="100" stroke="white" strokeWidth="2" />
                  <line x1="115" y1="75" x2="160" y2="100" stroke="white" strokeWidth="2" />
                  <line x1="90" y1="115" x2="80" y2="180" stroke="white" strokeWidth="2" />
                  <line x1="110" y1="115" x2="120" y2="180" stroke="white" strokeWidth="2" />
                </svg>
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10">
              <motion.div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
              <span className="text-[8px] font-black text-white/70 uppercase tracking-widest">Movimento</span>
            </div>
          </div>

          {/* Músculos + dica */}
          {animData?.muscles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {animData.muscles.slice(0, 4).map((m, i) => (
                <span key={i} className="text-[9px] font-black uppercase tracking-wider bg-white/8 text-white/75 border border-white/15 px-2 py-1 rounded-full">{m}</span>
              ))}
            </div>
          )}
          {animData?.tip && <p className="text-[12px] font-semibold text-white/60 leading-relaxed mt-2.5">⚡ {animData.tip}</p>}

          {animData?.instructions?.length > 0 && (
            <>
              <button
                onClick={() => setShowInstructions((s) => !s)}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-[14px] mt-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <span className="text-[11px] font-black uppercase tracking-widest text-white/70">
                  {showInstructions ? 'Ocultar passo a passo' : '📋 Ver passo a passo'}
                </span>
              </button>
              <AnimatePresence>
                {showInstructions && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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

          {/* ── Registro de série ── */}
          {setControls && (
            <div className="mt-5 space-y-3">

              <div className="grid grid-cols-2 gap-2">
                <label className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5">
                  <span className="block text-[11px] font-black uppercase tracking-[0.06em] text-white/55">Carga usada</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <input
                      type="number" min="0" step="0.5" inputMode="decimal"
                      value={sc.loadInputValue ?? ''}
                      onChange={(e) => { sc.onUpdateLoad?.(sc.exerciseId, e.target.value); }}
                      placeholder="0"
                      className="w-full bg-transparent text-2xl font-black text-white outline-none"
                    />
                    <span className="text-[12px] font-black text-white">kg</span>
                  </div>
                </label>

                <label className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5">
                  <span className="block text-[11px] font-black uppercase tracking-[0.06em] text-white/55">Reps feitas</span>
                  <input
                    type="number" min="0" inputMode="numeric"
                    value={sc.actualReps ?? ''}
                    onChange={(e) => { sc.setActualReps?.(clampNumber(e.target.value, 0, 999)); }}
                    placeholder="0"
                    className="mt-1 w-full bg-transparent text-2xl font-black text-white outline-none"
                  />
                </label>
              </div>

              {/* Séries do exercício */}
              <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-[0.06em] text-white/55">Séries do exercício</span>
                  <span className="text-[11px] font-black uppercase tracking-[0.06em] text-white/45">{loggedSets.length}/{totalSets} salvas</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {Array.from({ length: totalSets }).map((_, index) => {
                    const setNumber = index + 1;
                    const logged = loggedSets.find((s) => s.set_number === setNumber);
                    const isActiveSet = setNumber === activeSet;
                    return (
                      <div key={setNumber} className={`min-w-[82px] rounded-xl border px-2 py-2 ${
                        logged?.status === 'failed' ? 'border-red-400/35 bg-red-500/10'
                        : logged ? 'border-emerald-400/30 bg-emerald-400/10'
                        : isActiveSet ? 'border-white/45 bg-white/10'
                        : 'border-white/8 bg-white/[0.025]'
                      }`}>
                        <span className="block text-[10px] font-black uppercase tracking-[0.06em] text-white/55">S{setNumber}</span>
                        <span className="mt-1 block text-[11px] font-black text-white/85">
                          {logged ? `${logged.weight_kg}kg × ${logged.reps}` : isActiveSet ? 'Agora' : 'A fazer'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(sc.isNewPR || sc.prHistoryLoad) && (
                <p className={`rounded-xl border px-3 py-2 text-[11px] font-black uppercase tracking-[0.06em] ${
                  sc.isNewPR ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-white/8 bg-white/[0.025] text-white/40'
                }`}>
                  {sc.isNewPR ? 'Novo PR de carga neste exercício.' : `Carga anterior: ${sc.prHistoryLoad}kg`}
                </p>
              )}

              {sc.setError && (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.06em] text-red-300">
                  {sc.setError}
                </p>
              )}

              <button
                onClick={(e) => sc.onToggleSet?.(e)}
                className={`w-full h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-200 font-black ${
                  isRunning
                    ? 'bg-emerald-400 text-neutral-950 border border-emerald-300'
                    : 'bg-[#11140b] text-white border-2 border-white/55'
                }`}
              >
                <div className="flex items-center gap-3 leading-none">
                  {isRunning ? <div className="h-2 w-2 shrink-0 rounded-full bg-red-600 animate-ping" /> : <Play className="shrink-0 fill-white text-white" size={16} />}
                  <div className="text-left">
                    <span className={`block text-[11px] font-black uppercase tracking-[0.06em] ${isRunning ? 'text-neutral-800' : 'text-white/75'}`}>Série {activeSet} de {totalSets}</span>
                    <span className="text-[14px] font-black uppercase tracking-[0.06em]">{isRunning ? 'Concluir série' : 'Iniciar série'}</span>
                  </div>
                </div>
                {isRunning && <Check size={18} className="text-neutral-900" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
