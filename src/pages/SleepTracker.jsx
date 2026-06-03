import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sparkles, Clock, TrendingUp, Zap, Plus, X, ChevronRight } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import SleepReadinessModule from '@/components/sleep/SleepReadinessModule';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const TARGET_HOURS = 8;

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

function readSleepStore() {
  try {
    return JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
  } catch {
    return {};
  }
}

function formatHours(h) {
  if (h == null) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function scoreLabel(score) {
  if (!score) return 'Log sleep to unlock';
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Very Good';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Needs rest';
}

function computeScore(hours) {
  if (!hours) return 0;
  const duration = Math.min(100, Math.round((hours / TARGET_HOURS) * 100));
  const quality = Math.min(100, Math.round(duration * 0.95 + 5));
  const habits = Math.min(100, Math.round(duration * 0.9 + 10));
  return Math.min(100, Math.round(duration * 0.4 + quality * 0.35 + habits * 0.25));
}

const STARS = Array.from({ length: 48 }, (_, i) => ({
  id: i,
  x: `${(i * 37 + 11) % 100}%`,
  y: `${(i * 53 + 7) % 100}%`,
  size: 1 + (i % 3),
  delay: (i % 7) * 0.4,
  duration: 2 + (i % 4),
}));

function Starfield() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {STARS.map((s) => (
        <motion.span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{ left: s.x, top: s.y, width: s.size, height: s.size }}
          animate={{ opacity: [0.15, 0.9, 0.15], scale: [1, 1.4, 1] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute -top-24 -left-20 w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'rgba(99,102,241,0.35)' }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-16 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'rgba(139,92,246,0.28)' }}
        animate={{ x: [0, -30, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute bottom-32 left-1/4 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'rgba(59,130,246,0.18)' }}
        animate={{ x: [0, 25, 0], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />
    </div>
  );
}

function SleepRing({ score, hours }) {
  const size = 240;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative z-10 -rotate-90">
        <defs>
          <linearGradient id="sleepRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#sleepRingGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Moon className="w-8 h-8 mb-2" style={{ color: '#FCD34D', filter: 'drop-shadow(0 0 12px rgba(252,211,77,0.6))' }} fill="#FCD34D" />
        </motion.div>
        <motion.span
          key={score}
          className="text-5xl font-black text-white tabular-nums leading-none"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {hours ? score : '—'}
        </motion.span>
        <span className="text-xs font-semibold uppercase tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Sleep Score
        </span>
        <span className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, delay = 0, accent }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      className="flex-1 rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(20px)',
      }}
      whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.2)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="absolute -top-6 -right-6 w-16 h-16 rounded-full blur-2xl opacity-40"
        style={{ background: accent }}
      />
      <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${accent}22` }}>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{sub}</p>}
    </motion.div>
  );
}

function WeekChart({ weekData }) {
  const max = Math.max(TARGET_HOURS, ...weekData.map((d) => d.hours || 0), 1);

  return (
    <motion.div
      {...fadeUp(0.35)}
      className="rounded-3xl p-5"
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm font-bold text-white">This Week</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>7-day sleep rhythm</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(139,92,246,0.2)' }}>
          <TrendingUp className="w-3.5 h-3.5 text-violet-300" />
          <span className="text-xs font-semibold text-violet-200">
            {weekData.filter((d) => d.hours).length}/7 logged
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-28">
        {weekData.map((day, i) => {
          const h = day.hours || 0;
          const pct = h ? (h / max) * 100 : 8;
          const hitTarget = h >= TARGET_HOURS;
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                className="w-full rounded-xl relative overflow-hidden"
                style={{
                  height: `${Math.max(pct, 8)}%`,
                  minHeight: 8,
                  background: h
                    ? hitTarget
                      ? 'linear-gradient(180deg, #A78BFA 0%, #6366F1 100%)'
                      : 'linear-gradient(180deg, rgba(167,139,250,0.7) 0%, rgba(99,102,241,0.5) 100%)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: h ? '0 4px 20px rgba(99,102,241,0.35)' : 'none',
                }}
                initial={{ scaleY: 0, originY: 1 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: day.isToday ? '#C4B5FD' : 'rgba(255,255,255,0.35)' }}
              >
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        className="mt-4 pt-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Target: {TARGET_HOURS}h / night</span>
        <span className="text-xs font-semibold text-violet-300">
          Avg: {(() => {
            const logged = weekData.filter((d) => d.hours);
            if (!logged.length) return '—';
            const avg = logged.reduce((s, d) => s + d.hours, 0) / logged.length;
            return formatHours(avg);
          })()}
        </span>
      </div>
    </motion.div>
  );
}

function LogSleepSheet({ open, onClose, currentHours, onSave, saving }) {
  const [picked, setPicked] = useState(currentHours ?? 7.5);
  const options = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11];

  React.useEffect(() => {
    if (open) setPicked(currentHours ?? 7.5);
  }, [open, currentHours]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute left-0 right-0 bottom-0 rounded-t-[32px] px-6 pt-3 pb-10 max-w-lg mx-auto"
            style={{
              background: 'linear-gradient(180deg, #1E1B4B 0%, #0F0D24 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderBottom: 'none',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.15)' }} />

            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Log last night</h2>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>How many hours did you sleep?</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <motion.div
              key={picked}
              className="text-center py-6 mb-4 rounded-2xl"
              style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}
              initial={{ scale: 0.95, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            >
              <span className="text-5xl font-black text-white">{formatHours(picked)}</span>
              <p className="text-xs mt-2 font-medium uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                {computeScore(picked)} sleep score
              </p>
            </motion.div>

            <div className="grid grid-cols-4 gap-2.5 mb-6">
              {options.map((h) => {
                const active = picked === h;
                return (
                  <motion.button
                    key={h}
                    onClick={() => setPicked(h)}
                    className="h-12 rounded-2xl text-sm font-bold"
                    style={{
                      background: active ? 'linear-gradient(135deg, #A78BFA, #6366F1)' : 'rgba(255,255,255,0.06)',
                      color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                      border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: active ? '0 8px 24px rgba(99,102,241,0.4)' : 'none',
                    }}
                    whileTap={{ scale: 0.92 }}
                    animate={active ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    {h % 1 === 0 ? `${h}h` : `${Math.floor(h)}:30`}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => onSave(picked)}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)',
                boxShadow: '0 12px 32px rgba(99,102,241,0.45)',
              }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
            >
              {saving ? 'Saving…' : 'Save Sleep'}
              {!saving && <ChevronRight className="w-5 h-5" />}
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default function SleepTracker() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const [showLog, setShowLog] = useState(false);
  const [optimisticHours, setOptimisticHours] = useState(null);
  const [saving, setSaving] = useState(false);

  const sleepHours = optimisticHours ?? profile.last_sleep_hours ?? readSleepStore()[TODAY] ?? null;
  const sleepScore = computeScore(sleepHours);
  const sleepDebt = sleepHours != null ? Math.max(0, TARGET_HOURS - sleepHours) : null;
  const timeInBed = sleepHours != null ? sleepHours + 0.75 : null;

  const weekData = useMemo(() => {
    const store = readSleepStore();
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const today = new Date();
    const dayIdx = today.getDay();
    const mondayOffset = dayIdx === 0 ? 6 : dayIdx - 1;
    const profileHours = optimisticHours ?? profile.last_sleep_hours;

    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, mondayOffset - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const hours = store[dateStr] ?? (dateStr === TODAY && profileHours ? profileHours : null);
      return {
        date: dateStr,
        label: labels[i],
        hours,
        isToday: dateStr === TODAY,
      };
    });
  }, [optimisticHours, profile.last_sleep_hours]);

  const saveSleep = async (hours) => {
    setOptimisticHours(hours);
    setSaving(true);

    try {
      const stored = readSleepStore();
      stored[TODAY] = hours;
      localStorage.setItem('scanly_sleep', JSON.stringify(stored));
    } catch (_) {}

    if (profile.id) {
      await base44.entities.UserProfile.update(profile.id, {
        last_sleep_hours: hours,
        last_sleep_date: TODAY,
      });
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }

    setSaving(false);
    setShowLog(false);
  };

  return (
    <div
      className="min-h-screen pb-28 relative overflow-hidden select-none"
      style={{ background: 'linear-gradient(180deg, #0B0D1A 0%, #12132A 40%, #0F0D24 100%)' }}
    >
      <AuroraBackground />
      <Starfield />

      <div className="relative z-10 px-5 pt-14">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="flex items-center justify-between mb-8">
          <div>
            <motion.div
              className="flex items-center gap-2 mb-1"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-violet-300" />
              <span className="text-xs font-semibold uppercase tracking-widest text-violet-300/80">Rest & Recovery</span>
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight">Sleep</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
          </div>

          <motion.button
            onClick={() => setShowLog(true)}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(99,102,241,0.2))',
              border: '1px solid rgba(167,139,250,0.35)',
              boxShadow: '0 8px 24px rgba(99,102,241,0.25)',
            }}
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            animate={{ boxShadow: ['0 8px 24px rgba(99,102,241,0.25)', '0 8px 32px rgba(99,102,241,0.45)', '0 8px 24px rgba(99,102,241,0.25)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <Plus className="w-5 h-5 text-violet-200" strokeWidth={2.5} />
          </motion.button>
        </motion.div>

        {/* Hero ring */}
        <motion.div {...fadeUp(0.1)} className="flex justify-center mb-8">
          <SleepRing score={sleepScore} hours={sleepHours} />
        </motion.div>

        {/* Primary CTA when empty */}
        {!sleepHours && (
          <motion.button
            {...fadeUp(0.15)}
            onClick={() => setShowLog(true)}
            className="w-full py-4 rounded-2xl mb-6 flex items-center justify-center gap-2 font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #A78BFA 0%, #6366F1 100%)',
              boxShadow: '0 12px 40px rgba(99,102,241,0.4)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            <Moon className="w-5 h-5" fill="white" />
            Log Last Night&apos;s Sleep
          </motion.button>
        )}

        {sleepHours && (
          <motion.div {...fadeUp(0.15)} className="text-center mb-6">
            <p className="text-2xl font-black text-white">{formatHours(sleepHours)}</p>
            <button
              onClick={() => setShowLog(true)}
              className="text-xs font-medium mt-1 underline underline-offset-2"
              style={{ color: 'rgba(255,255,255,0.4)' }}
            >
              Edit sleep log
            </button>
          </motion.div>
        )}

        {/* Stats row */}
        <div className="flex gap-3 mb-5">
          <StatCard
            icon={Clock}
            label="Duration"
            value={sleepHours ? formatHours(sleepHours) : '—'}
            sub={sleepHours ? `${Math.round((sleepHours / TARGET_HOURS) * 100)}% of goal` : 'Not logged'}
            delay={0.2}
            accent="#A78BFA"
          />
          <StatCard
            icon={Zap}
            label="Sleep Debt"
            value={sleepDebt === 0 ? 'None' : sleepDebt != null ? formatHours(sleepDebt) : '—'}
            sub={sleepDebt === 0 ? 'Well rested!' : sleepDebt ? 'Catch up tonight' : 'Log to calculate'}
            delay={0.28}
            accent="#818CF8"
          />
        </div>

        <div className="flex gap-3 mb-6">
          <StatCard
            icon={Moon}
            label="Time in Bed"
            value={timeInBed ? formatHours(timeInBed) : '—'}
            sub="Estimated"
            delay={0.32}
            accent="#6366F1"
          />
          <StatCard
            icon={TrendingUp}
            label="Quality"
            value={sleepHours ? scoreLabel(sleepScore) : '—'}
            sub={sleepHours ? `${sleepScore}/100 score` : 'Pending'}
            delay={0.36}
            accent="#C4B5FD"
          />
        </div>

        {/* Week chart */}
        <div className="mb-6">
          <WeekChart weekData={weekData} />
        </div>

        {/* Readiness module */}
        <motion.div {...fadeUp(0.45)} className="mb-8">
          <SleepReadinessModule variant="dark" />
        </motion.div>
      </div>

      <LogSleepSheet
        open={showLog}
        onClose={() => setShowLog(false)}
        currentHours={sleepHours}
        onSave={saveSleep}
        saving={saving}
      />
    </div>
  );
}
