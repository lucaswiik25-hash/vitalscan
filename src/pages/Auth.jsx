import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';

export default function Auth() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fn = mode === 'signin' ? signIn : signUp;
      const { error: authError } = await fn(email.trim(), password);
      if (authError) setError(authError.message);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-foreground mb-1">VitalScan</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {mode === 'signin' ? 'Sign in to continue' : 'Create your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-12 rounded-2xl border border-border px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full h-12 rounded-2xl border border-border px-4 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-2xl bg-foreground text-white text-sm font-semibold disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          className="w-full mt-4 text-sm text-muted-foreground"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
