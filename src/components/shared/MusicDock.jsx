import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronDown, Music2, Search, Shuffle, Repeat,
  X, Loader2,
} from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import audioUnlocker from '../../utils/audioUnlock';

// ── Constants ────────────────────────────────────────────────────────────────
const NAV_HEIGHT = 68; // matches the SVG shell height in FichaDeTreinoScreen

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatProgress = (p) => `${Math.round(p || 0)}%`;

// ── Sub-components ────────────────────────────────────────────────────────────

function AlbumArt({ track, size = 48, borderRadius = 12, isPlaying }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-neutral-900"
      style={{ width: size, height: size, borderRadius, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {track?.thumbnail ? (
        <img
          src={track.thumbnail}
          alt={track.title}
          className="w-full h-full object-cover"
          style={{ transition: 'opacity 0.3s' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Music2 size={size * 0.35} className="text-lime-300/50" />
        </div>
      )}
      {isPlaying && (
        <div
          className="absolute inset-0 border-2 border-lime-300/40"
          style={{ borderRadius, animation: 'pulse 2s infinite' }}
        />
      )}
    </div>
  );
}

function ProgressBar({ progress }) {
  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
      <motion.div
        className="h-full rounded-full bg-lime-300"
        animate={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
        transition={{ duration: 0.5, ease: 'linear' }}
      />
    </div>
  );
}

function ControlBtn({ onClick, children, primary = false, active = false, size = 40 }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={onClick}
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: primary
          ? '#cdff5a'
          : active
          ? 'rgba(205,255,90,0.12)'
          : 'rgba(255,255,255,0.07)',
        border: active && !primary ? '1px solid rgba(205,255,90,0.3)' : '1px solid transparent',
        color: primary ? '#000' : active ? '#cdff5a' : 'rgba(255,255,255,0.75)',
        boxShadow: primary ? '0 0 24px rgba(205,255,90,0.22), 0 4px 16px rgba(0,0,0,0.4)' : 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

function SearchPanel({ onSelect, onClose }) {
  const { searchMusic, loadVideoById, setPlaylist, playlist } = useMusic();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);
      clearTimeout(debounceRef.current);
      if (!val.trim()) { setResults([]); return; }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const data = await searchMusic(val);
          setResults(data || []);
        } finally {
          setLoading(false);
        }
      }, 500);
    },
    [searchMusic],
  );

  const handlePick = useCallback(
    (track) => {
      audioUnlocker.unlock();
      loadVideoById(track);
      // Add to playlist if not already there
      setPlaylist((prev) => {
        const exists = prev.some((t) => t.id === track.id);
        return exists ? prev : [...prev, track];
      });
      onSelect?.();
    },
    [loadVideoById, setPlaylist, onSelect],
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          height: 48,
        }}
      >
        <Search size={15} className="text-white/40 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          placeholder="Buscar músicas, artistas..."
          className="flex-1 bg-transparent outline-none text-white placeholder-white/30 text-[13px] font-medium"
        />
        {loading && <Loader2 size={14} className="text-lime-300/70 animate-spin shrink-0" />}
        {query && !loading && (
          <button onClick={() => { setQuery(''); setResults([]); }}>
            <X size={14} className="text-white/40" />
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 220 }}>
          {results.map((track) => (
            <motion.button
              key={track.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => handlePick(track)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-left"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <img
                src={track.thumbnail}
                alt={track.title}
                className="w-10 h-10 rounded-lg object-cover shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-white text-[12px] font-bold truncate leading-tight">{track.title}</p>
                <p className="text-white/45 text-[10px] font-medium truncate mt-0.5">{track.artist}</p>
              </div>
              <div
                className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(205,255,90,0.1)', border: '1px solid rgba(205,255,90,0.25)' }}
              >
                <Play size={11} className="text-lime-300 ml-0.5" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <p className="text-center text-white/30 text-[12px] py-4">Nenhum resultado para "{query}"</p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MusicDock() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress } = useMusic();

  const [isOpen, setIsOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isShuffleOn, setIsShuffleOn] = useState(false);
  const [isRepeatOn, setIsRepeatOn] = useState(false);

  // Unlock audio on first interaction
  useEffect(() => {
    const unlock = async () => {
      await audioUnlocker.init();
      await audioUnlocker.unlock();
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('touchstart', unlock);
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  const handleTogglePlay = useCallback(
    async (e) => {
      e.stopPropagation();
      await audioUnlocker.unlock();
      togglePlay();
    },
    [togglePlay],
  );

  const handleNext = useCallback(
    (e) => { e?.stopPropagation(); nextTrack(); },
    [nextTrack],
  );

  const handlePrev = useCallback(
    (e) => { e?.stopPropagation(); prevTrack(); },
    [prevTrack],
  );

  const openExpanded = useCallback(() => {
    setIsOpen(true);
    setShowSearch(false);
  }, []);

  const closeExpanded = useCallback(() => {
    setIsOpen(false);
    setShowSearch(false);
  }, []);

  return (
    <>
      {/* ── EXPANDED SHEET ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Scrim */}
            <motion.div
              key="dock-scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[55]"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
              onClick={closeExpanded}
            />

            {/* Sheet */}
            <motion.div
              key="dock-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 38 }}
              className="fixed left-0 right-0 z-[56] flex flex-col"
              style={{
                bottom: 0,
                borderRadius: '28px 28px 0 0',
                background: 'linear-gradient(180deg, #141416 0%, #0e0e10 100%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                boxShadow: '0 -24px 60px rgba(0,0,0,0.7)',
                maxHeight: '90vh',
                paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-4 pb-2 shrink-0">
                <button
                  onClick={closeExpanded}
                  className="w-10 h-[4px] rounded-full"
                  style={{ background: 'rgba(255,255,255,0.15)' }}
                />
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between px-5 pb-4 shrink-0">
                <button
                  onClick={() => { setShowSearch((s) => !s); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{
                    background: showSearch ? 'rgba(205,255,90,0.12)' : 'rgba(255,255,255,0.06)',
                    border: showSearch ? '1px solid rgba(205,255,90,0.25)' : '1px solid rgba(255,255,255,0.08)',
                    color: showSearch ? '#cdff5a' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <Search size={13} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>
                    Buscar
                  </span>
                </button>

                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 900,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.3)',
                  }}
                >
                  Player
                </p>

                <button
                  onClick={closeExpanded}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <ChevronDown size={15} className="text-white/60" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div
                      key="search-panel"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <SearchPanel onSelect={() => setShowSearch(false)} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="player-panel"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col items-center gap-6 pb-4"
                    >
                      {/* Album art — large */}
                      {currentTrack ? (
                        <motion.div
                          initial={{ scale: 0.92, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                          className="relative rounded-[24px] overflow-hidden"
                          style={{
                            width: 200,
                            height: 200,
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: isPlaying
                              ? '0 0 48px rgba(205,255,90,0.14), 0 24px 48px rgba(0,0,0,0.6)'
                              : '0 16px 40px rgba(0,0,0,0.6)',
                          }}
                        >
                          {currentTrack.thumbnail ? (
                            <img
                              src={currentTrack.thumbnail}
                              alt={currentTrack.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                              <Music2 size={64} className="text-lime-300/30" />
                            </div>
                          )}
                          {/* Neon pulse ring when playing */}
                          {isPlaying && (
                            <div
                              className="absolute inset-0 rounded-[24px]"
                              style={{
                                border: '2px solid rgba(205,255,90,0.35)',
                                animation: 'pulse 2s ease-in-out infinite',
                              }}
                            />
                          )}
                        </motion.div>
                      ) : (
                        <div
                          className="flex flex-col items-center justify-center gap-3 rounded-[24px]"
                          style={{
                            width: 200,
                            height: 200,
                            background: 'rgba(255,255,255,0.03)',
                            border: '1.5px dashed rgba(255,255,255,0.1)',
                          }}
                        >
                          <Music2 size={40} className="text-white/20" />
                          <p className="text-white/30 text-[11px] font-bold uppercase tracking-wider text-center px-4">
                            Nenhuma música<br />carregada
                          </p>
                        </div>
                      )}

                      {/* Track info */}
                      <div className="text-center w-full px-2">
                        <h3 className="text-white font-black text-[16px] leading-snug truncate">
                          {currentTrack?.title || 'ZYRON Radio'}
                        </h3>
                        <p className="text-white/45 text-[12px] font-semibold mt-1 truncate">
                          {currentTrack?.artist || 'Adicione uma música para começar'}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full space-y-1.5">
                        <ProgressBar progress={progress} />
                        <div className="flex justify-between">
                          <span className="text-white/25 text-[10px] font-bold">
                            {isPlaying ? 'Tocando' : 'Pausado'}
                          </span>
                          <span className="text-white/25 text-[10px] font-bold">
                            {formatProgress(progress)}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-center gap-4 w-full">
                        <ControlBtn onClick={handlePrev} size={44}>
                          <SkipBack size={18} />
                        </ControlBtn>

                        <ControlBtn onClick={handleTogglePlay} primary size={64}>
                          {isPlaying
                            ? <Pause size={26} fill="currentColor" />
                            : <Play size={26} fill="currentColor" className="ml-1" />
                          }
                        </ControlBtn>

                        <ControlBtn onClick={handleNext} size={44}>
                          <SkipForward size={18} />
                        </ControlBtn>
                      </div>

                      {/* Shuffle / Repeat */}
                      <div className="flex items-center gap-3">
                        <ControlBtn
                          onClick={() => setIsShuffleOn((s) => !s)}
                          active={isShuffleOn}
                          size={38}
                        >
                          <Shuffle size={15} />
                        </ControlBtn>
                        <span className="text-white/15 text-[10px] font-bold uppercase tracking-widest">
                          ·
                        </span>
                        <ControlBtn
                          onClick={() => setIsRepeatOn((s) => !s)}
                          active={isRepeatOn}
                          size={38}
                        >
                          <Repeat size={15} />
                        </ControlBtn>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── COLLAPSED DOCK BAR ────────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 240, damping: 28 }}
        className="fixed left-0 right-0 z-[49] flex justify-center pointer-events-none"
        style={{
          bottom: `calc(${NAV_HEIGHT}px + max(14px, env(safe-area-inset-bottom)))`,
        }}
      >
        <div
          className="pointer-events-auto w-[94%] max-w-[430px] px-3"
          style={{ paddingBottom: 6 }}
        >
          <motion.div
            onClick={currentTrack ? openExpanded : openExpanded}
            whileTap={{ scale: 0.98 }}
            className="relative flex items-center gap-3 rounded-[20px] overflow-hidden cursor-pointer"
            style={{
              height: 62,
              background: currentTrack
                ? 'rgba(12,13,15,0.96)'
                : 'rgba(12,13,15,0.88)',
              border: currentTrack
                ? '1px solid rgba(205,255,90,0.18)'
                : '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
              boxShadow: currentTrack && isPlaying
                ? '0 -4px 24px rgba(205,255,90,0.08), 0 8px 32px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0,0,0,0.45)',
              paddingLeft: 10,
              paddingRight: 10,
            }}
          >
            {/* Subtle neon glow line at top when playing */}
            {isPlaying && currentTrack && (
              <div
                className="absolute top-0 left-6 right-6 h-[1px]"
                style={{ background: 'linear-gradient(to right, transparent, rgba(205,255,90,0.4), transparent)' }}
              />
            )}

            {/* Album art or icon */}
            <AlbumArt track={currentTrack} size={44} borderRadius={12} isPlaying={isPlaying} />

            {/* Track info */}
            <div className="min-w-0 flex-1">
              {currentTrack ? (
                <>
                  <p className="text-white text-[12px] font-black truncate leading-tight">
                    {currentTrack.title}
                  </p>
                  <p className="text-white/40 text-[10px] font-semibold truncate mt-0.5">
                    {currentTrack.artist || 'ZYRON Radio'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white/70 text-[12px] font-black truncate leading-tight">
                    ZYRON Music
                  </p>
                  <p className="text-white/30 text-[10px] font-semibold truncate mt-0.5">
                    Toque para buscar músicas
                  </p>
                </>
              )}
            </div>

            {/* Progress micro-bar below title — only when playing */}
            {currentTrack && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <motion.div
                  className="h-full bg-lime-300/70"
                  animate={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }}
                />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              {currentTrack && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={handleTogglePlay}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 40,
                    height: 40,
                    background: isPlaying ? '#cdff5a' : 'rgba(255,255,255,0.1)',
                    border: isPlaying ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: isPlaying ? '#000' : 'rgba(255,255,255,0.8)',
                    boxShadow: isPlaying ? '0 0 16px rgba(205,255,90,0.35)' : 'none',
                  }}
                >
                  {isPlaying
                    ? <Pause size={16} fill="currentColor" />
                    : <Play size={16} fill="currentColor" className="ml-0.5" />
                  }
                </motion.button>
              )}

              {/* Expand chevron */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={openExpanded}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <Search size={13} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
