import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Muscle group IDs mapped to body regions
const MUSCLE_GROUPS = {
  // Chest
  'pec_major': { name: 'Peitoral Maior', color: 'rgba(220, 38, 38, 0.6)', region: 'chest' },
  'pec_minor': { name: 'Peitoral Menor', color: 'rgba(220, 38, 38, 0.5)', region: 'chest' },

  // Back
  'lats': { name: 'Costas (Latíssimo)', color: 'rgba(139, 92, 246, 0.6)', region: 'back' },
  'rhomboid': { name: 'Romboide', color: 'rgba(139, 92, 246, 0.5)', region: 'back' },
  'traps': { name: 'Trapézio', color: 'rgba(139, 92, 246, 0.7)', region: 'back-top' },

  // Shoulders
  'delt_front': { name: 'Deltóide Anterior', color: 'rgba(34, 197, 94, 0.6)', region: 'shoulder' },
  'delt_mid': { name: 'Deltóide Médio', color: 'rgba(34, 197, 94, 0.6)', region: 'shoulder' },
  'delt_rear': { name: 'Deltóide Posterior', color: 'rgba(34, 197, 94, 0.5)', region: 'shoulder-back' },

  // Arms
  'biceps': { name: 'Bíceps', color: 'rgba(251, 191, 36, 0.6)', region: 'arm-front' },
  'triceps': { name: 'Tríceps', color: 'rgba(251, 191, 36, 0.6)', region: 'arm-back' },
  'forearm': { name: 'Antebraço', color: 'rgba(251, 191, 36, 0.5)', region: 'forearm' },

  // Legs
  'quads': { name: 'Quadríceps', color: 'rgba(14, 165, 233, 0.6)', region: 'leg-front' },
  'hamstring': { name: 'Isquiotibiais', color: 'rgba(14, 165, 233, 0.6)', region: 'leg-back' },
  'glutes': { name: 'Glúteos', color: 'rgba(14, 165, 233, 0.5)', region: 'glute' },
  'calves': { name: 'Panturrilha', color: 'rgba(14, 165, 233, 0.5)', region: 'calf' },

  // Core
  'abs': { name: 'Abdominal', color: 'rgba(168, 85, 247, 0.6)', region: 'abs' },
  'obliques': { name: 'Oblíquos', color: 'rgba(168, 85, 247, 0.5)', region: 'obliques' },
};

