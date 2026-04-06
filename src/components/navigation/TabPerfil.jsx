import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, FileText, Download, Flame, CheckCircle2, Trophy, TimerIcon, Play, LogOut, QrCode, ArrowBigUp, Camera, User, Music, Search, Heart, Target, Ruler, Weight, Calendar, Activity, Zap, Info, Edit3, ChevronRight, TrendingUp, Droplet, Dumbbell, Award, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { profileService } from '../../core/profile/profileService';
import { useMusic } from '../../contexts/MusicContext';
import { C, Card, Btn, Badge } from '../../styles/ds';

export default function TabPerfil({
  user,
  profile,
  updateProfile,
  today,
  voiceTimerActive,
  toggleVoiceTimer,
  formatPlankTime,
  plankTime,
  onLogout,
  onAvatarUpdate,
  stats,
  metrics
}) {
  const [perfilTab, setPerfilTab] = useState('geral');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Estados para edição
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  const { searchMusic, setPlaylist, loadVideoById } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([
    { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' },
    { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio - Relax', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg' },
  ]);
  const [isSearching, setIsSearching] = useState(false);

  React.useEffect(() => {
    if (user?.avatar_url && !avatarUrl) setAvatarUrl(user.avatar_url);
  }, [user?.avatar_url]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchMusic(searchQuery);
      setSearchResults(results);
    } catch (err) { console.error(err); }
    finally { setIsSearching(false); }
  };

  const playSelectedTrack = (track) => { setPlaylist(searchResults); loadVideoById(track); };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl + '?t=' + Date.now();

      // Single official path: update profile in Supabase
      await updateProfile({ avatarUrl: publicUrl });

      setAvatarUrl(publicUrl);
      if (onAvatarUpdate) onAvatarUpdate(publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar foto. Verifique se o bucket "avatars" existe no Supabase Storage.');
    } finally { setUploading(false); }
  };

  // Funções de edição
  const openEditModal = (field, currentValue) => {
    setEditingField(field);
    setEditValue(String(currentValue || ''));
  };

  const closeEditModal = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (!editingField || !updateProfile) return;
    setEditLoading(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      let updateData = {};

      switch (editingField) {
        case 'age':
          updateData = { bio: { ...profile?.bio, age: parseInt(editValue) } };
          break;
        case 'gender':
          updateData = { bio: { ...profile?.bio, gender: editValue } };
          break;
        case 'height':
          updateData = { bio: { ...profile?.bio, heightCm: parseInt(editValue) } };
          break;
        case 'weight':
          updateData = { bio: { ...profile?.bio, weightKg: parseFloat(editValue) } };
          break;
        case 'target':
          updateData = { goals: { ...profile?.goals, target: editValue } };
          break;
        case 'level':
          updateData = { goals: { ...profile?.goals, level: editValue } };
          break;
        case 'frequency':
          updateData = { goals: { ...profile?.goals, frequencyPerWeek: parseInt(editValue) } };
          break;
        case 'targetWeight':
          updateData = { goals: { ...profile?.goals, targetWeightKg: parseFloat(editValue) } };
          break;
        case 'observations':
          updateData = { bio: { ...profile?.bio, observations: editValue } };
          break;
        case 'medicalHistory':
          updateData = { bio: { ...profile?.bio, medicalHistory: editValue } };
          break;
        case 'injuries':
          updateData = { bio: { ...profile?.bio, injuries: editValue } };
          break;
        case 'restrictions':
          updateData = { bio: { ...profile?.bio, restrictions: editValue } };
          break;
        default:
          updateData = { [editingField]: editValue };
      }

      // Call updateProfile and await result
      const success = await updateProfile(updateData);

      if (success) {
        setEditSuccess('✓ Salvo com sucesso!');
        // Auto-close modal after brief success message
        setTimeout(() => {
          closeEditModal();
        }, 800);
      } else {
        throw new Error('Falha ao atualizar perfil');
      }
    } catch (err) {
      console.error('Erro ao salvar:', err);
      const errorMsg = err.message || 'Erro ao salvar alteração. Tente novamente.';
      setEditError(errorMsg);
      // Auto-hide error after 3 seconds
      setTimeout(() => {
        setEditError(null);
      }, 3000);
    } finally {
      setEditLoading(false);
    }
  };

  const tabs = [
    { id: 'geral', label: 'GERAL' },
    { id: 'docs', label: 'DOCS' },
    { id: 'financeiro', label: 'PIX' },
    { id: 'music', label: 'MÚSICA' },
  ];

  return (
    <motion.div
      key="perfil"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-4 pb-10"
    >
      <div className="flex gap-1.5 p-1 rounded-[16px]"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {tabs.map(t => (
          <motion.button
            key={t.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => setPerfilTab(t.id)}
            className="flex-1 py-2.5 rounded-[12px] text-[10px] font-black uppercase tracking-widest transition-all"
            style={perfilTab === t.id
              ? { background: C.neon, color: '#000' }
              : { background: 'transparent', color: C.textSub }
            }
          >
            {t.label}
          </motion.button>
        ))}
      </div>

      {perfilTab === 'geral' && (
        <div className="space-y-4">
          {/* Dados Editáveis */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'IDADE', value: profile?.bio?.age || 25, icon: Calendar, editable: true, field: 'age', type: 'number' },
              { label: 'SEXO', value: profile?.bio?.gender === 'male' ? 'MASC' : 'FEM', icon: User, editable: true, field: 'gender', type: 'select', options: ['MASC', 'FEM'] },
              { label: 'ALTURA', value: `${profile?.bio?.heightCm || 175}cm`, icon: Ruler, editable: true, field: 'height', type: 'number', suffix: 'cm' },
              { label: 'PESO', value: `${profile?.bio?.weightKg || 75}kg`, icon: Weight, editable: true, field: 'weight', type: 'number', suffix: 'kg' },
              { label: 'OBJETIVO', value: profile?.goals?.target || 'Hipertrofia', icon: Target, editable: true, field: 'target', type: 'select', options: ['Hipertrofia', 'Definição', 'Manutenção', 'Força'] },
              { label: 'NÍVEL', value: profile?.goals?.level || 'Iniciante', icon: Award, editable: true, field: 'level', type: 'select', options: ['Iniciante', 'Intermediário', 'Avançado'] },
            ].map(({ label, value, icon: Icon, editable, field, type, options, suffix }) => (
              <motion.div 
                key={label} 
                whileTap={editable ? { scale: 0.95 } : {}}
                onClick={editable ? () => openEditModal(field, type === 'select' ? value : type === 'number' ? (suffix ? value.replace(suffix, '') : value) : value) : undefined}
                className="relative rounded-[16px] overflow-hidden transition-all"
                style={{ 
                  ...Card.style, 
                  padding: '12px',
                  cursor: editable ? 'pointer' : 'default',
                  ...(editable && { '&:hover': { border: `1px solid ${C.neonBorder}` } })
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-[8px]"
                    style={{ background: 'rgba(205,255,90,0.10)', border: `1px solid ${C.neonBorder}` }}>
                    <Icon size={12} style={{ color: C.neon }} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>{label}</span>
                  {editable && (
                    <Edit3 size={10} className="ml-auto" style={{ color: C.textSub }} />
                  )}
                </div>
                <p className="text-[14px] font-black text-white leading-none">{value}</p>
              </motion.div>
            ))}
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
                <Target size={15} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>METAS DO PLANO</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Nutrição</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Droplet size={16} style={{ color: '#3B82F6' }} />
                <div>
                  <p className="text-[10px] font-medium text-neutral-400">Água</p>
                  <p className="text-[14px] font-black text-white">{metrics?.waterGoalLiters || 3.5}L</p>
                  <p className="text-[8px] text-neutral-500">Baseado no seu peso</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Dumbbell size={16} style={{ color: '#10B981' }} />
                <div>
                  <p className="text-[10px] font-medium text-neutral-400">Proteína</p>
                  <p className="text-[14px] font-black text-white">{metrics?.proteinGoalG || 150}g</p>
                  <p className="text-[8px] text-neutral-500">Baseado no seu objetivo</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Flame size={16} style={{ color: '#F59E0B' }} />
                <div>
                  <p className="text-[10px] font-medium text-neutral-400">Calorias</p>
                  <p className="text-[14px] font-black text-white">{metrics?.caloriesGoalKcal || 2500}</p>
                  <p className="text-[8px] text-neutral-500">Baseado no seu perfil</p>
                </div>
              </div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                onClick={() => openEditModal('frequency', profile?.goals?.frequencyPerWeek || 3)}
                className="flex items-center gap-3 px-3 py-3 rounded-[14px cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <Calendar size={16} style={{ color: '#8B5CF6' }} />
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-neutral-400">Frequência</p>
                  <p className="text-[14px] font-black text-white">{profile?.goals?.frequencyPerWeek || 3}x/semana</p>
                </div>
                <Edit3 size={12} style={{ color: C.textSub }} />
              </motion.div>
            </div>
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>RITMO DE TREINO</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Aderência</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.20)' }}>
                <Flame size={15} style={{ color: '#FB923C' }} />
              </div>
            </div>

            <div className="flex justify-between items-center mb-4">
              {['D','S','T','Q','Q','S','S'].map((day, idx) => {
                const isActive = idx < (stats?.weeklyTrainedDays || 0);
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[8px] font-black uppercase" style={{ color: C.textSub }}>{day}</span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] transition-all"
                      style={isActive
                        ? { background: C.neon, boxShadow: `0 0 12px rgba(205,255,90,0.25)` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                      }>
                      {isActive
                        ? <CheckCircle2 size={14} strokeWidth={2.5} style={{ color: '#000' }} />
                        : <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                      }
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[16px] font-black text-white">{stats?.weeklyTrainedDays || 0}/{stats?.weeklyTargetDays || 0}</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Dias/Semana</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-black text-white">{stats?.currentStreak || 0}</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Streak</p>
              </div>
              <div className="text-center">
                <p className="text-[16px] font-black text-white">{stats?.monthlyWorkouts || 0}</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Treinos/Mês</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>EVOLUÇÃO CORPORAL</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Progresso</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}>
                <TrendingUp size={15} style={{ color: '#10B981' }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[16px] font-black text-white">{metrics?.bmi || 23.5}</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">IMC</p>
                <p className="text-[7px] text-neutral-500">Calculado</p>
              </div>
              <motion.div 
                whileTap={{ scale: 0.95 }}
                onClick={() => openEditModal('targetWeight', profile?.goals?.targetWeightKg || 78)}
                className="text-center cursor-pointer"
              >
                <p className="text-[16px] font-black text-white">{profile?.goals?.targetWeightKg || 78}kg</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Peso Meta</p>
                <Edit3 size={10} className="mx-auto mt-1" style={{ color: C.textSub }} />
              </motion.div>
              <div className="text-center">
                <p className="text-[16px] font-black text-white">85%</p>
                <p className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest">Progresso</p>
                <p className="text-[7px] text-neutral-500">Calculado</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>PRANCHA ISOMÉTRICA</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">ZYRON Voz Ativa</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}>
                <TimerIcon size={15} className={voiceTimerActive ? 'animate-pulse' : ''} style={{ color: C.purple }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[42px] font-black text-white font-mono leading-none">
                {formatPlankTime(plankTime)}
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleVoiceTimer}
                className="flex h-16 w-16 items-center justify-center rounded-full transition-all"
                style={voiceTimerActive
                  ? { background: C.redBg, border: `1px solid ${C.redBorder}`, boxShadow: `0 0 20px rgba(255,59,48,0.2)` }
                  : { background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, boxShadow: `0 0 16px rgba(139,92,246,0.2)` }
                }
              >
                {voiceTimerActive
                  ? <div className="h-5 w-5 rounded-sm" style={{ background: C.red }} />
                  : <Play size={22} fill={C.purple} style={{ color: C.purple, marginLeft: 2 }} />
                }
              </motion.button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 py-4 rounded-[18px]"
            style={Btn.danger}
          >
            <LogOut size={15} />
            <span className="text-[10.5px] font-black uppercase tracking-widest">Encerrar Sessão</span>
          </motion.button>
        </div>
      )}

      {perfilTab === 'docs' && (
        <div className="space-y-4">
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(205,255,90,0.10)', border: `1px solid ${C.neonBorder}` }}>
                <FileText size={15} style={{ color: C.neon }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>FICHA DO ALUNO</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Dados Médicos</h3>
              </div>
            </div>

            <div className="space-y-3">
              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => openEditModal('observations', profile?.bio?.observations || '')}
                className="px-3 py-3 rounded-[14px] cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>OBSERVAÇÕES</span>
                  <Edit3 size={12} style={{ color: C.textSub }} />
                </div>
                <p className="text-[12px] font-medium text-white leading-relaxed">
                  {profile?.bio?.observations || 'Nenhuma observação cadastrada.'}
                </p>
              </motion.div>

              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => openEditModal('medicalHistory', profile?.bio?.medicalHistory || '')}
                className="px-3 py-3 rounded-[14px] cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>HISTÓRICO MÉDICO</span>
                  <Edit3 size={12} style={{ color: C.textSub }} />
                </div>
                <p className="text-[12px] font-medium text-white leading-relaxed">
                  {profile?.bio?.medicalHistory || 'Nenhum histórico médico cadastrado.'}
                </p>
              </motion.div>

              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => openEditModal('injuries', profile?.bio?.injuries || '')}
                className="px-3 py-3 rounded-[14px] cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>LESÕES</span>
                  <Edit3 size={12} style={{ color: C.textSub }} />
                </div>
                <p className="text-[12px] font-medium text-white leading-relaxed">
                  {profile?.bio?.injuries || 'Nenhuma lesão cadastrada.'}
                </p>
              </motion.div>

              <motion.div 
                whileTap={{ scale: 0.98 }}
                onClick={() => openEditModal('restrictions', profile?.bio?.restrictions || '')}
                className="px-3 py-3 rounded-[14px] cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>RESTRIÇÕES</span>
                  <Edit3 size={12} style={{ color: C.textSub }} />
                </div>
                <p className="text-[12px] font-medium text-white leading-relaxed">
                  {profile?.bio?.restrictions || 'Nenhuma restrição cadastrada.'}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.20)' }}>
                <TrendingUp size={15} style={{ color: '#3B82F6' }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>EVOLUÇÃO</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Histórico</h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>HISTÓRICO DE PESO</span>
                <p className="text-[12px] font-medium text-neutral-400 mt-2">Em desenvolvimento...</p>
              </div>

              <div className="px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>MEDIDAS CORPORAIS</span>
                <p className="text-[12px] font-medium text-neutral-400 mt-2">Em desenvolvimento...</p>
              </div>

              <div className="px-3 py-3 rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSub }}>BIOIMPEDÂNCIA/FOTOS</span>
                <p className="text-[12px] font-medium text-neutral-400 mt-2">Em desenvolvimento...</p>
              </div>
            </div>
          </div>

          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: 'rgba(251,146,60,0.10)', border: '1px solid rgba(251,146,60,0.20)' }}>
                <Download size={15} style={{ color: '#FB923C' }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>ARQUIVOS</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Downloads</h3>
              </div>
            </div>

            <div className="space-y-2">
              {[
                { label: 'Plano Alimentar',        date: '12/04/2026', color: '#FF5C5C', glowRgb: '255,92,92' },
                { label: 'Exames e Bioimpedância', date: '05/03/2026', color: C.blue,    glowRgb: '125,161,255' },
              ].map(({ label, date, color, glowRgb }) => (
                <motion.div key={label} whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-between px-4 py-3.5 rounded-[18px] cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                      style={{ background: `rgba(${glowRgb},0.10)`, border: `1px solid rgba(${glowRgb},0.18)` }}>
                      <FileText size={15} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-white">{label}</p>
                      <p className="text-[8.5px] font-medium mt-0.5" style={{ color: C.textSub }}>Atualizado em {date}</p>
                    </div>
                  </div>
                  <Download size={15} style={{ color: C.textSub }} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {perfilTab === 'financeiro' && (
        <div className="space-y-3">
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}>
                <QrCode size={15} style={{ color: C.neon }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>Renovação</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">Pagamento via PIX</h3>
              </div>
            </div>
            <motion.button whileTap={{ scale: 0.97 }}
              className="w-full py-3.5 rounded-[14px] font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-2"
              style={Btn.primary}>
              Gerar Código PIX
            </motion.button>
            <motion.button whileTap={{ scale: 0.97 }}
              className="w-full mt-2 py-3 rounded-[14px] font-bold text-[10.5px] uppercase tracking-widest flex items-center justify-center"
              style={Btn.secondary}>
              Gerenciar Cartões
            </motion.button>
          </div>
        </div>
      )}

      {perfilTab === 'music' && (
        <div className="space-y-3">
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px]"
                style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}` }}>
                <Music size={15} style={{ color: C.neon }} />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: C.textSub }}>Global PWA Player</p>
                <h3 className="text-[14px] font-black text-white uppercase leading-none mt-0.5">ZYRON Radio</h3>
              </div>
            </div>

            <form onSubmit={handleSearch} className="relative mb-4">
              <input
                type="text"
                placeholder="Buscar música no YouTube…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[14px] pl-10 pr-20 py-3 text-[12px] font-medium text-white placeholder:text-neutral-600 outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2" size={14} style={{ color: C.textSub }} />
              <button type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-[10px] text-[9.5px] font-black uppercase tracking-widest"
                style={{ background: C.neon, color: '#000' }}>
                Buscar
              </button>
            </form>

            <div className="space-y-2">
              {isSearching ? (
                [1,2,3].map(i => <div key={i} className="h-14 rounded-[14px] animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />)
              ) : (
                searchResults.map((track, idx) => (
                  <motion.div key={track.id} whileTap={{ scale: 0.98 }}
                    onClick={() => playSelectedTrack(track)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-[14px] cursor-pointer group"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="relative w-10 h-10 rounded-[10px] overflow-hidden shrink-0"
                      style={{ background: 'rgba(255,255,255,0.07)' }}>
                      {track.thumbnail && <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(0,0,0,0.5)' }}>
                        <Play size={14} style={{ color: C.neon }} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black text-white truncate">{track.title}</h4>
                      <p className="text-[8.5px] font-medium mt-0.5 uppercase tracking-widest" style={{ color: C.textSub }}>YouTube Audio</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Edição */}
      <AnimatePresence>
        {editingField && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeEditModal}
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-sm"
            >
              <div className="relative rounded-[24px] overflow-hidden" style={{ ...Card.style, padding: '24px' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[16px] font-black text-white uppercase tracking-wider">
                    {editingField === 'age' && 'IDADE'}
                    {editingField === 'gender' && 'SEXO'}
                    {editingField === 'height' && 'ALTURA'}
                    {editingField === 'weight' && 'PESO'}
                    {editingField === 'target' && 'OBJETIVO'}
                    {editingField === 'level' && 'NÍVEL'}
                    {editingField === 'frequency' && 'FREQUÊNCIA'}
                    {editingField === 'targetWeight' && 'PESO META'}
                    {editingField === 'observations' && 'OBSERVAÇÕES'}
                    {editingField === 'medicalHistory' && 'HISTÓRICO MÉDICO'}
                    {editingField === 'injuries' && 'LESÕES'}
                    {editingField === 'restrictions' && 'RESTRIÇÕES'}
                  </h3>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={closeEditModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                  >
                    <X size={16} style={{ color: C.textSub }} />
                  </motion.button>
                </div>

                {/* Input */}
                <div className="mb-6">
                  {(editingField === 'gender' || editingField === 'target' || editingField === 'level') ? (
                    <select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] font-medium text-white bg-neutral-900 border border-neutral-700 outline-none focus:border-neon transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {editingField === 'gender' && (
                        <>
                          <option value="male">Masculino</option>
                          <option value="female">Feminino</option>
                        </>
                      )}
                      {editingField === 'target' && (
                        <>
                          <option value="Hipertrofia">Hipertrofia</option>
                          <option value="Definição">Definição</option>
                          <option value="Manutenção">Manutenção</option>
                          <option value="Força">Força</option>
                        </>
                      )}
                      {editingField === 'level' && (
                        <>
                          <option value="Iniciante">Iniciante</option>
                          <option value="Intermediário">Intermediário</option>
                          <option value="Avançado">Avançado</option>
                        </>
                      )}
                    </select>
                  ) : (editingField === 'observations' || editingField === 'medicalHistory' || editingField === 'injuries' || editingField === 'restrictions') ? (
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Digite suas informações..."
                      rows={4}
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] font-medium text-white placeholder:text-neutral-600 outline-none resize-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  ) : (
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Digite o valor..."
                      className="w-full rounded-[12px] px-4 py-3 text-[14px] font-medium text-white placeholder:text-neutral-600 outline-none"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                  )}
                </div>

                {/* Feedback Messages */}
                {editError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-[12px] text-[12px] font-semibold flex items-center gap-2"
                    style={{ background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)', color: '#FF4444' }}
                  >
                    <span>✗</span>
                    <span>{editError}</span>
                  </motion.div>
                )}
                {editSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-[12px] text-[12px] font-semibold flex items-center gap-2"
                    style={{ background: 'rgba(0,255,0,0.15)', border: '1px solid rgba(0,255,0,0.3)', color: '#00FF00' }}
                  >
                    <span>✓</span>
                    <span>{editSuccess}</span>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={closeEditModal}
                    disabled={editLoading}
                    className="flex-1 py-3 rounded-[16px] font-bold text-[12px] uppercase tracking-widest"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: C.textSub }}
                  >
                    CANCELAR
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={saveEdit}
                    disabled={editLoading || editSuccess}
                    className="flex-1 py-3 rounded-[16px] font-black text-[12px] uppercase tracking-widest flex items-center justify-center gap-2"
                    style={{ background: editSuccess ? 'rgba(0,255,0,0.2)' : C.neon, color: editSuccess ? '#00FF00' : '#000' }}
                  >
                    {editLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#000 transparent transparent transparent' }} />
                        SALVANDO...
                      </>
                    ) : editSuccess ? (
                      <>
                        <span>✓</span>
                        SALVO
                      </>
                    ) : (
                      'SALVAR'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
