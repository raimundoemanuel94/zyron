import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, Play, Flame, ChevronRight, Coffee } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import { C, Btn, Badge } from '../../styles/ds';

import AnatomyMap2D from '../anatomy/AnatomyMap2D';
import WorkoutCard from '../workout/WorkoutCard';
import { EXERCISE_VIDEOS } from '../screens/FichaDeTreinoScreen';
import haptics from '../../utils/haptics';

export default function TabTreino({
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
}) {
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime] = useState(0);
  const cardioTimerRef = useRef(null);

  useEffect(() => {
    if (cardioRunning) {
      cardioTimerRef.current = setInterval(() => setCardioTime(p => p + 1), 1000);
    } else {
      clearInterval(cardioTimerRef.current);
    }
    return () => clearInterval(cardioTimerRef.current);
  }, [cardioRunning]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;
  const isRestDay = today === 0 || today === 6;

  return (
    <AnimatePresence mode="wait">

      {/* ══ 1. SELEÇÃO DE ROTINA ══════════════════════════════════════════ */}
      {!isTraining && (
        <motion.div
          key="routine-list"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-[14px] shrink-0"
              style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}>
              <Dumbbell size={17} style={{ color: C.neon }} />
            </div>
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-tight text-white leading-none">
                Selecionar Rotina
              </h3>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5"
                style={{ color: C.textSub }}>ZYRON Session Prep</p>
            </div>
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
                .filter(([k]) => k !== '0' && k !== '6' && workoutData[k].exercises.length > 0)
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
                        <img
                          src={workout.image || '/images/chest.png'}
                          className="absolute inset-0 w-full h-full object-cover opacity-55"
                          alt={workout.title}
                          style={{ filter: 'grayscale(0.3)' }}
                        />
                        <div className="absolute inset-0"
                          style={{ background: 'linear-gradient(to top, rgba(6,6,8,1) 0%, rgba(6,6,8,0.5) 45%, transparent 100%)' }} />

                        {isToday && (
                          <div className="absolute top-3 right-3 z-10">
                            <span className={Badge.neon}>⚡ Hoje</span>
                          </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                          <span className="text-[9px] font-black uppercase tracking-[0.22em] block mb-1"
                            style={{ color: C.neonDim }}>{workout.focus}</span>
                          <h3 className="text-white text-[20px] font-black uppercase leading-tight tracking-tight mb-4">
                            {workout.title}
                          </h3>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); haptics.heavy(); startSession(parseInt(key)); }}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-[14px] mb-2"
                            style={isToday ? Btn.primary : { ...Btn.secondary, borderRadius: '14px' }}
                          >
                            <span className="font-black text-[11px] uppercase tracking-widest">
                              {isToday ? '⚡ Treino de Hoje' : 'Selecionar'}
                            </span>
                            <ChevronRight size={14} strokeWidth={2.5} />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const firstEx = workout.exercises[0];
                              if (firstEx) setVideoModal({ name: `Técnica: ${firstEx.name}`, query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' técnica exercício' });
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

          {/* Dia descanso / atalho */}
          {isRestDay ? (
            <div className="flex items-center gap-3 px-4 py-3.5 rounded-[18px]"
              style={{ background: 'rgba(255,165,0,0.06)', border: '1px solid rgba(255,165,0,0.16)' }}>
              <Coffee size={14} style={{ color: '#FFA040' }} />
              <p className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: '#FFA040' }}>Hoje é dia de descanso. Recupere-se bem.</p>
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
              <ChevronRight size={14} style={{ color: C.textSub }} />
            </motion.button>
          )}
        </motion.div>
      )}

      {/* ══ 2. SESSÃO ATIVA ═══════════════════════════════════════════════ */}
      {isTraining && (
        <motion.div
          key="active-session"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-[18px] font-black uppercase tracking-tight text-white leading-none">
                Sessão Ativa
              </h2>
              {restTimer === 0 && (
                <p className="text-[9px] font-bold uppercase tracking-widest mt-1"
                  style={{ color: '#4ADE80' }}>● Pronto para o próximo set</p>
              )}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Coffee size={14} style={{ color: C.textSub }} />
            </div>
          </div>

          {/* Pre-cardio banner */}
          {currentWorkout?.preCardio && (
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3 rounded-[16px]"
              style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}
            >
              <Zap size={13} style={{ color: C.neon }} />
              <span className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: C.neon }}>PRÉ-TREINO: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {/* Mapa anatômico */}
          {currentWorkout?.exercises?.length > 0 && (
            <AnatomyMap2D
              activeGroup={
                isPremiumUser && activePrimaryMuscles?.length > 0
                  ? activePrimaryMuscles[0]
                  : currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group
              }
            />
          )}

          {/* Lista de exercícios */}
          {!currentWorkout?.exercises?.length ? (
            <div className="flex flex-col items-center justify-center py-14 rounded-[20px]"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
              <span className="text-3xl mb-3 opacity-30">☕</span>
              <p className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: C.textSub }}>OFF DAY — Descanso Ativo</p>
            </div>
          ) : (
            currentWorkout.exercises.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
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
                />
              </motion.div>
            ))
          )}

          {/* Cardio final */}
          {currentWorkout?.cardio && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="rounded-[20px] overflow-hidden"
              style={{
                background: cardioRunning ? C.neon : 'rgba(14,14,18,0.97)',
                border: cardioRunning ? `1px solid ${C.neon}` : `1px solid ${C.neonBorder}`,
                boxShadow: cardioRunning ? '0 0 24px rgba(205,255,90,0.2)' : 'none',
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
                  ? { background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.10)', color: '#000' }
                  : { ...Btn.primary, borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
                }
              >
                <span className="font-black text-[11px] uppercase tracking-widest">
                  {cardioRunning ? '■ Finalizar Cardio' : '▶ Iniciar Cardio'}
                </span>
                {cardioRunning && (
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-600 animate-ping" />
                    <span className="font-black font-mono text-[15px]">{fmt(cardioTime)}</span>
                  </div>
                )}
              </motion.button>
            </motion.div>
          )}

          {/* Finalizar sessão */}
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
