import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, Play, Coffee, Flame, ArrowRight, Target, TrendingUp, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { C, Btn, Badge, Card } from '../../styles/ds';

// Muscle accent palette - semantic overrides on top of DS base
const MUSCLE_COLORS = {
  'Peito':       { bg: 'rgba(245,158,11,0.14)',  text: '#F59E0B', border: 'rgba(245,158,11,0.30)' },
  'Costas':      { bg: 'rgba(59,130,246,0.14)',   text: '#7DA1FF', border: 'rgba(59,130,246,0.30)' },
  'Perna':       { bg: 'rgba(52,211,153,0.14)',   text: '#34D399', border: 'rgba(52,211,153,0.30)' },
  'Bíceps':      { bg: 'rgba(139,92,246,0.14)',   text: '#A78BFA', border: 'rgba(139,92,246,0.30)' },
  'Tríceps':     { bg: 'rgba(251,113,133,0.14)',  text: '#FB7185', border: 'rgba(251,113,133,0.30)' },
  'Ombro':       { bg: 'rgba(56,189,248,0.14)',   text: '#38BDF8', border: 'rgba(56,189,248,0.30)' },
  'Abdômen':     { bg: 'rgba(251,146,60,0.14)',   text: '#FB923C', border: 'rgba(251,146,60,0.30)' },
  'Panturrilha': { bg: 'rgba(45,212,191,0.14)',   text: '#2DD4BF', border: 'rgba(45,212,191,0.30)' },
  'Glúteos':     { bg: 'rgba(244,114,182,0.14)',  text: '#F472B6', border: 'rgba(244,114,182,0.30)' },
};

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

import AnatomyMap2D from '../anatomy/AnatomyMap2D';
import WorkoutCard from '../workout/WorkoutCard';
import { EXERCISE_VIDEOS } from './FichaDeTreinoScreen';
import haptics from '../../utils/haptics';

/**
 * SESSAO TREINO PREMIUM
 * Merged screen combining:
 * - Workout selection carousel (Tela de Treino)
 * - Interactive anatomy visualization (Tela de Exercícios)
 * - Active training session management
 * - Premium academy-style interface
 */
