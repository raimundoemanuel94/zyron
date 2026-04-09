import audioUnlocker from './audioUnlock';
import logger from './logger';

/**
 * ZYRON Hardcore PWA Heartbeat
 * Purpose: Keeps the app alive in the background during active workouts.
 * Strategy: Periodic silent playback combined with high-priority intervals.
 */
class HardcorePWA {
  constructor() {
    this.intervalId = null;
    this.isActive = false;
  }

  startHeartbeat() {
    if (this.isActive) return;
    
    this.isActive = true;
    logger.systemEvent('Iniciando Heartbeat ZYRON (Background Survival)');

    // Unlock audio context if not already done
    audioUnlocker.init();

    // Trigger heartbeat every 25 seconds
    // (Typical iOS background suspension threshold is around 30s-1m)
    this.intervalId = setInterval(() => {
      this.beat();
    }, 25000);

    // Immediate beat
    this.beat();
  }

  stopHeartbeat() {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.systemEvent('Heartbeat ZYRON encerrado');
  }

  beat() {
    if (!this.isActive) return;
    
    // Performance context ping
    audioUnlocker.keepAlive();
    
    // Log heartbeat for dev monitoring
    if (import.meta.env.DEV) {
      console.log('💓 Heartbeat: PWA Alive');
    }
  }
}

const hardcorePWA = new HardcorePWA();
export default hardcorePWA;
