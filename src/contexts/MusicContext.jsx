import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import logger from '../utils/logger';

const MusicContext = createContext();

export function useMusic() {
  return useContext(MusicContext);
}

export const MusicProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [volume, setVolume] = useState(parseInt(localStorage.getItem('player_volume') || '100', 10));
  const [playlist, setPlaylist] = useState([]);
  const [progress, setProgress] = useState(0);
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [wakeLock, setWakeLock] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [isBackgroundMode, setIsBackgroundMode] = useState(false); // Novo estado para controlar o modo background
  const [hasUserInteracted, setHasUserInteracted] = useState(false); // Controle de interação do usuário

  const playerRef = useRef(null); // Ref para o iframe do YouTube
  const silentAudioRef = useRef(null); // Ref para o elemento de áudio silencioso
  const backgroundAudioRef = useRef(null); // Ref para o elemento de áudio de background para iOS
  const preloadAudioRef = useRef(null); // Ref para fazer preload da próxima música da CDN
  const audioSourceNode = useRef(null);
  const gainNode = useRef(null);
  const analyserNode = useRef(null);
  const animationFrameId = useRef(null);
  const isIOSClient = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  const isNativeIOSApp = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

  const isLikelyUnsupportedOnIOS = (streamData = {}) => {
    const format = String(streamData?.format || '').toLowerCase();
    const mimeType = String(streamData?.mimeType || streamData?.mime_type || '').toLowerCase();
    const codec = String(streamData?.codec || '').toLowerCase();
    return (
      format.includes('webm')
      || mimeType.includes('webm')
      || codec.includes('opus')
      || codec.includes('vorbis')
    );
  };

  // Função agressiva para forçar áudio no PWA
  const forcePlayAudio = async (audioElement, trackId) => {
    const strategies = [
      // Estratégia 1: Play direto
      () => audioElement.play(),
      
      // Estratégia 3: Muted depois unmuted
      () => {
        audioElement.muted = true;
        return audioElement.play().then(() => {
          audioElement.muted = false;
          return audioElement;
        });
      },
      
      // Estratégia 4: Baixo volume depois normal
      () => {
        const originalVolume = audioElement.volume;
        audioElement.volume = 0.001;
        return audioElement.play().then(() => {
          audioElement.volume = originalVolume;
          return audioElement;
        });
      }
    ];

    // Em iOS Safari, createMediaElementSource em stream remoto costuma falhar e não ajuda autoplay.
    if (!isIOSClient) {
      strategies.splice(1, 0, () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaElementSource(audioElement);
        source.connect(ctx.destination);
        return audioElement.play();
      });
    }

    for (let i = 0; i < strategies.length; i++) {
      try {
        console.log(`🎵 Tentando estratégia ${i + 1} para tocar áudio`);
        await strategies[i]();
        console.log(`✅ Estratégia ${i + 1} funcionou!`);
        logger.userAction(`Áudio iniciado com estratégia ${i + 1}`, { trackId });
        return true;
      } catch (error) {
        console.warn(`❌ Estratégia ${i + 1} falhou:`, error.message);
        continue;
      }
    }
    
    return false;
  };

  // Listener para detectar primeira interação
  useEffect(() => {
    const handleFirstInteraction = () => {
      console.log('🎵 Primeira interação do usuário detectada');
      logger.userAction('Primeira interação do usuário', {
        timestamp: new Date().toISOString()
      });
      // Remover listeners após primeira interação
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Log inicialização
  useEffect(() => {
    logger.systemEvent('MusicContext inicializado', {
      hasPlayerRef: !!playerRef.current,
      hasSilentAudioRef: !!silentAudioRef.current,
      hasBackgroundAudioRef: !!backgroundAudioRef.current
    });
  }, []);

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

  // Audio Watchdog: Recupera o áudio nativo caso o celular pause por inatividade/bateria
  useEffect(() => {
    let watchdogInterval;
    if (isPlaying) {
      watchdogInterval = setInterval(() => {
        if (backgroundAudioRef.current && backgroundAudioRef.current.paused) {
           console.log('🐕 Watchdog: Áudio detectado como pausado de forma anômala. Retomando...');
           backgroundAudioRef.current.play().catch(e => console.log('Watchdog falhou ao retomar:', e));
        }
      }, 5000); // Checa a cada 5 segundos
    } else {
      clearInterval(watchdogInterval);
    }
    return () => clearInterval(watchdogInterval);
  }, [isPlaying]);

  const loadVideoById = async (track) => {
    if (!track) return;
    
    logger.userAction('loadVideoById', {
      trackId: track.id,
      trackTitle: track.title,
      trackArtist: track.artist
    });
    
    // FORÇAR UI INSTANTÂNEA - Player abre antes de validar
    console.log('🚀 Player abrindo instantaneamente para:', track.title);
    setCurrentTrack(track);
    setIsPlaying(true); // Mostra UI imediatamente
    localStorage.setItem('zyron_last_track', JSON.stringify(track));
    
    try {
      if (isNativeIOSApp) {
        logger.info('Modo nativo iOS: forçando playback via YouTube iframe', {
          trackId: track.id,
        });

        if (playerRef.current && playerRef.current.loadVideoById) {
          playerRef.current.loadVideoById(track.id);
          setIsPlaying(true);
          updateMediaSession(track);
          await startSilentAudio();
          requestWakeLock();
          return;
        }
      }

      // PRIORIZAR PROXY DE ÁUDIO VIA VERCEL
      console.log('🎵 Tentando proxy de áudio Vercel para:', track.id);
      logger.info('Tentando proxy de áudio Vercel', { trackId: track.id });
      
      try {
        // Usar proxy CORS da Vercel para stream
        const proxyResponse = await fetch(`/api/audio-stream/${track.id}`);
        
        if (proxyResponse.ok) {
          const raw = await proxyResponse.json();
          const streamData = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
          if (streamData?.audioUrl) {
            console.log('✅ Proxy Vercel funcionou, usando áudio nativo');
            logger.info('Proxy Vercel funcionou', { 
              trackId: track.id,
              audioUrl: streamData.audioUrl,
              format: streamData.format,
              mimeType: streamData.mimeType || null,
              codec: streamData.codec || null,
            });

            if (isIOSClient && isLikelyUnsupportedOnIOS(streamData)) {
              throw new Error('STREAM_UNSUPPORTED_ON_IOS');
            }
            
            // Criar elemento de áudio dinamicamente para PWA
            const audioElement = new Audio();
            audioElement.src = streamData.audioUrl;
            if (streamData?.mimeType) audioElement.type = streamData.mimeType;
            audioElement.volume = volume / 100;
            audioElement.crossOrigin = "anonymous";
            audioElement.playsInline = true;
            audioElement.preload = 'auto';
            audioElement.setAttribute('playsinline', 'true');
            audioElement.setAttribute('webkit-playsinline', 'true');

            if (isIOSClient && streamData?.mimeType) {
              const support = audioElement.canPlayType(streamData.mimeType);
              if (!support) {
                throw new Error(`UNSUPPORTED_MIME_ON_IOS:${streamData.mimeType}`);
              }
            }
            
            // Usar estratégia agressiva para PWA
            const success = await forcePlayAudio(audioElement, track.id);
            
            if (success) {
              // Salvar referência para controle
              if (backgroundAudioRef.current) {
                // Parar o áudio anterior se houver
                backgroundAudioRef.current.pause();
                backgroundAudioRef.current.src = '';
              }
              backgroundAudioRef.current = audioElement;
              
              // Evento para tocar a próxima música automaticamente
              audioElement.onended = () => {
                console.log('🎵 Track ended, playing next...');
                nextTrack();
              };

              // PRELOAD DA PRÓXIMA MÚSICA (UX instantâneo)
              if (playlist && playlist.length > 0) {
                 const currentIndex = playlist.findIndex(t => t.id === track.id);
                 if (currentIndex !== -1) {
                    const nextItem = playlist[(currentIndex + 1) % playlist.length];
                    if (nextItem && nextItem.id) {
                       // Disparar uma busca suave para a Vercel engatilhar o proxy da próxima sem pausar a tela atual
                       fetch(`/api/audio-stream/${nextItem.id}`)
                         .then(res => res.json())
                         .then(raw => {
                            const data = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
                            if (data && data.audioUrl) {
                               console.log('🔄 Preloading next track:', nextItem.title);
                               const preloadAudio = new Audio(data.audioUrl);
                               preloadAudio.preload = 'auto';
                               preloadAudioRef.current = preloadAudio;
                            }
                         })
                         .catch(e => console.warn('Preload falhou (ignorado):', e));
                    }
                 }
              }

              return;
            }
            
            // Se todas as estratégias falharem, tentar com interação do usuário
            console.warn('⚠️ Todas as estratégias falharam, exigindo interação do usuário');
            logger.warn('Todas as estratégias de autoplay falharam', { 
              trackId: track.id
            });
            
            // Criar listener de clique para tocar após interação
            const playAfterInteraction = () => {
              forcePlayAudio(audioElement, track.id)
                .then(success => {
                  if (success) {
                    console.log('🎵 Áudio iniciado após interação do usuário');
                    logger.userAction('Áudio iniciado após interação', { trackId: track.id });
                    // Salvar referência para controle
                    if (backgroundAudioRef.current) {
                      backgroundAudioRef.current = audioElement;
                    }
                  }
                })
                .catch(err => {
                  console.error('❌ Falha ao tocar após interação:', err);
                  logger.error('Falha ao tocar após interação', { 
                    trackId: track.id, 
                    error: err.message 
                  });
                });
              
              // Remover listener após sucesso
              document.removeEventListener('click', playAfterInteraction);
              document.removeEventListener('touchstart', playAfterInteraction);
            };
            
            // Adicionar listeners para interação
            document.addEventListener('click', playAfterInteraction, { once: true });
            document.addEventListener('touchstart', playAfterInteraction, { once: true });
            
            // Mostrar mensagem para usuário
            alert('🎵 Clique em qualquer lugar para iniciar a música');
            return;
          }
        }
      } catch (proxyError) {
        console.warn('Proxy Vercel falhou:', proxyError.message);
        logger.warn('Proxy Vercel falhou', { 
          trackId: track.id, 
          error: proxyError.message 
        });
      }
      
      // FALLBACK DIRETO PARA YOUTUBE IFRAME (ignorando CORS do Piped)
      console.log('⚠️ Proxy falhou, usando YouTube iframe direto');
      logger.warn('Fallback direto para YouTube iframe', { trackId: track.id });
      
      if (playerRef.current && playerRef.current.loadVideoById) {
        playerRef.current.loadVideoById(track.id);
        setIsPlaying(true);
        updateMediaSession(track);
        await startSilentAudio();
        requestWakeLock();
        
        // PWA Autoplay Fix para YouTube também
        try {
          // YouTube iframe geralmente funciona melhor, mas vamos garantir
          console.log('🎵 YouTube iframe carregado');
          logger.userAction('YouTube iframe iniciado (fallback)', { trackId: track.id });
        } catch (youtubeError) {
          console.warn('⚠️ YouTube iframe autoplay bloqueado:', youtubeError.message);
          logger.warn('YouTube iframe autoplay bloqueado', { 
            trackId: track.id, 
            error: youtubeError.message 
          });
          
          // Alertar usuário para interagir
          alert('🎵 Clique no player para iniciar a música');
        }
        return;
      }
      
    } catch (error) {
      console.error('ERRO CRÍTICO AO CARREGAR ÁUDIO:', error);
      logger.error('Erro crítico ao carregar áudio', {
        trackId: track.id,
        trackTitle: track.title,
        errorMessage: error.message,
        errorStack: error.stack
      }, error);
      
      // ALERTA DIRETO PARA DEBUG
      alert(`🚨 ERRO CRÍTICO DETECTADO!\n\n` +
            `Música: ${track.title}\n` +
            `ID: ${track.id}\n` +
            `Erro: ${error.message}\n\n` +
            `Tire um print e envie ao desenvolvedor!\n\n` +
            `Console: Aperte F12 para ver detalhes completos`);
      
      // Resetar estado se falhar tudo
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };
  const togglePlay = async () => {
    logger.userAction('togglePlay', {
      isPlaying: isPlaying,
      hasCurrentTrack: !!currentTrack,
      trackId: currentTrack?.id
    });

    console.log('Toggle Play acionado - isPlaying:', isPlaying);

    if (isPlaying) {
      if (playerRef.current && playerRef.current.pauseVideo) {
        playerRef.current.pauseVideo();
      }
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
      if (silentAudioRef.current) {
        silentAudioRef.current.pause();
      }
      setIsPlaying(false);
      releaseWakeLock();
      logger.userAction('Musica pausada', { trackId: currentTrack?.id });
      return;
    }

    if (currentTrack) {
      setIsPlaying(true);
      console.log('Forcando UI de playback imediato');
    }

    let playbackStarted = false;

    if (silentAudioRef.current) {
      try {
        silentAudioRef.current.volume = 0.01;
        await silentAudioRef.current.play();
        logger.debug('Silent audio iniciado');
      } catch (error) {
        logger.warn('Silent audio falhou no togglePlay', { error: error?.message });
      }
    }

    if (backgroundAudioRef.current && backgroundAudioRef.current.src) {
      try {
        backgroundAudioRef.current.volume = volume / 100;
        await backgroundAudioRef.current.play();
        logger.debug('Background audio retomado');
        playbackStarted = true;
      } catch (error) {
        logger.warn('Background audio falhou no togglePlay', { error: error?.message });
      }
    }

    if (currentTrack && playerRef.current) {
      try {
        if (playerRef.current.getPlayerState() === window.YT.PlayerState.CUED || playerRef.current.getPlayerState() === -1) {
          playerRef.current.loadVideoById(currentTrack.id);
        } else {
          playerRef.current.playVideo();
        }
        logger.debug('YouTube play iniciado');
        playbackStarted = true;
      } catch (error) {
        logger.warn('YouTube play falhou no togglePlay', {
          error: error?.message,
          trackId: currentTrack?.id,
        });
      }
    }

    if (!playbackStarted) {
      setIsPlaying(false);
      alert('Erro ao tocar: formato de midia indisponivel neste dispositivo.');
      return;
    }

    updateMediaSession(currentTrack);
    requestWakeLock();

    logger.userAction('Musica iniciada', {
      trackId: currentTrack?.id,
      trackTitle: currentTrack?.title,
      volume: volume
    });
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

    // FORÇAR ÁUDIO REAL - Criar áudio de teste
    try {
      const testAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
      testAudio.volume = 0.1;
      testAudio.loop = true;
      testAudio.playsInline = true;
      await testAudio.play();
      console.log('🔊 Áudio de teste iniciado');
      
      // Parar após 2 segundos
      setTimeout(() => {
        testAudio.pause();
        console.log('🔇 Áudio de teste parado');
      }, 2000);
    } catch (error) {
      console.log('Áudio de teste falhou:', error.message);
    }
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
    logger.userAction('searchMusic', { query: query.trim() });
    
    if (!query || query.trim().length === 0) {
      console.warn('Busca vazia, retornando array vazio');
      logger.warn('Busca vazia', { query });
      return [];
    }

    // Limpar estado anterior para evitar stale UI
    const searchResults = [];
    
    console.log(`ZYRON Radio: Iniciando busca estruturada para "${query}"`);
    logger.info('Iniciando busca estruturada', { query });
    
    // Fallback Chain: Piped Streams -> Piped Search -> Invidious -> Cache Local
    const apiEndpoints = [
      {
        name: 'Piped Streams API',
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
        name: 'YouTube Direct (Vercel Proxy)',
        url: `/api/search?q=${encodeURIComponent(query)}`,
        transform: (data) => data
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


