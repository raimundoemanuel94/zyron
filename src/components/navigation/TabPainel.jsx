import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  Flame,
  Play,
  Zap,
  Activity,
  Heart,
  Moon,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
  XAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { supabase } from '../../lib/supabase';

// ── Count-up hook ──────────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    const start = () => {
      startRef.current = performance.now();
      const animate = (now) => {
        const elapsed = now - startRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(animate);
      };
      raf.current = requestAnimationFrame(animate);
    };
    start();
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-neutral-950 border border-yellow-400/20 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-neutral-500 mb-1">{label}</p>
      <p className="text-sm font-black text-yellow-400">{payload[0].value}<span className="text-[10px] text-neutral-500 ml-1">min</span></p>
    </div>
  );
};

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
  const [chartVisible, setChartVisible] = useState(false);
  const chartRef = useRef(null);
  const remainingProtein = Math.max(0, proteinGoal - protein);

  // Count-up animations
  const animatedCals = useCountUp(1240);
  const animatedWater = water;

  useEffect(() => {
    if (user?.id) fetchWeekStreak();
  }, [user]);

  // Intersection Observer para animar o gráfico ao entrar na tela
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setChartVisible(true); },
      { threshold: 0.3 }
    );
    if (chartRef.current) observer.observe(chartRef.current);
    return () => observer.disconnect();
  }, []);

  const fetchWeekStreak = async () => {
    try {
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

      if (error) return;

      if (data && data.length > 0) {
        const days = [...new Set(data.map(log => new Date(log.created_at).getDay()))];
        setTrainedDays(days);
      }
    } catch (e) { /* silenced */ }
  };

  const bioMetrics = { hrv: 68, sleep: 7.2, rhr: 52 };

  const chartData = [
    { day: 'Seg', time: 45 },
    { day: 'Ter', time: 60 },
    { day: 'Qua', time: 0 },
    { day: 'Qui', time: 50 },
    { day: 'Sex', time: 75 },
    { day: 'Sáb', time: 90 },
    { day: 'Dom', time: 40 }
  ];

  const waterPercent = waterGoal > 0 ? Math.min(100, (water / waterGoal) * 100) : 0;
  const caloriesValue = 1240;
  const caloriesGoal = 2500;
  const caloriesPercent = Math.min(100, (caloriesValue / caloriesGoal) * 100);

  // Chart stats
  const chartMax = Math.max(...chartData.map(d => d.time));
  const chartAvg = Math.round(chartData.filter(d => d.time > 0).reduce((a, b) => a + b.time, 0) / chartData.filter(d => d.time > 0).length);

  // ── Design tokens ────────────────────────────────────────────────────────────
  const surfaceCard =
    'relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(145deg,rgba(26,26,28,0.95)_0%,rgba(10,10,10,0.99)_100%)] shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300';

  const stagger = {
    container: { animate: { transition: { staggerChildren: 0.08 } } },
    item: {
      initial: { opacity: 0, y: 18 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
    }
  };

  return (
    <motion.div
      key="painel"
      variants={stagger.container}
      initial="initial"
      animate="animate"
      exit={{ opacity: 0, scale: 1.01 }}
      className="flex flex-col gap-3 pb-4"
    >

      {/* ─── HERO: Status do Sistema ──────────────────────────────────────── */}
      <motion.div
        variants={stagger.item}
        className="relative overflow-hidden rounded-[26px] border border-yellow-400/28 bg-[linear-gradient(135deg,rgba(16,15,9,1)_0%,rgba(7,7,5,1)_100%)] px-4 py-2.5 shadow-[0_0_0_1px_rgba(253,224,71,0.06),0_8px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]"
      >
        {/* Glow radial de fundo */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_0%_50%,rgba(253,224,71,0.14),transparent)]" />
        {/* Linha neon dupla no topo */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400/70 to-transparent" />
        <div className="absolute top-[1.5px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
        {/* Grid de pontos decorativo */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(253,224,71,0.5) 1px, transparent 1px)', backgroundSize: '12px 12px' }}
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.36em] text-neutral-600 mb-1.5">
              ZYRON <span className="text-yellow-500/50 mx-0.5">◆</span> STATUS DO SISTEMA
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-black italic text-white uppercase tracking-tight leading-tight">
                {user?.name || 'Atleta'}
              </span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                Ótimo
              </span>
            </div>
            <p className="mt-1 text-[8px] font-bold text-neutral-600 uppercase tracking-[0.18em]">
              Sistema operacional · Fase de hipertrofia
            </p>
          </div>

          {/* Badge pulsante */}
          <div className="relative shrink-0 flex items-center gap-2 rounded-full border border-yellow-400/35 bg-yellow-400/8 px-3 py-1.5 shadow-[0_0_28px_rgba(253,224,71,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]">
            <span className="absolute -inset-px rounded-full animate-ping bg-yellow-400/8 pointer-events-none" />
            <span className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_12px_rgba(253,224,71,1),0_0_24px_rgba(253,224,71,0.4)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-yellow-400">Ativo</span>
          </div>
        </div>
      </motion.div>

      {/* ─── METRICS CARDS ───────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-2 gap-4">

        {/* Calorias */}
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`${surfaceCard} min-h-[92px] p-3 group cursor-pointer`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_50%)]" />
          <div className="absolute top-0 left-0 w-2/3 h-[1.5px] bg-gradient-to-r from-orange-500/70 via-orange-500/30 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-xl bg-orange-500/12 border border-orange-500/15">
                  <Flame size={10} className="text-orange-400" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.26em] text-neutral-500">Calorias</span>
              </div>
              <span className="text-[8px] font-black text-orange-400/60 tabular-nums">{Math.round(caloriesPercent)}%</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[1.85rem] leading-none font-black italic text-white tracking-tight">
                {animatedCals.toLocaleString('pt-BR')}
              </span>
              <span className="pb-1 text-[9px] font-bold text-neutral-600">/{caloriesGoal}</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${caloriesPercent}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
                  className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 shadow-[0_0_16px_rgba(249,115,22,0.75)]"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Hidratação */}
        <motion.div
          whileHover={{ scale: 1.03, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`${surfaceCard} min-h-[96px] p-3 group cursor-pointer`}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_50%)]" />
          <div className={`absolute top-0 left-0 w-2/3 h-[1.5px] bg-gradient-to-r ${isHydrationAlert ? 'from-red-500/70 via-red-500/30' : 'from-blue-500/70 via-blue-500/30'} to-transparent`} />
          <div className="relative z-10 flex h-full flex-col justify-between gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className={`p-1.5 rounded-xl border ${isHydrationAlert ? 'bg-red-500/12 border-red-500/15' : 'bg-blue-500/12 border-blue-500/15'}`}>
                  <Droplets size={10} className={isHydrationAlert ? 'text-red-400' : 'text-blue-400'} />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.26em] text-neutral-500">Hidratação</span>
              </div>
              <span className={`text-[8px] font-black tabular-nums ${isHydrationAlert ? 'text-red-400/60' : 'text-blue-400/60'}`}>{Math.round(waterPercent)}%</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-[1.85rem] leading-none font-black italic text-white tracking-tight">
                {water.toFixed(1)}
              </span>
              <span className="pb-1 text-[9px] font-bold text-neutral-600">/{waterGoal.toFixed(1)}L</span>
            </div>
            <div className="space-y-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${waterPercent}%` }}
                  transition={{ duration: 1.4, ease: 'easeOut', delay: 0.4 }}
                  className={`h-full rounded-full shadow-[0_0_16px_rgba(59,130,246,0.75)] ${isHydrationAlert ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_16px_rgba(248,113,113,0.75)]' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ─── PROTOCOLO ATIVO (card principal) ───────────────────────────── */}
      <motion.div
        variants={stagger.item}
        whileHover={{ scale: 1.015, y: -2 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[28px] border border-yellow-400/28 bg-[linear-gradient(135deg,rgba(22,20,10,1)_0%,rgba(9,9,5,1)_100%)] p-3 shadow-[0_0_50px_rgba(253,224,71,0.09),0_12px_40px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.05)] cursor-pointer"
      >
        {/* Ambient glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_70%_at_100%_50%,rgba(253,224,71,0.11),transparent)]" />
        {/* Borda neon top dupla */}
        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-yellow-400/85 to-transparent" />
        <div className="absolute top-[1.5px] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/25 to-transparent" />
        {/* Corner glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-yellow-400/4 rounded-full blur-2xl" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            {/* Ícone container */}
            <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[16px] border border-yellow-500/25 bg-[linear-gradient(145deg,rgba(253,224,71,0.1),rgba(253,224,71,0.04))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_24px_rgba(253,224,71,0.1)]">
              <Zap size={20} className="text-yellow-400 drop-shadow-[0_0_10px_rgba(253,224,71,0.9)]" />
            </div>

            <div className="min-w-0">
              <p className="mb-0.5 text-[8px] font-black uppercase tracking-[0.32em] text-neutral-600">
                Protocolo Ativo
              </p>
              <h3 className="truncate text-[15px] font-black uppercase italic tracking-tight text-white leading-tight">
                {currentWorkout?.title || 'Hipertrofia Tática'}
              </h3>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-600">
                  Carga: <span className="text-yellow-400 font-black">85kg</span>
                </span>
                <span className="h-2.5 w-[1px] bg-neutral-800" />
                <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-neutral-600">
                  Reps: <span className="text-white font-black">120</span>
                </span>
              </div>
            </div>
          </div>

          {/* Botão play com pulse */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 rounded-2xl bg-yellow-400/25 animate-ping" style={{ animationDuration: '2.2s' }} />
            <div className="absolute -inset-1 rounded-[20px] bg-yellow-400/10 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.5s' }} />
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.88 }}
              transition={{ duration: 0.15 }}
              onClick={() => startSession(today)}
              className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[16px] bg-yellow-400 shadow-[0_0_36px_rgba(253,224,71,0.55),0_4px_16px_rgba(0,0,0,0.4)] hover:shadow-[0_0_56px_rgba(253,224,71,0.75)]"
            >
              <div className="absolute inset-0 rounded-[16px] bg-gradient-to-tr from-white/20 to-transparent" />
              <Play size={18} fill="black" className="ml-0.5 relative z-10 text-black" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ─── TELEMETRIA — Gráfico ────────────────────────────────────────── */}
      <motion.div
        ref={chartRef}
        variants={stagger.item}
        className="relative overflow-hidden rounded-[28px] border border-white/7 bg-[linear-gradient(180deg,rgba(20,20,18,0.97)_0%,rgba(8,8,8,1)_100%)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.03)] flex-1 min-h-[210px]"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_100%,rgba(253,224,71,0.05),transparent)]" />
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/28 to-transparent" />

        <div className="relative z-10 flex h-full flex-col">
          {/* Header com stats */}
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="mb-0.5 text-[8px] font-black uppercase tracking-[0.32em] text-neutral-600">Telemetria</p>
              <h3 className="text-[11px] font-black uppercase italic tracking-[0.2em] text-white">Tempo de treino</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Stats pills */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black uppercase tracking-[0.18em] text-neutral-600">Máx</span>
                  <span className="text-[9px] font-black text-yellow-400 tabular-nums">{chartMax}min</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black uppercase tracking-[0.18em] text-neutral-600">Méd</span>
                  <span className="text-[9px] font-black text-neutral-400 tabular-nums">{chartAvg}min</span>
                </div>
              </div>
              <span className="rounded-xl border border-yellow-400/18 bg-yellow-400/6 px-2.5 py-1 text-[7px] font-black uppercase tracking-[0.22em] text-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.08)]">
                7d
              </span>
            </div>
          </div>

          <div className="h-[130px] w-full -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FDE047" stopOpacity={0.32} />
                    <stop offset="60%" stopColor="#FDE047" stopOpacity={0.06} />
                    <stop offset="100%" stopColor="#FDE047" stopOpacity={0} />
                  </linearGradient>
                  <filter id="neonGlow" x="-20%" y="-50%" width="140%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#444', fontSize: 8, fontWeight: 900 }}
                  dy={10}
                />
                <YAxis hide domain={[0, 'auto']} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(253,224,71,0.12)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area
                  type="monotone"
                  dataKey="time"
                  stroke="#FDE047"
                  strokeWidth={2.5}
                  fill="url(#chartGradient)"
                  dot={{ fill: '#FDE047', strokeWidth: 0, r: 3.5 }}
                  activeDot={{ r: 7, fill: '#FDE047', stroke: '#000', strokeWidth: 2, filter: 'url(#neonGlow)' }}
                  isAnimationActive={chartVisible}
                  animationDuration={1400}
                  animationEasing="ease-out"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(253,224,71,0.5))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ─── BIOMÉTRICAS ─────────────────────────────────────────────────── */}
      <motion.div variants={stagger.item} className="grid grid-cols-3 gap-3">
        {[
          { label: 'VFC', value: bioMetrics.hrv, unit: 'ms', icon: Activity, color: 'text-emerald-400', glowColor: 'rgba(52,211,153,0.13)', borderColor: 'border-white/6' },
          { label: 'Sono', value: bioMetrics.sleep, unit: 'h', icon: Moon, color: 'text-yellow-400', glowColor: 'rgba(253,224,71,0.13)', borderColor: 'border-yellow-400/22', highlight: true },
          { label: 'RHR', value: bioMetrics.rhr, unit: 'bpm', icon: Heart, color: 'text-red-400', glowColor: 'rgba(248,113,113,0.13)', borderColor: 'border-white/6' },
        ].map(({ label, value, unit, icon: Icon, color, glowColor, borderColor, highlight }) => (
          <motion.div
            key={label}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className={`relative overflow-hidden rounded-[22px] border bg-[linear-gradient(180deg,rgba(22,22,22,0.96)_0%,rgba(10,10,10,1)_100%)] px-3 py-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] cursor-pointer ${borderColor} ${
              highlight ? 'shadow-[0_0_24px_rgba(253,224,71,0.07),0_8px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)]' : ''
            }`}
          >
            {/* top neon line for highlight */}
            {highlight && (
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />
            )}
            <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 50% 100%, ${glowColor}, transparent 70%)` }} />
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-1.5">
              <div className={`p-1.5 rounded-lg ${highlight ? 'bg-yellow-400/8' : 'bg-white/4'}`}>
                <Icon size={12} className={`${color}`} />
              </div>
              <span className="text-[7.5px] font-black uppercase tracking-[0.24em] text-neutral-600">{label}</span>
              <span className="text-[15px] font-black italic text-white leading-none">
                {value}<span className="ml-0.5 text-[8px] not-italic font-bold text-neutral-600">{unit}</span>
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>

    </motion.div>
  );
}
