import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AUTH_SESSION_RESET_EVENT, getSessionOrHandleInvalidRefresh } from '../lib/sessionRecovery';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Get initial session
    getSessionOrHandleInvalidRefresh().then(({ session }) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    const handleSessionReset = () => {
      setUser(null);
      setIsAuthenticated(false);
    };
    window.addEventListener(AUTH_SESSION_RESET_EVENT, handleSessionReset);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener(AUTH_SESSION_RESET_EVENT, handleSessionReset);
    };
  }, []);

  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
