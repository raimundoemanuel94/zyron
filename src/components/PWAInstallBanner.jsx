import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Zap, Crown } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    setIsIOS(ios);

    // Cooldown logic (don't show if dismissed in the last 12 hours for higher urgency)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 43200000) return;

    // For iOS, show after a delay
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 4000);
      return () => clearTimeout(timer);
    }

    // Capture Chrome/Android install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner after interaction or small delay
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 200, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 200, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 150 }}
          className="fixed bottom-6 left-4 right-4 z-100 max-w-lg mx-auto"
        >
          <div className="relative overflow-hidden bg-neutral-950 border-2 border-yellow-400 rounded-3xl p-5 shadow-[0_0_50px_rgba(253,224,71,0.3)] group">
            {/* Animated Glow Background */}
            <div className="absolute inset-0 bg-yellow-400/5 animate-pulse pointer-events-none" />
            
            <div className="flex items-center gap-5 relative z-10">
              {/* App Icon / Logo with Pulsing Ring */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(253,224,71,0.5)]">
                  <Download size={24} className="text-black" />
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                  NOVO
                </div>
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Zap size={12} className="text-yellow-400 fill-yellow-400" />
                  <h4 className="text-sm font-black text-white uppercase italic tracking-tighter">Performance Extrema</h4>
                </div>
                <h3 className="text-lg font-black text-slate-100 leading-tight uppercase tracking-tight">
                  Instalar <span className="text-yellow-400">ZYRON App</span>
                </h3>
                {isIOS ? (
                  <p className="text-[11px] text-neutral-400 font-bold mt-1">
                    Toque em <span className="text-yellow-400">Compartilhar ↑</span> e selecione <br/>
                    <span className="text-slate-200">"Adicionar à Tela de Início"</span>
                  </p>
                ) : (
                  <p className="text-[11px] text-neutral-400 font-bold mt-1">
                    Tenha acesso instantâneo e offline. <br/>
                    Treine como um profissional.
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-5 flex items-center gap-3 relative z-10">
              {!isIOS ? (
                <button
                  onClick={handleInstall}
                  className="flex-1 py-3.5 bg-yellow-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all shadow-lg shadow-yellow-400/20 flex items-center justify-center gap-2"
                >
                  <Crown size={14} className="fill-black" />
                  Baixar Agora
                </button>
              ) : (
                <div className="flex-1 py-3 text-center border border-white/10 rounded-2xl bg-white/5">
                   <span className="text-[10px] uppercase font-black text-white/50 tracking-widest italic">Aguardando Instalação...</span>
                </div>
              )}
              
              <button
                onClick={handleDismiss}
                className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all"
              >
                <X size={20} className="text-white/60" />
              </button>
            </div>

            {/* Bottom Progress/Decorative Line */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-yellow-400 to-transparent opacity-50" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
