import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, User, AlertTriangle, Trash2, Dumbbell, Trophy } from 'lucide-react';
import { sendMessageToGemini, buildSystemPrompt } from '../../lib/gemini';
import { C, Badge } from '../../styles/ds';

const QUICK_PROMPTS = [
  { label: '🔥 Treino de Hoje',  text: 'Me dê um resumo do meu treino de hoje e dicas para maximizar o resultado.' },
  { label: '⚡ Aumentar Carga',  text: 'Quando e como devo aumentar minha carga para continuar progredindo?' },
  { label: '🎯 Metas Smart',     text: 'Baseado no meu peso e objetivo, calcule minhas metas ideais de proteína, hidratação e calorias.' },
  { label: '💧 Nutrição',        text: 'Qual a minha meta de proteína e hidratação hoje baseada no meu peso?' },
  { label: '😴 Recuperação',     text: 'Estou cansado. Devo treinar mesmo assim ou descansar? O que fazer?' },
  { label: '📈 Progresso',       text: 'Analise meus PRs e me diga se estou progredindo bem.' },
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2.5">
    <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0"
      style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}` }}>
      <Zap size={13} style={{ color: C.purple }} />
    </div>
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-[16px] rounded-bl-[4px]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-[6px] h-[6px] rounded-full"
          style={{ background: C.purple }}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.14 }} />
      ))}
    </div>
  </div>
);

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26 }}
      className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full shrink-0"
        style={isUser
          ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }
          : { background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, boxShadow: `0 0 12px rgba(139,92,246,0.18)` }
        }>
        {isUser
          ? <User size={13} style={{ color: C.textSub }} />
          : <Zap size={13} style={{ color: C.purple }} />
        }
      </div>
      <div className="max-w-[78%] px-4 py-2.5 text-[12px] font-medium leading-relaxed whitespace-pre-wrap"
        style={isUser
          ? { background: C.purple, color: '#fff', borderRadius: '16px 16px 4px 16px', fontWeight: 700 }
          : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.88)', borderRadius: '4px 16px 16px 16px' }
        }>
        {msg.text}
      </div>
    </motion.div>
  );
};

export default function TabCoach({ user, profile, metrics, prHistory, workoutData }) {
  const [messages, setMessages] = useState([{
    role: 'model',
    text: `Olá, ${profile?.name?.split(' ')[0] || 'Atleta'}! ⚡ Sou o ZYRON Coach, sua IA de alta performance.\n\nEstou com acesso ao seu perfil, treino de hoje e suas metas oficiais. Me pergunte qualquer coisa!`,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const systemPrompt = buildSystemPrompt(profile, metrics, prHistory, workoutData);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  // Keep only last 10 exchanges (20 messages) to avoid API token limits
  const MAX_HISTORY = 20;
  const buildHistory = () =>
    messages.slice(1).slice(-MAX_HISTORY).map(m => ({ role: m.role, parts: [{ text: m.text }] }));

  const handleSend = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;
    setInput('');
    setError(null);
    setShowQuickPrompts(false);
    setMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setLoading(true);
    try {
      const response = await sendMessageToGemini(buildHistory(), messageText, systemPrompt);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error('ZYRON Coach Error:', err);
      setError(err.message || 'Erro ao conectar com a IA. Verifique sua API Key.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const clearChat = () => {
    setMessages([{ role: 'model', text: `Conversa reiniciada! ⚡ Como posso ajudar, ${profile?.name?.split(' ')[0] || 'Atleta'}?` }]);
    setShowQuickPrompts(true);
    setError(null);
  };

  return (
    <motion.div
      key="coach"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col"
      style={{ minHeight: 'calc(100dvh - 180px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px]"
            style={{ background: C.purpleBg, border: `1px solid ${C.purpleBorder}`, boxShadow: `0 0 16px rgba(139,92,246,0.14)` }}>
            <Zap size={17} style={{ color: C.purple }} />
          </div>
          <div>
            <h2 className="text-[14px] font-black uppercase tracking-tight text-white leading-none">ZYRON Coach</h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: C.purple }}>IA Personal Trainer</p>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.88 }} onClick={clearChat}
          className="flex h-8 w-8 items-center justify-center rounded-[10px]"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          title="Limpar conversa">
          <Trash2 size={14} style={{ color: C.textSub }} />
        </motion.button>
      </div>

      {/* Context pills */}
      <div className="flex gap-2 mb-3 shrink-0 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <span className={Badge.neutral} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Dumbbell size={9} style={{ color: C.neon }} />
          {workoutData?.[new Date().getDay()]?.title || 'Descanso'}
        </span>
        <span className={Badge.neutral} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Trophy size={9} style={{ color: C.neon }} />
          {Object.keys(prHistory || {}).length} PRs
        </span>
        <span className={Badge.neutral} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <User size={9} style={{ color: C.neon }} />
          {profile?.bio?.weightKg || '?'}kg • {profile?.goals?.target || 'Hipertrofia'}
        </span>
        <span className={Badge.neutral} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
          <Zap size={9} style={{ color: C.neon }} />
          {metrics?.caloriesGoalKcal || '?'} kcal
        </span>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-start gap-2 px-3 py-2.5 rounded-[14px] shrink-0"
            style={{ background: C.redBg, border: `1px solid ${C.redBorder}` }}
          >
            <AlertTriangle size={13} style={{ color: C.red, marginTop: 1, flexShrink: 0 }} />
            <p className="text-[11px] font-bold" style={{ color: C.red }}>{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5" style={{ scrollbarWidth: 'none' }}>
        {/* Long conversation notice */}
        {messages.length > MAX_HISTORY + 1 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[10px] mb-1"
            style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.14)' }}>
            <Zap size={10} style={{ color: C.purple }} />
            <p className="text-[9px] font-semibold" style={{ color: C.textSub }}>
              Histórico longo — apenas as últimas {MAX_HISTORY} mensagens são enviadas à IA.
            </p>
          </div>
        )}
        {messages.map((msg, i) => <Message key={i} msg={msg} />)}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <AnimatePresence>
        {showQuickPrompts && messages.length <= 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-3 shrink-0"
          >
            <p className="text-[8.5px] font-black uppercase tracking-[0.2em] mb-2 ml-0.5" style={{ color: C.textSub }}>
              Perguntas rápidas
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((qp) => (
                <motion.button key={qp.label} whileTap={{ scale: 0.94 }}
                  onClick={() => handleSend(qp.text)}
                  className="px-3 py-1.5 rounded-[10px] text-[10.5px] font-semibold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)' }}>
                  {qp.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="mt-3 shrink-0">
        <div className="flex items-end gap-2.5 px-3 py-2.5 rounded-[18px]"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao seu Coach…"
            rows={1}
            className="flex-1 bg-transparent text-[13px] font-medium text-white placeholder:text-neutral-600 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 items-center justify-center rounded-[12px] shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? C.purple : 'rgba(255,255,255,0.05)',
              boxShadow: input.trim() && !loading ? `0 0 12px rgba(139,92,246,0.22)` : 'none',
            }}>
            <Send size={14} style={{ color: input.trim() && !loading ? '#fff' : C.textSub }} />
          </motion.button>
        </div>
        <p className="text-center text-[8.5px] font-bold uppercase tracking-widest mt-2" style={{ color: C.textMute }}>
          Powered by Groq AI • ZYRON Coach
        </p>
      </div>
    </motion.div>
  );
}
