import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsIOS(ios);

    // If already installed, don't show
    if (isStandalone) return;

    // Check if dismissed recently (24h cooldown)
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 86400000) return;

    // For iOS, show after 3 seconds
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // For Chrome/Android, capture the beforeinstallprompt event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-neutral-900 border border-yellow-400/30 rounded-2xl p-4 shadow-[0_0_30px_rgba(253,224,71,0.15)] z-[100] flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(253,224,71,0.3)]">
            <Download size={20} className="text-black" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-white uppercase tracking-tight">Instalar AXIRON</h4>
            {isIOS ? (
              <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                Toque em <span className="text-yellow-400">Compartilhar ↑</span> → "Adicionar à Tela de Início"
              </p>
            ) : (
              <p className="text-[10px] text-neutral-400 font-bold mt-0.5">
                Instale como app no seu celular — funciona offline!
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isIOS && (
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-yellow-400 text-black text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 active:scale-95 transition-all"
              >
                Instalar
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="p-1.5 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
