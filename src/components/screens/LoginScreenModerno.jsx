import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader, Mail, Lock } from "lucide-react";
import { supabase } from "../../lib/supabase";
import logger from "../../utils/logger";

const LoginScreenModerno = ({ onLogin, onRegisterClick }) => {
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningUp, setIsSigningUp]   = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ETAPA 3 — LOADING SCREEN (PROFISSIONAL)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200); // 1.2s para garantir o "feel" de app grande
    return () => clearTimeout(timer);
  }, []);

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

  // Ícones do Mockup (Réplica Fiel)
  const ZyronLogoIcon = () => (
    <svg width="60" height="60" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 32L22 8H30L18 32H10Z" fill="#FDC800"/>
      <path d="M22 32L34 8H26L14 32H22Z" fill="#FDC800" fillOpacity="0.7"/>
    </svg>
  );

  const AppleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2.044-.156-3.078 1.09-4.01 1.09zM15.53 4.654c1.055-1.287 1.055-2.441.902-3.41C15.49 1.352 14.39 2.04 13.582 3c-.808.932-1.042 2.117-.834 3.014 1.09.083 2.103-.541 2.782-1.36z" />
    </svg>
  );

  const FacebookIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.312h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z" />
    </svg>
  );

  const GoogleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335"/>
    </svg>
  );

  // Variantes das animações cinematográficas
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const logoVariants = {
    hidden: { y: -40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isInitialLoading ? (
          /* 🔥 ETAPA 3 — SPLASH SCREEN (PWA / APP FEEL) */
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black overflow-hidden"
          >
            {/* Background da Atleta na Splash */}
            <div
              className="absolute inset-0 z-0 bg-no-repeat bg-cover scale-110 opacity-40 blur-[4px]"
              style={{ backgroundImage: "url('/images/zyron-hero-impact.png')", backgroundPosition: "center top" }}
            />
            <div className="relative z-10 flex flex-col items-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <ZyronLogoIcon />
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-white text-2xl font-black tracking-tighter mt-4"
              >
                ZYRON
              </motion.h2>
              {/* Barra de Progresso Minimalista */}
              <div className="w-40 h-0.5 bg-white/10 mt-8 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="w-full h-full bg-[#FDC800]"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <div key="content" className="relative w-full min-h-screen flex flex-col items-center justify-center bg-gray-900 text-gray-900 font-sans overflow-hidden">
            
            {/* ── BACKGROUND ATLETA (ETAPA 1: LEVE ZOOM REVERSO) ── */}
            <motion.div
              initial={{ scale: 1.08 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute inset-0 z-0 bg-no-repeat bg-cover"
              style={{
                backgroundImage: "url('/images/zyron-hero-impact.png')",
                backgroundPosition: "center top",
                filter: "brightness(0.75) blur(1px)",
              }}
            />
            
            {/* ── OVERLAY SUAVE PREMIUM ── */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/85 via-transparent to-black/20" />

            {/* ── CONTEÚDO PRINCIPAL (ANIMAÇÕES CINEMATOGRÁFICAS) ── */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="relative z-20 w-full px-8 flex flex-col items-center mt-[-40px] pt-[env(safe-area-inset-top)]"
            >
              
              {/* LOGO ZYRON (SLIDE VIND DE CIMA) */}
              <motion.div variants={logoVariants} className="flex flex-col items-center mb-10">
                <ZyronLogoIcon />
                <h2 className="text-4xl font-black italic tracking-tighter text-white mt-2 drop-shadow-2xl">ZYRON</h2>
                <h3 className="text-white text-2xl font-black mt-6 tracking-tight drop-shadow-lg">
                  {isSigningUp ? "Criar Perfil" : "Entrar"}
                </h3>
              </motion.div>

              {/* FEEDBACK */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`w-full mb-6 p-4 rounded-2xl text-[11px] font-black text-center border backdrop-blur-xl ${
                      error.includes("✅") ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* FORMULÁRIO (ETAPA 5: MICRO-DETALHES) */}
              <form onSubmit={isSigningUp ? handleSignUp : handleLogin} className="w-full space-y-4">
                
                <motion.div variants={itemVariants} className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FDC800] group-focus-within:opacity-100 opacity-60 transition-all duration-300">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E-mail"
                    required
                    className="w-full bg-white text-gray-900 rounded-full h-15 py-5 pl-14 pr-6 text-sm font-bold outline-none shadow-2xl transition-all border-2 border-transparent focus:border-[#FDC800]/40 focus:ring-4 focus:ring-[#FDC800]/10"
                  />
                </motion.div>

                <motion.div variants={itemVariants} className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#FDC800] group-focus-within:opacity-100 opacity-60 transition-all duration-300">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Senha"
                    required
                    minLength={6}
                    className="w-full bg-white text-gray-900 rounded-full h-15 py-5 pl-14 pr-14 text-sm font-bold outline-none shadow-2xl transition-all border-2 border-transparent focus:border-[#FDC800]/40 focus:ring-4 focus:ring-[#FDC800]/10"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </motion.div>

                {/* 🔥 ETAPA 2 — BOTÃO COM EFEITO REAL */}
                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.015, filter: "brightness(1.05)" }}
                  whileTap={{ scale: 0.97, boxShadow: "0 5px 15px rgba(253,200,0,0.2)" }}
                  disabled={!isFormValid || loading}
                  type="submit"
                  className="w-full bg-linear-to-r from-[#FDE047] to-[#facc15] text-black h-15 rounded-full text-md font-black uppercase tracking-widest mt-4 shadow-xl shadow-[#FDC800]/30 transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="animate-spin" size={24} /> : (isSigningUp ? "Criar Perfil" : "Entrar")}
                </motion.button>
              </form>

              {/* ESQUECEU A SENHA */}
              {!isSigningUp && (
                <motion.button variants={itemVariants} className="mt-6 text-gray-300 text-sm font-black hover:text-white transition-colors tracking-tight opacity-80 hover:opacity-100">
                  Esqueceu a senha?
                </motion.button>
              )}

              {/* LOGIN SOCIAL MINIMALISTA */}
              <motion.div variants={itemVariants} className="mt-12 flex flex-col items-center w-full">
                <p className="text-gray-200 text-[10px] font-black mb-6 tracking-[0.3em] uppercase opacity-40">Entrar com</p>
                
                <div className="flex gap-8 items-center">
                  <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-full hover:bg-white/15 transition-all text-white border border-white/5 backdrop-blur-md shadow-lg">
                    <AppleIcon />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-full hover:bg-white/15 transition-all text-[#1877F2] border border-white/5 backdrop-blur-md shadow-lg">
                    <FacebookIcon />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.1, y: -2 }} whileTap={{ scale: 0.95 }} className="bg-white/10 p-4 rounded-full hover:bg-white/15 transition-all border border-white/5 backdrop-blur-md shadow-lg">
                    <GoogleIcon />
                  </motion.button>
                </div>
              </motion.div>

              {/* FOOTER PREMIUM */}
              <motion.div variants={itemVariants} className="mt-14 text-center text-sm font-bold text-gray-200 tracking-tight">
                {isSigningUp ? "Já faz parte?" : "Ainda não tem conta?"}{" "}
                <button 
                  onClick={() => { setIsSigningUp(!isSigningUp); setError(""); }}
                  className="text-[#FDC800] font-black hover:underline transition-all underline-offset-8 decoration-2"
                >
                  {isSigningUp ? "Entrar" : "Criar conta"}
                </button>
              </motion.div>

            </motion.div>
            
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginScreenModerno;
