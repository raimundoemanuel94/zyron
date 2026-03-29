import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import logger from './utils/logger';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MusicProvider } from './contexts/MusicContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import FichaDeTreinoScreen from './components/FichaDeTreinoScreen';
import GlobalPlayer from './components/GlobalhhPlayer';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import AdminScreen from './components/AdminScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDiagnostics from './components/ErrorDiagnostics';
import ErrorLogger from './components/ErrorLogger';
import PWASplashScreen from './components/PWASplashScreen';
import RBACGuard from './components/RBACGuard';
import PersonalDashboard from './components/admin/PersonalDashboard';
import audioUnlocker from './utils/audioUnlock.js';

const DebugOverlay = ({ user, userRole, viewManager }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-yellow-500/20 p-2 z-50 text-[8px] font-mono flex justify-around items-center backdrop-blur-md">
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">UID:</span>
      <span className="text-white">{user?.id?.slice(0, 8)}...</span>
    </div>
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">ROLE:</span>
      <span className="text-yellow-400 font-bold">{userRole || 'FETCHING...'}</span>
    </div>
    <div className="flex gap-4">
      <span className="text-neutral-500 uppercase">VIEW:</span>
      <span className="text-white uppercase">{viewManager}</span>
    </div>
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // ← NOVO: evita flash de login
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'USER' | 'PERSONAL' | 'ADMIN'
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // 'app' | 'admin' | 'personal'
  const globalConstraintsRef = useRef(null);

  // Initial Auth Sync
  useEffect(() => {
    // Inicializar logger
    logger.systemEvent('App inicializado', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });


    // ── Auth sempre verificado, independente do PWA ──────────────────────
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.userAction('Login automático via sessão', {
          userId: session.user.id,
          email: session.user.email
        });
        setIsAuthenticated(true);
        setUser(session.user);
      }
      setAuthLoading(false); // ← Libera a tela só após confirmar o estado de auth
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
        logger.userAction('Usuário deslogado', { event: _event });
        setIsAuthenticated(false);
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // ← Array vazio: hardcorePWA é import estático, nunca muda


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
          <SpeedInsights />
          {/* PWA Install Banner removed */}

          {/* ── Aguarda Supabase confirmar auth antes de renderizar qualquer tela ── */}
          {authLoading ? (
            <div className="fixed inset-0 bg-black z-50" />
          ) : (
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
              <RBACGuard user={user} onRoleVerified={(role) => {
                console.log('[App] Role verified:', role);
                setUserRole(role);
              }}>
                <motion.div 
                  key="main-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full"
                >
                  {/* Prioridade: Visão explícita pelo viewManager */}
                  {viewManager === 'admin' ? (
                    <AdminScreen user={user} onLogout={handleLogout} onBack={() => setViewManager('app')} />
                  ) : 
                  viewManager === 'personal' ? (
                    <PersonalDashboard user={user} onLogout={handleLogout} onBack={() => setViewManager('app')} />
                  ) : (
                    /* Aluno padrão (USER) no modo app, default inicial para todos */
                    <FichaDeTreinoScreen 
                      user={user} 
                      onLogout={handleLogout} 
                      onOpenAdmin={() => { 
                        if (userRole === 'ADMIN') setViewManager('admin');
                        else if (userRole === 'PERSONAL') setViewManager('personal');
                      }} 
                    />
                  )}
                </motion.div>
              </RBACGuard>
            )}
          </AnimatePresence>
          )} {/* fecha o authLoading ternário */}

        </div>
      </div>
      
      {/* Vercel Speed Insights - Performance Monitoring */}
      <SpeedInsights />
      
      {/* Debug Logs removed - component missing */}
      {isAuthenticated && <DebugOverlay user={user} userRole={userRole} viewManager={viewManager} />}
    </MusicProvider>
  );
}

export default App;
