import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, Music, Minimize2, Maximize2 } from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import audioUnlocker from '../../utils/audioUnlock';

export default function GlobalPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    nextTrack,
    progress,
    isMinimized,
    toggleMinimized,
  } = useMusic();

  useEffect(() => {
    audioUnlocker.init();

    const handleInteraction = async () => {
      const success = await audioUnlocker.unlock();
      if (success) {
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  if (!currentTrack) return null;

  return (
    <div
      className="fixed z-50 right-4 left-4 sm:left-auto sm:w-[320px] pointer-events-none"
      style={{ top: 'calc(82px + env(safe-area-inset-top))' }}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="music-player-minimized"
            initial={{ opacity: 0, scale: 0.92, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -10 }}
            className="pointer-events-auto ml-auto w-16 h-16 rounded-[1.75rem] overflow-hidden border border-lime-300/40 bg-black/80 shadow-[0_20px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <button
              onClick={toggleMinimized}
              className="relative w-full h-full"
              aria-label="Expandir player"
            >
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover opacity-90" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-950">
                  <Music size={18} className="text-lime-300" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              <div className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white">
                <Maximize2 size={12} />
              </div>

              {isPlaying && (
                <div className="absolute inset-0 rounded-[1.75rem] border-2 border-lime-300/35 animate-pulse" />
              )}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="music-player-expanded"
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto ml-auto rounded-[1.8rem] border border-lime-300/20 bg-black/82 shadow-[0_24px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="relative w-12 h-12 rounded-[1rem] overflow-hidden shrink-0 border border-white/10 bg-neutral-900">
                {currentTrack.thumbnail ? (
                  <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={18} className="text-lime-300" />
                  </div>
                )}

                {isPlaying && (
                  <div className="absolute inset-0 rounded-[1rem] border border-lime-300/40" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-lime-300/80">
                  Player Global
                </p>
                <h4 className="text-[12px] font-black text-white truncate leading-tight">
                  {currentTrack.title}
                </h4>
                <p className="text-[10px] font-semibold text-white/55 truncate">
                  {currentTrack.artist || 'ZYRON Radio'}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={toggleMinimized}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-white/70 transition-colors hover:text-white"
                  aria-label="Minimizar player"
                >
                  <Minimize2 size={15} />
                </button>

                <button
                  onClick={togglePlay}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-300 text-black shadow-[0_0_22px_rgba(205,255,90,0.25)] active:scale-95"
                  aria-label={isPlaying ? 'Pausar musica' : 'Tocar musica'}
                >
                  {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                </button>

                <button
                  onClick={nextTrack}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-white/80 transition-colors hover:text-white"
                  aria-label="Proxima faixa"
                >
                  <SkipForward size={16} />
                </button>
              </div>
            </div>

            <div className="px-3 pb-3">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-[0.18em] text-white/45 mb-2">
                <span>{isPlaying ? 'Tocando em segundo plano' : 'Pronto para retomar'}</span>
                <span>{Math.round(progress || 0)}%</span>
              </div>

              <div className="h-[4px] rounded-full bg-white/8 overflow-hidden">
                <motion.div
                  className="h-full bg-lime-300"
                  animate={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
