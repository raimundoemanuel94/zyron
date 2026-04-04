import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Dumbbell, 
  User, 
  LogOut, 
  ArrowRight, 
  PlayCircle, 
  PauseCircle, 
  ChevronLeft, 
  ChevronRight, 
  Share2, 
  CheckCircle, 
  Zap, 
  Droplets, 
  Beef, 
  MessageSquare, 
  Camera, 
  Scale, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Award, 
  Trophy, 
  Target, 
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
  Calendar,
  Play,
  CheckCircle2,
  Timer as TimerIcon,
  Plus,
  Minus,
  ArrowBigUp,
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
  Menu
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
import { useSyncWorkout } from '../../hooks/useSyncWorkout';
import haptics from '../../utils/haptics';

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
  // Debug: Log do objeto user
  console.log('🔍 DEBUG - User object:', user);
  console.log('🔍 DEBUG - User name:', user?.name);
  console.log('🔍 DEBUG - User role:', user?.role);
  console.log('🔍 DEBUG - User email:', user?.email);
  console.log('🔍 DEBUG - User id:', user?.id);
  
  const [userProfile, setUserProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const mergedUser = React.useMemo(() => ({
    ...user,
    ...userProfile,
    name: userProfile?.name || user?.user_metadata?.name || user?.name || user?.email?.split('@')[0] || 'Atleta'
  }), [user, userProfile]);

  // Buscar perfil completo do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      console.log('🔍 Buscando perfil para user ID:', user.id);
      console.log('🔍 User email:', user.email);
      
      // Cinematic Arrival Haptics
      const t = setTimeout(() => {
        if (window.navigator?.vibrate) window.navigator.vibrate([30, 50, 30]);
      }, 4500); 

      try {
        // Tentar buscar por ID primeiro
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.warn('⚠️ Erro ao buscar perfil por ID:', error);
          
          // Fallback: buscar por email
          console.log('🔄 Tentando buscar por email...');
          const { data: emailData, error: emailError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
            
          if (emailError) {
            console.error('❌ Erro ao buscar perfil por email:', emailError);
            console.log('🔍 Criando perfil padrão...');
            
            // Criar perfil padrão se não existir
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                name: user.email?.split('@')[0] || 'Usuário',
                role: user.user_metadata?.role || 
                      (['raiiimundoemanuel2018@gmail.com', 'raimundoemanuel2018@gmail.com', 'raimundoemanuel1@gmail.com'].includes(user.email?.toLowerCase()) ? 'ADMIN' : 'USER'),
                created_at: new Date().toISOString()
              })
              .select('*')
              .single();
              
            if (createError) {
              console.error('❌ Erro ao criar perfil:', createError);
              return;
            }
            
            console.log('✅ Perfil criado:', newProfile);
            setUserProfile(newProfile);
          } else {
            console.log('✅ Perfil encontrado por email:', emailData);
            setUserProfile(emailData);
          }
        } else {
          console.log('✅ Perfil encontrado por ID:', data);
          setUserProfile(data);
        }
      } catch (error) {
        console.error('❌ Erro geral ao buscar perfil:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id, user?.email]);
  const [activeTab, setActiveTab] = useState('painel');
  const [perfilTab, setPerfilTab] = useState('geral');
  const [isTraining, setIsTraining] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [videoModal, setVideoModal] = useState(null); // Keep for painel preview
  const [expandedVideo, setExpandedVideo] = useState(null); // For inline workout videos
  const [water, setWater] = useState(0);
  const [protein, setProtein] = useState(0);
  const [loads, setLoads] = useState({});
  const [prHistory, setPrHistory] = useState({});
  const [completedExercises, setCompletedExercises] = useState([]);
  const [sessionSets, setSessionSets] = useState([]); // Advanced Sync: Track all sets
  const [restTimer, setRestTimer] = useState(0);
  const [weight, setWeight] = useState(80);
  const [lastWaterTime, setLastWaterTime] = useState(Date.now()); // Para alerta de 2 horas
  const [nightMode, setNightMode] = useState(false); // Low blue light filter
  const [showPR, setShowPR] = useState(null); // Animation trigger for PR
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(null);
  const [availableWorkouts, setAvailableWorkouts] = useState(workoutData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [showCompletedScreen, setShowCompletedScreen] = useState(false);
  const [lastWorkoutSummary, setLastWorkoutSummary] = useState(null);
  const [activeNotification, setActiveNotification] = useState(null);

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

  const isAnyAdmin = useMemo(() => {
    const adminEmails = ['raiiimundoemanuel2018@gmail.com', 'raimundoemanuel2018@gmail.com', 'raimundoemanuel1@gmail.com'];
    return (
      userProfile?.role === 'ADMIN' || 
      user?.role === 'ADMIN' || 
      user?.user_metadata?.role === 'ADMIN' || 
      adminEmails.includes(user?.email?.toLowerCase()) ||
      userProfile?.role === 'PERSONAL' || 
      user?.role === 'PERSONAL' || 
      user?.user_metadata?.role === 'PERSONAL'
    );
  }, [user, userProfile]);

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
            setCompletedExercises(Array.isArray(session.completedExercises) ? session.completedExercises : []);
            setSessionTime(Number(session.sessionTime) || 0);
            if (session.isTraining) setActiveTab('workout');
          }
        }
      } catch (e) {
        console.error("Erro ao carregar sessão do LocalStorage:", e);
      }
    }

    try {
      if (savedLogs) setLoads(JSON.parse(savedLogs) || {});
      if (savedPRs) setPrHistory(JSON.parse(savedPRs) || {});
      if (savedWeight) setWeight(parseFloat(savedWeight) || 80);

      if (savedDaily) {
        const daily = JSON.parse(savedDaily);
        if (daily && daily.date === todayStr) {
          setWater(Number(daily.water) || 0);
          setProtein(Number(daily.protein) || 0);
          if (daily.lastWaterTime) setLastWaterTime(Number(daily.lastWaterTime));
        }
      }
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

  // Save Daily Stats & Weight
  useEffect(() => {
    const todayStr = new Date().toDateString();
    try {
      // Higienização rigorosa para evitar estruturas circulares (ex: eventos React/SVG)
      const safeWater = typeof water === 'number' ? water : (parseFloat(water) || 0);
      const safeProtein = typeof protein === 'number' ? protein : (parseFloat(protein) || 0);
      const safeWeight = typeof weight === 'number' ? weight : (parseFloat(weight) || 80);
      const safeWaterTime = typeof lastWaterTime === 'number' ? lastWaterTime : Date.now();

      localStorage.setItem('gym_daily', JSON.stringify({
        date: String(todayStr),
        water: safeWater,
        protein: safeProtein,
        lastWaterTime: safeWaterTime
      }));
      localStorage.setItem('gym_weight', String(safeWeight));
    } catch (e) {
      console.error("Falha ao persistir dados diários no localStorage:", e);
    }

    // Sync com Supabase (Fire and forget, Offline-First)
    if (user?.id) {
      const todayIso = new Date().toISOString().split('T')[0];
      supabase.from('daily_stats').upsert({
        user_id: user.id,
        date: todayIso,
        water_amount: Number(water) || 0,
        protein_amount: Number(protein) || 0
      }, { onConflict: 'user_id, date' });

      supabase.from('profiles').update({ weight: Number(weight) || 0 }).eq('id', user.id);
    }
  }, [water, protein, weight, lastWaterTime, isLoaded, user]);

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
          sessionTime
        };
        
        const cleanSession = sanitizeWorkoutState(rawSession);
        localStorage.setItem('gym_active_session', JSON.stringify(cleanSession));
      } catch (e) {
        console.error("Falha ao salvar sessão (Estrutura Circular Detectada):", e);
      }
    } else {
      localStorage.removeItem('gym_active_session');
    }
  }, [isTraining, selectedWorkoutKey, completedExercises, sessionTime, isLoaded]);

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

  const startSession = (workoutKey) => {
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
    setCompletedExercises([]);
  };

  const handleExerciseComplete = (id, isFinal = true, setData = null) => {
    if (setData) {
      setSessionSets(prev => [...prev, {
        exercise_id: id,
        ...setData,
        timestamp: new Date().toISOString()
      }]);
    }

    if (isFinal) {
      if (!completedExercises.includes(id)) {
        setCompletedExercises(prev => [...prev, id]);
      }
    }
    setRestTimer(60); 
  };

  const handleFinishSession = async () => {
    if (isTraining) {
      setLastWorkoutSummary({
        workout: {
          workout_key: String(selectedWorkoutKey || today),
          duration_seconds: sessionTime,
          created_at: new Date().toISOString()
        },
        sets: [...sessionSets]
      });
      setShowCompletedScreen(true);
      setIsTraining(false);
      localStorage.removeItem('gym_active_session');
    }
  };

  const handleFinalSync = async (workoutData, setsData) => {
    await logWorkout(workoutData, setsData);
    setShowCompletedScreen(false);
    setSessionSets([]);
    setLastWorkoutSummary(null);
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

  const waterGoal = (weight * 35) / 1000;
  const proteinGoal = Math.floor(weight * 2);
  const isHydrationAlert = (Date.now() - lastWaterTime) > 7200000; // 2 hours in ms
  const remainingProtein = Math.max(0, proteinGoal - protein);

  // UI Components
  const NavButton = ({ id, icon: Icon, label }) => {
    return (
      <button
        onClick={() => {
          if (id === 'sidebar') {
            haptics.light();
            setSidebarOpen(true);
            return;
          }
          if (id) {
            haptics.light();
            setActiveTab(String(id));
          }
        }}
        className={`relative flex flex-col items-center justify-center py-2 px-2.5 rounded-2xl transition-all duration-300 group ${
          activeTab === id ? 'scale-105' : 'hover:scale-105'
        }`}
      >
        {/* Active background pill */}
        {activeTab === id && (
          <motion.div
            layoutId="nav-active-bg"
            className="absolute inset-0 rounded-2xl bg-yellow-400/8 border border-yellow-400/12"
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        )}
        <div className="relative mb-0.5">
          <Icon
            strokeWidth={activeTab === id ? 2.5 : 1.8}
            size={21}
            className={`transition-all duration-300 ${
              activeTab === id
                ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(253,224,71,0.6)]'
                : 'text-neutral-500 group-hover:text-neutral-300'
            }`}
          />
        </div>
        <span className={`text-[8px] uppercase font-black tracking-[0.14em] transition-colors duration-300 ${
          activeTab === id ? 'text-yellow-400' : 'text-neutral-600 group-hover:text-neutral-400'
        }`}>{label}</span>
        {activeTab === id && (
          <motion.div
            layoutId="nav-dot"
            className="h-[3px] w-3 bg-yellow-400 rounded-full mt-1 shadow-[0_0_6px_rgba(253,224,71,0.8)]"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </button>
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
      className={`h-screen min-h-[100dvh] overflow-hidden flex flex-col bg-black text-slate-100 font-sans transition-all duration-700 ${nightMode ? 'sepia-[0.3] brightness-[0.8]' : ''}`}
    >
      
      {/* Background Decor */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 0.5, duration: 2 }}
        className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0"
      >
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
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

      {/* Global Unified Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
        className="shrink-0 z-40 bg-black/90 backdrop-blur-2xl border-b border-yellow-400/8 pt-[max(12px,env(safe-area-inset-top))] pb-3 px-4 shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      >
        {/* Linha neon no topo do header */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent pointer-events-none" />
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-900 border-2 border-yellow-400/40 overflow-hidden relative shrink-0 shadow-[0_0_20px_rgba(253,224,71,0.25),inset_0_0_10px_rgba(253,224,71,0.05)]">
              <img src="/images/zyron-logo.png" alt="ZYRON" className="w-full h-full object-contain mix-blend-screen" />
            </div>
            <div>
              <span className="text-[8px] font-black text-yellow-400/60 uppercase tracking-[0.28em] leading-none block mb-0.5">Operativo</span>
              <h1 className="text-sm font-black text-white uppercase tracking-tighter italic leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]">
                {mergedUser.name.toUpperCase()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => activeNotification && markAsRead()}
              className="p-2 bg-neutral-900/80 rounded-xl border border-white/6 text-neutral-400 relative transition-all active:scale-90 hover:border-yellow-400/20 hover:text-yellow-400"
            >
              <Bell size={18} />
              {activeNotification && (
                <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-neutral-900 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-neutral-900/80 rounded-xl border border-white/6 text-neutral-400 transition-all active:scale-90 hover:border-yellow-400/20 hover:text-yellow-400"
            >
              <MoreVertical size={18} />
            </button>
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
        className="flex-1 w-full px-4 pt-2.5 pb-28 relative z-10 overflow-y-auto"
      >
        <AnimatePresence mode="wait">
          
          {/* PAINEL SCREEN */}
          {activeTab === 'painel' && (
            <TabPainel 
              user={mergedUser} today={today} currentWorkout={currentWorkout} 
              startSession={startSession} water={water} waterGoal={waterGoal} 
              isHydrationAlert={isHydrationAlert} handleWaterDrink={handleWaterDrink} 
              protein={protein} proteinGoal={proteinGoal} setProtein={setProtein} 
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
              />
            </MusclePumpWrapper>
          )}

          {/* PROGRESS SCREEN */}
          {activeTab === 'progress' && (
            <TabEvolucao 
              user={mergedUser}
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
              user={mergedUser} today={today} voiceTimerActive={voiceTimerActive} 
              toggleVoiceTimer={toggleVoiceTimer} formatPlankTime={formatPlankTime} 
              plankTime={plankTime} onLogout={onLogout} 
            />
          )}

          {/* COACH IA SCREEN */}
          {activeTab === 'coach' && (
            <TabCoach
              user={mergedUser}
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

      {/* FAB Backdrop Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-md z-40"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Quick Actions Menu */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed bottom-0 left-0 w-full bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-45 px-6 pt-4 pb-36"
          >
            <div className="flex justify-center mb-6">
              <div className="w-12 h-1.5 bg-neutral-800 rounded-full"></div>
            </div>
            <h3 className="font-black text-xs mb-4 tracking-widest uppercase text-center text-neutral-500">
              Ação Rápida
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {QUICK_ACTIONS.map((item, idx) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  onClick={(e) => {
                    if (e && e.preventDefault) e.preventDefault();
                    if (e && e.stopPropagation) e.stopPropagation();
                    setFabOpen(false);
                    if (window.navigator?.vibrate) window.navigator.vibrate(30);

                    const actionId = item.id;
                    if (actionId === 'session') {
                      startSession(Number(today));
                    } else if (actionId === 'water') {
                      handleWaterDrink(0.25);
                    } else if (actionId === 'protein') {
                      setProtein(prev => prev + 30);
                    } else if (actionId === 'photo') {
                      setActiveTab('progress');
                    } else if (actionId === 'weight') {
                      setActiveTab('perfil');
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-3 p-4 bg-[linear-gradient(180deg,rgba(24,24,20,0.9)_0%,rgba(12,12,8,0.95)_100%)] hover:bg-neutral-800/80 border border-white/6 hover:border-yellow-400/35 rounded-[20px] transition-all duration-200 group active:scale-90 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(253,224,71,0.12)]"
                >
                  <div className="h-12 w-12 rounded-[16px] bg-neutral-900 border border-white/6 flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.5)] group-hover:shadow-[0_0_24px_rgba(253,224,71,0.25)] group-hover:border-yellow-400/20 transition-all duration-200">
                    <item.icon size={22} className="text-yellow-400 group-hover:drop-shadow-[0_0_6px_rgba(253,224,71,0.8)] transition-all" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 group-hover:text-white transition-colors">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation moved below Player in App.jsx or kept here if it's tab-specific */}

      {/* FIXED NAVIGATION */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 20 }}
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[inherit] z-50 flex items-center justify-between border-t border-white/7 bg-[linear-gradient(180deg,rgba(16,16,18,0.97)_0%,rgba(6,6,8,0.995)_100%)] px-6 pt-3 pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl"
      >
        {/* Linha neon no topo da nav — mais intensa no centro */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/35 to-transparent pointer-events-none" />
        <div className="absolute top-0 left-[35%] w-[30%] h-[1px] bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent pointer-events-none" />

        <NavButton id="painel" icon={LayoutDashboard} label="Painel" />
        <NavButton id="workout" icon={Dumbbell} label="Treino" />

        {/* FAB central com pulse dinâmico */}
        <div className="relative -mt-[68px] flex items-center justify-center">
          {/* Pulse rings */}
          {!fabOpen && (
            <>
              <div className="absolute h-[68px] w-[68px] rounded-full bg-yellow-400/18 animate-ping" style={{ animationDuration: '2.2s' }} />
              <div className="absolute h-[82px] w-[82px] rounded-full bg-yellow-400/7 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.5s' }} />
            </>
          )}
          <button
            onClick={() => {
              if (window.navigator?.vibrate) window.navigator.vibrate(fabOpen ? 20 : 40);
              setFabOpen(!fabOpen);
            }}
            className={`relative h-[62px] w-[62px] rounded-full border-[5px] border-neutral-950 shadow-2xl flex items-center justify-center transition-all duration-300 group overflow-hidden ${
              fabOpen
                ? 'bg-neutral-800 scale-95'
                : 'bg-yellow-400 shadow-[0_0_44px_rgba(253,224,71,0.6),0_8px_24px_rgba(0,0,0,0.5)] hover:scale-110 hover:shadow-[0_0_64px_rgba(253,224,71,0.75)] active:scale-90'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-white/5 to-transparent pointer-events-none" />
            {/* Bottom shadow for depth */}
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            <div
              className={`relative z-10 pointer-events-none flex items-center justify-center transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`}
            >
              <span className={`text-[28px] font-black transition-colors duration-300 leading-none ${fabOpen ? 'text-yellow-400' : 'text-neutral-950'}`} style={{ marginTop: '-3px' }}>+</span>
            </div>
          </button>
        </div>

        <NavButton id="coach" icon={MessageSquare} label="Coach" />
        <NavButton id="sidebar" icon={MoreHorizontal} label="Menu" />
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-60"
            />
            {/* Sidebar Container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 w-80 max-w-[85vw] h-full bg-neutral-900 border-l border-white/10 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-70 flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center font-black text-xl text-neutral-950 uppercase shadow-[0_0_15px_rgba(253,224,71,0.3)]">
                    {mergedUser.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">{mergedUser.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[9px] font-bold text-neutral-400 tracking-widest uppercase">Online</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-2 mb-auto flex-1">
                <button onClick={() => { setSidebarOpen(false); setActiveTab('progress'); }} className="w-full flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-white/5 hover:bg-neutral-800 hover:border-yellow-400/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <Trophy size={18} className="text-yellow-400" />
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Evolução & Fotos</span>
                  </div>
                  <ChevronRight size={16} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                </button>

                <button onClick={() => { setSidebarOpen(false); setActiveTab('perfil'); }} className="w-full flex items-center justify-between p-4 bg-neutral-800/50 rounded-2xl border border-white/5 hover:bg-neutral-800 hover:border-yellow-400/30 transition-all group">
                  <div className="flex items-center gap-3">
                    <Target size={18} className="text-yellow-400" />
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Perfil & Voz</span>
                  </div>
                  <ChevronRight size={16} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                </button>

                <button onClick={() => { setNightMode(!nightMode); if(window.navigator?.vibrate) window.navigator.vibrate(20); }} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all group ${nightMode ? 'bg-amber-500/10 border-amber-500/30' : 'bg-neutral-800/50 border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    {nightMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-neutral-400" />}
                    <span className={`text-xs font-bold uppercase tracking-wider ${nightMode ? 'text-amber-500' : 'text-neutral-300'}`}>Modo Noturno</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative transition-colors ${nightMode ? 'bg-amber-500' : 'bg-neutral-700'}`}>
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${nightMode ? 'left-6' : 'left-1'}`}></div>
                  </div>
                </button>

                {isAnyAdmin && (
                  <button onClick={() => { setSidebarOpen(false); if(onOpenAdmin) onOpenAdmin(); }} className="w-full flex items-center justify-between p-4 bg-red-950/30 rounded-2xl border border-red-500/20 hover:bg-red-950/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={18} className="text-red-500" />
                      <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Painel Master Admin</span>
                    </div>
                  </button>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 shrink-0">
                <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-4 bg-neutral-800 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all">
                  <LogOut size={16} />
                  <span className="text-xs font-black uppercase tracking-widest">Encerrar Sessão</span>
                </button>
                <div className="text-center mt-6">
                  <span className="text-[9px] font-bold text-neutral-600 tracking-widest uppercase">ZYRON v4.0.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
