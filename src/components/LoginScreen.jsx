import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

/* ── Typewriter hook — loop infinito ── */
function useTypewriter(text, speed = 65, eraseSpeed = 35, hold = 2500, delay = 1200) {
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState('wait');
  useEffect(() => {
    let t;
    if (phase === 'wait')  t = setTimeout(() => setPhase('type'), delay);
    else if (phase === 'type') {
      if (displayed.length < text.length)
        t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      else t = setTimeout(() => setPhase('hold'), hold);
    }
    else if (phase === 'hold') setPhase('erase');
    else if (phase === 'erase') {
      if (displayed.length > 0)
        t = setTimeout(() => setDisplayed(text.slice(0, displayed.length - 1)), eraseSpeed);
      else t = setTimeout(() => setPhase('type'), 500);
    }
    return () => clearTimeout(t);
  }, [phase, displayed, text, speed, eraseSpeed, hold, delay]);
  return { displayed, isTyping: phase === 'type' || phase === 'wait' };
}

/* ── Partícula decorativa ── */
const Particle = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={{
      background: 'radial-gradient(circle, rgba(253,224,71,0.6) 0%, transparent 70%)',
      animation: `particle-rise ${style.duration}s ease-out ${style.delay}s infinite`,
      '--tx': style.tx,
      ...style,
    }}
  />
);

/* ── Slogan com typewriter ── */
const TypewriterSlogan = () => {
  const { displayed } = useTypewriter('A Força da Sua Evolução.', 65, 30, 2500, 800);
  return (
    <p className="text-sm mt-1 font-black tracking-[0.25em] uppercase h-6 flex items-center justify-center">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500"
        style={{ filter: 'drop-shadow(0 0 8px rgba(255,212,0,0.5))' }}>
        {displayed}
      </span>
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        className="inline-block w-[2px] h-4 bg-yellow-400 ml-0.5"
        style={{ boxShadow: '0 0 6px rgba(255,212,0,0.8)' }}
      />
    </p>
  );
};

/* ── Input field reutilizável ── */
const InputField = ({ icon: Icon, label, right, ...props }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center px-1">
      <label className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{label}</label>
      {right}
    </div>
    <div className="relative group">
      <Icon
        className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-400 transition-colors duration-200"
        size={18}
      />
      <input
        {...props}
        className="w-full bg-black/50 border border-white/8 rounded-xl py-3 pl-12 pr-4 text-white text-sm
          placeholder:text-zinc-700 outline-none transition-all duration-200
          focus:border-yellow-400/40 focus:shadow-[0_0_0_3px_rgba(253,224,71,0.07),inset_0_0_16px_rgba(253,224,71,0.03)]
          hover:border-white/12"
      />
    </div>
  </div>
);

/* ── Botão principal ── */
const PrimaryButton = ({ children, loading, ...props }) => (
  <motion.button
    whileHover={{ scale: 1.015 }}
    whileTap={{ scale: 0.975 }}
    className="w-full relative overflow-hidden bg-yellow-400 hover:bg-yellow-300 text-black
      font-black py-3.5 rounded-xl flex items-center justify-center gap-2
      transition-colors uppercase italic tracking-wider text-sm btn-ripple
      shadow-[0_8px_24px_rgba(253,224,71,0.25)]
      hover:shadow-[0_12px_32px_rgba(253,224,71,0.4)]"
    disabled={loading}
    {...props}
  >
    {/* Shimmer */}
    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent
      group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
    {loading
      ? <div className="w-5 h-5 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
      : children
    }
  </motion.button>
);

