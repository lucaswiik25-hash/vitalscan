import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getPostAuthPath } from '@/lib/postAuth';
import { isAuthCallback } from '@/lib/authCallback';
import { isDemoMode } from '@/lib/demoMode';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
  </div>
);

export function RequireAuth() {
  const { user, loading } = useAuth();

  if (isDemoMode) return <Outlet />;
  if (loading || (isAuthCallback() && !user)) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RedirectIfAuth() {
  const { user, loading } = useAuth();
  const [destination, setDestination] = useState(null);

  useEffect(() => {
    if (isDemoMode || !user) {
      setDestination(null);
      return;
    }
    let cancelled = false;
    getPostAuthPath().then((path) => {
      if (!cancelled) setDestination(path);
    });
    return () => { cancelled = true; };
  }, [user]);

  if (isDemoMode) return <Navigate to="/" replace />;
  if (loading || (user && destination === null)) return <LoadingScreen />;
  if (user) return <Navigate to={destination || '/onboarding'} replace />;
  return <Outlet />;
}

export function RequireOnboardingComplete() {
  const { profile, loading } = useUserProfile();

  if (isDemoMode) return <Outlet />;
  if (loading) return <LoadingScreen />;
  if (!profile?.onboarding_complete) {
    return <Navigate to="/onboarding" replace />;
  }
  return <Outlet />;
}
