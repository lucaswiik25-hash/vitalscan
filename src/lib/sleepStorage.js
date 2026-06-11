const LOGS_KEY = 'scanly_sleep_logs';
const HOURS_KEY = 'scanly_sleep';

export function loadLocalSleepLogs() {
  try {
    const raw = localStorage.getItem(LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalSleepLog(log) {
  const logs = loadLocalSleepLogs();
  const idx = logs.findIndex((l) => l.date === log.date);
  const entry = {
    ...log,
    id: log.id || `local-${log.date}`,
    _local: !log.id || String(log.id).startsWith('local-'),
  };
  if (idx >= 0) logs[idx] = { ...logs[idx], ...entry };
  else logs.push(entry);

  try {
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    const hours = log.duration_minutes ? log.duration_minutes / 60 : 0;
    const stored = JSON.parse(localStorage.getItem(HOURS_KEY) || '{}');
    stored[log.date] = hours;
    localStorage.setItem(HOURS_KEY, JSON.stringify(stored));
  } catch {
    /* ignore */
  }

  return entry;
}

export function mergeSleepLogs(apiLogs = [], localLogs = []) {
  const byDate = new Map();
  localLogs.forEach((l) => {
    if (l?.date) byDate.set(l.date, l);
  });
  apiLogs.forEach((l) => {
    if (l?.date) byDate.set(l.date, l);
  });
  return Array.from(byDate.values()).sort((a, b) => b.date.localeCompare(a.date));
}
