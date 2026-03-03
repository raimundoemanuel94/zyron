import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ShieldAlert, Zap, Play, PlayCircle, Coffee } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

// Assuming these are passed or imported from their respective paths.
// If Anatomy3D, WorkoutCard, or EXERCISE_VIDEOS are in parent folder, we import like this:
import { Anatomy3D } from '../Anatomy3D';
import WorkoutCard from '../WorkoutCard';
import { EXERCISE_VIDEOS } from '../FichaDeTreinoScreen'; // Note: EXERCISE_VIDEOS needs to be exported from FichaDeTreinoScreen or moved to constants

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
  showPR
}) {
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
                <Dumbbell className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight italic">Selecionar Rotina</h3>
                <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">AXIRON Session Prep</p>
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
                            e.stopPropagation();
                            startSession(parseInt(key));
                          }}
                          className="mt-6 w-full py-4 bg-yellow-500 border border-yellow-400 text-white font-black rounded-2xl hover:bg-yellow-400 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 group/btn"
                        >
                          {today === parseInt(key) ? <Zap size={14} className="text-white" /> : <Play size={14} fill="currentColor" />}
                          Selecionar
                        </button>

                        <button
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
                          className="mt-2 w-full py-2 bg-neutral-900/50 text-neutral-400 hover:text-white font-black rounded-xl border border-white/5 hover:border-yellow-400/30 transition-all uppercase text-[8px] tracking-[0.2em] flex items-center justify-center gap-2"
                        >
                          <PlayCircle size={12} />
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
              <ShieldAlert className="text-amber-500" size={18} />
              <p className="text-[10px] font-black text-amber-500 uppercase italic">Hoje é dia de descanso. Mantenha a guarda.</p>
            </div>
          ) : (
            <div className="px-1">
              <button 
                onClick={() => startSession(today)}
                className="w-full relative overflow-hidden bg-neutral-900 border border-white/5 hover:bg-neutral-800 p-5 rounded-2xl font-black uppercase tracking-[0.2em] italic flex items-center justify-center gap-3 transition-all group"
              >
                <Zap size={20} className="text-yellow-400 group-hover:scale-110 transition-transform" /> 
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
              {restTimer === 0 && <p className="text-[10px] font-black text-emerald-500 uppercase mt-2">Pronto para o próximo set</p>}
            </div>
            <div className="p-3 bg-neutral-900 rounded-2xl border border-white/5">
              <Coffee className="text-neutral-500" size={20} />
            </div>
          </div>

          {currentWorkout?.exercises?.length > 0 && (
            <Anatomy3D activeGroup={currentWorkout.exercises.find(e => !completedExercises.includes(e.id))?.group} />
          )}

          {!currentWorkout?.exercises?.length ? (
            <div className="text-center p-16 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-dashed border-neutral-700">
              <ShieldAlert className="mx-auto text-neutral-700 mb-6" size={64} />
              <p className="text-neutral-500 font-black uppercase tracking-widest text-lg">OFF DAY - Descanso Ativo</p>
            </div>
          ) : (
            currentWorkout.exercises.map((ex) => (
              <WorkoutCard
                key={ex.id}
                ex={ex}
                completed={completedExercises.includes(ex.id)}
                onComplete={handleExerciseComplete}
                load={loads[ex.id]}
                onUpdateLoad={updateLoad}
                prHistoryLoad={prHistory[ex.id]}
                showPR={showPR}
                videoQuery={EXERCISE_VIDEOS[ex.id] || 'vcBig73oqpE'}
              />
            ))
          )}

          <button 
            onClick={() => setIsTraining(false)}
            className="w-full bg-neutral-900/50 hover:bg-red-600 border border-white/5 hover:border-red-500 p-6 rounded-3xl font-black uppercase tracking-[0.3em] italic text-neutral-400 hover:text-white transition-all flex items-center justify-center gap-4 mt-8"
          >
            <Zap size={20} /> FINALIZAR SESSÃO
          </button>
        </motion.div>
      )}

    </AnimatePresence>
  );
}
