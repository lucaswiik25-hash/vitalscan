import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { Sparkles, Lightbulb } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import SleepHeroRing from '@/components/sleep/SleepHeroRing';
import MiniScoreRing from '@/components/sleep/MiniScoreRing';
import {
  TARGET_HOURS,
  TARGET_MINUTES,
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
  barColorForHours,
  generateInsights,
  buildWeekDays,
} from '@/lib/sleepCalculations';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const YESTERDAY = format(subDays(new Date(), 1), 'yyyy-MM-dd');

const PAGE_BG = 'transparent';
const CARD_STYLE = {
  background: '#FFFFFF',
  borderRadius: 28,
  padding: 20,
  border: '1px solid rgba(0,0,0,0.1)',
  boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
};

function TimeDrumPicker({ value, onChange }) {
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

  return (
    <div
      className="flex items-center justify-center gap-1 rounded-[14px] py-2 px-3"
      style={{ background: PAGE_BG }}
    >
      <div className={colClass}>
        {hours.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHour(h)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{
              color: h === h12 ? '#111827' : '#9BA3AF',
              background: h === h12 ? '#FFFFFF' : 'transparent',
            }}
          >
            {h}
          </button>
        ))}
      </div>
      <span className="text-[#111827] font-bold">:</span>
      <div className={colClass}>
        {minutes.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMinute(m)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{
              color: m === min ? '#111827' : '#9BA3AF',
              background: m === min ? '#FFFFFF' : 'transparent',
            }}
          >
            {String(m).padStart(2, '0')}
          </button>
        ))}
      </div>
      <div className={colClass}>
        {['AM', 'PM'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className="snap-center py-1 px-3 text-sm font-semibold rounded-lg shrink-0"
            style={{
              color: p === period ? '#111827' : '#9BA3AF',
              background: p === period ? '#FFFFFF' : 'transparent',
            }}
          >
            {p}
          </button>
        ))}
      </div>
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

  const [tooltipDay, setTooltipDay] = useState(null);
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
    () =>
      waterLogs
        .filter((w) => w.date === YESTERDAY && w.amount_ml > 0)
        .reduce((s, w) => s + w.amount_ml, 0),
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
    () =>
      [...sleepLogs]
        .filter((l) => l.mood || l.journal_note)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3),
    [sleepLogs]
  );

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

    try {
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
      setSaveMsg('Sleep logged successfully');
    } catch (err) {
      setSaveMsg('Could not save — try again');
      console.error(err);
    }
    setSaving(false);
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
    try {
      if (todayLog?.id) {
        await base44.entities.SleepLog.update(todayLog.id, base);
      } else {
        await base44.entities.SleepLog.create(base);
      }
      queryClient.invalidateQueries({ queryKey: ['sleepLogs'] });
    } catch (e) {
      console.error(e);
    }
    setJournalSaving(false);
  };

  const setBedtimeReminder = async () => {
    if (!selectedBedtime) return;
    const label = formatTime12(selectedBedtime);
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      if (Notification.permission === 'granted') {
        try {
          new Notification('Bedtime reminder', {
            body: `Wind down for sleep at ${label}`,
          });
          setReminderNote(`Reminder set for ${label}`);
          return;
        } catch (_) {}
      }
    }
    setReminderNote(`Set a reminder in your phone for ${label}`);
  };

  const maxBarHours = 10;
  const chartHeight = 120;

  return (
    <div className="min-h-screen pb-28">
      <div className="px-5 pt-12 max-w-lg mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-[#111827] mb-2">Sleep</h1>

        {/* SECTION 1 — Hero ring */}
        <div style={CARD_STYLE} className="flex flex-col items-center">
          <SleepHeroRing
            sleepTime={sleepTime}
            wakeTime={wakeTime}
            onSleepChange={setSleepTime}
            onWakeChange={setWakeTime}
            sleepScore={sleepScore}
          />
          <button
            type="button"
            onClick={logSleep}
            disabled={saving || logsLoading}
            className="w-full mt-5 text-white font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-60"
            style={{ height: 52, borderRadius: 16, background: '#111827' }}
          >
            {saving ? 'Saving…' : 'Log Sleep'}
          </button>
          {saveMsg && (
            <p className="text-xs text-[#10B981] mt-2 font-medium">{saveMsg}</p>
          )}
        </div>

        {/* SECTION 2 — Sub-scores */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Duration', score: durationScore, color: '#111827' },
            {
              label: 'Consistency',
              score: consistencyScore,
              color: '#6366F1',
            },
            { label: 'Habits', score: habitsScore, color: '#10B981' },
          ].map(({ label, score, color }) => (
            <div
              key={label}
              style={{
                ...CARD_STYLE,
                borderRadius: 24,
                padding: 14,
              }}
              className="flex flex-col items-center"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9BA3AF] mb-2 w-full text-center">
                {label}
              </p>
              <MiniScoreRing score={score} color={color} size={40} />
              <p className="text-[28px] font-bold text-[#111827] mt-2 leading-none">
                {score == null ? '–' : score}
              </p>
            </div>
          ))}
        </div>

        {/* SECTION 3 — Smart Alarm */}
        <div style={CARD_STYLE}>
          <p className="text-[15px] font-bold text-[#111827]">Smart Alarm</p>
          <p className="text-xs text-[#9BA3AF] mt-0.5 mb-4">Based on 90-min sleep cycles</p>

          <p className="text-[11px] font-semibold uppercase text-[#9BA3AF] mb-2">Target wake time</p>
          <TimeDrumPicker value={alarmWake} onChange={setAlarmWake} />

          <p className="text-[11px] font-semibold uppercase text-[#9BA3AF] mt-4 mb-2">Recommended bedtimes</p>
          <div className="flex flex-wrap gap-2">
            {cycleBedtimes.map((opt) => (
              <button
                key={opt.cycles}
                type="button"
                onClick={() => setSelectedBedtime(opt.time)}
                className="text-[14px] font-semibold text-[#111827] active:scale-95 transition-transform"
                style={{
                  background: selectedBedtime === opt.time ? '#111827' : PAGE_BG,
                  color: selectedBedtime === opt.time ? '#FFFFFF' : '#111827',
                  borderRadius: 20,
                  padding: '8px 16px',
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
            className="w-full mt-4 text-white font-semibold text-sm disabled:opacity-40"
            style={{ height: 44, borderRadius: 16, background: '#111827' }}
          >
            Set Bedtime Reminder
          </button>
          {reminderNote && (
            <p className="text-xs text-[#6366F1] mt-2 font-medium">{reminderNote}</p>
          )}
          <p className="text-[11px] text-[#9BA3AF] mt-3 leading-relaxed">
            Wake up between cycles to feel more refreshed. Falling asleep takes ~15 min on average.
          </p>
        </div>

        {/* SECTION 4 — Weekly history */}
        <div style={CARD_STYLE}>
          <p className="text-[15px] font-bold text-[#111827] mb-4">Last 7 Nights</p>

          <div className="relative" style={{ height: chartHeight + 32 }}>
            {[2, 4, 6, 8, 10].map((h) => (
              <div
                key={h}
                className="absolute left-0 right-8 border-t border-[#F2F4F8]"
                style={{ bottom: 24 + (h / maxBarHours) * chartHeight }}
              />
            ))}
            <div
              className="absolute right-0 flex items-center border-t border-dashed border-[#D1D5DB]"
              style={{ bottom: 24 + (TARGET_HOURS / maxBarHours) * chartHeight, width: '100%' }}
            >
              <span className="ml-auto text-[11px] text-[#9BA3AF] pr-1 -mt-2">Goal</span>
            </div>

            <div className="absolute left-0 right-0 bottom-0 flex justify-between items-end gap-1.5 px-0" style={{ height: chartHeight + 24 }}>
              {weekDays.map((day) => {
                const barH = day.hours > 0 ? (day.hours / maxBarHours) * chartHeight : 4;
                const color = day.hours > 0 ? barColorForHours(day.hours) : '#E5E7EB';
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center relative">
                    {tooltipDay === day.date && day.log && (
                      <div
                        className="absolute -top-14 z-10 text-center px-2 py-1 rounded-lg text-[10px] text-white whitespace-nowrap"
                        style={{ background: '#111827' }}
                      >
                        {format(new Date(day.date), 'MMM d')}
                        <br />
                        {formatDuration(day.log.duration_minutes)} · {day.log.sleep_score}
                      </div>
                    )}
                    <button
                      type="button"
                      className="w-full rounded-t-lg transition-all"
                      style={{
                        height: Math.max(barH, 4),
                        background: color,
                        borderRadius: 8,
                      }}
                      onClick={() => setTooltipDay(tooltipDay === day.date ? null : day.date)}
                    />
                    <span className="text-[11px] font-semibold text-[#9BA3AF] mt-2">{day.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between mt-4 pt-3 border-t border-[#F2F4F8]">
            <p className="text-[13px] text-[#6B7280]">
              Avg this week:{' '}
              <span className="font-semibold text-[#111827]">
                {weekStats.avg != null ? formatDuration(Math.round(weekStats.avg)) : '—'}
              </span>
            </p>
            <p className="text-[13px] text-[#6B7280]">
              Best night:{' '}
              <span className="font-semibold text-[#111827]">
                {weekStats.best != null ? formatDuration(weekStats.best) : '—'}
              </span>
            </p>
          </div>
        </div>

        {/* SECTION 5 — Sleep debt */}
        <div style={CARD_STYLE}>
          <p className="text-[15px] font-bold text-[#111827]">Sleep Debt</p>
          <p
            className="text-[40px] font-bold mt-3 leading-none"
            style={{ color: debt.color }}
          >
            {formatDuration(debtMinutes)}
          </p>
          <p className="text-sm text-[#6B7280] mt-2">
            {debtMinutes > 0
              ? `You need ${formatDuration(debtMinutes)} extra this week to recover`
              : 'You are on track with your sleep goal this week'}
          </p>
          <div className="mt-4 h-3 rounded-full overflow-hidden" style={{ background: PAGE_BG }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(100, (debtMinutes / (10 * 60)) * 100)}%`,
                background: debt.color,
              }}
            />
          </div>
          <div className="flex items-start gap-2 mt-4 p-3 rounded-2xl" style={{ background: PAGE_BG }}>
            <Lightbulb className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#4B5563] leading-snug">{debtTip(debt.label)}</p>
          </div>
        </div>

        {/* SECTION 6 — Insights */}
        <div style={CARD_STYLE}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6366F1]" />
            <p className="text-[15px] font-bold text-[#111827]">Sleep Insights</p>
          </div>
          <p className="text-xs text-[#9BA3AF] mt-0.5 mb-4">Based on your food and hydration logs</p>

          {!insightsData.ready ? (
            <div className="rounded-2xl p-4" style={{ background: PAGE_BG }}>
              <p className="text-sm text-[#6B7280]">
                Log 5 nights of sleep to unlock your personal insights
              </p>
              <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full bg-[#6366F1] transition-all"
                  style={{ width: `${(insightsData.count / 5) * 100}%` }}
                />
              </div>
              <p className="text-xs text-[#9BA3AF] mt-2">{insightsData.count}/5 nights logged</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insightsData.insights.map((ins, i) => (
                <div
                  key={i}
                  className="rounded-2xl py-3 px-4 text-[13px] text-[#374151] leading-snug"
                  style={{
                    background: '#F8FAFC',
                    borderLeft: `4px solid ${ins.border}`,
                  }}
                >
                  {ins.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 7 — Journal */}
        <div style={CARD_STYLE}>
          <p className="text-[15px] font-bold text-[#111827]">Morning Journal</p>
          <p className="text-xs text-[#9BA3AF] mt-0.5 mb-4">How do you feel this morning?</p>

          <div className="flex justify-between gap-2 mb-4">
            {MOOD_OPTIONS.map((m) => {
              const selected = mood === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMood(m.key)}
                  className="w-12 h-12 flex items-center justify-center text-xl transition-all active:scale-90"
                  style={{
                    borderRadius: '50%',
                    background: selected ? '#111827' : PAGE_BG,
                  }}
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
            className="w-full text-sm text-[#111827] resize-none focus:outline-none"
            style={{
              borderRadius: 14,
              background: PAGE_BG,
              padding: 12,
              minHeight: 80,
            }}
          />

          <button
            type="button"
            onClick={saveJournal}
            disabled={journalSaving}
            className="w-full mt-4 text-white font-bold text-[15px] disabled:opacity-50"
            style={{ height: 48, borderRadius: 16, background: '#111827' }}
          >
            {journalSaving ? 'Saving…' : 'Save Journal Entry'}
          </button>

          {journalEntries.length > 0 && (
            <div className="mt-5 pt-4 border-t border-[#F2F4F8] space-y-3">
              {journalEntries.map((entry) => {
                const moodOpt = MOOD_OPTIONS.find((m) => m.key === entry.mood);
                return (
                  <div key={entry.id} className="text-sm">
                    <div className="flex items-center gap-2 text-[#9BA3AF] text-xs">
                      <span>{format(new Date(entry.date), 'EEE, MMM d')}</span>
                      {moodOpt && <span>{moodOpt.emoji}</span>}
                    </div>
                    {entry.journal_note && (
                      <p className="text-[#374151] mt-1 leading-snug">{entry.journal_note}</p>
                    )}
                  </div>
                );
              })}
              <button type="button" className="text-xs font-semibold text-[#6366F1]">
                See all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}