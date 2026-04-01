import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import logger from './utils/logger';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MusicProvider } from './contexts/MusicContext';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import FichaDeTreinoScreen from './components/FichaDeTreinoScreen';
import GlobalPlayer from './components/GlobalPlayer';
import OnboardingScreen from './components/OnboardingScreen';
import LoginScreen from './components/LoginScreen';
import LoginScreenModerno from './components/LoginScreenModerno';
import AdminScreen from './components/AdminScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDiagnostics from './components/ErrorDiagnostics';
import ErrorLogger from './components/ErrorLogger';
import PWASplashScreen from './components/PWASplashScreen';
import RBACGuard from './components/RBACGuard';
import PersonalDashboard from './components/admin/PersonalDashboard';
import audioUnlocker from './utils/audioUnlock.js';
import hardcorePWA from './utils/hardcorePWA.js';



function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading]         = useState(true);
  const [user, setUser]                       = useState(null);
  const [userRole, setUserRole]               = useState(null);
  const [showOnboarding, setShowOnboarding]   = useState(false);
  const [viewManager, setViewManager]         = useState('app');
  const globalConstraintsRef                  = useRef(null);

  useEffect(() => {
    logger.systemEvent('App inicializado', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        logger.userAction('Login automático via sessão', {
          userId: session.user.id,
          email: session.user.email,
        });
        setIsAuthenticated(true);
        setUser(session.user);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        logger.userAction('Usuário autenticado', {
          userId: session.user.id,
          email: session.user.email,
          event: _event,
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
  }, []);

  // Initialize Audio Context on first interaction
  useEffect(() => {
    const handleInteraction = async () => {
      await audioUnlocker.init();
      await audioUnlocker.unlock();
      // Once unlocked, we can remove the global listener
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

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
      <div
        ref={globalConstraintsRef}
        className="relative min-h-screen w-full bg-black overflow-x-hidden selection:bg-yellow-400 selection:text-black"
      >
        {/* ── Global Media Layer — persiste entre todas as views ── */}
        {isAuthenticated && (
          <GlobalPlayer constraintsRef={globalConstraintsRef} />
        )}

        {/* ── App Shell — fundo preto puro, sem purple ── */}
        <div className="min-h-screen bg-black text-white overflow-hidden">
          <SpeedInsights />

          {authLoading ? (
            <PWASplashScreen />
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
                    <OnboardingScreen
                      onComplete={handleLogin}
                      onCancel={() => setShowOnboarding(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="login"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <LoginScreenModerno
                      onLogin={handleLogin}
                      onRegisterClick={() => setShowOnboarding(true)}
                    />
                  </motion.div>
                )
              ) : (
                <RBACGuard
                  user={user}
                  onRoleVerified={(role) => {
                    console.log('[App] Role verified:', role);
                    setUserRole(role);
                  }}
                >
                  <motion.div
                    key="main-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                    className="w-full"
                  >
                    {viewManager === 'admin' ? (
                      <AdminScreen
                        user={user}
                        onLogout={handleLogout}
                        onBack={() => setViewManager('app')}
                      />
                    ) : viewManager === 'personal' ? (
                      <PersonalDashboard
                        user={user}
                        onLogout={handleLogout}
                        onBack={() => setViewManager('app')}
                      />
                    ) : (
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
          )}
        </div>
      </div>
    </MusicProvider>
  );
}

export default App;
