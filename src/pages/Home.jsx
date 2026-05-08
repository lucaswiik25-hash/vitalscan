import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Header from '../components/home/Header';
import WeekCalendar from '../components/home/WeekCalendar';
import NutriCarousel from '../components/home/NutriCarousel';
import DailyModules from '../components/home/DailyModules';

export default function Home() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });

  const profile = profiles[0] || {};

  useEffect(() => {
    if (!isLoadingProfiles && profiles.length > 0 && !profile.onboarding_complete) {
      navigate('/onboarding');
    }
    if (!isLoadingProfiles && profiles.length === 0) {
      navigate('/onboarding');
    }
  }, [isLoadingProfiles, profiles.length, profile.onboarding_complete]);

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
    <div className="warm-glow min-h-screen pb-24">
      <Header streak={profile.streak || 0} />
      <WeekCalendar meals={allMeals} profile={profile} waterLogs={allWaterLogs} />
      <div className="mt-2">
        <NutriCarousel profile={profile} consumed={consumed} />
      </div>
      <DailyModules todayMeals={todayMeals} profile={profile} />
    </div>
  );
}