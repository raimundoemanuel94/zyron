import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { logger } from './utils/logger';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MusicProvider } from './contexts/MusicContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { ForceUpdateBanner } from './components/ForceUpdateBanner';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { FichaDeTreinoScreen } from './components/FichaDeTreinoScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LoginScreen } from './components/LoginScreen';
import { AdminScreen } from './components/AdminScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DebugLogs } from './components/DebugLogs';
import { ErrorDiagnostics } from './components/ErrorDiagnostics';
import { ErrorLogger } from './components/ErrorLogger';
import { PWASplashScreen } from './components/PWASplashScreen';
import { SystemIcon } from './components/SystemIcon';
import { ReloadPrompt } from './components/pwa/ReloadPrompt';
import { UpdateNotification } from './components/UpdateNotification';
import { usePWAStore } from './store/usePWAStore';
import { usePlayerStore } from './store/usePlayerStore';
import { useWorkoutStore } from './store/useWorkoutStore';
import { useCamera } from './hooks/useCamera';
import { useAppUpdate } from './hooks/useAppUpdate';
import './utils/haptics.js';
import hardcorePWA from './utils/hardcorePWA.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // 'app' | 'admin'
  const globalConstraintsRef = useRef(null);

  // Initial Auth Sync
  useEffect(() => {
    // Inicializar logger
    logger.systemEvent('App inicializado', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
    
    // Log de teste forçado
    logger.info('LOGGER TESTE - App carregado com sucesso', {
      test: true,
      environment: process.env.NODE_ENV,
      loggerVersion: '1.0.0'
    });
    
    // Inicializar sistema PWA HARDCORE
    if (hardcorePWA) {
      console.log('🔥 Sistema PWA HARDCORE já inicializado');
      
      // Request permissão de notificação
      hardcorePWA.requestNotificationPermission();
      
      // Listeners para eventos do PWA
      const handleSWActivated = (event) => {
        console.log('🚀 Service Worker ativado via listener:', event.detail);
        logger.systemEvent('Service Worker ativado', event.detail);
      };
      
      const handleForceUpdate = (event) => {
        console.log('🔄 Atualização forçada via listener:', event.detail);
        logger.userAction('Atualização forçada iniciada', event.detail);
      };
      
      const handleForceReload = (event) => {
        console.log('🔄 Reload forçado via listener:', event.detail);
        logger.userAction('Reload forçado iniciado', event.detail);
      };
      
      window.addEventListener('sw-activated', handleSWActivated);
      window.addEventListener('force-update', handleForceUpdate);
      window.addEventListener('force-reload', handleForceReload);
      
      // Cleanup
      return () => {
        window.removeEventListener('sw-activated', handleSWActivated);
        window.removeEventListener('force-update', handleForceUpdate);
        window.removeEventListener('force-reload', handleForceReload);
      };
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.userAction('Login automático via sessão', {
          userId: session.user.id,
          email: session.user.email
        });
        setIsAuthenticated(true);
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        logger.userAction('Usuário autenticado', {
          userId: session.user.id,
          email: session.user.email,
          event: _event
        });
        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        logger.userAction('Usuário deslogado', {
          event: _event
        });
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [hardcorePWA]);

  const handleLogin = (sessionUser) => {
    setUser(sessionUser);
    setIsAuthenticated(true);
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setViewManager('app');
  };

  return (
    <MusicProvider>
      {/* 
         THE BACKBONE: This container holds the constraints for the entire app.
         The media layer lives here as a sibling to the views, ensuring it NEVER unmounts.
      */}
      <div 
        ref={globalConstraintsRef} 
        className="relative min-h-screen w-full bg-black overflow-x-hidden selection:bg-yellow-400 selection:text-black"
      >
        {/* 
           GLOBAL MEDIA LAYER: Outside conditional logic but inside MusicProvider.
           Persistent across ALL application states.
        */}
        {isAuthenticated && (
          <GlobalPlayer constraintsRef={globalConstraintsRef} />
        )}
        
        {/* Redundant banners removed by user request */}

        
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
          {/* PWA Install Banner */}
          <PWAInstallBanner />
          
          <AnimatePresence mode="wait">
            {!isAuthenticated ? (
              showOnboarding ? (
                <motion.div 
                  key="onboarding" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="w-full"
                >
                  <OnboardingScreen onComplete={handleLogin} onCancel={() => setShowOnboarding(false)} />
                </motion.div>
              ) : (
                <motion.div 
                  key="login" 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="w-full"
                >
                  <LoginScreen onLogin={handleLogin} onRegisterClick={() => setShowOnboarding(true)} />
                </motion.div>
              )
            ) : (
              <motion.div 
                key="main-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full"
              >
                {viewManager === 'admin' && user?.role === 'ADMIN' ? (
                  <AdminScreen onLogout={handleLogout} onBack={() => setViewManager('app')} />
                ) : (
                  <FichaDeTreinoScreen user={user} onLogout={handleLogout} onOpenAdmin={() => setViewManager('admin')} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      
      {/* Vercel Speed Insights - Performance Monitoring */}
      <SpeedInsights />
      
      {/* Debug Logs - Apenas em desenvolvimento */}
      {process.env.NODE_ENV === 'development' && <DebugLogs />}
    </MusicProvider>
  );
}

export default App;
