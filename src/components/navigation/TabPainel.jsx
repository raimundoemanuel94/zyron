import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Play, Zap, Activity, Dumbbell, Moon, Plus, Beef, ChevronRight, Flame, CheckCircle2,
  X, Clock, MapPin, Image, BarChart3,
} from 'lucide-react';

import { supabase } from '../../lib/supabase';

// ─── Count-up hook (lógica intacta) ───────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  const startRef = useRef(null);
  useEffect(() => {
    if (target === 0) { setValue(0); return; }
    startRef.current = performance.now();
    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - progress, 3)) * target));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return value;
}



// ─── Design tokens ────────────────────────────────────────────────────────────
const CARD = 'relative overflow-hidden rounded-[18px] bg-[rgba(13,14,16,0.96)] border border-white/[0.065] shadow-[0_10px_34px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.045)]';
const NEON = '#CDFF5A';

// ─── Stagger ──────────────────────────────────────────────────────────────────
const stagger = {
  container: { animate: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  },
};

// ─── Workout type icon helper ─────────────────────────────────────────────────
const getWorkoutIcon = (title = '') => {
  const t = (title || '').toLowerCase();
  if (t.includes('corrida') || t.includes('cardio') || t.includes('caminhada')) return '🏃';
  if (t.includes('peito') || t.includes('chest') || t.includes('superior')) return '💪';
  if (t.includes('perna') || t.includes('leg') || t.includes('inferior')) return '🦵';
  if (t.includes('costa') || t.includes('back') || t.includes('costas')) return '🏋️';
  if (t.includes('ombro') || t.includes('shoulder')) return '🔝';
  return '🏋️';
};

