import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle2, Trophy, Zap, Plus, Minus } from 'lucide-react';

export default function WorkoutCard({
  ex,
  completed,
  onComplete,
  load,
  onUpdateLoad,
  prHistoryLoad,
  showPR,
  videoQuery
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const cardRef = useRef(null);

  // Smart Play (Intersection Observer) - Feature 1
  useEffect(() => {
    if (!isExpanded) {
      setVideoPlaying(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoPlaying(true);
        } else {
          setVideoPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) observer.unobserve(cardRef.current);
    };
  }, [isExpanded]);

  // Haptic Picker Handlers - Feature 2
  const handleLoadChange = (delta) => {
    const currentLoad = parseFloat(load) || 0;
    const newLoad = Math.max(0, currentLoad + delta);
    onUpdateLoad(ex.id, newLoad.toString());
  };

  const isNewPR = parseFloat(load) > (prHistoryLoad || 0);

  return (
    <motion.div 
      layout
      ref={cardRef}
      className={`relative bg-neutral-950 backdrop-blur-md border transition-all duration-500 rounded-4xl p-6 overflow-hidden ${
        completed 
          ? 'border-emerald-500/50 opacity-70 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
          : isExpanded 
            ? 'border-yellow-400 animate-neon-pulse z-10' 
            : 'border-white/5 hover:border-yellow-400/30 shadow-2xl shadow-black/40'
      }`}
      onClick={() => !completed && !isExpanded && setIsExpanded(true)}
    >
      {/* PR Celebration Overlay */}
      <AnimatePresence>
        {showPR === ex.id && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              scale: [0.9, 1.05, 1.05, 1],
              borderColor: ['#10b981', '#34d399', '#10b981']
            }}
            transition={{ duration: 2.5, times: [0, 0.2, 0.8, 1] }}
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-emerald-500/10 rounded-4xl z-20 border-2 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
          >
            <motion.div
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Trophy className="text-emerald-400 mb-2" size={48} />
            </motion.div>
            <span className="text-2xl font-black italic text-emerald-400 uppercase tracking-widest">NOVO RECORDE!</span>
            <div className="absolute top-2 right-2"><Zap className="text-emerald-500 animate-pulse" size={20} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-start gap-4">
        <div className="space-y-2 flex-1">
          <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-yellow-400/30">
            {ex.group}
          </span>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-yellow-400 transition-colors">
            {ex.name}
          </h3>
          
          {/* Collapsed State Info */}
          {!isExpanded && (
            <div className="flex gap-4 mt-2 opacity-60">
              <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.séries} SÉRIES</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.reps} REPS</span>
              {load && <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">{load} KG</span>}
            </div>
          )}
        </div>

        {/* Right Side: Mini Player or Check Button */}
        <AnimatePresence mode="wait">
          {!isExpanded && (
            <motion.button 
              key="check"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onComplete(ex.id);
              }}
              className={`group relative h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 shrink-0 ${
                completed 
                  ? 'bg-emerald-500 border-emerald-500 text-neutral-950 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                  : 'border-neutral-700 text-neutral-700 hover:border-yellow-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              }`}
            >
              {completed ? (
                <CheckCircle2 size={28} strokeWidth={3} />
              ) : (
                <div className="h-5 w-5 border-2 border-current rounded-sm opacity-30"></div>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Floating native PiP Video Player */}
      <AnimatePresence>
        {isExpanded && videoPlaying && !completed && (
          <motion.div
            key="pip-player"
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50, transition: { duration: 0.2 } }}
            className="fixed bottom-32 right-6 z-100 w-48 aspect-video rounded-2xl border border-yellow-400/50 overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(253,224,71,0.2)] bg-neutral-900"
          >
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">
               <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
               <span className="text-[8px] font-black tracking-widest text-yellow-400 uppercase">PiP Ativo</span>
            </div>
            <iframe
              src={`https://www.youtube.com/embed/${videoQuery || 'vcBig73oqpE'}?autoplay=1&mute=1&loop=1&playlist=${videoQuery || 'vcBig73oqpE'}&controls=0&modestbranding=1`}
              title={ex.name}
              className="w-[150%] h-[150%] -translate-x-1/6 -translate-y-1/6 pointer-events-none opacity-80"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progressive Reveal Box */}
      <AnimatePresence>
        {isExpanded && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >

            <div className="grid grid-cols-2 gap-4">
              {/* Prescrição Block */}
              <div className="bg-neutral-900/50 p-4 rounded-2xl border border-white/5 flex flex-col justify-center gap-4">
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                  <span>Séries</span>
                  <span className="text-xl text-yellow-400 font-black tracking-tighter">{ex.séries}</span>
                </div>
                <div className="w-full h-px bg-white/5"></div>
                <div className="flex justify-between items-center text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                  <span>Repetições</span>
                  <span className="text-xl text-white font-black tracking-tighter">{ex.reps}</span>
                </div>
              </div>

              {/* Haptic Carga Picker & Confirm Button */}
              <div className="flex flex-col gap-3">
                <div className={`bg-neutral-900 p-2 rounded-2xl border transition-all relative flex flex-col items-center justify-center ${
                  isNewPR 
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/20' 
                    : 'border-white/10 hover:border-yellow-400/30 focus-within:border-yellow-400 shadow-[0_0_10px_rgba(0,0,0,0.5)]'
                }`}>
                  <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1 mb-1">Carga Atual (KG)</p>
                  <div className="flex flex-col items-center justify-center w-full px-1 gap-2">
                    <div className="flex items-baseline justify-center">
                      <input 
                        type="number"
                        value={load || ''}
                        readOnly
                        onClick={(e) => e.stopPropagation()}
                        placeholder="--"
                        className={`w-20 bg-transparent text-center font-black text-4xl outline-none placeholder-neutral-800 transition-colors pointer-events-none ${
                          isNewPR ? 'text-emerald-400' : 'text-white'
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 justify-center w-full">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(-5); }}
                        className="w-10 h-8 rounded-lg bg-neutral-950 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/20 active:scale-90 transition-all font-black text-[10px]"
                      >
                        -5
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(-1); }}
                        className="w-12 h-10 rounded-xl bg-neutral-800 border-b-2 border-neutral-950 flex items-center justify-center text-white hover:text-yellow-400 hover:bg-neutral-700 active:scale-90 transition-all font-black text-sm"
                      >
                        -1
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(1); }}
                        className="w-12 h-10 rounded-xl bg-neutral-800 border-b-2 border-neutral-950 flex items-center justify-center text-white hover:text-yellow-400 hover:bg-neutral-700 active:scale-90 transition-all font-black text-sm"
                      >
                        +1
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(5); }}
                        className="w-10 h-8 rounded-lg bg-neutral-950 border border-white/5 flex items-center justify-center text-neutral-500 hover:text-white hover:border-white/20 active:scale-90 transition-all font-black text-[10px]"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                  {prHistoryLoad ? (
                    <div className="mt-1 flex items-center gap-1 opacity-60">
                      <History size={10} className="text-neutral-500" />
                      <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">PR: {prHistoryLoad}kg</span>
                    </div>
                  ) : null}
                </div>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(ex.id);
                    setIsExpanded(false);
                  }}
                  className="w-full bg-yellow-400 hover:bg-yellow-500 text-neutral-950 font-black uppercase tracking-[0.2em] text-[10px] py-3 rounded-2xl flex items-center justify-center gap-2 transition-colors border border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.3)]"
                >
                  <CheckCircle2 size={16} strokeWidth={3} /> CHECK
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
