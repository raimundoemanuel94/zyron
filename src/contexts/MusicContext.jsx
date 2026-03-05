import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const MusicContext = createContext();

export function useMusic() {
  return useContext(MusicContext);
}

export function MusicProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(100);
  const [playlist, setPlaylist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false);
  const playerRef = useRef(null);
  const silentAudioRef = useRef(null);
  const backgroundAudioRef = useRef(null);

  // Initialize YT Player API
  useEffect(() => {
    // Load local storage track
    const savedTrack = localStorage.getItem('zyron_last_track');
    if (savedTrack) {
      try {
        setCurrentTrack(JSON.parse(savedTrack));
      } catch (e) {
        console.error("Error parsing saved track", e);
      }
    }

    // Load player position
    const savedPos = localStorage.getItem('zyron_player_pos');
    if (savedPos) {
      try {
        setPlayerPosition(JSON.parse(savedPos));
      } catch (e) {
        console.error("Error parsing saved position", e);
      }
    }

    // Load minimized state
    const savedMinimized = localStorage.getItem('zyron_player_minimized');
    if (savedMinimized) {
      setIsMinimized(savedMinimized === 'true');
    }

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
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    };

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  const onPlayerReady = (event) => {
    if (currentTrack) {
      if (currentTrack.id) {
        event.target.cueVideoById(currentTrack.id);
      }
    }
  };

  const onPlayerStateChange = (event) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      setIsPlaying(true);
      if (currentTrack) {
        updateMediaSession(currentTrack);
      }
    } else if (event.data === window.YT.PlayerState.PAUSED || event.data === window.YT.PlayerState.ENDED) {
      setIsPlaying(false);
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      releaseWakeLock();
    }
  };

  const onPlayerError = (event) => {
    console.error("YouTube Player Error", event.data);
    // Simple fallback alert for copyrighted content
    if (event.data === 150 || event.data === 101) {
      alert("Mídia protegida, tente outra faixa.");
      setIsPlaying(false);
      if (playlist.length > 0) nextTrack();
    }
  };

  // Progress tracking
  useEffect(() => {
    let interval;
    if (isPlaying && playerRef.current && playerRef.current.getCurrentTime) {
      interval = setInterval(() => {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        if (duration > 0) {
          setProgress((currentTime / duration) * 100);
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const loadVideoById = (track) => {
    if (!playerRef.current || !playerRef.current.loadVideoById) return;
    
    setCurrentTrack(track);
    localStorage.setItem('zyron_last_track', JSON.stringify(track));
    
    // Require user interaction for autoplay on mobile
    try {
      playerRef.current.loadVideoById(track.id);
      setIsPlaying(true);
      updateMediaSession(track);

      // Start silent loop to keep iOS wake lock active
      startSilentAudio();
      requestWakeLock();
    } catch (e) {
      console.error(e);
    }
  };
  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      if (currentTrack) {
        if (playerRef.current.getPlayerState() === window.YT.PlayerState.CUED || playerRef.current.getPlayerState() === -1) {
           playerRef.current.loadVideoById(currentTrack.id);
        } else {
          playerRef.current.playVideo();
        }
        
        // Ativar Silent Loop para iOS Wake Lock
        startSilentAudio();
        requestWakeLock();
      } else if (playlist.length > 0) {
        loadVideoById(playlist[0]);
      }
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    loadVideoById(playlist[nextIndex]);
  };

  const prevTrack = () => {
    if (playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack?.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    loadVideoById(playlist[prevIndex]);
  };

  const changeVolume = (newVolume) => {
    setVolume(newVolume);
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const updatePlayerPosition = (pos) => {
    setPlayerPosition(pos);
    localStorage.setItem('zyron_player_pos', JSON.stringify(pos));
  };

  const toggleMinimized = () => {
    const newState = !isMinimized;
    setIsMinimized(newState);
    localStorage.setItem('zyron_player_minimized', String(newState));
  };

  // Initialize Audio Context for iOS Background Mode
  const initAudioContext = () => {
    if (!audioContext && typeof AudioContext !== 'undefined') {
      const ctx = new AudioContext();
      setAudioContext(ctx);
      return ctx;
    }
    return audioContext;
  };

  // Enhanced iOS Wake Lock - Multiple Audio Streams
  const startSilentAudio = async () => {
    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.volume = 0.01;
        await silentAudioRef.current.play();
        console.log('🔊 Silent audio iniciado para iOS wake lock');
      } catch (error) {
        console.log('Silent audio falhou:', error.message);
      }
    }

    // Background Audio Stream (mais robusto)
    if (backgroundAudioRef.current) {
      try {
        backgroundAudioRef.current.volume = 0.001;
        backgroundAudioRef.current.loop = true;
        await backgroundAudioRef.current.play();
        console.log('🎵 Background audio stream iniciado');
      } catch (error) {
        console.log('Background audio falhou:', error.message);
      }
    }

    // Initialize Web Audio Context
    initAudioContext();
  };

  // Wake Lock API para Android/Chrome
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        const lock = await navigator.wakeLock.request('screen');
        setWakeLock(lock);
        console.log('🔒 Wake Lock ativo');
        
        lock.addEventListener('release', () => {
          console.log('🔓 Wake Lock liberado');
          setWakeLock(null);
        });
      } catch (error) {
        console.log('Wake Lock falhou:', error.message);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock) {
      wakeLock.release();
      setWakeLock(null);
    }
    
    // Parar todos os áudios de background
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
    }
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
    }
    
    console.log('🔓 Wake lock e áudios de background liberados');
  };

  const updateMediaSession = (track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artist || 'ZYRON Radio',
        album: 'A Força da Sua Evolução',
        artwork: [
          { src: track.thumbnail || '/images/zyron-192.png', sizes: '192x192', type: 'image/png' },
          { src: track.thumbnail || '/images/zyron-512.png', sizes: '512x512', type: 'image/png' },
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        togglePlay();
        startSilentAudio();
        requestWakeLock();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
        if (silentAudioRef.current) {
          silentAudioRef.current.pause();
        }
        releaseWakeLock();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());

      // iOS Interruption Handling Avançado
      if (silentAudioRef.current) {
        silentAudioRef.current.onpause = () => {
          console.log('📱 iOS interrompeu áudio silencioso');
          // Tentar recuperar após 1 segundo
          setTimeout(() => {
            if (isPlaying) {
              startSilentAudio();
              // Tentar retomar YouTube também
              if (playerRef.current && playerRef.current.playVideo) {
                try {
                  playerRef.current.playVideo();
                } catch (e) {
                  console.log('Falha ao retomar YouTube:', e);
                }
              }
            }
          }, 1000);
        };
        
        silentAudioRef.current.onplay = () => {
          console.log('📱 iOS retomou áudio silencioso');
        };
      }

      // Background Audio Stream Handler
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.onpause = () => {
          console.log('📱 Background audio pausado pelo iOS');
          // Recuperar automaticamente
          setTimeout(() => {
            if (isPlaying) {
              backgroundAudioRef.current.play().catch(e => {
                console.log('Falha ao recuperar background audio:', e);
              });
            }
          }, 500);
        };
      }

      // Page Visibility API - Detectar quando app vai para background
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          console.log('📱 App foi para background');
          setIsBackgroundMode(true);
          // Forçar áudio de background
          startSilentAudio();
        } else {
          console.log('📱 App voltou para foreground');
          setIsBackgroundMode(false);
          // Se estava tocando, garantir que continue
          if (isPlaying) {
            setTimeout(() => {
              startSilentAudio();
              // Tentar retomar YouTube se necessário
              if (playerRef.current && playerRef.current.playVideo) {
                try {
                  if (playerRef.current.getPlayerState() !== window.YT.PlayerState.PLAYING) {
                    playerRef.current.playVideo();
                  }
                } catch (e) {
                  console.log('Falha ao retomar YouTube no foreground:', e);
                }
              }
            }, 1000);
          }
        }
      });

      // iOS Focus/Blur Events - Detectar quando usuário interage com controles
      window.addEventListener('blur', () => {
        console.log('📱 Janela perdeu foco (usuário interagiu com controles)');
        if (isPlaying) {
          setTimeout(() => {
            startSilentAudio();
          }, 500);
        }
      });

      window.addEventListener('focus', () => {
        console.log('📱 Janela ganhou foco');
        if (isPlaying) {
          setTimeout(() => {
            startSilentAudio();
            // Verificar se YouTube ainda está tocando
            if (playerRef.current && playerRef.current.getPlayerState) {
              try {
                const state = playerRef.current.getPlayerState();
                if (state !== window.YT.PlayerState.PLAYING) {
                  console.log('🔄 YouTube não está tocando, retomando...');
                  playerRef.current.playVideo();
                }
              } catch (e) {
                console.log('Erro ao verificar estado do YouTube:', e);
              }
            }
          }, 1000);
        }
      });
    }
  };

  const searchMusic = async (query) => {
    if (!query || query.trim().length === 0) {
      console.warn('Busca vazia, retornando array vazio');
      return [];
    }

    // Limpar estado anterior para evitar stale UI
    const searchResults = [];
    
    console.log(`ZYRON Radio: Iniciando busca estruturada para "${query}"`);
    
    // Fallback Chain: YouTube Direct -> Piped -> Invidious -> Cache Local
    const apiEndpoints = [
      {
        name: 'YouTube Direct (Vercel Proxy)',
        url: `/api/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data
      },
      {
        name: 'Piped API',
        url: `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data.map(item => ({
          id: item.url?.split('v=')[1] || item.url?.split('/').pop() || item.videoId,
          title: item.title || 'ZYRON Audio',
          thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId || item.url?.split('v=')[1]}/mqdefault.jpg`,
          artist: item.uploaderName || item.channelName || 'Unknown Artist',
          duration: item.duration
        }))
      },
      {
        name: 'Invidious API',
        url: `https://yewtu.be/api/v1/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data.map(item => ({
          id: item.videoId,
          title: item.title || 'ZYRON Audio',
          thumbnail: `https://img.youtube.com/vi/${item.videoId}/mqdefault.jpg`,
          artist: item.author || item.channelName || 'Unknown Artist',
          duration: item.lengthSeconds
        }))
      },
      {
        name: 'Backup Piped Instance',
        url: `https://pipedapi.garudalinux.org/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data.map(item => ({
          id: item.url?.split('v=')[1] || item.url?.split('/').pop() || item.videoId,
          title: item.title || 'ZYRON Audio',
          thumbnail: item.thumbnail || `https://img.youtube.com/vi/${item.videoId || item.url?.split('v=')[1]}/mqdefault.jpg`,
          artist: item.uploaderName || item.channelName || 'Unknown Artist',
          duration: item.duration
        }))
      }
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`Tentando ${endpoint.name}...`);
        
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'ZYRON-Music/1.0'
          },
          signal: AbortSignal.timeout(10000) // Timeout 10s
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data && Array.isArray(data) && data.length > 0) {
            const results = endpoint.transform(data).filter(item => 
              item.id && item.title && item.id.length > 0
            );
            
            if (results.length > 0) {
              console.log(`✅ Sucesso com ${endpoint.name}: ${results.length} resultados`);
              console.log('Primeiros 2 resultados:', results.slice(0, 2));
              return results.slice(0, 15); // Limitar para performance
            }
          }
        } else {
          console.warn(`${endpoint.name} respondeu com status ${response.status}`);
        }
      } catch (error) {
        console.warn(`Falha em ${endpoint.name}:`, error.message);
        continue;
      }
    }

    // Fallback final - curadoria local baseada no gênero
    console.warn('⚠️ Todas as APIs falharam, usando curadoria local');
    const fallbackTracks = [
      { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', artist: 'ZYRON Mixes' },
      { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg', artist: 'Lofi Girl' },
      { id: 'L_jWHftIyJQ', title: 'Epic Workout Motivation', thumbnail: 'https://img.youtube.com/vi/L_jWHftIyJQ/default.jpg', artist: 'ZYRON Fitness' },
      { id: 'M7lc1UVf-VE', title: 'Never Gonna Give You Up', thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/default.jpg', artist: 'Rick Astley' }
    ];
    
    return fallbackTracks;
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
    toggleMinimized
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
      
      {/* iOS Wake Lock - Silent Loop Audio (1 segundo real) */}
      <audio 
        ref={silentAudioRef}
        loop 
        style={{ display: 'none' }}
        src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" 
      />

      {/* Background Audio Stream - iOS Wake Lock Backup */}
      <audio 
        ref={backgroundAudioRef}
        loop 
        style={{ display: 'none' }}
        src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" 
      />

      {/* 
        CRITICAL FIX: YouTube API replaces the target div with an iframe. 
        If this happens directly in a React tree next to AnimatePresence, React will crash with DOM NotFoundError on unmounts. 
        Wrapping it in a stable parent div protects the React tree from this mutation. 
      */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '0px', height: '0px' }}>
        <div id="yt-player-hidden"></div>
      </div>
    </MusicContext.Provider>
  );
}
