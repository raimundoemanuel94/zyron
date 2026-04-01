import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Crown, FileText, Download, Flame, CheckCircle2, Trophy, TimerIcon, Play, LogOut, QrCode, ArrowBigUp, Camera, User, Music, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useMusic } from '../../contexts/MusicContext';

// Generic GlassCard component
const GlassCard = ({ children }) => (
  <div className="bg-neutral-900/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl">
    {children}
  </div>
);

export default function TabPerfil({
  user,
  today,
  voiceTimerActive,
  toggleVoiceTimer,
  formatPlankTime,
  plankTime,
  onLogout
}) {
  const [perfilTab, setPerfilTab] = useState('geral');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Music State
  const { searchMusic, setPlaylist, loadVideoById } = useMusic();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([
    // Default HQ Playlists
    { id: 'dQw4w9WgXcQ', title: 'ZYRON Hardcore Mix Vol 1', thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' },
    { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio - Relax', thumbnail: 'https://img.youtube.com/vi/jfKfPfyJRdk/default.jpg' },
  ]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]); // Limpar cache anterior para evitar crashes e stale UI
    try {
      const results = await searchMusic(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const playSelectedTrack = (track, index) => {
    setPlaylist(searchResults);
    loadVideoById(track);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${ext}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      
      // Update profile
      await supabase.from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setAvatarUrl(publicUrl);
    } catch (err) {
      console.error('Erro no upload:', err);
      alert('Erro ao enviar foto. Verifique se o bucket "avatars" existe no Supabase Storage.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      key="perfil"
      initial={{ opacity: 0, rotateX: 45 }}
      animate={{ opacity: 1, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
      className="space-y-8 pb-10"
    >
      {/* PROFILE HEADER WITH AVATAR */}
      <div className="flex items-center gap-5 mb-2">
        <div className="relative group">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl bg-neutral-800 border-2 border-yellow-500 overflow-hidden relative flex items-center justify-center group-hover:border-yellow-300 transition-all shadow-[0_0_20px_rgba(253,224,71,0.15)]"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-black text-yellow-400 italic">
                {user?.name?.charAt(0) || '?'}
              </span>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? (
                <div className="w-6 h-6 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera size={20} className="text-yellow-400" />
              )}
            </div>
          </button>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none text-white">
            {user?.name || 'ATLETA'}
          </h2>
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1">ZYRON PRO</p>
          <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mt-1">{user?.email || ''}</p>
        </div>
        <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
          <Crown className="text-yellow-400" size={28} />
        </div>
      </div>

      {/* Perfil Sub-Navigation */}
      <div className="flex gap-2 p-1 bg-neutral-900/50 rounded-2xl border border-white/5 mb-6">
        {['geral', 'docs', 'financeiro', 'music'].map(tab => (
          <button 
            key={tab}
            onClick={() => setPerfilTab(tab)}
            className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              perfilTab === tab 
                ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' 
                : 'text-neutral-500 hover:text-white'
            }`}
          >
            {tab === 'geral' ? 'Geral' : tab === 'docs' ? 'Docs' : tab === 'financeiro' ? 'PIX' : 'Música'}
          </button>
        ))}
      </div>

      {/* TAB MENSALIDADE / FINANCEIRO */}
      {perfilTab === 'music' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-yellow-400/10 rounded-2xl border border-yellow-400/20">
                <Music className="text-yellow-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">ZYRON Radio</h3>
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Global PWA Player</p>
              </div>
            </div>

            <form onSubmit={handleSearch} className="relative mb-6">
              <input 
                type="text" 
                placeholder="Buscar música no YouTube..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30 transition-all font-bold placeholder:text-neutral-600"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest bg-yellow-400 text-black px-3 py-1.5 rounded-lg hover:bg-yellow-300 transition-colors">
                Buscar
              </button>
            </form>

            <div className="space-y-3">
              {isSearching ? (
                <div className="animate-pulse flex flex-col gap-3">
                   {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl w-full" />)}
                </div>
              ) : (
                searchResults.map((track, idx) => (
                  <div 
                    key={track.id} 
                    onClick={() => playSelectedTrack(track, idx)}
                    className="flex items-center gap-4 p-3 rounded-xl bg-neutral-900 border border-white/5 hover:border-yellow-400/30 cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 overflow-hidden relative">
                      {track.thumbnail && <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play size={16} className="text-yellow-400 fill-current" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black text-white truncate">{track.title}</h4>
                      <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">YouTube Audio</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB MENSALIDADE / FINANCEIRO */}
      {perfilTab === 'financeiro' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <div className="flex items-center gap-4 mb-6">
              <QrCode className="text-yellow-400" size={24} />
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Pagamento Fácil</h3>
                <p className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">Renovação via PIX</p>
              </div>
            </div>
            <button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/20 active:scale-95">
              Gerar Código PIX <ArrowBigUp size={18} className="rotate-45" />
            </button>
            <button className="w-full mt-3 bg-transparent text-neutral-500 hover:text-white font-bold uppercase text-[10px] tracking-widest py-3 rounded-xl transition-all">
              Gerenciar Cartões de Crédito
            </button>
          </GlassCard>
        </div>
      )}

      {/* TAB DOCUMENTOS */}
      {perfilTab === 'docs' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GlassCard>
            <h3 className="text-lg font-black uppercase italic tracking-tight mb-6">Central de Arquivos</h3>
            <div className="space-y-4">
              {/* PDF 1 */}
              <div className="flex items-center justify-between p-4 bg-neutral-900/80 border border-white/5 rounded-2xl hover:border-yellow-400/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-red-500/10 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                     <FileText size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-black uppercase tracking-wider text-white">Plano Alimentar</p>
                     <p className="text-[10px] font-bold text-neutral-500 uppercase">Atualizado em 12/04/2026</p>
                   </div>
                </div>
                <Download size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
              </div>

              {/* PDF 2 */}
              <div className="flex items-center justify-between p-4 bg-neutral-900/80 border border-white/5 rounded-2xl hover:border-yellow-400/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                     <FileText size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-black uppercase tracking-wider text-white">Exames e Bioimpedância</p>
                     <p className="text-[10px] font-bold text-neutral-500 uppercase">Atualizado em 05/03/2026</p>
                   </div>
                </div>
                <Download size={18} className="text-neutral-500 group-hover:text-yellow-400 transition-colors" />
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* TAB GERAL E LOGOUT */}
      {perfilTab === 'geral' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Gamification / Streaks */}
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black uppercase italic tracking-tight">Consistência</h3>
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Treinos na Semana</p>
              </div>
              <Flame className="text-orange-500" size={24} />
            </div>
            
            <div className="flex justify-between items-center mb-6">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => {
                const isActive = idx === 1 || idx === 3 || idx === today;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2">
                    <span className="text-[9px] text-neutral-600 font-black uppercase">{day}</span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-yellow-400 border-yellow-400 text-neutral-950 shadow-[0_0_15px_rgba(253,224,71,0.3)]' 
                        : 'bg-neutral-900 border-neutral-800 text-neutral-700'
                    }`}>
                      {isActive ? <CheckCircle2 size={16} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-800"></div>}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-neutral-950 p-4 rounded-xl border border-white/5 flex items-center gap-4">
               <div className="h-12 w-12 rounded-full bg-linear-to-tr from-yellow-600 to-yellow-300 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(253,224,71,0.2)]">
                 <Trophy className="text-neutral-950" size={20} fill="currentColor" />
               </div>
               <div>
                 <h4 className="text-sm font-black text-white uppercase italic tracking-tight">Badge Gold Ativa</h4>
                 <p className="text-[10px] text-neutral-400 font-medium leading-tight">Você treinou 4 vezes na semana passada.</p>
               </div>
            </div>
          </GlassCard>

          {/* Abs & Core Legacy */}
          <GlassCard>
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-1">Prancha Isométrica</span>
                <h3 className="text-lg font-black uppercase italic tracking-tight">ZYRON Voz Ativa</h3>
              </div>
              <div className="p-3 bg-neutral-950 rounded-2xl border border-white/5">
                <TimerIcon className={`text-indigo-500 ${voiceTimerActive ? 'animate-pulse' : ''}`} size={24} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-5xl font-black text-white italic tracking-tighter font-mono">
                {formatPlankTime(plankTime)}
              </div>
              <button 
                onClick={toggleVoiceTimer}
                className={`h-20 w-20 rounded-full flex items-center justify-center text-white shadow-2xl transition-all active:scale-90 group ${
                  voiceTimerActive ? 'bg-red-600 shadow-red-500/30' : 'bg-indigo-600 shadow-indigo-500/30'
                }`}
              >
                {voiceTimerActive ? (
                  <div className="h-6 w-6 bg-white rounded-sm"></div>
                ) : (
                  <Play size={28} fill="currentColor" className="group-hover:translate-x-1 transition-transform" />
                )}
              </button>
            </div>
          </GlassCard>

          {/* Botão de Logout Centralizado */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="w-full py-5 rounded-3xl bg-neutral-900 border border-red-500/30 text-red-500 font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-red-500 hover:text-white transition-all shadow-[0_10px_30px_rgba(239,68,68,0.1)] active:scale-95"
          >
            <LogOut size={20} />
            Encerrar Sessão Segura
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
