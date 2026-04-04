/**
 * MusclePumpWrapper.jsx
 * Wraps TabTreino to add interactive muscle highlighting
 * Premium feature: Shows which muscles are being worked
 */

import React from 'react';
import { useMusclePump } from '../../hooks/useMusclePump';
import { motion, AnimatePresence } from 'framer-motion';

export default function MusclePumpWrapper({
  children,
  userRole,
  isTraining,
}) {
  const {
    activeMuscles,
    activePrimaryMuscles,
    currentExerciseId,
    isAnimating,
    activateMusclePump,
    deactivateMusclePump,
    isPremiumUser
  } = useMusclePump(userRole);

  // Clone children and pass down muscle pump handlers
  const enhancedChildren = React.cloneElement(children, {
    onActivateMuscle: activateMusclePump,
    onDeactivateMuscle: deactivateMusclePump,
    isPremiumUser,
    currentExerciseId,
    activePrimaryMuscles,
    activeMuscles,
  });

  return (
    <div className="relative w-full">
      {enhancedChildren}

      {/* Premium Badge - shows when muscle is active */}
      <AnimatePresence>
        {isTraining && isPremiumUser && currentExerciseId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-4 right-4 z-30 px-4 py-2 bg-red-600/20 border border-red-500/50 rounded-full backdrop-blur-sm"
          >
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
              🔴 Neural Pump Ativo
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Feature Notice (for non-premium users) */}
      {isTraining && !isPremiumUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 z-20 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl backdrop-blur-sm"
        >
          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
            💎 Neural Pump é um recurso PREMIUM
          </p>
        </motion.div>
      )}
    </div>
  );
}
