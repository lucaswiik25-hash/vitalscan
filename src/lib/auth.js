/**
 * Base44 auth shim — replaces old Supabase auth.js
 */
import { base44 } from '@/api/base44Client';

export async function getSession() {
  return base44.auth.me().catch(() => null);
}

export async function signOut() {
  return base44.auth.logout('/');
}

export async function getSessionUser() {
  return base44.auth.me().catch(() => null);
}