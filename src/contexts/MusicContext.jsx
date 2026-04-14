import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import logger from '../utils/logger';
import audioUnlocker from '../utils/audioUnlock';

const MusicContext = createContext(null);

const LAST_TRACK_KEY = 'zyron_last_track';
const PLAYER_VOLUME_KEY = 'player_volume';
const PLAYER_POSITION_KEY = 'zyron_player_pos';
const PLAYER_MINIMIZED_KEY = 'zyron_player_minimized';
const SILENT_AUDIO_URI = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';

const fallbackTracks = [
  { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', artist: 'ZYRON Mixes' },
  { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg', artist: 'Lofi Girl' },
  { id: 'L_jWHftIyJQ', title: 'Epic Workout Motivation', thumbnail: 'https://img.youtube.com/vi/L_jWHftIyJQ/default.jpg', artist: 'ZYRON Fitness' },
];

const isIOSUserAgent = () => typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent);

const safeParseJson = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const getStoredNumber = (key, fallback) => {
  const value = Number.parseInt(localStorage.getItem(key) || '', 10);
  return Number.isFinite(value) ? value : fallback;
};

const normalizeStreamData = (raw) => (raw?.data && typeof raw.data === 'object' ? raw.data : raw);

export function useMusic() {
  return useContext(MusicContext);
}

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(getStoredNumber(PLAYER_VOLUME_KEY, 100));
  const [playlist, setPlaylist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);

  const playerRef = useRef(null);
  const nativeAudioRef = useRef(null);
  const nativeAudioUrlRef = useRef(null); // tracks actual URL assigned; avoids false-positive from removeAttribute('src')
  const silentAudioRef = useRef(null);
  const wakeLockRef = useRef(null);
  const retryHandlerRef = useRef(null);

  const isIOSClient = isIOSUserAgent();
  const isNativeIOSApp = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

  useEffect(() => {
    const savedTrack = localStorage.getItem(LAST_TRACK_KEY);
    if (savedTrack) {
      setCurrentTrack(safeParseJson(savedTrack, null));
    }

    const savedPosition = localStorage.getItem(PLAYER_POSITION_KEY);
    if (savedPosition) {
      setPlayerPosition(safeParseJson(savedPosition, { x: 0, y: 0 }));
    }

    const savedMinimized = localStorage.getItem(PLAYER_MINIMIZED_KEY);
    if (savedMinimized) {
      setIsMinimized(savedMinimized === 'true');
    }

    logger.systemEvent('MusicContext inicializado', {
      iosClient: isIOSClient,
      nativeIOSApp: isNativeIOSApp,
    });
  }, [isIOSClient, isNativeIOSApp]);

  useEffect(() => {
    if (!document.getElementById('yt-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player-hidden', {
        height: '0',
        width: '0',
        videoId: '',
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (currentTrack?.id) {
              event.target.cueVideoById(currentTrack.id);
            }
          },
          onStateChange: (event) => {
            const nativeAudio = nativeAudioRef.current;
            if (nativeAudio?.src) return;

            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
            }

            if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              releaseWakeLock();
            }
          },
          onError: (event) => {
            logger.warn('YouTube Player Error', { errorCode: event.data, trackId: currentTrack?.id });
            if ((event.data === 150 || event.data === 101) && playlist.length > 0) {
              nextTrack();
            }
          },
        },
      });
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, [currentTrack, playlist.length]);

  useEffect(() => {
    localStorage.setItem(PLAYER_VOLUME_KEY, String(volume));

    const nativeAudio = nativeAudioRef.current;
    if (nativeAudio) {
      nativeAudio.volume = volume / 100;
    }

    if (playerRef.current?.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  useEffect(() => {
    const nativeAudio = nativeAudioRef.current;
    if (!nativeAudio) return undefined;

    const handlePlay = () => {
      setIsPlaying(true);
      requestWakeLock();
    };

    const handlePause = () => {
      if (!nativeAudio.ended) {
        setIsPlaying(false);
        releaseWakeLock();
      }
    };

    const handleEnded = () => {
      setProgress(100);
      releaseWakeLock();
      nextTrack();
    };

    const handleError = () => {
      nativeAudioUrlRef.current = null; // allow fallback to iframe on next togglePlay
      setIsPlaying(false);
    };

    nativeAudio.addEventListener('play', handlePlay);
    nativeAudio.addEventListener('pause', handlePause);
    nativeAudio.addEventListener('ended', handleEnded);
    nativeAudio.addEventListener('error', handleError);

    return () => {
      nativeAudio.removeEventListener('play', handlePlay);
      nativeAudio.removeEventListener('pause', handlePause);
      nativeAudio.removeEventListener('ended', handleEnded);
      nativeAudio.removeEventListener('error', handleError);
    };
  }, [playlist, currentTrack]);

  useEffect(() => {
    let intervalId;

    if (isPlaying) {
      intervalId = window.setInterval(() => {
        const nativeAudio = nativeAudioRef.current;

        if (nativeAudio?.src && nativeAudio.duration > 0) {
          setProgress((nativeAudio.currentTime / nativeAudio.duration) * 100);
          return;
        }

        if (playerRef.current?.getCurrentTime && playerRef.current?.getDuration) {
          const currentTime = playerRef.current.getCurrentTime();
          const duration = playerRef.current.getDuration();
          if (duration > 0) {
            setProgress((currentTime / duration) * 100);
          }
        }
      }, 1000);
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return undefined;

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title: currentTrack.title || 'Treino ZYRON',
      artist: currentTrack.artist || 'ZYRON Radio',
      album: 'A Forca da Sua Evolucao',
      artwork: [
        { src: currentTrack.thumbnail || '/images/zyron-512.png', sizes: '512x512', type: 'image/png' },
        { src: currentTrack.thumbnail || '/images/zyron-192.png', sizes: '192x192', type: 'image/png' },
      ],
    });

    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch {
      // iOS may ignore playbackState updates on some versions.
    }

    const playHandler = async () => {
      if (!isPlaying) {
        await togglePlay();
      }
    };

    const pauseHandler = async () => {
      if (isPlaying) {
        await togglePlay();
      }
    };

    const safeSetActionHandler = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Some actions are not supported in all browsers.
      }
    };

    safeSetActionHandler('play', playHandler);
    safeSetActionHandler('pause', pauseHandler);
    safeSetActionHandler('previoustrack', () => prevTrack());
    safeSetActionHandler('nexttrack', () => nextTrack());

    return () => {
      safeSetActionHandler('play', null);
      safeSetActionHandler('pause', null);
      safeSetActionHandler('previoustrack', null);
      safeSetActionHandler('nexttrack', null);
    };
  }, [currentTrack, isPlaying, playlist]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const nativeAudio = nativeAudioRef.current;
      if (!document.hidden && isPlaying && nativeAudio?.src && nativeAudio.paused) {
        nativeAudio.play().catch(() => {
          logger.warn('Falha ao retomar audio nativo ao voltar do background', {
            trackId: currentTrack?.id,
          });
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentTrack]);

  const clearRetryHandler = () => {
    if (!retryHandlerRef.current) return;

    window.removeEventListener('click', retryHandlerRef.current);
    window.removeEventListener('touchstart', retryHandlerRef.current);
    retryHandlerRef.current = null;
  };

  const pauseIframePlayback = () => {
    if (!playerRef.current) return;

    try {
      if (playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      if (playerRef.current.stopVideo) {
        playerRef.current.stopVideo();
      }
    } catch {
      // Ignore iframe shutdown errors.
    }
  };

  const pauseNativePlayback = ({ reset = false } = {}) => {
    const nativeAudio = nativeAudioRef.current;
    if (!nativeAudio) return;

    nativeAudio.pause();

    if (reset) {
      nativeAudio.currentTime = 0;
      nativeAudio.removeAttribute('src');
      nativeAudio.load();
      nativeAudioUrlRef.current = null; // clear our tracking ref
    }
  };

  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator) || wakeLockRef.current) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch (error) {
      logger.warn('Wake Lock indisponivel', { error: error?.message });
    }
  };

  const releaseWakeLock = async () => {
    if (!wakeLockRef.current) return;

    try {
      await wakeLockRef.current.release();
    } catch {
      // Ignore release drift.
    } finally {
      wakeLockRef.current = null;
    }
  };

  const primeAudioSession = async () => {
    try {
      await audioUnlocker.init();
      await audioUnlocker.unlock();
    } catch {
      // Ignore audio unlock drift.
    }

    if (!isIOSClient || !silentAudioRef.current) return;

    try {
      silentAudioRef.current.currentTime = 0;
      silentAudioRef.current.volume = 0.0001;
      await silentAudioRef.current.play();
      silentAudioRef.current.pause();
      silentAudioRef.current.currentTime = 0;
    } catch {
      // iOS may still block this until the first successful gesture.
    }
  };

  const queueGestureRetry = (retry) => {
    clearRetryHandler();

    retryHandlerRef.current = async () => {
      clearRetryHandler();
      await primeAudioSession();
      await retry();
    };

    window.addEventListener('click', retryHandlerRef.current, { once: true });
    window.addEventListener('touchstart', retryHandlerRef.current, { once: true });
  };

  const startNativePlayback = async (track, streamData) => {
    const nativeAudio = nativeAudioRef.current;
    if (!nativeAudio?.play || !streamData?.audioUrl) return false;

    const mimeType = streamData.mimeType || streamData.mime_type || '';
    const mimeSupport = mimeType && nativeAudio.canPlayType ? nativeAudio.canPlayType(mimeType) : 'probably';

    if (isIOSClient && mimeType && !mimeSupport) {
      logger.warn('Stream bloqueado por incompatibilidade de MIME no iOS', {
        trackId: track.id,
        mimeType,
      });
      return false;
    }

    pauseIframePlayback();

    nativeAudio.pause();
    nativeAudio.src = streamData.audioUrl;
    nativeAudioUrlRef.current = streamData.audioUrl; // track the URL
    nativeAudio.preload = 'auto';
    nativeAudio.crossOrigin = 'anonymous';
    nativeAudio.volume = volume / 100;
    nativeAudio.setAttribute('playsinline', 'true');
    nativeAudio.setAttribute('webkit-playsinline', 'true');
    nativeAudio.setAttribute('x-webkit-airplay', 'allow');

    if (mimeType) {
      nativeAudio.setAttribute('type', mimeType);
    } else {
      nativeAudio.removeAttribute('type');
    }

    try {
      await nativeAudio.play();
      setProgress(0);
      setIsPlaying(true);
      requestWakeLock();
      logger.info('Audio nativo iniciado', {
        trackId: track.id,
        provider: streamData.provider,
        mimeType,
        iosClient: isIOSClient,
      });
      return true;
    } catch (error) {
      logger.warn('Falha ao iniciar audio nativo', {
        trackId: track.id,
        error: error?.message,
        mimeType,
      });

      if (error?.name === 'NotAllowedError') {
        queueGestureRetry(async () => {
          try {
            await nativeAudio.play();
            setIsPlaying(true);
            requestWakeLock();
          } catch (retryError) {
            logger.error('Falha no retry de audio nativo', {
              trackId: track.id,
              error: retryError?.message,
            });
            setIsPlaying(false);
          }
        });
      }

      return false;
    }
  };

  const preloadNextTrack = async (trackId) => {
    if (!playlist.length) return;

    const currentIndex = playlist.findIndex((track) => track.id === trackId);
    if (currentIndex === -1) return;

    const nextTrackItem = playlist[(currentIndex + 1) % playlist.length];
    if (!nextTrackItem?.id) return;

    try {
      await fetch(`/api/audio-stream/${nextTrackItem.id}`, {
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Preload is opportunistic.
    }
  };

  const loadIframeFallback = async (track) => {
    if (!playerRef.current?.loadVideoById) return false;

    pauseNativePlayback({ reset: true });

    try {
      playerRef.current.loadVideoById(track.id);
      setProgress(0);
      setIsPlaying(true);
      requestWakeLock();
      logger.warn('Usando fallback via YouTube iframe', {
        trackId: track.id,
        iosClient: isIOSClient,
      });
      return true;
    } catch (error) {
      logger.error('Fallback via iframe falhou', {
        trackId: track.id,
        error: error?.message,
      });
      return false;
    }
  };

  const loadVideoById = async (track) => {
    if (!track?.id) return;

    clearRetryHandler();
    await primeAudioSession();

    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
    localStorage.setItem(LAST_TRACK_KEY, JSON.stringify(track));

    logger.userAction('loadVideoById', {
      trackId: track.id,
      trackTitle: track.title,
      iosClient: isIOSClient,
      nativeIOSApp: isNativeIOSApp,
    });

    try {
      const response = await fetch(`/api/audio-stream/${track.id}`, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`AUDIO_PROXY_${response.status}`);
      }

      const raw = await response.json();
      const streamData = normalizeStreamData(raw);

      if (!streamData?.audioUrl) {
        throw new Error('AUDIO_PROXY_EMPTY');
      }

      const started = await startNativePlayback(track, streamData);
      if (started) {
        preloadNextTrack(track.id);
        return;
      }
    } catch (error) {
      logger.warn('Proxy de audio falhou, tentando fallback', {
        trackId: track.id,
        error: error?.message,
      });
    }

    const iframeStarted = await loadIframeFallback(track);
    if (!iframeStarted) {
      setIsPlaying(false);
    }
  };

  const togglePlay = async () => {
    const nativeAudio = nativeAudioRef.current;
    // Use our tracking ref — nativeAudio.src is truthy even after removeAttribute('src')
    const hasNativeSource = Boolean(nativeAudioUrlRef.current);

    logger.userAction('togglePlay', {
      isPlaying,
      hasCurrentTrack: Boolean(currentTrack),
      hasNativeSource,
      trackId: currentTrack?.id,
    });

    if (!currentTrack) return;

    if (isPlaying) {
      if (hasNativeSource) {
        nativeAudio.pause();
      } else if (playerRef.current?.pauseVideo) {
        playerRef.current.pauseVideo();
      }

      setIsPlaying(false);
      releaseWakeLock();
      return;
    }

    await primeAudioSession();

    if (hasNativeSource) {
      try {
        await nativeAudio.play();
        setIsPlaying(true);
        requestWakeLock();
        return;
      } catch (error) {
        logger.warn('Falha ao retomar audio nativo', {
          trackId: currentTrack.id,
          error: error?.message,
        });
      }
    }

    if (playerRef.current) {
      try {
        if (playerRef.current.getPlayerState?.() === window.YT.PlayerState.CUED || playerRef.current.getPlayerState?.() === -1) {
          playerRef.current.loadVideoById(currentTrack.id);
        } else {
          playerRef.current.playVideo();
        }
        setIsPlaying(true);
        requestWakeLock();
        return;
      } catch (error) {
        logger.warn('Falha ao retomar iframe', {
          trackId: currentTrack.id,
          error: error?.message,
        });
      }
    }

    if (!hasNativeSource) {
      await loadVideoById(currentTrack);
      return;
    }

    setIsPlaying(false);
  };

  const nextTrack = () => {
    if (!playlist.length || !currentTrack?.id) return;

    const currentIndex = playlist.findIndex((track) => track.id === currentTrack.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % playlist.length;
    loadVideoById(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (!playlist.length || !currentTrack?.id) return;

    const currentIndex = playlist.findIndex((track) => track.id === currentTrack.id);
    const prevIndex = currentIndex === -1 ? 0 : (currentIndex - 1 + playlist.length) % playlist.length;
    loadVideoById(playlist[prevIndex]);
  };

  const changeVolume = (newVolume) => {
    const nextVolume = Math.max(0, Math.min(100, Number(newVolume) || 0));
    setVolume(nextVolume);
  };

  const updatePlayerPosition = (position) => {
    setPlayerPosition(position);
    localStorage.setItem(PLAYER_POSITION_KEY, JSON.stringify(position));
  };

  const toggleMinimized = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    localStorage.setItem(PLAYER_MINIMIZED_KEY, String(nextState));
  };

  const searchMusic = async (query) => {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) return [];

    logger.userAction('searchMusic', { query: trimmedQuery });

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ZYRON-Music/2.0',
        },
      });

      if (!response.ok) {
        throw new Error(`SEARCH_${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        return data
          .filter((item) => item?.id && item?.title)
          .slice(0, 15);
      }
    } catch (error) {
      logger.warn('Busca centralizada falhou', {
        query: trimmedQuery,
        error: error?.message,
      });
    }

    return fallbackTracks.filter((track) =>
      `${track.title} ${track.artist}`.toLowerCase().includes(trimmedQuery.toLowerCase()),
    );
  };

  const contextValue = {
    isPlaying,
    currentTrack,
    volume,
    playlist,
    progress,
    playerPosition,
    isMinimized,
    togglePlay,
    nextTrack,
    prevTrack,
    changeVolume,
    setPlaylist,
    searchMusic,
    loadVideoById,
    updatePlayerPosition,
    toggleMinimized,
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}

      <audio
        ref={silentAudioRef}
        loop
        style={{ display: 'none' }}
        src={SILENT_AUDIO_URI}
        playsInline
      />

      <audio
        ref={nativeAudioRef}
        style={{ display: 'none' }}
        preload="none"
        playsInline
      />

      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '0px', height: '0px' }}>
        <div id="yt-player-hidden"></div>
      </div>
    </MusicContext.Provider>
  );
};
