import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Camera, Clock, ChevronRight, X, Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export default function EvolutionTimeline({ user }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, [user?.id]);

  const fetchHistory = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      logger.error('Erro ao buscar histórico de evolução', {}, err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end px-1">
        <div>
          <p className="text-yellow-400 text-xs font-black uppercase tracking-widest">Seu Progresso</p>
          <h2 className="text-3xl font-black italic text-white leading-none tracking-tighter">LINHA DO TEMPO</h2>
        </div>
        <div className="bg-yellow-400/10 p-2 rounded-2xl border border-yellow-400/20 shadow-[0_0_15px_rgba(253,224,71,0.15)]">
          <TrendingUp className="text-yellow-400" size={24} />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-xs font-black text-neutral-500 uppercase tracking-widest">Carregando Evolução...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-neutral-800">
           <Trophy size={48} className="mx-auto text-neutral-800 mb-4" />
           <p className="font-black uppercase tracking-widest text-[10px] text-neutral-600">Nenhum treino registrado ainda</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-1">
          {history.map((item) => (
            <motion.div
              key={item.id}
              layoutId={`card-${item.id}`}
              onClick={() => item.photo_url && setSelectedPhoto(item)}
              className="relative aspect-square bg-neutral-900 rounded-3xl overflow-hidden border border-white/5 active:scale-95 transition-transform cursor-pointer group"
            >
              {item.photo_url ? (
                <motion.img 
                  layoutId={`photo-${item.id}`}
                  src={item.photo_url} 
                  alt="Progresso" 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center gap-2">
                   <div className="text-neutral-700 bg-neutral-800/50 p-3 rounded-full">
                      <Clock size={20} />
                   </div>
                   <span className="text-[8px] font-black text-neutral-500 uppercase tracking-widest leading-none">Treino s/ foto</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-yellow-400 tracking-widest uppercase">{formatDate(item.created_at)}</span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase">{Math.floor(item.duration_seconds / 60)}m</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Shared Element Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPhoto(null)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            
            <motion.div
              layoutId={`card-${selectedPhoto.id}`}
              className="relative w-full max-w-lg aspect-[3/4] rounded-4xl overflow-hidden shadow-2xl border border-white/10 z-110"
            >
              <motion.img
                layoutId={`photo-${selectedPhoto.id}`}
                src={selectedPhoto.photo_url}
                className="w-full h-full object-cover"
              />
              
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
                 <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mb-0.5">Evolução ZYRON</p>
                    <h3 className="text-lg font-black italic text-white uppercase tracking-tighter">{formatDate(selectedPhoto.created_at)}</h3>
                 </div>
                 <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-md p-6 rounded-3xl border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Duração do Treino</span>
                    <p className="text-xl font-black italic">{Math.floor(selectedPhoto.duration_seconds / 60)}m {selectedPhoto.duration_seconds % 60}s</p>
                  </div>
                  <Trophy className="text-yellow-400" size={32} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
