/**
 * useMusclePump.js
 * Custom hook to manage active muscle groups during workout
 * Handles premium feature checking and muscle highlight state
 */

import { useState, useCallback, useEffect } from 'react';
import { getActiveMuscles, getPrimaryMuscles } from '../data/muscleMapping';

export function useMusclePump(userRole) {
  const [activeMuscles, setActiveMuscles] = useState([]);
  const [activePrimaryMuscles, setActivePrimaryMuscles] = useState([]);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if user has premium access (ADMIN or PERSONAL trainer also has access)
  const isPremiumUser = userRole === 'PREMIUM' || userRole === 'ADMIN' || userRole === 'PERSONAL';

  // Activate muscles for an exercise
  const activateMusclePump = useCallback((exerciseId) => {
    if (!isPremiumUser) return;

    setIsAnimating(true);
    setCurrentExerciseId(exerciseId);

    // Get all active muscles (primary + secondary)
    const allMuscles = getActiveMuscles(exerciseId);
    // Get only primary muscles for stronger effect
    const primaryMuscles = getPrimaryMuscles(exerciseId);

    setActiveMuscles(allMuscles);
    setActivePrimaryMuscles(primaryMuscles);

    // Reset animation state after duration
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [isPremiumUser]);

  // Deactivate muscle pump
  const deactivateMusclePump = useCallback(() => {
    setActiveMuscles([]);
    setActivePrimaryMuscles([]);
    setCurrentExerciseId(null);
    setIsAnimating(false);
  }, []);

  return {
    activeMuscles,
    activePrimaryMuscles,
    currentExerciseId,
    isAnimating,
    activateMusclePump,
    deactivateMusclePump,
    isPremiumUser,
  };
}
