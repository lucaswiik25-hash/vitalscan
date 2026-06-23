/**
 * Base44 compatibility shim — replaces the old Supabase db.js.
 * All calls now route to base44.entities.* 
 */
import { base44 } from '@/api/base44Client';

// ── UserProfile ───────────────────────────────────────────────────────────────

export async function getProfile() {
  const list = await base44.entities.UserProfile.list();
  return list[0] || null;
}

export async function getProfileList() {
  return base44.entities.UserProfile.list();
}

export async function upsertProfile(updates) {
  const existing = await getProfile();
  if (existing?.id) {
    return base44.entities.UserProfile.update(existing.id, updates);
  }
  return base44.entities.UserProfile.create(updates);
}

export async function deleteProfile(id) {
  return base44.entities.UserProfile.delete(id);
}

// ── Meals (food_logs) ─────────────────────────────────────────────────────────

export async function listFoodLogs(filters = {}) {
  return base44.entities.Meal.filter({ logged: true, ...filters });
}

export async function createFoodLog(record) {
  return base44.entities.Meal.create(record);
}

export async function updateFoodLog(id, updates) {
  return base44.entities.Meal.update(id, updates);
}

export async function deleteFoodLog(id) {
  return base44.entities.Meal.delete(id);
}

// ── WaterLog (hydration_logs) ─────────────────────────────────────────────────

export async function listHydrationLogs(filters = {}) {
  return base44.entities.WaterLog.filter(filters);
}

export async function createHydrationLog(record) {
  return base44.entities.WaterLog.create(record);
}

export async function deleteHydrationLog(id) {
  return base44.entities.WaterLog.delete(id);
}

// ── SleepLog ──────────────────────────────────────────────────────────────────

export async function listSleepLogs(filters = {}) {
  return base44.entities.SleepLog.filter(filters);
}

export async function createSleepLog(record) {
  return base44.entities.SleepLog.create(record);
}

export async function updateSleepLog(id, updates) {
  return base44.entities.SleepLog.update(id, updates);
}

export async function deleteSleepLog(id) {
  return base44.entities.SleepLog.delete(id);
}

// ── Exercise ──────────────────────────────────────────────────────────────────

export async function listExerciseLogs(filters = {}) {
  return base44.entities.Exercise.filter(filters);
}

export async function createExerciseLog(record) {
  return base44.entities.Exercise.create(record);
}

export async function updateExerciseLog(id, updates) {
  return base44.entities.Exercise.update(id, updates);
}

export async function deleteExerciseLog(id) {
  return base44.entities.Exercise.delete(id);
}

// ── Supplements ───────────────────────────────────────────────────────────────

export async function listSupplements(filters = {}) {
  return base44.entities.Supplement.filter(filters);
}

export async function createSupplement(record) {
  return base44.entities.Supplement.create(record);
}

export async function updateSupplement(id, updates) {
  return base44.entities.Supplement.update(id, updates);
}

export async function deleteSupplement(id) {
  return base44.entities.Supplement.delete(id);
}

// ── ScanHistory ───────────────────────────────────────────────────────────────

export async function listScanHistory(filters = {}) {
  return base44.entities.ScanResult.filter(filters);
}

export async function createScanHistory(record) {
  return base44.entities.ScanResult.create(record);
}

export async function deleteScanHistory(id) {
  return base44.entities.ScanResult.delete(id);
}

// ── File upload ───────────────────────────────────────────────────────────────

export async function uploadFile(fileOrOpts) {
  const file = fileOrOpts?.file ?? fileOrOpts;
  return base44.integrations.Core.UploadFile({ file });
}

export async function prepareImageForAI(file) {
  const { file_url } = await uploadFile(file);
  return { file_url };
}