// ─────────────────────────────────────────────────────────────────────────────
export default function TabPainel({
  user, today, currentWorkout, startSession,
  water, waterGoal, isHydrationAlert, handleWaterDrink,
  setWater, protein, proteinGoal, setProtein,
  refreshKey, workoutData,
}) {
  // ── State & Refs (todos intactos) ────────────────────────────────────────
  const [trainedDays, setTrainedDays] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [toastMessage, setToastMessage] = useState(null);

  // ── Edição inline de água e proteína ────────────────────────────────────
  const [editingMetric, setEditingMetric] = useState(null); // 'water' | 'protein' | null
  const [editMetricValue, setEditMetricValue] = useState('');
  const editInputRef = useRef(null);

  const openMetricEdit = (metric, currentVal) => {
    setEditingMetric(metric);
    setEditMetricValue(String(currentVal));
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  // ── Detalhe de treino (modal) ────────────────────────────────────────────
  const [selectedLog, setSelectedLog]     = useState(null);
  const [logDetail, setLogDetail]         = useState(null); // { sets, photo }
  const [loadingDetail, setLoadingDetail] = useState(false);

  const openLogDetail = async (log) => {
    setSelectedLog(log);
    setLoadingDetail(true);
    setLogDetail(null);
    try {
      const [setsRes, photoRes] = await Promise.all([
        supabase.from('set_logs').select('*').eq('workout_id', log.id).order('set_number', { ascending: true }),
        supabase.from('workout_photos').select('storage_path').eq('workout_log_id', log.id).maybeSingle(),
      ]);
      setLogDetail({
        sets:  setsRes.data  || [],
        photo: photoRes.data?.storage_path || null,
      });
    } catch { setLogDetail({ sets: [], photo: null }); }
    finally { setLoadingDetail(false); }
  };

  const formatHour = (iso) => {
    if (!iso) return '--:--';
    return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getWorkoutDurationMinutes = (log = {}) => {
    const fromMinutes = Number(log.duration_minutes);
    if (Number.isFinite(fromMinutes) && fromMinutes > 0) {
      return Math.round(fromMinutes);
    }

    const fromSeconds = Number(log.duration_seconds);
    if (Number.isFinite(fromSeconds) && fromSeconds > 0) {
      return Math.max(1, Math.round(fromSeconds / 60));
    }

    if (log.started_at && log.ended_at) {
      const startedAtMs = new Date(log.started_at).getTime();
      const endedAtMs = new Date(log.ended_at).getTime();
      const deltaMs = endedAtMs - startedAtMs;
      if (Number.isFinite(deltaMs) && deltaMs > 0) {
        return Math.max(1, Math.round(deltaMs / 60000));
      }
    }

    return 0;
  };

  const getWorkoutLogTimestamp = (log = {}) => (
    log.ended_at
    || log.completed_at
    || log.created_at
    || null
  );

  const getWorkoutDayKey = (log) => {
    const date = new Date(getWorkoutLogTimestamp(log) || Date.now());
    return `${date.toDateString()}::${String(log.workout_key || log.workout_name || 'treino')}`;
  };

  const getWorkoutLogDate = (log) => new Date(getWorkoutLogTimestamp(log) || Date.now());

  const isFinishedWorkoutLog = (log = {}) => {
    const durationMinutes = getWorkoutDurationMinutes(log);
    const hasFinishedAt = Boolean(log.ended_at || log.completed_at);
    return durationMinutes > 0 && hasFinishedAt;
  };

  const saveMetricEdit = () => {
    const num = parseFloat(editMetricValue);
    if (isNaN(num) || num < 0) { setEditingMetric(null); return; }
    if (editingMetric === 'water') {
      setWater?.(Math.min(num, 20)); // cap 20L
      triggerToast(`💧 Água: ${num.toFixed(1)}L salvo`, '✓');
    } else if (editingMetric === 'protein') {
      setProtein?.(Math.min(Math.round(num), 500)); // cap 500g
      triggerToast(`🥩 Proteína: ${Math.round(num)}g salvo`, '✓');
    }
    setEditingMetric(null);
  };

  const triggerToast = (text, icon) => {
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setToastMessage({ text, icon });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Effects (lógica intacta) ─────────────────────────────────────────────
  useEffect(() => { if (user?.id) { fetchWeekStreak(); fetchRecentActivity(); } }, [user, refreshKey]);

  const fetchWeekStreak = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('workout_logs').select('*')
        .eq('user_id', user.id)
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true });
      if (error) return;
      if (data?.length > 0) {
        const finishedLogs = data.filter(isFinishedWorkoutLog);
        setTrainedDays([...new Set(finishedLogs.map(log => getWorkoutLogDate(log).getDay()))]);
      } else {
        setTrainedDays([]);
      }
    } catch (_) { /* silenced */ }
  };

  // ── Fetch real recent activity ───────────────────────────────────────────
  const fetchRecentActivity = async () => {
    setLoadingActivity(true);
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(24);
      if (!error && data) {
        const uniqueByWorkoutDay = [];
        const seen = new Set();

        for (const log of data.filter(isFinishedWorkoutLog)) {
          const key = getWorkoutDayKey(log);
          if (seen.has(key)) continue;
          seen.add(key);
          uniqueByWorkoutDay.push(log);
          if (uniqueByWorkoutDay.length === 3) break;
        }

        setRecentActivity(uniqueByWorkoutDay);
      }
    } catch (_) { /* silenced */ }
    finally { setLoadingActivity(false); }
  };

  // ── Derived (lógica intacta) ─────────────────────────────────────────────
  const safeWaterGoal   = waterGoal;
  const safeProteinGoal = proteinGoal;
  const waterPct   = Math.min(100, (water   / safeWaterGoal)   * 100);
  const proteinPct = Math.min(100, (protein / safeProteinGoal) * 100);

  // ── Real stats derived from available data ────────────────────────────────
  const weekTrainCount  = trainedDays.length;
  const exerciseCount   = currentWorkout?.exercises?.length ?? 0;
  const totalSets       = currentWorkout?.exercises?.reduce(
    (acc, ex) => acc + (ex.sets?.length ?? ex.defaultSets ?? 3), 0
  ) ?? 0;
  const workoutTitle = currentWorkout?.title || 'Treino de hoje';
  const workoutFocus = (currentWorkout?.focus || 'Hipertrofia - Empurre').replace(/\s*-\s*/g, ' • ');

  // ── Week strip ──────────────────────────────────────────────────────────
  const WEEK_DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  // ── Format relative date ────────────────────────────────────────────────
  const formatRelativeDate = (isoDate) => {
    const d = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return `${diffDays}d atrás`;
  };

  const formatRecentLabel = (isoDate) => {
    const label = formatRelativeDate(isoDate);
    const time = new Date(isoDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${label} • ${time}`;
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -32, scale: 0.94 }}
            animate={{ opacity: 1, y: 20, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200]"
          >
            <div className="bg-[rgba(18,18,18,0.97)] border border-white/10 shadow-[0_12px_32px_rgba(0,0,0,0.8)] px-5 py-2.5 rounded-full flex items-center gap-2.5 backdrop-blur-2xl">
              <span className="text-base">{toastMessage.icon}</span>
              <span className="text-white text-[10px] font-bold tracking-widest uppercase">{toastMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        LAYOUT PRINCIPAL
        ─────────────────────────────────────────────────────────────────────
        h-full + flex-col = ocupa todo o espaço disponível (sem scroll).
        Cada seção tem flex proporcional. Sem minHeight fixo em px.
        Funciona de 320px (SE) a 430px+ (Pro Max) sem overflow.
      */}
      <motion.div
        key="painel"
        variants={stagger.container}
        initial="initial"
        animate="animate"
        exit={{ opacity: 0, scale: 1.01 }}
        className="flex flex-col gap-2 pb-2"
      >
        <div className="space-y-3 pb-1">
          <motion.div
            variants={stagger.item}
            whileTap={{ scale: 0.985 }}
            className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0F1220] px-4 py-4"
            style={{
              boxShadow: '0 8px 22px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_0%,rgba(205,255,90,0.12),transparent_46%)]" />
            <div className="relative z-10">
              <h2 className="text-xl font-black leading-tight text-white">{workoutTitle}</h2>
              <p className="mt-1 text-xs font-medium text-zinc-500">{workoutFocus}</p>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {WEEK_DAYS.map((label, i) => {
                  const dateNum = weekStart.getDate() + i;
                  const isToday = i === today;
                  const trained = trainedDays.includes(i);
                  const isCompletedToday = isToday && trained;
                  const isPendingToday = isToday && !trained;
                  return (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className={`min-w-[50px] p-2 rounded-full text-center border ${
                        isCompletedToday
                          ? 'bg-[#B6FF00] border-[#B6FF00] text-black'
                          : isPendingToday
                            ? 'border-[#B6FF00]/55 bg-[#B6FF00]/8 text-[#D8FFA1]'
                          : trained
                            ? 'border-[#B6FF00]/45 text-[#D8FFA1]'
                            : 'border-white/[0.06] bg-transparent text-zinc-500'
                      }`}
                    >
                      <p className="text-[9px] font-bold uppercase">{label}</p>
                      <p className={`text-sm font-semibold ${isCompletedToday ? 'text-black' : isPendingToday ? 'text-[#E7FFAB]' : trained ? 'text-zinc-200' : 'text-zinc-500'}`}>
                        {dateNum}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.button
            variants={stagger.item}
            whileTap={{ scale: 0.97 }}
            onClick={() => startSession(today)}
            className="mt-3 w-full rounded-xl bg-[#B6FF00] py-3 text-sm font-semibold text-black transition-transform"
            style={{ boxShadow: '0 6px 14px rgba(182,255,0,0.16)' }}
          >
            Iniciar treino
          </motion.button>
        </div>

        <div className="flex flex-col gap-2 pt-0">
        <motion.div variants={stagger.item} className="flex items-center justify-between px-1">
          <p className="text-sm font-semibold text-white">Visão geral</p>
          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-500 uppercase">Hoje</p>
        </motion.div>

        <motion.div
          variants={stagger.item}
          className="rounded-2xl border border-white/[0.06] bg-[#0F1220] px-4 py-3"
          style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.03)' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.18em] uppercase text-zinc-500">Treino do dia</p>
              <p className="mt-1 truncate text-lg font-bold text-white leading-none">{workoutTitle}</p>
              <p className="mt-1 text-xs text-zinc-500">{workoutFocus}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] px-3 py-2 text-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-zinc-500">Exercícios</p>
              <p className="text-xl font-black text-white leading-none mt-1">{exerciseCount}</p>
            </div>
          </div>
        </motion.div>

        {/* ══ 3. ÁGUA & PROTEÍNA ══════════════════════════════════════════ */}
        <motion.div variants={stagger.item} className="grid grid-cols-2 gap-[clamp(6px,1.5vw,10px)] shrink-0">

          {/* Água & Proteína — PREMIUM COMPONENTS */}
          {[
            {
              id: 'water',
              label: 'Água', icon: Droplets, accentRef: '#7da1ff',
              cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%), linear-gradient(135deg, rgba(92,124,255,0.10) 0%, transparent 52%), #080a10',
              cardShadow: '0 12px 34px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.045)',
              iconStyle: { background: 'rgba(92, 124, 255, 0.12)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)' },
              pct: waterPct, val: water.toFixed(1), unit: 'L', goal: `${safeWaterGoal.toFixed(1)}L`,
              btnStyle: { background: 'rgba(92, 124, 255, 0.09)', border: '1px solid rgba(92, 124, 255, 0.20)', color: '#9fb9ff' },
              btnText: '+ 250ml',
              onClick: (e) => { e.stopPropagation(); handleWaterDrink(0.25); triggerToast('+250ml registrados','💧'); },
              fillBg: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              fillShadow: '0 0 10px rgba(59,130,246,0.32)',
              done: waterPct >= 100,
            },
            {
              id: 'protein',
              label: 'Proteína', icon: Beef, accentRef: '#ff9a57',
              cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%), linear-gradient(135deg, rgba(255,120,0,0.10) 0%, transparent 52%), #0c0907',
              cardShadow: '0 12px 34px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.045)',
              iconStyle: { background: 'rgba(255, 120, 0, 0.12)', boxShadow: '0 8px 20px rgba(0, 0, 0, 0.25)' },
              pct: proteinPct, val: Math.round(protein), unit: 'g', goal: `${safeProteinGoal}g`,
              btnStyle: { background: 'rgba(255, 120, 0, 0.09)', border: '1px solid rgba(255, 120, 0, 0.20)', color: '#ffb38a' },
              btnText: '+ 30g',
              onClick: (e) => { e.stopPropagation(); setProtein(prev => prev + 30); triggerToast('+30g adicionados','🥩'); },
              fillBg: 'linear-gradient(90deg, #f97316, #fb923c)',
              fillShadow: '0 0 10px rgba(249,115,22,0.32)',
              done: proteinPct >= 100,
            },
          ].map((item) => (
            <motion.div key={item.id}
              whileHover={{ y: -3, scale: 1.01, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="relative flex flex-col justify-between overflow-hidden transition-all duration-300 group"
              style={{
                padding: '12px 12px 10px',
                gap: '8px',
                borderRadius: '16px',
                background: item.cardBg,
                boxShadow: item.cardShadow,
                border: '1px solid rgba(255,255,255,0.075)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="flex items-center justify-center rounded-full"
                    style={{ width: '30px', height: '30px', ...item.iconStyle }}>
                    <item.icon size={15} style={{ color: item.accentRef }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255,255,255,0.88)', letterSpacing: '0.04em' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: 800, color: item.done ? '#4ade80' : item.accentRef, textShadow: item.done ? '0 0 10px rgba(74,222,128,0.3)' : 'none' }}>
                  {Math.round(item.pct)}%
                </span>
              </div>

              {/* Valor Principal — toque para editar */}
              <div className="flex items-baseline" style={{ marginTop: '2px', gap: '4px' }}>
                {editingMetric === item.id ? (
                  <input
                    ref={editInputRef}
                    type="number"
                    inputMode="decimal"
                    value={editMetricValue}
                    onChange={e => setEditMetricValue(e.target.value)}
                    onBlur={saveMetricEdit}
                    onKeyDown={e => { if (e.key === 'Enter') saveMetricEdit(); if (e.key === 'Escape') setEditingMetric(null); }}
                    className="outline-none bg-transparent border-b text-white font-black leading-none"
                    style={{ fontSize: '24px', fontWeight: 900, width: '72px', borderColor: item.accentRef, caretColor: item.accentRef }}
                  />
                ) : (
                  <motion.button
                    key={item.val}
                    initial={{ scale: 1.08 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
                    onClick={() => openMetricEdit(item.id, item.id === 'water' ? water.toFixed(1) : Math.round(protein))}
                    className="leading-none text-white font-black"
                    style={{ fontSize: '24px', fontWeight: 900, lineHeight: 1, background: 'transparent', border: 'none', cursor: 'text' }}
                  >
                    {item.val}
                  </motion.button>
                )}
                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: '12px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{item.unit}</span>
                  <span style={{ fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.22)' }}>/ {item.goal}</span>
                </div>
              </div>

              {/* Barra — track visível mesmo em 0% */}
              <div style={{ marginTop: '2px' }}>
                <div style={{
                  height: '6px', width: '100%', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.085)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: item.pct > 0 ? `${item.pct}%` : '3px' }}
                    transition={{ duration: 0.9, ease: [0.22,1,0.36,1] }}
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: item.fillBg,
                      boxShadow: item.pct > 0 ? item.fillShadow : 'none',
                      minWidth: '3px',
                    }}
                  />
                </div>
              </div>

              {/* Botão — mais leve, sem uppercase pesado */}
              <div style={{ marginTop: '2px' }}>
                <motion.button
                  whileTap={{ scale: 0.94, opacity: 0.85 }}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-center gap-1.5 transition-opacity duration-150"
                  style={{
                    height: '28px',
                    borderRadius: '999px',
                    ...item.btnStyle,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  <Plus size={11} strokeWidth={2.5} />
                  {item.btnText}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ══ 5. STATS DO TREINO ATUAL ════════════════════════════════════ */}
        <motion.div variants={stagger.item} className="grid grid-cols-3 gap-[clamp(6px,1.5vw,10px)] shrink-0">
          {[
            { label: 'Treinos/Sem', value: weekTrainCount,  unit: 'dias', icon: Flame,    accentColor: '#CDFF5A', glowRgb: '205,255,90', featured: true },
            { label: 'Exercícios',  value: exerciseCount,   unit: 'hoje', icon: Dumbbell, accentColor: '#34D399', glowRgb: '52,211,153' },
            { label: 'Séries',      value: totalSets,       unit: 'total', icon: Activity, accentColor: '#FB7185', glowRgb: '251,113,133' },
          ].map(({ label, value, unit, icon: Icon, accentColor, glowRgb, featured }) => (
            <motion.div
              key={label}
              whileTap={{ scale: 0.93 }}
              className="relative overflow-hidden flex flex-col items-center justify-center"
              style={{
                borderRadius: '16px',
                background: 'rgba(13,14,17,0.96)',
                border: `1px solid rgba(${glowRgb},0.13)`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.36), inset 0 1px 0 rgba(255,255,255,0.04)`,
                paddingTop: 'clamp(6px,1.2dvh,10px)',
                paddingBottom: 'clamp(6px,1.2dvh,10px)',
              }}
            >
              {/* Glow de fundo sutil */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(${glowRgb},0.10), transparent 65%)` }} />
              {/* Linha topo destacada nos featured */}
              {featured && (
                <div className="absolute top-0 left-[20%] right-[20%] h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent, rgba(${glowRgb},0.5), transparent)` }} />
              )}
              {/* Ícone */}
              <div className="flex items-center justify-center rounded-full mb-[4px]"
                style={{
                  width: 'clamp(22px,5.4vw,26px)', height: 'clamp(22px,5.4vw,26px)',
                  background: `rgba(${glowRgb},0.10)`,
                  border: `1px solid rgba(${glowRgb},0.22)`,
                }}>
                <Icon size={10} style={{ color: accentColor }} />
              </div>
              {/* Label */}
              <span className="text-[7px] font-bold uppercase tracking-[0.16em] mb-[3px] text-center px-1"
                style={{ color: 'rgba(255,255,255,0.38)' }}>
                {label}
              </span>
              {/* Valor */}
              <motion.span
                key={value}
                initial={{ scale: 1.15, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.22,1,0.36,1] }}
                className="font-black leading-none"
                style={{ fontSize: 'clamp(12px,2.6dvh,14px)', color: '#ffffff' }}
              >
                {value}
                <span className="font-medium ml-0.5"
                  style={{ fontSize: '7px', color: `rgba(${glowRgb},0.6)` }}>{unit}</span>
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* ══ 4. ATIVIDADE RECENTE ════════════════════════════════════════ */}
        <motion.div variants={stagger.item} className={`${CARD} flex flex-col shrink-0 overflow-visible`} style={{ padding: '10px 12px' }}>
          <div className="absolute top-0 left-[30%] right-[30%] h-[1px]
            bg-gradient-to-r from-transparent via-[#CDFF5A]/20 to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between mb-2 flex-none px-1">
             <div>
               <h3 className="text-[12px] font-black uppercase tracking-[0.14em] text-white leading-none">Atividade Recente</h3>
               <p className="text-[8px] text-neutral-500 font-bold tracking-[0.16em] uppercase mt-1.5">
                 {loadingActivity ? 'Carregando…' : recentActivity.length > 0 ? 'Sincronizado' : 'Nenhum treino ainda'}
               </p>
             </div>
             <motion.button whileTap={{ scale: 0.9 }} className="text-[#B4FF3C]/80 bg-[#B4FF3C]/[0.07] px-2 py-1 rounded-full text-[8px] font-black tracking-widest uppercase border border-[#B4FF3C]/15">
               Histórico
             </motion.button>
          </div>

          {/* List — real data from Supabase */}
          <div className="flex flex-col gap-[7px] flex-none">
            {loadingActivity ? (
              /* Skeleton loader */
              [0].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse"
                  style={{ padding: '10px 12px', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-[10px] bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-white/[0.06] rounded-full w-2/3" />
                    <div className="h-2 bg-white/[0.04] rounded-full w-1/2" />
                  </div>
                  <div className="h-4 w-10 bg-white/[0.06] rounded-full" />
                </div>
              ))
            ) : recentActivity.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-5 gap-2">
                <div className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                  style={{ background: 'rgba(205,255,90,0.06)', border: '1px solid rgba(205,255,90,0.12)' }}>
                  <Dumbbell size={16} style={{ color: 'rgba(205,255,90,0.4)' }} />
                </div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-600">Complete um treino para ver aqui</p>
              </div>
            ) : (
              /* Real activity rows */
              recentActivity.slice(0, 1).map((log, i) => {
                const accent = i === 0 ? '#CDFF5A' : 'rgba(255,255,255,0.75)';
                const bgOpacity = i === 0 ? 'linear-gradient(135deg, rgba(205,255,90,0.055), rgba(255,255,255,0.025))' : 'rgba(255,255,255,0.026)';
                const border = i === 0 ? 'rgba(205,255,90,0.13)' : 'rgba(255,255,255,0.065)';
                return (
                  <motion.div
                    whileTap={{ scale: 0.97 }}
                    key={log.id}
                    onClick={() => openLogDetail(log)}
                    className="flex items-center justify-between cursor-pointer"
                    style={{ padding: '11px 12px', borderRadius: '14px', background: bgOpacity, border: `1px solid ${border}`, boxShadow: i === 0 ? 'inset 0 1px 0 rgba(255,255,255,0.04)' : 'none' }}
                  >
                    {/* Ícone */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] shrink-0"
                        style={{ background: i === 0 ? 'rgba(205,255,90,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${i === 0 ? 'rgba(205,255,90,0.13)' : 'rgba(255,255,255,0.07)'}` }}>
                        {getWorkoutIcon(
                          log.workout_name
                          || (workoutData && log.workout_key != null ? workoutData[log.workout_key]?.title : null)
                        )}
                      </div>
                      {/* Texto */}
                      <div>
                        <p className="text-[11.5px] font-bold text-white leading-none">
                          {log.workout_name
                            || (workoutData && log.workout_key != null ? workoutData[log.workout_key]?.title : null)
                            || 'Treino'}
                        </p>
                        <p className="text-[8.5px] text-neutral-500 font-medium mt-[3px] tracking-wide">
                          {formatRecentLabel(getWorkoutLogTimestamp(log) || log.created_at)}
                          {log.exercises_completed ? ` · ${log.exercises_completed} exerc.` : ''}
                        </p>
                      </div>
                    </div>
                    {/* Valor */}
                    <div className="flex items-baseline gap-[3px] shrink-0">
                      <span className="font-black leading-none" style={{ fontSize: '17px', color: accent }}>
                        {getWorkoutDurationMinutes(log) || '–'}
                      </span>
                      <span className="text-[8px] font-semibold text-neutral-500">min</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        </div>
      </motion.div>

      {/* ══ MODAL DETALHE DO TREINO ════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedLog && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedLog(null)}
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-[81] rounded-t-[28px] overflow-hidden"
              style={{
                background: 'rgba(12,12,16,0.99)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                maxHeight: '88vh',
                overflowY: 'auto',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
              }}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
              </div>

              <div className="px-5 pb-2">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pt-1">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] mb-1" style={{ color: NEON + '99' }}>
                      Detalhe do Treino
                    </p>
                    <h3 className="text-[20px] font-black text-white leading-tight">
                      {selectedLog.workout_name
                        || (workoutData?.[selectedLog.workout_key]?.title)
                        || 'Treino'}
                    </h3>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedLog(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full mt-1"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <X size={15} style={{ color: 'rgba(255,255,255,0.5)' }} />
                  </motion.button>
                </div>

                {/* Info row: horário + local */}
                <div className="flex gap-2 mb-4">
                  {(selectedLog.started_at || selectedLog.ended_at) && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px]"
                      style={{ background: 'rgba(205,255,90,0.06)', border: '1px solid rgba(205,255,90,0.14)' }}>
                      <Clock size={11} style={{ color: NEON }} />
                      <span className="text-[11px] font-bold" style={{ color: NEON }}>
                        {formatHour(selectedLog.started_at)} — {formatHour(selectedLog.ended_at)}
                      </span>
                    </div>
                  )}
                  {selectedLog.location && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px]"
                      style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.16)' }}>
                      <MapPin size={11} style={{ color: '#A78BFA' }} />
                      <span className="text-[11px] font-bold" style={{ color: '#A78BFA' }}>{selectedLog.location}</span>
                    </div>
                  )}
                  {/* Duração */}
                  {getWorkoutDurationMinutes(selectedLog) > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-[12px]"
                      style={{ background: 'rgba(251,146,60,0.06)', border: '1px solid rgba(251,146,60,0.14)' }}>
                      <BarChart3 size={11} style={{ color: '#FB923C' }} />
                      <span className="text-[11px] font-bold" style={{ color: '#FB923C' }}>
                        {getWorkoutDurationMinutes(selectedLog)}min
                      </span>
                    </div>
                  )}
                </div>

                {loadingDetail ? (
                  <div className="space-y-2 py-4">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-10 rounded-[12px] animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Foto do treino */}
                    {logDetail?.photo && (
                      <div className="mb-4">
                        <p className="text-[8.5px] font-black uppercase tracking-[0.22em] mb-2 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          <Image size={9} /> Foto do Treino
                        </p>
                        <motion.img
                          src={logDetail.photo}
                          alt="Foto do treino"
                          className="w-full rounded-[16px] object-cover"
                          style={{ maxHeight: 220, border: '1px solid rgba(255,255,255,0.08)' }}
                          initial={{ opacity: 0, scale: 0.97 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4 }}
                        />
                      </div>
                    )}

                    {/* Séries */}
                    {logDetail?.sets?.length > 0 ? (
                      <div>
                        <p className="text-[8.5px] font-black uppercase tracking-[0.22em] mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          Séries Concluídas · {logDetail.sets.length} total
                        </p>
                        {/* Agrupar por exercício */}
                        {Object.entries(
                          logDetail.sets.reduce((acc, s) => {
                            const key = s.exercise_id || 'ex';
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(s);
                            return acc;
                          }, {})
                        ).map(([exId, sets]) => (
                          <div key={exId} className="mb-3">
                            <p className="text-[9px] font-black uppercase tracking-wider mb-1.5 ml-1" style={{ color: 'rgba(205,255,90,0.7)' }}>
                              {exId}
                            </p>
                            <div className="space-y-1">
                              {sets.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-[10px]"
                                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black w-5 text-center rounded-full py-0.5"
                                      style={{ background: 'rgba(205,255,90,0.10)', color: NEON }}>
                                      {s.set_number || idx + 1}
                                    </span>
                                    <CheckCircle2 size={11} style={{ color: '#4ADE80' }} />
                                    <span className="text-[10px] font-bold text-white">
                                      {s.reps > 0 ? `${s.reps} reps` : '—'}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-black" style={{ color: s.weight_kg > 0 ? NEON : 'rgba(255,255,255,0.3)' }}>
                                    {s.weight_kg > 0 ? `${s.weight_kg}kg` : 'Peso corporal'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-[11px] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          Séries não registradas neste treino
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
