import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Dumbbell, Droplets, Trophy, Search, Plus, 
  ChevronRight, X, Save, Activity, Zap, FileText, 
  Settings, LogOut, ArrowLeft, Loader2, Target,
  CheckCircle2, AlertCircle, TrendingUp, UserPlus,
  Mail, Lock, Ruler, Scale as ScaleIcon, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { workoutData } from '../../data/workoutData';

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-neutral-900/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl ${className}`}>
    {children}
  </div>
);

export default function PersonalDashboard({ user, onLogout, onBack }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Student state
  const [newStudent, setNewStudent] = useState({
    name: '',
    email: '',
    password: '',
    goal: 'Bulk',
    level: 'Full Body'
  });
  
  // Nutri goals state
  const [nutriGoals, setNutriGoals] = useState({
    water_goal: 0,
    protein_goal: 0,
    level: '',
    goal: '',
    age: '',
    weight: '',
    height: ''
  });

  // Load students linked to this personal trainer
  useEffect(() => {
    fetchMyStudents();
  }, [user]);

  const fetchMyStudents = async () => {
    try {
      setLoading(true);
      // 1. Get linked student IDs from localStorage (Temporary until migrated to DB relation table)
      const savedPersonais = JSON.parse(localStorage.getItem('zyron-personais') || '[]');
      const myTrainerData = savedPersonais.find(p => p.id === user.id);
      
      if (!myTrainerData || !myTrainerData.students.length) {
        setStudents([]);
        return;
      }

      // 2. Fetch profiles for these IDs
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('id', myTrainerData.students);

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStudent = (student) => {
    setSelectedStudent(student);
    setNutriGoals({
      water_goal: student.water_goal || 0,
      protein_goal: student.protein_goal || 0,
      level: student.level || '',
      goal: student.goal || '',
      age: student.age || '',
      weight: student.weight || '',
      height: student.height || ''
    });
  };

  const handleCreateStudent = async () => {
    if (!newStudent.name || !newStudent.email || !newStudent.password) {
      return alert('Preencha nome, email e senha');
    }

    setIsCreating(true);
    try {
      // 1. Auth SignUp
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudent.email,
        password: newStudent.password,
        options: {
          data: {
            name: newStudent.name,
            role: 'USER'
          }
        }
      });

      if (authError) throw authError;
      const studentId = authData.user?.id;

      // 2. Create Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: studentId,
          name: newStudent.name,
          email: newStudent.email,
          goal: newStudent.goal,
          level: newStudent.level,
          role: 'USER'
        });

      if (profileError) throw profileError;

      // 3. Link to this Personal (localStorage for now as per project pattern)
      const savedPersonais = JSON.parse(localStorage.getItem('zyron-personais') || '[]');
      const updatedPersonais = savedPersonais.map(p => {
        if (p.id === user.id) {
          return { ...p, students: [...(p.students || []), studentId] };
        }
        return p;
      });
      localStorage.setItem('zyron-personais', JSON.stringify(updatedPersonais));

      alert('Atleta cadastrado e forjado com sucesso!');
      setShowAddStudent(false);
      setNewStudent({ name: '', email: '', password: '', goal: 'Bulk', level: 'Full Body' });
      fetchMyStudents();
    } catch (err) {
      if (err.message.includes('User already registered') || err.message.includes('already registered')) {
        try {
          // Fallback: Tentar vincular usuário existente pelo email
          const { data: existingProfile, error: searchError } = await supabase
            .from('profiles')
            .select('id, name')
            .eq('email', newStudent.email)
            .single();

          if (existingProfile) {
            const confirmLink = window.confirm(`O aluno "${existingProfile.name}" já tem conta. Deseja vinculá-lo à sua squad?`);
            if (confirmLink) {
              const savedPersonais = JSON.parse(localStorage.getItem('zyron-personais') || '[]');
              const updatedPersonais = savedPersonais.map(p => {
                if (p.id === user.id) {
                  const currentStudents = p.students || [];
                  if (currentStudents.includes(existingProfile.id)) {
                    alert('Este aluno já está na sua squad!');
                    return p;
                  }
                  return { ...p, students: [...currentStudents, existingProfile.id] };
                }
                return p;
              });
              localStorage.setItem('zyron-personais', JSON.stringify(updatedPersonais));
              alert('Aluno vinculado com sucesso!');
              setShowAddStudent(false);
              fetchMyStudents();
              return;
            }
          } else {
            alert('Este e-mail já está em uso, mas não conseguimos localizar o perfil. Verifique com o administrador.');
          }
        } catch (searchErr) {
          alert('Este e-mail já está cadastrado. Tente outro ou peça para o administrador vincular manualmente.');
        }
      } else {
        alert('Erro ao cadastrar: ' + err.message);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const updateNutriGoals = async () => {
    if (!selectedStudent) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          water_goal: parseFloat(nutriGoals.water_goal),
          protein_goal: parseFloat(nutriGoals.protein_goal),
          level: nutriGoals.level,
          goal: nutriGoals.goal,
          age: parseInt(nutriGoals.age),
          weight: parseFloat(nutriGoals.weight),
          height: parseFloat(nutriGoals.height)
        })
        .eq('id', selectedStudent.id);

      if (error) throw error;
      
      // Update local state
      setStudents(prev => prev.map(s => 
        s.id === selectedStudent.id ? { ...s, ...nutriGoals } : s
      ));
      
      alert('Ficha técnica atualizada para ' + selectedStudent.name);
    } catch (err) {
      alert('Erro ao atualizar metas: ' + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* Abstract Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neutral-900 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-yellow-400 rounded-2xl shadow-[0_0_30px_rgba(253,224,71,0.2)]">
              <Users size={32} className="text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter">Painel do Treinador</h1>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em] mt-1">
                Treinador: {user?.name || 'Coach'} ⚡ Acesso Total
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="px-6 py-3 bg-neutral-900 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-neutral-800 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <button 
              onClick={onLogout}
              className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl font-black uppercase text-[10px] tracking-widest text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <LogOut size={16} /> Sair
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List Column */}
          <div className="lg:col-span-8 space-y-6">
            <GlassCard>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-yellow-400 rounded-full" />
                  <h2 className="text-xl font-black uppercase italic tracking-tight">Minha Squad</h2>
                  <button 
                    onClick={() => setShowAddStudent(true)}
                    className="ml-4 p-2 bg-yellow-400/10 hover:bg-yellow-400 text-yellow-500 hover:text-black rounded-xl transition-all"
                    title="Cadastrar Novo Aluno"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Buscar atleta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-black/50 border border-white/5 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-bold focus:outline-none focus:border-yellow-400/50 w-64 transition-all"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 size={40} className="text-yellow-400 animate-spin mb-4" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-600">Sincronizando dados industriais...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                  <Users size={64} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm">Nenhum aluno encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredStudents.map(student => (
                    <motion.button
                      key={student.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleOpenStudent(student)}
                      className={`text-left p-5 rounded-3xl border transition-all ${
                        selectedStudent?.id === student.id 
                          ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_30px_rgba(253,224,71,0.15)] text-black' 
                          : 'bg-black/30 border-white/5 hover:border-white/20 text-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                          {student.avatar_url ? (
                            <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <span className="font-black text-xl italic">{student.name?.charAt(0) || 'U'}</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStudent?.id === student.id ? 'text-black/60' : 'text-neutral-500'}`}>Status</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Ativo</span>
                          </div>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-black uppercase italic tracking-tighter truncate mb-1">{student.name || 'Sem Nome'}</h3>
                      <p className={`text-[10px] font-bold mb-4 ${selectedStudent?.id === student.id ? 'text-black/60' : 'text-neutral-500'}`}>{student.email}</p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className={`p-2 rounded-xl ${selectedStudent?.id === student.id ? 'bg-black/10' : 'bg-white/5'}`}>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Foco</p>
                          <p className="text-[10px] font-black uppercase truncate">{student.level || 'Geral'}</p>
                        </div>
                        <div className={`p-2 rounded-xl ${selectedStudent?.id === student.id ? 'bg-black/10' : 'bg-white/5'}`}>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-60">Peso</p>
                          <p className="text-[10px] font-black uppercase">{student.weight || '--'} kg</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </GlassCard>

            {/* Quick Actions / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard className="bg-emerald-500/5 border-emerald-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <TrendingUp size={20} />
                  </div>
                  <h3 className="font-black uppercase italic tracking-tight text-emerald-500">Engajamento</h3>
                </div>
                <p className="text-3xl font-black italic">84%</p>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mt-1">Média de conclusão de treinos</p>
              </GlassCard>
              
              <GlassCard className="bg-yellow-500/5 border-yellow-500/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                    <Trophy size={20} />
                  </div>
                  <h3 className="font-black uppercase italic tracking-tight text-yellow-400">Squad Total</h3>
                </div>
                <p className="text-3xl font-black italic">{students.length}</p>
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest mt-1">Alunos sob sua gestão</p>
              </GlassCard>
            </div>
          </div>

          {/* Editor Column */}
          <div className="lg:col-span-4 space-y-6">
            <AnimatePresence mode="wait">
              {selectedStudent ? (
                <motion.div
                  key={selectedStudent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Fuel Station Editor */}
                  <GlassCard className="border-yellow-500/20">
                    <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-3">
                        <Zap size={24} className="text-yellow-400" />
                        <h2 className="text-xl font-black uppercase italic tracking-tight">Metas e Bio</h2>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Proteína (g)</label>
                          <div className="relative">
                            <Activity size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" />
                            <input 
                              type="number"
                              value={nutriGoals.protein_goal}
                              onChange={(e) => setNutriGoals({...nutriGoals, protein_goal: e.target.value})}
                              className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-black text-xl italic focus:outline-none focus:border-yellow-400 placeholder:text-neutral-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Hidratação (L)</label>
                          <div className="relative">
                            <Droplets size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                            <input 
                              type="number"
                              step="0.1"
                              value={nutriGoals.water_goal}
                              onChange={(e) => setNutriGoals({...nutriGoals, water_goal: e.target.value})}
                              className="w-full bg-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-black text-xl italic focus:outline-none focus:border-yellow-400 placeholder:text-neutral-800"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Idade</label>
                          <input 
                            type="number"
                            value={nutriGoals.age}
                            onChange={(e) => setNutriGoals({...nutriGoals, age: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Altura (cm)</label>
                          <input 
                            type="number"
                            value={nutriGoals.height}
                            onChange={(e) => setNutriGoals({...nutriGoals, height: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block text-center">Peso (kg)</label>
                          <input 
                            type="number"
                            step="0.1"
                            value={nutriGoals.weight}
                            onChange={(e) => setNutriGoals({...nutriGoals, weight: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-2 px-3 text-center font-black text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Objetivo</label>
                          <input 
                            type="text"
                            value={nutriGoals.goal}
                            onChange={(e) => setNutriGoals({...nutriGoals, goal: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 font-bold text-xs uppercase focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2 block">Foco</label>
                          <input 
                            type="text"
                            value={nutriGoals.level}
                            onChange={(e) => setNutriGoals({...nutriGoals, level: e.target.value})}
                            className="w-full bg-black/50 border border-white/5 rounded-xl py-3 px-4 font-bold text-xs uppercase focus:outline-none focus:border-yellow-400"
                          />
                        </div>
                      </div>

                      <div className="p-4 bg-neutral-900 border border-white/5 rounded-2xl">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-neutral-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Plano Alimentar</span>
                          </div>
                          <button className="text-[8px] font-black uppercase text-yellow-400 hover:underline">Z-Upload</button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-black/30 rounded-xl border border-dashed border-white/10 text-neutral-600 text-[10px] justify-center">
                          <Plus size={12} /> Vincular PDF/Imagem
                        </div>
                      </div>

                      <button 
                        onClick={updateNutriGoals}
                        disabled={isUpdating}
                        className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-3xl font-black uppercase italic tracking-widest text-sm shadow-[0_10px_40px_rgba(253,224,71,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isUpdating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        {isUpdating ? 'Salvando...' : 'Atualizar Prescrição'}
                      </button>
                    </div>
                  </GlassCard>

                  {/* Workout Assignment */}
                  <GlassCard>
                    <div className="flex items-center gap-3 mb-6">
                      <Dumbbell size={24} className="text-neutral-400" />
                      <h2 className="text-xl font-black uppercase italic tracking-tight">Prescrição</h2>
                    </div>
                    
                    <p className="text-[10px] font-bold text-neutral-500 mb-4 uppercase tracking-widest">Atribuir Ficha Inteligente</p>
                    <div className="space-y-2">
                       {Object.entries(workoutData).map(([dayKey, day]) => (
                         <div key={dayKey} className="group flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl hover:border-yellow-400/30 transition-all">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">Dia {dayKey}</span>
                              <span className="text-xs font-bold text-neutral-300">{day.title}</span>
                            </div>
                            <button className="p-2 bg-neutral-800 rounded-lg text-neutral-500 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                              <Plus size={14} />
                            </button>
                         </div>
                       ))}
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-white/5 rounded-[40px] opacity-20">
                  <Target size={48} className="mb-4" />
                  <p className="font-black uppercase tracking-widest text-sm px-10">Selecione um atleta para iniciar a gestão técnica</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal: Forjar Novo Atleta */}
      {showAddStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-[40px] w-full max-w-sm p-8 shadow-[0_0_80px_rgba(253,224,71,0.1)]"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Novo Aluno</h3>
                <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-black mt-1">Adicionar à sua base de alunos</p>
              </div>
              <button onClick={() => setShowAddStudent(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full text-neutral-400"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Users size={16} /></span>
                <input
                  type="text"
                  placeholder="Nome do Atleta"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Mail size={16} /></span>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"><Lock size={16} /></span>
                <input
                  type="password"
                  placeholder="Senha Inicial"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full bg-black/50 border border-white/5 focus:border-yellow-400 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none transition-all"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <select 
                   value={newStudent.goal}
                   onChange={(e) => setNewStudent({...newStudent, goal: e.target.value})}
                   className="bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-black uppercase text-neutral-400 focus:text-yellow-400 outline-none"
                >
                  <option value="Bulk">Bulk</option>
                  <option value="Cut">Cut</option>
                  <option value="Recomp">Recomp</option>
                </select>
                <input
                  type="text"
                  placeholder="Foco (Ex: Pernas)"
                  value={newStudent.level}
                  onChange={(e) => setNewStudent({...newStudent, level: e.target.value})}
                  className="bg-black/50 border border-white/5 rounded-xl p-3 text-xs font-black uppercase text-white outline-none"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateStudent}
              disabled={isCreating}
              className="w-full mt-8 py-5 bg-yellow-400 hover:bg-yellow-300 text-black rounded-3xl font-black uppercase italic tracking-widest text-sm shadow-[0_10px_40px_rgba(253,224,71,0.2)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={20} className="animate-spin" /> : <UserPlus size={20} />}
              {isCreating ? 'Cadastrando...' : 'Confirmar Cadastro'}
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
