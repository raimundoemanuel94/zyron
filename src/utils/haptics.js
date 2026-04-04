/**
 * ZYRON Haptics Engine
 * Provides tactile feedback for mobile interactions.
 * Uses navigator.vibrate with fallbacks for non-supported browsers.
 */
class Haptics {
  /**
   * Selection/Light tap (e.g., tab switch, hover)
   */
  light() {
    this._vibrate(10);
  }

  /**
   * Medium/Action tap (e.g., button click, toggle)
   */
  medium() {
    this._vibrate(25);
  }

  /**
   * Heavy/Important action (e.g., start session)
   */
  heavy() {
    this._vibrate(40);
  }

  /**
   * Success sequence (e.g., workout finished)
   */
  success() {
    this._vibrate([30, 50, 60]);
  }

  /**
   * Error/Warning sequence
   */
  error() {
    this._vibrate([100, 50, 100]);
  }

  /**
   * Internal vibrator with silent check
   */
  _vibrate(pattern) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore vibration errors (e.g., permissions)
      }
    }
  }
}

const haptics = new Haptics();
export default haptics;
