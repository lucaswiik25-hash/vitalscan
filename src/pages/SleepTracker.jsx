import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Sparkles, Lightbulb, Calendar, Pencil, Moon } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import {
  TARGET_HOURS,
  MOOD_OPTIONS,
  calcDurationMinutes,
  calcDurationScore,
  calcSleepScore,
  calcConsistencyScore,
  calcConsistencyBonus,
  calcHabitsScore,
  calcHabitBonus,
  calcSleepDebtMinutes,
  debtLevel,
  debtTip,
  calcCycleBedtimes,
  formatTime12,
  formatDuration,
  minutesToTime,
  timeToMinutes,
  generateInsights,
  buildWeekDays,
} from '@/lib/sleepCalculations';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const YESTERDAY = format(subDays(new Date(), 1), 'yyyy-MM-dd');

// ── Theme ────────────────────────────────────────────────────────────────────
const T = {
  bg: '#0a0a1a',
  card: '#1a1a2e',
  cardLight: '#252540',
  purple: '#7C5CFC',
  purpleLight: '#a78bfa',
  yellow: '#F5C542',
  white: '#ffffff',
  sub: 'rgba(255,255,255,0.6)',
  muted: 'rgba(255,255,255,0.4)',
  track: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
};

function SubScoreRing({ score, label }) {
  const pct = score == null ? 0 : Math.min(100, Math.max(0, score));
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div
      className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
      style={{
        background: T.white,
        borderRadius: 20,
        padding: '14px 10px',
        flex: 1,
      }}
    >
      <p style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{label}</p>
      <div className="relative" style={{ width: 64, height: 64 }}>
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#f0f0f0" strokeWidth="8" />
          <circle
            cx="32" cy="32" r={r}
            fill="none"
            stroke={T.purple}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {score == null ? '–' : score}
          </span>
        </div>
      </div>
    </div>
  );
}

