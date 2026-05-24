import React, { useEffect, useState, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, subDays, differenceInCalendarDays } from 'date-fns';
import { motion } from 'framer-motion';
import Header from '../components/home/Header';
import WeekCalendar from '../components/home/WeekCalendar';
import NutriCarousel from '../components/home/NutriCarousel';
import MealSlotsModule from '../components/home/MealSlotsModule';
import DayVerdictPage from '../components/home/DayVerdictPage';
import AllergyBanner from '../components/home/AllergyBanner';
import { useUserProfile } from '../hooks/useUserProfile';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut', delay },
});

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [selectedDay, setSelectedDay] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const containerRef = useRef(null);

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

  const { profile, profiles, isLoading: isLoadingProfiles } = useUserProfile();

  useEffect(() => {
    if (!isLoadingProfiles && profiles.length > 0 && !profile.onboarding_complete) {
      navigate('/onboarding');
    }
    if (!isLoadingProfiles && profiles.length === 0) {
      navigate('/onboarding');
    }
  }, [isLoadingProfiles, profiles.length, profile.onboarding_complete]);

  // Trigger auto passive burn on load
  useEffect(() => {
    base44.functions.invoke('autoBurnCalories', {}).catch(() => {});
  }, []);

  // Calculate and update streak
  useEffect(() => {
    if (!profile.id || isLoadingProfiles) return;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const lastActive = profile.last_active_date;
    if (lastActive === todayStr) return; // already updated today
    const daysSince = lastActive ? differenceInCalendarDays(new Date(todayStr), new Date(lastActive)) : null;
    const newStreak = daysSince === 1 ? (profile.streak || 0) + 1 : 1;
    base44.entities.UserProfile.update(profile.id, { streak: newStreak, last_active_date: todayStr });
    queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  }, [profile.id, isLoadingProfiles]);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ['meals', today],
    queryFn: () => base44.entities.Meal.filter({ date: today, logged: true }),
  });

  const { data: allMeals = [] } = useQuery({
    queryKey: ['allMeals'],
    queryFn: () => base44.entities.Meal.filter({ logged: true }),
  });

  const { data: allWaterLogs = [] } = useQuery({
    queryKey: ['allWaterLogs'],
    queryFn: () => base44.entities.WaterLog.list(),
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
    <div className="min-h-screen pb-24" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {/* Pull-to-refresh indicator */}
      {(pullY > 0 || refreshing) && (
        <div className="flex justify-center items-center transition-all" style={{ height: refreshing ? 40 : pullY }}>
          <div className={`w-6 h-6 border-2 border-gray-300 border-t-gray-800 rounded-full ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 4}deg)` }} />
        </div>
      )}
      <motion.div {...fadeUp(0)}><Header streak={profile.streak || 0} /></motion.div>
      {profile.diet_mode === 'allergy_mode' && (
        <motion.div className="mt-3" {...fadeUp(0.1)}>
          <AllergyBanner allergens={profile.allergens || []} />
        </motion.div>
      )}
      <motion.div className="mt-3 mb-2" {...fadeUp(0.15)}>
        <WeekCalendar meals={allMeals} profile={profile} waterLogs={allWaterLogs} onDayClick={setSelectedDay} />
      </motion.div>
      <motion.div className="px-5 mt-3 mb-1" {...fadeUp(0.2)}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Macros</p>
      </motion.div>
      <motion.div className="mt-1 mb-4" {...fadeUp(0.28)}>
        <NutriCarousel profile={profile} consumed={consumed} waterLogs={allWaterLogs} todayMeals={todayMeals} />
      </motion.div>
      <motion.div className="px-5 mb-2" {...fadeUp(0.36)}>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Meals</p>
      </motion.div>
      <motion.div {...fadeUp(0.44)}><MealSlotsModule todayMeals={todayMeals} profile={profile} /></motion.div>
      {selectedDay && (
        <DayVerdictPage
          date={selectedDay}
          meals={allMeals.filter(m => m.date === selectedDay)}
          waterLogs={allWaterLogs.filter(w => w.date === selectedDay)}
          profile={profile}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}