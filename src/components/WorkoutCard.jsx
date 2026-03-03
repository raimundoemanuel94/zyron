import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle2, Trophy, Zap, Plus, Minus, History, Play, Square, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [activeSet, setActiveSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const cardRef = useRef(null);
  const timerRef = useRef(null);

  // Timer logic for active set
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSetTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const formatSetTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playMetalSound = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'); // Metal hit/clank
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked"));
  };

  const handleToggleSet = (e) => {
    e.stopPropagation();
    if (!isRunning) {
      setIsRunning(true);
      setSetTimer(0);
    } else {
      setIsRunning(false);
      playMetalSound();
      if (activeSet < parseInt(ex.séries)) {
        setActiveSet(prev => prev + 1);
        onComplete(ex.id, false); // Partial complete/timer trigger
      } else {
        onComplete(ex.id, true); // Final complete
        setIsExpanded(false);
      }
    }
  };

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
      onClick={() => {
        if (!completed && !isExpanded) {
          setIsExpanded(true);
        }
      }}
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
              className="text-5xl mb-2"
            >
              🏆
            </motion.div>
            <span className="text-2xl font-black italic text-emerald-400 uppercase tracking-widest">NOVO RECORDE!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4">
        {/* Banner Area (Click to Expand Video) */}
        <div 
          className="relative h-40 -mx-6 -mt-6 mb-2 overflow-hidden cursor-pointer group/banner border-b border-yellow-400/20"
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) setIsExpanded(true);
            setShowVideo(!showVideo);
          }}
        >
          <img 
            src={ex.image || `https://img.youtube.com/vi/${videoQuery}/0.jpg`} 
            alt={ex.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-yellow-400/10 backdrop-blur-md p-4 rounded-full border border-yellow-400/50 group-hover:scale-110 group-hover:bg-yellow-400/30 transition-all">
              <Play className="text-yellow-400 fill-yellow-400" size={32} />
            </div>
          </div>
          <div className="absolute bottom-3 left-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
             <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] drop-shadow-lg">Técnica Industrial</span>
          </div>
        </div>

        {/* Inline Video Expander */}
        <AnimatePresence>
          {showVideo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-black rounded-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${videoQuery}?autoplay=1&modestbranding=1&rel=0`}
                  title={ex.name}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
                <button 
                  onClick={() => setShowVideo(false)}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-red-500 transition-colors z-10"
                >
                  <X size={16} />
                </button>
              </div>
              <button 
                onClick={() => setShowVideo(false)}
                className="w-full py-3 bg-neutral-900 text-neutral-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
              >
                X FECHAR VÍDEO
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1 flex-1">
            <span className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-yellow-400/30">
              {ex.group}
            </span>
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-white group-hover:text-yellow-400 transition-colors leading-none pt-1">
              {ex.name}
            </h3>
            
            {!isExpanded && (
              <div className="flex flex-wrap gap-4 mt-2 opacity-60">
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.séries} SÉRIES</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.reps} REPS</span>
                <span className="text-[10px] font-black tracking-widest uppercase text-yellow-400">{load || '0'} KG</span>
              </div>
            )}
          </div>

          {/* OLD CHECK BUTTON REMOVED - ONLY BRUTALISTA REMAINS IN EXPANDED STATE */}
        </div>
      </div>

      {/* Progressive Reveal Box */}
      <AnimatePresence>
        {isExpanded && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden pb-4"
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

              {/* Wheel Picker Styled Carga */}
              <div className="flex flex-col gap-3">
                <div className={`bg-neutral-900 p-2 rounded-2xl border transition-all relative flex flex-col items-center justify-center overflow-hidden h-full ${
                  isNewPR 
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)] bg-emerald-950/20' 
                    : 'border-white/10 hover:border-yellow-400/30 focus-within:border-yellow-400'
                }`}>
                  <p className="text-[8px] text-neutral-500 font-black uppercase tracking-widest mt-1 mb-1">Carga (KG)</p>
                  
                  <div className="relative flex flex-col items-center justify-center h-20 w-full cursor-ns-resize group/wheel">
                    <div className="absolute inset-x-0 h-px bg-yellow-400/20 top-1/4" />
                    <div className="absolute inset-x-0 h-px bg-yellow-400/20 bottom-1/4" />
                    
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(1); }}
                        className="opacity-20 hover:opacity-100 transition-opacity"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <span className={`font-black text-4xl italic tracking-tighter ${isNewPR ? 'text-emerald-400' : 'text-white'}`}>
                        {load || '0'}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLoadChange(-1); }}
                        className="opacity-20 hover:opacity-100 transition-opacity"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>

                    <motion.div 
                      drag="y"
                      dragConstraints={{ top: 0, bottom: 0 }}
                      onDragEnd={(_, info) => {
                        const delta = Math.round(info.offset.y / -10);
                        if (delta !== 0) handleLoadChange(delta);
                      }}
                      className="absolute inset-0 z-10"
                    />
                  </div>

                  {prHistoryLoad ? (
                    <div className="mt-1 flex items-center gap-1 opacity-60">
                      <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest">PR: {prHistoryLoad}kg</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Brutalist Action Button */}
            <motion.button 
              layout
              onClick={(e) => {
                handleToggleSet(e);
                if (!isRunning) {
                   cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className={`mt-4 w-full h-16 rounded-xl flex items-center justify-between px-6 transition-all duration-300 ${
                isRunning 
                  ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(253,224,71,0.4)]' 
                  : 'bg-neutral-950 text-white border-2 border-yellow-400 shadow-xl'
              }`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  {isRunning ? 'Executando' : 'Próxima'}
                </span>
                <span className="text-xl font-black italic uppercase tracking-tighter">
                  {isRunning ? '■ FINALIZAR SÉRIE' : `> INICIAR SÉRIE ${activeSet}`}
                </span>
              </div>
              
              {isRunning && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-600 rounded-full animate-ping" />
                  <span className="text-2xl font-black font-mono tracking-tighter">
                    {formatSetTime(setTimer)}
                  </span>
                </div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manual Check Backup (If needed for high intensity) */}
      {!isExpanded && !completed && (
        <div className="absolute top-4 right-6">
           <button 
             onClick={(e) => {
                e.stopPropagation();
                onComplete(ex.id, true);
             }}
             className="text-[8px] font-black text-white/20 hover:text-yellow-400 uppercase tracking-widest"
           >
             Quick Check
           </button>
        </div>
      )}
    </motion.div>
  );
}
