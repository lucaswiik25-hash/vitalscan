import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Pill, UtensilsCrossed, Moon, Check, Plus, Minus } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');

export default function DailyModules({ todayMeals = [], profile = {} }) {
  const queryClient = useQueryClient();
  const [sleepHours, setSleepHours] = useState(null);
  const [savingSleep, setSavingSleep] = useState(false);

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list(),
  });

  const takenCount = supplements.filter(s => s.taken_today).length;
  const totalSupps = supplements.length;
  const suppPct = totalSupps > 0 ? Math.round((takenCount / totalSupps) * 100) : 0;

  // Sleep from profile or local state
  const currentSleep = profile.last_sleep_hours ?? sleepHours;

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
        {/* Supplements taken */}
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-purple-50 flex items-center justify-center">
              <Pill className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <span className="text-xs font-semibold text-foreground">Supplements</span>
          </div>
          {totalSupps === 0 ? (
            <p className="text-xs text-muted-foreground">No supplements added</p>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-foreground">{takenCount}<span className="text-sm font-medium text-muted-foreground">/{totalSupps}</span></p>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${suppPct}%`, background: suppPct === 100 ? '#6CC5A0' : '#a78bfa' }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{suppPct === 100 ? 'All done!' : `${suppPct}% taken`}</p>
            </>
          )}
        </div>

        {/* Meals logged */}
        <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-xl bg-orange-50 flex items-center justify-center">
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-foreground">Meals</span>
          </div>
          <p className="text-2xl font-extrabold text-foreground">{todayMeals.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {todayMeals.length === 0 ? 'No meals logged' : `${todayMeals.reduce((s, m) => s + (m.calories || 0), 0)} kcal total`}
          </p>
          <div className="flex gap-0.5 mt-2">
            {Array.from({ length: Math.max(3, todayMeals.length) }).map((_, i) => (
              <div key={i} className="flex-1 h-1.5 rounded-full"
                style={{ background: i < todayMeals.length ? '#fb923c' : 'hsl(var(--muted))' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Sleep tracker */}
      <div className="bg-white border border-border rounded-[20px] p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center">
            <Moon className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-xs font-semibold text-foreground">Last Night's Sleep</span>
          {currentSleep && (
            <span className="ml-auto text-sm font-bold text-foreground">{currentSleep}h</span>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
            <button
              key={h}
              onClick={() => saveSleep(h)}
              className="w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: currentSleep === h ? '#3b82f6' : 'hsl(var(--secondary))',
                color: currentSleep === h ? 'white' : 'hsl(var(--foreground))',
              }}
            >
              {h}
            </button>
          ))}
        </div>
        {currentSleep && (
          <p className="text-xs text-muted-foreground mt-2">
            {currentSleep < 6 ? 'Not enough sleep — aim for 7–9h' : currentSleep <= 9 ? 'Great sleep!' : 'Slightly long — 7–9h is ideal'}
          </p>
        )}
      </div>
    </div>
  );
}