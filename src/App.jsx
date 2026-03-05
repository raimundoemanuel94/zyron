import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import FichaDeTreinoScreen from './components/FichaDeTreinoScreen';
import AdminScreen from './components/AdminScreen';
import PWAInstallBanner from './components/PWAInstallBanner';
import { MusicProvider } from './contexts/MusicContext';
import GlobalPlayer from './components/GlobalPlayer';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // 'app' | 'admin'
  const globalConstraintsRef = useRef(null);

  // Initial Auth Sync
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        setUser(session.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
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

        <PWAInstallBanner />
      </div>
    </MusicProvider>
  );
}

export default App;
