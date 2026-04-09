import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  motion, AnimatePresence,
  useMotionValue, useTransform, useAnimation,
} from 'framer-motion';
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronDown, Music2, Search, Shuffle, Repeat,
  X, Loader2,
} from 'lucide-react';
import { useMusic } from '../../contexts/MusicContext';
import audioUnlocker from '../../utils/audioUnlock';

// ─────────────────────────────────────────────────────────────────────────────
const NAV_HEIGHT   = 68;   // SVG nav shell height
const DOCK_HEIGHT  = 62;   // collapsed pill height
const DOCK_GAP     = 6;    // gap between pill and nav

// ─────────────────────────────────────────────────────────────────────────────
// Waveform equalizer — 4 bars animated independently when playing
// ─────────────────────────────────────────────────────────────────────────────
function Equalizer({ isPlaying, size = 'sm' }) {
  const heights = size === 'lg' ? [18, 26, 20, 24] : [8, 12, 9, 11];
  const durations = [0.55, 0.7, 0.6, 0.65];

  return (
    <div
      className="flex items-end shrink-0"
      style={{ gap: size === 'lg' ? 3 : 2, height: heights[1] }}
    >
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className="rounded-full bg-lime-300"
          style={{ width: size === 'lg' ? 4 : 2.5, originY: 1, height: h }}
          animate={
            isPlaying
              ? {
                  scaleY: [1, 0.25, 0.8, 0.4, 1],
                  transition: {
                    duration: durations[i],
                    repeat: Infinity,
                    repeatType: 'mirror',
                    ease: 'easeInOut',
                    delay: i * 0.12,
                  },
                }
              : { scaleY: 0.2 }
          }
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Album art tile
// ─────────────────────────────────────────────────────────────────────────────
function AlbumArt({ track, size = 48, radius = 12 }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden bg-neutral-900"
      style={{ width: size, height: size, borderRadius: radius, border: '1px solid rgba(255,255,255,0.09)' }}
    >
      {track?.thumbnail ? (
        <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Music2 size={size * 0.33} className="text-lime-300/40" />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Progress bar
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Control button
// ─────────────────────────────────────────────────────────────────────────────
function ControlBtn({ onClick, children, primary = false, active = false, size = 40 }) {
  return (
    <motion.button
      whileTap={{ scale: 0.86 }}
      onClick={onClick}
      className="flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size, height: size,
        background: primary ? '#cdff5a' : active ? 'rgba(205,255,90,0.13)' : 'rgba(255,255,255,0.07)',
        border: active && !primary ? '1px solid rgba(205,255,90,0.32)' : '1px solid transparent',
        color: primary ? '#000' : active ? '#cdff5a' : 'rgba(255,255,255,0.75)',
        boxShadow: primary ? '0 0 28px rgba(205,255,90,0.28), 0 6px 18px rgba(0,0,0,0.45)' : 'none',
      }}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Search panel (inside expanded sheet)
// ─────────────────────────────────────────────────────────────────────────────
function SearchPanel({ onSelect }) {
  const { searchMusic, loadVideoById, setPlaylist } = useMusic();
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef   = useRef(null);
  const debounceId = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceId.current);
    if (!val.trim()) { setResults([]); return; }
    debounceId.current = setTimeout(async () => {
      setLoading(true);
      try { setResults((await searchMusic(val)) || []); }
      finally { setLoading(false); }
    }, 460);
  }, [searchMusic]);

  const pick = useCallback((track) => {
    audioUnlocker.unlock();
    loadVideoById(track);
    setPlaylist((p) => p.some((t) => t.id === track.id) ? p : [...p, track]);
    onSelect?.();
  }, [loadVideoById, setPlaylist, onSelect]);

  return (
    <div className="flex flex-col gap-3">
      {/* Input */}
      <div className="flex items-center gap-3 px-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', height: 48 }}>
        <Search size={14} className="text-white/35 shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={handleChange}
          placeholder="Músicas, artistas, álbuns..."
          className="flex-1 bg-transparent outline-none text-white placeholder-white/25 text-[13px] font-medium"
        />
        {loading
          ? <Loader2 size={13} className="text-lime-300/60 animate-spin shrink-0" />
          : query && <button onClick={() => { setQuery(''); setResults([]); }}><X size={13} className="text-white/35" /></button>
        }
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-1 overflow-y-auto" style={{ maxHeight: 230 }}>
          {results.map((track) => (
            <motion.button
              key={track.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => pick(track)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <img src={track.thumbnail} alt={track.title}
                className="w-10 h-10 rounded-xl object-cover shrink-0"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-white text-[12px] font-bold truncate leading-tight">{track.title}</p>
                <p className="text-white/40 text-[10px] font-medium truncate mt-0.5">{track.artist}</p>
              </div>
              <div className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(205,255,90,0.1)', border: '1px solid rgba(205,255,90,0.22)' }}>
                <Play size={11} className="text-lime-300 ml-0.5" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <p className="text-center text-white/25 text-[12px] py-5">Sem resultados para "{query}"</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export default function MusicDock() {
  const { currentTrack, isPlaying, togglePlay, nextTrack, prevTrack, progress } = useMusic();

  const [isOpen,       setIsOpen]       = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);
  const [isShuffleOn,  setIsShuffleOn]  = useState(false);
  const [isRepeatOn,   setIsRepeatOn]   = useState(false);
  const dragIntentRef = useRef(false);

  // Sheet drag-to-dismiss
  const sheetY       = useMotionValue(0);
  const sheetOpacity = useTransform(sheetY, [0, 220], [1, 0]);

  // Audio unlock
  useEffect(() => {
    const u = async () => {
      await audioUnlocker.init();
      await audioUnlocker.unlock();
      window.removeEventListener('click',      u);
      window.removeEventListener('touchstart', u);
    };
    window.addEventListener('click',      u);
    window.addEventListener('touchstart', u);
    return () => {
      window.removeEventListener('click',      u);
      window.removeEventListener('touchstart', u);
    };
  }, []);

  const handlePlay = useCallback(async (e) => {
    e?.stopPropagation();
    await audioUnlocker.unlock();
    togglePlay();
  }, [togglePlay]);

  const handleNext = useCallback((e) => { e?.stopPropagation(); nextTrack(); }, [nextTrack]);
  const handlePrev = useCallback((e) => { e?.stopPropagation(); prevTrack(); }, [prevTrack]);

  const open  = useCallback(() => { setIsOpen(true);  setShowSearch(false); sheetY.set(0); }, [sheetY]);
  const close = useCallback(() => { setIsOpen(false); setShowSearch(false); }, []);

  useEffect(() => {
    if (!currentTrack && isOpen) {
      close();
    }
  }, [currentTrack, isOpen, close]);

  // Dock pill: swipe-up → open sheet | swipe-left → next | swipe-right → prev
  const handleDockDragEnd = useCallback((_, info) => {
    const { x, y } = info.offset;
    const absX = Math.abs(x), absY = Math.abs(y);
    dragIntentRef.current = absX > 24 || absY > 24;
    if (dragIntentRef.current) {
      window.setTimeout(() => {
        dragIntentRef.current = false;
      }, 220);
    }
    if (absY > absX && y < -42) { open(); return; }
    if (absX > absY) {
      if (x < -55) { handleNext(); if (navigator.vibrate) navigator.vibrate(18); }
      if (x >  55) { handlePrev(); if (navigator.vibrate) navigator.vibrate(18); }
    }
  }, [open, handleNext, handlePrev]);

  const handleDockTap = useCallback(() => {
    if (dragIntentRef.current) {
      dragIntentRef.current = false;
      return;
    }

    open();
  }, [open]);

  // Sheet: swipe-down → close
  const handleSheetDragEnd = useCallback((_, info) => {
    if (info.offset.y > 90 || info.velocity.y > 500) close();
    else sheetY.set(0);
  }, [close, sheetY]);

  if (!currentTrack) return null;

  return (
    <>
      {/* ── EXPANDED SHEET ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Scrim */}
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[55]"
              style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
              onClick={close}
            />

            {/* Sheet */}
            <motion.div
              key="sheet"
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0, bottom: 0.28 }}
              onDragEnd={handleSheetDragEnd}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              className="fixed left-0 right-0 z-[56] flex flex-col"
              style={{
                y: sheetY,
                opacity: sheetOpacity,
                bottom: 0,
                borderRadius: '26px 26px 0 0',
                background: 'linear-gradient(180deg, #141417 0%, #0d0d10 100%)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderBottom: 'none',
                boxShadow: '0 -28px 64px rgba(0,0,0,0.75)',
                maxHeight: '91vh',
                paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
                touchAction: 'none',
              }}
            >
              {/* Drag handle — tap to close, drag to dismiss */}
              <div className="flex justify-center pt-3.5 pb-2 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-9 h-[4px] rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 shrink-0">
                <button
                  onClick={() => setShowSearch((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: showSearch ? 'rgba(205,255,90,0.13)' : 'rgba(255,255,255,0.06)',
                    border: showSearch ? '1px solid rgba(205,255,90,0.28)' : '1px solid rgba(255,255,255,0.08)',
                    color: showSearch ? '#cdff5a' : 'rgba(255,255,255,0.45)',
                  }}
                >
                  <Search size={12} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em' }}>Buscar</span>
                </button>

                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.22em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                  {isPlaying ? 'Tocando agora' : 'Player'}
                </span>

                <button onClick={close}
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ChevronDown size={14} className="text-white/50" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5">
                <AnimatePresence mode="wait">
                  {showSearch ? (
                    <motion.div key="sp"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                      <SearchPanel onSelect={() => setShowSearch(false)} />
                    </motion.div>
                  ) : (
                    <motion.div key="pp"
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
                      className="flex flex-col items-center gap-5 pb-4">

                      {/* Large album art */}
                      <motion.div
                        key={currentTrack?.id || 'empty'}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                        className="relative rounded-[24px] overflow-hidden"
                        style={{
                          width: 204, height: 204,
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: isPlaying
                            ? '0 0 56px rgba(205,255,90,0.16), 0 28px 56px rgba(0,0,0,0.65)'
                            : '0 20px 44px rgba(0,0,0,0.65)',
                        }}
                      >
                        {currentTrack?.thumbnail ? (
                          <img src={currentTrack.thumbnail} alt={currentTrack.title}
                            className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-neutral-900">
                            <Music2 size={52} className="text-lime-300/20" />
                            <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest text-center px-6">
                              Nenhuma música
                            </p>
                          </div>
                        )}

                        {/* Playing overlay: equalizer bars centered */}
                        {isPlaying && currentTrack && (
                          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                            <div className="px-3 py-1.5 rounded-full"
                              style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
                              <Equalizer isPlaying={isPlaying} size="lg" />
                            </div>
                          </div>
                        )}

                        {/* Neon ring while playing */}
                        {isPlaying && (
                          <motion.div
                            className="absolute inset-0 rounded-[24px]"
                            animate={{ opacity: [0.35, 0.65, 0.35] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ border: '2px solid rgba(205,255,90,0.5)' }}
                          />
                        )}
                      </motion.div>

                      {/* Track info */}
                      <div className="text-center w-full px-3">
                        <AnimatePresence mode="wait">
                          <motion.h3 key={currentTrack?.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                            className="text-white font-black text-[17px] leading-snug truncate">
                            {currentTrack?.title || 'ZYRON Radio'}
                          </motion.h3>
                        </AnimatePresence>
                        <p className="text-white/40 text-[12px] font-semibold mt-1 truncate">
                          {currentTrack?.artist || 'Adicione uma música para começar'}
                        </p>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full space-y-2">
                        <ProgressBar progress={progress} />
                        <div className="flex justify-between">
                          <span className="text-white/20 text-[10px] font-bold tracking-wide">
                            {isPlaying ? '▶ Tocando' : '⏸ Pausado'}
                          </span>
                          <span className="text-white/20 text-[10px] font-bold">
                            {Math.round(progress || 0)}%
                          </span>
                        </div>
                      </div>

                      {/* Main controls */}
                      <div className="flex items-center justify-center gap-5 w-full">
                        <ControlBtn onClick={handlePrev} size={48}>
                          <SkipBack size={20} />
                        </ControlBtn>
                        <ControlBtn onClick={handlePlay} primary size={68}>
                          {isPlaying
                            ? <Pause size={28} fill="currentColor" />
                            : <Play  size={28} fill="currentColor" className="ml-1" />}
                        </ControlBtn>
                        <ControlBtn onClick={handleNext} size={48}>
                          <SkipForward size={20} />
                        </ControlBtn>
                      </div>

                      {/* Shuffle / Repeat */}
                      <div className="flex items-center gap-4">
                        <ControlBtn onClick={() => setIsShuffleOn((s) => !s)} active={isShuffleOn} size={40}>
                          <Shuffle size={16} />
                        </ControlBtn>
                        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.08)' }} />
                        <ControlBtn onClick={() => setIsRepeatOn((s) => !s)} active={isRepeatOn} size={40}>
                          <Repeat size={16} />
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

      {/* ── COLLAPSED DOCK PILL ─────────────────────────────────────────────── */}
      {/* Enters with AnimatePresence — always visible so music is accessible */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, type: 'spring', stiffness: 240, damping: 28 }}
        className="fixed left-0 right-0 z-[49] flex justify-center pointer-events-none"
        style={{ bottom: `calc(${NAV_HEIGHT}px + max(14px, env(safe-area-inset-bottom)))` }}
      >
        <div className="pointer-events-auto w-[94%] max-w-[430px] px-3" style={{ paddingBottom: DOCK_GAP }}>
          <motion.div
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.18}
            onDragStart={() => { dragIntentRef.current = false; }}
            onDragEnd={handleDockDragEnd}
            whileTap={{ scale: 0.975 }}
            onClick={handleDockTap}
            className="relative flex items-center gap-3 rounded-[20px] overflow-hidden cursor-grab active:cursor-grabbing"
            style={{
              height: DOCK_HEIGHT,
              background: currentTrack ? 'rgba(11,12,14,0.97)' : 'rgba(11,12,14,0.88)',
              border: currentTrack
                ? '1px solid rgba(205,255,90,0.2)'
                : '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(28px)',
              boxShadow: isPlaying && currentTrack
                ? '0 -4px 20px rgba(205,255,90,0.09), 0 10px 36px rgba(0,0,0,0.55)'
                : '0 8px 32px rgba(0,0,0,0.48)',
              paddingLeft: 10,
              paddingRight: 10,
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            {/* Neon top glow line when playing */}
            {isPlaying && currentTrack && (
              <motion.div
                className="absolute top-0 left-8 right-8 h-px"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{ background: 'linear-gradient(to right, transparent, #cdff5a, transparent)' }}
              />
            )}

            {/* Left: album art + equalizer OR icon */}
            <div className="relative shrink-0">
              <AlbumArt track={currentTrack} size={44} radius={12} />
              {isPlaying && currentTrack && (
                <div className="absolute bottom-1 right-1"
                  style={{ background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '1px 3px' }}>
                  <Equalizer isPlaying={isPlaying} size="sm" />
                </div>
              )}
            </div>

            {/* Center: track info */}
            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div key={currentTrack?.id || 'empty'}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                  {currentTrack ? (
                    <>
                      <p className="text-white text-[12px] font-black truncate leading-tight">
                        {currentTrack.title}
                      </p>
                      <p className="text-white/38 text-[10px] font-semibold truncate mt-0.5">
                        {currentTrack.artist || 'ZYRON Radio'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-white/65 text-[12px] font-black truncate leading-tight">
                        ZYRON Music
                      </p>
                      <p className="text-white/28 text-[10px] font-semibold truncate mt-0.5">
                        Arrastar ↑ ou tocar para buscar
                      </p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress micro-bar at bottom */}
            {currentTrack && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px]"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <motion.div className="h-full bg-lime-300/65"
                  animate={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                  transition={{ duration: 0.5, ease: 'linear' }} />
              </div>
            )}

            {/* Right: play/pause + open button */}
            <div className="flex items-center gap-1.5 shrink-0">
              {currentTrack && (
                <motion.button
                  whileTap={{ scale: 0.84 }}
                  onClick={handlePlay}
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 40, height: 40,
                    background: isPlaying ? '#cdff5a' : 'rgba(255,255,255,0.1)',
                    border: isPlaying ? 'none' : '1px solid rgba(255,255,255,0.12)',
                    color: isPlaying ? '#000' : 'rgba(255,255,255,0.8)',
                    boxShadow: isPlaying ? '0 0 18px rgba(205,255,90,0.38)' : 'none',
                  }}
                >
                  {isPlaying
                    ? <Pause size={15} fill="currentColor" />
                    : <Play  size={15} fill="currentColor" className="ml-0.5" />}
                </motion.button>
              )}

              <motion.button
                whileTap={{ scale: 0.84 }}
                onClick={(e) => { e.stopPropagation(); open(); }}
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 32, height: 32,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(255,255,255,0.38)',
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
