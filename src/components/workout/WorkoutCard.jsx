import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, CheckCircle2, Trophy, Zap, Plus, Minus, History, Play, Square, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import haptics from '../../utils/haptics';
import ExerciseAnimation from './ExerciseAnimation';
import { EXERCISE_ANIMATIONS, DEFAULT_ANIMATION } from '../../data/exerciseAnimations';

// Cores por grupo muscular - visual hierarchy
const MUSCLE_COLORS = {
  'Peito':      { badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  'Costas':     { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'Perna':      { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'Bíceps':     { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  'Tríceps':    { badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  'Ombro':      { badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  'Abdômen':    { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  'Panturrilha':{ badge: 'bg-teal-500/15 text-teal-400 border-teal-500/30' },
  'Antebraço':  { badge: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
  'Glúteos':    { badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
};

export default function WorkoutCard({
  ex,
  completed,
  onComplete,
  load,
  onUpdateLoad,
  prHistoryLoad,
  showPR,
  videoQuery,
  onActivateMuscle,
  isPremiumUser
}) {
  // Resolve animation data for this exercise
  const animData = EXERCISE_ANIMATIONS[ex.id] || DEFAULT_ANIMATION;
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
      className={`relative bg-neutral-950 backdrop-blur-md border transition-all duration-300 overflow-hidden ${
        completed
          ? 'border-emerald-500/30 opacity-60 rounded-2xl'
          : isExpanded
            ? 'border-yellow-400/60 rounded-3xl shadow-[0_0_25px_rgba(253,224,71,0.08)] z-10'
            : 'border-white/5 hover:border-yellow-400/20 rounded-2xl'
      }`}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onClick={() => {
        if (!completed && !isExpanded) {
          haptics.medium();
          setIsExpanded(true);
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
            className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-emerald-500/10 rounded-3xl z-20 border-2 border-emerald-500"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-5xl mb-2"
            >
              🏆
            </motion.div>
            <span className="text-2xl font-black italic text-emerald-400 uppercase tracking-widest">NOVO RECORDE!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── COLLAPSED STATE — Compact Horizontal Row ─── */}
      {!isExpanded && (
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail animado */}
          <div
            className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer group/thumb border border-white/10 bg-neutral-900"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
              if (onActivateMuscle && isPremiumUser) onActivateMuscle(ex.id);
            }}
          >
            <ExerciseAnimation
              frame0={animData.frame0}
              frame1={animData.frame1}
              frame0fb={animData.frame0fb}
              frame1fb={animData.frame1fb}
              muscles={[]}
              exerciseName={ex.name}
              className="h-16"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-black/40 p-1 rounded-full">
                <Play className="text-yellow-400 fill-yellow-400 opacity-0 group-hover/thumb:opacity-100 transition-opacity" size={12} />
              </div>
            </div>
          </div>

          {/* Informações do exercício */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${MUSCLE_COLORS[ex.group]?.badge || 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'}`}>
                {ex.group}
              </span>
              {completed && (
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">✓ Completo</span>
              )}
            </div>
            <h3 className="text-base font-black uppercase tracking-tight text-white leading-none truncate">
              {ex.name}
            </h3>
            <div className="flex gap-3 mt-1">
              <span className="text-[10px] font-bold text-neutral-500">{ex.sets}×{ex.reps}</span>
              <span className="text-[10px] font-black text-yellow-400">{load || '0'} kg</span>
              {prHistoryLoad && (
                <span className="text-[10px] font-bold text-neutral-600">PR: {prHistoryLoad}kg</span>
              )}
            </div>
          </div>

          {/* Quick check */}
          {!completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete(ex.id, true);
              }}
              className="shrink-0 text-[8px] font-black text-white/20 hover:text-yellow-400 uppercase tracking-widest px-2 py-1 rounded-lg hover:bg-yellow-400/10 transition-all"
            >
              Quick<br/>Check
            </button>
          )}
        </div>
      )}

      {/* ─── EXPANDED STATE — Full Layout ─── */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* ── Banner: Exercise Animation (Treino Mestre style) ── */}
          <div className="relative rounded-t-2xl overflow-hidden bg-neutral-900">
            <ExerciseAnimation
              frame0={animData.frame0}
              frame1={animData.frame1}
              frame0fb={animData.frame0fb}
              frame1fb={animData.frame1fb}
              muscles={animData.muscles || []}
              tip={animData.tip || ''}
              instructions={animData.instructions || []}
              exerciseName={ex.name}
              className="min-h-[160px] max-h-[220px]"
            />
            {/* Fechar — canto superior direito (sobrepõe a animação) */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setShowVideo(false); }}
              className="absolute top-2 right-2 p-1.5 bg-black/70 backdrop-blur-sm rounded-full border border-white/10 text-white/60 hover:text-white transition-all z-30"
            >
              <ChevronUp size={12} />
            </button>
          </div>

          {/* ── Optional YouTube button (secondary) ── */}
          <div className="px-3 pt-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowVideo(v => !v); }}
              className="w-full flex items-center justify-center gap-2 py-1.5 bg-neutral-900 border border-white/5 hover:border-yellow-400/20 rounded-xl transition-all group/yt"
            >
              <Play className="text-red-500 fill-red-500" size={12} />
              <span className="text-[9px] font-black text-neutral-500 group-hover/yt:text-neutral-300 uppercase tracking-widest transition-colors">
                {showVideo ? 'Fechar Vídeo YouTube' : 'Ver no YouTube'}
              </span>
            </button>
          </div>

          {/* Inline YouTube Video (collapse) */}
          <AnimatePresence>
            {showVideo && (
              <React.Fragment>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={(e) => { e.stopPropagation(); setShowVideo(false); }} />
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-black relative z-50 mx-3 mb-2 rounded-xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative aspect-video">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoQuery}?autoplay=1&modestbranding=1&rel=0`}
                      title={ex.name}
                      className="w-full h-full rounded-xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                    <button onClick={(e) => { e.stopPropagation(); setShowVideo(false); }} className="absolute top-2 right-2 p-1.5 bg-black/70 rounded-full text-white hover:bg-red-500 transition-colors z-10">
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              </React.Fragment>
            )}
          </AnimatePresence>

          {/* Info: badge + nome + progress dots */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${MUSCLE_COLORS[ex.group]?.badge || 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'}`}>
                {ex.group}
              </span>
              {/* Progress dots para séries */}
              <div className="flex items-center gap-1">
                {Array.from({ length: parseInt(ex.sets) || 0 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-300 ${
                      i < activeSet - 1
                        ? 'w-2 h-2 bg-emerald-400'
                        : i === activeSet - 1
                          ? 'w-3 h-3 bg-yellow-400 shadow-[0_0_8px_rgba(253,224,71,0.6)]'
                          : 'w-2 h-2 bg-neutral-700'
                    }`}
                  />
                ))}
                <span className="text-[9px] font-black text-neutral-500 ml-1">{activeSet}/{ex.sets}</span>
              </div>
            </div>

            <h3 className="text-lg font-black uppercase tracking-tight italic text-white leading-none mt-1.5">
              {ex.name}
            </h3>

            {/* Reps info */}
            <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest mt-1">
              {ex.reps} repetições
            </p>
          </div>
        </div>
      )}

      {/* Progressive Reveal Box */}
      <AnimatePresence>
        {isExpanded && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">

              {/* Carga — linha horizontal compacta */}
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition-all ${
                isNewPR
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-neutral-900/60 border-white/8'
              }`}>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500">Carga</p>
                  {isNewPR && (
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">🏆 Novo PR!</p>
                  )}
                  {prHistoryLoad && !isNewPR && (
                    <p className="text-[9px] text-neutral-600 font-bold">Ant: {prHistoryLoad}kg</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadChange(-2.5); }}
                    className="w-7 h-7 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-neutral-300 text-xs font-black transition-all"
                  >
                    −
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadChange(-1); }}
                    className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                  >
                    <Minus size={16} />
                  </button>

                  <input
                    type="number"
                    value={load || ''}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => onUpdateLoad(ex.id, e.target.value)}
                    placeholder="0"
                    className={`w-16 bg-transparent text-center font-black text-2xl italic tracking-tighter outline-none ${isNewPR ? 'text-emerald-400' : 'text-white'}`}
                  />

                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadChange(1); }}
                    className="w-8 h-8 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-white transition-all"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleLoadChange(2.5); }}
                    className="w-7 h-7 rounded-lg bg-neutral-800 border border-white/5 flex items-center justify-center active:scale-90 hover:bg-neutral-700 text-neutral-300 text-xs font-black transition-all"
                  >
                    +
                  </button>
                </div>

                <span className={`text-lg font-black tracking-tighter ${isNewPR ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  kg
                </span>
              </div>

              {/* Botão Série — Alta hierarquia visual */}
              <motion.button
                layout
                onClick={(e) => {
                  handleToggleSet(e);
                  if (!isRunning) {
                    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`w-full h-14 rounded-xl flex items-center justify-between px-5 transition-all duration-300 font-black ${
                  isRunning
                    ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_25px_rgba(253,224,71,0.5)]'
                    : 'bg-neutral-900 text-white border-2 border-yellow-400/60 hover:border-yellow-400 hover:bg-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3 leading-none">
                  {isRunning ? (
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-ping shrink-0" />
                  ) : (
                    <Play className={`shrink-0 ${isRunning ? 'fill-neutral-950 text-neutral-950' : 'fill-yellow-400 text-yellow-400'}`} size={18} />
                  )}
                  <div>
                    <span className={`text-[9px] font-black uppercase tracking-widest block ${isRunning ? 'text-neutral-700' : 'text-neutral-500'}`}>
                      {isRunning ? 'Em Execução' : `Série ${activeSet} de ${ex.sets}`}
                    </span>
                    <span className="text-base font-black italic uppercase tracking-tight">
                      {isRunning ? '■ Finalizar Série' : '▶ Iniciar Série'}
                    </span>
                  </div>
                </div>

                {isRunning && (
                  <span className="text-2xl font-black font-mono tracking-tighter text-neutral-950">
                    {formatSetTime(setTimer)}
                  </span>
                )}
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}