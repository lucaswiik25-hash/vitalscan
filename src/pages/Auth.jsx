import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getAuthRedirectUrl, isAuthCallback } from '@/lib/authCallback';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { getPostAuthPath } from '@/lib/postAuth';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const finishingOAuth = isAuthCallback();

  useEffect(() => {
    if (!finishingOAuth) return;
    setGoogleLoading(true);
  }, [finishingOAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) {
          setError(getAuthErrorMessage(authError));
          return;
        }
        if (data.session) {
          const path = await getPostAuthPath();
          navigate(path, { replace: true });
        }
      } else {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: getAuthRedirectUrl(),
          },
        });
        if (authError) {
          setError(getAuthErrorMessage(authError));
          return;
        }
        if (data.session) {
          const path = await getPostAuthPath();
          navigate(path, { replace: true });
        } else {
          setInfo('Account created! Check your email and click the confirmation link — you\'ll be taken to onboarding after confirming.');
          setMode('signin');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setInfo('');
    setGoogleLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getAuthRedirectUrl() },
      });
      if (authError) {
        setError(getAuthErrorMessage(authError));
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setGoogleLoading(false);
    }
  };

  const busy = submitting || googleLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-foreground mb-1">VitalScan</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {finishingOAuth
            ? 'Finishing sign in…'
            : mode === 'signin'
              ? 'Sign in to continue'
              : 'Create your account'}
        </p>

        {finishingOAuth && (
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy || finishingOAuth}
          className="w-full h-12 rounded-2xl border border-border bg-white text-sm font-semibold text-foreground flex items-center justify-center gap-3 disabled:opacity-60 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className={`space-y-4 ${finishingOAuth ? 'pointer-events-none opacity-50' : ''}`}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full h-12 rounded-2xl border border-border px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            className="w-full h-12 rounded-2xl border border-border px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          {info && (
            <p className="text-sm text-emerald-600">{info}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-12 rounded-2xl bg-foreground text-white text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo(''); }}
          className="w-full mt-4 text-sm text-muted-foreground"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
