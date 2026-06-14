import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { isAuthCallback } from './authCallback';
import { isDemoMode, DEMO_USER } from './demoMode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(isDemoMode ? DEMO_USER : null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isDemoMode ? false : () => isAuthCallback());

  useEffect(() => {
    if (isDemoMode) return undefined;

    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
      if (s && isAuthCallback()) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (!isAuthCallback() || s) {
        setLoading(false);
      }
    });

    const timeout = isAuthCallback()
      ? window.setTimeout(() => {
          if (mounted) setLoading(false);
        }, 10000)
      : null;

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    if (isDemoMode) return;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
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
