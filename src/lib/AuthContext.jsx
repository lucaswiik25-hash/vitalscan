import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.pathname);
  };

  useEffect(() => {
    base44.auth.me()
      .then((u) => {
        setUser(u);
        setIsLoadingAuth(false);
      })
      .catch((err) => {
        setIsLoadingAuth(false);
        const msg = err?.message || '';
        if (msg.includes('not registered') || err?.status === 403) {
          setAuthError({ type: 'user_not_registered' });
        } else {
          setAuthError({ type: 'auth_required' });
        }
      });
  }, []);

  const logout = async () => {
    await base44.auth.logout('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      navigateToLogin,
      logout,
      loading: isLoadingAuth,
      signOut: logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};