// SVG paths for each muscle - simplified anatomical regions
const MUSCLE_REGIONS = {
  front: {
    chest: {
      path: 'M 150 80 L 200 90 L 200 150 L 150 140 Z M 200 90 L 250 80 L 250 150 L 200 150 Z',
      label: 'Peito',
      muscles: ['pec_major', 'pec_minor']
    },
    abs: {
      path: 'M 170 150 L 230 150 L 220 220 L 180 220 Z',
      label: 'Core',
      muscles: ['abs', 'obliques']
    },
    arm_front: {
      path: 'M 140 100 L 130 180 L 145 185 L 155 105 Z',
      label: 'Bíceps',
      muscles: ['biceps', 'forearm']
    },
    arm_front_right: {
      path: 'M 260 100 L 270 180 L 255 185 L 245 105 Z',
      label: 'Bíceps',
      muscles: ['biceps', 'forearm']
    },
    leg_front: {
      path: 'M 160 230 L 190 230 L 185 330 L 165 330 Z',
      label: 'Quadríceps',
      muscles: ['quads']
    },
    leg_front_right: {
      path: 'M 210 230 L 240 230 L 245 330 L 215 330 Z',
      label: 'Quadríceps',
      muscles: ['quads']
    },
    calf: {
      path: 'M 165 330 L 185 330 L 180 380 L 170 380 Z',
      label: 'Panturrilha',
      muscles: ['calves']
    },
    calf_right: {
      path: 'M 215 330 L 235 330 L 240 380 L 220 380 Z',
      label: 'Panturrilha',
      muscles: ['calves']
    }
  },

  back: {
    back: {
      path: 'M 160 90 L 210 80 L 210 170 L 160 180 Z M 190 80 L 240 90 L 240 180 L 210 170 Z',
      label: 'Costas',
      muscles: ['lats', 'rhomboid']
    },
    back_top: {
      path: 'M 170 70 L 230 70 L 235 95 L 165 95 Z',
      label: 'Trapézio',
      muscles: ['traps']
    },
    shoulder_back: {
      path: 'M 135 85 L 150 110 L 165 95 Z',
      label: 'Deltóide Posterior',
      muscles: ['delt_rear']
    },
    shoulder_back_right: {
      path: 'M 245 85 L 250 110 L 235 95 Z',
      label: 'Deltóide Posterior',
      muscles: ['delt_rear']
    },
    arm_back: {
      path: 'M 145 105 L 135 190 L 150 195 L 160 110 Z',
      label: 'Tríceps',
      muscles: ['triceps']
    },
    arm_back_right: {
      path: 'M 255 105 L 265 190 L 250 195 L 240 110 Z',
      label: 'Tríceps',
      muscles: ['triceps']
    },
    leg_back: {
      path: 'M 170 230 L 190 230 L 185 320 L 175 320 Z',
      label: 'Isquiotibiais',
      muscles: ['hamstring']
    },
    leg_back_right: {
      path: 'M 210 230 L 230 230 L 235 320 L 215 320 Z',
      label: 'Isquiotibiais',
      muscles: ['hamstring']
    },
    glute: {
      path: 'M 165 180 L 235 180 L 230 230 L 170 230 Z',
      label: 'Glúteos',
      muscles: ['glutes']
    }
  },

  side: {
    shoulder: {
      path: 'M 190 85 L 210 90 L 215 130 L 185 125 Z',
      label: 'Ombro',
      muscles: ['delt_front', 'delt_mid']
    },
    chest_side: {
      path: 'M 185 125 L 215 130 L 210 180 L 180 175 Z',
      label: 'Peito',
      muscles: ['pec_major']
    },
    arm_side: {
      path: 'M 210 130 L 220 200 L 205 205 L 195 135 Z',
      label: 'Braço',
      muscles: ['biceps', 'triceps']
    },
    leg_side: {
      path: 'M 190 230 L 210 230 L 205 330 L 195 330 Z',
      label: 'Perna',
      muscles: ['quads', 'hamstring']
    }
  }
};

