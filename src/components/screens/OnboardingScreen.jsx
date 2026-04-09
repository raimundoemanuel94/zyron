import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, ArrowRight, ArrowLeft, X,
  Activity, Droplets, Target, Dumbbell, Zap, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { calculateMetrics } from '../../core/fitness/fitnessEngine';
import { profileService } from '../../core/profile/profileService';

export default function OnboardingScreen({ onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: 25,
    height: 175,
    weight: 75,
    goal: '',
    level: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  const handleNext = () => {
    setDirection(1);
    setStep(s => Math.min(s + 1, 4));
  };
  
  const handleBack = () => {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  };

  const updateForm = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Derived Metrics from Core Engine
  const metrics = calculateMetrics({
    bio: { 
      weightKg: formData.weight, 
      heightCm: formData.height, 
      age: formData.age, 
      gender: 'male' // Default gender for now (UI doesn't collect it yet)
    }
  });

  const getPasswordStrength = () => {
    const p = formData.password;
    if (p.length === 0) return 0;
    if (p.length < 6) return 1;
    if (p.length < 8) return 2;
    if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return 4;
    return 3;
  };

  const passwordStrength = getPasswordStrength();
  const strengthColors = ['bg-zinc-700', 'bg-red-500', 'bg-orange-500', 'bg-yellow-400', 'bg-emerald-500'];
  const strengthColor = strengthColors[passwordStrength];

  const handleFinish = async () => {
    setIsProcessing(true);
    try {
      // 1. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;

      if (userId) {
        // 2. Salvar o Profile do usuário via service
        const profileToCreate = {
          id: userId,
          name: formData.name,
          email: formData.email,
          bio: {
            age: formData.age,
            heightCm: formData.height,
            weightKg: formData.weight,
            gender: 'male' // Default
          },
          goals: {
            target: formData.goal,
            level: formData.level,
            frequencyPerWeek: 4 // Default suggestion
          }
        };

        const success = await profileService.updateProfile(userId, profileToCreate);
        
        if (!success) {
          console.error("Erro ao salvar perfil via service.");
        }
      }

      // Concluído
      setTimeout(() => {
        onComplete(formData);
      }, 1500);
      
    } catch (error) {
       console.error("Erro no cadastro:", error.message);
       alert("Erro ao criar conta: " + error.message + " (Certifique-se de desativar 'Confirm Email' no painel Auth do Supabase se estiver testando)");
       setIsProcessing(false);
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, type: 'spring', bounce: 0.2 }
    },
    exit: (dir) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    })
  };

  // Objetivos e Níveis
  const goals = [
    { id: 'hipertrofia', label: 'Hipertrofia', desc: 'Ganho de Massa Muscular', icon: Dumbbell },
    { id: 'definicao', label: 'Definição', desc: 'Queima de Gordura', icon: Activity },
    { id: 'forca', label: 'Força Bruta', desc: 'Aumento de Carga', icon: Target },
  ];

  const levels = [
    { id: 'iniciante', label: 'Iniciante', desc: '< 1 ano de treino' },
    { id: 'intermediario', label: 'Intermediário', desc: '1 a 3 anos de treino' },
    { id: 'avancado', label: 'Avançado', desc: '> 3 anos de treino' },
  ];

  return (
    <div className="fixed inset-0 min-h-screen bg-[#050505] flex flex-col p-6 pt-[calc(12px+env(safe-area-inset-top))] font-sans selection:bg-yellow-400 selection:text-black overflow-hidden z-50">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full relative z-10 flex flex-col h-full">
        {/* Header */}
        {!isProcessing && (
          <div className="flex items-center justify-between mt-4 mb-8 shrink-0">
            <button onClick={step === 1 ? onCancel : handleBack} className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 hover:text-yellow-400 transition-colors">
              {step === 1 ? <X size={24} /> : <ArrowLeft size={24} />}
            </button>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-yellow-400 shadow-[0_0_10px_rgba(253,224,71,0.5)]' : 'w-4 bg-zinc-800'}`} />
              ))}
            </div>
            <div className="w-12" /> {/* Spacer */}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* STEP 1: CREDENCIAIS */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Novo <span className="text-yellow-400">Operador</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Criação de Credenciais de Acesso</p>
                </div>
                
                <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Nome de Guerra</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="text" placeholder="Seu nome" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">E-mail</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="email" placeholder="contato@email.com" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors" size={20} />
                      <input type="password" placeholder="••••••••" value={formData.password} onChange={(e) => updateForm('password', e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 transition-all font-bold" />
                    </div>
                    {/* Password Strength */}
                    <div className="flex gap-1 mt-2 h-1.5 px-1">
                      {[1,2,3,4].map(level => (
                        <div key={level} className={`flex-1 rounded-full transition-colors duration-300 ${passwordStrength >= level ? strengthColor : 'bg-zinc-800'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 pb-4 flex justify-end">
                  <button onClick={handleNext} disabled={!formData.name || !formData.email || !formData.password} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: BIOMETRIA */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Dados <span className="text-yellow-400">Biométricos</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Calibração do Motor Interno</p>
                </div>

                <div className="space-y-6">
                  <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-8">
                    {/* Idade */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Idade</label>
                        <span className="text-2xl font-black italic text-white">{formData.age} <span className="text-xs text-zinc-500 uppercase">Anos</span></span>
                      </div>
                      <input type="range" min="14" max="80" value={formData.age} onChange={(e) => updateForm('age', parseInt(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>

                    {/* Altura */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Altura</label>
                        <span className="text-2xl font-black italic text-white">{formData.height} <span className="text-xs text-zinc-500 uppercase">cm</span></span>
                      </div>
                      <input type="range" min="140" max="220" value={formData.height} onChange={(e) => updateForm('height', parseInt(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>

                    {/* Peso */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Peso Atual</label>
                        <span className="text-2xl font-black italic text-white">{formData.weight} <span className="text-xs text-zinc-500 uppercase">kg</span></span>
                      </div>
                      <input type="range" min="40" max="150" step="0.5" value={formData.weight} onChange={(e) => updateForm('weight', parseFloat(e.target.value))} className="w-full h-2 bg-black rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                    </div>
                  </div>

                  {/* Real-time Bio-Data */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Activity size={20} className="text-yellow-400 mb-2" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seu IMC</span>
                      <span className="text-2xl font-bold font-mono text-white mt-1">{metrics.bmi || 0}</span>
                    </div>
                    <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                      <Droplets size={20} className="text-blue-400 mb-2" />
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Hidratação</span>
                      <span className="text-2xl font-bold font-mono text-white mt-1">{metrics.waterGoalLiters} <span className="text-[10px] text-zinc-500">L/dia</span></span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-8 pb-4 flex justify-end">
                  <button onClick={handleNext} className="bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PERFIL DE TREINO */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Objetivos <span className="text-yellow-400">PRO</span></h2>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Definição do Sistema de Treino</p>
                </div>

                <div className="space-y-6 overflow-y-auto pb-4 pr-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Meta Principal</label>
                    <div className="grid grid-cols-1 gap-3">
                      {goals.map(g => (
                        <button 
                          key={g.id} 
                          onClick={() => updateForm('goal', g.id)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.goal === g.id ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.2)]' : 'bg-black/50 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'}`}
                        >
                          <div className={`p-2 rounded-xl ${formData.goal === g.id ? 'bg-yellow-400 text-black' : 'bg-zinc-800'}`}>
                            <g.icon size={20} />
                          </div>
                          <div className="text-left">
                            <span className="block text-sm font-black uppercase tracking-wider">{g.label}</span>
                            <span className="block text-[10px] uppercase font-bold opacity-70 mt-0.5">{g.desc}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest ml-1">Nível de Experiência</label>
                    <div className="grid grid-cols-1 gap-3">
                      {levels.map(l => (
                        <button 
                          key={l.id} 
                          onClick={() => updateForm('level', l.id)}
                          className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${formData.level === l.id ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(253,224,71,0.4)]' : 'bg-black/50 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'}`}
                        >
                          <div className="text-left">
                            <span className="block text-sm font-black uppercase tracking-wider">{l.label}</span>
                            <span className="block text-[10px] uppercase font-bold opacity-70 mt-0.5">{l.desc}</span>
                          </div>
                          {formData.level === l.id && <CheckCircle2 size={24} />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-6 pb-4 flex justify-end shrink-0">
                  <button onClick={handleNext} disabled={!formData.goal || !formData.level} className="bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase tracking-widest text-sm px-8 py-4 rounded-xl flex items-center gap-2 shadow-[0_0_20px_rgba(253,224,71,0.3)] transition-all">
                    Avançar <ArrowRight size={18} strokeWidth={3} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESUMO & PROCESSAMENTO */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col items-center justify-center">
                
                {isProcessing ? (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center">
                    <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                      <motion.div
                        className="absolute top-0 left-0 h-full w-24 bg-linear-to-r from-transparent via-yellow-400 to-transparent blur-[1px]"
                        animate={{ x: [-100, 250] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                      />
                      <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-yellow-400 rounded-full animate-spin shadow-[0_0_30px_rgba(253,224,71,0.5)]"></div>
                      <Zap size={40} className="text-yellow-400 animate-pulse" fill="currentColor" />
                    </div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Processando Bio-Dados</h2>
                    <p className="text-[10px] text-yellow-400 font-mono uppercase tracking-[0.2em] animate-pulse">Calibrando Motor ZYRON...</p>
                  </motion.div>
                ) : (
                  <div className="w-full flex flex-col h-full">
                    <div className="mb-6 mt-4">
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Pronto para o <span className="text-yellow-400">Impacto</span></h2>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">Dossiê do Operador Finalizado</p>
                    </div>

                    <div className="bg-zinc-900/50 backdrop-blur-2xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6 flex-1">
                      <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                        <div className="w-16 h-16 bg-yellow-400 uppercase rounded-2xl flex items-center justify-center text-3xl font-black text-black">
                          {formData.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xl font-black uppercase tracking-tight text-white mb-1">{formData.name}</h3>
                          <div className="flex items-center gap-2">
                             <ShieldCheck size={14} className="text-emerald-400" />
                             <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Identidade Verificada</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">IMC Inicial</span>
                          <span className="text-xl font-mono text-white font-bold">{metrics.bmi || 0}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Hidratação / Dia</span>
                          <span className="text-xl font-mono text-blue-400 font-bold">{metrics.waterGoalLiters} L</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Meta Principal</span>
                          <span className="text-sm font-black text-yellow-400 uppercase tracking-wider">{goals.find(g => g.id === formData.goal)?.label}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1">Nível Operacional</span>
                          <span className="text-sm font-black text-white uppercase tracking-wider">{levels.find(l => l.id === formData.level)?.label}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 mb-4">
                      <button onClick={handleFinish} className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(253,224,71,0.4)] transition-all">
                        Ingressar no Sistema <Zap size={20} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
