import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Zap, Play, Coffee, Flame, ArrowRight, Target, TrendingUp, Check, ChevronDown, ChevronUp } from 'lucide-react';

// Cores consistentes com WorkoutCard
const MUSCLE_COLORS = {
  'Peito':      { bg: 'bg-amber-500/20',   text: 'text-amber-400',   border: 'border-amber-500/40',   active: 'bg-amber-500 text-black border-amber-400' },
  'Costas':     { bg: 'bg-blue-500/20',    text: 'text-blue-400',    border: 'border-blue-500/40',    active: 'bg-blue-500 text-white border-blue-400' },
  'Perna':      { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', active: 'bg-emerald-500 text-black border-emerald-400' },
  'Bíceps':     { bg: 'bg-purple-500/20',  text: 'text-purple-400',  border: 'border-purple-500/40',  active: 'bg-purple-500 text-white border-purple-400' },
  'Tríceps':    { bg: 'bg-rose-500/20',    text: 'text-rose-400',    border: 'border-rose-500/40',    active: 'bg-rose-500 text-white border-rose-400' },
  'Ombro':      { bg: 'bg-sky-500/20',     text: 'text-sky-400',     border: 'border-sky-500/40',     active: 'bg-sky-500 text-white border-sky-400' },
  'Abdômen':    { bg: 'bg-orange-500/20',  text: 'text-orange-400',  border: 'border-orange-500/40',  active: 'bg-orange-500 text-black border-orange-400' },
  'Panturrilha':{ bg: 'bg-teal-500/20',    text: 'text-teal-400',    border: 'border-teal-500/40',    active: 'bg-teal-500 text-black border-teal-400' },
  'Glúteos':    { bg: 'bg-pink-500/20',    text: 'text-pink-400',    border: 'border-pink-500/40',    active: 'bg-pink-500 text-white border-pink-400' },
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
  activeMuscles
}) {
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime] = useState(0);
  const [selectedMuscle, setSelectedMuscle] = useState(null);
  const [anatomyOpen, setAnatomyOpen] = useState(false); // colapsado por padrão
  const cardioTimerRef = useRef(null);

  // Cardio Timer Logic
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
          STATE 1: SELECTION MODE - Carousel + Anatomy Preview
          ═══════════════════════════════════════════════════════════════════ */}
      {!isTraining && (
        <motion.div
          key="session-selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-8"
        >
          {/* PREMIUM HEADER */}
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-yellow-500/10 via-neutral-900/40 to-neutral-950 border border-yellow-500/20 backdrop-blur-xl p-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(253,224,71,0.1),transparent)] pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-500/20 rounded-2xl border border-yellow-500/40 shadow-[0_0_20px_rgba(253,224,71,0.2)]">
                  <Dumbbell className="text-yellow-400" size={28} />
                </div>
                <div>
                  <p className="text-yellow-400 text-xs font-black uppercase tracking-[0.2em]">Sessão de Treino</p>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Selecione sua Rotina</h1>
                  <p className="text-neutral-400 text-sm font-bold mt-2">Escolha o treino de hoje e veja a estrutura muscular</p>
                </div>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="text-6xl opacity-20"
              >
                💪
              </motion.div>
            </div>
          </motion.div>

          {/* WORKOUT CAROUSEL - PREMIUM COVERFLOW */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="px-2">
              <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2">
                <span className="text-yellow-400">⚡</span> Rotinas Disponíveis
              </h2>
            </div>

            <div className="relative -mx-6 py-6">
              <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                coverflowEffect={{
                  rotate: 25,
                  stretch: 0,
                  depth: 120,
                  modifier: 1.2,
                  slideShadows: true,
                }}
                modules={[EffectCoverflow]}
                className="w-full"
              >
                {Object.entries(workoutData)
                  .filter(([key]) => key !== '0' && key !== '6' && workoutData[key].exercises.length > 0)
                  .map(([key, workout]) => (
                    <SwiperSlide key={key} className="w-[280px] sm:w-[340px]">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative h-[420px] rounded-3xl overflow-hidden border-2 transition-all duration-500 cursor-pointer group ${
                          today === parseInt(key)
                            ? 'border-yellow-400 shadow-[0_0_30px_rgba(253,224,71,0.5)]'
                            : 'border-neutral-700 hover:border-yellow-500/40'
                        }`}
                      >
                        {/* Background Image */}
                        <img
                          src={workout.image || "/images/chest.png"}
                          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity duration-700"
                          alt={workout.title}
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/20" />

                        {/* Today Badge */}
                        {today === parseInt(key) && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-4 right-4 bg-yellow-400 text-black text-[9px] font-black uppercase px-4 py-2 rounded-full tracking-widest z-10 shadow-lg shadow-yellow-400/40"
                          >
                            🎯 Sugestão do Dia
                          </motion.div>
                        )}

                        {/* Exercise Count Badge */}
                        <div className="absolute top-4 left-4 bg-neutral-900/80 backdrop-blur-md text-yellow-400 text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-wider border border-yellow-500/30 z-10">
                          {workout.exercises.length} Exercícios
                        </div>

                        {/* Content */}
                        <div className="absolute bottom-0 p-6 w-full z-10 space-y-4">
                          <div>
                            <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em] block mb-2">
                              {workout.focus}
                            </span>
                            <h3 className="text-white text-3xl font-black italic leading-tight uppercase">
                              {workout.title}
                            </h3>
                            {workout.preCardio && (
                              <p className="text-neutral-300 text-xs font-bold mt-2 flex items-center gap-1">
                                <Zap size={12} /> Aquecimento: {workout.preCardio}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              haptics.heavy();
                              startSession(parseInt(key));
                            }}
                            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-yellow-400 border-2 border-yellow-300 text-black font-black rounded-2xl hover:shadow-[0_0_30px_rgba(253,224,71,0.6)] transition-all uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 group/btn"
                          >
                            <Play size={16} fill="currentColor" />
                            INICIAR TREINO
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05 }}
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
                            className="w-full py-2 bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 hover:text-yellow-400 font-black rounded-xl border border-white/10 hover:border-yellow-500/50 transition-all uppercase text-[9px] tracking-[0.15em] flex items-center justify-center gap-2"
                          >
                            <span>🎥</span>
                            Pré-visualizar Técnica
                          </motion.button>
                        </div>
                      </motion.div>
                    </SwiperSlide>
                  ))}
              </Swiper>
            </div>
          </motion.div>

          {/* REST DAY OR SUMMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {today === 0 || today === 6 ? (
              <div className="p-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl flex items-center gap-4 backdrop-blur-xl">
                <div className="p-3 bg-amber-500/20 rounded-2xl">
                  <span className="text-2xl">😴</span>
                </div>
                <div>
                  <p className="text-amber-500 text-sm font-black uppercase tracking-widest">Dia de Descanso</p>
                  <p className="text-neutral-400 text-xs mt-1">Recuperação ativa recomendada. Hidratação e mobilidade.</p>
                </div>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  haptics.heavy();
                  startSession(today);
                }}
                className="w-full relative overflow-hidden bg-gradient-to-r from-neutral-800 to-neutral-900 border border-white/10 hover:border-yellow-500/40 p-6 rounded-3xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all group hover:shadow-[0_0_30px_rgba(253,224,71,0.2)]"
              >
                <Zap className="text-yellow-400 group-hover:scale-125 transition-transform" size={24} />
                <span className="text-white">Resumo do Treino de Hoje</span>
                <ArrowRight className="text-yellow-400 group-hover:translate-x-2 transition-transform" size={20} />
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STATE 2: ACTIVE TRAINING - Full Exercise Session
          ═══════════════════════════════════════════════════════════════════ */}
      {isTraining && (
        <motion.div
          key="active-training"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {/* SESSION HEADER — Compacto */}
          <motion.div
            className="flex items-center justify-between bg-neutral-900/60 backdrop-blur-xl border border-white/5 rounded-2xl px-4 py-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em] leading-none mb-0.5">Sessão Ativa</p>
              <h2 className="text-lg font-black uppercase italic tracking-tighter text-white leading-tight truncate">
                {currentWorkout?.title || 'Treino'}
              </h2>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              {restTimer > 0 ? (
                <div className="flex items-center gap-1.5 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20">
                  <span className="text-[10px] font-black text-yellow-400 uppercase">⏱ {restTimer}s</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <span className="text-[10px] font-black text-emerald-400 uppercase">✓ Go</span>
                </div>
              )}
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20"
              >
                <Flame className="text-emerald-400" size={18} />
              </motion.div>
            </div>
          </motion.div>

          {/* PRE-CARDIO ALERT — Mais fino */}
          {currentWorkout?.preCardio && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="px-4 py-2.5 bg-yellow-400/8 text-yellow-300 rounded-xl font-black uppercase tracking-widest text-[9px] flex items-center gap-2 border border-yellow-500/20"
            >
              <Zap size={13} className="shrink-0 text-yellow-400" />
              <span>Aquecimento: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {/* ANATOMY — Colapsável */}
          {currentWorkout?.exercises?.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-neutral-900/40 border border-white/5 rounded-2xl overflow-hidden"
            >
              {/* Toggle header */}
              <button
                onClick={() => setAnatomyOpen(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-yellow-400" />
                  <span className="text-white font-black uppercase text-[11px] tracking-tight">Músculos Trabalhados</span>
                  {/* Bolhas de cor por músculo */}
                  <div className="flex gap-1 ml-1">
                    {[...new Set(currentWorkout.exercises.map(e => e.group))].map(muscle => {
                      const c = MUSCLE_COLORS[muscle];
                      return (
                        <span key={muscle} className={`w-2 h-2 rounded-full ${c?.bg?.replace('/20', '') || 'bg-yellow-400'}`} />
                      );
                    })}
                  </div>
                </div>
                <motion.div animate={{ rotate: anatomyOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown size={16} className="text-neutral-500" />
                </motion.div>
              </button>

              <AnimatePresence>
                {anatomyOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Anatomy map menor */}
                      <div className="scale-95 origin-top rounded-2xl overflow-hidden">
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

              {/* Muscle Filter Buttons — sempre visíveis */}
              <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMuscle(null)}
                  className={`px-3 py-1 rounded-lg font-black uppercase text-[9px] tracking-wider transition-all border ${
                    selectedMuscle === null
                      ? 'bg-white/15 text-white border-white/30'
                      : 'bg-white/5 text-neutral-500 border-white/5 hover:border-white/15'
                  }`}
                >
                  Todos
                </motion.button>

                {[...new Set(currentWorkout.exercises.map(e => e.group))].map(muscle => {
                  const muscleExercises = getExercisesByMuscle(muscle);
                  const completedCount = muscleExercises.filter(e => completedExercises.includes(e.id)).length;
                  const allDone = completedCount === muscleExercises.length;
                  const c = MUSCLE_COLORS[muscle] || { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', active: 'bg-yellow-500 text-black border-yellow-400' };

                  return (
                    <motion.button
                      key={muscle}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                      className={`px-3 py-1 rounded-lg font-black uppercase text-[9px] tracking-wider transition-all border ${
                        selectedMuscle === muscle
                          ? c.active
                          : allDone
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : `${c.bg} ${c.text} ${c.border}`
                      }`}
                    >
                      {allDone ? '✓ ' : ''}{muscle} {completedCount}/{muscleExercises.length}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* EXERCISES LIST */}
          <motion.div className="space-y-2">
            {!currentWorkout?.exercises?.length ? (
              <div className="text-center p-12 bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-dashed border-neutral-700/50">
                <span className="block text-4xl mb-3 opacity-40">😴</span>
                <p className="text-neutral-500 font-black uppercase tracking-widest">OFF DAY</p>
                <p className="text-neutral-600 text-xs mt-1">Descanso Ativo Recomendado</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 px-1 pb-1">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-neutral-400 font-black uppercase text-[10px] tracking-tight">
                    Exercícios — {completedExercises.length}/{currentWorkout.exercises.length} concluídos
                  </span>
                </div>

                {currentWorkout.exercises
                  .filter(ex => !selectedMuscle || ex.group === selectedMuscle)
                  .map((ex, i) => (
                    <motion.div
                      key={ex.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
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
                  ))}
              </>
            )}
          </motion.div>

          {/* CARDIO FINISHER — Compacto, expande quando ativo */}
          {currentWorkout?.cardio && (
            <motion.button
              layout
              whileTap={{ scale: 0.98 }}
              onClick={() => setCardioRunning(!cardioRunning)}
              className={`w-full rounded-2xl transition-all duration-300 border flex items-center justify-between overflow-hidden ${
                cardioRunning
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-400 border-yellow-400 shadow-[0_0_25px_rgba(253,224,71,0.4)] p-4'
                  : 'bg-neutral-900/40 border-yellow-500/15 hover:border-yellow-500/30 px-4 py-3'
              }`}
            >
              <div className={`flex items-center gap-3 ${cardioRunning ? 'text-neutral-950' : 'text-white'}`}>
                <span className="text-lg">🔥</span>
                <div className="text-left">
                  <p className={`text-[9px] font-black uppercase tracking-widest ${cardioRunning ? 'text-neutral-700' : 'text-yellow-400'}`}>
                    {cardioRunning ? 'Em Execução' : 'Finalização'}
                  </p>
                  <p className={`text-sm font-black uppercase italic tracking-tight leading-tight ${cardioRunning ? 'text-neutral-950' : 'text-white'}`}>
                    {cardioRunning ? '■ Parar Cardio' : `▶ ${currentWorkout.cardio}`}
                  </p>
                </div>
              </div>
              {cardioRunning && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-700 rounded-full animate-pulse" />
                  <span className="text-xl font-black font-mono tracking-tighter text-neutral-950">
                    {formatCardioTime(cardioTime)}
                  </span>
                </div>
              )}
            </motion.button>
          )}

          {/* EXIT BUTTON — Compacto */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              haptics.heavy();
              setIsTraining(false);
            }}
            className="w-full bg-transparent hover:bg-red-600/10 border border-white/5 hover:border-red-500/30 py-3 px-4 rounded-2xl font-black uppercase tracking-widest text-[10px] text-neutral-600 hover:text-red-400 transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>🛑</span>
            FINALIZAR SESSÃO
          </motion.button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
