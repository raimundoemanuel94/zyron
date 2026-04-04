/**
 * iOS Audio Persistence Utility
 * Purpose: Provides a safe way to unlock the Web Audio API context.
 * Refactored: Removed global side-effects to prevent ReferenceErrors during boot.
 */

class AudioUnlocker {
  constructor() {
    this.context = null;
    this.isUnlocked = false;
    this.silentBuffer = null;
  }

  /**
   * Safe initialization to be called from a React useEffect
   */
  async init() {
    if (this.isUnlocked || typeof window === 'undefined') return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.context) {
        this.context = new AudioContext();
      }

      // Create a 1-second silent buffer
      this.silentBuffer = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
      
      console.log('🔇 AudioUnlocker: Pronto para desbloqueio na primeira interação.');
      return true;
    } catch (err) {
      console.error('❌ AudioUnlocker init error:', err);
      return false;
    }
  }

  /**
   * The actual unlock call - MUST be triggered by a user event (click/touch)
   */
  async unlock() {
    if (!this.context || this.isUnlocked) return;

    try {
      if (this.context.state === 'suspended') {
        await this.context.resume();
      }
      
      // Play a tiny silent sound to satisfy iOS requirements
      const source = this.context.createBufferSource();
      source.buffer = this.silentBuffer;
      source.connect(this.context.destination);
      source.start(0);
      
      this.isUnlocked = true;
      console.log('🔊 Áudio ZYRON desbloqueado via AudioContext (iOS Safe)');
      return true;
    } catch (err) {
      console.error('❌ Falha ao desbloquear contexto de áudio:', err);
      return false;
    }
  }

  /**
   * Maintains the context active for background play
   */
  keepAlive() {
    if (!this.context || !this.isUnlocked) return;
    try {
      const source = this.context.createBufferSource();
      source.buffer = this.silentBuffer;
      source.connect(this.context.destination);
      source.start(0);
    } catch (e) {
      // Ignore background drift errors
    }
  }
}

const audioUnlocker = new AudioUnlocker();
export default audioUnlocker;
