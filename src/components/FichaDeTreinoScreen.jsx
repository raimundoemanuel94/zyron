import React, { useState, useEffect, useRef } from 'react';
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
  Calendar, // Added from original first import
  Play, // Added from original first import
  CheckCircle2, // Added from original first import
  Timer as TimerIcon, // Added from original first import
  Plus, // Added from original first import
  Minus, // Added from original first import
  ArrowBigUp, // Added from original first import
  ShieldAlert, // Added from original first import
  Moon, // Added from original first import
  Sun, // Added from original first import
  Coffee, // Added from original first import
  CreditCard, // Added from original first import
  Crown, // Added from original first import
  Flame, // Added from original first import
  FileText, // Added from original first import
  Download, // Added from original first import
  QrCode // Added from original first import
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { workoutData } from '../data/workoutData';
import { Anatomy3D } from './Anatomy3D';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import WorkoutCard from './WorkoutCard';
import { supabase } from '../lib/supabase';

import TabPainel from './tabs/TabPainel';
import TabTreino from './tabs/TabTreino';
import TabEvolucao from './tabs/TabEvolucao';
import TabPerfil from './tabs/TabPerfil';
import TabCoach from './tabs/TabCoach';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

// YouTube Direct Video IDs for each exercise
// Replace these with your own preferred tutorial video IDs
export const EXERCISE_VIDEOS = {
  'p1': '50RSzhMG5Hc', // Supino Reto Barra
  'p2': 'Fa-X2ByLHaY', // Supino Inclinado Halter
  'p_cm': 'nuTuKjcQRHg', // Crucifixo Maquina (using crossover as proxy)
  'p3': 'nuTuKjcQRHg', // Cross Over
  't1': '5PPKThQuR3M', // Triceps Pulley
  't2': 'VnFopAIGO7E', // Triceps Corda
  't3': '40Cx-IfJhA0', // Triceps Testa
  't_mb': '2OymsPc-9Tw', // Mergulho Banco (using frances as proxy)
  'c1': '3qj46qsOgfI', // Puxada Aberta
  'c_rc': 'fEA4O71kFr4', // Remada Curvada (using baixa as proxy)
  'c_rm': 'mjFIZX68F_8', // Remada Maquina (using serrote as proxy)
  'c_pd': 'mjFIZX68F_8', // Pulldown
  'b1': 'iA4RH6zDin0', // Rosca Direta Barra W
  'b_ra': '8PN6YfFC6Q4', // Rosca Alternada (using martelo as proxy)
  'b3': 'Qm4NdQttdi8', // Rosca Concentrada
  'l1': '3vTRFnzCMaA', // Agachamento Livre
  'l2': 'DQ4-HXFlKXI', // Leg Press 45
  'l3': 'I_uBK4DDflU', // Extensora
  'l4': 'PcTCUdxywHo', // Mesa Flexora
  'l_st': 'PcTCUdxywHo', // Stiff
  'l_ep': 'PcTCUdxywHo', // Elevacao Pelvica
  'ca1': 'ZQdqLXtNpMQ',// Gemeos em Pe
  'ca_s': 'ZQdqLXtNpMQ', // Panturrilha Sentado
  's1': 'DFXtzdXN_iY', // Desenvolvimento Halter
  's2': 'yURmeIEl1Fg', // Elevacao Lateral
  's3': 'F6toacmeUlA', // Elevacao Frontal
  's4': 'C9Q9so5Fqws', // Crucifixo Inverso
  's_et': 'C9Q9so5Fqws', // Encolhimento
  'b_rw': 'iA4RH6zDin0', // Rosca Barra W
  'b2': '8PN6YfFC6Q4', // Rosca Martelo
  'b_bi': 'Qm4NdQttdi8', // Rosca Banco Inclinado
};

