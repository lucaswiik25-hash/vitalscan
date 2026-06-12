import { supabase } from './supabase';

export async function getSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase is not configured') };
  return supabase.auth.signOut();
}

export async function getSessionUser() {
  const session = await getSession();
  return session?.user ?? null;
}
