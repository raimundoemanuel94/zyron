import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Award, Target, ChevronRight, History, ArrowBigUp, Camera, Plus, Zap, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';

// Componente para animar a contagem percentual
const AnimatedCounter = ({ to }) => {
  const [count, setCount] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const end = parseInt(to);
    if (start === end) return;
    let totalMilSecDur = 1500;
    let incrementTime = (totalMilSecDur / end);
    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);
    return () => clearInterval(timer);
  }, [to]);
  return <>{count}</>;
};

export default function TabEvolucao({
  prHistory,
  weight,
  setWeight,
  workoutData
}) {
  const [isSavingWeight, setIsSavingWeight] = React.useState(false);
  
  // Auto-sync weight to Supabase when it changes (debounced)
  React.useEffect(() => {
    const saveWeight = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        setIsSavingWeight(true);
        const { error } = await supabase
          .from('body_measurements')
          .insert({
            user_id: session.user.id,
            weight: weight
          });
          
        if (error) console.error("Error saving weight:", error);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSavingWeight(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      // Avoid saving on initial load if we had a way to track it, but for now we debounce saving
      saveWeight();
    }, 2000); // Wait 2s after user stops dragging slider

    return () => clearTimeout(debounceTimer);
  }, [weight]);

  // Mock de dados para visualização imediata do Gráfico Neon (Sistematizado com Black Gold)
  const data = [
    { date: '01/02', carga: 60, trend: 58 },
    { date: '08/02', carga: 64, trend: 62 },
    { date: '15/02', carga: 64, trend: 66 },
    { date: '22/02', carga: 70, trend: 70 },
    { date: '01/03', carga: 75, trend: 74 },
  ];

  const totalPrs = Object.keys(prHistory || {}).length;

  return (
    <motion.div
      key="evolucao"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Header Premium */}
      <header className="flex justify-between items-end px-1">
        <div>
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Performance</p>
          <h2 className="text-3xl font-black italic text-white leading-none tracking-tighter">EVOLUÇÃO</h2>
        </div>
        <div className="bg-yellow-400/10 p-2 rounded-2xl border border-yellow-400/20 shadow-[0_0_15px_rgba(253,224,71,0.15)]">
          <TrendingUp className="text-yellow-400" size={24} />
        </div>
      </header>

      {/* Card de Gráfico Neon */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-[0px_10px_30px_rgba(0,0,0,0.8)]"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-bold uppercase text-sm italic tracking-tight">Evolução de Cargas</h3>
          <span className="text-yellow-400 font-black text-xl italic tracking-tighter">15% ▲</span>
        </div>
        
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#52525b" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: '#18181b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#FDE047', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="carga" 
                name="Carga Real"
                stroke="#FDE047" 
                strokeWidth={4} 
                dot={{ r: 6, fill: '#FDE047', strokeWidth: 0 }}
                activeDot={{ r: 8, stroke: '#FDE047', strokeWidth: 4, fill: '#000' }}
                style={{ filter: 'drop-shadow(0px 0px 8px rgba(253, 224, 71, 0.5))' }}
              />
              <Line 
                type="monotone" 
                dataKey="trend" 
                name="Tendência Projetada"
                stroke="#737373" 
                strokeWidth={2} 
                strokeDasharray="5 5"
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid de Gamificação (Substitui Métricas Técnicas por Motivacionais) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-neutral-900/50 border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-yellow-500/30 transition-colors">
          <Zap className="text-yellow-500 mb-2 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" size={24} />
          <div>
            <p className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">Ganho de Força</p>
            <p className="text-white font-black text-4xl italic tracking-tighter flex items-start">
              <AnimatedCounter to="18" /><span className="text-lg text-yellow-500 ml-1 mt-1">%</span>
            </p>
          </div>
        </div>
        <div className="bg-neutral-900/50 border border-white/5 p-5 rounded-3xl shadow-xl flex flex-col justify-between group hover:border-emerald-500/30 transition-colors">
          <Calendar className="text-emerald-500 mb-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" size={24} />
          <div>
            <p className="text-neutral-500 text-[10px] font-black tracking-widest uppercase">Frequência Mês</p>
            <p className="text-white font-black text-4xl italic tracking-tighter">15<span className="text-lg text-neutral-500 ml-1">/20</span></p>
            <div className="w-full bg-black/50 h-1.5 rounded-full mt-2 overflow-hidden border border-white/5">
              <div className="bg-emerald-500 h-full rounded-full w-[75%] shadow-[0_0_10px_rgba(16,185,129,0.6)]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Histórico de Recordes Humano */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
            Minhas Superações <span className="text-yellow-500">🏆</span>
          </h3>
        </div>
        
        {Object.entries(prHistory).length === 0 ? (
          <div className="text-center py-10 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
            <p className="font-black uppercase tracking-widest text-[10px] text-neutral-700">Aguardando superações</p>
          </div>
        ) : (
          Object.entries(prHistory).map(([id, weightVal]) => {
            const ex = Object.values(workoutData).flatMap(w => w.exercises || []).find(e => e.id === id);
            // Mock um peso anterior para mostrar a evolução
            const oldWeight = Math.max(0, Math.floor(weightVal * 0.85));
            const diff = weightVal - oldWeight;
            
            return (
              <div key={id} className="group flex flex-col p-4 bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-xl transition-all cursor-default hover:border-yellow-500/30">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-0.5">{ex?.group || "Músculo"}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase">{ex?.name || id}</h4>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    <span className="text-xs font-black text-emerald-400">+{diff}kg</span>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-black/40 rounded-xl p-3 border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Antes</span>
                    <span className="text-lg font-black italic text-neutral-400">{oldWeight}<span className="text-[10px]">KG</span></span>
                  </div>
                  <ChevronRight className="text-neutral-700" size={16} />
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-yellow-500/70 uppercase tracking-widest">Agora</span>
                    <span className="text-xl font-black italic text-white drop-shadow-[0_0_8px_rgba(253,224,71,0.3)]">{weightVal}<span className="text-[10px] text-yellow-500/50 ml-1">KG</span></span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Galeria de Fotos de Evolução */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-2 pt-2">
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
            Galeria <span className="text-yellow-500"><Camera size={18} /></span>
          </h3>
          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Com Marca ZYRON</span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[3/4] bg-neutral-900 border border-white/5 rounded-3xl overflow-hidden relative group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-neutral-800 flex flex-col items-center justify-center">
              <img src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop" className="opacity-60 object-cover absolute inset-0 w-full h-full mix-blend-luminosity transition-opacity group-hover:opacity-80" alt="Antes" />
              <div className="absolute bottom-3 right-3 text-[10px] font-black italic text-yellow-400 uppercase tracking-widest opacity-90 backdrop-blur-md px-3 py-1.5 bg-black/60 rounded-xl border border-yellow-400/20">ZYRON</div>
            </div>
          </div>
          <div className="aspect-[3/4] bg-neutral-900/50 backdrop-blur-md border border-dashed border-neutral-700 hover:border-yellow-500/50 transition-colors rounded-3xl flex flex-col items-center justify-center cursor-pointer group shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="w-12 h-12 rounded-full bg-neutral-800/80 group-hover:bg-yellow-500/20 flex items-center justify-center mb-3 transition-colors border border-white/5 group-hover:border-yellow-500/30">
              <Plus className="text-neutral-500 group-hover:text-yellow-500 transition-colors" size={20} />
            </div>
            <span className="text-[10px] font-bold text-neutral-500 group-hover:text-yellow-500 uppercase tracking-widest text-center px-4 leading-relaxed transition-colors">Nova Foto<br/>Progresso</span>
          </div>
        </div>
      </div>

      {/* Peso Corporal Control - Integrado para consistência */}
      <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-600/20">
              <ArrowBigUp className="text-emerald-500" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Peso Corporal</span>
              <h3 className="text-lg font-black uppercase tracking-tight italic text-slate-200">Atualizar Peso</h3>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="text-4xl font-black text-white italic tracking-tighter">{weight}<span className="text-sm ml-1 text-neutral-500">KG</span></div>
            {isSavingWeight && <span className="text-[8px] text-yellow-500 animate-pulse uppercase tracking-widest mt-1">Sincronizando...</span>}
          </div>
        </div>
        <input 
          type="range" 
          min="50" max="150" step="0.5"
          value={weight} 
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-950/80 rounded-lg appearance-none cursor-pointer accent-yellow-500 border border-white/5"
        />
      </div>
      
    </motion.div>
  );
}
