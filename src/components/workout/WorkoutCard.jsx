import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Trophy, Zap, Plus, Minus, History, Square, ChevronDown, ChevronUp } from 'lucide-react';
import haptics from '../../utils/haptics';
import ExerciseAnatomy from '../anatomy/ExerciseAnatomy';

export default function WorkoutCard({
  ex,
  completed,
  onComplete,
  load,
  onUpdateLoad,
  prHistoryLoad,
  showPR,
  onActivateMuscle,
  isPremiumUser
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSet, setActiveSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
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
    audio.playsInline = true;
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play blocked"));
  };

  const handleToggleSet = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback on interact
    if (!isRunning) {
      setIsRunning(true);
      setSetTimer(0);
      // Activate muscle pump on start (if premium user)
      if (onActivateMuscle && isPremiumUser) {
        onActivateMuscle(ex.id);
      }
    } else {
      setIsRunning(false);
      haptics.success();
      playMetalSound();
      
      // Feature request: "Ao clicar em finalizar, dispare automaticamente o temporizador de descanso no topo e REGISTRE A CARGA"
      onUpdateLoad(ex.id, load || '0');

      const setData = {
        set_number: activeSet,
        weight_kg: load || '0',
        reps: ex.reps ? parseInt(ex.reps.split('-')[0]) : 0,
        rpe: null // Could be added to UI in the future
      };

      if (activeSet < parseInt(ex.sets)) {
        setActiveSet(prev => prev + 1);
        onComplete(ex.id, false, setData); // Partial complete/timer trigger + data
      } else {
        onComplete(ex.id, true, setData); // Final complete + data
        setIsExpanded(false);
      }
    }
  };

  // Intersection observer for expanded state tracking
  useEffect(() => {
    if (!isExpanded) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Track visibility when expanded for analytics
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
    haptics.light();
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
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={() => {
        if (!completed && !isExpanded) {
          haptics.medium();
          setIsExpanded(true);
          // Activate muscle pump on card click (if premium user)
          if (onActivateMuscle && isPremiumUser) {
            onActivateMuscle(ex.id);
          }
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
        {/* Exercise Image Banner */}
        <div
          className="relative h-40 -mx-6 -mt-6 mb-2 overflow-hidden cursor-pointer group/banner border-b border-yellow-400/20"
          onClick={(e) => {
            e.stopPropagation();
            if (!isExpanded) setIsExpanded(true);
          }}
        >
          <img
            src={ex.image || "/images/zyron-hero-impact.png"}
            alt={ex.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/20 to-transparent" />
          <div className="absolute bottom-3 left-6 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
             <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] drop-shadow-lg">Forma Perfeita</span>
          </div>
        </div>

        {/* Anatomical Muscle Map */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <ExerciseAnatomy
                exerciseId={ex.id}
                activeMuscles={[]}
                view="front"
              />
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
                <span className="text-[10px] font-black tracking-widest uppercase text-neutral-400">{ex.sets} SÉRIES</span>
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
                  <span>Séries Restantes</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl text-yellow-400 font-black tracking-tighter">{Math.max(0, parseInt(ex.sets) - activeSet + (isRunning ? 1 : 1))}</span>
                    <span className="text-[10px] text-neutral-600 font-bold">/ {ex.sets}</span>
                  </div>
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
                  <div className="relative flex items-center justify-center w-full gap-3 my-2">
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLoadChange(-1); }}
                      className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                    >
                      <Minus size={20} />
                    </button>

                    <input
                      type="number"
                      value={load || ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => onUpdateLoad(ex.id, e.target.value)}
                      placeholder="0"
                      className={`w-20 bg-transparent text-center font-black text-4xl italic tracking-tighter outline-none focus:border-b border-yellow-400/50 ${isNewPR ? 'text-emerald-400' : 'text-white'}`}
                    />

                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLoadChange(1); }}
                      className="w-10 h-10 rounded-full bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                    >
                      <Plus size={20} />
                    </button>
                    
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
                  ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_20px_rgba(253,224,71,0.6)] animate-pulse' 
                  : 'bg-neutral-950 text-yellow-400 border-2 border-yellow-400 shadow-[0_0_15px_rgba(0,0,0,0.8)]'
              }`}
            >
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                  {isRunning ? 'Em Execução' : 'Próxima'}
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
