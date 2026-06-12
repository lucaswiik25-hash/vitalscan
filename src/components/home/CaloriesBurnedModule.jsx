import React, { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listExerciseLogs } from '@/lib/db';

function calcBMR(profile) {
  const w = profile.weight || 70, h = profile.height || 170, a = profile.age || 25;
  return profile.sex === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
}

const PINK = '#FF375F';
const TRACK = '#1C0A0E';
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Returns 0-based index for Monday=0 ... Sunday=6
function getMondayIndex(date) {
  const day = date.getDay(); // 0=Sun
  return day === 0 ? 6 : day - 1;
}

export default function CaloriesBurnedModule({ profile = {} }) {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const bmr = useMemo(() => calcBMR(profile), [profile]);

  const { data: allExercises = [] } = useQuery({
    queryKey: ['allExercises'],
    queryFn: () => listExerciseLogs(),
  });

  const { data: todayExercises = [] } = useQuery({
    queryKey: ['exercises', today],
    queryFn: () => listExerciseLogs({ date: today }),
  });

  const todayBurned = todayExercises.reduce((s, e) => s + (e.calories_burned || 0), 0);
  const exerciseTarget = Math.round(bmr * 0.3);
  const pct = exerciseTarget > 0 ? Math.min(100, (todayBurned / exerciseTarget) * 100) : 0;

  // Weekly rings — Mon to Sun of current week
  const weekDays = useMemo(() => {
    const todayDate = new Date();
    const mondayIdx = getMondayIndex(todayDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(todayDate, mondayIdx - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const burned = allExercises
        .filter(e => e.date === dateStr)
        .reduce((s, e) => s + (e.calories_burned || 0), 0);
      const dayPct = exerciseTarget > 0 ? Math.min(100, (burned / exerciseTarget) * 100) : 0;
      return { label: DAY_LABELS[i], pct: dayPct, isToday: dateStr === today, isFuture: d > todayDate };
    });
  }, [allExercises, exerciseTarget, today]);

  // Hourly bar chart from today's exercises (bucketed by hour)
  const hourlyBars = useMemo(() => {
    const buckets = Array(24).fill(0);
    todayExercises.forEach(e => {
      if (e.created_at) {
        const hr = new Date(e.created_at).getHours();
        buckets[hr] += e.calories_burned || 0;
      }
    });
    const max = Math.max(...buckets, 1);
    return buckets.map(v => v / max);
  }, [todayExercises]);

  // Ring math for main ring (280x280, r=100, stroke=45)
  const R = 100, STROKE = 45;
  const CIRC = 2 * Math.PI * R;
  const dash = (pct / 100) * CIRC;

  // Arrow angle: progress tip angle (in degrees from top = -90deg offset)
  const angleDeg = (pct / 100) * 360 - 90;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = 140, cy = 140;
  const arrowX = cx + (R) * Math.cos(angleRad);
  const arrowY = cy + (R) * Math.sin(angleRad);

  return (
    <button
      className="w-full text-left active:opacity-90 transition-opacity"
      style={{ background: '#000', display: 'block' }}
      onClick={() => navigate('/exercise')}
    >
      <div className="px-4 pb-6 pt-4">

        {/* Weekly day rings */}
        <div className="flex justify-between mb-6">
          {weekDays.map((d, i) => {
            const r2 = 16, s2 = 5, c2 = 2 * Math.PI * r2;
            const d2 = (d.pct / 100) * c2;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                {d.isToday ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: PINK }}>
                    <span className="text-black text-xs font-bold">{d.label}</span>
                  </div>
                ) : (
                  <span className="text-xs font-medium tracking-wider" style={{ color: '#8E8E93' }}>{d.label}</span>
                )}
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="20" cy="20" r={r2} fill="none" stroke={TRACK} strokeWidth={s2} strokeLinecap="round" />
                  {d.pct > 0 && (
                    <circle cx="20" cy="20" r={r2} fill="none" stroke={PINK} strokeWidth={s2}
                      strokeDasharray={`${d2} ${c2}`} strokeLinecap="round" />
                  )}
                </svg>
              </div>
            );
          })}
        </div>

        {/* Main activity ring */}
        <div className="relative flex justify-center mb-6">
          <svg width="280" height="280" viewBox="0 0 280 280" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={TRACK} strokeWidth={STROKE} strokeLinecap="round" />
            {pct > 0 && (
              <circle cx={cx} cy={cy} r={R} fill="none" stroke={PINK} strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round" />
            )}
          </svg>

          {/* Arrow cap at progress tip */}
          {pct > 2 && (
            <div
              className="absolute flex items-center justify-center rounded-full shadow-lg"
              style={{
                width: 44, height: 44,
                background: PINK,
                left: `calc(50% + ${arrowX - cx}px - 22px)`,
                top: `calc(50% + ${arrowY - cy}px - 22px)`,
                transform: `rotate(${angleDeg + 90}deg)`,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>

        {/* Stats + goal button */}
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-white text-2xl font-normal mb-1">Movement</p>
            <p className="text-4xl font-semibold tracking-tight" style={{ color: PINK }}>
              {todayBurned}/<span>{exerciseTarget}</span>{' '}
              <span className="text-3xl font-medium">KCAL</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-700"
            style={{ background: 'linear-gradient(135deg, #2C2C2E 0%, #1C1C1E 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" fill="none" stroke={PINK} strokeWidth="2" />
              <path d="M8 12h8M12 8v8" stroke={PINK} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Hourly bar chart */}
        <div>
          <span className="text-sm" style={{ color: '#8E8E93' }}>{Math.round(exerciseTarget / 4)} KCAL</span>
          <div className="relative mt-1">
            {/* Dotted grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none" style={{ zIndex: 0 }}>
              {[0.3, 0.65, 1].map((_, i) => (
                <div key={i} className="w-full" style={{
                  height: 1,
                  backgroundImage: `linear-gradient(to right, ${PINK} 50%, transparent 50%)`,
                  backgroundSize: '4px 1px',
                  backgroundRepeat: 'repeat-x',
                  opacity: i === 2 ? 1 : 0.3,
                }} />
              ))}
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between relative" style={{ height: 80, zIndex: 1 }}>
              {hourlyBars.map((h, i) => (
                <div key={i} className="flex-1 mx-px flex items-end" style={{ height: '100%' }}>
                  {h > 0 ? (
                    <div style={{
                      width: '100%', maxWidth: 4,
                      height: `${Math.max(4, h * 100)}%`,
                      background: PINK,
                      borderRadius: '1px 1px 0 0',
                      margin: '0 auto',
                    }} />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* X-axis */}
          <div className="flex justify-between mt-2 text-sm" style={{ color: '#8E8E93' }}>
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </div>

        {/* Total */}
        <p className="text-lg font-medium tracking-wide mt-4" style={{ color: PINK }}>
          TOTAL {todayBurned} KCAL
        </p>
      </div>
    </button>
  );
}