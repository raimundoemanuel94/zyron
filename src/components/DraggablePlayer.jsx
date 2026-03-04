import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music, Maximize2 } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export default function DraggablePlayer({ constraintsRef }) {
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

  // Auto-Snap Logic
  const handleDragEnd = (event, info) => {
    const { x, y } = info.point;
    let newX = info.offset.x;
    let newY = info.offset.y;

    // Se estiver muito perto da parte inferior (BottomBar), snap para cima
    const windowHeight = window.innerHeight;
    const threshold = windowHeight - 160; // 160px from bottom

    if (y > threshold) {
      newY = threshold - (windowHeight / 2); // Ajuste relativo
      controls.start({ y: newY, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    }

    updatePlayerPosition({ x: info.offset.x, y: info.offset.y });
  };

  // Double Tap Logic
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
      initial={playerPosition}
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, opacity: 0.9 }}
      onClick={handleTap}
      className={`fixed z-100 cursor-grab active:cursor-grabbing touch-none select-none
        ${isMinimized 
          ? 'w-16 h-16 rounded-full p-1' 
          : 'w-72 rounded-full p-1'
        }
        bg-black/60 backdrop-blur-2xl border border-yellow-400 shadow-[0_0_20px_rgba(253,224,71,0.3)]
        flex items-center gap-3 overflow-hidden transition-all duration-300
      `}
      style={{ bottom: '120px', left: '20px' }} // Initial position base
    >
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.div
            key="minimized"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="w-full h-full rounded-full overflow-hidden relative"
          >
            {currentTrack.thumbnail ? (
               <img src={currentTrack.thumbnail} alt="Cover" className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                 <Music className="text-yellow-400" size={24} />
               </div>
            )}
            {isPlaying && (
              <div className="absolute inset-0 border-2 border-yellow-400 rounded-full animate-ping opacity-50" />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex items-center w-full gap-3 px-2"
          >
            {/* Thumbnail */}
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/10">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="text-neutral-500" size={16} />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
               <div className="text-[10px] font-black text-white truncate leading-tight uppercase tracking-tighter">
                 {currentTrack.title}
               </div>
               <div className="text-[8px] font-bold text-yellow-400 truncate uppercase tracking-widest opacity-80">
                 {currentTrack.artist}
               </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 shrink-0 pr-1">
              <button 
                onTouchStart={(e) => { e.stopPropagation(); prevTrack(); }}
                className="text-white/50 hover:text-white p-1"
              >
                <SkipBack size={14} />
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center text-black"
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              
              <button 
                onTouchStart={(e) => { e.stopPropagation(); nextTrack(); }}
                className="text-white/50 hover:text-white p-1"
              >
                <SkipForward size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dynamic Progress Indicator (Border or shadow) */}
      {!isMinimized && (
        <div className="absolute bottom-0 left-0 h-[2px] bg-yellow-400/20 w-full overflow-hidden">
          <motion.div 
            className="h-full bg-yellow-400 shadow-[0_0_8px_#FDE047]"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
