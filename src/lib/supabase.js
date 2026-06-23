/**
 * Supabase shim — Supabase has been removed; this prevents import errors.
 */
export const supabase = null;
export const isSupabaseConfigured = false;
export function getSupabaseConfigError() { return null; }