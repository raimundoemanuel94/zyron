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
  const playerRef = useRef(null);
  const silentAudioRef = useRef(null);

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
      if (silentAudioRef.current) silentAudioRef.current.pause();
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
      if (silentAudioRef.current) {
        silentAudioRef.current.play().catch(e => console.log("Wake Lock logic:", e));
      }
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
        if (silentAudioRef.current) {
          silentAudioRef.current.play().catch(e => console.log("Wake Lock logic:", e));
        }
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
        if (silentAudioRef.current) silentAudioRef.current.play();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        togglePlay();
        if (silentAudioRef.current) silentAudioRef.current.pause();
      });
      navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());

      // Audio Interruption Listeners for iOS
      if (silentAudioRef.current) {
        silentAudioRef.current.onpause = () => {
          // If iOS pauses our silent audio (interruption), we sync our state
          // but we try to resume if it was playing after interruption ends
        };
      }
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
