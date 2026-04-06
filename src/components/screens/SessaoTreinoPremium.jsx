import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, Play, Coffee, Flame, ArrowRight, Target, TrendingUp, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { C, Btn, Badge, Card } from '../../styles/ds';

// Muscle accent palette — kept as semantic overrides on top of DS base
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
  userId
}) {
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [anatomyOpen, setAnatomyOpen] = useState(false);
  const cardioTimerRef = useRef(null);

  useEffect(() => {
    if (cardioRunning) {
      cardioTimerRef.current = setInterval(() => {
        setCardioTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(cardioTimerRef.current);
    }
    return () => clearInterval(cardioTimerRef.current);
  }, [cardioRunning]);

  const formatCardioTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExercisesByMuscle = (muscle) => {
    return currentWorkout?.exercises?.filter(ex => ex.group === muscle) || [];
  };

  return (
    <AnimatePresence mode="wait">

      {/* ═══════════════════════════════════════════════════════════════════
          STATE 1: SELECTION MODE — Carousel + Anatomy Preview
          ═══════════════════════════════════════════════════════════════════ */}
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
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] mb-0.5" style={{ color: C.neonDim }}>
                Session Prep
              </p>
              <h2 className="text-[20px] font-black uppercase tracking-tight text-white leading-none flex items-center gap-2">
                <Dumbbell size={17} style={{ color: C.neon }} />
                Rotinas Disponíveis
              </h2>
            </div>

            {/* Carousel */}
            <div className="-mx-4">
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
                              ? `0 0 28px rgba(205,255,90,0.15), 0 12px 32px rgba(0,0,0,0.6)`
                              : '0 12px 32px rgba(0,0,0,0.5)',
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
                              <span className={Badge.neon}>⚡ Hoje</span>
                            </div>
                          )}

                          {/* Card content */}
                          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.22em] block mb-1"
                              style={{ color: C.neonDim }}>{workout.focus}</span>
                            <h3 className="text-white text-[20px] font-black uppercase leading-tight tracking-tight mb-1">
                              {workout.title}
                            </h3>
                            {workout.preCardio && (
                              <p className="text-[10px] font-bold flex items-center gap-1 mb-4"
                                style={{ color: C.textSub }}>
                                <Zap size={9} style={{ color: C.neon }} />
                                {workout.preCardio}
                              </p>
                            )}
                            {!workout.preCardio && <div className="mb-4" />}

                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => { e.stopPropagation(); haptics.heavy(); startSession(parseInt(key)); }}
                              className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] mb-2"
                              style={isToday ? Btn.primary : { ...Btn.secondary, borderRadius: '14px' }}
                            >
                              <span className="font-black text-[11px] uppercase tracking-widest">
                                {isToday ? '⚡ Treino de Hoje' : 'Selecionar'}
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
                                    query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' técnica exercício'
                                  });
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 py-2 rounded-[12px]"
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                            >
                              <Play size={10} style={{ color: C.textSub }} />
                              <span className="text-[9px] font-bold uppercase tracking-widest"
                                style={{ color: C.textSub }}>Pré-visualizar Técnica</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      </SwiperSlide>
                    );
                  })}
              </Swiper>
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
                  <p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: '#FFA040' }}>
                    Dia de Descanso
                  </p>
                  <p className="text-[10px] font-semibold mt-0.5" style={{ color: C.textSub }}>
                    Recuperação ativa recomendada. Hidratação e mobilidade.
                  </p>
                </div>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => { haptics.heavy(); startSession(today); }}
                className="w-full flex items-center justify-between px-4 py-4 rounded-[18px]"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={14} style={{ color: C.neon }} />
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    Iniciar Treino de Hoje
                  </span>
                </div>
                <ArrowRight size={14} style={{ color: C.textSub }} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STATE 2: ACTIVE TRAINING — Full Exercise Session
          ═══════════════════════════════════════════════════════════════════ */}
      {isTraining && (
        <motion.div
          key="active-training"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-3"
        >
          {/* Session header */}
          <motion.div
            className="flex items-center justify-between px-4 py-3 rounded-[18px] sticky top-0 z-30"
            style={{ background: 'rgba(14,14,18,0.92)', border: `1px solid ${C.border}`, backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-0.5"
                style={{ color: C.neonDim }}>Sessão Ativa</p>
              <h2 className="text-[17px] font-black uppercase tracking-tight text-white leading-tight truncate">
                {currentWorkout?.title || 'Treino'}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {restTimer > 0 ? (
                <span className={Badge.neon}>⏱ {restTimer}s</span>
              ) : (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999, fontSize: '8.5px',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em',
                  background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.22)'
                }}>✓ Go</span>
              )}
              <motion.div
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.18)' }}
              >
                <Flame size={14} style={{ color: '#4ADE80' }} />
              </motion.div>
            </div>
          </motion.div>

          {/* Pre-cardio alert */}
          {currentWorkout?.preCardio && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-[14px]"
              style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}
            >
              <Zap size={13} style={{ color: C.neon, flexShrink: 0 }} />
              <span className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: C.neon }}>Aquecimento: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {/* Anatomy — collapsible */}
          {currentWorkout?.exercises?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="overflow-hidden rounded-[18px]"
              style={{ ...Card.style }}
            >
              {/* Toggle header */}
              <button
                onClick={() => setAnatomyOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                style={{ background: 'transparent' }}
              >
                <div className="flex items-center gap-2">
                  <Target size={13} style={{ color: C.neon }} />
                  <span className="text-white font-black uppercase text-[11px] tracking-tight">Músculos Trabalhados</span>
                  {/* Color dots per muscle group */}
                  <div className="flex gap-1 ml-1">
                    {[...new Set(currentWorkout.exercises.map(e => e.group))].map(muscle => {
                      const mc = MUSCLE_COLORS[muscle];
                      return (
                        <span key={muscle} className="w-2 h-2 rounded-full"
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
                    <div className="px-4 pb-4">
                      <div className="scale-95 origin-top rounded-[16px] overflow-hidden">
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

              {/* Muscle filter chips — always visible */}
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMuscle(null)}
                  className="px-3 py-1 rounded-[8px] font-black uppercase text-[9px] tracking-wider transition-all"
                  style={{
                    background: selectedMuscle === null ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
                    color: selectedMuscle === null ? '#fff' : C.textSub,
                    border: selectedMuscle === null ? '1px solid rgba(255,255,255,0.24)' : `1px solid ${C.border}`,
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
                      className="px-3 py-1 rounded-[8px] font-black uppercase text-[9px] tracking-wider transition-all"
                      style={
                        selectedMuscle === muscle
                          ? { background: mc.text, color: '#000', border: `1px solid ${mc.text}` }
                          : allDone
                            ? { background: 'rgba(74,222,128,0.10)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.22)' }
                            : { background: mc.bg, color: mc.text, border: `1px solid ${mc.border}` }
                      }
                    >
                      {allDone ? '✓ ' : ''}{muscle} {completedCount}/{muscleExercises.length}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Exercise list */}
          <div className="space-y-2">
            {!currentWorkout?.exercises?.length ? (
              <div className="flex flex-col items-center justify-center py-14 rounded-[20px]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
                <span className="text-3xl mb-3 opacity-30">☕</span>
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>
                  OFF DAY — Descanso Ativo
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <TrendingUp size={13} style={{ color: C.neon }} />
                  <span className="font-black uppercase text-[10px] tracking-tight" style={{ color: C.textSub }}>
                    Exercícios — {completedExercises.length}/{currentWorkout.exercises.length} concluídos
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
              className="rounded-[20px] overflow-hidden"
              style={{
                background: cardioRunning ? C.neon : 'rgba(14,14,18,0.97)',
                border: cardioRunning ? `1px solid ${C.neon}` : `1px solid ${C.neonBorder}`,
                boxShadow: cardioRunning ? '0 0 24px rgba(205,255,90,0.20)' : 'none',
                padding: '16px',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: cardioRunning ? 'rgba(0,0,0,0.12)' : C.neonBg }}>
                  <Flame size={14} style={{ color: cardioRunning ? '#000' : C.neon }} />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest"
                    style={{ color: cardioRunning ? 'rgba(0,0,0,0.5)' : C.textSub }}>Finalização</p>
                  <p className="text-[12px] font-black uppercase leading-none"
                    style={{ color: cardioRunning ? '#000' : '#fff' }}>{currentWorkout.cardio}</p>
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={(e) => { e.stopPropagation(); setCardioRunning(!cardioRunning); }}
                className="w-full flex items-center justify-between px-4 py-3 rounded-[14px]"
                style={cardioRunning
                  ? { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.10)', color: '#000', borderRadius: '14px' }
                  : { ...Btn.primary, borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
                }
              >
                <span className="font-black text-[11px] uppercase tracking-widest">
                  {cardioRunning ? '■ Finalizar Cardio' : '▶ Iniciar Cardio'}
                </span>
                {cardioRunning && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-black font-mono text-[15px]">{formatCardioTime(cardioTime)}</span>
                  </div>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Finish session */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { haptics.heavy(); setIsTraining(false); }}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-[18px]"
            style={Btn.danger}
          >
            <span className="text-[10.5px] font-black uppercase tracking-widest">🛑 Finalizar Sessão</span>
          </motion.button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
