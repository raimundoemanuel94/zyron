import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Camera, CheckCircle, Share2, ArrowRight, X, Instagram, Download } from 'lucide-react';
import { db } from '../../utils/db';
import logger from '../../utils/logger';
import { generateShareableImage, getLocalizedDayName } from '../../utils/imageGenerator';
import { supabase } from '../../lib/supabase';

export default function WorkoutCompleted({ workout, sets, onFinish }) {
  const [photo, setPhoto] = useState(null);
  const [shareableBlob, setShareableBlob] = useState(null);
  const [shareableUrl, setShareableUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);
  const [trainedDays, setTrainedDays] = useState([]);

  useEffect(() => {
    // Fetch this week's workouts to determine the streak
    const fetchWeeklyStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get the start of the current week (Sunday)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from('workout_logs')
          .select('*')
          .eq('user_id', session.user.id)
          .gte('created_at', startOfWeek.toISOString());
        
        let days = [];
        if (data && data.length > 0) {
          days = data.map(log => new Date(log.created_at).getDay());
        }
        
        // Always include today since they just finished a workout
        const todayIdx = new Date().getDay();
        if (!days.includes(todayIdx)) {
          days.push(todayIdx);
        }
        
        setTrainedDays([...new Set(days)]);
      } catch (e) {
        console.error('Failed to fetch weekly streak', e);
        setTrainedDays([new Date().getDay()]); // Fallback
      }
    };
    
    // Quick local fallback for instant render
    setTrainedDays([new Date().getDay()]);
    fetchWeeklyStreak();
  }, []);

  useEffect(() => {
    // Auto-hide large trophy after 3 seconds
    const timer = setTimeout(() => setShowCelebration(false), 3000);
    return () => {
      clearTimeout(timer);
      if (shareableUrl) URL.revokeObjectURL(shareableUrl);
    };
  }, [shareableUrl]);

  const handleCapture = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setPhoto(base64);
      
      // Generate Shareable Card
      setIsGenerating(true);
      try {
        const stats = {
          duration: `${Math.floor(workout.duration_seconds / 60)}m ${workout.duration_seconds % 60}s`,
          sets: `${sets.length} SETS`,
          dayName: getLocalizedDayName(),
          trainedDays: trainedDays
        };
        const blob = await generateShareableImage(base64, stats);
        setShareableBlob(blob);
        setShareableUrl(URL.createObjectURL(blob));
      } catch (err) {
        logger.error('Erro ao gerar card de compartilhamento', {}, err);
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleShare = async () => {
    if (!shareableBlob) return;

    const file = new File([shareableBlob], `zyron-pump-${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    // ZYRON CRASH PROTECTION: Web Share API Check
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meu Pump no ZYRON',
          text: 'Mais um treino finalizado com ZYRON Alpha Performance! 🦾🔥'
        });
        logger.userAction('Treino compartilhado com sucesso');
      } catch (err) {
        if (err.name !== 'AbortError') {
          logger.error('Erro ao compartilhar', {}, err);
        }
      }
    } else {
      // Fallback: Download
      const link = document.createElement('a');
      link.href = shareableUrl;
      link.download = `zyron-pump-${Date.now()}.jpg`;
      link.click();
      logger.userAction('Download do card realizado (Share API unsupported)');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // ZYRON CRASH PROTECTION: Ultra-safe Haptic Feedback (iOS/Safari Guard)
    try {
      if (typeof window !== 'undefined' && 
          'navigator' in window && 
          typeof navigator.vibrate === 'function') {
        navigator.vibrate([100, 30, 100]);
      }
    } catch (vibrateError) {
      console.warn('Haptic Feedback not supported/prevented:', vibrateError);
    }

    try {
      const photoId = `photo_${Date.now()}`;
      if (photo) {
        // Save large photo to IndexedDB for offline-first batch sync
        await db.savePhoto(photoId, photo);
      }

      // Finish workout with optional photoId
      await onFinish({
        ...workout,
        photo_id: photo ? photoId : null,
        photo_payload: photo // Pass directly if online, hook will decide
      }, sets);

    } catch (err) {
      logger.error('Erro ao salvar conclusão do treino', {}, err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
      {/* Glow de fundo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-yellow-400/8 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            className="absolute z-60 pointer-events-none"
          >
            <Trophy size={120} className="text-yellow-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-6 z-10"
      >
        {/* ── Logo ZYRON Gold + Slogan ── */}
        <div className="flex flex-col items-center gap-2 pb-2">
          <img
            src="/images/zyron-logo.png"
            alt="ZYRON"
            className="w-44 h-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 20px rgba(253,200,0,0.45)) brightness(1.1) saturate(1.2)' }}
          />
          <p className="text-white/60 text-xs font-light tracking-[0.25em] uppercase">
            A força da sua evolução.
          </p>
        </div>

        {/* ── Status badges ── */}
        <div className="flex gap-3 justify-center">
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-base">✓</span>
            <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">Treino Feito</span>
          </div>
          <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-base">✓</span>
            <span className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">Dados Blindados</span>
          </div>
        </div>

        {/* Stats Summary Card */}
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-5 grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Duração</span>
            <div className="text-xl font-black italic">{Math.floor(workout?.duration_seconds / 60)}m {workout?.duration_seconds % 60}s</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Séries Totais</span>
            <div className="text-xl font-black italic text-yellow-400">{sets?.length ?? 0}</div>
          </div>
        </div>

        {/* Photo/Card Capture Area */}
        <div className="relative group">
          <div className="aspect-square w-full bg-neutral-900 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-yellow-400/50">
            {photo ? (
              <>
                <img src={shareableUrl || photo} alt="Seu físico" className="w-full h-full object-cover" />
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Estilizando Card...</span>
                  </div>
                )}

                <button 
                  onClick={() => {
                    setPhoto(null);
                    setShareableBlob(null);
                    if (shareableUrl) URL.revokeObjectURL(shareableUrl);
                    setShareableUrl(null);
                  }} 
                  className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all z-20"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center">
                <div className="p-4 bg-yellow-400/10 rounded-full border border-yellow-400/20">
                  <Camera size={32} className="text-yellow-400" />
                </div>
                <div className="space-y-1">
                  <span className="font-black uppercase text-sm tracking-tighter">Registrar Progresso</span>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Capture seu pump para o histórico</p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="user" 
                  className="hidden" 
                  onChange={handleCapture}
                />
              </label>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 pt-4">
          <AnimatePresence>
            {photo && !isGenerating && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={handleShare}
                className="w-full h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
              >
                <Instagram size={20} />
                Compartilhar nos Stories
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-16 rounded-2xl flex items-center justify-center gap-3 font-black uppercase italic tracking-tighter text-xl transition-all ${
              isSaving ? 'bg-neutral-800 text-neutral-500' : 'bg-yellow-400 text-neutral-950 shadow-[0_0_30px_rgba(250,204,21,0.3)] active:scale-95'
            }`}
          >
            {isSaving ? 'SINCRONIZANDO...' : (
              <>
                SALVAR TREINO <ArrowRight size={24} />
              </>
            )}
          </button>
          
          <div className="flex justify-center gap-8">
            <button 
              onClick={handleShare}
              disabled={!photo || isGenerating}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors disabled:opacity-30"
            >
              <Download size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">Baixar Card</span>
            </button>
            <button 
              onClick={() => onFinish(workout, sets)}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors"
            >
              <CheckCircle size={20} />
              <span className="text-[8px] font-black uppercase tracking-widest">Sem Foto</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
