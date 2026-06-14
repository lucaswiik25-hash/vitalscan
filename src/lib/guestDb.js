import { fileToBase64 } from './imageUtils';
import { createDefaultProfile } from './demoMode';

const PREFIX = 'vitalscan_guest_';
const PROFILE_KEY = `${PREFIX}profile`;

function newId() {
  return crypto.randomUUID();
}

function readTable(table) {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}${table}`) || '[]');
  } catch {
    return [];
  }
}

function writeTable(table, rows) {
  localStorage.setItem(`${PREFIX}${table}`, JSON.stringify(rows));
}

function applyFilters(rows, filters = {}) {
  return rows.filter((row) => {
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'created_by') continue;
      if (value === undefined || value === null) continue;
      if (row[key] !== value) return false;
    }
    return true;
  });
}

function applySortAndLimit(rows, { sort = '-created_at', limit } = {}) {
  const column = (sort.replace(/^-/, '') || 'created_at').replace('created_date', 'created_at');
  const asc = !sort.startsWith('-');
  const sorted = [...rows].sort((a, b) => {
    const av = a[column] ?? '';
    const bv = b[column] ?? '';
    if (av < bv) return asc ? -1 : 1;
    if (av > bv) return asc ? 1 : -1;
    return 0;
  });
  return limit ? sorted.slice(0, limit) : sorted;
}

function listRows(table, filters = {}, options = {}) {
  const rows = applySortAndLimit(applyFilters(readTable(table), filters), options);
  return rows;
}

function insertRow(table, record) {
  const now = new Date().toISOString();
  const row = {
    id: newId(),
    created_at: now,
    updated_at: now,
    ...record,
  };
  const rows = readTable(table);
  rows.push(row);
  writeTable(table, rows);
  return row;
}

function updateRow(table, id, updates) {
  const rows = readTable(table);
  const idx = rows.findIndex((row) => row.id === id);
  if (idx === -1) throw new Error(`Record not found in ${table}`);
  const updated = {
    ...rows[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  rows[idx] = updated;
  writeTable(table, rows);
  return updated;
}

function deleteRow(table, id) {
  writeTable(table, readTable(table).filter((row) => row.id !== id));
}

function readProfile() {
  try {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // fall through
  }
  const profile = createDefaultProfile();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

function writeProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  return profile;
}

export async function getProfile() {
  return readProfile();
}

export async function getProfileList() {
  const profile = await getProfile();
  return profile?.id ? [profile] : [];
}

export async function upsertProfile(updates) {
  const existing = readProfile();
  const updated = {
    ...existing,
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return writeProfile(updated);
}

export async function deleteProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

export async function listFoodLogs(filters = {}, options = {}) {
  return listRows('food_logs', filters, options);
}

export async function createFoodLog(record) {
  return insertRow('food_logs', record);
}

export async function updateFoodLog(id, updates) {
  return updateRow('food_logs', id, updates);
}

export async function deleteFoodLog(id) {
  deleteRow('food_logs', id);
}

export async function listHydrationLogs(filters = {}, options = {}) {
  return listRows('hydration_logs', filters, options);
}

export async function createHydrationLog(record) {
  return insertRow('hydration_logs', record);
}

export async function deleteHydrationLog(id) {
  deleteRow('hydration_logs', id);
}

export async function listSleepLogs(filters = {}, options = {}) {
  return listRows('sleep_logs', filters, { sort: options.sort || '-date', limit: options.limit });
}

export async function createSleepLog(record) {
  return insertRow('sleep_logs', record);
}

export async function updateSleepLog(id, updates) {
  return updateRow('sleep_logs', id, updates);
}

export async function deleteSleepLog(id) {
  deleteRow('sleep_logs', id);
}

export async function listExerciseLogs(filters = {}, options = {}) {
  return listRows('exercise_logs', filters, options);
}

export async function createExerciseLog(record) {
  return insertRow('exercise_logs', record);
}

export async function updateExerciseLog(id, updates) {
  return updateRow('exercise_logs', id, updates);
}

export async function deleteExerciseLog(id) {
  deleteRow('exercise_logs', id);
}

export async function listSupplements(filters = {}, options = {}) {
  return listRows('supplements', filters, options);
}

export async function createSupplement(record) {
  return insertRow('supplements', record);
}

export async function updateSupplement(id, updates) {
  return updateRow('supplements', id, updates);
}

export async function deleteSupplement(id) {
  deleteRow('supplements', id);
}

export async function listScanHistory(filters = {}, options = {}) {
  return listRows('scan_history', filters, options);
}

export async function createScanHistory(record) {
  return insertRow('scan_history', record);
}

export async function deleteScanHistory(id) {
  deleteRow('scan_history', id);
}

export async function uploadFile(fileOrOpts) {
  const file = fileOrOpts?.file ?? fileOrOpts;
  const { dataUrl } = await fileToBase64(file);
  return { file_url: dataUrl };
}

export async function prepareImageForAI(file) {
  const { base64, mediaType, dataUrl } = await fileToBase64(file);
  return {
    file_url: dataUrl,
    image_base64: base64,
    image_media_type: mediaType,
  };
}
