import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music, Maximize2, Zap } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';
import audioUnlocker from '../utils/audioUnlock';

/**
 * ZYRON Global Player Component
 * Handles music playback and UI, with built-in iOS audio unlock protection.
 */
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

  // ZYRON iOS RESCUE: Secure Audio Context Unlock
  useEffect(() => {
    // 1. Initialize the internal context (stateless)
    audioUnlocker.init();

    // 2. Define the interaction handler
    const handleInteraction = async () => {
      console.log('🎵 Interação detectada: Desbloqueando motor de áudio...');
      const success = await audioUnlocker.unlock();
      
      if (success) {
        // Remove listeners immediately after success
        window.removeEventListener('click', handleInteraction);
        window.removeEventListener('touchstart', handleInteraction);
      }
    };

    // 3. Attach listeners globally but managed by this component
    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  // Sync animation position on mount or changes
  useEffect(() => {
    controls.set(playerPosition);
  }, [playerPosition, controls]);

  // MEDIA SESSION API: Industrial background support
  useEffect(() => {
    if ('mediaSession' in navigator && currentTrack) {
      // 1. Atualizar Metadados (iOS/Android Lockscreen)
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Treino ZYRON',
        artist: currentTrack.artist || 'ZYRON Coach',
        album: 'A Força da Sua Evolução',
        artwork: [
          { src: currentTrack.thumbnail || '/images/zyron-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/images/zyron-192.png', sizes: '192x192', type: 'image/png' }
        ]
      });

      // 2. Handlers de Controle Remoto
      const actions = [
        ['play', togglePlay],
        ['pause', togglePlay],
        ['previoustrack', prevTrack],
        ['nexttrack', nextTrack],
        ['seekbackward', () => {}],
        ['seekforward', () => {}]
      ];

      for (const [action, handler] of actions) {
        try {
          navigator.mediaSession.setActionHandler(action, handler);
        } catch (error) {
          console.warn(`MediaSession action "${action}" não suportada.`);
        }
      }

      // 3. Sincronizar estado de reprodução
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [currentTrack, isPlaying, togglePlay, nextTrack, prevTrack]);

  const handleDragEnd = (event, info) => {
    // Current offset within constraints
    let newPos = { x: info.offset.x, y: info.offset.y };
    
    // Window boundaries for snap logic (approximate assuming player is small)
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const currentAbsoluteX = info.point.x;
    const currentAbsoluteY = info.point.y;
    
    // Auto-Snap to Edges (Left or Right) to free visual space
    if (currentAbsoluteX < windowWidth / 2) {
      newPos.x -= currentAbsoluteX - 20; // Snap to left margin
    } else {
      newPos.x += (windowWidth - currentAbsoluteX) - 20; // Snap to right margin
    }

    // Auto-Snap to avoid Bottom Bar and Top Safe Area
    if (currentAbsoluteY > windowHeight - 100) {
      newPos.y -= (currentAbsoluteY - (windowHeight - 120)); // Push up from bottom nav
    } else if (currentAbsoluteY < 80) {
      newPos.y += (80 - currentAbsoluteY); // Push down from top edge/notches
    }

    // Animate to snapped position
    controls.start({ x: newPos.x, y: newPos.y, transition: { type: 'spring', stiffness: 300, damping: 30 } });
    
    // Save to LocalStorage persistently
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
      dragConstraints={constraintsRef} // App.jsx ref holding the screen
      dragElastic={0.1}
      dragMomentum={false} // Prevent sliding off-screen indefinitely
      animate={controls}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, opacity: 0.95, cursor: 'grabbing' }}
      whileTap={{ scale: 0.98 }}
      className={`fixed z-50 cursor-grab touch-none select-none
        ${isMinimized 
          ? 'w-16 h-16 rounded-[2rem]' 
          : 'w-64 rounded-[2.5rem] p-1.5'
        }
        bg-black/70 backdrop-blur-xl border border-yellow-400/80 shadow-[0_10px_40px_rgba(253,224,71,0.25)]
        flex items-center gap-2 overflow-hidden transition-[width,height,border-radius] duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]
      `}
      style={{ bottom: '100px', left: '20px' }}
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