/* ══════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════ */
const IndustrialLogin = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [newPassword, setNewPassword]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]               = useState(false);
  const [showRecovery, setShowRecovery]     = useState(false);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [message, setMessage]               = useState({ type: "", text: "" });

  /* Partículas geradas uma vez */
  const particles = useRef(
    [...Array(14)].map((_, i) => ({
      width:    Math.random() * 4 + 2 + 'px',
      height:   Math.random() * 4 + 2 + 'px',
      left:     Math.random() * 100 + '%',
      bottom:   Math.random() * 30 + '%',
      tx:       (Math.random() - 0.5) * 80 + 'px',
      duration: Math.random() * 4 + 3,
      delay:    Math.random() * 4,
      opacity:  Math.random() * 0.5 + 0.2,
    }))
  ).current;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setShowUpdatePassword(true);
        setShowRecovery(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  /* ── Handlers ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      onLogin(data.user);
    } catch (error) {
      alert("Falha no login: " + (error.message === "Invalid login credentials"
        ? "Credenciais incorretas." : error.message));
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setRecoveryLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      setMessage({ type: "success", text: "Link enviado! Verifique seu e-mail." });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Erro ao enviar e-mail." });
    } finally { setRecoveryLoading(false); }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }
    setRecoveryLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setMessage({ type: "success", text: "Senha atualizada! Você já pode entrar." });
      setTimeout(() => { setShowUpdatePassword(false); setMessage({ type: "", text: "" }); }, 3000);
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Erro ao atualizar senha." });
    } finally { setRecoveryLoading(false); }
  };

  /* ── Render ── */
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden selection:bg-yellow-400 selection:text-black">

      {/* Scanline sutil */}
      <div className="scanline" />

      {/* ── Partículas de fundo ── */}
      {particles.map((p, i) => <Particle key={i} style={p} />)}

      {/* ── Glow de fundo ── */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(253,224,71,0.055) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ── Grid decorativo ── */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'linear-gradient(rgba(253,224,71,1) 1px, transparent 1px), linear-gradient(90deg, rgba(253,224,71,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        {/* ── Logo & Header ── */}
        <div className="text-center mb-7">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative inline-flex items-center justify-center mb-2"
            style={{ filter: 'drop-shadow(0 0 28px rgba(253,200,0,0.45))' }}
          >
            <img
              src="/images/zyron-logo.png"
              alt="ZYRON"
              className="relative w-52 h-auto object-contain brightness-110 contrast-150 saturate-125 mix-blend-screen"
            />
          </motion.div>
          <TypewriterSlogan />
        </div>

        {/* ── Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="bg-zinc-950/60 backdrop-blur-2xl border border-white/6 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)' }}
        >
          {/* Barra de detalhe topo */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
          {/* Barra de detalhe esquerda */}
          <div className="absolute top-0 left-0 w-[1px] h-24 bg-gradient-to-b from-yellow-400/30 to-transparent" />

          {/* Mensagem de feedback */}
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mb-5 p-3.5 rounded-xl text-[11px] font-bold uppercase tracking-wider overflow-hidden ${
                  message.type === 'success'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Formulários ── */}
          <AnimatePresence mode="wait">

            {/* Atualizar senha */}
            {showUpdatePassword && (
              <motion.form
                key="update-pw"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleUpdatePassword}
                className="space-y-4"
              >
                <InputField icon={Lock} label="Nova Senha" type="password" required
                  placeholder="••••••••" autoComplete="new-password"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <InputField icon={Lock} label="Confirmar Nova Senha" type="password" required
                  placeholder="••••••••"
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <PrimaryButton loading={recoveryLoading}>
                  Confirmar Senha <ArrowRight size={18} />
                </PrimaryButton>
              </motion.form>
            )}

            {/* Login */}
            {!showUpdatePassword && !showRecovery && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <InputField icon={Mail} label="E-mail de Acesso" type="email" required
                  placeholder="exemplo@email.com" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />

                <InputField
                  icon={Lock} label="Senha" type="password" required
                  placeholder="••••••••" autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  right={
                    <button type="button"
                      onClick={() => { setShowRecovery(true); setMessage({ type: "", text: "" }); }}
                      className="text-[10px] text-zinc-600 hover:text-yellow-400 uppercase font-bold tracking-wider transition-colors"
                    >
                      Esqueceu?
                    </button>
                  }
                />

                <div className="pt-1">
                  <PrimaryButton loading={loading}>
                    Entrar no Sistema <ArrowRight size={18} />
                  </PrimaryButton>
                </div>
              </motion.form>
            )}

            {/* Recuperar senha */}
            {!showUpdatePassword && showRecovery && (
              <motion.form
                key="recovery"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleResetPassword}
                className="space-y-4"
              >
                <div className="mb-2">
                  <p className="text-[11px] text-zinc-500 font-medium">
                    Informe seu e-mail e enviaremos um link de redefinição de senha.
                  </p>
                </div>
                <InputField icon={Mail} label="E-mail para Recuperação" type="email" required
                  placeholder="exemplo@email.com" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
                <PrimaryButton loading={recoveryLoading}>
                  Enviar Link <ArrowRight size={18} />
                </PrimaryButton>
                <button type="button"
                  onClick={() => { setShowRecovery(false); setMessage({ type: "", text: "" }); }}
                  className="w-full text-[10px] text-zinc-600 hover:text-yellow-400 uppercase font-bold tracking-wider transition-colors py-1"
                >
                  ← Voltar para o Login
                </button>
              </motion.form>
            )}

          </AnimatePresence>

          {/* ── Rodapé do card ── */}
          <div className="mt-7 pt-5 border-t border-white/5 flex flex-col gap-3 items-center">
            {!showRecovery && !showUpdatePassword && (
              <p className="text-zinc-600 text-xs">
                Não tem conta?{" "}
                <span onClick={onRegisterClick}
                  className="text-yellow-400 font-bold cursor-pointer hover:text-yellow-300 transition-colors">
                  Cadastre-se
                </span>
              </p>
            )}
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-700 font-bold uppercase tracking-wider">
              <ShieldCheck size={12} className="text-zinc-600" />
              Acesso Criptografado de Ponta a Ponta
            </div>
          </div>
        </motion.div>

        {/* Powered by */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6 text-[10px] text-zinc-800 font-mono tracking-[0.35em] uppercase"
        >
          Powered by ZYRON
        </motion.p>
      </motion.div>
    </div>
  );
};

export default IndustrialLogin;
