import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  Droplets, 
  Flame, 
  CheckCircle2, 
  Bell, 
  X, 
  Play, 
  Clock, 
  Heart, 
  Moon, 
  Menu 
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  XAxis, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { supabase } from '../../lib/supabase';
import haptics from '../../utils/haptics';

const GlassCard = ({ children, className = '' }) => (
  <div className={`bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl ${className}`}>
    {children}
  </div>
);

export default function TabPainel({
  user,
  today,
  currentWorkout,
  startSession,
  water,
  waterGoal,
  isHydrationAlert,
  handleWaterDrink,
  protein,
  proteinGoal,
  setProtein
}) {
  const [trainedDays, setTrainedDays] = useState([]);
  const remainingProtein = Math.max(0, proteinGoal - protein);

  useEffect(() => {
    if (user?.id) {
      fetchWeekStreak();
    }
  }, [user]);

  // Fetch real workout streak from this week
  const fetchWeekStreak = async () => {
    try {
      // Get start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('created_at')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true });
      
      if (error) {
        // Silently ignore schema/permission errors to prevent console pollution
        if (error.code !== '42P01' && error.code !== 'PGRST116') {
             // console.error("Ignored streak fetch error:", error.message);
        }
        return;
      }

      if (data && data.length > 0) {
        const days = [...new Set(data.map(log => new Date(log.created_at).getDay()))];
        setTrainedDays(days);
      }
    } catch (e) {
       // Silenced to avoid console spam if table doesn't exist
    }
  };


  
  // Saudação dinâmica baseada na hora e frase motivacional:
  const hour = new Date().getHours();
  // Mock data para bio-métricas (em um app real viria do Apple Health/Google Fit)
  const bioMetrics = {
    hrv: 68,
    sleep: 7.2,
    rhr: 52
  };

  // Mock data para telemetria (tempo de treino nos últimos 7 dias)
  const chartData = [
    { day: 'Seg', time: 45 },
    { day: 'Ter', time: 60 },
    { day: 'Qua', time: 0 },
    { day: 'Qui', time: 50 },
    { day: 'Sex', time: 75 },
    { day: 'Sáb', time: 90 },
    { day: 'Dom', time: 40 }
  ];

  return (
      <motion.div
        key="painel"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.05 }}
        className="flex flex-col gap-4 h-full max-h-[calc(100vh-180px)] overflow-hidden"
      >
        {/* SYSTEM STATUS BANNER */}
      <div className="flex justify-between items-center bg-black border border-yellow-500/20 py-2.5 px-4 rounded-2xl shadow-inner relative overflow-hidden group">
        <div className="absolute inset-0 bg-yellow-500/5 group-hover:bg-yellow-500/10 transition-colors"></div>
        <div className="relative z-10">
          <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.3em] flex items-center gap-2">
            ZYRON<span className="text-yellow-400">.</span> <span className="text-neutral-600">ESTADO DO SISTEMA:</span> <span className="text-emerald-400">ÓTIMO</span>
          </h3>
        </div>
        <div className="relative z-10 flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></div>
          <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Ativo</span>
        </div>
      </div>

      {/* METRICS ROW (2 COLS) */}
      <div className="grid grid-cols-2 gap-4 h-24">
        {/* Calories Card */}
        <div className="bg-neutral-900/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 opacity-60">
            <Flame size={12} className="text-orange-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">Calorias</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black italic">1.240</span>
            <span className="text-[8px] text-neutral-500 font-bold">/ 2500</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[50%] shadow-[0_0_8px_rgba(249,115,22,0.5)]"></div>
          </div>
        </div>
        {/* Hydration Card */}
        <div className="bg-neutral-900/60 p-4 rounded-3xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 opacity-60">
            <Droplets size={12} className="text-blue-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">Hidratação</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black italic">{water.toFixed(1)}</span>
            <span className="text-[8px] text-neutral-500 font-bold">/ {waterGoal.toFixed(1)}L</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]" 
              style={{ width: `${Math.min(100, (water / waterGoal) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* PROTOCOLO ATIVO CARD */}
      <div className="bg-neutral-900/60 p-4 rounded-3xl border border-white/5 flex items-center justify-between group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-lg group-hover:border-yellow-500/30 transition-colors">
            <Zap size={24} className="text-yellow-400" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-0.5">Protocolo Ativo</h4>
            <h3 className="text-sm font-black text-white uppercase italic tracking-tighter">
              {currentWorkout?.title || 'Hipertrofia Tática'}
            </h3>
            <div className="flex gap-4 mt-1">
              <div className="text-[8px] font-bold text-neutral-500 uppercase">CARGA MÉDIA: <span className="text-white ml-1">85kg</span></div>
              <div className="text-[8px] font-bold text-neutral-500 uppercase">REPS TOTAIS: <span className="text-white ml-1">120</span></div>
            </div>
          </div>
        </div>
        <button 
          onClick={() => startSession(today)}
          className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(253,224,71,0.3)] hover:scale-110 active:scale-95 transition-all"
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>

      {/* TELEMETRIA (CHART) */}
      <div className="bg-neutral-900/60 p-5 rounded-3xl border border-white/5 flex flex-col flex-1 min-h-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-0.5">Telemetria</h4>
            <h3 className="text-xs font-black text-white uppercase italic tracking-widest">Tempo de Treino</h3>
          </div>
          <span className="text-[8px] font-black text-yellow-400 px-2 py-1 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">7 DIAS</span>
        </div>
        
        <div className="flex-1 w-full -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#525252', fontSize: 8, fontWeight: 900 }} 
                dy={10}
              />
              <YAxis hide domain={[0, 'auto']} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff1a', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#FDE047', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="time" 
                stroke="#FDE047" 
                strokeWidth={3} 
                dot={{ fill: '#FDE047', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: '#000', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BIO-DADOS FOOTER ROW */}
      <div className="grid grid-cols-3 gap-3 h-16">
        <div className="bg-neutral-950/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest mb-1">VFC</span>
          <span className="text-xs font-black italic text-white">{bioMetrics.hrv} <span className="text-[8px] text-neutral-600 not-italic">ms</span></span>
        </div>
        <div className="bg-neutral-950/40 rounded-2xl border border-yellow-500/20 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-500/5"></div>
          <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest mb-1 relative z-10">Dormir</span>
          <span className="text-xs font-black italic text-white relative z-10">{bioMetrics.sleep} <span className="text-[8px] text-neutral-600 not-italic">h</span></span>
        </div>
        <div className="bg-neutral-950/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
          <span className="text-[7px] font-black text-neutral-500 uppercase tracking-widest mb-1">RHR</span>
          <span className="text-xs font-black italic text-white">{bioMetrics.rhr} <span className="text-[8px] text-neutral-600 not-italic">bpm</span></span>
        </div>
      </div>
    </motion.div>
  );
}
