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
        <div className="space-y-3">

          {/* ── 1. DADOS PESSOAIS ─────────────────────────────────────────── */}
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="absolute top-0 left-[25%] right-[25%] h-px" style={{ background: `linear-gradient(90deg,transparent,${C.neonBorder},transparent)` }} />
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: C.neonDim }}>Dados Pessoais</p>
              <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: C.neonBg, border: `1px solid ${C.neonBorder}`, color: C.neon }}>Editável</span>
            </div>
            {/* Bio row: idade · sexo · altura */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { label: 'Idade', value: profile?.bio?.age || 25, field: 'age', type: 'number', icon: Calendar },
                { label: 'Sexo', value: profile?.bio?.gender === 'male' ? 'MASC' : profile?.bio?.gender === 'female' ? 'FEM' : 'N/D', field: 'gender', type: 'select', icon: User },
                { label: 'Altura', value: `${profile?.bio?.heightCm || 175}cm`, field: 'height', type: 'number', suffix: 'cm', icon: Ruler },
              ].map(({ label, value, field, type, suffix, icon: Icon }) => (
                <motion.div key={label} whileTap={{ scale: 0.93 }}
                  onClick={() => openEditModal(field, suffix ? String(value).replace(suffix, '') : value)}
                  className="flex flex-col gap-1.5 px-3 py-3 rounded-[14px] cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between">
                    <Icon size={11} style={{ color: C.neon }} />
                    <Edit3 size={9} style={{ color: C.textMute }} />
                  </div>
                  <p className="text-[15px] font-black text-white leading-none">{value}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.textSub }}>{label}</p>
                </motion.div>
              ))}
            </div>
            {/* Training row: peso · objetivo · nível */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Peso', value: `${profile?.bio?.weightKg || 75}kg`, field: 'weight', type: 'number', suffix: 'kg', icon: Weight },
                { label: 'Objetivo', value: profile?.goals?.target || 'Hipertrofia', field: 'target', type: 'select', icon: Target },
                { label: 'Nível', value: profile?.goals?.level || 'Iniciante', field: 'level', type: 'select', icon: Award },
              ].map(({ label, value, field, type, suffix, icon: Icon }) => (
                <motion.div key={label} whileTap={{ scale: 0.93 }}
                  onClick={() => openEditModal(field, suffix ? String(value).replace(suffix, '') : value)}
                  className="flex flex-col gap-1.5 px-3 py-3 rounded-[14px] cursor-pointer"
                  style={{ background: 'rgba(205,255,90,0.04)', border: `1px solid ${C.neonBorder}` }}>
                  <div className="flex items-center justify-between">
                    <Icon size={11} style={{ color: C.neon }} />
                    <Edit3 size={9} style={{ color: C.neonDim }} />
                  </div>
                  <p className="text-[13px] font-black text-white leading-none truncate">{value}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: C.neonDim }}>{label}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── 2. METAS DIÁRIAS ──────────────────────────────────────────── */}
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: C.textSub }}>Metas Diárias</p>
              <motion.div whileTap={{ scale: 0.93 }} onClick={() => openEditModal('frequency', profile?.goals?.frequencyPerWeek || 3)}
                className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
                <Calendar size={10} style={{ color: C.purple }} />
                <span className="text-[9px] font-black" style={{ color: C.purple }}>{profile?.goals?.frequencyPerWeek || 3}×/sem</span>
                <Edit3 size={8} style={{ color: C.purple }} />
              </motion.div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Água', value: metrics?.waterGoalLiters || 3.5, unit: 'L', icon: Droplet, color: '#3B82F6', rgb: '59,130,246' },
                { label: 'Proteína', value: metrics?.proteinGoalG || 150, unit: 'g', icon: Dumbbell, color: '#10B981', rgb: '16,185,129' },
                { label: 'Calorias', value: metrics?.caloriesGoalKcal || 2500, unit: 'kcal', icon: Flame, color: '#F59E0B', rgb: '245,158,11' },
              ].map(({ label, value, unit, icon: Icon, color, rgb }) => (
                <div key={label} className="relative flex flex-col items-center justify-center py-4 rounded-[14px] overflow-hidden"
                  style={{ background: `rgba(${rgb},0.06)`, border: `1px solid rgba(${rgb},0.16)` }}>
                  <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 100%, rgba(${rgb},0.08), transparent 65%)` }} />
                  <div className="flex h-8 w-8 items-center justify-center rounded-full mb-2" style={{ background: `rgba(${rgb},0.12)`, border: `1px solid rgba(${rgb},0.22)` }}>
                    <Icon size={14} style={{ color }} />
                  </div>
                  <p className="text-[18px] font-black text-white leading-none">{value}</p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: `rgba(${rgb},0.7)` }}>{unit}</p>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider mt-1" style={{ color: C.textSub }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── 3. PROGRESSO CORPORAL ─────────────────────────────────────── */}
          {(() => {
            const cw = profile?.bio?.weightKg || 0;
            const tw = profile?.goals?.targetWeightKg || 0;
            const pct = (cw && tw && cw !== tw)
              ? Math.max(0, Math.min(99, Math.round(100 - (Math.abs(cw - tw) / Math.max(cw, tw)) * 100)))
              : (cw && tw && cw === tw) ? 100 : null;
            return (
              <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: C.textSub }}>Evolução Corporal</p>
                  <TrendingUp size={13} style={{ color: '#10B981' }} />
                </div>
                {/* Stats row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1 text-center">
                    <p className="text-[22px] font-black text-white leading-none">{metrics?.bmi || '–'}</p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: C.textSub }}>IMC</p>
                  </div>
                  <div className="w-px h-8" style={{ background: C.border }} />
                  <div className="flex-1 text-center">
                    <p className="text-[22px] font-black text-white leading-none">{cw || '–'}<span className="text-[11px] ml-0.5" style={{ color: C.textSub }}>kg</span></p>
                    <p className="text-[8px] font-bold uppercase tracking-widest mt-1" style={{ color: C.textSub }}>Atual</p>
                  </div>
                  <div className="w-px h-8" style={{ background: C.border }} />
                  <motion.div whileTap={{ scale: 0.95 }} onClick={() => openEditModal('targetWeight', tw || 78)}
                    className="flex-1 text-center cursor-pointer">
                    <p className="text-[22px] font-black leading-none" style={{ color: C.neon }}>{tw || '–'}<span className="text-[11px] ml-0.5" style={{ color: C.neonDim }}>kg</span></p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.neonDim }}>Meta</p>
                      <Edit3 size={8} style={{ color: C.neonDim }} />
                    </div>
                  </motion.div>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: C.textSub }}>Progresso até a meta</span>
                    <span className="text-[10px] font-black" style={{ color: pct !== null ? C.neon : C.textMute }}>
                      {pct !== null ? `${pct}%` : 'Configure meta'}
                    </span>
                  </div>
                  <div className="h-[5px] w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: pct !== null ? `${pct}%` : '3px' }}
                      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${C.neon}, #a8ff3e)`, boxShadow: `0 0 8px rgba(205,255,90,0.35)`, minWidth: '3px' }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── 4. ADERÊNCIA ─────────────────────────────────────────────── */}
          <div className="relative rounded-[20px] overflow-hidden" style={{ ...Card.style, padding: '16px' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.22em]" style={{ color: C.textSub }}>Aderência Semanal</p>
              <Flame size={13} style={{ color: '#FB923C' }} />
            </div>
            {/* Week strip */}
            <div className="flex justify-between items-center mb-4">
              {['D','S','T','Q','Q','S','S'].map((day, idx) => {
                const isActive = idx < (stats?.weeklyTrainedDays || 0);
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-[8px] font-black uppercase" style={{ color: C.textSub }}>{day}</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] transition-all"
                      style={isActive
                        ? { background: C.neon, boxShadow: `0 0 10px rgba(205,255,90,0.25)` }
                        : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                      }>
                      {isActive
                        ? <CheckCircle2 size={13} strokeWidth={2.5} style={{ color: '#000' }} />
                        : <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
                      }
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: `${stats?.weeklyTrainedDays || 0}/${stats?.weeklyTargetDays || 0}`, label: 'Dias/Sem' },
                { val: stats?.currentStreak || 0, label: 'Streak 🔥' },
                { val: stats?.monthlyWorkouts || 0, label: 'Mês' },
              ].map(({ val, label }) => (
                <div key={label} className="text-center py-2.5 rounded-[12px]" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[17px] font-black text-white leading-none">{val}</p>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider mt-1" style={{ color: C.textSub }}>{label}</p>
                </div>
              ))}
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
              {[
                { label: 'HISTÓRICO DE PESO', icon: '⚖️', desc: 'Gráfico de evolução do seu peso' },
                { label: 'MEDIDAS CORPORAIS', icon: '📏', desc: 'Cintura, braços, pernas e mais' },
                { label: 'BIOIMPEDÂNCIA / FOTOS', icon: '📸', desc: 'Comparativo de composição corporal' },
              ].map(({ label, icon, desc }) => (
                <div key={label} className="px-4 py-4 rounded-[14px] flex items-center gap-4"
                  style={{ background: 'rgba(205,255,90,0.03)', border: '1px dashed rgba(205,255,90,0.15)' }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] shrink-0 text-[18px]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {icon}
                  </div>
                  <div className="flex-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: C.textSub }}>{label}</span>
                    <p className="text-[11px] font-medium text-neutral-300 mt-0.5">{desc}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0"
                    style={{ background: 'rgba(205,255,90,0.10)', border: '1px solid rgba(205,255,90,0.18)', color: C.neon }}>
                    Em breve
                  </span>
                </div>
              ))}
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
                  {(editingField === 'gender' || editingField === 'target' || editingField === 'level') ? (() => {
                    const optionMap = {
                      gender: [
                        { value: 'male', label: 'Masculino', icon: '♂' },
                        { value: 'female', label: 'Feminino', icon: '♀' },
                      ],
                      target: [
                        { value: 'Hipertrofia', label: 'Hipertrofia', icon: '💪' },
                        { value: 'Definição', label: 'Definição', icon: '🔥' },
                        { value: 'Manutenção', label: 'Manutenção', icon: '⚖️' },
                        { value: 'Força', label: 'Força', icon: '🏋️' },
                      ],
                      level: [
                        { value: 'Iniciante', label: 'Iniciante', icon: '🌱' },
                        { value: 'Intermediário', label: 'Intermediário', icon: '⚡' },
                        { value: 'Avançado', label: 'Avançado', icon: '🔱' },
                      ],
                    };
                    const opts = optionMap[editingField] || [];
                    return (
                      <div className="flex flex-col gap-2">
                        {opts.map(opt => {
                          const isSelected = editValue === opt.value;
                          return (
                            <motion.button
                              key={opt.value}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setEditValue(opt.value)}
                              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-left transition-all"
                              style={isSelected
                                ? { background: 'rgba(205,255,90,0.10)', border: `1px solid ${C.neonBorder}`, boxShadow: `0 0 14px rgba(205,255,90,0.08)` }
                                : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }
                              }
                            >
                              <span className="text-[18px] leading-none">{opt.icon}</span>
                              <span className="text-[13px] font-black uppercase tracking-widest flex-1"
                                style={{ color: isSelected ? C.neon : 'rgba(255,255,255,0.75)' }}>
                                {opt.label}
                              </span>
                              <div className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={isSelected
                                  ? { background: C.neon }
                                  : { border: '1.5px solid rgba(255,255,255,0.15)' }
                                }>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    );
                  })()
                  : (editingField === 'observations' || editingField === 'medicalHistory' || editingField === 'injuries' || editingField === 'restrictions') ? (
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
