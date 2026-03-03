import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck, Zap } from "lucide-react";

import { supabase } from "../lib/supabase";

// Typewriter hook
function useTypewriter(text, speed = 65, delay = 1200) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    let interval;
    setDisplayed('');
    setDone(false);
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => { clearTimeout(timeout); clearInterval(interval); };
  }, [text, speed, delay]);
  return { displayed, done };
}

const TypewriterSlogan = () => {
  const { displayed, done } = useTypewriter('A Força da Sua Evolução.', 65, 1200);
  return (
    <p className="text-sm mt-1 font-bold tracking-[0.2em] uppercase h-6 flex items-center justify-center gap-0.5">
      <span className="text-zinc-400">{displayed}</span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse' }}
        className={`inline-block w-0.5 h-4 bg-yellow-400 ${done ? 'opacity-0' : ''}`}
        style={done ? { animation: 'none', opacity: 0 } : {}}
      />
    </p>
  );
};

const IndustrialLogin = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      onLogin(data.user);
    } catch (error) {
      console.error("Erro de Autenticação:", error.message);
      alert(
        "Falha no login: " +
          (error.message === "Invalid login credentials"
            ? "Credenciais incorretas."
            : error.message),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 font-sans selection:bg-yellow-400 selection:text-black">
      {/* Efeito de Luz de Fundo (Glow) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center justify-center w-56 h-28 rounded-3xl mb-6 shadow-[0_0_60px_rgba(255,212,0,0.25)] overflow-hidden border border-yellow-400/20"
          >
            <img src="/images/zyron-logo.png" alt="ZYRON" className="w-full h-full object-contain p-2" />
          </motion.div>
          <TypewriterSlogan />
        </div>

        {/* Card Glassmorphism */}
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-4xl p-8 shadow-2xl relative overflow-hidden">
          {/* Barra de Detalhe Industrial */}
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-yellow-400 to-transparent opacity-50" />

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Input E-mail */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-yellow-400 uppercase ml-1 tracking-widest">
                E-mail de Acesso
              </label>
              <div className="relative group">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                  size={20}
                />
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Input Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-yellow-400 uppercase tracking-widest">
                  Senha
                </label>
                <a
                  href="#"
                  className="text-[10px] text-zinc-500 hover:text-white uppercase font-bold transition-colors"
                >
                  Esqueceu?
                </a>
              </div>
              <div className="relative group">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors"
                  size={20}
                />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Botão de Entrar */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-black py-4 rounded-xl shadow-[0_10px_20px_rgba(253,224,71,0.2)] flex items-center justify-center gap-2 transition-all uppercase italic tracking-wider"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  Entrar no Sistema <ArrowRight size={20} />
                </>
              )}
            </motion.button>
          </form>

          {/* Rodapé do Card */}
          <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4 items-center">
            <p className="text-zinc-500 text-xs">
              Não tem conta?{" "}
              <span
                onClick={onRegisterClick}
                className="text-yellow-400 font-bold cursor-pointer hover:underline"
              >
                Cadastre-se
              </span>
            </p>
            <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase tracking-tighter">
              <ShieldCheck size={14} /> Acesso Criptografado de Ponta a Ponta
            </div>
          </div>
        </div>

        {/* Versão do Admin */}
        <p className="text-center mt-8 text-[10px] text-zinc-700 font-mono tracking-[0.3em] uppercase">
          Powered by ZYRON
        </p>
      </motion.div>
    </div>
  );
};

export default IndustrialLogin;
