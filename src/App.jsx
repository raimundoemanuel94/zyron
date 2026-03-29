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
import AdminScreen from './components/AdminScreen';
import ErrorBoundary from './components/ErrorBoundary';
import ErrorDiagnostics from './components/ErrorDiagnostics';
import ErrorLogger from './components/ErrorLogger';
import PWASplashScreen from './components/PWASplashScreen';
import RBACGuard from './components/RBACGuard';
import PersonalDashboard from './components/admin/PersonalDashboard';
import audioUnlocker from './utils/audioUnlock.js';

/* ── Debug Overlay — só aparece em modo desenvolvimento ── */
const DebugOverlay = ({ user, userRole, viewManager }) => {
  // Esconde completamente em produção
  if (import.meta.env.PROD) return null;

  return (
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
};

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
            /* Tela de aguardo — preto puro enquanto Supabase confirma auth */
            <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
            </div>
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
                    <LoginScreen
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

        {/* ── Debug Overlay — apenas em desenvolvimento ── */}
        {isAuthenticated && (
          <DebugOverlay user={user} userRole={userRole} viewManager={viewManager} />
        )}
      </div>
    </MusicProvider>
  );
}

export default App;
