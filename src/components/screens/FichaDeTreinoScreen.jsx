import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  User,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  Trophy,
  History,
  Settings,
  Bell,
  ChevronDown,
  Check,
  X,
  Search,
  Filter,
  Shield,
  Activity,
  Play,
  Pause,
  CheckCircle2,
  Timer as TimerIcon,
  Plus,
  Minus,
  ArrowBigUp,
  ArrowRight,
  ShieldAlert,
  Moon,
  Sun,
  Coffee,
  CreditCard,
  Crown,
  Flame,
  FileText,
  Download,
  QrCode,
  MoreVertical,
  Menu,
  Zap,
  Droplets,
  Beef,
  Camera,
  Scale,
  Music2,
  SkipForward,
  MessageSquare,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { workoutData } from '../../data/workoutData';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { MoreHorizontal } from 'lucide-react';
import WorkoutCard from '../workout/WorkoutCard';
import WorkoutCompleted from '../workout/WorkoutCompleted';
import { supabase } from '../../lib/supabase';
import { sanitizeWorkoutState } from '../../utils/sanitizer';
import hardcorePWA from '../../utils/hardcorePWA';

import TabPainel from '../navigation/TabPainel';
import SessaoTreinoPremium from './SessaoTreinoPremium';
import TabEvolucao from '../navigation/TabEvolucao';
import TabPerfil from '../navigation/TabPerfil';
import TabCoach from '../navigation/TabCoach';
import MusclePumpWrapper from '../anatomy/MusclePumpWrapper';
import MusicDock from '../shared/MusicDock';
import { useSyncWorkout } from '../../hooks/useSyncWorkout';
import { useGymCheckin } from '../../hooks/useGymCheckin';
import { useMusic } from '../../contexts/MusicContext';
import haptics from '../../utils/haptics';
import { C } from '../../styles/ds';
import { useProfile } from '../../core/profile/useProfile';
import { useExerciseCompletion, useDailyMetrics } from '../../hooks/usePersistence';
import { usePreferences } from '../../hooks/usePreferences';
import NotificationSheet from '../NotificationSheet';
import { checkinApi } from '../../services/checkin/checkinApiService';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// GIF URLs e YouTube Tutorial IDs para cada exercício
// Baseado em treinomestre.com.br - uso de GIFs animados para técnica
export const EXERCISE_VIDEOS = {
  // WORKOUT 1: Peito + Tríceps
  'p1': '50RSzhMG5Hc', // Supino Reto com Barra
  'p2': 'Fa-X2ByLHaY', // Supino Inclinado com Haltere
  'p_cm': 'nuTuKjcQRHg', // Crucifixo Máquina
  'p3': 'nuTuKjcQRHg', // Crossover na Polia
  't2': 'VnFopAIGO7E', // Tríceps na Corda
  't3': '40Cx-IfJhA0', // Tríceps Francês
  't_mb': '2OymsPc-9Tw', // Mergulho no Banco

  // WORKOUT 2: Costas + Bíceps
  'c1': '3qj46qsOgfI', // Puxada Frontal na Máquina
  'c_rc': 'fEA4O71kFr4', // Remada Curvada com Barra
  'c_rm': 'mjFIZX68F_8', // Remada Máquina
  'c_pd': 'mjFIZX68F_8', // Puxada Alta na Polia
  'b1': 'iA4RH6zDin0', // Rosca Direta com Barra
  'b_ra': '8PN6YfFC6Q4', // Rosca Alternada com Haltere
  'b3': 'Qm4NdQttdi8', // Rosca Concentrada

  // WORKOUT 3: Pernas
  'l1': '3vTRFnzCMaA', // Agachamento Livre
  'l2': 'DQ4-HXFlKXI', // Leg Press 45°
  'l3': 'I_uBK4DDflU', // Cadeira Extensora
  'l4': 'PcTCUdxywHo', // Cadeira Flexora
  'l_st': 'PcTCUdxywHo', // Stiff
  'l_ep': 'PcTCUdxywHo', // Elevação de Quadril (Hip Thrust)
  'ca1': 'ZQdqLXtNpMQ', // Panturrilha em Pé
  'ca_s': 'ZQdqLXtNpMQ', // Panturrilha Sentado

  // WORKOUT 4: Ombro
  's1': 'DFXtzdXN_iY', // Desenvolvimento com Haltere
  's2': 'yURmeIEl1Fg', // Elevação Lateral com Haltere
  's3': 'F6toacmeUlA', // Elevação Frontal com Haltere
  's4': 'C9Q9so5Fqws', // Crucifixo Inverso na Máquina
  's_et': 'C9Q9so5Fqws', // Encolhimento de Ombro (Shrug)

  // WORKOUT 5: Bíceps + Tríceps (mesmos exercícios de outros workouts)
  'b_rw': 'iA4RH6zDin0', // Rosca Barra W
  'b2': '8PN6YfFC6Q4', // Rosca Martelo com Haltere
  'b_bi': 'Qm4NdQttdi8', // Rosca Banco Inclinado

  // Extras (se necessário)
  'crunch': 'MKvARqx1TqY',
  'leg_raise': 'JB2oyawG9KI',
  'plank': 'ASdvN_XEl_c',
  'push_up': 'IODxDxX7oi4',
  'pull_up': 'eGo4IYlbE5g',
  'deadlift': 'op9kVnSso6Q',
  'lunges': 'QOVaHwm-Q6U',
};

const QUICK_ACTIONS = [
  { id: 'session', icon: Zap, label: 'Iniciar Treino' },
  { id: 'water', icon: Droplets, label: 'Beber Água' },
  { id: 'protein', icon: Beef, label: 'Proteína' },
  { id: 'photo', icon: Camera, label: 'Nova Foto' },
  { id: 'weight', icon: Scale, label: 'Atualizar Peso' },
];

const QUICK_ICON_MAP = { 
  Zap, 
  Droplets, 
  Beef, 
  Coffee, 
  Camera, 
  Scale,
  Dumbbell,
  LayoutDashboard,
  Target
};

