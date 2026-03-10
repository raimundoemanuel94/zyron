import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, X, Plus, Search, Dumbbell, ChevronRight, Trash2, UserPlus, Edit2, Lock, Loader2 } from 'lucide-react';
import { workoutData } from '../../data/workoutData';
import { supabase } from '../../lib/supabase';

const STORAGE_KEY = 'zyron-personais';

export default function AdminPersonais({ users = [] }) {
  const [trainers, setTrainers] = useState([]);
  const [showAddTrainer, setShowAddTrainer] = useState(false);
  const [newTrainer, setNewTrainer] = useState({ name: '', email: '', phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrainerDetail, setShowTrainerDetail] = useState(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTrainers(JSON.parse(saved));
    } catch (e) {
      console.error('Erro ao carregar personais:', e);
    }
  }, []);

  const saveTrainers = (newData) => {
    setTrainers(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  // Add trainer
  const handleAddTrainer = async () => {
    if (!newTrainer.name || !newTrainer.email || !newTrainer.password) {
      return alert('Preencha nome, email e senha do personal');
    }

    if (newTrainer.password.length < 6) {
      return alert('A senha deve ter pelo menos 6 caracteres');
    }

    setIsSubmitting(true);
    try {
      // 1. Criar conta no Auth (Nota: Isso pode enviar e-mail de confirmação dependendo do Supabase)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newTrainer.email,
        password: newTrainer.password,
        options: {
          data: {
            name: newTrainer.name,
            role: 'PERSONAL'
          }
        }
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Erro ao obter ID do usuário criado.");

      // 2. Garantir que a Role seja 'PERSONAL' na tabela profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: userId,
          role: 'PERSONAL', 
          name: newTrainer.name,
          email: newTrainer.email 
        });

      // Se der erro no update (ex: RLS), tentamos um upsert ou avisamos
      if (profileError) {
        console.warn('Erro ao atualizar role no perfil (pode ser RLS), mas a conta Auth foi criada:', profileError);
      }

      const trainer = {
        id: userId,
        name: newTrainer.name,
        email: newTrainer.email,
        phone: newTrainer.phone,
        students: [],
        createdAt: new Date().toISOString(),
      };

      saveTrainers([...trainers, trainer]);
      setNewTrainer({ name: '', email: '', phone: '', password: '' });
      setShowAddTrainer(false);
      alert('Personal cadastrado com sucesso! Ele já pode logar com este e-mail e senha.');

    } catch (err) {
      console.error('Erro ao cadastrar personal:', err);
      alert('Erro: ' + (err.message || 'Erro desconhecido ao criar conta.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove trainer
  const removeTrainer = (trainerId) => {
    if (!confirm('Remover este personal?')) return;
    saveTrainers(trainers.filter(t => t.id !== trainerId));
  };

  // Assign student to trainer
  const assignStudent = (trainerId, studentId) => {
    const updated = trainers.map(t => {
      if (t.id === trainerId) {
        if (t.students.includes(studentId)) return t;
        return { ...t, students: [...t.students, studentId] };
      }
      return t;
    });
    saveTrainers(updated);
  };

  // Remove student from trainer
  const removeStudent = (trainerId, studentId) => {
    const updated = trainers.map(t => {
      if (t.id === trainerId) {
        return { ...t, students: t.students.filter(s => s !== studentId) };
      }
      return t;
    });
    saveTrainers(updated);
  };

  // Helper: find user by id
  const findUser = (userId) => users.find(u => u.id === userId);

  // Students not yet assigned to any trainer
  const unassigned = users.filter(u =>
    !trainers.some(t => t.students.includes(u.id))
  );

  // Filter for assign modal
  const assignFilteredStudents = unassigned.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detail trainer view
  const detailTrainer = showTrainerDetail ? trainers.find(t => t.id === showTrainerDetail) : null;

  return (
    <div className="space-y-8">
      {/* Header + Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Gestão de Personais</h2>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Cadastre personal trainers e vincule alunos</p>
        </div>
        <button
          onClick={() => setShowAddTrainer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
        >
          <Plus size={16} /> Novo Personal
        </button>
      </div>

      {/* Trainers Grid */}
      {trainers.length === 0 ? (
        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 p-12 text-center">
          <Users size={48} className="mx-auto text-neutral-700 mb-4" />
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">Nenhum personal cadastrado</p>
          <p className="text-neutral-600 text-xs mt-1">Clique em "Novo Personal" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trainers.map(trainer => (
            <motion.div
              key={trainer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-neutral-900/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:border-yellow-500/20 transition-all group"
            >
              {/* Trainer Header */}
              <div className="p-5 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-400 text-sm">
                      {trainer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-white uppercase text-sm tracking-tight">{trainer.name}</h3>
                      {trainer.phone && <p className="text-[9px] text-neutral-500">{trainer.phone}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => removeTrainer(trainer.id)} className="p-1.5 bg-neutral-800 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded-lg transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Students Count + Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">
                    {trainer.students.length} aluno{trainer.students.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => { setSelectedTrainer(trainer.id); setShowAssignModal(true); setSearchTerm(''); }}
                    className="flex items-center gap-1 px-2 py-1 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-400 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    <UserPlus size={12} /> Vincular
                  </button>
                </div>

                {/* Student List (compact) */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {trainer.students.length === 0 ? (
                    <p className="text-[10px] text-neutral-600 text-center py-3">Nenhum aluno vinculado</p>
                  ) : (
                    trainer.students.map(studentId => {
                      const student = findUser(studentId);
                      if (!student) return null;
                      return (
                        <div key={studentId} className="flex items-center justify-between bg-black/30 rounded-lg px-3 py-1.5 border border-white/5 group/student">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] font-black text-neutral-400">
                              {student.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <span className="text-[11px] font-bold text-neutral-300 truncate max-w-[100px]">{student.name || student.email?.split('@')[0]}</span>
                          </div>
                          <button
                            onClick={() => removeStudent(trainer.id, studentId)}
                            className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors opacity-0 group-hover/student:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* View Details Button */}
                {trainer.students.length > 0 && (
                  <button
                    onClick={() => setShowTrainerDetail(trainer.id)}
                    className="w-full mt-3 flex items-center justify-center gap-1 py-2 bg-neutral-800/50 hover:bg-yellow-500/10 text-neutral-500 hover:text-yellow-400 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    Ver Treinos <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Adicionar Personal */}
      {showAddTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(234,179,8,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic uppercase text-white">Novo Personal</h3>
              <button onClick={() => setShowAddTrainer(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Nome *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={newTrainer.name}
                  onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Email</label>
                <input
                  type="email"
                  placeholder="joao@gmail.com"
                  value={newTrainer.email}
                  onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Senha de Acesso *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
                  <input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newTrainer.password}
                    onChange={(e) => setNewTrainer({ ...newTrainer, password: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 pl-10 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                  />
                </div>
                <p className="text-[9px] text-neutral-500 mt-1 uppercase font-bold tracking-widest">O personal usará este e-mail e senha para logar.</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                disabled={isSubmitting}
                onClick={() => setShowAddTrainer(false)} 
                className="px-5 py-2.5 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={isSubmitting}
                onClick={handleAddTrainer} 
                className="px-5 py-2.5 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : null}
                {isSubmitting ? 'Cadastrando...' : 'Cadastrar Personal'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Vincular Aluno */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-md p-6 shadow-2xl flex flex-col max-h-[80vh]"
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div>
                <h3 className="text-lg font-black italic uppercase text-white">Vincular Aluno</h3>
                <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold">
                  Para: {trainers.find(t => t.id === selectedTrainer)?.name}
                </p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={18} /></button>
            </div>

            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={14} />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-yellow-400"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {assignFilteredStudents.length === 0 ? (
                <p className="text-neutral-500 text-center py-8 text-sm font-bold">Nenhum aluno disponível</p>
              ) : (
                assignFilteredStudents.map(student => (
                  <button
                    key={student.id}
                    onClick={() => { assignStudent(selectedTrainer, student.id); }}
                    className="w-full flex items-center justify-between bg-black/30 hover:bg-yellow-500/10 border border-white/5 hover:border-yellow-500/20 rounded-xl px-4 py-3 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center font-black text-xs text-neutral-400 group-hover:text-yellow-400 transition-colors">
                        {student.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-neutral-300 group-hover:text-yellow-400 transition-colors">{student.name || 'Sem Nome'}</p>
                        <p className="text-[9px] text-neutral-500">{student.email}</p>
                      </div>
                    </div>
                    <UserPlus size={16} className="text-neutral-600 group-hover:text-yellow-400 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal Detalhe do Personal (Alunos + Treinos) */}
      <AnimatePresence>
        {detailTrainer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center font-black text-yellow-400 text-lg">
                    {detailTrainer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-white leading-none">{detailTrainer.name}</h3>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">{detailTrainer.students.length} alunos ativos</p>
                  </div>
                </div>
                <button onClick={() => setShowTrainerDetail(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                {detailTrainer.students.map(studentId => {
                  const student = findUser(studentId);
                  if (!student) return null;

                  // Get the current workout based on day
                  const today = new Date().getDay();
                  const currentWorkout = workoutData[today];

                  return (
                    <div key={studentId} className="bg-black/30 rounded-2xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-800 border border-yellow-500/20 flex items-center justify-center font-black text-xs text-yellow-400">
                            {student.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-black text-sm text-white uppercase">{student.name || 'Sem Nome'}</p>
                            <p className="text-[9px] text-neutral-500">{student.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">{student.goal || 'Geral'}</span>
                          <span className="text-[9px] font-bold text-yellow-400">{student.weight || '--'} kg</span>
                        </div>
                      </div>

                      {/* Treino do Dia */}
                      {currentWorkout && (
                        <div className="bg-neutral-900/50 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell size={14} className="text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Treino de Hoje — {currentWorkout.title}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1">
                            {currentWorkout.exercises?.slice(0, 6).map(ex => (
                              <div key={ex.id} className="text-[10px] text-neutral-400 font-bold truncate">
                                • {ex.name}
                              </div>
                            ))}
                            {currentWorkout.exercises?.length > 6 && (
                              <span className="text-[9px] text-neutral-600">+{currentWorkout.exercises.length - 6} mais</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
