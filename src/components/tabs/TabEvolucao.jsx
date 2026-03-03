import React from 'react';
import { motion } from 'framer-motion';
import { History, Trophy, ArrowBigUp, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

// If Anatomy3D is in parent folder
import { Anatomy3D } from '../Anatomy3D';

// Generic GlassCard component
const GlassCard = ({ children }) => (
  <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
    {children}
  </div>
);

export default function TabEvolucao({
  currentWorkout,
  prHistory,
  weight,
  setWeight,
  workoutData
}) {
  return (
    <motion.div
      key="evolucao"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center px-1">
        <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Evolução PRO</h2>
        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <History className="text-yellow-400" size={24} />
        </div>
      </div>

      {/* Recordes & Gráfico de Evolução */}
      <div className="space-y-4">
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Curva de Força Global</h3>
            <Trophy size={18} className="text-yellow-400" />
          </div>
          <div className="h-48 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={[
                  { week: 'S1', load: 80 },
                  { week: 'S2', load: 85 },
                  { week: 'S3', load: 88 },
                  { week: 'Hoje', load: 95 }
                ]}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <filter id="neonGlowChart" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="week" stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#ffffff30" fontSize={10} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#ffffff10', borderRadius: '16px', boxShadow: '0 0 20px rgba(253,224,71,0.15)' }}
                  itemStyle={{ color: '#FDE047', fontWeight: 900, fontStyle: 'italic' }}
                  labelStyle={{ color: '#737373', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="load" 
                  stroke="#FDE047" 
                  strokeWidth={4} 
                  dot={{ r: 5, fill: '#0A0A0A', stroke: '#FDE047', strokeWidth: 2 }} 
                  activeDot={{ r: 8, fill: '#FDE047', stroke: '#0A0A0A', strokeWidth: 2 }} 
                  style={{ filter: 'url(#neonGlowChart)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <div className="flex items-center justify-between px-2 pt-4">
          <h3 className="text-lg font-black uppercase italic tracking-tight">Registros Recentes (PRs)</h3>
        </div>
        
        <div className="space-y-3">
          {Object.entries(prHistory).length === 0 ? (
            <div className="text-center py-10 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
              <p className="font-black uppercase tracking-widest text-[10px] text-neutral-700">Aguardando dados de performance.</p>
            </div>
          ) : (
            Object.entries(prHistory).map(([id, weightVal]) => {
              const ex = Object.values(workoutData).flatMap(w => w.exercises || []).find(e => e.id === id);
              return (
                <div key={id} className="group flex justify-between items-center p-4 bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-white/5 hover:border-yellow-400/50 hover:shadow-[0_0_20px_rgba(253,224,71,0.2)] transition-all cursor-default">
                  <div>
                    <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest block mb-0.5">{ex?.group || "Músculo"}</span>
                    <h4 className="text-sm font-black text-slate-200 uppercase group-hover:text-white transition-colors">{ex?.name || id}</h4>
                  </div>
                  <div className="flex items-end gap-1.5">
                    <span className="text-2xl font-black italic text-white tracking-tighter group-hover:text-yellow-400 transition-colors">{weightVal}</span>
                    <span className="text-[10px] font-bold text-yellow-500/50 pb-1 group-hover:text-yellow-400">KG</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Peso Corporal Control */}
      <GlassCard>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-600/10 rounded-2xl border border-emerald-600/20">
              <ArrowBigUp className="text-emerald-500" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Peso Corporal</span>
              <h3 className="text-lg font-black uppercase tracking-tight italic text-slate-200">Histórico de Medidas</h3>
            </div>
          </div>
          <div className="text-4xl font-black text-white italic tracking-tighter">{weight}<span className="text-sm ml-1 text-neutral-500">KG</span></div>
        </div>
        <input 
          type="range" 
          min="50" max="150" step="0.5"
          value={weight} 
          onChange={(e) => setWeight(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-950/80 rounded-lg appearance-none cursor-pointer accent-yellow-500 border border-white/5"
        />
      </GlassCard>

      {/* Galeria de Fotos Antes/Depois */}
      <GlassCard>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black uppercase italic tracking-tight">Galeria de Evolução</h3>
          <button className="text-[10px] uppercase font-black text-yellow-400 flex items-center gap-1 hover:text-white transition-colors">
            Nova Foto <Plus size={14} />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="relative aspect-3/4 bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden flex flex-col items-center justify-center text-center p-4">
              <span className="text-4xl font-black text-white/10 italic">1</span>
              <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-widest text-white/50 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Mês 1</span>
              <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-[0.2em] text-yellow-400/50">PRO+</span>
          </div>
          <div className="relative aspect-3/4 bg-neutral-800 rounded-2xl border border-yellow-400/30 overflow-hidden flex flex-col items-center justify-center text-center p-4 shadow-[0_0_20px_rgba(253,224,71,0.1)]">
              <span className="text-4xl font-black text-yellow-400/20 italic">2</span>
              <span className="absolute bottom-3 left-3 text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-black/50 px-2 py-1 rounded backdrop-blur-sm">Mês 2</span>
              <span className="absolute top-3 right-3 text-[8px] font-black uppercase tracking-[0.2em] text-yellow-400/80">PRO+</span>
          </div>
        </div>
      </GlassCard>
      
      {/* Smart Anatomy Dashboard */}
      <GlassCard>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight italic">Body Engine</h3>
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">Heatmap de Fadiga Residual</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Foco de Hoje</p>
            <p className="text-sm font-black text-yellow-400 uppercase">{currentWorkout?.title || 'Descanso'}</p>
          </div>
        </div>
        
        <Anatomy3D 
          activeGroup={currentWorkout?.muscleGroup} 
          heatMap={{ 
            [currentWorkout?.muscleGroup]: 1.0, 
            'Peito': 0.3, 
            'Tríceps': 0.2,
            'Ombro': 0.5 
          }} 
        />
      </GlassCard>

    </motion.div>
  );
}
