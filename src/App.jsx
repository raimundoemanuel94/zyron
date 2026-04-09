import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import logger from './utils/logger';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { MusicProvider } from './contexts/MusicContext';
import FichaDeTreinoScreen from './components/screens/FichaDeTreinoScreen';
import GlobalPlayer from './components/shared/GlobalPlayer';
import OnboardingScreen from './components/screens/OnboardingScreen';
import LoginScreenModerno from './components/screens/LoginScreenModerno';
import AdminScreen from './components/screens/AdminScreen';
import PWASplashScreen from './components/screens/PWASplashScreen';
import RBACGuard from './components/shared/RBACGuard';
import PersonalDashboard from './components/admin/PersonalDashboard';
import audioUnlocker from './utils/audioUnlock.js';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // app | admin | personal
  const [swUpdateReady, setSwUpdateReady] = useState(false);

  const globalConstraintsRef = useRef(null);

  // ── PWA Update Banner ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleUpdate = () => setSwUpdateReady(true);
    window.addEventListener('zyron:sw-update', handleUpdate);
    return () => window.removeEventListener('zyron:sw-update', handleUpdate);
  }, []);

  useEffect(() => {
    logger.systemEvent('App inicializado', {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        logger.userAction('Login automático via sessão', {
          userId: session.user.id,
          email: session.user.email,
        });

        setIsAuthenticated(true);
        setUser(session.user);
      }

      setAuthLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        logger.userAction('Usuário autenticado', {
          userId: session.user.id,
          email: session.user.email,
          event,
        });

        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        logger.userAction('Usuário deslogado', { event });

        setIsAuthenticated(false);
        setUser(null);
        setUserRole(null);
        setViewManager('app');
      }

      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleInteraction = async () => {
      await audioUnlocker.init();
      await audioUnlocker.unlock();

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
    setViewManager('app');
  };

  const handleOpenAdminArea = () => {
    if (userRole === 'ADMIN') {
      setViewManager('admin');
      return;
    }

    if (userRole === 'PERSONAL') {
      setViewManager('personal');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
    setUserRole(null);
    setShowOnboarding(false);
    setViewManager('app');
  };

  const renderUnauthenticatedArea = () => {
    if (showOnboarding) {
      return (
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
      );
    }

    return (
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
    );
  };

  const renderAuthenticatedArea = () => {
    if (viewManager === 'admin') {
      return (
        <AdminScreen
          user={user}
          onLogout={handleLogout}
          onBack={() => setViewManager('app')}
        />
      );
    }

    if (viewManager === 'personal') {
      return (
        <PersonalDashboard
          user={user}
          onLogout={handleLogout}
          onBack={() => setViewManager('app')}
        />
      );
    }

    return (
      <FichaDeTreinoScreen
        user={user}
        onLogout={handleLogout}
        onOpenAdmin={handleOpenAdminArea}
      />
    );
  };

  return (
    <MusicProvider>
      <div
        ref={globalConstraintsRef}
        className="relative min-h-screen w-full overflow-x-hidden bg-black selection:bg-yellow-400 selection:text-black"
      >
        {swUpdateReady && (
          <div
            style={{
              position: 'fixed',
              bottom: 80,
              left: 16,
              right: 16,
              zIndex: 9999,
              background: '#1a1a1a',
              border: '1px solid rgba(205,255,90,0.35)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
              Nova versão disponível
            </span>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#cdff5a',
                color: '#000',
                border: 'none',
                borderRadius: 8,
                padding: '6px 14px',
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Atualizar
            </button>
          </div>
        )}
        {isAuthenticated && (
          <GlobalPlayer constraintsRef={globalConstraintsRef} />
        )}

        <div className="min-h-screen bg-black text-white">
          <SpeedInsights />

          {authLoading ? (
            <PWASplashScreen />
          ) : (
            <AnimatePresence mode="wait">
              {!isAuthenticated ? (
                renderUnauthenticatedArea()
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
                    {renderAuthenticatedArea()}
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

