import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ShieldAlert, Zap, Play, PlayCircle, Coffee, Flame } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Assuming these are passed or imported from their respective paths.
// If Anatomy3D, WorkoutCard, or EXERCISE_VIDEOS are in parent folder, we import like this:
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
  activeMuscles
}) {
  const [cardioRunning, setCardioRunning] = useState(false);
  const [cardioTime, setCardioTime] = useState(0);
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

  return (
    <AnimatePresence mode="wait">
      
      {/* 1. STATE: NOT TRAINING (SHOW CAROUSEL) */}
      {!isTraining && (
        <motion.div
          key="routine-list"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                <span className="text-xl">💪</span>
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight italic">Selecionar Rotina</h3>
                <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">ZYRON Session Prep</p>
              </div>
            </div>
          </div>

          <div className="relative -mx-6">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              coverflowEffect={{
                rotate: 30,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              modules={[EffectCoverflow]}
              className="w-full py-10"
            >
              {Object.entries(workoutData)
                .filter(([key]) => key !== '0' && key !== '6' && workoutData[key].exercises.length > 0)
                .map(([key, workout]) => (
                  <SwiperSlide key={key} className="w-[280px] sm:w-[320px]">
                    <motion.div 
                      whileTap={{ scale: 0.95 }}
                      className={`relative h-[400px] rounded-3xl overflow-hidden border transition-all duration-500 ${
                        today === parseInt(key) 
                          ? 'border-yellow-400 animate-neon-pulse' 
                          : 'border-neutral-800'
                      }`}
                    >
                      <img 
                        src={workout.image || "/images/chest.png"} 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale-[0.5] hover:grayscale-0 transition-all duration-700" 
                        alt={workout.title}
                      />
                      <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

                      {today === parseInt(key) && (
                        <div className="absolute top-4 right-4 bg-yellow-500 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full tracking-widest animate-pulse z-10">
                          Sugestão do Dia
                        </div>
                      )}

                      <div className="absolute bottom-0 p-6 w-full z-10">
                        <span className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em]">
                          {workout.focus}
                        </span>
                        <h3 className="text-white text-2xl font-black italic leading-none mt-1 uppercase group-hover:text-yellow-300 transition-colors">
                          {workout.title}
                        </h3>
                        
                        <button 
                          onClick={(e) => {
                            if(e && e.stopPropagation) e.stopPropagation();
                            haptics.heavy();
                            startSession(parseInt(key));
                          }}
                          className="mt-6 w-full py-4 bg-yellow-500 border border-yellow-400 text-white font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                          <span className="text-white">{today === parseInt(key) ? '⚡' : '▶️'}</span>
                          Selecionar
                        </button>

                        <button
                          onClick={(e) => {
                            if(e && e.stopPropagation) e.stopPropagation();
                            const firstEx = workout.exercises[0];
                            if (firstEx) {
                              setVideoModal({ 
                                name: `Técnica: ${firstEx.name}`, 
                                query: EXERCISE_VIDEOS[firstEx.id] || firstEx.name + ' técnica exercício' 
                              });
                            }
                          }}
                          className="mt-2 w-full py-2 bg-neutral-900/50 text-neutral-400 hover:text-white font-black rounded-xl border border-white/5 hover:border-yellow-400/30 transition-all uppercase text-[8px] tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                          <span className="text-xs">🎥</span>
                          Pré-visualizar Técnica
                        </button>
                      </div>
                    </motion.div>
                  </SwiperSlide>
                ))}
            </Swiper>
          </div>

          {today === 0 || today === 6 ? (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
              <span className="text-amber-500 text-lg">⚠️</span>
              <p className="text-[10px] font-black text-amber-500 uppercase italic">Hoje é dia de descanso. Mantenha a guarda.</p>
            </div>
          ) : (
            <div className="px-1">
              <button 
                onClick={() => {
                  haptics.heavy();
                  startSession(today);
                }}
                className="w-full relative overflow-hidden bg-neutral-900 border border-white/5 hover:bg-neutral-800 p-5 rounded-2xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all group"
              >
                <span className="text-yellow-400 text-xl group-hover:scale-110 transition-transform">⚡</span> 
                RESUMO DO TREINO ATUAL
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* 2. STATE: ACTIVE TRAINING SESSION */}
      {isTraining && (
        <motion.div
          key="active-session"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="space-y-6"
        >
          <div className="flex justify-between items-end mb-4 px-2">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Sessão Ativa</h2>
              <div className="flex flex-col gap-1 mt-2">
                {restTimer === 0 && <p className="text-[10px] font-black text-emerald-500 uppercase">Pronto para o próximo set</p>}
              </div>
            </div>
            <div className="p-3 bg-neutral-900 rounded-2xl border border-white/5">
              <span className="text-neutral-500 text-xl">☕</span>
            </div>
          </div>

          {currentWorkout?.preCardio && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-yellow-400 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 shadow-lg shadow-yellow-400/20 mb-4"
            >
              <Zap size={16} fill="black" /> 
              <span>PRE-TREINO: {currentWorkout.preCardio}</span>
            </motion.div>
          )}

          {currentWorkout?.exercises?.length > 0 && (
            <AnatomyMap2D
              activeGroup={
                isPremiumUser && activePrimaryMuscles?.length > 0
                  ? activePrimaryMuscles[0]
                  : currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group
              }
            />
          )}

          {!currentWorkout?.exercises?.length ? (
            <div className="text-center p-16 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-dashed border-neutral-700">
              <span className="block text-4xl mb-6 opacity-30">⚠️</span>
              <p className="text-neutral-500 font-black uppercase tracking-widest text-lg">OFF DAY - Descanso Ativo</p>
            </div>
          ) : (
            currentWorkout.exercises.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
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

          {currentWorkout?.cardio && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className={`mt-8 p-6 rounded-3xl flex flex-col items-center gap-4 text-center transition-all duration-300 border ${
                cardioRunning ? 'bg-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(253,224,71,0.4)] border-yellow-400' : 'bg-neutral-900/80 border-yellow-500/30'
              }`}
            >
              <div className={`p-3 rounded-full ${cardioRunning ? 'bg-neutral-950/20' : 'bg-yellow-500/10'}`}>
                <Flame size={24} className={cardioRunning ? 'text-neutral-950 animate-pulse' : 'text-yellow-400'} />
              </div>
              
              <div className="w-full">
                <h4 className={`font-black uppercase tracking-tight italic ${cardioRunning ? 'text-neutral-950' : 'text-white'}`}>Finalização: Cardio</h4>
                <p className={`text-[12px] font-black uppercase tracking-widest mt-1 ${cardioRunning ? 'text-neutral-800' : 'text-yellow-400'}`}>{currentWorkout.cardio}</p>
              </div>

              <motion.button 
                layout
                onClick={(e) => {
                  e.stopPropagation();
                  setCardioRunning(!cardioRunning);
                }}
                className={`mt-2 w-full h-16 rounded-xl flex items-center justify-between px-6 transition-all duration-300 ${
                  cardioRunning 
                    ? 'bg-neutral-950 text-yellow-400 shadow-[0_0_20px_rgba(0,0,0,0.6)]' 
                    : 'bg-yellow-400 text-neutral-950 border-2 border-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.2)]'
                }`}
              >
                <div className="flex flex-col items-start leading-none">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-80">
                    {cardioRunning ? 'Em Execução' : 'Pronto para Queimar?'}
                  </span>
                  <span className="text-xl font-black italic uppercase tracking-tighter shrink-0">
                    {cardioRunning ? '■ FINALIZAR' : '> INICIAR CARDIO'}
                  </span>
                </div>
                
                {cardioRunning && (
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-red-600 rounded-full animate-ping" />
                    <span className="text-2xl font-black font-mono tracking-tighter">
                      {formatCardioTime(cardioTime)}
                    </span>
                  </div>
                )}
              </motion.button>
            </motion.div>
          )}

          <button 
            onClick={() => {
              haptics.heavy();
              setIsTraining(false);
            }}
            className="w-full bg-neutral-900/50 hover:bg-red-600 border border-white/5 hover:border-red-500 p-6 rounded-3xl font-black uppercase tracking-[0.3em] italic text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-4 mt-8"
          >
            <span className="text-xl">🛑</span> FINALIZAR SESSÃO
          </button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
