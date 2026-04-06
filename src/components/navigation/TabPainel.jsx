import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets, Play, Zap, Activity, Heart, Moon, Plus, Beef, ChevronRight,
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
const CARD = 'relative overflow-hidden rounded-[20px] bg-[rgba(18,18,20,0.95)] border border-white/[0.07] shadow-[0_6px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.04)]';
const NEON = '#CDFF5A';

// ─── Stagger ──────────────────────────────────────────────────────────────────
const stagger = {
  container: { animate: { transition: { staggerChildren: 0.055, delayChildren: 0.02 } } },
  item: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
export default function TabPainel({
  user, today, currentWorkout, startSession,
  water, waterGoal, isHydrationAlert, handleWaterDrink,
  protein, proteinGoal, setProtein,
  fullHeight,
}) {
  // ── State & Refs (todos intactos) ────────────────────────────────────────
  const [trainedDays, setTrainedDays] = useState([]);

  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (text, icon) => {
    if (window.navigator?.vibrate) window.navigator.vibrate(20);
    setToastMessage({ text, icon });
    setTimeout(() => setToastMessage(null), 2500);
  };

  // ── Effects (lógica intacta) ─────────────────────────────────────────────
  useEffect(() => { if (user?.id) fetchWeekStreak(); }, [user]);



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
      if (data?.length > 0)
        setTrainedDays([...new Set(data.map(log => new Date(log.created_at).getDay()))]);
    } catch (_) { /* silenced */ }
  };

  // ── Derived (lógica intacta) ─────────────────────────────────────────────
  const bioMetrics = { hrv: 68, sleep: 7.2, rhr: 52 };
  
  const safeWaterGoal   = waterGoal;
  const safeProteinGoal = proteinGoal;
  const waterPct   = Math.min(100, (water   / safeWaterGoal)   * 100);
  const proteinPct = Math.min(100, (protein / safeProteinGoal) * 100);

  // ── Week strip ──────────────────────────────────────────────────────────
  const WEEK_DAYS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

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
        className={`flex flex-col gap-[clamp(4px,1dvh,8px)] ${fullHeight ? 'h-full' : ''}`}
      >

        {/* ══ 1. HERO — card horizontal estilo referência ══════════════════ */}
        <motion.div
          variants={stagger.item}
          whileTap={{ scale: 0.97 }}
          onClick={() => startSession(today)}
          className="relative overflow-hidden rounded-[22px] cursor-pointer shrink-0 border border-[#CDFF5A]/[0.15]"
          style={{ 
            background: 'linear-gradient(145deg, #0d1a0f 0%, #000000 100%)', 
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 30px rgba(0,0,0,0.6)' 
          }}
        >
          {/* Borda neon topo — sutil */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#CDFF5A]/35 to-transparent" />
          {/* Atmosfera de luz verde — reduzida */}
          <div className="pointer-events-none absolute inset-0
            bg-[radial-gradient(ellipse_55%_80%_at_110%_50%,rgba(80,170,20,0.18),transparent_65%)]" />

          {/* Layout horizontal: ícone | texto | botão */}
          <div className="relative z-10 flex items-center gap-3 px-4 py-3.5">

            {/* Ícone — círculo verde sutil */}
            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-full
              bg-[rgba(180,255,60,0.10)] border border-[#CDFF5A]/20
              shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <Zap size={16} className="text-[#CDFF5A]" strokeWidth={2} />
            </div>

            {/* Texto central */}
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-black text-white leading-tight tracking-tight">
                {currentWorkout?.title || 'Treino do Dia'}
              </h2>
              <p className="text-[9px] font-semibold text-[#CDFF5A]/70 mt-0.5 tracking-wide uppercase">
                Fase de hipertrofia
              </p>
            </div>

            {/* Botão INICIAR — pulse sutil */}
            <motion.div
              whileTap={{ scale: 0.92 }}
              animate={{ boxShadow: ['0 0 0px rgba(205,255,90,0.0)', '0 0 12px rgba(205,255,90,0.28)', '0 0 0px rgba(205,255,90,0.0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="shrink-0 flex items-center justify-center rounded-full bg-[#CDFF5A] px-4 py-2 text-neutral-950 font-black uppercase tracking-[0.14em] text-[11px]"
            >
              INICIAR
            </motion.div>

          </div>
        </motion.div>

        {/* ══ 2. WEEK STRIP ════════════════════════════════════════════════ */}
        <motion.div variants={stagger.item}
          className={`${CARD} px-3 shrink-0`}
          style={{ paddingTop: 'clamp(8px,1.4dvh,12px)', paddingBottom: 'clamp(8px,1.4dvh,12px)' }}>
          <div className="absolute top-0 left-[20%] right-[20%] h-[1px]
            bg-gradient-to-r from-transparent via-[#CDFF5A]/20 to-transparent" />
          {/* Label mês sutil */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-neutral-600">Esta semana</span>
            <span className="text-[8px] font-bold text-[#CDFF5A]/60">{trainedDays.length} treinos</span>
          </div>
          <div className="flex items-center justify-between">
            {WEEK_DAYS.map((label, i) => {
              const dateNum = weekStart.getDate() + i;
              const isToday  = i === today;
              const trained  = trainedDays.includes(i);
              const isPast   = i < today;
              return (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.82 }}
                  className="flex flex-col items-center gap-[5px]"
                >
                  {/* Label dia — hoje neon, passado mais visível */}
                  <span className={`text-[8px] font-bold leading-none tracking-widest uppercase ${
                    isToday ? 'text-[#CDFF5A]' : isPast ? 'text-neutral-500' : 'text-neutral-600'
                  }`}>
                    {label}
                  </span>

                  {/* Chip do dia */}
                  <div className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                    isToday  ? 'bg-[#CDFF5A] shadow-[0_0_10px_rgba(205,255,90,0.25)]'
                    : trained ? 'bg-white/[0.07] border border-[#CDFF5A]/30'
                    : isPast  ? 'border border-white/[0.08]'
                               : 'border border-white/[0.06]'
                  }`} style={{ width: 'clamp(26px,6.5vw,30px)', height: 'clamp(26px,6.5vw,30px)' }}>
                    <span className={`font-bold leading-none ${
                      isToday  ? 'text-neutral-950'
                      : trained ? 'text-[#CDFF5A]'
                      : isPast  ? 'text-neutral-500'
                                 : 'text-neutral-500'
                    }`} style={{ fontSize: 'clamp(10px,2.6vw,12px)' }}>
                      {dateNum}
                    </span>
                  </div>

                  {/* Dot de treino concluído */}
                  <div className={`rounded-full transition-all duration-200 ${
                    trained && !isToday ? 'bg-[#CDFF5A]/70 shadow-[0_0_4px_rgba(205,255,90,0.5)]'
                                       : 'bg-transparent'
                  }`} style={{ width: 3, height: 3 }} />
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ══ 3. ÁGUA & PROTEÍNA ══════════════════════════════════════════ */}
        <motion.div variants={stagger.item} className="grid grid-cols-2 gap-[clamp(6px,1.5vw,10px)] shrink-0">

          {/* Água & Proteína — PREMIUM COMPONENTS */}
          {[
            {
              id: 'water',
              label: 'Água', icon: Droplets, accentRef: '#7da1ff',
              cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%), linear-gradient(135deg, rgba(50,100,255,0.12) 0%, transparent 50%), #090a10',
              cardShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
              iconStyle: { background: 'rgba(92, 124, 255, 0.15)', boxShadow: '0 0 15px rgba(92, 124, 255, 0.2)' },
              pct: waterPct, val: water.toFixed(1), unit: 'L', goal: `${safeWaterGoal.toFixed(1)}L`,
              btnStyle: { background: 'rgba(92, 124, 255, 0.1)', border: '1px solid rgba(92, 124, 255, 0.25)', color: '#9fb9ff' },
              btnText: '+ 250ml',
              onClick: (e) => { e.stopPropagation(); handleWaterDrink(0.25); triggerToast('+250ml registrados','💧'); },
              fillBg: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              fillShadow: '0 0 12px rgba(59,130,246,0.4)',
              done: waterPct >= 100,
            },
            {
              id: 'protein',
              label: 'Proteína', icon: Beef, accentRef: '#ff9a57',
              cardBg: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%), linear-gradient(135deg, rgba(255,100,0,0.12) 0%, transparent 50%), #0b0908',
              cardShadow: '0 10px 30px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
              iconStyle: { background: 'rgba(255, 120, 0, 0.15)', boxShadow: '0 0 15px rgba(255, 120, 0, 0.2)' },
              pct: proteinPct, val: Math.round(protein), unit: 'g', goal: `${safeProteinGoal}g`,
              btnStyle: { background: 'rgba(255, 120, 0, 0.1)', border: '1px solid rgba(255, 120, 0, 0.25)', color: '#ffb38a' },
              btnText: '+ 30g',
              onClick: (e) => { e.stopPropagation(); setProtein(prev => prev + 30); triggerToast('+30g adicionados','🥩'); },
              fillBg: 'linear-gradient(90deg, #f97316, #fb923c)',
              fillShadow: '0 0 12px rgba(249,115,22,0.4)',
              done: proteinPct >= 100,
            },
          ].map((item) => (
            <motion.div key={item.id} 
              whileHover={{ y: -3, scale: 1.01, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="relative flex flex-col justify-between overflow-hidden transition-all duration-300 group"
              style={{ 
                padding: '14px 14px 12px', 
                gap: '12px', 
                borderRadius: '18px',
                background: item.cardBg,
                boxShadow: item.cardShadow,
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="flex items-center justify-center rounded-full"
                    style={{ width: '32px', height: '32px', ...item.iconStyle }}>
                    <item.icon size={17} style={{ color: item.accentRef }} />
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}>{item.label}</span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: item.done ? '#4ade80' : item.accentRef, textShadow: item.done ? '0 0 10px rgba(74,222,128,0.3)' : 'none' }}>
                  {Math.round(item.pct)}%
                </span>
              </div>

              {/* Valor Principal — sempre branco, mesmo em 0 */}
              <div className="flex items-baseline" style={{ marginTop: '2px', gap: '4px' }}>
                <motion.span
                  key={item.val}
                  initial={{ scale: 1.08 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
                  style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, color: '#ffffff' }}
                >
                  {item.val}
                </motion.span>
                <div className="flex items-baseline gap-1">
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{item.unit}</span>
                  <span style={{ fontSize: '10px', fontWeight: 500, color: 'rgba(255,255,255,0.22)' }}>/ {item.goal}</span>
                </div>
              </div>

              {/* Barra — track visível mesmo em 0% */}
              <div style={{ marginTop: '2px' }}>
                <div style={{
                  height: '5px', width: '100%', borderRadius: '999px',
                  background: 'rgba(255,255,255,0.10)',
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
                    height: '32px',
                    borderRadius: '999px',
                    ...item.btnStyle,
                    fontSize: '11px',
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

        {/* ══ 4. ATIVIDADE RECENTE ════════════════════════════════════════ */}
        <motion.div variants={stagger.item} className={`${CARD} flex flex-col shrink-0 overflow-visible`} style={{ padding: 'clamp(10px,2dvh,14px)' }}>
          <div className="absolute top-0 left-[30%] right-[30%] h-[1px]
            bg-gradient-to-r from-transparent via-[#CDFF5A]/20 to-transparent" />
            
          {/* Header */}
          <div className="flex items-center justify-between mb-2 flex-none px-1">
             <div>
               <h3 className="text-[12px] font-black uppercase italic tracking-[0.12em] text-white leading-none">Atividade Recente</h3>
               <p className="text-[8px] text-neutral-500 font-bold tracking-[0.15em] uppercase mt-1">Sincronizado hoje</p>
             </div>
             <motion.button whileTap={{ scale: 0.9 }} className="text-[#B4FF3C] bg-[#B4FF3C]/10 px-2.5 py-1.5 rounded-full text-[8.5px] font-black tracking-widest uppercase border border-[#B4FF3C]/20 shadow-[0_0_10px_rgba(180,255,60,0.15)]">
               Histórico
             </motion.button>
          </div>

          {/* List */}
          <div className="flex flex-col gap-[5px] flex-none">
            {[
              {
                icon: '🏃', title: 'Caminhada', sub: 'Ritmo moderado',
                val: '7.890', unit: 'passos',
                accent: '#CDFF5A', bgOpacity: 'rgba(205,255,90,0.06)', border: 'rgba(205,255,90,0.12)',
              },
              {
                icon: '🏋️', title: currentWorkout?.title || 'Treino Resistência', sub: 'Força + hipertrofia',
                val: '55', unit: 'min',
                accent: 'rgba(255,255,255,0.75)', bgOpacity: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.07)',
              },
            ].map((act, i) => (
              <motion.div
                whileTap={{ scale: 0.97 }}
                key={i}
                className="flex items-center justify-between cursor-pointer"
                style={{
                  padding: '10px 12px',
                  borderRadius: '14px',
                  background: act.bgOpacity,
                  border: `1px solid ${act.border}`,
                }}
              >
                {/* Ícone */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[17px] shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {act.icon}
                  </div>
                  {/* Texto */}
                  <div>
                    <p className="text-[11px] font-bold text-white leading-none">{act.title}</p>
                    <p className="text-[8.5px] text-neutral-500 font-medium mt-[3px] tracking-wide">{act.sub}</p>
                  </div>
                </div>
                {/* Valor — hierarquia clara: número grande + unidade */}
                <div className="flex items-baseline gap-[3px] shrink-0">
                  <span className="font-black leading-none"
                    style={{ fontSize: '17px', color: act.accent }}>
                    {act.val}
                  </span>
                  <span className="text-[8px] font-semibold text-neutral-500">{act.unit}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ══ 5. BIOMÉTRICAS ══════════════════════════════════════════════ */}
        <motion.div variants={stagger.item} className="grid grid-cols-3 gap-[clamp(6px,1.5vw,10px)] shrink-0">
          {[
            { label: 'VFC',  value: bioMetrics.hrv,   unit: 'ms',  icon: Activity, accentColor: '#34D399', glowRgb: '52,211,153' },
            { label: 'Sono', value: bioMetrics.sleep, unit: 'h',   icon: Moon,     accentColor: '#CDFF5A', glowRgb: '205,255,90', featured: true },
            { label: 'RHR',  value: bioMetrics.rhr,   unit: 'bpm', icon: Heart,    accentColor: '#FB7185', glowRgb: '251,113,133' },
          ].map(({ label, value, unit, icon: Icon, accentColor, glowRgb, featured }) => (
            <motion.div
              key={label}
              whileTap={{ scale: 0.93 }}
              className="relative overflow-hidden flex flex-col items-center justify-center"
              style={{
                borderRadius: '18px',
                background: 'rgba(16,16,20,0.97)',
                border: `1px solid rgba(${glowRgb},0.18)`,
                boxShadow: `0 5px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
                paddingTop: 'clamp(8px,1.6dvh,12px)',
                paddingBottom: 'clamp(8px,1.6dvh,12px)',
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
              <div className="flex items-center justify-center rounded-full mb-[6px]"
                style={{
                  width: 'clamp(24px,6vw,28px)', height: 'clamp(24px,6vw,28px)',
                  background: `rgba(${glowRgb},0.10)`,
                  border: `1px solid rgba(${glowRgb},0.22)`,
                }}>
                <Icon size={11} style={{ color: accentColor }} />
              </div>
              {/* Label — melhor contraste */}
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] mb-[4px]"
                style={{ color: 'rgba(255,255,255,0.38)' }}>
                {label}
              </span>
              {/* Valor — sempre branco legível */}
              <span className="font-black leading-none" style={{ fontSize: 'clamp(13px,3dvh,16px)', color: '#ffffff' }}>
                {value}
                <span className="font-medium ml-0.5"
                  style={{ fontSize: '7px', color: `rgba(${glowRgb},0.6)` }}>{unit}</span>
              </span>
            </motion.div>
          ))}
        </motion.div>

      </motion.div>
    </>
  );
}