export default function SessaoTreinoPremium({
  today,
  workoutData,
  startSession,
  setVideoModal,
  isTraining,
  setIsTraining,
  currentWorkout,
  completedExercises,
  restTimer,
  handleExerciseComplete,
  loads,
  updateLoad,
  prHistory,
  showPR,
  onActivateMuscle,
  isPremiumUser,
  currentExerciseId,
  activePrimaryMuscles,
  activeMuscles,
  userId,
  cardioSession,
  onStartCardio,
  onStopCardio,
  isCardioSyncing = false,
}) {
  const [cardioDisplaySeconds, setCardioDisplaySeconds] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const [confirmFinishArmed, setConfirmFinishArmed] = useState(false);
  const finishConfirmTimeoutRef = useRef(null);
  const cardioTickRef = useRef(null);
  const cardioRunning = cardioSession?.status === 'active';
  const cardioStartedAt = cardioSession?.started_at || null;
  const cardioBaseSeconds = Number(cardioSession?.duration_seconds || 0);

  useEffect(() => {
    if (cardioTickRef.current) {
      clearInterval(cardioTickRef.current);
      cardioTickRef.current = null;
    }

    if (!cardioRunning || !cardioStartedAt) {
      setCardioDisplaySeconds(cardioBaseSeconds > 0 ? cardioBaseSeconds : 0);
      return undefined;
    }

    const startMs = new Date(cardioStartedAt).getTime();
    if (!Number.isFinite(startMs)) {
      setCardioDisplaySeconds(cardioBaseSeconds > 0 ? cardioBaseSeconds : 0);
      return undefined;
    }

    const applyTick = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
      const next = Math.max(cardioBaseSeconds, elapsed);
      setCardioDisplaySeconds(next);
    };

    applyTick();
    cardioTickRef.current = setInterval(applyTick, 1000);

    return () => {
      if (cardioTickRef.current) {
        clearInterval(cardioTickRef.current);
        cardioTickRef.current = null;
      }
    };
  }, [cardioRunning, cardioStartedAt, cardioBaseSeconds]);

  useEffect(() => {
    if (!isTraining) {
      setConfirmFinishArmed(false);
      if (finishConfirmTimeoutRef.current) {
        clearTimeout(finishConfirmTimeoutRef.current);
        finishConfirmTimeoutRef.current = null;
      }
    }
  }, [isTraining]);

  useEffect(() => () => {
    if (cardioTickRef.current) {
      clearInterval(cardioTickRef.current);
      cardioTickRef.current = null;
    }
    if (finishConfirmTimeoutRef.current) {
      clearTimeout(finishConfirmTimeoutRef.current);
      finishConfirmTimeoutRef.current = null;
    }
  }, []);

  const formatCardioTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExercisesByMuscle = (muscle) => {
    return currentWorkout?.exercises?.filter(ex => ex.group === muscle) || [];
  };

  const handleFinishSessionPress = () => {
    if (!confirmFinishArmed) {
      setConfirmFinishArmed(true);
      haptics.medium();
      if (finishConfirmTimeoutRef.current) {
        clearTimeout(finishConfirmTimeoutRef.current);
      }
      finishConfirmTimeoutRef.current = setTimeout(() => {
        setConfirmFinishArmed(false);
        finishConfirmTimeoutRef.current = null;
      }, 4200);
      return;
    }

    if (finishConfirmTimeoutRef.current) {
      clearTimeout(finishConfirmTimeoutRef.current);
      finishConfirmTimeoutRef.current = null;
    }
    haptics.heavy();
    setIsTraining(false);
  };

  const workoutEntries = Object.entries(workoutData)
    .filter(([key, workout]) => key !== '0' && key !== '6' && workout.exercises.length > 0);
  const todayEntry = workoutEntries.find(([key]) => today === parseInt(key));
  const secondaryWorkouts = workoutEntries.filter(([key]) => key !== String(today));
  const exerciseTotal = currentWorkout?.exercises?.length || 0;
  const completedTotal = currentWorkout?.exercises?.filter(ex => completedExercises.includes(ex.id)).length || 0;
  const progressPercent = exerciseTotal > 0 ? Math.round((completedTotal / exerciseTotal) * 100) : 0;

  return (
    <AnimatePresence mode="wait">

      {/* STATE 1: SELECTION MODE - Carousel + Anatomy Preview */}
      {!isTraining && (
        <motion.div
          key="session-selection"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* Header */}
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-1 pt-1 pb-2">
              <p className="text-[12px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: C.neonDim }}>
                Preparação da sessão
              </p>
              <h2 className="text-[20px] font-black uppercase tracking-tight text-white leading-none flex items-center gap-2">
                <Dumbbell size={17} style={{ color: C.neon }} />
                Rotinas Disponíveis
              </h2>
            </div>

            {/* Carousel */}
            <div className="-mx-4 hidden">
              <Swiper
                effect="coverflow"
                grabCursor
                centeredSlides
                slidesPerView="auto"
                coverflowEffect={{ rotate: 28, stretch: 0, depth: 90, modifier: 1, slideShadows: true }}
                modules={[EffectCoverflow]}
                className="w-full py-8"
              >
                {Object.entries(workoutData)
                  .filter(([key]) => key !== '0' && key !== '6' && workoutData[key].exercises.length > 0)
                  .map(([key, workout]) => {
                    const isToday = today === parseInt(key);
                    return (
                      <SwiperSlide key={key} className="w-[270px]">
                        <motion.div
                          whileTap={{ scale: 0.97 }}
                          className="relative h-[370px] rounded-[24px] overflow-hidden"
                          style={{
                            border: isToday
                              ? `1.5px solid ${C.neon}`
                              : '1.5px solid rgba(255,255,255,0.08)',
                            boxShadow: isToday
                              ? `0 0 16px rgba(205,255,90,0.14), 0 8px 20px rgba(0,0,0,0.4)`
                              : '0 8px 18px rgba(0,0,0,0.35)',
                          }}
                        >
                          {/* Background Image */}
                          <img
                            src={workout.image || '/images/chest.png'}
                            className="absolute inset-0 w-full h-full object-cover opacity-55"
                            alt={workout.title}
                            style={{ filter: 'grayscale(0.3)' }}
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, rgba(6,6,8,1) 0%, rgba(6,6,8,0.5) 45%, transparent 100%)' }} />

                          {/* Exercise count badge */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className={Badge.neutral}>
                              {workout.exercises.length} exercícios
                            </span>
                          </div>

                          {/* Today badge */}
                          {isToday && (
                            <div className="absolute top-3 right-3 z-10">
                              <span className={Badge.neon}>Hoje</span>
                            </div>
                          )}

                          {/* Card content */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                            <span className="text-[12px] font-black uppercase tracking-[0.12em] block mb-1"
                              style={{ color: 'rgba(255,255,255,0.72)' }}>{workout.focus}</span>
                            <h3 className="text-white text-[20px] font-black uppercase leading-tight tracking-tight mb-1">
                              {workout.title}
                            </h3>
                            {workout.preCardio && (
                              <p className="text-[12px] font-bold flex items-center gap-1 mb-4"
                                style={{ color: C.textSub }}>
                                <Zap size={9} style={{ color: C.neon }} />
                                {workout.preCardio}
                              </p>
                            )}
                            {!workout.preCardio && <div className="mb-4" />}

                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); haptics.heavy(); startSession(parseInt(key)); }}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] mb-2 transition-transform duration-200"
                              style={isToday ? Btn.primary : { ...Btn.secondary, borderRadius: '14px' }}
                            >
                              <span className="font-black text-[12px] uppercase tracking-[0.12em]">
                                {isToday ? 'Treino de hoje' : 'Selecionar'}
                              </span>
                              <Play size={12} />
                            </motion.button>

                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                const firstEx = workout.exercises[0];
                                if (firstEx) {
                                  setVideoModal({
                                    name: `Técnica: ${firstEx.name}`,
                                    query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' tecnica exercicio'
                                  });
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[12px] transition-transform duration-200"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              <Play size={10} style={{ color: C.textSub }} />
                              <span className="text-[12px] font-bold uppercase tracking-[0.08em]"
                                style={{ color: C.textSub }}>Pré-visualizar técnica</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      </SwiperSlide>
                    );
                  })}
              </Swiper>
            </div>

            {todayEntry && (
              <motion.div
                whileTap={{ scale: 0.98 }}
                className="relative overflow-hidden rounded-[22px] border"
                style={{
                  minHeight: 250,
                  borderColor: 'rgba(244,255,58,0.34)',
                  background: 'linear-gradient(180deg, rgba(24,24,18,0.98), rgba(6,6,7,0.98))',
                  boxShadow: '0 18px 44px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <img
                  src={todayEntry[1].image || '/images/chest.png'}
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                  alt={todayEntry[1].title}
                  style={{ filter: 'grayscale(0.45) contrast(1.08)' }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94)_0%,rgba(0,0,0,0.72)_52%,rgba(0,0,0,0.34)_100%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-[#F4FF3A]/60" />

                <div className="relative z-10 flex h-full min-h-[250px] flex-col justify-between p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-flex rounded-full border border-[#F4FF3A]/32 bg-[#F4FF3A]/12 px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.1em] text-[#F4FF3A]">
                        Treino de hoje
                      </span>
                      <p className="mt-3 text-[12px] font-black uppercase tracking-[0.12em] text-white/70">
                        {todayEntry[1].focus}
                      </p>
                      <h3 className="mt-1 max-w-[230px] text-[24px] font-black uppercase leading-[0.94] tracking-tight text-white">
                        {todayEntry[1].title}
                      </h3>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-right">
                      <p className="text-[18px] font-black leading-none text-white">{todayEntry[1].exercises.length}</p>
                      <p className="mt-1 text-[12px] font-black uppercase tracking-[0.08em] text-white/65">exerc.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {todayEntry[1].preCardio && (
                      <p className="inline-flex items-center gap-2 rounded-full border border-[#F4FF3A]/18 bg-black/30 px-3 py-1.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white/80">
                        <Zap size={11} className="text-[#F4FF3A]" />
                        {todayEntry[1].preCardio}
                      </p>
                    )}
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); haptics.heavy(); startSession(parseInt(todayEntry[0])); }}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#F4FF3A] px-4 py-3.5 text-[13px] font-black uppercase tracking-[0.1em] text-black shadow-[0_0_14px_rgba(244,255,58,0.2)] transition-transform duration-200"
                      >
                        <Play size={13} className="fill-black" />
                        Iniciar
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstEx = todayEntry[1].exercises[0];
                          if (firstEx) {
                            setVideoModal({
                              name: `Técnica: ${firstEx.name}`,
                              query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' tecnica exercicio'
                            });
                          }
                        }}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-white/75 transition-transform duration-200"
                      >
                        Técnica
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="space-y-2">
              <p className="px-1 text-[12px] font-black uppercase tracking-[0.12em] text-white/60">Outras rotinas</p>
              <div className="grid grid-cols-1 gap-2">
                {secondaryWorkouts.map(([key, workout]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { haptics.medium(); startSession(parseInt(key)); }}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-left transition-all duration-200 hover:border-[#F4FF3A]/25 hover:bg-white/[0.04]"
                  >
                    <img
                      src={workout.image || '/images/chest.png'}
                      alt={workout.title}
                      className="h-14 w-14 rounded-xl object-cover opacity-80"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-black uppercase tracking-[0.08em] text-white/65">{workout.focus}</p>
                      <h4 className="truncate text-[14px] font-black uppercase leading-tight text-white">{workout.title}</h4>
                      <p className="mt-0.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#F4FF3A]/85">{workout.exercises.length} exercícios</p>
                    </div>
                    <ArrowRight size={14} className="text-white/30" />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Rest day banner or quick-start */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {today === 0 || today === 6 ? (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-[18px]"
                style={{ background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.16)' }}>
                <Coffee size={14} style={{ color: '#FFA040' }} />
                <div>
                  <p className="text-[12px] font-black uppercase tracking-[0.1em]" style={{ color: '#FFA040' }}>
                    Dia de Descanso
                  </p>
                  <p className="text-[12px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    Recuperação ativa recomendada. Hidratação e mobilidade.
                  </p>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { haptics.heavy(); startSession(today); }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-[18px] transition-transform duration-200"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={14} style={{ color: C.neon }} />
                  <span className="text-[12px] font-black uppercase tracking-[0.1em] text-white">
                    Iniciar Treino de Hoje
                  </span>
                </div>
                <ArrowRight size={14} style={{ color: C.textSub }} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* STATE 2: ACTIVE TRAINING - Full Exercise Session */}
      {isTraining && (
        <motion.div
          key="active-training"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-5"
        >
          {/* Session header */}
          <motion.div
            className="sticky top-0 z-30 flex items-start justify-between overflow-hidden rounded-[20px] border px-4 pt-3 pb-4"
            style={{
              background: 'linear-gradient(180deg, rgba(13,13,12,0.94), rgba(7,7,8,0.94))',
              borderColor: 'rgba(255,255,255,0.09)',
              backdropFilter: 'blur(7px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'rgba(255,255,255,0.52)' }}>Sessão ativa</p>
              <h2 className="text-[19px] font-black tracking-tight text-white leading-tight truncate">
                {currentWorkout?.title || 'Treino'}
              </h2>
              <p className="mt-1 text-[12px] font-semibold text-white/66">
                {completedTotal}/{exerciseTotal} exercícios concluídos
              </p>
            </div>
            <div className="flex items-center gap-1 ml-3 shrink-0 pt-0.5">
              {restTimer > 0 ? (
                <span
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-black uppercase tracking-[0.06em]"
                  style={{
                    borderColor: 'rgba(244,255,58,0.3)',
                    background: 'rgba(244,255,58,0.09)',
                    color: '#E9F9A8',
                  }}
                >
                  ⏱ {restTimer}s
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '4px 9px', borderRadius: 999, fontSize: '12px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                  background: 'rgba(74,222,128,0.08)', color: '#86EFAC', border: '1px solid rgba(74,222,128,0.20)'
                }}>✓ Pronto</span>
              )}
              <motion.div
                className="flex h-6 w-6 items-center justify-center rounded-[8px]"
                style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.12)' }}
              >
                <Flame size={11} style={{ color: '#6EE7B7' }} />
              </motion.div>
            </div>
            <div className="absolute inset-x-4 bottom-2 h-[3px] overflow-hidden rounded-full bg-white/[0.045]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #B4FF3C 0%, #F4FF3A 100%)' }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>

          {/* Pre-cardio alert */}
          {currentWorkout?.preCardio && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-[16px]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <Zap size={13} style={{ color: '#D9F99D', flexShrink: 0 }} />
                <span className="text-[12px] font-black uppercase tracking-[0.08em]"
                  style={{ color: '#D9F99D' }}>Aquecimento: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {/* Anatomy - collapsible */}
          {currentWorkout?.exercises?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] px-3.5 py-3"
            >
              {/* Toggle header */}
              <button
                onClick={() => setAnatomyOpen(v => !v)}
                className="w-full flex items-center justify-between transition-colors"
                style={{ background: 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <Target size={12} className="text-[#F4FF3A]" />
                  <span className="text-[12px] font-black uppercase tracking-[0.1em] text-white/78">Filtros</span>
                  {/* Color dots per muscle group */}
                  <div className="flex gap-1 ml-1.5">
                    {[...new Set(currentWorkout.exercises.map(e => e.group))].map(muscle => {
                      const mc = MUSCLE_COLORS[muscle];
                      return (
                        <span key={muscle} className="w-1.5 h-1.5 rounded-full opacity-85"
                          style={{ background: mc?.text || C.neon }} />
                      );
                    })}
                  </div>
                </div>
                <motion.div animate={{ rotate: anatomyOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={15} style={{ color: C.textSub }} />
                </motion.div>
              </button>

              {/* Anatomy map */}
              <AnimatePresence>
                {anatomyOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 pb-2">
                      <div className="max-h-[210px] overflow-hidden rounded-[14px] border border-white/7 bg-black/30">
                        <AnatomyMap2D
                          activeGroup={
                            isPremiumUser && activePrimaryMuscles?.length > 0
                              ? activePrimaryMuscles[0]
                              : currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group
                          }
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Muscle filter chips - always visible */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMuscle(null)}
                  className="shrink-0 inline-flex items-center px-3.5 py-2.5 rounded-full font-black uppercase text-[12px] tracking-[0.06em] transition-all duration-200"
                  style={{
                    background: selectedMuscle === null ? '#F4FF3A' : 'rgba(255,255,255,0.03)',
                    color: selectedMuscle === null ? '#0a0a0a' : 'rgba(255,255,255,0.78)',
                    border: selectedMuscle === null ? '1px solid rgba(244,255,58,0.94)' : '1px solid rgba(255,255,255,0.12)',
                    boxShadow: selectedMuscle === null ? '0 0 14px rgba(244,255,58,0.2)' : 'none',
                  }}
                >
                  Todos
                </motion.button>

                {[...new Set(currentWorkout.exercises.map(e => e.group))].map(muscle => {
                  const muscleExercises = getExercisesByMuscle(muscle);
                  const completedCount = muscleExercises.filter(e => completedExercises.includes(e.id)).length;
                  const allDone = completedCount === muscleExercises.length;
                  const mc = MUSCLE_COLORS[muscle] || { bg: C.neonBg, text: C.neon, border: C.neonBorder };

                  return (
                    <motion.button
                      key={muscle}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                      className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 rounded-full font-black uppercase text-[12px] tracking-[0.06em] transition-all duration-200"
                      style={
                        selectedMuscle === muscle
                          ? {
                              background: mc.text,
                              color: '#0a0a0a',
                              border: `1px solid ${mc.text}`,
                              boxShadow: '0 0 14px rgba(255,255,255,0.08)',
                            }
                          : allDone
                            ? { background: 'rgba(74,222,128,0.08)', color: '#A7F3D0', border: '1px solid rgba(74,222,128,0.28)' }
                            : { background: 'rgba(255,255,255,0.015)', color: 'rgba(255,255,255,0.78)', border: '1px solid rgba(255,255,255,0.12)' }
                      }
                    >
                      <span className="leading-none">{allDone ? `✓ ${muscle}` : muscle}</span>
                      <span
                        className="inline-flex items-center justify-center min-w-[26px] rounded-full px-1.5 py-[2px] text-[11px] font-black"
                        style={
                          selectedMuscle === muscle
                            ? { background: 'rgba(0,0,0,0.18)', color: '#0a0a0a' }
                            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.82)' }
                        }
                      >
                        {completedCount}/{muscleExercises.length}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Exercise list */}
          <div className="space-y-4">
            {!currentWorkout?.exercises?.length ? (
              <div className="flex flex-col items-center justify-center py-14 rounded-[20px]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <span className="text-3xl mb-3 opacity-30">☕</span>
                <p className="text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                  Dia de descanso - recuperação ativa
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between px-1 pb-1">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.08em] text-[#F4FF3A]/82">Execução</p>
                    <h3 className="text-[18px] font-black uppercase leading-none text-white">Exercícios</h3>
                  </div>
                  <span className="rounded-full border border-white/18 bg-white/[0.04] px-3 py-1.5 text-[12px] font-black uppercase tracking-[0.06em] text-white/82">
                    {completedExercises.length}/{currentWorkout.exercises.length}
                  </span>
                </div>

                <div className="hidden items-center gap-2 px-1 pb-1">
                  <TrendingUp size={13} style={{ color: C.neon }} />
                  <span className="font-black uppercase text-[12px] tracking-[0.06em]" style={{ color: C.textSub }}>
                    Exercícios - {completedExercises.length}/{currentWorkout.exercises.length} concluídos
                  </span>
                </div>

                {currentWorkout.exercises
                  .filter(ex => !selectedMuscle || ex.group === selectedMuscle)
                  .map((ex, i) => (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <WorkoutCard
                        ex={ex}
                        completed={completedExercises.includes(ex.id)}
                        onComplete={handleExerciseComplete}
                        load={loads[ex.id]}
                        onUpdateLoad={updateLoad}
                        prHistoryLoad={prHistory[ex.id]}
                        showPR={showPR}
                        videoQuery={EXERCISE_VIDEOS[ex.id] || 'vcBig73oqpE'}
                        onActivateMuscle={onActivateMuscle}
                        isPremiumUser={isPremiumUser}
                        userId={userId}
                      />
                    </motion.div>
                  ))}
              </>
            )}
          </div>

          {/* Cardio finisher */}
          {currentWorkout?.cardio && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="rounded-2xl overflow-hidden border"
              style={{
                background: cardioRunning
                  ? 'linear-gradient(180deg, rgba(18,22,17,0.98), rgba(7,7,8,0.98))'
                  : 'linear-gradient(180deg, rgba(16,16,18,0.98), rgba(8,8,9,0.98))',
                borderColor: cardioRunning ? 'rgba(52,211,153,0.28)' : 'rgba(255,255,255,0.08)',
                boxShadow: cardioRunning ? '0 6px 14px rgba(0,0,0,0.2)' : 'none',
                padding: '16px',
              }}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/12 bg-white/[0.03]">
                    <Flame size={14} className={cardioRunning ? 'text-emerald-300' : 'text-[#D9F99D]'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.78)' }}>Cardio final</p>
                    <p className="truncate text-[12px] font-black uppercase leading-none text-white">{currentWorkout.cardio}</p>
                  </div>
                </div>
                {cardioRunning && (
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-400/12 px-3 py-1 text-[12px] font-black font-mono text-emerald-200">
                    {formatCardioTime(cardioDisplaySeconds)}
                  </span>
                )}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isCardioSyncing) return;
                  if (cardioRunning) {
                    await onStopCardio?.();
                    return;
                  }
                  await onStartCardio?.();
                }}
                disabled={isCardioSyncing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
                style={cardioRunning
                  ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.32)', color: '#A7F3D0' }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.14)', color: '#D9F99D', boxShadow: 'none' }
                }
              >
                <span className="font-black text-[12px] uppercase tracking-[0.08em]">
                  {isCardioSyncing
                    ? (cardioRunning ? 'Finalizando cardio...' : 'Iniciando cardio...')
                    : (cardioRunning ? 'Finalizar cardio' : 'Iniciar cardio')}
                </span>
                {cardioRunning && (
                  <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Finish session */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFinishSessionPress}
            className={`w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-[18px] border transition-all duration-200 ${
              confirmFinishArmed
                ? 'bg-red-500/10 border-red-300/34 text-red-100'
                : 'bg-transparent border-red-400/20 text-red-200'
            }`}
          >
            <span className="text-[12px] font-black uppercase tracking-[0.08em]">
              {confirmFinishArmed ? 'Toque novamente para finalizar' : 'Finalizar sessão'}
            </span>
          </motion.button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
