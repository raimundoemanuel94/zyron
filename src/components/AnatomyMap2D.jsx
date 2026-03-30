import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_GLOW = '#ef4444'; // Red for muscle "pump"
const IMAGE_FRONT = '/images/atlas-front.png';
const IMAGE_BACK = '/images/atlas-back.png';

export default function AnatomyMap2D({ activeGroup }) {
  // Determine if we should show FRONT or BACK view
  const view = useMemo(() => {
    const backGroups = ['Costas', 'Tríceps', 'Panturrilha', 'Posterior', 'Glúteos'];
    return backGroups.includes(activeGroup) ? 'BACK' : 'FRONT';
  }, [activeGroup]);

  // Muscle mapping to % coordinates [top, left, width, height]
  const muscles = {
    // FRONT VIEW
    'Peito': { 
      front: { 
        top: '23%', left: '46.5%', width: '12%', height: '8%', 
        dual: { top: '23%', left: '53.5%' } 
      } 
    },
    'Abdômen': { front: { top: '38%', left: '50%', width: '12%', height: '15%' } },
    'Bíceps': { front: { top: '32%', left: '33%', width: '8%', height: '12%', dual: { top: '32%', left: '67%' } } },
    'Ombro': { 
        front: { top: '21%', left: '33%', width: '10%', height: '10%', dual: { top: '21%', left: '67%' } },
        back: { top: '21%', left: '33%', width: '12%', height: '12%', dual: { top: '21%', left: '67%' } }
    },
    'Perna': { front: { top: '65%', left: '42%', width: '12%', height: '20%', dual: { top: '65%', left: '58%' } } },
    'Antebraço': { front: { top: '48%', left: '25%', width: '8%', height: '12%', dual: { top: '48%', left: '75%' } } },
    
    // BACK VIEW
    'Costas': { back: { top: '35%', left: '50%', width: '40%', height: '22%' } },
    'Tríceps': { back: { top: '32%', left: '33%', width: '10%', height: '15%', dual: { top: '32%', left: '67%' } } },
    'Panturrilha': { back: { top: '78%', left: '44%', width: '8%', height: '12%', dual: { top: '78%', left: '56%' } } },
    'Glúteos': { back: { top: '52%', left: '50%', width: '30%', height: '12%' } },
  };

  const currentMuscle = muscles[activeGroup];
  const activeOverlay = currentMuscle ? (view === 'FRONT' ? currentMuscle.front : currentMuscle.back) : null;

  return (
    <div className="h-72 w-full bg-black rounded-3xl border border-white/5 overflow-hidden relative shadow-[inset_0_0_100px_rgba(0,0,0,1)] flex items-center justify-center p-2 group">
      
      {/* HUD OVERLAY - TOP LEFT */}
      <div className="absolute top-4 left-5 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
             <div className="w-3 h-3 rounded-full bg-red-600 shadow-[0_0_15px_#ef4444]" />
             <div className="absolute w-6 h-6 border border-red-500/20 rounded-full animate-ping" />
          </div>
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white italic">Neural Monitor</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest leading-none underline decoration-red-500/30">Target:</span>
              <span className="text-[7px] font-black text-red-500 uppercase tracking-widest leading-none">
                {activeGroup ? 'PUMP ATIVO' : 'EM ESPERA'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
           key={view}
           initial={{ opacity: 0, scale: 0.95, filter: 'brightness(2)' }}
           animate={{ opacity: 1, scale: 1, filter: 'brightness(1)' }}
           exit={{ opacity: 0, scale: 1.05 }}
           transition={{ duration: 0.5, ease: "circOut" }}
           className="relative h-full aspect-1/2 flex items-center justify-center"
        >
          {/* Base Atlas Image */}
          <img 
            src={view === 'FRONT' ? IMAGE_FRONT : IMAGE_BACK} 
            className="h-full w-full object-cover mix-blend-screen opacity-90"
            alt="Anatomical Map"
          />

          {/* Muscle Glow Overlay */}
          {activeOverlay && (
            <>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: [0.8, 1, 0.8], scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="absolute pointer-events-none rounded-full blur-[12px]"
                    style={{
                        top: activeOverlay.top,
                        left: activeOverlay.left,
                        width: activeOverlay.width,
                        height: activeOverlay.height,
                        transform: 'translate(-50%, -50%)',
                        background: `radial-gradient(circle, ${COLOR_GLOW} 50%, transparent 90%)`
                    }}
                />
                {activeOverlay.dual && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: [0.8, 1, 0.8], scale: [0.98, 1.02, 0.98] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                        className="absolute pointer-events-none rounded-full blur-[12px]"
                        style={{
                            top: activeOverlay.dual.top,
                            left: activeOverlay.dual.left,
                            width: activeOverlay.width,
                            height: activeOverlay.height,
                            transform: 'translate(-50%, -50%)',
                            background: `radial-gradient(circle, ${COLOR_GLOW} 50%, transparent 90%)`
                        }}
                    />
                )}
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* FOOTER HUD */}
      <div className="absolute bottom-4 left-5 z-20 flex flex-col gap-1.5">
         <div className="flex gap-1">
            <div className="w-1 h-3 bg-red-600/40 rounded-full" />
            <div className="w-1 h-3 bg-red-600/20 rounded-full" />
         </div>
         <span className="text-[6px] font-mono text-neutral-600 tracking-tighter uppercase">ANATOMY.ENGINE.v3.0.RED</span>
      </div>

      <div className="absolute bottom-4 right-6 z-20 text-right">
        <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest block mb-0.5">Musculatura</span>
        <span className="text-sm font-black text-red-500 uppercase italic tracking-tighter drop-shadow-lg">
          {activeGroup || '---'}
        </span>
      </div>

      {/* Decorative Scan Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%),linear-gradient(90deg,rgba(255,0,0,0.05),rgba(0,0,0,0),rgba(255,0,0,0.05))] bg-[length:100%_4px,10px_100%]" />
      </div>
    </div>
  );
}
