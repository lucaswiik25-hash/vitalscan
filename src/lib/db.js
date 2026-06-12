import { supabase } from './supabase';
import { fileToBase64 } from './imageUtils';

async function getUserId() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function applyFilters(query, filters = {}) {
  let q = query;
  for (const [key, value] of Object.entries(filters)) {
    if (key === 'created_by') continue;
    if (value === undefined || value === null) continue;
    q = q.eq(key, value);
  }
  return q;
}

function applySortAndLimit(query, { sort = '-created_at', limit } = {}) {
  const column = (sort.replace(/^-/, '') || 'created_at').replace('created_date', 'created_at');
  let q = query.order(column, { ascending: !sort.startsWith('-') });
  if (limit) q = q.limit(limit);
  return q;
}

// ── Profiles ──────────────────────────────────────────────────────────────────

export async function getProfile() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Legacy compat — returns 0 or 1 profile in an array. */
export async function getProfileList() {
  const profile = await getProfile();
  return profile?.id ? [profile] : [];
}

export async function upsertProfile(updates) {
  const userId = await getUserId();
  const existing = await getProfile();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert({ ...updates, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Food logs ─────────────────────────────────────────────────────────────────

export async function listFoodLogs(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('food_logs').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createFoodLog(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_logs')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFoodLog(id, updates) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('food_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteFoodLog(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('food_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Hydration logs ────────────────────────────────────────────────────────────

export async function listHydrationLogs(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('hydration_logs').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createHydrationLog(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('hydration_logs')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteHydrationLog(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('hydration_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Sleep logs ────────────────────────────────────────────────────────────────

export async function listSleepLogs(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('sleep_logs').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, { sort: options.sort || '-date', limit: options.limit });
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSleepLog(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('sleep_logs')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSleepLog(id, updates) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('sleep_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSleepLog(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('sleep_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Exercise logs ─────────────────────────────────────────────────────────────

export async function listExerciseLogs(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('exercise_logs').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExerciseLog(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExerciseLog(id, updates) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('exercise_logs')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteExerciseLog(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Supplements ───────────────────────────────────────────────────────────────

export async function listSupplements(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('supplements').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createSupplement(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('supplements')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplement(id, updates) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('supplements')
    .update(updates)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSupplement(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('supplements')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Scan history ──────────────────────────────────────────────────────────────

export async function listScanHistory(filters = {}, options = {}) {
  const userId = await getUserId();
  let query = supabase.from('scan_history').select('*').eq('user_id', userId);
  query = applyFilters(query, filters);
  query = applySortAndLimit(query, options);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createScanHistory(record) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('scan_history')
    .insert({ ...record, user_id: userId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteScanHistory(id) {
  const userId = await getUserId();
  const { error } = await supabase
    .from('scan_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ── Storage ───────────────────────────────────────────────────────────────────

export async function uploadFile(fileOrOpts, bucket = 'uploads') {
  const file = fileOrOpts?.file ?? fileOrOpts;
  const userId = await getUserId();
  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { file_url: data.publicUrl };
}

/** Prepare a file for Claude — always sends base64; uploads to storage when possible. */
export async function prepareImageForAI(file) {
  const { base64, mediaType, dataUrl } = await fileToBase64(file);
  let file_url = dataUrl;

  try {
    const uploaded = await uploadFile(file);
    file_url = uploaded.file_url;
  } catch (err) {
    console.warn('Storage upload skipped, using inline image for AI:', err?.message || err);
  }

  return {
    file_url,
    image_base64: base64,
    image_media_type: mediaType,
  };
}

// Re-export AI helpers (implemented in ai.js)
export { analyzeWithClaude, invokeLLM } from './ai';
