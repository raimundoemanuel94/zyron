/**
 * ZYRON Sanitizer Utility
 * Purpose: Prevent "Circular Structure" errors when saving state to LocalStorage
 * by removing non-serializable objects (React Events, DOM Nodes, etc.)
 */

export const sanitizeWorkoutState = (state) => {
  if (state === null || state === undefined) return state;

  // Handle primitives directly
  if (typeof state !== 'object') {
    return state;
  }

  // Handle arrays
  if (Array.isArray(state)) {
    return state.map(item => sanitizeWorkoutState(item));
  }

  // Handle objects
  const sanitized = {};
  
  for (const [key, value] of Object.entries(state)) {
    // Skip internal React/DOM properties
    if (key.startsWith('_') || key.startsWith('$$')) continue;

    // Detect if value is a React Event or DOM element
    if (value && typeof value === 'object') {
      // Is it a DOM Node?
      if (value instanceof Node || (typeof value.nodeType === 'number' && typeof value.nodeName === 'string')) {
        continue;
      }
      // Is it a React Synthetic Event?
      if (value.nativeEvent || value.target) {
        // Special case: if it's startSession being called by an event
        // we omit the event object entirely.
        continue;
      }
      
      // Recursive sanitization for nested objects
      sanitized[key] = sanitizeWorkoutState(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Specifically cleans the workout session before stringify
 */
export const cleanSessionData = (session) => {
  return {
    date: String(session.date || new Date().toDateString()),
    isTraining: Boolean(session.isTraining),
    selectedWorkoutKey: typeof session.selectedWorkoutKey === 'object' ? null : session.selectedWorkoutKey,
    completedExercises: Array.isArray(session.completedExercises) 
      ? session.completedExercises.filter(ex => typeof ex === 'string') 
      : [],
    sessionTime: Number(session.sessionTime) || 0
  };
};