const QUICK_ACTIONS = [
  { id: 'session', icon: Zap, label: 'Iniciar Sessão' },
  { id: 'water', icon: Droplets, label: 'Água +250ml' },
  { id: 'protein', icon: Beef, label: 'Proteína +30g' },
  { id: 'coach', icon: MessageSquare, label: 'Coach IA' },
  { id: 'photo', icon: Camera, label: 'Foto Evolução' },
  { id: 'weight', icon: Scale, label: 'Registrar Peso' },
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
  const [restTimer, setRestTimer] = useState(0);
  const [weight, setWeight] = useState(80);
  const [lastWaterTime, setLastWaterTime] = useState(Date.now()); // Para alerta de 2 horas
  const [nightMode, setNightMode] = useState(false); // Low blue light filter
  const [showPR, setShowPR] = useState(null); // Animation trigger for PR
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(null);
  const [availableWorkouts, setAvailableWorkouts] = useState(workoutData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);
  const appConstraintsRef = useRef(null);

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
        // NUCLEAR CLEANING: Somente primitivos, impede circularidade
        const cleanSession = {
          date: String(todayStr),
          isTraining: Boolean(isTraining),
          selectedWorkoutKey: (typeof selectedWorkoutKey === 'number' || typeof selectedWorkoutKey === 'string') ? selectedWorkoutKey : null,
          completedExercises: Array.isArray(completedExercises) ? completedExercises.filter(i => typeof i === 'string') : [],
          sessionTime: Number(sessionTime) || 0
        };
        
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
      timerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
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

  const handleExerciseComplete = (id, isFinal = true) => {
    if (isFinal) {
      if (!completedExercises.includes(id)) {
        setCompletedExercises([...completedExercises, id]);
      }
    }
    setRestTimer(60); 
  };

  const handleFinishSession = async () => {
    if (user?.id && isTraining) {
       // Log workout in Supabase immediately to prevent data loss
       try {
         await supabase.from('workout_logs').insert([{
           user_id: user.id,
           workout_key: selectedWorkoutKey,
           duration_seconds: sessionTime
         }]);
       } catch (err) {
         console.error("Erro ao salvar log de treino no Supabase:", err);
       }
    }
    setIsTraining(false);
    localStorage.removeItem('gym_active_session');
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
    const emojiMap = {
      painel: '📊',
      workout: '💪',
      coach: '💬',
      perfil: '👤'
    };
    return (
      <button
        onClick={() => {
          if (id) setActiveTab(String(id));
        }}
        className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 ${
          activeTab === id ? 'text-yellow-300 scale-110' : 'text-neutral-500 hover:text-slate-300'
        }`}
      >
        <span className="text-xl mb-1">{emojiMap[id] || '📍'}</span>
        <span className="text-[10px] uppercase font-black tracking-tighter">{label}</span>
        {activeTab === id && (
          <motion.div layoutId="nav-dot" className="h-1 w-1 bg-yellow-400 rounded-full mt-1" />
        )}
      </button>
    );
  };

  const GlassCard = ({ children, className = "", gradient = false }) => (
    <div className={`relative overflow-hidden bg-neutral-900/50 backdrop-blur-md border border-neutral-800 rounded-2xl p-6 shadow-[0_0_20px_rgba(37,99,235,0.05)] hover:border-yellow-500/30 transition-all duration-500 ${className}`}>
      {gradient && (
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-indigo-500 to-yellow-500 animate-gradient-x"></div>
      )}
      {children}
    </div>
  );

  return (
    <div ref={appConstraintsRef} className={`min-h-screen bg-black text-slate-100 font-sans pb-32 transition-all duration-700 ${nightMode ? 'sepia-[0.3] brightness-[0.8]' : ''}`}>
      
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-yellow-500 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

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

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-neutral-800 border-2 border-yellow-500 overflow-hidden relative shrink-0">
              <img src="/images/zyron-logo.png" alt="ZYRON" className="w-full h-full object-contain mix-blend-screen" />
            </div>
            <div>
              <h1 className="text-base font-black italic tracking-tighter uppercase leading-none text-slate-100">
                {user?.name || 'ALUNO'}
              </h1>
              <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-0.5">ZYRON</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setNightMode(!nightMode)}
              className={`p-2 rounded-xl transition-all ${nightMode ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-neutral-900 text-neutral-500 hover:text-white'}`}
              title="Modo Noturno (Low Blue Light)"
            >
              {nightMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user?.role === 'ADMIN' && (
              <button 
                onClick={onOpenAdmin}
                className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 group flex items-center gap-2"
                title="God Mode"
              >
                <ShieldAlert size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Admin</span>
              </button>
            )}

            <button 
              onClick={onLogout}
              className="p-2 rounded-xl bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-all border border-white/5 group"
              title="Sair do App"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {isTraining && (
          <div className="max-w-xl mx-auto mt-3">
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
      </header>

      <main className="max-w-xl mx-auto p-6 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* PAINEL SCREEN */}
          {activeTab === 'painel' && (
            <TabPainel 
              user={user} today={today} currentWorkout={currentWorkout} 
              startSession={startSession} water={water} waterGoal={waterGoal} 
              isHydrationAlert={isHydrationAlert} handleWaterDrink={handleWaterDrink} 
              protein={protein} proteinGoal={proteinGoal} setProtein={setProtein} 
            />
          )}

          {/* WORKOUT SCREEN */}
          {activeTab === 'workout' && (
            <TabTreino 
              today={today} workoutData={availableWorkouts} startSession={startSession} 
              setVideoModal={setVideoModal} isTraining={isTraining} setIsTraining={handleFinishSession}
              currentWorkout={currentWorkout} completedExercises={completedExercises} 
              restTimer={restTimer} handleExerciseComplete={handleExerciseComplete} 
              loads={loads} updateLoad={updateLoad} prHistory={prHistory} showPR={showPR} 
            />
          )}

          {/* PROGRESS SCREEN */}
          {activeTab === 'progress' && (
            <TabEvolucao 
              currentWorkout={currentWorkout} prHistory={prHistory} 
              weight={weight} setWeight={setWeight} workoutData={availableWorkouts}
            />
          )}

          {/* PERFIL SCREEN */}
          {activeTab === 'perfil' && (
            <TabPerfil 
              user={user} today={today} voiceTimerActive={voiceTimerActive} 
              toggleVoiceTimer={toggleVoiceTimer} formatPlankTime={formatPlankTime} 
              plankTime={plankTime} onLogout={onLogout} 
            />
          )}

          {/* COACH IA SCREEN */}
          {activeTab === 'coach' && (
            <TabCoach
              user={user}
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
      </main>

      {/* FAB Backdrop Overlay */}
      <AnimatePresence>
        {fabOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            onClick={() => setFabOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* FAB Quick Actions Menu */}
      <AnimatePresence>
        {fabOpen && (
          <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            {QUICK_ACTIONS.map((item, index) => {
              const totalItems = QUICK_ACTIONS.length;
              const spreadAngle = 160;
              const startAngle = -90 - spreadAngle / 2;
              const angleStep = spreadAngle / (totalItems - 1);
              const angle = (startAngle + index * angleStep) * (Math.PI / 180);
              const radius = 130;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  animate={{ opacity: 1, x, y, scale: 1 }}
                  exit={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22, delay: index * 0.04 }}
                  className="absolute pointer-events-auto"
                  style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%)` }}
                >
                  <button
                    onClick={(e) => {
                      // CRITICAL FIX: explicitly prevent the Event object from passing through
                      if (e && e.preventDefault) e.preventDefault();
                      if (e && e.stopPropagation) e.stopPropagation();
                      setFabOpen(false);
                      
                      const actionId = item.id;
                      if (actionId === 'session') {
                        startSession(Number(today)); 
                      } else if (actionId === 'water') {
                        handleWaterDrink(0.25);
                      } else if (actionId === 'protein') {
                        setProtein(prev => prev + 30);
                      } else if (actionId === 'coach') {
                        setActiveTab('coach');
                      } else if (actionId === 'photo') {
                        setActiveTab('progress');
                      } else if (actionId === 'weight') {
                        setActiveTab('perfil');
                      }
                    }}
                    className="group flex flex-col items-center gap-1.5 focus:outline-none"
                  >
                    <div className="h-12 w-12 rounded-full bg-neutral-900 flex items-center justify-center shadow-[0_0_15px_rgba(253,224,71,0.2)] border border-yellow-400/30 group-hover:scale-110 group-active:scale-90 group-hover:border-yellow-400 group-hover:shadow-[0_0_25px_rgba(253,224,71,0.5)] transition-all duration-300">
                      <item.icon size={22} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/90 whitespace-nowrap bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full">
                      {item.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Navigation moved below Player in App.jsx or kept here if it's tab-specific */}

      {/* FIXED NAVIGATION */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-lg bg-neutral-900/60 backdrop-blur-3xl border border-white/10 rounded-full p-3 flex justify-between items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50">
        <NavButton id="painel" icon={LayoutDashboard} label="Painel" />
        <NavButton id="workout" icon={Dumbbell} label="Treino" />
        
        <button 
          onClick={() => setFabOpen(!fabOpen)}
          className={`relative h-16 w-16 rounded-full -mt-16 border-4 border-neutral-950 shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden ${
            fabOpen 
              ? 'bg-red-500 shadow-red-500/40' 
              : 'bg-yellow-400 shadow-yellow-400/40'
          }`}
        >
          <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent"></div>
          <div
            className={`relative z-10 pointer-events-none flex items-center justify-center transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`}
          >
            {/* REMOVIDO TODO SVG E MOTION PARA ISOLAR CRASH CIRCULAR */}
            <span className="text-3xl font-black text-neutral-950" style={{ marginTop: '-4px' }}>+</span>
          </div>
        </button>

        <NavButton id="progress" icon={Trophy} label="Evolução" />
        <NavButton id="perfil" icon={Target} label="Perfil" />
      </nav>

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
    </div>
  );
}
