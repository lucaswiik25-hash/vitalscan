import { supabase } from './supabase';
import { isDemoMode } from './demoMode';

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (isDemoMode) return { error: null };
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signOut();
}

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}
