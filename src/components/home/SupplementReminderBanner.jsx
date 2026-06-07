import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Pill, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIME_WINDOWS = {
  morning: { start: 5, end: 11, label: 'morning' },
  afternoon: { start: 11, end: 17, label: 'afternoon' },
  evening: { start: 17, end: 22, label: 'evening' },
  with_food: { start: 7, end: 21, label: 'with meals' },
};

export default function SupplementReminderBanner({ dismissed, onDismiss }) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: supplements = [] } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => base44.entities.Supplement.list(),
  });

  if (dismissed) return null;

  const due = supplements.filter((s) => {
    const window = TIME_WINDOWS[s.time_of_day] || TIME_WINDOWS.morning;
    const inWindow = hour >= window.start && hour < window.end;
    const timesPerDay = s.times_per_day || 1;
    const dosesTaken = s.doses_taken_today || 0;
    return inWindow && dosesTaken < timesPerDay;
  });

  if (due.length === 0) return null;

  const names = due.slice(0, 3).map(s => s.name).join(', ');
  const windowLabel = TIME_WINDOWS[due[0].time_of_day]?.label || 'now';

  return (
    <div className="mx-5 mb-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
      <Pill className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">Supplement reminder</p>
        <p className="text-xs text-amber-800 mt-0.5">
          Time for your {windowLabel} supplements: {names}{due.length > 3 ? ` +${due.length - 3} more` : ''}
        </p>
        <button onClick={() => navigate('/supplements')} className="text-xs font-semibold text-amber-900 underline mt-1">
          Mark as taken →
        </button>
      </div>
      <button onClick={onDismiss} className="shrink-0">
        <X className="w-4 h-4 text-amber-600" />
      </button>
    </div>
  );
}
