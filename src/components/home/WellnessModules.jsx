import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Droplets, Moon, TrendingUp, Plus } from 'lucide-react';
import { listHydrationLogs, listSleepLogs } from '@/lib/db';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return format(d, 'yyyy-MM-dd');
  });
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ── Water Intake Module ──────────────────────────────────────────────────────
function WaterModule({ waterLogs, waterTarget }) {
  const navigate = useNavigate();
  const days = getLast7Days();
  const target = waterTarget || 2000;

  const dailyTotals = days.map(d =>
    waterLogs.filter(l => l.date === d).reduce((s, l) => s + (l.amount_ml || 0), 0)
  );

  const todayTotal = dailyTotals[6];
  const pct = Math.min(Math.round((todayTotal / target) * 100), 100);
  const maxVal = Math.max(...dailyTotals, target * 0.5);

  return (
    <div
      className="glass-card rounded-2xl p-4 module-card"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate('/water')}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-blue-400" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-800">Water Intake</span>
        </div>
        <span className="text-sm font-bold text-blue-500">{pct}%</span>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-14 mb-1">
        {dailyTotals.map((val, i) => {
          const isToday = i === 6;
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(heightPct, 8)}%`,
                  background: isToday
                    ? 'rgba(59, 130, 246, 0.75)'
                    : 'rgba(147, 197, 253, 0.45)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-gray-400 font-medium">{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Sleep Module ─────────────────────────────────────────────────────────────
function SleepModule({ sleepLogs }) {
  const navigate = useNavigate();
  const todayLog = sleepLogs.find(l => l.date === TODAY);
  const hours = todayLog ? Math.floor((todayLog.duration_minutes || 0) / 60) : null;
  const mins = todayLog ? (todayLog.duration_minutes || 0) % 60 : null;

  return (
    <div
      className="glass-card rounded-2xl p-4 module-card"
      style={{ cursor: 'pointer', background: 'rgba(237, 233, 254, 0.55)' }}
      onClick={() => navigate('/sleep')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-purple-400" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-800">Last Night</span>
        </div>
        <span className="text-xs font-semibold text-purple-500">Details →</span>
      </div>

      {todayLog ? (
        <>
          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-gray-900">{hours}h</span>
            <span className="text-3xl font-bold text-gray-900">{mins}m</span>
            {/* Sleep stage dots */}
            <div className="flex items-center gap-1 ml-3">
              {[
                { color: '#1e1b4b', w: 18 },
                { color: '#818cf8', w: 26 },
                { color: '#c4b5fd', w: 20 },
              ].map((s, i) => (
                <div key={i} className="h-1.5 rounded-full" style={{ width: s.w, background: s.color }} />
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-1">Total Sleep</div>
          <div className="flex gap-3">
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#1e1b4b' }} />
              Deep 35%
            </span>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#818cf8' }} />
              Light 45%
            </span>
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#c4b5fd' }} />
              REM 20%
            </span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-400">-- h -- m</div>
            <div className="text-xs text-gray-400 mt-1">No sleep logged yet</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); navigate('/sleep'); }}
            className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center"
          >
            <Plus className="w-4 h-4 text-purple-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Wellness Score Module ────────────────────────────────────────────────────
function WellnessModule({ waterLogs, sleepLogs, meals }) {
  const navigate = useNavigate();
  const days = getLast7Days();

  const scores = useMemo(() => {
    return days.map(d => {
      const water = waterLogs.filter(l => l.date === d).reduce((s, l) => s + (l.amount_ml || 0), 0);
      const sleep = sleepLogs.find(l => l.date === d);
      const food = meals.filter(m => m.date === d);
      let score = 0;
      if (water >= 1500) score += 33;
      else if (water > 0) score += Math.round((water / 1500) * 33);
      if (sleep) {
        const h = (sleep.duration_minutes || 0) / 60;
        if (h >= 7) score += 34;
        else if (h > 0) score += Math.round((h / 7) * 34);
      }
      if (food.length >= 3) score += 33;
      else if (food.length > 0) score += Math.round((food.length / 3) * 33);
      return Math.min(score, 100);
    });
  }, [days, waterLogs, sleepLogs, meals]);

  const todayScore = scores[6];
  const maxVal = Math.max(...scores, 1);

  return (
    <div
      className="glass-card rounded-2xl p-4 module-card"
      style={{ cursor: 'pointer', background: 'rgba(220, 252, 231, 0.45)' }}
      onClick={() => navigate('/health-risk')}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-green-500" strokeWidth={2} />
          <span className="text-sm font-semibold text-gray-800">Wellness Score</span>
        </div>
        <span className="text-sm font-bold text-green-600">{todayScore}</span>
      </div>

      <div className="flex items-end gap-1.5 h-14 mb-1">
        {scores.map((val, i) => {
          const isToday = i === 6;
          const heightPct = maxVal > 0 ? (val / maxVal) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(heightPct, 8)}%`,
                  background: isToday
                    ? 'rgba(34, 197, 94, 0.75)'
                    : 'rgba(134, 239, 172, 0.45)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5">
        {DAY_LABELS.map((l, i) => (
          <div key={i} className="flex-1 text-center text-[10px] text-gray-400 font-medium">{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────────────
export default function WellnessModules({ waterLogs, allMeals, profile }) {
  const { data: sleepLogs = [] } = useQuery({
    queryKey: ['sleepLogs'],
    queryFn: async () => {
      try { return await listSleepLogs(); } catch { return []; }
    },
  });

  return (
    <div className="px-5 flex flex-col gap-3">
      <WaterModule waterLogs={waterLogs} waterTarget={profile?.water_target_ml} />
      <SleepModule sleepLogs={sleepLogs} />
      <WellnessModule waterLogs={waterLogs} sleepLogs={sleepLogs} meals={allMeals} />
    </div>
  );
}