export default function FichaDeTreinoScreen({ user, onLogout, onOpenAdmin }) {
  const {
    currentTrack,
    isPlaying: isMusicPlaying,
    togglePlay: toggleMusicPlayback,
    nextTrack: playNextTrack,
    playlist: musicPlaylist,
  } = useMusic();
  // USE PROFILE: Centralized hook for profile and metrics
  const { profile, metrics, stats, isLoading: profileLoading, updateProfile } = useProfile(user?.id);

  const mergedUser = React.useMemo(() => {
    // Fallback chain: profile.name → auth full_name → auth name → email prefix → 'Atleta'
    const authName = user?.user_metadata?.full_name
      || user?.user_metadata?.name
      || user?.email?.split('@')[0]
      || 'Atleta';
    if (!profile) return { ...user, name: authName, avatar_url: user?.user_metadata?.avatar_url || null };
    return {
      ...user,
      name: profile.name || authName,
      email: profile.email || '',
      avatarUrl: profile.avatarUrl || user?.user_metadata?.avatar_url || null,
      avatar_url: profile.avatarUrl || user?.user_metadata?.avatar_url || null,
      role: profile.role || 'USER',
    };
  }, [user, profile]);

  // Sync avatar updates from core to local if needed
  const handleAvatarUpdate = (newUrl) => updateProfile({ avatarUrl: newUrl });

  // DECLARE STATE FIRST — Before any hooks that depend on these values
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(null);
  const [activeTab, setActiveTab] = useState('painel');
  const [perfilTab, setPerfilTab] = useState('geral');
  const [isTraining, setIsTraining] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [videoModal, setVideoModal] = useState(null); // Keep for painel preview
  const [expandedVideo, setExpandedVideo] = useState(null); // For inline workout videos
  const [loads, setLoads] = useState({});
  const [prHistory, setPrHistory] = useState({});
  const [sessionSets, setSessionSets] = useState([]); // Advanced Sync: Track all sets
  const [restTimer, setRestTimer] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationSheetOpen, setNotificationSheetOpen] = useState(false);
  const [lastWaterTime, setLastWaterTime] = useState(Date.now()); // Para alerta de 2 horas
  const [showPR, setShowPR] = useState(null); // Animation trigger for PR
  const [availableWorkouts, setAvailableWorkouts] = useState(workoutData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);
  const [painelRefreshKey, setPainelRefreshKey] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [sessionLocation, setSessionLocation] = useState(null);
  const [musicPanelOpen, setMusicPanelOpen] = useState(false);
  const [musicPanelView, setMusicPanelView] = useState('player');
  const avatarInputRef = useRef(null);
  const sessionSetsRef = useRef([]);

  // Persistence hooks — all data backed by Supabase (NOW can use selectedWorkoutKey)
  const { metrics: dailyMetrics, updateMetrics } = useDailyMetrics(user?.id);
  const water = dailyMetrics.waterMl;
  const setWater = (newWater) => updateMetrics({ waterMl: typeof newWater === 'function' ? newWater(water) : newWater });
  const protein = dailyMetrics.proteinG;
  const setProtein = (newProtein) => updateMetrics({ proteinG: typeof newProtein === 'function' ? newProtein(protein) : newProtein });
  const weight = dailyMetrics.weightKg || 80;
  const setWeight = (newWeight) => updateMetrics({ weightKg: typeof newWeight === 'function' ? newWeight(weight) : newWeight });

  // Exercise completion with BD persistence (NOW selectedWorkoutKey is defined)
  const { completedExercises, toggleExercise: toggleExerciseCompletion, sessionId } = useExerciseCompletion(user?.id, selectedWorkoutKey ?? 0);

  // Night mode preference
  const { nightMode, setNightMode } = usePreferences(user?.id);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      // Upload to Supabase Storage
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      // Get public URL with cache-busting
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // Single official path: update profile in Supabase
      await updateProfile({ avatarUrl: publicUrl });

      // Update local state
      if (onAvatarUpdate) onAvatarUpdate(publicUrl);
      setLocalAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  // Global Notification Logic
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) return;
      if (data) setActiveNotification(data);
    } catch (e) {}
  };

  const markAsRead = async () => {
    if (!activeNotification) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', activeNotification.id);
      setActiveNotification(null);
    } catch (e) {
      setActiveNotification(null);
    }
  };
  
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const appConstraintsRef = useRef(null);

  // ZYRON SYNC ENGINE: Offline-first persistence
  const { logWorkout, isOnline, syncPending } = useSyncWorkout(user);
  const checkinBackendIdRef = useRef(null);

  const handleCheckinEvent = useCallback(async (event) => {
    if (!event?.type || !user?.id) return;

    try {
      if (event.type === 'CHECKIN_START') {
        const session = event.session;
        const result = await checkinApi.start({
          client_session_id: session?.id || null,
          gym_id: session?.gym_id || 'workout_default',
          source: session?.source || 'gps',
          mode: session?.mode || 'auto',
          timezone: session?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          started_at_utc: session?.started_at_utc || new Date().toISOString(),
          started_at_local: session?.started_at_local || new Date().toISOString(),
          started_lat: session?.started_lat ?? null,
          started_lng: session?.started_lng ?? null,
          started_accuracy_m: session?.started_accuracy_m ?? null,
        });

        const backendId = result?.data?.checkin?.id || null;
        if (backendId) checkinBackendIdRef.current = backendId;
        logger.systemEvent('Check-in iniciado', { backendId, mode: session?.mode, source: session?.source });
        return;
      }

      if (event.type === 'CHECKIN_HEARTBEAT') {
        const checkinId = checkinBackendIdRef.current;
        if (!checkinId) return;

        await checkinApi.heartbeat({
          checkin_id: checkinId,
          heartbeat_at_utc: event?.reading?.captured_at_utc || new Date().toISOString(),
          source: event?.reading?.source || event?.session?.source || 'gps',
          heartbeat_lat: event?.reading?.lat ?? null,
          heartbeat_lng: event?.reading?.lng ?? null,
          heartbeat_accuracy_m: event?.reading?.accuracy_m ?? null,
        });
        return;
      }

      if (event.type === 'CHECKIN_END') {
        const checkinId = checkinBackendIdRef.current;
        if (!checkinId) return;

        const session = event.session || {};
        await checkinApi.end({
          checkin_id: checkinId,
          ended_at_utc: session.ended_at_utc || new Date().toISOString(),
          ended_at_local: session.ended_at_local || new Date().toISOString(),
          timezone: session.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          duration_minutes: Number(session.duration_minutes || 0),
          ended_reason: event.reason || session.ended_reason || 'manual',
          source: event?.reading?.source || session.source || 'manual',
          ended_lat: session.ended_lat ?? event?.reading?.lat ?? null,
          ended_lng: session.ended_lng ?? event?.reading?.lng ?? null,
          ended_accuracy_m: session.ended_accuracy_m ?? event?.reading?.accuracy_m ?? null,
        });

        logger.systemEvent('Check-in finalizado', {
          checkinId,
          durationMinutes: session.duration_minutes || 0,
          reason: event.reason || session.ended_reason || 'manual',
        });
        checkinBackendIdRef.current = null;
      }
    } catch (err) {
      logger.warn('Falha na integracao de check-in', {
        eventType: event?.type,
        error: err?.message,
      }, err);
    }
  }, [user?.id]);

  const {
    startWatch: startGymCheckinWatch,
    stopWatch: stopGymCheckinWatch,
    startManualCheckin,
    endByWorkout,
    resetCheckin,
  } = useGymCheckin({
    gym: null,
    enabled: true,
    onEvent: handleCheckinEvent,
    onError: (err) => logger.warn('Check-in runtime error', err || {}),
  });

  const captureCurrentPosition = useCallback(() => new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true },
    );
  }), []);

  const reverseGeocodeLocation = useCallback(async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=pt-BR`,
        { headers: { 'User-Agent': 'ZyronFitnessApp/4.0' } },
      );
      const geo = await res.json();
      const city = geo.address?.city || geo.address?.town || geo.address?.village || '';
      const state = geo.address?.state || '';
      const stateAbbr = geo.address?.['ISO3166-2-lvl4']?.split('-')[1] || state.slice(0, 2).toUpperCase();
      return city ? `${city}${stateAbbr ? ` · ${stateAbbr}` : ''}` : state || null;
    } catch {
      return null;
    }
  }, []);

  const isAnyAdmin = useMemo(() => {
    const adminEmails = ['raiiimundoemanuel2018@gmail.com', 'raimundoemanuel2018@gmail.com', 'raimundoemanuel1@gmail.com'];
    return (
      profile?.role === 'ADMIN' || 
      user?.role === 'ADMIN' || 
      user?.user_metadata?.role === 'ADMIN' || 
      adminEmails.includes(user?.email?.toLowerCase()) ||
      profile?.role === 'PERSONAL' || 
      user?.role === 'PERSONAL' || 
      user?.user_metadata?.role === 'PERSONAL'
    );
  }, [user, profile]);

  // Auto-day detection (Default)
  const today = new Date().getDay();
  const currentWorkout = selectedWorkoutKey !== null ? availableWorkouts[selectedWorkoutKey] : availableWorkouts[today];

  // Load from localStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('gym_logs');
    const savedDaily = localStorage.getItem('gym_daily');
    const savedPRs = localStorage.getItem('gym_prs');
    const savedWeight = localStorage.getItem('gym_weight');
    const savedSession = localStorage.getItem('gym_active_session');
    const savedVersion = localStorage.getItem('gym_version');
    const todayStr = new Date().toDateString();

    const CURRENT_VERSION = 'zyron-v2';

    // Se a versão do app mudou (nova ficha), limpa a sessão antiga para forçar o novo treino
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.removeItem('gym_active_session');
      localStorage.setItem('gym_version', CURRENT_VERSION);
    } else {
      try {
        if (savedSession) {
          const session = JSON.parse(savedSession);
          if (session && session.date === todayStr) {
            setIsTraining(!!session.isTraining);
            setSelectedWorkoutKey(session.selectedWorkoutKey !== undefined ? session.selectedWorkoutKey : null);
            // completedExercises gerenciado pelo hook useExerciseCompletion — não precisa setter manual
            setSessionTime(Number(session.sessionTime) || 0);
            const restoredSets = Array.isArray(session.sessionSets) ? session.sessionSets : [];
            setSessionSets(restoredSets);
            sessionSetsRef.current = restoredSets;
            setSessionStartedAt(session.sessionStartedAt || null);
            setSessionLocation(session.sessionLocation || null);
            if (session.isTraining) setActiveTab('workout');
          }
        }
      } catch (e) {
        console.error("Erro ao carregar sessão do LocalStorage:", e);
      }
    }

    // ✅ NOTA: Water, Protein, Weight agora são carregados por useDailyMetrics (Supabase)
    // Removido carregamento de localStorage para evitar sobrescrita de dados do Supabase
    // Se necessário fallback offline, o useDailyMetrics já possui cache local
    try {
      if (savedLogs) setLoads(JSON.parse(savedLogs) || {});
      if (savedPRs) setPrHistory(JSON.parse(savedPRs) || {});
      // Weight: comentado porque useDailyMetrics já carrega. Uncomment se precisar legacy fallback
      // if (savedWeight) setWeight(parseFloat(savedWeight) || 80);
    } catch (e) {
      console.error("Erro ao carregar dados do LocalStorage:", e);
    }
    
    setIsLoaded(true);
  }, []);

  // Fetch Custom Workouts
  useEffect(() => {
    const fetchCustomWorkouts = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from('custom_workouts')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (data && data.length > 0) {
          const allExercisesFlat = Object.values(workoutData).flatMap(day => day.exercises || []);
          const expandedWorkouts = { ...workoutData };
          
          data.forEach(cw => {
            const assignedExercises = cw.exercises.map(exId => allExercisesFlat.find(e => e.id === exId)).filter(Boolean);
            expandedWorkouts[`custom_${cw.id}`] = {
              title: cw.workout_name,
              focus: "Ficha VIP Exclusiva",
              image: "/images/custom.png", 
              exercises: assignedExercises,
              isCustom: true
            };
          });
          
          setAvailableWorkouts(expandedWorkouts);
        }
      } catch (err) {
        console.error("Erro ao carregar Ficha Personalizada:", err);
      }
    };

    if (isLoaded) {
      fetchCustomWorkouts();
    }
  }, [user, isLoaded]);

  useEffect(() => {
    sessionSetsRef.current = Array.isArray(sessionSets) ? sessionSets : [];
  }, [sessionSets]);

  // ✅ NOTE: Persistence is now handled by useDailyMetrics hook
  // which handles both Supabase sync and localStorage cache automatically
  // This useEffect was removed to avoid duplicate sync calls and race conditions
  // useDailyMetrics.updateMetrics() is the single source of truth for water/protein/weight persistence

  // Save Session Persistence
  useEffect(() => {
    if (!isLoaded) return;
    if (isTraining) {
      try {
        const todayStr = new Date().toDateString();
        // NUCLEAR CLEANING: Use the new sanitizer utility to prevent circularity
        const rawSession = {
          date: new Date().toDateString(),
          isTraining,
          selectedWorkoutKey,
          completedExercises,
          sessionTime,
          sessionSets,
          sessionStartedAt,
          sessionLocation
        };
        
        const cleanSession = sanitizeWorkoutState(rawSession);
        localStorage.setItem('gym_active_session', JSON.stringify(cleanSession));
      } catch (e) {
        console.error("Falha ao salvar sessão (Estrutura Circular Detectada):", e);
      }
    } else {
      localStorage.removeItem('gym_active_session');
    }
  }, [isTraining, selectedWorkoutKey, completedExercises, sessionTime, sessionSets, sessionStartedAt, sessionLocation, isLoaded]);

  // Session Timer Logic
  useEffect(() => {
    if (isTraining) {
      hardcorePWA.startHeartbeat();
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      hardcorePWA.stopHeartbeat();
      clearInterval(timerRef.current);
    }
    return () => {
      hardcorePWA.stopHeartbeat();
      clearInterval(timerRef.current);
    };
  }, [isTraining]);

  // Rest Timer Logic
  useEffect(() => {
    if (restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        setRestTimer(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(restTimerRef.current);
    }
    return () => clearInterval(restTimerRef.current);
  }, [restTimer]);

  const startSession = async (workoutKey) => {
    // SECURITY FIX: React onClick passes the Event object if no arguments are provided.
    // If workoutKey is an object (like an SVGSVGElement Event), fallback to `today`.
    let safeKey = today;
    if (typeof workoutKey === 'number' || typeof workoutKey === 'string') {
      safeKey = Number(workoutKey);
    }

    setIsTraining(true);
    setSelectedWorkoutKey(safeKey);
    setActiveTab('workout');
    setSessionTime(0);
    setSessionStartedAt(new Date().toISOString());
    setSessionSets([]);
    sessionSetsRef.current = [];

    checkinBackendIdRef.current = null;
    await resetCheckin();

    const initialPos = await captureCurrentPosition();

    if (initialPos?.coords) {
      const { latitude, longitude, accuracy } = initialPos.coords;
      const label = await reverseGeocodeLocation(latitude, longitude);
      if (label) setSessionLocation(label);

      const dynamicGym = {
        id: `gym_${safeKey}`,
        lat: Number(latitude),
        lng: Number(longitude),
        radiusM: 120,
      };

      const started = await startGymCheckinWatch(dynamicGym, initialPos);
      if (!started) {
        startManualCheckin();
      }

      logger.systemEvent('Check-in de treino inicializado', {
        mode: started ? 'auto' : 'manual',
        workoutKey: safeKey,
        lat: Number(latitude),
        lng: Number(longitude),
        accuracy: Number(accuracy || 0),
      });
    } else {
      setSessionLocation('Localizacao indisponivel');
      startManualCheckin();
      logger.warn('Check-in iniciou em fallback manual (sem GPS inicial)', { workoutKey: safeKey });
    }
    // completedExercises gerenciado internamente pelo hook useExerciseCompletion
  };
  const handleExerciseComplete = async (id, isFinal = true, setData = null) => {
    if (setData) {
      setSessionSets(prev => {
        const normalizedSet = {
          exercise_id: id,
          ...setData,
          timestamp: new Date().toISOString(),
        };

        const next = prev
          .filter(item => !(item.exercise_id === id && Number(item.set_number) === Number(normalizedSet.set_number)))
          .concat(normalizedSet);

        sessionSetsRef.current = next;
        return next;
      });
    }

    if (isFinal) {
      // Get exercise name from current workout
      const currentEx = currentWorkout?.exercises?.find(ex => ex.id === id);
      const exerciseName = currentEx?.name || `Exercise ${id}`;

      // Persist to Supabase via hook
      await toggleExerciseCompletion(id, exerciseName, {
        reps: setData?.reps,
        sets: setData?.set_number || setData?.sets,
        notes: setData?.status === 'failed' ? 'Falha registrada na serie' : null,
      });
    }

    const restSeconds = Number(setData?.rest_seconds);
    const exerciseRest = Number(currentWorkout?.exercises?.find(ex => ex.id === id)?.rest);
    setRestTimer(Number.isFinite(restSeconds) ? restSeconds : (Number.isFinite(exerciseRest) ? exerciseRest : 60));
  };

  const handleFinishSession = async () => {
    if (isTraining) {
      const latestSets = Array.isArray(sessionSetsRef.current) ? sessionSetsRef.current : [];
      const safeSetsSnapshot = latestSets.length > 0 ? latestSets : (Array.isArray(sessionSets) ? sessionSets : []);

      try {
        endByWorkout();
        await stopGymCheckinWatch();
      } catch (checkinErr) {
        logger.warn('Falha ao encerrar check-in ao finalizar sessao', {
          error: checkinErr?.message,
        }, checkinErr);
      }

      setLastWorkoutSummary({
        workout: {
          workout_key: String(selectedWorkoutKey || today),
          duration_seconds: sessionTime,
          created_at: new Date().toISOString()
        },
        sets: [...safeSetsSnapshot]
      });
      setShowCompletedScreen(true);
      setIsTraining(false);
      localStorage.removeItem('gym_active_session');
    }
  };

  const handleFinalSync = async (workoutData, setsData) => {
    const latestSets = Array.isArray(sessionSetsRef.current) ? sessionSetsRef.current : [];
    const resolvedSets = Array.isArray(setsData) && setsData.length > 0 ? setsData : latestSets;
    const endedAt = new Date().toISOString();
    const enrichedWorkout = {
      ...workoutData,
      workout_name: currentWorkout?.title || null,
      started_at:   sessionStartedAt || workoutData.created_at || endedAt,
      ended_at:     endedAt,
      location:     sessionLocation || null,
    };

    await logWorkout(enrichedWorkout, resolvedSets);
    setShowCompletedScreen(false);
    sessionSetsRef.current = [];
    setSessionSets([]);
    setLastWorkoutSummary(null);
    setSessionStartedAt(null);
    setSessionLocation(null);
    // Dispara re-fetch no TabPainel para atualizar week strip com dia de hoje
    setPainelRefreshKey(k => k + 1);
  };

  const [voiceTimerActive, setVoiceTimerActive] = useState(false);
  const [plankTime, setPlankTime] = useState(0);
  const plankIntervalRef = useRef(null);

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 0.8; // Lower pitch for industrial feel
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceTimer = () => {
    if (voiceTimerActive) {
      clearInterval(plankIntervalRef.current);
      setVoiceTimerActive(false);
      speak("Sessão finalizada. Excelente trabalho, ZYRON.");
    } else {
      setPlankTime(0);
      setVoiceTimerActive(true);
      speak("Iniciando prancha. Mantenha o core rígido.");
      
      plankIntervalRef.current = setInterval(() => {
        setPlankTime(prev => {
          const next = prev + 1;
          if (next === 30) speak("Trinta segundos. Mantenha a guarda.");
          if (next === 60) speak("Um minuto. Nível Alpha atingido.");
          if (next % 60 === 0 && next > 60) speak(`${next / 60} minutos. Performance extrema.`);
          return next;
        });
      }, 1000);
    }
  };

  const formatPlankTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ... (rest of the return content below)

  const updateLoad = (exerciseId, value) => {
    const newWeight = parseFloat(value);
    const oldPR = prHistory[exerciseId] || 0;
    
    // Progressive Overload Check
    if (newWeight > oldPR) {
      try {
        const newPRs = { ...prHistory, [exerciseId]: newWeight };
        setPrHistory(newPRs);
        
        // Higienização de PRs (Garantir apenas números)
        const cleanPRs = {};
        Object.keys(newPRs).forEach(k => {
          if (typeof newPRs[k] === 'number') cleanPRs[k] = newPRs[k];
          else if (!isNaN(parseFloat(newPRs[k]))) cleanPRs[k] = parseFloat(newPRs[k]);
        });
        
        localStorage.setItem('gym_prs', JSON.stringify(cleanPRs));
        setShowPR(exerciseId);
        setTimeout(() => setShowPR(null), 3000);

        if (user?.id) {
          supabase.from('exercise_prs').upsert({
            user_id: user.id,
            exercise_id: exerciseId,
            max_load: newWeight
          }, { onConflict: 'user_id, exercise_id' });
        }
      } catch (e) {
        console.error("Failed to save PR to localStorage:", e);
      }
    }

    try {
      const newLoads = { ...loads, [exerciseId]: value };
      setLoads(newLoads);
      
      // Sanitização profunda do objeto de cargas
      const cleanLoads = {};
      Object.keys(newLoads).forEach(key => {
        if (typeof newLoads[key] === 'string' || typeof newLoads[key] === 'number') {
          cleanLoads[key] = String(newLoads[key]);
        }
      });
      localStorage.setItem('gym_logs', JSON.stringify(cleanLoads));
    } catch (e) {
      console.error("Erro ao salvar cargas:", e);
    }
  };

  const handleWaterDrink = (val) => {
    setWater(prev => (val === 0 ? 0 : prev + val));
    if (val !== 0) {
      setLastWaterTime(Date.now());
    }
  };

  const openMusicPanel = useCallback((view = 'player') => {
    if (window.navigator?.vibrate) window.navigator.vibrate(18);
    setFabOpen(false);
    setMusicPanelView(view);
    setMusicPanelOpen(true);
  }, []);

  const handleMusicToggleAction = useCallback(async () => {
    setFabOpen(false);

    if (!currentTrack) {
      setMusicPanelView('search');
      setMusicPanelOpen(true);
      return;
    }

    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    await toggleMusicPlayback();
  }, [currentTrack, toggleMusicPlayback]);

  const handleMusicNextAction = useCallback(() => {
    setFabOpen(false);

    if (!currentTrack || musicPlaylist.length <= 1) {
      setMusicPanelView('search');
      setMusicPanelOpen(true);
      return;
    }

    if (window.navigator?.vibrate) window.navigator.vibrate(15);
    playNextTrack();
  }, [currentTrack, musicPlaylist.length, playNextTrack]);

  const waterGoal = metrics?.waterGoalLiters || 3.5;
  const proteinGoal = metrics?.proteinGoalG || 160;
  const isHydrationAlert = (Date.now() - lastWaterTime) > 7200000; // 2 hours in ms
  const remainingProtein = Math.max(0, proteinGoal - protein);
  const showMusicIndicator = Boolean(currentTrack && isMusicPlaying);

  // ── NavButton — minimalista, layoutId deslizante ──────────────────────────
  const NavButton = ({ id, icon: Icon, label }) => {
    const isActive = activeTab === id;
    return (
      <motion.button
        whileTap={{ scale: 0.88 }}
        onClick={() => {
          if (id === 'sidebar') { haptics.light(); setSidebarOpen(true); return; }
          if (id) { haptics.light(); setActiveTab(String(id)); }
        }}
        className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 select-none"
        style={{ minWidth: 56 }}
      >
        {/* Ícone */}
        <div className="relative flex items-center justify-center w-6 h-6">
          <Icon
            size={20}
            strokeWidth={isActive ? 2.2 : 1.6}
            className={`transition-all duration-200 ${
              isActive ? 'text-[#B4FF3C]' : 'text-neutral-500'
            }`}
          />
        </div>

        {/* Label */}
        <span className={`text-[8.5px] font-medium leading-none tracking-wide transition-colors duration-200 ${
          isActive ? 'text-[#B4FF3C]' : 'text-neutral-600'
        }`}>
          {label}
        </span>

        {/* Dot deslizante via layoutId */}
        {isActive && (
          <motion.div
            layoutId="nav-dot-indicator"
            className="absolute -bottom-0.5 h-[3px] w-[3px] rounded-full bg-[#B4FF3C]"
            style={{ boxShadow: '0 0 6px rgba(180,255,60,0.9)' }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />
        )}
      </motion.button>
    );
  };

  const GlassCard = ({ children, className = "", gradient = false }) => (
    <div className={`relative overflow-hidden bg-[linear-gradient(180deg,rgba(22,22,22,0.94)_0%,rgba(10,10,10,0.98)_100%)] backdrop-blur-md border border-white/7 rounded-[24px] p-6 shadow-[0_12px_40px_rgba(0,0,0,0.4)] hover:border-yellow-500/20 hover:scale-[1.015] transition-all duration-300 ${className}`}>
      {gradient && (
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent animate-gradient-x pointer-events-none" />
      )}
      {children}
    </div>
  );

  return (
    <motion.div 
      ref={appConstraintsRef} 
      initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      className={`h-[100dvh] overflow-hidden flex flex-col bg-black text-slate-100 font-sans transition-all duration-700 ${nightMode ? 'sepia-[0.3] brightness-[0.8]' : ''}`}
    >
      
      {/* Background Decor */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 2 }}
        className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-10%,rgba(205,255,90,0.08),transparent_62%),linear-gradient(180deg,#020302_0%,#050605_42%,#000_100%)]"></div>
        <div className="absolute -top-32 -left-28 w-96 h-96 bg-[#CDFF5A]/[0.055] rounded-full blur-[130px]"></div>
      </motion.div>

      {/* Rest Timer Top Bar */}
      <AnimatePresence>
        {restTimer > 0 && (
          <motion.div 
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`fixed top-0 left-0 w-full z-50 px-6 py-2 flex items-center justify-between shadow-xl transition-colors duration-500 ${
              restTimer <= 10 ? 'bg-red-500 text-white' : 'bg-yellow-400 text-neutral-950'
            }`}
          >
            <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest italic">
              <Zap size={14} className="animate-bounce" /> 
              {restTimer <= 10 ? 'PREPARAR PARA SÉRIE' : 'RECUPERAÇÃO ATIVA'}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xl font-black font-mono tracking-tighter">{restTimer}s</div>
              <button onClick={() => setRestTimer(0)} className="bg-black/10 p-1 rounded-md hover:bg-black/20 transition-colors">
                <Plus size={14} className="rotate-45" />
              </button>
            </div>
            {/* Progress bar line */}
            <motion.div 
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 60, ease: "linear" }}
              className="absolute bottom-0 left-0 h-1 w-full origin-left bg-black/20"
            />
          </motion.div>
        )}
        {/* Neon Green "Série Liberada" popup when timer hits 0 (managed briefly via state or just implicit) */}
      </AnimatePresence>

      {/* ── HEADER PREMIUM ─────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.7, type: "spring", stiffness: 120, damping: 18 }}
        className="shrink-0 z-40 relative"
        style={{
          paddingTop: 'max(10px, env(safe-area-inset-top))',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
          background: 'linear-gradient(180deg, rgba(8,15,8,0.98) 0%, rgba(4,8,5,0.94) 64%, rgba(0,0,0,0) 100%)',
          borderBottomLeftRadius: '26px',
          borderBottomRightRadius: '26px',
        }}
      >
        {/* Glow radial atmosférico — atrás do avatar, sutil */}
        <div className="pointer-events-none absolute top-0 left-0 w-[55%] h-full"
          style={{ background: 'radial-gradient(ellipse 80% 90% at 10% 40%, rgba(205,255,90,0.055), transparent 70%)' }} />
        {/* Linha de separação base — integra ao conteúdo */}
        <div className="pointer-events-none absolute bottom-0 left-[12%] right-[12%] h-[1px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />

        <div className="relative w-full flex items-center justify-between gap-3">

          {/* ── Avatar + Greeting ── */}
          <div className="flex items-center gap-3 min-w-0">

            {/* Avatar — clicável para editar foto */}
            <div className="relative shrink-0">
              {/* Anel de brilho sutil */}
              <div className="absolute -inset-1 rounded-full opacity-60"
                style={{
                  background: 'radial-gradient(circle, rgba(205,255,90,0.12) 0%, transparent 70%)',
                  borderRadius: '9999px',
                  filter: 'blur(2px)',
                }} />
              {/* Anel interno */}
              <div className="absolute inset-0 rounded-full pointer-events-none"
                style={{ boxShadow: '0 0 0 1px rgba(205,255,90,0.24), 0 8px 22px rgba(0,0,0,0.5)' }} />
              <input 
                type="file" 
                ref={avatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => avatarInputRef.current?.click()}
                className="relative h-11 w-11 rounded-full overflow-hidden group"
                style={{ background: 'rgba(20,20,20,0.8)' }}
              >
                {mergedUser.avatar_url || profile?.avatarUrl ? (
                  <img src={mergedUser.avatar_url || profile?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <img
                    src="/images/zyron-logo.png"
                    alt="ZYRON"
                    className="w-full h-full object-contain mix-blend-screen"
                  />
                )}
                {/* Overlay camera no hover */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera size={16} style={{ color: '#B4FF3C' }} />
                </div>
              </motion.button>
            </div>

            {/* Texto — minimalista na aba Perfil, completo nas outras */}
            <div className="min-w-0 flex flex-col justify-center gap-[3px]">
              <p className="text-base font-semibold text-white leading-none tracking-tight truncate max-w-[180px]">
                {activeTab === 'perfil' ? 'ZYRON' : 'Bom dia 👋'}
              </p>
              <p className="text-xs font-medium leading-none"
                style={{ color: 'rgba(255,255,255,0.60)' }}>
                {activeTab === 'perfil' ? 'Perfil' : mergedUser.name.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* ── Cápsula de ações — fundo premium, blur, borda sutil ── */}
          <div className="flex items-center gap-[2px] shrink-0"
            style={{
              background: 'rgba(255,255,255,0.045)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: '999px',
              padding: '5px 6px',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                if (activeNotification) markAsRead();
                setNotificationSheetOpen(true);
              }}
              className="relative h-8 w-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
              style={{ color: activeNotification ? '#ffffff' : 'rgba(255,255,255,0.45)' }}
            >
              <Bell size={16} strokeWidth={2} />
              {activeNotification && (
                <span className="absolute top-[6px] right-[6px] h-[7px] w-[7px] rounded-full"
                  style={{
                    background: '#FF3B30',
                    boxShadow: '0 0 6px rgba(255,59,48,0.7)',
                    border: '1.5px solid rgba(14,26,12,0.9)',
                  }} />
              )}
            </motion.button>
            {/* Divider vertical sutil */}
            <div className="w-[1px] h-4 mx-[2px]"
              style={{ background: 'rgba(255,255,255,0.08)' }} />
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={() => setSidebarOpen(true)}
              className="h-8 w-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: 'rgba(255,255,255,0.45)' }}
            >
              <Flame size={16} strokeWidth={2} />
            </motion.button>
          </div>

        </div>
      </motion.header>

      {isTraining && (
        <div className="w-full mt-3 px-4">
           <motion.div 
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="bg-red-500/10 border border-red-500/20 px-4 py-1.5 rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-red-500/5"
           >
             <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
             <span className="text-xs font-black font-mono text-red-500 tracking-tighter">SESSÃO ATIVA: {formatTime(sessionTime)}</span>
           </motion.div>
        </div>
      )}

      <motion.main
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="flex-1 w-full px-4 pt-1 relative z-10 overflow-y-auto"
        style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}
      >
        <AnimatePresence mode="wait">

          {/* PAINEL SCREEN */}
          {activeTab === 'painel' && (
            <TabPainel
              user={mergedUser}
              today={today} currentWorkout={currentWorkout}
              startSession={startSession} water={water} waterGoal={waterGoal}
              isHydrationAlert={isHydrationAlert} handleWaterDrink={handleWaterDrink}
              setWater={setWater}
              protein={protein} proteinGoal={proteinGoal} setProtein={setProtein}
              refreshKey={painelRefreshKey}
              workoutData={availableWorkouts}
            />
          )}

          {/* WORKOUT SCREEN - PREMIUM MERGED */}
          {activeTab === 'workout' && (
            <MusclePumpWrapper userRole={isAnyAdmin ? 'ADMIN' : 'USER'} isTraining={isTraining}>
              <SessaoTreinoPremium
                today={today}
                workoutData={availableWorkouts}
                startSession={startSession}
                setVideoModal={setVideoModal}
                isTraining={isTraining}
                setIsTraining={handleFinishSession}
                currentWorkout={currentWorkout}
                completedExercises={completedExercises}
                restTimer={restTimer}
                handleExerciseComplete={handleExerciseComplete}
                loads={loads}
                updateLoad={updateLoad}
                prHistory={prHistory}
                showPR={showPR}
                onActivateMuscle={() => {}}
                isPremiumUser={true}
                currentExerciseId={null}
                activePrimaryMuscles={[]}
                activeMuscles={[]}
                userId={user?.id}
              />
            </MusclePumpWrapper>
          )}

          {/* PROGRESS SCREEN */}
          {activeTab === 'progress' && (
            <TabEvolucao 
              user={mergedUser}
              profile={profile}
              updateProfile={updateProfile}
              currentWorkout={currentWorkout} 
              prHistory={prHistory} 
              weight={weight} 
              setWeight={setWeight} 
              workoutData={availableWorkouts}
            />
          )}

          {/* PERFIL SCREEN */}
          {activeTab === 'perfil' && (
            <TabPerfil
              user={mergedUser} profile={profile} updateProfile={updateProfile}
              today={today} voiceTimerActive={voiceTimerActive}
              toggleVoiceTimer={toggleVoiceTimer} formatPlankTime={formatPlankTime}
              plankTime={plankTime} onLogout={onLogout}
              onAvatarUpdate={handleAvatarUpdate}
              stats={stats} metrics={metrics}
            />
          )}

          {/* COACH IA SCREEN */}
          {activeTab === 'coach' && (
            <TabCoach
              user={mergedUser}
              profile={profile}
              metrics={metrics}
              prHistory={prHistory}
              workoutData={availableWorkouts}
            />
          )}

        </AnimatePresence>

        {/* Global Video PiP */}
        <AnimatePresence>
          {videoModal && (
            <motion.div
              drag
              dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
              dragElastic={0.4}
              onDragEnd={(e, info) => {
                if (info.offset.y < -50 || info.offset.y > 50) setVideoModal(null);
              }}
              initial={{ opacity: 0, y: 50, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.8 }}
              className="fixed bottom-32 right-4 z-50 w-72 bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing"
            >
              <div className="flex justify-between items-center px-4 py-3 bg-neutral-950 border-b border-white/5 pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white truncate max-w-[180px]">{videoModal.name}</h4>
                </div>
                <button
                  onClick={() => setVideoModal(null)}
                  className="text-neutral-500 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="relative aspect-video bg-black pointer-events-none">
                <div className="absolute inset-0 pointer-events-auto">
                  <iframe
                    src={`https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(videoModal.query)}&autoplay=1&rel=0&controls=0`}
                    title={videoModal.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              <div className="px-4 py-2 bg-neutral-950/80 backdrop-blur-md flex justify-center">
                <div className="w-8 h-1 bg-white/20 rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.main>

      {/* ── Toast global ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.93 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="bg-[rgba(14,14,14,0.97)] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.8)] px-5 py-2.5 rounded-full flex items-center gap-2.5 backdrop-blur-2xl">
              <span className="text-base">{toastMessage.icon}</span>
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          PREMIUM FLOATING DOCK — SVG côncavo + FAB neon + pop menu orgânico
      ══════════════════════════════════════════════════════════════════════ */}

      {/* Backdrop escurecido quando FAB aberto */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            key="fab-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Menu de ações — pop orgânico acima da nav ─────────────────── */}
      <AnimatePresence>
        {fabOpen && (
          <div
            key="fab-menu-wrapper"
            className="fixed z-[48] w-[92%] max-w-[420px]"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom) + 90px)',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <div className="bg-[rgba(16,16,18,0.98)] border border-white/[0.08] rounded-[28px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-3xl">

              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-8 h-[3px] rounded-full bg-white/10" />
              </div>

              <div className="px-4 pb-5 pt-2 space-y-2 max-h-[58vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                {/* Iniciar Treino — CTA principal */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03, type: 'spring', stiffness: 340, damping: 28 }}
                  onClick={() => {
                    setFabOpen(false);
                    if (window.navigator?.vibrate) window.navigator.vibrate(40);
                    setTimeout(() => startSession(Number(today)), 120);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[18px] bg-[#B4FF3C] group"
                  style={{ boxShadow: '0 0 20px rgba(180,255,60,0.3), 0 6px 16px rgba(0,0,0,0.4)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black/15 flex items-center justify-center">
                      <Zap size={16} className="text-neutral-950" />
                    </div>
                    <div className="text-left">
                      <span className="block text-neutral-950 text-[12px] font-black uppercase tracking-widest leading-tight">Iniciar Treino</span>
                      <span className="block text-neutral-950/60 text-[9px] font-semibold uppercase tracking-widest mt-0.5">Sugestão do dia</span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-neutral-950/50 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
                </motion.button>

                {/* Musica — bloco dedicado no botao + */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 340, damping: 28 }}
                  className="rounded-[18px] border border-[#B4FF3C]/20 bg-[#B4FF3C]/[0.06] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#B4FF3C]/15 border border-[#B4FF3C]/25 flex items-center justify-center">
                        <Music2 size={15} className="text-[#B4FF3C]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-black uppercase tracking-wider text-white">Musica</p>
                        <p className="text-[9px] text-[#B4FF3C]/80 truncate">
                          {currentTrack ? `${currentTrack.title || 'Faixa atual'}${isMusicPlaying ? ' • tocando' : ' • pausado'}` : 'Sem faixa carregada'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => openMusicPanel('player')}
                      className="shrink-0 rounded-full border border-[#B4FF3C]/25 bg-[#B4FF3C]/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-[#B4FF3C]"
                    >
                      Abrir
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: Search,
                        label: 'Buscar musica',
                        sub: currentTrack ? 'Adicionar faixa' : 'Escolher primeira',
                        color: 'text-[#B4FF3C]',
                        bg: 'bg-[#B4FF3C]/10 border-[#B4FF3C]/15',
                        delay: 0.07,
                        action: () => openMusicPanel('search'),
                      },
                      {
                        icon: isMusicPlaying ? Pause : Play,
                        label: 'Pausar/Continuar',
                        sub: currentTrack ? (isMusicPlaying ? 'Pausar faixa' : 'Retomar agora') : 'Abrir para tocar',
                        color: 'text-amber-300',
                        bg: 'bg-amber-500/10 border-amber-400/15',
                        delay: 0.1,
                        action: handleMusicToggleAction,
                      },
                      {
                        icon: SkipForward,
                        label: 'Proxima faixa',
                        sub: musicPlaylist.length > 1 ? 'Avancar fila' : 'Adicionar mais',
                        color: 'text-cyan-300',
                        bg: 'bg-cyan-500/10 border-cyan-400/15',
                        delay: 0.13,
                        action: handleMusicNextAction,
                      },
                      {
                        icon: Music2,
                        label: 'Abrir player',
                        sub: 'Controles completos',
                        color: 'text-violet-300',
                        bg: 'bg-violet-500/10 border-violet-400/15',
                        delay: 0.16,
                        action: () => openMusicPanel('player'),
                      },
                    ].map(({ icon: Ic, label, sub, color, bg, delay, action }) => (
                      <motion.button
                        key={label}
                        whileTap={{ scale: 0.94 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay, type: 'spring', stiffness: 340, damping: 28 }}
                        onClick={action}
                        className={`flex flex-col items-start p-3 rounded-[14px] border ${bg} transition-all`}
                      >
                        <div className={`w-7 h-7 rounded-full ${bg} flex items-center justify-center mb-2`}>
                          <Ic size={14} className={color} />
                        </div>
                        <span className="text-white text-[10px] font-bold leading-tight">{label}</span>
                        <span className={`text-[8px] font-medium mt-0.5 ${color} opacity-70`}>{sub}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>

                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      icon: Droplets, label: 'Beber 250ml', sub: 'Registrar copo',
                      color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-400/15',
                      delay: 0.18,
                      action: () => {
                        setFabOpen(false);
                        if (window.navigator?.vibrate) window.navigator.vibrate(20);
                        handleWaterDrink(0.25);
                        setToastMessage({ icon: '💧', text: '+250ml registrados' });
                        setTimeout(() => setToastMessage(null), 2500);
                      },
                    },
                    {
                      icon: Beef, label: 'Adicionar 30g', sub: 'Scoop proteína',
                      color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-400/15',
                      delay: 0.21,
                      action: () => {
                        setFabOpen(false);
                        if (window.navigator?.vibrate) window.navigator.vibrate(20);
                        setProtein(prev => prev + 30);
                        setToastMessage({ icon: '🥩', text: '+30g adicionados' });
                        setTimeout(() => setToastMessage(null), 2500);
                      },
                    },
                  ].map(({ icon: Ic, label, sub, color, bg, delay, action }) => (
                    <motion.button
                      key={label}
                      whileTap={{ scale: 0.94 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay, type: 'spring', stiffness: 340, damping: 28 }}
                      onClick={action}
                      className={`flex flex-col items-start p-3.5 rounded-[16px] border ${bg} transition-all`}
                    >
                      <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center mb-2.5`}>
                        <Ic size={15} className={color} />
                      </div>
                      <span className="text-white text-[10.5px] font-bold leading-tight">{label}</span>
                      <span className={`text-[8.5px] font-medium mt-0.5 ${color} opacity-70`}>{sub}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Atalhos secundários */}
                {[
                  {
                    icon: Camera, label: 'Nova Foto de Progresso', delay: 0.24,
                    action: () => { setFabOpen(false); if (window.navigator?.vibrate) window.navigator.vibrate(15); setTimeout(() => setActiveTab('progress'), 100); },
                  },
                  {
                    icon: Scale, label: 'Atualizar Peso Corporal', delay: 0.27,
                    action: () => { setFabOpen(false); if (window.navigator?.vibrate) window.navigator.vibrate(15); setTimeout(() => setActiveTab('perfil'), 100); },
                  },
                ].map(({ icon: Ic, label, delay, action }) => (
                  <motion.button
                    key={label}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay, type: 'spring', stiffness: 340, damping: 28 }}
                    onClick={action}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-white/[0.04] border border-white/[0.06] group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center border border-white/8">
                        <Ic size={13} className="text-neutral-400" />
                      </div>
                      <span className="text-neutral-300 text-[10.5px] font-medium">{label}</span>
                    </div>
                    <ArrowRight size={13} className="text-neutral-700 group-hover:text-[#B4FF3C] transition-colors" />
                  </motion.button>
                ))}

              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PREMIUM FLOATING DOCK ─────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.45, type: 'spring', stiffness: 160, damping: 26 }}
        className="fixed bottom-0 left-0 w-full z-[50] flex justify-center pointer-events-none"
        style={{ paddingBottom: 'max(14px, env(safe-area-inset-bottom))' }}
      >
        {/* Gradiente de fundo que conecta a nav ao app */}
        <div className="absolute bottom-0 left-0 w-full h-[140px] bg-linear-to-t from-black via-black/88 to-transparent pointer-events-none" />

        <div className="pointer-events-auto relative w-[94%] max-w-[430px]">

          {/* ── FAB — encaixado no topo da concha ── */}
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ top: '-28px' }}>
            {/* Sombra circular no fundo persistente */}
            <div className="absolute inset-0 rounded-full bg-[#B4FF3C] opacity-14 blur-xl" style={{ width: 60, height: 60, top: -5, left: -5 }} />
            <motion.button
              animate={{ rotate: fabOpen ? 45 : 0 }}
              whileTap={{ scale: 0.87 }}
              transition={{ type: 'spring', stiffness: 340, damping: 22 }}
              onClick={() => {
                if (window.navigator?.vibrate) window.navigator.vibrate(fabOpen ? 15 : 30);
                setFabOpen(f => !f);
              }}
              className={`relative flex h-[56px] w-[56px] items-center justify-center rounded-full border-4 border-black transition-colors duration-200 ${
                fabOpen ? 'bg-[rgba(28,28,30,1)]' : 'bg-[#B4FF3C]'
              }`}
              style={fabOpen
                ? { boxShadow: '0 4px 20px rgba(0,0,0,0.9)' }
                : { boxShadow: '0 0 22px rgba(180,255,60,0.32), 0 10px 26px rgba(0,0,0,0.72)' }
              }
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />
              {showMusicIndicator && (
                <>
                  <div
                    className="absolute top-[7px] right-[7px] h-2.5 w-2.5 rounded-full bg-[#B4FF3C] z-10"
                    style={{ boxShadow: '0 0 10px rgba(180,255,60,0.95)' }}
                  />
                  <div className="absolute top-[5px] right-[5px] h-3.5 w-3.5 rounded-full bg-[#B4FF3C]/35 animate-ping" />
                </>
              )}
              <Plus
                size={24}
                strokeWidth={2.8}
                className={`relative z-10 transition-colors duration-200 ${fabOpen ? 'text-[#B4FF3C]' : 'text-neutral-950'}`}
              />
            </motion.button>
          </div>

          {/* ── A CONCHA — barra com recorte côncavo no centro ── */}
          <div className="relative" style={{ filter: 'drop-shadow(0 -8px 24px rgba(0,0,0,0.55))' }}>
            {/* SVG da forma côncava — mais fechada e orgânica */}
            <svg
              viewBox="0 0 420 68"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full block"
              style={{ overflow: 'visible' }}
            >
              {/* Fundo da concha — curva côncava mais pronunciada e suave */}
              <path
                d={`
                  M20,0
                  L162,0
                  C166,0 168,0 170,4
                  C174,12 178,32 210,34
                  C242,32 246,12 250,4
                  C252,0 254,0 258,0
                  L400,0
                  C410.5,0 420,8 420,18
                  L420,68 L0,68
                  L0,18
                  C0,8 9.5,0 20,0 Z
                `}
                fill="rgba(14,15,17,0.985)"
              />

              {/* Linha de borda topo — 2 metades, respeitando o vazio do FAB */}
              <path d="M20,0.5 L162,0.5"       stroke="rgba(255,255,255,0.075)" strokeWidth="1" fill="none" />
              <path d="M258,0.5 L400,0.5"      stroke="rgba(255,255,255,0.075)" strokeWidth="1" fill="none" />

              {/* Brilho neon sutil nas duas metades */}
              <path d="M50,0.5 L160,0.5"       stroke="rgba(180,255,60,0.12)" strokeWidth="0.8" fill="none" />
              <path d="M260,0.5 L370,0.5"      stroke="rgba(180,255,60,0.12)" strokeWidth="0.8" fill="none" />

              {/* Curva do recorte — suave highlight */}
              <path
                d="M170,4 C174,12 178,32 210,34 C242,32 246,12 250,4"
                stroke="rgba(255,255,255,0.05)" strokeWidth="1.2" fill="none"
              />
            </svg>

            {/* Backdrop blur aplicado na forma */}
            <div className="absolute inset-0 -z-10 pointer-events-none backdrop-blur-2xl" />

            {/* ── 4 NavButtons posicionados sobre o SVG ── */}
            <div className="absolute inset-0 flex items-center justify-between px-4" style={{ paddingBottom: '2px' }}>
              <NavButton id="painel"  icon={LayoutDashboard} label="Home"    />
              <NavButton id="workout" icon={Dumbbell}        label="Workout" />
              {/* Espaço central — coincide exatamente com o recorte SVG */}
              <div className="w-[50px] shrink-0" />
              <NavButton id="coach"   icon={MessageSquare}   label="Coach"   />
              <NavButton id="sidebar" icon={MoreHorizontal}  label="Menu"    />
            </div>
          </div>

        </div>
      </motion.nav>

      {/* PREMIUM SIDEBAR (Gaveta Lateral) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Sidebar Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-60"
              style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
            />

            {/* Sidebar Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 h-full z-70 flex flex-col overflow-y-auto"
              style={{
                width: '82vw',
                maxWidth: 320,
                background: 'rgba(10,10,13,0.98)',
                borderLeft: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '-16px 0 48px rgba(0,0,0,0.9)',
                padding: '0 20px',
              }}
            >
              {/* Top glow accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${C.neon}40, transparent)` }} />

              {/* ── PROFILE HEADER ── */}
              <div className="flex items-center justify-between pt-12 pb-5">
                <div className="flex items-center gap-3">
                  {/* Avatar with neon halo */}
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${C.neon}50, transparent 60%)`, transform: 'scale(1.15)', borderRadius: '50%' }} />
                    <div className="relative w-[52px] h-[52px] rounded-full overflow-hidden flex items-center justify-center"
                      style={{ border: `2px solid ${C.neonBorder}`, background: '#1a1a1e', boxShadow: `0 0 14px rgba(205,255,90,0.12)` }}>
                      {mergedUser.avatar_url ? (
                        <img src={mergedUser.avatar_url} alt={mergedUser.name} className="w-full h-full object-cover"
                          onError={e => { e.target.style.display = 'none'; }} />
                      ) : (
                        <span className="font-black text-[20px] uppercase" style={{ color: C.neon }}>
                          {mergedUser.name?.charAt(0) || 'A'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2 className="font-black uppercase tracking-wider text-white text-[13px] leading-none">
                      {mergedUser.name}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ADE80' }} />
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(74,222,128,0.7)' }}>Online</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <X size={16} style={{ color: C.textSub }} />
                </button>
              </div>

              {/* ── QUICK STATS STRIP ── */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { val: stats?.weeklyTrainedDays || 0, label: 'Treinos/Sem', icon: Dumbbell, color: C.neon, rgb: '205,255,90' },
                  { val: stats?.currentStreak || 0, label: 'Streak', icon: Flame, color: '#FB923C', rgb: '251,146,60' },
                  { val: stats?.monthlyWorkouts || 0, label: 'No mês', icon: Trophy, color: '#A78BFA', rgb: '167,139,250' },
                ].map(({ val, label, icon: Icon, color, rgb }) => (
                  <div key={label} className="flex flex-col items-center py-3 rounded-[14px]"
                    style={{ background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.14)` }}>
                    <Icon size={11} style={{ color }} className="mb-1" />
                    <p className="text-[16px] font-black text-white leading-none">{val}</p>
                    <p className="text-[7.5px] font-bold uppercase tracking-wider mt-0.5" style={{ color: `rgba(${rgb},0.55)` }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="mb-4" style={{ height: 1, background: C.border }} />

              {/* ── NAVEGAÇÃO ── */}
              <p className="text-[8px] font-black uppercase tracking-[0.28em] mb-2 ml-1" style={{ color: C.textMute }}>Navegação</p>
              <div className="space-y-2 mb-4">

                {/* Evolução & Fotos */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSidebarOpen(false); setActiveTab('progress'); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] transition-colors"
                  style={{ background: 'rgba(205,255,90,0.05)', border: `1px solid ${C.neonBorder}` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: C.neonBg }}>
                      <Trophy size={14} style={{ color: C.neon }} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white leading-none">Evolução</p>
                      <p className="text-[8.5px] mt-0.5" style={{ color: C.neonDim }}>Fotos & Gráficos</p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: C.neonDim }} />
                </motion.button>

                {/* Perfil & Voz */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setSidebarOpen(false); setActiveTab('perfil'); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] transition-colors"
                  style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.16)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'rgba(139,92,246,0.10)' }}>
                      <User size={14} style={{ color: '#A78BFA' }} />
                    </div>
                    <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white leading-none">Perfil</p>
                      <p className="text-[8.5px] mt-0.5" style={{ color: 'rgba(167,139,250,0.55)' }}>Metas & Voz</p>
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: 'rgba(167,139,250,0.4)' }} />
                </motion.button>
              </div>

              {/* ── CONFIGURAÇÕES ── */}
              <p className="text-[8px] font-black uppercase tracking-[0.28em] mb-2 ml-1" style={{ color: C.textMute }}>Configurações</p>
              <div className="space-y-2 flex-1">

                {/* Modo Noturno */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setNightMode(!nightMode); if(window.navigator?.vibrate) window.navigator.vibrate(20); }}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-[16px] transition-colors"
                  style={{
                    background: nightMode ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.025)',
                    border: nightMode ? '1px solid rgba(245,158,11,0.25)' : `1px solid ${C.border}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px]"
                      style={{ background: nightMode ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.05)' }}>
                      {nightMode
                        ? <Sun size={14} style={{ color: '#F59E0B' }} />
                        : <Moon size={14} style={{ color: C.textSub }} />}
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest"
                      style={{ color: nightMode ? '#F59E0B' : 'rgba(255,255,255,0.75)' }}>Modo Noturno</span>
                  </div>
                  {/* Toggle pill */}
                  <div className="relative w-10 h-[22px] rounded-full transition-colors"
                    style={{ background: nightMode ? '#F59E0B' : 'rgba(255,255,255,0.10)' }}>
                    <motion.div
                      layout
                      className="absolute top-[3px] w-[16px] h-[16px] bg-white rounded-full shadow"
                      style={{ left: nightMode ? '21px' : '3px' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  </div>
                </motion.button>

                {/* Admin Panel */}
                {isAnyAdmin && (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSidebarOpen(false); if(onOpenAdmin) onOpenAdmin(); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[16px] transition-colors"
                    style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.20)' }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px]" style={{ background: 'rgba(255,59,48,0.10)' }}>
                      <ShieldAlert size={14} style={{ color: C.red }} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: C.red }}>Painel Master Admin</span>
                  </motion.button>
                )}
              </div>

              {/* ── FOOTER ── */}
              <div className="shrink-0 pt-5 pb-10" style={{ borderTop: `1px solid ${C.border}`, marginTop: 20 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-[16px] transition-colors"
                  style={{ background: 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.14)' }}
                >
                  <LogOut size={13} style={{ color: 'rgba(255,100,90,0.7)' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(255,100,90,0.7)' }}>Encerrar Sessão</span>
                </motion.button>

                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <div className="w-1 h-1 rounded-full" style={{ background: C.neon, opacity: 0.5 }} />
                  <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: C.textMute }}>
                    Zyron v4.0.0
                  </p>
                  <div className="w-1 h-1 rounded-full" style={{ background: C.neon, opacity: 0.5 }} />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notification Sheet */}
      <NotificationSheet
        userId={user?.id}
        isOpen={notificationSheetOpen}
        onClose={() => setNotificationSheetOpen(false)}
      />

      <MusicDock
        isOpen={musicPanelOpen}
        onClose={() => setMusicPanelOpen(false)}
        initialView={musicPanelView}
      />

      {/* Global Style Inject for Animations */}
      <style>{`
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
      {/* Workout Completed Screen Overlay */}
      <AnimatePresence>
        {showCompletedScreen && lastWorkoutSummary && (
          <WorkoutCompleted 
            workout={lastWorkoutSummary.workout}
            sets={lastWorkoutSummary.sets}
            onFinish={handleFinalSync}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
