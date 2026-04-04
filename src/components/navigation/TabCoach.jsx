import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, Bot, User, AlertTriangle, Trash2, ChevronDown, Dumbbell, Droplets, Trophy } from 'lucide-react';
import { sendMessageToGemini, buildSystemPrompt } from '../../lib/gemini';

const QUICK_PROMPTS = [
  { label: '🔥 Treino de Hoje', text: 'Me dê um resumo do meu treino de hoje e dicas para maximizar o resultado.' },
  { label: '⚡ Aumentar Carga', text: 'Quando e como devo aumentar minha carga para continuar progredindo?' },
  { label: '🎯 Metas Smart', text: 'Baseado no meu peso e objetivo, calcule minhas metas ideais de proteína diária, hidratação e calorias. Me dê números exatos.' },
  { label: '💧 Nutrição', text: 'Qual a minha meta de proteína e hidratação hoje baseada no meu peso?' },
  { label: '😴 Recuperação', text: 'Estou cansado. Devo treinar mesmo assim ou descansar? O que fazer?' },
  { label: '📈 Progresso', text: 'Analise meus PRs e me diga se estou progredindo bem.' },
];

const TypingIndicator = () => (
  <div className="flex items-end gap-3">
    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(253,224,71,0.4)]">
      <Zap size={14} className="text-black fill-black" />
    </div>
    <div className="bg-neutral-900 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-yellow-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  </div>
);

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-end gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isUser
          ? 'bg-neutral-800 border border-white/10'
          : 'bg-yellow-400 shadow-[0_0_15px_rgba(253,224,71,0.3)]'
      }`}>
        {isUser
          ? <User size={14} className="text-neutral-400" />
          : <Zap size={14} className="text-black fill-black" />
        }
      </div>

      {/* Bubble */}
      <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm font-medium leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'bg-yellow-400 text-black rounded-br-sm font-bold'
          : 'bg-neutral-900 border border-white/5 text-neutral-100 rounded-bl-sm'
      }`}>
        {msg.text}
      </div>
    </motion.div>
  );
};

export default function TabCoach({ user, prHistory, workoutData }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      text: `Olá, ${user?.name?.split(' ')[0] || 'Atleta'}! ⚡ Sou o **ZYRON Coach**, sua IA de alta performance.\n\nEstou com acesso ao seu perfil, treino de hoje e seus PRs. Me pergunte qualquer coisa — treino, nutrição, recuperação, estratégia. Vamos forjar sua evolução!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const systemPrompt = buildSystemPrompt(user, prHistory, workoutData);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Build Gemini history format (exclude the welcome message)
  const buildHistory = () => {
    return messages.slice(1).map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));
  };

  const handleSend = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');
    setError(null);
    setShowQuickPrompts(false);

    const userMsg = { role: 'user', text: messageText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const history = buildHistory();
      const response = await sendMessageToGemini(history, messageText, systemPrompt);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      console.error('ZYRON Coach Error:', err);
      setError(err.message || 'Erro ao conectar com a IA. Verifique sua API Key.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'model',
      text: `Conversa reiniciada! ⚡ Como posso ajudar, ${user?.name?.split(' ')[0] || 'Atleta'}?`,
    }]);
    setShowQuickPrompts(true);
    setError(null);
  };

  return (
    <motion.div
      key="coach"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-[calc(100dvh-200px)] min-h-[500px]"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-1 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-yellow-400 rounded-2xl shadow-[0_0_20px_rgba(253,224,71,0.3)]">
            <Zap size={20} className="text-black fill-black" />
          </div>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">ZYRON Coach</h2>
            <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">IA Personal Trainer</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="p-2 bg-neutral-900 border border-white/5 rounded-xl text-neutral-500 hover:text-red-400 hover:border-red-400/20 transition-all"
          title="Limpar conversa"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Context Pills */}
      <div className="flex gap-2 mb-4 shrink-0 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <Dumbbell size={10} className="text-yellow-400" />
          {workoutData?.[new Date().getDay()]?.title || 'Descanso'}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <Trophy size={10} className="text-yellow-400" />
          {Object.keys(prHistory || {}).length} PRs
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900/60 border border-white/5 rounded-full text-[10px] font-black uppercase tracking-wider text-neutral-400 whitespace-nowrap shrink-0">
          <User size={10} className="text-yellow-400" />
          {user?.weight || '?'}kg • {user?.goal || 'Hipertrofia'}
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2 shrink-0"
          >
            <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-[11px] font-bold text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-none">
        {messages.map((msg, i) => (
          <Message key={i} msg={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick Prompts */}
      <AnimatePresence>
        {showQuickPrompts && messages.length <= 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mt-4 shrink-0"
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-600 mb-2 ml-1">
              Perguntas rápidas
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp.label}
                  onClick={() => handleSend(qp.text)}
                  className="px-3 py-2 bg-neutral-900/60 border border-white/5 rounded-xl text-[11px] font-bold text-neutral-300 hover:border-yellow-400/30 hover:text-yellow-400 transition-all active:scale-95"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="mt-4 shrink-0">
        <div className="flex items-end gap-3 bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 focus-within:border-yellow-400/30 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte ao seu Coach de IA..."
            rows={1}
            className="flex-1 bg-transparent text-white text-sm font-medium placeholder:text-neutral-600 resize-none outline-none leading-relaxed max-h-32 overflow-y-auto"
            style={{ scrollbarWidth: 'none' }}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="w-10 h-10 bg-yellow-400 hover:bg-yellow-300 disabled:bg-neutral-800 disabled:text-neutral-600 text-black rounded-xl flex items-center justify-center transition-all shrink-0 shadow-[0_0_15px_rgba(253,224,71,0.2)] disabled:shadow-none"
          >
            <Send size={16} />
          </motion.button>
        </div>
        <p className="text-center text-[9px] text-neutral-700 font-bold uppercase tracking-widest mt-2">
          Powered by Groq AI • ZYRON Coach
        </p>
      </div>
    </motion.div>
  );
}
