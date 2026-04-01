import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Users, TrendingUp, DollarSign, LogOut, ArrowLeft, Search, Edit2, RotateCcw, Trash2, X, AlertTriangle, Bell, Send, FileCode, Activity, Trophy, Cake, Clock, Megaphone, ChevronRight, Calendar, LayoutDashboard, CreditCard, UserCheck, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { workoutData } from '../../data/workoutData';
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import AdminFinanceiro from '../admin/AdminFinanceiro';
import AdminPersonais from '../admin/AdminPersonais';
import PersonalDashboard from '../admin/PersonalDashboard';

// Flatten all exercises from workoutData to use in the multi-select
const allExercises = Object.values(workoutData).flatMap(day => day.exercises || []).filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

export default function AdminScreen({ user, onLogout, onBack }) {
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'financeiro' | 'personais'
  
  // Modals state
  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [notificationUser, setNotificationUser] = useState(null);
  const [customPlanUser, setCustomPlanUser] = useState(null);
  const [customPlanData, setCustomPlanData] = useState({ name: 'Ficha VIP', exercises: [] });
  const [notificationData, setNotificationData] = useState({ title: '', message: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState([]);

  // ── Tier 1 States ──
  const [churnRiskUsers, setChurnRiskUsers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', message: '' });
  const [timelineUser, setTimelineUser] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchCurrentUserProfile();
      fetchUsers();
      fetchAnalytics();
      fetchChurnRisk();
      fetchLeaderboard();
      fetchBirthdays();
    };
    init();
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setCurrentUserProfile(data);
    } catch (e) {
      console.error('Erro ao buscar perfil atual:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get dates for the last 7 days
      const dates = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });

      const { data, error } = await supabase
        .from('daily_stats')
        .select('date, user_id')
        .gte('date', dates[0])
        .lte('date', dates[6]);

      if (error) throw error;

      // Map to chart data
      const chartData = dates.map(date => {
        // Formatar data para exibição ex: 15/03
        const [, month, day] = date.split('-');
        const formattedDate = `${day}/${month}`;
        
        // Contar usuários únicos naquele dia
        const usersThatDay = new Set(data.filter(d => d.date === date).map(d => d.user_id)).size;
        
        return { name: formattedDate, activeUsers: usersThatDay };
      });

      setAnalyticsData(chartData);
    } catch (error) {
      console.error("Erro ao buscar analytics:", error);
    }
  };

  // ── TIER 1: Alunos em Risco (sem treinar 7+ dias) ──
  const fetchChurnRisk = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff = sevenDaysAgo.toISOString().split('T')[0];

      // Buscar todos os profiles
      const { data: allProfiles } = await supabase.from('profiles').select('id, name, email');
      if (!allProfiles) return;

      // Buscar quem treinou nos últimos 7 dias
      const { data: recentStats } = await supabase
        .from('daily_stats')
        .select('user_id')
        .gte('date', cutoff);

      const activeIds = new Set((recentStats || []).map(s => s.user_id));
      const atRisk = allProfiles.filter(p => !activeIds.has(p.id));
      setChurnRiskUsers(atRisk);
    } catch (err) {
      console.error('Erro churn risk:', err);
    }
  };

  // ── TIER 1: Leaderboard (treinos no mês) ──
  const fetchLeaderboard = async () => {
    try {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const from = firstOfMonth.toISOString().split('T')[0];

      const { data } = await supabase
        .from('workout_logs')
        .select('user_id, id')
        .gte('created_at', from);

      if (!data) return;

      // Agrupar por user_id
      const counts = {};
      data.forEach(log => {
        counts[log.user_id] = (counts[log.user_id] || 0) + 1;
      });

      // Buscar nomes
      const userIds = Object.keys(counts);
      if (userIds.length === 0) { setLeaderboard([]); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const nameMap = {};
      (profiles || []).forEach(p => { nameMap[p.id] = p.name || 'Sem Nome'; });

      const ranked = Object.entries(counts)
        .map(([uid, count]) => ({ id: uid, name: nameMap[uid] || uid.substring(0, 8), workouts: count }))
        .sort((a, b) => b.workouts - a.workouts)
        .slice(0, 10);

      setLeaderboard(ranked);
    } catch (err) {
      console.error('Erro leaderboard:', err);
    }
  };

  // ── TIER 1: Aniversariantes do Mês ──
  const fetchBirthdays = async () => {
    try {
      const currentMonth = new Date().getMonth() + 1;
      const { data } = await supabase.from('profiles').select('id, name, email, birth_date');
      if (!data) return;

      const bdays = data.filter(p => {
        if (!p.birth_date) return false;
        const month = new Date(p.birth_date).getMonth() + 1;
        return month === currentMonth;
      }).map(p => ({
        ...p,
        day: new Date(p.birth_date).getDate()
      })).sort((a, b) => a.day - b.day);

      setBirthdays(bdays);
    } catch (err) {
      console.error('Erro birthdays:', err);
    }
  };

  // ── TIER 1: Timeline do Aluno ──
  const fetchUserTimeline = async (userId) => {
    setTimelineLoading(true);
    try {
      const { data } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      setTimelineData(data || []);
    } catch (err) {
      console.error('Erro timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleOpenTimeline = (user) => {
    setTimelineUser(user);
    fetchUserTimeline(user.id);
  };

  // ── TIER 1: Broadcast (notificar todos) ──
  const handleBroadcast = async () => {
    if (!broadcastData.title || !broadcastData.message) return alert("Preencha título e mensagem");
    setIsProcessing(true);
    try {
      const inserts = domainUsers.map(u => ({
        user_id: u.id,
        title: broadcastData.title,
        message: broadcastData.message
      }));
      const { error } = await supabase.from('notifications').insert(inserts);
      if (error) throw error;
      setShowBroadcast(false);
      setBroadcastData({ title: '', message: '' });
      alert(`Notificação enviada para ${domainUsers.length} alunos!`);
    } catch (error) {
      alert("Erro ao enviar broadcast: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Filtragem por Role (Personal vê apenas seus alunos) ──
  const getDomainUsers = () => {
    if (!currentUserProfile) return [];
    if (currentUserProfile.role === 'ADMIN') return users;
    
    try {
      const trainerData = JSON.parse(localStorage.getItem('zyron-personais') || '[]');
      // Busca vínculo por email ou nome
      const myTrainerInfo = trainerData.find(t => 
        (t.email && t.email === currentUserProfile.email) || 
        (t.name && t.name === currentUserProfile.name)
      );
      
      if (myTrainerInfo && myTrainerInfo.students) {
        return users.filter(u => myTrainerInfo.students.includes(u.id));
      }
    } catch (e) {
      console.error('Erro ao filtrar alunos do personal:', e);
    }
    return [];
  };

  const domainUsers = getDomainUsers();

  const filteredUsers = domainUsers.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    
    // Mock status based on ID
    const isActive = user.id.charCodeAt(0) % 5 !== 0; 
    
    if (filterStatus === 'active') return matchesSearch && isActive;
    if (filterStatus === 'inactive') return matchesSearch && !isActive;
    
    return matchesSearch;
  });

  const handleSaveEdit = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editUser.name,
          age: editUser.age,
          height: editUser.height,
          weight: editUser.weight,
          goal: editUser.goal,
          level: editUser.level
        })
        .eq('id', editUser.id);
      
      if (error) throw error;
      setEditUser(null);
      fetchUsers();
    } catch (error) {
      alert("Erro ao atualizar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsProcessing(true);
    try {
      // Deletar logs e stats mas manter o perfil intacto
      await supabase.from('workout_logs').delete().eq('user_id', resetUser.id);
      await supabase.from('daily_stats').delete().eq('user_id', resetUser.id);
      await supabase.from('exercise_prs').delete().eq('user_id', resetUser.id);
      
      setResetUser(null);
      alert("Progresso apagado com sucesso!");
    } catch (error) {
      alert("Erro ao resetar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deleteUser.id);
      if (error) throw error;
      setDeleteUser(null);
      fetchUsers();
    } catch (error) {
      alert("Erro ao excluir. O RLS de exclusão requer privilégios ou você só pode excluir registros vinculando API de admin.");
      setDeleteUser(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) return alert("Preencha título e mensagem");
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: notificationUser.id,
        title: notificationData.title,
        message: notificationData.message
      });
      if (error) throw error;
      setNotificationUser(null);
      setNotificationData({ title: '', message: '' });
      alert("Notificação enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignCustomPlan = async () => {
    if (!customPlanData.name || customPlanData.exercises.length === 0) return alert("Preencha o nome e selecione exercícios");
    setIsProcessing(true);
    try {
      const { error } = await supabase.from('custom_workouts').insert({
        user_id: customPlanUser.id,
        workout_name: customPlanData.name,
        exercises: customPlanData.exercises
      });
      if (error) throw error;
      setCustomPlanUser(null);
      setCustomPlanData({ name: 'Ficha VIP', exercises: [] });
      alert("Ficha personalizada enviada com sucesso!");
    } catch (error) {
      alert("Erro ao enviar ficha: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleExerciseSelection = (exerciseId) => {
    setCustomPlanData(prev => ({
      ...prev,
      exercises: prev.exercises.includes(exerciseId) 
        ? prev.exercises.filter(id => id !== exerciseId)
        : [...prev.exercises, exerciseId]
    }));
  };

  if (loading && !currentUserProfile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="text-yellow-400 animate-spin" size={48} />
      </div>
    );
  }

  if (currentUserProfile?.role === 'PERSONAL' || user?.user_metadata?.role === 'PERSONAL') {
    return <PersonalDashboard user={user} onLogout={onLogout} onBack={onBack} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-100 font-sans p-6 selection:bg-yellow-400 selection:text-black">
      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden z-0">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-600 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-yellow-600 rounded-full blur-[120px]" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 bg-neutral-900/40 backdrop-blur-md p-6 rounded-3xl border border-red-500/20 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-colors">
              <ArrowLeft size={20} className="text-neutral-400" />
            </button>
            <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/30">
              <ShieldAlert className="text-red-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">God Mode</h1>
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-[0.3em]">Painel de Controle Administrativo</p>
            </div>
          </div>
          
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-black uppercase tracking-widest text-xs transition-colors border border-red-500/20">
            <LogOut size={16} /> Encerrar Sessão
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex bg-neutral-900/50 backdrop-blur-md rounded-2xl p-1.5 border border-white/5 mb-10 gap-1">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, public: true },
            { key: 'financeiro', label: 'Financeiro', icon: CreditCard, public: currentUserProfile?.role === 'ADMIN' },
            { key: 'personais', label: 'Personais', icon: UserCheck, public: currentUserProfile?.role === 'ADMIN' },
          ].map(tab => {
            if (!tab.public) return null;
            const Icon = tab.icon;
            const active = adminTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  active
                    ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : 'text-neutral-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ══════ TAB: FINANCEIRO ══════ */}
        {adminTab === 'financeiro' && <AdminFinanceiro users={domainUsers} />}

        {/* ══════ TAB: PERSONAIS ══════ */}
        {adminTab === 'personais' && <AdminPersonais users={domainUsers} />}

        {/* ══════ TAB: DASHBOARD (conteúdo já existente) ══════ */}
        {adminTab === 'dashboard' && (
        <>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/5 rounded-full blur-2xl group-hover:bg-yellow-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Total de Alunos</p>
                <h3 className="text-4xl font-black italic text-white mt-2">{users.length}</h3>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-xl">
                <Users className="text-yellow-500" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Taxa de Retenção</p>
                <h3 className="text-4xl font-black italic text-white mt-2">94<span className="text-xl text-neutral-500">%</span></h3>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <TrendingUp className="text-emerald-500" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">MRR Estimado</p>
                <div className="flex items-end gap-3 mt-1">
                  <h3 className="text-4xl font-black italic text-white flex items-end"><span className="text-xl text-neutral-500 mb-1 mr-1">R$</span> {(users.length * 159).toLocaleString('pt-BR')}</h3>
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg mb-1 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span className="text-xs font-black text-emerald-400">+12%</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <DollarSign className="text-blue-500" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Weekly Active Users */}
        <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 mb-10 overflow-hidden relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <Activity className="text-yellow-500" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Pulso de Retenção</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Usuários Ativos (Últimos 7 Dias)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData}>
                <defs>
                  <filter id="neonGlowAdmin" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur1" />
                    <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="blur2" />
                    <feMerge>
                      <feMergeNode in="blur2" />
                      <feMergeNode in="blur1" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#525252" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10} 
                  tick={{ fontWeight: 900, fontFamily: 'monospace' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#333', borderRadius: '12px', padding: '12px', color: '#fff' }}
                  itemStyle={{ color: '#eab308', fontWeight: 900, fontSize: '14px' }}
                  labelStyle={{ color: '#737373', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900, marginBottom: '4px' }}
                  cursor={{ stroke: '#262626', strokeWidth: 2, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="activeUsers" 
                  name="Alunos Ativos"
                  stroke="#eab308" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#0a0a0a', stroke: '#eab308', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#eab308', stroke: '#0a0a0a', strokeWidth: 2 }}
                  filter="url(#neonGlowAdmin)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═══════════════ TIER 1 SECTIONS ═══════════════ */}

        {/* ── 1. Alunos em Risco (Churn) ── */}
        {churnRiskUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/5 backdrop-blur-md p-6 rounded-3xl border border-red-500/20 mb-10 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-500 via-orange-500 to-red-500" />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-xl">
                  <AlertTriangle className="text-red-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-black italic uppercase tracking-tight text-red-400">Alunos em Risco</h2>
                  <p className="text-[10px] text-red-400/60 uppercase tracking-widest font-bold">Sem treinar há 7+ dias</p>
                </div>
              </div>
              <span className="text-3xl font-black italic text-red-400">{churnRiskUsers.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
              {churnRiskUsers.slice(0, 12).map(u => (
                <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2 border border-red-500/10 group">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center text-[10px] font-black text-red-400">
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-bold text-neutral-300 truncate max-w-[120px]">{u.name || u.email?.split('@')[0]}</span>
                  </div>
                  <button
                    onClick={() => { setNotificationUser(u); setNotificationData({ title: 'Sentimos sua falta!', message: `Fala ${u.name || 'campeão'}! Faz tempo que você não treina. Vamos voltar com tudo? 💪` }); }}
                    className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Lembrar
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 2. Leaderboard + 4. Aniversariantes (2 colunas) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Leaderboard */}
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-yellow-500 via-amber-400 to-yellow-600" />
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-yellow-500/10 rounded-xl">
                <Trophy className="text-yellow-500" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Ranking do Mês</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Top Atletas — {new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
              </div>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8 font-bold">Nenhum treino registrado este mês</p>
            ) : (
              <div className="space-y-2">
                {leaderboard.map((u, i) => {
                  const medals = ['bg-yellow-500 text-black', 'bg-neutral-400 text-black', 'bg-amber-700 text-white'];
                  const medalColor = i < 3 ? medals[i] : 'bg-neutral-800 text-neutral-400';
                  return (
                    <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2.5 border border-white/5 hover:border-yellow-500/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black ${medalColor}`}>
                          {i + 1}
                        </div>
                        <span className={`text-sm font-bold ${i === 0 ? 'text-yellow-400' : 'text-neutral-300'}`}>{u.name}</span>
                      </div>
                      <span className="text-sm font-black text-yellow-500">{u.workouts} <span className="text-[9px] text-neutral-500 uppercase tracking-widest">treinos</span></span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aniversariantes */}
          <div className="bg-neutral-900/50 backdrop-blur-md p-6 rounded-3xl border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-pink-500 via-purple-500 to-pink-500" />
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-pink-500/10 rounded-xl">
                <Cake className="text-pink-400" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black italic uppercase tracking-tight text-white">Aniversariantes</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{new Date().toLocaleString('pt-BR', { month: 'long' })}</p>
              </div>
            </div>
            {birthdays.length === 0 ? (
              <p className="text-neutral-500 text-sm text-center py-8 font-bold">Nenhum aniversariante este mês</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {birthdays.map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-black/30 rounded-xl px-4 py-2.5 border border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] font-black text-pink-400">
                        🎂
                      </div>
                      <div>
                        <span className="text-sm font-bold text-neutral-300">{u.name || 'Sem Nome'}</span>
                        <p className="text-[9px] text-neutral-500 font-bold">Dia {u.day}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { setNotificationUser(u); setNotificationData({ title: '🎉 Feliz Aniversário!', message: `Parabéns ${u.name || ''}! O ZYRON deseja um dia incrível. Continue evoluindo! 🎂💪` }); }}
                      className="px-2 py-1 bg-pink-500/10 hover:bg-pink-500 text-pink-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all"
                    >
                      Parabéns
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Table */}

        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[600px]">
          <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-neutral-950/50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black italic uppercase tracking-tight text-white">Gestão de Operadores</h2>
              <button
                onClick={() => setShowBroadcast(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-black rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-yellow-500/20"
              >
                <Megaphone size={14} /> Notificar Todos
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
              {/* Filtros Rápidos */}
              <div className="flex bg-black/50 border border-white/10 rounded-lg p-1 w-full sm:w-auto">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-yellow-500 text-black shadow-sm' : 'text-neutral-500 hover:text-white'}`}
                >Todos</button>
                <button 
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'active' ? 'bg-emerald-500 text-black shadow-sm' : 'text-neutral-500 hover:text-emerald-400'}`}
                >Ativos</button>
                <button 
                  onClick={() => setFilterStatus('inactive')}
                  className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all ${filterStatus === 'inactive' ? 'bg-red-500 text-white shadow-sm' : 'text-neutral-500 hover:text-red-400'}`}
                >Inativos</button>
              </div>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Buscar aluno..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-black/50 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/20 w-full md:w-64 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center flex-col items-center h-full text-neutral-500">
                <div className="w-8 h-8 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-black uppercase tracking-widest">Carregando Banco de Dados</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex justify-center items-center h-full text-neutral-500 text-sm font-bold uppercase tracking-widest">
                Nenhum operador encontrado na base.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-neutral-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Operador (Nome)</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Email</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5">Status/Plano</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-center">Foco</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-right">Métricas</th>
                    <th className="p-4 text-[10px] font-black tracking-widest uppercase text-neutral-500 border-b border-white/5 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} onClick={() => handleOpenTimeline(u)} className="border-b border-white/5 hover:bg-white/5 transition-colors group cursor-pointer">
                      <td className="p-4 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${u.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-neutral-800 text-yellow-500 border border-yellow-500/20'}`}>
                            {u.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-200 group-hover:text-yellow-400 transition-colors uppercase text-sm">
                              {u.name || 'Sem Nome'}
                            </p>
                            <span className="text-[9px] text-neutral-500 font-black tracking-widest uppercase">
                              ID: {u.id.substring(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-neutral-400">{u.email}</td>
                      <td className="p-4">
                        {u.id.charCodeAt(0) % 5 !== 0 ? (
                          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Ativo (PRO+)
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            Inativo
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs font-bold text-neutral-300 uppercase tracking-widest bg-neutral-800 px-3 py-1 rounded-lg">
                          {u.goal || 'Geral'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold text-neutral-300 uppercase"><span className="text-yellow-500">{u.weight || '--'}</span> KG</span>
                          <span className="text-[9px] font-black text-neutral-500 tracking-widest uppercase">{u.level || 'Não def.'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setCustomPlanUser(u)} className="p-2 bg-neutral-800 hover:bg-emerald-500/20 text-neutral-400 hover:text-emerald-400 rounded-xl transition-colors" title="Atribuir Ficha">
                            <FileCode size={16} />
                          </button>
                          <button onClick={() => setNotificationUser(u)} className="p-2 bg-neutral-800 hover:bg-indigo-500/20 text-neutral-400 hover:text-indigo-400 rounded-xl transition-colors" title="Enviar Notificação">
                            <Bell size={16} />
                          </button>
                          <button onClick={() => setEditUser({...u})} className="p-2 bg-neutral-800 hover:bg-yellow-500/20 text-neutral-400 hover:text-yellow-500 rounded-xl transition-colors" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => setResetUser(u)} className="p-2 bg-neutral-800 hover:bg-blue-500/20 text-neutral-400 hover:text-blue-500 rounded-xl transition-colors" title="Zerar Progresso">
                            <RotateCcw size={16} />
                          </button>
                          {u.role !== 'ADMIN' && (
                            <button onClick={() => setDeleteUser(u)} className="p-2 bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-500 rounded-xl transition-colors" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        </>
      )}

      {/* Editar Usuário Modal */}

      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic uppercase text-white">Editar Perfil</h3>
              <button onClick={() => setEditUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Email (Apenas Leitura)</label>
                <input type="text" value={editUser.email} disabled className="w-full bg-black/50 border border-white/5 rounded-xl p-3 text-neutral-500 mt-1 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Nome</label>
                <input type="text" value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Idade</label>
                  <input type="number" value={editUser.age || ''} onChange={(e) => setEditUser({...editUser, age: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Peso (kg)</label>
                  <input type="number" step="0.1" value={editUser.weight || ''} onChange={(e) => setEditUser({...editUser, weight: parseFloat(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Altura (cm)</label>
                  <input type="number" value={editUser.height || ''} onChange={(e) => setEditUser({...editUser, height: parseInt(e.target.value)})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Foco</label>
                  <select value={editUser.goal || ''} onChange={(e) => setEditUser({...editUser, goal: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none">
                    <option value="hipertrofia">Hipertrofia</option>
                    <option value="definicao">Definição</option>
                    <option value="forca">Força Bruta</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">Nível</label>
                  <select value={editUser.level || ''} onChange={(e) => setEditUser({...editUser, level: e.target.value})} className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none">
                    <option value="iniciante">Iniciante</option>
                    <option value="intermediario">Intermediário</option>
                    <option value="avancado">Avançado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleSaveEdit} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all flex items-center justify-center min-w-[120px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset */}
      {resetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <RotateCcw className="text-blue-500" size={32} />
            </div>
            <h3 className="text-xl font-black italic uppercase text-white mb-2">Zerar Progresso?</h3>
            <p className="text-sm text-neutral-400 mb-6 font-medium">Tem certeza que deseja apagar os logs de treino, registros de PRs e água de <strong className="text-white">{resetUser.name}</strong>? Os dados de perfil serão mantidos.</p>
            <div className="flex gap-3">
              <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleConfirmReset} className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center justify-center">
                {isProcessing ? 'Apagando...' : 'Sim, Resetar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-red-500/20 rounded-3xl w-full max-w-sm p-6 shadow-[0_0_40px_rgba(220,38,38,0.1)] text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-black italic uppercase text-red-500 mb-2">Excluir Conta?</h3>
            <p className="text-sm text-neutral-400 mb-6 font-medium">Esta ação é <strong>irreversível</strong>. O perfil de <strong className="text-white">{deleteUser.name}</strong> da tabela profiles será apagado e não poderá ser desfeito.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteUser(null)} className="flex-1 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleConfirmDelete} className="flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-red-600 hover:bg-red-500 text-white transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] flex items-center justify-center">
                {isProcessing ? 'Excluindo...' : 'Excluir Conta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Notificação */}
      {notificationUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-indigo-500/20 rounded-3xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(99,102,241,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
                  <Bell size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Notificar Aluno</h3>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold mt-1">Para: {notificationUser.name}</p>
                </div>
              </div>
              <button onClick={() => setNotificationUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Título do Aviso</label>
                <input 
                  type="text" 
                  placeholder="Ex: Vencimento da Mensalidade"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({...notificationData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600" 
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Mensagem</label>
                <textarea 
                  placeholder="Ex: Fala João! Sua mensalidade vence amanhã..."
                  rows={4}
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({...notificationData, message: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-indigo-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600 resize-none" 
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setNotificationUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleSendNotification} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all flex items-center justify-center gap-2 min-w-[120px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={16} /> Enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ficha Personalizada */}
      {customPlanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-neutral-900 border border-emerald-500/20 rounded-3xl w-full max-w-2xl p-6 shadow-[0_0_40px_rgba(16,185,129,0.1)] flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <FileCode size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Criar Nova Ficha</h3>
                  <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-bold mt-1">Para: {customPlanUser.name}</p>
                </div>
              </div>
              <button onClick={() => setCustomPlanUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              <div>
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Nome da Ficha</label>
                <input 
                  type="text" 
                  value={customPlanData.name}
                  onChange={(e) => setCustomPlanData({...customPlanData, name: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-emerald-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Selecionar Exercícios</label>
                  <span className="text-xs font-black text-neutral-500 tracking-widest">{customPlanData.exercises.length} Selecionados</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allExercises.map(ex => (
                    <label 
                      key={ex.id} 
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        customPlanData.exercises.includes(ex.id) 
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white' 
                          : 'bg-black/50 border-white/5 text-neutral-400 hover:border-white/20'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={customPlanData.exercises.includes(ex.id)}
                        onChange={() => toggleExerciseSelection(ex.id)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded shadow-inner border flex items-center justify-center shrink-0 transition-colors ${
                        customPlanData.exercises.includes(ex.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-neutral-800 border-neutral-600'
                      }`}>
                        {customPlanData.exercises.includes(ex.id) && <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate">{ex.name}</span>
                        <span className="text-[9px] uppercase tracking-widest text-neutral-500">{ex.group}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end gap-3 shrink-0">
              <button onClick={() => setCustomPlanUser(null)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors text-white">Cancelar</button>
              <button disabled={isProcessing} onClick={handleAssignCustomPlan} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 min-w-[150px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><FileCode size={16} /> Salvar Ficha</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════ Modal Broadcast (Notificar Todos) ══════ */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-neutral-900 border border-yellow-500/20 rounded-3xl w-full max-w-md p-6 shadow-[0_0_40px_rgba(234,179,8,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                  <Megaphone size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-white leading-none">Broadcast</h3>
                  <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">Para: Todos ({users.length} alunos)</p>
                </div>
              </div>
              <button onClick={() => setShowBroadcast(false)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Título</label>
                <input
                  type="text"
                  placeholder="Ex: Nova ficha disponível!"
                  value={broadcastData.title}
                  onChange={(e) => setBroadcastData({...broadcastData, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Mensagem</label>
                <textarea
                  placeholder="Ex: A partir de hoje, todos os alunos têm acesso à ficha atualizada..."
                  rows={4}
                  value={broadcastData.message}
                  onChange={(e) => setBroadcastData({...broadcastData, message: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 focus:border-yellow-500 rounded-xl p-3 text-white mt-1 outline-none transition-colors placeholder:text-neutral-600 resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowBroadcast(false)} className="px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs bg-neutral-800 hover:bg-neutral-700 transition-colors">Cancelar</button>
              <button disabled={isProcessing} onClick={handleBroadcast} className="px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.2)] transition-all flex items-center justify-center gap-2 min-w-[150px]">
                {isProcessing ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <><Megaphone size={16} /> Enviar para Todos</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* ══════ Modal Timeline do Aluno ══════ */}
      <AnimatePresence>
        {timelineUser && (
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
              className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/10 rounded-xl text-yellow-400">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-white leading-none">Timeline</h3>
                    <p className="text-[10px] text-yellow-400 uppercase tracking-widest font-bold mt-1">{timelineUser.name || timelineUser.email} — Últimos 30 treinos</p>
                  </div>
                </div>
                <button onClick={() => setTimelineUser(null)} className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-full"><X size={20} /></button>
              </div>

              {/* Perfil Summary Area */}
              <div className="grid grid-cols-3 gap-2 mb-6 shrink-0">
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Peso Atual</p>
                   <p className="text-sm font-black text-yellow-400">{timelineUser.weight || '--'} kg</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Objetivo</p>
                   <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter truncate">{timelineUser.goal || 'Geral'}</p>
                </div>
                <div className="bg-black/30 rounded-2xl p-3 border border-white/5 text-center">
                   <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest mb-1">Foco</p>
                   <p className="text-sm font-black text-indigo-400 uppercase tracking-tighter truncate">{timelineUser.level || 'Full Body'}</p>
                </div>
              </div>

              {/* Quick Docs (Dieta) */}
              <div className="mb-6 shrink-0">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <FileCode size={12} className="text-neutral-500" />
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Documentos & Dieta</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                   <button className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold text-red-400 whitespace-nowrap">
                     <FileText size={14} /> Plano Alimentar.pdf
                   </button>
                   <button className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] font-bold text-blue-400 whitespace-nowrap">
                     <Activity size={14} /> Exames.pdf
                   </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3 px-1">
                <Dumbbell size={12} className="text-neutral-500" />
                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Histórico de Treinos</span>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {timelineLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
                  </div>
                ) : timelineData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-neutral-500">
                    <Calendar size={40} className="mb-3 opacity-30" />
                    <p className="text-sm font-bold uppercase tracking-widest">Nenhum treino registrado</p>
                  </div>
                ) : (
                  timelineData.map((log, i) => {
                    const date = new Date(log.created_at);
                    const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                    const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const durMin = log.duration_seconds ? Math.floor(log.duration_seconds / 60) : '—';
                    const setsCount = log.total_sets || log.sets_count || '—';

                    return (
                      <motion.div
                        key={log.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 bg-black/30 rounded-xl px-4 py-3 border border-white/5 hover:border-yellow-500/20 transition-colors"
                      >
                        {/* Date pill */}
                        <div className="flex flex-col items-center min-w-[44px]">
                          <span className="text-sm font-black text-yellow-400">{dayStr}</span>
                          <span className="text-[9px] text-neutral-500 font-bold">{timeStr}</span>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-10 bg-white/10" />

                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-neutral-300 uppercase tracking-wider">
                              Treino {log.workout_key || ''}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-1">
                            <span className="text-[10px] text-neutral-500 font-bold">
                              ⏱ {durMin}min
                            </span>
                            <span className="text-[10px] text-neutral-500 font-bold">
                              💪 {setsCount} séries
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
    </div>
  );
}
