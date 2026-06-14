import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export function getSupabaseConfigError() {
  if (!supabaseUrl) {
    return 'VITE_SUPABASE_URL is not set. Add it to your .env file for local dev, or to Vercel Environment Variables for production builds.';
  }
  if (!supabaseAnonKey) {
    return 'VITE_SUPABASE_ANON_KEY is not set. Add it to your .env file for local dev, or to Vercel Environment Variables for production builds.';
  }
  return null;
}

export const isSupabaseConfigured = !getSupabaseConfigError();

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;