export default function ExerciseAnatomy({ exerciseId, activeMuscles = [], view = 'front' }) {
  const [musclePumpData, setMusclePumpData] = useState({});
  const [currentView, setCurrentView] = useState(view);
  const [loading, setLoading] = useState(false);

  // Fetch muscle activation data for the exercise
  useEffect(() => {
    const fetchMuscleData = async () => {
      if (!exerciseId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('exercises_muscles')
          .select('muscle_id, activation_percentage')
          .eq('exercise_id', exerciseId);

        if (!error && data) {
          const muscleMap = {};
          data.forEach(record => {
            muscleMap[record.muscle_id] = record.activation_percentage || 50;
          });
          setMusclePumpData(muscleMap);
        }
      } catch (err) {
        console.warn('Could not load muscle data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMuscleData();
  }, [exerciseId]);

  // Determine if a muscle is active based on exercise data
  const getMuscleOpacity = (muscleKey) => {
    if (activeMuscles.includes(muscleKey)) return 1;
    if (musclePumpData[muscleKey]) {
      return Math.min(1, (musclePumpData[muscleKey] / 100) * 0.8 + 0.2);
    }
    return 0.15;
  };

  const getMuscleColor = (muscleKey) => {
    if (!MUSCLE_GROUPS[muscleKey]) return 'rgba(100, 100, 100, 0.3)';
    return MUSCLE_GROUPS[muscleKey].color;
  };

  const views = ['front', 'back', 'side'];
  const currentViewRegions = MUSCLE_REGIONS[currentView] || MUSCLE_REGIONS.front;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-neutral-900/50 backdrop-blur-sm border border-yellow-400/20 rounded-2xl p-4 md:p-6"
    >
      {/* Header with view controls */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Mapa Muscular
        </h3>

        {/* View Selector */}
        <div className="flex gap-2 bg-neutral-800/60 p-2 rounded-xl border border-yellow-400/10">
          {views.map(v => (
            <button
              key={v}
              onClick={() => setCurrentView(v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                currentView === v
                  ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/50'
                  : 'text-neutral-400 hover:text-yellow-400'
              }`}
            >
              {v === 'front' && 'Frente'}
              {v === 'back' && 'Costas'}
              {v === 'side' && 'Lado'}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Muscle Diagram */}
      <div className="flex items-center justify-center mb-4">
        <svg
          viewBox="0 0 400 400"
          className="w-full max-w-sm h-auto"
          style={{ filter: 'drop-shadow(0 0 20px rgba(234, 179, 8, 0.1))' }}
        >
          {Object.entries(currentViewRegions).map(([regionKey, region]) => {
            const isActive = region.muscles.some(m => activeMuscles.includes(m));
            const maxActivation = Math.max(
              ...region.muscles.map(m => musclePumpData[m] || 0)
            );

            return (
              <motion.g key={regionKey}>
                {/* Muscle polygon */}
                <motion.path
                  d={region.path}
                  fill={getMuscleColor(region.muscles[0])}
                  stroke={isActive ? '#eab308' : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth={isActive ? 2 : 1}
                  opacity={getMuscleOpacity(region.muscles[0])}
                  className="cursor-pointer transition-all hover:stroke-yellow-300 hover:stroke-width-2"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: getMuscleOpacity(region.muscles[0]),
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(234, 179, 8, 0.6))' : 'drop-shadow(0 0 0px transparent)'
                  }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ filter: 'drop-shadow(0 0 12px rgba(234, 179, 8, 0.8))' }}
                />

                {/* Label */}
                {isActive && (
                  <motion.text
                    x={parseInt(region.path.match(/M (\d+)/)?.[1] || 200)}
                    y={parseInt(region.path.match(/L \d+ (\d+)/)?.[1] || 150)}
                    textAnchor="middle"
                    className="text-[10px] font-black fill-yellow-300 pointer-events-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {region.label}
                  </motion.text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>

      {/* Muscle Activation Bars */}
      {Object.keys(musclePumpData).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
          {Object.entries(musclePumpData).map(([muscleId, activation]) => {
            const muscleInfo = MUSCLE_GROUPS[muscleId];
            if (!muscleInfo) return null;

            return (
              <motion.div
                key={muscleId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-1"
              >
                <div className="flex justify-between items-center gap-1">
                  <span className="text-[10px] font-bold text-neutral-300 truncate">
                    {muscleInfo.name}
                  </span>
                  <span className="text-[10px] font-black text-yellow-400">
                    {activation}%
                  </span>
                </div>
                <div className="w-full h-2 bg-neutral-700/50 rounded-full overflow-hidden border border-neutral-600/30">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${activation}%` }}
                    transition={{ duration: 0.6, delay: Math.random() * 0.2 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Loading or No Data State */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-neutral-400">
          <div className="animate-spin rounded-full h-6 w-6 border border-yellow-400/30 border-t-yellow-400" />
          <span className="ml-2 text-[10px] font-bold uppercase">Carregando dados...</span>
        </div>
      )}

      {!loading && Object.keys(musclePumpData).length === 0 && !activeMuscles.length && (
        <div className="text-center py-8 text-neutral-500">
          <p className="text-[10px] font-bold uppercase tracking-widest">
            Selecione um exercício para ver o mapa muscular
          </p>
        </div>
      )}
    </motion.div>
  );
}
