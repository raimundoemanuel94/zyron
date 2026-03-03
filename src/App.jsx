import React, { useState, useEffect } from 'react';
import FichaDeTreinoScreen from './components/FichaDeTreinoScreen';
import LoginScreen from './components/LoginScreen';
import OnboardingScreen from './components/OnboardingScreen';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from './lib/supabase';
import AdminScreen from './components/AdminScreen';
import PWAInstallBanner from './components/PWAInstallBanner';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewManager, setViewManager] = useState('app'); // 'app' | 'admin'

  // Auth Listener
  useEffect(() => {
    // NUCLEAR CACHE BUSTER FOR PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name);
        })
      });
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
        
      if (data) {
        setIsAuthenticated(true);
        setUser({ ...data });
      } else {
         // Fallback manual if profile not found
         setIsAuthenticated(true);
         setUser({ name: authUser.email?.split('@')[0] || 'Aluno', role: 'PRO', email: authUser.email });
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  const handleLogin = (userData) => {
    // supabase onAuthStateChange handles the actual login state.
    // We just need to close the onboarding modal here.
    setShowOnboarding(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
    <AnimatePresence mode="wait">
      {showOnboarding ? (
        <motion.div key="onboarding" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="min-h-screen w-full">
          <OnboardingScreen onComplete={handleLogin} onCancel={() => setShowOnboarding(false)} />
        </motion.div>
      ) : !isAuthenticated ? (
        <motion.div key="login" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="min-h-screen w-full">
          <LoginScreen onLogin={handleLogin} onRegisterClick={() => setShowOnboarding(true)} />
        </motion.div>
      ) : viewManager === 'admin' && user?.role === 'ADMIN' ? (
        <motion.div key="admin" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="min-h-screen w-full">
          <AdminScreen onLogout={handleLogout} onBack={() => setViewManager('app')} />
        </motion.div>
      ) : (
        <motion.div key="app" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="min-h-screen w-full">
          <FichaDeTreinoScreen user={user} onLogout={handleLogout} onOpenAdmin={() => setViewManager('admin')} />
        </motion.div>
      )}
    </AnimatePresence>
    <PWAInstallBanner />
    </>
  );
}

export default App;
