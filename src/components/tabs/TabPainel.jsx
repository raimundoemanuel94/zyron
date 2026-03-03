import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Zap, Droplets, Beef, Crown, CreditCard, Flame, CheckCircle2, BellRing, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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
  const [activeNotification, setActiveNotification] = useState(null);
  const [trainedDays, setTrainedDays] = useState([]);
  const remainingProtein = Math.max(0, proteinGoal - protein);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
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

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid 406 Not Acceptable on empty results
        
      if (error) {
        // Silently ignore schema/permission errors
        return;
      }
        
      if (data) {
        setActiveNotification(data);
      }
    } catch (e) {
      // Silenced to avoid console spam
    }
  };

  const markAsRead = async () => {
    if (!activeNotification) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', activeNotification.id);
      setActiveNotification(null);
    } catch (e) {
      console.error(e);
      setActiveNotification(null);
    }
  };
  
  // Saudação dinâmica baseada na hora e frase motivacional:
  const hour = new Date().getHours();
  let greeting = 'BOA NOITE';
  if (hour >= 5 && hour < 12) greeting = 'BOM DIA';
  else if (hour >= 12 && hour < 18) greeting = 'BOA TARDE';

  const quotes = [
    "A DISCIPLINA FORJA O AÇO.",
    "BEM-VINDO À FÁBRICA DE MONSTROS.",
    "O DESCANSO TAMBÉM É TREINO.",
    "HOJE É DIA DE ESMAGAR.",
    "SÓ OS FORTES SOBREVIVEM.",
    "CADA GOTA DE SUOR CONTA."
  ];
  // Usa o dia do mês para parear a frase de forma determinística
  const quote = quotes[new Date().getDate() % quotes.length];

  // Imagem de fundo dinâmica (usando Unsplash estilizado)
  // Caso o treino contenha "Peito", "Costas", etc, poderíamos variar a URL.
  // Por enquanto uma imagem bem pesada e industrial:
  const bgImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop";

  return (
    <motion.div
      key="painel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* HEADER E DATA */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight italic">Painel de Controle</h2>
          <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <LayoutDashboard className="text-yellow-400" size={24} />
        </div>
      </div>

      {/* STREAK MOMENTUM - Dados Reais do Supabase */}
      <GlassCard className="mb-6 border-yellow-500/20 bg-neutral-900/40">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Momentum</span>
            <h3 className="text-lg font-black uppercase italic tracking-tight text-white flex items-center gap-2">
              Sequência de Treinos <Flame className="text-orange-500" size={20} fill="currentColor" />
            </h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-yellow-400 italic">{trainedDays.length}</span>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block">esta semana</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
            const isActive = trainedDays.includes(idx);
            const isToday = idx === today;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <span className={`text-[9px] font-black uppercase ${isToday ? 'text-yellow-400' : 'text-neutral-500'}`}>{day}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                  isActive 
                    ? 'bg-yellow-400 border-yellow-400 text-neutral-950 shadow-[0_0_10px_rgba(253,224,71,0.3)]' 
                    : isToday 
                      ? 'bg-neutral-900 border-yellow-400/30 text-yellow-400/50'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-700'
                }`}>
                  {isActive ? <CheckCircle2 size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>}
                </div>
              </div>
            )
          })}
        </div>
      </GlassCard>

      {/* WELCOME DASHBOARD EXPERIENCIE (HERO CARD) */}
      <div 
        className="bg-neutral-900/80 backdrop-blur-xl border border-yellow-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden group min-h-[280px] flex flex-col justify-end"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Overlay Dark Gradient Misto para garantir leitura */}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950 via-neutral-950/80 to-neutral-950/40 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        
        <div className="relative z-10 flex flex-col gap-5">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 bg-yellow-400/20 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-yellow-400/30 rounded-full backdrop-blur-sm mb-2">
              {greeting}, {user?.name?.split(' ')[0] || 'PRO'}
            </span>
            <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white leading-[1.1]">
              {quote}
            </h2>
            <p className="text-sm font-bold text-neutral-400 mt-2 tracking-wide uppercase">
              FOCO DO DIA: <span className="text-yellow-400 ml-1">{currentWorkout?.title || 'DESCANSO'}</span>
            </p>
          </div>
          
          <button 
            onClick={() => startSession(today)}
            className="group relative w-full bg-yellow-400 text-black font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(253,224,71,0.2)] hover:shadow-[0_0_40px_rgba(253,224,71,0.4)] transition-all active:scale-95 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">Iniciar Sessão <Zap size={18} fill="currentColor" className="group-hover:animate-pulse" /></span>
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none"></div>
          </button>
        </div>
      </div>

      {/* STATUS DE ASSINATURA (Migrado para o Painel) */}
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-950 to-black border border-neutral-800 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-yellow-400/50 to-transparent"></div>

        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.3em]">Status do Plano</span>
            <h3 className="text-2xl font-black text-white italic tracking-tighter mt-1">BLACK PREMIUM</h3>
          </div>
          <Crown size={24} className="text-yellow-400" />
        </div>

        <div className="flex justify-between items-end relative z-10">
          <div>
            <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest block mb-1">Próxima Renovação</span>
            <p className="text-lg font-mono font-black text-white tracking-widest">15/05/2026</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-full">
            <CreditCard size={14} className="text-yellow-400" />
            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Ativo</span>
          </div>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
           <Zap size={64} className="text-yellow-500" strokeWidth={1} />
        </div>
      </motion.div>

      {/* WIDGETS DE SAÚDE E METAS */}
      <h3 className="text-lg font-black uppercase italic tracking-tight text-white mb-2 ml-1">Metas Diárias</h3>
      <div className="grid grid-cols-2 gap-6">
        {/* Water Widget */}
        <div className="space-y-4 bg-neutral-900/40 p-4 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 relative z-10">
            <Droplets className="text-blue-400" size={18} />
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Hidratação</span>
          </div>
          <div className={`relative h-32 w-full bg-neutral-950/80 rounded-2xl border ${isHydrationAlert && water < waterGoal ? 'border-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.3)] animate-pulse' : 'border-white/5'} overflow-hidden flex items-center justify-center transition-all z-10`}>
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-900" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (Math.min(100, (water / waterGoal) * 100) / 100) * 251.2} className="text-blue-500 transition-all duration-1000" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px rgba(59,130,246,0.6))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black italic text-white">{water.toFixed(1)}<span className="text-xs text-blue-500">L</span></span>
              <span className="text-[8px] font-bold text-neutral-500 uppercase mt-1">META {waterGoal.toFixed(1)}L</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 relative z-10">
            {[0.25, 0.5].map(val => (
              <button 
                key={val}
                onClick={() => handleWaterDrink(val)}
                className="py-2 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-black hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] active:scale-95 text-neutral-400"
              >
                +{val >= 1 ? val : val.toString().substring(1)}L
              </button>
            ))}
          </div>
        </div>

        {/* Protein Widget */}
        <div className="space-y-4 bg-neutral-900/40 p-4 rounded-3xl border border-white/5 shadow-lg flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
          <div className="flex items-center gap-2 relative z-10">
            <Beef className="text-red-400" size={18} />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Proteína</span>
          </div>
          <div className="relative h-32 w-full bg-neutral-950/80 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center z-10">
            {remainingProtein === 0 && (
              <div className="absolute top-2 right-2 bg-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)] z-20">
                BATEU
              </div>
            )}
            
            <svg className="w-24 h-24 transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-neutral-900" />
              <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (Math.min(100, (protein / proteinGoal) * 100) / 100) * 251.2} className="text-red-500 transition-all duration-1000" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 12px rgba(248,113,113,0.6))' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black italic text-white">{protein}<span className="text-xs text-red-500">g</span></span>
              <span className="text-[8px] font-bold text-neutral-500 uppercase mt-1">META {proteinGoal}g</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-auto relative z-10">
            {[30, 50].map(val => (
              <button 
                key={val}
                onClick={() => setProtein(protein + val)}
                className="py-2 bg-neutral-900/80 backdrop-blur-md border border-white/5 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white hover:border-red-500 transition-all hover:shadow-[0_0_15px_rgba(248,113,113,0.4)] active:scale-95 text-neutral-400"
              >
                +{val}g
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* NOTIFICATION MODAL */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed inset-x-4 bottom-24 z-50 max-w-xl mx-auto"
          >
            <div className="bg-neutral-900 border border-indigo-500/30 rounded-3xl p-6 shadow-[0_20px_50px_rgba(99,102,241,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px] pointer-events-none"></div>
              
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                    <BellRing className="text-indigo-400 animate-pulse" size={24} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Mensagem da Administração</h4>
                    <h3 className="text-lg font-black italic uppercase text-white leading-tight">{activeNotification.title}</h3>
                  </div>
                </div>
                <button 
                  onClick={markAsRead}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="relative z-10 bg-black/40 rounded-xl p-4 border border-white/5 mb-4">
                <p className="text-sm font-medium text-neutral-300 whitespace-pre-wrap leading-relaxed">
                  {activeNotification.message}
                </p>
              </div>

              <button 
                onClick={markAsRead}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
              >
                Entendido
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
