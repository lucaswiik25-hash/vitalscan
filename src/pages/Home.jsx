import React, { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, differenceInCalendarDays } from 'date-fns';
import { animCard, usePageVisible, pageRevealStyle } from '@/lib/animHelpers';
import { listFoodLogs, listHydrationLogs } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';
import Header from '../components/home/Header';
import WeekCalendar from '../components/home/WeekCalendar';
import NutriCarousel from '../components/home/NutriCarousel';
import WellnessModules from '../components/home/WellnessModules';
import MealSlotsModule from '../components/home/MealSlotsModule';
import DayVerdictPage from '../components/home/DayVerdictPage';
import AllergyBanner from '../components/home/AllergyBanner';
import SupplementReminderBanner from '../components/home/SupplementReminderBanner';
import WeeklyReportModal, { useWeeklyReportGate } from '../components/home/WeeklyReportModal';

export default function Home() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const touchStartY = useRef(0);
  const pageVisible = usePageVisible();
  const { showWeeklyReport, dismissWeeklyReport } = useWeeklyReportGate();

  const { profile, loading: profileLoading, updateProfile } = useUserProfile();

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (window.scrollY > 0) return;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (dy > 0) setPullY(Math.min(dy * 0.4, 60));
  };
  const handleTouchEnd = async () => {
    if (pullY > 45) {
      setRefreshing(true);
      await queryClient.invalidateQueries();
      setTimeout(() => setRefreshing(false), 600);
    }
    setPullY(0);
  };

  useEffect(() => {
    if (!profile?.id || profileLoading) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastActive = profile.last_active_date;
    if (lastActive === todayStr) return;

    const daysSince = lastActive
      ? differenceInCalendarDays(new Date(todayStr), new Date(lastActive))
      : null;
    const newStreak = daysSince === 1 ? (profile.streak || 0) + 1 : 1;

    updateProfile({ streak: newStreak, last_active_date: todayStr }).catch(() => {});
  }, [profile?.id, profileLoading, profile.last_active_date, profile.streak, updateProfile]);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => listFoodLogs({ date: today, logged: true }),
  });

  const { data: allMeals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => listFoodLogs({ logged: true }),
  });

  const { data: allWaterLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => listHydrationLogs(),
  });

  const consumed = todayMeals.reduce((acc, meal) => ({
    calories: (acc.calories || 0) + (meal.calories || 0),
    protein: (acc.protein || 0) + (meal.protein || 0),
    carbs: (acc.carbs || 0) + (meal.carbs || 0),
    fat: (acc.fat || 0) + (meal.fat || 0),
    fiber: (acc.fiber || 0) + (meal.fiber || 0),
    sugar: (acc.sugar || 0) + (meal.sugar || 0),
    sodium: (acc.sodium || 0) + (meal.sodium || 0),
  }), {});

  return (
    <div
      className="min-h-screen pb-24"
      style={pageRevealStyle(pageVisible)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullY > 0 || refreshing) && (
        <div className="flex justify-center items-center transition-all" style={{ height: refreshing ? 40 : pullY }}>
          <div
            className={`w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full ${refreshing ? 'animate-spin' : ''}`}
            style={{ transform: `rotate(${pullY * 4}deg)` }}
          />
        </div>
      )}
      <div {...animCard(0, pageVisible)}><Header streak={profile.streak || 0} /></div>
      <SupplementReminderBanner dismissed={reminderDismissed} onDismiss={() => setReminderDismissed(true)} />
      {profile.diet_mode === 'allergy_mode' && (
        <div className="mt-3" {...animCard(1, pageVisible)}>
          <AllergyBanner allergens={profile.allergens || []} />
        </div>
      )}
      <div className="mt-3 mb-2" {...animCard(2, pageVisible)}>
        <WeekCalendar meals={allMeals} profile={profile} waterLogs={allWaterLogs} onDayClick={setSelectedDay} />
      </div>
      <div className="mt-3 mb-4" {...animCard(3, pageVisible)}>
        <WellnessModules waterLogs={allWaterLogs} allMeals={allMeals} profile={profile} />
      </div>
      <div className="px-5 mb-2" {...animCard(5, pageVisible)}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Meals</p>
      </div>
      <div {...animCard(6, pageVisible)}><MealSlotsModule todayMeals={todayMeals} profile={profile} /></div>
      {selectedDay && (
        <DayVerdictPage
          date={selectedDay}
          meals={allMeals.filter(m => m.date === selectedDay)}
          waterLogs={allWaterLogs.filter(w => w.date === selectedDay)}
          profile={profile}
          onClose={() => setSelectedDay(null)}
        />
      )}
      {showWeeklyReport && (
        <WeeklyReportModal profile={profile} onClose={dismissWeeklyReport} />
      )}
    </div>
  );
}