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

export const QUALITY_OPTIONS = [
  { key: 'poor', emoji: '😥', label: 'Poor', desc: 'Woke up multiple times, feel exhausted' },
  { key: 'fair', emoji: '😐', label: 'Fair', desc: 'Some interruptions, moderately rested' },
  { key: 'good', emoji: '🙂', label: 'Good', desc: 'Solid sleep, feel reasonably refreshed' },
  { key: 'excellent', emoji: '😴', label: 'Excellent', desc: 'Deep, uninterrupted, fully energized' },
];

export const QUALITY_EMOJI = {
  poor: '😥',
  fair: '😐',
  good: '🙂',
  excellent: '😴',
  great: '😄',
  okay: '😐',
  tired: '😴',
  bad: '😞',
};

export const NOTE_TAGS = [
  { label: 'Late meal', emoji: '🍩' },
  { label: 'Caffeine', emoji: '☕' },
  { label: 'Stress', emoji: '😨' },
  { label: 'Screen time', emoji: '📱' },
  { label: 'Alcohol', emoji: '🍷' },
  { label: 'Workout', emoji: '💪' },
  { label: 'Vivid dream', emoji: '💭' },
  { label: 'Woke up early', emoji: '🌅' },
];

const CALENDAR_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const CALENDAR_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CALENDAR_DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function getCalendarWeekStart(date = new Date()) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function buildCalendarWeek(sleepLogs, referenceDate = new Date()) {
  const monday = getCalendarWeekStart(referenceDate);
  return CALENDAR_DAYS.map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = sleepLogs.find((l) => l.date === dateStr) || null;
    const hours = log?.duration_minutes ? log.duration_minutes / 60 : 0;
    const isToday = dateStr === format(referenceDate, 'yyyy-MM-dd');
    return {
      key: label,
      label,
      dayName: CALENDAR_DAY_NAMES[i],
      dayShort: CALENDAR_DAY_SHORT[i],
      dateStr,
      log,
      hours,
      quality: log?.mood || null,
      isToday,
    };
  });
}

export function calcWeekStreak(weekDays) {
  const todayIdx = weekDays.findIndex((d) => d.isToday);
  if (todayIdx < 0) return 0;
  let streak = 0;
  for (let i = todayIdx; i >= 0; i--) {
    if (weekDays[i].log) streak++;
    else break;
  }
  return streak;
}

export function calcWeekAvgHours(weekDays) {
  const logged = weekDays.filter((d) => d.hours > 0);
  if (!logged.length) return null;
  return logged.reduce((s, d) => s + d.hours, 0) / logged.length;
}

export function calcBestNight(weekDays) {
  const logged = weekDays.filter((d) => d.hours > 0);
  if (!logged.length) return null;
  return logged.reduce((best, d) => (d.hours > best.hours ? d : best), logged[0]);
}

export function hoursFromLog(log, defaultWake = '07:00') {
  if (log?.duration_minutes) return log.duration_minutes / 60;
  if (log?.sleep_time && log?.wake_time) return calcDurationMinutes(log.sleep_time, log.wake_time) / 60;
  return 7.5;
}

export function deriveTimesFromHours(hours, wakeTime = '07:00') {
  const wakeMins = timeToMinutes(wakeTime);
  const sleepMins = wakeMins - Math.round(hours * 60);
  return {
    sleep_time: minutesToTime(sleepMins),
    wake_time: wakeTime,
    duration_minutes: Math.round(hours * 60),
  };
}

export function calcQualityEfficiency(hours, quality) {
  const hourScore = Math.min(hours / 8, 1) * 60;
  const qualityScore = { poor: 20, fair: 40, good: 60, excellent: 80 }[quality] || 40;
  return Math.round(hourScore + qualityScore * 0.4);
}

export function calcQualitySleepScore(hours, quality) {
  const hourScore = Math.min(hours / 8, 1.2) * 50;
  const qualityScore = { poor: 15, fair: 30, good: 45, excellent: 50 }[quality] || 30;
  return Math.min(Math.round(hourScore + qualityScore), 100);
}

export function generateSleepVerdict(hours, quality) {
  let verdict = '';
  const improvements = [];

  if (hours < 5) {
    verdict += `<p><strong>Severely sleep deprived.</strong> You only slept ${hours} hours, which is far below the recommended 7-9 hours for adults. This level of sleep restriction can impair cognitive function, mood regulation, and immune response.</p>`;
    improvements.push({ icon: '🕐', text: 'Aim for at least 7 hours - set a bedtime alarm 8 hours before your wake-up time' });
    improvements.push({ icon: '📱', text: 'Avoid screens 1 hour before bed - blue light suppresses melatonin production' });
  } else if (hours < 6) {
    verdict += `<p><strong>Not enough rest.</strong> At ${hours} hours, you are in the "short sleep" zone. While some people tolerate 6 hours, most experience accumulated sleep debt that affects focus and energy.</p>`;
    improvements.push({ icon: '🌿', text: 'Try a warm bath or shower 90 minutes before bed to lower core body temperature' });
    improvements.push({ icon: '☕', text: 'Cut caffeine after 2pm - it has a 5-7 hour half-life in your system' });
  } else if (hours < 7) {
    verdict += `<p><strong>Slightly below optimal.</strong> ${hours} hours is borderline. You might feel functional, but reaction time and memory consolidation are likely compromised.</p>`;
    improvements.push({ icon: '🌙', text: 'Create a consistent sleep schedule - even on weekends' });
    improvements.push({ icon: '🌄', text: 'Get morning sunlight exposure to anchor your circadian rhythm' });
  } else if (hours <= 9) {
    verdict += `<p><strong>Good sleep duration.</strong> ${hours} hours falls in the optimal range for most adults. This supports memory consolidation, emotional regulation, and physical recovery.</p>`;
    if (quality === 'poor' || quality === 'fair') {
      verdict += `<p>However, your quality was rated as <strong>${quality}</strong>, suggesting fragmentation or insufficient deep sleep stages.</p>`;
    }
  } else {
    verdict += `<p><strong>Extended sleep.</strong> ${hours} hours is above average. Occasional long sleep can indicate recovery from sleep debt, but frequent oversleeping may signal underlying issues.</p>`;
    improvements.push({ icon: '⏰', text: 'If you consistently need 10+ hours, consider checking for sleep apnea or vitamin D levels' });
  }

  if (quality === 'poor') {
    verdict += `<p><strong>Sleep quality was poor.</strong> Frequent wake-ups or difficulty maintaining sleep suggest possible stress, environmental disruptions, or sleep disorders.</p>`;
    improvements.push({ icon: '🧘', text: 'Practice 4-7-8 breathing before bed: inhale 4s, hold 7s, exhale 8s' });
    improvements.push({ icon: '🌡️', text: 'Keep bedroom temperature between 60-67°F (15-19°C)' });
  } else if (quality === 'excellent') {
    verdict += `<p><strong>Outstanding quality!</strong> You achieved restorative sleep with good sleep architecture. Keep doing what you are doing.</p>`;
  }

  if (improvements.length === 0) {
    improvements.push({ icon: '✨', text: 'Your sleep habits look solid - maintain this routine!' });
  }

  return { verdict, improvements };
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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