import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Progress() {
  const { data: meals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  // Build last 7 days data
  const chartData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayMeals = meals.filter(m => m.date === dateStr);
    const totalCal = dayMeals.reduce((s, m) => s + (m.calories || 0), 0);
    return {
      day: format(date, 'EEE'),
      calories: totalCal,
    };
  });

  const totalMeals = meals.length;
  const avgCalories = totalMeals > 0 ? Math.round(meals.reduce((s, m) => s + (m.calories || 0), 0) / Math.max(1, new Set(meals.map(m => m.date)).size)) : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-foreground">Progress</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Stats row */}
        <div className="flex gap-3">
          <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">{totalMeals}</p>
            <p className="text-xs text-muted-foreground mt-1">Meals logged</p>
          </div>
          <div className="flex-1 bg-white border border-border rounded-[20px] p-4 shadow-sm text-center">
            <p className="text-3xl font-extrabold text-foreground">{avgCalories}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg daily cal</p>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="bg-white border border-border rounded-[20px] p-5 shadow-sm">
          <h3 className="text-base font-bold text-foreground mb-4">7-Day Calories</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Bar dataKey="calories" fill="hsl(var(--foreground))" radius={[8, 8, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Empty state */}
        {totalMeals === 0 && (
          <div className="bg-muted/50 border border-border rounded-[20px] p-8 text-center">
            <span className="text-4xl mb-3 block">📊</span>
            <p className="text-sm text-muted-foreground">Start logging meals to see your progress here</p>
          </div>
        )}
      </div>
    </div>
  );
}