import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader } from "lucide-react";
import { supabase } from "../lib/supabase";
import logger from "../utils/logger";

const LoginScreenModerno = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp]   = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError(authError.message || "Email ou senha inválidos"); return; }
      if (data?.user) { logger.userAction("Login", { userId: data.user.id }); onLogin(data.user); }
    } catch { setError("Erro ao conectar. Tente novamente."); }
    finally { setLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (authError) { setError(authError.message || "Erro ao criar conta"); return; }
      if (data?.user) {
        setError("✅ Conta criada! Verifique seu email.");
        setIsSigningUp(false);
        setTimeout(() => setError(""), 4000);
      }
    } catch { setError("Erro ao criar conta. Tente novamente."); }
    finally { setLoading(false); }
  };

  const isFormValid = email && password && password.length >= 6;

  return (
    <div className="relative w-full min-h-screen flex overflow-hidden bg-black">

      {/* ── IMAGEM DE FUNDO FULL SCREEN ── */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/pexels-adult-1850925.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "60% center",
        }}
      />

      {/* ── CAMADAS DE OVERLAY PREMIUM ── */}
      {/* Base escura pra legibilidade */}
      <div className="absolute inset-0 z-10 bg-black/50" />
      {/* Gradiente topo e fundo */}
      <div className="absolute inset-0 z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.85) 100%)" }}
      />
      {/* Glow amarelo dourado sutil */}
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full z-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(253,200,0,0.10) 0%, transparent 65%)" }}
      />
      <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full z-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(253,200,0,0.06) 0%, transparent 65%)" }}
      />

      {/* ── LAYOUT: esquerda (imagem livre) + direita (form) ── */}
      <div className="relative z-20 w-full flex items-stretch min-h-screen">

        {/* LADO ESQUERDO — tagline flutuante (só desktop) */}
        <div className="hidden lg:flex flex-col justify-end p-14 w-1/2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            {/* Logo grande */}
            <img
              src="/images/zyron-logo-gold.png"
              alt="Zyron"
              className="h-16 mb-6 object-contain object-left drop-shadow-[0_0_30px_rgba(253,200,0,0.5)]"
              onError={(e) => { e.target.style.display='none'; }}
            />
            <h1 className="text-5xl font-black italic uppercase leading-tight text-white drop-shadow-xl">
              A Força da<br/>
              <span style={{ color: '#FDC800' }}>Sua Evolução.</span>
            </h1>
            <p className="mt-4 text-sm font-bold text-white/60 uppercase tracking-[0.25em]">
              Treinos. Performance. Resultados.
            </p>
            {/* Linha decorativa dourada */}
            <div className="mt-8 h-1 w-24 rounded-full" style={{ background: 'linear-gradient(to right, #FDC800, transparent)' }} />
          </motion.div>
        </div>

        {/* LADO DIREITO — Form premium */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-5 py-10 lg:px-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full max-w-sm"
          >

            {/* LOGO + SLOGAN (mobile) */}
            <div className="lg:hidden text-center mb-8">
              <img
                src="/images/zyron-logo-gold.png"
                alt="Zyron"
                className="h-12 mx-auto mb-3 object-contain drop-shadow-[0_0_20px_rgba(253,200,0,0.5)]"
                onError={(e) => { e.target.style.display='none'; }}
              />
              <p className="text-[11px] font-black tracking-[0.35em] uppercase"
                style={{ color: '#FDC800' }}>
                ⚡ A Força da Sua Evolução
              </p>
            </div>

            {/* CARD GLASSMORPHISM */}
            <div
              className="w-full rounded-3xl p-8"
              style={{
                background: 'rgba(5, 5, 8, 0.88)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(253,200,0,0.22)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 60px rgba(253,200,0,0.06)',
              }}
            >
              {/* Linha dourada topo do card */}
              <div className="h-0.5 w-16 mb-6 rounded-full" style={{ background: 'linear-gradient(to right, #FDC800, #f59e0b)' }} />

              {/* Heading */}
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-1">
                {isSigningUp ? "Criar Conta" : "Entrar"}
              </h2>
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-widest mb-7">
                {isSigningUp ? "Junte-se à comunidade Zyron" : "Bem-vindo de volta, operativo"}
              </p>

              {/* ERRO / SUCESSO */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className={`mb-5 px-4 py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider ${
                      error.includes("✅")
                        ? "bg-emerald-500/15 border border-emerald-500/40 text-emerald-400"
                        : "bg-red-500/15 border border-red-500/40 text-red-400"
                    }`}
                  >{error}</motion.div>
                )}
              </AnimatePresence>

              {/* FORM */}
              <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="space-y-4">

                {/* EMAIL */}
                <div className="group">
                  <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5"
                    style={{ color: '#FDC800' }}>
                    E-mail de Acesso
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@email.com" required
                      className="w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(253,200,0,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  </div>
                </div>

                {/* SENHA */}
                <div className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider"
                      style={{ color: '#FDC800' }}>
                      Senha
                    </label>
                    {!isSigningUp && (
                      <button type="button"
                        className="text-[9px] font-black text-white/30 hover:text-yellow-400 uppercase tracking-wider transition-colors">
                        Esqueceu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-yellow-400 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" required minLength={6}
                      className="w-full rounded-xl py-3 pl-10 pr-11 text-white text-sm placeholder:text-white/20 outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onFocus={e => e.target.style.borderColor = 'rgba(253,200,0,0.5)'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-yellow-400 transition-colors">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* BOTÃO ENTRAR */}
                <motion.button
                  type="submit"
                  disabled={!isFormValid || loading}
                  whileHover={isFormValid ? { scale: 1.02 } : {}}
                  whileTap={isFormValid ? { scale: 0.97 } : {}}
                  className="w-full mt-3 py-4 rounded-xl font-black uppercase italic tracking-widest text-sm text-black flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isFormValid ? 'linear-gradient(135deg, #FDC800 0%, #f59e0b 100%)' : 'rgba(255,255,255,0.1)',
                    color: isFormValid ? '#000' : 'rgba(255,255,255,0.3)',
                    boxShadow: isFormValid ? '0 8px 32px rgba(253,200,0,0.35), 0 2px 8px rgba(0,0,0,0.4)' : 'none',
                    cursor: isFormValid ? 'pointer' : 'not-allowed',
                  }}
                >
                  {loading
                    ? <><Loader size={16} className="animate-spin" /> Processando...</>
                    : <>{isSigningUp ? "Criar Conta" : "Entrar no Sistema"} <ArrowRight size={16} /></>
                  }
                </motion.button>
              </form>

              {/* DIVIDER */}
              <div className="my-5 flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
                <span className="text-[10px] font-black text-white/20 uppercase">ou</span>
                <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
              </div>

              {/* TOGGLE LOGIN / SIGNUP */}
              <motion.button
                onClick={() => { setIsSigningUp(!isSigningUp); setError(""); }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl text-sm font-black text-white/70 uppercase tracking-wider transition-all hover:text-white"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onMouseEnter={e => e.target.style.borderColor = 'rgba(253,200,0,0.3)'}
                onMouseLeave={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
              >
                {isSigningUp ? "Já tem conta? Entrar" : "Não tem conta? Cadastre-se"}
              </motion.button>

              {/* RODAPÉ */}
              <p className="text-center text-[9px] text-white/20 font-bold uppercase tracking-widest mt-6">
                🔒 Acesso Criptografado de Ponta a Ponta
              </p>
            </div>

            {/* POWERED BY (fora do card) */}
            <p className="mt-5 text-center text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              Powered by Zyron
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreenModerno;
