import { supabase } from './supabase';

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function onAuthChange(callback) {
  if (!supabase) return { unsubscribe: () => {} };
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return data.subscription;
}

export async function signIn(email, password) {
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signOut();
}

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}
