import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music, Maximize2, Zap } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export default function GlobalPlayer({ constraintsRef }) {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    progress,
    playerPosition,
    updatePlayerPosition,
    isMinimized,
    toggleMinimized
  } = useMusic();

  const controls = useAnimation();
  const [lastTap, setLastTap] = useState(0);

  // Sync animation position on mount or changes
  useEffect(() => {
    controls.set(playerPosition);
  }, [playerPosition, controls]);

  const handleDragEnd = (event, info) => {
    const newPos = { x: info.offset.x, y: info.offset.y };
    
    // Auto-Snap logic to avoid blocking central nav
    const windowHeight = window.innerHeight;
    const fromBottom = windowHeight - info.point.y;
    
    // Se estiver muito embaixo, empurra um pouco pra cima
    if (fromBottom < 100) {
      newPos.y -= 50;
      controls.start({ y: newPos.y, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }

    updatePlayerPosition(newPos);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      toggleMinimized();
    }
    setLastTap(now);
  };

  if (!currentTrack) return null;

  return (
    <motion.div
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.1}
      dragMomentum={false}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, opacity: 0.9, cursor: 'grabbing' }}
      className={`fixed z-9999 cursor-grab touch-none select-none
        ${isMinimized 
          ? 'w-16 h-16 rounded-full' 
          : 'w-[320px] rounded-full p-1.5'
        }
        bg-black/60 backdrop-blur-2xl border-2 border-yellow-400 shadow-[0_0_30px_rgba(253,224,71,0.25)]
        flex items-center gap-3 overflow-hidden transition-all duration-500 ease-out
      `}
      style={{ bottom: '140px', left: '20px' }}
      onClick={handleTap}
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized-pill"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-full h-full rounded-full overflow-hidden relative group"
          >
            {currentTrack.thumbnail ? (
               <img src={currentTrack.thumbnail} alt="Capa" className="w-full h-full object-cover brightness-75 group-hover:brightness-100 transition-all" />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                 <Music className="text-yellow-400" size={24} />
               </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 border-4 border-yellow-400/30 rounded-full animate-ping" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expanded-pill"
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            className="flex items-center w-full gap-3 px-3 relative"
          >
            {/* Thumbnail Mini */}
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="text-yellow-400" size={18} />
                </div>
              )}
            </div>

            {/* Track Metadata */}
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-1 mb-0.5">
                 <Zap size={10} className="text-yellow-400 fill-yellow-400" />
                 <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest opacity-80">ZYRON Radio Live</span>
               </div>
               <h4 className="text-[11px] font-black text-white truncate leading-none uppercase tracking-tighter">
                 {currentTrack.title}
               </h4>
               <p className="text-[9px] font-bold text-neutral-400 truncate uppercase mt-1">
                 {currentTrack.artist || 'Nocaute Sonoro'}
               </p>
            </div>

            {/* Interactive Controls */}
            <div className="flex items-center gap-2.5 bg-white/5 py-1 px-3 rounded-full border border-white/5">
              <button 
                onTouchStart={(e) => { e.stopPropagation(); prevTrack(); }}
                className="text-white/40 hover:text-yellow-400 transition-colors"
                title="Voltar"
              >
                <SkipBack size={16} fill="currentColor" />
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-9 h-9 rounded-full bg-yellow-400 flex items-center justify-center text-black shadow-[0_0_15px_rgba(253,224,71,0.4)] active:scale-90 transition-transform"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); nextTrack(); }}
                className="text-white/40 hover:text-yellow-400 transition-colors"
                title="Próxima"
              >
                <SkipForward size={16} fill="currentColor" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Precision Progress Bar */}
      {!isMinimized && (
        <div className="absolute bottom-0 left-0 h-[2px] w-full bg-white/10 overflow-hidden">
          <motion.div 
            className="h-full bg-yellow-400 shadow-[0_0_10px_#FDE047]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
