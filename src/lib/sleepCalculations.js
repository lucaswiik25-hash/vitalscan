import { format, subDays } from 'date-fns';

export const TARGET_HOURS = 8;
export const TARGET_MINUTES = TARGET_HOURS * 60;

export const MOOD_OPTIONS = [
  { key: 'great', emoji: '😄', label: 'Great' },
  { key: 'good', emoji: '🙂', label: 'Good' },
  { key: 'okay', emoji: '😐', label: 'Okay' },
  { key: 'tired', emoji: '😴', label: 'Tired' },
  { key: 'bad', emoji: '😞', label: 'Bad' },
];

export function timeToMinutes(time) {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function minutesToTime(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

export function formatTime12(time) {
  if (!time) return '';
  const mins = timeToMinutes(time);
  const h24 = Math.floor(mins / 60);
  const min = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function calcDurationMinutes(sleepTime, wakeTime) {
  const sleepMins = timeToMinutes(sleepTime);
  const wakeMins = timeToMinutes(wakeTime);
  let diff = wakeMins - sleepMins;
  if (diff <= 0) diff += 1440;
  return diff;
}

export function calcDurationScore(durationMin) {
  if (!durationMin) return 0;
  const h = durationMin / 60;
  if (h < 4) return 20;
  if (h < 6) return Math.round(20 + (h - 4) * 20);
  if (h <= 9) return Math.round(60 + ((h - 6) / 3) * 40);
  return Math.max(40, 100 - Math.round((h - 9) * 15));
}

export function calcConsistencyScore(sleepLogs, currentSleepTime) {
  const recent = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
  if (recent.length < 2) return null;
  const times = recent.map((l) => timeToMinutes(l.sleep_time)).filter((t) => t > 0);
  if (times.length < 2) return null;
  const avg = times.reduce((s, t) => s + t, 0) / times.length;
  const variance = times.reduce((s, t) => s + Math.abs(t - avg), 0) / times.length;
  // variance in minutes; 0 = perfect, 120+ = bad
  return Math.max(0, Math.round(100 - (variance / 120) * 100));
}

export function calcConsistencyBonus(consistencyScore) {
  if (consistencyScore == null) return 0;
  if (consistencyScore >= 80) return 10;
  if (consistencyScore >= 60) return 5;
  return 0;
}

export function calcHabitsScore(waterMl, waterTarget, hadMeals, exercised) {
  let score = 50;
  const waterPct = waterTarget > 0 ? waterMl / waterTarget : 0;
  if (waterPct >= 1) score += 20;
  else if (waterPct >= 0.7) score += 10;
  if (hadMeals) score += 15;
  if (exercised) score += 15;
  return Math.min(100, score);
}

export function calcHabitBonus(waterMl, waterTarget, hadMeals) {
  let bonus = 0;
  if (waterTarget > 0 && waterMl / waterTarget >= 1) bonus += 5;
  if (hadMeals) bonus += 5;
  return bonus;
}

export function calcSleepScore(durationMin, consistencyBonus, habitBonus) {
  const base = calcDurationScore(durationMin);
  return Math.min(100, base + consistencyBonus + habitBonus);
}

export function calcSleepDebtMinutes(sleepLogs) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const last7 = Array.from({ length: 7 }, (_, i) =>
    format(subDays(new Date(), i), 'yyyy-MM-dd')
  );
  let debt = 0;
  for (const dateStr of last7) {
    const log = sleepLogs.find((l) => l.date === dateStr);
    if (log?.duration_minutes) {
      const diff = TARGET_MINUTES - log.duration_minutes;
      if (diff > 0) debt += diff;
    }
  }
  return debt;
}

export function debtLevel(debtMinutes) {
  if (debtMinutes === 0) return { label: 'None', color: '#10B981' };
  if (debtMinutes <= 60) return { label: 'Low', color: '#F59E0B' };
  if (debtMinutes <= 180) return { label: 'Moderate', color: '#F97316' };
  return { label: 'High', color: '#EF4444' };
}

export function debtTip(level) {
  if (level === 'None') return 'Great job! You\'re fully caught up on sleep this week.';
  if (level === 'Low') return 'Add 20–30 extra minutes a night for the next few days to recover.';
  if (level === 'Moderate') return 'Try going to bed an hour earlier tonight to start recovering.';
  return 'Prioritise sleep this weekend — avoid late nights and sleep in if you can.';
}

export function calcCycleBedtimes(wakeTime) {
  const wakeMins = timeToMinutes(wakeTime);
  const fallAsleepMins = 15;
  return [5, 4, 3].map((cycles) => {
    const cycleMins = cycles * 90;
    const bedtimeMins = wakeMins - cycleMins - fallAsleepMins;
    const time = minutesToTime(bedtimeMins);
    return { cycles, time, label: `${formatTime12(time)} (${cycles * 1.5}h)` };
  });
}

export function barColorForHours(hours) {
  if (hours >= 7 && hours <= 9) return '#10B981';
  if (hours >= 6) return '#F59E0B';
  return '#EF4444';
}

export function buildWeekDays(sleepLogs) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = sleepLogs.find((l) => l.date === dateStr);
    return {
      date: dateStr,
      label: format(d, 'EEEEE'),
      hours: log?.duration_minutes ? log.duration_minutes / 60 : 0,
      log: log || null,
    };
  });
}

export function generateInsights(sleepLogs, meals, waterLogs, exercises, waterTarget) {
  const count = sleepLogs.length;
  if (count < 5) return { ready: false, count, insights: [] };

  const insights = [];
  const recent = [...sleepLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);

  const avgDuration = recent.reduce((s, l) => s + (l.duration_minutes || 0), 0) / recent.length;
  if (avgDuration < TARGET_MINUTES - 30) {
    insights.push({ text: `Your average sleep of ${formatDuration(Math.round(avgDuration))} is below the 8h goal. Try an earlier bedtime.`, border: '#EF4444' });
  } else {
    insights.push({ text: `You're averaging ${formatDuration(Math.round(avgDuration))} per night — keep it up!`, border: '#10B981' });
  }

  const scores = recent.map((l) => l.sleep_score).filter(Boolean);
  if (scores.length >= 3) {
    const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
    if (avg >= 75) {
      insights.push({ text: 'Your sleep scores are consistently high — your habits are paying off.', border: '#10B981' });
    } else if (avg < 50) {
      insights.push({ text: 'Sleep quality has been low recently. Review your evening routine.', border: '#F59E0B' });
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayWater = waterLogs.filter((w) => w.date === todayStr && w.amount_ml > 0).reduce((s, w) => s + w.amount_ml, 0);
  if (waterTarget > 0 && todayWater < waterTarget * 0.6) {
    insights.push({ text: 'Low hydration today may affect your sleep quality tonight. Drink more water before bed.', border: '#6366F1' });
  }

  return { ready: true, count, insights };
}