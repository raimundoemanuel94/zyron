import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Music } from 'lucide-react';
import { useMusic } from '../contexts/MusicContext';

export default function MiniPlayer() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress } = useMusic();
  const [expanded, setExpanded] = useState(false);

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          key="mini-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-20 left-4 right-4 z-[45] bg-black/60 backdrop-blur-xl border border-yellow-400/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden"
        >
        {/* Progress Bar Top */}
        <div className="absolute top-0 left-0 h-[2px] bg-white/5 w-full">
          <div 
            className="h-full bg-yellow-400 shadow-[0_0_8px_rgba(253,224,71,0.8)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between p-3 gap-3">
          {/* Thumbnail / Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setExpanded(!expanded)}>
            <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0 bg-neutral-900 border border-white/10 group">
              {currentTrack.thumbnail ? (
                <img src={currentTrack.thumbnail} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-neutral-800">
                  <Music className="text-neutral-500" size={16} />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-yellow-400/20 mix-blend-overlay animate-pulse" />
              )}
            </div>
            
            <div className="flex flex-col truncate">
              <span className="text-xs font-black text-white truncate drop-shadow-md">
                {currentTrack.title || 'ZYRON Radio'}
              </span>
              <span className="text-[9px] font-bold text-yellow-400/70 uppercase tracking-widest truncate">
                {currentTrack.artist || 'ZYRON Mix'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 shrink-0 px-2">
            <button 
              onClick={(e) => { e.stopPropagation(); prevTrack(); }}
              className="text-neutral-400 hover:text-white transition-colors p-1"
            >
              <SkipBack size={18} />
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                isPlaying 
                  ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' 
                  : 'bg-white text-black hover:bg-yellow-400'
              }`}
            >
              {isPlaying ? <Pause size={18} className="fill-current" /> : <Play size={18} className="fill-current ml-1" />}
            </button>
            
            <button 
              onClick={(e) => { e.stopPropagation(); nextTrack(); }}
              className="text-neutral-400 hover:text-white transition-colors p-1"
            >
              <SkipForward size={18} />
            </button>
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
