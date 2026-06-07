import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { X, Trophy, TrendingDown, Droplets, Moon } from 'lucide-react';

const REPORT_KEY = 'weekly_report_shown';

export default function WeeklyReportModal({ profile, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      const today = new Date();
      const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const days = Array.from({ length: 7 }, (_, i) => format(subDays(today, i), 'yyyy-MM-dd'));

      const [meals, waterLogs, sleepLogs] = await Promise.all([
        base44.entities.Meal.filter({ logged: true }),
        base44.entities.WaterLog.list(),
        base44.entities.SleepLog.list(),
      ]);

      const weekMeals = meals.filter(m => m.date >= weekStart && m.date <= weekEnd);
      const dayStats = days.map(date => {
        const dayMeals = weekMeals.filter(m => m.date === date);
        return {
          date,
          calories: dayMeals.reduce((s, m) => s + (m.calories || 0), 0),
          protein: dayMeals.reduce((s, m) => s + (m.protein || 0), 0),
        };
      }).reverse();

      const best = dayStats.reduce((a, b) => (b.protein > a.protein ? b : a), dayStats[0]);
      const worst = dayStats.reduce((a, b) => (b.calories > a.calories ? b : a), dayStats[0]);
      const avgCalories = Math.round(dayStats.reduce((s, d) => s + d.calories, 0) / 7);
      const waterDays = days.filter(d => waterLogs.some(w => w.date === d && (w.amount_ml || 0) >= (profile.water_target_ml || 2000) * 0.8)).length;
      const sleepEntries = sleepLogs.filter(s => s.date >= weekStart);
      const avgSleep = sleepEntries.length
        ? (sleepEntries.reduce((s, e) => s + (e.duration_hours || e.hours || 0), 0) / sleepEntries.length).toFixed(1)
        : '—';

      setReport({
        bestDay: format(new Date(best.date), 'EEEE'),
        bestProtein: Math.round(best.protein),
        worstDay: format(new Date(worst.date), 'EEEE'),
        worstCalories: Math.round(worst.calories),
        avgCalories,
        waterHitRate: Math.round((waterDays / 7) * 100),
        avgSleep,
      });
      setLoading(false);
    };
    generate();
  }, [profile]);

  if (loading) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-5">
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-[24px] p-6 w-full max-w-sm"
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Your Week in Review</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50">
            <Trophy className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-green-700 font-semibold">Best day</p>
              <p className="text-sm font-bold text-gray-900">{report.bestDay} · {report.bestProtein}g protein</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-50">
            <TrendingDown className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-xs text-orange-700 font-semibold">Highest calorie day</p>
              <p className="text-sm font-bold text-gray-900">{report.worstDay} · {report.worstCalories} kcal</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-2xl bg-gray-50 text-center">
              <p className="text-lg font-bold text-gray-900">{report.avgCalories}</p>
              <p className="text-[10px] text-gray-500">avg kcal/day</p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 text-center">
              <Droplets className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{report.waterHitRate}%</p>
              <p className="text-[10px] text-gray-500">hydration</p>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 text-center">
              <Moon className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-bold text-gray-900">{report.avgSleep}h</p>
              <p className="text-[10px] text-gray-500">avg sleep</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function useWeeklyReportGate() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const isSunday = new Date().getDay() === 0;
    const weekKey = format(new Date(), 'yyyy-ww');
    const shown = localStorage.getItem(REPORT_KEY);
    if (isSunday && shown !== weekKey) {
      setShow(true);
      localStorage.setItem(REPORT_KEY, weekKey);
    }
  }, []);
  return { showWeeklyReport: show, dismissWeeklyReport: () => setShow(false) };
}
