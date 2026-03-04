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

  const handleTap = (e) => {
    // Evitar que cliques nos botões de controle propaguem para o container
    if (e.target.closest('button')) return;
    
    toggleMinimized();
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
          ? 'w-14 h-14 rounded-full' 
          : 'w-60 rounded-full p-1'
        }
        bg-black/80 backdrop-blur-2xl border-2 border-yellow-400 shadow-[0_0_25px_rgba(253,224,71,0.2)]
        flex items-center gap-2 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)]
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
                 <Music className="text-yellow-400" size={20} />
               </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 border-[3px] border-yellow-400/30 rounded-full animate-ping" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expanded-pill"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center w-full gap-2 px-1 relative"
          >
            {/* Thumbnail Circle */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-lg">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="Capa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="text-yellow-400" size={14} />
                </div>
              )}
            </div>

            {/* Compact Metadata */}
            <div className="flex-1 min-w-0">
               <h4 className="text-[10px] font-black text-white truncate uppercase tracking-tighter">
                 {currentTrack.title}
               </h4>
               <p className="text-[8px] font-bold text-yellow-400/80 truncate uppercase">
                 {currentTrack.artist || 'ZYRON'}
               </p>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-1.5 pr-1">
              <button 
                onTouchStart={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black active:scale-90 transition-transform shadow-md"
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); nextTrack(); }}
                className="text-white/40 hover:text-white transition-colors p-1"
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
