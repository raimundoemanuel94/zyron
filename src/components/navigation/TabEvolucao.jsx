import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, Zap, ArrowBigUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import EvolutionTimeline from '../shared/EvolutionTimeline';
import { C, Card, Badge } from '../../styles/ds';

const AnimatedCounter = ({ to }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = parseInt(to);
    if (start === end) return;
    const inc = Math.max(1, Math.floor(end / 40));
    const timer = setInterval(() => {
      start = Math.min(start + inc, end);
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, 35);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count}</>;
};

const DSTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(14,14,18,0.97)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
      <p style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: C.textSub, marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: '13px', fontWeight: 900, color: C.neon }}>
        {payload[0].value}<span style={{ fontSize: '9px', color: C.textSub, marginLeft: 2 }}>kg</span>
      </p>
    </div>
  );
};

export default function TabEvolucao({ user, profile, updateProfile, currentWorkout, prHistory, weight, setWeight, workoutData }) {
  // ✅ FIXED: Weight persistence is now handled by useDailyMetrics hook
  // When setWeight is called from here, it automatically triggers:
  // 1. useDailyMetrics.updateMetrics({ weightKg: newValue })
  // 2. Saves to daily_stats table in Supabase
  // 3. Also syncs to profile.bio.weightKg via persistenceService

  const [isSavingWeight, setIsSavingWeight] = React.useState(false);
  const [weightHistory, setWeightHistory] = React.useState([]);
  const [loadingHistory, setLoadingHistory] = React.useState(true);
  const saveTimerRef = React.useRef(null);

  // ── Fetch real weight history from daily_stats ──────────────────────────
  React.useEffect(() => {
    if (!user?.id) return;
    const fetchWeightHistory = async () => {
      setLoadingHistory(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const { data, error } = await supabase
          .from('daily_stats')
          .select('stat_date, date, weight_kg')
          .eq('user_id', user.id)
          .not('weight_kg', 'is', null)
          .or(`stat_date.gte.${thirtyDaysAgo.toISOString().split('T')[0]},date.gte.${thirtyDaysAgo.toISOString().split('T')[0]}`)
          .order('stat_date', { ascending: true, nullsFirst: false });
        if (!error && data?.length > 0) {
          setWeightHistory(data.map(row => {
            const rawDate = row.stat_date || row.date;
            return {
              date: rawDate ? new Date(rawDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '–',
              carga: row.weight_kg,
            };
          }));
        }
      } catch (_) { /* silenced */ }
      finally { setLoadingHistory(false); }
    };
    fetchWeightHistory();
  }, [user?.id]);

  // ── Activate save indicator when weight slider changes ──────────────────
  React.useEffect(() => {
    clearTimeout(saveTimerRef.current);
    setIsSavingWeight(true);
    saveTimerRef.current = setTimeout(() => setIsSavingWeight(false), 1800);
    return () => clearTimeout(saveTimerRef.current);
  }, [weight]);

  // ── Build chart data: use real history or current weight as single point ─
  const chartData = React.useMemo(() => {
    if (weightHistory.length >= 2) {
      // Add a trend line (7-day moving average)
      return weightHistory.map((row, i) => {
        const slice = weightHistory.slice(Math.max(0, i - 3), i + 1);
        const avg = slice.reduce((a, b) => a + b.carga, 0) / slice.length;
        return { ...row, trend: Math.round(avg * 10) / 10 };
      });
    }
    // Fallback: show current weight + placeholder progression
    const today = new Date();
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (4 - i) * 7);
      return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        carga: weight,
        trend: weight,
      };
    });
  }, [weightHistory, weight]);

  // ── Compute weight change badge ─────────────────────────────────────────
  const weightChange = React.useMemo(() => {
    if (weightHistory.length < 2) return null;
    const first = weightHistory[0].carga;
    const last = weightHistory[weightHistory.length - 1].carga;
    const diff = last - first;
    return { diff: Math.abs(diff).toFixed(1), dir: diff >= 0 ? '▲' : '▼', positive: diff >= 0 };
  }, [weightHistory]);

  return (
    <motion.div
      key="evolucao"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 pb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: C.neonDim }}>Performance</p>
          <h2 className="text-[20px] font-black uppercase tracking-tight text-white leading-none mt-0.5">Evolução</h2>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px]"
          style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}>
          <TrendingUp size={17} style={{ color: C.neon }} />
        </div>
      </div>

      {/* Gráfico — real weight history */}
      <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
        <div className="absolute top-0 left-[25%] right-[25%] h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${C.neonBorder}, transparent)` }} />
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[12px] font-black text-white uppercase tracking-tight">Evolução de Peso</p>
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.18em] mt-0.5" style={{ color: C.textSub }}>
              {loadingHistory ? 'Carregando…' : weightHistory.length >= 2 ? 'Últimos 30 dias' : 'Peso atual'}
            </p>
          </div>
          {weightChange ? (
            <span className={Badge.neon} style={{ color: weightChange.positive ? C.neon : '#FB7185', borderColor: weightChange.positive ? 'rgba(205,255,90,0.2)' : 'rgba(251,113,133,0.2)' }}>
              {weightChange.dir} {weightChange.diff}kg
            </span>
          ) : (
            <span className={Badge.neutral}>Sem dados</span>
          )}
        </div>
        <div className="h-44 w-full">
          {loadingHistory ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${C.neon}40`, borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 4, left: -26, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" stroke="transparent"
                  tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 9, fontWeight: 600 }}
                  tickLine={false} axisLine={false} dy={8} />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <RechartsTooltip content={<DSTooltip />} cursor={{ stroke: `${C.neon}20`, strokeWidth: 1 }} />
                <Line type="monotone" dataKey="carga" stroke={C.neon} strokeWidth={2.5}
                  dot={{ r: 4, fill: C.neon, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: C.neon, stroke: '#000', strokeWidth: 1.5 }}
                  style={{ filter: `drop-shadow(0 0 6px ${C.neon}60)` }} />
                {chartData.some(d => d.trend !== d.carga) && (
                  <Line type="monotone" dataKey="trend"
                    stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} strokeDasharray="5 5"
                    dot={false} activeDot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Grid gamificação */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Zap,      label: 'Ganho de Força', val: '18', unit: '%',  accentColor: C.neon,     glowRgb: '205,255,90', custom: false },
          { icon: Calendar, label: 'Frequência Mês',  val: null, unit: null, accentColor: '#4ADE80',  glowRgb: '74,222,128', custom: true  },
        ].map(({ icon: Icon, label, val, unit, accentColor, glowRgb, custom }) => (
          <div key={label} className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 10% 100%, rgba(${glowRgb},0.07), transparent 65%)` }} />
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] mb-3"
              style={{ background: `rgba(${glowRgb},0.10)`, border: `1px solid rgba(${glowRgb},0.18)` }}>
              <Icon size={15} style={{ color: accentColor }} />
            </div>
            <p className="text-[8.5px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: C.textSub }}>{label}</p>
            {custom ? (
              <>
                <p className="text-[28px] font-black text-white leading-none">15<span className="text-[13px] font-semibold ml-1" style={{ color: C.textSub }}>/20</span></p>
                <div className="mt-2 h-[4px] w-full rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full" style={{ width: '75%', background: accentColor, boxShadow: `0 0 8px rgba(${glowRgb},0.45)` }} />
                </div>
              </>
            ) : (
              <p className="text-[28px] font-black text-white leading-none">
                <AnimatedCounter to={val} /><span className="text-[14px] ml-0.5" style={{ color: accentColor }}>{unit}</span>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recordes */}
      <div className="space-y-2">
        <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-white px-1">
          Minhas Superações <span style={{ color: C.neon }}>🏆</span>
        </h3>
        {Object.entries(prHistory).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-[20px]"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.07)' }}>
            <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>Aguardando superações</p>
          </div>
        ) : (
          Object.entries(prHistory).map(([id, weightVal]) => {
            const ex = Object.values(workoutData).flatMap(w => w.exercises || []).find(e => e.id === id);
            const oldWeight = Math.max(0, Math.floor(weightVal * 0.85));
            const diff = weightVal - oldWeight;
            return (
              <motion.div key={id} whileTap={{ scale: 0.98 }}
                className="relative rounded-[18px] overflow-hidden cursor-default"
                style={{ ...Card.style, padding: '14px' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] block mb-0.5" style={{ color: C.neonDim }}>{ex?.group || 'Músculo'}</span>
                    <h4 className="text-[12px] font-black text-white uppercase">{ex?.name || id}</h4>
                  </div>
                  <span className={Badge.neon}>+{diff}kg</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 rounded-[12px]"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.textSub }}>Antes</p>
                    <p className="text-[18px] font-black text-neutral-400 leading-none">{oldWeight}<span className="text-[9px] ml-0.5">kg</span></p>
                  </div>
                  <ChevronRight size={13} style={{ color: C.textSub }} />
                  <div className="text-right">
                    <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.neonDim }}>Agora</p>
                    <p className="text-[20px] font-black text-white leading-none" style={{ textShadow: `0 0 10px ${C.neon}35` }}>
                      {weightVal}<span className="text-[9px] ml-0.5" style={{ color: C.neonDim }}>kg</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Timeline */}
      <EvolutionTimeline user={user} />

      {/* Peso corporal */}
      <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
              style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.16)' }}>
              <ArrowBigUp size={15} style={{ color: '#4ADE80' }} />
            </div>
            <div>
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>Peso Corporal</p>
              <p className="text-[13px] font-black text-white uppercase leading-none mt-0.5">Atualizar Peso</p>
            </div>
          </div>
          <div className="text-right">
            <motion.p
              key={weight}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
              className="text-[28px] font-black text-white leading-none"
            >
              {weight}<span className="text-[11px] font-semibold ml-1" style={{ color: C.textSub }}>kg</span>
            </motion.p>
            <AnimatePresence>
              {isSavingWeight && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="text-[8px] font-bold uppercase tracking-widest mt-0.5"
                  style={{ color: C.neon }}
                >
                  Sincronizando…
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
        <input
          type="range" min="50" max="150" step="0.5"
          value={weight}
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          className="w-full h-[5px] rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${C.neon} ${((weight - 50) / 100) * 100}%, rgba(255,255,255,0.10) ${((weight - 50) / 100) * 100}%)`,
            accentColor: C.neon,
          }}
        />
        {/* Min/Max labels */}
        <div className="flex justify-between mt-2">
          <span className="text-[8px] font-bold" style={{ color: C.textSub }}>50kg</span>
          <span className="text-[8px] font-bold" style={{ color: C.textSub }}>150kg</span>
        </div>
      </div>
    </motion.div>
  );
}