function TimeDrumPicker({ value, onChange, dark = false }) {
  const mins = timeToMinutes(value);
  const h24 = Math.floor(mins / 60);
  const min = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];

  const to24h = (h12v, mv, p) => {
    let hour24 = h12v % 12;
    if (p === 'PM') hour24 += 12;
    if (h12v === 12 && p === 'AM') hour24 = 0;
    return hour24 * 60 + mv;
  };

  const setHour = (h) => onChange(minutesToTime(to24h(h, min, period)));
  const setMinute = (m) => onChange(minutesToTime(to24h(h12, m, period)));
  const setPeriod = (p) => onChange(minutesToTime(to24h(h12, min, p)));

  const colClass = 'h-24 overflow-y-auto snap-y snap-mandatory no-scrollbar flex flex-col items-center';
  const activeBg = dark ? T.cardLight : '#FFFFFF';
  const activeColor = dark ? T.white : '#111827';
  const inactiveColor = dark ? T.sub : '#9BA3AF';

  return (
    <div className="flex items-center justify-center gap-1 rounded-[14px] py-2 px-3">
      <div className={colClass}>
        {hours.map((h) => (
          <button key={h} type="button" onClick={() => setHour(h)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{ color: h === h12 ? activeColor : inactiveColor, background: h === h12 ? activeBg : 'transparent' }}>
            {h}
          </button>
        ))}
      </div>
      <span style={{ color: dark ? T.white : '#111827', fontWeight: 700 }}>:</span>
      <div className={colClass}>
        {minutes.map((m) => (
          <button key={m} type="button" onClick={() => setMinute(m)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{ color: m === min ? activeColor : inactiveColor, background: m === min ? activeBg : 'transparent' }}>
            {String(m).padStart(2, '0')}
          </button>
        ))}
      </div>
      <div className={colClass}>
        {['AM', 'PM'].map((p) => (
          <button key={p} type="button" onClick={() => setPeriod(p)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{ color: p === period ? activeColor : inactiveColor, background: p === period ? activeBg : 'transparent' }}>
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function DarkCard({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{
      background: T.card,
      borderRadius: 20,
      border: `1px solid ${T.border}`,
      ...style,
    }}>
      {children}
    </div>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const waterTarget = profile.water_target_ml || 2000;

  const [sleepTime, setSleepTime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);

  const [alarmWake, setAlarmWake] = useState('07:00');
  const [selectedBedtime, setSelectedBedtime] = useState(null);
  const [reminderNote, setReminderNote] = useState(null);

  const [selectedDay, setSelectedDay] = useState(null); // null = today
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [mood, setMood] = useState(null);
  const [journalNote, setJournalNote] = useState('');
  const [journalSaving, setJournalSaving] = useState(false);

  const { data: sleepLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['sleepLogs'],
    queryFn: () => base44.entities.SleepLog.list(),
  });

  const { data: meals = [] } = useQuery({
    queryKey: ['mealsAll'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  const { data: waterLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => base44.entities.WaterLog.list(),
  });

  const { data: exercises = [] } = useQuery({
    queryKey: ['allExercises'],
    queryFn: () => base44.entities.Exercise.list(),
  });

  const todayLog = useMemo(() => sleepLogs.find((l) => l.date === TODAY), [sleepLogs]);

  useEffect(() => {
    if (todayLog?.sleep_time && todayLog?.wake_time) {
      setSleepTime(todayLog.sleep_time);
      setWakeTime(todayLog.wake_time);
    }
    if (todayLog?.mood) setMood(todayLog.mood);
    if (todayLog?.journal_note) setJournalNote(todayLog.journal_note);
  }, [todayLog?.id]);

  const yesterdayWater = useMemo(
    () => waterLogs.filter((w) => w.date === YESTERDAY && w.amount_ml > 0).reduce((s, w) => s + w.amount_ml, 0),
    [waterLogs]
  );
  const yesterdayMeals = meals.some((m) => m.date === YESTERDAY && m.logged);
  const yesterdayExercise = exercises.some((e) => e.date === YESTERDAY);

  const durationMin = calcDurationMinutes(sleepTime, wakeTime);
  const durationScore = calcDurationScore(durationMin);
  const consistencyScore = calcConsistencyScore(sleepLogs, sleepTime);
  const habitsScore = calcHabitsScore(yesterdayWater, waterTarget, yesterdayMeals, yesterdayExercise);
  const consistencyBonus = calcConsistencyBonus(consistencyScore ?? 0);
  const habitBonus = calcHabitBonus(yesterdayWater, waterTarget, yesterdayMeals);
  const sleepScore = calcSleepScore(durationMin, consistencyBonus, habitBonus);

  const weekDays = useMemo(() => buildWeekDays(sleepLogs), [sleepLogs]);
  const debtMinutes = useMemo(() => calcSleepDebtMinutes(sleepLogs), [sleepLogs]);
  const debt = debtLevel(debtMinutes);
  const insightsData = useMemo(
    () => generateInsights(sleepLogs, meals, waterLogs, exercises, waterTarget),
    [sleepLogs, meals, waterLogs, exercises, waterTarget]
  );

  const cycleBedtimes = useMemo(() => calcCycleBedtimes(alarmWake), [alarmWake]);

  const weekStats = useMemo(() => {
    const logged = weekDays.filter((d) => d.hours > 0);
    if (!logged.length) return { avg: null, best: null };
    const avgMin = logged.reduce((s, d) => s + d.log.duration_minutes, 0) / logged.length;
    const best = logged.reduce((b, d) => (d.log.duration_minutes > b.log.duration_minutes ? d : b), logged[0]);
    return { avg: avgMin, best: best.log.duration_minutes };
  }, [weekDays]);

  const journalEntries = useMemo(
    () => [...sleepLogs].filter((l) => l.mood || l.journal_note).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3),
    [sleepLogs]
  );

  // Build 7 day pills (last 7 days)
  const dayPills = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      return {
        dateStr,
        letter: format(d, 'EEEEE'), // single letter
        num: format(d, 'd'),
        isToday: dateStr === TODAY,
        idx: i,
      };
    });
  }, []);

  const activeIdx = selectedDay ?? dayPills.findIndex((p) => p.isToday);

  // Bar chart data from weekDays
  const maxBarHours = 10;
  const barChartData = useMemo(() => {
    return weekDays.map((d) => ({
      label: d.label,
      hours: d.hours,
      date: d.date,
      score: d.log?.sleep_score ?? 0,
    }));
  }, [weekDays]);

  const logSleep = async () => {
    setSaving(true);
    setSaveMsg(null);
    const payload = {
      date: TODAY,
      sleep_time: sleepTime,
      wake_time: wakeTime,
      duration_minutes: durationMin,
      sleep_score: sleepScore,
      duration_score: durationScore,
      consistency_score: consistencyScore ?? 0,
      habits_score: habitsScore,
      mood: mood || todayLog?.mood,
      journal_note: journalNote || todayLog?.journal_note || '',
    };
    if (todayLog?.id) {
      await base44.entities.SleepLog.update(todayLog.id, payload);
    } else {
      await base44.entities.SleepLog.create(payload);
    }
    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: durationMin / 60,
        last_sleep_date: TODAY,
      });
    }
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      stored[TODAY] = durationMin / 60;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}
    queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setSaveMsg('Sleep logged!');
    setSaving(false);
    setShowLogPanel(false);
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const saveJournal = async () => {
    if (!mood && !journalNote.trim()) return;
    setJournalSaving(true);
    const base = {
      date: TODAY,
      sleep_time: todayLog?.sleep_time || sleepTime,
      wake_time: todayLog?.wake_time || wakeTime,
      duration_minutes: todayLog?.duration_minutes || durationMin,
      sleep_score: todayLog?.sleep_score ?? sleepScore,
      duration_score: todayLog?.duration_score ?? durationScore,
      consistency_score: todayLog?.consistency_score ?? consistencyScore ?? 0,
      habits_score: todayLog?.habits_score ?? habitsScore,
      mood,
      journal_note: journalNote.trim(),
    };
    if (todayLog?.id) {
      await base44.entities.SleepLog.update(todayLog.id, base);
    } else {
      await base44.entities.SleepLog.create(base);
    }
    queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
    setJournalSaving(false);
  };

  const setBedtimeReminder = async () => {
    if (!selectedBedtime) return;
    const label = formatTime12(selectedBedtime);
    if ('Notification' in window) {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission === 'granted') {
        try { new Notification('Bedtime reminder', { body: `Wind down for sleep at ${label}` }); setReminderNote(`Reminder set for ${label}`); return; } catch (_) {}
      }
    }
    setReminderNote(`Set a reminder in your phone for ${label}`);
  };

  const pageVisible = usePageVisible();

  return (
    <div className="min-h-screen pb-32" style={{ background: T.bg, ...pageRevealStyle(pageVisible) }}>
      <div className="max-w-lg mx-auto">

        {/* ── Top Bar ── */}
        <div className="flex gap-3 px-5 pt-12 pb-3">
          <button
            style={{ flex: 1, height: 44, background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, color: T.sub, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Calendar style={{ width: 16, height: 16, color: T.muted }} />
            Today
          </button>
          <button
            style={{ flex: 1, height: 44, background: T.card, borderRadius: 12, border: `1px solid ${T.border}`, color: T.sub, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {format(new Date(), 'MMMM yyyy')}
          </button>
        </div>

        {/* ── Day Selector ── */}
        <div className="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
          {dayPills.map((pill, i) => {
            const active = i === activeIdx;
            return (
              <button
                key={pill.dateStr}
                onClick={() => setSelectedDay(i)}
                style={{
                  minWidth: 52, height: 64, borderRadius: 16, flexShrink: 0,
                  background: active ? T.purple : 'transparent',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 500, color: active ? T.white : T.muted }}>{pill.letter}</span>
                <span style={{ fontSize: 17, fontWeight: 500, color: active ? T.white : T.sub }}>{pill.num}</span>
              </button>
            );
          })}
        </div>

        {/* ── Sleeping Status Card ── */}
        <div className="mx-5 mb-4" style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}`, padding: '16px 20px 20px' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,92,252,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
              😴
            </div>
            <p style={{ fontSize: 17, fontWeight: 600, color: T.white, flex: 1, textAlign: 'center' }}>Sleeping Status</p>
            <button
              onClick={() => setShowLogPanel(true)}
              style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil style={{ width: 18, height: 18, color: T.sub }} />
            </button>
          </div>

          {/* Bar Chart */}
          <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 4px' }}>
            {barChartData.map((bar, i) => {
              const maxH = 130;
              const barH = bar.hours > 0 ? Math.max(20, (bar.hours / maxBarHours) * maxH) : 20;
              const isSelected = bar.date === (dayPills[activeIdx]?.dateStr);
              return (
                <div key={bar.date} className="flex flex-col items-center" style={{ flex: 1 }}>
                  <div
                    style={{
                      width: '100%', maxWidth: 36, height: barH,
                      borderRadius: 18,
                      background: bar.hours > 0 ? T.purple : T.track,
                      opacity: isSelected ? 1 : 0.55,
                      transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                      alignSelf: 'flex-end',
                    }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.sub, marginTop: 8 }}>{bar.label}</span>
                </div>
              );
            })}
          </div>

          {/* Today sleep time summary */}
          {todayLog && (
            <div className="flex justify-center gap-6 mt-4 pt-4" style={{ borderTop: `1px solid ${T.track}` }}>
              <div className="text-center">
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Bedtime</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.white }}>{formatTime12(todayLog.sleep_time)}</p>
              </div>
              <div style={{ width: 1, background: T.track }} />
              <div className="text-center">
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Wake up</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.white }}>{formatTime12(todayLog.wake_time)}</p>
              </div>
              <div style={{ width: 1, background: T.track }} />
              <div className="text-center">
                <p style={{ fontSize: 11, color: T.muted, marginBottom: 2 }}>Duration</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: T.white }}>{formatDuration(todayLog.duration_minutes)}</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Sub-score rings ── */}
        <div className="flex gap-3 px-5 mb-6">
          <SubScoreRing score={durationScore} label="Duration" />
          <SubScoreRing score={consistencyScore} label="Consistency" />
          <SubScoreRing score={habitsScore} label="Habits" />
        </div>

        {saveMsg && (
          <div className="mx-5 mb-4 text-center py-3 rounded-2xl" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <p style={{ color: '#10B981', fontSize: 14, fontWeight: 600 }}>{saveMsg}</p>
          </div>
        )}

        {/* ── Log Sleep Button ── */}
        <div className="px-5 mb-6">
          <button
            onClick={() => setShowLogPanel(true)}
            style={{
              width: '100%', height: 56, background: T.purple, borderRadius: 28,
              color: T.white, fontSize: 16, fontWeight: 600,
              boxShadow: '0 8px 24px rgba(124,92,252,0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <Moon style={{ width: 18, height: 18 }} />
            Log Sleep
          </button>
        </div>

        {/* ── Smart Alarm ── */}
        <div className="mx-5 mb-4 p-5" style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Smart Alarm</p>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2, marginBottom: 16 }}>Based on 90-min sleep cycles</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Target wake time</p>
          <TimeDrumPicker value={alarmWake} onChange={setAlarmWake} dark />
          <p style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 16, marginBottom: 8 }}>Recommended bedtimes</p>
          <div className="flex flex-wrap gap-2">
            {cycleBedtimes.map((opt) => (
              <button
                key={opt.cycles}
                type="button"
                onClick={() => setSelectedBedtime(opt.time)}
                style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 14, fontWeight: 600,
                  background: selectedBedtime === opt.time ? T.purple : T.cardLight,
                  color: selectedBedtime === opt.time ? T.white : T.sub,
                  border: `1px solid ${selectedBedtime === opt.time ? T.purple : T.border}`,
                  transition: 'all 0.2s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={setBedtimeReminder}
            disabled={!selectedBedtime}
            style={{
              width: '100%', marginTop: 16, height: 44, borderRadius: 16,
              background: selectedBedtime ? T.purple : T.cardLight,
              color: T.white, fontSize: 14, fontWeight: 600, opacity: !selectedBedtime ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            Set Bedtime Reminder
          </button>
          {reminderNote && <p style={{ fontSize: 12, color: T.purpleLight, marginTop: 8, fontWeight: 500 }}>{reminderNote}</p>}
          <p style={{ fontSize: 11, color: T.muted, marginTop: 12, lineHeight: 1.6 }}>Wake up between cycles to feel more refreshed.</p>
        </div>

        {/* ── Sleep Debt ── */}
        <div className="mx-5 mb-4 p-5" style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Sleep Debt</p>
          <p style={{ fontSize: 40, fontWeight: 800, marginTop: 8, color: debtMinutes > 0 ? '#f87171' : '#34d399', lineHeight: 1 }}>
            {formatDuration(debtMinutes)}
          </p>
          <p style={{ fontSize: 13, color: T.sub, marginTop: 8 }}>
            {debtMinutes > 0 ? `You need ${formatDuration(debtMinutes)} extra this week` : 'On track with your sleep goal'}
          </p>
          <div style={{ marginTop: 16, height: 6, borderRadius: 999, background: T.track, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 999, background: debtMinutes > 0 ? '#f87171' : '#34d399', width: `${Math.min(100, (debtMinutes / (10 * 60)) * 100)}%`, transition: 'width 0.7s ease' }} />
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-2xl" style={{ background: T.cardLight }}>
            <Lightbulb style={{ width: 16, height: 16, color: T.yellow, flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{debtTip(debt.label)}</p>
          </div>
        </div>

        {/* ── Insights ── */}
        <div className="mx-5 mb-4 p-5" style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}` }}>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles style={{ width: 16, height: 16, color: T.purpleLight }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Sleep Insights</p>
          </div>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Based on your food and hydration logs</p>
          {!insightsData.ready ? (
            <div className="rounded-2xl p-4" style={{ background: T.cardLight }}>
              <p style={{ fontSize: 13, color: T.sub }}>Log 5 nights of sleep to unlock insights</p>
              <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: T.track, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 999, background: T.purple, width: `${(insightsData.count / 5) * 100}%`, transition: 'width 0.7s ease' }} />
              </div>
              <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{insightsData.count}/5 nights logged</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insightsData.insights.map((ins, i) => (
                <div key={i} className="rounded-2xl py-3 px-4" style={{ background: T.cardLight, borderLeft: `4px solid ${ins.border}` }}>
                  <p style={{ fontSize: 13, color: T.sub, lineHeight: 1.5 }}>{ins.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Journal ── */}
        <div className="mx-5 mb-4 p-5" style={{ background: T.card, borderRadius: 20, border: `1px solid ${T.border}` }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Morning Journal</p>
          <p style={{ fontSize: 12, color: T.muted, marginTop: 2, marginBottom: 16 }}>How do you feel this morning?</p>
          <div className="flex justify-between gap-2 mb-4">
            {MOOD_OPTIONS.map((m) => {
              const selected = mood === m.key;
              return (
                <button key={m.key} type="button" onClick={() => setMood(m.key)}
                  className="w-12 h-12 flex items-center justify-center text-xl transition-all active:scale-90"
                  style={{ borderRadius: '50%', background: selected ? T.purple : T.cardLight, border: `2px solid ${selected ? T.purple : T.border}` }}
                  title={m.label}
                >
                  {m.emoji}
                </button>
              );
            })}
          </div>
          <textarea
            value={journalNote}
            onChange={(e) => setJournalNote(e.target.value)}
            placeholder="Any notes? Dreams, disturbances, stress..."
            className="w-full text-sm resize-none focus:outline-none"
            style={{ borderRadius: 14, background: T.cardLight, padding: 12, minHeight: 80, color: T.white, border: `1px solid ${T.border}` }}
          />
          <button type="button" onClick={saveJournal} disabled={journalSaving}
            style={{ width: '100%', marginTop: 16, height: 48, borderRadius: 16, background: T.purple, color: T.white, fontSize: 15, fontWeight: 700, opacity: journalSaving ? 0.5 : 1 }}>
            {journalSaving ? 'Saving…' : 'Save Journal Entry'}
          </button>
          {journalEntries.length > 0 && (
            <div className="mt-5 pt-4 space-y-3" style={{ borderTop: `1px solid ${T.track}` }}>
              {journalEntries.map((entry) => {
                const moodOpt = MOOD_OPTIONS.find((m) => m.key === entry.mood);
                return (
                  <div key={entry.id}>
                    <div className="flex items-center gap-2" style={{ color: T.muted, fontSize: 12 }}>
                      <span>{format(new Date(entry.date), 'EEE, MMM d')}</span>
                      {moodOpt && <span>{moodOpt.emoji}</span>}
                    </div>
                    {entry.journal_note && <p style={{ fontSize: 13, color: T.sub, marginTop: 4, lineHeight: 1.5 }}>{entry.journal_note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Log Sleep Bottom Sheet ── */}
      {showLogPanel && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setShowLogPanel(false)}>
          <div
            className="w-full max-w-lg mx-auto rounded-t-[32px] p-6 pb-10"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <p style={{ fontSize: 18, fontWeight: 700, color: T.white }}>Log Sleep</p>
              <button onClick={() => setShowLogPanel(false)} style={{ color: T.sub, fontSize: 24, lineHeight: 1 }}>×</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div style={{ background: T.cardLight, borderRadius: 16, padding: '12px 8px' }}>
                <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Bedtime</p>
                <TimeDrumPicker value={sleepTime} onChange={setSleepTime} dark />
              </div>
              <div style={{ background: T.cardLight, borderRadius: 16, padding: '12px 8px' }}>
                <p style={{ fontSize: 11, color: T.muted, textAlign: 'center', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase' }}>Wake up</p>
                <TimeDrumPicker value={wakeTime} onChange={setWakeTime} dark />
              </div>
            </div>
            <div className="flex justify-between mb-6">
              {[
                { label: 'Duration', val: formatDuration(durationMin) },
                { label: 'Sleep Score', val: sleepScore },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: T.cardLight, borderRadius: 14, padding: '10px 20px', textAlign: 'center', flex: 1, margin: '0 4px' }}>
                  <p style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 20, fontWeight: 700, color: T.white }}>{val}</p>
                </div>
              ))}
            </div>
            <button
              onClick={logSleep}
              disabled={saving || logsLoading}
              style={{
                width: '100%', height: 56, borderRadius: 28, background: T.purple,
                color: T.white, fontSize: 16, fontWeight: 700,
                boxShadow: '0 8px 24px rgba(124,92,252,0.45)',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Saving…' : 'Save Sleep'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}