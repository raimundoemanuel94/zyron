import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Camera, CheckCircle, ArrowRight, X, Instagram, Download } from 'lucide-react';
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
    const fetchWeeklyStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from('workout_logs')
          .select('created_at, completed_at, ended_at, started_at, duration_seconds, duration_minutes, workout_name')
          .eq('user_id', session.user.id)
          .gte('created_at', startOfWeek.toISOString());

        const days = data
          ?.filter(log => (
            Number(log.duration_seconds) > 0
            || Number(log.duration_minutes) > 0
            || !!log.workout_name
            || !!log.ended_at
            || !!log.started_at
          ))
          .map(log => new Date(log.ended_at || log.completed_at || log.created_at).getDay()) || [];
        const todayIdx = new Date().getDay();
        if (!days.includes(todayIdx)) days.push(todayIdx);
        setTrainedDays([...new Set(days)]);
      } catch (e) {
        console.error('Failed to fetch weekly streak', e);
        setTrainedDays([new Date().getDay()]);
      }
    };

    setTrainedDays([new Date().getDay()]);
    fetchWeeklyStreak();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowCelebration(false), 2200);
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
      setIsGenerating(true);

      try {
        const stats = {
          duration: `${Math.floor(workout.duration_seconds / 60)}m ${workout.duration_seconds % 60}s`,
          sets: `${sets.length} sets`,
          dayName: getLocalizedDayName(),
          dayIndex: new Date().getDay(),
          trainedDays,
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
    if (!shareableBlob || !shareableUrl) return;

    const file = new File([shareableBlob], `zyron-pump-${Date.now()}.jpg`, { type: 'image/jpeg' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Meu treino no ZYRON',
          text: 'Mais um treino finalizado no ZYRON.',
        });
        logger.userAction('Treino compartilhado com sucesso');
      } catch (err) {
        if (err.name !== 'AbortError') logger.error('Erro ao compartilhar', {}, err);
      }
      return;
    }

    const link = document.createElement('a');
    link.href = shareableUrl;
    link.download = `zyron-pump-${Date.now()}.jpg`;
    link.click();
    logger.userAction('Download do card realizado');
  };

  const saveWorkout = async (includePhoto) => {
    setIsSaving(true);

    try {
      let photoId = null;
      if (includePhoto && photo) {
        photoId = `photo_${Date.now()}`;
        await db.savePhoto(photoId, photo);
      }

      await onFinish({
        ...workout,
        photo_id: photoId,
        photo_payload: includePhoto ? photo : null,
      }, sets);
    } catch (err) {
      logger.error('Erro ao salvar conclusao do treino', {}, err);
    } finally {
      setIsSaving(false);
    }
  };

  const clearPhoto = () => {
    setPhoto(null);
    setShareableBlob(null);
    if (shareableUrl) URL.revokeObjectURL(shareableUrl);
    setShareableUrl(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-5 text-white overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_75%_50%_at_50%_8%,rgba(244,255,58,0.10),transparent_62%)]" />

      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.12, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            className="absolute z-60 pointer-events-none"
          >
            <Trophy size={112} className="text-[#F4FF3A] drop-shadow-[0_0_26px_rgba(244,255,58,0.36)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md space-y-5 z-10"
      >
        <div className="flex flex-col items-center gap-2 pb-1">
          <img
            src="/images/zyron-logo.png"
            alt="ZYRON"
            className="w-36 h-auto object-contain"
            style={{ filter: 'drop-shadow(0 0 18px rgba(244,255,58,0.28)) brightness(1.05) saturate(0.95)' }}
          />
          <p className="text-white/55 text-[10px] font-semibold tracking-[0.22em] uppercase">
            A forca da sua evolucao.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          {['Treino Feito', 'Dados Blindados'].map(label => (
            <div key={label} className="flex items-center gap-1.5 bg-[#F4FF3A]/10 border border-[#F4FF3A]/20 rounded-xl px-3 py-1.5">
              <span className="text-[#F4FF3A] text-[10px] font-black">OK</span>
              <span className="text-[#F4FF3A] font-black text-[10px] uppercase tracking-widest">{label}</span>
            </div>
          ))}
        </div>

        <div className="bg-[rgba(13,14,16,0.86)] backdrop-blur-xl border border-white/[0.07] rounded-[18px] p-5 grid grid-cols-2 gap-4 shadow-[0_16px_42px_rgba(0,0,0,0.48)]">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Duracao</span>
            <div className="text-xl font-black">{Math.floor(workout?.duration_seconds / 60)}m {workout?.duration_seconds % 60}s</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Series Totais</span>
            <div className="text-xl font-black text-[#F4FF3A]">{sets?.length ?? 0}</div>
          </div>
        </div>

        <div className="relative group">
          <div className="aspect-square w-full bg-[rgba(12,13,15,0.94)] border border-dashed border-white/[0.12] rounded-[18px] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-[#F4FF3A]/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            {photo ? (
              <>
                <img src={shareableUrl || photo} alt="Seu fisico" className="w-full h-full object-cover" />

                {isGenerating && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-4 border-[#F4FF3A] border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#F4FF3A]">Estilizando Card...</span>
                  </div>
                )}

                <button
                  onClick={clearPhoto}
                  className="absolute top-4 right-4 p-2 bg-black/55 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-all z-20"
                >
                  <X size={16} />
                </button>
              </>
            ) : (
              <label className="flex flex-col items-center gap-4 cursor-pointer p-12 text-center">
                <div className="p-4 bg-[#F4FF3A]/10 rounded-full border border-[#F4FF3A]/20">
                  <Camera size={32} className="text-[#F4FF3A]" />
                </div>
                <div className="space-y-1">
                  <span className="font-black uppercase text-sm tracking-[0.08em]">Registrar Progresso</span>
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Capture seu pump para o historico</p>
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

        <div className="space-y-4 pt-2">
          <AnimatePresence>
            {photo && !isGenerating && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                onClick={handleShare}
                className="w-full h-14 rounded-[16px] bg-white/[0.06] border border-white/[0.08] text-white flex items-center justify-center gap-3 font-black uppercase tracking-[0.08em] text-[13px] active:scale-95 transition-all"
              >
                <Instagram size={18} />
                Compartilhar Card
              </motion.button>
            )}
          </AnimatePresence>

          <button
            onClick={() => saveWorkout(true)}
            disabled={isSaving}
            className={`w-full h-16 rounded-[16px] flex items-center justify-center gap-3 font-black uppercase tracking-[0.10em] text-[14px] transition-all ${
              isSaving ? 'bg-neutral-800 text-neutral-500' : 'bg-[#F4FF3A] text-neutral-950 shadow-[0_0_24px_rgba(244,255,58,0.30)] active:scale-95'
            }`}
          >
            {isSaving ? 'SINCRONIZANDO...' : (
              <>
                Salvar Treino <ArrowRight size={22} />
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
              onClick={() => saveWorkout(false)}
              disabled={isSaving}
              className="flex flex-col items-center gap-1 text-neutral-500 hover:text-white transition-colors disabled:opacity-30"
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
