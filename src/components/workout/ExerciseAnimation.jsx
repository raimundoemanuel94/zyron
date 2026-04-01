import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * ExerciseAnimation
 *
 * ✅ SEM chamadas à ExerciseDB API (removido o useEffect com getExerciseImage)
 * ✅ Usa frame0/frame1 passados diretamente pelas props (de exerciseAnimations.js)
 * ✅ Se a imagem falhar (403/404), tenta automaticamente frame0fb/frame1fb via onError
 * ✅ Se tudo falhar, mostra SVG animado
 */
export default function ExerciseAnimation({
  frame0,
  frame1,
  frame0fb,
  frame1fb,
  muscles = [],
  tip = '',
  instructions = [],
  exerciseName = '',
  className = '',
}) {
  const [showInstructions, setShowInstructions] = useState(false);
  const [currentFrame, setCurrentFrame]         = useState(0);
  const [src0, setSrc0]                         = useState(frame0);
  const [src1, setSrc1]                         = useState(frame1);
  const [allFailed, setAllFailed]               = useState(false);
  const frameIntervalRef                        = useRef(null);

  // Sincroniza sources quando props mudarem (troca de exercício)
  useEffect(() => {
    setSrc0(frame0);
    setSrc1(frame1);
    setAllFailed(false);
  }, [frame0, frame1]);

  // Alterna frames enquanto houver imagem
  useEffect(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (!allFailed && (src0 || src1)) {
      frameIntervalRef.current = setInterval(() => {
        setCurrentFrame(f => (f === 0 ? 1 : 0));
      }, 750);
    }
    return () => clearInterval(frameIntervalRef.current);
  }, [src0, src1, allFailed]);

  // Se frame0 falhar → tenta fallback → se fallback falhar → marca allFailed
  const handleImg0Error = () => {
    if (src0 !== frame0fb && frame0fb) {
      setSrc0(frame0fb);
    } else {
      setAllFailed(true);
    }
  };

  const handleImg1Error = () => {
    if (src1 !== frame1fb && frame1fb) {
      setSrc1(frame1fb);
    }
  };

  // ── Renderiza imagem real ─────────────────────────────────────────────────
  if (!allFailed && (src0 || src1)) {
    return (
      <div className={`relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 overflow-hidden ${className}`}>

        {src0 && (
          <img
            src={src0}
            alt={`${exerciseName} início`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 0 ? 'opacity-100' : 'opacity-0'}`}
            crossOrigin="anonymous"
            onError={handleImg0Error}
          />
        )}

        {src1 && (
          <img
            src={src1}
            alt={`${exerciseName} contração`}
            className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${currentFrame === 1 ? 'opacity-100' : 'opacity-0'}`}
            crossOrigin="anonymous"
            onError={handleImg1Error}
          />
        )}

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 py-3">
          {muscles?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {muscles.slice(0, 3).map((m, i) => (
                <span key={i} className="text-[7px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                  {m}
                </span>
              ))}
            </div>
          )}
          {tip && <p className="text-[9px] font-bold text-yellow-300/80 leading-tight line-clamp-2">⚡ {tip}</p>}
        </div>

        {/* Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
          <motion.div className="w-1.5 h-1.5 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">Ativo</span>
        </div>

        <InstructionsPanel instructions={instructions} show={showInstructions} onToggle={() => setShowInstructions(s => !s)} />
      </div>
    );
  }

  // ── SVG fallback ──────────────────────────────────────────────────────────
  return (
    <div className={`relative w-full bg-gradient-to-b from-neutral-800 to-neutral-900 overflow-hidden ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 200 300" className="w-32 h-40 opacity-20" xmlns="http://www.w3.org/2000/svg">
          <motion.circle cx="100" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="2"
            animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.rect x="85" y="65" width="30" height="50" fill="none" stroke="currentColor" strokeWidth="2"
            animate={{ scaleY: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} />
          <motion.line x1="85" y1="75" x2="40" y2="100" stroke="currentColor" strokeWidth="2"
            animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <motion.line x1="115" y1="75" x2="160" y2="100" stroke="currentColor" strokeWidth="2"
            animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <line x1="90" y1="115" x2="80" y2="180" stroke="currentColor" strokeWidth="2" />
          <line x1="110" y1="115" x2="120" y2="180" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-3 py-3">
        {muscles.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {muscles.slice(0, 3).map((m, i) => (
              <span key={i} className="text-[7px] font-black uppercase tracking-wider bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-1.5 py-0.5 rounded-full">
                {m}
              </span>
            ))}
          </div>
        )}
        {tip && <p className="text-[9px] font-bold text-yellow-300/80 leading-tight line-clamp-2">⚡ {tip}</p>}
      </div>

      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
        <motion.div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"
          animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
        <span className="text-[7px] font-black text-white/70 uppercase tracking-widest">Pronto</span>
      </div>

      <InstructionsPanel instructions={instructions} show={showInstructions} onToggle={() => setShowInstructions(s => !s)} />
    </div>
  );
}

function InstructionsPanel({ instructions, show, onToggle }) {
  if (!instructions?.length) return null;
  return (
    <>
      <button
        className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10 text-[7px] font-black text-white/70 uppercase tracking-widest hover:border-yellow-400/30 transition-all z-20"
        onClick={e => { e.stopPropagation(); onToggle(); }}
      >
        {show ? 'Fechar' : '📋 Passos'}
      </button>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
          className="absolute inset-0 bg-black/95 backdrop-blur-sm flex flex-col justify-center p-4 z-30 rounded-t-2xl overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <h4 className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">Como executar</h4>
          <ol className="space-y-2">
            {instructions.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 w-4 h-4 rounded-full bg-yellow-400 text-black text-[8px] font-black flex items-center justify-center mt-0.5">{i + 1}</span>
                <p className="text-[10px] text-neutral-300 leading-relaxed flex-1">{step}</p>
              </li>
            ))}
          </ol>
          <button
            className="mt-4 w-full py-1.5 bg-neutral-800 text-neutral-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 hover:bg-neutral-700 transition-colors"
            onClick={e => { e.stopPropagation(); onToggle(); }}
          >
            Fechar
          </button>
        </motion.div>
      )}
    </>
  );
}