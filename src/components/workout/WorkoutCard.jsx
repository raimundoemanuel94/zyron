import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronUp, Check, Sparkles } from 'lucide-react';
import haptics from '../../utils/haptics';
import ExerciseAnimation from './ExerciseAnimation';
import { EXERCISE_ANIMATIONS, DEFAULT_ANIMATION } from '../../data/exerciseAnimations';
import { useExerciseLoads } from '../../hooks/usePersistence';

const ENABLE_EXERCISE_VISUAL_GUIDE = import.meta.env.VITE_ENABLE_EXERCISE_VISUAL_GUIDE !== 'false'; // ligado por padrão

// Cores por grupo muscular - visual hierarchy
const MUSCLE_COLORS = {
  // ─── Grupos originais ────────────────────────────────────
  'Peito':         { badge: 'bg-amber-500/10 text-amber-300 border-amber-500/18' },
  'Costas':        { badge: 'bg-blue-500/10 text-blue-300 border-blue-500/18' },
  'Perna':         { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/18' },
  'Bíceps':        { badge: 'bg-purple-500/10 text-purple-300 border-purple-500/18' },
  'Tríceps':       { badge: 'bg-rose-500/10 text-rose-300 border-rose-500/18' },
  'Ombro':         { badge: 'bg-sky-500/10 text-sky-300 border-sky-500/18' },
  'Abdômen':       { badge: 'bg-orange-500/10 text-orange-300 border-orange-500/18' },
  'Panturrilha':   { badge: 'bg-teal-500/10 text-teal-300 border-teal-500/18' },
  'Antebraço':     { badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/18' },
  'Glúteos':       { badge: 'bg-pink-500/10 text-pink-300 border-pink-500/18' },
  // ─── Grupos PPL + Upper ──────────────────────────────────
  'Quadríceps':    { badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/18' },
  'Isquiotibial':  { badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/18' },
  'Posterior':     { badge: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/18' },
  'Glúteo':        { badge: 'bg-pink-500/10 text-pink-300 border-pink-500/18' },
  'Core':          { badge: 'bg-orange-500/10 text-orange-300 border-orange-500/18' },
  'Face pull':     { badge: 'bg-sky-500/10 text-sky-300 border-sky-500/18' },
};

const clampNumber = (value, min, max) => {
  if (value === '') return '';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return '';
  return String(Math.min(max, Math.max(min, parsed)));
};

const getDefaultReps = (repsRange) => {
  if (!repsRange) return '';
  const match = String(repsRange).match(/\d+/);
  return match ? match[0] : '';
};

const resolveLoadNumber = (rawLoad) => {
  if (rawLoad === null || rawLoad === undefined || rawLoad === '') return 0;

  if (typeof rawLoad === 'object') {
    if (rawLoad && Number.isFinite(Number(rawLoad.kg))) return Number(rawLoad.kg);
    if (rawLoad && Number.isFinite(Number(rawLoad.value))) return Number(rawLoad.value);
    return 0;
  }

  const numeric = Number(rawLoad);
  return Number.isFinite(numeric) ? numeric : 0;
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
  onOpenAnimation,
  isPremiumUser,
  userId
}) {
  // Resolve animation data for this exercise
  const animData = EXERCISE_ANIMATIONS[ex.id] || DEFAULT_ANIMATION;

  // Load persistence with BD sync
  const { updateLoad: persistLoad } = useExerciseLoads(userId);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSet, setActiveSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [setTimer, setSetTimer] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loggedSets, setLoggedSets] = useState([]);
  const [actualReps, setActualReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [rir, setRir] = useState('');
  const [restSeconds, setRestSeconds] = useState(String(ex.rest || 60));
  const [setStatus, setSetStatus] = useState('completed');
  const [setError, setSetError] = useState('');
  const totalSets = parseInt(ex.sets, 10) || 1;
  const normalizedLoad = resolveLoadNumber(load);
  const loadInputValue = load === null || load === undefined
    ? ''
    : (typeof load === 'object' ? String(load?.kg ?? '') : String(load));
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
  };

  const getValidatedSetData = () => {
    const repsValue = parseInt(actualReps, 10);
    const weightValue = resolveLoadNumber(load);
    const rpeValue = rpe === '' ? null : parseInt(rpe, 10);
    const rirValue = rir === '' ? null : parseInt(rir, 10);
    const restValue = parseInt(restSeconds, 10);

    if (!Number.isFinite(repsValue) || repsValue <= 0) {
      return { error: 'Informe as reps reais desta série.' };
    }

    // Bug crítico corrigido: weightValue === 0 passava como válido,
    // salvando séries com carga zero quando o campo estava vazio.
    // Exercícios de peso corporal (type: 'core' — prancha, dead bug,
    // bicicleta abdominal etc) legitimamente não têm carga, então
    // só exigimos peso > 0 para exercícios compound/iso.
    const isBodyweightExercise = ex.type === 'core';
    if (!isBodyweightExercise && (!Number.isFinite(weightValue) || weightValue <= 0)) {
      return { error: 'Informe a carga usada nesta série (kg).' };
    }
    if (isBodyweightExercise && (!Number.isFinite(weightValue) || weightValue < 0)) {
      return { error: 'Confirme a carga usada.' };
    }

    if (rpeValue !== null && (!Number.isFinite(rpeValue) || rpeValue < 1 || rpeValue > 10)) {
      return { error: 'RPE deve ficar entre 1 e 10.' };
    }

    if (rirValue !== null && (!Number.isFinite(rirValue) || rirValue < 0 || rirValue > 10)) {
      return { error: 'RIR deve ficar entre 0 e 10.' };
    }

    if (!Number.isFinite(restValue) || restValue < 0) {
      return { error: 'Confirme o descanso em segundos.' };
    }

    return {
      data: {
        set_number: activeSet,
        weight_kg: weightValue,
        reps: repsValue,
        rpe: rpeValue,
        rir: rirValue,
        rest_seconds: restValue,
        duration_seconds: setTimer || null,
        status: setStatus,
      }
    };
  };

  const resetSetCapture = () => {
    setActualReps('');
    setRpe('');
    setRir('');
    setRestSeconds(String(ex.rest || 60));
    setSetStatus('completed');
    setSetTimer(0);
    setSetError('');
  };

  const registerSet = () => {
    const { data, error } = getValidatedSetData();

    if (error) {
      console.warn('[serie][1][validation-blocked]', {
        exercise_id: ex.id,
        error,
        active_set: activeSet,
        actual_reps: actualReps,
        load_input: load,
      });
      setSetError(error);
      setIsExpanded(true);
      haptics.medium();
      return false;
    }

    setIsRunning(false);
    haptics.success();
    playMetalSound();

    onUpdateLoad(ex.id, String(data.weight_kg));
    setLoggedSets(prev => {
      const next = prev.filter(set => set.set_number !== data.set_number);
      return [...next, data].sort((a, b) => a.set_number - b.set_number);
    });

    if (userId) {
      Promise.resolve(persistLoad(ex.id, ex.name, data.weight_kg, null))
        .catch(err => console.error('Failed to persist load:', err));
    }

    const isFinalSet = data.set_number >= totalSets;

    onComplete(ex.id, isFinalSet, data);

    if (isFinalSet) {
      setIsExpanded(false);
    } else {
      setActiveSet(Math.min(data.set_number + 1, totalSets));
    }

    resetSetCapture();
    return true;
  };

  const handleToggleSet = (e) => {
    e.stopPropagation();
    if (navigator.vibrate) navigator.vibrate(50);

    if (!isRunning) {
      setSetError('');
      setActualReps(prev => prev || getDefaultReps(ex.reps));
      setIsRunning(true);
      setSetTimer(0);
      if (onActivateMuscle && isPremiumUser) {
        onActivateMuscle(ex.id);
      }
      return;
    }

    registerSet();
  };

  useEffect(() => {
    if (!loggedSets.length) return;

    const firstPendingSet = Array.from({ length: totalSets }, (_, index) => index + 1)
      .find(setNumber => !loggedSets.some(set => set.set_number === setNumber));

    if (firstPendingSet && firstPendingSet !== activeSet) {
      setActiveSet(firstPendingSet);
    }
  }, [loggedSets, totalSets, activeSet]);

  useEffect(() => {
    setActiveSet(1);
    setLoggedSets([]);
    setIsRunning(false);
    setShowVideo(false);
    setShowAdvanced(false);
    resetSetCapture();
  }, [ex.id]);

  const isNewPR = parseFloat(load) > (prHistoryLoad || 0);

  // Mantém a tela cheia do exercício sempre sincronizada com o estado atual
  // da série (carga, reps, status) — sem isso o modal ficaria "congelado"
  // no momento em que foi aberto.
  useEffect(() => {
    if (!isExpanded || !onOpenAnimation) return;
    onOpenAnimation(ex, animData, {
      loggedSets, activeSet, totalSets, isRunning, setTimer,
      actualReps, setActualReps, rpe, setRpe, rir, setRir,
      restSeconds, setRestSeconds, setStatus, setSetStatus,
      setError, onToggleSet: handleToggleSet, loadInputValue, onUpdateLoad,
      exerciseId: ex.id, isNewPR, prHistoryLoad,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpanded, loggedSets, activeSet, isRunning, actualReps, rpe, rir, restSeconds, setStatus, setError, loadInputValue]);

  return (
    <motion.div
      layout
      ref={cardRef}
      whileHover={!isExpanded ? { scale: 1.005 } : undefined}
      className={`relative bg-neutral-950/95 backdrop-blur-sm border transition-all duration-200 overflow-hidden ${
        completed
          ? 'border-emerald-300/38 bg-emerald-500/[0.045] rounded-2xl'
          : isExpanded
            ? 'border-yellow-400/26 rounded-[22px] shadow-[0_6px_14px_rgba(0,0,0,0.2)] z-10'
            : 'border-white/7 hover:border-yellow-400/14 rounded-2xl'
      }`}
      style={{
        background: isExpanded
          ? 'linear-gradient(180deg, rgba(18,18,16,0.98), rgba(5,5,6,0.98))'
          : 'linear-gradient(180deg, rgba(15,15,16,0.98), rgba(8,8,9,0.98))',
      }}
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
              PR
            </motion.div>
            <span className="text-2xl font-black italic text-emerald-400 uppercase tracking-widest">NOVO RECORDE!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COLLAPSED STATE - Compact Horizontal Row */}
      {!isExpanded && (
        <div className="relative grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-5">
          <div className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full bg-[#FFFFFF]/55" />
          {/* Thumbnail animado */}
          <div
            className="hidden relative w-16 h-16 rounded-xl overflow-hidden shrink-0 cursor-pointer group/thumb border border-white/10 bg-neutral-900 shadow-inner"
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
          <div className="min-w-0 pl-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.06em] border ${MUSCLE_COLORS[ex.group]?.badge || 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'}`}>
                {ex.group}
              </span>
              <span className="rounded-full border border-white/12 bg-white/[0.03] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-white/75">
                {activeSet}/{ex.sets}
              </span>
              {completed && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/55 bg-emerald-400/16 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.06em] text-emerald-100">
                  <Check size={12} />
                  Completo
                </span>
              )}
            </div>
            <h3 className="text-[20px] font-black tracking-tight text-white leading-[1.1] truncate">
              {ex.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
              <span className="text-[13px] font-semibold text-white/86">{ex.sets} x {ex.reps}</span>
              <span className="text-[13px] font-black text-yellow-300">{normalizedLoad} kg</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-[12px] font-semibold text-white/56">{ex.rest || 60}s descanso</span>
              {prHistoryLoad && (
                <span className="text-[12px] font-semibold text-white/56">PR {prHistoryLoad}kg</span>
              )}
            </div>
          </div>

          {/* Quick check */}
          {!completed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="shrink-0 inline-flex items-center gap-2 rounded-full border border-[#FFFFFF]/28 bg-[#FFFFFF]/10 px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-[#FFFFFF] transition-all duration-200 hover:bg-[#FFFFFF]/14"
            >
              <Sparkles size={14} />
              Registrar
            </button>
          )}
        </div>
      )}

      {/* Expanded state: series logger */}
      {isExpanded && (
        <div className="flex flex-col p-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <span className={`text-[12px] font-black px-2.5 py-1 rounded-full uppercase tracking-[0.06em] border ${MUSCLE_COLORS[ex.group]?.badge || 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30'}`}>
                  {ex.group}
                </span>
                <span className="rounded-full border border-[#FFFFFF]/22 bg-[#FFFFFF]/8 px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.06em] text-[#FFFFFF]">
                  Série {activeSet}/{ex.sets}
                </span>
              </div>
              <h3 className="truncate text-[22px] font-black leading-[1.02] tracking-tight text-white">
                {ex.name}
              </h3>
              <div className="mt-1 flex items-center gap-5 text-[13px]">
                <span className="font-semibold text-white/84">{ex.sets} x {ex.reps}</span>
                <span className="font-black text-yellow-300">{normalizedLoad} kg</span>
              </div>
              <div className="mt-1 flex items-center gap-4 text-[12px] font-semibold text-white/56">
                <span>Descanso {ex.rest || 60}s</span>
                {prHistoryLoad ? <span>PR {prHistoryLoad}kg</span> : null}
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); setShowVideo(false); }}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/55 transition-all hover:text-white"
            >
              <ChevronUp size={13} />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: parseInt(ex.sets) || 0 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    i < activeSet - 1
                      ? 'h-2 w-5 bg-emerald-400/80'
                      : i === activeSet - 1
                        ? 'h-2 w-8 bg-[#FFFFFF] shadow-[0_0_8px_rgba(244,255,58,0.45)]'
                        : 'h-2 w-2 bg-white/12'
                  }`}
                />
              ))}
            </div>
            {ENABLE_EXERCISE_VISUAL_GUIDE && (
              <button
                onClick={(e) => { e.stopPropagation(); onOpenAnimation?.(ex, animData); }}
                className="rounded-full border border-white/14 bg-black/25 px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.06em] text-white/80 transition-all duration-200 hover:text-[#FFFFFF]"
              >
                ▶ Ver movimento
              </button>
            )}
          </div>
        </div>
      )}

      {/* Series logger */}
      <AnimatePresence>
        {isExpanded && !completed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="rounded-2xl border border-[#FFFFFF]/18 bg-[#FFFFFF]/[0.035] p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.06em] text-[#FFFFFF]/85">Série atual</p>
                    <p className="mt-1 text-[14px] font-black uppercase tracking-tight text-white">
                      Série {activeSet} de {totalSets}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSetStatus(prev => prev === 'completed' ? 'failed' : 'completed');
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.06em] transition-all duration-200 ${
                      setStatus === 'failed'
                        ? 'border-red-400/50 bg-red-500/16 text-red-200'
                        : 'border-emerald-400/35 bg-emerald-400/10 text-emerald-300'
                    }`}
                  >
                    {setStatus === 'failed' ? 'Falha' : 'Feita'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                    <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-white/72">Carga usada</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        inputMode="decimal"
                        value={loadInputValue}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setSetError('');
                          onUpdateLoad(ex.id, e.target.value);
                        }}
                        placeholder="0"
                        className="w-full bg-transparent text-xl font-black text-white outline-none"
                      />
                      <span className="text-[12px] font-black text-[#FFFFFF]">kg</span>
                    </div>
                  </label>

                  <label className="rounded-xl border border-white/10 bg-black/35 px-3 py-2">
                    <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-white/72">Reps feitas</span>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={actualReps}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSetError('');
                        setActualReps(clampNumber(e.target.value, 0, 999));
                      }}
                      placeholder={getDefaultReps(ex.reps) || '0'}
                      className="mt-1 w-full bg-transparent text-xl font-black text-white outline-none"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-black/25 px-3 py-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-black uppercase tracking-[0.06em] text-white/72">Séries do exercício</span>
                  <span className="text-[12px] font-black uppercase tracking-[0.06em] text-white/60">
                    {loggedSets.length}/{totalSets} salvas
                  </span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {Array.from({ length: totalSets }).map((_, index) => {
                    const setNumber = index + 1;
                    const logged = loggedSets.find(set => set.set_number === setNumber);
                    const isActiveSet = setNumber === activeSet;

                    return (
                      <div
                        key={setNumber}
                        className={`min-w-[82px] rounded-xl border px-2 py-2 ${
                          logged?.status === 'failed'
                            ? 'border-red-400/35 bg-red-500/10'
                            : logged
                              ? 'border-emerald-400/30 bg-emerald-400/10'
                              : isActiveSet
                                ? 'border-[#FFFFFF]/45 bg-[#FFFFFF]/10'
                                : 'border-white/8 bg-white/[0.025]'
                        }`}
                      >
                        <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-white/72">S{setNumber}</span>
                        <span className="mt-1 block text-[12px] font-black text-white/85">
                          {logged ? `${logged.weight_kg}kg x ${logged.reps}` : isActiveSet ? 'Agora' : 'A fazer'}
                        </span>
                        <span className={`mt-1 block text-[12px] font-black uppercase tracking-[0.06em] ${
                          logged?.status === 'failed'
                            ? 'text-red-300'
                            : logged
                              ? 'text-emerald-300'
                              : isActiveSet
                                ? 'text-[#FFFFFF]'
                                : 'text-white/22'
                        }`}
                        >
                          {logged ? (logged.status === 'failed' ? 'Falha' : 'Feita') : isActiveSet ? 'Atual' : 'Pendente'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2">
                <label>
                    <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-white/72">Descanso após a série</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={restSeconds}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        setSetError('');
                        setRestSeconds(clampNumber(e.target.value, 0, 999));
                      }}
                      className="w-20 bg-transparent text-base font-black text-white outline-none"
                    />
                    <span className="text-[12px] font-black uppercase text-[#FFFFFF]">s</span>
                  </div>
                </label>

                {isRunning && (
                  <span className="rounded-full border border-[#FFFFFF]/30 bg-[#FFFFFF]/10 px-3 py-1.5 font-mono text-sm font-black text-[#FFFFFF]">
                    {formatSetTime(setTimer)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowAdvanced(prev => !prev); }}
                className="w-full rounded-xl border border-white/8 bg-white/[0.025] px-3 py-2 text-left text-[12px] font-black uppercase tracking-[0.06em] text-white/75 transition-all duration-200 hover:text-[#FFFFFF]"
              >
                {showAdvanced ? 'Ocultar detalhes' : '+ Detalhes: RPE / RIR'}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="grid grid-cols-2 gap-2 overflow-hidden"
                  >
                    <label className="rounded-xl bg-white/[0.035] border border-white/8 px-3 py-2">
                      <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-neutral-400">RPE opcional</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        inputMode="numeric"
                        value={rpe}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setSetError('');
                          setRpe(clampNumber(e.target.value, 1, 10));
                        }}
                        placeholder="1-10"
                        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
                      />
                    </label>

                    <label className="rounded-xl bg-white/[0.035] border border-white/8 px-3 py-2">
                      <span className="block text-[12px] font-black uppercase tracking-[0.06em] text-neutral-400">RIR opcional</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        inputMode="numeric"
                        value={rir}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          setSetError('');
                          setRir(clampNumber(e.target.value, 0, 10));
                        }}
                        placeholder="0-10"
                        className="mt-1 w-full bg-transparent text-lg font-black text-white outline-none"
                      />
                    </label>
                  </motion.div>
                )}
              </AnimatePresence>

              {(isNewPR || prHistoryLoad) && (
                <p className={`rounded-xl border px-3 py-2 text-[12px] font-black uppercase tracking-[0.06em] ${
                  isNewPR
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-white/8 bg-white/[0.025] text-white/35'
                }`}
                >
                  {isNewPR ? 'Novo PR de carga neste exercício.' : `Carga anterior: ${prHistoryLoad}kg`}
                </p>
              )}

              {setError && (
                <p className="rounded-xl border border-red-500/30 bg-red-950/30 px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] text-red-300">
                  {setError}
                </p>
              )}

              <motion.button
                layout
                whileHover={{ scale: 1.01 }}
                onClick={(e) => {
                  handleToggleSet(e);
                  if (!isRunning) {
                    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`w-full h-14 rounded-2xl flex items-center justify-between px-4 transition-all duration-200 font-black ${
                  isRunning
                    ? 'bg-emerald-400 text-neutral-950 border border-emerald-300 shadow-[0_0_14px_rgba(74,222,128,0.25)]'
                    : 'bg-[#11140b] text-[#FFFFFF] border-2 border-[#FFFFFF]/55 hover:bg-[#171d0f]'
                }`}
              >
                <div className="flex items-center gap-3 leading-none">
                  {isRunning ? (
                    <div className="h-2 w-2 shrink-0 rounded-full bg-red-600 animate-ping" />
                  ) : (
                    <Play className="shrink-0 fill-[#FFFFFF] text-[#FFFFFF]" size={16} />
                  )}
                  <div className="text-left">
                    <span className={`block text-[12px] font-black uppercase tracking-[0.06em] ${isRunning ? 'text-neutral-800' : 'text-white/75'}`}>
                      Série {activeSet} de {totalSets}
                    </span>
                    <span className="text-[14px] font-black uppercase tracking-[0.06em]">
                      {isRunning ? 'Concluir série' : 'Iniciar série'}
                    </span>
                  </div>
                </div>

                {!isRunning && (
                  <span className="text-[12px] font-black uppercase tracking-[0.06em] text-white/72">
                    {setStatus === 'failed' ? 'Falha' : 'Feita'}
                  </span>
                )}
                {isRunning && <Check size={18} className="text-neutral-900" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
