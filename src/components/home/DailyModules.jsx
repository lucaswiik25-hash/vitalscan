import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Pill, UtensilsCrossed, Moon, ChevronRight } from 'lucide-react';
import { glassModuleStyle as glassStyle } from '@/lib/cardStyles';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function DailyModules({ todayMeals = [], profile = {} }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [sleepHours, setSleepHours] = useState(null);
  const [savingSleep, setSavingSleep] = useState(false);

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list(),
  });

  const takenCount = supplements.filter(s => s.taken_today).length;
  const totalSupps = supplements.length;
  const suppPct = totalSupps > 0 ? Math.round((takenCount / totalSupps) * 100) : 0;

  // Also read from localStorage (SleepTracker page saves there)
  const localSleepHours = (() => {
    try {
      const stored = JSON.parse(localStorage.getItem('scanly_sleep') || '{}');
      return stored[TODAY] ?? null;
    } catch { return null; }
  })();
  const currentSleep = profile.last_sleep_hours ?? sleepHours ?? localSleepHours;

  const saveSleep = async (h) => {
    setSleepHours(h);
    if (!profile.id) return;
    setSavingSleep(true);
    await base44.entities.UserProfile.update(profile.id, { last_sleep_hours: h, last_sleep_date: TODAY });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    setSavingSleep(false);
  };

  return (
    <div className="px-5 mt-4 space-y-3">
      {/* Row: supplements + meals */}
      <div className="flex gap-3">
        {/* Supplements */}
        <div className="flex-1 rounded-[20px] p-4 glow-card" style={glassStyle}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(167,139,250,0.2)' }}>
              <Pill className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-foreground">Supplements</span>
          </div>
          {totalSupps === 0 ? (
            <p className="text-xs text-foreground/50">No supplements added</p>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-foreground">{takenCount}<span className="text-sm font-medium text-foreground/40">/{totalSupps}</span></p>
              <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${suppPct}%`, background: suppPct === 100 ? '#6CC5A0' : '#a78bfa' }} />
              </div>
              <p className="text-xs text-foreground/50 mt-1">{suppPct === 100 ? 'All done!' : `${suppPct}% taken`}</p>
            </>
          )}
        </div>

        {/* Meals */}
        <div className="flex-1 rounded-[20px] p-4 glow-card" style={glassStyle}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,146,60,0.2)' }}>
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-foreground">Meals</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{todayMeals.length}</p>
          <p className="text-xs text-foreground/50 mt-1">
            {todayMeals.length === 0 ? 'No meals logged' : `${todayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal`}
          </p>
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: Math.max(3, todayMeals.length) }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i < todayMeals.length ? '#fb923c' : 'rgba(0,0,0,0.08)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Sleep — tap to open sleep tracker */}
      <button onClick={() => navigate('/sleep')} className="w-full rounded-[20px] p-4 text-left glow-card" style={glassStyle}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
            <Moon className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-foreground">Last Night's Sleep</span>
          <ChevronRight className="w-4 h-4 text-foreground/30 ml-auto" />
        </div>
        {currentSleep ? (
          <p className="text-2xl font-extrabold text-foreground mt-2">{currentSleep}<span className="text-sm font-medium text-foreground/40">h</span></p>
        ) : (
          <p className="text-xs text-foreground/50 mt-2">Tap to log your sleep →</p>
        )}
      </button>
    </div>
  );
}